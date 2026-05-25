"use client";

import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight:"100vh", background:"#0a0a0a", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", padding:"24px 16px" }}>
      {/* BG */}
      <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
        <div style={{ position:"absolute", top:"-20%", left:"20%", width:"40vw", height:"40vw", borderRadius:"50%", background:"radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)", filter:"blur(60px)" }} />
        <div style={{ position:"absolute", bottom:"-10%", right:"15%", width:"30vw", height:"30vw", borderRadius:"50%", background:"radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)", filter:"blur(50px)" }} />
        <div style={{ position:"absolute", inset:0, opacity:.03, backgroundImage:"linear-gradient(rgba(212,175,55,1) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,1) 1px, transparent 1px)", backgroundSize:"60px 60px" }} />
      </div>

      {/* Logo */}
      <Link href="/" style={{ position:"relative", zIndex:1, display:"flex", alignItems:"center", gap:12, textDecoration:"none", marginBottom:32 }}>
        <img src="/logo.png" alt="KED" style={{ width:56, height:56, objectFit:"contain", borderRadius:14 }}
          onError={e => { const el = e.currentTarget as HTMLImageElement; el.style.display="none"; (el.nextElementSibling as HTMLElement).style.display="flex"; }}
        />
        <div className="bg-gold-gradient" style={{ width:56, height:56, borderRadius:14, display:"none", alignItems:"center", justifyContent:"center", boxShadow:"0 6px 20px rgba(212,175,55,0.35)", fontSize:"1.4rem", fontWeight:900, color:"#0a0a0a", flexShrink:0 }}>K</div>
        <div>
          <div className="text-gold-gradient" style={{ fontWeight:900, fontSize:"1.2rem", lineHeight:1 }}>Koperasi Emas Digital</div>
          <div style={{ fontSize:".7rem", color:"rgba(255,255,255,0.3)", marginTop:2 }}>Platform Investasi Emas Terpercaya</div>
        </div>
      </Link>

      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:440 }}>
        {children}
      </div>

      <p style={{ position:"relative", zIndex:1, marginTop:24, color:"rgba(255,255,255,0.18)", fontSize:".72rem" }}>
        © 2024 Koperasi Emas Digital · Terdaftar OJK · SSL 256-bit
      </p>
    </div>
  );
}
