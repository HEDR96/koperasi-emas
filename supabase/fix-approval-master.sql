-- ============================================================
-- FIX APPROVAL MASTER — jalankan di Supabase SQL Editor
-- Memperbaiki:
--   1. installments CHECK constraint (tambah 'pending', 'ditolak')
--   2. SELECT/INSERT/UPDATE RLS semua tabel approval pakai get_my_role()
-- ============================================================

-- ── 1. Perbaiki CHECK constraint installments.status ──────────
ALTER TABLE public.installments
  DROP CONSTRAINT IF EXISTS installments_status_check,
  DROP CONSTRAINT IF EXISTS installments_status_check1;

ALTER TABLE public.installments
  ADD CONSTRAINT installments_status_check
  CHECK (status IN ('pending','active','completed','overdue','ditolak'));

-- ── 2. transactions ───────────────────────────────────────────
DROP POLICY IF EXISTS "transactions_select"        ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert"        ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert_admin"  ON public.transactions;
DROP POLICY IF EXISTS "transactions_update_admin"  ON public.transactions;

CREATE POLICY "transactions_select" ON public.transactions FOR SELECT
  USING (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));

CREATE POLICY "transactions_insert_admin" ON public.transactions FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));

CREATE POLICY "transactions_update_admin" ON public.transactions FOR UPDATE
  USING  (public.get_my_role() IN ('admin','master'))
  WITH CHECK (public.get_my_role() IN ('admin','master'));

-- ── 3. installments ───────────────────────────────────────────
DROP POLICY IF EXISTS "installments_select"       ON public.installments;
DROP POLICY IF EXISTS "installments_insert"       ON public.installments;
DROP POLICY IF EXISTS "installments_insert_admin" ON public.installments;
DROP POLICY IF EXISTS "installments_update_admin" ON public.installments;

CREATE POLICY "installments_select" ON public.installments FOR SELECT
  USING (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));

CREATE POLICY "installments_insert_admin" ON public.installments FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));

CREATE POLICY "installments_update_admin" ON public.installments FOR UPDATE
  USING  (public.get_my_role() IN ('admin','master'))
  WITH CHECK (public.get_my_role() IN ('admin','master'));

-- ── 4. simpanan ───────────────────────────────────────────────
DROP POLICY IF EXISTS "simpanan_select"        ON public.simpanan;
DROP POLICY IF EXISTS "simpanan_insert"        ON public.simpanan;
DROP POLICY IF EXISTS "simpanan_insert_admin"  ON public.simpanan;
DROP POLICY IF EXISTS "simpanan_update_admin"  ON public.simpanan;

CREATE POLICY "simpanan_select" ON public.simpanan FOR SELECT
  USING (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));

CREATE POLICY "simpanan_insert_admin" ON public.simpanan FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));

CREATE POLICY "simpanan_update_admin" ON public.simpanan FOR UPDATE
  USING  (public.get_my_role() IN ('admin','master'))
  WITH CHECK (public.get_my_role() IN ('admin','master'));

-- ── 5. gadai ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "gadai_select"       ON public.gadai;
DROP POLICY IF EXISTS "gadai_insert"       ON public.gadai;
DROP POLICY IF EXISTS "gadai_insert_admin" ON public.gadai;
DROP POLICY IF EXISTS "gadai_update_admin" ON public.gadai;

CREATE POLICY "gadai_select" ON public.gadai FOR SELECT
  USING (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));

CREATE POLICY "gadai_insert_admin" ON public.gadai FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));

CREATE POLICY "gadai_update_admin" ON public.gadai FOR UPDATE
  USING  (public.get_my_role() IN ('admin','master'))
  WITH CHECK (public.get_my_role() IN ('admin','master'));

-- ── 6. site_settings ──────────────────────────────────────────
DROP POLICY IF EXISTS "settings_select" ON public.site_settings;
DROP POLICY IF EXISTS "settings_write"  ON public.site_settings;

CREATE POLICY "settings_select" ON public.site_settings FOR SELECT USING (TRUE);
CREATE POLICY "settings_write"  ON public.site_settings FOR ALL
  USING  (public.get_my_role() IN ('admin','master'))
  WITH CHECK (public.get_my_role() IN ('admin','master'));
