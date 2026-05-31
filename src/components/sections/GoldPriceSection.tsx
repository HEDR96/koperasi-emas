"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, RefreshCw, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";

const Chart = dynamic(() => import("./GoldChart"), { ssr: false, loading: () => (
  <div style={{ height: 280, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.2)" }}>Memuat grafik...</div>
)});

interface HargaBerat {
  id: number;
  gram: number;
  harga: number;
  created_at: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);

export default function GoldPriceSection() {
  const [prices, setPrices] = useState<HargaBerat[]>([]);
  const [history, setHistory] = useState<{ date: string; price: number }[]>([]);
  const [selectedGram, setSelectedGram] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [availableGrams, setAvailableGrams] = useState<number[]>([]);

  async function load() {
    setLoading(true);
    try {
      // Fetch all emas prices — deduplicate to latest per gram
      const { data: all } = await (supabase.from("harga_emas_berat") as any)
        .select("id, gram, harga, created_at")
        .eq("kategori", "emas")
        .order("created_at", { ascending: false })
        .limit(200);

      if (all?.length) {
        // Latest price per gram
        const seen = new Set<number>();
        const latest: HargaBerat[] = [];
        for (const row of all) {
          const g = Number(row.gram);
          if (!seen.has(g)) { seen.add(g); latest.push({ ...row, gram: g }); }
        }
        latest.sort((a, b) => a.gram - b.gram);
        setPrices(latest);
        setAvailableGrams(latest.map(p => p.gram));
        if (latest[0]) setLastUpdate(latest[0].created_at);

        // Build history for selectedGram (or first available)
        buildHistory(all, selectedGram || latest[0]?.gram || 1);
      }
    } catch {}
    setLoading(false);
  }

  function buildHistory(all: any[], gram: number) {
    const filtered = all
      .filter((r: any) => Number(r.gram) === gram)
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((r: any) => ({
        date: new Date(r.created_at).toISOString().split("T")[0],
        price: Number(r.harga),
      }));
    setHistory(filtered.length ? filtered : []);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!prices.length) return;
    // Re-fetch history when gram changes
    (async () => {
      const { data } = await (supabase.from("harga_emas_berat") as any)
        .select("gram, harga, created_at")
        .eq("kategori", "emas")
        .eq("gram", selectedGram)
        .order("created_at", { ascending: true })
        .limit(100);
      if (data?.length) {
        setHistory(data.map((r: any) => ({
          date: new Date(r.created_at).toISOString().split("T")[0],
          price: Number(r.harga),
        })));
      }
    })();
  }, [selectedGram]);

  const trend = history.length >= 2
    ? history[history.length - 1].price >= history[history.length - 2].price ? "up" : "down"
    : "up";

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
            style={{ background:"rgba(12,12,12,0.8)", border:"1px solid rgba(212,175,55,0.18)", borderRadius:20, overflow:"hidden", backdropFilter:"blur(12px)", marginBottom:32 }}>
            <div style={{ padding:"16px 24px", borderBottom:"1px solid rgba(212,175,55,0.1)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
              <h3 style={{ color:"#fff", fontWeight:700, fontSize:"1rem", margin:0 }}>Daftar Harga Beli Emas</h3>
              <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem" }}>per berat · harga anggota koperasi</span>
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
                    <tr key={p.gram} style={{ borderBottom: i < prices.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", background: selectedGram === p.gram ? "rgba(212,175,55,0.05)" : "transparent" }}>
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

        {/* Chart */}
        {availableGrams.length > 0 && (
          <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:.2 }}
            style={{ background:"rgba(12,12,12,0.8)", border:"1px solid rgba(212,175,55,0.18)", borderRadius:20, padding:"28px 24px", backdropFilter:"blur(12px)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
              <div>
                <h3 style={{ color:"#fff", fontWeight:700, fontSize:"1.05rem", marginBottom:4 }}>Grafik Perubahan Harga</h3>
                <p style={{ color:"rgba(255,255,255,0.55)", fontSize:".8rem" }}>Histori perubahan harga per berat terpilih</p>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                {availableGrams.map(g => (
                  <button key={g} onClick={() => setSelectedGram(g)}
                    style={{ padding:"5px 14px", borderRadius:9, fontSize:".8rem", fontWeight:600, cursor:"pointer", border: selectedGram === g ? "1px solid #D4AF37" : "1px solid rgba(255,255,255,0.1)", background: selectedGram === g ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.03)", color: selectedGram === g ? "#D4AF37" : "rgba(255,255,255,0.4)" }}>
                    {g % 1 === 0 ? g : g.toFixed(1)}g
                  </button>
                ))}
                <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:9, fontSize:".8rem", cursor:"pointer", background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.2)", color:"#D4AF37" }}>
                  <RefreshCw style={{ width:12, height:12, animation: loading ? "spin 1s linear infinite" : "none" }} /> Refresh
                </button>
              </div>
            </div>

            {history.length >= 2 ? (
              <Chart data={history} />
            ) : history.length === 1 ? (
              <div style={{ height:80, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:6 }}>
                <span style={{ color:"#D4AF37", fontWeight:900, fontSize:"1.4rem" }}>{fmt(history[0].price)}</span>
                <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".8rem" }}>Harga saat ini untuk {selectedGram}g (belum ada histori perubahan)</span>
              </div>
            ) : (
              <div style={{ height:80, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.25)", fontSize:".85rem" }}>
                Belum ada data histori untuk berat ini
              </div>
            )}
          </motion.div>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}
