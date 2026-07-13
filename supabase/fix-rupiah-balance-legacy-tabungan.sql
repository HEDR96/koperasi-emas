-- ============================================================
-- Fix: rupiah_balance belum menghitung transaksi lama type='tabungan'
-- (setoran sebelum migrasi ke tabel `simpanan`)
-- Jalankan di: Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.recalc_member_balances(p_user uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.profiles p SET
    gold_grams = COALESCE((
      SELECT SUM(CASE
                   WHEN t.type IN ('buy','cicilan','tabungan') THEN COALESCE(t.gram,0)
                   WHEN t.type = 'buyback' THEN -COALESCE(t.gram,0)
                   ELSE 0 END)
      FROM public.transactions t
      WHERE t.user_id = p_user AND t.status = 'completed'
    ), 0),
    rupiah_balance = COALESCE((
      SELECT SUM(s.amount) FROM public.simpanan s
      WHERE s.user_id = p_user AND s.status = 'completed'
    ), 0) + COALESCE((
      SELECT SUM(t.amount) FROM public.transactions t
      WHERE t.user_id = p_user AND t.status = 'completed' AND t.type = 'tabungan'
    ), 0)
  WHERE p.id = p_user;
$$;

-- Backfill ulang semua member dengan formula baru
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.recalc_member_balances(r.id);
  END LOOP;
END $$;

SELECT 'rupiah_balance sudah menghitung transaksi tabungan lama + backfill selesai!' AS result;
