"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { ChevronDown, HelpCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { FAQ_ITEMS } from "@/lib/constants";

interface FAQItem { id?: number; question: string; answer: string; }

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [items, setItems] = useState<FAQItem[]>(FAQ_ITEMS);

  useEffect(() => {
    (supabase.from("faq_items") as any)
      .select("id, pertanyaan, jawaban")
      .eq("is_active", true)
      .order("urutan", { ascending: true })
      .then(({ data }: any) => {
        if (data?.length) {
          setItems(data.map((d: any) => ({ id: d.id, question: d.pertanyaan, answer: d.jawaban })));
        }
      });
  }, []);

  return (
    <section id="faq" className="py-20 lg:py-28 relative">
      <div className="absolute inset-0" style={{ background:"transparent" }} />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-12">
          <Badge variant="gold" className="mb-4">FAQ</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ color:"#2D1B00" }}>
            Pertanyaan <span className="text-gold-gradient">Umum</span>
          </h2>
          <p style={{ color:"rgba(45,27,0,0.8)" }}>Temukan jawaban atas pertanyaan yang paling sering ditanyakan.</p>
        </motion.div>

        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div key={item.id ?? i} initial={{ opacity:0, y:15 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay: i * 0.07 }}
              style={{ background:"rgba(255,255,255,0.72)", borderRadius:16, overflow:"hidden", border:"1px solid rgba(201,162,39,0.2)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor="rgba(201,162,39,0.4)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor="rgba(201,162,39,0.2)"}>
              <button onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left gap-4">
                <div className="flex items-center gap-3">
                  <HelpCircle style={{ width:20, height:20, flexShrink:0, color: openIndex === i ? "#8B6010" : "rgba(101,67,14,0.5)", transition:"color .2s" }} />
                  <span style={{ fontWeight:600, fontSize:".9rem", color: openIndex === i ? "#2D1B00" : "rgba(45,27,0,0.85)", transition:"color .2s" }}>
                    {item.question}
                  </span>
                </div>
                <motion.div animate={{ rotate: openIndex === i ? 180 : 0 }} transition={{ duration:0.3 }}>
                  <ChevronDown style={{ width:20, height:20, flexShrink:0, color: openIndex === i ? "#8B6010" : "rgba(101,67,14,0.5)", transition:"color .2s" }} />
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === i && (
                  <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.3 }}>
                    <div className="px-5 pb-5 pl-14 text-sm leading-relaxed" style={{ borderTop:"1px solid rgba(201,162,39,0.15)", color:"rgba(45,27,0,0.85)" }}>
                      <p className="pt-4">{item.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }} className="text-center mt-10">
          <p className="text-sm" style={{ color:"rgba(101,67,14,0.7)" }}>
            Masih ada pertanyaan?{" "}
            <a href="/#kontak" style={{ color:"#8B6010", fontWeight:600 }} className="hover:opacity-80 transition-opacity">
              Hubungi kami →
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
