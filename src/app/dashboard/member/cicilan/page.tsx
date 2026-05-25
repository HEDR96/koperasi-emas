"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Calendar, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

const CICILANS = [
  {
    id:"CIC001", product:"Emas 5 gram", totalGram:5, dp:4900000, installment:980000, tenor:12,
    paid:7, remaining:5, nextDue:"2024-04-01", status:"active",
    history: [
      { month:1, amount:980000, date:"2023-10-01", status:"paid" },
      { month:2, amount:980000, date:"2023-11-01", status:"paid" },
      { month:3, amount:980000, date:"2023-12-01", status:"paid" },
      { month:4, amount:980000, date:"2024-01-01", status:"paid" },
      { month:5, amount:980000, date:"2024-02-01", status:"paid" },
      { month:6, amount:980000, date:"2024-03-01", status:"paid" },
      { month:7, amount:980000, date:"2024-03-28", status:"paid" },
      { month:8, amount:980000, date:"2024-04-01", status:"upcoming" },
      { month:9, amount:980000, date:"2024-05-01", status:"upcoming" },
      { month:10, amount:980000, date:"2024-06-01", status:"upcoming" },
      { month:11, amount:980000, date:"2024-07-01", status:"upcoming" },
      { month:12, amount:980000, date:"2024-08-01", status:"upcoming" },
    ]
  },
  {
    id:"CIC002", product:"Emas 2 gram", totalGram:2, dp:2000000, installment:420000, tenor:6,
    paid:6, remaining:0, nextDue:null, status:"completed",
    history: Array.from({length:6},(_, i)=>({ month:i+1, amount:420000, date:new Date(2023,(i+2)%12,1).toISOString().slice(0,10), status:"paid" })),
  },
];

export default function CicilanPage() {
  const [expanded, setExpanded] = useState<string|null>("CIC001");

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:16 }}>
        {[
          { label:"Cicilan Aktif", value:CICILANS.filter(c=>c.status==="active").length, color:"#D4AF37" },
          { label:"Selesai", value:CICILANS.filter(c=>c.status==="completed").length, color:"#4ade80" },
          { label:"Cicilan Bulan Ini", value:formatCurrency(980000), color:"#60a5fa" },
          { label:"Sisa Cicilan", value:"5x", color:"#fb923c" },
        ].map(s => (
          <div key={s.label} style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:16, padding:"18px 16px" }}>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".76rem", marginBottom:4 }}>{s.label}</p>
            <p style={{ color:s.color, fontSize:"1.5rem", fontWeight:900 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {CICILANS.map(c => (
        <motion.div key={c.id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{ background:"rgba(14,14,14,0.8)", border:`1px solid ${c.status==="active"?"rgba(212,175,55,0.2)":"rgba(74,222,128,0.15)"}`, borderRadius:20, overflow:"hidden" }}>
          {/* Card Header */}
          <div style={{ padding:22 }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:13, background:"rgba(212,175,55,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <CreditCard style={{ width:20, height:20, color:"#D4AF37" }} />
                </div>
                <div>
                  <p style={{ color:"#fff", fontWeight:700, fontSize:".95rem" }}>{c.product}</p>
                  <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".75rem" }}>{c.id} · {c.tenor} bulan</p>
                </div>
              </div>
              <span style={{ background: c.status==="active"?"rgba(212,175,55,0.1)":"rgba(74,222,128,0.1)", color: c.status==="active"?"#D4AF37":"#4ade80", borderRadius:8, padding:"4px 12px", fontSize:".75rem", fontWeight:700 }}>
                {c.status==="active" ? "Aktif" : "Selesai"}
              </span>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem" }}>Progress Cicilan</span>
                <span style={{ color:"#fff", fontWeight:700, fontSize:".78rem" }}>{c.paid}/{c.tenor} bulan</span>
              </div>
              <div style={{ height:8, background:"rgba(255,255,255,0.06)", borderRadius:8, overflow:"hidden" }}>
                <motion.div initial={{ width:0 }} animate={{ width:`${(c.paid/c.tenor)*100}%` }} transition={{ delay:0.3, duration:0.8 }}
                  style={{ height:"100%", background: c.status==="completed"?"#4ade80":"linear-gradient(90deg,#D4AF37,#F5D060)", borderRadius:8 }} />
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12 }}>
              {[
                { label:"Cicilan/bulan", value:formatCurrency(c.installment) },
                { label:"Sudah dibayar", value:`${c.paid}x = ${formatCurrency(c.paid*c.installment)}` },
                { label:"Sisa cicilan", value:c.remaining > 0 ? `${c.remaining}x` : "Lunas ✓" },
                { label:c.nextDue ? "Jatuh tempo" : "Status", value:c.nextDue ? formatDate(c.nextDue) : "Selesai" },
              ].map(r => (
                <div key={r.label} style={{ background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"10px 12px" }}>
                  <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".72rem", marginBottom:3 }}>{r.label}</p>
                  <p style={{ color:"rgba(255,255,255,0.8)", fontWeight:600, fontSize:".82rem" }}>{r.value}</p>
                </div>
              ))}
            </div>

            {c.status === "active" && c.nextDue && (
              <div style={{ marginTop:14, background:"rgba(251,146,60,0.08)", border:"1px solid rgba(251,146,60,0.15)", borderRadius:11, padding:"10px 14px", display:"flex", alignItems:"center", gap:8 }}>
                <Calendar style={{ width:14, height:14, color:"#fb923c", flexShrink:0 }} />
                <span style={{ color:"rgba(255,255,255,0.55)", fontSize:".78rem" }}>
                  Jatuh tempo berikutnya: <strong style={{ color:"#fb923c" }}>{formatDate(c.nextDue)}</strong> — {formatCurrency(c.installment)}
                </span>
              </div>
            )}
          </div>

          {/* Toggle History */}
          <button onClick={() => setExpanded(expanded===c.id?null:c.id)}
            style={{ width:"100%", padding:"12px 22px", background:"rgba(255,255,255,0.02)", border:"none", borderTop:"1px solid rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.4)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, fontSize:".8rem" }}>
            {expanded===c.id ? <ChevronUp style={{ width:13,height:13 }} /> : <ChevronDown style={{ width:13,height:13 }} />}
            {expanded===c.id ? "Sembunyikan" : "Lihat"} Riwayat Pembayaran
          </button>

          {expanded === c.id && (
            <div style={{ padding:"0 22px 20px" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:12 }}>
                {c.history.map(h => (
                  <div key={h.month} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", background:"rgba(255,255,255,0.02)", borderRadius:10 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      {h.status==="paid" ? <CheckCircle style={{ width:14,height:14,color:"#4ade80",flexShrink:0 }} /> : <Clock style={{ width:14,height:14,color:"rgba(255,255,255,0.2)",flexShrink:0 }} />}
                      <span style={{ color:"rgba(255,255,255,0.55)", fontSize:".78rem" }}>Bulan ke-{h.month}</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      {h.status==="paid" && <span style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem" }}>{formatDate(h.date)}</span>}
                      <span style={{ color: h.status==="paid"?"#D4AF37":"rgba(255,255,255,0.25)", fontWeight:h.status==="paid"?700:400, fontSize:".82rem" }}>{formatCurrency(h.amount)}</span>
                      <span style={{ background: h.status==="paid"?"rgba(74,222,128,0.1)":"rgba(255,255,255,0.05)", color: h.status==="paid"?"#4ade80":"rgba(255,255,255,0.2)", borderRadius:6, padding:"2px 8px", fontSize:".7rem" }}>
                        {h.status==="paid"?"Lunas":"Belum"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      ))}

      {/* New Cicilan CTA */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
        style={{ background:"rgba(212,175,55,0.05)", border:"1px dashed rgba(212,175,55,0.2)", borderRadius:18, padding:24, textAlign:"center" }}>
        <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".88rem", marginBottom:14 }}>Ingin cicil emas baru?</p>
        <button className="btn-gold" style={{ padding:"11px 28px", borderRadius:12, border:"none", cursor:"pointer", fontSize:".88rem" }}>
          Ajukan Cicilan Baru
        </button>
      </motion.div>
    </div>
  );
}
