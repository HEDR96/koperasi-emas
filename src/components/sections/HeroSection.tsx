"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ChevronDown, Shield, Award, TrendingUp } from "lucide-react";
import { useSiteSettings } from "@/store/useSettingsStore";
import { isDemoMode } from "@/lib/demo";

/* ── Particle (fixed positions — no hydration mismatch) ── */
const PARTICLES = [
  { l:"8%",   t:"18%",  d:"5.2s", delay:"0.4s"  },
  { l:"18%",  t:"72%",  d:"4.1s", delay:"1.8s"  },
  { l:"28%",  t:"38%",  d:"6.3s", delay:"0.9s"  },
  { l:"42%",  t:"85%",  d:"3.8s", delay:"2.5s"  },
  { l:"55%",  t:"22%",  d:"5.7s", delay:"1.2s"  },
  { l:"65%",  t:"65%",  d:"4.5s", delay:"3.1s"  },
  { l:"75%",  t:"12%",  d:"6.0s", delay:"0.6s"  },
  { l:"82%",  t:"48%",  d:"3.5s", delay:"2.0s"  },
  { l:"91%",  t:"78%",  d:"5.0s", delay:"1.5s"  },
  { l:"12%",  t:"55%",  d:"4.8s", delay:"3.8s"  },
  { l:"36%",  t:"92%",  d:"5.5s", delay:"0.2s"  },
  { l:"60%",  t:"42%",  d:"3.9s", delay:"4.2s"  },
];

export default function HeroSection() {
  const s = useSiteSettings();
  const siteName = s.siteName;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      className="hero-overlay relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Ambient glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position:"absolute", top:"-20%", left:"-10%", width:"50vw", height:"50vw", borderRadius:"50%", background:"radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)", filter:"blur(60px)" }} />
        <div style={{ position:"absolute", bottom:"-10%", right:"-5%", width:"40vw", height:"40vw", borderRadius:"50%", background:"radial-gradient(circle, rgba(201,162,39,0.1) 0%, transparent 70%)", filter:"blur(50px)" }} />
        {/* Grid */}
        <div style={{ position:"absolute", inset:0, opacity:0.06, backgroundImage:"linear-gradient(rgba(201,162,39,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,39,1) 1px, transparent 1px)", backgroundSize:"80px 80px" }} />
        {/* Particles */}
        {PARTICLES.map((p, i) => (
          <div key={i} style={{
            position:"absolute", left:p.l, top:p.t,
            width:3, height:3, borderRadius:"50%",
            background:"#C9A227", opacity:0,
            animation:`particle-float ${p.d} ease-in infinite`,
            animationDelay: p.delay,
          }} />
        ))}
      </div>

      {/* Gold wave + bar decorations at bottom */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ zIndex:2 }}>
        <svg viewBox="0 0 1440 160" xmlns="http://www.w3.org/2000/svg" style={{ display:"block", width:"100%" }} preserveAspectRatio="none">
          <path fill="#C9A227" fillOpacity="0.85" d="M0,80 C180,120 360,40 540,60 C720,80 900,140 1080,100 C1260,60 1380,80 1440,90 L1440,160 L0,160 Z" />
          <path fill="#D4AF37" fillOpacity="0.45" d="M0,100 C200,60 400,130 620,110 C840,90 1000,50 1200,90 C1340,115 1400,105 1440,100 L1440,160 L0,160 Z" />
          <path fill="#B8960C" fillOpacity="0.3" d="M0,130 C300,100 600,150 900,125 C1100,108 1300,135 1440,130 L1440,160 L0,160 Z" />
        </svg>
        {/* Gold ribbon curl top-right */}
        <svg viewBox="0 0 120 180" xmlns="http://www.w3.org/2000/svg" style={{ position:"absolute", top:"-60px", right:0, width:90, height:140, opacity:.75 }}>
          <path d="M100,10 C80,30 110,60 85,80 C60,100 90,130 70,155" stroke="url(#ribbonGrad)" strokeWidth="8" fill="none" strokeLinecap="round" />
          <defs>
            <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5D060" />
              <stop offset="50%" stopColor="#C9A227" />
              <stop offset="100%" stopColor="#8B6010" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <motion.div style={{ y, opacity }} className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16 pb-8">

        {/* Trust badge */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.2 }}
          className="inline-flex items-center gap-2 glass-dark gold-border-glow px-4 py-2 rounded-full text-sm mb-8"
          style={{ color:"#8B6010" }}>
          <Shield style={{ width:16, height:16 }} />
          <span style={{ fontWeight:500 }}>Terdaftar Kementerian Koperasi & UKM RI</span>
          <Award style={{ width:16, height:16 }} />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:.35, duration:.8 }}
          style={{ fontSize:"clamp(2rem, 6vw, 4.5rem)", fontWeight:900, lineHeight:1.1, marginBottom:"1.5rem", color:"#2D1B00", letterSpacing:"-0.02em" }}
        >
          Investasi Emas{" "}
          <span className="text-gold-gradient">{s.tagline || "Aman & Terpercaya"}</span>
          <br />
          Bersama{" "}
          <span style={{ position:"relative", display:"inline-block" }}>
            {siteName}
            <span style={{ position:"absolute", bottom:-6, left:0, right:0, height:3, background:"linear-gradient(90deg,#D4AF37,#F5D060)", borderRadius:2 }} />
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.5 }}
          style={{ fontSize:"clamp(1rem,2vw,1.2rem)", color:"rgba(101,67,14,0.75)", maxWidth:640, margin:"0 auto 2.5rem", lineHeight:1.7 }}
        >
          Platform koperasi emas terpercaya untuk {s.totalAnggota || "150.000+"} anggota Indonesia.
          Tabung, cicil, buyback, gadai simpanan, dan dapatkan SHU tahunan.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.65 }}
          style={{ display:"flex", flexWrap:"wrap", gap:12, justifyContent:"center", marginBottom:"4rem" }}
        >
          <Link href={isDemoMode() ? "#simulasi" : "/auth/login"}>
            <button className="btn-gold pulse-glow" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"14px 32px", borderRadius:14, fontSize:"1rem", border:"none", cursor:"pointer" }}>
              <TrendingUp style={{ width:20, height:20 }} />
              {isDemoMode() ? "Coba Simulasi Investasi" : "Masuk & Mulai Investasi"}
            </button>
          </Link>
          <Link href="#harga-emas" className="btn-outline-gold" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"14px 28px", borderRadius:14, fontSize:"1rem", textDecoration:"none" }}>
            <TrendingUp style={{ width:18, height:18 }} />
            Lihat Harga Emas
          </Link>
        </motion.div>

      </motion.div>

      {/* Scroll cue */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.6 }}
        style={{ position:"absolute", bottom:28, left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:6, color:"rgba(101,67,14,0.6)", zIndex:3 }}
      >
        <span style={{ fontSize:".65rem", letterSpacing:".15em", textTransform:"uppercase" }}>Scroll</span>
        <motion.div animate={{ y:[0,8,0] }} transition={{ duration:1.5, repeat:Infinity }}>
          <ChevronDown style={{ width:18, height:18 }} />
        </motion.div>
      </motion.div>
    </section>
  );
}
