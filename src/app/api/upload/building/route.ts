import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = "koperasi";

// Create the public storage bucket if it doesn't exist yet.
async function ensureBucket(admin: ReturnType<typeof supabaseAdmin>): Promise<{ error: string | null }> {
  const { data: bucket } = await admin.storage.getBucket(BUCKET);
  if (bucket) return { error: null };

  const { error } = await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  });

  // Ignore "already exists" races — treat as success.
  if (error && !/already exists/i.test(error.message)) {
    return { error: error.message };
  }
  return { error: null };
}

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

  // Ensure the storage bucket exists (create it on first use)
  const { error: bucketErr } = await ensureBucket(admin);
  if (bucketErr) {
    return NextResponse.json({ error: "Gagal menyiapkan storage: " + bucketErr }, { status: 500 });
  }

  // Upload to Supabase Storage — always overwrite "building.jpg"
  const { error: uploadErr } = await admin.storage
    .from(BUCKET)
    .upload("building.jpg", buffer, {
      contentType: file.type,
      upsert: true,   // overwrite existing
    });

  if (uploadErr) {
    return NextResponse.json({ error: "Gagal upload: " + uploadErr.message }, { status: 500 });
  }

  // Get public URL
  const { data: urlData } = admin.storage
    .from(BUCKET)
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
  await admin.storage.from(BUCKET).remove(["building.jpg"]);

  // Clear setting
  await (admin.from("site_settings") as any)
    .upsert({ key: "building_photo_url", value: null, updated_at: new Date().toISOString() });

  return NextResponse.json({ ok: true });
}
