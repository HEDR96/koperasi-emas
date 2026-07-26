-- ============================================================
-- FIX DATA: installments.paid_installments yang tidak cocok dengan
-- jumlah riwayat pembayaran asli di cicilan_pembayaran (akibat bug
-- lama di recordPayment() yang tidak cek error insert riwayat).
-- ============================================================

-- 1) Lihat dulu cicilan mana saja yang bermasalah (jalankan ini dulu untuk cek)
SELECT
  i.id, p.name AS anggota, i.product_name, i.paid_installments AS paid_di_installments,
  COUNT(cp.id) AS paid_asli_di_riwayat
FROM public.installments i
LEFT JOIN public.profiles p ON p.id = i.user_id
LEFT JOIN public.cicilan_pembayaran cp ON cp.installment_id = i.id
GROUP BY i.id, p.name, i.product_name, i.paid_installments
HAVING i.paid_installments <> COUNT(cp.id)
ORDER BY p.name;

-- 2) Kalau hasil di atas sesuai dugaan (paid_installments lebih besar dari riwayat asli),
--    jalankan UPDATE ini untuk menyamakan paid_installments dengan jumlah riwayat pembayaran asli,
--    dan kembalikan status ke 'active' kalau sebelumnya salah tercatat 'completed'.
UPDATE public.installments i
SET
  paid_installments = sub.cnt,
  status = CASE WHEN sub.cnt >= i.tenor THEN 'completed' ELSE 'active' END,
  next_due_date = CASE WHEN sub.cnt >= i.tenor THEN NULL ELSE i.next_due_date END
FROM (
  SELECT i2.id, COUNT(cp.id) AS cnt
  FROM public.installments i2
  LEFT JOIN public.cicilan_pembayaran cp ON cp.installment_id = i2.id
  GROUP BY i2.id
) sub
WHERE i.id = sub.id
  AND i.status NOT IN ('pending','ditolak')
  AND i.paid_installments <> sub.cnt;

SELECT 'installments: paid_installments disinkronkan dengan riwayat pembayaran asli!' AS result;
