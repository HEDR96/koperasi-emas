"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Filter, Search, Shield, User, Settings, Coins } from "lucide-react";

type ActionType = "login" | "update" | "delete" | "create" | "approve";

const LOGS = Array.from({ length: 30 }, (_, i) => {
  const actors = ["Super Admin", "Admin Rini", "Admin Dodi", "System"];
  const actions: { action: ActionType; desc: string; icon: any; color: string }[] = [
    { action:"login", desc:"Login ke sistem", icon:User, color:"#60a5fa" },
    { action:"update", desc:"Update harga emas menjadi Rp 1.030.000/g", icon:Settings, color:"#D4AF37" },
    { action:"approve", desc:"Approve transaksi TX00"+String(i+1).padStart(3,"0"), icon:Shield, color:"#4ade80" },
    { action:"create", desc:"Buat promo baru: Cashback Eid", icon:Coins, color:"#c084fc" },
    { action:"delete", desc:"Hapus data promo kadaluarsa", icon:Activity, color:"#f87171" },
  ];
  const act = actions[i % actions.length];
  return {
    id: `LOG${String(i+1).padStart(5,"0")}`,
    actor: actors[i%actors.length],
    action: act.action,
    desc: act.desc,
    icon: act.icon,
    color: act.color,
    ip: `192.168.${Math.floor(i/5)+1}.${(i%5)+10}`,
    time: new Date(Date.now() - i * 900000).toISOString(),
  };
});

const ACTION_LABELS: Record<ActionType, string> = {
  login:"Login", update:"Update", delete:"Hapus", create:"Buat", approve:"Approve",
};

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<"all"|ActionType>("all");

  const filtered = LOGS.filter(l => {
    const matchSearch = l.actor.toLowerCase().includes(search.toLowerCase()) || l.desc.toLowerCase().includes(search.toLowerCase());
    const matchAction = filterAction === "all" || l.action === filterAction;
    return matchSearch && matchAction;
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Header Controls */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"7px 12px", flex:1, minWidth:200 }}>
            <Search style={{ width:14, height:14, color:"rgba(255,255,255,0.3)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari log..."
              style={{ background:"none", border:"none", outline:"none", color:"rgba(255,255,255,0.7)", fontSize:".82rem", width:"100%" }} />
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <Filter style={{ width:14, height:14, color:"rgba(255,255,255,0.3)" }} />
            {(["all","login","update","create","approve","delete"] as const).map(f => (
              <button key={f} onClick={() => setFilterAction(f)}
                style={{ padding:"5px 12px", borderRadius:20, border:"1px solid", fontSize:".75rem", fontWeight:600, cursor:"pointer", transition:"all .2s",
                  borderColor: filterAction===f?"#D4AF37":"rgba(255,255,255,0.1)",
                  background: filterAction===f?"rgba(212,175,55,0.12)":"transparent",
                  color: filterAction===f?"#D4AF37":"rgba(255,255,255,0.35)" }}>
                {f==="all"?"Semua":ACTION_LABELS[f]}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Log Timeline */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24 }}>
        <h3 style={{ color:"#fff", fontWeight:700, marginBottom:20 }}>Activity Log <span style={{ color:"rgba(255,255,255,0.3)", fontWeight:400, fontSize:".85rem" }}>({filtered.length} entri)</span></h3>
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {filtered.slice(0, 20).map((log, i) => {
            const Icon = log.icon;
            return (
              <motion.div key={log.id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.02 }}
                style={{ display:"flex", gap:14, padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.04)", position:"relative" }}>
                {/* Timeline line */}
                {i < filtered.slice(0,20).length - 1 && (
                  <div style={{ position:"absolute", left:19, top:44, bottom:0, width:2, background:"rgba(255,255,255,0.05)", zIndex:0 }} />
                )}
                <div style={{ width:38, height:38, borderRadius:11, background:`rgba(255,255,255,0.04)`, border:`1px solid rgba(255,255,255,0.08)`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, zIndex:1 }}>
                  <Icon style={{ width:16, height:16, color:log.color }} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:6 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ color:"#fff", fontSize:".84rem", fontWeight:600 }}>{log.actor}</span>
                      <span style={{ background:`${log.color}18`, color:log.color, borderRadius:6, padding:"2px 8px", fontSize:".7rem", fontWeight:700 }}>
                        {ACTION_LABELS[log.action]}
                      </span>
                    </div>
                    <span style={{ color:"rgba(255,255,255,0.25)", fontSize:".72rem" }}>
                      {new Date(log.time).toLocaleString("id-ID", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}
                    </span>
                  </div>
                  <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".8rem", marginTop:2 }}>{log.desc}</p>
                  <p style={{ color:"rgba(255,255,255,0.2)", fontSize:".72rem", marginTop:2 }}>IP: {log.ip} · {log.id}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
        {filtered.length > 20 && (
          <div style={{ textAlign:"center", paddingTop:16 }}>
            <button className="btn-outline-gold" style={{ padding:"8px 20px", borderRadius:10, cursor:"pointer", fontSize:".82rem" }}>
              Muat lebih banyak ({filtered.length - 20} tersisa)
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
