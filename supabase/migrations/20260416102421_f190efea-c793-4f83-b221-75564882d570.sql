
-- Add exit-intent display flag and timer to promo_codes
ALTER TABLE public.promo_codes 
  ADD COLUMN show_on_exit_intent boolean NOT NULL DEFAULT false,
  ADD COLUMN exit_intent_timer_minutes integer NOT NULL DEFAULT 15;

-- Ensure only one promo code is shown on exit intent at a time
-- We use a partial unique index: only one row can have show_on_exit_intent = true
CREATE UNIQUE INDEX idx_single_exit_intent_promo 
  ON public.promo_codes (show_on_exit_intent) 
  WHERE show_on_exit_intent = true;
