"use client";

import { useState } from "react";
import { Bell, Menu, Search } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

interface Props { title: string; onMenuClick: () => void; }

export default function DashboardHeader({ title, onMenuClick }: Props) {
  const { user } = useAuthStore();
  const [notifOpen, setNotifOpen] = useState(false);

  const NOTIFS = [
    { id:1, title:"Transaksi Disetujui", msg:"Pembelian 5g emas berhasil.", time:"2 mnt", read:false },
    { id:2, title:"Cicilan Jatuh Tempo", msg:"Bayar cicilan bulan ini.", time:"1 jam", read:false },
    { id:3, title:"Promo Baru!", msg:"Cashback 10% pembelian >10g.", time:"3 jam", read:true },
  ];

  return (
    <header style={{
      position:"sticky", top:0, zIndex:50,
      background:"rgba(255,253,231,0.92)",
      backdropFilter:"blur(16px)",
      WebkitBackdropFilter:"blur(16px)",
      borderBottom:"1px solid rgba(201,162,39,0.2)",
      padding:"0 20px", height:60,
      display:"flex", alignItems:"center", gap:12,
    }}>
      <button onClick={onMenuClick}
        style={{ background:"rgba(201,162,39,0.1)", border:"1px solid rgba(201,162,39,0.2)", borderRadius:8, width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", color:"#8B6010", cursor:"pointer", flexShrink:0 }}
        className="lg-hidden"
      >
        <Menu style={{ width:17, height:17 }} />
      </button>

      <h1 style={{ color:"#2D1B00", fontWeight:700, fontSize:"1.05rem", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{title}</h1>

      {/* Search */}
      <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.6)", border:"1px solid rgba(201,162,39,0.2)", borderRadius:10, padding:"6px 12px", minWidth:160, maxWidth:220 }} className="search-bar">
        <Search style={{ width:14, height:14, color:"rgba(101,67,14,0.4)", flexShrink:0 }} />
        <input placeholder="Cari..." style={{ background:"transparent", border:"none", outline:"none", color:"#5C3D11", fontSize:".82rem", width:"100%" }} />
      </div>

      {/* Notifications */}
      <div style={{ position:"relative" }}>
        <button onClick={() => setNotifOpen(!notifOpen)}
          style={{ position:"relative", background:"rgba(201,162,39,0.1)", border:"1px solid rgba(201,162,39,0.2)", borderRadius:8, width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", color:"#8B6010", cursor:"pointer" }}>
          <Bell style={{ width:16, height:16 }} />
          <span style={{ position:"absolute", top:6, right:6, width:7, height:7, background:"#C9A227", borderRadius:"50%" }} />
        </button>

        {notifOpen && (
          <div style={{ position:"absolute", right:0, top:44, width:300, background:"#FFFDE7", border:"1px solid rgba(201,162,39,0.25)", borderRadius:16, boxShadow:"0 20px 50px rgba(201,162,39,0.2)", zIndex:100, overflow:"hidden" }}>
            <div style={{ padding:"14px 16px", borderBottom:"1px solid rgba(201,162,39,0.15)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ color:"#2D1B00", fontWeight:700, fontSize:".9rem" }}>Notifikasi</span>
              <span className="badge-gold" style={{ padding:"2px 8px", borderRadius:20, fontSize:".68rem", fontWeight:600 }}>{NOTIFS.filter(n=>!n.read).length} Baru</span>
            </div>
            {NOTIFS.map(n => (
              <div key={n.id} style={{ padding:"12px 16px", borderBottom:"1px solid rgba(201,162,39,0.08)", display:"flex", gap:10, background: !n.read ? "rgba(212,175,55,0.06)" : "transparent", cursor:"pointer" }}>
                {!n.read && <div style={{ width:6, height:6, borderRadius:"50%", background:"#C9A227", flexShrink:0, marginTop:6 }} />}
                {n.read && <div style={{ width:6, flexShrink:0 }} />}
                <div>
                  <p style={{ color:"#2D1B00", fontSize:".83rem", fontWeight:500, marginBottom:2 }}>{n.title}</p>
                  <p style={{ color:"rgba(101,67,14,0.6)", fontSize:".76rem" }}>{n.msg}</p>
                  <p style={{ color:"rgba(101,67,14,0.35)", fontSize:".7rem", marginTop:3 }}>{n.time}</p>
                </div>
              </div>
            ))}
            <div style={{ padding:"10px 16px", textAlign:"center" }}>
              <button style={{ background:"none", border:"none", color:"#8B6010", fontSize:".82rem", cursor:"pointer" }}>Lihat semua</button>
            </div>
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="bg-gold-gradient" style={{ width:34, height:34, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#fff", fontSize:".85rem", flexShrink:0, cursor:"pointer" }}>
        {user?.name?.[0] || "U"}
      </div>

      <style>{`
        @media (min-width:900px) { .lg-hidden { display:none !important; } }
        @media (max-width:640px) { .search-bar { display:none !important; } }
      `}</style>
    </header>
  );
}
