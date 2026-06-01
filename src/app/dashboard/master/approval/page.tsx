"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Check, X, Coins, Landmark, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });

const TX_TYPE_LABEL: Record<string,string> = {
  buy:"Beli Emas", buyback:"Buyback", cicilan:"Cicilan", tabungan:"Tabungan", transfer:"Transfer", referral_bonus:"Bonus Referral",
};
const SIM_LABEL: Record<string,string> = { pokok:"Simpanan Pokok", wajib:"Simpanan Wajib", sukarela:"Simpanan Sukarela" };

type Tab = "transaksi" | "simpanan" | "gadai";

export default function ApprovalPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("transaksi");
  const [txs, setTxs]       = useState<any[]>([]);
  const [sims, setSims]     = useState<any[]>([]);
  const [gadais, setGadais] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [txRes, simRes, gadaiRes] = await Promise.all([
        (supabase.from("transactions") as any)
          .select("id, user_id, type, amount, gram, payment_method, created_at, profiles(name)")
          .eq("status","pending").order("created_at",{ascending:false}),
        (supabase.from("simpanan") as any)
          .select("id, user_id, type, amount, description, created_at, profiles(name)")
          .eq("status","pending").order("created_at",{ascending:false}),
        (supabase.from("gadai") as any)
          .select("id, user_id, dana_cair, sisa_tagihan, tenor, angsuran_per_bulan, gram_setara, keterangan, created_at, profiles(name)")
          .eq("status","pengajuan").order("created_at",{ascending:false}),
      ]);
      setTxs(txRes.data || []);
      setSims(simRes.data || []);
      setGadais(gadaiRes.data || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function notify(userId: string, title: string, body: string, link: string) {
    try {
      await (supabase.from("notifications") as any).insert({ user_id:userId, title, body, type:"approval", is_read:false, link });
    } catch {}
  }

  // ── Transaksi ──
  async function actTx(row: any, approve: boolean) {
    setActing(row.id);
    await (supabase.from("transactions") as any)
      .update({ status: approve ? "completed" : "rejected", updated_at: new Date().toISOString() })
      .eq("id", row.id);
    await notify(row.user_id, approve ? "Transaksi Disetujui" : "Transaksi Ditolak",
      `${TX_TYPE_LABEL[row.type]||row.type} ${fmt(row.amount)} telah ${approve?"disetujui":"ditolak"}.`,
      "/dashboard/member/histori");
    await load(); setActing(null);
  }

  // ── Simpanan ──
  async function actSim(row: any, approve: boolean) {
    setActing(row.id);
    await (supabase.from("simpanan") as any)
      .update({ status: approve ? "completed" : "rejected", verified_by: user?.id })
      .eq("id", row.id);
    await notify(row.user_id, approve ? "Simpanan Diverifikasi" : "Simpanan Ditolak",
      `${SIM_LABEL[row.type]||row.type} ${fmt(row.amount)} telah ${approve?"diverifikasi":"ditolak"}.`,
      "/dashboard/member/simpanan");
    await load(); setActing(null);
  }

  // ── Gadai ──
  async function actGadai(row: any, approve: boolean) {
    setActing(row.id);
    await (supabase.from("gadai") as any)
      .update({
        status: approve ? "aktif" : "ditolak",
        verified_by: user?.id,
        ...(approve ? { tanggal_cair: new Date().toISOString() } : {}),
      })
      .eq("id", row.id);
    await notify(row.user_id, approve ? "Gadai Disetujui" : "Gadai Ditolak",
      `Pengajuan gadai ${fmt(row.dana_cair)} telah ${approve?"disetujui & dana dicairkan":"ditolak"}.`,
      "/dashboard/member/gadai");
    await load(); setActing(null);
  }

  const TABS: { id: Tab; label: string; count: number; icon: any; color: string }[] = [
    { id:"transaksi", label:"Transaksi", count:txs.length,    icon:Coins,    color:"#D4AF37" },
    { id:"simpanan",  label:"Simpanan",  count:sims.length,   icon:Wallet,   color:"#a78bfa" },
    { id:"gadai",     label:"Gadai",     count:gadais.length, icon:Landmark, color:"#60a5fa" },
  ];

  function ActionBtns({ onApprove, onReject, id }: { onApprove: () => void; onReject: () => void; id: string }) {
    return (
      <div style={{ display:"flex", gap:6 }}>
        <button onClick={onApprove} disabled={acting===id}
          style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.3)", borderRadius:8, padding:"6px 12px", color:"#34d399", cursor:"pointer", fontSize:".78rem", fontWeight:600, opacity:acting===id?.6:1 }}>
          <Check style={{ width:12, height:12 }} /> Setujui
        </button>
        <button onClick={onReject} disabled={acting===id}
          style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:8, padding:"6px 12px", color:"#f87171", cursor:"pointer", fontSize:".78rem", fontWeight:600, opacity:acting===id?.6:1 }}>
          <X style={{ width:12, height:12 }} /> Tolak
        </button>
      </div>
    );
  }

  const card = (children: React.ReactNode, key: string) => (
    <div key={key} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:14, flexWrap:"wrap" }}>
      {children}
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Pusat Approval</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Tinjau & setujui transaksi, simpanan, dan gadai</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:14, height:14 }} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 18px", borderRadius:10, fontSize:".88rem", fontWeight:600, cursor:"pointer",
                border: active ? `1px solid ${t.color}` : "1px solid rgba(255,255,255,0.1)",
                background: active ? `${t.color}22` : "rgba(255,255,255,0.03)",
                color: active ? t.color : "rgba(255,255,255,0.5)" }}>
              <Icon style={{ width:15, height:15 }} /> {t.label}
              {t.count > 0 && (
                <span style={{ background:`${t.color}33`, color:t.color, borderRadius:20, padding:"1px 8px", fontSize:".72rem" }}>{t.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p style={{ color:"rgba(255,255,255,0.3)" }}>Memuat...</p>
      ) : (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:"flex", flexDirection:"column", gap:10 }}>

          {/* TRANSAKSI */}
          {tab === "transaksi" && (txs.length === 0
            ? <p style={{ color:"rgba(255,255,255,0.3)", padding:"32px", textAlign:"center" }}>Tidak ada transaksi pending.</p>
            : txs.map(row => card(
                <>
                  <div>
                    <p style={{ color:"#fff", fontWeight:700, fontSize:".9rem", margin:0 }}>
                      {(row.profiles as any)?.name || "—"}
                      <span style={{ color:"rgba(255,255,255,0.4)", fontWeight:400 }}> · {TX_TYPE_LABEL[row.type]||row.type}</span>
                    </p>
                    <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem", margin:"3px 0 0" }}>
                      {row.gram ? `${Number(row.gram).toFixed(2)} gr · ` : ""}{row.payment_method || "—"} · {fmtDate(row.created_at)}
                    </p>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                    <span style={{ color:"#D4AF37", fontWeight:800, fontSize:"1rem" }}>{fmt(row.amount)}</span>
                    <ActionBtns id={row.id} onApprove={()=>actTx(row,true)} onReject={()=>actTx(row,false)} />
                  </div>
                </>, row.id))
          )}

          {/* SIMPANAN */}
          {tab === "simpanan" && (sims.length === 0
            ? <p style={{ color:"rgba(255,255,255,0.3)", padding:"32px", textAlign:"center" }}>Tidak ada simpanan pending.</p>
            : sims.map(row => card(
                <>
                  <div>
                    <p style={{ color:"#fff", fontWeight:700, fontSize:".9rem", margin:0 }}>
                      {(row.profiles as any)?.name || "—"}
                      <span style={{ color:"rgba(255,255,255,0.4)", fontWeight:400 }}> · {SIM_LABEL[row.type]||row.type}</span>
                    </p>
                    <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem", margin:"3px 0 0" }}>
                      {row.description || "—"} · {fmtDate(row.created_at)}
                    </p>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                    <span style={{ color:"#a78bfa", fontWeight:800, fontSize:"1rem" }}>{fmt(row.amount)}</span>
                    <ActionBtns id={row.id} onApprove={()=>actSim(row,true)} onReject={()=>actSim(row,false)} />
                  </div>
                </>, row.id))
          )}

          {/* GADAI */}
          {tab === "gadai" && (gadais.length === 0
            ? <p style={{ color:"rgba(255,255,255,0.3)", padding:"32px", textAlign:"center" }}>Tidak ada pengajuan gadai.</p>
            : gadais.map(row => card(
                <>
                  <div>
                    <p style={{ color:"#fff", fontWeight:700, fontSize:".9rem", margin:0 }}>
                      {(row.profiles as any)?.name || "—"}
                      <span style={{ color:"rgba(255,255,255,0.4)", fontWeight:400 }}> · Gadai {row.tenor} bln</span>
                    </p>
                    <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem", margin:"3px 0 0" }}>
                      Jaminan {Number(row.gram_setara).toFixed(4)} gr · Angsuran {fmt(row.angsuran_per_bulan)}/bln · {fmtDate(row.created_at)}
                    </p>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                    <span style={{ color:"#60a5fa", fontWeight:800, fontSize:"1rem" }}>{fmt(row.dana_cair)}</span>
                    <ActionBtns id={row.id} onApprove={()=>actGadai(row,true)} onReject={()=>actGadai(row,false)} />
                  </div>
                </>, row.id))
          )}
        </motion.div>
      )}
    </div>
  );
}
