-- ============================================================
-- Tambah field Ongkir (biaya ongkos kirim) di pembayaran produk
-- Jalankan di: Supabase SQL Editor
-- ============================================================

ALTER TABLE public.product_payments ADD COLUMN IF NOT EXISTS ongkir NUMERIC(18,2) NOT NULL DEFAULT 0;
