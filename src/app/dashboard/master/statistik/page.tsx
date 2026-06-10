"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Users, Coins, Landmark, Wallet, RefreshCw, TrendingUp, ArrowDownCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
const fmtJuta = (n: number) => `${(n / 1_000_000).toFixed(1)} jt`;

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];

interface Agg { bulan: string; volume: number; member: number; }

export default function StatistikPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    member: 0, memberActive: 0,
    gramSold: 0, buybackVol: 0,
    txVolume: 0, simpanan: 0,
    gadaiAktif: 0, gadaiDana: 0,
  });
  const [chart, setChart] = useState<Agg[]>([]);

  async function load() {
    setLoading(true);
    try {
      const since = new Date(); since.setMonth(since.getMonth() - 11); since.setDate(1);
      const sinceISO = since.toISOString();

      const [profRes, txRes, simRes, gadaiRes] = await Promise.all([
        (supabase.from("profiles") as any).select("id, status, created_at").or("role.eq.member,is_member.eq.true"),
        (supabase.from("transactions") as any).select("type, amount, gram, status, created_at").eq("status","completed").limit(5000),
        (supabase.from("simpanan") as any).select("amount, status").eq("status","completed"),
        (supabase.from("gadai") as any).select("dana_cair, status").in("status",["disetujui","aktif"]),
      ]);

      const profiles = profRes.data || [];
      const txs      = txRes.data || [];
      const sims     = simRes.data || [];
      const gadais   = gadaiRes.data || [];

      const gramSold   = txs.filter((t: any) => t.type==="buy" && t.gram).reduce((s: number, t: any) => s + Number(t.gram), 0);
      const buybackVol = txs.filter((t: any) => t.type==="buyback").reduce((s: number, t: any) => s + Number(t.amount||0), 0);
      const txVolume   = txs.reduce((s: number, t: any) => s + Number(t.amount||0), 0);
      const simpanan   = sims.reduce((s: number, r: any) => s + Number(r.amount||0), 0);
      const gadaiDana  = gadais.reduce((s: number, r: any) => s + Number(r.dana_cair||0), 0);

      setStats({
        member: profiles.length,
        memberActive: profiles.filter((p: any) => p.status==="active").length,
        gramSold, buybackVol, txVolume, simpanan,
        gadaiAktif: gadais.length, gadaiDana,
      });

      // Aggregasi 12 bulan terakhir
      const buckets: Record<string, Agg> = {};
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        buckets[key] = { bulan: MONTHS[d.getMonth()], volume: 0, member: 0 };
      }
      txs.forEach((t: any) => {
        const d = new Date(t.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (buckets[key]) buckets[key].volume += Number(t.amount||0);
      });
      profiles.forEach((p: any) => {
        if (!p.created_at) return;
        const d = new Date(p.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (buckets[key]) buckets[key].member += 1;
      });
      setChart(Object.values(buckets));
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const cards = useMemo(() => ([
    { label:"Total Member",       value: stats.member.toLocaleString("id-ID"),       sub:`${stats.memberActive} aktif`, icon:Users,          color:"#34d399", bg:"rgba(52,211,153,0.1)" },
    { label:"Emas Terjual",       value:`${stats.gramSold.toFixed(1)} gr`,           sub:"transaksi beli selesai",       icon:Coins,          color:"#D4AF37", bg:"rgba(212,175,55,0.1)" },
    { label:"Volume Transaksi",   value: fmtJuta(stats.txVolume),                    sub:"total selesai",                icon:TrendingUp,     color:"#60a5fa", bg:"rgba(96,165,250,0.1)" },
    { label:"Total Simpanan",     value: fmtJuta(stats.simpanan),                    sub:"terverifikasi",                icon:Wallet,         color:"#a78bfa", bg:"rgba(167,139,250,0.1)" },
    { label:"Volume Buyback",     value: fmtJuta(stats.buybackVol),                  sub:"emas dijual kembali",          icon:ArrowDownCircle,color:"#f59e0b", bg:"rgba(245,158,11,0.1)" },
    { label:"Gadai Aktif",        value: stats.gadaiAktif.toLocaleString("id-ID"),   sub:`${fmt(stats.gadaiDana)} tersalur`, icon:Landmark,   color:"#f87171", bg:"rgba(248,113,113,0.1)" },
  ]), [stats]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Statistik Koperasi</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Ringkasan performa berdasarkan data real</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:14, height:14 }} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16 }}>
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={c.label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
              style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"20px 22px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".76rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".05em", margin:0 }}>{c.label}</p>
                <div style={{ background:c.bg, borderRadius:8, padding:8 }}>
                  <Icon style={{ width:16, height:16, color:c.color }} />
                </div>
              </div>
              <p style={{ color:"#fff", fontSize:"1.55rem", fontWeight:800, margin:0, lineHeight:1 }}>{loading ? "—" : c.value}</p>
              <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".74rem", margin:"6px 0 0" }}>{c.sub}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Chart */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
        style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"22px 18px 14px" }}>
        <h2 style={{ color:"#fff", fontWeight:700, fontSize:"1rem", margin:"0 0 4px 6px" }}>Tren 12 Bulan Terakhir</h2>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".8rem", margin:"0 0 16px 6px" }}>Volume transaksi (juta) & member baru</p>
        {loading ? (
          <p style={{ color:"rgba(255,255,255,0.3)", padding:"40px", textAlign:"center" }}>Memuat grafik...</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chart} margin={{ top:5, right:10, left:0, bottom:0 }}>
              <defs>
                <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMem2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="bulan" stroke="rgba(255,255,255,0.3)" tick={{ fontSize:12 }} />
              <YAxis yAxisId="left" stroke="rgba(255,255,255,0.3)" tick={{ fontSize:12 }} tickFormatter={(v)=>fmtJuta(Number(v))} />
              <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.3)" tick={{ fontSize:12 }} />
              <Tooltip
                contentStyle={{ background:"#0f0f0f", border:"1px solid rgba(212,175,55,0.2)", borderRadius:10 }}
                labelStyle={{ color:"#fff" }} itemStyle={{ color:"rgba(255,255,255,0.7)" }}
                formatter={(value: any, name: any) => name === "Volume Transaksi" ? [fmt(Number(value)), name] : [value, name]}
              />
              <Legend wrapperStyle={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem" }} />
              <Area yAxisId="left" type="monotone" dataKey="volume" name="Volume Transaksi" stroke="#D4AF37" strokeWidth={2} fill="url(#colorVol)" />
              <Area yAxisId="right" type="monotone" dataKey="member" name="Member Baru" stroke="#60a5fa" strokeWidth={2} fill="url(#colorMem2)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </motion.div>
    </div>
  );
}
