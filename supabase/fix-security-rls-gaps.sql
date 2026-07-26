-- ============================================================
-- FIX KEAMANAN — 3 celah RLS ditemukan dari audit mendalam:
--
-- 1) notifications: RLS TIDAK PERNAH diaktifkan sama sekali.
--    Siapa pun yang login bisa baca/ubah/hapus notifikasi milik
--    orang lain lewat Supabase client langsung.
-- 2) profiles_update_own: tidak ada WITH CHECK, jadi anggota bisa
--    update kolom apa saja di baris profilnya sendiri lewat client
--    langsung — termasuk role (naik jadi admin/master sendiri!),
--    status, gold_grams, rupiah_balance, dst.
-- 3) INSERT policy transactions/installments/simpanan/gadai/
--    product_orders cuma cek user_id, tidak pernah mengunci
--    kolom status — anggota bisa insert baris yang SUDAH
--    berstatus "active"/"completed"/"approved" langsung lewat
--    client, melewati proses approval master sepenuhnya.
--
-- Idempotent, aman dijalankan berkali-kali.
-- ============================================================

-- ── 1) notifications: aktifkan RLS + kebijakan yang benar ──────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT
  USING (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));

-- Insert: boleh untuk diri sendiri, ATAU kalau target-nya staff (admin/master) —
-- ini dipakai saat member submit pengajuan cicilan/gadai/dll dan memberi tahu staff.
-- Member TIDAK boleh insert notifikasi ke sesama member lain (anti-spam/snoop).
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR public.get_my_role() IN ('admin','master')
    OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = notifications.user_id AND pr.role IN ('admin','master'))
  );

DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE
  USING (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));

DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE
  USING (user_id = auth.uid() OR public.get_my_role() IN ('admin','master'));

-- ── 2) profiles: cegah anggota mengubah kolom sensitif di baris sendiri ──
-- (role, status, saldo, dll) — RLS UPDATE tanpa WITH CHECK memakai USING lagi,
-- yang cuma cek auth.uid()=id, jadi kolom APA SAJA bisa diubah pemilik baris.
-- Trigger ini "mengunci" kolom sensitif ke nilai lama kalau pemanggilnya bukan admin/master.
CREATE OR REPLACE FUNCTION public.profiles_guard_self_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.get_my_role() NOT IN ('admin','master') THEN
    NEW.role             := OLD.role;
    NEW.status           := OLD.status;
    NEW.gold_grams       := OLD.gold_grams;
    NEW.rupiah_balance   := OLD.rupiah_balance;
    NEW.referral_code    := OLD.referral_code;
    NEW.product_quota    := OLD.product_quota;
    NEW.poin             := OLD.poin;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_guard_self_update ON public.profiles;
CREATE TRIGGER trg_profiles_guard_self_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_self_update();

-- ── 3) Kunci kolom status di INSERT policy — anggota HARUS insert 'pending'
--       ('pengajuan' untuk gadai). Admin/master tetap bebas (dipakai Input
--       Transaksi Manual untuk catat data historis langsung "active"/"completed").

DROP POLICY IF EXISTS "transactions_insert_admin" ON public.transactions;
CREATE POLICY "transactions_insert_admin" ON public.transactions FOR INSERT
  WITH CHECK (
    (user_id = auth.uid() AND status = 'pending')
    OR public.get_my_role() IN ('admin','master')
  );

DROP POLICY IF EXISTS "installments_insert_admin" ON public.installments;
CREATE POLICY "installments_insert_admin" ON public.installments FOR INSERT
  WITH CHECK (
    (user_id = auth.uid() AND status = 'pending')
    OR public.get_my_role() IN ('admin','master')
  );

DROP POLICY IF EXISTS "simpanan_insert_admin" ON public.simpanan;
CREATE POLICY "simpanan_insert_admin" ON public.simpanan FOR INSERT
  WITH CHECK (
    (user_id = auth.uid() AND status = 'pending')
    OR public.get_my_role() IN ('admin','master')
  );

DROP POLICY IF EXISTS "gadai_insert_admin" ON public.gadai;
CREATE POLICY "gadai_insert_admin" ON public.gadai FOR INSERT
  WITH CHECK (
    (user_id = auth.uid() AND status = 'pengajuan')
    OR public.get_my_role() IN ('admin','master')
  );

DROP POLICY IF EXISTS "member_insert_own_order" ON public.product_orders;
CREATE POLICY "member_insert_own_order" ON public.product_orders FOR INSERT
  WITH CHECK (
    (user_id = auth.uid() AND status = 'pending')
    OR public.get_my_role() IN ('admin','master')
  );

SELECT 'RLS gaps fixed: notifications enabled, profiles self-update guarded, insert status pinned!' AS result;
