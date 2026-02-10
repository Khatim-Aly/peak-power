
-- Create shipping_fees table for admin to set shipping fees per city
CREATE TABLE public.shipping_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city TEXT NOT NULL,
  fee NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(city)
);

-- Enable RLS
ALTER TABLE public.shipping_fees ENABLE ROW LEVEL SECURITY;

-- Anyone can view shipping fees
CREATE POLICY "Anyone can view shipping fees"
ON public.shipping_fees
FOR SELECT
USING (true);

-- Only admins can manage shipping fees
CREATE POLICY "Admins can manage shipping fees"
ON public.shipping_fees
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update trigger
CREATE TRIGGER update_shipping_fees_updated_at
BEFORE UPDATE ON public.shipping_fees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
