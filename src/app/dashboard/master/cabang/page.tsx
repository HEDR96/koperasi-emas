"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building, MapPin, Phone, Users, Plus, Edit2, Trash2 } from "lucide-react";

const BRANCHES = [
  { id:"CB001", name:"Cabang Jakarta Pusat", address:"Jl. Sudirman No. 45, Jakarta Pusat 10220", phone:"+62-21-5000-0001", manager:"Rini Susanti", members:3240, active:true },
  { id:"CB002", name:"Cabang Bandung", address:"Jl. Asia Afrika No. 12, Bandung 40111", phone:"+62-22-4000-0002", manager:"Dodi Prasetyo", members:2180, active:true },
  { id:"CB003", name:"Cabang Surabaya", address:"Jl. Pemuda No. 30, Surabaya 60271", phone:"+62-31-3500-0003", manager:"Lena Marlina", members:2890, active:true },
  { id:"CB004", name:"Cabang Yogyakarta", address:"Jl. Malioboro No. 78, Yogyakarta 55213", phone:"+62-274-560-0004", manager:"Bram Wijaya", members:1560, active:true },
  { id:"CB005", name:"Cabang Medan", address:"Jl. Gajah Mada No. 55, Medan 20111", phone:"+62-61-4500-0005", manager:"Putri Handayani", members:1980, active:false },
];

export default function CabangPage() {
  const [branches, setBranches] = useState(BRANCHES);
  const [showForm, setShowForm] = useState(false);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:16 }}>
        {[
          { label:"Total Cabang", value:branches.length, color:"#D4AF37" },
          { label:"Aktif", value:branches.filter(b=>b.active).length, color:"#4ade80" },
          { label:"Total Member", value:branches.reduce((a,b)=>a+b.members,0).toLocaleString(), color:"#60a5fa" },
          { label:"Rata-rata Member", value:Math.floor(branches.reduce((a,b)=>a+b.members,0)/branches.length).toLocaleString(), color:"#c084fc" },
        ].map(s => (
          <div key={s.label} style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:16, padding:"20px 18px" }}>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem", marginBottom:6 }}>{s.label}</p>
            <p style={{ color:s.color, fontSize:"1.7rem", fontWeight:900 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <h3 style={{ color:"#fff", fontWeight:700 }}>Daftar Cabang</h3>
        <button className="btn-gold" onClick={() => setShowForm(!showForm)}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 18px", borderRadius:11, border:"none", cursor:"pointer", fontSize:".84rem" }}>
          <Plus style={{ width:15, height:15 }} />
          Tambah Cabang
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
          style={{ background:"rgba(212,175,55,0.04)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:16, padding:24 }}>
          <h4 style={{ color:"#D4AF37", fontWeight:700, marginBottom:16 }}>Tambah Cabang Baru</h4>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14 }}>
            {["Nama Cabang","Alamat","No. Telepon","Manajer","Kota","Kode Pos"].map(f => (
              <div key={f}>
                <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".76rem", display:"block", marginBottom:5 }}>{f}</label>
                <input className="input-gold" placeholder={f} style={{ borderRadius:10, padding:"9px 12px", fontSize:".83rem", width:"100%" }} />
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:10, marginTop:16 }}>
            <button className="btn-gold" style={{ padding:"9px 20px", borderRadius:10, border:"none", cursor:"pointer", fontSize:".84rem" }}>Simpan</button>
            <button onClick={() => setShowForm(false)} className="btn-outline-gold" style={{ padding:"9px 20px", borderRadius:10, cursor:"pointer", fontSize:".84rem" }}>Batal</button>
          </div>
        </motion.div>
      )}

      {/* Branch Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
        {branches.map((b, i) => (
          <motion.div key={b.id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}
            style={{ background:"rgba(14,14,14,0.8)", border:`1px solid ${b.active?"rgba(212,175,55,0.2)":"rgba(255,255,255,0.07)"}`, borderRadius:18, padding:22 }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:42, height:42, borderRadius:12, background:"rgba(212,175,55,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Building style={{ width:20, height:20, color:"#D4AF37" }} />
                </div>
                <div>
                  <p style={{ color:"#fff", fontWeight:700, fontSize:".9rem" }}>{b.name}</p>
                  <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem" }}>{b.id}</p>
                </div>
              </div>
              <span style={{ background: b.active?"rgba(74,222,128,0.1)":"rgba(248,113,113,0.1)", color: b.active?"#4ade80":"#f87171", borderRadius:8, padding:"3px 10px", fontSize:".72rem", fontWeight:700 }}>
                {b.active ? "Aktif" : "Nonaktif"}
              </span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                <MapPin style={{ width:14, height:14, color:"#D4AF37", flexShrink:0, marginTop:2 }} />
                <span style={{ color:"rgba(255,255,255,0.45)", fontSize:".79rem", lineHeight:1.5 }}>{b.address}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <Phone style={{ width:14, height:14, color:"#D4AF37", flexShrink:0 }} />
                <span style={{ color:"rgba(255,255,255,0.45)", fontSize:".79rem" }}>{b.phone}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <Users style={{ width:14, height:14, color:"#D4AF37", flexShrink:0 }} />
                <span style={{ color:"rgba(255,255,255,0.45)", fontSize:".79rem" }}>Manager: <strong style={{ color:"rgba(255,255,255,0.7)" }}>{b.manager}</strong> · {b.members.toLocaleString()} member</span>
              </div>
            </div>
            <div style={{ height:1, background:"rgba(255,255,255,0.06)", marginBottom:14 }} />
            <div style={{ display:"flex", gap:8 }}>
              <button style={{ flex:1, padding:"7px", borderRadius:9, border:"1px solid rgba(96,165,250,0.2)", background:"rgba(96,165,250,0.05)", color:"#60a5fa", cursor:"pointer", fontSize:".76rem", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                <Edit2 style={{ width:12, height:12 }} /> Edit
              </button>
              <button style={{ flex:1, padding:"7px", borderRadius:9, border:"1px solid rgba(248,113,113,0.2)", background:"rgba(248,113,113,0.05)", color:"#f87171", cursor:"pointer", fontSize:".76rem", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                <Trash2 style={{ width:12, height:12 }} /> Hapus
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
