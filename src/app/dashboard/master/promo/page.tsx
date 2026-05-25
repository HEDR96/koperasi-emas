"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Tag, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const PROMOS = [
  { id:"P001", title:"Cashback Ramadan", desc:"Cashback 10% pembelian emas minimal 5g selama bulan Ramadan", type:"cashback", value:10, minBuy:5, startDate:"2024-03-10", endDate:"2024-04-10", active:true, used:248 },
  { id:"P002", title:"Bonus Member Baru", desc:"Bonus 0.5g emas untuk member baru yang mendaftar bulan ini", type:"bonus", value:0.5, minBuy:0, startDate:"2024-01-01", endDate:"2024-12-31", active:true, used:521 },
  { id:"P003", title:"Diskon Cicilan", desc:"Potongan biaya admin 50% untuk cicilan pertama", type:"diskon", value:50, minBuy:10, startDate:"2024-02-01", endDate:"2024-03-01", active:false, used:89 },
  { id:"P004", title:"Referral Reward", desc:"Dapatkan Rp 50.000 untuk setiap referral yang bergabung", type:"referral", value:50000, minBuy:0, startDate:"2024-01-01", endDate:"2024-12-31", active:true, used:1420 },
];

export default function PromoPage() {
  const [promos, setPromos] = useState(PROMOS);
  const [showForm, setShowForm] = useState(false);

  const toggleActive = (id: string) => setPromos(p => p.map(x => x.id === id ? { ...x, active: !x.active } : x));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:16 }}>
        {[
          { label:"Total Promo", value:promos.length, color:"#D4AF37" },
          { label:"Aktif", value:promos.filter(p=>p.active).length, color:"#4ade80" },
          { label:"Berakhir", value:promos.filter(p=>!p.active).length, color:"#f87171" },
          { label:"Total Digunakan", value:promos.reduce((a,b)=>a+b.used,0).toLocaleString(), color:"#60a5fa" },
        ].map(s => (
          <div key={s.label} style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:16, padding:"20px 18px" }}>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem", marginBottom:6 }}>{s.label}</p>
            <p style={{ color:s.color, fontSize:"1.7rem", fontWeight:900 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <h3 style={{ color:"#fff", fontWeight:700 }}>Daftar Promo</h3>
        <button className="btn-gold" onClick={() => setShowForm(!showForm)}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 18px", borderRadius:11, border:"none", cursor:"pointer", fontSize:".84rem" }}>
          <Plus style={{ width:15, height:15 }} />
          Tambah Promo
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
          style={{ background:"rgba(212,175,55,0.04)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:16, padding:24 }}>
          <h4 style={{ color:"#D4AF37", fontWeight:700, marginBottom:16 }}>Form Promo Baru</h4>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14 }}>
            {["Judul Promo","Deskripsi","Tipe (cashback/bonus/diskon)","Nilai","Min. Pembelian (gram)","Tanggal Mulai","Tanggal Selesai"].map(f => (
              <div key={f}>
                <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".76rem", display:"block", marginBottom:5 }}>{f}</label>
                <input className="input-gold" placeholder={f} style={{ borderRadius:10, padding:"9px 12px", fontSize:".83rem", width:"100%" }} />
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:10, marginTop:16 }}>
            <button className="btn-gold" style={{ padding:"9px 20px", borderRadius:10, border:"none", cursor:"pointer", fontSize:".84rem" }}>Simpan Promo</button>
            <button onClick={() => setShowForm(false)} className="btn-outline-gold" style={{ padding:"9px 20px", borderRadius:10, cursor:"pointer", fontSize:".84rem" }}>Batal</button>
          </div>
        </motion.div>
      )}

      {/* Promo Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
        {promos.map((promo, i) => (
          <motion.div key={promo.id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}
            style={{ background:"rgba(14,14,14,0.8)", border:`1px solid ${promo.active ? "rgba(212,175,55,0.25)" : "rgba(255,255,255,0.08)"}`, borderRadius:18, padding:22, backdropFilter:"blur(12px)", position:"relative", overflow:"hidden" }}>
            {/* Accent */}
            <div style={{ position:"absolute", top:0, right:0, width:80, height:80, background:promo.active?"rgba(212,175,55,0.06)":"rgba(255,255,255,0.02)", borderRadius:"0 18px 0 80px", pointerEvents:"none" }} />
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:38, height:38, borderRadius:11, background:"rgba(212,175,55,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Tag style={{ width:18, height:18, color:"#D4AF37" }} />
                </div>
                <div>
                  <p style={{ color:"#fff", fontWeight:700, fontSize:".9rem" }}>{promo.title}</p>
                  <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".72rem" }}>{promo.id}</p>
                </div>
              </div>
              <span style={{ background: promo.active?"rgba(74,222,128,0.1)":"rgba(248,113,113,0.1)", color: promo.active?"#4ade80":"#f87171", borderRadius:8, padding:"3px 10px", fontSize:".72rem", fontWeight:700 }}>
                {promo.active ? "Aktif" : "Nonaktif"}
              </span>
            </div>
            <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".8rem", lineHeight:1.6, marginBottom:14 }}>{promo.desc}</p>
            <div style={{ display:"flex", gap:10, marginBottom:14 }}>
              <div style={{ flex:1, background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"8px 10px", textAlign:"center" }}>
                <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".68rem" }}>Nilai</p>
                <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".88rem" }}>{promo.type==="referral" ? formatCurrency(promo.value) : `${promo.value}${promo.type==="bonus"?"g":"%"}`}</p>
              </div>
              <div style={{ flex:1, background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"8px 10px", textAlign:"center" }}>
                <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".68rem" }}>Digunakan</p>
                <p style={{ color:"#fff", fontWeight:700, fontSize:".88rem" }}>{promo.used.toLocaleString()}x</p>
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => toggleActive(promo.id)}
                style={{ flex:1, padding:"8px", borderRadius:9, border:"1px solid rgba(212,175,55,0.2)", background:"rgba(212,175,55,0.05)", color:"#D4AF37", cursor:"pointer", fontSize:".76rem", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                {promo.active ? <EyeOff style={{ width:12, height:12 }} /> : <Eye style={{ width:12, height:12 }} />}
                {promo.active ? "Nonaktifkan" : "Aktifkan"}
              </button>
              <button style={{ width:34, height:34, borderRadius:9, border:"1px solid rgba(96,165,250,0.2)", background:"rgba(96,165,250,0.05)", color:"#60a5fa", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                <Edit2 style={{ width:13, height:13 }} />
              </button>
              <button style={{ width:34, height:34, borderRadius:9, border:"1px solid rgba(248,113,113,0.2)", background:"rgba(248,113,113,0.05)", color:"#f87171", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                <Trash2 style={{ width:13, height:13 }} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
