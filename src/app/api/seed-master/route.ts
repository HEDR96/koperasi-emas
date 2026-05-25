import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// ONE-TIME endpoint to create the master user
// DELETE this file after use
export async function GET() {
  const admin = supabaseAdmin();
  const EMAIL = "master@master.com";
  const PASSWORD = "master@master";

  // 1. Create or update auth user
  let userId: string;

  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email === EMAIL);

  if (found) {
    // Update password
    await admin.auth.admin.updateUserById(found.id, { password: PASSWORD });
    userId = found.id;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || "Failed to create user" }, { status: 500 });
    }
    userId = data.user.id;
  }

  // 2. Upsert profile with role = master
  const { error: profErr } = await (admin.from("profiles") as any).upsert(
    { id: userId, name: "Master Admin", role: "master", status: "active", gold_grams: 0, rupiah_balance: 0 },
    { onConflict: "id" }
  );

  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Master user ready",
    email: EMAIL,
    password: PASSWORD,
    userId,
  });
}
