-- Add explicit policy to deny anonymous access to cart_items
-- This ensures only authenticated users can access cart data

CREATE POLICY "Deny anonymous access to cart"
  ON public.cart_items
  FOR ALL
  USING (auth.uid() IS NOT NULL);