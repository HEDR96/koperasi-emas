"use client";

import TransactionTable from "@/components/dashboard/TransactionTable";
import StatCard from "@/components/dashboard/StatCard";
import { TrendingUp, ArrowLeftRight, Coins, DollarSign } from "lucide-react";

const MOCK_TXS = Array.from({ length: 30 }, (_, i) => ({
  id: `TX${String(i+5000).padStart(6,"0")}`,
  user: "Budi Santoso",
  type: ["buy","buyback","cicilan","tabungan"][i%4] as any,
  gram: +((i+1)*0.5).toFixed(2),
  amount: (i+1)*490000+50000,
  status: ["completed","completed","completed","pending","completed","rejected"][i%6] as any,
  date: new Date(Date.now()-i*86400000*2).toISOString(),
}));

export default function HistoriPage() {
  const totalBuy  = MOCK_TXS.filter(t=>t.type==="buy"&&t.status==="completed").length;
  const totalGold = MOCK_TXS.filter(t=>t.status==="completed").reduce((a,b)=>a+b.gram,0);
  const totalAmt  = MOCK_TXS.filter(t=>t.status==="completed").reduce((a,b)=>a+b.amount,0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:16 }}>
        <StatCard title="Total Transaksi" value={String(MOCK_TXS.length)} icon={<ArrowLeftRight style={{ width:20, height:20 }} />} color="#D4AF37" delay={0} />
        <StatCard title="Total Beli Emas" value={String(totalBuy)} icon={<TrendingUp style={{ width:20, height:20 }} />} color="#4ade80" delay={0.1} />
        <StatCard title="Total Volume Emas" value={`${totalGold.toFixed(1)}g`} icon={<Coins style={{ width:20, height:20 }} />} color="#60a5fa" delay={0.2} />
        <StatCard title="Total Nilai" value={`Rp ${(totalAmt/1000000).toFixed(1)}jt`} icon={<DollarSign style={{ width:20, height:20 }} />} color="#c084fc" delay={0.3} />
      </div>
      <TransactionTable data={MOCK_TXS} title="Semua Histori Transaksi" showUser={false} />
    </div>
  );
}
