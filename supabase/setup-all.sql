-- ============================================================
-- Koperasi Emas — SETUP ALL (idempotent, aman dijalankan berulang)
-- Paste & Run sekali di: Supabase > SQL Editor
-- Menggabungkan: schema + simpanan + gadai + fitur_baru + dashboard + fix-rls
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ════════════════════════════════════════════
-- HELPER: get_my_role (SECURITY DEFINER, anti-rekursi RLS)
-- ════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- ════════════════════════════════════════════
-- TABEL
-- ════════════════════════════════════════════
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
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS simpanan_pokok_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (simpanan_pokok_status IN ('unpaid','pending','paid'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_simpanan_wajib DATE;

CREATE TABLE IF NOT EXISTS public.gold_prices (
  id SERIAL PRIMARY KEY,
  buy_member BIGINT NOT NULL DEFAULT 1698000,
  buy_non_member BIGINT NOT NULL DEFAULT 1745000,
  buyback_member BIGINT NOT NULL DEFAULT 1658000,
  buyback_non_member BIGINT NOT NULL DEFAULT 1625000,
  change_amount INTEGER NOT NULL DEFAULT 0,
  change_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  trend TEXT NOT NULL DEFAULT 'stable' CHECK (trend IN ('up','down','stable')),
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('buy','buyback','cicilan','tabungan','transfer','referral_bonus')),
  gram NUMERIC(14,4),
  amount BIGINT NOT NULL,
  price_per_gram BIGINT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','rejected')),
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS admin_note TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  total_gram NUMERIC(14,4) NOT NULL,
  total_amount BIGINT NOT NULL,
  monthly_amount BIGINT NOT NULL,
  tenor INTEGER NOT NULL,
  paid_installments INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','overdue')),
  next_due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_gram NUMERIC(14,4) NOT NULL,
  current_gram NUMERIC(14,4) NOT NULL DEFAULT 0,
  monthly_amount BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bonus_amount BIGINT NOT NULL DEFAULT 50000,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  payment_method TEXT,
  proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  notes TEXT,
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  image_url TEXT,
  author_id UUID REFERENCES public.profiles(id),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT, address TEXT, phone TEXT, manager TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.simpanan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('pokok','wajib','sukarela')),
  amount BIGINT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','rejected')),
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gadai (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nilai_jaminan BIGINT NOT NULL,
  harga_buyback BIGINT NOT NULL,
  gram_setara NUMERIC(10,4) NOT NULL,
  dana_cair BIGINT NOT NULL,
  sisa_tagihan BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pengajuan' CHECK (status IN ('pengajuan','disetujui','aktif','lunas','ditolak','gagal_bayar')),
  keterangan TEXT,
  verified_by UUID REFERENCES public.profiles(id),
  catatan_admin TEXT,
  tanggal_cair TIMESTAMPTZ,
  tanggal_lunas TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gadai ADD COLUMN IF NOT EXISTS tenor INTEGER NOT NULL DEFAULT 1 CHECK (tenor BETWEEN 1 AND 4);
ALTER TABLE public.gadai ADD COLUMN IF NOT EXISTS angsuran_per_bulan BIGINT NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_gadai_user_id ON public.gadai(user_id);
CREATE INDEX IF NOT EXISTS idx_gadai_status ON public.gadai(status);

CREATE TABLE IF NOT EXISTS public.shu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tahun INTEGER NOT NULL,
  jumlah BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','dibayar')),
  keterangan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_shu_user_tahun ON public.shu(user_id, tahun);

CREATE TABLE IF NOT EXISTS public.harga_emas_berat (
  id SERIAL PRIMARY KEY,
  gram DECIMAL(10,2) NOT NULL,
  harga BIGINT NOT NULL,
  kategori TEXT NOT NULL DEFAULT 'emas' CHECK (kategori IN ('emas','buyback')),
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_harga_berat_gram_kat ON public.harga_emas_berat(gram, kategori, created_at DESC);

CREATE TABLE IF NOT EXISTS public.cicilan_harga (
  id SERIAL PRIMARY KEY,
  gram DECIMAL(10,2) NOT NULL,
  tenor INTEGER NOT NULL,
  harga_jual BIGINT NOT NULL,
  angsuran BIGINT NOT NULL,
  uang_muka_persen INTEGER NOT NULL DEFAULT 10,
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.testimonials (
  id SERIAL PRIMARY KEY,
  nama TEXT NOT NULL, peran TEXT NOT NULL, inisial TEXT,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  komentar TEXT NOT NULL, emas_saved TEXT, tahun_gabung INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE, urutan INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.faq_items (
  id SERIAL PRIMARY KEY,
  pertanyaan TEXT NOT NULL, jawaban TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE, urutan INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY, value TEXT, label TEXT, type TEXT, group_name TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_permissions (
  admin_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  can_approve_transactions boolean DEFAULT true,
  can_input_transactions boolean DEFAULT true,
  can_manage_members boolean DEFAULT true,
  can_manage_promos boolean DEFAULT false,
  can_manage_news boolean DEFAULT false,
  can_view_reports boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL, body text, type text DEFAULT 'general',
  is_read boolean DEFAULT false, link text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);

-- ════════════════════════════════════════════
-- TRIGGERS
-- ════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE ref_code TEXT;
BEGIN
  ref_code := 'KED-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6));
  INSERT INTO public.profiles (id, name, phone, nik, role, referral_code, referred_by)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name',''),
    COALESCE(NEW.raw_user_meta_data->>'phone',''),
    COALESCE(NEW.raw_user_meta_data->>'nik',''),
    COALESCE(NEW.raw_user_meta_data->>'role','member'),
    ref_code, NEW.raw_user_meta_data->>'referred_by');
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION update_gadai_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_gadai_updated_at ON public.gadai;
CREATE TRIGGER trg_gadai_updated_at BEFORE UPDATE ON public.gadai
  FOR EACH ROW EXECUTE FUNCTION update_gadai_updated_at();

-- ════════════════════════════════════════════
-- ENABLE RLS
-- ════════════════════════════════════════════
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gold_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simpanan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gadai ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harga_emas_berat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cicilan_harga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════
-- POLICIES (semua DROP dulu = idempotent)
-- ════════════════════════════════════════════
-- profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.get_my_role() IN ('admin','master'));
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE
  USING (public.get_my_role() IN ('admin','master'));

-- gold_prices
DROP POLICY IF EXISTS "gold_prices_select" ON public.gold_prices;
CREATE POLICY "gold_prices_select" ON public.gold_prices FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "gold_prices_insert" ON public.gold_prices;
CREATE POLICY "gold_prices_insert" ON public.gold_prices FOR INSERT
  WITH CHECK (public.get_my_role() IN ('admin','master'));
DROP POLICY IF EXISTS "gold_prices_update" ON public.gold_prices;
CREATE POLICY "gold_prices_update" ON public.gold_prices FOR UPDATE
  USING (public.get_my_role() IN ('admin','master'));

-- transactions
DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT
  USING (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));
DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert_admin" ON public.transactions;
CREATE POLICY "transactions_insert_admin" ON public.transactions FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));
DROP POLICY IF EXISTS "transactions_update_admin" ON public.transactions;
CREATE POLICY "transactions_update_admin" ON public.transactions FOR UPDATE
  USING (public.get_my_role() IN ('admin','master'));

-- installments
DROP POLICY IF EXISTS "installments_select" ON public.installments;
CREATE POLICY "installments_select" ON public.installments FOR SELECT
  USING (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));
DROP POLICY IF EXISTS "installments_insert" ON public.installments;
CREATE POLICY "installments_insert" ON public.installments FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));

-- savings
DROP POLICY IF EXISTS "savings_select" ON public.savings;
CREATE POLICY "savings_select" ON public.savings FOR SELECT
  USING (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));
DROP POLICY IF EXISTS "savings_insert" ON public.savings;
CREATE POLICY "savings_insert" ON public.savings FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));
DROP POLICY IF EXISTS "savings_update" ON public.savings;
CREATE POLICY "savings_update" ON public.savings FOR UPDATE USING (user_id = auth.uid());

-- referrals
DROP POLICY IF EXISTS "referrals_select" ON public.referrals;
CREATE POLICY "referrals_select" ON public.referrals FOR SELECT
  USING (referrer_id = auth.uid() OR referred_id = auth.uid() OR public.get_my_role() IN ('admin','master'));

-- payments
DROP POLICY IF EXISTS "payments_select" ON public.payments;
CREATE POLICY "payments_select" ON public.payments FOR SELECT
  USING (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));
DROP POLICY IF EXISTS "payments_insert" ON public.payments;
CREATE POLICY "payments_insert" ON public.payments FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));
DROP POLICY IF EXISTS "payments_update_admin" ON public.payments;
CREATE POLICY "payments_update_admin" ON public.payments FOR UPDATE
  USING (public.get_my_role() IN ('admin','master'));

-- promos
DROP POLICY IF EXISTS "promos_select" ON public.promos;
CREATE POLICY "promos_select" ON public.promos FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "promos_write" ON public.promos;
CREATE POLICY "promos_write" ON public.promos FOR ALL
  USING (public.get_my_role() IN ('admin','master'));

-- news
DROP POLICY IF EXISTS "news_select" ON public.news;
CREATE POLICY "news_select" ON public.news FOR SELECT
  USING (is_published = TRUE OR public.get_my_role() IN ('admin','master'));
DROP POLICY IF EXISTS "news_write" ON public.news;
CREATE POLICY "news_write" ON public.news FOR ALL
  USING (public.get_my_role() IN ('admin','master'));

-- branches
DROP POLICY IF EXISTS "branches_select" ON public.branches;
CREATE POLICY "branches_select" ON public.branches FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "branches_write" ON public.branches;
CREATE POLICY "branches_write" ON public.branches FOR ALL
  USING (public.get_my_role() IN ('admin','master'));

-- simpanan
DROP POLICY IF EXISTS "simpanan_select" ON public.simpanan;
CREATE POLICY "simpanan_select" ON public.simpanan FOR SELECT
  USING (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));
DROP POLICY IF EXISTS "simpanan_insert" ON public.simpanan;
DROP POLICY IF EXISTS "simpanan_insert_admin" ON public.simpanan;
CREATE POLICY "simpanan_insert_admin" ON public.simpanan FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));
DROP POLICY IF EXISTS "simpanan_update_admin" ON public.simpanan;
CREATE POLICY "simpanan_update_admin" ON public.simpanan FOR UPDATE
  USING (public.get_my_role() IN ('admin','master'));

-- gadai
DROP POLICY IF EXISTS "member_own_gadai" ON public.gadai;
CREATE POLICY "member_own_gadai" ON public.gadai FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "admin_all_gadai" ON public.gadai;
CREATE POLICY "admin_all_gadai" ON public.gadai FOR ALL
  USING (public.get_my_role() IN ('admin','master'));

-- shu
DROP POLICY IF EXISTS "member_own_shu" ON public.shu;
CREATE POLICY "member_own_shu" ON public.shu FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "admin_all_shu" ON public.shu;
CREATE POLICY "admin_all_shu" ON public.shu FOR ALL
  USING (public.get_my_role() IN ('admin','master'));

-- harga_emas_berat
DROP POLICY IF EXISTS "harga_berat_select" ON public.harga_emas_berat;
CREATE POLICY "harga_berat_select" ON public.harga_emas_berat FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "harga_berat_insert" ON public.harga_emas_berat;
CREATE POLICY "harga_berat_insert" ON public.harga_emas_berat FOR INSERT
  WITH CHECK (public.get_my_role() IN ('admin','master'));

-- cicilan_harga
DROP POLICY IF EXISTS "cicilan_harga_select" ON public.cicilan_harga;
CREATE POLICY "cicilan_harga_select" ON public.cicilan_harga FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "cicilan_harga_write" ON public.cicilan_harga;
CREATE POLICY "cicilan_harga_write" ON public.cicilan_harga FOR ALL
  USING (public.get_my_role() IN ('admin','master'));

-- testimonials
DROP POLICY IF EXISTS "testimonials_select" ON public.testimonials;
CREATE POLICY "testimonials_select" ON public.testimonials FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "testimonials_write" ON public.testimonials;
CREATE POLICY "testimonials_write" ON public.testimonials FOR ALL
  USING (public.get_my_role() IN ('admin','master'));

-- faq_items
DROP POLICY IF EXISTS "faq_select" ON public.faq_items;
CREATE POLICY "faq_select" ON public.faq_items FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "faq_write" ON public.faq_items;
CREATE POLICY "faq_write" ON public.faq_items FOR ALL
  USING (public.get_my_role() IN ('admin','master'));

-- site_settings
DROP POLICY IF EXISTS "settings_select" ON public.site_settings;
CREATE POLICY "settings_select" ON public.site_settings FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "settings_write" ON public.site_settings;
CREATE POLICY "settings_write" ON public.site_settings FOR ALL
  USING (public.get_my_role() IN ('admin','master'));

-- ════════════════════════════════════════════
-- SEED DATA (aman diulang)
-- ════════════════════════════════════════════
INSERT INTO public.gold_prices (buy_member, buy_non_member, buyback_member, buyback_non_member, change_amount, change_percent, trend)
VALUES (1698000, 1745000, 1658000, 1625000, 4000, 0.24, 'up')
ON CONFLICT DO NOTHING;

INSERT INTO public.harga_emas_berat (gram, harga, kategori) VALUES
  (0.5,849000,'emas'),(1,1698000,'emas'),(2,3396000,'emas'),(5,8490000,'emas'),
  (10,16980000,'emas'),(25,42450000,'emas'),(50,84900000,'emas'),(100,169800000,'emas'),
  (1,1658000,'buyback'),(5,8290000,'buyback'),(10,16580000,'buyback')
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════
-- AUTO SALDO: gold_grams (dari transaksi) & rupiah_balance (dari simpanan)
-- ════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.recalc_member_balances(p_user uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.profiles p SET
    gold_grams = COALESCE((
      SELECT SUM(CASE
                   WHEN t.type IN ('buy','cicilan','tabungan') THEN COALESCE(t.gram,0)
                   WHEN t.type = 'buyback' THEN -COALESCE(t.gram,0)
                   ELSE 0 END)
      FROM public.transactions t
      WHERE t.user_id = p_user AND t.status = 'completed'), 0),
    rupiah_balance = COALESCE((
      SELECT SUM(s.amount) FROM public.simpanan s
      WHERE s.user_id = p_user AND s.status = 'completed'), 0)
  WHERE p.id = p_user;
$$;

CREATE OR REPLACE FUNCTION public.trg_recalc_balances()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN PERFORM public.recalc_member_balances(OLD.user_id); RETURN OLD; END IF;
  PERFORM public.recalc_member_balances(NEW.user_id);
  IF TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    PERFORM public.recalc_member_balances(OLD.user_id);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_tx_balances ON public.transactions;
CREATE TRIGGER trg_tx_balances AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_balances();

DROP TRIGGER IF EXISTS trg_sim_balances ON public.simpanan;
CREATE TRIGGER trg_sim_balances AFTER INSERT OR UPDATE OR DELETE ON public.simpanan
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_balances();

DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP PERFORM public.recalc_member_balances(r.id); END LOOP;
END $$;

-- ════════════════════════════════════════════
-- RIWAYAT PEMBAYARAN ANGSURAN CICILAN
-- ════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.cicilan_pembayaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installment_id UUID NOT NULL REFERENCES public.installments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  angsuran_ke INTEGER NOT NULL,
  amount BIGINT NOT NULL,
  notes TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cicilan_pmt_inst ON public.cicilan_pembayaran(installment_id);
ALTER TABLE public.cicilan_pembayaran ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cp_select" ON public.cicilan_pembayaran;
CREATE POLICY "cp_select" ON public.cicilan_pembayaran FOR SELECT
  USING (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));
DROP POLICY IF EXISTS "cp_write" ON public.cicilan_pembayaran;
CREATE POLICY "cp_write" ON public.cicilan_pembayaran FOR ALL
  USING (public.get_my_role() IN ('admin','master'));

DROP POLICY IF EXISTS "installments_update_admin" ON public.installments;
CREATE POLICY "installments_update_admin" ON public.installments FOR UPDATE
  USING (public.get_my_role() IN ('admin','master'));
DROP POLICY IF EXISTS "installments_delete_admin" ON public.installments;
CREATE POLICY "installments_delete_admin" ON public.installments FOR DELETE
  USING (public.get_my_role() IN ('admin','master'));

SELECT 'Setup selesai!' AS result;
