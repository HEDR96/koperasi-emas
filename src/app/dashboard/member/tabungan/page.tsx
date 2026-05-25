"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet, Plus, Target } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { useGoldStore } from "@/store/useGoldStore";

export default function TabunganPage() {
  const { user } = useAuthStore();
  const { prices } = useGoldStore();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await (supabase.from("savings") as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setPlans(data ?? []);
      setLoading(false);
    })();
  }, [user?.id]);

  const COLORS = ["#D4AF37", "#60a5fa", "#c084fc", "#4ade80", "#fb923c"];

  if (loading) return <div style={{ color:"rgba(255,255,255,0.3)", padding:40, textAlign:"center" }}>Memuat tabungan...</div>;

  const totalCurrent = plans.reduce((a, b) => a + (b.current_gram || 0), 0);
  const totalMonthly = plans.reduce((a, b) => a + (b.monthly_amount || 0), 0);
  const activePlans = plans.filter(p => p.status === "active").length;
  const goldPrice = prices.buyMember;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Summary */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ background:"linear-gradient(135deg, rgba(96,165,250,0.1), rgba(96,165,250,0.04))", border:"1px solid rgba(96,165,250,0.25)", borderRadius:20, padding:24 }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:20 }}>
          <div>
            <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", marginBottom:8 }}>Total Tabungan Emas</p>
            <p style={{ color:"#60a5fa", fontSize:"2.2rem", fontWeight:900, lineHeight:1 }}>
              {totalCurrent.toFixed(1)}<span style={{ fontSize:"1rem", color:"rgba(96,165,250,0.5)" }}>g</span>
            </p>
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".78rem", marginTop:4 }}>
              ≈ {formatCurrency(totalCurrent * goldPrice)}
            </p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ background:"rgba(0,0,0,0.2)", borderRadius:10, padding:"10px 14px" }}>
              <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".72rem" }}>Rencana Tabungan</p>
              <p style={{ color:"#fff", fontWeight:700 }}>{activePlans} aktif</p>
            </div>
            <div style={{ background:"rgba(0,0,0,0.2)", borderRadius:10, padding:"10px 14px" }}>
              <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".72rem" }}>Setoran Bulanan</p>
              <p style={{ color:"#D4AF37", fontWeight:700 }}>{formatCurrency(totalMonthly)}/bulan</p>
            </div>
          </div>
        </div>
      </motion.div>

      {plans.length === 0 ? (
        <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", padding:"60px 0" }}>Belum ada rencana tabungan</div>
      ) : plans.map((plan, i) => {
        const pct = plan.target_gram > 0 ? Math.min((plan.current_gram / plan.target_gram) * 100, 100) : 0;
        const color = COLORS[i % COLORS.length];
        return (
          <motion.div key={plan.id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i * 0.1 }}
            style={{ background:"rgba(14,14,14,0.8)", border:`1px solid ${color}22`, borderRadius:20, padding:24 }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:13, background:`${color}14`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Target style={{ width:20, height:20, color }} />
                </div>
                <div>
                  <p style={{ color:"#fff", fontWeight:700, fontSize:".95rem" }}>{plan.name}</p>
                  <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".75rem" }}>{plan.status}</p>
                </div>
              </div>
              <span style={{ background:`${color}14`, color, borderRadius:8, padding:"4px 12px", fontSize:".75rem", fontWeight:700 }}>
                {pct.toFixed(0)}%
              </span>
            </div>

            {/* Progress */}
            <div style={{ marginBottom:16 }}>
              <div style={{ height:10, background:"rgba(255,255,255,0.06)", borderRadius:10, overflow:"hidden", marginBottom:6 }}>
                <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ delay:0.4 + i * 0.1, duration:0.8 }}
                  style={{ height:"100%", background:color, borderRadius:10 }} />
              </div>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem" }}>{plan.current_gram}g tercapai</span>
                <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem" }}>Target: {plan.target_gram}g</span>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10 }}>
              {[
                { label:"Tabungan saat ini", value:`${plan.current_gram}g` },
                { label:"Sisa target", value:`${(plan.target_gram - plan.current_gram).toFixed(1)}g` },
                { label:"Setoran/bulan", value:formatCurrency(plan.monthly_amount) },
              ].map(r => (
                <div key={r.label} style={{ background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"9px 11px" }}>
                  <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".7rem", marginBottom:3 }}>{r.label}</p>
                  <p style={{ color:"rgba(255,255,255,0.8)", fontWeight:600, fontSize:".8rem" }}>{r.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}

      {/* New Plan */}
      <button onClick={() => setShowAdd(!showAdd)}
        style={{ background:"rgba(212,175,55,0.04)", border:"1px dashed rgba(212,175,55,0.2)", borderRadius:18, padding:"20px 24px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, color:"rgba(212,175,55,0.6)", fontSize:".88rem", transition:"all .2s" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.4)"; (e.currentTarget as HTMLElement).style.color = "#D4AF37"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.2)"; (e.currentTarget as HTMLElement).style.color = "rgba(212,175,55,0.6)"; }}>
        <Plus style={{ width:18, height:18 }} />
        Buat Rencana Tabungan Baru
      </button>

      {showAdd && (
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
          style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:18, padding:24 }}>
          <h4 style={{ color:"#D4AF37", fontWeight:700, marginBottom:16 }}>Rencana Tabungan Baru</h4>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14 }}>
            {["Nama Rencana", "Target Emas (gram)", "Setoran Bulanan (Rp)"].map(f => (
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
