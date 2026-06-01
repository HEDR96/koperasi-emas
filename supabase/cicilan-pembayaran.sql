-- ============================================================
-- Riwayat pembayaran angsuran cicilan + izin admin update cicilan
-- Jalankan di Supabase > SQL Editor (aman diulang).
-- ============================================================

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

-- Izin admin/master UPDATE cicilan (untuk increment angsuran terbayar)
DROP POLICY IF EXISTS "installments_update_admin" ON public.installments;
CREATE POLICY "installments_update_admin" ON public.installments FOR UPDATE
  USING (public.get_my_role() IN ('admin','master'));

-- Kebijakan: TIDAK ada yang boleh menghapus cicilan (admin/master pun tidak).
-- Pastikan policy delete dicabut bila pernah dibuat.
DROP POLICY IF EXISTS "installments_delete_admin" ON public.installments;

SELECT 'Tabel cicilan_pembayaran + policy siap!' AS result;
