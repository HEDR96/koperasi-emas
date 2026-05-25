"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, ArrowLeftRight, CheckCircle, AlertCircle, TrendingDown } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { formatCurrency } from "@/lib/utils";

const BUYBACK_PRICE = 1890000; // per gram

export default function BuybackPage() {
  const { user } = useAuthStore();
  const totalGold = user?.balance?.gold || 125.5;
  const [gram, setGram] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<"form"|"confirm">("form");

  const amount = gram * BUYBACK_PRICE;
  const fee = Math.floor(amount * 0.002);
  const net = amount - fee;

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <motion.div initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }}
        style={{ maxWidth:480, margin:"40px auto", background:"rgba(14,14,14,0.9)", border:"1px solid rgba(74,222,128,0.3)", borderRadius:22, padding:"40px 32px", textAlign:"center" }}>
        <div style={{ width:70, height:70, borderRadius:20, background:"rgba(74,222,128,0.1)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
          <CheckCircle style={{ width:35, height:35, color:"#4ade80" }} />
        </div>
        <h2 style={{ color:"#fff", fontWeight:900, fontSize:"1.4rem", marginBottom:8 }}>Buyback Berhasil!</h2>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", marginBottom:20 }}>Permintaan buyback kamu sedang diproses</p>
        <div style={{ background:"rgba(74,222,128,0.05)", border:"1px solid rgba(74,222,128,0.15)", borderRadius:14, padding:"16px 20px", marginBottom:24 }}>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem" }}>Dana akan masuk ke rekening dalam</p>
          <p style={{ color:"#4ade80", fontSize:"1.5rem", fontWeight:900, marginTop:4 }}>1–2 Hari Kerja</p>
          <p style={{ color:"#D4AF37", fontWeight:700, marginTop:4 }}>{formatCurrency(net)}</p>
        </div>
        <button className="btn-gold" onClick={() => { setSuccess(false); setStep("form"); setGram(1); }}
          style={{ padding:"12px 28px", borderRadius:13, border:"none", cursor:"pointer", fontSize:".9rem" }}>
          Buyback Lagi
        </button>
      </motion.div>
    );
  }

  return (
    <div style={{ maxWidth:540, margin:"0 auto", display:"flex", flexDirection:"column", gap:20 }}>
      {/* Info Banner */}
      <div style={{ background:"rgba(251,146,60,0.08)", border:"1px solid rgba(251,146,60,0.2)", borderRadius:14, padding:"12px 16px", display:"flex", alignItems:"flex-start", gap:10 }}>
        <AlertCircle style={{ width:16, height:16, color:"#fb923c", flexShrink:0, marginTop:1 }} />
        <p style={{ color:"rgba(255,255,255,0.55)", fontSize:".8rem", lineHeight:1.5 }}>
          Buyback harga member: <strong style={{ color:"#D4AF37" }}>{formatCurrency(BUYBACK_PRICE)}/gram</strong>.
          Proses 1–2 hari kerja. Biaya admin 0.2% dari nilai transaksi.
        </p>
      </div>

      {/* Saldo */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:18, padding:22 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
          <Coins style={{ width:18, height:18, color:"#D4AF37" }} />
          <span style={{ color:"rgba(255,255,255,0.5)", fontSize:".82rem" }}>Emas Tersedia untuk Buyback</span>
        </div>
        <p style={{ color:"#D4AF37", fontSize:"2.2rem", fontWeight:900 }}>{totalGold}<span style={{ fontSize:"1rem", color:"rgba(212,175,55,0.5)" }}>g</span></p>
        <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".78rem" }}>≈ {formatCurrency(totalGold * BUYBACK_PRICE)}</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === "form" ? (
          <motion.div key="form" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}
            style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:18, padding:24 }}>
            <h3 style={{ color:"#fff", fontWeight:700, marginBottom:20 }}>Jumlah Emas yang Dijual</h3>

            {/* Gram Selector */}
            <div style={{ marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem" }}>Gram</span>
                <span style={{ color:"#D4AF37", fontWeight:700 }}>{gram}g</span>
              </div>
              <input type="range" min={0.5} max={Math.min(totalGold, 50)} step={0.5} value={gram} onChange={e => setGram(+e.target.value)}
                style={{ width:"100%" }} />
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
                <span style={{ color:"rgba(255,255,255,0.2)", fontSize:".72rem" }}>Min: 0.5g</span>
                <span style={{ color:"rgba(255,255,255,0.2)", fontSize:".72rem" }}>Maks: {Math.min(totalGold,50)}g</span>
              </div>
            </div>

            {/* Presets */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:20 }}>
              {[1,2,5,10].map(g => (
                <button key={g} onClick={() => setGram(g)}
                  style={{ padding:"8px 4px", borderRadius:10, border:"1px solid", cursor:"pointer", fontSize:".8rem", fontWeight:600, transition:"all .15s",
                    borderColor: gram===g?"#D4AF37":"rgba(255,255,255,0.1)",
                    background: gram===g?"rgba(212,175,55,0.12)":"transparent",
                    color: gram===g?"#D4AF37":"rgba(255,255,255,0.4)" }}>
                  {g}g
                </button>
              ))}
            </div>

            {/* Summary */}
            <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:14, padding:16, marginBottom:20 }}>
              {[
                { label:"Harga per gram", value:formatCurrency(BUYBACK_PRICE) },
                { label:"Total emas", value:`${gram}g` },
                { label:"Nilai bruto", value:formatCurrency(amount) },
                { label:"Biaya admin (0.2%)", value:`-${formatCurrency(fee)}`, color:"#f87171" },
              ].map(r => (
                <div key={r.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".8rem" }}>{r.label}</span>
                  <span style={{ color: (r as any).color || "rgba(255,255,255,0.7)", fontSize:".8rem", fontWeight:500 }}>{r.value}</span>
                </div>
              ))}
              <div style={{ height:1, background:"rgba(255,255,255,0.08)", margin:"8px 0" }} />
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ color:"#fff", fontWeight:700 }}>Dana Diterima</span>
                <span style={{ color:"#4ade80", fontWeight:900, fontSize:"1.05rem" }}>{formatCurrency(net)}</span>
              </div>
            </div>

            <button className="btn-gold" onClick={() => setStep("confirm")}
              style={{ width:"100%", padding:"13px", borderRadius:13, border:"none", cursor:"pointer", fontSize:".92rem", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              <ArrowLeftRight style={{ width:16, height:16 }} />
              Lanjut Konfirmasi
            </button>
          </motion.div>
        ) : (
          <motion.div key="confirm" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
            style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:18, padding:24 }}>
            <h3 style={{ color:"#fff", fontWeight:700, marginBottom:6 }}>Konfirmasi Buyback</h3>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".82rem", marginBottom:20 }}>Pastikan data sudah benar sebelum melanjutkan</p>
            <div style={{ background:"rgba(212,175,55,0.05)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:14, padding:18, marginBottom:20 }}>
              {[
                { label:"Emas yang dijual", value:`${gram}g` },
                { label:"Harga buyback", value:formatCurrency(BUYBACK_PRICE)+"/g" },
                { label:"Dana diterima", value:formatCurrency(net), highlight:true },
                { label:"Estimasi proses", value:"1–2 Hari Kerja" },
              ].map(r => (
                <div key={r.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                  <span style={{ color:"rgba(255,255,255,0.45)", fontSize:".82rem" }}>{r.label}</span>
                  <span style={{ color: (r as any).highlight?"#4ade80":"rgba(255,255,255,0.75)", fontWeight: (r as any).highlight?900:500, fontSize:".83rem" }}>{r.value}</span>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setStep("form")} className="btn-outline-gold"
                style={{ flex:1, padding:"12px", borderRadius:12, cursor:"pointer", fontSize:".87rem" }}>
                Kembali
              </button>
              <button className="btn-gold" onClick={handleSubmit} disabled={loading}
                style={{ flex:2, padding:"12px", borderRadius:12, border:"none", cursor:loading?"not-allowed":"pointer", fontSize:".87rem", opacity:loading?.65:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <TrendingDown style={{ width:15, height:15 }} />
                {loading ? "Memproses..." : "Konfirmasi Buyback"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
