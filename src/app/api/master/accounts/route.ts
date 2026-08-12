import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });

  const admin = supabaseAdmin();

  const { data: { user }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Sesi tidak valid, silakan login ulang." }, { status: 401 });

  const { data: requester, error: reqErr } = await (admin.from("profiles") as any)
    .select("role")
    .eq("id", user.id)
    .single();

  if (reqErr || !requester || requester.role !== "master") {
    return NextResponse.json({ error: "Hanya role master yang boleh melihat daftar akun." }, { status: 403 });
  }

  const { data: profiles, error: profErr } = await (admin.from("profiles") as any)
    .select("id,name,role,status,phone,created_at")
    .order("created_at", { ascending: false });

  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  // Email hanya tersimpan otoritatif di Supabase Auth — ambil dari sana, bukan dari
  // kolom profiles.email yang tidak selalu terisi (mis. member lama).
  let authUsers: { id: string; email: string | undefined }[] = [];
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    authUsers = authUsers.concat(data.users.map(u => ({ id: u.id, email: u.email })));
    if (data.users.length < 200) break;
    page++;
  }
  const emailById = new Map(authUsers.map(u => [u.id, u.email ?? null]));

  const accounts = (profiles ?? []).map((p: any) => ({
    ...p,
    email: emailById.get(p.id) ?? p.email ?? null,
  }));

  return NextResponse.json({ accounts });
}
