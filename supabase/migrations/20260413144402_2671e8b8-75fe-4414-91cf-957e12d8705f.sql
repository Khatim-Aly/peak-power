-- FIX CRITICAL: Restrict merchant order updates to only orders containing their products
DROP POLICY IF EXISTS "Merchants can update order status" ON public.orders;

CREATE POLICY "Merchants can update order status"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'merchant'::app_role)
  AND EXISTS (
    SELECT 1 FROM order_items oi
    JOIN products pr ON pr.id = oi.product_id
    WHERE oi.order_id = orders.id AND pr.merchant_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'merchant'::app_role)
  AND EXISTS (
    SELECT 1 FROM order_items oi
    JOIN products pr ON pr.id = oi.product_id
    WHERE oi.order_id = orders.id AND pr.merchant_id = auth.uid()
  )
);

-- FIX: Restrict notification INSERT so merchants can only insert for themselves
DROP POLICY IF EXISTS "Authenticated users can receive notifications" ON public.notifications;

CREATE POLICY "Users and admins can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create rate limiting table for auth attempts
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  attempt_type text NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  success boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_lookup 
ON public.auth_rate_limits (identifier, attempt_type, attempted_at DESC);

-- Rate check function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _identifier text,
  _attempt_type text,
  _max_attempts int DEFAULT 5,
  _window_minutes int DEFAULT 15
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) >= _max_attempts
  FROM public.auth_rate_limits
  WHERE identifier = _identifier
    AND attempt_type = _attempt_type
    AND attempted_at > now() - (_window_minutes || ' minutes')::interval
    AND success = false;
$$;

-- Cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.auth_rate_limits WHERE attempted_at < now() - interval '24 hours';
$$;

ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;