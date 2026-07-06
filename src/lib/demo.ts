// Demo-mode: dipakai HANYA oleh deployment terpisah untuk keperluan showcase
// portofolio (mis. saat diakses lewat afss.tech). Saat NEXT_PUBLIC_DEMO_MODE
// tidak diset "true" (default di production koperasiemas.com), seluruh logic
// di file ini tidak pernah dipakai — situs asli & data anggota tidak terpengaruh.

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export const DEMO_HARGA_EMAS_BERAT = [
  { gram: 0.5, harga: 850_000 },
  { gram: 1,   harga: 1_695_000 },
  { gram: 2,   harga: 3_380_000 },
  { gram: 5,   harga: 8_450_000 },
  { gram: 10,  harga: 16_850_000 },
  { gram: 25,  harga: 42_100_000 },
  { gram: 50,  harga: 84_000_000 },
  { gram: 100, harga: 167_500_000 },
];

export const DEMO_BUYBACK_PRICE_PER_GRAM = 1_625_000;

export const DEMO_MARKUP = { anggota: {}, nonAnggota: {} };

export const DEMO_CICILAN_PARAMS = {
  adminAnggota: 50_000,
  adminNonAnggota: 75_000,
  persenBulanAnggota: 0.6,
  persenBulanNonAnggota: 0.8,
  persenDpAnggota: 10,
  persenDpNonAnggota: 15,
};

export const DEMO_TESTIMONIALS = [
  { id: 1, nama: "Siti Aminah",  peran: "Ibu Rumah Tangga", inisial: "SA", rating: 5, komentar: "Menabung emas jadi gampang banget, tiap bulan nyicil dikit-dikit sekarang udah punya 15 gram!", emas_saved: "15 gram", tahun_gabung: 2022 },
  { id: 2, nama: "Budi Santoso", peran: "Wiraswasta",       inisial: "BS", rating: 5, komentar: "Proses buyback cepat, dana cair kurang dari sehari. Sangat membantu pas butuh dana darurat.", emas_saved: "32 gram", tahun_gabung: 2021 },
  { id: 3, nama: "Rina Wijaya",  peran: "Karyawan Swasta",  inisial: "RW", rating: 4, komentar: "Cicilan emas tanpa bunga buat saya yang gajian bulanan jadi solusi investasi yang aman.", emas_saved: "8 gram", tahun_gabung: 2023 },
];
