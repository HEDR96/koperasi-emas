"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Coins, Landmark, CreditCard, RefreshCw, TrendingUp, ArrowRight,
  Wallet, ArrowDownCircle, Send, History,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
const fmtGram = (n: number) => `${n.toFixed(1)} gram`;
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" });

interface TxRow { id: string; type: string; amount: number; gram: number | null; status: string; created_at: string; transaction_date: string | null; }

const TYPE_LABEL: Record<string,string> = {
  buy:"Beli Emas", buyback:"Jual Kembali", cicilan:"Cicilan",
  Simpanan:"Simpanan", transfer:"Transfer", referral_bonus:"Bonus Referral",
};
const STATUS_COLOR: Record<string,string> = {
  pending:"#fbbf24", processing:"#60a5fa", completed:"#34d399", rejected:"#f87171",
};
const STATUS_LABEL: Record<string,string> = {
  pending:"Menunggu", processing:"Diproses", completed:"Selesai", rejected:"Ditolak",
};

// Tipe yang menambah emas tersimpan saat completed
const GRAM_IN = new Set(["buy", "cicilan", "Simpanan"]);

export default function MemberDashboardPage() {
  const { user } = useAuthStore();

  const [emasGram, setEmasGram]       = useState(0);
  const [totalSimpanan, setTotalSimpanan] = useState(0);
  const [hargaEmas, setHargaEmas]     = useState(0);     // beli per gram
  const [hargaBuyback, setHargaBuyback] = useState(0);   // buyback per gram
  const [gadaiAktif, setGadaiAktif]   = useState<any>(null);
  const [cicilanAktif, setCicilanAktif] = useState<any[]>([]);
  const [recent, setRecent]           = useState<TxRow[]>([]);
  const [loading, setLoading]         = useState(true);

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [txRes, simRes, emasRes, bbRes, gadaiRes, cicRes] = await Promise.all([
        (supabase.from("transactions") as any)
          .select("id, type, amount, gram, status, created_at, transaction_date")
          .eq("user_id", user.id)
          .order("created_at", { ascending:false }),
        (supabase.from("simpanan") as any)
          .select("amount, status").eq("user_id", user.id).eq("status","completed"),
        (supabase.from("harga_emas_berat") as any)
          .select("gram, harga").eq("kategori","emas").order("created_at",{ascending:false}).limit(30),
        (supabase.from("harga_emas_berat") as any)
          .select("gram, harga").eq("kategori","buyback").order("created_at",{ascending:false}).limit(30),
        (supabase.from("gadai") as any)
          .select("*").eq("user_id", user.id).in("status",["pengajuan","disetujui","aktif"])
          .order("created_at",{ascending:false}).limit(1),
        (supabase.from("installments") as any)
          .select("*").eq("user_id", user.id).eq("status","active").order("created_at",{ascending:false}),
      ]);

      const txs: TxRow[] = txRes.data || [];
      // Emas tersimpan = Σ gram (buy/cicilan/Simpanan completed) − Σ gram (buyback completed)
      const net = txs.reduce((acc, t) => {
        if (t.status !== "completed" || !t.gram) return acc;
        if (GRAM_IN.has(t.type)) return acc + Number(t.gram);
        if (t.type === "buyback")  return acc - Number(t.gram);
        return acc;
      }, 0);
      setEmasGram(Math.max(0, net));
      setRecent(txs.slice(0, 6));

      setTotalSimpanan((simRes.data || []).reduce((s: number, r: any) => s + (r.amount || 0), 0));

      const perGram = (rows: any[], fallback = 0) => {
        if (!rows?.length) return fallback;
        const one = rows.find((r: any) => Number(r.gram) === 1) || rows[0];
        return Number(one.harga) / Number(one.gram);
      };
      let he = perGram(emasRes.data);
      let hb = perGram(bbRes.data);
      if (!he || !hb) {
        const { data: gp } = await (supabase.from("gold_prices") as any)
          .select("buy_member, buyback_member").order("created_at",{ascending:false}).limit(1).single();
        if (gp) { he = he || Number(gp.buy_member); hb = hb || Number(gp.buyback_member); }
      }
      setHargaEmas(he || 0);
      setHargaBuyback(hb || 0);

      setGadaiAktif(gadaiRes.data?.[0] || null);
      setCicilanAktif(cicRes.data || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [user?.id]);

  const emasValue    = emasGram * hargaBuyback;
  const simpananGram = hargaBuyback > 0 ? totalSimpanan / hargaBuyback : 0;

  const quickLinks = [
    { label:"Buyback Emas", href:"/dashboard/member/buyback",  icon:ArrowDownCircle, color:"#34d399" },
    { label:"Simpanan",     href:"/dashboard/member/simpanan", icon:Landmark,        color:"#60a5fa" },
    { label:"Cicilan",      href:"/dashboard/member/cicilan",  icon:CreditCard,      color:"#a78bfa" },
    { label:"Ajukan Transaksi", href:"/dashboard/member/request", icon:Send,         color:"#D4AF37" },
    { label:"Histori",      href:"/dashboard/member/histori",  icon:History,         color:"#fff" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>
            Halo, {user?.name?.split(" ")[0] || "Anggota"} 👋
          </h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>
            Ringkasan emas tersimpan & simpanan Anda
          </p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      {/* Hero stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:16 }}>
        {/* Emas tersimpan */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          style={{ background:"linear-gradient(135deg,rgba(212,175,55,0.14),rgba(212,175,55,0.04))", border:"1px solid rgba(212,175,55,0.3)", borderRadius:20, padding:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
            <Coins style={{ width:16, height:16, color:"#D4AF37" }} />
            <p style={{ color:"rgba(255,255,255,0.55)", fontSize:".82rem", margin:0 }}>Total Transaksi Emas</p>
          </div>
          <p style={{ color:"#D4AF37", fontSize:"2.1rem", fontWeight:900, margin:0, lineHeight:1 }}>
            {loading ? "—" : fmtGram(emasGram)}
          </p>
          {hargaBuyback > 0 && (
            <p style={{ color:"rgba(255,255,255,0.6)", fontSize:".85rem", marginTop:10 }}>
              ≈ <strong style={{ color:"#fff" }}>{fmt(emasValue)}</strong> <span style={{ color:"rgba(255,255,255,0.35)" }}>(harga buyback)</span>
            </p>
          )}
        </motion.div>

        {/* Total simpanan */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.06 }}
          style={{ background:"linear-gradient(135deg,rgba(96,165,250,0.12),rgba(96,165,250,0.03))", border:"1px solid rgba(96,165,250,0.25)", borderRadius:20, padding:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
            <Wallet style={{ width:16, height:16, color:"#60a5fa" }} />
            <p style={{ color:"rgba(255,255,255,0.55)", fontSize:".82rem", margin:0 }}>Total Simpanan</p>
          </div>
          <p style={{ color:"#60a5fa", fontSize:"2.1rem", fontWeight:900, margin:0, lineHeight:1 }}>
            {loading ? "—" : fmt(totalSimpanan)}
          </p>
          {hargaBuyback > 0 && (
            <p style={{ color:"rgba(255,255,255,0.6)", fontSize:".85rem", marginTop:10 }}>
              Setara <strong style={{ color:"#fff" }}>{fmtGram(simpananGram)}</strong>
            </p>
          )}
        </motion.div>
      </div>

      {/* Harga terkini */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:14 }}>
        {[
          { label:"Harga Beli Emas / gram",   value:hargaEmas,    color:"#D4AF37" },
          { label:"Harga Buyback / gram",     value:hargaBuyback, color:"#34d399" },
        ].map(h => (
          <div key={h.label} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"16px 18px" }}>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem", marginBottom:6 }}>{h.label}</p>
            <p style={{ color:h.color, fontWeight:900, fontSize:"1.25rem", margin:0 }}>{loading ? "—" : fmt(h.value)}</p>
          </div>
        ))}
      </div>

      {/* Gadai & Cicilan aktif */}
      {(gadaiAktif || cicilanAktif.length > 0) && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:14 }}>
          {gadaiAktif && (
            <Link href="/dashboard/member/gadai" style={{ textDecoration:"none" }}>
              <div style={{ background:"rgba(96,165,250,0.06)", border:"1px solid rgba(96,165,250,0.22)", borderRadius:16, padding:"16px 18px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <Landmark style={{ width:15, height:15, color:"#60a5fa" }} />
                  <p style={{ color:"#60a5fa", fontWeight:700, fontSize:".88rem", margin:0 }}>Gadai Aktif</p>
                  <span style={{ marginLeft:"auto", textTransform:"capitalize", color:"#D4AF37", fontSize:".75rem", fontWeight:600 }}>{gadaiAktif.status}</span>
                </div>
                <p style={{ color:"rgba(255,255,255,0.6)", fontSize:".82rem", margin:0 }}>
                  Pinjaman {fmt(gadaiAktif.dana_cair)} · Sisa <strong style={{ color:"#f87171" }}>{fmt(gadaiAktif.sisa_tagihan)}</strong>
                </p>
              </div>
            </Link>
          )}
          {cicilanAktif.map(c => (
            <Link key={c.id} href="/dashboard/member/cicilan" style={{ textDecoration:"none" }}>
              <div style={{ background:"rgba(167,139,250,0.06)", border:"1px solid rgba(167,139,250,0.22)", borderRadius:16, padding:"16px 18px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <CreditCard style={{ width:15, height:15, color:"#a78bfa" }} />
                  <p style={{ color:"#a78bfa", fontWeight:700, fontSize:".88rem", margin:0 }}>{c.product_name || "Cicilan Emas"}</p>
                </div>
                <p style={{ color:"rgba(255,255,255,0.6)", fontSize:".82rem", margin:0 }}>
                  {c.paid_installments}/{c.tenor} bulan · Angsuran {fmt(c.monthly_amount)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick actions */}
      <div>
        <p style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 12px" }}>Akses Cepat</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12 }}>
          {quickLinks.map(q => {
            const Icon = q.icon;
            return (
              <Link key={q.href} href={q.href} style={{ textDecoration:"none" }}>
                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"16px 16px", display:"flex", flexDirection:"column", gap:10 }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor="rgba(212,175,55,0.3)"}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.07)"}>
                  <span style={{ width:38, height:38, borderRadius:11, background:`${q.color}1a`, border:`1px solid ${q.color}33`, display:"inline-flex", alignItems:"center", justifyContent:"center", color:q.color }}>
                    <Icon style={{ width:18, height:18 }} />
                  </span>
                  <span style={{ color:"#fff", fontWeight:600, fontSize:".88rem", display:"flex", alignItems:"center", gap:6 }}>
                    {q.label} <ArrowRight style={{ width:13, height:13, color:"rgba(255,255,255,0.3)" }} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent transactions */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
        style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, overflow:"hidden" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <h2 style={{ color:"#fff", fontWeight:700, fontSize:"1rem", margin:0 }}>Transaksi Terkini</h2>
          <Link href="/dashboard/member/histori" style={{ color:"#D4AF37", fontSize:".8rem", textDecoration:"none" }}>Lihat Semua →</Link>
        </div>
        {loading ? (
          <p style={{ padding:"32px", textAlign:"center", color:"rgba(255,255,255,0.3)" }}>Memuat...</p>
        ) : recent.length === 0 ? (
          <p style={{ padding:"32px", textAlign:"center", color:"rgba(255,255,255,0.3)" }}>Belum ada transaksi.</p>
        ) : (
          <div style={{ display:"flex", flexDirection:"column" }}>
            {recent.map(tx => (
              <div key={tx.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 20px", borderBottom:"1px solid rgba(255,255,255,0.04)", gap:12 }}>
                <div>
                  <p style={{ color:"#fff", fontWeight:600, fontSize:".88rem", margin:0 }}>
                    {TYPE_LABEL[tx.type] || tx.type}
                    {tx.gram ? <span style={{ color:"rgba(255,255,255,0.4)", fontWeight:400 }}> · {Number(tx.gram).toFixed(1)} gr</span> : null}
                  </p>
                  <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".75rem", margin:"2px 0 0" }}>{fmtDate(tx.transaction_date || tx.created_at)}</p>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".9rem", margin:0 }}>{fmt(tx.amount)}</p>
                  <span style={{ color:STATUS_COLOR[tx.status]||"#fff", fontSize:".72rem" }}>{STATUS_LABEL[tx.status]||tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

