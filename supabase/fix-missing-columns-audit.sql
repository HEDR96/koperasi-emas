-- ============================================================
-- FIX: kolom yang dipakai kode tapi belum pernah dibuat di database.
-- Ditemukan dari audit menyeluruh kode vs migrasi SQL.
-- Idempotent, aman dijalankan berkali-kali.
-- ============================================================

-- 1) profiles.poin — dipakai untuk "beri poin ke agen" saat approve pesanan produk
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS poin INTEGER NOT NULL DEFAULT 0;

-- 2) product_orders.agen_id — dipakai untuk mencatat agen yang membuat pesanan manual,
--    dan sebagai kunci lookup pemberian poin di atas
ALTER TABLE public.product_orders ADD COLUMN IF NOT EXISTS agen_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3) simpanan.payment_method — dipakai saat admin mengajukan simpanan untuk anggota
ALTER TABLE public.simpanan ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 4) profiles.email — dipakai saat membuat akun admin baru (src/app/api/admin/create/route.ts)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

SELECT 'poin, agen_id, payment_method, email columns fixed!' AS result;
