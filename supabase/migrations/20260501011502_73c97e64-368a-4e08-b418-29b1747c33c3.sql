-- =========================================================
-- 1) Extend products table
-- =========================================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_top_selling boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_new_arrival boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_customer_choice boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_daily_deal boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sales_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_avg numeric(3,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS description_long text,
  ADD COLUMN IF NOT EXISTS gallery_urls text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS variants jsonb DEFAULT '[]'::jsonb;

-- =========================================================
-- 2) product_reviews table
-- =========================================================
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  photos text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product reviews"
  ON public.product_reviews FOR SELECT USING (true);

CREATE POLICY "Logged-in users can create reviews"
  ON public.product_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.product_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.product_reviews FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all product reviews"
  ON public.product_reviews FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_product_reviews_updated_at
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 3) Maintain rating_avg / rating_count on products
-- =========================================================
CREATE OR REPLACE FUNCTION public.refresh_product_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  pid uuid;
BEGIN
  pid := COALESCE(NEW.product_id, OLD.product_id);
  UPDATE public.products
  SET rating_avg = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM public.product_reviews WHERE product_id = pid), 0),
      rating_count = COALESCE((SELECT COUNT(*) FROM public.product_reviews WHERE product_id = pid), 0)
  WHERE id = pid;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_refresh_product_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.refresh_product_rating();

-- =========================================================
-- 4) Promo code usage tracking
-- =========================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS promo_code_used text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_promo_usage_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.promo_code_used IS NOT NULL AND NEW.promo_code_used <> '' THEN
    UPDATE public.promo_codes
    SET used_count = used_count + 1
    WHERE code = NEW.promo_code_used;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_promo_usage
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.increment_promo_usage_on_order();

-- =========================================================
-- 5) Auto-increment sales_count when order delivered
-- =========================================================
CREATE OR REPLACE FUNCTION public.increment_product_sales_on_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered') THEN
    UPDATE public.products p
    SET sales_count = p.sales_count + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_product_sales
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.increment_product_sales_on_delivery();

-- =========================================================
-- 6) RPC: validate promo code at checkout
-- =========================================================
CREATE OR REPLACE FUNCTION public.validate_promo_code(
  _code text,
  _product_ids uuid[],
  _subtotal numeric
)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  pc RECORD;
  applies boolean := false;
  discount numeric := 0;
BEGIN
  SELECT * INTO pc
  FROM public.promo_codes
  WHERE code = _code
    AND status = 'approved'
    AND is_active = true
    AND starts_at <= now()
    AND expires_at > now()
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Invalid or expired promo code');
  END IF;

  IF pc.max_uses IS NOT NULL AND pc.used_count >= pc.max_uses THEN
    RETURN json_build_object('valid', false, 'error', 'Promo code usage limit reached');
  END IF;

  -- Scope check
  IF pc.scope = 'product' AND pc.product_id IS NOT NULL THEN
    applies := pc.product_id = ANY(_product_ids);
    IF NOT applies THEN
      RETURN json_build_object('valid', false, 'error', 'This code is not valid for items in your cart');
    END IF;
  ELSIF pc.scope = 'store' AND pc.merchant_id IS NOT NULL THEN
    applies := EXISTS (
      SELECT 1 FROM public.products
      WHERE id = ANY(_product_ids) AND merchant_id = pc.merchant_id
    );
    IF NOT applies THEN
      RETURN json_build_object('valid', false, 'error', 'This code is not valid for items in your cart');
    END IF;
  ELSE
    applies := true;
  END IF;

  discount := ROUND(_subtotal * COALESCE(pc.discount_percent, 0) / 100, 2);

  RETURN json_build_object(
    'valid', true,
    'code', pc.code,
    'discount_percent', pc.discount_percent,
    'discount_amount', discount,
    'free_shipping_threshold', pc.free_shipping_threshold,
    'scope', pc.scope,
    'product_id', pc.product_id,
    'merchant_id', pc.merchant_id
  );
END;
$$;

-- =========================================================
-- 7) RPC: admin Manage Promo Codes overview
-- =========================================================
CREATE OR REPLACE FUNCTION public.admin_promo_codes_overview()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN json_build_object('error', 'forbidden');
  END IF;

  SELECT json_build_object(
    'pending', COALESCE((
      SELECT json_agg(json_build_object(
        'id', pc.id, 'code', pc.code,
        'discount_percent', pc.discount_percent,
        'scope', pc.scope, 'product_id', pc.product_id,
        'merchant_id', pc.merchant_id,
        'store_name', pr.store_name,
        'product_name', prod.name,
        'starts_at', pc.starts_at, 'expires_at', pc.expires_at,
        'max_uses', pc.max_uses, 'used_count', pc.used_count,
        'created_at', pc.created_at
      ) ORDER BY pc.created_at DESC)
      FROM public.promo_codes pc
      LEFT JOIN public.profiles pr ON pr.user_id = pc.merchant_id
      LEFT JOIN public.products prod ON prod.id = pc.product_id
      WHERE pc.status = 'pending'
    ), '[]'::json),
    'active_by_store', COALESCE((
      SELECT json_agg(store_data) FROM (
        SELECT json_build_object(
          'merchant_id', merchant_id,
          'store_name', COALESCE(store_name, 'Platform / Admin'),
          'count', cnt,
          'codes', codes
        ) AS store_data
        FROM (
          SELECT
            pc.merchant_id,
            pr.store_name,
            COUNT(*) AS cnt,
            json_agg(json_build_object(
              'id', pc.id, 'code', pc.code,
              'discount_percent', pc.discount_percent,
              'scope', pc.scope, 'product_id', pc.product_id,
              'product_name', prod.name,
              'expires_at', pc.expires_at,
              'max_uses', pc.max_uses, 'used_count', pc.used_count,
              'is_active', pc.is_active
            ) ORDER BY pc.created_at DESC) AS codes
          FROM public.promo_codes pc
          LEFT JOIN public.profiles pr ON pr.user_id = pc.merchant_id
          LEFT JOIN public.products prod ON prod.id = pc.product_id
          WHERE pc.status = 'approved'
            AND pc.is_active = true
            AND pc.expires_at > now()
          GROUP BY pc.merchant_id, pr.store_name
          ORDER BY cnt DESC
        ) grouped
      ) wrapped
    ), '[]'::json)
  ) INTO result;

  RETURN result;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_products_flags ON public.products(is_top_selling, is_new_arrival, is_customer_choice, is_daily_deal) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_sales_count ON public.products(sales_count DESC) WHERE is_active = true;