"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, Trash2, Image, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

const FALLBACK = "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&q=80";

export default function KontenPage() {
  const [photoUrl, setPhotoUrl]   = useState<string>(FALLBACK);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [msg, setMsg]             = useState("");
  const [err, setErr]             = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadPhoto() {
    const { data } = await (supabase.from("site_settings") as any)
      .select("value").eq("key","building_photo_url").maybeSingle(); // ← tidak throw 406
    if (data?.value) setPhotoUrl(data.value);
    else setPhotoUrl(FALLBACK);
  }

  useEffect(() => { loadPhoto(); }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setMsg(""); setErr("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/building", { method:"POST", body:fd });
      const json = await res.json();
      if (!res.ok || json.error) { setErr(json.error || "Gagal upload"); }
      else { setMsg("Foto gedung berhasil diupload!"); setPhotoUrl(json.url); }
    } catch { setErr("Terjadi kesalahan upload."); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleDelete() {
    setDeleting(true); setMsg(""); setErr("");
    try {
      const res = await fetch("/api/upload/building", { method:"DELETE" });
      if (res.ok) { setMsg("Foto dihapus, menggunakan foto default."); setPhotoUrl(FALLBACK); }
      else setErr("Gagal menghapus foto.");
    } catch { setErr("Terjadi kesalahan."); }
    setDeleting(false);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:720 }}>
      <div>
        <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Konten Landing Page</h1>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Upload foto gedung kantor yang tampil di halaman utama</p>
      </div>

      {msg && <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.25)", borderRadius:12, padding:"12px 18px", color:"#34d399", fontSize:".88rem" }}>{msg}</motion.div>}
      {err && <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:12, padding:"12px 18px", color:"#f87171", fontSize:".88rem" }}>{err}</div>}

      {/* Preview */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
        style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:16, overflow:"hidden" }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", gap:8 }}>
          <Image style={{ width:16, height:16, color:"#D4AF37" }} />
          <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".85rem", margin:0 }}>Foto Gedung Kantor</p>
        </div>
        <div style={{ position:"relative", width:"100%", height:300, background:"#0a0a0a" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt="Foto Gedung" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center", display:"block" }} onError={e => (e.currentTarget.src = FALLBACK)} />
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)" }} />
          <div style={{ position:"absolute", bottom:12, left:14, right:14, display:"flex", gap:10 }}>
            <span style={{ background:"rgba(0,0,0,0.7)", color:"rgba(255,255,255,0.7)", fontSize:".75rem", padding:"4px 12px", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)" }}>
              {photoUrl === FALLBACK ? "Foto default (Unsplash)" : "Foto yang diupload"}
            </span>
          </div>
        </div>
        <div style={{ padding:"18px 20px", display:"flex", gap:12, flexWrap:"wrap" }}>
          <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleUpload} style={{ display:"none" }} id="building-upload" />
          <label htmlFor="building-upload"
            style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:10, background:uploading?"rgba(212,175,55,0.1)":"linear-gradient(135deg,#D4AF37,#F5D060)", color:uploading?"#D4AF37":"#0a0a0a", fontWeight:700, fontSize:".88rem", cursor:uploading?"not-allowed":"pointer", border:uploading?"1px solid rgba(212,175,55,0.3)":"none", transition:"all .2s" }}>
            {uploading ? <><RefreshCw style={{ width:15, height:15, animation:"spin 1s linear infinite" }} /> Mengupload...</> : <><Upload style={{ width:15, height:15 }} /> Upload Foto Baru</>}
          </label>
          <button onClick={handleDelete} disabled={deleting}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:10, background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.25)", color:"#f87171", fontWeight:600, fontSize:".88rem", cursor:"pointer" }}>
            <Trash2 style={{ width:14, height:14 }} /> {deleting?"Menghapus...":"Hapus & Reset"}
          </button>
        </div>
        <div style={{ padding:"0 20px 16px", color:"rgba(255,255,255,0.3)", fontSize:".75rem" }}>
          Format: JPG, PNG, WebP · Ukuran maks: 5 MB · Rasio ideal: 4:3 atau landscape
        </div>
      </motion.div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
