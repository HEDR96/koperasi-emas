-- ============================================================
-- PROMO FIELDS — kolom tambahan untuk promo landing page
-- Jalankan di Supabase SQL Editor.
-- Field: nama (title), berat (gram_weight), harga (price),
--        kadaluarsa (expired_at, datetime), link gambar (image_url, Google Drive).
-- ============================================================

ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS gram_weight NUMERIC(10,3);
ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS price       BIGINT;
ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS expired_at  TIMESTAMPTZ;
