"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, UserCheck, UserX, Eye, Mail } from "lucide-react";
import { formatDate } from "@/lib/utils";

const MEMBERS = Array.from({ length: 20 }, (_, i) => ({
  id: `MBR${String(i+1).padStart(5,"0")}`,
  name: ["Budi Santoso","Siti Rahayu","Ahmad Fauzi","Dewi Kartika","Rino Pratama","Wahyu Hidayat","Eni Suryani","Hadi Purnomo","Lestari","Bambang"][i%10] + ` ${i+1}`,
  email: `member${i+1}@email.com`,
  phone: `+62-812-${String(i+1).padStart(4,"0")}-0001`,
  gold: +(i*1.5+0.5).toFixed(2),
  joined: new Date(Date.now() - (i+1)*30*86400000).toISOString(),
  status: i%4===3?"suspended":i%7===6?"unverified":"active" as "active"|"suspended"|"unverified",
  branch: ["Jakarta","Bandung","Surabaya","Yogyakarta","Medan"][i%5],
}));

const S_MAP = {
  active: { label:"Aktif", bg:"rgba(74,222,128,0.1)", color:"#4ade80" },
  suspended: { label:"Suspend", bg:"rgba(248,113,113,0.1)", color:"#f87171" },
  unverified: { label:"Belum Verif", bg:"rgba(251,146,60,0.1)", color:"#fb923c" },
};

export default function AdminMemberPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PER = 10;

  const filtered = MEMBERS.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );
  const total = filtered.length;
  const paged = filtered.slice((page-1)*PER, page*PER);
  const pages = Math.ceil(total/PER);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:16 }}>
        {[
          { label:"Total Member", value:MEMBERS.length, color:"#D4AF37" },
          { label:"Aktif", value:MEMBERS.filter(m=>m.status==="active").length, color:"#4ade80" },
          { label:"Suspend", value:MEMBERS.filter(m=>m.status==="suspended").length, color:"#f87171" },
          { label:"Belum Verif", value:MEMBERS.filter(m=>m.status==="unverified").length, color:"#fb923c" },
        ].map(s => (
          <div key={s.label} style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:16, padding:"18px 16px" }}>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".76rem", marginBottom:4 }}>{s.label}</p>
            <p style={{ color:s.color, fontSize:"1.7rem", fontWeight:900 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
          <h3 style={{ color:"#fff", fontWeight:700 }}>Daftar Member</h3>
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"7px 12px" }}>
            <Search style={{ width:14, height:14, color:"rgba(255,255,255,0.3)" }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari member..."
              style={{ background:"none", border:"none", outline:"none", color:"rgba(255,255,255,0.7)", fontSize:".82rem", width:180 }} />
          </div>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                {["Member","Email","Cabang","Emas","Bergabung","Status","Aksi"].map(h => (
                  <th key={h} style={{ color:"rgba(255,255,255,0.3)", fontSize:".73rem", fontWeight:600, padding:"8px 12px", textAlign:"left", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((m, i) => {
                const s = S_MAP[m.status];
                return (
                  <motion.tr key={m.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                    style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding:"12px 12px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div className="bg-gold-gradient" style={{ width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#0a0a0a", fontSize:".72rem", flexShrink:0 }}>{m.name[0]}</div>
                        <div>
                          <p style={{ color:"#fff", fontSize:".82rem", fontWeight:600 }}>{m.name}</p>
                          <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".7rem" }}>{m.id}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:"12px 12px", color:"rgba(255,255,255,0.45)", fontSize:".8rem" }}>{m.email}</td>
                    <td style={{ padding:"12px 12px" }}>
                      <span style={{ background:"rgba(96,165,250,0.1)", color:"#60a5fa", borderRadius:8, padding:"2px 8px", fontSize:".72rem" }}>{m.branch}</span>
                    </td>
                    <td style={{ padding:"12px 12px", color:"#D4AF37", fontWeight:700, fontSize:".82rem" }}>{m.gold}g</td>
                    <td style={{ padding:"12px 12px", color:"rgba(255,255,255,0.3)", fontSize:".77rem" }}>{formatDate(m.joined)}</td>
                    <td style={{ padding:"12px 12px" }}>
                      <span style={{ background:s.bg, color:s.color, borderRadius:8, padding:"3px 9px", fontSize:".73rem", fontWeight:700 }}>{s.label}</span>
                    </td>
                    <td style={{ padding:"12px 12px" }}>
                      <div style={{ display:"flex", gap:5 }}>
                        <button style={{ width:27, height:27, borderRadius:7, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                          <Eye style={{ width:11, height:11 }} />
                        </button>
                        <button style={{ width:27, height:27, borderRadius:7, background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.15)", color:"#D4AF37", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                          <Mail style={{ width:11, height:11 }} />
                        </button>
                        {m.status==="active"
                          ? <button style={{ width:27, height:27, borderRadius:7, background:"rgba(248,113,113,0.06)", border:"1px solid rgba(248,113,113,0.15)", color:"#f87171", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                              <UserX style={{ width:11, height:11 }} />
                            </button>
                          : <button style={{ width:27, height:27, borderRadius:7, background:"rgba(74,222,128,0.06)", border:"1px solid rgba(74,222,128,0.15)", color:"#4ade80", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                              <UserCheck style={{ width:11, height:11 }} />
                            </button>
                        }
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:16, flexWrap:"wrap", gap:8 }}>
          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".78rem" }}>Menampilkan {(page-1)*PER+1}–{Math.min(page*PER,total)} dari {total}</p>
          <div style={{ display:"flex", gap:6 }}>
            {Array.from({length:pages},(_, i)=>i+1).map(p => (
              <button key={p} onClick={()=>setPage(p)}
                style={{ width:30, height:30, borderRadius:8, border:"1px solid", fontSize:".78rem", cursor:"pointer",
                  borderColor: page===p?"#D4AF37":"rgba(255,255,255,0.1)",
                  background: page===p?"rgba(212,175,55,0.15)":"transparent",
                  color: page===p?"#D4AF37":"rgba(255,255,255,0.4)" }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
