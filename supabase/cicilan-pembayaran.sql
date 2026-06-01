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

-- Kebijakan: HANYA MASTER yang boleh menghapus (admin tidak).
DROP POLICY IF EXISTS "installments_delete_admin" ON public.installments;
DROP POLICY IF EXISTS "installments_delete_master" ON public.installments;
CREATE POLICY "installments_delete_master" ON public.installments FOR DELETE
  USING (public.get_my_role() = 'master');

DROP POLICY IF EXISTS "cp_delete_master" ON public.cicilan_pembayaran;
CREATE POLICY "cp_delete_master" ON public.cicilan_pembayaran FOR DELETE
  USING (public.get_my_role() = 'master');

-- Gadai: member lihat/ajukan miliknya, admin/master kelola, HAPUS hanya master
DROP POLICY IF EXISTS "member_own_gadai" ON public.gadai;
DROP POLICY IF EXISTS "admin_all_gadai" ON public.gadai;
DROP POLICY IF EXISTS "gadai_select" ON public.gadai;
CREATE POLICY "gadai_select" ON public.gadai FOR SELECT
  USING (auth.uid() = user_id OR public.get_my_role() IN ('admin','master'));
DROP POLICY IF EXISTS "gadai_insert" ON public.gadai;
CREATE POLICY "gadai_insert" ON public.gadai FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.get_my_role() IN ('admin','master'));
DROP POLICY IF EXISTS "gadai_update" ON public.gadai;
CREATE POLICY "gadai_update" ON public.gadai FOR UPDATE
  USING (public.get_my_role() IN ('admin','master'));
DROP POLICY IF EXISTS "gadai_delete_master" ON public.gadai;
CREATE POLICY "gadai_delete_master" ON public.gadai FOR DELETE
  USING (public.get_my_role() = 'master');

SELECT 'Policy hapus (master-only) siap!' AS result;
