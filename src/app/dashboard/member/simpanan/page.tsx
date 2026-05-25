"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PiggyBank, CheckCircle, Clock, Plus, AlertCircle, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

const SIMPANAN_POKOK  = 5_000_000;
const SIMPANAN_WAJIB  = 200_000;

type SimpananRow = {
  id: string;
  type: "pokok" | "wajib" | "sukarela";
  amount: number;
  description: string | null;
  status: "pending" | "completed" | "rejected";
  created_at: string;
};

const TYPE_LABEL: Record<string, string> = {
  pokok:    "Simpanan Pokok",
  wajib:    "Simpanan Wajib",
  sukarela: "Simpanan Sukarela",
};
const TYPE_COLOR: Record<string, string> = {
  pokok:    "#D4AF37",
  wajib:    "#60a5fa",
  sukarela: "#4ade80",
};
const STATUS_MAP = {
  completed: { label:"Diterima",  bg:"rgba(74,222,128,0.1)",   color:"#4ade80"  },
  pending:   { label:"Menunggu",  bg:"rgba(251,146,60,0.1)",   color:"#fb923c"  },
  rejected:  { label:"Ditolak",   bg:"rgba(248,113,113,0.1)",  color:"#f87171"  },
};

export default function SimpananPage() {
  const { user } = useAuthStore();
  const [rows, setRows]         = useState<SimpananRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"wajib"|"sukarela">("wajib");
  const [formAmt, setFormAmt]   = useState("");
  const [formNote, setFormNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]       = useState("");

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("simpanan")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }) as { data: SimpananRow[] | null; error: unknown };
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  // Summary
  const done  = rows.filter(r => r.status === "completed");
  const totalPokok    = done.filter(r => r.type === "pokok").reduce((a,b) => a + b.amount, 0);
  const totalWajib    = done.filter(r => r.type === "wajib").reduce((a,b) => a + b.amount, 0);
  const totalSukarela = done.filter(r => r.type === "sukarela").reduce((a,b) => a + b.amount, 0);
  const totalAll      = totalPokok + totalWajib + totalSukarela;

  const pokokPaid   = totalPokok >= SIMPANAN_POKOK;
  const bulanWajib  = Math.floor(totalWajib / SIMPANAN_WAJIB);
  const pending     = rows.find(r => r.status === "pending");

  const submitSimpanan = async () => {
    if (!user?.id || !formAmt) return;
    setSubmitting(true);
    const amount = parseInt(formAmt.replace(/\D/g,"")) || 0;
    if (amount < 10_000) { setToast("Minimal Rp 10.000"); setSubmitting(false); return; }

    await (supabase.from("simpanan") as any).insert({
      user_id: user.id,
      type: formType,
      amount,
      description: formNote || null,
      status: "pending",
    });

    setSubmitting(false);
    setShowForm(false);
    setFormAmt(""); setFormNote("");
    setToast("Setoran berhasil dikirim, menunggu verifikasi admin.");
    setTimeout(() => setToast(""), 4000);
    load();
  };

  return (
    <div style={{ maxWidth:620, margin:"0 auto", display:"flex", flexDirection:"column", gap:22 }}>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{ background:"rgba(74,222,128,0.12)", border:"1px solid rgba(74,222,128,0.3)", borderRadius:12, padding:"12px 16px", color:"#4ade80", fontSize:".85rem", display:"flex", alignItems:"center", gap:8 }}>
            <CheckCircle style={{ width:15, height:15, flexShrink:0 }} />{toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Simpanan Pokok */}
      {!pokokPaid && (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{ background:"rgba(251,146,60,0.08)", border:"1px solid rgba(251,146,60,0.3)", borderRadius:18, padding:20, display:"flex", alignItems:"flex-start", gap:14 }}>
          <AlertCircle style={{ width:22, height:22, color:"#fb923c", flexShrink:0, marginTop:2 }} />
          <div>
            <p style={{ color:"#fb923c", fontWeight:700, fontSize:".9rem", marginBottom:4 }}>Simpanan Pokok Belum Lunas</p>
            <p style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", lineHeight:1.6 }}>
              Kewajiban simpanan pokok <strong style={{ color:"#fff" }}>{formatCurrency(SIMPANAN_POKOK)}</strong> belum terpenuhi.
              Sudah dibayar: <strong style={{ color:"#D4AF37" }}>{formatCurrency(totalPokok)}</strong>
            </p>
            <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:6, overflow:"hidden", marginTop:10 }}>
              <motion.div initial={{ width:0 }} animate={{ width:`${Math.min((totalPokok/SIMPANAN_POKOK)*100, 100)}%` }}
                transition={{ duration:.8 }} style={{ height:"100%", background:"linear-gradient(90deg,#fb923c,#fbbf24)", borderRadius:6 }} />
            </div>
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem", marginTop:4 }}>
              {formatCurrency(totalPokok)} / {formatCurrency(SIMPANAN_POKOK)} ({((totalPokok/SIMPANAN_POKOK)*100).toFixed(1)}%)
            </p>
          </div>
        </motion.div>
      )}
      {pokokPaid && (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{ background:"rgba(74,222,128,0.06)", border:"1px solid rgba(74,222,128,0.2)", borderRadius:18, padding:16, display:"flex", alignItems:"center", gap:12 }}>
          <CheckCircle style={{ width:20, height:20, color:"#4ade80" }} />
          <p style={{ color:"#4ade80", fontWeight:600, fontSize:".85rem" }}>Simpanan Pokok Lunas ✓</p>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
        {[
          { label:"Total Simpanan",     value:formatCurrency(totalAll),      color:"#D4AF37", sub:"semua jenis" },
          { label:"Simpanan Pokok",     value:formatCurrency(totalPokok),    color:"#D4AF37", sub: pokokPaid ? "✓ Lunas" : `kurang ${formatCurrency(SIMPANAN_POKOK-totalPokok)}` },
          { label:"Simpanan Wajib",     value:formatCurrency(totalWajib),    color:"#60a5fa", sub:`${bulanWajib} bulan × Rp 200.000` },
          { label:"Simpanan Sukarela",  value:formatCurrency(totalSukarela), color:"#4ade80", sub:"setoran bebas" },
        ].map((s,i) => (
          <motion.div key={s.label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.06 }}
            style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.12)", borderRadius:16, padding:"18px 16px" }}>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem", marginBottom:6 }}>{s.label}</p>
            <p style={{ color:s.color, fontWeight:900, fontSize:i===0?"1.25rem":"1rem", marginBottom:2 }}>{s.value}</p>
            <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".72rem" }}>{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Info Simpanan Wajib */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:.25 }}
        style={{ background:"rgba(96,165,250,0.05)", border:"1px solid rgba(96,165,250,0.2)", borderRadius:16, padding:"16px 18px", display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:40, height:40, borderRadius:11, background:"rgba(96,165,250,0.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Clock style={{ width:18, height:18, color:"#60a5fa" }} />
        </div>
        <div>
          <p style={{ color:"#fff", fontWeight:600, fontSize:".85rem", marginBottom:3 }}>Simpanan Wajib Rp 200.000 / bulan</p>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".78rem" }}>
            Setiap bulan wajib menyetor Rp 200.000 ke simpanan koperasi. Sudah berjalan{" "}
            <span style={{ color:"#60a5fa", fontWeight:700 }}>{bulanWajib} bulan</span>.
            {pending ? <span style={{ color:"#fb923c" }}> Ada 1 setoran menunggu verifikasi.</span> : null}
          </p>
        </div>
      </motion.div>

      {/* Tombol Setor */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:.3 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:22 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: showForm ? 18 : 0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <PiggyBank style={{ width:20, height:20, color:"#D4AF37" }} />
            <h3 style={{ color:"#fff", fontWeight:700 }}>Setor Simpanan</h3>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            style={{ background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:9, padding:"7px 14px", color:"#D4AF37", fontSize:".82rem", cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
            {showForm ? <ChevronUp style={{ width:14,height:14 }} /> : <><Plus style={{ width:14,height:14 }} /> Setor</>}
          </button>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }} style={{ overflow:"hidden" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {/* Type selector */}
                <div>
                  <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:8 }}>Jenis Simpanan</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {([
                      { v:"wajib",    label:"Simpanan Wajib",    sub:`Rp 200.000/bln`, color:"#60a5fa" },
                      { v:"sukarela", label:"Simpanan Sukarela",  sub:"Bebas",          color:"#4ade80" },
                      ...(!pokokPaid ? [{ v:"pokok", label:"Simpanan Pokok", sub:formatCurrency(SIMPANAN_POKOK), color:"#D4AF37" }] : []),
                    ] as { v:"wajib"|"sukarela"|"pokok"; label:string; sub:string; color:string }[]).map(opt => (
                      <button key={opt.v} onClick={() => { setFormType(opt.v as "wajib"|"sukarela"); if(opt.v==="wajib") setFormAmt("200000"); else if(opt.v==="pokok") setFormAmt("5000000"); else setFormAmt(""); }}
                        style={{ padding:"12px 10px", borderRadius:12, border:"1px solid", textAlign:"left", cursor:"pointer",
                          borderColor: formType===opt.v ? opt.color : "rgba(255,255,255,0.08)",
                          background:  formType===opt.v ? `${opt.color}15` : "rgba(255,255,255,0.02)" }}>
                        <p style={{ color: formType===opt.v ? opt.color : "rgba(255,255,255,0.6)", fontSize:".82rem", fontWeight:600 }}>{opt.label}</p>
                        <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem", marginTop:2 }}>{opt.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:6 }}>Jumlah Setoran (Rp)</label>
                  <input type="number" placeholder="Masukkan jumlah..." value={formAmt}
                    onChange={e => setFormAmt(e.target.value)} min="10000"
                    className="input-gold" style={{ borderRadius:12, padding:"11px 14px", fontSize:".88rem", width:"100%" }} />
                  {formType==="wajib" && (
                    <p style={{ color:"rgba(96,165,250,0.7)", fontSize:".72rem", marginTop:4 }}>Min. Rp 200.000 per setoran (1 bulan)</p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:6 }}>Keterangan (opsional)</label>
                  <input type="text" placeholder="mis. Simpanan bulan Mei 2026" value={formNote}
                    onChange={e => setFormNote(e.target.value)}
                    className="input-gold" style={{ borderRadius:12, padding:"11px 14px", fontSize:".88rem", width:"100%" }} />
                </div>

                <div style={{ background:"rgba(212,175,55,0.05)", borderRadius:12, padding:"12px 14px", fontSize:".78rem", color:"rgba(255,255,255,0.4)" }}>
                  💡 Setor akan diverifikasi admin dalam 1×24 jam. Saldo baru terhitung setelah disetujui.
                </div>

                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={() => setShowForm(false)}
                    style={{ flex:1, padding:"11px", borderRadius:12, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:".86rem" }}>
                    Batal
                  </button>
                  <button onClick={submitSimpanan} disabled={submitting || !formAmt} className="btn-gold"
                    style={{ flex:2, padding:"11px", borderRadius:12, border:"none", cursor: submitting||!formAmt ? "not-allowed":"pointer", fontSize:".86rem", opacity: submitting||!formAmt ? .6 : 1 }}>
                    {submitting ? "Mengirim..." : "Kirim Setoran"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Histori */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:.35 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:22 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
          <TrendingUp style={{ width:18, height:18, color:"#D4AF37" }} />
          <h3 style={{ color:"#fff", fontWeight:700 }}>Histori Simpanan</h3>
          <span style={{ marginLeft:"auto", color:"rgba(255,255,255,0.3)", fontSize:".75rem" }}>{rows.length} transaksi</span>
        </div>

        {loading ? (
          <div style={{ textAlign:"center", padding:"32px 0", color:"rgba(255,255,255,0.2)", fontSize:".85rem" }}>Memuat...</div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign:"center", padding:"32px 0" }}>
            <PiggyBank style={{ width:36, height:36, color:"rgba(255,255,255,0.1)", margin:"0 auto 10px" }} />
            <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".83rem" }}>Belum ada histori simpanan</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {rows.map((r, i) => {
              const st = STATUS_MAP[r.status];
              const typeColor = TYPE_COLOR[r.type] || "#D4AF37";
              return (
                <div key={r.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 0", borderBottom: i < rows.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:`${typeColor}15`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <PiggyBank style={{ width:16, height:16, color:typeColor }} />
                    </div>
                    <div>
                      <p style={{ color:"#fff", fontSize:".84rem", fontWeight:600 }}>{TYPE_LABEL[r.type]}</p>
                      <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem" }}>
                        {new Date(r.created_at).toLocaleDateString("id-ID",{ day:"2-digit", month:"short", year:"numeric" })}
                        {r.description ? ` · ${r.description}` : ""}
                      </p>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
                    <span style={{ color:typeColor, fontWeight:700, fontSize:".84rem" }}>+{formatCurrency(r.amount)}</span>
                    <span style={{ background:st.bg, color:st.color, borderRadius:8, padding:"3px 9px", fontSize:".72rem", fontWeight:700 }}>{st.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

    </div>
  );
}
