import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Body tidak valid." }, { status: 400 }); }

  const { userId, newPassword } = body ?? {};

  if (!userId || !newPassword) {
    return NextResponse.json({ error: "userId dan newPassword wajib diisi." }, { status: 400 });
  }
  if (String(newPassword).length < 8) {
    return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const { data: { user }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Sesi tidak valid, silakan login ulang." }, { status: 401 });

  const { data: requester, error: reqErr } = await (admin.from("profiles") as any)
    .select("role")
    .eq("id", user.id)
    .single();

  if (reqErr || !requester || requester.role !== "master") {
    return NextResponse.json({ error: "Hanya role master yang boleh mengubah password akun lain." }, { status: 403 });
  }

  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
