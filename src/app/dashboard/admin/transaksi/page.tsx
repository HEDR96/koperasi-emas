"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

interface TxRow {
  id: string;
  type: string;
  amount: number;
  gram: number | null;
  status: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profiles: { name: string } | null;
}

const TYPE_LABEL: Record<string, string> = {
  buy:"Beli Emas", buyback:"Buyback", cicilan:"Cicilan",
  Simpanan:"Simpanan", transfer:"Transfer", referral_bonus:"Bonus Referral",
};
const STATUS_COLOR: Record<string,string> = {
  pending:"#fbbf24", processing:"#60a5fa", completed:"#34d399", rejected:"#f87171",
};
const STATUS_BG: Record<string,string> = {
  pending:"rgba(251,191,36,0.12)", processing:"rgba(96,165,250,0.12)",
  completed:"rgba(52,211,153,0.12)", rejected:"rgba(248,113,113,0.12)",
};

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n);
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
}

type Tab = "pending" | "history";

export default function AdminTransaksiPage() {
  const { user }            = useAuthStore();
  const [tab, setTab]       = useState<Tab>("pending");
  const [pending, setPending] = useState<TxRow[]>([]);
  const [history, setHistory] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  async function load() {
    setLoading(true);
    try {
      const [pRes, hRes] = await Promise.all([
        (supabase.from("transactions") as any)
          .select("id,type,amount,gram,status,payment_method,notes,created_at,updated_at,profiles:profiles!user_id(name)")
          .eq("status","pending")
          .order("created_at",{ascending:false}),
        (supabase.from("transactions") as any)
          .select("id,type,amount,gram,status,payment_method,notes,created_at,updated_at,profiles:profiles!user_id(name)")
          .in("status",["completed","rejected","processing"])
          .order("updated_at",{ascending:false})
          .limit(100),
      ]);
      setPending(pRes.data ?? []);
      setHistory(hRes.data ?? []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function approve(tx: TxRow) {
    setActing(tx.id);
    await (supabase.from("transactions") as any)
      .update({ status:"completed", updated_at: new Date().toISOString(), notes: tx.notes })
      .eq("id", tx.id);
    // notify member
    try {
      await (supabase.from("notifications") as any).insert({
        user_id: (tx as any).user_id,
        title: "Transaksi Disetujui",
        body: `Transaksi ${TYPE_LABEL[tx.type]||tx.type} sebesar ${fmt(tx.amount)} telah disetujui.`,
        type: "transaction",
        is_read: false,
        link: "/dashboard/member/histori",
      });
    } catch {}
    await load();
    setActing(null);
  }

  async function rejectConfirm() {
    if (!rejectId) return;
    setActing(rejectId);
    await (supabase.from("transactions") as any)
      .update({ status:"rejected", updated_at: new Date().toISOString(), notes: rejectNote || null })
      .eq("id", rejectId);
    setRejectId(null); setRejectNote("");
    await load();
    setActing(null);
  }

  const filteredHistory = filterStatus === "all"
    ? history
    : history.filter(t => t.status === filterStatus);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer",
    fontWeight: 600, fontSize: ".88rem", transition: "all .2s",
    background: active ? "rgba(212,175,55,0.15)" : "transparent",
    color: active ? "#D4AF37" : "rgba(255,255,255,0.4)",
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Transaksi & Approval</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>
            Approve atau tolak permintaan transaksi member.
          </p>
        </div>
        <button onClick={load}
          style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:14, height:14 }} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:4, width:"fit-content" }}>
        <button style={tabStyle(tab==="pending")} onClick={()=>setTab("pending")}>
          Permintaan Member
          {pending.length > 0 && (
            <span style={{ marginLeft:6, background:"rgba(251,191,36,0.2)", color:"#fbbf24", borderRadius:20, padding:"1px 7px", fontSize:".72rem" }}>
              {pending.length}
            </span>
          )}
        </button>
        <button style={tabStyle(tab==="history")} onClick={()=>setTab("history")}>
          Riwayat
        </button>
      </div>

      {/* Tab Content */}
      {tab === "pending" && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  {["Member","Jenis","Gram","Jumlah","Metode","Tanggal","Aksi"].map(h=>(
                    <th key={h} style={{ padding:"12px 18px", textAlign:"left", color:"rgba(255,255,255,0.3)", fontSize:".75rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".05em", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ padding:"40px", textAlign:"center", color:"rgba(255,255,255,0.3)" }}>Memuat...</td></tr>
                ) : pending.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding:"40px", textAlign:"center", color:"rgba(255,255,255,0.3)" }}>Tidak ada transaksi pending.</td></tr>
                ) : pending.map(tx => (
                  <tr key={tx.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.02)"}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}
                  >
                    <td style={{ padding:"13px 18px", color:"#fff", fontWeight:600, fontSize:".88rem" }}>
                      {(tx.profiles as any)?.name || "—"}
                    </td>
                    <td style={{ padding:"13px 18px", color:"rgba(255,255,255,0.6)", fontSize:".85rem" }}>
                      {TYPE_LABEL[tx.type]||tx.type}
                    </td>
                    <td style={{ padding:"13px 18px", color:"#D4AF37", fontSize:".85rem" }}>
                      {tx.gram ? tx.gram+" gr" : "—"}
                    </td>
                    <td style={{ padding:"13px 18px", color:"#D4AF37", fontWeight:600, fontSize:".85rem" }}>
                      {fmt(tx.amount)}
                    </td>
                    <td style={{ padding:"13px 18px", color:"rgba(255,255,255,0.45)", fontSize:".82rem" }}>
                      {tx.payment_method || "—"}
                    </td>
                    <td style={{ padding:"13px 18px", color:"rgba(255,255,255,0.4)", fontSize:".8rem", whiteSpace:"nowrap" }}>
                      {fmtDate(tx.created_at)}
                    </td>
                    <td style={{ padding:"13px 18px" }}>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={()=>approve(tx)} disabled={acting===tx.id}
                          style={{ background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.25)", borderRadius:8, padding:"5px 12px", color:"#34d399", cursor:"pointer", fontSize:".78rem", fontWeight:600, opacity:acting===tx.id?.6:1 }}>
                          Setujui
                        </button>
                        <button onClick={()=>{ setRejectId(tx.id); setRejectNote(""); }} disabled={acting===tx.id}
                          style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:8, padding:"5px 12px", color:"#f87171", cursor:"pointer", fontSize:".78rem", fontWeight:600, opacity:acting===tx.id?.6:1 }}>
                          Tolak
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {tab === "history" && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Filter */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {["all","completed","rejected","processing"].map(s => (
              <button key={s} onClick={()=>setFilterStatus(s)}
                style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${filterStatus===s?"rgba(212,175,55,0.35)":"rgba(255,255,255,0.08)"}`, background:filterStatus===s?"rgba(212,175,55,0.1)":"transparent", color:filterStatus===s?"#D4AF37":"rgba(255,255,255,0.45)", cursor:"pointer", fontSize:".8rem", fontWeight:filterStatus===s?700:400, textTransform:"capitalize" }}>
                {s==="all"?"Semua":s}
              </button>
            ))}
          </div>
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, overflow:"hidden" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    {["Member","Jenis","Jumlah","Status","Catatan","Tanggal"].map(h=>(
                      <th key={h} style={{ padding:"12px 18px", textAlign:"left", color:"rgba(255,255,255,0.3)", fontSize:".75rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".05em", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} style={{ padding:"40px", textAlign:"center", color:"rgba(255,255,255,0.3)" }}>Memuat...</td></tr>
                  ) : filteredHistory.length===0 ? (
                    <tr><td colSpan={6} style={{ padding:"40px", textAlign:"center", color:"rgba(255,255,255,0.3)" }}>Belum ada riwayat.</td></tr>
                  ) : filteredHistory.map(tx => (
                    <tr key={tx.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.02)"}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}
                    >
                      <td style={{ padding:"13px 18px", color:"#fff", fontWeight:600, fontSize:".88rem" }}>
                        {(tx.profiles as any)?.name || "—"}
                      </td>
                      <td style={{ padding:"13px 18px", color:"rgba(255,255,255,0.6)", fontSize:".85rem" }}>
                        {TYPE_LABEL[tx.type]||tx.type}
                      </td>
                      <td style={{ padding:"13px 18px", color:"#D4AF37", fontWeight:600, fontSize:".85rem" }}>
                        {fmt(tx.amount)}
                      </td>
                      <td style={{ padding:"13px 18px" }}>
                        <span style={{ background:STATUS_BG[tx.status]||"rgba(255,255,255,0.08)", color:STATUS_COLOR[tx.status]||"#fff", borderRadius:6, padding:"3px 10px", fontSize:".75rem", fontWeight:600, textTransform:"capitalize" }}>
                          {tx.status}
                        </span>
                      </td>
                      <td style={{ padding:"13px 18px", color:"rgba(255,255,255,0.4)", fontSize:".8rem", maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {tx.notes || "—"}
                      </td>
                      <td style={{ padding:"13px 18px", color:"rgba(255,255,255,0.4)", fontSize:".8rem", whiteSpace:"nowrap" }}>
                        {fmtDate(tx.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectId && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={()=>setRejectId(null)}
              style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:300 }} />
            <motion.div
              initial={{ opacity:0, scale:.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:.95 }}
              style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"min(420px,92vw)", background:"#111", border:"1px solid rgba(248,113,113,0.2)", borderRadius:20, padding:28, zIndex:301 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                <h2 style={{ color:"#fff", fontWeight:700, fontSize:"1.05rem", margin:0 }}>Tolak Transaksi</h2>
                <button onClick={()=>setRejectId(null)}
                  style={{ background:"rgba(255,255,255,0.07)", border:"none", borderRadius:8, width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.5)", cursor:"pointer" }}>
                  <X style={{ width:14, height:14 }} />
                </button>
              </div>
              <p style={{ color:"rgba(255,255,255,0.5)", fontSize:".85rem", marginBottom:14 }}>
                Tambahkan catatan alasan penolakan (opsional):
              </p>
              <textarea value={rejectNote} onChange={e=>setRejectNote(e.target.value)}
                placeholder="Contoh: Bukti pembayaran tidak valid"
                rows={3}
                style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:".9rem", outline:"none", resize:"vertical", fontFamily:"inherit", boxSizing:"border-box" }}
              />
              <div style={{ display:"flex", gap:10, marginTop:18 }}>
                <button onClick={()=>setRejectId(null)}
                  style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:".88rem" }}>
                  Batal
                </button>
                <button onClick={rejectConfirm} disabled={!!acting}
                  style={{ flex:1, background:"rgba(248,113,113,0.15)", border:"1px solid rgba(248,113,113,0.3)", borderRadius:10, padding:"10px", color:"#f87171", cursor:"pointer", fontSize:".88rem", fontWeight:700, opacity:acting?.6:1 }}>
                  {acting ? "Menolak..." : "Tolak Transaksi"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}


