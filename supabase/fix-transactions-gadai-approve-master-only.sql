-- ============================================================
-- FIX: approve/tolak transaksi (beli emas, buyback, dll) dan gadai
-- HANYA boleh oleh role master — menyusul aturan yang sama yang
-- sudah diterapkan ke installments (cicilan).
--
-- UI sudah disembunyikan untuk admin di:
--   - src/app/dashboard/admin/page.tsx (widget approve cepat)
--   - src/app/dashboard/admin/transaksi/page.tsx
--   - src/app/dashboard/admin/gadai/page.tsx
--   - src/app/dashboard/master/approval/page.tsx (Pusat Approval)
-- Trigger ini menegakkan aturan yang sama di level database supaya
-- tidak bisa dilewati lewat API langsung.
--
-- Pencatatan pembayaran/pelunasan oleh admin TETAP jalan normal:
--   - transactions: trigger hanya mengunci transisi KELUAR DARI
--     'pending'/'processing' (approve/tolak pengajuan awal).
--   - gadai: trigger hanya mengunci transisi KELUAR DARI 'pengajuan'
--     (approve/tolak pengajuan awal). Pencatatan angsuran/pelunasan
--     (aktif -> lunas) tidak melewati status 'pengajuan' jadi aman.
--
-- Idempotent, aman dijalankan berkali-kali.
-- ============================================================

CREATE OR REPLACE FUNCTION public.transactions_guard_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status IN ('pending','processing') AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF public.get_my_role() <> 'master' THEN
      RAISE EXCEPTION 'Hanya master yang bisa menyetujui/menolak transaksi.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_transactions_guard_approval ON public.transactions;
CREATE TRIGGER trg_transactions_guard_approval
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.transactions_guard_approval();

CREATE OR REPLACE FUNCTION public.gadai_guard_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status = 'pengajuan' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF public.get_my_role() <> 'master' THEN
      RAISE EXCEPTION 'Hanya master yang bisa menyetujui/menolak pengajuan gadai.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gadai_guard_approval ON public.gadai;
CREATE TRIGGER trg_gadai_guard_approval
  BEFORE UPDATE ON public.gadai
  FOR EACH ROW EXECUTE FUNCTION public.gadai_guard_approval();

SELECT 'transactions + gadai: approve/tolak sekarang hanya untuk master (DB-level)!' AS result;
