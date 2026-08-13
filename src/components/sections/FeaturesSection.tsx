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

function parseFeaturesJson(json: string): { icon: string; title: string; desc: string }[] {
  if (!json) return FEATURES;
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {}
  return FEATURES;
}

export default function FeaturesSection() {
  const s = useSiteSettings();
  const featureItems = parseFeaturesJson(s.featuresJson);
  return (
    <section id="tentang" style={{ padding:"80px 0", background:"transparent", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background:"linear-gradient(180deg, transparent 0%, rgba(255,252,220,0.3) 50%, transparent 100%)", pointerEvents:"none" }} />

      <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px", position:"relative" }}>

        {/* Header */}
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:"center", marginBottom:52 }}
        >
          <span className="badge-gold" style={{ display:"inline-flex", padding:"5px 16px", borderRadius:20, fontSize:".78rem", fontWeight:600, marginBottom:16 }}>
            {s.featuresBadge || "Fitur Lengkap"}
          </span>
          <h2 style={{ fontSize:"clamp(1.8rem,4vw,3rem)", fontWeight:900, color:"#2D1B00", marginBottom:14, lineHeight:1.1 }}>
            {s.featuresTitle ? (
              <span className="text-gold-gradient">{s.featuresTitle}</span>
            ) : (
              <>Semua Kebutuhan Emas{" "}<span className="text-gold-gradient">dalam Satu Platform</span></>
            )}
          </h2>
          <p style={{ color:"rgba(45,27,0,0.82)", fontSize:"clamp(.9rem,1.5vw,1.1rem)", maxWidth:540, margin:"0 auto", lineHeight:1.7 }}>
            {s.featuresSubtitle || "Dari Simpanan harian hingga investasi jangka panjang, ekosistem lengkap untuk perjalanan emas Anda."}
          </p>
        </motion.div>

        {/* Grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:14 }}>
          {featureItems.map((f, i) => {
            const Icon = ICONS[f.icon];
            return (
              <motion.div key={f.title} data-hover="1"
                initial={{ opacity:0, y:28 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay: i * .06 }}
                whileHover={{ y:-6, transition:{ duration:.2 } }}
                style={{
                  background:"rgba(255,255,255,0.72)",
                  border:"1px solid rgba(201,162,39,0.22)",
                  borderRadius:18, padding:"24px 20px",
                  backdropFilter:"blur(8px)",
                  transition:"border-color .3s, box-shadow .3s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor="rgba(201,162,39,0.45)"; (e.currentTarget as HTMLElement).style.boxShadow="0 16px 40px rgba(201,162,39,0.15)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor="rgba(201,162,39,0.22)"; (e.currentTarget as HTMLElement).style.boxShadow="none"; }}
              >
                {/* Icon */}
                <div style={{ width:48, height:48, borderRadius:13, background:"rgba(201,162,39,0.12)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16, transition:"background .3s" }}>
                  {Icon && <Icon style={{ width:24, height:24, color:"#8B6010" }} />}
                </div>
                {/* Content */}
                <h3 style={{ color:"#2D1B00", fontWeight:700, fontSize:".9rem", marginBottom:8 }}>{f.title}</h3>
                <p style={{ color:"rgba(101,67,14,0.75)", fontSize:".78rem", lineHeight:1.6 }}>{f.desc}</p>
                {/* Underline on hover */}
                <div style={{ height:2, marginTop:16, background:"linear-gradient(90deg,#C9A227,#F5D060)", borderRadius:1, width:"0%", transition:"width .4s ease" }}
                  className="feature-underline" />
              </motion.div>
            );
          })}
        </div>

        <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }} transition={{ delay:.5 }}
          style={{ textAlign:"center", marginTop:40, color:"rgba(101,67,14,0.7)", fontSize:".85rem" }}
        >
          Semua fitur tersedia untuk anggota aktif (simpanan pokok {s.simpananPokok || "Rp 5.000.000"} + wajib {s.simpananWajib || "Rp 200.000/bulan"}).{" "}
          <a href="/auth/register" style={{ color:"#8B6010", fontWeight:600, textDecoration:"none" }}>Daftar jadi anggota →</a>
        </motion.div>
      </div>

      <style>{`
        .feature-underline { transition: width .45s ease !important; }
        [data-hover]:hover .feature-underline { width: 100% !important; }
      `}</style>
    </section>
  );
}
