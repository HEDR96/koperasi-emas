/**
 * Jalankan sekali untuk mendapatkan GDRIVE_REFRESH_TOKEN:
 *   node scripts/gdrive-auth.mjs
 *
 * Syarat: set GDRIVE_CLIENT_ID dan GDRIVE_CLIENT_SECRET sebagai env var
 * sebelum menjalankan:
 *
 *   $env:GDRIVE_CLIENT_ID="..."
 *   $env:GDRIVE_CLIENT_SECRET="..."
 *   node scripts/gdrive-auth.mjs
 *
 * Script ini membuka local server di http://localhost:<port>/callback
 * untuk menangkap kode OAuth (menggantikan metode "oob" yang sudah
 * dihentikan Google).
 */

import { google } from "googleapis";
import http from "http";

const CLIENT_ID     = process.env.GDRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.GDRIVE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set env var GDRIVE_CLIENT_ID dan GDRIVE_CLIENT_SECRET terlebih dahulu.");
  process.exit(1);
}

const PORT = 51134;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/drive.file"],
  prompt: "consent",
});

console.log("\n========================================");
console.log("1. Buka URL ini di browser:");
console.log(authUrl);
console.log("========================================\n");
console.log(`Menunggu callback di ${REDIRECT_URI} ...`);

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith("/callback")) {
    res.writeHead(404);
    res.end();
    return;
  }

  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h2>Gagal: ${error}</h2>`);
    console.error("Gagal:", error);
    server.close();
    process.exit(1);
  }

  try {
    const { tokens } = await oauth2.getToken(code);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h2>Berhasil! Kembali ke terminal.</h2>");
    console.log("\n✅ Berhasil! Tambahkan ke .env.local:\n");
    console.log(`GDRIVE_REFRESH_TOKEN="${tokens.refresh_token}"`);
  } catch (err) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h2>Gagal: ${err.message}</h2>`);
    console.error("Gagal:", err.message);
  } finally {
    server.close();
    process.exit(0);
  }
});

server.listen(PORT);
