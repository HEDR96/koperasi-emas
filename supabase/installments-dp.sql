-- ============================================================
-- INSTALLMENTS DP — kolom DP / uang muka yang sudah disetorkan
-- Jalankan di Supabase SQL Editor.
-- ============================================================

ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS down_payment BIGINT NOT NULL DEFAULT 0;
