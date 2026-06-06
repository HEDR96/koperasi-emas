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

// Harga tampil = harga dasar + markup tier (nominal, tidak dikali berat).
export function withMarkup(base: number, gram: number, map: MarkupMap): number {
  return Math.round(Number(base) + markupFor(map, gram));
}

// ─────────────────────────────────────────────────────────────
// CICILAN — dihitung otomatis dari harga emas (harga anggota).
// Tidak ada input/edit manual; semua diturunkan dari Harga Emas + markup anggota.
//
// Rumus (flat):
//   total harga cicilan = harga anggota + biaya admin + (harga anggota × margin%)
//   angsuran/bulan      = total ÷ tenor
// Total sama untuk semua tenor; hanya angsuran/bln yang berbeda.
// ─────────────────────────────────────────────────────────────
export const CICILAN_ADMIN_FEE = 100_000;      // biaya admin (Rp) ditambahkan sekali
export const CICILAN_MARGIN_PCT = 0.5;         // margin (% dari harga anggota)
export const CICILAN_TENORS = [12, 24, 36, 48, 60] as const;

// Total harga cicilan dari harga anggota.
export function cicilanTotal(hargaAnggota: number): number {
  return Math.round(
    Number(hargaAnggota) + CICILAN_ADMIN_FEE + Number(hargaAnggota) * (CICILAN_MARGIN_PCT / 100)
  );
}

// Angsuran per bulan = total ÷ tenor.
export function cicilanAngsuran(hargaAnggota: number, tenor: number): number {
  if (!tenor) return 0;
  return Math.round(cicilanTotal(hargaAnggota) / tenor);
}

export interface DerivedCicilan {
  gram: number;
  hargaAnggota: number;
  total: number;
  tenors: { tenor: number; angsuran: number }[];
}

// Bangun paket cicilan turunan dari baris harga emas + markup anggota.
export function buildDerivedCicilan(
  hargaEmasRows: { gram: number; harga: number }[],
  anggotaMap: MarkupMap
): DerivedCicilan[] {
  return [...hargaEmasRows]
    .map((r) => {
      const gram = Number(r.gram);
      const hargaAnggota = withMarkup(Number(r.harga), gram, anggotaMap);
      return {
        gram,
        hargaAnggota,
        total: cicilanTotal(hargaAnggota),
        tenors: CICILAN_TENORS.map((t) => ({ tenor: t, angsuran: cicilanAngsuran(hargaAnggota, t) })),
      };
    })
    .sort((a, b) => a.gram - b.gram);
}
