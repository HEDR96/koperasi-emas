-- ════════════════════════════════════════════════════════════════════
--  Audit trail status anggota + status "rejected" terpisah dari "suspended"
--  Jalankan di Supabase SQL Editor (project: pt capella multidana)
-- ════════════════════════════════════════════════════════════════════

-- 1) Tambah nilai status "rejected" (untuk hasil tolak verifikasi)
--    sebelumnya tolak -> "suspended" (permanen). Sekarang -> "rejected".
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_check
  CHECK (status IN ('active','suspended','pending','rejected'));

-- 2) Kolom audit: siapa yang mengubah status, kapan, dan alasannya
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status_changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status_reason     TEXT;

COMMENT ON COLUMN public.profiles.status_changed_by IS 'Admin/master yang terakhir mengubah status akun ini';
COMMENT ON COLUMN public.profiles.status_changed_at IS 'Waktu perubahan status terakhir';
COMMENT ON COLUMN public.profiles.status_reason     IS 'Alasan perubahan status (opsional)';

-- 3) Refresh schema cache PostgREST agar kolom baru langsung terbaca
NOTIFY pgrst, 'reload schema';
