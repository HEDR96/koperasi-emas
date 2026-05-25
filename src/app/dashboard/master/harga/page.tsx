"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Coins, Save, TrendingUp, TrendingDown, History } from "lucide-react";
import { useGoldStore } from "@/store/useGoldStore";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const HISTORY = [
  { date:"2026-05-24T08:00:00", buyMember:1694000, buyNonMember:1741000, by:"Super Admin" },
  { date:"2026-05-23T09:15:00", buyMember:1688000, buyNonMember:1735000, by:"Super Admin" },
  { date:"2026-05-22T08:30:00", buyMember:1701000, buyNonMember:1748000, by:"Super Admin" },
  { date:"2026-05-21T10:00:00", buyMember:1682000, buyNonMember:1729000, by:"Admin Rini" },
];

export default function HargaEmasPage() {
  const { prices, setPrices } = useGoldStore();
  const [form, setForm] = useState({
    buyMember: String(prices.buyMember),
    buyNonMember: String(prices.buyNonMember),
    buybackMember: String(prices.buybackMember),
    buybackNonMember: String(prices.buybackNonMember),
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setPrices({
      ...prices,
      buyMember: +form.buyMember,
      buyNonMember: +form.buyNonMember,
      buybackMember: +form.buybackMember,
      buybackNonMember: +form.buybackNonMember,
      lastUpdate: new Date().toISOString(),
    });
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const priceCards = [
    { label:"Harga Beli Member", key:"buyMember" as const, badge:"Member" },
    { label:"Harga Beli Non-Member", key:"buyNonMember" as const },
    { label:"Buyback Member", key:"buybackMember" as const, badge:"Terbaik" },
    { label:"Buyback Non-Member", key:"buybackNonMember" as const },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Current Prices */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16 }}>
        {priceCards.map(p => (
          <motion.div key={p.key} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:16, padding:"20px 18px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".76rem" }}>{p.label}</span>
              {p.badge && <span style={{ background:"rgba(212,175,55,0.12)", color:"#D4AF37", borderRadius:20, padding:"2px 8px", fontSize:".68rem", fontWeight:700 }}>{p.badge}</span>}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <p style={{ color:"#fff", fontSize:"1.4rem", fontWeight:900 }}>{formatCurrency(prices[p.key])}</p>
              <TrendingUp style={{ width:14, height:14, color:"#4ade80" }} />
            </div>
            <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".72rem", marginTop:4 }}>per gram</p>
          </motion.div>
        ))}
      </div>

      {/* Edit Form */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:20, padding:28 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:22 }}>
          <div style={{ width:40, height:40, borderRadius:11, background:"rgba(212,175,55,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Coins style={{ width:18, height:18, color:"#D4AF37" }} />
          </div>
          <div>
            <h3 style={{ color:"#fff", fontWeight:700 }}>Update Harga Emas</h3>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".78rem" }}>Terakhir diubah: {formatDateTime(prices.lastUpdate)}</p>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:18 }}>
          {priceCards.map(p => (
            <div key={p.key}>
              <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:8 }}>
                {p.label} <span style={{ color:"rgba(255,255,255,0.2)", fontSize:".72rem" }}>(Rp/gram)</span>
              </label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.3)", fontSize:".85rem" }}>Rp</span>
                <input type="number" value={form[p.key]} onChange={e => setForm({ ...form, [p.key]:e.target.value })}
                  className="input-gold" style={{ borderRadius:12, padding:"11px 14px 11px 36px", fontSize:".9rem", width:"100%" }} />
              </div>
              <p style={{ color:"rgba(255,255,255,0.2)", fontSize:".72rem", marginTop:4 }}>
                Saat ini: {formatCurrency(prices[p.key])}
                {+form[p.key] !== prices[p.key] && (
                  <span style={{ color: +form[p.key]>prices[p.key]?"#4ade80":"#f87171", marginLeft:6 }}>
                    {+form[p.key]>prices[p.key]?"↑":"↓"} {formatCurrency(Math.abs(+form[p.key]-prices[p.key]))}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:14, marginTop:24 }}>
          <button className="btn-gold" onClick={handleSave} disabled={loading}
            style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 24px", borderRadius:13, border:"none", cursor:loading?"not-allowed":"pointer", fontSize:".9rem", opacity:loading?.65:1 }}>
            <Save style={{ width:16, height:16 }} />
            {loading ? "Menyimpan..." : "Simpan Harga"}
          </button>
          {saved && (
            <motion.span initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
              style={{ color:"#4ade80", fontSize:".83rem", fontWeight:600 }}>✓ Harga berhasil diperbarui!</motion.span>
          )}
        </div>
      </motion.div>

      {/* Change History */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <History style={{ width:16, height:16, color:"#D4AF37" }} />
          <h3 style={{ color:"#fff", fontWeight:700 }}>Riwayat Perubahan</h3>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                {["Tanggal","Harga Beli Member","Harga Beli Non-Member","Diubah Oleh"].map(h => (
                  <th key={h} style={{ color:"rgba(255,255,255,0.3)", fontSize:".73rem", fontWeight:600, padding:"8px 14px", textAlign:"left", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HISTORY.map((h, i) => (
                <tr key={i} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding:"12px 14px", color:"rgba(255,255,255,0.35)", fontSize:".78rem" }}>{formatDateTime(h.date)}</td>
                  <td style={{ padding:"12px 14px", color:"#D4AF37", fontWeight:700, fontSize:".83rem" }}>{formatCurrency(h.buyMember)}</td>
                  <td style={{ padding:"12px 14px", color:"rgba(255,255,255,0.6)", fontSize:".83rem" }}>{formatCurrency(h.buyNonMember)}</td>
                  <td style={{ padding:"12px 14px", color:"rgba(255,255,255,0.45)", fontSize:".8rem" }}>{h.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
