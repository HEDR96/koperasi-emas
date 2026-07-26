-- ============================================================
-- FIX: approve/tolak pengajuan cicilan HANYA boleh oleh role master.
-- UI sudah disembunyikan untuk admin, tapi ini menegakkan aturannya
-- di level database juga (bukan cuma sembunyi tombol) supaya tidak
-- bisa dilewati lewat API langsung.
--
-- Pembayaran angsuran oleh admin (paid_installments naik, status
-- active -> completed) TETAP diperbolehkan — trigger ini hanya
-- mengunci transisi status KELUAR DARI 'pending' (approve/tolak).
-- Idempotent, aman dijalankan berkali-kali.
-- ============================================================

CREATE OR REPLACE FUNCTION public.installments_guard_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF public.get_my_role() <> 'master' THEN
      RAISE EXCEPTION 'Hanya master yang bisa menyetujui/menolak pengajuan cicilan.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_installments_guard_approval ON public.installments;
CREATE TRIGGER trg_installments_guard_approval
  BEFORE UPDATE ON public.installments
  FOR EACH ROW EXECUTE FUNCTION public.installments_guard_approval();

SELECT 'installments: approve/tolak sekarang hanya untuk master (DB-level)!' AS result;
