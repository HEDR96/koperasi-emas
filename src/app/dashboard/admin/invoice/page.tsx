"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, RefreshCw, Search, X, Printer } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSiteName } from "@/store/useSettingsStore";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" });

const TYPE_LABEL: Record<string,string> = {
  buy:"Pembelian Emas", buyback:"Buyback Emas", cicilan:"Cicilan Emas", tabungan:"Simpanan (lama)", transfer:"Transfer", referral_bonus:"Bonus Referral",
};

export default function AdminInvoicePage() {
  const siteName = useSiteName();
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [inv, setInv] = useState<any>(null);

  async function load() {
    setLoading(true);
    const { data } = await (supabase.from("transactions") as any)
      .select("id, type, amount, gram, price_per_gram, payment_method, status, notes, created_at, transaction_date, profiles(name, nik, phone)")
      .eq("status","completed").order("created_at",{ascending:false}).limit(200);
    setRows(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = rows.filter(r =>
    (r.profiles?.name||"").toLowerCase().includes(search.toLowerCase()) ||
    r.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Invoice Transaksi</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Lihat & cetak bukti transaksi yang selesai</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      <div style={{ position:"relative", maxWidth:400 }}>
        <Search style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:15, height:15, color:"rgba(255,255,255,0.3)" }} />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama / ID invoice..."
          style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:10, padding:"10px 14px 10px 38px", color:"#fff", fontSize:".88rem", outline:"none", boxSizing:"border-box" }} />
      </div>

      <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              {["No. Invoice","Anggota","Jenis","Jumlah","Tanggal",""].map(h=>(
                <th key={h} style={{ padding:"12px 18px", textAlign:"left", color:"rgba(255,255,255,0.3)", fontSize:".73rem", fontWeight:600, textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding:"40px", textAlign:"center", color:"rgba(255,255,255,0.3)" }}>Memuat...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding:"40px", textAlign:"center", color:"rgba(255,255,255,0.3)" }}>Tidak ada invoice.</td></tr>
              ) : filtered.map(r=>(
                <tr key={r.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding:"12px 18px", color:"#D4AF37", fontFamily:"monospace", fontSize:".8rem" }}>INV-{r.id.slice(0,8).toUpperCase()}</td>
                  <td style={{ padding:"12px 18px", color:"#fff", fontSize:".85rem" }}>{r.profiles?.name||"—"}</td>
                  <td style={{ padding:"12px 18px", color:"rgba(255,255,255,0.6)", fontSize:".85rem" }}>{TYPE_LABEL[r.type]||r.type}</td>
                  <td style={{ padding:"12px 18px", color:"#D4AF37", fontWeight:600, fontSize:".85rem" }}>{fmt(r.amount)}</td>
                  <td style={{ padding:"12px 18px", color:"rgba(255,255,255,0.45)", fontSize:".8rem", whiteSpace:"nowrap" }}>{fmtDate((r as any).transaction_date || r.created_at)}</td>
                  <td style={{ padding:"12px 18px" }}>
                    <button onClick={()=>setInv(r)} style={{ background:"rgba(96,165,250,0.1)", border:"1px solid rgba(96,165,250,0.25)", borderRadius:8, padding:"5px 12px", color:"#60a5fa", cursor:"pointer", fontSize:".78rem", fontWeight:600 }}>Lihat</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      <AnimatePresence>
        {inv && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={()=>setInv(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:300 }} />
            <motion.div initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:.95 }}
              style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"min(440px,94vw)", background:"#0f0f0f", border:"1px solid rgba(212,175,55,0.2)", borderRadius:18, zIndex:301, padding:0, overflow:"hidden" }}>
              <div id="invoice-print" style={{ padding:"28px 28px 20px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                  <div>
                    <p style={{ color:"#D4AF37", fontWeight:900, fontSize:"1.1rem", margin:0 }}>{siteName}</p>
                    <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem", margin:"2px 0 0" }}>Bukti Transaksi Resmi</p>
                  </div>
                  <span style={{ color:"#D4AF37", fontFamily:"monospace", fontSize:".82rem" }}>INV-{inv.id.slice(0,8).toUpperCase()}</span>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:0, border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, overflow:"hidden" }}>
                  {[
                    ["Anggota", inv.profiles?.name||"—"],
                    ["ID", inv.profiles?.nik||"—"],
                    ["Jenis", TYPE_LABEL[inv.type]||inv.type],
                    ...(inv.gram ? [["Berat", `${Number(inv.gram).toFixed(1)} gram`]] : []),
                    ...(inv.price_per_gram ? [["Harga/gram", fmt(inv.price_per_gram)]] : []),
                    ["Metode", inv.payment_method||"—"],
                    ["Tanggal", fmtDate((inv as any).transaction_date || inv.created_at)],
                  ].map(([k,v],idx,arr)=>(
                    <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"10px 16px", borderBottom: idx<arr.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
                      <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".82rem" }}>{k}</span>
                      <span style={{ color:"#fff", fontSize:".82rem", fontWeight:600 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:16, padding:"14px 16px", background:"rgba(212,175,55,0.08)", borderRadius:12 }}>
                  <span style={{ color:"rgba(255,255,255,0.7)", fontWeight:600 }}>Total</span>
                  <span style={{ color:"#D4AF37", fontWeight:900, fontSize:"1.3rem" }}>{fmt(inv.amount)}</span>
                </div>
                {inv.notes && (
                  <div style={{ marginTop:12, padding:"10px 14px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10 }}>
                    <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".05em", margin:"0 0 4px" }}>Catatan</p>
                    <p style={{ color:"rgba(255,255,255,0.75)", fontSize:".82rem", margin:0 }}>{inv.notes}</p>
                  </div>
                )}
              </div>
              <div style={{ display:"flex", gap:10, padding:"0 28px 24px" }}>
                <button onClick={()=>setInv(null)} style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px", color:"rgba(255,255,255,0.6)", cursor:"pointer", fontSize:".86rem" }}>Tutup</button>
                <button onClick={()=>window.print()} style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, background:"rgba(212,175,55,0.15)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:10, padding:"10px", color:"#D4AF37", cursor:"pointer", fontSize:".86rem", fontWeight:700 }}>
                  <Printer style={{ width:14, height:14 }} /> Cetak
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

