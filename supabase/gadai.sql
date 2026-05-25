-- ════════════════════════════════════════════════════════
--  GADAI EMAS — Tabel pinjaman dengan jaminan simpanan
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.gadai (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Nilai jaminan (simpanan yg dijaminkan)
  nilai_jaminan       BIGINT NOT NULL,
  -- Harga buyback saat pengajuan
  harga_buyback       BIGINT NOT NULL,
  -- Gram emas setara (nilai_jaminan / harga_buyback)
  gram_setara         NUMERIC(10,4) NOT NULL,
  -- Dana yang dicairkan ke member
  dana_cair           BIGINT NOT NULL,
  -- Sisa yang belum dilunasi
  sisa_tagihan        BIGINT NOT NULL DEFAULT 0,
  -- Status: pengajuan → disetujui → aktif → lunas / gagal_bayar
  status              TEXT NOT NULL DEFAULT 'pengajuan'
                        CHECK (status IN ('pengajuan','disetujui','aktif','lunas','ditolak','gagal_bayar')),
  -- Catatan pengajuan member
  keterangan          TEXT,
  -- Admin yg approve
  verified_by         UUID REFERENCES public.profiles(id),
  catatan_admin       TEXT,
  -- Tanggal
  tanggal_cair        TIMESTAMPTZ,
  tanggal_lunas       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_gadai_user_id ON public.gadai(user_id);
CREATE INDEX IF NOT EXISTS idx_gadai_status   ON public.gadai(status);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_gadai_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_gadai_updated_at ON public.gadai;
CREATE TRIGGER trg_gadai_updated_at
  BEFORE UPDATE ON public.gadai
  FOR EACH ROW EXECUTE FUNCTION update_gadai_updated_at();

-- RLS
ALTER TABLE public.gadai ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member_own_gadai"   ON public.gadai;
DROP POLICY IF EXISTS "admin_all_gadai"    ON public.gadai;
DROP POLICY IF EXISTS "master_all_gadai"   ON public.gadai;

CREATE POLICY "member_own_gadai" ON public.gadai
  FOR ALL USING (
    auth.uid() = user_id
  );

CREATE POLICY "admin_all_gadai" ON public.gadai
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','master'))
  );

-- ════════════════════
--  SHU TABLE
-- ════════════════════
CREATE TABLE IF NOT EXISTS public.shu (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tahun       INTEGER NOT NULL,
  jumlah      BIGINT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','dibayar')),
  keterangan  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shu_user_tahun ON public.shu(user_id, tahun);
CREATE INDEX IF NOT EXISTS idx_shu_user_id ON public.shu(user_id);

ALTER TABLE public.shu ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member_own_shu" ON public.shu;
DROP POLICY IF EXISTS "admin_all_shu"  ON public.shu;

CREATE POLICY "member_own_shu" ON public.shu
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "admin_all_shu" ON public.shu
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','master'))
  );
