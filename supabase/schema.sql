-- ============================================================
-- Koperasi Emas Digital — Supabase Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ltmovptzzaufxxhxewbn/sql
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- 1. PROFILES (extends auth.users)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL DEFAULT '',
  nik             TEXT,
  phone           TEXT,
  role            TEXT        NOT NULL DEFAULT 'member' CHECK (role IN ('master','admin','member')),
  referral_code   TEXT        UNIQUE,
  referred_by     TEXT,
  gold_grams      NUMERIC(14,4) NOT NULL DEFAULT 0,
  rupiah_balance  BIGINT      NOT NULL DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','pending')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ref_code TEXT;
BEGIN
  ref_code := 'KED-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6));
  INSERT INTO public.profiles (id, name, phone, nik, role, referral_code, referred_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'nik', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    ref_code,
    NEW.raw_user_meta_data->>'referred_by'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────
-- 2. GOLD PRICES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gold_prices (
  id                  SERIAL      PRIMARY KEY,
  buy_member          BIGINT      NOT NULL DEFAULT 1698000,
  buy_non_member      BIGINT      NOT NULL DEFAULT 1745000,
  buyback_member      BIGINT      NOT NULL DEFAULT 1658000,
  buyback_non_member  BIGINT      NOT NULL DEFAULT 1625000,
  change_amount       INTEGER     NOT NULL DEFAULT 0,
  change_percent      NUMERIC(5,2) NOT NULL DEFAULT 0,
  trend               TEXT        NOT NULL DEFAULT 'stable' CHECK (trend IN ('up','down','stable')),
  updated_by          UUID        REFERENCES public.profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial price
INSERT INTO public.gold_prices (buy_member, buy_non_member, buyback_member, buyback_non_member, change_amount, change_percent, trend)
VALUES (1698000, 1745000, 1658000, 1625000, 4000, 0.24, 'up')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- 3. TRANSACTIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transactions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type            TEXT        NOT NULL CHECK (type IN ('buy','buyback','cicilan','tabungan','transfer','referral_bonus')),
  gram            NUMERIC(14,4),
  amount          BIGINT      NOT NULL,
  price_per_gram  BIGINT,
  status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','rejected')),
  payment_method  TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 4. INSTALLMENTS (CICILAN)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.installments (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_name        TEXT        NOT NULL,
  total_gram          NUMERIC(14,4) NOT NULL,
  total_amount        BIGINT      NOT NULL,
  monthly_amount      BIGINT      NOT NULL,
  tenor               INTEGER     NOT NULL,
  paid_installments   INTEGER     NOT NULL DEFAULT 0,
  status              TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','overdue')),
  next_due_date       DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 5. SAVINGS (TABUNGAN EMAS)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.savings (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  target_gram     NUMERIC(14,4) NOT NULL,
  current_gram    NUMERIC(14,4) NOT NULL DEFAULT 0,
  monthly_amount  BIGINT      NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','paused')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 6. REFERRALS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referrals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bonus_amount    BIGINT      NOT NULL DEFAULT 50000,
  status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 7. PAYMENTS (BUKTI BAYAR)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID        NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount          BIGINT      NOT NULL,
  payment_method  TEXT,
  proof_url       TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  notes           TEXT,
  verified_by     UUID        REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 8. PROMOS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.promos (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT        NOT NULL,
  description      TEXT,
  image_url        TEXT,
  discount_percent INTEGER     NOT NULL DEFAULT 0,
  start_date       DATE,
  end_date         DATE,
  is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 9. NEWS (BERITA)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.news (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  content      TEXT,
  category     TEXT,
  image_url    TEXT,
  author_id    UUID        REFERENCES public.profiles(id),
  is_published BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 10. BRANCHES (CABANG)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.branches (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  city       TEXT,
  address    TEXT,
  phone      TEXT,
  manager    TEXT,
  status     TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gold_prices  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches     ENABLE ROW LEVEL SECURITY;

-- Profiles: user sees own, admin/master sees all
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master'))
  );
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Gold prices: everyone can read, only master/admin can write
CREATE POLICY "gold_prices_select" ON public.gold_prices FOR SELECT USING (TRUE);
CREATE POLICY "gold_prices_insert" ON public.gold_prices FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master')));
CREATE POLICY "gold_prices_update" ON public.gold_prices FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master')));

-- Transactions: member sees own, admin/master sees all
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master'))
  );
CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "transactions_update_admin" ON public.transactions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master')));

-- Installments: same as transactions
CREATE POLICY "installments_select" ON public.installments FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master'))
  );
CREATE POLICY "installments_insert" ON public.installments FOR INSERT WITH CHECK (user_id = auth.uid());

-- Savings: same pattern
CREATE POLICY "savings_select" ON public.savings FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master'))
  );
CREATE POLICY "savings_insert" ON public.savings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "savings_update" ON public.savings FOR UPDATE USING (user_id = auth.uid());

-- Referrals: see own
CREATE POLICY "referrals_select" ON public.referrals FOR SELECT
  USING (
    referrer_id = auth.uid() OR referred_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master'))
  );

-- Payments: member sees own, admin sees all
CREATE POLICY "payments_select" ON public.payments FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master'))
  );
CREATE POLICY "payments_insert" ON public.payments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "payments_update_admin" ON public.payments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master')));

-- Promos, news, branches: everyone reads, admin/master writes
CREATE POLICY "promos_select" ON public.promos FOR SELECT USING (TRUE);
CREATE POLICY "promos_write" ON public.promos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master')));

CREATE POLICY "news_select" ON public.news FOR SELECT USING (is_published = TRUE OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master')));
CREATE POLICY "news_write" ON public.news FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master')));

CREATE POLICY "branches_select" ON public.branches FOR SELECT USING (TRUE);
CREATE POLICY "branches_write" ON public.branches FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master')));

-- ─────────────────────────────────────────────
-- SAFE COLUMN ADDITIONS (idempotent — safe to re-run)
-- ─────────────────────────────────────────────
ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS discount_percent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- ─────────────────────────────────────────────
-- SEED DATA
-- ─────────────────────────────────────────────
-- Sample branches
INSERT INTO public.branches (name, city, address, phone, manager, status) VALUES
  ('KED Jakarta Pusat',   'Jakarta',   'Jl. Sudirman No. 88, Jakarta Pusat',  '021-5555-0001', 'Ahmad Fauzi',   'active'),
  ('KED Surabaya',        'Surabaya',  'Jl. Darmo No. 45, Surabaya',          '031-5555-0002', 'Siti Aminah',   'active'),
  ('KED Bandung',         'Bandung',   'Jl. Dago No. 12, Bandung',            '022-5555-0003', 'Budi Santoso',  'active'),
  ('KED Medan',           'Medan',     'Jl. Gatot Subroto No. 77, Medan',     '061-5555-0004', 'Rizky Pratama', 'active'),
  ('KED Yogyakarta',      'Yogyakarta','Jl. Malioboro No. 33, Yogyakarta',    '0274-555-0005', 'Dewi Rahayu',   'active')
ON CONFLICT DO NOTHING;

-- Sample promos
INSERT INTO public.promos (title, description, discount_percent, start_date, end_date, is_active) VALUES
  ('Promo Ramadhan 2026',  'Diskon biaya admin 50% untuk pembelian emas selama Ramadhan',  50, '2026-03-01', '2026-04-10', FALSE),
  ('Member Baru Untung',   'Gratis biaya pendaftaran + bonus emas 0.1g untuk member baru', 100,'2026-01-01', '2026-12-31', TRUE),
  ('Cicilan 0% 24 Bulan',  'Program cicilan tanpa bunga tenor 24 bulan untuk emas Antam',  0,  '2026-05-01', '2026-07-31', TRUE)
ON CONFLICT DO NOTHING;
