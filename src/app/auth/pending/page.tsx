"use client";

import { motion } from "framer-motion";
import { Clock, CheckCircle, Phone, Mail } from "lucide-react";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/constants";

export default function PendingPage() {
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
      style={{ background:"rgba(14,14,14,0.85)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:22, padding:"36px 28px", backdropFilter:"blur(20px)", textAlign:"center" }}>

      <div style={{ width:70, height:70, borderRadius:20, background:"rgba(251,146,60,0.1)", border:"1px solid rgba(251,146,60,0.2)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
        <Clock style={{ width:32, height:32, color:"#fb923c" }} />
      </div>

      <h1 style={{ color:"#fff", fontWeight:900, fontSize:"1.4rem", marginBottom:8 }}>
        Pendaftaran Diterima!
      </h1>
      <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".88rem", lineHeight:1.7, marginBottom:24 }}>
        Akun kamu sedang menunggu <strong style={{ color:"#D4AF37" }}>persetujuan admin</strong>.<br />
        Kami akan memverifikasi data kamu dan mengaktifkan akun dalam <strong style={{ color:"#fff" }}>1×24 jam</strong>.
      </p>

      <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"18px 20px", marginBottom:24, textAlign:"left" }}>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem", fontWeight:600, marginBottom:12, textTransform:"uppercase", letterSpacing:".06em" }}>Proses Aktivasi</p>
        {[
          { icon:CheckCircle, label:"Data diterima", desc:"Pendaftaran berhasil disimpan", done:true, color:"#4ade80" },
          { icon:Clock,        label:"Review admin", desc:"Admin memverifikasi data & dokumen", done:false, color:"#fb923c" },
          { icon:CheckCircle, label:"Akun aktif",    desc:"Kamu bisa login dan mulai bertransaksi", done:false, color:"rgba(255,255,255,0.2)" },
        ].map((s, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom: i < 2 ? 12 : 0 }}>
            <div style={{ width:32, height:32, borderRadius:9, background: s.done ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)", border:`1px solid ${s.done ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.08)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <s.icon style={{ width:15, height:15, color: s.color }} />
            </div>
            <div>
              <p style={{ color: s.done ? "#fff" : "rgba(255,255,255,0.4)", fontSize:".83rem", fontWeight:600 }}>{s.label}</p>
              <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".74rem" }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:14, padding:"14px 16px", marginBottom:24 }}>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem", marginBottom:8 }}>Ada pertanyaan? Hubungi kami:</p>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"center" }}>
            <Phone style={{ width:13, height:13, color:"#D4AF37" }} />
            <span style={{ color:"rgba(255,255,255,0.6)", fontSize:".82rem" }}>{SITE_CONFIG.phone}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"center" }}>
            <Mail style={{ width:13, height:13, color:"#D4AF37" }} />
            <span style={{ color:"rgba(255,255,255,0.6)", fontSize:".82rem" }}>{SITE_CONFIG.email}</span>
          </div>
        </div>
      </div>

      <Link href="/auth/login" style={{ textDecoration:"none" }}>
        <button className="btn-outline-gold" style={{ padding:"11px 28px", borderRadius:12, cursor:"pointer", fontSize:".88rem" }}>
          Kembali ke Login
        </button>
      </Link>
    </motion.div>
  );
}
