"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Gift, RefreshCw, Copy, Check, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
const fmtDate = (s: string) => new Date(s).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"});

export default function MemberReferralPage() {
  const { user } = useAuthStore();
  const [code, setCode] = useState("");
  const [refs, setRefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [profRes, refRes] = await Promise.all([
        (supabase.from("profiles") as any).select("referral_code").eq("id", user.id).single(),
        (supabase.from("referrals") as any)
          .select("id, bonus_amount, status, created_at, referred:referred_id(name)")
          .eq("referrer_id", user.id).order("created_at",{ascending:false}),
      ]);
      setCode(profRes.data?.referral_code || "");
      setRefs(refRes.data || []);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, [user?.id]);

  const totalBonus = refs.filter(r => r.status === "paid").reduce((s, r) => s + (r.bonus_amount||0), 0);
  const pendingBonus = refs.filter(r => r.status === "pending").reduce((s, r) => s + (r.bonus_amount||0), 0);

  function copy() {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopied(true); setTimeout(()=>setCopied(false), 1800);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:760 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#2D1B00", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Program Referral</h1>
          <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".85rem", margin:"4px 0 0" }}>Ajak teman & dapatkan bonus</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#8B6010", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      {/* Kode referral */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
        style={{ background:"linear-gradient(135deg,rgba(212,175,55,0.14),rgba(212,175,55,0.04))", border:"1px solid rgba(212,175,55,0.3)", borderRadius:20, padding:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <Gift style={{ width:16, height:16, color:"#8B6010" }} />
          <p style={{ color:"rgba(101,67,14,0.7)", fontSize:".82rem", margin:0 }}>Kode Referral Anda</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <span style={{ color:"#8B6010", fontSize:"1.8rem", fontWeight:900, letterSpacing:".05em", fontFamily:"monospace" }}>{loading ? "—" : (code || "—")}</span>
          {code && (
            <button onClick={copy}
              style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.25)", borderRadius:10, padding:"8px 14px", color: copied ? "#34d399" : "#fff", cursor:"pointer", fontSize:".82rem", fontWeight:600 }}>
              {copied ? <><Check style={{ width:14, height:14 }} /> Tersalin</> : <><Copy style={{ width:14, height:14 }} /> Salin</>}
            </button>
          )}
        </div>
        <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".78rem", marginTop:12 }}>
          Bagikan kode ini saat teman mendaftar. Bonus diberikan setelah keanggotaan mereka aktif.
        </p>
      </motion.div>

      {/* Ringkasan bonus */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:14 }}>
        {[
          { label:"Teman Diajak", value: refs.length.toString(), color:"#1d4ed8" },
          { label:"Bonus Diterima", value: fmt(totalBonus), color:"#065f46" },
          { label:"Bonus Pending", value: fmt(pendingBonus), color:"#92400e" },
        ].map(s=>(
          <div key={s.label} style={{ background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.15)", borderRadius:14, padding:"16px 18px" }}>
            <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".75rem", marginBottom:6 }}>{s.label}</p>
            <p style={{ color:s.color, fontWeight:900, fontSize:"1.2rem", margin:0 }}>{loading ? "—" : s.value}</p>
          </div>
        ))}
      </div>

      {/* Daftar referral */}
      <div>
        <p style={{ color:"rgba(101,67,14,0.55)", fontSize:".78rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 12px" }}>Riwayat Ajakan</p>
        {loading ? <p style={{ color:"rgba(101,67,14,0.35)" }}>Memuat...</p>
          : refs.length === 0 ? (
            <div style={{ background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.12)", borderRadius:14, padding:"36px", textAlign:"center" }}>
              <Users style={{ width:32, height:32, color:"rgba(201,162,39,0.35)", margin:"0 auto 10px" }} />
              <p style={{ color:"rgba(101,67,14,0.4)", margin:0 }}>Belum ada teman yang diajak.</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {refs.map(r=>(
                <div key={r.id} style={{ background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.12)", borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                  <div>
                    <p style={{ color:"#2D1B00", fontWeight:600, fontSize:".88rem", margin:0 }}>{(r.referred as any)?.name || "Anggota baru"}</p>
                    <p style={{ color:"rgba(101,67,14,0.4)", fontSize:".75rem", margin:"2px 0 0" }}>{fmtDate(r.created_at)}</p>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <p style={{ color:"#8B6010", fontWeight:700, fontSize:".88rem", margin:0 }}>{fmt(r.bonus_amount)}</p>
                    <span style={{ color: r.status==="paid" ? "#34d399" : "#fbbf24", fontSize:".72rem", textTransform:"capitalize" }}>{r.status==="paid"?"Dibayar":"Pending"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
