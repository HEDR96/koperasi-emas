"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import {
  getMarkup, withMarkup,
  buildDerivedCicilan, getCicilanParams,
} from "@/lib/harga";
import { isDemoMode, DEMO_HARGA_EMAS_BERAT, DEMO_MARKUP, DEMO_CICILAN_PARAMS, DEMO_BUYBACK_PRICE_PER_GRAM } from "@/lib/demo";
import { Calculator, ArrowLeftRight, MessageCircle, ShoppingCart } from "lucide-react";

type SimType = "beli" | "cicilan" | "buyback";

const TABS: { id: SimType; label: string; icon: any }[] = [
  { id: "beli",    label: "Beli Emas",    icon: ShoppingCart },
  { id: "cicilan", label: "Cicilan Emas", icon: Calculator },
  { id: "buyback", label: "Buyback",      icon: ArrowLeftRight },
];

const WA_ADMIN    = "6281297533899";
const WA_PENGURUS = "6288214460345";

// Flat plan per (gram × tenor) – derived from live gold price
interface DerivedPlan {
  key: string;   // `${gram}-${tenor}`
  gram: number;
  tenor: number;
  hargaAnggota: number;
  totalSebelumDp: number;
  dp: number;
  total: number;
  angsuran: number;
}

export default function SimulationSection() {
  const [activeTab, setActiveTab] = useState<SimType>("beli");

  // ── Beli Emas state ──
  const [beliRows, setBeliRows]         = useState<{ gram: number; harga: number }[]>([]);
  const [beliGram, setBeliGram]         = useState<string>("");
  const [loadingBeli, setLoadingBeli]   = useState(true);

  // Cicilan state — derived from harga emas + markup anggota
  const [cicilanPlans, setCicilanPlans]   = useState<DerivedPlan[]>([]);
  const [selectedGram, setSelectedGram]   = useState<number | null>(null);
  const [selectedTenor, setSelectedTenor] = useState<number | null>(null);
  const [loadingCicilan, setLoadingCicilan] = useState(true);

  // Buyback state
  const [buybackGram, setBuybackGram]       = useState(0.5);
  const [buybackPrice, setBuybackPrice]     = useState(0);
  const [loadingBuyback, setLoadingBuyback] = useState(true);

  // Load cicilan plans: derive from harga_emas_berat + markup anggota
  useEffect(() => {
    (async () => {
      setLoadingCicilan(true);
      if (isDemoMode()) {
        const derived = buildDerivedCicilan(DEMO_HARGA_EMAS_BERAT, DEMO_MARKUP.nonAnggota, DEMO_CICILAN_PARAMS, "nonAnggota");
        const flat: DerivedPlan[] = derived.flatMap(d =>
          d.tenors.map(t => ({
            key: `${d.gram}-${t.tenor}`,
            gram: d.gram, tenor: t.tenor,
            hargaAnggota: d.hargaAnggota,
            totalSebelumDp: t.totalSebelumDp,
            dp: t.dp,
            total: t.total,
            angsuran: t.angsuran,
          }))
        );
        setCicilanPlans(flat);
        if (flat.length) { setSelectedGram(flat[0].gram); setSelectedTenor(flat[0].tenor); }
        setLoadingCicilan(false);
        return;
      }
      try {
        const [{ data: e }, markup, params] = await Promise.all([
          (supabase.from("harga_emas_berat") as any)
            .select("gram,harga")
            .eq("kategori", "emas")
            .order("created_at", { ascending: false })
            .limit(200),
          getMarkup(),
          getCicilanParams(),
        ]);
        // Deduplicate — latest per gram. Landing page = harga NON-ANGGOTA (publik).
        const seen = new Set<number>();
        const latest = (e || [])
          .filter((r: any) => { const g = Number(r.gram); if (seen.has(g)) return false; seen.add(g); return true; })
          .map((r: any) => ({ gram: Number(r.gram), harga: withMarkup(r.harga, Number(r.gram), markup.nonAnggota) }));
        // Flatten derived cicilan into per-(gram×tenor) entries — parameter non-anggota.
        const derived = buildDerivedCicilan(latest, {}, params, "nonAnggota");
        const flat: DerivedPlan[] = derived.flatMap(d =>
          d.tenors.map(t => ({
            key: `${d.gram}-${t.tenor}`,
            gram: d.gram, tenor: t.tenor,
            hargaAnggota: d.hargaAnggota,
            totalSebelumDp: t.totalSebelumDp,
            dp: t.dp,
            total: t.total,
            angsuran: t.angsuran,
          }))
        );
        setCicilanPlans(flat);
        if (flat.length) {
          setSelectedGram(flat[0].gram);
          setSelectedTenor(flat[0].tenor);
        }
      } catch {}
      setLoadingCicilan(false);
    })();
  }, []);

  // Load beli emas (harga non-anggota per berat)
  useEffect(() => {
    (async () => {
      setLoadingBeli(true);
      if (isDemoMode()) {
        const rows = DEMO_HARGA_EMAS_BERAT
          .map(r => ({ gram: r.gram, harga: r.harga }))
          .sort((a, b) => a.gram - b.gram);
        setBeliRows(rows);
        if (rows.length) setBeliGram(String(rows[0].gram));
        setLoadingBeli(false);
        return;
      }
      try {
        const [{ data: e }, markup] = await Promise.all([
          (supabase.from("harga_emas_berat") as any)
            .select("gram,harga").eq("kategori","emas")
            .order("created_at",{ascending:false}).limit(200),
          getMarkup(),
        ]);
        const seen = new Set<number>();
        const rows = (e||[])
          .filter((r:any)=>{ const g=Number(r.gram); if(seen.has(g)) return false; seen.add(g); return true; })
          .map((r:any)=>({ gram:Number(r.gram), harga:withMarkup(r.harga,Number(r.gram),markup.nonAnggota) }))
          .sort((a:any,b:any)=>a.gram-b.gram);
        setBeliRows(rows);
        if (rows.length) setBeliGram(String(rows[0].gram));
      } catch {}
      setLoadingBeli(false);
    })();
  }, []);

  // Load buyback price from DB (1 gram baseline)
  useEffect(() => {
    (async () => {
      setLoadingBuyback(true);
      if (isDemoMode()) {
        setBuybackPrice(DEMO_BUYBACK_PRICE_PER_GRAM);
        setLoadingBuyback(false);
        return;
      }
      try {
        // Try per-gram buyback table first
        const { data } = await (supabase.from("harga_emas_berat") as any)
          .select("gram, harga")
          .eq("kategori", "buyback")
          .order("created_at", { ascending: false })
          .limit(20);
        if (data?.length) {
          // Use 1g price as base rate, fallback to first available
          const oneGram = data.find((d: any) => Number(d.gram) === 1);
          setBuybackPrice(Number((oneGram || data[0]).harga) / Number((oneGram || data[0]).gram));
        } else {
          // Fallback to gold_prices table
          const { data: gp } = await (supabase.from("gold_prices") as any)
            .select("buyback_member")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          if (gp) setBuybackPrice(Number(gp.buyback_member));
        }
      } catch {}
      setLoadingBuyback(false);
    })();
  }, []);

  // Cicilan derived values
  const availableGrams = [...new Set(cicilanPlans.map(p => p.gram))].sort((a, b) => a - b);
  const availableTenors = cicilanPlans
    .filter(p => p.gram === selectedGram)
    .map(p => p.tenor)
    .sort((a, b) => a - b);

  const selectedPlan = cicilanPlans.find(
    p => p.gram === selectedGram && p.tenor === selectedTenor
  );

  function buildMsg(plan: DerivedPlan) {
    return encodeURIComponent([
      "Halo, saya ingin mengajukan cicilan emas:",
      `• Berat: ${plan.gram} gram`,
      `• Harga: ${formatCurrency(plan.hargaAnggota)}`,
      `• Tenor: ${plan.tenor} bulan`,
      ...(plan.dp > 0 ? [`• DP (disetor awal): ${formatCurrency(plan.dp)}`] : []),
      `• Angsuran/bulan (setelah DP): ${formatCurrency(plan.angsuran)}`,
      `• Total keseluruhan: ${formatCurrency(plan.totalSebelumDp)}`,
      "",
      "Mohon info lebih lanjut. Terima kasih."
    ].join("\n"));
  }

  const buybackTotal = Math.round(buybackPrice * buybackGram);

  // Beli emas derived
  const beliSelected = beliRows.find(r => String(r.gram) === beliGram) || null;
  const beliGramOpts = beliRows.map(r => ({ value:String(r.gram), label:`${r.gram % 1 === 0 ? r.gram : r.gram.toFixed(1)} gram` }));

  function buildBeliMsg() {
    if (!beliSelected) return encodeURIComponent("Halo, saya ingin membeli emas. Mohon info lebih lanjut.");
    return encodeURIComponent([
      "Halo, saya ingin membeli emas (cash):",
      `• Berat: ${beliSelected.gram} gram`,
      `• Harga: ${formatCurrency(beliSelected.harga)}`,
      "",
      "Mohon info lebih lanjut. Terima kasih.",
    ].join("\n"));
  }

  function buildBuybackMsg() {
    return encodeURIComponent([
      "Halo, saya ingin melakukan buyback emas:",
      `• Berat: ${buybackGram} gram`,
      `• Harga buyback/gram: ${buybackPrice ? formatCurrency(buybackPrice) : "-"}`,
      `• Estimasi dana diterima: ${buybackTotal ? formatCurrency(buybackTotal) : "-"}`,
      "",
      "Mohon info lebih lanjut. Terima kasih."
    ].join("\n"));
  }

  return (
    <section id="simulasi" className="py-20 lg:py-28 relative">
      <div className="absolute inset-0" style={{ background:"transparent" }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-12">
          <Badge variant="gold" className="mb-4">Kalkulator Interaktif</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ color:"#2D1B00" }}>
            Simulasi <span className="text-gold-gradient">Cicilan & Buyback</span>
          </h2>
          <p className="max-w-xl mx-auto" style={{ color:"rgba(45,27,0,0.8)" }}>
            Cek estimasi cicilan emas dan nilai buyback Anda.
          </p>
        </motion.div>

        {/* Tab Selector */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={activeTab === tab.id ? { background:"linear-gradient(135deg,#C9A227,#F5D060)", color:"#2D1B00", border:"none" } : { background:"rgba(255,255,255,0.72)", color:"rgba(101,67,14,0.7)", border:"1px solid rgba(201,162,39,0.22)" }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300`}>
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <motion.div key={activeTab} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>

          {/* BELI EMAS */}
          {activeTab === "beli" && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Pilih gram */}
              <Card variant="glass" className="gradient-border">
                <h3 className="text-lg font-bold mb-6" style={{ color:"#2D1B00" }}>Beli Emas (Cash)</h3>
                {loadingBeli ? (
                  <p className="text-sm" style={{ color:"rgba(101,67,14,0.45)" }}>Memuat harga emas...</p>
                ) : beliRows.length === 0 ? (
                  <p className="text-sm" style={{ color:"rgba(101,67,14,0.45)" }}>Harga emas belum tersedia.</p>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <label className="text-sm block mb-2" style={{ color:"rgba(101,67,14,0.7)" }}>Pilih Berat Emas</label>
                      <Select
                        value={beliGram}
                        placeholder="Pilih berat emas"
                        options={beliGramOpts}
                        onChange={v => setBeliGram(v)}
                      />
                    </div>
                    <p style={{ color:"rgba(101,67,14,0.4)", fontSize:".78rem", margin:0 }}>
                      Harga di atas adalah harga untuk pembelian cash langsung ke koperasi.
                    </p>
                  </div>
                )}
              </Card>

              {/* Info harga + tombol WA */}
              <Card variant="glass" className="gradient-border">
                <h3 className="text-lg font-bold mb-6" style={{ color:"#2D1B00" }}>Informasi Harga</h3>
                {beliSelected ? (
                  <div className="space-y-4">
                    {[
                      { label:"Berat Emas",  value:`${beliSelected.gram % 1 === 0 ? beliSelected.gram : beliSelected.gram.toFixed(1)} gram` },
                      { label:"Harga Beli",  value:formatCurrency(beliSelected.harga), gold:true },
                    ].map(row=>(
                      <div key={row.label} className="flex justify-between py-3" style={{ borderBottom:"1px solid rgba(201,162,39,0.15)" }}>
                        <span className="text-sm" style={{ color:"rgba(45,27,0,0.8)" }}>{row.label}</span>
                        <span className={`font-bold text-sm`} style={{ color: row.gold ? "#8B6010" : "#2D1B00" }}>{row.value}</span>
                      </div>
                    ))}
                    <div style={{ background:"rgba(201,162,39,0.08)", border:"1px solid rgba(201,162,39,0.2)", borderRadius:12, padding:"14px 16px", textAlign:"center" }}>
                      <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".75rem", margin:"0 0 4px" }}>Total Bayar</p>
                      <p style={{ color:"#8B6010", fontWeight:900, fontSize:"1.6rem", margin:0 }}>{formatCurrency(beliSelected.harga)}</p>
                    </div>
                    <p style={{ color:"rgba(101,67,14,0.35)", fontSize:".72rem", margin:0, textAlign:"center" }}>
                      Hubungi kami untuk konfirmasi ketersediaan & proses transaksi
                    </p>
                    {/* WA Buttons */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:4 }}>
                      <a href={`https://wa.me/${WA_ADMIN}?text=${buildBeliMsg()}`} target="_blank" rel="noopener noreferrer"
                        style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"10px 8px", borderRadius:12, background:"rgba(37,211,102,0.1)", border:"1px solid rgba(37,211,102,0.3)", textDecoration:"none" }}>
                        <MessageCircle className="w-4 h-4" style={{ color:"#25d366" }} />
                        <span style={{ color:"#25d366", fontWeight:700, fontSize:".8rem" }}>WA Admin</span>
                        <span style={{ color:"rgba(101,67,14,0.45)", fontSize:".7rem" }}>0812-9753-3899</span>
                      </a>
                      <a href={`https://wa.me/${WA_PENGURUS}?text=${buildBeliMsg()}`} target="_blank" rel="noopener noreferrer"
                        style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"10px 8px", borderRadius:12, background:"rgba(37,211,102,0.08)", border:"1px solid rgba(37,211,102,0.25)", textDecoration:"none" }}>
                        <MessageCircle className="w-4 h-4" style={{ color:"#15803d" }} />
                        <span style={{ color:"#15803d", fontWeight:700, fontSize:".8rem" }}>WA Pengurus</span>
                        <span style={{ color:"rgba(101,67,14,0.45)", fontSize:".7rem" }}>0882-1446-0345</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm" style={{ color:"rgba(101,67,14,0.45)" }}>Pilih berat emas untuk melihat harga.</p>
                )}
              </Card>
            </div>
          )}

          {/* CICILAN */}
          {activeTab === "cicilan" && (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card variant="glass" className="gradient-border">
                <h3 className="text-lg font-bold mb-6" style={{ color:"#2D1B00" }}>Pilih Paket Cicilan</h3>
                {loadingCicilan ? (
                  <p className="text-sm" style={{ color:"rgba(101,67,14,0.45)" }}>Memuat paket cicilan...</p>
                ) : cicilanPlans.length === 0 ? (
                  <p className="text-sm" style={{ color:"rgba(101,67,14,0.45)" }}>Paket cicilan belum tersedia. Hubungi admin untuk informasi lebih lanjut.</p>
                ) : (
                  <div className="space-y-5">
                    {/* Pilih gram (dropdown) */}
                    <div>
                      <label className="text-sm block mb-2" style={{ color:"rgba(101,67,14,0.7)" }}>Berat Emas</label>
                      <Select
                        value={selectedGram != null ? String(selectedGram) : ""}
                        placeholder="Pilih berat emas"
                        options={availableGrams.map(g => ({ value: String(g), label: `${g % 1 === 0 ? g : g.toFixed(1)} gram` }))}
                        onChange={v => { const g = Number(v); setSelectedGram(g); setSelectedTenor(cicilanPlans.find(p => p.gram === g)?.tenor ?? null); }}
                      />
                    </div>

                    {/* Pilih tenor (dropdown) */}
                    {selectedGram != null && availableTenors.length > 0 && (
                      <div>
                        <label className="text-sm block mb-2" style={{ color:"rgba(101,67,14,0.7)" }}>Tenor (bulan)</label>
                        <Select
                          value={selectedTenor != null ? String(selectedTenor) : ""}
                          placeholder="Pilih tenor"
                          options={availableTenors.map(t => ({ value: String(t), label: `${t} bulan` }))}
                          onChange={v => setSelectedTenor(Number(v))}
                        />
                      </div>
                    )}
                  </div>
                )}
              </Card>

              <Card variant="glass" className="gradient-border">
                <h3 className="text-lg font-bold mb-6" style={{ color:"#2D1B00" }}>Hasil Simulasi</h3>
                {selectedPlan ? (
                  <div className="space-y-4">
                    {[
                      { label: "Berat Emas",         value: `${selectedPlan.gram} gram` },
                      { label: "Harga (Non-Anggota)", value: formatCurrency(selectedPlan.hargaAnggota) },
                      { label: "Tenor",              value: `${selectedPlan.tenor} bulan` },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between py-3" style={{ borderBottom:"1px solid rgba(201,162,39,0.15)" }}>
                        <span className="text-sm" style={{ color:"rgba(45,27,0,0.8)" }}>{row.label}</span>
                        <span className="font-bold text-sm" style={{ color:"#2D1B00" }}>{row.value}</span>
                      </div>
                    ))}

                    {/* Alur DP → Angsuran */}
                    <div style={{ background:"rgba(201,162,39,0.08)", border:"1px solid rgba(201,162,39,0.2)", borderRadius:12, padding:"12px 14px", display:"flex", flexDirection:"column", gap:8 }}>
                      <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".68rem", margin:0, textTransform:"uppercase", letterSpacing:".05em" }}>Alur Pembayaran</p>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ background:"#C9A227", color:"#2D1B00", borderRadius:"50%", width:18, height:18, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:".65rem", fontWeight:900, flexShrink:0 }}>1</span>
                          <span style={{ color:"rgba(45,27,0,0.7)", fontSize:".82rem" }}>DP disetor dulu</span>
                        </div>
                        <span style={{ color:"#8B6010", fontWeight:800 }}>{selectedPlan.dp > 0 ? formatCurrency(selectedPlan.dp) : "—"}</span>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ background:"#C9A227", color:"#2D1B00", borderRadius:"50%", width:18, height:18, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:".65rem", fontWeight:900, flexShrink:0 }}>2</span>
                          <span style={{ color:"rgba(45,27,0,0.7)", fontSize:".82rem" }}>Angsuran {selectedPlan.tenor}×</span>
                        </div>
                        <span style={{ color:"#8B6010", fontWeight:800 }}>{formatCurrency(selectedPlan.angsuran)}<span style={{ color:"rgba(101,67,14,0.4)", fontWeight:400, fontSize:".7rem" }}>/bln</span></span>
                      </div>
                      <div style={{ borderTop:"1px dashed rgba(201,162,39,0.2)", paddingTop:8, display:"flex", justifyContent:"space-between" }}>
                        <span style={{ color:"rgba(101,67,14,0.4)", fontSize:".72rem" }}>Total (DP + cicilan)</span>
                        <span style={{ color:"rgba(101,67,14,0.6)", fontSize:".72rem", fontWeight:600 }}>{formatCurrency(selectedPlan.totalSebelumDp)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between pt-2">
                      <span className="font-semibold" style={{ color:"#2D1B00" }}>Angsuran / Bulan</span>
                      <span className="text-2xl font-black text-gold-gradient">{formatCurrency(selectedPlan.angsuran)}</span>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:4 }}>
                      <a href={`https://wa.me/${WA_ADMIN}?text=${buildMsg(selectedPlan)}`} target="_blank" rel="noopener noreferrer"
                        style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"10px 8px", borderRadius:12, background:"rgba(37,211,102,0.08)", border:"1px solid rgba(37,211,102,0.25)", textDecoration:"none" }}>
                        <MessageCircle className="w-4 h-4" style={{ color:"#15803d" }} />
                        <span style={{ color:"#15803d", fontWeight:700, fontSize:".8rem" }}>Admin</span>
                        <span style={{ color:"rgba(101,67,14,0.45)", fontSize:".7rem" }}>0812-9753-3899</span>
                      </a>
                      <a href={`https://wa.me/${WA_PENGURUS}?text=${buildMsg(selectedPlan)}`} target="_blank" rel="noopener noreferrer"
                        style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"10px 8px", borderRadius:12, background:"rgba(37,211,102,0.08)", border:"1px solid rgba(37,211,102,0.25)", textDecoration:"none" }}>
                        <MessageCircle className="w-4 h-4" style={{ color:"#15803d" }} />
                        <span style={{ color:"#15803d", fontWeight:700, fontSize:".8rem" }}>Pengurus</span>
                        <span style={{ color:"rgba(101,67,14,0.45)", fontSize:".7rem" }}>0882-1446-0345</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm" style={{ color:"rgba(101,67,14,0.45)" }}>Pilih berat dan tenor untuk melihat simulasi.</p>
                )}
              </Card>
            </div>
          )}

          {/* BUYBACK */}
          {activeTab === "buyback" && (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card variant="glass" className="gradient-border">
                <h3 className="text-lg font-bold mb-6" style={{ color:"#2D1B00" }}>Simulasi Buyback</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm" style={{ color:"rgba(45,27,0,0.8)" }}>Berat Emas yang Dijual</label>
                      <span className="text-sm font-bold" style={{ color:"#8B6010" }}>{buybackGram} gram</span>
                    </div>
                    <input type="range" min={0.5} max={500} step={0.5} value={buybackGram}
                      onChange={e => setBuybackGram(+e.target.value)}
                      className="w-full accent-yellow-600 h-2 rounded-lg" />
                    <div className="flex justify-between text-xs mt-1" style={{ color:"rgba(101,67,14,0.55)" }}><span>0.5g</span><span>500g</span></div>
                  </div>
                  <div>
                    <label className="text-sm block mb-2" style={{ color:"rgba(45,27,0,0.8)" }}>Atau masukkan langsung</label>
                    <input type="number" min={0.5} max={10000} step={0.5} value={buybackGram}
                      onChange={e => setBuybackGram(Math.max(0.5, Number(e.target.value)))}
                      className="w-full input-gold rounded-xl px-4 py-2.5 text-sm" style={{ color:"#2D1B00" }} />
                  </div>
                </div>
              </Card>

              <Card variant="glass" className="gradient-border">
                <h3 className="text-lg font-bold mb-6" style={{ color:"#2D1B00" }}>Estimasi Penerimaan</h3>
                {loadingBuyback ? (
                  <p className="text-sm" style={{ color:"rgba(101,67,14,0.45)" }}>Memuat harga buyback...</p>
                ) : (
                  <div className="space-y-4">
                    {[
                      { label: "Berat Emas",         value: `${buybackGram} gram` },
                      { label: "Harga Buyback /gram", value: buybackPrice ? formatCurrency(buybackPrice) : "-" },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between py-3" style={{ borderBottom:"1px solid rgba(201,162,39,0.15)" }}>
                        <span className="text-sm" style={{ color:"rgba(45,27,0,0.8)" }}>{row.label}</span>
                        <span className="font-bold text-sm" style={{ color:"#2D1B00" }}>{row.value}</span>
                      </div>
                    ))}
                    <div className="p-4 rounded-xl" style={{ background:"rgba(201,162,39,0.08)", border:"1px solid rgba(201,162,39,0.2)" }}>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm" style={{ color:"#8B6010" }}>Dana Diterima</span>
                        <span className="text-2xl font-black text-gold-gradient">{buybackTotal ? formatCurrency(buybackTotal) : "-"}</span>
                      </div>
                      <p className="text-xs mt-2 text-center" style={{ color:"rgba(101,67,14,0.45)" }}>= Harga Buyback × {buybackGram} gram</p>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      <a href={`https://wa.me/${WA_ADMIN}?text=${buildBuybackMsg()}`} target="_blank" rel="noopener noreferrer"
                        style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"10px 8px", borderRadius:12, background:"rgba(37,211,102,0.08)", border:"1px solid rgba(37,211,102,0.25)", textDecoration:"none" }}>
                        <MessageCircle className="w-4 h-4" style={{ color:"#15803d" }} />
                        <span style={{ color:"#15803d", fontWeight:700, fontSize:".8rem" }}>Admin</span>
                        <span style={{ color:"rgba(101,67,14,0.45)", fontSize:".7rem" }}>0812-9753-3899</span>
                      </a>
                      <a href={`https://wa.me/${WA_PENGURUS}?text=${buildBuybackMsg()}`} target="_blank" rel="noopener noreferrer"
                        style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"10px 8px", borderRadius:12, background:"rgba(37,211,102,0.08)", border:"1px solid rgba(37,211,102,0.25)", textDecoration:"none" }}>
                        <MessageCircle className="w-4 h-4" style={{ color:"#15803d" }} />
                        <span style={{ color:"#15803d", fontWeight:700, fontSize:".8rem" }}>Pengurus</span>
                        <span style={{ color:"rgba(101,67,14,0.45)", fontSize:".7rem" }}>0882-1446-0345</span>
                      </a>
                    </div>
                    {isDemoMode() ? (
                      <a href={`https://wa.me/${WA_ADMIN}?text=${buildBuybackMsg()}`} target="_blank" rel="noopener noreferrer" style={{ display:"block" }}>
                        <Button variant="gold" fullWidth>Ajukan Buyback Sekarang</Button>
                      </a>
                    ) : (
                      <Link href="/auth/login" style={{ display:"block" }}>
                        <Button variant="gold" fullWidth>Ajukan Buyback Sekarang</Button>
                      </Link>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}

        </motion.div>
      </div>
    </section>
  );
}
