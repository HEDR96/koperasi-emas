"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ChevronDown, Shield, Award, TrendingUp } from "lucide-react";

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
        <div style={{ position:"absolute", top:"-20%", left:"-10%", width:"50vw", height:"50vw", borderRadius:"50%", background:"radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)", filter:"blur(60px)" }} />
        <div style={{ position:"absolute", bottom:"-10%", right:"-5%", width:"40vw", height:"40vw", borderRadius:"50%", background:"radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)", filter:"blur(50px)" }} />
        {/* Grid */}
        <div style={{ position:"absolute", inset:0, opacity:0.04, backgroundImage:"linear-gradient(rgba(212,175,55,1) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,1) 1px, transparent 1px)", backgroundSize:"80px 80px" }} />
        {/* Particles */}
        {PARTICLES.map((p, i) => (
          <div key={i} style={{
            position:"absolute", left:p.l, top:p.t,
            width:3, height:3, borderRadius:"50%",
            background:"#D4AF37", opacity:0,
            animation:`particle-float ${p.d} ease-in infinite`,
            animationDelay: p.delay,
          }} />
        ))}
      </div>

      <motion.div style={{ y, opacity }} className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16">

        {/* Trust badge */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.2 }}
          className="inline-flex items-center gap-2 glass-dark gold-border-glow px-4 py-2 rounded-full text-sm mb-8"
          style={{ color:"#D4AF37" }}>
          <Shield style={{ width:16, height:16 }} />
          <span style={{ fontWeight:500 }}>Terdaftar Kementerian Koperasi & UKM RI</span>
          <Award style={{ width:16, height:16 }} />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay:.35, duration:.8 }}
          style={{ fontSize:"clamp(2rem, 6vw, 4.5rem)", fontWeight:900, lineHeight:1.1, marginBottom:"1.5rem", color:"#fff", letterSpacing:"-0.02em" }}
        >
          Investasi Emas{" "}
          <span className="text-gold-gradient">Aman & Terpercaya</span>
          <br />
          Bersama{" "}
          <span style={{ position:"relative", display:"inline-block" }}>
            Koperasi Emas
            <span style={{ position:"absolute", bottom:-6, left:0, right:0, height:3, background:"linear-gradient(90deg,#D4AF37,#F5D060)", borderRadius:2 }} />
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.5 }}
          style={{ fontSize:"clamp(1rem,2vw,1.2rem)", color:"rgba(255,255,255,0.85)", maxWidth:640, margin:"0 auto 2.5rem", lineHeight:1.7 }}
        >
          Platform koperasi emas terpercaya untuk 150.000+ anggota Indonesia.
          Tabung, cicil, buyback, gadai simpanan, dan dapatkan SHU tahunan.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.65 }}
          style={{ display:"flex", flexWrap:"wrap", gap:12, justifyContent:"center", marginBottom:"4rem" }}
        >
          <Link href="/auth/login">
            <button className="btn-gold pulse-glow" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"14px 32px", borderRadius:14, fontSize:"1rem", border:"none", cursor:"pointer" }}>
              <TrendingUp style={{ width:20, height:20 }} />
              Masuk & Mulai Investasi
            </button>
          </Link>
          <Link href="#harga-emas">
            <button className="btn-outline-gold" style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"14px 28px", borderRadius:14, fontSize:"1rem", cursor:"pointer" }}>
              <TrendingUp style={{ width:18, height:18 }} />
              Lihat Harga Emas
            </button>
          </Link>
        </motion.div>

      </motion.div>

      {/* Scroll cue */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.6 }}
        style={{ position:"absolute", bottom:28, left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:6, color:"rgba(255,255,255,0.25)" }}
      >
        <span style={{ fontSize:".65rem", letterSpacing:".15em", textTransform:"uppercase" }}>Scroll</span>
        <motion.div animate={{ y:[0,8,0] }} transition={{ duration:1.5, repeat:Infinity }}>
          <ChevronDown style={{ width:18, height:18 }} />
        </motion.div>
      </motion.div>
    </section>
  );
}
