-- ============================================================
-- FIX: approve/tolak pesanan produk (product_orders) dan listing
-- produk yang diajukan member (promos.approval_status) HANYA
-- boleh oleh role master — konsisten dengan cicilan/gadai/transaksi.
--
-- UI sudah disembunyikan untuk admin di src/app/dashboard/admin/promo/page.tsx.
-- Trigger ini menegakkan aturan yang sama di level database.
--
-- Idempotent, aman dijalankan berkali-kali.
-- ============================================================

CREATE OR REPLACE FUNCTION public.product_orders_guard_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF public.get_my_role() <> 'master' THEN
      RAISE EXCEPTION 'Hanya master yang bisa menyetujui/menolak pesanan produk.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_orders_guard_approval ON public.product_orders;
CREATE TRIGGER trg_product_orders_guard_approval
  BEFORE UPDATE ON public.product_orders
  FOR EACH ROW EXECUTE FUNCTION public.product_orders_guard_approval();

CREATE OR REPLACE FUNCTION public.promos_guard_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.approval_status = 'pending' AND NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    IF public.get_my_role() <> 'master' THEN
      RAISE EXCEPTION 'Hanya master yang bisa menyetujui/menolak produk yang diajukan.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_promos_guard_approval ON public.promos;
CREATE TRIGGER trg_promos_guard_approval
  BEFORE UPDATE ON public.promos
  FOR EACH ROW EXECUTE FUNCTION public.promos_guard_approval();

SELECT 'product_orders + promos: approve/tolak sekarang hanya untuk master (DB-level)!' AS result;
