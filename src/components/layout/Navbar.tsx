"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { useAuthStore } from "@/store/useAuthStore";
import { useSiteName } from "@/store/useSettingsStore";
import { isDemoMode } from "@/lib/demo";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const siteName = useSiteName();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const navStyle: React.CSSProperties = {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 999,
    transition: "all .4s ease",
    background: scrolled ? "rgba(255,253,231,0.92)" : "transparent",
    backdropFilter: scrolled ? "blur(16px)" : "none",
    WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
    borderBottom: scrolled ? "1px solid rgba(201,162,39,0.2)" : "1px solid transparent",
    boxShadow: scrolled ? "0 4px 30px rgba(201,162,39,0.12)" : "none",
  };

  return (
    <>
      <motion.nav style={navStyle} initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: .6, ease: "easeOut" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 70, display: "flex", alignItems: "center", gap: 16 }}>

          {/* Logo */}
          <Link href="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none", flexShrink:0 }}>
            <img src="/logo.jpg" alt="KE" style={{ width:42, height:42, borderRadius:"50%", objectFit:"cover" }}
              onError={e => { const el = e.currentTarget as HTMLImageElement; el.style.display="none"; (el.nextElementSibling as HTMLElement).style.display="flex"; }}
            />
            <div className="bg-gold-gradient" style={{ width:42, height:42, borderRadius:10, display:"none", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 14px rgba(212,175,55,0.35)", fontSize:"1rem", fontWeight:900, color:"#0a0a0a", flexShrink:0 }}>K</div>
            <div className="text-gold-gradient" style={{ fontWeight:900, fontSize:".82rem", lineHeight:1, letterSpacing:".02em" }}>{siteName.toUpperCase()}</div>
          </Link>

          {/* Desktop Nav */}
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:2 }} className="hidden-mobile">
            {NAV_ITEMS.slice(0, 8).map(item => (
              <Link key={item.label} href={item.href} style={{ padding:"6px 12px", borderRadius:8, fontSize:".85rem", fontWeight:500, color:"#5C3D11", textDecoration:"none", transition:"color .2s, background .2s", whiteSpace:"nowrap" }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color="#8B6010"; (e.target as HTMLElement).style.background="rgba(212,175,55,0.12)"; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color="#5C3D11"; (e.target as HTMLElement).style.background="transparent"; }}
              >{item.label}</Link>
            ))}
          </div>

          {/* Right */}
          <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
            {isDemoMode() ? (
              <button className="desktop-only" type="button"
                onClick={() => alert("Ini halaman demo portofolio — fitur login & dashboard tidak diaktifkan di sini. Lihat screenshot dashboard di galeri portofolio AFSS.")}
                style={{ padding:"8px 18px", borderRadius:10, fontSize:".85rem", border:"1px solid rgba(212,175,55,0.3)", background:"transparent", color:"rgba(212,175,55,0.6)", cursor:"pointer" }}
              >Login (Demo)</button>
            ) : isAuthenticated && user ? (
              <Link href={`/dashboard/${user.role}`}>
                <button className="btn-gold" style={{ padding:"8px 18px", borderRadius:10, fontSize:".85rem", border:"none", cursor:"pointer" }}>Dashboard</button>
              </Link>
            ) : (
              <Link href="/auth/login" className="desktop-only">
                <button className="btn-gold" style={{ padding:"8px 18px", borderRadius:10, fontSize:".85rem", border:"none", cursor:"pointer" }}>Login</button>
              </Link>
            )}
            {/* Hamburger */}
            <button
              onClick={() => setOpen(!open)}
              className="mobile-only"
              style={{ background:"rgba(255,248,220,0.8)", border:"1px solid rgba(201,162,39,0.25)", borderRadius:9, width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center", color:"#8B6010", cursor:"pointer" }}
            >
              {open ? <X style={{ width:18, height:18 }} /> : <Menu style={{ width:18, height:18 }} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, height:0 }}
            animate={{ opacity:1, height:"auto" }}
            exit={{ opacity:0, height:0 }}
            style={{ position:"fixed", top:70, left:0, right:0, zIndex:998, background:"rgba(255,253,231,0.97)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(201,162,39,0.18)", overflow:"hidden" }}
          >
            <div style={{ padding:"16px 24px 24px" }}>
              {NAV_ITEMS.map((item, i) => (
                <motion.div key={item.label} initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*.04 }}>
                  <Link href={item.href} onClick={() => setOpen(false)}
                    style={{ display:"block", padding:"12px 16px", borderRadius:10, color:"#5C3D11", fontSize:".9rem", fontWeight:500, textDecoration:"none", marginBottom:2, transition:"background .2s, color .2s" }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.color="#8B6010"; (e.target as HTMLElement).style.background="rgba(212,175,55,0.1)"; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.color="#5C3D11"; (e.target as HTMLElement).style.background="transparent"; }}
                  >{item.label}</Link>
                </motion.div>
              ))}
              <div style={{ display:"flex", gap:10, marginTop:16 }}>
                {isDemoMode() ? (
                  <button type="button" style={{ flex:1, padding:"11px", borderRadius:11, fontSize:".9rem", border:"1px solid rgba(212,175,55,0.3)", background:"transparent", color:"rgba(212,175,55,0.6)", cursor:"pointer" }}
                    onClick={() => { setOpen(false); alert("Ini halaman demo portofolio — fitur login & dashboard tidak diaktifkan di sini."); }}
                  >Login (Demo)</button>
                ) : (
                  <Link href="/auth/login" onClick={() => setOpen(false)} style={{ flex:1 }}>
                    <button className="btn-gold" style={{ width:"100%", padding:"11px", borderRadius:11, fontSize:".9rem", border:"none", cursor:"pointer" }}>Login</button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (min-width: 900px) { .mobile-only { display:none !important; } }
        @media (max-width: 899px) { .desktop-only, .hidden-mobile { display:none !important; } }
      `}</style>
    </>
  );
}
