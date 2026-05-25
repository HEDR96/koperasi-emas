-- ============================================================
-- Tambahan: Tabel Simpanan Koperasi
-- Jalankan di: https://supabase.com/dashboard/project/ltmovptzzaufxxhxewbn/sql
-- ============================================================

-- ─────────────────────────────────────────────
-- TABEL SIMPANAN
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.simpanan (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL CHECK (type IN ('pokok','wajib','sukarela')),
  amount      BIGINT      NOT NULL,
  description TEXT,
  status      TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','rejected')),
  verified_by UUID        REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- KOLOM TAMBAHAN DI PROFILES
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS simpanan_pokok_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (simpanan_pokok_status IN ('unpaid','pending','paid'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_simpanan_wajib    DATE;   -- tanggal terakhir bayar simpanan wajib

-- ─────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────
ALTER TABLE public.simpanan ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "simpanan_select" ON public.simpanan;
DROP POLICY IF EXISTS "simpanan_insert" ON public.simpanan;
DROP POLICY IF EXISTS "simpanan_update_admin" ON public.simpanan;

CREATE POLICY "simpanan_select" ON public.simpanan FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master'))
  );

CREATE POLICY "simpanan_insert" ON public.simpanan FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "simpanan_update_admin" ON public.simpanan FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master')));

-- ─────────────────────────────────────────────
-- VIEW: ringkasan simpanan per member (opsional, untuk admin)
-- ─────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_simpanan_summary AS
SELECT
  p.id                                                        AS user_id,
  p.name,
  p.simpanan_pokok_status,
  COALESCE(SUM(CASE WHEN s.type='pokok'     AND s.status='completed' THEN s.amount ELSE 0 END), 0) AS total_pokok,
  COALESCE(SUM(CASE WHEN s.type='wajib'     AND s.status='completed' THEN s.amount ELSE 0 END), 0) AS total_wajib,
  COALESCE(SUM(CASE WHEN s.type='sukarela'  AND s.status='completed' THEN s.amount ELSE 0 END), 0) AS total_sukarela,
  COALESCE(SUM(CASE WHEN s.status='completed' THEN s.amount ELSE 0 END), 0)                        AS total_simpanan
FROM public.profiles p
LEFT JOIN public.simpanan s ON s.user_id = p.id
WHERE p.role = 'member'
GROUP BY p.id, p.name, p.simpanan_pokok_status;
