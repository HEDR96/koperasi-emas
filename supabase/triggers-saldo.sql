-- ============================================================
-- Auto-update profiles.gold_grams & rupiah_balance
-- Jalankan di Supabase > SQL Editor (aman diulang).
--   gold_grams     = Σ gram transaksi completed (buy/cicilan/tabungan − buyback)
--   rupiah_balance = Σ nominal simpanan completed (saldo simpanan)
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
    ), 0)
  WHERE p.id = p_user;
$$;

-- Trigger function (dipakai transactions & simpanan)
CREATE OR REPLACE FUNCTION public.trg_recalc_balances()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_member_balances(OLD.user_id);
    RETURN OLD;
  END IF;
  PERFORM public.recalc_member_balances(NEW.user_id);
  IF TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    PERFORM public.recalc_member_balances(OLD.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tx_balances ON public.transactions;
CREATE TRIGGER trg_tx_balances
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_balances();

DROP TRIGGER IF EXISTS trg_sim_balances ON public.simpanan;
CREATE TRIGGER trg_sim_balances
  AFTER INSERT OR UPDATE OR DELETE ON public.simpanan
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_balances();

-- Backfill data yang sudah ada
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.recalc_member_balances(r.id);
  END LOOP;
END $$;

SELECT 'Trigger saldo aktif + backfill selesai!' AS result;
