import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { name, email, password, phone, nik, referral } = await req.json();

  if (!name || !email || !password || !phone || !nik) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }

  const admin = supabaseAdmin();

  // 1. Create auth user — auto-confirm email (no email OTP needed)
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,   // skip email verification
    user_metadata: { name, phone, nik },
  });

  if (authErr) {
    const msg = authErr.message.includes("already") || authErr.message.includes("exists")
      ? "Email sudah terdaftar."
      : authErr.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const userId = authData.user.id;

  // 2. Generate referral code
  const referralCode = "KE-" + Math.random().toString(36).slice(2, 7).toUpperCase();

  // 3. Resolve referrer
  let referredBy: string | null = null;
  if (referral) {
    const { data: referrer } = await (admin.from("profiles") as any)
      .select("id")
      .eq("referral_code", referral)
      .single();
    if (referrer) referredBy = referrer.id;
  }

  // 4. Update profile — trigger already created it, we just fix the fields
  //    (trigger default status is 'active', we override to 'pending')
  const { error: profErr } = await (admin.from("profiles") as any)
    .update({
      name,
      email,
      phone,
      nik,
      status: "pending",        // must be approved by admin/master
      referral_code: referralCode,
      referred_by: referredBy,
    })
    .eq("id", userId);

  if (profErr) {
    // Cleanup auth user if profile update fails
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: "Gagal membuat profil: " + profErr.message }, { status: 500 });
  }

  // 5. Record referral bonus if applicable
  if (referredBy) {
    await (admin.from("referrals") as any).insert({
      referrer_id: referredBy,
      referred_id: userId,
      bonus_amount: 50000,
      status: "pending",
    });
  }

  return NextResponse.json({ ok: true, userId });
}
