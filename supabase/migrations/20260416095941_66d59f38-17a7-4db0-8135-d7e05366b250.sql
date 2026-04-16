
-- Create promo code status enum
CREATE TYPE public.promo_status AS ENUM ('pending', 'approved', 'rejected');

-- Create promo codes table
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  discount_percent NUMERIC DEFAULT 0,
  free_shipping_threshold NUMERIC DEFAULT NULL,
  scope TEXT NOT NULL DEFAULT 'store' CHECK (scope IN ('store', 'product')),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  merchant_id UUID DEFAULT NULL,
  status promo_status NOT NULL DEFAULT 'pending',
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(code)
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can manage all promo codes"
ON public.promo_codes FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Merchants can view their own
CREATE POLICY "Merchants can view their own promo codes"
ON public.promo_codes FOR SELECT
USING (has_role(auth.uid(), 'merchant') AND merchant_id = auth.uid());

-- Merchants can create (always pending)
CREATE POLICY "Merchants can create promo codes"
ON public.promo_codes FOR INSERT
WITH CHECK (has_role(auth.uid(), 'merchant') AND merchant_id = auth.uid() AND status = 'pending');

-- Merchants can update their own pending codes
CREATE POLICY "Merchants can update their pending promo codes"
ON public.promo_codes FOR UPDATE
USING (has_role(auth.uid(), 'merchant') AND merchant_id = auth.uid() AND status = 'pending');

-- Merchants can delete their own pending codes
CREATE POLICY "Merchants can delete their pending promo codes"
ON public.promo_codes FOR DELETE
USING (has_role(auth.uid(), 'merchant') AND merchant_id = auth.uid() AND status = 'pending');

-- Public can view approved active codes (for checkout validation)
CREATE POLICY "Anyone can view active approved promo codes"
ON public.promo_codes FOR SELECT
USING (status = 'approved' AND is_active = true AND starts_at <= now() AND expires_at > now());

-- Trigger for updated_at
CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
