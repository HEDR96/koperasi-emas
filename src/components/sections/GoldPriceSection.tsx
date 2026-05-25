"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, RefreshCw, Clock, Star } from "lucide-react";
import { useGoldStore } from "@/store/useGoldStore";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { MOCK_CHART_DATA } from "@/lib/constants";

// Dynamic import to avoid SSR issues with recharts
const Chart = dynamic(() => import("./GoldChart"), { ssr: false, loading: () => (
  <div style={{ height: 280, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.2)" }}>Memuat grafik...</div>
)});

function PriceCard({ label, price, badge, trend, delay, sub }: {
  label: string; price: number; badge?: string; trend?: string; delay: number; sub: string;
}) {
  return (
    <motion.div
      initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay }}
      className="card-hover"
      style={{ background:"rgba(15,15,15,0.7)", border:"1px solid rgba(212,175,55,0.18)", borderRadius:18, padding:"22px 20px", backdropFilter:"blur(12px)" }}
    >
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <span style={{ color:"rgba(255,255,255,0.45)", fontSize:".8rem", fontWeight:500 }}>{label}</span>
        {badge && (
          <span className="badge-gold" style={{ padding:"2px 10px", borderRadius:20, fontSize:".7rem", fontWeight:600 }}>{badge}</span>
        )}
      </div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:8, marginBottom:6 }}>
        <span style={{ fontSize:"clamp(1.2rem,2.5vw,1.6rem)", fontWeight:900, color:"#fff", lineHeight:1 }}>{formatCurrency(price)}</span>
        {trend === "up" && <TrendingUp style={{ width:18, height:18, color:"#4ade80", marginBottom:2 }} />}
        {trend === "down" && <TrendingDown style={{ width:18, height:18, color:"#f87171", marginBottom:2 }} />}
      </div>
      <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem" }}>{sub}</p>
    </motion.div>
  );
}

export default function GoldPriceSection() {
  const { prices, isLoading, fetchPrices } = useGoldStore();

  useEffect(() => {
    const t = setInterval(fetchPrices, 30000);
    return () => clearInterval(t);
  }, [fetchPrices]);

  const isUp = prices.trend === "up";

  return (
    <section id="harga-emas" style={{ padding:"80px 0", background:"linear-gradient(180deg,#0a0a0a 0%,#0d0d00 50%,#0a0a0a 100%)", position:"relative" }}>
      {/* Section glow */}
      <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"60%", height:"60%", background:"radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)", pointerEvents:"none" }} />

      <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px", position:"relative" }}>

        {/* Header */}
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:"center", marginBottom:48 }}
        >
          <span className="badge-gold" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 16px", borderRadius:20, fontSize:".78rem", fontWeight:600, marginBottom:16 }}>
            ● Harga Realtime
          </span>
          <h2 style={{ fontSize:"clamp(1.8rem,4vw,3rem)", fontWeight:900, color:"#fff", marginBottom:12, lineHeight:1.1 }}>
            Harga Emas{" "}
            <span className="text-gold-gradient">Hari Ini</span>
          </h2>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16, fontSize:".82rem", flexWrap:"wrap" }}>
            <span style={{ color:"rgba(255,255,255,0.35)", display:"flex", alignItems:"center", gap:6 }}>
              <Clock style={{ width:14, height:14 }} />
              Update: {formatDateTime(prices.lastUpdate)}
            </span>
            <span style={{ color: isUp ? "#4ade80" : "#f87171", fontWeight:700, display:"flex", alignItems:"center", gap:4 }}>
              {isUp ? <TrendingUp style={{ width:14, height:14 }} /> : <TrendingDown style={{ width:14, height:14 }} />}
              {isUp ? "+" : ""}{formatCurrency(prices.change)} ({prices.changePercent > 0 ? "+" : ""}{prices.changePercent}%)
            </span>
          </div>
        </motion.div>

        {/* Price Cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16, marginBottom:32 }}>
          <PriceCard label="Harga Beli Member" price={prices.buyMember} badge="Member" trend={prices.trend} delay={0} sub="per gram · khusus anggota" />
          <PriceCard label="Harga Beli Umum" price={prices.buyNonMember} trend={prices.trend} delay={.1} sub="per gram · non-member" />
          <PriceCard label="Buyback Member" price={prices.buybackMember} badge="Terbaik" trend={prices.trend} delay={.2} sub="per gram · harga beli koperasi" />
          <PriceCard label="Buyback Non-Member" price={prices.buybackNonMember} trend={prices.trend} delay={.3} sub="per gram · harga standar" />
        </div>

        {/* Chart */}
        <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:.2 }}
          style={{ background:"rgba(12,12,12,0.8)", border:"1px solid rgba(212,175,55,0.18)", borderRadius:20, padding:"28px 24px", backdropFilter:"blur(12px)" }}
        >
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
            <div>
              <h3 style={{ color:"#fff", fontWeight:700, fontSize:"1.05rem", marginBottom:4 }}>Grafik Harga 30 Hari</h3>
              <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".8rem" }}>Harga beli member per gram (IDR)</p>
            </div>
            <button onClick={fetchPrices} disabled={isLoading} className="btn-outline-gold"
              style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 16px", borderRadius:9, fontSize:".82rem", cursor:"pointer" }}>
              <RefreshCw style={{ width:14, height:14, animation: isLoading ? "spin 1s linear infinite" : "none" }} />
              Refresh
            </button>
          </div>
          <Chart data={MOCK_CHART_DATA} />
        </motion.div>

        {/* Member advantage */}
        <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:.3 }}
          style={{ marginTop:16, background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:16, padding:"18px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}
        >
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:11, background:"rgba(212,175,55,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Star style={{ width:20, height:20, color:"#D4AF37" }} />
            </div>
            <div>
              <p style={{ color:"#fff", fontWeight:600, fontSize:".9rem" }}>Hemat lebih banyak sebagai Member!</p>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem" }}>
                Selisih harga beli: {formatCurrency(prices.buyNonMember - prices.buyMember)}/gram vs non-member ·{" "}
                <span style={{ color:"rgba(212,175,55,0.7)" }}>Simpanan pokok Rp 5 jt · Wajib Rp 200 rb/bln</span>
              </p>
            </div>
          </div>
          <Link href="/auth/register">
            <button className="btn-gold" style={{ padding:"10px 22px", borderRadius:11, fontSize:".85rem", border:"none", cursor:"pointer", whiteSpace:"nowrap" }}>Daftar Jadi Member</button>
          </Link>
        </motion.div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}

