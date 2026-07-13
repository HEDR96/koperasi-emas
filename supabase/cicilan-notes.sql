-- ============================================================
-- Tambah kolom catatan admin di Cicilan (installments)
-- Jalankan di: Supabase SQL Editor
-- ============================================================

ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS notes TEXT;
