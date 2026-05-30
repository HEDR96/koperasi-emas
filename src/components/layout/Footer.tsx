"use client";

import Link from "next/link";
import { Shield, Award, Phone, Mail, MapPin, AtSign } from "lucide-react";
import { SITE_CONFIG, NAV_ITEMS } from "@/lib/constants";

export default function Footer() {
  return (
    <footer style={{ background:"#060606", borderTop:"1px solid rgba(212,175,55,0.08)", position:"relative" }}>
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"64px 24px 32px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:40, marginBottom:48 }}>

          {/* Brand */}
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <img src="/logo.jpg" alt="KE" style={{ width:42, height:42, objectFit:"cover", borderRadius:"50%" }}
                onError={e => { const el = e.currentTarget as HTMLImageElement; el.style.display="none"; (el.nextElementSibling as HTMLElement).style.display="flex"; }}
              />
              <div className="bg-gold-gradient" style={{ width:42, height:42, borderRadius:10, display:"none", alignItems:"center", justifyContent:"center", fontSize:"1.1rem", fontWeight:900, color:"#0a0a0a", flexShrink:0 }}>K</div>
              <div className="text-gold-gradient" style={{ fontWeight:900, fontSize:".82rem", letterSpacing:".02em" }}>KOPERASI EMAS</div>
            </div>
            <p style={{ color:"rgba(255,255,255,0.70)", fontSize:".82rem", lineHeight:1.7, marginBottom:16 }}>
              Platform koperasi emas terpercaya untuk 150.000+ anggota Indonesia.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { Icon: Award, text: `BH: ${SITE_CONFIG.legalNumber}` },
                { Icon: Shield, text: "Terdaftar Kemenkop UKM RI" },
              ].map(({ Icon, text }) => (
                <div key={text} style={{ display:"flex", alignItems:"center", gap:8, color:"rgba(255,255,255,0.3)", fontSize:".75rem" }}>
                  <Icon style={{ width:13, height:13, color:"#D4AF37", flexShrink:0 }} />
                  <span style={{ color:"rgba(255,255,255,0.65)" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div>
            <h3 style={{ color:"#fff", fontWeight:700, fontSize:".85rem", marginBottom:16 }}>Navigasi</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {NAV_ITEMS.map(item => (
                <Link key={item.label} href={item.href} style={{ color:"rgba(255,255,255,0.65)", fontSize:".82rem", textDecoration:"none", transition:"color .2s" }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color="#D4AF37"}
                  onMouseLeave={e => (e.target as HTMLElement).style.color="rgba(255,255,255,0.65)"}
                >{item.label}</Link>
              ))}
            </div>
          </div>

          {/* Layanan */}
          <div>
            <h3 style={{ color:"#fff", fontWeight:700, fontSize:".85rem", marginBottom:16 }}>Layanan</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { label:"Tabungan Emas",   href:"/#simulasi"      },
                { label:"Cicilan Emas",    href:"/#simulasi"      },
                { label:"Buyback Emas",    href:"/#simulasi"      },
                { label:"Investasi Emas",  href:"/#simulasi"      },
                { label:"Referral Program",href:"/auth/register"  },
                { label:"E-Wallet",        href:"/auth/login"     },
              ].map(item => (
                <Link key={item.label} href={item.href} style={{ color:"rgba(255,255,255,0.65)", fontSize:".82rem", textDecoration:"none", transition:"color .2s" }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color="#D4AF37"}
                  onMouseLeave={e => (e.target as HTMLElement).style.color="rgba(255,255,255,0.65)"}
                >{item.label}</Link>
              ))}
            </div>
          </div>

          {/* Kontak */}
          <div>
            <h3 style={{ color:"#fff", fontWeight:700, fontSize:".85rem", marginBottom:16 }}>Kontak</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[
                { Icon: MapPin,  text: SITE_CONFIG.address,   href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE_CONFIG.address)}` },
                { Icon: Phone,   text: SITE_CONFIG.phone,     href: `tel:${SITE_CONFIG.phone.replace(/\s/g,"")}` },
                { Icon: Mail,    text: SITE_CONFIG.email,     href: `mailto:${SITE_CONFIG.email}` },
                { Icon: AtSign,  text: SITE_CONFIG.instagram, href: `https://instagram.com/${SITE_CONFIG.instagram.replace("@","")}` },
              ].map(({ Icon, text, href }) => (
                <a key={text} href={href} target="_blank" rel="noopener noreferrer"
                  style={{ display:"flex", alignItems:"flex-start", gap:10, textDecoration:"none" }}
                  onMouseEnter={e => { const el = e.currentTarget; el.querySelectorAll("span").forEach(s => (s.style.color="#D4AF37")); }}
                  onMouseLeave={e => { const el = e.currentTarget; el.querySelectorAll("span").forEach(s => (s.style.color="rgba(255,255,255,0.65)")); }}
                >
                  <Icon style={{ width:15, height:15, color:"#D4AF37", flexShrink:0, marginTop:1 }} />
                  <span style={{ color:"rgba(255,255,255,0.65)", fontSize:".8rem", lineHeight:1.5, transition:"color .2s" }}>{text}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", paddingTop:24, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <p style={{ color:"rgba(255,255,255,0.55)", fontSize:".78rem" }}>
            © {new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved.
          </p>
          <div style={{ display:"flex", gap:20 }}>
            {["Kebijakan Privasi","Syarat & Ketentuan","Sitemap"].map(item => (
              <a key={item} href="#" style={{ color:"rgba(255,255,255,0.55)", fontSize:".75rem", textDecoration:"none", transition:"color .2s" }}
                onMouseEnter={e => (e.target as HTMLElement).style.color="#D4AF37"}
                onMouseLeave={e => (e.target as HTMLElement).style.color="rgba(255,255,255,0.55)"}
              >{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
