"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Calendar, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

export default function CicilanPage() {
  const { user } = useAuthStore();
  const [cicilans, setCicilans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await (supabase.from("installments") as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setCicilans(data ?? []);
      setLoading(false);
      if (data && data.length > 0) setExpanded(data[0].id);
    })();
  }, [user?.id]);

  if (loading) return <div style={{ color:"rgba(255,255,255,0.3)", padding:40, textAlign:"center" }}>Memuat cicilan...</div>;

  const activeCount = cicilans.filter(c => c.status === "active").length;
  const completedCount = cicilans.filter(c => c.status === "completed").length;
  const activeMonthly = cicilans.filter(c => c.status === "active").reduce((a: number, b: any) => a + (b.monthly_amount || 0), 0);
  const totalRemaining = cicilans.filter(c => c.status === "active").reduce((a: number, b: any) => a + (b.tenor - b.paid_installments), 0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:16 }}>
        {[
          { label:"Cicilan Aktif", value:activeCount, color:"#D4AF37" },
          { label:"Selesai", value:completedCount, color:"#4ade80" },
          { label:"Cicilan Bulan Ini", value:activeMonthly > 0 ? formatCurrency(activeMonthly) : "-", color:"#60a5fa" },
          { label:"Sisa Cicilan", value:totalRemaining > 0 ? `${totalRemaining}x` : "-", color:"#fb923c" },
        ].map(s => (
          <div key={s.label} style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:16, padding:"18px 16px" }}>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".76rem", marginBottom:4 }}>{s.label}</p>
            <p style={{ color:s.color, fontSize:"1.5rem", fontWeight:900 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {cicilans.length === 0 ? (
        <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", padding:"60px 0" }}>Belum ada cicilan aktif</div>
      ) : cicilans.map(c => {
        const paid = c.paid_installments || 0;
        const tenor = c.tenor || 1;
        const remaining = tenor - paid;
        return (
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
                    <p style={{ color:"#fff", fontWeight:700, fontSize:".95rem" }}>{c.product_name}</p>
                    <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".75rem" }}>{c.id.slice(0,8).toUpperCase()} · {tenor} bulan</p>
                  </div>
                </div>
                <span style={{ background: c.status==="active"?"rgba(212,175,55,0.1)":"rgba(74,222,128,0.1)", color: c.status==="active"?"#D4AF37":"#4ade80", borderRadius:8, padding:"4px 12px", fontSize:".75rem", fontWeight:700 }}>
                  {c.status==="active" ? "Aktif" : c.status==="overdue" ? "Terlambat" : "Selesai"}
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem" }}>Progress Cicilan</span>
                  <span style={{ color:"#fff", fontWeight:700, fontSize:".78rem" }}>{paid}/{tenor} bulan</span>
                </div>
                <div style={{ height:8, background:"rgba(255,255,255,0.06)", borderRadius:8, overflow:"hidden" }}>
                  <motion.div initial={{ width:0 }} animate={{ width:`${(paid/tenor)*100}%` }} transition={{ delay:0.3, duration:0.8 }}
                    style={{ height:"100%", background: c.status==="completed"?"#4ade80":"linear-gradient(90deg,#D4AF37,#F5D060)", borderRadius:8 }} />
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12 }}>
                {[
                  { label:"Cicilan/bulan", value:formatCurrency(c.monthly_amount) },
                  { label:"Sudah dibayar", value:`${paid}x = ${formatCurrency(paid * c.monthly_amount)}` },
                  { label:"Sisa cicilan", value:remaining > 0 ? `${remaining}x` : "Lunas ✓" },
                  { label:c.next_due_date ? "Jatuh tempo" : "Status", value:c.next_due_date ? formatDate(c.next_due_date) : "Selesai" },
                ].map(r => (
                  <div key={r.label} style={{ background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"10px 12px" }}>
                    <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".72rem", marginBottom:3 }}>{r.label}</p>
                    <p style={{ color:"rgba(255,255,255,0.8)", fontWeight:600, fontSize:".82rem" }}>{r.value}</p>
                  </div>
                ))}
              </div>

              {c.status === "active" && c.next_due_date && (
                <div style={{ marginTop:14, background:"rgba(251,146,60,0.08)", border:"1px solid rgba(251,146,60,0.15)", borderRadius:11, padding:"10px 14px", display:"flex", alignItems:"center", gap:8 }}>
                  <Calendar style={{ width:14, height:14, color:"#fb923c", flexShrink:0 }} />
                  <span style={{ color:"rgba(255,255,255,0.55)", fontSize:".78rem" }}>
                    Jatuh tempo berikutnya: <strong style={{ color:"#fb923c" }}>{formatDate(c.next_due_date)}</strong> — {formatCurrency(c.monthly_amount)}
                  </span>
                </div>
              )}
            </div>

            {/* Toggle expand for tenor info */}
            <button onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              style={{ width:"100%", padding:"12px 22px", background:"rgba(255,255,255,0.02)", border:"none", borderTop:"1px solid rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.4)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, fontSize:".8rem" }}>
              {expanded === c.id ? <ChevronUp style={{ width:13, height:13 }} /> : <ChevronDown style={{ width:13, height:13 }} />}
              {expanded === c.id ? "Sembunyikan" : "Lihat"} Detail Cicilan
            </button>

            {expanded === c.id && (
              <div style={{ padding:"0 22px 20px" }}>
                <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:12 }}>
                  {Array.from({ length: tenor }, (_, i) => {
                    const monthNum = i + 1;
                    const isPaid = monthNum <= paid;
                    return (
                      <div key={monthNum} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", background:"rgba(255,255,255,0.02)", borderRadius:10 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          {isPaid ? <CheckCircle style={{ width:14, height:14, color:"#4ade80", flexShrink:0 }} /> : <Clock style={{ width:14, height:14, color:"rgba(255,255,255,0.2)", flexShrink:0 }} />}
                          <span style={{ color:"rgba(255,255,255,0.55)", fontSize:".78rem" }}>Bulan ke-{monthNum}</span>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                          <span style={{ color: isPaid?"#D4AF37":"rgba(255,255,255,0.25)", fontWeight:isPaid?700:400, fontSize:".82rem" }}>{formatCurrency(c.monthly_amount)}</span>
                          <span style={{ background: isPaid?"rgba(74,222,128,0.1)":"rgba(255,255,255,0.05)", color: isPaid?"#4ade80":"rgba(255,255,255,0.2)", borderRadius:6, padding:"2px 8px", fontSize:".7rem" }}>
                            {isPaid ? "Lunas" : "Belum"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        );
      })}

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
