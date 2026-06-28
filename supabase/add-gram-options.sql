-- ============================================================
-- Migration: Tambah pilihan gram emas yg belum ada di DB
-- Jalankan di: https://supabase.com/dashboard/project/ltmovptzzaufxxhxewbn/sql
-- Aman dijalankan berkali-kali (hanya insert gram yang belum ada)
-- ============================================================

-- Cek gram apa saja yang sudah ada:
-- SELECT DISTINCT gram, kategori FROM harga_emas_berat ORDER BY gram;

-- Insert gram yang belum ada di tabel (emas)
INSERT INTO public.harga_emas_berat (gram, harga, kategori)
SELECT v.gram, v.harga, v.kategori
FROM (VALUES
  (0.5::decimal,   1540000::bigint,   'emas'::text),
  (1::decimal,     2830000::bigint,   'emas'::text),
  (2::decimal,     8255000::bigint,   'emas'::text),
  (3::decimal,     12000000::bigint,  'emas'::text),
  (5::decimal,     14150000::bigint,  'emas'::text),
  (10::decimal,    28300000::bigint,  'emas'::text),
  (25::decimal,    70750000::bigint,  'emas'::text),
  (50::decimal,    141500000::bigint, 'emas'::text),
  (100::decimal,   283000000::bigint, 'emas'::text)
) AS v(gram, harga, kategori)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.harga_emas_berat h
  WHERE h.gram = v.gram AND h.kategori = v.kategori
);

-- Lihat hasilnya:
SELECT gram, harga, kategori, created_at
FROM harga_emas_berat
WHERE kategori = 'emas'
ORDER BY gram;
