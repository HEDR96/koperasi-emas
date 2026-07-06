/**
 * Jalankan sekali untuk mendapatkan GDRIVE_REFRESH_TOKEN:
 *   node scripts/gdrive-auth.mjs
 *
 * Syarat: isi GDRIVE_CLIENT_ID dan GDRIVE_CLIENT_SECRET di .env.local dulu,
 * lalu set sebagai env var sebelum menjalankan:
 *
 *   $env:GDRIVE_CLIENT_ID="..."
 *   $env:GDRIVE_CLIENT_SECRET="..."
 *   node scripts/gdrive-auth.mjs
 */

import { google } from "googleapis";
import readline from "readline";

const CLIENT_ID     = process.env.GDRIVE_CLIENT_ID;
const CLIENT_SECRET = process.env.GDRIVE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set env var GDRIVE_CLIENT_ID dan GDRIVE_CLIENT_SECRET terlebih dahulu.");
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, "urn:ietf:wg:oauth:2.0:oob");

const authUrl = oauth2.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/drive.file"],
  prompt: "consent",
});

console.log("\n========================================");
console.log("1. Buka URL ini di browser:");
console.log(authUrl);
console.log("========================================\n");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question("2. Masukkan kode dari browser: ", async (code) => {
  rl.close();
  try {
    const { tokens } = await oauth2.getToken(code.trim());
    console.log("\n✅ Berhasil! Tambahkan ke .env.local:\n");
    console.log(`GDRIVE_REFRESH_TOKEN="${tokens.refresh_token}"`);
  } catch (err) {
    console.error("Gagal:", err.message);
  }
});
