"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Coins, ShoppingCart, Check, ArrowRight, CheckCircle } from "lucide-react";
import { formatCurrency, formatGoldWeight } from "@/lib/utils";
import { useGoldStore } from "@/store/useGoldStore";
import { GOLD_DENOMINATIONS } from "@/lib/constants";

const PAYMENT_METHODS = [
  { id:"bca",     label:"BCA Transfer",    icon:"🏦" },
  { id:"mandiri", label:"Mandiri Transfer", icon:"🏦" },
  { id:"bni",     label:"BNI Transfer",    icon:"🏦" },
  { id:"qris",    label:"QRIS",            icon:"📱" },
  { id:"ewallet", label:"E-Wallet KE",    icon:"💳" },
];

export default function BeliEmasPage() {
  const { prices } = useGoldStore();
  const [gram, setGram] = useState(1);
  const [customGram, setCustomGram] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const selectedGram = customGram ? +customGram : gram;
  const total = selectedGram * prices.buyMember;

  const handleOrder = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    setLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <motion.div initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }}
        style={{ maxWidth:480, margin:"40px auto", textAlign:"center", background:"rgba(14,14,14,0.9)", border:"1px solid rgba(74,222,128,0.25)", borderRadius:22, padding:"44px 32px" }}>
        <div style={{ width:72, height:72, borderRadius:20, background:"rgba(74,222,128,0.1)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
          <CheckCircle style={{ width:36, height:36, color:"#4ade80" }} />
        </div>
        <h2 style={{ color:"#fff", fontWeight:900, fontSize:"1.5rem", marginBottom:8 }}>Pesanan Dibuat!</h2>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", marginBottom:24 }}>
          Pesanan {formatGoldWeight(selectedGram)} emas berhasil. Lanjutkan pembayaran.
        </p>
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:20, marginBottom:24, textAlign:"left" }}>
          {[
            { label:"Berat Emas", value:formatGoldWeight(selectedGram) },
            { label:"Harga/gram", value:formatCurrency(prices.buyMember) },
            { label:"Metode Bayar", value:PAYMENT_METHODS.find(m=>m.id===paymentMethod)?.label || "-" },
            { label:"Total Bayar", value:formatCurrency(total), highlight:true },
          ].map(r => (
            <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".82rem" }}>{r.label}</span>
              <span style={{ color: (r as any).highlight?"#D4AF37":"rgba(255,255,255,0.8)", fontWeight: (r as any).highlight?900:500, fontSize:(r as any).highlight?"1rem":".82rem" }}>{r.value}</span>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button className="btn-gold" onClick={() => { setSuccess(false); setGram(1); setCustomGram(""); setPaymentMethod(""); }}
            style={{ flex:1, padding:"12px", borderRadius:12, border:"none", cursor:"pointer", fontSize:".87rem" }}>
            Transaksi Baru
          </button>
          <button className="btn-outline-gold" style={{ flex:1, padding:"12px", borderRadius:12, cursor:"pointer", fontSize:".87rem" }}>
            Download Invoice
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div style={{ maxWidth:560, margin:"0 auto", display:"flex", flexDirection:"column", gap:20 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ width:44, height:44, borderRadius:13, background:"rgba(212,175,55,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Coins style={{ width:20, height:20, color:"#D4AF37" }} />
        </div>
        <div>
          <h2 style={{ color:"#fff", fontWeight:900, fontSize:"1.2rem" }}>Beli Emas</h2>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".8rem" }}>Harga member: {formatCurrency(prices.buyMember)}/gram</p>
        </div>
      </div>

      {/* Pilih Berat */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24 }}>
        <h3 style={{ color:"#fff", fontWeight:700, marginBottom:16 }}>Pilih Berat Emas</h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:16 }}>
          {GOLD_DENOMINATIONS.slice(0, 8).map(d => (
            <button key={d.gram} onClick={() => { setGram(d.gram); setCustomGram(""); }}
              style={{ padding:"10px 4px", borderRadius:12, border:"1px solid", textAlign:"center", cursor:"pointer", transition:"all .15s", fontSize:".82rem", fontWeight:700,
                borderColor: gram===d.gram&&!customGram?"#D4AF37":"rgba(255,255,255,0.1)",
                background: gram===d.gram&&!customGram?"rgba(212,175,55,0.12)":"rgba(255,255,255,0.03)",
                color: gram===d.gram&&!customGram?"#D4AF37":"rgba(255,255,255,0.5)" }}>
              {d.label}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <input type="number" placeholder="Atau masukkan gram manual..." value={customGram} onChange={e => setCustomGram(e.target.value)}
            min="0.01" step="0.01" className="input-gold"
            style={{ flex:1, borderRadius:12, padding:"10px 14px", fontSize:".85rem" }} />
          <span style={{ color:"rgba(255,255,255,0.35)", fontSize:".82rem", whiteSpace:"nowrap" }}>gram</span>
        </div>
        {selectedGram > 0 && (
          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".76rem", marginTop:8 }}>
            Estimasi: {formatCurrency(selectedGram * prices.buyMember)}
          </p>
        )}
      </motion.div>

      {/* Metode Bayar */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24 }}>
        <h3 style={{ color:"#fff", fontWeight:700, marginBottom:14 }}>Metode Pembayaran</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {PAYMENT_METHODS.map(m => (
            <button key={m.id} onClick={() => setPaymentMethod(m.id)}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:13, border:"1px solid", cursor:"pointer", textAlign:"left", transition:"all .15s",
                borderColor: paymentMethod===m.id?"#D4AF37":"rgba(255,255,255,0.08)",
                background: paymentMethod===m.id?"rgba(212,175,55,0.08)":"rgba(255,255,255,0.02)" }}>
              <span style={{ fontSize:"1.2rem" }}>{m.icon}</span>
              <span style={{ color: paymentMethod===m.id?"#fff":"rgba(255,255,255,0.6)", fontSize:".85rem", fontWeight:500, flex:1 }}>{m.label}</span>
              {paymentMethod===m.id && <Check style={{ width:15, height:15, color:"#D4AF37" }} />}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Summary */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:20, padding:24 }}>
        <h3 style={{ color:"#fff", fontWeight:700, marginBottom:14 }}>Ringkasan Pesanan</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {[
            { label:"Berat Emas", value:formatGoldWeight(selectedGram) },
            { label:"Harga per Gram", value:formatCurrency(prices.buyMember) },
            { label:"Metode Bayar", value:PAYMENT_METHODS.find(m=>m.id===paymentMethod)?.label || "—" },
          ].map(r => (
            <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".82rem" }}>{r.label}</span>
              <span style={{ color:"rgba(255,255,255,0.75)", fontSize:".82rem", fontWeight:500 }}>{r.value}</span>
            </div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", paddingTop:12 }}>
            <span style={{ color:"#fff", fontWeight:700, fontSize:".9rem" }}>Total Bayar</span>
            <span className="text-gold-gradient" style={{ fontSize:"1.3rem", fontWeight:900 }}>{formatCurrency(total)}</span>
          </div>
        </div>

        <button className="btn-gold" onClick={handleOrder} disabled={!paymentMethod||selectedGram<=0||loading}
          style={{ width:"100%", marginTop:18, padding:"14px", borderRadius:13, border:"none", cursor:(!paymentMethod||selectedGram<=0)?"not-allowed":"pointer", fontSize:".92rem", display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity:(!paymentMethod||selectedGram<=0)?0.5:1 }}>
          {loading ? (
            "Memproses..."
          ) : (
            <><ShoppingCart style={{ width:17, height:17 }} /> Buat Pesanan <ArrowRight style={{ width:15, height:15 }} /></>
          )}
        </button>
      </motion.div>
    </div>
  );
}
