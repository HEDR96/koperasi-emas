import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const admin = supabaseAdmin();

  // 1. Sign in with anon client
  const client = createClient(url, anon);
  const { data: signIn, error: signInErr } = await client.auth.signInWithPassword({
    email: "master@master.com",
    password: "master@master",
  });

  // 2. Fetch profile using SAME anon client (after sign-in) — simulates browser flow
  let profileAnon = null;
  let profileAnonErr = null;
  if (signIn?.user) {
    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", signIn.user.id)
      .single();
    profileAnon = data;
    profileAnonErr = error?.message ?? null;
  }

  // 3. Fetch profile using admin client — bypass RLS
  let profileAdmin = null;
  if (signIn?.user) {
    const { data } = await (admin.from("profiles") as any)
      .select("id, name, role, status")
      .eq("id", signIn.user.id)
      .single();
    profileAdmin = data;
  }

  return NextResponse.json({
    signInSuccess: !!signIn?.user,
    signInError: signInErr?.message ?? null,
    userId: signIn?.user?.id ?? null,
    profileAnon,          // what the browser client sees
    profileAnonErr,       // RLS/error from anon client
    profileAdmin,         // ground truth via admin
  });
}
