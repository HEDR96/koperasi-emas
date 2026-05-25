"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Filter, Download, Search } from "lucide-react";
import TransactionTable from "@/components/dashboard/TransactionTable";
import StatCard from "@/components/dashboard/StatCard";
import { ArrowLeftRight, Coins, TrendingUp, Clock } from "lucide-react";

const MOCK_TXS = Array.from({ length: 30 }, (_, i) => ({
  id: `TX${String(i+1000).padStart(6,"0")}`,
  user: ["Budi Santoso","Siti Rahayu","Ahmad F.","Dewi K.","Rino P.","Wahyu H.","Eni S.","Hadi P."][i%8],
  type: ["buy","buyback","cicilan","tabungan","buy","buy","cicilan","buyback"][i%8] as any,
  gram: +((i+1)*0.5).toFixed(2),
  amount: (i+1)*490000+100000,
  status: ["completed","pending","processing","completed","completed","rejected","pending","completed"][i%8] as any,
  date: new Date(Date.now() - i*7200000).toISOString(),
}));

export default function TransaksiPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:16 }}>
        <StatCard title="Total Transaksi" value={String(MOCK_TXS.length)} icon={<ArrowLeftRight style={{ width:20, height:20 }} />} color="#D4AF37" delay={0} />
        <StatCard title="Completed" value={String(MOCK_TXS.filter(t=>t.status==="completed").length)} change={8.2} icon={<Coins style={{ width:20, height:20 }} />} color="#4ade80" delay={0.1} />
        <StatCard title="Pending" value={String(MOCK_TXS.filter(t=>t.status==="pending").length)} icon={<Clock style={{ width:20, height:20 }} />} color="#fb923c" delay={0.2} />
        <StatCard title="Beli Emas" value={String(MOCK_TXS.filter(t=>t.type==="buy").length)} change={14.5} icon={<TrendingUp style={{ width:20, height:20 }} />} color="#60a5fa" delay={0.3} />
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:16, padding:"16px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <Filter style={{ width:15, height:15, color:"rgba(255,255,255,0.3)" }} />
          <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".8rem" }}>Filter:</span>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"6px 10px", color:"rgba(255,255,255,0.7)", fontSize:".8rem", cursor:"pointer" }}>
            <option value="all">Semua Jenis</option>
            <option value="buy">Beli Emas</option>
            <option value="buyback">Buyback</option>
            <option value="cicilan">Cicilan</option>
            <option value="tabungan">Tabungan</option>
          </select>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"6px 10px", color:"rgba(255,255,255,0.7)", fontSize:".8rem" }} />
          <span style={{ color:"rgba(255,255,255,0.3)", fontSize:".8rem" }}>–</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"6px 10px", color:"rgba(255,255,255,0.7)", fontSize:".8rem" }} />
          <button className="btn-outline-gold" style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:8, cursor:"pointer", fontSize:".78rem", marginLeft:"auto" }}>
            <Download style={{ width:13, height:13 }} />
            Export
          </button>
        </div>
      </motion.div>

      <TransactionTable data={MOCK_TXS} title="Data Transaksi" showUser={true} />
    </div>
  );
}
