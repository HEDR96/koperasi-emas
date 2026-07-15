"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const DATA = [
  { bulan:"Jan", revenue:320, member:820 },
  { bulan:"Feb", revenue:410, member:940 },
  { bulan:"Mar", revenue:380, member:1020 },
  { bulan:"Apr", revenue:520, member:1180 },
  { bulan:"Mei", revenue:490, member:1340 },
  { bulan:"Jun", revenue:610, member:1520 },
  { bulan:"Jul", revenue:580, member:1680 },
  { bulan:"Ags", revenue:720, member:1890 },
  { bulan:"Sep", revenue:690, member:2050 },
  { bulan:"Okt", revenue:810, member:2240 },
  { bulan:"Nov", revenue:870, member:2480 },
  { bulan:"Des", revenue:950, member:2680 },
];

export default function StatistikCharts() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={DATA} margin={{ top:5, right:10, left:0, bottom:0 }}>
        <defs>
          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#C9A227" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#C9A227" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,162,39,0.1)" />
        <XAxis dataKey="bulan" stroke="rgba(101,67,14,0.3)" tick={{ fontSize:12 }} />
        <YAxis stroke="rgba(101,67,14,0.3)" tick={{ fontSize:12 }} />
        <Tooltip contentStyle={{ background:"rgba(255,252,220,0.95)", border:"1px solid rgba(201,162,39,0.25)", borderRadius:10 }} labelStyle={{ color:"#2D1B00" }} itemStyle={{ color:"rgba(101,67,14,0.75)" }} />
        <Legend wrapperStyle={{ color:"rgba(101,67,14,0.6)", fontSize:".8rem" }} />
        <Area type="monotone" dataKey="revenue" name="Revenue (juta)" stroke="#C9A227" strokeWidth={2} fill="url(#colorRev)" />
        <Area type="monotone" dataKey="member" name="Member Baru" stroke="#3b82f6" strokeWidth={2} fill="url(#colorMem)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
