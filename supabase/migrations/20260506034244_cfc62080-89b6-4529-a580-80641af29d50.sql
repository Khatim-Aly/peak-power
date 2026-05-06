
-- 1. Extend profiles with branding
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS theme_color text DEFAULT '#D4A574',
  ADD COLUMN IF NOT EXISTS return_policy text,
  ADD COLUMN IF NOT EXISTS shipping_policy text,
  ADD COLUMN IF NOT EXISTS social_instagram text,
  ADD COLUMN IF NOT EXISTS social_facebook text,
  ADD COLUMN IF NOT EXISTS social_tiktok text,
  ADD COLUMN IF NOT EXISTS social_whatsapp text;

-- 2. Allow public to read merchant branding (limited fields via view-like policy)
DROP POLICY IF EXISTS "Anyone can view merchant public branding" ON public.profiles;
CREATE POLICY "Anyone can view merchant public branding"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = profiles.user_id AND ur.role = 'merchant'
  )
);

-- 3. Featured pinning on products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_featured_on_store boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinned_order integer;

-- 4. store_follows table
CREATE TABLE IF NOT EXISTS public.store_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  merchant_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, merchant_id)
);

ALTER TABLE public.store_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows"
ON public.store_follows FOR SELECT USING (true);

CREATE POLICY "Users manage their own follows"
ON public.store_follows FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_store_follows_merchant ON public.store_follows(merchant_id);
CREATE INDEX IF NOT EXISTS idx_store_follows_user ON public.store_follows(user_id);

-- 5. Fix merchant_reviews verified-buyer policy
DROP POLICY IF EXISTS "Verified buyers can create reviews" ON public.merchant_reviews;
CREATE POLICY "Verified buyers can create reviews"
ON public.merchant_reviews FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    WHERE o.id = merchant_reviews.order_id
      AND o.user_id = auth.uid()
      AND o.status = 'delivered'
      AND p.merchant_id = merchant_reviews.merchant_id
  )
);

-- 6. get_store_stats function
CREATE OR REPLACE FUNCTION public.get_store_stats(_merchant_id uuid)
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_products', (SELECT COUNT(*) FROM products WHERE merchant_id = _merchant_id AND is_active = true),
    'total_sales', (SELECT COALESCE(SUM(sales_count), 0) FROM products WHERE merchant_id = _merchant_id),
    'follower_count', (SELECT COUNT(*) FROM store_follows WHERE merchant_id = _merchant_id),
    'review_count', (SELECT COUNT(*) FROM merchant_reviews WHERE merchant_id = _merchant_id),
    'avg_rating', COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM merchant_reviews WHERE merchant_id = _merchant_id), 0)
  );
$$;

-- 7. Notify followers when merchant adds a new product
CREATE OR REPLACE FUNCTION public.notify_followers_on_new_product()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower RECORD;
  store TEXT;
BEGIN
  IF NEW.is_active = true AND NEW.merchant_id IS NOT NULL THEN
    SELECT COALESCE(store_name, full_name, 'A store you follow') INTO store
    FROM profiles WHERE user_id = NEW.merchant_id;

    FOR follower IN SELECT user_id FROM store_follows WHERE merchant_id = NEW.merchant_id LOOP
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (
        follower.user_id,
        'New product from ' || store,
        store || ' just listed: ' || NEW.name,
        'info'
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_followers_new_product ON public.products;
CREATE TRIGGER trg_notify_followers_new_product
AFTER INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION public.notify_followers_on_new_product();
