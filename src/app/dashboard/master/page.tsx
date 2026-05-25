"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Users, Coins, TrendingUp, DollarSign, CheckCircle, Clock, Activity
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import TransactionTable from "@/components/dashboard/TransactionTable";
import { formatCurrency } from "@/lib/utils";

const MasterCharts = dynamic(() => import("./MasterCharts"), { ssr:false, loading:()=>(
  <div style={{ height:280, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.2)" }}>Memuat grafik...</div>
)});

const MOCK_TRANSACTIONS = Array.from({ length: 20 }, (_, i) => ({
  id: `TX${String(i+1000).padStart(6,"0")}`,
  user: ["Budi Santoso","Siti Rahayu","Ahmad F.","Dewi K.","Rino P."][i%5],
  type: ["buy","sell","buyback","cicilan","tabungan"][i%5] as any,
  gram: +((i+1)*1.2).toFixed(2),
  amount: (i+1)*980000,
  status: ["completed","pending","processing","rejected","completed"][i%5] as any,
  date: new Date(Date.now()-i*3600000*5).toISOString(),
}));

const PENDING_APPROVALS = [
  { name:"Budi Santoso", type:"Beli 5g", amount:9800000, time:"10 mnt" },
  { name:"Dewi K.", type:"Cicilan DP 2g", amount:3920000, time:"25 mnt" },
  { name:"Rino P.", type:"Buyback 3g", amount:5670000, time:"45 mnt" },
  { name:"Ahmad F.", type:"Tabungan 1g", amount:1960000, time:"1 jam" },
];

export default function MasterDashboardPage() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16 }}>
        <StatCard title="Total Member" value="152,840" change={8.2} icon={<Users style={{ width:20, height:20 }} />} color="#60a5fa" delay={0} />
        <StatCard title="Revenue Bulan Ini" value="Rp 4.8M" change={14.5} icon={<DollarSign style={{ width:20, height:20 }} />} color="#D4AF37" delay={0.1} />
        <StatCard title="Volume Emas" value="2,850g" change={6.1} icon={<Coins style={{ width:20, height:20 }} />} color="#4ade80" delay={0.2} />
        <StatCard title="Transaksi Aktif" value="1,247" change={3.4} icon={<Activity style={{ width:20, height:20 }} />} color="#c084fc" delay={0.3} />
      </div>

      {/* Charts */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24 }}>
        <h3 style={{ color:"#fff", fontWeight:700, marginBottom:20 }}>Revenue & Transaksi (12 Bulan)</h3>
        <MasterCharts />
      </motion.div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:24 }}>
        {/* Pending Approvals */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
          style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:22 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <h3 style={{ color:"#fff", fontWeight:700, fontSize:".95rem" }}>Pending Approval</h3>
            <span style={{ background:"rgba(251,146,60,0.12)", color:"#fb923c", borderRadius:20, padding:"2px 10px", fontSize:".72rem", fontWeight:700 }}>{PENDING_APPROVALS.length}</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {PENDING_APPROVALS.map((p, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.03)", borderRadius:11, padding:"10px 12px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div className="bg-gold-gradient" style={{ width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#0a0a0a", fontSize:".73rem", flexShrink:0 }}>{p.name[0]}</div>
                  <div>
                    <p style={{ color:"#fff", fontSize:".82rem", fontWeight:600 }}>{p.name}</p>
                    <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".72rem" }}>{p.type} · {p.time}</p>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ color:"#D4AF37", fontWeight:700, fontSize:".8rem" }}>{formatCurrency(p.amount)}</span>
                  <div style={{ display:"flex", gap:4 }}>
                    <button style={{ width:24, height:24, borderRadius:6, background:"rgba(74,222,128,0.1)", border:"none", color:"#4ade80", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:".7rem", fontWeight:800 }}>✓</button>
                    <button style={{ width:24, height:24, borderRadius:6, background:"rgba(248,113,113,0.1)", border:"none", color:"#f87171", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:".7rem", fontWeight:800 }}>✗</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Activity Summary */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}
          style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:22 }}>
          <h3 style={{ color:"#fff", fontWeight:700, marginBottom:16, fontSize:".95rem" }}>Distribusi Transaksi</h3>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { label:"Tabungan Emas", pct:35, count:487, color:"#D4AF37" },
              { label:"Cicilan", pct:28, count:389, color:"#60a5fa" },
              { label:"Beli Langsung", pct:22, count:306, color:"#4ade80" },
              { label:"Buyback", pct:15, count:208, color:"#c084fc" },
            ].map(item => (
              <div key={item.label}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ color:"rgba(255,255,255,0.55)", fontSize:".8rem" }}>{item.label}</span>
                  <div style={{ display:"flex", gap:10 }}>
                    <span style={{ color:"rgba(255,255,255,0.3)", fontSize:".75rem" }}>{item.count} tx</span>
                    <span style={{ color:item.color, fontWeight:700, fontSize:".8rem" }}>{item.pct}%</span>
                  </div>
                </div>
                <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:6, overflow:"hidden" }}>
                  <motion.div initial={{ width:0 }} animate={{ width:`${item.pct}%` }} transition={{ delay:0.8, duration:0.7 }}
                    style={{ height:"100%", background:item.color, borderRadius:6 }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <TransactionTable data={MOCK_TRANSACTIONS} title="Transaksi Terbaru" showUser={true} />
    </div>
  );
}
