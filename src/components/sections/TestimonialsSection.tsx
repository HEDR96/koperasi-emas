"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/store/useSettingsStore";
import { isDemoMode, DEMO_TESTIMONIALS } from "@/lib/demo";

interface Testimonial {
  id: number;
  nama: string;
  peran: string;
  inisial: string;
  rating: number;
  komentar: string;
  emas_saved: string;
  tahun_gabung: number;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-4 h-4 ${i < rating ? "text-yellow-500 fill-yellow-500" : "text-yellow-300/40"}`} />
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  const s = useSiteSettings();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (isDemoMode()) { setItems(DEMO_TESTIMONIALS); return; }
    (supabase.from("testimonials") as any)
      .select("id,nama,peran,inisial,rating,komentar,emas_saved,tahun_gabung")
      .eq("is_active", true)
      .order("urutan", { ascending: true })
      .then(({ data }: any) => {
        if (data?.length) setItems(data);
      });
  }, []);

  const prev = () => { setDirection(-1); setActive(a => (a - 1 + items.length) % items.length); };
  const next = () => { setDirection(1);  setActive(a => (a + 1) % items.length); };

  useEffect(() => {
    if (!items.length) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [items.length, active]);

  if (!items.length) return null;

  const t = items[active];

  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute inset-0" style={{ background:"transparent" }} />
      <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[60vw] h-[60vh] rounded-full" style={{ background:"rgba(201,162,39,0.05)", filter:"blur(100px)" }} />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-12">
          <Badge variant="gold" className="mb-4">{s.testimoniBadge || "Testimoni Anggota"}</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ color:"#2D1B00" }}>
            Dipercaya <span className="text-gold-gradient">{s.totalAnggota || "150.000+"} Anggota</span>
          </h2>
          <p style={{ color:"rgba(45,27,0,0.8)" }}>{s.testimoniSubtitle || "Cerita sukses anggota koperasi dari seluruh Indonesia."}</p>
        </motion.div>

        <div className="relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={active}
              custom={direction}
              initial={{ opacity:0, x: direction * 60 }}
              animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x: -direction * 60 }}
              transition={{ duration:0.4 }}
              style={{ background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.22)", borderRadius:24, padding:"32px 48px", backdropFilter:"blur(12px)" }}
            >
              <Quote className="w-10 h-10 mb-6" style={{ color:"rgba(139,96,16,0.3)" }} />
              <p className="text-xl lg:text-2xl font-medium leading-relaxed mb-8 italic" style={{ color:"rgba(45,27,0,0.9)" }}>
                "{t.komentar}"
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gold-gradient flex items-center justify-center font-black text-black text-sm">
                    {t.inisial || t.nama.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold" style={{ color:"#2D1B00" }}>{t.nama}</p>
                    <p className="text-sm" style={{ color:"rgba(101,67,14,0.7)" }}>{t.peran}</p>
                    <StarRating rating={t.rating} />
                  </div>
                </div>
                <div className="flex gap-4 text-center">
                  {t.emas_saved && (
                    <div>
                      <p className="text-gold-gradient font-black text-lg">{t.emas_saved}</p>
                      <p className="text-xs" style={{ color:"rgba(101,67,14,0.7)" }}>Emas Terkumpul</p>
                    </div>
                  )}
                  {t.tahun_gabung && (
                    <div>
                      <p className="text-gold-gradient font-black text-lg">{t.tahun_gabung}</p>
                      <p className="text-xs" style={{ color:"rgba(101,67,14,0.7)" }}>Bergabung</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {items.length > 1 && (
            <>
              <button onClick={prev} style={{ background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.22)", color:"rgba(101,67,14,0.7)" }} className="absolute -left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center hover:text-black transition-colors z-10 hidden sm:flex">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={next} style={{ background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.22)", color:"rgba(101,67,14,0.7)" }} className="absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center hover:text-black transition-colors z-10 hidden sm:flex">
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {items.length > 1 && (
          <div className="flex justify-center gap-3 mt-8">
            {items.map((item, i) => (
              <button key={item.id} onClick={() => { setDirection(i > active ? 1 : -1); setActive(i); }}
                style={{
                  width:40, height:40, borderRadius:"50%", transition:"all .3s", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".75rem", fontWeight:700,
                  ...(i === active
                    ? { background:"linear-gradient(135deg,#C9A227,#F5D060)", color:"#2D1B00", boxShadow:"0 4px 12px rgba(201,162,39,0.3)" }
                    : { background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.22)", color:"rgba(101,67,14,0.7)" })
                }}>
                {item.inisial || item.nama.slice(0,2).toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
