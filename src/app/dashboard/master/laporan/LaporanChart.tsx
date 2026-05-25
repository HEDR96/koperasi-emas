"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

export default function LaporanChart({ data }: { data: { bulan:string; revenue:number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top:5, right:10, left:0, bottom:0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="bulan" stroke="rgba(255,255,255,0.3)" tick={{ fontSize:12 }} />
        <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize:11 }} tickFormatter={(v:any) => `${(v/1000000).toFixed(0)}jt`} />
        <Tooltip contentStyle={{ background:"#0f0f0f", border:"1px solid rgba(212,175,55,0.2)", borderRadius:10 }} labelStyle={{ color:"#fff" }}
          formatter={(v:any) => [formatCurrency(Number(v)), "Revenue"]} />
        <Bar dataKey="revenue" fill="#D4AF37" radius={[6,6,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
