import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Tabel yang boleh dihapus master lewat endpoint ini.
// Hapus induk akan ikut menghapus data anak (FK ON DELETE CASCADE).
const ALLOWED_TABLES = new Set([
  "transactions",
  "installments",
  "gadai",
  "simpanan",
  "savings",
  "payments",
  "cicilan_pembayaran",
  "gadai_pembayaran",
  "notifications",
]);

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Body tidak valid." }, { status: 400 }); }

  const { table, id, requesterId } = body ?? {};

  if (!table || !id || !requesterId) {
    return NextResponse.json({ error: "table, id, dan requesterId wajib diisi." }, { status: 400 });
  }
  if (!ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: `Tabel "${table}" tidak diizinkan untuk dihapus.` }, { status: 400 });
  }

  const admin = supabaseAdmin();

  // Verifikasi server-side: hanya MASTER yang boleh menghapus.
  const { data: requester, error: reqErr } = await (admin.from("profiles") as any)
    .select("role")
    .eq("id", requesterId)
    .single();

  if (reqErr || !requester) {
    return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 403 });
  }
  if (requester.role !== "master") {
    return NextResponse.json({ error: "Hanya role master yang boleh menghapus data." }, { status: 403 });
  }

  const { error } = await (admin.from(table) as any).delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Gagal menghapus: " + error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
