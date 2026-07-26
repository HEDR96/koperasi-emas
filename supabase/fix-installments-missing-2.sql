-- ============================================================
-- FIX LANJUTAN untuk public.installments (jalankan SETELAH fix-installments-missing.sql)
-- Idempotent, aman diulang.
-- ============================================================

-- 1) Kolom transaction_date ketinggalan saat migrasi ke transactions/simpanan/gadai
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS transaction_date TIMESTAMPTZ;
UPDATE public.installments SET transaction_date = created_at WHERE transaction_date IS NULL;

-- 2) Longgarkan constraint status: kode pakai 'pending' (pengajuan member) & 'ditolak' (ditolak admin)
ALTER TABLE public.installments DROP CONSTRAINT IF EXISTS installments_status_check;
ALTER TABLE public.installments
  ADD CONSTRAINT installments_status_check CHECK (status IN ('pending','active','completed','overdue','ditolak'));

SELECT 'installments: transaction_date + status constraint fixed!' AS result;
