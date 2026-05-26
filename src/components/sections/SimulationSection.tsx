"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatGoldWeight } from "@/lib/utils";
import { useGoldStore } from "@/store/useGoldStore";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { Calculator, TrendingUp, PiggyBank, ArrowLeftRight } from "lucide-react";

type SimType = "cicilan" | "investasi" | "tabungan" | "buyback";

const TABS: { id: SimType; label: string; icon: any }[] = [
  { id: "cicilan", label: "Cicilan Emas", icon: Calculator },
  { id: "investasi", label: "Investasi", icon: TrendingUp },
  { id: "tabungan", label: "Tabungan Emas", icon: PiggyBank },
  { id: "buyback", label: "Buyback", icon: ArrowLeftRight },
];

export default function SimulationSection() {
  const [activeTab, setActiveTab] = useState<SimType>("cicilan");
  const { prices } = useGoldStore();

  // Cicilan state
  const [cicilanGram, setCicilanGram] = useState(5);
  const [cicilanTenor, setCicilanTenor] = useState(12);
  const [cicilanDpPercent, setCicilanDpPercent] = useState(20);

  // Investasi state
  const [investAwal, setInvestAwal] = useState(1000000);
  const [investBulanan, setInvestBulanan] = useState(500000);
  const [investTahun, setInvestTahun] = useState(3);

  // Tabungan state
  const [tabunganHarian, setTabunganHarian] = useState(50000);
  const [tabunganBulan, setTabunganBulan] = useState(24);

  // Buyback state
  const [buybackGram, setBuybackGram] = useState(10);

  // Cicilan calculations
  const cicilanTotal = cicilanGram * prices.buyMember;
  const cicilanDp = (cicilanTotal * cicilanDpPercent) / 100;
  const cicilanSisa = cicilanTotal - cicilanDp;
  const cicilanBulanan = cicilanSisa / cicilanTenor;

  // Investasi calculations
  const investChartData = Array.from({ length: investTahun }, (_, i) => {
    const tahunKe = i + 1;
    const totalInvest = investAwal + investBulanan * 12 * tahunKe;
    const growthRate = 0.08; // 8% per year estimated
    const nilai = investAwal * Math.pow(1 + growthRate, tahunKe) +
      investBulanan * 12 * ((Math.pow(1 + growthRate, tahunKe) - 1) / growthRate);
    return {
      tahun: `Tahun ${tahunKe}`,
      modal: totalInvest,
      nilai: Math.round(nilai),
    };
  });

  // Tabungan calculations
  const tabunganTotal = tabunganHarian * 30 * tabunganBulan;
  const tabunganGram = tabunganTotal / prices.buyMember;

  // Buyback calculations
  const buybackTotal = buybackGram * prices.buybackMember;

  return (
    <section id="simulasi" className="py-20 lg:py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0900]/50 to-black" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="gold" className="mb-4">Kalkulator Interaktif</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
            Simulasi <span className="text-gold-gradient">Investasi Emas</span>
          </h2>
          <p className="text-white/80 max-w-xl mx-auto">
            Hitung estimasi cicilan, keuntungan investasi, dan nilai buyback emas Anda.
          </p>
        </motion.div>

        {/* Tab Selector */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? "btn-gold text-black"
                    : "glass-dark text-white/80 hover:text-white border border-white/10 hover:border-yellow-500/30"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* CICILAN */}
          {activeTab === "cicilan" && (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card variant="glass" className="gradient-border">
                <h3 className="text-lg font-bold text-white mb-6">Parameter Cicilan</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-white/80">Berat Emas</label>
                      <span className="text-sm font-bold text-yellow-400">{cicilanGram} gram</span>
                    </div>
                    <input type="range" min={1} max={100} value={cicilanGram}
                      onChange={(e) => setCicilanGram(+e.target.value)}
                      className="w-full accent-yellow-400 h-2 rounded-lg" />
                    <div className="flex justify-between text-xs text-white/55 mt-1"><span>1g</span><span>100g</span></div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-white/80">Tenor</label>
                      <span className="text-sm font-bold text-yellow-400">{cicilanTenor} bulan</span>
                    </div>
                    <input type="range" min={3} max={36} step={3} value={cicilanTenor}
                      onChange={(e) => setCicilanTenor(+e.target.value)}
                      className="w-full accent-yellow-400 h-2 rounded-lg" />
                    <div className="flex justify-between text-xs text-white/55 mt-1"><span>3 bln</span><span>36 bln</span></div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-white/80">Uang Muka</label>
                      <span className="text-sm font-bold text-yellow-400">{cicilanDpPercent}%</span>
                    </div>
                    <input type="range" min={20} max={80} step={5} value={cicilanDpPercent}
                      onChange={(e) => setCicilanDpPercent(+e.target.value)}
                      className="w-full accent-yellow-400 h-2 rounded-lg" />
                    <div className="flex justify-between text-xs text-white/55 mt-1"><span>20%</span><span>80%</span></div>
                  </div>
                </div>
              </Card>

              <Card variant="glass" className="gradient-border">
                <h3 className="text-lg font-bold text-white mb-6">Hasil Simulasi</h3>
                <div className="space-y-4">
                  {[
                    { label: "Harga Emas", value: formatCurrency(cicilanTotal) },
                    { label: "Uang Muka (DP)", value: formatCurrency(cicilanDp), highlight: true },
                    { label: "Sisa Pembayaran", value: formatCurrency(cicilanSisa) },
                    { label: "Tenor", value: `${cicilanTenor} bulan` },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between py-3 border-b border-white/5">
                      <span className="text-white/80 text-sm">{row.label}</span>
                      <span className={`font-bold text-sm ${row.highlight ? "text-yellow-400" : "text-white"}`}>{row.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2">
                    <span className="text-white font-semibold">Cicilan per Bulan</span>
                    <span className="text-2xl font-black text-gold-gradient">{formatCurrency(cicilanBulanan)}</span>
                  </div>
                  <div className="mt-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center font-medium">
                    0% Bunga untuk Member Aktif ✓
                  </div>
                  <Link href="/auth/register" style={{ display:"block" }}>
                    <Button variant="gold" fullWidth>Ajukan Cicilan Sekarang</Button>
                  </Link>
                </div>
              </Card>
            </div>
          )}

          {/* INVESTASI */}
          {activeTab === "investasi" && (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card variant="glass" className="gradient-border">
                <h3 className="text-lg font-bold text-white mb-6">Parameter Investasi</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-white/80">Modal Awal</label>
                      <span className="text-sm font-bold text-yellow-400">{formatCurrency(investAwal)}</span>
                    </div>
                    <input type="range" min={100000} max={10000000} step={100000} value={investAwal}
                      onChange={(e) => setInvestAwal(+e.target.value)}
                      className="w-full accent-yellow-400 h-2 rounded-lg" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-white/80">Investasi Bulanan</label>
                      <span className="text-sm font-bold text-yellow-400">{formatCurrency(investBulanan)}</span>
                    </div>
                    <input type="range" min={100000} max={5000000} step={100000} value={investBulanan}
                      onChange={(e) => setInvestBulanan(+e.target.value)}
                      className="w-full accent-yellow-400 h-2 rounded-lg" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-white/80">Jangka Waktu</label>
                      <span className="text-sm font-bold text-yellow-400">{investTahun} tahun</span>
                    </div>
                    <input type="range" min={1} max={10} value={investTahun}
                      onChange={(e) => setInvestTahun(+e.target.value)}
                      className="w-full accent-yellow-400 h-2 rounded-lg" />
                  </div>
                </div>
              </Card>

              <Card variant="glass" className="gradient-border">
                <h3 className="text-lg font-bold text-white mb-4">Proyeksi Nilai Investasi</h3>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={investChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.08)" />
                      <XAxis dataKey="tahun" tick={{ fill: "rgba(255,255,255,0.70)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "rgba(255,255,255,0.70)", fontSize: 10 }} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v: any) => formatCurrency(Number(v))} contentStyle={{ background: "#0a0a0a", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "12px", color: "white" }} />
                      <Bar dataKey="modal" name="Modal" fill="rgba(212,175,55,0.3)" radius={[4,4,0,0]} />
                      <Bar dataKey="nilai" name="Estimasi Nilai" fill="#D4AF37" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
                  <p className="text-yellow-400 text-xs mb-1">Estimasi Nilai Akhir</p>
                  <p className="text-2xl font-black text-gold-gradient">
                    {formatCurrency(investChartData[investChartData.length - 1]?.nilai || 0)}
                  </p>
                  <p className="text-white/55 text-xs mt-1">*Estimasi berdasarkan historis kenaikan emas 8%/tahun</p>
                </div>
              </Card>
            </div>
          )}

          {/* TABUNGAN */}
          {activeTab === "tabungan" && (
            <div className="grid lg:grid-cols-2 gap-6">
              <Card variant="glass" className="gradient-border">
                <h3 className="text-lg font-bold text-white mb-6">Parameter Tabungan</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-white/80">Tabungan Harian</label>
                      <span className="text-sm font-bold text-yellow-400">{formatCurrency(tabunganHarian)}</span>
                    </div>
                    <input type="range" min={5000} max={500000} step={5000} value={tabunganHarian}
                      onChange={(e) => setTabunganHarian(+e.target.value)}
                      className="w-full accent-yellow-400 h-2 rounded-lg" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-white/80">Durasi Menabung</label>
                      <span className="text-sm font-bold text-yellow-400">{tabunganBulan} bulan</span>
                    </div>
                    <input type="range" min={1} max={60} value={tabunganBulan}
                      onChange={(e) => setTabunganBulan(+e.target.value)}
                      className="w-full accent-yellow-400 h-2 rounded-lg" />
                  </div>
                </div>
              </Card>
              <Card variant="glass" className="gradient-border">
                <h3 className="text-lg font-bold text-white mb-6">Hasil Tabungan</h3>
                <div className="space-y-4">
                  {[
                    { label: "Total Tabungan", value: formatCurrency(tabunganTotal) },
                    { label: "Emas Terkumpul", value: formatGoldWeight(tabunganGram) },
                    { label: "Nilai Emas Saat Ini", value: formatCurrency(tabunganGram * prices.buyMember) },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between py-3 border-b border-white/5">
                      <span className="text-white/80 text-sm">{row.label}</span>
                      <span className="font-bold text-sm text-white">{row.value}</span>
                    </div>
                  ))}
                  <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
                    <p className="text-yellow-400 font-black text-2xl">{formatGoldWeight(tabunganGram)}</p>
                    <p className="text-white/70 text-sm">Emas yang Anda kumpulkan</p>
                  </div>
                  <Link href="/auth/register" style={{ display:"block" }}>
                    <Button variant="gold" fullWidth>Mulai Tabungan Emas</Button>
                  </Link>
                </div>
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
                    <input type="range" min={0.1} max={500} step={0.1} value={buybackGram}
                      onChange={(e) => setBuybackGram(+e.target.value)}
                      className="w-full accent-yellow-400 h-2 rounded-lg" />
                  </div>
                </div>
              </Card>
              <Card variant="glass" className="gradient-border">
                <h3 className="text-lg font-bold text-white mb-6">Estimasi Penerimaan</h3>
                <div className="space-y-4">
                  {[
                    { label: "Berat Emas", value: `${buybackGram} gram` },
                    { label: "Harga Buyback Member", value: formatCurrency(prices.buybackMember) + "/g" },
                    { label: "Harga Buyback Non-Member", value: formatCurrency(prices.buybackNonMember) + "/g" },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between py-3 border-b border-white/5">
                      <span className="text-white/80 text-sm">{row.label}</span>
                      <span className="font-bold text-sm text-white">{row.value}</span>
                    </div>
                  ))}
                  <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-400 font-semibold">Dana Diterima (Member)</span>
                      <span className="text-2xl font-black text-gold-gradient">{formatCurrency(buybackTotal)}</span>
                    </div>
                    <p className="text-green-400 text-xs mt-2 text-center">Selisih +{formatCurrency((prices.buybackMember - prices.buybackNonMember) * buybackGram)} vs Non-Member</p>
                  </div>
                  <Link href="/auth/login" style={{ display:"block" }}>
                    <Button variant="gold" fullWidth>Ajukan Buyback Sekarang</Button>
                  </Link>
                </div>
              </Card>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
