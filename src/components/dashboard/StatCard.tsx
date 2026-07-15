"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color?: string;
  delay?: number;
}

export default function StatCard({ title, value, change, changeLabel, icon, color = "#D4AF37", delay = 0 }: StatCardProps) {
  const isUp = change !== undefined && change >= 0;

  return (
    <motion.div
      initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay }}
      className="card-hover"
      style={{
        background: "rgba(255,255,255,0.72)",
        border: "1px solid rgba(201,162,39,0.22)",
        borderRadius: 18, padding: "20px",
        backdropFilter: "blur(12px)",
        boxShadow: "0 4px 20px rgba(201,162,39,0.08)",
      }}
    >
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
        <p style={{ color:"rgba(101,67,14,0.6)", fontSize:".8rem", fontWeight:500 }}>{title}</p>
        <div style={{ width:40, height:40, borderRadius:11, background:"rgba(201,162,39,0.1)", display:"flex", alignItems:"center", justifyContent:"center", color }}>
          {icon}
        </div>
      </div>

      <p style={{ color:"#2D1B00", fontWeight:900, fontSize:"clamp(1.3rem,2.5vw,1.6rem)", marginBottom:8, lineHeight:1 }}>{value}</p>

      {change !== undefined && (
        <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:".78rem", fontWeight:600, color: isUp ? "#166534" : "#991b1b" }}>
          {isUp ? <TrendingUp style={{ width:13, height:13 }} /> : <TrendingDown style={{ width:13, height:13 }} />}
          {isUp ? "+" : ""}{change}%
          {changeLabel && <span style={{ color:"rgba(101,67,14,0.4)", fontWeight:400, marginLeft:2 }}>{changeLabel}</span>}
        </div>
      )}
    </motion.div>
  );
}
