"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Check, X, Coins, Landmark, Wallet, CreditCard, Truck, Tag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

const fmtRibuan = (v: string | number) => {
  const d = String(v ?? "").replace(/\D/g, "");
  return d ? new Intl.NumberFormat("id-ID").format(Number(d)) : "";
};
const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });

const TX_TYPE_LABEL: Record<string,string> = {
  buy:"Beli Emas", buyback:"Buyback", cicilan:"Cicilan", tabungan:"Simpanan", transfer:"Transfer", referral_bonus:"Bonus Referral",
};
const SIM_LABEL: Record<string,string> = { pokok:"Simpanan Pokok", wajib:"Simpanan Wajib", sukarela:"Simpanan Sukarela" };

type Tab = "all" | "beli" | "cicilan" | "gadai" | "buyback" | "simpanan";

export default function ApprovalPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<Tab>("all");
  const [txs, setTxs]       = useState<any[]>([]);
  const [sims, setSims]     = useState<any[]>([]);
  const [gadais, setGadais] = useState<any[]>([]);
  const [cics, setCics]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState("");

  // Modal ongkir/diskon -- hanya untuk approve "beli emas" (type=buy)
  const [ongkirModal, setOngkirModal] = useState<{ row: any } | null>(null);
  const [ongkir, setOngkir]   = useState("");
  const [diskon, setDiskon]   = useState("");
  const [savingOngkir, setSavingOngkir] = useState(false);

  // Derived per-type dari txs
  const beliRows    = txs.filter(r => r.type === "buy");
  const buybackRows = txs.filter(r => r.type === "buyback");
  const otherTxRows = txs.filter(r => r.type !== "buy" && r.type !== "buyback");

  async function load() {
    setLoading(true); setLoadErr("");
    const [txRes, simRes, gadaiRes, cicRes] = await Promise.all([
      (supabase.from("transactions") as any)
        .select("id, user_id, type, amount, gram, payment_method, created_at, transaction_date, profiles:profiles!user_id(name)")
        .in("status",["pending","processing"]).order("created_at",{ascending:false}),
      (supabase.from("simpanan") as any)
        .select("id, user_id, type, amount, description, created_at, transaction_date, profiles:profiles!user_id(name)")
        .eq("status","pending").order("created_at",{ascending:false}),
      (supabase.from("gadai") as any)
        .select("id, user_id, dana_cair, sisa_tagihan, tenor, angsuran_per_bulan, gram_setara, keterangan, created_at, transaction_date, profiles:profiles!user_id(name)")
        .eq("status","pengajuan").order("created_at",{ascending:false}),
      (supabase.from("installments") as any)
        .select("id, user_id, product_name, total_amount, monthly_amount, tenor, created_at, transaction_date, profiles:profiles!user_id(name)")
        .eq("status","pending").order("created_at",{ascending:false}),
    ]);
    const errs = [txRes.error, simRes.error, gadaiRes.error, cicRes.error].filter(Boolean);
    if (errs.length) setLoadErr(errs.map((e:any) => e.message).join(" | "));
    setTxs(txRes.data || []);
    setSims(simRes.data || []);
    setGadais(gadaiRes.data || []);
    setCics(cicRes.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function notify(userId: string, title: string, body: string, link: string) {
    try {
      await (supabase.from("notifications") as any).insert({ user_id:userId, title, body, type:"approval", is_read:false, link });
    } catch {}
  }

  // Transaksi (buyback, tabungan, dll -- bukan buy)
  async function actTx(row: any, approve: boolean) {
    if (approve && row.type === "buy") {
      setOngkir(""); setDiskon("");
      setOngkirModal({ row });
      return;
    }
    setActing(row.id);
    await (supabase.from("transactions") as any)
      .update({ status: approve ? "completed" : "rejected", updated_at: new Date().toISOString() })
      .eq("id", row.id);
    await notify(row.user_id, approve ? "Transaksi Disetujui" : "Transaksi Ditolak",
      `${TX_TYPE_LABEL[row.type]||row.type} ${fmt(row.amount)} telah ${approve?"disetujui":"ditolak"}.`,
      "/dashboard/member/histori");
    await load(); setActing(null);
  }

  // Konfirmasi approve beli emas dengan ongkir & diskon
  async function confirmBuyApproval() {
    if (!ongkirModal) return;
    const row = ongkirModal.row;
    const ongkirVal = Number(ongkir) || 0;
    const diskonVal = Number(diskon) || 0;
    const finalAmount = Math.max(0, row.amount + ongkirVal - diskonVal);
    setSavingOngkir(true);
    await (supabase.from("transactions") as any)
      .update({
        status:     "completed",
        amount:     finalAmount,
        notes:      `Disetujui. Ongkir: ${fmt(ongkirVal)}, Diskon: ${fmt(diskonVal)}. Total final: ${fmt(finalAmount)}.`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    await notify(row.user_id, "Beli Emas Disetujui",
      `Beli Emas ${fmt(row.amount)} -> total ${fmt(finalAmount)} (ongkir ${fmt(ongkirVal)}, diskon ${fmt(diskonVal)}) telah disetujui.`,
      "/dashboard/member/histori");
    setSavingOngkir(false);
    setOngkirModal(null);
    await load();
  }

  // Simpanan
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

  // Gadai
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

  // Cicilan
  async function actCicilan(row: any, approve: boolean) {
    setActing(row.id);
    const due = new Date(); due.setMonth(due.getMonth() + 1);
    await (supabase.from("installments") as any)
      .update(approve ? { status:"active", next_due_date: due.toISOString().slice(0,10) } : { status:"ditolak" })
      .eq("id", row.id);
    await notify(row.user_id, approve ? "Cicilan Disetujui" : "Cicilan Ditolak",
      `Pengajuan cicilan ${row.product_name} ${fmt(row.total_amount)} telah ${approve?"disetujui":"ditolak"}.`,
      "/dashboard/member/cicilan");
    await load(); setActing(null);
  }

  const TABS: { id: Tab; label: string; count: number; icon: any; color: string }[] = [
    { id:"all",      label:"Semua",        count: txs.length + sims.length + gadais.length + cics.length, icon:Coins,      color:"#fff" },
    { id:"beli",     label:"Beli Emas",    count: beliRows.length,    icon:Coins,      color:"#D4AF37" },
    { id:"cicilan",  label:"Cicilan Emas", count: cics.length,         icon:CreditCard, color:"#a78bfa" },
    { id:"gadai",    label:"Gadai",        count: gadais.length,       icon:Landmark,   color:"#60a5fa" },
    { id:"buyback",  label:"Buyback",      count: buybackRows.length,  icon:Coins,      color:"#34d399" },
    { id:"simpanan", label:"Simpanan",     count: sims.length,         icon:Wallet,     color:"#f59e0b" },
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

  // Row builders
  const txRow = (row: any, color: string) => card(<>
    <div>
      <p style={{ color:"#fff", fontWeight:700, fontSize:".9rem", margin:0 }}>
        {row.profiles?.name || "-"}
        <span style={{ color:"rgba(255,255,255,0.4)", fontWeight:400 }}> - {TX_TYPE_LABEL[row.type]||row.type}</span>
      </p>
      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem", margin:"3px 0 0" }}>
        {row.gram ? `${Number(row.gram).toFixed(1)} gr - ` : ""}{row.payment_method || "-"} - {fmtDate(row.transaction_date || row.created_at)}
      </p>
    </div>
    <div style={{ display:"flex", alignItems:"center", gap:16 }}>
      <span style={{ color, fontWeight:800, fontSize:"1rem" }}>{fmt(row.amount)}</span>
      <ActionBtns id={row.id} onApprove={()=>actTx(row,true)} onReject={()=>actTx(row,false)} />
    </div>
  </>, row.id);

  const simRow = (row: any) => card(<>
    <div>
      <p style={{ color:"#fff", fontWeight:700, fontSize:".9rem", margin:0 }}>
        {row.profiles?.name || "-"}
        <span style={{ color:"rgba(255,255,255,0.4)", fontWeight:400 }}> - {SIM_LABEL[row.type]||row.type}</span>
      </p>
      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem", margin:"3px 0 0" }}>
        {row.description || "-"} - {fmtDate(row.transaction_date || row.created_at)}
      </p>
    </div>
    <div style={{ display:"flex", alignItems:"center", gap:16 }}>
      <span style={{ color:"#f59e0b", fontWeight:800, fontSize:"1rem" }}>{fmt(row.amount)}</span>
      <ActionBtns id={row.id} onApprove={()=>actSim(row,true)} onReject={()=>actSim(row,false)} />
    </div>
  </>, row.id);

  const cicRow = (row: any) => card(<>
    <div>
      <p style={{ color:"#fff", fontWeight:700, fontSize:".9rem", margin:0 }}>
        {row.profiles?.name || "-"}
        <span style={{ color:"rgba(255,255,255,0.4)", fontWeight:400 }}> - {row.product_name}</span>
      </p>
      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem", margin:"3px 0 0" }}>
        {row.tenor} bln - angsuran {fmt(row.monthly_amount)} - {fmtDate(row.transaction_date || row.created_at)}
      </p>
    </div>
    <div style={{ display:"flex", alignItems:"center", gap:16 }}>
      <span style={{ color:"#a78bfa", fontWeight:800, fontSize:"1rem" }}>{fmt(row.total_amount)}</span>
      <ActionBtns id={row.id} onApprove={()=>actCicilan(row,true)} onReject={()=>actCicilan(row,false)} />
    </div>
  </>, row.id);

  const gadaiRow = (row: any) => card(<>
    <div>
      <p style={{ color:"#fff", fontWeight:700, fontSize:".9rem", margin:0 }}>
        {row.profiles?.name || "-"}
        <span style={{ color:"rgba(255,255,255,0.4)", fontWeight:400 }}> - Gadai {row.tenor} bln</span>
      </p>
      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem", margin:"3px 0 0" }}>
        Jaminan {Number(row.gram_setara).toFixed(1)} gr - Angsuran {fmt(row.angsuran_per_bulan)}/bln - {fmtDate(row.transaction_date || row.created_at)}
      </p>
    </div>
    <div style={{ display:"flex", alignItems:"center", gap:16 }}>
      <span style={{ color:"#60a5fa", fontWeight:800, fontSize:"1rem" }}>{fmt(row.dana_cair)}</span>
      <ActionBtns id={row.id} onApprove={()=>actGadai(row,true)} onReject={()=>actGadai(row,false)} />
    </div>
  </>, row.id);

  const secHeader = (label: string, count: number) => (
    <p key={label} style={{ color:"rgba(255,255,255,0.3)", fontSize:".7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", margin:"12px 0 4px" }}>
      {label} ({count})
    </p>
  );

  const emptyMsg = (msg: string) => (
    <p style={{ color:"rgba(255,255,255,0.3)", padding:"32px", textAlign:"center" }}>{msg}</p>
  );

  function renderContent() {
    if (tab === "all") {
      const total = beliRows.length + buybackRows.length + otherTxRows.length + cics.length + gadais.length + sims.length;
      if (total === 0) return emptyMsg("Tidak ada item yang menunggu persetujuan.");
      return <>
        {beliRows.length > 0    && <>{secHeader("Beli Emas", beliRows.length)}{beliRows.map(r=>txRow(r,"#D4AF37"))}</>}
        {cics.length > 0        && <>{secHeader("Cicilan Emas", cics.length)}{cics.map(cicRow)}</>}
        {gadais.length > 0      && <>{secHeader("Gadai", gadais.length)}{gadais.map(gadaiRow)}</>}
        {buybackRows.length > 0 && <>{secHeader("Buyback", buybackRows.length)}{buybackRows.map(r=>txRow(r,"#34d399"))}</>}
        {sims.length > 0        && <>{secHeader("Simpanan", sims.length)}{sims.map(simRow)}</>}
        {otherTxRows.length > 0 && <>{secHeader("Lainnya", otherTxRows.length)}{otherTxRows.map(r=>txRow(r,"#fff"))}</>}
      </>;
    }
    if (tab === "beli")     return beliRows.length    === 0 ? emptyMsg("Tidak ada permintaan Beli Emas.") : beliRows.map(r=>txRow(r,"#D4AF37"));
    if (tab === "cicilan")  return cics.length        === 0 ? emptyMsg("Tidak ada pengajuan Cicilan Emas.") : cics.map(cicRow);
    if (tab === "gadai")    return gadais.length      === 0 ? emptyMsg("Tidak ada pengajuan Gadai.") : gadais.map(gadaiRow);
    if (tab === "buyback")  return buybackRows.length === 0 ? emptyMsg("Tidak ada permintaan Buyback.") : buybackRows.map(r=>txRow(r,"#34d399"));
    if (tab === "simpanan") return sims.length        === 0 ? emptyMsg("Tidak ada setoran Simpanan pending.") : sims.map(simRow);
    return null;
  }

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
              style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 16px", borderRadius:10, fontSize:".84rem", fontWeight:600, cursor:"pointer",
                border: active ? `1px solid ${t.color}` : "1px solid rgba(255,255,255,0.1)",
                background: active ? `${t.color}22` : "rgba(255,255,255,0.03)",
                color: active ? t.color : "rgba(255,255,255,0.5)" }}>
              <Icon style={{ width:14, height:14 }} /> {t.label}
              {t.count > 0 && (
                <span style={{ background:`${t.color}33`, color:t.color, borderRadius:20, padding:"1px 7px", fontSize:".7rem" }}>{t.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {loadErr && (
        <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:12, padding:"12px 16px" }}>
          <p style={{ color:"#f87171", fontWeight:600, fontSize:".85rem", margin:"0 0 4px" }}>Error memuat data approval:</p>
          <p style={{ color:"rgba(248,113,113,0.8)", fontSize:".8rem", margin:0 }}>{loadErr}</p>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".75rem", margin:"6px 0 0" }}>
            Jalankan <strong>supabase/fix-approval-master.sql</strong> di Supabase SQL Editor.
          </p>
        </div>
      )}

      {loading ? (
        <p style={{ color:"rgba(255,255,255,0.3)" }}>Memuat...</p>
      ) : (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {renderContent()}
        </motion.div>
      )}

      {/* Modal Ongkir & Diskon -- hanya untuk Beli Emas */}
      <AnimatePresence>
        {ongkirModal && (() => {
          const row = ongkirModal.row;
          const ongkirVal = Number(ongkir) || 0;
          const diskonVal = Number(diskon) || 0;
          const finalAmount = Math.max(0, row.amount + ongkirVal - diskonVal);
          const inp: React.CSSProperties = {
            width:"100%", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)",
            borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:".95rem", outline:"none", boxSizing:"border-box",
          };
          return (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={()=>!savingOngkir && setOngkirModal(null)}
              style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:2000,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
              <motion.div initial={{ opacity:0, scale:.93, y:16 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:.93 }}
                onClick={e => e.stopPropagation()}
                style={{ width:"min(420px,94vw)", background:"rgba(14,14,14,0.98)", border:"1px solid rgba(212,175,55,0.3)",
                  borderRadius:20, padding:26 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                  <div>
                    <h3 style={{ color:"#D4AF37", fontWeight:800, fontSize:"1.05rem", margin:0 }}>Setujui Beli Emas</h3>
                    <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".8rem", margin:"4px 0 0" }}>
                      {row.profiles?.name || "-"} - Harga emas {fmt(row.amount)}
                    </p>
                  </div>
                  <button onClick={()=>!savingOngkir&&setOngkirModal(null)}
                    style={{ background:"rgba(255,255,255,0.07)", border:"none", borderRadius:8, width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.5)", cursor:"pointer" }}>
                    <X style={{ width:14, height:14 }} />
                  </button>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div>
                    <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"flex", alignItems:"center", gap:6, marginBottom:7 }}>
                      <Truck style={{ width:14, height:14, color:"#f59e0b" }} /> Biaya Ongkir (Rp)
                    </label>
                    <div style={{ position:"relative" }}>
                      <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.4)", fontSize:".85rem", pointerEvents:"none" }}>Rp</span>
                      <input inputMode="numeric" value={fmtRibuan(ongkir)}
                        onChange={e=>setOngkir(e.target.value.replace(/\D/g,""))}
                        style={{ ...inp, paddingLeft:36 }} placeholder="0 (kosong = tanpa ongkir)" />
                    </div>
                  </div>
                  <div>
                    <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"flex", alignItems:"center", gap:6, marginBottom:7 }}>
                      <Tag style={{ width:14, height:14, color:"#34d399" }} /> Diskon (Rp)
                    </label>
                    <div style={{ position:"relative" }}>
                      <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.4)", fontSize:".85rem", pointerEvents:"none" }}>Rp</span>
                      <input inputMode="numeric" value={fmtRibuan(diskon)}
                        onChange={e=>setDiskon(e.target.value.replace(/\D/g,""))}
                        style={{ ...inp, paddingLeft:36 }} placeholder="0 (kosong = tanpa diskon)" />
                    </div>
                  </div>
                  <div style={{ background:"rgba(212,175,55,0.07)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:12, padding:"14px 16px" }}>
                    {[
                      { label:"Harga Emas",  val:fmt(row.amount),       color:"#fff" },
                      { label:"+ Ongkir",    val:`+${fmt(ongkirVal)}`,  color:ongkirVal>0?"#f59e0b":"rgba(255,255,255,0.3)" },
                      { label:"- Diskon",    val:`-${fmt(diskonVal)}`,  color:diskonVal>0?"#34d399":"rgba(255,255,255,0.3)" },
                    ].map(r=>(
                      <div key={r.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <span style={{ color:"rgba(255,255,255,0.5)", fontSize:".83rem" }}>{r.label}</span>
                        <span style={{ color:r.color, fontWeight:600, fontSize:".83rem" }}>{r.val}</span>
                      </div>
                    ))}
                    <div style={{ display:"flex", justifyContent:"space-between", paddingTop:8, borderTop:"1px solid rgba(255,255,255,0.08)" }}>
                      <span style={{ color:"rgba(255,255,255,0.8)", fontWeight:700 }}>Total Final</span>
                      <span style={{ color:"#D4AF37", fontWeight:900, fontSize:"1.05rem" }}>{fmt(finalAmount)}</span>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:4 }}>
                    <button onClick={()=>!savingOngkir&&setOngkirModal(null)} disabled={savingOngkir}
                      style={{ padding:"11px", borderRadius:10, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.6)", fontWeight:600, fontSize:".9rem", cursor:"pointer" }}>
                      Batal
                    </button>
                    <button onClick={confirmBuyApproval} disabled={savingOngkir}
                      style={{ padding:"11px", borderRadius:10, background:"linear-gradient(135deg,#34d399,#6ee7b7)", border:"none", color:"#0a0a0a", fontWeight:700, fontSize:".9rem", cursor:savingOngkir?"not-allowed":"pointer", opacity:savingOngkir?.7:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                      {savingOngkir ? <><RefreshCw style={{width:14,height:14}}/> Menyetujui...</> : <><Check style={{width:14,height:14}}/> Setujui</>}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
