"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

export default function SaldoChart({ data }: { data: { label:string; gold:number; value:number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top:5, right:10, left:0, bottom:0 }}>
        <defs>
          <linearGradient id="gradGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" tick={{ fontSize:12 }} />
        <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize:11 }} tickFormatter={(v:any)=>`${v}g`} />
        <Tooltip contentStyle={{ background:"#0f0f0f", border:"1px solid rgba(212,175,55,0.2)", borderRadius:10 }} labelStyle={{ color:"#fff" }}
          formatter={(v:any) => [`${v}g`, "Total Emas"]} />
        <Area type="monotone" dataKey="gold" stroke="#D4AF37" strokeWidth={2} fill="url(#gradGold)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
