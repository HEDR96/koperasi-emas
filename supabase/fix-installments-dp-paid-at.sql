-- ============================================================
-- FIX: tambah kolom tanggal setor DP untuk installments (cicilan).
-- Diisi saat master approve pengajuan cicilan.
-- Idempotent, aman dijalankan berkali-kali.
-- ============================================================

ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS dp_paid_at DATE;

SELECT 'installments: dp_paid_at ditambahkan!' AS result;
