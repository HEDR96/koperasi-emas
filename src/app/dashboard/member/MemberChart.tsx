"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/utils";

export default function MemberChart({ data }: { data: { date:string; portfolio:number }[] }) {
  const sliced = data.slice(0, 30).map((d, i) => ({
    label: new Date(d.date).toLocaleDateString("id-ID",{day:"2-digit",month:"short"}),
    value: d.portfolio,
  }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={sliced} margin={{ top:5, right:5, left:0, bottom:0 }}>
        <defs>
          <linearGradient id="gradPort" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="label" stroke="rgba(255,255,255,0.2)" tick={{ fontSize:10 }} interval={6} />
        <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize:10 }} tickFormatter={(v:any)=>`${(v/1000000).toFixed(0)}jt`} />
        <Tooltip contentStyle={{ background:"#0f0f0f", border:"1px solid rgba(212,175,55,0.2)", borderRadius:10 }} labelStyle={{ color:"#fff", fontSize:".75rem" }}
          formatter={(v:any) => [formatCurrency(Number(v)), "Nilai"]} />
        <Area type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={2} fill="url(#gradPort)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
