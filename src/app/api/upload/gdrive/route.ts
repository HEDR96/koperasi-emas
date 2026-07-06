import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

function getAuth() {
  const clientId     = process.env.GDRIVE_CLIENT_ID;
  const clientSecret = process.env.GDRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GDRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "GDRIVE_CLIENT_ID / GDRIVE_CLIENT_SECRET / GDRIVE_REFRESH_TOKEN belum diset di .env.local. " +
      "Jalankan: node scripts/gdrive-auth.mjs"
    );
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, "urn:ietf:wg:oauth:2.0:oob");
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

export async function POST(req: NextRequest) {
  const folderId = process.env.GDRIVE_FOLDER_ID?.trim();
  if (!folderId) {
    return NextResponse.json({
      error: "GDRIVE_FOLDER_ID belum diset. Buat folder di Google Drive lalu isi ID-nya di .env.local.",
    }, { status: 500 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });

  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowed.includes(file.type))
    return NextResponse.json({ error: "Format file harus JPG, PNG, atau WebP." }, { status: 400 });

  if (file.size > 10 * 1024 * 1024)
    return NextResponse.json({ error: "Ukuran file maksimal 10MB." }, { status: 400 });

  try {
    const auth  = getAuth();
    const drive = google.drive({ version: "v3", auth });

    const ext      = file.name.split(".").pop() || "jpg";
    const filename = `upload_${Date.now()}.${ext}`;
    const buffer   = Buffer.from(await file.arrayBuffer());
    const stream   = Readable.from(buffer);

    const res = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [folderId],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: "id",
    });

    const fileId = res.data.id;
    if (!fileId) throw new Error("Upload berhasil tapi tidak ada file ID yang dikembalikan.");

    // Set permission: siapa saja dengan link bisa melihat
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    });

    const shareUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
    return NextResponse.json({ ok: true, url: shareUrl, id: fileId });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal upload ke Google Drive." }, { status: 500 });
  }
}
