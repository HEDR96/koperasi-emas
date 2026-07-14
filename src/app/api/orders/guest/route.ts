import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { customer_name, customer_phone, items, total_amount } = await req.json();

  if (!customer_name?.trim()) {
    return NextResponse.json({ error: "Nama wajib diisi." }, { status: 400 });
  }
  if (!items?.length) {
    return NextResponse.json({ error: "Keranjang kosong." }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { error } = await (admin.from("product_orders") as any).insert({
    user_id: null,
    customer_name: customer_name.trim(),
    customer_phone: customer_phone?.trim() || null,
    items,
    total_amount,
    status: "pending",
    source: "landing_page",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
