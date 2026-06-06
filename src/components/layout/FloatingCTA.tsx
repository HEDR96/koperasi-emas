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
        className="fixed bottom-6 right-6 z-50 w-12 h-12 glass-dark gold-border-glow rounded-full flex items-center justify-center text-yellow-400 hover:text-white hover:bg-yellow-500/10 transition-all duration-300 shadow-lg"
      >
        <ChevronUp className="w-5 h-5" />
      </motion.button>

      {/* WhatsApp FAB */}
      <div style={{ position:"fixed", bottom:88, right:24, zIndex:50, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:12 }}>
        <AnimatePresence>
          {open && (
            <>
              {[
                { icon: Phone, label: "Telepon Kami", href: `tel:${(s.phone || SITE_CONFIG.phone).replace(/\s/g,"")}`, color: "text-blue-400" },
                { icon: Mail, label: "Email Kami", href: `mailto:${s.email || SITE_CONFIG.email}`, color: "text-purple-400" },
                { icon: MessageCircle, label: "WhatsApp", href: `https://wa.me/${waNumber(s.whatsapp) || SITE_CONFIG.whatsapp}`, color: "text-green-400" },
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
                    className="flex items-center gap-3 glass-dark gold-border-glow rounded-full px-4 py-2.5 hover:border-yellow-500/40 transition-all duration-200 shadow-lg"
                  >
                    <span className="text-white/85 text-sm whitespace-nowrap">{item.label}</span>
                    <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </motion.a>
                );
              })}
            </>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setOpen(!open)}
          className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center shadow-xl shadow-green-500/30 transition-all duration-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div key="x" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>
                <X className="w-6 h-6 text-white" />
              </motion.div>
            ) : (
              <motion.div key="wa" initial={{ rotate: 90 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }}>
                <MessageCircle className="w-6 h-6 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  );
}
