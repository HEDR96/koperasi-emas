"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Download, FileText, TrendingUp, Coins, Users, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const LaporanChart = dynamic(() => import("./LaporanChart"), { ssr: false, loading: () => (
  <div style={{ height:260, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.2)" }}>Memuat...</div>
)});

const MONTHLY = [
  { bulan:"Jan", revenue:320000000, member:248, emas:320 },
  { bulan:"Feb", revenue:410000000, member:312, emas:415 },
  { bulan:"Mar", revenue:380000000, member:285, emas:390 },
  { bulan:"Apr", revenue:520000000, member:420, emas:528 },
  { bulan:"Mei", revenue:490000000, member:390, emas:502 },
  { bulan:"Jun", revenue:610000000, member:510, emas:618 },
];

export default function LaporanPage() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Summary Semester */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ background:"linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02))", border:"1px solid rgba(212,175,55,0.25)", borderRadius:20, padding:24 }}>
        <h3 style={{ color:"#D4AF37", fontWeight:700, marginBottom:4 }}>Ringkasan Semester I 2024</h3>
        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".82rem", marginBottom:20 }}>Periode Januari – Juni 2024</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:16 }}>
          {[
            { label:"Total Revenue", value:formatCurrency(2730000000), icon:DollarSign, color:"#D4AF37" },
            { label:"Total Member Baru", value:"2,165", icon:Users, color:"#60a5fa" },
            { label:"Volume Emas", value:"2,773g", icon:Coins, color:"#4ade80" },
            { label:"Growth YoY", value:"+22.4%", icon:TrendingUp, color:"#c084fc" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={{ background:"rgba(0,0,0,0.3)", borderRadius:14, padding:"16px 14px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <Icon style={{ width:15, height:15, color:s.color }} />
                  <span style={{ color:"rgba(255,255,255,0.35)", fontSize:".75rem" }}>{s.label}</span>
                </div>
                <p style={{ color:s.color, fontSize:"1.3rem", fontWeight:900 }}>{s.value}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Chart */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
          <h3 style={{ color:"#fff", fontWeight:700 }}>Grafik Revenue Bulanan</h3>
          <button className="btn-outline-gold" style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:9, cursor:"pointer", fontSize:".78rem" }}>
            <Download style={{ width:13, height:13 }} />
            Export Excel
          </button>
        </div>
        <LaporanChart data={MONTHLY} />
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <h3 style={{ color:"#fff", fontWeight:700 }}>Laporan Bulanan</h3>
          <button className="btn-gold" style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:10, border:"none", cursor:"pointer", fontSize:".8rem" }}>
            <FileText style={{ width:13, height:13 }} />
            Download PDF
          </button>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                {["Bulan","Revenue","Member Baru","Volume Emas","Growth"].map(h => (
                  <th key={h} style={{ color:"rgba(255,255,255,0.3)", fontSize:".75rem", fontWeight:600, padding:"8px 14px", textAlign:"left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MONTHLY.map((row, i) => {
                const prev = MONTHLY[i-1];
                const growth = prev ? ((row.revenue - prev.revenue) / prev.revenue * 100).toFixed(1) : null;
                return (
                  <tr key={row.bulan} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding:"14px", color:"#fff", fontWeight:600, fontSize:".85rem" }}>{row.bulan} 2024</td>
                    <td style={{ padding:"14px", color:"#D4AF37", fontWeight:700, fontSize:".85rem" }}>{formatCurrency(row.revenue)}</td>
                    <td style={{ padding:"14px", color:"rgba(255,255,255,0.6)", fontSize:".83rem" }}>{row.member}</td>
                    <td style={{ padding:"14px", color:"rgba(255,255,255,0.6)", fontSize:".83rem" }}>{row.emas}g</td>
                    <td style={{ padding:"14px" }}>
                      {growth && (
                        <span style={{ color: parseFloat(growth)>=0?"#4ade80":"#f87171", fontSize:".8rem", fontWeight:700 }}>
                          {parseFloat(growth)>=0?"+":""}{growth}%
                        </span>
                      )}
                      {!growth && <span style={{ color:"rgba(255,255,255,0.2)", fontSize:".8rem" }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
