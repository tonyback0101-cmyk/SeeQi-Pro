-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User profile table to store affiliate metadata and wallet balances
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ref_code text UNIQUE NOT NULL DEFAULT (
    CONCAT('SQ', SUBSTRING(REPLACE(uuid_generate_v4()::text, '-', '') FROM 1 FOR 10))
  ),
  inviter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  locale text NOT NULL DEFAULT 'en',
  default_currency text NOT NULL DEFAULT 'USD',
  kyc_status text NOT NULL DEFAULT 'pending',
  wallet_balance numeric(14, 2) NOT NULL DEFAULT 0,
  wallet_pending numeric(14, 2) NOT NULL DEFAULT 0,
  payout_method jsonb NOT NULL DEFAULT '{}'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_inviter_id ON public.user_profiles(inviter_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_locale ON public.user_profiles(locale);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.fn_touch_user_profiles()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_user_profiles ON public.user_profiles;
CREATE TRIGGER trg_touch_user_profiles
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE PROCEDURE public.fn_touch_user_profiles();

-- Affiliate links table (optional multiple links per user)
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  slug text UNIQUE,
  landing_url text NOT NULL,
  qr_code_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_links_user_id ON public.affiliate_links(user_id);

DROP TRIGGER IF EXISTS trg_touch_affiliate_links ON public.affiliate_links;
CREATE TRIGGER trg_touch_affiliate_links
BEFORE UPDATE ON public.affiliate_links
FOR EACH ROW
EXECUTE PROCEDURE public.fn_touch_user_profiles();

-- Orders table stores successful purchases (one-off or subscription)
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  product_type text NOT NULL DEFAULT 'one_time',
  payment_provider text NOT NULL,
  provider_session_id text,
  provider_customer_id text,
  provider_subscription_id text,
  status text NOT NULL DEFAULT 'pending',
  amount numeric(14, 2) NOT NULL,
  currency text NOT NULL,
  locale text NOT NULL DEFAULT 'en',
  referrer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referrer_level smallint,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_provider_session_id ON public.orders(provider_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

DROP TRIGGER IF EXISTS trg_touch_orders ON public.orders;
CREATE TRIGGER trg_touch_orders
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE PROCEDURE public.fn_touch_user_profiles();

-- Wallet transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  amount numeric(14, 2) NOT NULL,
  currency text NOT NULL,
  fee_amount numeric(14, 2) NOT NULL DEFAULT 0,
  running_balance numeric(14, 2) NOT NULL,
  reference_id uuid,
  reference_type text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created ON public.wallet_transactions(created_at);

-- Commission ledger
CREATE TABLE IF NOT EXISTS public.commission_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  referrer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  beneficiary_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  level smallint NOT NULL,
  amount numeric(14, 2) NOT NULL,
  currency text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | available | paid | reversed
  wallet_transaction_id uuid REFERENCES public.wallet_transactions(id),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commission_records_referrer ON public.commission_records(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_commission_records_order ON public.commission_records(order_id);

DROP TRIGGER IF EXISTS trg_touch_commission_records ON public.commission_records;
CREATE TRIGGER trg_touch_commission_records
BEFORE UPDATE ON public.commission_records
FOR EACH ROW
EXECUTE PROCEDURE public.fn_touch_user_profiles();

-- Assessment records (sync client data to server)
CREATE TABLE IF NOT EXISTS public.assessment_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module text NOT NULL,
  status text NOT NULL DEFAULT 'not_started',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module)
);

CREATE INDEX IF NOT EXISTS idx_assessment_records_user ON public.assessment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_records_module ON public.assessment_records(module);

DROP TRIGGER IF EXISTS trg_touch_assessment_records ON public.assessment_records;
CREATE TRIGGER trg_touch_assessment_records
BEFORE UPDATE ON public.assessment_records
FOR EACH ROW
EXECUTE PROCEDURE public.fn_touch_user_profiles();

-- Payout requests
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(14, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  fee_amount numeric(14, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected | paid
  payout_method text NOT NULL,
  payout_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  admin_note text,
  external_reference text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_payout_requests_user ON public.payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON public.payout_requests(status);

-- Exchange rates snapshot table
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  base_currency text NOT NULL,
  quote_currency text NOT NULL,
  rate numeric(18, 8) NOT NULL,
  effective_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (base_currency, quote_currency, effective_at)
);

-- Helper function: ensure user profile exists when a user record is inserted
CREATE OR REPLACE FUNCTION public.fn_create_user_profile()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles(user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_profile_on_users ON auth.users;
CREATE TRIGGER trg_user_profile_on_users
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.fn_create_user_profile();

-- Helper function: increment wallet balance atomically
CREATE OR REPLACE FUNCTION public.fn_increment_wallet_balance(p_user_id uuid, p_delta numeric)
RETURNS numeric AS $$
DECLARE
  v_new_balance numeric;
BEGIN
  UPDATE public.user_profiles
  SET wallet_balance = wallet_balance + p_delta,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING wallet_balance INTO v_new_balance;

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- Helper function: adjust wallet pending amount atomically
CREATE OR REPLACE FUNCTION public.fn_adjust_wallet_pending(p_user_id uuid, p_delta numeric)
RETURNS numeric AS $$
DECLARE
  v_new_pending numeric;
BEGIN
  UPDATE public.user_profiles
  SET wallet_pending = wallet_pending + p_delta,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING wallet_pending INTO v_new_pending;

  RETURN v_new_pending;
END;
$$ LANGUAGE plpgsql;
