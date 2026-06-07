"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calculator, MessageCircle, Send, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getMarkup, withMarkup,
  buildDerivedCicilan, getCicilanParams,
} from "@/lib/harga";

// Paket cicilan diturunkan otomatis dari harga emas (harga anggota) — tanpa data manual.
interface CicilanPlan {
  id: string; gram: number; tenor: number;
  hargaAnggota: number; total: number; angsuran: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);

const WA_ADMIN    = "6281297533899";
const WA_PENGURUS = "6288214460345";

const STATUS_C: Record<string,{label:string;color:string}> = {
  pending:{label:"Menunggu Persetujuan",color:"#fbbf24"}, active:{label:"Berjalan",color:"#60a5fa"},
  completed:{label:"Lunas",color:"#34d399"}, overdue:{label:"Terlambat",color:"#f87171"},
};

export default function CicilanPage() {
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<CicilanPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState<any[]>([]);
  const [applyId, setApplyId] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  async function loadMine() {
    if (!user?.id) return;
    const { data } = await (supabase.from("installments") as any)
      .select("id, product_name, total_amount, monthly_amount, tenor, paid_installments, status, created_at")
      .eq("user_id", user.id).order("created_at",{ascending:false});
    setMine(data || []);
  }

  useEffect(() => {
    (async () => {
      const [{ data: e }, markup, params] = await Promise.all([
        (supabase.from("harga_emas_berat") as any)
          .select("gram,harga,created_at").eq("kategori","emas")
          .order("created_at",{ ascending:false }).limit(200),
        getMarkup(),
        getCicilanParams(),
      ]);
      // Ambil harga terbaru per berat, lalu terapkan markup anggota.
      const seen = new Set<number>();
      const latest = (e||[])
        .filter((r:any) => { const g = Number(r.gram); if (seen.has(g)) return false; seen.add(g); return true; })
        .map((r:any) => ({ gram: Number(r.gram), harga: withMarkup(r.harga, Number(r.gram), markup.anggota) }));
      // Turunkan paket cicilan dari harga anggota (latest.harga sudah termasuk markup → markup map kosong).
      const derived = buildDerivedCicilan(latest, {}, params);
      const flat: CicilanPlan[] = derived.flatMap(d =>
        d.tenors.map(t => ({ id:`${d.gram}-${t.tenor}`, gram:d.gram, tenor:t.tenor, hargaAnggota:d.hargaAnggota, total:t.total, angsuran:t.angsuran }))
      );
      setPlans(flat);
      setLoading(false);
    })();
    loadMine();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function ajukan(plan: CicilanPlan) {
    if (!user?.id) return;
    setApplyId(plan.id); setApplied(false);
    const { error } = await (supabase.from("installments") as any).insert({
      user_id: user.id, product_name: `Emas ${plan.gram} gram`, total_gram: plan.gram,
      total_amount: plan.total, monthly_amount: plan.angsuran, tenor: plan.tenor,
      paid_installments: 0, status: "pending",
    });
    if (!error) {
      try {
        const { data: staff } = await (supabase.from("profiles") as any).select("id").in("role",["admin","master"]);
        if (staff?.length) await (supabase.from("notifications") as any).insert(
          staff.map((s:any)=>({ user_id:s.id, title:"Pengajuan Cicilan Baru", body:`${user.name} mengajukan cicilan Emas ${plan.gram} gram (${plan.tenor} bln).`, type:"cicilan", is_read:false, link:"/dashboard/admin/cicilan" }))
        );
      } catch {}
      setApplied(true); loadMine();
    }
    setApplyId(null);
  }

  const grams = [...new Set(plans.map(p => p.gram))].sort((a,b)=>a-b);

  function buildMsg(plan: CicilanPlan) {
    return encodeURIComponent([
      "Halo, saya ingin mengajukan cicilan emas:",
      `• Berat: ${plan.gram} gram`,
      `• Harga Anggota: ${fmt(plan.hargaAnggota)}`,
      `• Tenor: ${plan.tenor} bulan`,
      `• Total Cicilan: ${fmt(plan.total)}`,
      `• Angsuran/bulan: ${fmt(plan.angsuran)}`,
      "",
      "Mohon info lebih lanjut. Terima kasih."
    ].join("\n"));
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:900 }}>
      <div>
        <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Cicilan Emas</h1>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Pilih paket lalu Ajukan Cicilan — admin akan menyetujui</p>
        <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".75rem", margin:"4px 0 0" }}>
          Angsuran/bln dihitung otomatis dari harga emas anggota + admin, bunga per bulan, dan potongan DP sesuai pengaturan koperasi.
        </p>
      </div>

      {applied && (
        <div style={{ background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.25)", borderRadius:12, padding:"12px 16px", color:"#34d399", fontSize:".88rem", display:"flex", alignItems:"center", gap:8 }}>
          <CheckCircle style={{ width:15, height:15 }} /> Pengajuan cicilan terkirim! Menunggu persetujuan admin.
        </div>
      )}

      {/* Cicilan Saya */}
      {mine.length > 0 && (
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"16px 18px" }}>
          <p style={{ color:"rgba(255,255,255,0.55)", fontSize:".78rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 12px" }}>Cicilan Saya</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {mine.map(m => {
              const s = STATUS_C[m.status] || STATUS_C.active;
              return (
                <div key={m.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, background:"rgba(255,255,255,0.02)", borderRadius:10, padding:"10px 14px", flexWrap:"wrap" }}>
                  <div>
                    <p style={{ color:"#fff", fontWeight:600, fontSize:".86rem", margin:0 }}>{m.product_name}</p>
                    <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".74rem", margin:"2px 0 0" }}>{m.paid_installments}/{m.tenor} angsuran · {fmt(m.monthly_amount)}/bln · sisa {fmt(Math.max(0,(m.tenor-m.paid_installments)*m.monthly_amount))}</p>
                  </div>
                  <span style={{ display:"flex", alignItems:"center", gap:4, background:`${s.color}18`, border:`1px solid ${s.color}40`, color:s.color, borderRadius:20, padding:"3px 12px", fontSize:".74rem", fontWeight:600 }}>
                    {m.status==="pending" && <Clock style={{width:11,height:11}}/>}{s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem", margin:0 }}>Harga Anggota: {fmt(gramPlans[0].hargaAnggota)}</p>
                </div>
              </div>
              <div style={{ padding:16, display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12 }}>
                {gramPlans.map(plan => {
                  return (
                    <div key={plan.id}
                      style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:13, padding:"16px 14px", display:"flex", flexDirection:"column", gap:8 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ color:"#fff", fontWeight:700, fontSize:".95rem" }}>{plan.tenor} Bulan</span>
                        <span style={{ background:"rgba(52,211,153,0.15)", color:"#34d399", fontSize:".7rem", padding:"2px 8px", borderRadius:6, fontWeight:600 }}>0% bunga</span>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:".78rem" }}>
                          <span style={{ color:"rgba(255,255,255,0.4)" }}>Angsuran/bln</span>
                          <span style={{ color:"#fff", fontWeight:700 }}>{fmt(plan.angsuran)}</span>
                        </div>
                      </div>
                      <div style={{ background:"rgba(212,175,55,0.08)", borderRadius:10, padding:"8px 10px", textAlign:"center" }}>
                        <span style={{ color:"#D4AF37", fontWeight:900, fontSize:"1rem" }}>{fmt(plan.angsuran)}</span>
                        <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".72rem" }}>/bulan</span>
                      </div>
                      <button onClick={()=>ajukan(plan)} disabled={applyId===plan.id}
                        style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"9px", borderRadius:10, background:"linear-gradient(135deg,#D4AF37,#F5D060)", border:"none", color:"#0a0a0a", fontWeight:700, fontSize:".82rem", cursor:applyId===plan.id?"not-allowed":"pointer", opacity:applyId===plan.id?.7:1 }}>
                        <Send style={{ width:13, height:13 }} /> {applyId===plan.id ? "Mengirim..." : "Ajukan Cicilan"}
                      </button>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                        <a href={`https://wa.me/${WA_ADMIN}?text=${buildMsg(plan)}`} target="_blank" rel="noopener noreferrer"
                          style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"8px 4px", borderRadius:10, background:"rgba(37,211,102,0.1)", border:"1px solid rgba(37,211,102,0.25)", textDecoration:"none" }}>
                          <MessageCircle style={{ width:13, height:13, color:"#25d366" }} />
                          <span style={{ color:"#25d366", fontWeight:700, fontSize:".72rem" }}>Admin</span>
                          <span style={{ color:"rgba(255,255,255,0.35)", fontSize:".65rem" }}>0812-9753-3899</span>
                        </a>
                        <a href={`https://wa.me/${WA_PENGURUS}?text=${buildMsg(plan)}`} target="_blank" rel="noopener noreferrer"
                          style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"8px 4px", borderRadius:10, background:"rgba(37,211,102,0.1)", border:"1px solid rgba(37,211,102,0.25)", textDecoration:"none" }}>
                          <MessageCircle style={{ width:13, height:13, color:"#25d366" }} />
                          <span style={{ color:"#25d366", fontWeight:700, fontSize:".72rem" }}>Pengurus</span>
                          <span style={{ color:"rgba(255,255,255,0.35)", fontSize:".65rem" }}>0882-1446-0345</span>
                        </a>
                      </div>
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
