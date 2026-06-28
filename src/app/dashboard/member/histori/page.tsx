"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, CheckCircle, XCircle, Clock, ArrowLeftRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

interface TxRow {
  id: string; type: string; amount: number; gram: number | null;
  status: string; payment_method: string | null; notes: string | null;
  created_at: string; transaction_date: string | null;
}

const TYPE_LABEL: Record<string,string> = {
  buy:"Beli Emas", buyback:"Jual Kembali", cicilan:"Cicilan",
  tabungan:"Setor Simpanan", Simpanan:"Simpanan", transfer:"Transfer", referral_bonus:"Bonus Referral",
};
const STATUS_COLOR: Record<string,string> = {
  pending:"#fbbf24", processing:"#60a5fa", completed:"#34d399", rejected:"#f87171",
};
const STATUS_BG: Record<string,string> = {
  pending:"rgba(251,191,36,0.12)", processing:"rgba(96,165,250,0.12)",
  completed:"rgba(52,211,153,0.12)", rejected:"rgba(248,113,113,0.12)",
};
const STATUS_LABEL: Record<string,string> = {
  pending:"Menunggu", processing:"Diproses", completed:"Selesai", rejected:"Ditolak",
};

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n);
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
}

const FILTERS = ["semua","pending","completed","rejected"] as const;
type Filter = typeof FILTERS[number];

export default function MemberHistoriPage() {
  const { user } = useAuthStore();
  const [txs, setTxs]       = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<Filter>("semua");

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await (supabase.from("transactions") as any)
        .select("id,type,amount,gram,status,payment_method,notes,created_at,transaction_date")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setTxs(data ?? []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [user?.id]);

  const filtered = filter === "semua" ? txs : txs.filter(t => t.status === filter);
  const stats = {
    total: txs.length,
    pending: txs.filter(t => t.status === "pending").length,
    completed: txs.filter(t => t.status === "completed").length,
    rejected: txs.filter(t => t.status === "rejected").length,
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Histori Transaksi</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Semua transaksi dan permintaan Anda</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:12 }}>
        {[
          { label:"Total",    value:stats.total,     color:"#fff",    bg:"rgba(255,255,255,0.04)" },
          { label:"Pending",  value:stats.pending,   color:"#fbbf24", bg:"rgba(251,191,36,0.08)" },
          { label:"Selesai",  value:stats.completed, color:"#34d399", bg:"rgba(52,211,153,0.08)" },
          { label:"Ditolak",  value:stats.rejected,  color:"#f87171", bg:"rgba(248,113,113,0.08)" },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, border:`1px solid ${s.color}22`, borderRadius:12, padding:"14px 16px" }}>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".73rem", margin:"0 0 5px" }}>{s.label}</p>
            <p style={{ color:s.color, fontWeight:800, fontSize:"1.6rem", margin:0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${filter===f?"rgba(212,175,55,0.35)":"rgba(255,255,255,0.08)"}`, background:filter===f?"rgba(212,175,55,0.1)":"transparent", color:filter===f?"#D4AF37":"rgba(255,255,255,0.45)", cursor:"pointer", fontSize:".8rem", fontWeight:filter===f?700:400, textTransform:"capitalize" }}>
            {f==="semua"?"Semua":STATUS_LABEL[f]||f}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <p style={{ color:"rgba(255,255,255,0.3)" }}>Memuat...</p>
      ) : filtered.length === 0 ? (
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:"48px", textAlign:"center" }}>
          <ArrowLeftRight style={{ width:32, height:32, color:"rgba(255,255,255,0.1)", margin:"0 auto 12px" }} />
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".9rem", margin:0 }}>Belum ada transaksi.</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {filtered.map((tx, i) => (
            <motion.div key={tx.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.03 }}
              style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:"16px 18px" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5, flexWrap:"wrap" }}>
                    <p style={{ color:"#fff", fontWeight:700, fontSize:".92rem", margin:0 }}>{TYPE_LABEL[tx.type]||tx.type}</p>
                    <span style={{ background:STATUS_BG[tx.status]||"rgba(255,255,255,0.08)", color:STATUS_COLOR[tx.status]||"#fff", borderRadius:6, padding:"2px 8px", fontSize:".72rem", fontWeight:700, display:"flex", alignItems:"center", gap:4 }}>
                      {tx.status==="pending"   && <Clock style={{ width:10, height:10 }} />}
                      {tx.status==="completed" && <CheckCircle style={{ width:10, height:10 }} />}
                      {tx.status==="rejected"  && <XCircle style={{ width:10, height:10 }} />}
                      {STATUS_LABEL[tx.status]||tx.status}
                    </span>
                  </div>
                  <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".78rem", margin:0 }}>
                    {fmtDate(tx.transaction_date || tx.created_at)}
                    {tx.gram && ` · ${tx.gram} gr`}
                    {tx.payment_method && ` · ${tx.payment_method}`}
                  </p>
                  {tx.status==="rejected" && tx.notes && (
                    <p style={{ color:"#f87171", fontSize:".78rem", marginTop:6, background:"rgba(248,113,113,0.06)", borderRadius:6, padding:"5px 10px" }}>
                      Alasan: {tx.notes}
                    </p>
                  )}
                </div>
                <p style={{ color:"#D4AF37", fontWeight:800, fontSize:"1rem", margin:0, flexShrink:0 }}>{fmt(tx.amount)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

