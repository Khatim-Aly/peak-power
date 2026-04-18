-- Site promotions table (floating notification offers)
CREATE TABLE public.site_promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  promo_code TEXT,
  discount_percent NUMERIC DEFAULT 0,
  scope TEXT NOT NULL DEFAULT 'product', -- 'product' | 'store'
  product_id UUID,
  merchant_id UUID,
  cta_label TEXT DEFAULT 'Shop Now',
  cta_url TEXT,
  commission_percent NUMERIC NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  is_active BOOLEAN NOT NULL DEFAULT false,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active approved promotions"
ON public.site_promotions FOR SELECT
USING (status = 'approved' AND is_active = true AND starts_at <= now() AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Merchants view own promotions"
ON public.site_promotions FOR SELECT
USING (auth.uid() = created_by);

CREATE POLICY "Merchants create promotions"
ON public.site_promotions FOR INSERT
WITH CHECK (auth.uid() = created_by AND status = 'pending' AND is_active = false);

CREATE POLICY "Merchants update own pending"
ON public.site_promotions FOR UPDATE
USING (auth.uid() = created_by AND status = 'pending');

CREATE POLICY "Merchants delete own pending"
ON public.site_promotions FOR DELETE
USING (auth.uid() = created_by AND status = 'pending');

CREATE POLICY "Admins manage all promotions"
ON public.site_promotions FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_site_promotions_updated_at
BEFORE UPDATE ON public.site_promotions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin commissions ledger
CREATE TABLE public.admin_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promotion_id UUID REFERENCES public.site_promotions(id) ON DELETE SET NULL,
  order_id UUID NOT NULL,
  order_item_id UUID,
  merchant_id UUID,
  product_id UUID,
  base_amount NUMERIC NOT NULL,
  commission_percent NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'earned', -- 'earned' | 'paid'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all commissions"
ON public.admin_commissions FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage commissions"
ON public.admin_commissions FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Merchants view their commissions"
ON public.admin_commissions FOR SELECT
USING (auth.uid() = merchant_id);

-- Trigger: when order transitions to 'delivered', record commissions for promoted products
CREATE OR REPLACE FUNCTION public.record_promotion_commission_on_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
  promo RECORD;
  base NUMERIC;
  commission NUMERIC;
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS DISTINCT FROM 'delivered') THEN
    FOR item IN
      SELECT oi.id AS order_item_id, oi.product_id, oi.price, oi.quantity, p.merchant_id
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id
    LOOP
      -- Find an active approved promotion matching product or merchant store
      SELECT * INTO promo
      FROM site_promotions sp
      WHERE sp.status = 'approved'
        AND (
          (sp.scope = 'product' AND sp.product_id = item.product_id)
          OR (sp.scope = 'store' AND sp.merchant_id = item.merchant_id)
        )
        AND sp.starts_at <= NEW.created_at
        AND (sp.expires_at IS NULL OR sp.expires_at >= NEW.created_at)
      ORDER BY sp.scope = 'product' DESC, sp.created_at DESC
      LIMIT 1;

      IF FOUND THEN
        base := COALESCE(item.price, 0) * COALESCE(item.quantity, 1);
        commission := ROUND(base * promo.commission_percent / 100, 2);

        INSERT INTO admin_commissions (
          promotion_id, order_id, order_item_id, merchant_id,
          product_id, base_amount, commission_percent, commission_amount
        ) VALUES (
          promo.id, NEW.id, item.order_item_id, item.merchant_id,
          item.product_id, base, promo.commission_percent, commission
        );
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_delivered_record_commission
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.record_promotion_commission_on_delivery();