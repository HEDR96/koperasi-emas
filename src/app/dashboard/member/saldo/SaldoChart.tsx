"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

export default function SaldoChart({ data }: { data: { label:string; gold:number; value:number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top:5, right:10, left:0, bottom:0 }}>
        <defs>
          <linearGradient id="gradGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#C9A227" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#C9A227" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,162,39,0.1)" />
        <XAxis dataKey="label" stroke="rgba(101,67,14,0.3)" tick={{ fontSize:12 }} />
        <YAxis stroke="rgba(101,67,14,0.3)" tick={{ fontSize:11 }} tickFormatter={(v:any)=>`${v}g`} />
        <Tooltip contentStyle={{ background:"rgba(255,252,220,0.95)", border:"1px solid rgba(201,162,39,0.25)", borderRadius:10 }} labelStyle={{ color:"#2D1B00" }}
          formatter={(v:any) => [`${v}g`, "Total Emas"]} />
        <Area type="monotone" dataKey="gold" stroke="#C9A227" strokeWidth={2} fill="url(#gradGold)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
