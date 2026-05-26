import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId, name, phone, status } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "userId diperlukan." }, { status: 400 });
  }

  const admin = supabaseAdmin();

  const updates: Record<string, string> = { updated_at: new Date().toISOString() };
  if (name)   updates.name   = name;
  if (phone)  updates.phone  = phone;
  if (status) updates.status = status;

  const { error } = await (admin.from("profiles") as any)
    .update(updates)
    .eq("id", userId)
    .eq("role", "admin");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
