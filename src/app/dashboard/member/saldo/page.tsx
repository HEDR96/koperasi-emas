"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Wallet, Coins, Landmark, RefreshCw, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { getGadaiParams, type GadaiParams, GADAI_PARAM_DEFAULTS } from "@/lib/harga";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
const fmtGram = (n: number) => `${n.toFixed(1)} gram`;

const GRAM_IN = new Set(["buy", "cicilan", "tabungan"]);

export default function MemberSaldoPage() {
  const { user } = useAuthStore();
  const [rupiah, setRupiah]             = useState(0);
  const [emasGram, setEmasGram]         = useState(0);
  const [simpanan, setSimpanan]         = useState(0);
  const [hargaBuyback, setHargaBuyback] = useState(0);
  const [gadaiParams, setGadaiParams]   = useState<GadaiParams>(GADAI_PARAM_DEFAULTS);
  const [tenorSim, setTenorSim]         = useState(1);
  const [loading, setLoading]           = useState(true);

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [profRes, txRes, simRes, bbRes] = await Promise.all([
        (supabase.from("profiles") as any).select("rupiah_balance").eq("id", user.id).single(),
        (supabase.from("transactions") as any).select("type, gram, amount, status").eq("user_id", user.id).eq("status","completed"),
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
      // Total Simpanan = tabel simpanan + sisa transaksi lama type='tabungan' (sebelum migrasi ke tabel simpanan)
      const simFromTable = (simRes.data||[]).reduce((s: number, r: any) => s + (r.amount||0), 0);
      const simFromLegacy = (txRes.data||[]).reduce((s: number, t: any) => s + (t.type === "tabungan" ? Number(t.amount||0) : 0), 0);
      setSimpanan(simFromTable + simFromLegacy);
      let hb = 0;
      if (bbRes.data?.length) {
        const one = bbRes.data.find((r: any) => Number(r.gram) === 1) || bbRes.data[0];
        hb = Number(one.harga) / Number(one.gram);
      } else {
        const { data: gp } = await (supabase.from("gold_prices") as any)
          .select("buyback_member").order("created_at",{ascending:false}).limit(1).single();
        if (gp) hb = Number(gp.buyback_member);
      }
      setHargaBuyback(hb);
      const gp = await getGadaiParams();
      setGadaiParams(gp);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, [user?.id]);

  // dana_cair = emasGram x buyback x 80% - admin_gadai
  // angsuran  = dana_cair x (1 + persen_gadai/100) / tenor
  const danaCairEmas = hargaBuyback > 0
    ? Math.max(0, Math.round(emasGram * hargaBuyback * 0.8 - gadaiParams.adminAnggota))
    : 0;
  const angsuranEmas = danaCairEmas > 0 && tenorSim > 0
    ? Math.ceil(danaCairEmas * (1 + gadaiParams.persenAnggota / 100) / tenorSim)
    : 0;

  const cards = [
    {
      label:"Saldo Rupiah", value:fmt(rupiah), sub:"Saldo dompet koperasi",
      icon:Wallet, color:"#1d4ed8", bg:"rgba(29,78,216,0.08)", href:"/dashboard/member/histori",
    },
    {
      label:"Emas Tersimpan", value:fmtGram(emasGram),
      sub: danaCairEmas > 0
        ? ("Nilai gadai: " + fmt(danaCairEmas))
        : hargaBuyback > 0 ? ("~" + fmt(emasGram * hargaBuyback)) : "",
      icon:Coins, color:"#8B6010", bg:"rgba(212,175,55,0.1)", href:"/dashboard/member/buyback",
    },
    {
      label:"Total Simpanan", value:fmt(simpanan),
      sub: hargaBuyback > 0 ? ("Setara " + fmtGram(simpanan / hargaBuyback)) : "",
      icon:Landmark, color:"#a78bfa", bg:"rgba(167,139,250,0.1)", href:"/dashboard/member/simpanan",
    },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:760 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#2D1B00", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Saldo & Emas</h1>
          <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".85rem", margin:"4px 0 0" }}>Ringkasan aset Anda di koperasi</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#8B6010", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      {/* Kartu aset */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:16 }}>
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} href={c.href} style={{ textDecoration:"none" }}>
              <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i * 0.06 }}
                style={{ background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.15)", borderRadius:18, padding:"22px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                  <div style={{ background:c.bg, borderRadius:10, padding:9 }}>
                    <Icon style={{ width:18, height:18, color:c.color }} />
                  </div>
                  <ArrowRight style={{ width:15, height:15, color:"rgba(101,67,14,0.3)" }} />
                </div>
                <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".78rem", margin:"0 0 6px" }}>{c.label}</p>
                <p style={{ color:c.color, fontWeight:900, fontSize:"1.4rem", margin:0 }}>{loading ? "-" : c.value}</p>
                {c.sub && <p style={{ color:"rgba(101,67,14,0.4)", fontSize:".76rem", margin:"6px 0 0" }}>{c.sub}</p>}
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Simulasi Gadai Emas */}
      {!loading && emasGram > 0 && hargaBuyback > 0 && (
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          style={{ background:"rgba(212,175,55,0.05)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:18, padding:22 }}>

          {/* Judul */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
            <Coins style={{ width:18, height:18, color:"#8B6010" }} />
            <div>
              <p style={{ color:"#8B6010", fontWeight:700, fontSize:"1rem", margin:0 }}>Simulasi Gadai Emas</p>
              <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".78rem", margin:0 }}>
                Berdasarkan {fmtGram(emasGram)} emas tersimpan
              </p>
            </div>
          </div>

          {/* Rincian */}
          <div style={{ background:"rgba(255,255,255,0.72)", borderRadius:12, padding:"14px 16px", marginBottom:14 }}>
            {[
              { label:"Emas tersimpan",       val:fmtGram(emasGram),                                  color:"#2D1B00" },
              { label:"Harga buyback/gram",   val:fmt(hargaBuyback),                                  color:"rgba(101,67,14,0.6)" },
              { label:"Nilai emas (100%)",    val:fmt(Math.round(emasGram * hargaBuyback)),            color:"rgba(101,67,14,0.6)" },
              { label:"Nilai gadai (x 80%)",  val:fmt(Math.round(emasGram * hargaBuyback * 0.8)),     color:"rgba(101,67,14,0.6)" },
            ].map(r => (
              <div key={r.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ color:"rgba(101,67,14,0.45)", fontSize:".82rem" }}>{r.label}</span>
                <span style={{ color:r.color, fontWeight:600, fontSize:".82rem" }}>{r.val}</span>
              </div>
            ))}
            {gadaiParams.adminAnggota > 0 && (
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ color:"rgba(101,67,14,0.45)", fontSize:".82rem" }}>- Biaya admin</span>
                <span style={{ color:"#991b1b", fontWeight:600, fontSize:".82rem" }}>- {fmt(gadaiParams.adminAnggota)}</span>
              </div>
            )}
            <div style={{ display:"flex", justifyContent:"space-between", paddingTop:8, borderTop:"1px solid rgba(201,162,39,0.15)" }}>
              <span style={{ color:"rgba(45,27,0,0.8)", fontWeight:700 }}>Dana Cair (Pinjaman)</span>
              <span style={{ color:"#8B6010", fontWeight:900, fontSize:".95rem" }}>{fmt(danaCairEmas)}</span>
            </div>
          </div>

          {/* Pilih tenor */}
          <p style={{ color:"rgba(101,67,14,0.55)", fontSize:".8rem", margin:"0 0 8px" }}>Pilih Tenor (bulan):</p>
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            {[1, 2, 3, 4].map(t => (
              <button key={t} onClick={() => setTenorSim(t)}
                style={{ flex:1, padding:"10px", borderRadius:10, fontWeight:700, fontSize:".9rem", cursor:"pointer",
                  border: tenorSim === t ? "1px solid #D4AF37" : "1px solid rgba(201,162,39,0.2)",
                  background: tenorSim === t ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
                  color: tenorSim === t ? "#D4AF37" : "rgba(101,67,14,0.55)" }}>
                {t}
              </button>
            ))}
          </div>

          {/* Hasil angsuran */}
          <div style={{ background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:12, padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ color:"rgba(101,67,14,0.55)", fontSize:".78rem", margin:"0 0 3px" }}>
                Angsuran / Bulan ({tenorSim} bulan)
              </p>
              {gadaiParams.persenAnggota > 0 && (
                <p style={{ color:"rgba(101,67,14,0.35)", fontSize:".7rem", margin:0 }}>
                  {fmt(danaCairEmas)} x (1 + {gadaiParams.persenAnggota}%) / {tenorSim}
                </p>
              )}
            </div>
            <span style={{ color:"#8B6010", fontWeight:900, fontSize:"1.3rem" }}>{fmt(angsuranEmas)}</span>
          </div>

          <p style={{ color:"rgba(101,67,14,0.3)", fontSize:".72rem", margin:"8px 0 0" }}>
            *Simulasi gadai berdasarkan emas tersimpan. Ajukan gadai melalui menu Simpanan.
          </p>
        </motion.div>
      )}
    </div>
  );
}
