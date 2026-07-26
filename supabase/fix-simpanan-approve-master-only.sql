-- ============================================================
-- FIX: approve/tolak setoran simpanan (dari pengajuan mandiri member
-- lewat "Ajukan Transaksi") HANYA boleh oleh role master — konsisten
-- dengan cicilan/gadai/transaksi/promo.
--
-- UI sudah disembunyikan untuk admin di src/app/dashboard/admin/simpanan/page.tsx
-- (dan src/app/dashboard/master/simpanan/page.tsx yang re-export halaman yang sama).
-- Trigger ini menegakkan aturan yang sama di level database.
--
-- Input simpanan langsung oleh admin (fungsi save() di halaman yang sama,
-- INSERT dengan status "completed" dari awal) TIDAK terpengaruh — trigger
-- ini cuma mengunci UPDATE yang mengubah status KELUAR DARI 'pending'.
--
-- Idempotent, aman dijalankan berkali-kali.
-- ============================================================

CREATE OR REPLACE FUNCTION public.simpanan_guard_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF public.get_my_role() <> 'master' THEN
      RAISE EXCEPTION 'Hanya master yang bisa menyetujui/menolak setoran simpanan.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_simpanan_guard_approval ON public.simpanan;
CREATE TRIGGER trg_simpanan_guard_approval
  BEFORE UPDATE ON public.simpanan
  FOR EACH ROW EXECUTE FUNCTION public.simpanan_guard_approval();

SELECT 'simpanan: approve/tolak sekarang hanya untuk master (DB-level)!' AS result;
