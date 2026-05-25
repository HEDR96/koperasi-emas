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
        background: "rgba(14,14,14,0.8)",
        border: "1px solid rgba(212,175,55,0.15)",
        borderRadius: 18, padding: "20px",
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
        <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".8rem", fontWeight:500 }}>{title}</p>
        <div style={{ width:40, height:40, borderRadius:11, background:"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", color }}>
          {icon}
        </div>
      </div>

      <p style={{ color:"#fff", fontWeight:900, fontSize:"clamp(1.3rem,2.5vw,1.6rem)", marginBottom:8, lineHeight:1 }}>{value}</p>

      {change !== undefined && (
        <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:".78rem", fontWeight:600, color: isUp ? "#4ade80" : "#f87171" }}>
          {isUp ? <TrendingUp style={{ width:13, height:13 }} /> : <TrendingDown style={{ width:13, height:13 }} />}
          {isUp ? "+" : ""}{change}%
          {changeLabel && <span style={{ color:"rgba(255,255,255,0.3)", fontWeight:400, marginLeft:2 }}>{changeLabel}</span>}
        </div>
      )}
    </motion.div>
  );
}
