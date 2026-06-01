"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, RefreshCw, Check, X, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });

const STATUS_COLOR: Record<string,string> = { pending:"#fbbf24", verified:"#34d399", rejected:"#f87171" };
const STATUS_BG: Record<string,string> = { pending:"rgba(251,191,36,0.12)", verified:"rgba(52,211,153,0.12)", rejected:"rgba(248,113,113,0.12)" };

type Tab = "pending" | "riwayat";

export default function AdminPembayaranPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<any[]>([]);
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [p, h] = await Promise.all([
        (supabase.from("payments") as any)
          .select("id, user_id, amount, payment_method, proof_url, status, notes, created_at, profiles:profiles!user_id(name)")
          .eq("status","pending").order("created_at",{ascending:false}),
        (supabase.from("payments") as any)
          .select("id, amount, payment_method, status, created_at, profiles:profiles!user_id(name)")
          .in("status",["verified","rejected"]).order("created_at",{ascending:false}).limit(100),
      ]);
      setPending(p.data || []);
      setRiwayat(h.data || []);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function act(row: any, verify: boolean) {
    setActing(row.id);
    await (supabase.from("payments") as any)
      .update({ status: verify ? "verified" : "rejected", verified_by: user?.id }).eq("id", row.id);
    try {
      await (supabase.from("notifications") as any).insert({
        user_id: row.user_id, title: verify ? "Pembayaran Terverifikasi" : "Pembayaran Ditolak",
        body: `Pembayaran ${fmt(row.amount)} telah ${verify?"diverifikasi":"ditolak"}.`,
        type:"pembayaran", is_read:false, link:"/dashboard/member/histori",
      });
    } catch {}
    await load(); setActing(null);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Verifikasi Pembayaran</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Tinjau bukti pembayaran dari anggota</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      <div style={{ display:"flex", gap:8 }}>
        {(["pending","riwayat"] as Tab[]).map(t => (
          <button key={t} onClick={()=>setTab(t)}
            style={{ padding:"8px 18px", borderRadius:10, fontSize:".88rem", fontWeight:600, cursor:"pointer",
              border: tab===t ? "1px solid rgba(212,175,55,0.4)" : "1px solid rgba(255,255,255,0.1)",
              background: tab===t ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)",
              color: tab===t ? "#D4AF37" : "rgba(255,255,255,0.5)" }}>
            {t==="pending" ? `Menunggu${pending.length?` (${pending.length})`:""}` : "Riwayat"}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color:"rgba(255,255,255,0.3)" }}>Memuat...</p> : tab === "pending" ? (
        pending.length === 0 ? (
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:"48px", textAlign:"center" }}>
            <CreditCard style={{ width:38, height:38, color:"rgba(255,255,255,0.15)", margin:"0 auto 12px" }} />
            <p style={{ color:"rgba(255,255,255,0.4)", margin:0 }}>Tidak ada pembayaran menunggu verifikasi.</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {pending.map((p,i)=>(
              <motion.div key={p.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.04 }}
                style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:14, flexWrap:"wrap" }}>
                <div>
                  <p style={{ color:"#fff", fontWeight:700, fontSize:".9rem", margin:0 }}>{p.profiles?.name||"—"}</p>
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".76rem", margin:"2px 0 0" }}>
                    {p.payment_method||"—"} · {fmtDate(p.created_at)}
                    {p.proof_url && <> · <a href={p.proof_url} target="_blank" rel="noopener noreferrer" style={{ color:"#60a5fa", textDecoration:"none" }}>Lihat Bukti <ExternalLink style={{ width:10, height:10, display:"inline" }} /></a></>}
                  </p>
                  {p.notes && <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".75rem", margin:"4px 0 0" }}>{p.notes}</p>}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ color:"#D4AF37", fontWeight:800 }}>{fmt(p.amount)}</span>
                  <button onClick={()=>act(p,true)} disabled={acting===p.id}
                    style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.3)", borderRadius:8, padding:"6px 12px", color:"#34d399", cursor:"pointer", fontSize:".78rem", fontWeight:600, opacity:acting===p.id?.6:1 }}>
                    <Check style={{ width:12, height:12 }} /> Verifikasi
                  </button>
                  <button onClick={()=>act(p,false)} disabled={acting===p.id}
                    style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:8, padding:"6px 12px", color:"#f87171", cursor:"pointer", fontSize:".78rem", fontWeight:600, opacity:acting===p.id?.6:1 }}>
                    <X style={{ width:12, height:12 }} /> Tolak
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        riwayat.length === 0 ? <p style={{ color:"rgba(255,255,255,0.3)", padding:"24px", textAlign:"center" }}>Belum ada riwayat.</p> : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {riwayat.map(p=>(
              <div key={p.id} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                <span style={{ color:"#fff", fontSize:".86rem", fontWeight:600 }}>{p.profiles?.name||"—"}</span>
                <span style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem" }}>{p.payment_method||"—"} · {fmtDate(p.created_at)}</span>
                <span style={{ color:"#D4AF37", fontWeight:700, fontSize:".85rem" }}>{fmt(p.amount)}</span>
                <span style={{ background:STATUS_BG[p.status], color:STATUS_COLOR[p.status], borderRadius:6, padding:"3px 10px", fontSize:".74rem", fontWeight:600, textTransform:"capitalize" }}>{p.status}</span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
