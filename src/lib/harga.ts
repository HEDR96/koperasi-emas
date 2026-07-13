import { supabase } from "@/lib/supabase";

// Markup harga emas disimpan PER GRAM TIER (per baris berat), bukan satu nilai global.
// Tiap berat (0.5, 1, 2, ... 100) punya markup sendiri (nominal Rupiah, ditambahkan langsung).
// Disimpan di site_settings sebagai JSON map { "<gram>": <rupiah> }.
// Harga tampil = harga dasar + markup tier tsb. Harga dasar & markup tidak ditampilkan ke anggota/publik.
export const MARKUP_KEYS = {
  anggota: "markup_emas_anggota_map",
  nonAnggota: "markup_emas_non_anggota_map",
} as const;

export type MarkupMap = Record<string, number>;
export interface Markup { anggota: MarkupMap; nonAnggota: MarkupMap; }

function parseMap(s: string | undefined | null): MarkupMap {
  try {
    const obj = JSON.parse(s || "{}") || {};
    const out: MarkupMap = {};
    Object.keys(obj).forEach(k => { out[String(Number(k))] = Number(obj[k]) || 0; });
    return out;
  } catch {
    return {};
  }
}

export async function getMarkup(): Promise<Markup> {
  try {
    const { data } = await (supabase.from("site_settings") as any)
      .select("key,value")
      .in("key", [MARKUP_KEYS.anggota, MARKUP_KEYS.nonAnggota]);
    const map: Record<string, string> = {};
    (data || []).forEach((r: any) => { map[r.key] = r.value; });
    return {
      anggota: parseMap(map[MARKUP_KEYS.anggota]),
      nonAnggota: parseMap(map[MARKUP_KEYS.nonAnggota]),
    };
  } catch {
    return { anggota: {}, nonAnggota: {} };
  }
}

export async function saveMarkup(m: Markup): Promise<{ error?: string }> {
  try {
    const clean = (map: MarkupMap) => {
      const out: Record<string, number> = {};
      Object.keys(map).forEach(k => { const v = Number(map[k]) || 0; if (v) out[String(Number(k))] = Math.round(v); });
      return out;
    };
    const rows = [
      { key: MARKUP_KEYS.anggota,    value: JSON.stringify(clean(m.anggota)),    label: "Markup Emas Anggota per gram (Rp)",     type: "json", group_name: "Harga" },
      { key: MARKUP_KEYS.nonAnggota, value: JSON.stringify(clean(m.nonAnggota)), label: "Markup Emas Non-Anggota per gram (Rp)", type: "json", group_name: "Harga" },
    ];
    const { error } = await (supabase.from("site_settings") as any).upsert(rows, { onConflict: "key" });
    return error ? { error: error.message } : {};
  } catch (e: any) {
    return { error: e?.message || "Gagal menyimpan markup." };
  }
}

// Nilai markup untuk satu berat tertentu.
export function markupFor(map: MarkupMap, gram: number): number {
  return Number(map?.[String(Number(gram))]) || 0;
}

// ─────────────────────────────────────────────────────────────
// PRODUK EMAS OTOMATIS — setiap baris Harga Emas disinkronkan jadi
// satu produk di menu Produk (promos, is_gold_auto=true). Harga produk
// selalu mengikuti harga emas + markup anggota terbaru; title/deskripsi/
// foto/stok yang sudah diisi admin TIDAK ditimpa, hanya price yang diupdate.
// ─────────────────────────────────────────────────────────────
export async function syncGoldProducts(
  rows: { gram: number; harga: number }[],
  markupMap: MarkupMap
): Promise<void> {
  try {
    const { data: existing } = await (supabase.from("promos") as any)
      .select("id, gram_weight")
      .eq("is_gold_auto", true);
    const byGram = new Map<number, string>();
    (existing || []).forEach((p: any) => byGram.set(Number(p.gram_weight), p.id));

    for (const r of rows) {
      const gram = Number(r.gram);
      const price = withMarkup(Number(r.harga), gram, markupMap);
      const existingId = byGram.get(gram);
      if (existingId) {
        await (supabase.from("promos") as any).update({ price }).eq("id", existingId);
      } else {
        const gramLabel = gram % 1 === 0 ? String(gram) : gram.toFixed(2);
        await (supabase.from("promos") as any).insert({
          title: `Emas Antam ${gramLabel}gr`,
          gram_weight: gram,
          price,
          stok: 0,
          is_active: true,
          is_gold_auto: true,
          discount_percent: 0,
        });
      }
    }
  } catch {
    // sinkronisasi produk emas gagal diam-diam — admin masih bisa lihat/atur manual di menu Produk
  }
}

// Harga tampil = harga dasar + markup tier (nominal, tidak dikali berat).
export function withMarkup(base: number, gram: number, map: MarkupMap): number {
  return Math.round(Number(base) + markupFor(map, gram));
}

// ─────────────────────────────────────────────────────────────
// CICILAN — dihitung otomatis dari harga emas + parameter pengaturan.
// Tidak ada input/edit manual; semua diturunkan dari Harga Emas + markup
// anggota + parameter cicilan (admin, % per bulan, % DP) di Pengaturan.
//
// Rumus per tenor (t bulan):
//   a  = harga emas anggota + admin anggota
//   b  = a × (% per bulan ÷ 100) × t                 ← bunga akumulasi per bulan (untuk total)
//   dp = (a + a × (% per bulan ÷ 100)) × (% DP ÷ 100) ← uang muka, TIDAK tergantung tenor
//   harga cicilan = a + b − dp
//   angsuran/bln  = harga cicilan ÷ t
//
// Catatan: DP sengaja TIDAK mengandung tenor → nilainya sama untuk semua tenor,
// hanya berbeda saat harga emas berbeda (sesuai jenis anggota/non-anggota).
// ─────────────────────────────────────────────────────────────
export const CICILAN_KEYS = {
  adminAnggota:          "cicilan_admin_anggota",
  adminNonAnggota:       "cicilan_admin_non_anggota",
  persenBulanAnggota:    "cicilan_persen_bulan_anggota",
  persenBulanNonAnggota: "cicilan_persen_bulan_non_anggota",
  persenDpAnggota:       "cicilan_persen_dp_anggota",
  persenDpNonAnggota:    "cicilan_persen_dp_non_anggota",
} as const;

export interface CicilanParams {
  adminAnggota: number;          // Rp
  adminNonAnggota: number;       // Rp
  persenBulanAnggota: number;    // %
  persenBulanNonAnggota: number; // %
  persenDpAnggota: number;       // %
  persenDpNonAnggota: number;    // %
}

export const CICILAN_PARAM_DEFAULTS: CicilanParams = {
  adminAnggota: 0, adminNonAnggota: 0,
  persenBulanAnggota: 0, persenBulanNonAnggota: 0,
  persenDpAnggota: 0, persenDpNonAnggota: 0,
};

export const CICILAN_TENORS = [3, 6, 12, 24, 36, 48, 60] as const;

export async function getCicilanParams(): Promise<CicilanParams> {
  try {
    const { data } = await (supabase.from("site_settings") as any)
      .select("key,value").in("key", Object.values(CICILAN_KEYS));
    const map: Record<string, string> = {};
    (data || []).forEach((r: any) => { map[r.key] = r.value; });
    const num = (k: string) => Number(map[k]) || 0;
    return {
      adminAnggota:          num(CICILAN_KEYS.adminAnggota),
      adminNonAnggota:       num(CICILAN_KEYS.adminNonAnggota),
      persenBulanAnggota:    num(CICILAN_KEYS.persenBulanAnggota),
      persenBulanNonAnggota: num(CICILAN_KEYS.persenBulanNonAnggota),
      persenDpAnggota:       num(CICILAN_KEYS.persenDpAnggota),
      persenDpNonAnggota:    num(CICILAN_KEYS.persenDpNonAnggota),
    };
  } catch {
    return { ...CICILAN_PARAM_DEFAULTS };
  }
}

// DP / uang muka = (a + a × bunga) × % DP. TIDAK tergantung tenor.
export function cicilanDpFlat(
  hargaEmas: number, admin: number, persenBulan: number, persenDp: number
): number {
  const a = Number(hargaEmas) + Number(admin);
  const dpBase = a + a * (Number(persenBulan) / 100);
  return Math.round(dpBase * (Number(persenDp) / 100));
}

// Harga cicilan (a + b − dp) untuk satu tenor.
export function cicilanHargaTenor(
  hargaEmas: number, tenor: number, admin: number, persenBulan: number, persenDp: number
): number {
  const a = Number(hargaEmas) + Number(admin);
  const b = a * (Number(persenBulan) / 100) * Number(tenor);
  const dp = cicilanDpFlat(hargaEmas, admin, persenBulan, persenDp);
  return Math.round(a + b - dp);
}

// Angsuran/bln = harga cicilan ÷ tenor.
export function cicilanAngsuranTenor(
  hargaEmas: number, tenor: number, admin: number, persenBulan: number, persenDp: number
): number {
  if (!tenor) return 0;
  return Math.round(cicilanHargaTenor(hargaEmas, tenor, admin, persenBulan, persenDp) / tenor);
}

// DP / uang muka — tidak tergantung tenor. (tenor diabaikan, dipertahankan agar
// pemanggil lama tetap kompatibel)
export function cicilanDpTenor(
  hargaEmas: number, _tenor: number, admin: number, persenBulan: number, persenDp: number
): number {
  return cicilanDpFlat(hargaEmas, admin, persenBulan, persenDp);
}

// ─────────────────────────────────────────────────────────────
// GADAI — parameter pinjaman gadai simpanan
// Rumus:
//   nilai_gadai_max = total_simpanan × 80% − admin_gadai
//   angsuran/bln    = nilai_gadai × (1 + persen_gadai/100) ÷ tenor
// ─────────────────────────────────────────────────────────────
export const GADAI_KEYS = {
  adminAnggota:  "gadai_admin_anggota",
  persenAnggota: "gadai_persen_anggota",
} as const;

export interface GadaiParams {
  adminAnggota:  number;   // Rp — biaya admin dipotong dari nilai gadai
  persenAnggota: number;   // % — bunga flat gadai
}
export const GADAI_PARAM_DEFAULTS: GadaiParams = { adminAnggota: 0, persenAnggota: 0 };

export async function getGadaiParams(): Promise<GadaiParams> {
  try {
    const { data } = await (supabase.from("site_settings") as any)
      .select("key,value").in("key", Object.values(GADAI_KEYS));
    const map: Record<string, string> = {};
    (data || []).forEach((r: any) => { map[r.key] = r.value; });
    const num = (k: string) => Number(map[k]) || 0;
    return { adminAnggota: num(GADAI_KEYS.adminAnggota), persenAnggota: num(GADAI_KEYS.persenAnggota) };
  } catch { return { ...GADAI_PARAM_DEFAULTS }; }
}

// Nilai gadai maksimal (Rp) = totalSimpanan × 80% − admin
export function nilaiGadaiMax(totalSimpanan: number, admin: number): number {
  return Math.max(0, Math.round(totalSimpanan * 0.8 - admin));
}

// Angsuran per bulan = nilai_gadai × (1 + persen/100) ÷ tenor
export function angsuranGadai(nilaiGadai: number, persenGadai: number, tenor: number): number {
  if (!tenor || !nilaiGadai) return 0;
  return Math.ceil(nilaiGadai * (1 + persenGadai / 100) / tenor);
}

export type CicilanKind = "anggota" | "nonAnggota";

export interface DerivedCicilan {
  gram: number;
  hargaAnggota: number; // harga emas (termasuk markup sesuai kind), sebelum admin/bunga/DP
  tenors: {
    tenor: number;
    totalSebelumDp: number; // a + b  (total harga sebelum dikurangi DP)
    dp: number;             // c      (uang muka yang disetor di awal)
    total: number;          // a+b-c  (sisa yang dicicil per bulan × tenor)
    angsuran: number;       // (a+b-c) ÷ tenor
  }[];
}

// Ambil tiga parameter (admin, % per bulan, % DP) sesuai jenis harga.
export function cicilanParamsFor(params: CicilanParams, kind: CicilanKind) {
  return kind === "nonAnggota"
    ? { admin: params.adminNonAnggota, persenBulan: params.persenBulanNonAnggota, persenDp: params.persenDpNonAnggota }
    : { admin: params.adminAnggota,    persenBulan: params.persenBulanAnggota,    persenDp: params.persenDpAnggota };
}

// Bangun paket cicilan turunan dari baris harga emas + markup + parameter.
//   kind="anggota"    → harga + admin + %/bln + %DP anggota (dipakai di login anggota)
//   kind="nonAnggota" → versi non-anggota (dipakai di landing page publik)
// markupMap harus sesuai kind (markup.anggota atau markup.nonAnggota); kirim {} bila
// harga di hargaEmasRows sudah termasuk markup.
export function buildDerivedCicilan(
  hargaEmasRows: { gram: number; harga: number }[],
  markupMap: MarkupMap,
  params: CicilanParams = CICILAN_PARAM_DEFAULTS,
  kind: CicilanKind = "anggota"
): DerivedCicilan[] {
  const { admin, persenBulan, persenDp } = cicilanParamsFor(params, kind);
  return [...hargaEmasRows]
    .map((r) => {
      const gram = Number(r.gram);
      const harga = withMarkup(Number(r.harga), gram, markupMap);
      return {
        gram,
        hargaAnggota: harga,
        tenors: CICILAN_TENORS.map((t) => {
          const a = harga + admin;
          const b = a * (persenBulan / 100) * t;
          const dp = cicilanDpFlat(harga, admin, persenBulan, persenDp); // flat, tanpa tenor
          const total = Math.round(a + b - dp);   // sisa yang dicicil
          return {
            tenor: t,
            totalSebelumDp: Math.round(a + b),
            dp,
            total,
            angsuran: t > 0 ? Math.round(total / t) : 0,
          };
        }),
      };
    })
    .sort((a, b) => a.gram - b.gram);
}
