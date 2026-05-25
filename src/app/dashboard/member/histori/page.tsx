"use client";

import { useState, useEffect } from "react";
import TransactionTable from "@/components/dashboard/TransactionTable";
import StatCard from "@/components/dashboard/StatCard";
import { TrendingUp, ArrowLeftRight, Coins, DollarSign } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

export default function HistoriPage() {
  const { user } = useAuthStore();
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await (supabase.from("transactions") as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      setTxs(data ?? []);
      setLoading(false);
    })();
  }, [user?.id]);

  const done = txs.filter(t => t.status === "completed");
  const totalBuy = txs.filter(t => t.type === "buy").length;
  const totalGold = done.reduce((a, b) => a + (b.gram || 0), 0);
  const totalAmt = done.reduce((a, b) => a + (b.amount || 0), 0);

  if (loading) return <div style={{ color:"rgba(255,255,255,0.3)", padding:40, textAlign:"center" }}>Memuat histori...</div>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:16 }}>
        <StatCard title="Total Transaksi" value={String(txs.length)} icon={<ArrowLeftRight style={{ width:20, height:20 }} />} color="#D4AF37" delay={0} />
        <StatCard title="Total Beli Emas" value={String(totalBuy)} icon={<TrendingUp style={{ width:20, height:20 }} />} color="#4ade80" delay={0.1} />
        <StatCard title="Volume Emas" value={`${totalGold.toFixed(1)}g`} icon={<Coins style={{ width:20, height:20 }} />} color="#60a5fa" delay={0.2} />
        <StatCard title="Total Nilai" value={`Rp ${(totalAmt/1000000).toFixed(1)}jt`} icon={<DollarSign style={{ width:20, height:20 }} />} color="#c084fc" delay={0.3} />
      </div>
      {txs.length === 0 ? (
        <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", padding:"60px 0" }}>Belum ada transaksi</div>
      ) : (
        <TransactionTable data={txs} title="Semua Histori Transaksi" showUser={false} />
      )}
    </div>
  );
}
