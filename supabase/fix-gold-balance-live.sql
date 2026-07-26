-- ============================================================
-- FIX: total emas ("Emas Tersimpan" / gold_grams) tidak pernah
-- benar — profiles.gold_grams cuma di-set 0 saat registrasi dan
-- TIDAK PERNAH di-update oleh kode manapun (beli emas, buyback,
-- maupun cicilan). Dan cicilan juga tidak pernah tercatat di
-- tabel transactions, jadi gram-nya tidak pernah ikut terhitung.
--
-- Solusi: hitung total gram secara LIVE (bukan kolom tersimpan)
-- dari gabungan transactions (buy/tabungan completed - buyback
-- completed) + installments (total_gram untuk status
-- active/completed/overdue -- cicilan dihitung SEJAK disetujui,
-- tidak perlu menunggu lunas, karena emasnya sudah jadi milik
-- anggota begitu status aktif).
--
-- Idempotent, aman dijalankan berkali-kali.
-- ============================================================

CREATE OR REPLACE FUNCTION public.member_total_gold(p_user_id UUID)
RETURNS NUMERIC LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT GREATEST(0,
    COALESCE((
      SELECT SUM(CASE WHEN t.type IN ('buy','tabungan') THEN t.gram
                       WHEN t.type = 'buyback' THEN -t.gram
                       ELSE 0 END)
      FROM public.transactions t
      WHERE t.user_id = p_user_id AND t.status = 'completed' AND t.gram IS NOT NULL
    ), 0)
    +
    COALESCE((
      SELECT SUM(i.total_gram)
      FROM public.installments i
      WHERE i.user_id = p_user_id AND i.status IN ('active','completed','overdue')
    ), 0)
  );
$$;

GRANT EXECUTE ON FUNCTION public.member_total_gold(UUID) TO authenticated;

-- Versi massal untuk daftar anggota (Kelola Anggota) supaya tidak perlu 1 query per anggota.
CREATE OR REPLACE FUNCTION public.all_members_gold()
RETURNS TABLE(user_id UUID, total_gram NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id,
    GREATEST(0,
      COALESCE((
        SELECT SUM(CASE WHEN t.type IN ('buy','tabungan') THEN t.gram
                         WHEN t.type = 'buyback' THEN -t.gram
                         ELSE 0 END)
        FROM public.transactions t
        WHERE t.user_id = p.id AND t.status = 'completed' AND t.gram IS NOT NULL
      ), 0)
      +
      COALESCE((
        SELECT SUM(i.total_gram)
        FROM public.installments i
        WHERE i.user_id = p.id AND i.status IN ('active','completed','overdue')
      ), 0)
    )
  FROM public.profiles p
  WHERE p.role = 'member' OR p.is_member = true;
$$;

GRANT EXECUTE ON FUNCTION public.all_members_gold() TO authenticated;

SELECT 'member_total_gold + all_members_gold siap dipakai!' AS result;
