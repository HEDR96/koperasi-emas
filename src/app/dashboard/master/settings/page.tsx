"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Save, Bell, Shield, Globe, Palette, Database } from "lucide-react";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("umum");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const tabs = [
    { id:"umum", label:"Umum", icon:Settings },
    { id:"notif", label:"Notifikasi", icon:Bell },
    { id:"keamanan", label:"Keamanan", icon:Shield },
    { id:"tampilan", label:"Tampilan", icon:Palette },
    { id:"sistem", label:"Sistem", icon:Database },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Tabs */}
      <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4 }}>
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", borderRadius:12, border:"1px solid", whiteSpace:"nowrap", cursor:"pointer", transition:"all .2s", fontSize:".83rem", fontWeight:600,
                borderColor: activeTab===t.id?"#D4AF37":"rgba(255,255,255,0.1)",
                background: activeTab===t.id?"rgba(212,175,55,0.1)":"transparent",
                color: activeTab===t.id?"#D4AF37":"rgba(255,255,255,0.4)" }}>
              <Icon style={{ width:14, height:14 }} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Settings Content */}
      <motion.div key={activeTab} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:28 }}>

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
                { label:"Nomor OJK", value:"S-124/KO.0101/2023", type:"text" },
                { label:"Nomor BH", value:"BH.2023.001.JAK", type:"text" },
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
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", paddingTop:16 }}>
                <p style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem", marginBottom:12 }}>Ubah Password Master</p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:12 }}>
                  {["Password Lama","Password Baru","Konfirmasi Password Baru"].map(f => (
                    <div key={f}>
                      <label style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem", display:"block", marginBottom:6 }}>{f}</label>
                      <input className="input-gold" type="password" placeholder="••••••••" style={{ borderRadius:10, padding:"9px 12px", fontSize:".84rem", width:"100%" }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {(activeTab === "tampilan" || activeTab === "sistem") && (
          <div style={{ textAlign:"center", padding:"48px 0" }}>
            <Globe style={{ width:40, height:40, color:"rgba(255,255,255,0.15)", margin:"0 auto 12px" }} />
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".9rem" }}>Pengaturan {tabs.find(t=>t.id===activeTab)?.label} akan segera tersedia</p>
          </div>
        )}

        {/* Save */}
        <div style={{ marginTop:28, display:"flex", alignItems:"center", gap:12 }}>
          <button className="btn-gold" onClick={handleSave}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 24px", borderRadius:12, border:"none", cursor:"pointer", fontSize:".88rem" }}>
            <Save style={{ width:15, height:15 }} />
            Simpan Pengaturan
          </button>
          {saved && (
            <motion.span initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
              style={{ color:"#4ade80", fontSize:".83rem", fontWeight:600 }}>
              ✓ Tersimpan!
            </motion.span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
