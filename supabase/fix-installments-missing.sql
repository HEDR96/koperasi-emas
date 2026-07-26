-- ============================================================
-- FIX: tabel installments (cicilan) belum pernah dibuat di project ini.
-- Script ini idempotent (aman dijalankan berkali-kali).
-- Jalankan di: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1) Tabel utama cicilan
CREATE TABLE IF NOT EXISTS public.installments (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_name      TEXT          NOT NULL,
  total_gram        NUMERIC(14,4) NOT NULL,
  total_amount      BIGINT        NOT NULL,
  monthly_amount    BIGINT        NOT NULL,
  down_payment      BIGINT        NOT NULL DEFAULT 0,
  tenor             INTEGER       NOT NULL,
  paid_installments INTEGER       NOT NULL DEFAULT 0,
  status            TEXT          NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','overdue')),
  next_due_date     DATE,
  notes             TEXT,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Jaga-jaga kalau tabel sudah ada dari percobaan sebelumnya tapi kolom kurang
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS down_payment BIGINT NOT NULL DEFAULT 0;
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "installments_select" ON public.installments;
CREATE POLICY "installments_select" ON public.installments FOR SELECT
  USING (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));

DROP POLICY IF EXISTS "installments_insert" ON public.installments;
CREATE POLICY "installments_insert" ON public.installments FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));

DROP POLICY IF EXISTS "installments_update_admin" ON public.installments;
CREATE POLICY "installments_update_admin" ON public.installments FOR UPDATE
  USING (public.get_my_role() IN ('admin','master'));

DROP POLICY IF EXISTS "installments_delete_admin" ON public.installments;
DROP POLICY IF EXISTS "installments_delete_master" ON public.installments;
CREATE POLICY "installments_delete_master" ON public.installments FOR DELETE
  USING (public.get_my_role() = 'master');

-- 2) Riwayat pembayaran angsuran (bergantung pada installments di atas)
CREATE TABLE IF NOT EXISTS public.cicilan_pembayaran (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installment_id  UUID NOT NULL REFERENCES public.installments(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  angsuran_ke     INTEGER NOT NULL,
  amount          BIGINT NOT NULL,
  notes           TEXT,
  recorded_by     UUID REFERENCES public.profiles(id),
  paid_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cicilan_pmt_inst ON public.cicilan_pembayaran(installment_id);
CREATE INDEX IF NOT EXISTS idx_cicilan_pmt_user ON public.cicilan_pembayaran(user_id);

ALTER TABLE public.cicilan_pembayaran ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cp_select" ON public.cicilan_pembayaran;
CREATE POLICY "cp_select" ON public.cicilan_pembayaran FOR SELECT
  USING (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));

DROP POLICY IF EXISTS "cp_write" ON public.cicilan_pembayaran;
CREATE POLICY "cp_write" ON public.cicilan_pembayaran FOR ALL
  USING (public.get_my_role() IN ('admin','master'));

DROP POLICY IF EXISTS "cp_delete_master" ON public.cicilan_pembayaran;
CREATE POLICY "cp_delete_master" ON public.cicilan_pembayaran FOR DELETE
  USING (public.get_my_role() = 'master');

SELECT 'installments + cicilan_pembayaran siap!' AS result;
