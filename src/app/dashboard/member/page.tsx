"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Coins, TrendingUp, Wallet, Gift, ArrowRight, CreditCard, ArrowLeftRight, PiggyBank } from "lucide-react";
import Link from "next/link";
import StatCard from "@/components/dashboard/StatCard";
import TransactionTable from "@/components/dashboard/TransactionTable";
import { formatCurrency, formatGoldWeight } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useGoldStore } from "@/store/useGoldStore";
import { MOCK_CHART_DATA } from "@/lib/constants";

const MemberChart = dynamic(() => import("./MemberChart"), { ssr:false, loading:()=>(
  <div style={{ height:180, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.2)" }}>Memuat...</div>
)});

const MOCK_TRANSACTIONS = Array.from({ length: 10 }, (_, i) => ({
  id: `TX${String(i+3000).padStart(6,"0")}`,
  user: "Budi Santoso",
  type: ["buy","tabungan","cicilan","buyback","buy"][i%5] as any,
  gram: +((i+1)*0.5+0.1).toFixed(2),
  amount: (i+1)*490000+100000,
  status: ["completed","completed","pending","completed","processing"][i%5] as any,
  date: new Date(Date.now()-i*86400000).toISOString(),
}));

const CICILAN_ACTIVE = [
  { product:"Emas 10g Antam", paid:6, tenor:12, monthly:833000, nextDate:"2024-04-01" },
  { product:"Emas 5g UBS", paid:2, tenor:24, monthly:490000, nextDate:"2024-04-15" },
];

const QUICK_ACTIONS = [
  { label:"Beli Emas",  href:"/dashboard/member/beli",     icon:TrendingUp,   color:"#D4AF37", bg:"rgba(212,175,55,0.1)" },
  { label:"Buyback",    href:"/dashboard/member/buyback",  icon:ArrowLeftRight,color:"#4ade80", bg:"rgba(74,222,128,0.1)" },
  { label:"Cicilan",    href:"/dashboard/member/cicilan",  icon:CreditCard,   color:"#60a5fa", bg:"rgba(96,165,250,0.1)" },
  { label:"Simpanan",   href:"/dashboard/member/simpanan", icon:PiggyBank,    color:"#c084fc", bg:"rgba(192,132,252,0.1)" },
  { label:"Referral",   href:"/dashboard/member/referral", icon:Gift,         color:"#fb923c", bg:"rgba(251,146,60,0.1)" },
];

export default function MemberDashboardPage() {
  const { user } = useAuthStore();
  const { prices } = useGoldStore();
  const goldGrams = user?.balance?.gold || 125.5;
  const goldValue = goldGrams * prices.buybackMember;
  const rupiah    = user?.balance?.rupiah || 5000000;
  // Simpanan mock — akan diganti query real setelah tabel simpanan ada
  const simpananTotal = 5_200_000; // pokok 5jt + 1 bulan wajib 200k

  const chartData = MOCK_CHART_DATA.slice(0, 30).map(d => ({
    ...d, portfolio: goldGrams * d.price,
  }));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:16 }}>
        <StatCard title="Total Emas" value={`${goldGrams}g`} change={2.5} icon={<Coins style={{ width:20, height:20 }} />} color="#D4AF37" delay={0} />
        <StatCard title="Nilai Portfolio" value={`Rp ${(goldValue/1000000).toFixed(1)}jt`} change={1.8} icon={<TrendingUp style={{ width:20, height:20 }} />} color="#4ade80" delay={0.1} />
        <StatCard title="Total Simpanan" value={formatCurrency(simpananTotal)} icon={<PiggyBank style={{ width:20, height:20 }} />} color="#c084fc" delay={0.2} />
        <StatCard title="Harga Emas/g" value={formatCurrency(prices.buyMember)} change={0.3} icon={<Coins style={{ width:20, height:20 }} />} color="#fb923c" delay={0.3} />
      </div>

      {/* Chart + Quick Actions */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:20, alignItems:"start" }}>
        {/* Portfolio Chart */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
          style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:22, flex:1 }}>
          <h3 style={{ color:"#fff", fontWeight:700, marginBottom:4 }}>Nilai Portfolio 30 Hari</h3>
          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".78rem", marginBottom:16 }}>Pergerakan nilai emas kamu</p>
          <MemberChart data={chartData} />
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
          style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:18, minWidth:160 }}>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem", fontWeight:600, marginBottom:12, textTransform:"uppercase", letterSpacing:".08em" }}>Menu Cepat</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {QUICK_ACTIONS.map(a => {
              const Icon = a.icon;
              return (
                <Link key={a.label} href={a.href} style={{ textDecoration:"none" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:11, background:a.bg, cursor:"pointer", transition:"all .2s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity="0.8"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity="1"}>
                    <Icon style={{ width:15, height:15, color:a.color, flexShrink:0 }} />
                    <span style={{ color:"rgba(255,255,255,0.75)", fontSize:".82rem", fontWeight:500 }}>{a.label}</span>
                    <ArrowRight style={{ width:12, height:12, color:"rgba(255,255,255,0.2)", marginLeft:"auto" }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Active Cicilans */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:22 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
          <h3 style={{ color:"#fff", fontWeight:700 }}>Cicilan Aktif</h3>
          <Link href="/dashboard/member/cicilan" style={{ textDecoration:"none" }}>
            <span style={{ color:"#D4AF37", fontSize:".8rem", display:"flex", alignItems:"center", gap:4 }}>
              Lihat semua <ArrowRight style={{ width:12, height:12 }} />
            </span>
          </Link>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {CICILAN_ACTIVE.map((c, i) => {
            const pct = (c.paid/c.tenor)*100;
            return (
              <div key={i} style={{ background:"rgba(255,255,255,0.03)", borderRadius:14, padding:"14px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                  <div>
                    <p style={{ color:"#fff", fontSize:".85rem", fontWeight:600 }}>{c.product}</p>
                    <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".75rem" }}>Cicilan ke-{c.paid}/{c.tenor} · {formatCurrency(c.monthly)}/bln</p>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <p style={{ color:"#D4AF37", fontSize:".8rem", fontWeight:700 }}>{pct.toFixed(0)}%</p>
                    <p style={{ color:"rgba(251,146,60,0.8)", fontSize:".73rem" }}>Jatuh: {c.nextDate}</p>
                  </div>
                </div>
                <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:6, overflow:"hidden" }}>
                  <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ delay:0.6+i*0.1, duration:0.7 }}
                    style={{ height:"100%", background:"linear-gradient(90deg,#D4AF37,#F5D060)", borderRadius:6 }} />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Simpanan Banner */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.55 }}
        style={{ background:"linear-gradient(135deg, rgba(192,132,252,0.08), rgba(96,165,250,0.05))", border:"1px solid rgba(192,132,252,0.2)", borderRadius:18, padding:20, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:"rgba(192,132,252,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <PiggyBank style={{ width:20, height:20, color:"#c084fc" }} />
          </div>
          <div>
            <p style={{ color:"#fff", fontWeight:700, fontSize:".9rem" }}>Simpanan Koperasi</p>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem" }}>
              Pokok <strong style={{ color:"#D4AF37" }}>Rp 5.000.000</strong> · Wajib{" "}
              <strong style={{ color:"#60a5fa" }}>Rp 200.000/bln</strong> · Total:{" "}
              <strong style={{ color:"#c084fc" }}>{formatCurrency(simpananTotal)}</strong>
            </p>
          </div>
        </div>
        <Link href="/dashboard/member/simpanan" style={{ textDecoration:"none" }}>
          <button className="btn-outline-gold" style={{ padding:"9px 20px", borderRadius:11, cursor:"pointer", fontSize:".82rem", whiteSpace:"nowrap" }}>
            Lihat Simpanan
          </button>
        </Link>
      </motion.div>

      {/* Referral Banner */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}
        style={{ background:"linear-gradient(135deg, rgba(251,146,60,0.1), rgba(212,175,55,0.06))", border:"1px solid rgba(251,146,60,0.2)", borderRadius:18, padding:20, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:"rgba(251,146,60,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Gift style={{ width:20, height:20, color:"#fb923c" }} />
          </div>
          <div>
            <p style={{ color:"#fff", fontWeight:700, fontSize:".9rem" }}>Ajak Teman, Dapat Bonus!</p>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem" }}>Kode referral kamu: <strong style={{ color:"#fb923c" }}>{user?.referralCode || "KED-DEMO"}</strong> · Bonus Rp 50.000/referral</p>
          </div>
        </div>
        <Link href="/dashboard/member/referral" style={{ textDecoration:"none" }}>
          <button className="btn-gold" style={{ padding:"9px 20px", borderRadius:11, border:"none", cursor:"pointer", fontSize:".82rem", whiteSpace:"nowrap" }}>
            Program Referral
          </button>
        </Link>
      </motion.div>

      <TransactionTable data={MOCK_TRANSACTIONS} title="Transaksi Terbaru" showUser={false} />
    </div>
  );
}
