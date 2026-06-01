"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Search, CreditCard, Coins, ArrowDownCircle, Landmark } from "lucide-react";
import { supabase } from "@/lib/supabase";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
const fmtDate = (s: string) =>
  new Date(s).toLocaleString("id-ID", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });

type Tab = "cicilan" | "emas" | "buyback" | "gadai";
const TABS: { id: Tab; label: string; icon: any; color: string }[] = [
  { id:"cicilan", label:"Bayar Cicilan",   icon:CreditCard,     color:"#34d399" },
  { id:"emas",    label:"Penambahan Emas", icon:Coins,          color:"#D4AF37" },
  { id:"buyback", label:"Buyback",         icon:ArrowDownCircle,color:"#60a5fa" },
  { id:"gadai",   label:"Gadai (Konversi)",icon:Landmark,       color:"#a78bfa" },
];

const EMAS_LABEL: Record<string,string> = { buy:"Beli Emas", cicilan:"Cicilan", tabungan:"Tabungan" };

export default function AdminRiwayatPage() {
  const [tab, setTab] = useState<Tab>("cicilan");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [cicilan, setCicilan] = useState<any[]>([]);
  const [emas, setEmas]       = useState<any[]>([]);
  const [buyback, setBuyback] = useState<any[]>([]);
  const [gadai, setGadai]     = useState<any[]>([]);

  async function load() {
    setLoading(true);
    try {
      const [cRes, eRes, bRes, gRes] = await Promise.all([
        (supabase.from("cicilan_pembayaran") as any)
          .select("id, angsuran_ke, amount, paid_at, profiles:profiles!user_id(name), installments(product_name)")
          .order("paid_at",{ascending:false}).limit(300),
        (supabase.from("transactions") as any)
          .select("id, type, amount, gram, created_at, profiles(name)")
          .in("type",["buy","cicilan","tabungan"]).eq("status","completed")
          .order("created_at",{ascending:false}).limit(300),
        (supabase.from("transactions") as any)
          .select("id, amount, gram, status, created_at, profiles(name)")
          .eq("type","buyback").order("created_at",{ascending:false}).limit(300),
        (supabase.from("gadai") as any)
          .select("id, dana_cair, gram_setara, tenor, angsuran_per_bulan, sisa_tagihan, status, created_at, profiles:profiles!user_id(name)")
          .order("created_at",{ascending:false}).limit(300),
      ]);
      setCicilan(cRes.data || []);
      setEmas(eRes.data || []);
      setBuyback(bRes.data || []);
      setGadai(gRes.data || []);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const q = search.toLowerCase();
  const byName = (rows: any[]) => q ? rows.filter(r => (r.profiles?.name||"").toLowerCase().includes(q)) : rows;

  const counts: Record<Tab, number> = { cicilan:cicilan.length, emas:emas.length, buyback:buyback.length, gadai:gadai.length };

  function Row({ children, color }: { children: React.ReactNode; color: string }) {
    return (
      <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${color}22`, borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
        {children}
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Riwayat</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Histori pembayaran cicilan, penambahan emas, buyback & gadai</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {TABS.map(t => {
          const Icon = t.icon; const active = tab === t.id;
          return (
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 16px", borderRadius:10, fontSize:".86rem", fontWeight:600, cursor:"pointer",
                border: active ? `1px solid ${t.color}` : "1px solid rgba(255,255,255,0.1)",
                background: active ? `${t.color}22` : "rgba(255,255,255,0.03)",
                color: active ? t.color : "rgba(255,255,255,0.5)" }}>
              <Icon style={{ width:15, height:15 }} /> {t.label}
              {counts[t.id] > 0 && <span style={{ background:`${t.color}33`, color:t.color, borderRadius:20, padding:"1px 8px", fontSize:".72rem" }}>{counts[t.id]}</span>}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ position:"relative", maxWidth:380 }}>
        <Search style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:15, height:15, color:"rgba(255,255,255,0.3)" }} />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama anggota..."
          style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:10, padding:"10px 14px 10px 38px", color:"#fff", fontSize:".88rem", outline:"none", boxSizing:"border-box" }} />
      </div>

      {loading ? <p style={{ color:"rgba(255,255,255,0.3)" }}>Memuat...</p> : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>

          {tab === "cicilan" && (byName(cicilan).length === 0
            ? <p style={{ color:"rgba(255,255,255,0.3)", padding:"24px", textAlign:"center" }}>Belum ada pembayaran cicilan.</p>
            : byName(cicilan).map((r,i)=>(
                <motion.div key={r.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:Math.min(i*.02,.3)}}>
                  <Row color="#34d399">
                    <div>
                      <p style={{ color:"#fff", fontWeight:700, fontSize:".88rem", margin:0 }}>{r.profiles?.name || "—"} <span style={{ color:"rgba(255,255,255,0.4)", fontWeight:400 }}>· {r.installments?.product_name || "Cicilan"}</span></p>
                      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem", margin:"2px 0 0" }}>Angsuran ke-{r.angsuran_ke} · {fmtDate(r.paid_at)}</p>
                    </div>
                    <span style={{ color:"#34d399", fontWeight:800 }}>{fmt(r.amount)}</span>
                  </Row>
                </motion.div>
              ))
          )}

          {tab === "emas" && (byName(emas).length === 0
            ? <p style={{ color:"rgba(255,255,255,0.3)", padding:"24px", textAlign:"center" }}>Belum ada penambahan emas.</p>
            : byName(emas).map((r,i)=>(
                <motion.div key={r.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:Math.min(i*.02,.3)}}>
                  <Row color="#D4AF37">
                    <div>
                      <p style={{ color:"#fff", fontWeight:700, fontSize:".88rem", margin:0 }}>{r.profiles?.name || "—"} <span style={{ color:"rgba(255,255,255,0.4)", fontWeight:400 }}>· {EMAS_LABEL[r.type]||r.type}</span></p>
                      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem", margin:"2px 0 0" }}>{fmtDate(r.created_at)}</p>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <p style={{ color:"#D4AF37", fontWeight:800, margin:0 }}>+ {Number(r.gram||0).toFixed(4)} gr</p>
                      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem", margin:0 }}>{fmt(r.amount)}</p>
                    </div>
                  </Row>
                </motion.div>
              ))
          )}

          {tab === "buyback" && (byName(buyback).length === 0
            ? <p style={{ color:"rgba(255,255,255,0.3)", padding:"24px", textAlign:"center" }}>Belum ada buyback.</p>
            : byName(buyback).map((r,i)=>(
                <motion.div key={r.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:Math.min(i*.02,.3)}}>
                  <Row color="#60a5fa">
                    <div>
                      <p style={{ color:"#fff", fontWeight:700, fontSize:".88rem", margin:0 }}>{r.profiles?.name || "—"}</p>
                      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem", margin:"2px 0 0" }}>{fmtDate(r.created_at)} · {r.status==="completed"?"selesai":r.status}</p>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <p style={{ color:"#60a5fa", fontWeight:800, margin:0 }}>− {Number(r.gram||0).toFixed(4)} gr</p>
                      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem", margin:0 }}>{fmt(r.amount)}</p>
                    </div>
                  </Row>
                </motion.div>
              ))
          )}

          {tab === "gadai" && (byName(gadai).length === 0
            ? <p style={{ color:"rgba(255,255,255,0.3)", padding:"24px", textAlign:"center" }}>Belum ada gadai.</p>
            : byName(gadai).map((r,i)=>(
                <motion.div key={r.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:Math.min(i*.02,.3)}}>
                  <Row color="#a78bfa">
                    <div>
                      <p style={{ color:"#fff", fontWeight:700, fontSize:".88rem", margin:0 }}>{r.profiles?.name || "—"} <span style={{ color:"rgba(255,255,255,0.4)", fontWeight:400 }}>· {Number(r.gram_setara||0).toFixed(4)} gr → pinjaman</span></p>
                      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem", margin:"2px 0 0" }}>{r.tenor} bln · angsuran {fmt(r.angsuran_per_bulan)} · sisa {fmt(r.sisa_tagihan)} · {fmtDate(r.created_at)}</p>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <p style={{ color:"#a78bfa", fontWeight:800, margin:0 }}>{fmt(r.dana_cair)}</p>
                      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem", margin:0, textTransform:"capitalize" }}>{r.status}</p>
                    </div>
                  </Row>
                </motion.div>
              ))
          )}
        </div>
      )}
    </div>
  );
}
