"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle, Users, RefreshCw } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

interface PendingTx {
  id: string;
  type: string;
  amount: number;
  gram: number | null;
  created_at: string;
  profiles: { name: string } | null;
}

const TYPE_LABEL: Record<string, string> = {
  buy:"Beli Emas", buyback:"Buyback", cicilan:"Cicilan",
  Simpanan:"Simpanan", transfer:"Transfer", referral_bonus:"Bonus Referral",
};

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n);
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
}

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [pendingCount, setPendingCount] = useState(0);
  const [todayCount,   setTodayCount]   = useState(0);
  const [memberCount,  setMemberCount]  = useState(0);
  const [pending,      setPending]      = useState<PendingTx[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [acting,       setActing]       = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0,10);
      const [pCount, tCount, mCount, pList] = await Promise.all([
        (supabase.from("transactions") as any).select("id",{count:"exact",head:true}).eq("status","pending"),
        (supabase.from("transactions") as any).select("id",{count:"exact",head:true}).gte("created_at",today),
        (supabase.from("profiles") as any).select("id",{count:"exact",head:true}).eq("role","member"),
        (supabase.from("transactions") as any)
          .select("id,type,amount,gram,created_at,profiles:profiles!user_id(name)")
          .eq("status","pending")
          .order("created_at",{ascending:false})
          .limit(5),
      ]);
      setPendingCount(pCount.count ?? 0);
      setTodayCount(tCount.count ?? 0);
      setMemberCount(mCount.count ?? 0);
      setPending(pList.data ?? []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function approve(id: string) {
    setActing(id);
    await (supabase.from("transactions") as any)
      .update({ status:"completed", updated_at: new Date().toISOString() })
      .eq("id", id);
    await load();
    setActing(null);
  }

  async function reject(id: string) {
    setActing(id);
    await (supabase.from("transactions") as any)
      .update({ status:"rejected", updated_at: new Date().toISOString() })
      .eq("id", id);
    await load();
    setActing(null);
  }

  const cards = [
    { label:"Pending Approval", value:pendingCount, icon:Clock,        color:"#fbbf24", bg:"rgba(251,191,36,0.1)" },
    { label:"Transaksi Hari Ini",value:todayCount,  icon:CheckCircle,  color:"#34d399", bg:"rgba(52,211,153,0.1)" },
    { label:"Total Member",      value:memberCount, icon:Users,        color:"#60a5fa", bg:"rgba(96,165,250,0.1)" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Admin Dashboard</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>
            Selamat datang, {user?.name}. Pantau aktivitas harian di sini.
          </p>
        </div>
        <button onClick={load}
          style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:14, height:14 }} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:16 }}>
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={c.label}
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}
              style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"20px 22px" }}
            >
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".05em", margin:0 }}>{c.label}</p>
                <div style={{ background:c.bg, borderRadius:8, padding:8 }}>
                  <Icon style={{ width:16, height:16, color:c.color }} />
                </div>
              </div>
              <p style={{ color:"#fff", fontSize:"1.8rem", fontWeight:800, margin:0, lineHeight:1 }}>
                {loading ? "â€”" : c.value.toLocaleString("id-ID")}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Pending Transactions */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.25 }}
        style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, overflow:"hidden" }}>
        <div style={{ padding:"18px 22px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <h2 style={{ color:"#fff", fontWeight:700, fontSize:"1rem", margin:0 }}>Permintaan Menunggu Approval</h2>
          <Link href="/dashboard/admin/transaksi"
            style={{ color:"#D4AF37", fontSize:".8rem", textDecoration:"none" }}>
            Lihat Semua â†’
          </Link>
        </div>

        {loading ? (
          <p style={{ padding:"32px", textAlign:"center", color:"rgba(255,255,255,0.3)" }}>Memuat...</p>
        ) : pending.length === 0 ? (
          <p style={{ padding:"32px", textAlign:"center", color:"rgba(255,255,255,0.3)" }}>Tidak ada transaksi pending.</p>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  {["Member","Jenis","Gram","Jumlah","Tanggal","Aksi"].map(h => (
                    <th key={h} style={{ padding:"12px 18px", textAlign:"left", color:"rgba(255,255,255,0.3)", fontSize:".75rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".05em", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pending.map(tx => (
                  <tr key={tx.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.02)"}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}
                  >
                    <td style={{ padding:"13px 18px", color:"#fff", fontSize:".88rem", fontWeight:600 }}>
                      {(tx.profiles as any)?.name || "â€”"}
                    </td>
                    <td style={{ padding:"13px 18px", color:"rgba(255,255,255,0.6)", fontSize:".85rem" }}>
                      {TYPE_LABEL[tx.type] || tx.type}
                    </td>
                    <td style={{ padding:"13px 18px", color:"#D4AF37", fontSize:".85rem" }}>
                      {tx.gram ? tx.gram + " gr" : "â€”"}
                    </td>
                    <td style={{ padding:"13px 18px", color:"#D4AF37", fontWeight:600, fontSize:".85rem" }}>
                      {fmt(tx.amount)}
                    </td>
                    <td style={{ padding:"13px 18px", color:"rgba(255,255,255,0.4)", fontSize:".8rem", whiteSpace:"nowrap" }}>
                      {fmtDate(tx.created_at)}
                    </td>
                    <td style={{ padding:"13px 18px" }}>
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={() => approve(tx.id)} disabled={acting===tx.id}
                          style={{ background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.25)", borderRadius:8, padding:"5px 12px", color:"#34d399", cursor:"pointer", fontSize:".78rem", fontWeight:600, opacity:acting===tx.id?.6:1 }}>
                          Setujui
                        </button>
                        <button onClick={() => reject(tx.id)} disabled={acting===tx.id}
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
        )}
      </motion.div>
    </div>
  );
}


