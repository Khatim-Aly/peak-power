
-- Add explicit SELECT policy for cart_items to ensure reads work
CREATE POLICY "Users can read their own cart"
ON public.cart_items
FOR SELECT
USING (auth.uid() = user_id);
