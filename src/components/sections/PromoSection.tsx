"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { Tag, Gift, Users, Zap, Clock, ChevronLeft, ChevronRight } from "lucide-react";

const PROMOS = [
  {
    id: 1, type: "cashback", tag: "Cashback 10%",
    title: "Cashback untuk Member Baru",
    desc: "Dapatkan cashback 10% untuk pembelian emas pertama Anda. Berlaku 30 hari setelah pendaftaran.",
    color: "from-yellow-500/20 via-yellow-600/10 to-transparent",
    icon: Tag, endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    badge: "Terbatas",
  },
  {
    id: 2, type: "bonus", tag: "Bonus Emas",
    title: "Bonus 0.5g Emas Murni",
    desc: "Bonus 0.5 gram emas untuk setiap pembelian minimal 10 gram selama bulan ini.",
    color: "from-amber-500/20 via-amber-600/10 to-transparent",
    icon: Gift, endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    badge: "Hot",
  },
  {
    id: 3, type: "referral", tag: "Referral Reward",
    title: "Ajak Teman, Dapat Emas",
    desc: "Dapatkan bonus Rp 50.000 untuk setiap teman yang Anda ajak bergabung dan bertransaksi.",
    color: "from-orange-500/20 via-orange-600/10 to-transparent",
    icon: Users, endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    badge: "Unlimited",
  },
  {
    id: 4, type: "event", tag: "Event Spesial",
    title: "Hari Jadi Koperasi - Cicilan 0%",
    desc: "Rayakan ulang tahun kami! Nikmati cicilan 0% untuk semua tenor di bulan Agustus.",
    color: "from-yellow-400/20 via-yellow-500/10 to-transparent",
    icon: Zap, endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    badge: "Eksklusif",
  },
];

function Countdown({ endDate }: { endDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = endDate.getTime() - Date.now();
      if (diff <= 0) return;
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endDate]);

  return (
    <div className="flex items-center gap-1 text-xs">
      <Clock className="w-3 h-3 text-yellow-400" />
      <span className="text-white/40">Berakhir:</span>
      {[{ label: "H", val: timeLeft.d }, { label: "J", val: timeLeft.h }, { label: "M", val: timeLeft.m }, { label: "D", val: timeLeft.s }].map(({ label, val }) => (
        <span key={label} className="flex items-center gap-0.5">
          <span className="bg-yellow-500/20 text-yellow-400 font-bold rounded px-1.5 py-0.5 min-w-[2rem] text-center">
            {String(val).padStart(2, "0")}
          </span>
          <span className="text-white/30">{label}</span>
        </span>
      ))}
    </div>
  );
}

export default function PromoSection() {
  const [active, setActive] = useState(0);

  const prev = () => setActive((a) => (a - 1 + PROMOS.length) % PROMOS.length);
  const next = () => setActive((a) => (a + 1) % PROMOS.length);

  useEffect(() => {
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, []);

  const promo = PROMOS[active];
  const Icon = promo.icon;

  return (
    <section id="promo" className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0d0900]/40 to-black" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="gold" className="mb-4">Penawaran Terbaik</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
            Promo <span className="text-gold-gradient">Eksklusif Member</span>
          </h2>
        </motion.div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.4 }}
              className={`relative overflow-hidden rounded-3xl glass-dark gold-border-glow p-8 lg:p-12 bg-gradient-to-br ${promo.color}`}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 flex items-center justify-center flex-shrink-0 pulse-glow">
                  <Icon className="w-10 h-10 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="gold">{promo.tag}</Badge>
                    <Badge variant="warning">{promo.badge}</Badge>
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-black text-white mb-3">{promo.title}</h3>
                  <p className="text-white/60 text-base lg:text-lg mb-4 max-w-2xl">{promo.desc}</p>
                  <Countdown endDate={promo.endDate} />
                </div>
                <button className="btn-gold text-black font-bold px-8 py-4 rounded-xl text-base flex-shrink-0">
                  Klaim Promo
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Nav buttons */}
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 glass-dark gold-border-glow rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors z-10">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 glass-dark gold-border-glow rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors z-10">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {PROMOS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === active ? "w-8 bg-yellow-400" : "w-2 bg-white/20"}`}
            />
          ))}
        </div>

        {/* Grid cards below */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          {PROMOS.map((p, i) => {
            const PIcon = p.icon;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setActive(i)}
                className={`cursor-pointer glass-dark rounded-2xl p-5 transition-all duration-300 ${i === active ? "border border-yellow-500/40 gold-glow" : "border border-white/5 hover:border-yellow-500/20"}`}
              >
                <PIcon className="w-6 h-6 text-yellow-400 mb-3" />
                <p className="text-sm font-bold text-white mb-1">{p.title}</p>
                <p className="text-xs text-white/40">{p.tag}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
