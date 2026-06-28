-- ============================================================
-- Fix: get_latest_harga_berat — ambil 1 baris terbaru per gram
-- Jalankan di: https://supabase.com/dashboard/project/ltmovptzzaufxxhxewbn/sql
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_latest_harga_berat(kat text DEFAULT 'emas')
RETURNS TABLE(
  id          int,
  gram        decimal,
  harga       bigint,
  kategori    text,
  updated_by  uuid,
  created_at  timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (gram) id, gram, harga, kategori, updated_by, created_at
  FROM harga_emas_berat
  WHERE kategori = kat
  ORDER BY gram, created_at DESC;
$$;

-- Izinkan semua user memanggil function ini
GRANT EXECUTE ON FUNCTION public.get_latest_harga_berat(text) TO anon, authenticated;
