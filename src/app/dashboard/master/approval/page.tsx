"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, Eye, Filter } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type Status = "pending" | "approved" | "rejected";

const INITIAL = [
  { id:"AP001", member:"Budi Santoso", type:"Beli Emas", amount:9800000, gram:5, method:"BCA Transfer", date:"2024-03-15T10:30:00", status:"pending" as Status, proof:"bukti_001.jpg" },
  { id:"AP002", member:"Siti Rahayu", type:"Cicilan DP", amount:2450000, gram:2.5, method:"Mandiri Transfer", date:"2024-03-15T09:15:00", status:"pending" as Status, proof:"bukti_002.jpg" },
  { id:"AP003", member:"Ahmad Fauzi", type:"Buyback", amount:4900000, gram:2.5, method:"Transfer ke Rekening", date:"2024-03-14T16:00:00", status:"approved" as Status, proof:"bukti_003.jpg" },
  { id:"AP004", member:"Dewi Kartika", type:"Tabungan", amount:1000000, gram:0.5, method:"QRIS", date:"2024-03-14T11:45:00", status:"pending" as Status, proof:"bukti_004.jpg" },
  { id:"AP005", member:"Rino Pratama", type:"Beli Emas", amount:14700000, gram:7.5, method:"BNI Transfer", date:"2024-03-13T14:20:00", status:"rejected" as Status, proof:"bukti_005.jpg" },
  { id:"AP006", member:"Wahyu H.", type:"Cicilan Bulan 3", amount:980000, gram:0.5, method:"GoPay", date:"2024-03-13T09:00:00", status:"approved" as Status, proof:"bukti_006.jpg" },
];

const STATUS_CONFIG: Record<Status, { label:string; bg:string; color:string; icon:any }> = {
  pending: { label:"Menunggu", bg:"rgba(251,146,60,0.1)", color:"#fb923c", icon:Clock },
  approved: { label:"Disetujui", bg:"rgba(74,222,128,0.1)", color:"#4ade80", icon:CheckCircle },
  rejected: { label:"Ditolak", bg:"rgba(248,113,113,0.1)", color:"#f87171", icon:XCircle },
};

export default function ApprovalPage() {
  const [items, setItems] = useState(INITIAL);
  const [filter, setFilter] = useState<"all"|Status>("all");

  const approve = (id: string) => setItems(a => a.map(x => x.id===id ? {...x, status:"approved"} : x));
  const reject = (id: string) => setItems(a => a.map(x => x.id===id ? {...x, status:"rejected"} : x));

  const filtered = filter === "all" ? items : items.filter(i => i.status === filter);
  const counts = { pending: items.filter(i=>i.status==="pending").length, approved: items.filter(i=>i.status==="approved").length, rejected: items.filter(i=>i.status==="rejected").length };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:16 }}>
        {[
          { label:"Menunggu Approval", value:counts.pending, color:"#fb923c" },
          { label:"Disetujui Hari Ini", value:counts.approved, color:"#4ade80" },
          { label:"Ditolak", value:counts.rejected, color:"#f87171" },
          { label:"Total", value:items.length, color:"#D4AF37" },
        ].map(s => (
          <div key={s.label} style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:16, padding:"20px 18px" }}>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem", marginBottom:6 }}>{s.label}</p>
            <p style={{ color:s.color, fontSize:"1.8rem", fontWeight:900 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter + Table */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24 }}>
        {/* Filter Tabs */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, flexWrap:"wrap" }}>
          <Filter style={{ width:15, height:15, color:"rgba(255,255,255,0.3)" }} />
          {(["all","pending","approved","rejected"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:"6px 16px", borderRadius:20, border:"1px solid", fontSize:".78rem", fontWeight:600, cursor:"pointer", transition:"all .2s",
                borderColor: filter===f ? "#D4AF37" : "rgba(255,255,255,0.1)",
                background: filter===f ? "rgba(212,175,55,0.12)" : "transparent",
                color: filter===f ? "#D4AF37" : "rgba(255,255,255,0.4)" }}>
              {f==="all"?"Semua":STATUS_CONFIG[f as Status].label}
              {f!=="all" && <span style={{ marginLeft:6, fontSize:".7rem" }}>({counts[f as Status]})</span>}
            </button>
          ))}
        </div>

        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                {["ID","Member","Jenis","Jumlah","Emas","Metode","Waktu","Status","Aksi"].map(h => (
                  <th key={h} style={{ color:"rgba(255,255,255,0.3)", fontSize:".73rem", fontWeight:600, padding:"8px 12px", textAlign:"left", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => {
                const s = STATUS_CONFIG[item.status];
                const SIcon = s.icon;
                return (
                  <motion.tr key={item.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.04 }}
                    style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding:"12px 12px", color:"rgba(255,255,255,0.4)", fontSize:".75rem" }}>{item.id}</td>
                    <td style={{ padding:"12px 12px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div className="bg-gold-gradient" style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#0a0a0a", fontSize:".7rem", flexShrink:0 }}>{item.member[0]}</div>
                        <span style={{ color:"#fff", fontSize:".82rem", fontWeight:500 }}>{item.member}</span>
                      </div>
                    </td>
                    <td style={{ padding:"12px 12px", color:"rgba(255,255,255,0.6)", fontSize:".82rem" }}>{item.type}</td>
                    <td style={{ padding:"12px 12px", color:"#D4AF37", fontWeight:700, fontSize:".82rem", whiteSpace:"nowrap" }}>{formatCurrency(item.amount)}</td>
                    <td style={{ padding:"12px 12px", color:"rgba(255,255,255,0.6)", fontSize:".82rem" }}>{item.gram}g</td>
                    <td style={{ padding:"12px 12px", color:"rgba(255,255,255,0.45)", fontSize:".78rem" }}>{item.method}</td>
                    <td style={{ padding:"12px 12px", color:"rgba(255,255,255,0.3)", fontSize:".75rem", whiteSpace:"nowrap" }}>{formatDateTime(item.date)}</td>
                    <td style={{ padding:"12px 12px" }}>
                      <span style={{ background:s.bg, color:s.color, borderRadius:8, padding:"3px 10px", fontSize:".73rem", fontWeight:700, display:"inline-flex", alignItems:"center", gap:4, whiteSpace:"nowrap" }}>
                        <SIcon style={{ width:10, height:10 }} />
                        {s.label}
                      </span>
                    </td>
                    <td style={{ padding:"12px 12px" }}>
                      {item.status === "pending" && (
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={() => approve(item.id)}
                            style={{ width:30, height:30, borderRadius:8, background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.2)", color:"#4ade80", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                            <CheckCircle style={{ width:13, height:13 }} />
                          </button>
                          <button onClick={() => reject(item.id)}
                            style={{ width:30, height:30, borderRadius:8, background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)", color:"#f87171", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                            <XCircle style={{ width:13, height:13 }} />
                          </button>
                        </div>
                      )}
                      {item.status !== "pending" && (
                        <button style={{ width:30, height:30, borderRadius:8, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                          <Eye style={{ width:13, height:13 }} />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
