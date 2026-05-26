import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const admin = supabaseAdmin();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Format file harus JPG, PNG, atau WebP." }, { status: 400 });
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: "Ukuran file maksimal 5MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Upload to Supabase Storage — always overwrite "building.jpg"
  const { error: uploadErr } = await admin.storage
    .from("site-assets")
    .upload("building.jpg", buffer, {
      contentType: file.type,
      upsert: true,   // overwrite existing
    });

  if (uploadErr) {
    return NextResponse.json({ error: "Gagal upload: " + uploadErr.message }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = admin.storage
    .from("site-assets")
    .getPublicUrl("building.jpg");

  const publicUrl = urlData.publicUrl + "?t=" + Date.now(); // cache-bust

  // Save URL to site_settings
  const { error: settErr } = await (admin.from("site_settings") as any)
    .upsert({ key: "building_photo_url", value: publicUrl, updated_at: new Date().toISOString() });

  if (settErr) {
    // Still return success even if settings update fails (URL is in storage)
    return NextResponse.json({ ok: true, url: publicUrl, warning: settErr.message });
  }

  return NextResponse.json({ ok: true, url: publicUrl });
}

export async function DELETE() {
  const admin = supabaseAdmin();

  // Remove from storage
  await admin.storage.from("site-assets").remove(["building.jpg"]);

  // Clear setting
  await (admin.from("site_settings") as any)
    .upsert({ key: "building_photo_url", value: null, updated_at: new Date().toISOString() });

  return NextResponse.json({ ok: true });
}
