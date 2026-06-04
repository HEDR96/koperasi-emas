import { supabase } from "@/lib/supabase";

// Peta id → nama untuk semua staff (admin/master) + (opsional) cache ringan.
// Dipakai untuk menampilkan "diinput oleh siapa" pada daftar transaksi/simpanan/gadai.
export async function getStaffMap(): Promise<Record<string, string>> {
  try {
    const { data } = await (supabase.from("profiles") as any)
      .select("id,name,role")
      .in("role", ["admin", "master"]);
    const map: Record<string, string> = {};
    (data || []).forEach((p: any) => { map[p.id] = p.name || "—"; });
    return map;
  } catch {
    return {};
  }
}

// Format tanggal singkat (tanggal transaksi).
export const fmtTgl = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// Format tanggal + jam (waktu input).
export const fmtTglJam = (s?: string | null) =>
  s ? new Date(s).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
