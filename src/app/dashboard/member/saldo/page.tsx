"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Coins, TrendingUp, TrendingDown, ArrowRight, Wallet } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

const SaldoChart = dynamic(() => import("./SaldoChart"), { ssr:false, loading:()=>(
  <div style={{ height:200, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.2)" }}>Memuat...</div>
)});

const HISTORY = [
  { label:"Jan", gold:95.5, value:93590000 },
  { label:"Feb", gold:102.0, value:100362000 },
  { label:"Mar", gold:108.5, value:107241000 },
  { label:"Apr", gold:115.0, value:114170000 },
  { label:"Mei", gold:120.5, value:119855000 },
  { label:"Jun", gold:125.5, value:125345000 },
];

export default function SaldoPage() {
  const { user } = useAuthStore();
  const goldPrice = 1960000;
  const goldGram  = user?.balance?.gold || 125.5;
  const goldValue = goldGram * goldPrice;
  const rupiah    = user?.balance?.rupiah || 5000000;
  const savings   = user?.balance?.savings || 2500000;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Gold Balance Card */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ background:"linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04))", border:"1px solid rgba(212,175,55,0.3)", borderRadius:22, padding:28, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-30, right:-30, width:180, height:180, borderRadius:"50%", background:"radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)", pointerEvents:"none" }} />
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:24 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <div style={{ width:46, height:46, borderRadius:14, background:"rgba(212,175,55,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Coins style={{ width:22, height:22, color:"#D4AF37" }} />
              </div>
              <div>
                <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem" }}>Total Emas Kamu</p>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <TrendingUp style={{ width:13, height:13, color:"#4ade80" }} />
                  <span style={{ color:"#4ade80", fontSize:".72rem", fontWeight:700 }}>+2.5% bulan ini</span>
                </div>
              </div>
            </div>
            <p style={{ fontSize:"3rem", fontWeight:900, color:"#D4AF37", lineHeight:1 }}>{goldGram}<span style={{ fontSize:"1.4rem", color:"rgba(212,175,55,0.6)" }}>g</span></p>
            <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".85rem", marginTop:6 }}>≈ {formatCurrency(goldValue)}</p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {[
              { label:"Saldo Rupiah", value:formatCurrency(rupiah), color:"#60a5fa", icon:Wallet },
              { label:"Tabungan Emas", value:formatCurrency(savings), color:"#4ade80", icon:Coins },
              { label:"Harga Emas/gram", value:formatCurrency(goldPrice), color:"#D4AF37", icon:TrendingUp },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(0,0,0,0.2)", borderRadius:12, padding:"10px 14px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <Icon style={{ width:14, height:14, color:item.color }} />
                    <span style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem" }}>{item.label}</span>
                  </div>
                  <span style={{ color:"#fff", fontWeight:700, fontSize:".85rem" }}>{item.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Chart */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24 }}>
        <h3 style={{ color:"#fff", fontWeight:700, marginBottom:4 }}>Perkembangan Portfolio</h3>
        <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".8rem", marginBottom:20 }}>6 bulan terakhir</p>
        <SaldoChart data={HISTORY} />
      </motion.div>

      {/* Asset Breakdown */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24 }}>
        <h3 style={{ color:"#fff", fontWeight:700, marginBottom:16 }}>Rincian Aset</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {[
            { label:"Emas Fisik (tabungan bebas)", gram:80.5, value:80.5*goldPrice, pct:64, color:"#D4AF37" },
            { label:"Emas Cicilan (terikat)", gram:35.0, value:35*goldPrice, pct:28, color:"#60a5fa" },
            { label:"Emas Tabungan Terjadwal", gram:10.0, value:10*goldPrice, pct:8, color:"#4ade80" },
          ].map(a => (
            <div key={a.label}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <div>
                  <span style={{ color:"rgba(255,255,255,0.65)", fontSize:".83rem" }}>{a.label}</span>
                  <span style={{ color:"rgba(255,255,255,0.3)", fontSize:".75rem", marginLeft:8 }}>{a.gram}g</span>
                </div>
                <div style={{ textAlign:"right" }}>
                  <span style={{ color:a.color, fontWeight:700, fontSize:".83rem" }}>{a.pct}%</span>
                  <span style={{ color:"rgba(255,255,255,0.3)", fontSize:".75rem", marginLeft:6 }}>{formatCurrency(a.value)}</span>
                </div>
              </div>
              <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:6, overflow:"hidden" }}>
                <motion.div initial={{ width:0 }} animate={{ width:`${a.pct}%` }} transition={{ delay:0.5, duration:0.8 }}
                  style={{ height:"100%", background:a.color, borderRadius:6 }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12 }}>
        {[
          { label:"Beli Emas", href:"/dashboard/member/beli", color:"#D4AF37" },
          { label:"Buyback", href:"/dashboard/member/buyback", color:"#4ade80" },
          { label:"Tabungan", href:"/dashboard/member/tabungan", color:"#60a5fa" },
          { label:"Cicilan", href:"/dashboard/member/cicilan", color:"#c084fc" },
        ].map(a => (
          <Link key={a.label} href={a.href} style={{ textDecoration:"none" }}>
            <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${a.color}22`, borderRadius:14, padding:"16px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", transition:"all .2s", cursor:"pointer" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background=`${a.color}10`; (e.currentTarget as HTMLElement).style.borderColor=`${a.color}44`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.03)"; (e.currentTarget as HTMLElement).style.borderColor=`${a.color}22`; }}>
              <span style={{ color:a.color, fontWeight:600, fontSize:".85rem" }}>{a.label}</span>
              <ArrowRight style={{ width:14, height:14, color:a.color, opacity:0.6 }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
