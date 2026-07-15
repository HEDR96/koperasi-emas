"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Phone, Mail, ChevronUp } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";
import { useSiteSettings, waNumber } from "@/store/useSettingsStore";

export default function FloatingCTA() {
  const s = useSiteSettings();
  const [open, setOpen] = useState(false);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      {/* Scroll to top */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={scrollToTop}
        style={{ position:"fixed", bottom:24, right:24, zIndex:50, width:48, height:48, borderRadius:"50%", background:"rgba(255,252,220,0.92)", border:"1px solid rgba(201,162,39,0.35)", display:"flex", alignItems:"center", justifyContent:"center", color:"#8B6010", boxShadow:"0 4px 16px rgba(201,162,39,0.2)", cursor:"pointer", transition:"all .3s" }}
      >
        <ChevronUp style={{ width:20, height:20 }} />
      </motion.button>

      {/* WhatsApp FAB */}
      <div style={{ position:"fixed", bottom:88, right:24, zIndex:50, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:12 }}>
        <AnimatePresence>
          {open && (
            <>
              {[
                { icon: Phone, label: "Telepon Kami", href: `tel:${(s.phone || SITE_CONFIG.phone).replace(/\s/g,"")}`, color: "#1d4ed8" },
                { icon: Mail, label: "Email Kami", href: `mailto:${s.email || SITE_CONFIG.email}`, color: "#7c3aed" },
                { icon: MessageCircle, label: "WhatsApp", href: `https://wa.me/${waNumber(s.whatsapp) || SITE_CONFIG.whatsapp}`, color: "#15803d" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    initial={{ opacity: 0, scale: 0, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0, y: 20 }}
                    transition={{ delay: i * 0.05 }}
                    style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(255,252,220,0.95)", border:"1px solid rgba(201,162,39,0.3)", borderRadius:50, padding:"10px 16px", boxShadow:"0 4px 16px rgba(201,162,39,0.15)", textDecoration:"none", transition:"all .2s" }}
                  >
                    <span style={{ color:"rgba(45,27,0,0.85)", fontSize:".875rem", whiteSpace:"nowrap" }}>{item.label}</span>
                    <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,0.72)", display:"flex", alignItems:"center", justifyContent:"center", color:item.color }}>
                      <Icon style={{ width:16, height:16 }} />
                    </div>
                  </motion.a>
                );
              })}
            </>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setOpen(!open)}
          style={{ width:56, height:56, borderRadius:"50%", background:"#16a34a", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 8px 24px rgba(22,163,74,0.35)", border:"none", cursor:"pointer", transition:"all .3s" }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div key="x" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>
                <X style={{ width:24, height:24, color:"#fff" }} />
              </motion.div>
            ) : (
              <motion.div key="wa" initial={{ rotate: 90 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }}>
                <MessageCircle style={{ width:24, height:24, color:"#fff" }} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  );
}
