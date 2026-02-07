-- Add explicit policy to deny anonymous access to orders
-- This ensures only authenticated users can access order data containing sensitive shipping information

CREATE POLICY "Deny anonymous access to orders"
  ON public.orders
  FOR ALL
  USING (auth.uid() IS NOT NULL);