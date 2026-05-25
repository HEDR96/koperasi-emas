import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // 1. Check user exists via admin
  const admin = supabaseAdmin();
  const { data: list } = await admin.auth.admin.listUsers();
  const user = list?.users?.find(u => u.email === "master@master.com");

  // 2. Try anon sign-in
  const client = createClient(url, anon);
  const { data: signIn, error: signInErr } = await client.auth.signInWithPassword({
    email: "master@master.com",
    password: "master@master",
  });

  // 3. Check profile
  let profile = null;
  if (user) {
    const { data: p } = await (admin.from("profiles") as any)
      .select("id, name, role, status")
      .eq("id", user.id)
      .single();
    profile = p;
  }

  return NextResponse.json({
    userExists: !!user,
    userConfirmed: user?.email_confirmed_at ?? null,
    userId: user?.id ?? null,
    signInSuccess: !!signIn?.user,
    signInError: signInErr?.message ?? null,
    profile,
    supabaseUrl: url ? url.slice(0, 30) + "..." : "MISSING",
    anonKeySet: !!anon,
  });
}
