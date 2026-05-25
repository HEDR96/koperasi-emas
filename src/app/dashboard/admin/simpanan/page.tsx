"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { PiggyBank, CheckCircle, XCircle, Clock, Search, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

type SimpananItem = {
  id: string;
  user_id: string;
  type: "pokok" | "wajib" | "sukarela";
  amount: number;
  description: string | null;
  status: "pending" | "completed" | "rejected";
  created_at: string;
  profiles?: { name: string; phone: string | null } | null;
};

const TYPE_LABEL = { pokok:"Simpanan Pokok", wajib:"Simpanan Wajib", sukarela:"Simpanan Sukarela" };
const TYPE_COLOR = { pokok:"#D4AF37", wajib:"#60a5fa", sukarela:"#4ade80" };
const S_MAP = {
  pending:   { label:"Menunggu",  bg:"rgba(251,146,60,0.1)",  color:"#fb923c" },
  completed: { label:"Diterima",  bg:"rgba(74,222,128,0.1)",  color:"#4ade80" },
  rejected:  { label:"Ditolak",   bg:"rgba(248,113,113,0.1)", color:"#f87171" },
};

export default function AdminSimpananPage() {
  const { user } = useAuthStore();
  const [rows, setRows]       = useState<SimpananItem[]>([]);
  const [filter, setFilter]   = useState<"all"|"pending"|"completed"|"rejected">("pending");
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);
  const [notes, setNotes]     = useState<Record<string,string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase
      .from("simpanan")
      .select("*, profiles(name, phone)")
      .order("created_at", { ascending: false }) as any);
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, action: "completed"|"rejected") => {
    await (supabase.from("simpanan") as any).update({
      status: action,
      verified_by: user?.id,
    }).eq("id", id);
    setRows(r => r.map(x => x.id===id ? { ...x, status: action } : x));
  };

  const filtered = rows
    .filter(r => filter === "all" || r.status === filter)
    .filter(r => !search || (r.profiles?.name ?? "").toLowerCase().includes(search.toLowerCase()));

  const pendingCount   = rows.filter(r => r.status==="pending").length;
  const completedCount = rows.filter(r => r.status==="completed").length;
  const totalCompleted = rows.filter(r => r.status==="completed").reduce((a,b) => a+b.amount, 0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        {[
          { label:"Menunggu Verifikasi", value:String(pendingCount), color:"#fb923c" },
          { label:"Sudah Diterima",      value:String(completedCount), color:"#4ade80" },
          { label:"Total Dana Simpanan", value:formatCurrency(totalCompleted), color:"#D4AF37" },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.12)", borderRadius:16, padding:"18px 16px", textAlign:"center" }}>
            <p style={{ color:s.color, fontWeight:900, fontSize:"1.2rem", marginBottom:4 }}>{s.value}</p>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".75rem" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter + Search */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:6 }}>
          {(["all","pending","completed","rejected"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:"7px 14px", borderRadius:9, border:"1px solid", fontSize:".78rem", fontWeight:600, cursor:"pointer",
                borderColor: filter===f ? "#D4AF37" : "rgba(255,255,255,0.1)",
                background:  filter===f ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.02)",
                color:       filter===f ? "#D4AF37" : "rgba(255,255,255,0.45)" }}>
              {{ all:"Semua", pending:"Menunggu", completed:"Diterima", rejected:"Ditolak" }[f]}
              {f==="pending" && pendingCount>0 && (
                <span style={{ marginLeft:6, background:"#fb923c", color:"#000", borderRadius:999, padding:"1px 7px", fontSize:".68rem", fontWeight:800 }}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <div style={{ flex:1, minWidth:200, position:"relative" }}>
          <Search style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:15, height:15, color:"rgba(255,255,255,0.25)" }} />
          <input placeholder="Cari nama member..." value={search} onChange={e => setSearch(e.target.value)}
            className="input-gold" style={{ width:"100%", borderRadius:10, padding:"8px 12px 8px 36px", fontSize:".83rem" }} />
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
        style={{ background:"rgba(14,14,14,0.85)", border:"1px solid rgba(212,175,55,0.12)", borderRadius:20, overflow:"hidden" }}>
        {loading ? (
          <div style={{ padding:"40px 0", textAlign:"center", color:"rgba(255,255,255,0.2)" }}>Memuat data simpanan...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:"40px 0", textAlign:"center" }}>
            <PiggyBank style={{ width:36, height:36, color:"rgba(255,255,255,0.1)", margin:"0 auto 10px" }} />
            <p style={{ color:"rgba(255,255,255,0.2)", fontSize:".85rem" }}>Tidak ada data simpanan</p>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 1fr 1fr 1.5fr", gap:0, padding:"12px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              {["Member","Jenis","Jumlah","Status","Aksi"].map(h => (
                <span key={h} style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".05em" }}>{h}</span>
              ))}
            </div>
            {filtered.map((r, i) => {
              const st  = S_MAP[r.status];
              const tc  = TYPE_COLOR[r.type];
              return (
                <div key={r.id} style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 1fr 1fr 1.5fr", gap:0, padding:"14px 20px", alignItems:"center",
                  borderBottom: i<filtered.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  background: r.status==="pending" ? "rgba(251,146,60,0.02)" : "transparent" }}>

                  {/* Member */}
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div className="bg-gold-gradient" style={{ width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#0a0a0a", fontSize:".75rem", flexShrink:0 }}>
                      {(r.profiles?.name?.[0] ?? "?")}
                    </div>
                    <div>
                      <p style={{ color:"#fff", fontSize:".83rem", fontWeight:600 }}>{r.profiles?.name ?? r.user_id.slice(0,8)}</p>
                      <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".7rem" }}>
                        {new Date(r.created_at).toLocaleDateString("id-ID",{ day:"2-digit", month:"short", year:"numeric" })}
                      </p>
                    </div>
                  </div>

                  {/* Type */}
                  <span style={{ color:tc, fontSize:".78rem", fontWeight:600 }}>{TYPE_LABEL[r.type]}</span>

                  {/* Amount */}
                  <span style={{ color:"#fff", fontWeight:700, fontSize:".84rem" }}>{formatCurrency(r.amount)}</span>

                  {/* Status */}
                  <span style={{ background:st.bg, color:st.color, borderRadius:8, padding:"4px 10px", fontSize:".72rem", fontWeight:700, display:"inline-block", width:"fit-content" }}>
                    {st.label}
                  </span>

                  {/* Aksi */}
                  <div style={{ display:"flex", gap:6 }}>
                    {r.status === "pending" ? (
                      <>
                        <button onClick={() => act(r.id, "completed")}
                          style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, border:"1px solid rgba(74,222,128,0.3)", background:"rgba(74,222,128,0.08)", color:"#4ade80", fontSize:".75rem", fontWeight:600, cursor:"pointer" }}>
                          <CheckCircle style={{ width:12, height:12 }} /> Terima
                        </button>
                        <button onClick={() => act(r.id, "rejected")}
                          style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:8, border:"1px solid rgba(248,113,113,0.3)", background:"rgba(248,113,113,0.08)", color:"#f87171", fontSize:".75rem", fontWeight:600, cursor:"pointer" }}>
                          <XCircle style={{ width:12, height:12 }} /> Tolak
                        </button>
                      </>
                    ) : (
                      <span style={{ color:"rgba(255,255,255,0.2)", fontSize:".75rem" }}>
                        {r.status === "completed" ? "✓ Diterima" : "✗ Ditolak"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Ringkasan per member */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:.2 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.12)", borderRadius:20, padding:22 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <TrendingUp style={{ width:18, height:18, color:"#D4AF37" }} />
          <h3 style={{ color:"#fff", fontWeight:700 }}>Ringkasan per Member</h3>
        </div>
        {(() => {
          const byMember = rows.filter(r=>r.status==="completed").reduce((acc, r) => {
            const name = r.profiles?.name ?? r.user_id.slice(0,8);
            if (!acc[name]) acc[name] = { pokok:0, wajib:0, sukarela:0 };
            acc[name][r.type] += r.amount;
            return acc;
          }, {} as Record<string, { pokok:number; wajib:number; sukarela:number }>);
          const entries = Object.entries(byMember);
          if (entries.length === 0)
            return <p style={{ color:"rgba(255,255,255,0.2)", fontSize:".83rem" }}>Belum ada simpanan yang diterima.</p>;
          return entries.map(([name, s], i) => (
            <div key={name} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderBottom: i<entries.length-1?"1px solid rgba(255,255,255,0.04)":"none", flexWrap:"wrap", gap:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div className="bg-gold-gradient" style={{ width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#0a0a0a", fontSize:".72rem", flexShrink:0 }}>
                  {name[0]}
                </div>
                <p style={{ color:"#fff", fontSize:".84rem", fontWeight:600 }}>{name}</p>
              </div>
              <div style={{ display:"flex", gap:16 }}>
                <span style={{ color:"#D4AF37", fontSize:".78rem" }}>Pokok: <strong>{formatCurrency(s.pokok)}</strong></span>
                <span style={{ color:"#60a5fa", fontSize:".78rem" }}>Wajib: <strong>{formatCurrency(s.wajib)}</strong></span>
                <span style={{ color:"#4ade80", fontSize:".78rem" }}>Sukarela: <strong>{formatCurrency(s.sukarela)}</strong></span>
                <span style={{ color:"rgba(255,255,255,0.6)", fontSize:".78rem" }}>Total: <strong style={{ color:"#fff" }}>{formatCurrency(s.pokok+s.wajib+s.sukarela)}</strong></span>
              </div>
            </div>
          ));
        })()}
      </motion.div>

    </div>
  );
}
