-- ============================================================
-- PROMO FIELDS — kolom tambahan untuk promo landing page
-- Jalankan di Supabase SQL Editor.
-- ============================================================

ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS gram_weight NUMERIC(10,3);
ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS price       BIGINT;
ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS expired_at  TIMESTAMPTZ;

-- Pastikan image_url ada (jika tabel dibuat tanpa kolom ini)
ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS image_url   TEXT;

-- Reload schema cache PostgREST agar kolom baru langsung dikenali
NOTIFY pgrst, 'reload schema';
