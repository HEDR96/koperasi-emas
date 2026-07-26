-- ============================================================
-- FIX: installments belum punya jejak approval (siapa & kapan).
-- Idempotent, aman dijalankan berkali-kali.
-- ============================================================

ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.installments ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

SELECT 'installments: approved_by + approved_at ditambahkan!' AS result;
