
-- Drop the merchant SELECT policy that exposes sensitive shipping data
DROP POLICY IF EXISTS "Merchants can view orders with their products" ON public.orders;

-- Create a SECURITY DEFINER RPC that returns merchant orders WITHOUT sensitive shipping columns
CREATE OR REPLACE FUNCTION public.get_merchant_orders()
RETURNS SETOF json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only merchants can call this
  IF NOT has_role(auth.uid(), 'merchant') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT json_build_object(
    'id', o.id,
    'order_number', o.order_number,
    'status', o.status,
    'total_amount', o.total_amount,
    'created_at', o.created_at,
    'updated_at', o.updated_at,
    'user_id', o.user_id,
    'notes', o.notes,
    'order_items', COALESCE((
      SELECT json_agg(json_build_object(
        'product_name', oi.product_name,
        'product_image', oi.product_image,
        'quantity', oi.quantity,
        'price', oi.price
      ))
      FROM order_items oi
      WHERE oi.order_id = o.id
    ), '[]'::json),
    'customer_name', p.full_name
  )
  FROM orders o
  LEFT JOIN profiles p ON p.user_id = o.user_id
  WHERE EXISTS (
    SELECT 1 FROM order_items oi
    JOIN products pr ON pr.id = oi.product_id
    WHERE oi.order_id = o.id AND pr.merchant_id = auth.uid()
  )
  ORDER BY o.created_at DESC;
END;
$$;
