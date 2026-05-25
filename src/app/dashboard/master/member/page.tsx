"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, Download, CheckCircle, XCircle, Eye } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

const MOCK_MEMBERS = Array.from({ length: 30 }, (_, i) => ({
  id: `MBR${String(i+1000).padStart(5,"0")}`,
  name: ["Budi Santoso","Siti Rahayu","Ahmad Fauzi","Dewi Kartika","Rino Pratama",
         "Wahyu Hendra","Mega Putri","Farhan Ali","Linda Susanti","Bagus Kurnia"][i%10],
  email: `member${i+1}@email.com`,
  phone: `0811-00${String(i).padStart(2,"0")}-0000`,
  goldGrams: +((i+1)*3.5+0.5).toFixed(2),
  totalTx: (i%10)+3,
  status: i%7===0?"pending":"active" as "active"|"pending",
  joinDate: new Date(Date.now()-i*15*86400000).toISOString(),
}));

export default function MasterMemberPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = MOCK_MEMBERS.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.id.includes(search);
    const matchFilter = filter==="all" || m.status===filter;
    return matchSearch && matchFilter;
  });
  const paged = filtered.slice((page-1)*perPage, page*perPage);
  const totalPages = Math.ceil(filtered.length/perPage);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:16 }}>
        {[
          { label:"Total Member", value:MOCK_MEMBERS.length, color:"#D4AF37" },
          { label:"Aktif", value:MOCK_MEMBERS.filter(m=>m.status==="active").length, color:"#4ade80" },
          { label:"Pending Verif", value:MOCK_MEMBERS.filter(m=>m.status==="pending").length, color:"#fb923c" },
          { label:"Bergabung Bulan Ini", value:8, color:"#60a5fa" },
        ].map(s => (
          <div key={s.label} style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:16, padding:"18px 16px" }}>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".76rem", marginBottom:4 }}>{s.label}</p>
            <p style={{ color:s.color, fontSize:"1.7rem", fontWeight:900 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, overflow:"hidden" }}>
        {/* Controls */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", gap:8 }}>
            {(["all","active","pending"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding:"5px 14px", borderRadius:20, border:"1px solid", fontSize:".78rem", fontWeight:600, cursor:"pointer", transition:"all .15s",
                  borderColor: filter===f?"#D4AF37":"rgba(255,255,255,0.1)",
                  background: filter===f?"rgba(212,175,55,0.1)":"transparent",
                  color: filter===f?"#D4AF37":"rgba(255,255,255,0.35)" }}>
                {f==="all"?"Semua":f==="active"?"Aktif":"Pending"}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"6px 12px" }}>
              <Search style={{ width:13, height:13, color:"rgba(255,255,255,0.3)" }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari member..."
                style={{ background:"none", border:"none", outline:"none", color:"rgba(255,255,255,0.7)", fontSize:".8rem", width:150 }} />
            </div>
            <button className="btn-outline-gold" style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:9, cursor:"pointer", fontSize:".78rem" }}>
              <Download style={{ width:12, height:12 }} /> Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                {["ID","Nama","Email","Emas","Total TX","Bergabung","Status","Aksi"].map(h => (
                  <th key={h} style={{ color:"rgba(255,255,255,0.3)", fontSize:".73rem", fontWeight:600, padding:"10px 14px", textAlign:"left", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((m, i) => (
                <motion.tr key={m.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                  style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding:"12px 14px", fontFamily:"monospace", fontSize:".75rem", color:"rgba(255,255,255,0.3)" }}>{m.id}</td>
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div className="bg-gold-gradient" style={{ width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#0a0a0a", fontSize:".72rem", flexShrink:0 }}>{m.name[0]}</div>
                      <div>
                        <p style={{ color:"#fff", fontSize:".83rem", fontWeight:600 }}>{m.name}</p>
                        <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".72rem" }}>{m.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"12px 14px", color:"rgba(255,255,255,0.45)", fontSize:".8rem" }}>{m.email}</td>
                  <td style={{ padding:"12px 14px", color:"#D4AF37", fontWeight:700, fontSize:".82rem" }}>{m.goldGrams}g</td>
                  <td style={{ padding:"12px 14px", color:"rgba(255,255,255,0.5)", fontSize:".82rem" }}>{m.totalTx}x</td>
                  <td style={{ padding:"12px 14px", color:"rgba(255,255,255,0.35)", fontSize:".78rem" }}>{formatDate(m.joinDate)}</td>
                  <td style={{ padding:"12px 14px" }}>
                    <span style={{ background: m.status==="active"?"rgba(74,222,128,0.1)":"rgba(251,146,60,0.1)", color: m.status==="active"?"#4ade80":"#fb923c", borderRadius:8, padding:"3px 10px", fontSize:".73rem", fontWeight:700 }}>
                      {m.status==="active"?"Aktif":"Pending"}
                    </span>
                  </td>
                  <td style={{ padding:"12px 14px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button style={{ width:27, height:27, borderRadius:7, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                        <Eye style={{ width:11, height:11 }} />
                      </button>
                      {m.status==="pending" && <>
                        <button style={{ width:27, height:27, borderRadius:7, background:"rgba(74,222,128,0.08)", border:"1px solid rgba(74,222,128,0.15)", color:"#4ade80", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                          <CheckCircle style={{ width:11, height:11 }} />
                        </button>
                        <button style={{ width:27, height:27, borderRadius:7, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.15)", color:"#f87171", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                          <XCircle style={{ width:11, height:11 }} />
                        </button>
                      </>}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ padding:"12px 20px", borderTop:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
          <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".78rem" }}>Menampilkan {(page-1)*perPage+1}–{Math.min(page*perPage,filtered.length)} dari {filtered.length}</p>
          <div style={{ display:"flex", gap:5 }}>
            {Array.from({length:totalPages},(_, i)=>i+1).slice(0,5).map(p => (
              <button key={p} onClick={()=>setPage(p)}
                style={{ width:30, height:30, borderRadius:8, fontSize:".78rem", fontWeight:600, cursor:"pointer", border:"1px solid", transition:"all .15s",
                  borderColor: p===page?"#D4AF37":"rgba(255,255,255,0.08)",
                  background: p===page?"rgba(212,175,55,0.15)":"rgba(255,255,255,0.03)",
                  color: p===page?"#D4AF37":"rgba(255,255,255,0.4)" }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
