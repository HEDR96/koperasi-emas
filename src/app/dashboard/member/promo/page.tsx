"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, RefreshCw, Tag } from "lucide-react";
import { supabase } from "@/lib/supabase";

const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}) : null;

export default function MemberPromoPage() {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await (supabase.from("promos") as any)
      .select("*").eq("is_active", true).order("created_at",{ascending:false});
    setPromos(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Promo Anggota</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Penawaran & promo aktif untuk Anda</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      {loading ? <p style={{ color:"rgba(255,255,255,0.3)" }}>Memuat...</p>
        : promos.length === 0 ? (
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:"48px", textAlign:"center" }}>
            <Megaphone style={{ width:38, height:38, color:"rgba(255,255,255,0.15)", margin:"0 auto 12px" }} />
            <p style={{ color:"rgba(255,255,255,0.4)", margin:0 }}>Belum ada promo aktif saat ini.</p>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:16 }}>
            {promos.map((p,i)=>(
              <motion.div key={p.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.05 }}
                style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:16, overflow:"hidden" }}>
                {p.image_url && <img src={p.image_url} alt={p.title} style={{ width:"100%", height:140, objectFit:"cover" }} onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}} />}
                <div style={{ padding:"16px 18px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, marginBottom:8 }}>
                    <p style={{ color:"#fff", fontWeight:700, fontSize:"1rem", margin:0 }}>{p.title}</p>
                    {p.discount_percent > 0 && (
                      <span style={{ display:"flex", alignItems:"center", gap:4, background:"linear-gradient(135deg,#D4AF37,#F5D060)", color:"#0a0a0a", borderRadius:8, padding:"3px 10px", fontSize:".75rem", fontWeight:800, flexShrink:0 }}>
                        <Tag style={{ width:11, height:11 }} /> {p.discount_percent}%
                      </span>
                    )}
                  </div>
                  {p.description && <p style={{ color:"rgba(255,255,255,0.55)", fontSize:".85rem", margin:0, lineHeight:1.6 }}>{p.description}</p>}
                  {(p.start_date || p.end_date) && (
                    <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".74rem", margin:"10px 0 0" }}>
                      Berlaku {fmtDate(p.start_date)||"—"} s/d {fmtDate(p.end_date)||"—"}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
    </div>
  );
}
