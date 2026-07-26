"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Send, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import Select from "@/components/ui/Select";
import {
  getMarkup, withMarkup,
  buildDerivedCicilan, getCicilanParams,
} from "@/lib/harga";

// Paket cicilan diturunkan otomatis dari harga emas (harga anggota) — tanpa data manual.
interface CicilanPlan {
  id: string; gram: number; tenor: number;
  hargaAnggota: number; totalSebelumDp: number; dp: number; total: number; angsuran: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);

const STATUS_C: Record<string,{label:string;color:string}> = {
  pending:{label:"Menunggu Persetujuan",color:"#92400e"}, active:{label:"Berjalan",color:"#1d4ed8"},
  completed:{label:"Lunas",color:"#065f46"}, overdue:{label:"Terlambat",color:"#991b1b"},
};

export default function CicilanPage() {
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<CicilanPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState<any[]>([]);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  // Pilihan form
  const [selGram, setSelGram]   = useState("");
  const [selTenor, setSelTenor] = useState("");

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
        d.tenors.map(t => ({ id:`${d.gram}-${t.tenor}`, gram:d.gram, tenor:t.tenor, hargaAnggota:d.hargaAnggota, totalSebelumDp:t.totalSebelumDp, dp:t.dp, total:t.total, angsuran:t.angsuran }))
      );
      setPlans(flat);
      // Default pilihan: berat terkecil & tenor terpendek.
      if (flat.length) {
        const gs = [...new Set(flat.map(p=>p.gram))].sort((a,b)=>a-b);
        const ts = [...new Set(flat.map(p=>p.tenor))].sort((a,b)=>a-b);
        setSelGram(String(gs[0]));
        setSelTenor(String(ts[0]));
      }
      setLoading(false);
    })();
    loadMine();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const grams  = useMemo(() => [...new Set(plans.map(p => p.gram))].sort((a,b)=>a-b), [plans]);
  const tenors = useMemo(() => [...new Set(plans.map(p => p.tenor))].sort((a,b)=>a-b), [plans]);

  const selected = useMemo(
    () => plans.find(p => p.gram === Number(selGram) && p.tenor === Number(selTenor)) || null,
    [plans, selGram, selTenor]
  );

  async function ajukan() {
    if (!user?.id || !selected) return;
    setApplying(true); setApplied(false);
    const plan = selected;
    const { error } = await (supabase.from("installments") as any).insert({
      user_id: user.id, product_name: `Emas ${plan.gram} gram`, total_gram: plan.gram,
      total_amount: plan.total, monthly_amount: plan.angsuran, tenor: plan.tenor,
      down_payment: plan.dp, paid_installments: 0, status: "pending",
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
    setApplying(false);
  }

  const gramLabel = (g: number) => `${g % 1 === 0 ? g : g.toFixed(1)} gram`;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:640 }}>
      <div>
        <h1 style={{ color:"#2D1B00", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Cicilan Emas</h1>
        <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".85rem", margin:"4px 0 0" }}>
          Pilih berat & tenor, lalu Ajukan Cicilan — pengajuan otomatis masuk ke persetujuan admin.
        </p>
      </div>

      {applied && (
        <div style={{ background:"rgba(6,95,70,0.08)", border:"1px solid rgba(52,211,153,0.25)", borderRadius:12, padding:"12px 16px", color:"#065f46", fontSize:".88rem", display:"flex", alignItems:"center", gap:8 }}>
          <CheckCircle style={{ width:15, height:15 }} /> Pengajuan cicilan terkirim! Menunggu persetujuan admin.
        </div>
      )}

      {/* Cicilan Saya */}
      {mine.length > 0 && (
        <div style={{ background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.15)", borderRadius:16, padding:"16px 18px" }}>
          <p style={{ color:"rgba(101,67,14,0.6)", fontSize:".78rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 12px" }}>Cicilan Saya</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {mine.map(m => {
              const s = STATUS_C[m.status] || STATUS_C.active;
              return (
                <div key={m.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, background:"rgba(255,255,255,0.72)", borderRadius:10, padding:"10px 14px", flexWrap:"wrap" }}>
                  <div>
                    <p style={{ color:"#2D1B00", fontWeight:600, fontSize:".86rem", margin:0 }}>{m.product_name}</p>
                    <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".74rem", margin:"2px 0 0" }}>{m.paid_installments}/{m.tenor} angsuran · {fmt(m.monthly_amount)}/bln · sisa {fmt(Math.max(0, m.total_amount - m.paid_installments*m.monthly_amount))}</p>
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
        <p style={{ color:"rgba(101,67,14,0.35)" }}>Memuat data cicilan...</p>
      ) : plans.length === 0 ? (
        <div style={{ background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.15)", borderRadius:16, padding:40, textAlign:"center" }}>
          <Calculator style={{ width:40, height:40, color:"rgba(101,67,14,0.25)", margin:"0 auto 12px" }} />
          <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".9rem" }}>Paket cicilan belum tersedia.</p>
          <p style={{ color:"rgba(101,67,14,0.3)", fontSize:".82rem" }}>Hubungi admin untuk informasi lebih lanjut.</p>
        </div>
      ) : (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{ background:"rgba(255,255,255,0.72)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:16, overflow:"hidden" }}>
          {/* Judul kalkulator */}
          <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(212,175,55,0.12)", background:"rgba(212,175,55,0.04)", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:"rgba(212,175,55,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Calculator style={{ width:18, height:18, color:"#8B6010" }} />
            </div>
            <div>
              <p style={{ color:"#8B6010", fontWeight:800, fontSize:"1rem", margin:0 }}>Hitung Cicilan</p>
              <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".75rem", margin:0 }}>Isi berat & tenor, harga muncul otomatis</p>
            </div>
          </div>

          <div style={{ padding:20, display:"flex", flexDirection:"column", gap:16 }}>
            {/* Field: berat & tenor */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <label style={{ display:"block", color:"rgba(101,67,14,0.55)", fontSize:".78rem", marginBottom:6 }}>Berat Emas</label>
                <Select value={selGram} onChange={setSelGram}
                  options={grams.map(g=>({ value:String(g), label:gramLabel(g) }))} placeholder="Pilih berat" />
              </div>
              <div>
                <label style={{ display:"block", color:"rgba(101,67,14,0.55)", fontSize:".78rem", marginBottom:6 }}>Tenor</label>
                <Select value={selTenor} onChange={setSelTenor}
                  options={tenors.map(t=>({ value:String(t), label:`${t} bulan` }))} placeholder="Pilih tenor" />
              </div>
            </div>

            {/* Hasil perhitungan */}
            {selected && (
              <>
                <div style={{ background:"rgba(96,165,250,0.06)", border:"1px solid rgba(96,165,250,0.2)", borderRadius:12, padding:"14px 16px", display:"flex", flexDirection:"column", gap:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ color:"rgba(101,67,14,0.55)", fontSize:".82rem" }}>Harga Anggota</span>
                    <span style={{ color:"rgba(45,27,0,0.8)", fontWeight:700, fontSize:".9rem" }}>{fmt(selected.hargaAnggota)}</span>
                  </div>
                  {/* Step 1 — DP */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ background:"#60a5fa", color:"#0a0a0a", borderRadius:"50%", width:20, height:20, display:"flex", alignItems:"center", justifyContent:"center", fontSize:".7rem", fontWeight:900 }}>1</span>
                      <span style={{ color:"rgba(101,67,14,0.7)", fontSize:".84rem" }}>DP disetor di awal</span>
                    </div>
                    <span style={{ color:"#1d4ed8", fontWeight:800, fontSize:"1rem" }}>{selected.dp > 0 ? fmt(selected.dp) : "—"}</span>
                  </div>
                  {/* Step 2 — Angsuran */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ background:"#D4AF37", color:"#0a0a0a", borderRadius:"50%", width:20, height:20, display:"flex", alignItems:"center", justifyContent:"center", fontSize:".7rem", fontWeight:900 }}>2</span>
                      <span style={{ color:"rgba(101,67,14,0.7)", fontSize:".84rem" }}>Angsuran {selected.tenor}×</span>
                    </div>
                    <span style={{ color:"#8B6010", fontWeight:900, fontSize:"1.05rem" }}>{fmt(selected.angsuran)}<span style={{ color:"rgba(101,67,14,0.4)", fontWeight:400, fontSize:".7rem" }}>/bln</span></span>
                  </div>
                  <div style={{ borderTop:"1px dashed rgba(255,255,255,0.1)", paddingTop:10, display:"flex", justifyContent:"space-between" }}>
                    <span style={{ color:"rgba(101,67,14,0.45)", fontSize:".8rem" }}>Total (DP + cicilan)</span>
                    <span style={{ color:"rgba(101,67,14,0.75)", fontSize:".84rem", fontWeight:700 }}>{fmt(selected.totalSebelumDp)}</span>
                  </div>
                </div>

                <button onClick={ajukan} disabled={applying}
                  style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"13px", borderRadius:12, background:"linear-gradient(135deg,#D4AF37,#F5D060)", border:"none", color:"#0a0a0a", fontWeight:800, fontSize:".92rem", cursor:applying?"not-allowed":"pointer", opacity:applying?.7:1 }}>
                  <Send style={{ width:15, height:15 }} /> {applying ? "Mengirim..." : "Ajukan Cicilan"}
                </button>
                <p style={{ color:"rgba(101,67,14,0.35)", fontSize:".74rem", textAlign:"center", margin:0 }}>
                  Pengajuan akan ditinjau & disetujui oleh admin koperasi.
                </p>
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
