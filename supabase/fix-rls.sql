-- ============================================================
-- fix-rls.sql — RLS Policy Fixes for Koperasi Emas Digital
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ltmovptzzaufxxhxewbn/sql
-- ============================================================

-- ─────────────────────────────────────────────
-- ROOT CAUSE
-- ─────────────────────────────────────────────
-- The "profiles_select" policy on public.profiles caused infinite
-- recursion because it queried public.profiles itself:
--
--   EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
--           AND p.role IN ('admin','master'))
--
-- When a SELECT on profiles triggers this policy, it fires another
-- SELECT on profiles, which re-triggers the policy — infinite loop.
--
-- Policies on OTHER tables (transactions, installments, etc.) that
-- do the same EXISTS subquery against profiles are SAFE because they
-- are on a different table, so no recursion occurs.
-- ─────────────────────────────────────────────

-- ─────────────────────────────────────────────
-- STEP 1: Create a SECURITY DEFINER helper function
-- that reads the current user's role without triggering RLS.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- ─────────────────────────────────────────────
-- STEP 2: Fix profiles_select — replace the recursive subquery
-- with the SECURITY DEFINER function.
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR public.get_my_role() IN ('admin', 'master')
  );

-- ─────────────────────────────────────────────
-- STEP 3: Verify other table policies
-- ─────────────────────────────────────────────
-- The following tables reference public.profiles in their policies
-- but do NOT cause recursion because they query a different table:
--
--   transactions   — transactions_select, transactions_update_admin
--   installments   — installments_select
--   savings        — savings_select
--   referrals      — referrals_select
--   payments       — payments_select, payments_update_admin
--   gold_prices    — gold_prices_insert, gold_prices_update
--   promos         — promos_write
--   news           — news_select, news_write
--   branches       — branches_write
--
-- These are all fine as-is. No changes needed for them.
-- ─────────────────────────────────────────────

-- ─────────────────────────────────────────────
-- STEP 4: Allow admin/master to UPDATE member profiles
-- (suspend/activate, edit data). Tanpa ini, halaman
-- "Kelola Anggota" tidak bisa mengubah status anggota
-- karena hanya ada policy profiles_update_own.
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;

CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE
  USING (public.get_my_role() IN ('admin', 'master'));

-- ─────────────────────────────────────────────
-- STEP 5: Allow admin/master to INSERT transaksi & simpanan
-- atas nama member. Policy lama hanya mengizinkan user_id = auth.uid(),
-- sehingga halaman Input Transaksi / Input Deposit / Input Simpanan
-- (yang dijalankan admin) akan gagal insert untuk member.
--
-- CATATAN: dibungkus pengecekan tabel agar AMAN dijalankan walau
-- migrasi tabel (mis. simpanan.sql) belum dijalankan — tidak error.
-- ─────────────────────────────────────────────
DO $$
BEGIN
  IF to_regclass('public.transactions') IS NOT NULL THEN
    DROP POLICY IF EXISTS "transactions_insert_admin" ON public.transactions;
    CREATE POLICY "transactions_insert_admin" ON public.transactions FOR INSERT
      WITH CHECK (
        user_id = auth.uid()
        OR public.get_my_role() IN ('admin', 'master')
      );
  END IF;

  IF to_regclass('public.simpanan') IS NOT NULL THEN
    DROP POLICY IF EXISTS "simpanan_insert_admin" ON public.simpanan;
    CREATE POLICY "simpanan_insert_admin" ON public.simpanan FOR INSERT
      WITH CHECK (
        user_id = auth.uid()
        OR public.get_my_role() IN ('admin', 'master')
      );
  END IF;
END $$;
