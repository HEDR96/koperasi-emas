"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { ChevronDown, HelpCircle } from "lucide-react";
import { FAQ_ITEMS } from "@/lib/constants";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 lg:py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0d0900]/30 to-black" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="gold" className="mb-4">FAQ</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
            Pertanyaan <span className="text-gold-gradient">Umum</span>
          </h2>
          <p className="text-white/80">Temukan jawaban atas pertanyaan yang paling sering ditanyakan.</p>
        </motion.div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="glass-dark rounded-2xl overflow-hidden border border-white/5 hover:border-yellow-500/20 transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left gap-4"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className={`w-5 h-5 flex-shrink-0 transition-colors ${openIndex === i ? "text-yellow-400" : "text-white/55"}`} />
                  <span className={`font-semibold text-sm sm:text-base transition-colors ${openIndex === i ? "text-white" : "text-white/90"}`}>
                    {item.question}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-colors ${openIndex === i ? "text-yellow-400" : "text-white/55"}`} />
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-5 pb-5 pl-14 text-white/85 text-sm leading-relaxed border-t border-yellow-500/10">
                      <p className="pt-4">{item.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <p className="text-white/70 text-sm">
            Masih ada pertanyaan?{" "}
            <a href="/#kontak" className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors">
              Hubungi kami →
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
