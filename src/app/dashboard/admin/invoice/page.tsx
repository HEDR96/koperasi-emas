"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Download, Printer, Search, Eye } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

const INVOICES = Array.from({ length: 14 }, (_, i) => ({
  id: `INV-2024-${String(i+1).padStart(4,"0")}`,
  member: ["Budi Santoso","Siti Rahayu","Ahmad Fauzi","Dewi Kartika","Rino Pratama"][i%5],
  type: ["Beli Emas","Cicilan DP","Buyback","Tabungan","Cicilan Bulanan"][i%5],
  amount: (i+1)*980000+50000,
  gram: +((i+1)*0.5).toFixed(2),
  date: new Date(Date.now()-i*2*86400000).toISOString(),
  status: i%3===2?"unpaid":"paid" as "paid"|"unpaid",
}));

export default function InvoicePage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<typeof INVOICES[0]|null>(null);

  const filtered = INVOICES.filter(inv =>
    inv.member.toLowerCase().includes(search.toLowerCase()) ||
    inv.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
      {/* List */}
      <div style={{ flex:"1 1 400px" }}>
        <div style={{ display:"flex", gap:16, marginBottom:20, flexWrap:"wrap" }}>
          {[
            { label:"Total Invoice", value:INVOICES.length, color:"#D4AF37" },
            { label:"Lunas", value:INVOICES.filter(i=>i.status==="paid").length, color:"#4ade80" },
            { label:"Belum Bayar", value:INVOICES.filter(i=>i.status==="unpaid").length, color:"#f87171" },
          ].map(s => (
            <div key={s.label} style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:14, padding:"14px 18px", flex:1, minWidth:120 }}>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".74rem" }}>{s.label}</p>
              <p style={{ color:s.color, fontSize:"1.5rem", fontWeight:900 }}>{s.value}</p>
            </div>
          ))}
        </div>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:22 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <h3 style={{ color:"#fff", fontWeight:700, flex:1 }}>Daftar Invoice</h3>
            <div style={{ display:"flex", alignItems:"center", gap:7, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:9, padding:"6px 10px" }}>
              <Search style={{ width:13, height:13, color:"rgba(255,255,255,0.3)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..."
                style={{ background:"none", border:"none", outline:"none", color:"rgba(255,255,255,0.7)", fontSize:".8rem", width:120 }} />
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {filtered.map((inv, i) => (
              <motion.div key={inv.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                onClick={() => setSelected(inv)}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom: i<filtered.length-1?"1px solid rgba(255,255,255,0.04)":"none", cursor:"pointer" }}>
                <div style={{ width:38, height:38, borderRadius:10, background:"rgba(212,175,55,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <FileText style={{ width:16, height:16, color:"#D4AF37" }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <p style={{ color:"#fff", fontSize:".83rem", fontWeight:600 }}>{inv.id}</p>
                    <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".83rem" }}>{formatCurrency(inv.amount)}</p>
                  </div>
                  <div style={{ display:"flex", gap:8, marginTop:2 }}>
                    <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem" }}>{inv.member}</span>
                    <span style={{ color:"rgba(255,255,255,0.2)", fontSize:".75rem" }}>·</span>
                    <span style={{ color:"rgba(255,255,255,0.3)", fontSize:".75rem" }}>{formatDate(inv.date)}</span>
                  </div>
                </div>
                <span style={{ background: inv.status==="paid"?"rgba(74,222,128,0.1)":"rgba(248,113,113,0.1)", color: inv.status==="paid"?"#4ade80":"#f87171", borderRadius:8, padding:"2px 8px", fontSize:".72rem", fontWeight:700, flexShrink:0 }}>
                  {inv.status==="paid"?"Lunas":"Belum Bayar"}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Invoice Preview */}
      <div style={{ flex:"0 0 300px", minWidth:260 }}>
        {selected ? (
          <motion.div key={selected.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
            style={{ background:"rgba(14,14,14,0.9)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:20, padding:24, position:"sticky", top:80 }}>
            {/* Invoice Header */}
            <div className="bg-gold-gradient" style={{ borderRadius:12, padding:"14px 18px", marginBottom:20, textAlign:"center" }}>
              <p style={{ color:"#0a0a0a", fontWeight:900, fontSize:"1.1rem" }}>INVOICE</p>
              <p style={{ color:"rgba(0,0,0,0.6)", fontSize:".75rem" }}>Koperasi Emas</p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
              {[
                { label:"No Invoice", value:selected.id },
                { label:"Tanggal", value:formatDate(selected.date) },
                { label:"Nama", value:selected.member },
                { label:"Jenis", value:selected.type },
                { label:"Jumlah Emas", value:`${selected.gram}g` },
              ].map(r => (
                <div key={r.label} style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ color:"rgba(255,255,255,0.35)", fontSize:".78rem" }}>{r.label}</span>
                  <span style={{ color:"rgba(255,255,255,0.7)", fontSize:".78rem", fontWeight:500 }}>{r.value}</span>
                </div>
              ))}
              <div style={{ height:1, background:"rgba(255,255,255,0.08)", margin:"6px 0" }} />
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ color:"#fff", fontWeight:700, fontSize:".88rem" }}>Total</span>
                <span style={{ color:"#D4AF37", fontWeight:900, fontSize:".9rem" }}>{formatCurrency(selected.amount)}</span>
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button className="btn-gold" style={{ flex:1, padding:"9px", borderRadius:10, border:"none", cursor:"pointer", fontSize:".78rem", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                <Printer style={{ width:12, height:12 }} /> Cetak
              </button>
              <button className="btn-outline-gold" style={{ flex:1, padding:"9px", borderRadius:10, cursor:"pointer", fontSize:".78rem", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                <Download style={{ width:12, height:12 }} /> PDF
              </button>
            </div>
          </motion.div>
        ) : (
          <div style={{ background:"rgba(14,14,14,0.6)", border:"1px solid rgba(212,175,55,0.08)", borderRadius:20, padding:32, textAlign:"center" }}>
            <Eye style={{ width:32, height:32, color:"rgba(255,255,255,0.15)", margin:"0 auto 10px" }} />
            <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".83rem" }}>Pilih invoice untuk preview</p>
          </div>
        )}
      </div>
    </div>
  );
}
