import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "userId diperlukan." }, { status: 400 });
  }

  const admin = supabaseAdmin();

  // Verify target is actually an admin (not master)
  const { data: profile } = await (admin.from("profiles") as any)
    .select("role")
    .eq("id", userId)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Hanya akun admin yang bisa dihapus." }, { status: 403 });
  }

  // Delete from auth (cascades to profiles via ON DELETE CASCADE)
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
