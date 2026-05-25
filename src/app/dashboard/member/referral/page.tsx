"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Copy, Share2, Check, Users, TrendingUp } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { formatCurrency } from "@/lib/utils";

const REFERRAL_HISTORY = Array.from({ length: 8 }, (_, i) => ({
  id: i+1,
  name: ["Wahyu H.","Mega P.","Farhan A.","Linda S.","Bagus K."][i%5],
  joinDate: new Date(Date.now()-i*7*86400000).toISOString().slice(0,10),
  bonus: 50000,
  status: i%3===2?"pending":"paid" as "paid"|"pending",
}));

export default function ReferralPage() {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const link = `https://koperasiemasdigital.co.id/register?ref=${user?.referralCode || "KED-DEMO"}`;

  const copy = (text: string, type: "code"|"link") => {
    navigator.clipboard?.writeText(text).catch(()=>{});
    if (type==="code") { setCopied(true); setTimeout(()=>setCopied(false),2000); }
    else { setCopiedLink(true); setTimeout(()=>setCopiedLink(false),2000); }
  };

  const totalEarned = REFERRAL_HISTORY.filter(r=>r.status==="paid").length*50000;
  const totalPending = REFERRAL_HISTORY.filter(r=>r.status==="pending").length*50000;

  return (
    <div style={{ maxWidth:580, margin:"0 auto", display:"flex", flexDirection:"column", gap:24 }}>
      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        {[
          { label:"Total Diajak", value:String(REFERRAL_HISTORY.length), icon:Users, color:"#60a5fa" },
          { label:"Bonus Diterima", value:formatCurrency(totalEarned), icon:Check, color:"#4ade80" },
          { label:"Pending", value:formatCurrency(totalPending), icon:TrendingUp, color:"#D4AF37" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:16, padding:"18px 14px", textAlign:"center" }}>
              <Icon style={{ width:20, height:20, color:s.color, margin:"0 auto 8px" }} />
              <p style={{ color:"#fff", fontWeight:900, fontSize:"1.1rem" }}>{s.value}</p>
              <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".72rem" }}>{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Referral Code Card */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:20, padding:26 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <div style={{ width:44, height:44, borderRadius:13, background:"rgba(212,175,55,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Gift style={{ width:20, height:20, color:"#D4AF37" }} />
          </div>
          <div>
            <h3 style={{ color:"#fff", fontWeight:700 }}>Kode Referral Kamu</h3>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".8rem" }}>Dapatkan Rp 50.000 per teman yang bergabung</p>
          </div>
        </div>

        {/* Code Display */}
        <div style={{ background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:14, padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <span className="text-gold-gradient" style={{ fontSize:"1.6rem", fontWeight:900, letterSpacing:".15em" }}>{user?.referralCode || "KED-DEMO"}</span>
          <button onClick={() => copy(user?.referralCode || "KED-DEMO", "code")} className="btn-outline-gold"
            style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 14px", borderRadius:9, cursor:"pointer", fontSize:".8rem" }}>
            {copied ? <Check style={{ width:13, height:13 }} /> : <Copy style={{ width:13, height:13 }} />}
            {copied ? "Disalin!" : "Salin"}
          </button>
        </div>

        {/* Link */}
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"10px 14px", display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <span style={{ color:"rgba(255,255,255,0.3)", fontSize:".76rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{link}</span>
          <button onClick={() => copy(link, "link")}
            style={{ width:28, height:28, borderRadius:8, background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.15)", color:"#D4AF37", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
            {copiedLink ? <Check style={{ width:11, height:11 }} /> : <Copy style={{ width:11, height:11 }} />}
          </button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <button className="btn-gold" onClick={() => copy(link, "link")}
            style={{ padding:"11px", borderRadius:12, border:"none", cursor:"pointer", fontSize:".85rem", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
            <Copy style={{ width:14, height:14 }} /> Salin Link
          </button>
          <button style={{ padding:"11px", borderRadius:12, border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.6)", cursor:"pointer", fontSize:".85rem", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
            <Share2 style={{ width:14, height:14 }} /> Share via WA
          </button>
        </div>
      </motion.div>

      {/* How it works */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24 }}>
        <h3 style={{ color:"#fff", fontWeight:700, marginBottom:18 }}>Cara Kerja Referral</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {[
            { step:1, title:"Share kode referral kamu", desc:"Bagikan kode atau link ke teman dan keluarga." },
            { step:2, title:"Teman mendaftar & bertransaksi", desc:"Teman kamu daftar dan melakukan transaksi pertama." },
            { step:3, title:"Bonus langsung dikreditkan", desc:"Rp 50.000 otomatis masuk ke e-wallet kamu." },
          ].map(item => (
            <div key={item.step} style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
              <div className="bg-gold-gradient" style={{ width:34, height:34, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:"#0a0a0a", fontSize:".88rem", flexShrink:0 }}>{item.step}</div>
              <div>
                <p style={{ color:"#fff", fontSize:".86rem", fontWeight:600, marginBottom:3 }}>{item.title}</p>
                <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".78rem" }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Referral History */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24 }}>
        <h3 style={{ color:"#fff", fontWeight:700, marginBottom:16 }}>Riwayat Referral</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {REFERRAL_HISTORY.map((r, i) => (
            <div key={r.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderBottom: i<REFERRAL_HISTORY.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div className="bg-gold-gradient" style={{ width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#0a0a0a", fontSize:".78rem", flexShrink:0 }}>{r.name[0]}</div>
                <div>
                  <p style={{ color:"#fff", fontSize:".84rem", fontWeight:600 }}>{r.name}</p>
                  <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem" }}>{r.joinDate}</p>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ color:"#D4AF37", fontWeight:700, fontSize:".83rem" }}>+{formatCurrency(r.bonus)}</span>
                <span style={{ background: r.status==="paid"?"rgba(74,222,128,0.1)":"rgba(251,146,60,0.1)", color: r.status==="paid"?"#4ade80":"#fb923c", borderRadius:8, padding:"3px 9px", fontSize:".73rem", fontWeight:700 }}>
                  {r.status==="paid"?"Dibayar":"Pending"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
