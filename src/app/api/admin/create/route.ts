import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { name, email, password, phone } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Nama, email, dan password wajib diisi." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 });
  }

  const admin = supabaseAdmin();

  // 1. Create auth user
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, phone: phone || "" },
  });

  if (authErr) {
    const msg =
      authErr.message.includes("already") || authErr.message.includes("exists")
        ? "Email sudah terdaftar."
        : authErr.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const userId = authData.user.id;
  const referralCode = "KE-ADM-" + Math.random().toString(36).slice(2, 6).toUpperCase();

  // 2. Update profile — trigger already created it via handle_new_user
  const { error: profErr } = await (admin.from("profiles") as any)
    .update({
      name,
      email,
      phone: phone || "",
      role: "admin",
      status: "active",
      referral_code: referralCode,
    })
    .eq("id", userId);

  if (profErr) {
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: "Gagal membuat profil: " + profErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userId });
}
