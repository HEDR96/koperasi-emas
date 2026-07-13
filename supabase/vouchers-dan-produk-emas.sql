-- ============================================================
-- Voucher, produk emas otomatis, & rapikan tipe simpanan
-- Jalankan di: Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. TABEL VOUCHER
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vouchers (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT        NOT NULL UNIQUE,
  target         TEXT        NOT NULL CHECK (target IN ('produk','angsuran')),
  discount_type  TEXT        NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value NUMERIC(14,2) NOT NULL CHECK (discount_value > 0),
  description    TEXT,
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  created_by     UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_vouchers" ON public.vouchers;
CREATE POLICY "admin_vouchers" ON public.vouchers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('master','admin'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('master','admin'))
  );

-- ─────────────────────────────────────────────
-- 2. JEJAK VOUCHER DI PEMBAYARAN PRODUK & CICILAN
-- ─────────────────────────────────────────────
ALTER TABLE public.product_payments ADD COLUMN IF NOT EXISTS voucher_id       UUID REFERENCES public.vouchers(id) ON DELETE SET NULL;
ALTER TABLE public.product_payments ADD COLUMN IF NOT EXISTS voucher_code     TEXT;
ALTER TABLE public.product_payments ADD COLUMN IF NOT EXISTS discount_amount  NUMERIC(14,2) DEFAULT 0;

ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS voucher_id       UUID REFERENCES public.vouchers(id) ON DELETE SET NULL;
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS voucher_code     TEXT;
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS discount_amount  NUMERIC(14,2) DEFAULT 0;

-- ─────────────────────────────────────────────
-- 3. PRODUK EMAS OTOMATIS (dari menu Harga Emas)
-- ─────────────────────────────────────────────
ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS is_gold_auto BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS promos_gold_auto_gram_uidx
  ON public.promos (gram_weight) WHERE is_gold_auto = true;

-- ─────────────────────────────────────────────
-- 4. RAPIKAN TIPE SIMPANAN — tambah 'simpanan' (perbaikan bug lama
--    admin/simpanan yang insert type='simpanan' di luar constraint asli)
--    dan 'setoran' (setoran mandiri member, sebelumnya tercatat sebagai
--    transactions.type='tabungan').
-- ─────────────────────────────────────────────
ALTER TABLE public.simpanan DROP CONSTRAINT IF EXISTS simpanan_type_check;
ALTER TABLE public.simpanan ADD CONSTRAINT simpanan_type_check
  CHECK (type IN ('pokok','wajib','sukarela','simpanan','setoran'));
