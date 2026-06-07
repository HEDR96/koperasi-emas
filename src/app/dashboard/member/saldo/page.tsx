"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Wallet, Coins, Landmark, RefreshCw, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
const fmtGram = (n: number) => `${n.toFixed(4)} gram`;

const GRAM_IN = new Set(["buy", "cicilan", "Simpanan"]);

export default function MemberSaldoPage() {
  const { user } = useAuthStore();
  const [rupiah, setRupiah] = useState(0);
  const [emasGram, setEmasGram] = useState(0);
  const [simpanan, setSimpanan] = useState(0);
  const [hargaBuyback, setHargaBuyback] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [profRes, txRes, simRes, bbRes] = await Promise.all([
        (supabase.from("profiles") as any).select("rupiah_balance").eq("id", user.id).single(),
        (supabase.from("transactions") as any).select("type, gram, status").eq("user_id", user.id).eq("status","completed"),
        (supabase.from("simpanan") as any).select("amount").eq("user_id", user.id).eq("status","completed"),
        (supabase.from("harga_emas_berat") as any).select("gram, harga").eq("kategori","buyback").order("created_at",{ascending:false}).limit(30),
      ]);
      setRupiah(Number(profRes.data?.rupiah_balance || 0));
      const net = (txRes.data||[]).reduce((acc: number, t: any) => {
        if (!t.gram) return acc;
        if (GRAM_IN.has(t.type)) return acc + Number(t.gram);
        if (t.type === "buyback") return acc - Number(t.gram);
        return acc;
      }, 0);
      setEmasGram(Math.max(0, net));
      setSimpanan((simRes.data||[]).reduce((s: number, r: any) => s + (r.amount||0), 0));
      let hb = 0;
      if (bbRes.data?.length) {
        const one = bbRes.data.find((r: any) => Number(r.gram)===1) || bbRes.data[0];
        hb = Number(one.harga) / Number(one.gram);
      } else {
        const { data: gp } = await (supabase.from("gold_prices") as any).select("buyback_member").order("created_at",{ascending:false}).limit(1).single();
        if (gp) hb = Number(gp.buyback_member);
      }
      setHargaBuyback(hb);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, [user?.id]);

  const cards = [
    { label:"Saldo Rupiah", value: fmt(rupiah), sub:"Saldo dompet koperasi", icon:Wallet, color:"#60a5fa", bg:"rgba(96,165,250,0.1)", href:"/dashboard/member/histori" },
    { label:"Emas Tersimpan", value: fmtGram(emasGram), sub: hargaBuyback>0 ? `â‰ˆ ${fmt(emasGram*hargaBuyback)}` : "", icon:Coins, color:"#D4AF37", bg:"rgba(212,175,55,0.1)", href:"/dashboard/member/buyback" },
    { label:"Total Simpanan", value: fmt(simpanan), sub: hargaBuyback>0 ? `Setara ${fmtGram(simpanan/hargaBuyback)}` : "", icon:Landmark, color:"#a78bfa", bg:"rgba(167,139,250,0.1)", href:"/dashboard/member/simpanan" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:760 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Saldo & Emas</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Ringkasan aset Anda di koperasi</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16 }}>
        {cards.map((c,i)=>{
          const Icon = c.icon;
          return (
            <Link key={c.label} href={c.href} style={{ textDecoration:"none" }}>
              <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.06 }}
                style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:18, padding:"22px 22px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                  <div style={{ background:c.bg, borderRadius:10, padding:9 }}><Icon style={{ width:18, height:18, color:c.color }} /></div>
                  <ArrowRight style={{ width:15, height:15, color:"rgba(255,255,255,0.25)" }} />
                </div>
                <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", margin:"0 0 6px" }}>{c.label}</p>
                <p style={{ color:c.color, fontWeight:900, fontSize:"1.4rem", margin:0 }}>{loading ? "â€”" : c.value}</p>
                {c.sub && <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".76rem", margin:"6px 0 0" }}>{c.sub}</p>}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

