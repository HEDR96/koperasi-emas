-- ============================================================
-- Migration: Fitur Baru — Harga Per Berat, Cicilan, Testimoni, FAQ
-- Jalankan di: https://supabase.com/dashboard/project/ltmovptzzaufxxhxewbn/sql
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. HARGA EMAS PER BERAT (menggantikan 4 kartu harga landing)
-- kategori: 'emas' = harga beli, 'buyback' = harga buyback
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.harga_emas_berat (
  id          SERIAL      PRIMARY KEY,
  gram        DECIMAL(10,2) NOT NULL,
  harga       BIGINT      NOT NULL,
  kategori    TEXT        NOT NULL DEFAULT 'emas' CHECK (kategori IN ('emas','buyback')),
  updated_by  UUID        REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_harga_berat_gram_kat ON public.harga_emas_berat(gram, kategori, created_at DESC);

ALTER TABLE public.harga_emas_berat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "harga_berat_select" ON public.harga_emas_berat FOR SELECT USING (TRUE);
CREATE POLICY "harga_berat_insert" ON public.harga_emas_berat FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master')));

-- Seed data awal
INSERT INTO public.harga_emas_berat (gram, harga, kategori) VALUES
  (0.5,  849000,   'emas'),
  (1,    1698000,  'emas'),
  (2,    3396000,  'emas'),
  (5,    8490000,  'emas'),
  (10,   16980000, 'emas'),
  (25,   42450000, 'emas'),
  (50,   84900000, 'emas'),
  (100,  169800000,'emas'),
  (1,    1658000,  'buyback'),
  (5,    8290000,  'buyback'),
  (10,   16580000, 'buyback')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- 2. CICILAN HARGA (per berat + tenor, tanpa formula)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cicilan_harga (
  id                SERIAL      PRIMARY KEY,
  gram              DECIMAL(10,2) NOT NULL,
  tenor             INTEGER     NOT NULL,
  harga_jual        BIGINT      NOT NULL,
  angsuran          BIGINT      NOT NULL,
  uang_muka_persen  INTEGER     NOT NULL DEFAULT 10,
  updated_by        UUID        REFERENCES public.profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cicilan_gram_tenor ON public.cicilan_harga(gram, tenor);

ALTER TABLE public.cicilan_harga ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cicilan_harga_select" ON public.cicilan_harga FOR SELECT USING (TRUE);
CREATE POLICY "cicilan_harga_write" ON public.cicilan_harga FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master')));

-- ─────────────────────────────────────────────
-- 3. TESTIMONIALS (dikelola di dashboard)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.testimonials (
  id            SERIAL      PRIMARY KEY,
  nama          TEXT        NOT NULL,
  peran         TEXT        NOT NULL,
  inisial       TEXT,
  rating        INTEGER     NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  komentar      TEXT        NOT NULL,
  emas_saved    TEXT,
  tahun_gabung  INTEGER,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  urutan        INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "testimonials_select" ON public.testimonials FOR SELECT USING (TRUE);
CREATE POLICY "testimonials_write" ON public.testimonials FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master')));

INSERT INTO public.testimonials (nama, peran, inisial, rating, komentar, emas_saved, tahun_gabung, is_active, urutan) VALUES
  ('Budi Santoso',  'Pengusaha, Jakarta',           'BS', 5, 'Sudah 3 tahun menjadi anggota. Platform ini benar-benar memudahkan investasi emas saya. Proses buyback sangat cepat, dana cair dalam hitungan jam!', '125 gram', 2021, true, 1),
  ('Siti Rahayu',   'Ibu Rumah Tangga, Surabaya',   'SR', 5, 'Menabung emas mulai dari Rp 10.000 per hari. Tidak terasa sudah terkumpul 45 gram dalam 2 tahun. Sangat recommended untuk persiapan masa depan!', '45 gram',  2022, true, 2),
  ('Ahmad Fauzi',   'Karyawan Swasta, Bandung',      'AF', 5, 'Cicilan emas sangat membantu. Saya bisa memiliki emas 50 gram dengan cicilan yang ringan. Tim CS juga sangat responsif.', '50 gram',  2023, true, 3),
  ('Dewi Kartika',  'Dokter, Yogyakarta',            'DK', 5, 'Transparansi harga realtime sangat membantu pengambilan keputusan. Grafik dan analisis yang disediakan sangat informatif untuk investor serius.', '200 gram', 2020, true, 4),
  ('Rino Pratama',  'Freelancer, Bali',              'RP', 4, 'Program referralnya keren! Sudah dapat bonus Rp 1.5 juta hanya dari mengajak teman. Platform yang benar-benar menguntungkan dari berbagai sisi.', '30 gram',  2023, true, 5)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- 4. FAQ ITEMS (dikelola di dashboard)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.faq_items (
  id          SERIAL      PRIMARY KEY,
  pertanyaan  TEXT        NOT NULL,
  jawaban     TEXT        NOT NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  urutan      INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faq_select" ON public.faq_items FOR SELECT USING (TRUE);
CREATE POLICY "faq_write" ON public.faq_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master')));

INSERT INTO public.faq_items (pertanyaan, jawaban, is_active, urutan) VALUES
  ('Apakah Koperasi Emas sudah terdaftar secara resmi?', 'Ya, Koperasi Emas telah terdaftar dan memiliki badan hukum resmi dari Kementerian Koperasi dan UKM RI dengan nomor BH.0012345/KOP.2019. Koperasi kami beroperasi sesuai ketentuan perundang-undangan koperasi yang berlaku.', true, 1),
  ('Bagaimana cara mendaftar menjadi anggota?', 'Daftar mudah secara online: isi formulir, upload KTP & selfie, lalu setorkan simpanan pokok Rp 5.000.000 (sekali bayar, menjadi hak anggota) dan simpanan wajib Rp 200.000/bulan sebagai syarat aktif. Akun diaktivasi dalam 1x24 jam setelah verifikasi.', true, 2),
  ('Berapa minimal pembelian emas?', 'Minimal pembelian emas disesuaikan dengan pilihan berat yang tersedia. Silakan lihat tabel harga emas kami untuk pilihan gram yang tersedia.', true, 3),
  ('Bagaimana proses buyback emas?', 'Ajukan buyback melalui aplikasi atau website, tim kami akan memverifikasi dalam 2 jam, dan dana akan ditransfer ke rekening Anda dalam 1x24 jam di hari kerja.', true, 4),
  ('Apakah emas saya aman?', 'Sangat aman. Emas Anda disimpan di vault bersertifikat dengan asuransi penuh dari Asuransi Jasa Indonesia. Setiap gram emas tercatat secara transparan.', true, 5),
  ('Apa keuntungan menjadi anggota dibanding non-anggota?', 'Anggota mendapatkan harga beli lebih murah, harga buyback lebih tinggi, cicilan emas, bonus referral, SHU tahunan, akses promo eksklusif, dan layanan prioritas.', true, 6),
  ('Bagaimana cicilan emas bekerja?', 'Pilih produk emas berdasarkan berat dan tenor yang tersedia, bayar uang muka minimal 10%, dan cicil sisanya setiap bulan sesuai angsuran yang telah ditetapkan. Tanpa bunga untuk anggota aktif.', true, 7),
  ('Apa itu Gadai Simpanan dan bagaimana cara kerjanya?', 'Gadai simpanan memungkinkan anggota mencairkan pinjaman menggunakan simpanan sebagai jaminan. Simpanan Anda dikonversi ke nilai gram berdasarkan harga buyback, lalu Anda bisa mengajukan pinjaman. Pilih tenor 1-4 bulan dengan angsuran = pinjaman / tenor. Tombol gadai akan hilang selama ada gadai yang belum lunas.', true, 8),
  ('Apa itu SHU (Sisa Hasil Usaha)?', 'SHU adalah bagi hasil keuntungan koperasi yang dibagikan kepada anggota aktif setiap tahun. Besarnya proporsional berdasarkan total simpanan dan volume transaksi emas masing-masing anggota selama setahun. SHU merupakan hak eksklusif anggota koperasi.', true, 9),
  ('Apakah buyback dan gadai bisa dilakukan non-anggota?', 'Tidak. Buyback dengan harga terbaik dan fitur gadai simpanan hanya tersedia untuk anggota aktif yang telah memenuhi kewajiban simpanan pokok Rp 5.000.000 dan simpanan wajib Rp 200.000/bulan. Non-anggota hanya dapat membeli emas dengan harga umum.', true, 10)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- 5. SITE_SETTINGS (jika belum ada)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_settings (
  key         TEXT        PRIMARY KEY,
  value       TEXT,
  label       TEXT,
  type        TEXT,
  group_name  TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_select" ON public.site_settings;
DROP POLICY IF EXISTS "settings_write"  ON public.site_settings;
CREATE POLICY "settings_select" ON public.site_settings FOR SELECT USING (TRUE);
CREATE POLICY "settings_write" ON public.site_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','master')));

-- ─────────────────────────────────────────────
-- 6. TAMBAH KOLOM TENOR & ANGSURAN KE GADAI
-- ─────────────────────────────────────────────
ALTER TABLE public.gadai ADD COLUMN IF NOT EXISTS tenor              INTEGER NOT NULL DEFAULT 1 CHECK (tenor BETWEEN 1 AND 4);
ALTER TABLE public.gadai ADD COLUMN IF NOT EXISTS angsuran_per_bulan BIGINT  NOT NULL DEFAULT 0;
