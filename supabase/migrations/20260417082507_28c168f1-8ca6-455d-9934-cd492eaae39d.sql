-- ============================================
-- 1. Storage bucket for merchant KYC documents
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('merchant-kyc', 'merchant-kyc', false)
ON CONFLICT (id) DO NOTHING;

-- Users can upload their own KYC files (folder = their user_id)
CREATE POLICY "Users can upload their own KYC files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'merchant-kyc'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own KYC files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'merchant-kyc'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Users can update their own KYC files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'merchant-kyc'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own KYC files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'merchant-kyc'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- 2. Merchant applications table
-- ============================================
CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'declined');

CREATE TABLE public.merchant_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_name text NOT NULL,
  business_type text NOT NULL,
  city text NOT NULL,
  phone text NOT NULL,
  pitch text NOT NULL,
  cnic_number text NOT NULL,
  business_description text NOT NULL,
  cnic_image_path text,
  business_proof_path text,
  status public.application_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.merchant_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own applications"
ON public.merchant_applications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications"
ON public.merchant_applications FOR INSERT
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Users can update their pending applications"
ON public.merchant_applications FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all applications"
ON public.merchant_applications FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_merchant_applications_updated_at
BEFORE UPDATE ON public.merchant_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_merchant_applications_user ON public.merchant_applications(user_id);
CREATE INDEX idx_merchant_applications_status ON public.merchant_applications(status);

-- ============================================
-- 3. Merchant reviews (verified buyers only)
-- ============================================
CREATE TABLE public.merchant_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL,
  user_id uuid NOT NULL,
  order_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, merchant_id, order_id)
);

ALTER TABLE public.merchant_reviews ENABLE ROW LEVEL SECURITY;

-- Public read of all reviews
CREATE POLICY "Anyone can view merchant reviews"
ON public.merchant_reviews FOR SELECT
USING (true);

-- Only verified buyers can create reviews (must own a delivered order containing merchant's product)
CREATE POLICY "Verified buyers can create reviews"
ON public.merchant_reviews FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    JOIN public.products p ON p.id = oi.product_id
    WHERE o.id = order_id
      AND o.user_id = auth.uid()
      AND o.status = 'delivered'
      AND p.merchant_id = merchant_id
  )
);

CREATE POLICY "Users can update their own reviews"
ON public.merchant_reviews FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.merchant_reviews FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all reviews"
ON public.merchant_reviews FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_merchant_reviews_updated_at
BEFORE UPDATE ON public.merchant_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_merchant_reviews_merchant ON public.merchant_reviews(merchant_id);
CREATE INDEX idx_merchant_reviews_user ON public.merchant_reviews(user_id);

-- ============================================
-- 4. Support tickets (Q&A / general requests)
-- ============================================
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  status public.ticket_status NOT NULL DEFAULT 'open',
  admin_response text,
  responded_by uuid,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets"
ON public.support_tickets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their open tickets"
ON public.support_tickets FOR UPDATE
USING (auth.uid() = user_id AND status = 'open');

CREATE POLICY "Admins can manage all tickets"
ON public.support_tickets FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_support_tickets_user ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);

-- ============================================
-- 5. Helper function: when admin approves a merchant application,
-- automatically promote user to merchant role and copy store_name to profile.
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_merchant_application_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only run when status transitions to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    -- Promote to merchant role
    UPDATE public.user_roles
    SET role = 'merchant'
    WHERE user_id = NEW.user_id;

    -- If no role row exists, insert it
    INSERT INTO public.user_roles (user_id, role)
    SELECT NEW.user_id, 'merchant'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = NEW.user_id
    );

    -- Copy store_name into profile
    UPDATE public.profiles
    SET store_name = NEW.store_name
    WHERE user_id = NEW.user_id;

    NEW.reviewed_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_merchant_application_approval
BEFORE UPDATE ON public.merchant_applications
FOR EACH ROW EXECUTE FUNCTION public.handle_merchant_application_approval();