"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Settings, Save, Bell, Shield, Globe, Palette, Database, Upload, Trash2, ImageIcon, CheckCircle, AlertCircle, Loader2, Building2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const [saved, setSaved]             = useState(false);
  const [activeTab, setActiveTab]     = useState("umum");

  // ── Building photo state ──
  const [currentPhoto, setCurrentPhoto]   = useState<string | null>(null);
  const [previewUrl, setPreviewUrl]       = useState<string | null>(null);
  const [selectedFile, setSelectedFile]   = useState<File | null>(null);
  const [uploading, setUploading]         = useState(false);
  const [uploadMsg, setUploadMsg]         = useState<{ type:"ok"|"err"; text:string } | null>(null);
  const [deleting, setDeleting]           = useState(false);
  const [dragOver, setDragOver]           = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Load current building photo
  useEffect(() => {
    if (activeTab !== "tampilan") return;
    (supabase.from("site_settings") as any)
      .select("value")
      .eq("key", "building_photo_url")
      .single()
      .then(({ data }: { data: { value: string } | null }) => {
        if (data?.value) setCurrentPhoto(data.value);
      });
  }, [activeTab]);

  function handleFileSelect(file: File) {
    if (!file.type.startsWith("image/")) {
      setUploadMsg({ type:"err", text:"File harus berupa gambar (JPG, PNG, WebP)." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadMsg({ type:"err", text:"Ukuran file maksimal 5MB." });
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadMsg(null);
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setUploadMsg(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/upload/building", { method:"POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setUploadMsg({ type:"err", text: data.error || "Upload gagal." });
      } else {
        setCurrentPhoto(data.url);
        setPreviewUrl(null);
        setSelectedFile(null);
        setUploadMsg({ type:"ok", text:"Foto gedung berhasil diperbarui!" });
      }
    } catch {
      setUploadMsg({ type:"err", text:"Terjadi kesalahan jaringan." });
    }
    setUploading(false);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch("/api/upload/building", { method:"DELETE" });
      setCurrentPhoto(null);
      setPreviewUrl(null);
      setSelectedFile(null);
      setUploadMsg({ type:"ok", text:"Foto gedung dihapus. Halaman akan menggunakan foto default." });
    } catch {
      setUploadMsg({ type:"err", text:"Gagal menghapus foto." });
    }
    setDeleting(false);
  }

  const tabs = [
    { id:"umum",     label:"Umum",        icon:Settings },
    { id:"notif",    label:"Notifikasi",   icon:Bell },
    { id:"keamanan", label:"Keamanan",     icon:Shield },
    { id:"tampilan", label:"Tampilan",     icon:Palette },
    { id:"sistem",   label:"Sistem",       icon:Database },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Tabs */}
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", borderRadius:12, border:"1px solid", whiteSpace:"nowrap", cursor:"pointer", fontSize:".83rem", fontWeight:600,
                borderColor: activeTab===t.id?"#D4AF37":"rgba(255,255,255,0.1)",
                background:  activeTab===t.id?"rgba(212,175,55,0.1)":"transparent",
                color:       activeTab===t.id?"#D4AF37":"rgba(255,255,255,0.4)" }}>
              <Icon style={{ width:14, height:14 }} />{t.label}
            </button>
          );
        })}
      </div>

      <motion.div key={activeTab} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:28 }}>

        {/* ─── UMUM ─── */}
        {activeTab === "umum" && (
          <div>
            <h3 style={{ color:"#fff", fontWeight:700, marginBottom:6 }}>Pengaturan Umum</h3>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".82rem", marginBottom:24 }}>Konfigurasi dasar sistem koperasi</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:18 }}>
              {[
                { label:"Nama Koperasi", value:"Koperasi Emas", type:"text" },
                { label:"Tagline", value:"Platform Investasi Emas Terpercaya", type:"text" },
                { label:"Email Resmi", value:"info@ked.id", type:"email" },
                { label:"No. Telepon", value:"+62-21-5000-0000", type:"tel" },
                { label:"Nomor BH", value:"BH.2023.001.JAK", type:"text" },
                { label:"No. Kemenkop UKM", value:"BH.0012345/KOP.2019", type:"text" },
                { label:"Alamat Kantor Pusat", value:"Jl. Sudirman No. 45, Jakarta", type:"text" },
                { label:"Jam Operasional", value:"08:00 - 17:00 WIB", type:"text" },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem", display:"block", marginBottom:7 }}>{f.label}</label>
                  <input className="input-gold" type={f.type} defaultValue={f.value}
                    style={{ borderRadius:11, padding:"10px 14px", fontSize:".85rem", width:"100%" }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── NOTIF ─── */}
        {activeTab === "notif" && (
          <div>
            <h3 style={{ color:"#fff", fontWeight:700, marginBottom:6 }}>Pengaturan Notifikasi</h3>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".82rem", marginBottom:24 }}>Atur notifikasi email dan push notification</p>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {[
                { label:"Notifikasi Transaksi Baru", desc:"Kirim notifikasi saat ada transaksi masuk", enabled:true },
                { label:"Notifikasi Member Baru", desc:"Kirim email saat ada pendaftaran member baru", enabled:true },
                { label:"Alert Pembayaran Jatuh Tempo", desc:"Ingatkan member bayar cicilan H-3", enabled:true },
                { label:"Laporan Harian Otomatis", desc:"Kirim ringkasan harian ke email master", enabled:false },
                { label:"Notifikasi Harga Berubah", desc:"Alert saat harga emas berubah signifikan", enabled:false },
              ].map(n => (
                <div key={n.label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:"rgba(255,255,255,0.03)", borderRadius:12, gap:12 }}>
                  <div>
                    <p style={{ color:"#fff", fontSize:".85rem", fontWeight:600 }}>{n.label}</p>
                    <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".77rem" }}>{n.desc}</p>
                  </div>
                  <label style={{ position:"relative", display:"inline-block", width:44, height:24, flexShrink:0, cursor:"pointer" }}>
                    <input type="checkbox" defaultChecked={n.enabled} style={{ opacity:0, width:0, height:0 }} />
                    <span style={{ position:"absolute", inset:0, background: n.enabled?"#D4AF37":"rgba(255,255,255,0.1)", borderRadius:12, transition:".3s" }} />
                    <span style={{ position:"absolute", left: n.enabled?22:2, top:2, width:20, height:20, background:"#fff", borderRadius:"50%", transition:".3s" }} />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── KEAMANAN ─── */}
        {activeTab === "keamanan" && (
          <div>
            <h3 style={{ color:"#fff", fontWeight:700, marginBottom:6 }}>Pengaturan Keamanan</h3>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".82rem", marginBottom:24 }}>Konfigurasi keamanan akses sistem</p>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              {[
                { label:"Verifikasi 2 Faktor (2FA)", desc:"Wajibkan OTP untuk semua login admin", enabled:true },
                { label:"Auto Logout Sesi", desc:"Logout otomatis setelah 30 menit tidak aktif", enabled:true },
                { label:"Whitelist IP Admin", desc:"Batasi akses admin hanya dari IP tertentu", enabled:false },
                { label:"Log Semua Aktivitas", desc:"Simpan semua aktivitas ke audit log", enabled:true },
              ].map(s => (
                <div key={s.label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:"rgba(255,255,255,0.03)", borderRadius:12, gap:12 }}>
                  <div>
                    <p style={{ color:"#fff", fontSize:".85rem", fontWeight:600 }}>{s.label}</p>
                    <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".77rem" }}>{s.desc}</p>
                  </div>
                  <label style={{ position:"relative", display:"inline-block", width:44, height:24, flexShrink:0, cursor:"pointer" }}>
                    <input type="checkbox" defaultChecked={s.enabled} style={{ opacity:0, width:0, height:0 }} />
                    <span style={{ position:"absolute", inset:0, background: s.enabled?"#D4AF37":"rgba(255,255,255,0.1)", borderRadius:12, transition:".3s" }} />
                    <span style={{ position:"absolute", left: s.enabled?22:2, top:2, width:20, height:20, background:"#fff", borderRadius:"50%", transition:".3s" }} />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAMPILAN — FOTO GEDUNG ─── */}
        {activeTab === "tampilan" && (
          <div>
            <h3 style={{ color:"#fff", fontWeight:700, marginBottom:6 }}>Tampilan Landing Page</h3>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".82rem", marginBottom:28 }}>Kelola foto dan tampilan halaman publik</p>

            {/* Section: Foto Gedung */}
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(212,175,55,0.12)", borderRadius:16, padding:24 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:"rgba(212,175,55,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Building2 style={{ width:18, height:18, color:"#D4AF37" }} />
                </div>
                <div>
                  <p style={{ color:"#fff", fontWeight:700, fontSize:".9rem" }}>Foto Gedung Kantor</p>
                  <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".75rem" }}>Ditampilkan di halaman Kontak landing page. Hanya 1 foto aktif.</p>
                </div>
              </div>

              {/* Status message */}
              {uploadMsg && (
                <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", borderRadius:10, marginBottom:16,
                    background: uploadMsg.type==="ok"?"rgba(74,222,128,0.08)":"rgba(248,113,113,0.08)",
                    border: `1px solid ${uploadMsg.type==="ok"?"rgba(74,222,128,0.25)":"rgba(248,113,113,0.25)"}`,
                    color: uploadMsg.type==="ok"?"#4ade80":"#f87171", fontSize:".82rem" }}>
                  {uploadMsg.type==="ok"
                    ? <CheckCircle style={{ width:14, height:14, flexShrink:0 }} />
                    : <AlertCircle style={{ width:14, height:14, flexShrink:0 }} />}
                  {uploadMsg.text}
                </motion.div>
              )}

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, alignItems:"start" }}>

                {/* Current / preview photo */}
                <div>
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem", fontWeight:600, marginBottom:10, textTransform:"uppercase", letterSpacing:".05em" }}>
                    {previewUrl ? "Preview Foto Baru" : "Foto Aktif Sekarang"}
                  </p>
                  <div style={{ borderRadius:14, overflow:"hidden", border:"1px solid rgba(212,175,55,0.15)", background:"rgba(0,0,0,0.4)", aspectRatio:"16/10", position:"relative" }}>
                    {(previewUrl || currentPhoto) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl || currentPhoto || ""}
                        alt="Foto Gedung"
                        style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
                      />
                    ) : (
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:10, color:"rgba(255,255,255,0.2)", minHeight:160 }}>
                        <ImageIcon style={{ width:36, height:36 }} />
                        <p style={{ fontSize:".78rem" }}>Belum ada foto</p>
                        <p style={{ fontSize:".7rem", color:"rgba(255,255,255,0.15)" }}>Foto default Unsplash digunakan</p>
                      </div>
                    )}
                    {previewUrl && (
                      <div style={{ position:"absolute", top:8, right:8, background:"rgba(212,175,55,0.9)", borderRadius:6, padding:"3px 8px", fontSize:".68rem", fontWeight:700, color:"#000" }}>
                        PREVIEW
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload area */}
                <div>
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem", fontWeight:600, marginBottom:10, textTransform:"uppercase", letterSpacing:".05em" }}>Upload Foto Baru</p>

                  {/* Drop zone */}
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if(f) handleFileSelect(f); }}
                    style={{ border:`2px dashed ${dragOver?"#D4AF37":"rgba(212,175,55,0.2)"}`, borderRadius:12, padding:"28px 16px", textAlign:"center", cursor:"pointer", background: dragOver?"rgba(212,175,55,0.04)":"rgba(0,0,0,0.2)", transition:"all .2s", marginBottom:14 }}>
                    <Upload style={{ width:28, height:28, color:"rgba(212,175,55,0.5)", margin:"0 auto 10px" }} />
                    <p style={{ color:"rgba(255,255,255,0.55)", fontSize:".83rem", fontWeight:500, marginBottom:4 }}>
                      {selectedFile ? selectedFile.name : "Seret & lepas foto di sini"}
                    </p>
                    <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".73rem" }}>
                      {selectedFile
                        ? `${(selectedFile.size/1024/1024).toFixed(2)} MB`
                        : "JPG, PNG, WebP · Maks 5MB"}
                    </p>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }}
                      onChange={e => { const f = e.target.files?.[0]; if(f) handleFileSelect(f); }} />
                  </div>

                  {/* Action buttons */}
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    <button
                      onClick={handleUpload}
                      disabled={!selectedFile || uploading}
                      className="btn-gold"
                      style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"11px", borderRadius:11, border:"none", cursor: !selectedFile||uploading?"not-allowed":"pointer", fontSize:".86rem", opacity: !selectedFile||uploading?.6:1 }}>
                      {uploading
                        ? <><Loader2 style={{ width:14, height:14, animation:"spin 1s linear infinite" }} /> Mengupload...</>
                        : <><Upload style={{ width:14, height:14 }} /> Upload Foto Ini</>}
                    </button>

                    {currentPhoto && (
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px", borderRadius:11, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", color:"#f87171", cursor: deleting?"not-allowed":"pointer", fontSize:".84rem" }}>
                        {deleting
                          ? <><Loader2 style={{ width:14, height:14, animation:"spin 1s linear infinite" }} /> Menghapus...</>
                          : <><Trash2 style={{ width:14, height:14 }} /> Hapus & Pakai Default</>}
                      </button>
                    )}
                  </div>

                  <p style={{ color:"rgba(255,255,255,0.2)", fontSize:".7rem", marginTop:12, lineHeight:1.5 }}>
                    Foto akan langsung tampil di landing page setelah di-upload. Foto lama otomatis tergantikan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── SISTEM ─── */}
        {activeTab === "sistem" && (
          <div style={{ textAlign:"center", padding:"48px 0" }}>
            <Globe style={{ width:40, height:40, color:"rgba(255,255,255,0.15)", margin:"0 auto 12px" }} />
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".9rem" }}>Pengaturan Sistem akan segera tersedia</p>
          </div>
        )}

        {/* Save button (non-tampilan tabs) */}
        {activeTab !== "tampilan" && activeTab !== "sistem" && (
          <div style={{ marginTop:28, display:"flex", alignItems:"center", gap:12 }}>
            <button className="btn-gold" onClick={handleSave}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 24px", borderRadius:12, border:"none", cursor:"pointer", fontSize:".88rem" }}>
              <Save style={{ width:15, height:15 }} /> Simpan Pengaturan
            </button>
            {saved && (
              <motion.span initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                style={{ color:"#4ade80", fontSize:".83rem", fontWeight:600 }}>✓ Tersimpan!</motion.span>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
