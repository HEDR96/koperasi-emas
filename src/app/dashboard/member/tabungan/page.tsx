"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Plus, Calendar, TrendingUp, Target, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const PLANS = [
  { id:"TAB001", name:"Tabungan Nikah", target:50, current:22.5, monthly:2.5, startDate:"2023-07-01", targetDate:"2025-07-01", color:"#D4AF37" },
  { id:"TAB002", name:"Dana Pendidikan", target:100, current:15.0, monthly:5.0, startDate:"2024-01-01", targetDate:"2025-12-01", color:"#60a5fa" },
];

const GOLD_PRICE = 1960000;

export default function TabunganPage() {
  const [amount, setAmount] = useState(1000000);
  const [showAdd, setShowAdd] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const handleTopup = async (planId: string) => {
    await new Promise(r => setTimeout(r, 800));
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 2000);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Summary */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ background:"linear-gradient(135deg, rgba(96,165,250,0.1), rgba(96,165,250,0.04))", border:"1px solid rgba(96,165,250,0.25)", borderRadius:20, padding:24 }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:20 }}>
          <div>
            <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", marginBottom:8 }}>Total Tabungan Emas</p>
            <p style={{ color:"#60a5fa", fontSize:"2.2rem", fontWeight:900, lineHeight:1 }}>
              {PLANS.reduce((a,b)=>a+b.current,0).toFixed(1)}<span style={{ fontSize:"1rem", color:"rgba(96,165,250,0.5)" }}>g</span>
            </p>
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".78rem", marginTop:4 }}>
              ≈ {formatCurrency(PLANS.reduce((a,b)=>a+b.current,0)*GOLD_PRICE)}
            </p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ background:"rgba(0,0,0,0.2)", borderRadius:10, padding:"10px 14px" }}>
              <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".72rem" }}>Rencana Tabungan</p>
              <p style={{ color:"#fff", fontWeight:700 }}>{PLANS.length} aktif</p>
            </div>
            <div style={{ background:"rgba(0,0,0,0.2)", borderRadius:10, padding:"10px 14px" }}>
              <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".72rem" }}>Setoran Bulanan</p>
              <p style={{ color:"#D4AF37", fontWeight:700 }}>{PLANS.reduce((a,b)=>a+b.monthly,0)}g/bulan</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Saving Plans */}
      {PLANS.map((plan, i) => {
        const pct = Math.min((plan.current/plan.target)*100, 100);
        return (
          <motion.div key={plan.id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.1 }}
            style={{ background:"rgba(14,14,14,0.8)", border:`1px solid ${plan.color}22`, borderRadius:20, padding:24 }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:13, background:`${plan.color}14`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Target style={{ width:20, height:20, color:plan.color }} />
                </div>
                <div>
                  <p style={{ color:"#fff", fontWeight:700, fontSize:".95rem" }}>{plan.name}</p>
                  <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".75rem" }}>{plan.id}</p>
                </div>
              </div>
              <span style={{ background:`${plan.color}14`, color:plan.color, borderRadius:8, padding:"4px 12px", fontSize:".75rem", fontWeight:700 }}>
                {pct.toFixed(0)}%
              </span>
            </div>

            {/* Progress */}
            <div style={{ marginBottom:16 }}>
              <div style={{ height:10, background:"rgba(255,255,255,0.06)", borderRadius:10, overflow:"hidden", marginBottom:6 }}>
                <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ delay:0.4+i*0.1, duration:0.8 }}
                  style={{ height:"100%", background:plan.color, borderRadius:10 }} />
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem" }}>{plan.current}g tercapai</span>
                <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem" }}>Target: {plan.target}g</span>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10, marginBottom:16 }}>
              {[
                { label:"Tabungan saat ini", value:`${plan.current}g` },
                { label:"Sisa target", value:`${(plan.target-plan.current).toFixed(1)}g` },
                { label:"Setoran/bulan", value:`${plan.monthly}g` },
                { label:"Target selesai", value:plan.targetDate },
              ].map(r => (
                <div key={r.label} style={{ background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"9px 11px" }}>
                  <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".7rem", marginBottom:3 }}>{r.label}</p>
                  <p style={{ color:"rgba(255,255,255,0.8)", fontWeight:600, fontSize:".8rem" }}>{r.value}</p>
                </div>
              ))}
            </div>

            {/* Top Up */}
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"8px 12px" }}>
                <span style={{ color:"rgba(255,255,255,0.3)", fontSize:".82rem" }}>Rp</span>
                <input type="number" defaultValue={1000000} min={100000} step={100000}
                  style={{ background:"none", border:"none", outline:"none", color:"rgba(255,255,255,0.7)", fontSize:".82rem", flex:1, minWidth:0 }}
                  placeholder="Nominal top up" />
              </div>
              <button className="btn-gold" onClick={() => handleTopup(plan.id)}
                style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 18px", borderRadius:10, border:"none", cursor:"pointer", fontSize:".82rem", whiteSpace:"nowrap" }}>
                <Plus style={{ width:13, height:13 }} /> Top Up
              </button>
            </div>
          </motion.div>
        );
      })}

      {/* New Plan */}
      <button onClick={() => setShowAdd(!showAdd)}
        style={{ background:"rgba(212,175,55,0.04)", border:"1px dashed rgba(212,175,55,0.2)", borderRadius:18, padding:"20px 24px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, color:"rgba(212,175,55,0.6)", fontSize:".88rem", transition:"all .2s" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor="rgba(212,175,55,0.4)"; (e.currentTarget as HTMLElement).style.color="#D4AF37"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor="rgba(212,175,55,0.2)"; (e.currentTarget as HTMLElement).style.color="rgba(212,175,55,0.6)"; }}>
        <Plus style={{ width:18, height:18 }} />
        Buat Rencana Tabungan Baru
      </button>

      {showAdd && (
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
          style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:18, padding:24 }}>
          <h4 style={{ color:"#D4AF37", fontWeight:700, marginBottom:16 }}>Rencana Tabungan Baru</h4>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14 }}>
            {["Nama Rencana","Target Emas (gram)","Setoran Bulanan (gram)","Tanggal Target"].map(f => (
              <div key={f}>
                <label style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem", display:"block", marginBottom:6 }}>{f}</label>
                <input className="input-gold" placeholder={f} style={{ borderRadius:10, padding:"9px 12px", fontSize:".83rem", width:"100%" }} />
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:10, marginTop:16 }}>
            <button className="btn-gold" style={{ padding:"10px 22px", borderRadius:10, border:"none", cursor:"pointer", fontSize:".84rem" }}>Buat Rencana</button>
            <button onClick={() => setShowAdd(false)} className="btn-outline-gold" style={{ padding:"10px 22px", borderRadius:10, cursor:"pointer", fontSize:".84rem" }}>Batal</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
