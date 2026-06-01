"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, RefreshCw, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface HargaBerat {
  id: number;
  gram: number;
  harga: number;
  created_at: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);

export default function GoldPriceSection() {
  const [prices, setPrices]     = useState<HargaBerat[]>([]);
  const [loading, setLoading]   = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  async function load() {
    setLoading(true);
    try {
      const { data: all } = await (supabase.from("harga_emas_berat") as any)
        .select("id, gram, harga, created_at")
        .eq("kategori", "emas")
        .order("created_at", { ascending: false })
        .limit(200);

      if (all?.length) {
        const seen = new Set<number>();
        const latest: HargaBerat[] = [];
        for (const row of all) {
          const g = Number(row.gram);
          if (!seen.has(g)) { seen.add(g); latest.push({ ...row, gram: g }); }
        }
        latest.sort((a, b) => a.gram - b.gram);
        setPrices(latest);
        if (latest[0]) setLastUpdate(latest[0].created_at);
      }
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <section id="harga-emas" style={{ padding:"80px 0", background:"linear-gradient(180deg,#0a0a0a 0%,#0d0d00 50%,#0a0a0a 100%)", position:"relative" }}>
      <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"60%", height:"60%", background:"radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 70%)", pointerEvents:"none" }} />

      <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px", position:"relative" }}>

        {/* Header */}
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:"center", marginBottom:48 }}
        >
          <span className="badge-gold" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 16px", borderRadius:20, fontSize:".78rem", fontWeight:600, marginBottom:16 }}>
            ● Harga Terkini
          </span>
          <h2 style={{ fontSize:"clamp(1.8rem,4vw,3rem)", fontWeight:900, color:"#fff", marginBottom:12, lineHeight:1.1 }}>
            Harga Emas <span className="text-gold-gradient">Hari Ini</span>
          </h2>
          {lastUpdate && (
            <span suppressHydrationWarning style={{ color:"rgba(255,255,255,0.55)", display:"inline-flex", alignItems:"center", gap:6, fontSize:".82rem" }}>
              <Clock style={{ width:14, height:14 }} />
              Update: {new Date(lastUpdate).toLocaleString("id-ID", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}
            </span>
          )}
        </motion.div>

        {/* Price Table */}
        {loading ? (
          <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", padding:"40px 0" }}>Memuat harga...</div>
        ) : prices.length === 0 ? (
          <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", padding:"40px 0" }}>Harga belum tersedia. Hubungi admin.</div>
        ) : (
          <motion.div initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
            style={{ background:"rgba(12,12,12,0.8)", border:"1px solid rgba(212,175,55,0.18)", borderRadius:20, overflow:"hidden", backdropFilter:"blur(12px)", marginBottom:28 }}>
            <div style={{ padding:"16px 24px", borderBottom:"1px solid rgba(212,175,55,0.1)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
              <h3 style={{ color:"#fff", fontWeight:700, fontSize:"1rem", margin:0 }}>Daftar Harga Beli Emas</h3>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem" }}>per berat · harga anggota koperasi</span>
                <button onClick={load} style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:8, fontSize:".75rem", cursor:"pointer", background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.2)", color:"#D4AF37" }}>
                  <RefreshCw style={{ width:11, height:11, animation: loading ? "spin 1s linear infinite" : "none" }} /> Refresh
                </button>
              </div>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    {["Berat (gram)", "Harga Beli", "Tren"].map(h => (
                      <th key={h} style={{ padding:"12px 24px", textAlign:"left", color:"rgba(255,255,255,0.35)", fontSize:".73rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prices.map((p, i) => (
                    <tr key={p.gram} style={{ borderBottom: i < prices.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <td style={{ padding:"14px 24px" }}>
                        <span style={{ color:"#fff", fontWeight:700, fontSize:"1rem" }}>{p.gram % 1 === 0 ? p.gram : p.gram.toFixed(1)} gram</span>
                      </td>
                      <td style={{ padding:"14px 24px" }}>
                        <span style={{ color:"#D4AF37", fontWeight:900, fontSize:"1.05rem" }}>{fmt(p.harga)}</span>
                      </td>
                      <td style={{ padding:"14px 24px" }}>
                        <span style={{ display:"inline-flex", alignItems:"center", gap:4, color:"#4ade80", fontSize:".8rem" }}>
                          <TrendingUp style={{ width:14, height:14 }} /> Aktif
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}
