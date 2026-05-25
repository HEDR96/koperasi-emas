"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { TrendingUp, Users, Coins, DollarSign } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";

const DynamicChart = dynamic(() => import("./StatistikCharts"), { ssr: false, loading: () => (
  <div style={{ height:280, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.2)" }}>Memuat grafik...</div>
)});

export default function StatistikPage() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16 }}>
        <StatCard title="Total Revenue" value="Rp 4.8M" change={18.2} icon={<DollarSign style={{ width:20, height:20 }} />} color="#D4AF37" delay={0} />
        <StatCard title="Member Baru" value="1,248" change={24.5} icon={<Users style={{ width:20, height:20 }} />} color="#60a5fa" delay={0.1} />
        <StatCard title="Volume Emas" value="2,850g" change={11.3} icon={<Coins style={{ width:20, height:20 }} />} color="#4ade80" delay={0.2} />
        <StatCard title="Growth Rate" value="22.4%" change={4.1} icon={<TrendingUp style={{ width:20, height:20 }} />} color="#c084fc" delay={0.3} />
      </div>

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24 }}>
        <h3 style={{ color:"#fff", fontWeight:700, fontSize:"1rem", marginBottom:20 }}>Pertumbuhan Revenue & Member (12 Bulan)</h3>
        <DynamicChart />
      </motion.div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:24 }}>
        {[
          { title:"Top Produk", items:[
            { label:"Tabungan Emas", pct:42, color:"#D4AF37" },
            { label:"Cicilan Emas", pct:28, color:"#60a5fa" },
            { label:"Beli Langsung", pct:18, color:"#4ade80" },
            { label:"Buyback", pct:12, color:"#f87171" },
          ]},
          { title:"Sebaran Member", items:[
            { label:"Jawa", pct:54, color:"#D4AF37" },
            { label:"Sumatera", pct:22, color:"#60a5fa" },
            { label:"Kalimantan", pct:12, color:"#4ade80" },
            { label:"Sulawesi", pct:12, color:"#c084fc" },
          ]},
        ].map(card => (
          <motion.div key={card.title} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
            style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24 }}>
            <h3 style={{ color:"#fff", fontWeight:700, fontSize:"1rem", marginBottom:20 }}>{card.title}</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {card.items.map(item => (
                <div key={item.label}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ color:"rgba(255,255,255,0.6)", fontSize:".83rem" }}>{item.label}</span>
                    <span style={{ color:"#fff", fontWeight:700, fontSize:".83rem" }}>{item.pct}%</span>
                  </div>
                  <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:6, overflow:"hidden" }}>
                    <motion.div initial={{ width:0 }} animate={{ width:`${item.pct}%` }} transition={{ delay:0.6, duration:0.8 }}
                      style={{ height:"100%", background:item.color, borderRadius:6 }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
