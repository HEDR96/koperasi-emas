"use client";

import { motion } from "framer-motion";
import {
  PiggyBank, CreditCard, ArrowLeftRight, TrendingUp,
  ShoppingBag, Send, Users, Gift, FileText, Wallet,
  Landmark, BadgeDollarSign,
} from "lucide-react";
import { FEATURES } from "@/lib/constants";
import { useSiteSettings } from "@/store/useSettingsStore";

const ICONS: Record<string, any> = {
  PiggyBank, CreditCard, ArrowLeftRight, TrendingUp,
  ShoppingBag, Send, Users, Gift, FileText, Wallet,
  Landmark, BadgeDollarSign,
};

export default function FeaturesSection() {
  const s = useSiteSettings();
  return (
    <section id="tentang" style={{ padding:"80px 0", background:"#0a0a0a", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background:"linear-gradient(180deg, #0a0a0a 0%, rgba(13,13,0,0.5) 50%, #0a0a0a 100%)", pointerEvents:"none" }} />

      <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px", position:"relative" }}>

        {/* Header */}
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:"center", marginBottom:52 }}
        >
          <span className="badge-gold" style={{ display:"inline-flex", padding:"5px 16px", borderRadius:20, fontSize:".78rem", fontWeight:600, marginBottom:16 }}>
            Fitur Lengkap
          </span>
          <h2 style={{ fontSize:"clamp(1.8rem,4vw,3rem)", fontWeight:900, color:"#fff", marginBottom:14, lineHeight:1.1 }}>
            Semua Kebutuhan Emas{" "}
            <span className="text-gold-gradient">dalam Satu Platform</span>
          </h2>
          <p style={{ color:"rgba(255,255,255,0.82)", fontSize:"clamp(.9rem,1.5vw,1.1rem)", maxWidth:540, margin:"0 auto", lineHeight:1.7 }}>
            Dari Simpanan harian hingga investasi jangka panjang, ekosistem lengkap untuk perjalanan emas Anda.
          </p>
        </motion.div>

        {/* Grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:14 }}>
          {FEATURES.map((f, i) => {
            const Icon = ICONS[f.icon];
            return (
              <motion.div key={f.title}
                initial={{ opacity:0, y:28 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay: i * .06 }}
                whileHover={{ y:-6, transition:{ duration:.2 } }}
                style={{
                  background:"rgba(14,14,14,0.8)",
                  border:"1px solid rgba(212,175,55,0.14)",
                  borderRadius:18, padding:"24px 20px",
                  cursor:"pointer", backdropFilter:"blur(8px)",
                  transition:"border-color .3s, box-shadow .3s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor="rgba(212,175,55,0.35)"; (e.currentTarget as HTMLElement).style.boxShadow="0 16px 40px rgba(212,175,55,0.1)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor="rgba(212,175,55,0.14)"; (e.currentTarget as HTMLElement).style.boxShadow="none"; }}
              >
                {/* Icon */}
                <div style={{ width:48, height:48, borderRadius:13, background:"rgba(212,175,55,0.1)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16, transition:"background .3s" }}>
                  {Icon && <Icon style={{ width:24, height:24, color:"#D4AF37" }} />}
                </div>
                {/* Content */}
                <h3 style={{ color:"#fff", fontWeight:700, fontSize:".9rem", marginBottom:8 }}>{f.title}</h3>
                <p style={{ color:"rgba(255,255,255,0.75)", fontSize:".78rem", lineHeight:1.6 }}>{f.desc}</p>
                {/* Underline on hover */}
                <div style={{ height:2, marginTop:16, background:"linear-gradient(90deg,#D4AF37,#F5D060)", borderRadius:1, width:"0%", transition:"width .4s ease" }}
                  className="feature-underline" />
              </motion.div>
            );
          })}
        </div>

        <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }} transition={{ delay:.5 }}
          style={{ textAlign:"center", marginTop:40, color:"rgba(255,255,255,0.65)", fontSize:".85rem" }}
        >
          Semua fitur tersedia untuk anggota aktif (simpanan pokok {s.simpananPokok || "Rp 5.000.000"} + wajib {s.simpananWajib || "Rp 200.000/bulan"}).{" "}
          <a href="/auth/register" style={{ color:"#D4AF37", fontWeight:600, textDecoration:"none" }}>Daftar jadi anggota →</a>
        </motion.div>
      </div>

      <style>{`
        .feature-underline { transition: width .45s ease !important; }
        [data-hover]:hover .feature-underline { width: 100% !important; }
      `}</style>
    </section>
  );
}

