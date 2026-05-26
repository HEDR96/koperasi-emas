-- ============================================================
-- PROMO SYSTEM — Run in Supabase SQL Editor
-- ============================================================

-- 1. Extend existing promos table
ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'harga' CHECK (type IN ('harga','cashback','diskon','bonus'));

-- 2. Promo gram prices table
CREATE TABLE IF NOT EXISTS public.promo_gram_prices (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id        UUID        NOT NULL REFERENCES public.promos(id) ON DELETE CASCADE,
  gram_weight     NUMERIC(10,3) NOT NULL,
  price_member    BIGINT      NOT NULL DEFAULT 0,
  price_non_member BIGINT     NOT NULL DEFAULT 0,
  buyback_price   BIGINT      NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(promo_id, gram_weight)
);

-- 3. RLS
ALTER TABLE public.promo_gram_prices ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "promo_gram_select" ON public.promo_gram_prices
  FOR SELECT USING (TRUE);

-- Only admin/master can write
CREATE POLICY "promo_gram_write" ON public.promo_gram_prices
  FOR ALL
  USING (public.get_my_role() IN ('admin', 'master'))
  WITH CHECK (public.get_my_role() IN ('admin', 'master'));

-- Also ensure promos write policy exists
DROP POLICY IF EXISTS "promos_write" ON public.promos;
CREATE POLICY "promos_write" ON public.promos
  FOR ALL
  USING (public.get_my_role() IN ('admin', 'master'))
  WITH CHECK (public.get_my_role() IN ('admin', 'master'));
