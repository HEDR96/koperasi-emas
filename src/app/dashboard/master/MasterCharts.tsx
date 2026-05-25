"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const DATA = [
  { bulan:"Jan", pendapatan:320, transaksi:245 },
  { bulan:"Feb", pendapatan:410, transaksi:312 },
  { bulan:"Mar", pendapatan:380, transaksi:285 },
  { bulan:"Apr", pendapatan:520, transaksi:418 },
  { bulan:"Mei", pendapatan:490, transaksi:390 },
  { bulan:"Jun", pendapatan:610, transaksi:510 },
  { bulan:"Jul", pendapatan:580, transaksi:465 },
  { bulan:"Ags", pendapatan:720, transaksi:608 },
  { bulan:"Sep", pendapatan:690, transaksi:555 },
  { bulan:"Okt", pendapatan:810, transaksi:682 },
  { bulan:"Nov", pendapatan:870, transaksi:720 },
  { bulan:"Des", pendapatan:950, transaksi:810 },
];

export default function MasterCharts() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={DATA} margin={{ top:5, right:10, left:0, bottom:0 }}>
        <defs>
          <linearGradient id="colorRev2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="bulan" stroke="rgba(255,255,255,0.3)" tick={{ fontSize:12 }} />
        <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fontSize:12 }} />
        <Tooltip contentStyle={{ background:"#0f0f0f", border:"1px solid rgba(212,175,55,0.2)", borderRadius:10 }} labelStyle={{ color:"#fff" }} itemStyle={{ color:"rgba(255,255,255,0.7)" }} />
        <Legend wrapperStyle={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem" }} />
        <Area type="monotone" dataKey="pendapatan" name="Revenue (juta)" stroke="#D4AF37" strokeWidth={2} fill="url(#colorRev2)" />
        <Area type="monotone" dataKey="transaksi" name="Transaksi" stroke="#60a5fa" strokeWidth={2} fill="url(#colorTx)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
