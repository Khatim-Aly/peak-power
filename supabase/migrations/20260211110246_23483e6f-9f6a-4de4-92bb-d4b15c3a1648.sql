
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Deny anonymous access to cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can manage their own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can view their own cart" ON public.cart_items;

-- Recreate as permissive policies
CREATE POLICY "Users can manage their own cart"
ON public.cart_items
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
