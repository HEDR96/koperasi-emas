-- ─────────────────────────────────────────────
-- Update 3: lacak SIAPA yang input & KAPAN transaksi terjadi
--   recorded_by      = user (admin/master/anggota) yang menginput
--   transaction_date = tanggal transaksi sebenarnya (diisi saat input)
--   created_at       = tetap waktu sistem saat row dibuat (kapan diinput)
-- ─────────────────────────────────────────────

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS recorded_by      UUID REFERENCES public.profiles(id);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS transaction_date TIMESTAMPTZ;

ALTER TABLE public.simpanan     ADD COLUMN IF NOT EXISTS recorded_by      UUID REFERENCES public.profiles(id);
ALTER TABLE public.simpanan     ADD COLUMN IF NOT EXISTS transaction_date TIMESTAMPTZ;

ALTER TABLE public.gadai        ADD COLUMN IF NOT EXISTS recorded_by      UUID REFERENCES public.profiles(id);
ALTER TABLE public.gadai        ADD COLUMN IF NOT EXISTS transaction_date TIMESTAMPTZ;

-- Backfill: anggap transaksi lama terjadi = saat dibuat
UPDATE public.transactions SET transaction_date = created_at WHERE transaction_date IS NULL;
UPDATE public.simpanan     SET transaction_date = created_at WHERE transaction_date IS NULL;
UPDATE public.gadai        SET transaction_date = COALESCE(tanggal_cair, created_at) WHERE transaction_date IS NULL;

SELECT 'Update3 selesai!' AS result;
