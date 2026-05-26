"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Gift, Zap, Star, TrendingDown, RefreshCw, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface GramPrice {
  gram_weight: number;
  price_member: number;
  price_non_member: number;
  buyback_price: number;
}
interface Promo {
  id: string;
  title: string;
  description?: string;
  type: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  gram_prices: GramPrice[];
}

const TYPE_ICON: Record<string, React.ElementType> = {
  harga: Tag, cashback: Gift, diskon: TrendingDown, bonus: Zap,
};
const TYPE_COLOR: Record<string, string> = {
  harga:"#D4AF37", cashback:"#4ade80", diskon:"#f87171", bonus:"#a78bfa",
};
const TYPE_LABEL: Record<string, string> = {
  harga:"Daftar Harga", cashback:"Cashback", diskon:"Diskon", bonus:"Bonus",
};

function PriceTable({ promo }: { promo: Promo }) {
  const sorted = [...promo.gram_prices].sort((a,b)=>a.gram_weight-b.gram_weight);
  const fmtPrice = (n: number) => "Rp " + Number(n).toLocaleString("id-ID");
  const fmtDate  = (s?: string) => s ? new Date(s).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}) : null;

  return (
    <motion.div
      initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true }} transition={{ duration:.5 }}
      style={{ background:"rgba(14,14,14,0.9)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:22, overflow:"hidden" }}>

      {/* Card header */}
      <div style={{ background:"linear-gradient(135deg,rgba(212,175,55,0.15),rgba(212,175,55,0.04))", borderBottom:"1px solid rgba(212,175,55,0.15)", padding:"18px 24px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ display:"flex", gap:5 }}>
              {[0,1,2].map(i=>(
                <Star key={i} style={{ width:14,height:14,color:"#D4AF37",fill:"#D4AF37" }} />
              ))}
            </div>
            <div>
              <p style={{ color:"#fff", fontWeight:900, fontSize:"1rem" }}>{promo.title}</p>
              {promo.description && <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem", marginTop:2 }}>{promo.description}</p>}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ background:"rgba(212,175,55,0.12)", color:"#D4AF37", borderRadius:8, padding:"4px 12px", fontSize:".72rem", fontWeight:700 }}>
              HARGA HARI INI
            </span>
            {(fmtDate(promo.start_date)||fmtDate(promo.end_date)) && (
              <span style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem" }}>
                {fmtDate(promo.start_date)} {fmtDate(promo.end_date) ? `– ${fmtDate(promo.end_date)}` : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Price table */}
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.02)" }}>
              <th style={{ padding:"10px 20px", textAlign:"left", color:"rgba(255,255,255,0.4)", fontSize:".72rem", fontWeight:600, whiteSpace:"nowrap" }}>GRAMASI</th>
              <th style={{ padding:"10px 20px", textAlign:"left", color:"rgba(255,255,255,0.4)", fontSize:".72rem", fontWeight:600, whiteSpace:"nowrap" }}>NON ANGGOTA</th>
              <th style={{ padding:"10px 20px", textAlign:"left", color:"#D4AF37", fontSize:".72rem", fontWeight:700, whiteSpace:"nowrap" }}>★ ANGGOTA</th>
              <th style={{ padding:"10px 20px", textAlign:"left", color:"rgba(255,255,255,0.4)", fontSize:".72rem", fontWeight:600, whiteSpace:"nowrap" }}>BUYBACK</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((gp, i) => (
              <tr key={gp.gram_weight} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)", background:i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>
                <td style={{ padding:"12px 20px" }}>
                  <span style={{ background:"rgba(212,175,55,0.12)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:8, padding:"4px 12px", color:"#D4AF37", fontWeight:800, fontSize:".85rem" }}>
                    {gp.gram_weight}g
                  </span>
                </td>
                <td style={{ padding:"12px 20px", color:"rgba(255,255,255,0.55)", fontSize:".9rem", fontWeight:500 }}>
                  {fmtPrice(gp.price_non_member)}
                </td>
                <td style={{ padding:"12px 20px" }}>
                  <div>
                    <p style={{ color:"#4ade80", fontSize:".95rem", fontWeight:800 }}>{fmtPrice(gp.price_member)}</p>
                    {gp.price_non_member > gp.price_member && gp.price_member > 0 && (
                      <p style={{ color:"rgba(74,222,128,0.55)", fontSize:".68rem", marginTop:2 }}>
                        Hemat Rp {(gp.price_non_member - gp.price_member).toLocaleString("id-ID")}
                      </p>
                    )}
                  </div>
                </td>
                <td style={{ padding:"12px 20px", color:"#60a5fa", fontSize:".9rem", fontWeight:500 }}>
                  {gp.buyback_price > 0 ? fmtPrice(gp.buyback_price) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding:"10px 20px", borderTop:"1px solid rgba(255,255,255,0.04)" }}>
        <p style={{ color:"rgba(255,255,255,0.2)", fontSize:".7rem" }}>
          ★ Harga anggota berlaku untuk anggota koperasi aktif. Harga dapat berubah sewaktu-waktu.
        </p>
      </div>
    </motion.div>
  );
}

function PromoCard({ promo, index }: { promo: Promo; index: number }) {
  const Icon = TYPE_ICON[promo.type] || Tag;
  const color = TYPE_COLOR[promo.type] || "#D4AF37";
  const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString("id-ID",{day:"2-digit",month:"short"}) : null;

  return (
    <motion.div
      initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true }} transition={{ delay:index*0.08 }}
      style={{ background:"rgba(14,14,14,0.85)", border:`1px solid ${color}30`, borderRadius:20, padding:24, display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
        <div style={{ width:48, height:48, borderRadius:14, background:`${color}15`, border:`1px solid ${color}25`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Icon style={{ width:22, height:22, color }} />
        </div>
        <span style={{ background:`${color}15`, color, borderRadius:8, padding:"3px 10px", fontSize:".7rem", fontWeight:700 }}>
          {TYPE_LABEL[promo.type] || promo.type}
        </span>
      </div>
      <div>
        <p style={{ color:"#fff", fontWeight:800, fontSize:"1rem", marginBottom:6 }}>{promo.title}</p>
        {promo.description && <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".83rem", lineHeight:1.6 }}>{promo.description}</p>}
      </div>
      {(fmtDate(promo.start_date)||fmtDate(promo.end_date)) && (
        <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".74rem" }}>
          📅 {fmtDate(promo.start_date)} {fmtDate(promo.end_date)?`– ${fmtDate(promo.end_date)}`:""}
        </p>
      )}
    </motion.div>
  );
}

export default function PromoSection() {
  const [promos, setPromos]     = useState<Promo[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeCard, setActiveCard] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: promosData } = await (supabase.from("promos") as any)
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (!promosData || promosData.length === 0) { setLoading(false); return; }

      const { data: gramData } = await (supabase.from("promo_gram_prices") as any)
        .select("*")
        .in("promo_id", promosData.map((p: Promo) => p.id))
        .order("gram_weight", { ascending: true });

      setPromos(promosData.map((p: Promo) => ({
        ...p,
        gram_prices: (gramData||[]).filter((g:{promo_id:string})=>g.promo_id===p.id)
          .sort((a:{gram_weight:number},b:{gram_weight:number})=>a.gram_weight-b.gram_weight),
      })));
      setLoading(false);
    }
    load();
  }, []);

  // Separate harga promos (price lists) from other promos (cashback etc)
  const hargaPromos = promos.filter(p => p.type === "harga" && p.gram_prices.length > 0);
  const otherPromos = promos.filter(p => p.type !== "harga" || p.gram_prices.length === 0);

  return (
    <section id="promo" style={{ padding:"80px 0", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,#000,rgba(13,9,0,0.5),#000)", pointerEvents:"none" }} />

      <div style={{ position:"relative", maxWidth:1200, margin:"0 auto", padding:"0 20px" }}>

        {/* Header */}
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:"center", marginBottom:48 }}>
          <span style={{ display:"inline-block", background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:20, padding:"5px 16px", color:"#D4AF37", fontWeight:700, fontSize:".78rem", marginBottom:14 }}>
            HARGA & PROMO TERKINI
          </span>
          <h2 style={{ color:"#fff", fontWeight:900, fontSize:"clamp(1.8rem,4vw,2.8rem)", marginBottom:12 }}>
            Harga Emas &{" "}
            <span className="text-gold-gradient">Penawaran Terbaik</span>
          </h2>
          <p style={{ color:"rgba(255,255,255,0.45)", fontSize:"clamp(.9rem,2vw,1.05rem)", maxWidth:520, margin:"0 auto" }}>
            Harga dan promo dikelola langsung oleh koperasi, diperbarui secara real-time.
          </p>
        </motion.div>

        {loading ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,0.3)" }}>
            <RefreshCw style={{ width:28, height:28, animation:"spin 1s linear infinite", margin:"0 auto 12px" }} />
            <p>Memuat harga & promo...</p>
          </div>
        ) : promos.length === 0 ? (
          /* No promos — fallback placeholder */
          <motion.div initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}
            style={{ textAlign:"center", padding:"60px 24px", background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.12)", borderRadius:22 }}>
            <Tag style={{ width:44, height:44, color:"rgba(212,175,55,0.3)", margin:"0 auto 16px" }} />
            <p style={{ color:"rgba(255,255,255,0.5)", fontSize:".95rem", fontWeight:600, marginBottom:8 }}>Promo akan segera tersedia</p>
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".83rem" }}>Admin sedang menyiapkan harga dan promo terbaru.</p>
          </motion.div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:32 }}>

            {/* Price list promos (harga) */}
            {hargaPromos.length > 0 && (
              <div>
                {hargaPromos.length > 1 && (
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                    <p style={{ color:"rgba(255,255,255,0.5)", fontSize:".82rem" }}>
                      {activeCard + 1} / {hargaPromos.length} daftar harga
                    </p>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={()=>setActiveCard(a=>(a-1+hargaPromos.length)%hargaPromos.length)}
                        style={{ width:32, height:32, borderRadius:8, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <ChevronLeft style={{ width:14, height:14 }} />
                      </button>
                      <button onClick={()=>setActiveCard(a=>(a+1)%hargaPromos.length)}
                        style={{ width:32, height:32, borderRadius:8, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <ChevronRight style={{ width:14, height:14 }} />
                      </button>
                    </div>
                  </div>
                )}
                <AnimatePresence mode="wait">
                  <motion.div key={activeCard}
                    initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }}
                    transition={{ duration:.25 }}>
                    <PriceTable promo={hargaPromos[activeCard]} />
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {/* Other promo cards */}
            {otherPromos.length > 0 && (
              <div>
                {hargaPromos.length > 0 && (
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".8rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", marginBottom:16 }}>
                    Penawaran Spesial
                  </p>
                )}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 }}>
                  {otherPromos.map((p, i) => (
                    <PromoCard key={p.id} promo={p} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
              style={{ textAlign:"center" }}>
              <Link href="/auth/login" style={{ textDecoration:"none" }}>
                <button className="btn-gold" style={{ padding:"13px 32px", borderRadius:14, border:"none", cursor:"pointer", fontSize:".95rem", fontWeight:700, display:"inline-flex", alignItems:"center", gap:8 }}>
                  Gabung & Dapatkan Harga Anggota
                  <ExternalLink style={{ width:15, height:15 }} />
                </button>
              </Link>
              <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".78rem", marginTop:10 }}>
                Harga anggota lebih hemat dari non-anggota
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}
