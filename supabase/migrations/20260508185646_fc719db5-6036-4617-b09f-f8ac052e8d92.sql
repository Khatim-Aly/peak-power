
-- ============ COMMISSION SETTINGS ============
CREATE TABLE public.commission_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid UNIQUE,
  commission_percent numeric NOT NULL DEFAULT 10,
  is_default boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage commission settings" ON public.commission_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone reads commission settings" ON public.commission_settings
  FOR SELECT USING (true);

CREATE TRIGGER commission_settings_updated
  BEFORE UPDATE ON public.commission_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.commission_settings (merchant_id, commission_percent, is_default, notes)
VALUES (NULL, 10, true, 'Platform default commission');

-- ============ PAYOUTS ============
CREATE TYPE public.payout_status AS ENUM ('pending', 'processing', 'paid', 'failed', 'cancelled');

CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  gross_sales numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  status public.payout_status NOT NULL DEFAULT 'pending',
  payment_method text,
  payment_reference text,
  notes text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_payouts_merchant ON public.payouts(merchant_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage payouts" ON public.payouts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Merchants view their payouts" ON public.payouts
  FOR SELECT USING (auth.uid() = merchant_id);

CREATE TRIGGER payouts_updated
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.notify_on_payout_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO notifications (user_id, title, message, type)
    VALUES (
      NEW.merchant_id,
      'Payout ' || NEW.status::text,
      'Your payout of PKR ' || NEW.net_amount || ' is now ' || NEW.status::text,
      CASE WHEN NEW.status = 'paid' THEN 'success' ELSE 'info' END
    );
  END IF;
  RETURN NEW;
END;$$;

CREATE TRIGGER payout_status_notify
  AFTER UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_payout_update();

-- ============ REFERRALS ============
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  reward_amount numeric NOT NULL DEFAULT 200,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads active referral codes" ON public.referral_codes
  FOR SELECT USING (is_active = true OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Owner updates own code" ON public.referral_codes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage referral codes" ON public.referral_codes
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TYPE public.referral_status AS ENUM ('pending', 'qualified', 'rewarded', 'cancelled');

CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_user_id uuid NOT NULL UNIQUE,
  code_used text NOT NULL,
  status public.referral_status NOT NULL DEFAULT 'pending',
  reward_amount numeric NOT NULL DEFAULT 0,
  qualified_at timestamptz,
  rewarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage referrals" ON public.referrals
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users view their referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- Auto-create referral code on user signup
CREATE OR REPLACE FUNCTION public.create_referral_code_for_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  generated text;
BEGIN
  generated := upper(substring(replace(NEW.user_id::text, '-', ''), 1, 8));
  INSERT INTO referral_codes (user_id, code) VALUES (NEW.user_id, generated)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;$$;

CREATE TRIGGER profiles_create_referral_code
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_referral_code_for_user();

-- Backfill referral codes for existing profiles
INSERT INTO public.referral_codes (user_id, code)
SELECT user_id, upper(substring(replace(user_id::text, '-', ''), 1, 8))
FROM public.profiles
ON CONFLICT DO NOTHING;

-- ============ BROADCASTS ============
CREATE TYPE public.broadcast_channel AS ENUM ('email', 'sms', 'in_app');
CREATE TYPE public.broadcast_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'failed');
CREATE TYPE public.broadcast_audience AS ENUM ('all_users', 'all_merchants', 'all_customers', 'followers', 'custom');

CREATE TABLE public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  channel public.broadcast_channel NOT NULL DEFAULT 'in_app',
  audience public.broadcast_audience NOT NULL DEFAULT 'all_users',
  status public.broadcast_status NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipient_count integer NOT NULL DEFAULT 0,
  delivered_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage broadcasts" ON public.broadcasts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER broadcasts_updated
  BEFORE UPDATE ON public.broadcasts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.broadcast_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id uuid NOT NULL REFERENCES public.broadcasts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  delivered_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_broadcast_recipients_broadcast ON public.broadcast_recipients(broadcast_id);
CREATE INDEX idx_broadcast_recipients_user ON public.broadcast_recipients(user_id);
ALTER TABLE public.broadcast_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage broadcast recipients" ON public.broadcast_recipients
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users view their broadcast deliveries" ON public.broadcast_recipients
  FOR SELECT USING (auth.uid() = user_id);

-- RPC: send a broadcast (in-app only for now — fans out notifications)
CREATE OR REPLACE FUNCTION public.send_broadcast(_broadcast_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  b RECORD;
  recipient_ids uuid[];
  rid uuid;
  count_total integer := 0;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN json_build_object('error', 'forbidden');
  END IF;

  SELECT * INTO b FROM broadcasts WHERE id = _broadcast_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'broadcast not found');
  END IF;

  -- Resolve audience
  IF b.audience = 'all_users' THEN
    SELECT array_agg(user_id) INTO recipient_ids FROM profiles;
  ELSIF b.audience = 'all_merchants' THEN
    SELECT array_agg(user_id) INTO recipient_ids FROM user_roles WHERE role = 'merchant';
  ELSIF b.audience = 'all_customers' THEN
    SELECT array_agg(user_id) INTO recipient_ids FROM user_roles WHERE role = 'user';
  ELSE
    recipient_ids := ARRAY[]::uuid[];
  END IF;

  recipient_ids := COALESCE(recipient_ids, ARRAY[]::uuid[]);
  count_total := array_length(recipient_ids, 1);

  -- Fan-out as in-app notifications + log delivery
  IF count_total > 0 THEN
    FOREACH rid IN ARRAY recipient_ids LOOP
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (rid, b.title, b.body, 'info');

      INSERT INTO broadcast_recipients (broadcast_id, user_id, status, delivered_at)
      VALUES (_broadcast_id, rid, 'delivered', now());
    END LOOP;
  END IF;

  UPDATE broadcasts
  SET status = 'sent',
      sent_at = now(),
      recipient_count = COALESCE(count_total, 0),
      delivered_count = COALESCE(count_total, 0)
  WHERE id = _broadcast_id;

  RETURN json_build_object('success', true, 'recipients', COALESCE(count_total, 0));
END;$$;

-- RPC: compute pending payout snapshot for a merchant for a date range
CREATE OR REPLACE FUNCTION public.compute_merchant_earnings(_merchant_id uuid, _from date, _to date)
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT json_build_object(
    'gross_sales', COALESCE(SUM(oi.price * oi.quantity), 0),
    'order_count', COUNT(DISTINCT o.id),
    'item_count', COALESCE(SUM(oi.quantity), 0),
    'commission_percent', COALESCE(
      (SELECT commission_percent FROM commission_settings WHERE merchant_id = _merchant_id LIMIT 1),
      (SELECT commission_percent FROM commission_settings WHERE is_default = true LIMIT 1),
      10
    )
  )
  FROM orders o
  JOIN order_items oi ON oi.order_id = o.id
  JOIN products p ON p.id = oi.product_id
  WHERE p.merchant_id = _merchant_id
    AND o.status = 'delivered'
    AND o.created_at::date BETWEEN _from AND _to;
$$;
