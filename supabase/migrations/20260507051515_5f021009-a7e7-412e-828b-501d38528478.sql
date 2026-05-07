
-- ============ CMS ============
CREATE TABLE public.cms_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text,
  cta_label text,
  cta_url text,
  position text NOT NULL DEFAULT 'hero',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cms_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views active banners" ON public.cms_banners FOR SELECT USING (is_active = true AND starts_at <= now() AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "Admins manage banners" ON public.cms_banners FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TABLE public.cms_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text,
  image_url text,
  parent_id uuid REFERENCES public.cms_categories(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cms_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views active categories" ON public.cms_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage categories" ON public.cms_categories FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TABLE public.cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  meta_description text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views published pages" ON public.cms_pages FOR SELECT USING (is_published = true);
CREATE POLICY "Admins manage pages" ON public.cms_pages FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TABLE public.cms_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cms_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views published faqs" ON public.cms_faqs FOR SELECT USING (is_published = true);
CREATE POLICY "Admins manage faqs" ON public.cms_faqs FOR ALL USING (has_role(auth.uid(), 'admin'));

-- ============ LOGISTICS ============
CREATE TABLE public.couriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  contact_phone text,
  contact_email text,
  tracking_url_template text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views active couriers" ON public.couriers FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage couriers" ON public.couriers FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TABLE public.delivery_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cities text[] NOT NULL DEFAULT ARRAY[]::text[],
  base_fee numeric NOT NULL DEFAULT 0,
  eta_min_days integer NOT NULL DEFAULT 1,
  eta_max_days integer NOT NULL DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone views active zones" ON public.delivery_zones FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage zones" ON public.delivery_zones FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE TYPE shipment_status AS ENUM ('pending','picked_up','in_transit','out_for_delivery','delivered','failed','returned');

CREATE TABLE public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  courier_id uuid REFERENCES public.couriers(id) ON DELETE SET NULL,
  tracking_number text,
  status shipment_status NOT NULL DEFAULT 'pending',
  dispatched_at timestamptz,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers view their shipments" ON public.shipments FOR SELECT USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = shipments.order_id AND o.user_id = auth.uid()));
CREATE POLICY "Merchants view their order shipments" ON public.shipments FOR SELECT USING (has_role(auth.uid(),'merchant') AND EXISTS (SELECT 1 FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = shipments.order_id AND p.merchant_id = auth.uid()));
CREATE POLICY "Admins manage shipments" ON public.shipments FOR ALL USING (has_role(auth.uid(),'admin'));

CREATE TYPE return_status AS ENUM ('requested','approved','rejected','received','refunded','closed');

CREATE TABLE public.returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  order_item_id uuid,
  user_id uuid NOT NULL,
  reason text NOT NULL,
  status return_status NOT NULL DEFAULT 'requested',
  refund_amount numeric DEFAULT 0,
  photos text[] DEFAULT ARRAY[]::text[],
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their returns" ON public.returns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create returns for delivered orders" ON public.returns FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM orders o WHERE o.id = returns.order_id AND o.user_id = auth.uid() AND o.status = 'delivered'));
CREATE POLICY "Admins manage returns" ON public.returns FOR ALL USING (has_role(auth.uid(),'admin'));

-- timestamp triggers
CREATE TRIGGER set_cms_banners_updated BEFORE UPDATE ON public.cms_banners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_cms_categories_updated BEFORE UPDATE ON public.cms_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_cms_pages_updated BEFORE UPDATE ON public.cms_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_cms_faqs_updated BEFORE UPDATE ON public.cms_faqs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_couriers_updated BEFORE UPDATE ON public.couriers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_delivery_zones_updated BEFORE UPDATE ON public.delivery_zones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_shipments_updated BEFORE UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_returns_updated BEFORE UPDATE ON public.returns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notify customer when shipment status changes
CREATE OR REPLACE FUNCTION public.notify_on_shipment_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  customer uuid;
  ord_no text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT user_id, order_number INTO customer, ord_no FROM orders WHERE id = NEW.order_id;
    IF customer IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (customer, 'Shipment update', 'Order ' || COALESCE(ord_no,'') || ' is now ' || NEW.status::text, 'info');
    END IF;
  END IF;
  RETURN NEW;
END;$$;
CREATE TRIGGER shipment_status_notify AFTER UPDATE ON public.shipments FOR EACH ROW EXECUTE FUNCTION public.notify_on_shipment_update();

-- Notify customer when return status changes
CREATE OR REPLACE FUNCTION public.notify_on_return_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (NEW.user_id, 'Return request update', 'Your return is now ' || NEW.status::text, 'info');
  END IF;
  RETURN NEW;
END;$$;
CREATE TRIGGER return_status_notify AFTER UPDATE ON public.returns FOR EACH ROW EXECUTE FUNCTION public.notify_on_return_update();
