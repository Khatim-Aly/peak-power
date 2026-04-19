
-- ============================================
-- 1. AVATARS STORAGE BUCKET (public)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read for avatars
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Authenticated users can upload to their own folder
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
CREATE POLICY "Users delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- 2. REVIEW -> NOTIFICATION TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_on_new_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reviewer_name TEXT;
  product_name  TEXT;
  product_owner UUID;
  admin_rec RECORD;
BEGIN
  -- Reviewer display name
  SELECT COALESCE(full_name, email, 'A customer') INTO reviewer_name
  FROM public.profiles WHERE user_id = NEW.user_id;

  -- Get a product name from the order linked to this review (best-effort)
  SELECT oi.product_name, p.merchant_id
    INTO product_name, product_owner
  FROM public.order_items oi
  LEFT JOIN public.products p ON p.id = oi.product_id
  WHERE oi.order_id = NEW.order_id
  LIMIT 1;

  -- Notify the merchant who owns the product (if any)
  IF product_owner IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      product_owner,
      'New review on your product',
      reviewer_name || ' rated ' || COALESCE(product_name, 'your product') || ' ' || NEW.rating || '/5'
        || CASE WHEN NEW.comment IS NOT NULL AND NEW.comment <> '' THEN ': "' || left(NEW.comment, 140) || '"' ELSE '' END,
      'review'
    );
  END IF;

  -- Notify all admins
  FOR admin_rec IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      admin_rec.user_id,
      'New product review',
      reviewer_name || ' reviewed ' || COALESCE(product_name, 'a product') || ' (' || NEW.rating || '/5)',
      'review'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_merchant_review_created ON public.merchant_reviews;
CREATE TRIGGER on_merchant_review_created
AFTER INSERT ON public.merchant_reviews
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_review();

-- ============================================
-- 3. NOTIFY USER ON APPLICATION DECISION
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_on_application_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('approved', 'declined') THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      CASE WHEN NEW.status = 'approved' THEN 'Merchant application approved 🎉'
           ELSE 'Merchant application declined' END,
      CASE WHEN NEW.status = 'approved'
           THEN 'Welcome aboard! You can now publish products as ' || NEW.store_name || '.'
           ELSE COALESCE('Reason: ' || NEW.admin_notes, 'Please review the admin notes and re-apply.') END,
      CASE WHEN NEW.status = 'approved' THEN 'success' ELSE 'warning' END
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_merchant_application_decision ON public.merchant_applications;
CREATE TRIGGER on_merchant_application_decision
AFTER UPDATE ON public.merchant_applications
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_application_decision();

-- ============================================
-- 4. NOTIFY USER ON SUPPORT TICKET RESPONSE
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_on_ticket_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.admin_response IS DISTINCT FROM OLD.admin_response AND NEW.admin_response IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'Support team responded',
      'Re: ' || NEW.subject || ' — ' || left(NEW.admin_response, 160),
      'support'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_ticket_response ON public.support_tickets;
CREATE TRIGGER on_ticket_response
AFTER UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_ticket_response();
