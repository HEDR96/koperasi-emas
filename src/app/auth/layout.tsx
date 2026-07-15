"use client";

import Link from "next/link";
import { useSiteSettings } from "@/store/useSettingsStore";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const s = useSiteSettings();
  const siteName = s.siteName;
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg, #fffdf0 0%, #fff8dc 50%, #fdf3c0 100%)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", padding:"24px 16px" }}>
      {/* BG */}
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
        <div style={{ position:"absolute", top:"-20%", left:"20%", width:"40vw", height:"40vw", borderRadius:"50%", background:"radial-gradient(circle, rgba(201,162,39,0.12) 0%, transparent 70%)", filter:"blur(60px)" }} />
        <div style={{ position:"absolute", bottom:"-10%", right:"15%", width:"30vw", height:"30vw", borderRadius:"50%", background:"radial-gradient(circle, rgba(201,162,39,0.08) 0%, transparent 70%)", filter:"blur(50px)" }} />
        <div style={{ position:"absolute", inset:0, opacity:.015, backgroundImage:"linear-gradient(rgba(139,96,16,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,96,16,1) 1px, transparent 1px)", backgroundSize:"60px 60px" }} />
      </div>

      {/* Logo */}
      <Link href="/" style={{ position:"relative", zIndex:1, display:"flex", alignItems:"center", gap:12, textDecoration:"none", marginBottom:32 }}>
        <img src="/logo.jpg" alt="KE" style={{ width:56, height:56, objectFit:"cover", borderRadius:"50%" }}
          onError={e => { const el = e.currentTarget as HTMLImageElement; el.style.display="none"; (el.nextElementSibling as HTMLElement).style.display="flex"; }}
        />
        <div className="bg-gold-gradient" style={{ width:56, height:56, borderRadius:14, display:"none", alignItems:"center", justifyContent:"center", boxShadow:"0 6px 20px rgba(201,162,39,0.3)", fontSize:"1.4rem", fontWeight:900, color:"#2D1B00", flexShrink:0 }}>K</div>
        <div>
          <div className="text-gold-gradient" style={{ fontWeight:900, fontSize:"1.2rem", lineHeight:1 }}>{siteName}</div>
          <div style={{ fontSize:".7rem", color:"rgba(101,67,14,0.5)", marginTop:2 }}>{s.tagline || "Platform Investasi Emas Terpercaya"}</div>
        </div>
      </Link>

      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:440 }}>
        {children}
      </div>

      <p style={{ position:"relative", zIndex:1, marginTop:24, color:"rgba(101,67,14,0.35)", fontSize:".72rem" }}>
        © 2024 {siteName} · Terdaftar Kemenkop UKM RI · SSL 256-bit
      </p>
    </div>
  );
}
