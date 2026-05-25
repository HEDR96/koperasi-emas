"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface Props {
  data: { date: string; price: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#111", border:"1px solid rgba(212,175,55,0.25)", borderRadius:12, padding:"10px 14px" }}>
      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".72rem", marginBottom:4 }}>{label}</p>
      <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".9rem" }}>{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

export default function GoldChart({ data }: Props) {
  return (
    <div style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.07)" />
          <XAxis
            dataKey="date"
            tick={{ fill:"rgba(255,255,255,0.3)", fontSize:11 }}
            tickFormatter={v => v.slice(5)}
            axisLine={false} tickLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fill:"rgba(255,255,255,0.3)", fontSize:11 }}
            tickFormatter={v => `${(v/1000).toFixed(0)}K`}
            axisLine={false} tickLine={false}
            domain={["auto","auto"]}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#D4AF37"
            strokeWidth={2.5}
            fill="url(#goldFill)"
            dot={false}
            activeDot={{ r: 5, fill:"#F5D060", stroke:"#D4AF37", strokeWidth:2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
