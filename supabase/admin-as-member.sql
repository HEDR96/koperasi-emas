-- ============================================================
-- Admin juga bisa terdaftar sebagai anggota (dual-role)
-- Jalankan di Supabase SQL Editor.
--
-- Kolom is_member = TRUE menandai akun admin/master yang juga
-- terdaftar sebagai anggota koperasi. Akun role 'member' tidak
-- perlu flag ini (sudah otomatis anggota).
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_member BOOLEAN NOT NULL DEFAULT FALSE;
