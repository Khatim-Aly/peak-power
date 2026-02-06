-- SECURITY FIX 1: Update handle_new_user trigger to ALWAYS assign 'user' role (ignore metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- SECURITY: ALWAYS assign 'user' role - never trust client metadata
  -- Role promotion must be done by admins through the dashboard
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- SECURITY FIX 2: Drop overly permissive merchant policy on order_items
DROP POLICY IF EXISTS "Merchants can view all order items" ON public.order_items;

-- Create restricted policy: Merchants can only view order items for their own products
CREATE POLICY "Merchants can view their product order items"
  ON public.order_items FOR SELECT
  USING (
    public.has_role(auth.uid(), 'merchant') AND
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = order_items.product_id
      AND products.merchant_id = auth.uid()
    )
  );

-- SECURITY FIX 3: Drop overly permissive merchant policy on orders
DROP POLICY IF EXISTS "Merchants can view orders for their products" ON public.orders;

-- Create restricted policy: Merchants can only view orders that contain their products
CREATE POLICY "Merchants can view orders with their products"
  ON public.orders FOR SELECT
  USING (
    public.has_role(auth.uid(), 'merchant') AND
    EXISTS (
      SELECT 1 FROM public.order_items oi
      JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = orders.id
      AND p.merchant_id = auth.uid()
    )
  );