"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calculator, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface CicilanHarga {
  id: number; gram: number; tenor: number;
  harga_jual: number; angsuran: number; uang_muka_persen: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);

const WA_ADMIN    = "6281297533899";
const WA_PENGURUS = "6288214460345";

export default function CicilanPage() {
  const [plans, setPlans] = useState<CicilanHarga[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from("cicilan_harga") as any)
        .select("*")
        .order("gram", { ascending:true })
        .order("tenor", { ascending:true });
      setPlans((data||[]).map((d:any) => ({...d, gram: Number(d.gram)})));
      setLoading(false);
    })();
  }, []);

  const grams = [...new Set(plans.map(p => p.gram))].sort((a,b)=>a-b);

  function ajukanCicilan(plan: CicilanHarga) {
    const um = Math.round(plan.harga_jual * plan.uang_muka_persen / 100);
    const msg = encodeURIComponent([
      "Halo, saya ingin mengajukan cicilan emas:",
      `• Berat: ${plan.gram} gram`,
      `• Harga Jual: ${fmt(plan.harga_jual)}`,
      `• Tenor: ${plan.tenor} bulan`,
      `• Uang Muka (${plan.uang_muka_persen}%): ${fmt(um)}`,
      `• Angsuran/bulan: ${fmt(plan.angsuran)}`,
      "",
      "Mohon info lebih lanjut. Terima kasih."
    ].join("\n"));
    window.open(`https://wa.me/${WA_ADMIN}?text=${msg}`, "_blank");
    window.open(`https://wa.me/${WA_PENGURUS}?text=${msg}`, "_blank");
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:900 }}>
      <div>
        <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Cicilan Emas</h1>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Pilih paket cicilan sesuai kemampuan Anda</p>
      </div>

      {loading ? (
        <p style={{ color:"rgba(255,255,255,0.3)" }}>Memuat paket cicilan...</p>
      ) : plans.length === 0 ? (
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:40, textAlign:"center" }}>
          <Calculator style={{ width:40, height:40, color:"rgba(255,255,255,0.2)", margin:"0 auto 12px" }} />
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".9rem" }}>Paket cicilan belum tersedia.</p>
          <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".82rem" }}>Hubungi admin untuk informasi lebih lanjut.</p>
        </div>
      ) : (
        grams.map(gram => {
          const gramPlans = plans.filter(p => p.gram === gram);
          return (
            <motion.div key={gram} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:16, overflow:"hidden" }}>
              <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(212,175,55,0.1)", background:"rgba(212,175,55,0.04)", display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:9, background:"rgba(212,175,55,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Calculator style={{ width:18, height:18, color:"#D4AF37" }} />
                </div>
                <div>
                  <p style={{ color:"#D4AF37", fontWeight:900, fontSize:"1.05rem", margin:0 }}>{gram} Gram</p>
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem", margin:0 }}>Harga Jual: {fmt(gramPlans[0].harga_jual)}</p>
                </div>
              </div>
              <div style={{ padding:16, display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12 }}>
                {gramPlans.map(plan => {
                  const um = Math.round(plan.harga_jual * plan.uang_muka_persen / 100);
                  return (
                    <div key={plan.id}
                      style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:13, padding:"16px 14px", display:"flex", flexDirection:"column", gap:8 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ color:"#fff", fontWeight:700, fontSize:".95rem" }}>{plan.tenor} Bulan</span>
                        <span style={{ background:"rgba(52,211,153,0.15)", color:"#34d399", fontSize:".7rem", padding:"2px 8px", borderRadius:6, fontWeight:600 }}>0% bunga</span>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:".78rem" }}>
                          <span style={{ color:"rgba(255,255,255,0.4)" }}>Uang Muka {plan.uang_muka_persen}%</span>
                          <span style={{ color:"#D4AF37", fontWeight:600 }}>{fmt(um)}</span>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:".78rem" }}>
                          <span style={{ color:"rgba(255,255,255,0.4)" }}>Angsuran/bln</span>
                          <span style={{ color:"#fff", fontWeight:700 }}>{fmt(plan.angsuran)}</span>
                        </div>
                      </div>
                      <div style={{ background:"rgba(212,175,55,0.08)", borderRadius:10, padding:"8px 10px", textAlign:"center" }}>
                        <span style={{ color:"#D4AF37", fontWeight:900, fontSize:"1rem" }}>{fmt(plan.angsuran)}</span>
                        <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".72rem" }}>/bulan</span>
                      </div>
                      <button onClick={() => ajukanCicilan(plan)}
                        style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"9px", borderRadius:9, background:"rgba(37,211,102,0.1)", border:"1px solid rgba(37,211,102,0.3)", color:"#25d366", fontWeight:600, fontSize:".8rem", cursor:"pointer" }}>
                        <MessageCircle style={{ width:14, height:14 }} /> Ajukan via WA
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })
      )}

    </div>
  );
}
