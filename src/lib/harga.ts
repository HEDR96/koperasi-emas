import { supabase } from "@/lib/supabase";

// Markup harga emas disimpan di site_settings sebagai Rupiah PER GRAM.
// Harga tampil = harga dasar + (markup per gram × berat gram).
// Harga dasar & nilai markup TIDAK pernah ditampilkan ke anggota/publik.
export const MARKUP_KEYS = {
  anggota: "markup_emas_anggota",
  nonAnggota: "markup_emas_non_anggota",
} as const;

export interface MarkupPerGram { anggota: number; nonAnggota: number; }

export async function getMarkup(): Promise<MarkupPerGram> {
  try {
    const { data } = await (supabase.from("site_settings") as any)
      .select("key,value")
      .in("key", [MARKUP_KEYS.anggota, MARKUP_KEYS.nonAnggota]);
    const map: Record<string, string> = {};
    (data || []).forEach((r: any) => { map[r.key] = r.value; });
    return {
      anggota: Number(map[MARKUP_KEYS.anggota]) || 0,
      nonAnggota: Number(map[MARKUP_KEYS.nonAnggota]) || 0,
    };
  } catch {
    return { anggota: 0, nonAnggota: 0 };
  }
}

export async function saveMarkup(m: MarkupPerGram): Promise<{ error?: string }> {
  try {
    const rows = [
      { key: MARKUP_KEYS.anggota,    value: String(Math.round(m.anggota)),    label: "Markup Emas Anggota (Rp/gram)",     type: "number", group_name: "Harga" },
      { key: MARKUP_KEYS.nonAnggota, value: String(Math.round(m.nonAnggota)), label: "Markup Emas Non-Anggota (Rp/gram)", type: "number", group_name: "Harga" },
    ];
    const { error } = await (supabase.from("site_settings") as any).upsert(rows, { onConflict: "key" });
    return error ? { error: error.message } : {};
  } catch (e: any) {
    return { error: e?.message || "Gagal menyimpan markup." };
  }
}

// Hitung harga jual = harga dasar + markup per gram × berat.
export function withMarkup(base: number, gram: number, markupPerGram: number): number {
  return Math.round(Number(base) + Number(markupPerGram) * Number(gram));
}
