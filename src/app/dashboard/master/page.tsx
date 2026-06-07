"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Users, ShieldCheck, Clock, TrendingUp, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Stats {
  totalMember: number;
  totalAdmin: number;
  pendingTx: number;
  todayTx: number;
}

interface TxRow {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
  profiles: { name: string } | null;
}

const STATUS_COLOR: Record<string, string> = {
  pending:    "rgba(251,191,36,0.15)",
  processing: "rgba(96,165,250,0.15)",
  completed:  "rgba(52,211,153,0.15)",
  rejected:   "rgba(248,113,113,0.15)",
};
const STATUS_TEXT: Record<string, string> = {
  pending:    "#fbbf24",
  processing: "#60a5fa",
  completed:  "#34d399",
  rejected:   "#f87171",
};
const TYPE_LABEL: Record<string, string> = {
  buy: "Beli Emas", buyback: "Buyback", cicilan: "Cicilan",
  Simpanan: "Simpanan", transfer: "Transfer", referral_bonus: "Bonus Referral",
};

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" });
}

export default function MasterDashboardPage() {
  const [stats, setStats]   = useState<Stats>({ totalMember:0, totalAdmin:0, pendingTx:0, todayTx:0 });
  const [txList, setTxList] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [memberRes, adminRes, pendingRes, todayRes, txRes] = await Promise.all([
        (supabase.from("profiles") as any).select("id", { count:"exact", head:true }).eq("role","member"),
        (supabase.from("profiles") as any).select("id", { count:"exact", head:true }).eq("role","admin"),
        (supabase.from("transactions") as any).select("id", { count:"exact", head:true }).eq("status","pending"),
        (supabase.from("transactions") as any).select("id", { count:"exact", head:true })
          .gte("created_at", new Date().toISOString().slice(0,10)),
        (supabase.from("transactions") as any)
          .select("id,type,amount,status,created_at,profiles:profiles!user_id(name)")
          .order("created_at", { ascending:false })
          .limit(10),
      ]);

      setStats({
        totalMember: memberRes.count ?? 0,
        totalAdmin:  adminRes.count  ?? 0,
        pendingTx:   pendingRes.count ?? 0,
        todayTx:     todayRes.count  ?? 0,
      });
      setTxList(txRes.data ?? []);
    } catch {
      // graceful fallback
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const cards = [
    { label:"Total Member",          value:stats.totalMember, icon:Users,      color:"#34d399", bg:"rgba(52,211,153,0.1)" },
    { label:"Total Admin",           value:stats.totalAdmin,  icon:ShieldCheck, color:"#60a5fa", bg:"rgba(96,165,250,0.1)" },
    { label:"Transaksi Pending",     value:stats.pendingTx,   icon:Clock,       color:"#fbbf24", bg:"rgba(251,191,36,0.1)" },
    { label:"Transaksi Hari Ini",    value:stats.todayTx,     icon:TrendingUp,  color:"#D4AF37", bg:"rgba(212,175,55,0.1)" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Master Dashboard</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>
            Selamat datang, pantau seluruh aktivitas koperasi di sini.
          </p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button
            onClick={load}
            style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}
          >
            <RefreshCw style={{ width:14, height:14 }} /> Refresh
          </button>
          <Link href="/dashboard/master/admin"
            style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.15)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", textDecoration:"none", fontSize:".85rem", fontWeight:600 }}>
            + Daftar Admin
          </Link>
          <Link href="/dashboard/master/member"
            style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.25)", borderRadius:10, padding:"8px 14px", color:"#34d399", textDecoration:"none", fontSize:".85rem", fontWeight:600 }}>
            + Daftar Member
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16 }}>
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div key={c.label}
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}
              style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"20px 22px" }}
            >
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".05em", margin:0 }}>{c.label}</p>
                <div style={{ background:c.bg, borderRadius:8, padding:8 }}>
                  <Icon style={{ width:16, height:16, color:c.color }} />
                </div>
              </div>
              <p style={{ color:"#fff", fontSize:"1.8rem", fontWeight:800, margin:0, lineHeight:1 }}>
                {loading ? "—" : c.value.toLocaleString("id-ID")}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Transactions Table */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
        style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, overflow:"hidden" }}
      >
        <div style={{ padding:"18px 22px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <h2 style={{ color:"#fff", fontWeight:700, fontSize:"1rem", margin:0 }}>Transaksi Terkini</h2>
          <Link href="/dashboard/master/approval" style={{ color:"#D4AF37", fontSize:".8rem", textDecoration:"none" }}>
            Lihat Semua →
          </Link>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                {["Member","Jenis","Jumlah","Status","Tanggal"].map(h => (
                  <th key={h} style={{ padding:"12px 18px", textAlign:"left", color:"rgba(255,255,255,0.3)", fontSize:".75rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".05em", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding:"40px", textAlign:"center", color:"rgba(255,255,255,0.3)" }}>Memuat...</td></tr>
              ) : txList.length === 0 ? (
                <tr><td colSpan={5} style={{ padding:"40px", textAlign:"center", color:"rgba(255,255,255,0.3)" }}>Belum ada transaksi.</td></tr>
              ) : txList.map(tx => (
                <tr key={tx.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.02)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="transparent"}
                >
                  <td style={{ padding:"13px 18px", color:"#fff", fontSize:".85rem" }}>
                    {(tx.profiles as any)?.name || "—"}
                  </td>
                  <td style={{ padding:"13px 18px", color:"rgba(255,255,255,0.65)", fontSize:".85rem" }}>
                    {TYPE_LABEL[tx.type] || tx.type}
                  </td>
                  <td style={{ padding:"13px 18px", color:"#D4AF37", fontSize:".85rem", fontWeight:600 }}>
                    {fmt(tx.amount)}
                  </td>
                  <td style={{ padding:"13px 18px" }}>
                    <span style={{ background:STATUS_COLOR[tx.status]||"rgba(255,255,255,0.08)", color:STATUS_TEXT[tx.status]||"#fff", borderRadius:6, padding:"3px 10px", fontSize:".75rem", fontWeight:600, textTransform:"capitalize" }}>
                      {tx.status}
                    </span>
                  </td>
                  <td style={{ padding:"13px 18px", color:"rgba(255,255,255,0.45)", fontSize:".82rem", whiteSpace:"nowrap" }}>
                    {fmtDate(tx.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}


