"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Plus, Search, Edit2, Trash2, CheckCircle, XCircle } from "lucide-react";

const ADMINS = [
  { id:"A001", name:"Rini Susanti", email:"rini@ked.id", phone:"+62-812-0001-0001", branch:"Jakarta Pusat", status:"active", created:"2023-03-15", lastLogin:"2 jam lalu" },
  { id:"A002", name:"Dodi Prasetyo", email:"dodi@ked.id", phone:"+62-812-0002-0002", branch:"Bandung", status:"active", created:"2023-05-20", lastLogin:"1 hari lalu" },
  { id:"A003", name:"Lena Marlina", email:"lena@ked.id", phone:"+62-812-0003-0003", branch:"Surabaya", status:"inactive", created:"2023-07-10", lastLogin:"7 hari lalu" },
  { id:"A004", name:"Bram Wijaya", email:"bram@ked.id", phone:"+62-812-0004-0004", branch:"Yogyakarta", status:"active", created:"2024-01-05", lastLogin:"3 jam lalu" },
  { id:"A005", name:"Putri Handayani", email:"putri@ked.id", phone:"+62-812-0005-0005", branch:"Medan", status:"active", created:"2024-02-14", lastLogin:"30 mnt lalu" },
];

export default function KelolAdminPage() {
  const [search, setSearch] = useState("");
  const [admins, setAdmins] = useState(ADMINS);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = admins.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    a.branch.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = (id: string) => {
    setAdmins(a => a.map(x => x.id === id ? { ...x, status: x.status === "active" ? "inactive" : "active" } : x));
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:16 }}>
        {[
          { label:"Total Admin", value:admins.length, color:"#D4AF37" },
          { label:"Aktif", value:admins.filter(a=>a.status==="active").length, color:"#4ade80" },
          { label:"Nonaktif", value:admins.filter(a=>a.status==="inactive").length, color:"#f87171" },
          { label:"Cabang", value:5, color:"#60a5fa" },
        ].map(s => (
          <div key={s.label} style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:16, padding:"20px 18px", backdropFilter:"blur(12px)" }}>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem", marginBottom:6 }}>{s.label}</p>
            <p style={{ color:s.color, fontSize:"1.8rem", fontWeight:900 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24, backdropFilter:"blur(12px)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
          <h3 style={{ color:"#fff", fontWeight:700, fontSize:"1rem" }}>Daftar Admin</h3>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"7px 12px" }}>
              <Search style={{ width:14, height:14, color:"rgba(255,255,255,0.3)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari admin..."
                style={{ background:"none", border:"none", outline:"none", color:"rgba(255,255,255,0.7)", fontSize:".82rem", width:160 }} />
            </div>
            <button className="btn-gold" onClick={() => setShowAdd(!showAdd)}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px", borderRadius:10, border:"none", cursor:"pointer", fontSize:".82rem" }}>
              <Plus style={{ width:14, height:14 }} />
              Tambah Admin
            </button>
          </div>
        </div>

        {showAdd && (
          <div style={{ background:"rgba(212,175,55,0.05)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:14, padding:20, marginBottom:20 }}>
            <h4 style={{ color:"#D4AF37", fontWeight:700, marginBottom:16 }}>Tambah Admin Baru</h4>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14 }}>
              {["Nama Lengkap","Email","No. HP","Cabang","Password"].map(f => (
                <div key={f}>
                  <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem", display:"block", marginBottom:6 }}>{f}</label>
                  <input className="input-gold" type={f==="Password"?"password":"text"} placeholder={f}
                    style={{ borderRadius:10, padding:"9px 12px", fontSize:".84rem", width:"100%" }} />
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <button className="btn-gold" style={{ padding:"9px 20px", borderRadius:10, border:"none", cursor:"pointer", fontSize:".84rem" }}>Simpan</button>
              <button onClick={() => setShowAdd(false)} className="btn-outline-gold" style={{ padding:"9px 20px", borderRadius:10, cursor:"pointer", fontSize:".84rem" }}>Batal</button>
            </div>
          </div>
        )}

        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                {["Admin","Email","Cabang","Status","Terakhir Login","Aksi"].map(h => (
                  <th key={h} style={{ color:"rgba(255,255,255,0.35)", fontSize:".75rem", fontWeight:600, padding:"8px 12px", textAlign:"left", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <motion.tr key={a.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.04 }}
                  style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding:"14px 12px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div className="bg-gold-gradient" style={{ width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#0a0a0a", fontSize:".78rem", flexShrink:0 }}>{a.name[0]}</div>
                      <div>
                        <p style={{ color:"#fff", fontSize:".83rem", fontWeight:600 }}>{a.name}</p>
                        <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem" }}>{a.id}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"14px 12px", color:"rgba(255,255,255,0.5)", fontSize:".82rem" }}>{a.email}</td>
                  <td style={{ padding:"14px 12px" }}>
                    <span style={{ background:"rgba(96,165,250,0.1)", color:"#60a5fa", borderRadius:8, padding:"3px 8px", fontSize:".75rem", fontWeight:600 }}>{a.branch}</span>
                  </td>
                  <td style={{ padding:"14px 12px" }}>
                    <span style={{ background: a.status==="active"?"rgba(74,222,128,0.1)":"rgba(248,113,113,0.1)", color: a.status==="active"?"#4ade80":"#f87171", borderRadius:8, padding:"3px 10px", fontSize:".75rem", fontWeight:600, display:"flex", alignItems:"center", gap:5, width:"fit-content" }}>
                      {a.status==="active" ? <CheckCircle style={{ width:11, height:11 }} /> : <XCircle style={{ width:11, height:11 }} />}
                      {a.status==="active" ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td style={{ padding:"14px 12px", color:"rgba(255,255,255,0.35)", fontSize:".78rem" }}>{a.lastLogin}</td>
                  <td style={{ padding:"14px 12px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={() => toggleStatus(a.id)}
                        style={{ width:28, height:28, borderRadius:7, background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.15)", color:"#D4AF37", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                        <Shield style={{ width:12, height:12 }} />
                      </button>
                      <button style={{ width:28, height:28, borderRadius:7, background:"rgba(96,165,250,0.08)", border:"1px solid rgba(96,165,250,0.15)", color:"#60a5fa", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                        <Edit2 style={{ width:12, height:12 }} />
                      </button>
                      <button style={{ width:28, height:28, borderRadius:7, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.15)", color:"#f87171", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                        <Trash2 style={{ width:12, height:12 }} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
