"use client";

import Link from "next/link";
import { Shield, Award, Phone, Mail, MapPin, AtSign } from "lucide-react";
import { SITE_CONFIG, NAV_ITEMS } from "@/lib/constants";
import { useSiteSettings, igHandle } from "@/store/useSettingsStore";

export default function Footer() {
  const s = useSiteSettings();
  const siteName = s.siteName;
  return (
    <footer style={{ background:"rgba(255,248,220,0.8)", borderTop:"1px solid rgba(201,162,39,0.2)", position:"relative" }}>
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"64px 24px 32px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:40, marginBottom:48 }}>

          {/* Brand */}
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <img src="/logo.jpg" alt="KE" style={{ width:42, height:42, objectFit:"cover", borderRadius:"50%" }}
                onError={e => { const el = e.currentTarget as HTMLImageElement; el.style.display="none"; (el.nextElementSibling as HTMLElement).style.display="flex"; }}
              />
              <div className="bg-gold-gradient" style={{ width:42, height:42, borderRadius:10, display:"none", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", fontWeight:900, color:"#2D1B00", flexShrink:0 }}>K</div>
              <div className="text-gold-gradient" style={{ fontWeight:900, fontSize:".82rem", letterSpacing:".02em" }}>{siteName.toUpperCase()}</div>
            </div>
            <p style={{ color:"rgba(101,67,14,0.7)", fontSize:".82rem", lineHeight:1.7, marginBottom:16 }}>
              Platform koperasi emas terpercaya untuk {s.totalAnggota || "150.000+"} anggota Indonesia.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { Icon: Award,  text: `BH: ${s.legalNumber || SITE_CONFIG.legalNumber}` },
                { Icon: Shield, text: "Terdaftar Kemenkop UKM RI" },
              ].map(({ Icon, text }) => (
                <div key={text} style={{ display:"flex", alignItems:"center", gap:8, fontSize:".75rem" }}>
                  <Icon style={{ width:13, height:13, color:"#8B6010", flexShrink:0 }} />
                  <span style={{ color:"rgba(101,67,14,0.7)" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div>
            <h3 style={{ color:"#2D1B00", fontWeight:700, fontSize:".85rem", marginBottom:16 }}>Navigasi</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {NAV_ITEMS.map(item => (
                <Link key={item.label} href={item.href} style={{ color:"rgba(101,67,14,0.7)", fontSize:".82rem", textDecoration:"none", transition:"color .2s" }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color="#8B6010"}
                  onMouseLeave={e => (e.target as HTMLElement).style.color="rgba(101,67,14,0.7)"}
                >{item.label}</Link>
              ))}
            </div>
          </div>

          {/* Layanan */}
          <div>
            <h3 style={{ color:"#2D1B00", fontWeight:700, fontSize:".85rem", marginBottom:16 }}>Layanan</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { label:"Harga Emas",   href:"/#harga-emas" },
                { label:"Simulasi",     href:"/#simulasi"   },
                { label:"Cicilan Emas", href:"/#simulasi"   },
                { label:"Buyback Emas", href:"/#simulasi"   },
              ].map(item => (
                <Link key={item.label} href={item.href} style={{ color:"rgba(101,67,14,0.7)", fontSize:".82rem", textDecoration:"none", transition:"color .2s" }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color="#8B6010"}
                  onMouseLeave={e => (e.target as HTMLElement).style.color="rgba(101,67,14,0.7)"}
                >{item.label}</Link>
              ))}
            </div>
          </div>

          {/* Kontak */}
          <div>
            <h3 style={{ color:"#2D1B00", fontWeight:700, fontSize:".85rem", marginBottom:16 }}>Kontak</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[
                { Icon: MapPin,  text: s.address   || SITE_CONFIG.address,   href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address || SITE_CONFIG.address)}` },
                { Icon: Phone,   text: s.phone     || SITE_CONFIG.phone,     href: `tel:${(s.phone || SITE_CONFIG.phone).replace(/\s/g,"")}` },
                { Icon: Mail,    text: s.email     || SITE_CONFIG.email,     href: `mailto:${s.email || SITE_CONFIG.email}` },
                { Icon: AtSign,  text: s.instagram || SITE_CONFIG.instagram, href: `https://instagram.com/${igHandle(s.instagram || SITE_CONFIG.instagram)}` },
              ].map(({ Icon, text, href }) => (
                <a key={text} href={href} target="_blank" rel="noopener noreferrer"
                  style={{ display:"flex", alignItems:"flex-start", gap:10, textDecoration:"none" }}
                  onMouseEnter={e => { const el = e.currentTarget; el.querySelectorAll("span").forEach(s => (s.style.color="#8B6010")); }}
                  onMouseLeave={e => { const el = e.currentTarget; el.querySelectorAll("span").forEach(s => (s.style.color="rgba(101,67,14,0.7)")); }}
                >
                  <Icon style={{ width:15, height:15, color:"#8B6010", flexShrink:0, marginTop:1 }} />
                  <span style={{ color:"rgba(101,67,14,0.7)", fontSize:".8rem", lineHeight:1.5, transition:"color .2s" }}>{text}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ borderTop:"1px solid rgba(201,162,39,0.15)", paddingTop:24, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <p style={{ color:"rgba(101,67,14,0.6)", fontSize:".78rem" }}>
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <div style={{ display:"flex", gap:20 }}>
            {["Kebijakan Privasi","Syarat & Ketentuan","Sitemap"].map(item => (
              <a key={item} href="#" style={{ color:"rgba(101,67,14,0.6)", fontSize:".75rem", textDecoration:"none", transition:"color .2s" }}
                onMouseEnter={e => (e.target as HTMLElement).style.color="#8B6010"}
                onMouseLeave={e => (e.target as HTMLElement).style.color="rgba(101,67,14,0.6)"}
              >{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
