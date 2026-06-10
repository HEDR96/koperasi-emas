import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use hardcoded service role key so this works server-side without env var
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ltmovptzzaufxxhxewbn.supabase.co";
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0bW92cHR6emF1Znh4aHhld2JuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTM3MjI1MCwiZXhwIjoyMDk0OTQ4MjUwfQ.jXWk6XUIS_yFw-VD2bqsQk73hnzoCGXk3kTkukNB9X0";

// Cari auth user berdasarkan email (admin API tidak punya getUserByEmail).
async function findUserByEmail(admin: any, email: string) {
  const target = String(email).toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error || !data?.users?.length) return null;
    const hit = data.users.find((u: any) => (u.email || "").toLowerCase() === target);
    if (hit) return hit;
    if (data.users.length < 1000) return null;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, phone, nik, role, permissions, requireVerification, createdBy } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nama, email, dan password wajib diisi." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 });
    }
    if (!["admin", "member"].includes(role)) {
      return NextResponse.json({ error: "Role tidak valid." }, { status: 400 });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Create Supabase Auth user
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, phone: phone || "", nik: nik || "", role },
    });

    if (authErr) {
      const emailExists = authErr.message.includes("already") || authErr.message.includes("exists");

      // Email sudah dipakai akun lain. Kalau akun lama adalah admin/master dan
      // yang didaftarkan sekarang adalah anggota → jangan error, tandai akun
      // tersebut sebagai anggota juga (dual-role lewat kolom is_member).
      if (emailExists && role === "member") {
        const existing = await findUserByEmail(admin, email);
        if (existing) {
          const { data: prof } = await (admin.from("profiles") as any)
            .select("id, role, is_member, nik, phone")
            .eq("id", existing.id)
            .single();

          if (prof && (prof.role === "admin" || prof.role === "master")) {
            if (prof.is_member) {
              return NextResponse.json(
                { error: "Akun ini sudah terdaftar sebagai admin sekaligus anggota." },
                { status: 400 }
              );
            }
            const { error: updErr } = await (admin.from("profiles") as any)
              .update({
                is_member: true,
                nik: prof.nik || nik || null,
                phone: prof.phone || phone || null,
              })
              .eq("id", prof.id);
            if (updErr) {
              const hint = updErr.message.includes("is_member")
                ? " (Jalankan dulu supabase/admin-as-member.sql di Supabase SQL Editor.)"
                : "";
              return NextResponse.json(
                { error: "Gagal menandai admin sebagai anggota: " + updErr.message + hint },
                { status: 500 }
              );
            }
            return NextResponse.json({
              success: true,
              userId: prof.id,
              status: "active",
              adminAsMember: true,
            });
          }
        }
        return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 400 });
      }

      const msg = emailExists ? "Email sudah terdaftar." : authErr.message;
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const userId = authData.user.id;
    const referralCode =
      role === "admin"
        ? "KE-ADM-" + Math.random().toString(36).slice(2, 6).toUpperCase()
        : "KE-" + Math.random().toString(36).slice(2, 7).toUpperCase();

    // Member yang didaftarkan admin harus diverifikasi dulu (status "pending").
    // Master yang mendaftar tetap langsung "active". Admin selalu "active".
    const needVerify = role === "member" && requireVerification === true;
    const status = needVerify ? "pending" : "active";

    // 2. Upsert profile (trigger may have already created it)
    const { error: profErr } = await (admin.from("profiles") as any).upsert({
      id: userId,
      name,
      phone: phone || null,
      nik: nik || null,
      role,
      status,
      referral_code: referralCode,
      gold_grams: 0,
      rupiah_balance: 0,
      ...(needVerify
        ? {
            status_changed_by: createdBy || null,
            status_changed_at: new Date().toISOString(),
            status_reason: "Didaftarkan admin, menunggu verifikasi",
          }
        : {}),
    });

    if (profErr) {
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: "Gagal membuat profil: " + profErr.message }, { status: 500 });
    }

    // 3. If admin with permissions, insert into admin_permissions
    if (role === "admin" && permissions) {
      const { error: permErr } = await (admin.from("admin_permissions") as any).upsert({
        admin_id: userId,
        can_approve_transactions: permissions.can_approve_transactions ?? false,
        can_input_transactions: permissions.can_input_transactions ?? false,
        can_manage_members: permissions.can_manage_members ?? false,
        can_manage_promos: permissions.can_manage_promos ?? false,
        can_view_reports: permissions.can_view_reports ?? false,
      });
      if (permErr) {
        // Non-fatal: table may not exist yet
        console.warn("admin_permissions insert failed:", permErr.message);
      }
    }

    return NextResponse.json({ success: true, userId, status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Terjadi kesalahan server." }, { status: 500 });
  }
}
