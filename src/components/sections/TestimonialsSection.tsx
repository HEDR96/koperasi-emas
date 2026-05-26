"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

const TESTIMONIALS = [
  {
    id: 1, name: "Budi Santoso", role: "Pengusaha, Jakarta",
    avatar: "BS", rating: 5,
    comment: "Sudah 3 tahun menjadi member. Platform ini benar-benar memudahkan investasi emas saya. Proses buyback sangat cepat, dana cair dalam hitungan jam!",
    goldSaved: "125 gram", joinedYear: 2021,
  },
  {
    id: 2, name: "Siti Rahayu", role: "Ibu Rumah Tangga, Surabaya",
    avatar: "SR", rating: 5,
    comment: "Menabung emas mulai dari Rp 10.000 per hari. Tidak terasa sudah terkumpul 45 gram dalam 2 tahun. Sangat recommended untuk persiapan masa depan!",
    goldSaved: "45 gram", joinedYear: 2022,
  },
  {
    id: 3, name: "Ahmad Fauzi", role: "Karyawan Swasta, Bandung",
    avatar: "AF", rating: 5,
    comment: "Cicilan emas 0% sangat membantu. Saya bisa memiliki emas 50 gram dengan cicilan yang ringan tanpa khawatir bunga. Tim CS juga sangat responsif.",
    goldSaved: "50 gram", joinedYear: 2023,
  },
  {
    id: 4, name: "Dewi Kartika", role: "Dokter, Yogyakarta",
    avatar: "DK", rating: 5,
    comment: "Transparansi harga realtime sangat membantu pengambilan keputusan. Grafik dan analisis yang disediakan sangat informatif untuk investor serius.",
    goldSaved: "200 gram", joinedYear: 2020,
  },
  {
    id: 5, name: "Rino Pratama", role: "Freelancer, Bali",
    avatar: "RP", rating: 4,
    comment: "Program referral-nya keren! Sudah dapat bonus Rp 1.5 juta hanya dari mengajak teman. Platform yang benar-benar menguntungkan dari berbagai sisi.",
    goldSaved: "30 gram", joinedYear: 2023,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);

  const prev = () => { setDirection(-1); setActive((a) => (a - 1 + TESTIMONIALS.length) % TESTIMONIALS.length); };
  const next = () => { setDirection(1); setActive((a) => (a + 1) % TESTIMONIALS.length); };

  useEffect(() => {
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0d0d00]/20 to-black" />
      <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[60vw] h-[60vh] rounded-full bg-yellow-500/3 blur-[100px]" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="gold" className="mb-4">Testimoni Member</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
            Dipercaya <span className="text-gold-gradient">150.000+ Member</span>
          </h2>
          <p className="text-white/80">Cerita sukses anggota koperasi dari seluruh Indonesia.</p>
        </motion.div>

        <div className="relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={active}
              custom={direction}
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 60 }}
              transition={{ duration: 0.4 }}
              className="glass-dark gold-border-glow rounded-3xl p-8 lg:p-12"
            >
              <Quote className="w-10 h-10 text-yellow-400/30 mb-6" />
              <p className="text-xl lg:text-2xl text-white/90 font-medium leading-relaxed mb-8 italic">
                "{TESTIMONIALS[active].comment}"
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gold-gradient flex items-center justify-center font-black text-black text-sm">
                    {TESTIMONIALS[active].avatar}
                  </div>
                  <div>
                    <p className="font-bold text-white">{TESTIMONIALS[active].name}</p>
                    <p className="text-sm text-white/70">{TESTIMONIALS[active].role}</p>
                    <StarRating rating={TESTIMONIALS[active].rating} />
                  </div>
                </div>
                <div className="flex gap-4 text-center">
                  <div>
                    <p className="text-gold-gradient font-black text-lg">{TESTIMONIALS[active].goldSaved}</p>
                    <p className="text-xs text-white/70">Emas Terkumpul</p>
                  </div>
                  <div>
                    <p className="text-gold-gradient font-black text-lg">{TESTIMONIALS[active].joinedYear}</p>
                    <p className="text-xs text-white/70">Bergabung</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <button onClick={prev} className="absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 glass-dark gold-border-glow rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors z-10 hidden sm:flex">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next} className="absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 glass-dark gold-border-glow rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors z-10 hidden sm:flex">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Thumbs */}
        <div className="flex justify-center gap-3 mt-8">
          {TESTIMONIALS.map((t, i) => (
            <button
              key={t.id}
              onClick={() => { setDirection(i > active ? 1 : -1); setActive(i); }}
              className={`w-10 h-10 rounded-full transition-all duration-300 flex items-center justify-center text-xs font-bold ${
                i === active ? "bg-gold-gradient text-black scale-110 shadow-lg shadow-yellow-500/30" : "glass-dark text-white/70 hover:text-white"
              }`}
            >
              {t.avatar}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
