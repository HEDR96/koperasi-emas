-- ============================================================
-- Member bisa ajukan produk sendiri (dibatasi kuota, approve oleh admin/master)
-- Jalankan di: Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. KOLOM BARU DI promos — jejak pengaju & status approval
-- ─────────────────────────────────────────────
ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS submitted_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('pending','approved','rejected'));
ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS approved_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS approved_at     TIMESTAMPTZ;

-- ─────────────────────────────────────────────
-- 2. KUOTA PRODUK PER MEMBER (default 3, admin/master bisa naikkan)
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS product_quota INTEGER NOT NULL DEFAULT 3;

-- ─────────────────────────────────────────────
-- 3. RLS — member boleh INSERT produk miliknya sendiri (status pending)
--    Kebijakan admin/master (promos_write) tetap berlaku terpisah untuk
--    approve/edit/delete/toggle apa pun.
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "promos_insert_member" ON public.promos;
CREATE POLICY "promos_insert_member" ON public.promos
  FOR INSERT
  WITH CHECK (
    public.get_my_role() = 'member' AND submitted_by = auth.uid()
  );

-- ─────────────────────────────────────────────
-- 4. TRIGGER — tegakkan kuota di level database (bukan cuma client-side),
--    supaya tidak bisa dilewati lewat panggilan API langsung.
--    Produk yang ditolak (rejected) tidak dihitung ke kuota, supaya member
--    tetap bisa mengajukan pengganti.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_member_product_quota()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  quota INTEGER;
  used  INTEGER;
BEGIN
  IF NEW.submitted_by IS NULL THEN
    RETURN NEW; -- produk dari admin/master/otomatis tidak kena kuota
  END IF;

  SELECT product_quota INTO quota FROM public.profiles WHERE id = NEW.submitted_by;
  SELECT COUNT(*) INTO used FROM public.promos
    WHERE submitted_by = NEW.submitted_by AND approval_status <> 'rejected';

  IF used >= COALESCE(quota, 3) THEN
    RAISE EXCEPTION 'Kuota produk sudah tercapai (maks %). Hubungi admin untuk menambah kuota.', COALESCE(quota, 3);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_product_quota ON public.promos;
CREATE TRIGGER trg_check_product_quota
  BEFORE INSERT ON public.promos
  FOR EACH ROW EXECUTE FUNCTION public.check_member_product_quota();
