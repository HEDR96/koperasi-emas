-- ============================================================
-- Update lanjutan: ajukan cicilan (pending), ledger gadai,
-- harga hanya master yang boleh ubah. Aman diulang.
-- ============================================================

-- 1) Cicilan bisa berstatus 'pending' (pengajuan member, tunggu approval)
ALTER TABLE public.installments DROP CONSTRAINT IF EXISTS installments_status_check;
ALTER TABLE public.installments
  ADD CONSTRAINT installments_status_check CHECK (status IN ('pending','active','completed','overdue','ditolak'));

-- 2) Ledger pembayaran GADAI (riwayat per pembayaran + tanggal)
CREATE TABLE IF NOT EXISTS public.gadai_pembayaran (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gadai_id    UUID NOT NULL REFERENCES public.gadai(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  angsuran_ke INTEGER,
  amount      BIGINT NOT NULL,
  notes       TEXT,
  recorded_by UUID REFERENCES public.profiles(id),
  paid_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gadai_pmt_gadai ON public.gadai_pembayaran(gadai_id);
ALTER TABLE public.gadai_pembayaran ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gp2_select" ON public.gadai_pembayaran;
CREATE POLICY "gp2_select" ON public.gadai_pembayaran FOR SELECT
  USING (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));
DROP POLICY IF EXISTS "gp2_write" ON public.gadai_pembayaran;
CREATE POLICY "gp2_write" ON public.gadai_pembayaran FOR ALL
  USING (public.get_my_role() IN ('admin','master'));
DROP POLICY IF EXISTS "gp2_delete_master" ON public.gadai_pembayaran;
CREATE POLICY "gp2_delete_master" ON public.gadai_pembayaran FOR DELETE
  USING (public.get_my_role() = 'master');

-- 3) HARGA hanya boleh diubah MASTER (admin & member hanya lihat)
DROP POLICY IF EXISTS "harga_berat_insert" ON public.harga_emas_berat;
CREATE POLICY "harga_berat_insert" ON public.harga_emas_berat FOR INSERT
  WITH CHECK (public.get_my_role() = 'master');

DROP POLICY IF EXISTS "cicilan_harga_write" ON public.cicilan_harga;
CREATE POLICY "cicilan_harga_write" ON public.cicilan_harga FOR ALL
  USING (public.get_my_role() = 'master');

DROP POLICY IF EXISTS "gold_prices_insert" ON public.gold_prices;
CREATE POLICY "gold_prices_insert" ON public.gold_prices FOR INSERT
  WITH CHECK (public.get_my_role() = 'master');
DROP POLICY IF EXISTS "gold_prices_update" ON public.gold_prices;
CREATE POLICY "gold_prices_update" ON public.gold_prices FOR UPDATE
  USING (public.get_my_role() = 'master');

SELECT 'Update2 selesai!' AS result;
