"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export type TxRow = {
  id: string;
  user: string;
  type: string;
  gram: number;
  amount: number;
  status: "completed" | "pending" | "rejected" | "processing";
  date: string;
};

const STATUS_MAP = {
  completed:  { label:"Selesai",  bg:"rgba(74,222,128,0.1)",  color:"#4ade80" },
  pending:    { label:"Pending",  bg:"rgba(251,146,60,0.1)",  color:"#fb923c" },
  rejected:   { label:"Ditolak", bg:"rgba(248,113,113,0.1)", color:"#f87171" },
  processing: { label:"Diproses", bg:"rgba(96,165,250,0.1)", color:"#60a5fa" },
};

const TYPE_MAP: Record<string, string> = {
  buy:"Beli Emas", sell:"Jual Emas", buyback:"Buyback",
  cicilan:"Cicilan", tabungan:"Tabungan", transfer:"Transfer",
};

interface Props { data: TxRow[]; title?: string; showUser?: boolean; }

export default function TransactionTable({ data, title = "Transaksi Terbaru", showUser = true }: Props) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PER = 8;

  const filtered = data.filter(tx =>
    !search || tx.user.toLowerCase().includes(search.toLowerCase()) || tx.id.includes(search)
  );
  const paginated = filtered.slice((page-1)*PER, page*PER);
  const totalPages = Math.ceil(filtered.length / PER);

  return (
    <div style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, overflow:"hidden", backdropFilter:"blur(12px)" }}>
      {/* Header */}
      <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <h3 style={{ color:"#fff", fontWeight:700, fontSize:".95rem" }}>{title}</h3>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"6px 12px" }}>
            <Search style={{ width:13, height:13, color:"rgba(255,255,255,0.3)", flexShrink:0 }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari transaksi..."
              style={{ background:"transparent", border:"none", outline:"none", color:"rgba(255,255,255,0.7)", fontSize:".8rem", width:130 }} />
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
              {["ID", ...(showUser?["Member"]:[]), "Jenis","Berat","Jumlah","Status","Waktu"].map(h => (
                <th key={h} style={{ color:"rgba(255,255,255,0.3)", fontSize:".73rem", fontWeight:600, padding:"10px 14px", textAlign:"left", whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={showUser?7:6} style={{ padding:"32px", textAlign:"center", color:"rgba(255,255,255,0.2)", fontSize:".85rem" }}>
                  Tidak ada data transaksi
                </td>
              </tr>
            ) : paginated.map((tx, i) => {
              const s = STATUS_MAP[tx.status];
              return (
                <motion.tr key={tx.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                  style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.02)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="transparent"}>
                  <td style={{ padding:"12px 14px", fontFamily:"monospace", fontSize:".75rem", color:"rgba(255,255,255,0.35)" }}>#{tx.id.slice(-6)}</td>
                  {showUser && <td style={{ padding:"12px 14px", color:"rgba(255,255,255,0.75)", fontSize:".83rem", fontWeight:500 }}>{tx.user}</td>}
                  <td style={{ padding:"12px 14px", color:"rgba(255,255,255,0.6)", fontSize:".82rem" }}>{TYPE_MAP[tx.type] || tx.type}</td>
                  <td style={{ padding:"12px 14px", color:"#D4AF37", fontWeight:700, fontSize:".82rem" }}>{tx.gram}g</td>
                  <td style={{ padding:"12px 14px", color:"#fff", fontWeight:600, fontSize:".82rem", whiteSpace:"nowrap" }}>{formatCurrency(tx.amount)}</td>
                  <td style={{ padding:"12px 14px" }}>
                    <span style={{ background:s.bg, color:s.color, borderRadius:8, padding:"3px 10px", fontSize:".73rem", fontWeight:700, whiteSpace:"nowrap" }}>{s.label}</span>
                  </td>
                  <td style={{ padding:"12px 14px", color:"rgba(255,255,255,0.3)", fontSize:".75rem", whiteSpace:"nowrap" }}>{formatDateTime(tx.date)}</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ padding:"12px 20px", borderTop:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
          <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".78rem" }}>
            {(page-1)*PER+1}–{Math.min(page*PER, filtered.length)} dari {filtered.length}
          </p>
          <div style={{ display:"flex", gap:5 }}>
            <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}
              style={{ width:30, height:30, borderRadius:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", justifyContent:"center", cursor:page===1?"not-allowed":"pointer", opacity:page===1?.4:1 }}>
              <ChevronLeft style={{ width:13, height:13 }} />
            </button>
            {Array.from({ length:Math.min(5,totalPages) }, (_, i) => i+1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{ width:30, height:30, borderRadius:8, fontSize:".78rem", fontWeight:600, cursor:"pointer", border:"1px solid", transition:"all .15s",
                  borderColor: p===page?"#D4AF37":"rgba(255,255,255,0.08)",
                  background: p===page?"rgba(212,175,55,0.15)":"rgba(255,255,255,0.03)",
                  color: p===page?"#D4AF37":"rgba(255,255,255,0.4)" }}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
              style={{ width:30, height:30, borderRadius:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", justifyContent:"center", cursor:page===totalPages?"not-allowed":"pointer", opacity:page===totalPages?.4:1 }}>
              <ChevronRight style={{ width:13, height:13 }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
