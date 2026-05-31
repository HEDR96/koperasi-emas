"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Calculator, ArrowLeftRight, MessageCircle, X, Phone } from "lucide-react";

type SimType = "cicilan" | "buyback";

const TABS: { id: SimType; label: string; icon: any }[] = [
  { id: "cicilan", label: "Cicilan Emas", icon: Calculator },
  { id: "buyback", label: "Buyback", icon: ArrowLeftRight },
];

const WA_ADMIN    = "6281297533899";
const WA_PENGURUS = "6288214460345";

interface CicilanHarga {
  id: number;
  gram: number;
  tenor: number;
  harga_jual: number;
  angsuran: number;
  uang_muka_persen: number;
}

export default function SimulationSection() {
  const [activeTab, setActiveTab] = useState<SimType>("cicilan");

  // Cicilan state
  const [cicilanPlans, setCicilanPlans]   = useState<CicilanHarga[]>([]);
  const [selectedGram, setSelectedGram]   = useState<number | null>(null);
  const [selectedTenor, setSelectedTenor] = useState<number | null>(null);
  const [showWAModal, setShowWAModal]     = useState(false);
  const [loadingCicilan, setLoadingCicilan] = useState(true);

  // Buyback state
  const [buybackGram, setBuybackGram]       = useState(10);
  const [buybackPrice, setBuybackPrice]     = useState(0);
  const [loadingBuyback, setLoadingBuyback] = useState(true);

  // Load cicilan plans from DB
  useEffect(() => {
    (async () => {
      setLoadingCicilan(true);
      try {
        const { data } = await (supabase.from("cicilan_harga") as any)
          .select("*")
          .order("gram", { ascending: true })
          .order("tenor", { ascending: true });
        if (data?.length) {
          setCicilanPlans(data.map((d: any) => ({ ...d, gram: Number(d.gram) })));
          setSelectedGram(Number(data[0].gram));
          setSelectedTenor(data[0].tenor);
        }
      } catch {}
      setLoadingCicilan(false);
    })();
  }, []);

  // Load buyback price from DB (1 gram baseline)
  useEffect(() => {
    (async () => {
      setLoadingBuyback(true);
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

  const uangMuka = selectedPlan
    ? Math.round(selectedPlan.harga_jual * (selectedPlan.uang_muka_persen / 100))
    : 0;

  function buildWAMessage() {
    if (!selectedPlan) return "";
    const msg = [
      "Halo, saya ingin mengajukan cicilan emas:",
      `• Berat: ${selectedPlan.gram} gram`,
      `• Harga Jual: ${formatCurrency(selectedPlan.harga_jual)}`,
      `• Tenor: ${selectedPlan.tenor} bulan`,
      `• Uang Muka (${selectedPlan.uang_muka_persen}%): ${formatCurrency(uangMuka)}`,
      `• Angsuran/bulan: ${formatCurrency(selectedPlan.angsuran)}`,
      "",
      "Mohon info lebih lanjut. Terima kasih."
    ].join("\n");
    return encodeURIComponent(msg);
  }

  const buybackTotal = Math.round(buybackPrice * buybackGram);

  return (
    <section id="simulasi" className="py-20 lg:py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0900]/50 to-black" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} className="text-center mb-12">
          <Badge variant="gold" className="mb-4">Kalkulator Interaktif</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
            Simulasi <span className="text-gold-gradient">Cicilan & Buyback</span>
          </h2>
          <p className="text-white/80 max-w-xl mx-auto">
            Cek estimasi cicilan emas dan nilai buyback Anda.
          </p>
        </motion.div>

        {/* Tab Selector */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === tab.id ? "btn-gold text-black" : "glass-dark text-white/80 hover:text-white border border-white/10 hover:border-yellow-500/30"
                }`}>
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <motion.div key={activeTab} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>

          {/* CICILAN */}
          {activeTab === "cicilan" && (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card variant="glass" className="gradient-border">
                <h3 className="text-lg font-bold text-white mb-6">Pilih Paket Cicilan</h3>
                {loadingCicilan ? (
                  <p className="text-white/40 text-sm">Memuat paket cicilan...</p>
                ) : cicilanPlans.length === 0 ? (
                  <p className="text-white/40 text-sm">Paket cicilan belum tersedia. Hubungi admin untuk informasi lebih lanjut.</p>
                ) : (
                  <div className="space-y-5">
                    {/* Pilih gram */}
                    <div>
                      <label className="text-sm text-white/70 block mb-2">Berat Emas</label>
                      <div className="flex flex-wrap gap-2">
                        {availableGrams.map(g => (
                          <button key={g} onClick={() => { setSelectedGram(g); setSelectedTenor(cicilanPlans.find(p => p.gram === g)?.tenor ?? null); }}
                            style={{ padding:"7px 16px", borderRadius:10, fontSize:".85rem", fontWeight:600, cursor:"pointer", border: selectedGram === g ? "1px solid #D4AF37" : "1px solid rgba(255,255,255,0.12)", background: selectedGram === g ? "rgba(212,175,55,0.18)" : "rgba(255,255,255,0.04)", color: selectedGram === g ? "#D4AF37" : "rgba(255,255,255,0.6)" }}>
                            {g % 1 === 0 ? g : g.toFixed(1)} gram
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pilih tenor */}
                    {selectedGram && availableTenors.length > 0 && (
                      <div>
                        <label className="text-sm text-white/70 block mb-2">Tenor (bulan)</label>
                        <div className="flex flex-wrap gap-2">
                          {availableTenors.map(t => (
                            <button key={t} onClick={() => setSelectedTenor(t)}
                              style={{ padding:"7px 16px", borderRadius:10, fontSize:".85rem", fontWeight:600, cursor:"pointer", border: selectedTenor === t ? "1px solid #D4AF37" : "1px solid rgba(255,255,255,0.12)", background: selectedTenor === t ? "rgba(212,175,55,0.18)" : "rgba(255,255,255,0.04)", color: selectedTenor === t ? "#D4AF37" : "rgba(255,255,255,0.6)" }}>
                              {t} bulan
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              <Card variant="glass" className="gradient-border">
                <h3 className="text-lg font-bold text-white mb-6">Hasil Simulasi</h3>
                {selectedPlan ? (
                  <div className="space-y-4">
                    {[
                      { label: "Berat Emas",       value: `${selectedPlan.gram} gram` },
                      { label: "Harga Jual",        value: formatCurrency(selectedPlan.harga_jual) },
                      { label: `Uang Muka (${selectedPlan.uang_muka_persen}%)`, value: formatCurrency(uangMuka), highlight: true },
                      { label: "Tenor",             value: `${selectedPlan.tenor} bulan` },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between py-3 border-b border-white/5">
                        <span className="text-white/80 text-sm">{row.label}</span>
                        <span className={`font-bold text-sm ${row.highlight ? "text-yellow-400" : "text-white"}`}>{row.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2">
                      <span className="text-white font-semibold">Angsuran / Bulan</span>
                      <span className="text-2xl font-black text-gold-gradient">{formatCurrency(selectedPlan.angsuran)}</span>
                    </div>
                    <div className="mt-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center font-medium">
                      Tanpa bunga untuk anggota aktif ✓
                    </div>
                    <button onClick={() => setShowWAModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm btn-gold">
                      <MessageCircle className="w-4 h-4" />
                      Ajukan Cicilan via WhatsApp
                    </button>
                  </div>
                ) : (
                  <p className="text-white/40 text-sm">Pilih berat dan tenor untuk melihat simulasi.</p>
                )}
              </Card>
            </div>
          )}

          {/* BUYBACK */}
          {activeTab === "buyback" && (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card variant="glass" className="gradient-border">
                <h3 className="text-lg font-bold text-white mb-6">Simulasi Buyback</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-white/80">Berat Emas yang Dijual</label>
                      <span className="text-sm font-bold text-yellow-400">{buybackGram} gram</span>
                    </div>
                    <input type="range" min={1} max={500} step={1} value={buybackGram}
                      onChange={e => setBuybackGram(+e.target.value)}
                      className="w-full accent-yellow-400 h-2 rounded-lg" />
                    <div className="flex justify-between text-xs text-white/55 mt-1"><span>1g</span><span>500g</span></div>
                  </div>
                  <div>
                    <label className="text-sm text-white/80 block mb-2">Atau masukkan langsung</label>
                    <input type="number" min={1} max={10000} value={buybackGram}
                      onChange={e => setBuybackGram(Math.max(1, Number(e.target.value)))}
                      className="w-full input-gold rounded-xl px-4 py-2.5 text-sm text-white" />
                  </div>
                </div>
              </Card>

              <Card variant="glass" className="gradient-border">
                <h3 className="text-lg font-bold text-white mb-6">Estimasi Penerimaan</h3>
                {loadingBuyback ? (
                  <p className="text-white/40 text-sm">Memuat harga buyback...</p>
                ) : (
                  <div className="space-y-4">
                    {[
                      { label: "Berat Emas",         value: `${buybackGram} gram` },
                      { label: "Harga Buyback /gram", value: buybackPrice ? formatCurrency(buybackPrice) : "-" },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between py-3 border-b border-white/5">
                        <span className="text-white/80 text-sm">{row.label}</span>
                        <span className="font-bold text-sm text-white">{row.value}</span>
                      </div>
                    ))}
                    <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                      <div className="flex justify-between items-center">
                        <span className="text-yellow-400 font-semibold text-sm">Dana Diterima</span>
                        <span className="text-2xl font-black text-gold-gradient">{buybackTotal ? formatCurrency(buybackTotal) : "-"}</span>
                      </div>
                      <p className="text-white/40 text-xs mt-2 text-center">= Harga Buyback × {buybackGram} gram</p>
                    </div>
                    <Link href="/auth/login" style={{ display:"block" }}>
                      <Button variant="gold" fullWidth>Ajukan Buyback Sekarang</Button>
                    </Link>
                  </div>
                )}
              </Card>
            </div>
          )}

        </motion.div>
      </div>

      {/* WhatsApp Modal */}
      <AnimatePresence>
        {showWAModal && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setShowWAModal(false)}
              style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:1000 }} />
            <motion.div
              initial={{ opacity:0, scale:.9, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:.9, y:20 }}
              style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:1001, width:"min(420px,92vw)", background:"rgba(14,14,14,0.98)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:20, padding:28 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                <h3 style={{ color:"#fff", fontWeight:700, fontSize:"1.1rem", margin:0 }}>Pilih Kontak Tujuan</h3>
                <button onClick={() => setShowWAModal(false)}
                  style={{ background:"rgba(255,255,255,0.07)", border:"none", borderRadius:8, width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.5)", cursor:"pointer" }}>
                  <X style={{ width:16, height:16 }} />
                </button>
              </div>
              <p style={{ color:"rgba(255,255,255,0.55)", fontSize:".85rem", marginBottom:20 }}>
                Kirim pesan cicilan via WhatsApp ke:
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <a href={`https://wa.me/${WA_ADMIN}?text=${buildWAMessage()}`} target="_blank" rel="noopener noreferrer"
                  onClick={() => setShowWAModal(false)}
                  style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", borderRadius:14, background:"rgba(37,211,102,0.1)", border:"1px solid rgba(37,211,102,0.3)", textDecoration:"none", transition:"all .2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(37,211,102,0.18)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(37,211,102,0.1)"}
                >
                  <div style={{ width:40, height:40, borderRadius:11, background:"rgba(37,211,102,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Phone style={{ width:18, height:18, color:"#25d366" }} />
                  </div>
                  <div>
                    <p style={{ color:"#fff", fontWeight:700, fontSize:".9rem", margin:0 }}>Admin</p>
                    <p style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", margin:0 }}>0812-9753-3899</p>
                  </div>
                </a>
                <a href={`https://wa.me/${WA_PENGURUS}?text=${buildWAMessage()}`} target="_blank" rel="noopener noreferrer"
                  onClick={() => setShowWAModal(false)}
                  style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 18px", borderRadius:14, background:"rgba(37,211,102,0.1)", border:"1px solid rgba(37,211,102,0.3)", textDecoration:"none", transition:"all .2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(37,211,102,0.18)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(37,211,102,0.1)"}
                >
                  <div style={{ width:40, height:40, borderRadius:11, background:"rgba(37,211,102,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Phone style={{ width:18, height:18, color:"#25d366" }} />
                  </div>
                  <div>
                    <p style={{ color:"#fff", fontWeight:700, fontSize:".9rem", margin:0 }}>Pengurus</p>
                    <p style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", margin:0 }}>0882-1446-0345</p>
                  </div>
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
