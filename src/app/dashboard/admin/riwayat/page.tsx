"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Search, CreditCard, Coins, ArrowDownCircle, Landmark, Wallet, LayoutGrid, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
const fmtDate = (s: string) =>
  new Date(s).toLocaleString("id-ID", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });

// Status badge
const STATUS_COLOR: Record<string,string> = {
  pending:"#fbbf24", processing:"#60a5fa", completed:"#34d399", rejected:"#f87171",
  active:"#34d399", active_installment:"#34d399", overdue:"#f87171", ditolak:"#f87171",
  pengajuan:"#fbbf24", disetujui:"#60a5fa", aktif:"#34d399", lunas:"#a78bfa", gagal_bayar:"#f87171",
};
const STATUS_LABEL: Record<string,string> = {
  pending:"Menunggu", processing:"Diproses", completed:"Selesai", rejected:"Ditolak",
  active:"Aktif", overdue:"Terlambat", ditolak:"Ditolak",
  pengajuan:"Pengajuan", disetujui:"Disetujui", aktif:"Aktif", lunas:"Lunas", gagal_bayar:"Gagal Bayar",
};

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] || "rgba(101,67,14,0.55)";
  return (
    <span style={{ background:`${color}18`, border:`1px solid ${color}40`, color, borderRadius:20, padding:"2px 10px", fontSize:".72rem", fontWeight:700, whiteSpace:"nowrap" }}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

const TX_LABEL: Record<string,string> = { buy:"Beli Emas", buyback:"Buyback", cicilan:"Cicilan", tabungan:"Simpanan", transfer:"Transfer" };
const SIM_LABEL: Record<string,string> = { pokok:"Simpanan Pokok", wajib:"Simpanan Wajib", sukarela:"Simpanan Sukarela", simpanan:"Simpanan", setoran:"Setor Simpanan", tabungan:"Simpanan (lama)" };

type Tab = "all" | "beli" | "cicilan" | "gadai" | "buyback" | "simpanan";

const TABS: { id: Tab; label: string; icon: any; color: string }[] = [
  { id:"all",      label:"Semua",        icon:LayoutGrid,     color:"#2D1B00" },
  { id:"beli",     label:"Beli Emas",    icon:Coins,          color:"#8B6010" },
  { id:"cicilan",  label:"Cicilan Emas", icon:CreditCard,     color:"#a78bfa" },
  { id:"gadai",    label:"Gadai",        icon:Landmark,       color:"#1d4ed8" },
  { id:"buyback",  label:"Buyback",      icon:ArrowDownCircle,color:"#065f46" },
  { id:"simpanan", label:"Simpanan",     icon:Wallet,         color:"#f59e0b" },
];

export default function AdminRiwayatPage() {
  const { user } = useAuthStore();
  const isMaster = user?.role === "master";
  const [tab, setTab]     = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Data per kategori — SEMUA status
  const [beliData, setBeliData]       = useState<any[]>([]);
  const [cicilanData, setCicilanData] = useState<any[]>([]);
  const [gadaiData, setGadaiData]     = useState<any[]>([]);
  const [buybackData, setBuybackData] = useState<any[]>([]);
  const [simpananData, setSimpananData] = useState<any[]>([]);

  async function load() {
    setLoading(true);
    try {
      const [bRes, cRes, gRes, bbRes, sRes, legacyRes] = await Promise.all([
        // Beli Emas — semua status
        (supabase.from("transactions") as any)
          .select("id, user_id, type, amount, gram, status, payment_method, notes, created_at, transaction_date, profiles:profiles!user_id(name)")
          .eq("type","buy").order("created_at",{ascending:false}).limit(500),
        // Cicilan Emas — installments semua status
        (supabase.from("installments") as any)
          .select("id, user_id, product_name, total_amount, monthly_amount, down_payment, tenor, paid_installments, status, created_at, transaction_date, profiles:profiles!user_id(name)")
          .order("created_at",{ascending:false}).limit(500),
        // Gadai — semua status
        (supabase.from("gadai") as any)
          .select("id, user_id, dana_cair, gram_setara, tenor, angsuran_per_bulan, sisa_tagihan, status, created_at, transaction_date, profiles:profiles!user_id(name)")
          .order("created_at",{ascending:false}).limit(500),
        // Buyback — semua status
        (supabase.from("transactions") as any)
          .select("id, user_id, type, amount, gram, status, payment_method, notes, created_at, transaction_date, profiles:profiles!user_id(name)")
          .eq("type","buyback").order("created_at",{ascending:false}).limit(500),
        // Simpanan — semua status
        (supabase.from("simpanan") as any)
          .select("id, user_id, type, amount, status, description, created_at, transaction_date, profiles:profiles!user_id(name)")
          .order("created_at",{ascending:false}).limit(500),
        // Simpanan (lama) — transaksi tabungan lama yang tercatat sebelum dipindah ke tabel simpanan.
        (supabase.from("transactions") as any)
          .select("id, user_id, type, amount, status, notes, created_at, transaction_date, profiles:profiles!user_id(name)")
          .eq("type","tabungan").order("created_at",{ascending:false}).limit(500),
      ]);
      setBeliData(bRes.data || []);
      setCicilanData(cRes.data || []);
      setGadaiData(gRes.data || []);
      setBuybackData(bbRes.data || []);
      const legacyTabungan = (legacyRes.data || []).map((r: any) => ({ ...r, description: r.notes, _table: "transactions" }));
      const merged = [...(sRes.data || []).map((r: any) => ({ ...r, _table: "simpanan" })), ...legacyTabungan]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setSimpananData(merged);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const q = search.toLowerCase();
  const byName = (rows: any[]) => q ? rows.filter(r => (r.profiles?.name||"").toLowerCase().includes(q)) : rows;

  // Hapus data — HANYA master. Verifikasi role juga dilakukan di server.
  async function handleDelete(table: string, id: string, label: string) {
    if (!isMaster) return;
    if (!confirm(`Hapus ${label}? Tindakan ini permanen dan tidak bisa dibatalkan.`)) return;
    setDeleting(id);
    try {
      const res = await fetch("/api/master/delete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, id, requesterId: user?.id }),
      });
      const json = await res.json();
      if (!res.ok || json.error) { alert(json.error || "Gagal menghapus."); }
      else { await load(); }
    } catch { alert("Kesalahan jaringan."); }
    setDeleting(null);
  }

  // Tombol hapus kecil — hanya dirender untuk master.
  function DeleteBtn({ table, id, label }: { table: string; id: string; label: string }) {
    if (!isMaster) return null;
    return (
      <button onClick={() => handleDelete(table, id, label)} disabled={deleting === id} title="Hapus permanen"
        style={{ display:"flex", alignItems:"center", justifyContent:"center", width:30, height:30, borderRadius:8,
          background:"rgba(153,27,27,0.08)", border:"1px solid rgba(248,113,113,0.25)", color:"#991b1b",
          cursor: deleting === id ? "wait" : "pointer", opacity: deleting === id ? .5 : 1, flexShrink:0 }}>
        <Trash2 style={{ width:14, height:14 }} />
      </button>
    );
  }

  // Row components
  function TxRow({ r, color, showGram = true }: { r: any; color: string; showGram?: boolean }) {
    return (
      <motion.div key={r.id} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}>
        <div style={{ background:"rgba(255,255,255,0.72)", border:`1px solid ${color}22`, borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:140 }}>
            <p style={{ color:"#2D1B00", fontWeight:700, fontSize:".88rem", margin:"0 0 2px" }}>
              {r.profiles?.name || "-"}
              <span style={{ color:"rgba(101,67,14,0.45)", fontWeight:400, fontSize:".82rem" }}> - {TX_LABEL[r.type]||r.type}</span>
            </p>
            <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".74rem", margin:0 }}>
              {fmtDate(r.transaction_date || r.created_at)}{r.payment_method ? ` - ${r.payment_method}` : ""}
            </p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            {showGram && r.gram > 0 && <span style={{ color:"rgba(101,67,14,0.55)", fontSize:".78rem" }}>{Number(r.gram).toFixed(1)} gr</span>}
            <span style={{ color, fontWeight:800 }}>{fmt(r.amount)}</span>
            <StatusBadge status={r.status} />
            <DeleteBtn table="transactions" id={r.id} label={`transaksi ${TX_LABEL[r.type]||r.type} - ${r.profiles?.name||"-"}`} />
          </div>
        </div>
      </motion.div>
    );
  }

  function CicilanRow({ r }: { r: any }) {
    const progPct = r.tenor > 0 ? Math.round((r.paid_installments / r.tenor) * 100) : 0;
    return (
      <motion.div key={r.id} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}>
        <div style={{ background:"rgba(255,255,255,0.72)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:12, padding:"12px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap", marginBottom:6 }}>
            <div style={{ flex:1, minWidth:140 }}>
              <p style={{ color:"#2D1B00", fontWeight:700, fontSize:".88rem", margin:"0 0 2px" }}>
                {r.profiles?.name || "-"}
                <span style={{ color:"rgba(101,67,14,0.45)", fontWeight:400, fontSize:".82rem" }}> - {r.product_name}</span>
              </p>
              <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".74rem", margin:0 }}>
                {fmtDate(r.transaction_date || r.created_at)} - Tenor {r.tenor} bln
                {r.down_payment > 0 ? ` - DP ${fmt(r.down_payment)}` : ""}
              </p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <span style={{ color:"#a78bfa", fontWeight:800 }}>{fmt(r.total_amount)}</span>
              <span style={{ color:"rgba(101,67,14,0.55)", fontSize:".78rem" }}>{fmt(r.monthly_amount)}/bln</span>
              <StatusBadge status={r.status} />
              <DeleteBtn table="installments" id={r.id} label={`cicilan ${r.product_name||""} - ${r.profiles?.name||"-"}`} />
            </div>
          </div>
          <div style={{ height:4, background:"rgba(201,162,39,0.15)", borderRadius:3, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${progPct}%`, background:"linear-gradient(90deg,#a78bfa,#c4b5fd)", borderRadius:3, transition:"width .4s" }} />
          </div>
          <p style={{ color:"rgba(101,67,14,0.35)", fontSize:".7rem", margin:"4px 0 0" }}>
            {r.paid_installments}/{r.tenor} angsuran ({progPct}%)
          </p>
        </div>
      </motion.div>
    );
  }

  function GadaiRow({ r }: { r: any }) {
    return (
      <motion.div key={r.id} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}>
        <div style={{ background:"rgba(255,255,255,0.72)", border:"1px solid rgba(96,165,250,0.2)", borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:140 }}>
            <p style={{ color:"#2D1B00", fontWeight:700, fontSize:".88rem", margin:"0 0 2px" }}>
              {r.profiles?.name || "-"}
              <span style={{ color:"rgba(101,67,14,0.45)", fontWeight:400, fontSize:".82rem" }}> - {Number(r.gram_setara||0).toFixed(1)} gr - Gadai {r.tenor} bln</span>
            </p>
            <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".74rem", margin:0 }}>
              {fmtDate(r.transaction_date || r.created_at)} - Angsuran {fmt(r.angsuran_per_bulan)}/bln - Sisa {fmt(r.sisa_tagihan)}
            </p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <span style={{ color:"#1d4ed8", fontWeight:800 }}>{fmt(r.dana_cair)}</span>
            <StatusBadge status={r.status} />
            <DeleteBtn table="gadai" id={r.id} label={`gadai - ${r.profiles?.name||"-"}`} />
          </div>
        </div>
      </motion.div>
    );
  }

  function SimpananRow({ r }: { r: any }) {
    return (
      <motion.div key={r.id} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}>
        <div style={{ background:"rgba(255,255,255,0.72)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:140 }}>
            <p style={{ color:"#2D1B00", fontWeight:700, fontSize:".88rem", margin:"0 0 2px" }}>
              {r.profiles?.name || "-"}
              <span style={{ color:"rgba(101,67,14,0.45)", fontWeight:400, fontSize:".82rem" }}> - {SIM_LABEL[r.type]||r.type}</span>
            </p>
            <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".74rem", margin:0 }}>
              {fmtDate(r.transaction_date || r.created_at)}{r.description ? ` - ${r.description}` : ""}
            </p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <span style={{ color:"#f59e0b", fontWeight:800 }}>{fmt(r.amount)}</span>
            <StatusBadge status={r.status} />
            <DeleteBtn table={r._table || "simpanan"} id={r.id} label={`simpanan ${SIM_LABEL[r.type]||r.type} - ${r.profiles?.name||"-"}`} />
          </div>
        </div>
      </motion.div>
    );
  }

  const secHeader = (label: string, count: number, color: string) => (
    <p key={label} style={{ color, fontSize:".72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".08em", margin:"14px 0 6px", display:"flex", alignItems:"center", gap:6 }}>
      {label} <span style={{ background:`${color}22`, borderRadius:20, padding:"1px 8px", fontSize:".68rem" }}>{count}</span>
    </p>
  );

  function renderContent() {
    if (tab === "all") {
      const beli    = byName(beliData);
      const cic     = byName(cicilanData);
      const gad     = byName(gadaiData);
      const bb      = byName(buybackData);
      const sim     = byName(simpananData);
      const total   = beli.length + cic.length + gad.length + bb.length + sim.length;
      if (total === 0) return <p style={{ color:"rgba(101,67,14,0.35)", padding:"32px", textAlign:"center" }}>Tidak ada data.</p>;
      return <>
        {beli.length  > 0 && <>{secHeader("Beli Emas", beli.length, "#D4AF37")}{beli.map(r=><TxRow key={r.id} r={r} color="#D4AF37" />)}</>}
        {cic.length   > 0 && <>{secHeader("Cicilan Emas", cic.length, "#a78bfa")}{cic.map(r=><CicilanRow key={r.id} r={r} />)}</>}
        {gad.length   > 0 && <>{secHeader("Gadai", gad.length, "#60a5fa")}{gad.map(r=><GadaiRow key={r.id} r={r} />)}</>}
        {bb.length    > 0 && <>{secHeader("Buyback", bb.length, "#34d399")}{bb.map(r=><TxRow key={r.id} r={r} color="#34d399" />)}</>}
        {sim.length   > 0 && <>{secHeader("Simpanan", sim.length, "#f59e0b")}{sim.map(r=><SimpananRow key={r.id} r={r} />)}</>}
      </>;
    }
    if (tab === "beli") {
      const rows = byName(beliData);
      return rows.length === 0 ? <p style={{ color:"rgba(101,67,14,0.35)", padding:"32px", textAlign:"center" }}>Belum ada data Beli Emas.</p>
        : rows.map(r => <TxRow key={r.id} r={r} color="#D4AF37" />);
    }
    if (tab === "cicilan") {
      const rows = byName(cicilanData);
      return rows.length === 0 ? <p style={{ color:"rgba(101,67,14,0.35)", padding:"32px", textAlign:"center" }}>Belum ada data Cicilan Emas.</p>
        : rows.map(r => <CicilanRow key={r.id} r={r} />);
    }
    if (tab === "gadai") {
      const rows = byName(gadaiData);
      return rows.length === 0 ? <p style={{ color:"rgba(101,67,14,0.35)", padding:"32px", textAlign:"center" }}>Belum ada data Gadai.</p>
        : rows.map(r => <GadaiRow key={r.id} r={r} />);
    }
    if (tab === "buyback") {
      const rows = byName(buybackData);
      return rows.length === 0 ? <p style={{ color:"rgba(101,67,14,0.35)", padding:"32px", textAlign:"center" }}>Belum ada data Buyback.</p>
        : rows.map(r => <TxRow key={r.id} r={r} color="#34d399" />);
    }
    if (tab === "simpanan") {
      const rows = byName(simpananData);
      return rows.length === 0 ? <p style={{ color:"rgba(101,67,14,0.35)", padding:"32px", textAlign:"center" }}>Belum ada data Simpanan.</p>
        : rows.map(r => <SimpananRow key={r.id} r={r} />);
    }
    return null;
  }

  const totalCount = beliData.length + cicilanData.length + gadaiData.length + buybackData.length + simpananData.length;
  const tabCount: Record<Tab, number> = {
    all: totalCount, beli: beliData.length, cicilan: cicilanData.length,
    gadai: gadaiData.length, buyback: buybackData.length, simpanan: simpananData.length,
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#2D1B00", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Riwayat Transaksi</h1>
          <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".85rem", margin:"4px 0 0" }}>Semua transaksi — pending, diproses, selesai, ditolak</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#8B6010", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {TABS.map(t => {
          const Icon = t.icon; const active = tab === t.id;
          return (
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 14px", borderRadius:10, fontSize:".84rem", fontWeight:600, cursor:"pointer",
                border: active ? `1px solid ${t.color}` : "1px solid rgba(201,162,39,0.2)",
                background: active ? `${t.color}22` : "rgba(255,255,255,0.03)",
                color: active ? t.color : "rgba(101,67,14,0.55)" }}>
              <Icon style={{ width:14, height:14 }} /> {t.label}
              {tabCount[t.id] > 0 && <span style={{ background:`${t.color}33`, color:t.color, borderRadius:20, padding:"1px 7px", fontSize:".7rem" }}>{tabCount[t.id]}</span>}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ position:"relative", maxWidth:380 }}>
        <Search style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:15, height:15, color:"rgba(101,67,14,0.35)" }} />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama anggota..."
          style={{ width:"100%", background:"rgba(255,255,255,0.72)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:10, padding:"10px 14px 10px 38px", color:"#2D1B00", fontSize:".88rem", outline:"none", boxSizing:"border-box" }} />
      </div>

      {loading ? <p style={{ color:"rgba(101,67,14,0.35)" }}>Memuat...</p> : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {renderContent()}
        </div>
      )}
    </div>
  );
}
