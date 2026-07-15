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
            <stop offset="5%" stopColor="#C9A227" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#C9A227" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,162,39,0.1)" />
        <XAxis dataKey="bulan" stroke="rgba(101,67,14,0.3)" tick={{ fontSize:12 }} />
        <YAxis stroke="rgba(101,67,14,0.3)" tick={{ fontSize:12 }} />
        <Tooltip contentStyle={{ background:"rgba(255,252,220,0.95)", border:"1px solid rgba(201,162,39,0.25)", borderRadius:10 }} labelStyle={{ color:"#2D1B00" }} itemStyle={{ color:"rgba(101,67,14,0.75)" }} />
        <Legend wrapperStyle={{ color:"rgba(101,67,14,0.6)", fontSize:".8rem" }} />
        <Area type="monotone" dataKey="pendapatan" name="Revenue (juta)" stroke="#C9A227" strokeWidth={2} fill="url(#colorRev2)" />
        <Area type="monotone" dataKey="transaksi" name="Transaksi" stroke="#3b82f6" strokeWidth={2} fill="url(#colorTx)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
