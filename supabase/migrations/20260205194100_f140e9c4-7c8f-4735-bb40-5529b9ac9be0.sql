-- Fix the overly permissive notifications INSERT policy
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create a more restrictive policy - only authenticated users can create notifications
-- and only admins/merchants can create notifications for others
CREATE POLICY "Authenticated users can receive notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      auth.uid() = user_id OR
      public.has_role(auth.uid(), 'admin') OR
      public.has_role(auth.uid(), 'merchant')
    )
  );