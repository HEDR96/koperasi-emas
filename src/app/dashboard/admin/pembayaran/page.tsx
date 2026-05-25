"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, Eye, Upload, CreditCard } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import StatCard from "@/components/dashboard/StatCard";

const PAYMENTS = Array.from({ length: 12 }, (_, i) => ({
  id: `PAY${String(i+1).padStart(5,"0")}`,
  member: ["Budi S.","Siti R.","Ahmad F.","Dewi K.","Rino P.","Wahyu H.","Eni S.","Hadi P."][i%8],
  amount: (i+1)*980000,
  method: ["BCA Transfer","Mandiri Transfer","BNI Transfer","QRIS","GoPay","OVO","Dana","BRI Transfer"][i%8],
  status: ["pending","pending","approved","rejected","pending","approved","pending","approved"][i%8] as "pending"|"approved"|"rejected",
  date: new Date(Date.now() - i*5400000).toISOString(),
  ref: `REF${String(Math.floor(Math.random()*900000+100000)).padStart(6,"0")}`,
}));

const STATUS_MAP = {
  pending: { label:"Menunggu", bg:"rgba(251,146,60,0.1)", color:"#fb923c" },
  approved: { label:"Approved", bg:"rgba(74,222,128,0.1)", color:"#4ade80" },
  rejected: { label:"Ditolak", bg:"rgba(248,113,113,0.1)", color:"#f87171" },
};

export default function PembayaranPage() {
  const [payments, setPayments] = useState(PAYMENTS);

  const approve = (id: string) => setPayments(p => p.map(x => x.id===id ? {...x, status:"approved" as const} : x));
  const reject  = (id: string) => setPayments(p => p.map(x => x.id===id ? {...x, status:"rejected" as const} : x));

  const pending  = payments.filter(p=>p.status==="pending").length;
  const approved = payments.filter(p=>p.status==="approved").length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:16 }}>
        <StatCard title="Menunggu" value={String(pending)} icon={<Clock style={{ width:20, height:20 }} />} color="#fb923c" delay={0} />
        <StatCard title="Disetujui" value={String(approved)} icon={<CheckCircle style={{ width:20, height:20 }} />} color="#4ade80" delay={0.1} />
        <StatCard title="Total Hari Ini" value={String(payments.length)} icon={<CreditCard style={{ width:20, height:20 }} />} color="#D4AF37" delay={0.2} />
        <StatCard title="Nominal" value={`Rp ${(payments.filter(p=>p.status==="approved").reduce((a,b)=>a+b.amount,0)/1000000).toFixed(1)}jt`} icon={<CreditCard style={{ width:20, height:20 }} />} color="#c084fc" delay={0.3} />
      </div>

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24 }}>
        <h3 style={{ color:"#fff", fontWeight:700, marginBottom:20 }}>Daftar Pembayaran</h3>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                {["ID","Member","Nominal","Metode","Referensi","Waktu","Status","Aksi"].map(h => (
                  <th key={h} style={{ color:"rgba(255,255,255,0.3)", fontSize:".73rem", fontWeight:600, padding:"8px 12px", textAlign:"left", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => {
                const s = STATUS_MAP[p.status];
                return (
                  <motion.tr key={p.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                    style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding:"12px 12px", color:"rgba(255,255,255,0.35)", fontSize:".75rem" }}>{p.id}</td>
                    <td style={{ padding:"12px 12px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div className="bg-gold-gradient" style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#0a0a0a", fontSize:".7rem", flexShrink:0 }}>{p.member[0]}</div>
                        <span style={{ color:"#fff", fontSize:".83rem" }}>{p.member}</span>
                      </div>
                    </td>
                    <td style={{ padding:"12px 12px", color:"#D4AF37", fontWeight:700, fontSize:".83rem", whiteSpace:"nowrap" }}>{formatCurrency(p.amount)}</td>
                    <td style={{ padding:"12px 12px", color:"rgba(255,255,255,0.5)", fontSize:".8rem" }}>{p.method}</td>
                    <td style={{ padding:"12px 12px", color:"rgba(255,255,255,0.3)", fontSize:".75rem", fontFamily:"monospace" }}>{p.ref}</td>
                    <td style={{ padding:"12px 12px", color:"rgba(255,255,255,0.3)", fontSize:".75rem", whiteSpace:"nowrap" }}>{new Date(p.date).toLocaleString("id-ID",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}</td>
                    <td style={{ padding:"12px 12px" }}>
                      <span style={{ background:s.bg, color:s.color, borderRadius:8, padding:"3px 10px", fontSize:".73rem", fontWeight:700 }}>{s.label}</span>
                    </td>
                    <td style={{ padding:"12px 12px" }}>
                      <div style={{ display:"flex", gap:5 }}>
                        <button style={{ width:28, height:28, borderRadius:7, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                          <Eye style={{ width:11, height:11 }} />
                        </button>
                        {p.status==="pending" && <>
                          <button onClick={() => approve(p.id)}
                            style={{ width:28, height:28, borderRadius:7, background:"rgba(74,222,128,0.08)", border:"1px solid rgba(74,222,128,0.2)", color:"#4ade80", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                            <CheckCircle style={{ width:11, height:11 }} />
                          </button>
                          <button onClick={() => reject(p.id)}
                            style={{ width:28, height:28, borderRadius:7, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", color:"#f87171", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                            <XCircle style={{ width:11, height:11 }} />
                          </button>
                        </>}
                      </div>
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
