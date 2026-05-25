"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Coins, FileText, CheckCircle, Clock, ArrowLeftRight, MessageCircle, X, Check } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import TransactionTable from "@/components/dashboard/TransactionTable";
import { formatCurrency } from "@/lib/utils";

const MOCK_TRANSACTIONS = Array.from({ length: 12 }, (_, i) => ({
  id: `TX${String(i + 2000).padStart(6, "0")}`,
  user: ["Budi Santoso", "Siti Rahayu", "Ahmad F.", "Dewi K.", "Rino P."][i % 5],
  type: ["buy", "buyback", "cicilan", "tabungan", "buy"][i % 5] as any,
  gram: +((i + 1) * 0.5 + 0.3).toFixed(2),
  amount: (i + 1) * 500000 + 250000,
  status: ["completed", "pending", "processing", "completed", "pending"][i % 5] as any,
  date: new Date(Date.now() - i * 3600000 * 3).toISOString(),
}));

const PENDING_PAYMENTS = [
  { name: "Budi Santoso", amount: 4900000, method: "BCA Transfer", time: "10 menit lalu", avatar: "B" },
  { name: "Dewi Kartika", amount: 9800000, method: "Mandiri Transfer", time: "25 menit lalu", avatar: "D" },
  { name: "Rino Pratama", amount: 2450000, method: "BNI Transfer", time: "1 jam lalu", avatar: "R" },
  { name: "Siti Aminah", amount: 6125000, method: "BRI Transfer", time: "2 jam lalu", avatar: "S" },
];

const RECENT_CHATS = [
  { name: "Ahmad Fauzi", msg: "Halo, saya ingin tanya soal buyback...", time: "5 mnt", unread: 2 },
  { name: "Siti Rahayu", msg: "Kapan saldo saya bisa dicairkan?", time: "30 mnt", unread: 1 },
  { name: "Wahyu H.", msg: "Terima kasih, sudah clear!", time: "1 jam", unread: 0 },
  { name: "Budi S.", msg: "Oke siap, terima kasih infonya.", time: "2 jam", unread: 0 },
];

export default function AdminDashboardPage() {
  const [payments, setPayments] = useState(PENDING_PAYMENTS);

  const handleApprove = (i: number) => setPayments(p => p.filter((_, idx) => idx !== i));
  const handleReject = (i: number) => setPayments(p => p.filter((_, idx) => idx !== i));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16 }}>
        <StatCard title="Member Aktif" value="12,450" change={3.2} icon={<Users style={{ width:20, height:20 }} />} color="#60a5fa" delay={0} />
        <StatCard title="Transaksi Hari Ini" value="87" change={12.0} icon={<ArrowLeftRight style={{ width:20, height:20 }} />} color="#D4AF37" delay={0.1} />
        <StatCard title="Pending Verifikasi" value={String(payments.length)} icon={<Clock style={{ width:20, height:20 }} />} color="#fb923c" delay={0.2} />
        <StatCard title="Invoice Dicetak" value="56" change={8.5} icon={<FileText style={{ width:20, height:20 }} />} color="#4ade80" delay={0.3} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:24 }}>
        {/* Pending Payments */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
          style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24, backdropFilter:"blur(12px)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <h3 style={{ color:"#fff", fontWeight:700, fontSize:"1rem" }}>Verifikasi Pembayaran</h3>
              <span style={{ background:"rgba(251,146,60,0.15)", color:"#fb923c", borderRadius:20, padding:"2px 8px", fontSize:".72rem", fontWeight:700 }}>{payments.length}</span>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {payments.length === 0 ? (
              <div style={{ textAlign:"center", padding:"32px 0", color:"rgba(255,255,255,0.25)", fontSize:".85rem" }}>
                <CheckCircle style={{ width:32, height:32, margin:"0 auto 8px", color:"#4ade80" }} />
                Semua pembayaran sudah diverifikasi
              </div>
            ) : payments.map((p, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 14px", gap:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
                  <div className="bg-gold-gradient" style={{ width:34, height:34, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#0a0a0a", fontSize:".8rem", flexShrink:0 }}>{p.avatar}</div>
                  <div style={{ overflow:"hidden" }}>
                    <p style={{ color:"#fff", fontSize:".83rem", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</p>
                    <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".72rem" }}>{p.method} · {p.time}</p>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                  <span style={{ color:"#fff", fontWeight:700, fontSize:".82rem" }}>{formatCurrency(p.amount)}</span>
                  <button onClick={() => handleApprove(i)}
                    style={{ width:28, height:28, borderRadius:8, background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.2)", color:"#4ade80", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <Check style={{ width:13, height:13 }} />
                  </button>
                  <button onClick={() => handleReject(i)}
                    style={{ width:28, height:28, borderRadius:8, background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)", color:"#f87171", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <X style={{ width:13, height:13 }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Chats */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
          style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24, backdropFilter:"blur(12px)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <h3 style={{ color:"#fff", fontWeight:700, fontSize:"1rem" }}>Pesan Masuk</h3>
              <span style={{ background:"rgba(212,175,55,0.15)", color:"#D4AF37", borderRadius:20, padding:"2px 8px", fontSize:".72rem", fontWeight:700 }}>3 Baru</span>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {RECENT_CHATS.map((c, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, cursor:"pointer" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor="rgba(212,175,55,0.2)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.06)"}>
                <div className="bg-gold-gradient" style={{ width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#0a0a0a", fontSize:".85rem", flexShrink:0 }}>{c.name[0]}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <p style={{ color:"#fff", fontSize:".84rem", fontWeight:600 }}>{c.name}</p>
                    <span style={{ color:"rgba(255,255,255,0.25)", fontSize:".72rem" }}>{c.time}</span>
                  </div>
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".76rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.msg}</p>
                </div>
                {c.unread > 0 && (
                  <div style={{ width:20, height:20, borderRadius:"50%", background:"#D4AF37", color:"#0a0a0a", fontSize:".7rem", fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{c.unread}</div>
                )}
              </div>
            ))}
          </div>
          <button className="btn-gold" style={{ width:"100%", marginTop:14, padding:"10px", borderRadius:11, border:"none", cursor:"pointer", fontSize:".84rem", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <MessageCircle style={{ width:15, height:15 }} />
            Buka Semua Chat
          </button>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24, backdropFilter:"blur(12px)" }}>
        <h3 style={{ color:"#fff", fontWeight:700, fontSize:"1rem", marginBottom:16 }}>Aksi Cepat</h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12 }}>
          {[
            { label:"Input Pembayaran", icon:Coins, color:"#D4AF37" },
            { label:"Approve Member", icon:CheckCircle, color:"#4ade80" },
            { label:"Upload Promo", icon:FileText, color:"#60a5fa" },
            { label:"Generate Invoice", icon:FileText, color:"#c084fc" },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <button key={a.label}
                style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"18px 12px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:10, transition:"all .2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor="rgba(212,175,55,0.3)"; (e.currentTarget as HTMLElement).style.background="rgba(212,175,55,0.05)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.03)"; }}>
                <div style={{ width:40, height:40, borderRadius:12, background:"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Icon style={{ width:20, height:20, color:a.color }} />
                </div>
                <span style={{ color:"rgba(255,255,255,0.55)", fontSize:".78rem", textAlign:"center", fontWeight:500 }}>{a.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      <TransactionTable data={MOCK_TRANSACTIONS} title="Transaksi Terbaru" showUser={true} />
    </div>
  );
}
