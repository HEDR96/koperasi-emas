import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = "koperasi";

async function ensureBucket(admin: ReturnType<typeof supabaseAdmin>) {
  const { data: bucket } = await admin.storage.getBucket(BUCKET);
  if (bucket) return { error: null };
  const { error } = await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  });
  if (error && !/already exists/i.test(error.message)) return { error: error.message };
  return { error: null };
}

export async function POST(req: NextRequest) {
  const admin = supabaseAdmin();
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "products";

  if (!file) return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });

  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowed.includes(file.type))
    return NextResponse.json({ error: "Format file harus JPG, PNG, atau WebP." }, { status: 400 });

  if (file.size > 5 * 1024 * 1024)
    return NextResponse.json({ error: "Ukuran file maksimal 5MB." }, { status: 400 });

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const filename = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: bucketErr } = await ensureBucket(admin);
  if (bucketErr)
    return NextResponse.json({ error: "Gagal menyiapkan storage: " + bucketErr }, { status: 500 });

  const { error: uploadErr } = await admin.storage.from(BUCKET).upload(filename, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadErr)
    return NextResponse.json({ error: "Gagal upload: " + uploadErr.message }, { status: 500 });

  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(filename);
  return NextResponse.json({ ok: true, url: urlData.publicUrl });
}
