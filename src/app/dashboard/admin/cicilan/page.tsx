"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, RefreshCw, Plus, X, Check, Clock, CheckCircle, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import MemberPicker from "@/components/ui/MemberPicker";
import RupiahInput from "@/components/ui/RupiahInput";
import Select from "@/components/ui/Select";
import {
  getMarkup, withMarkup, getCicilanParams, type CicilanParams,
  cicilanHargaTenor, cicilanDpTenor, cicilanAngsuranTenor, CICILAN_TENORS,
  CICILAN_PARAM_DEFAULTS,
} from "@/lib/harga";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" });

const inp: React.CSSProperties = {
  width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:".9rem", outline:"none", boxSizing:"border-box",
};

const FILTERS = ["semua","pending","berjalan","lunas"] as const;

// Item ternormalisasi: cicilan (installments) ATAU gadai
interface Item {
  id: string; kind: "cicilan" | "gadai"; user_id: string; name: string; memberName: string;
  total: number; monthly: number; downPayment: number; tenor: number; paid: number; sisa: number; status: string; created_at: string;
}

export default function AdminCicilanPage() {
  const { user } = useAuthStore();
  const isMaster = user?.role === "master";
  const [rows, setRows] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<typeof FILTERS[number]>("semua");
  const [acting, setActing] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ user_id:"", gram:"", tenor:"12" });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  // Data harga emas + parameter cicilan (untuk auto-fill)
  const [goldRows, setGoldRows] = useState<{ gram:number; harga:number }[]>([]);
  const [cicilanParams, setCicilanParams] = useState<CicilanParams>(CICILAN_PARAM_DEFAULTS);

  useEffect(() => {
    (async () => {
      const [{ data: e }, markup, params] = await Promise.all([
        ((supabase as any).rpc("get_latest_harga_berat", { kat: "emas" }) as any),
        getMarkup(),
        getCicilanParams(),
      ]);
      const seen = new Set<number>();
      const rows = (e||[])
        .filter((r:any)=>{ const g=Number(r.gram); if(seen.has(g)) return false; seen.add(g); return true; })
        .map((r:any)=>({ gram:Number(r.gram), harga:withMarkup(r.harga,Number(r.gram),markup.anggota) }))
        .sort((a:any,b:any)=>a.gram-b.gram);
      setGoldRows(rows);
      setCicilanParams(params);
    })();
  }, []);

  const [detail, setDetail] = useState<Item | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  function normCicilan(r: any): Item {
    return {
      id:r.id, kind:"cicilan", user_id:r.user_id, name:r.product_name || "Cicilan Emas",
      memberName:r.profiles?.name || "—", total:r.total_amount, monthly:r.monthly_amount,
      downPayment: r.down_payment || 0,
      tenor:r.tenor, paid:r.paid_installments, sisa:Math.max(0,(r.tenor-r.paid_installments)*r.monthly_amount),
      status: r.status === "completed" ? "lunas" : (r.status === "overdue" ? "terlambat" : r.status === "pending" ? "pending" : "berjalan"),
      created_at:r.created_at,
    };
  }

  async function load() {
    setLoading(true);
    const { data } = await (supabase.from("installments") as any)
      .select("id, user_id, product_name, total_amount, monthly_amount, down_payment, tenor, paid_installments, status, created_at, profiles:profiles!user_id(name)")
      .order("created_at",{ascending:false}).limit(300);
    setRows((data||[]).map(normCicilan));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  // Auto-kalkulasi dari berat + tenor + parameter
  const selectedRow = goldRows.find(r => String(r.gram) === form.gram) || null;
  const tenor = Number(form.tenor) || 1;
  const calcTotal   = selectedRow ? cicilanHargaTenor(selectedRow.harga, tenor, cicilanParams.adminAnggota, cicilanParams.persenBulanAnggota, cicilanParams.persenDpAnggota) : 0;
  const calcDp      = selectedRow ? cicilanDpTenor(selectedRow.harga, tenor, cicilanParams.adminAnggota, cicilanParams.persenBulanAnggota, cicilanParams.persenDpAnggota) : 0;
  const calcAngsuran = selectedRow ? cicilanAngsuranTenor(selectedRow.harga, tenor, cicilanParams.adminAnggota, cicilanParams.persenBulanAnggota, cicilanParams.persenDpAnggota) : 0;

  async function createCicilan() {
    if (!form.user_id || !form.gram) { setFormErr("Pilih anggota dan berat emas."); return; }
    if (!selectedRow) { setFormErr("Harga emas untuk berat ini tidak ditemukan."); return; }
    setSaving(true); setFormErr("");
    const due = new Date(); due.setMonth(due.getMonth() + 1);
    const productName = `Emas ${selectedRow.gram} gram`;
    const { error } = await (supabase.from("installments") as any).insert({
      user_id: form.user_id,
      product_name: productName,
      total_gram: selectedRow.gram,
      total_amount: calcTotal,
      monthly_amount: calcAngsuran,
      down_payment: calcDp,
      tenor,
      paid_installments: 0,
      status: "active",
      next_due_date: due.toISOString().slice(0,10),
    });
    if (error) { setFormErr(error.message); }
    else {
      try {
        await (supabase.from("notifications") as any).insert({
          user_id: form.user_id, title:"Cicilan Baru",
          body: `Cicilan ${productName} (${tenor} bln). DP: ${fmt(calcDp)}, angsuran: ${fmt(calcAngsuran)}/bln.`,
          type:"cicilan", is_read:false, link:"/dashboard/member/cicilan",
        });
      } catch {}
      setForm({ user_id:"", gram:"", tenor:"12" });
      setShowForm(false); load();
    }
    setSaving(false);
  }

  async function openDetail(it: Item) {
    setDetail(it); setDetailLoading(true); setPayments([]);
    if (it.kind === "cicilan") {
      const { data } = await (supabase.from("cicilan_pembayaran") as any)
        .select("id, angsuran_ke, amount, paid_at").eq("installment_id", it.id).order("angsuran_ke",{ascending:true});
      setPayments(data || []);
    }
    setDetailLoading(false);
  }

  async function recordPayment(it: Item) {
    if (it.paid >= it.tenor || it.status === "pending") return;
    setActing(it.id);
    const ke = it.paid + 1;
    const done = ke >= it.tenor;
    await (supabase.from("cicilan_pembayaran") as any).insert({
      installment_id: it.id, user_id: it.user_id, angsuran_ke: ke, amount: it.monthly, recorded_by: user?.id,
    });
    const due = new Date(); due.setMonth(due.getMonth() + 1);
    await (supabase.from("installments") as any).update({
      paid_installments: ke, status: done ? "completed" : "active",
      next_due_date: done ? null : due.toISOString().slice(0,10),
    }).eq("id", it.id);
    try {
      await (supabase.from("notifications") as any).insert({
        user_id: it.user_id, title: done ? `${it.name} Lunas 🎉` : "Pembayaran Diterima",
        body: done ? `${it.name} telah LUNAS.` : `Angsuran ke-${ke} ${fmt(it.monthly)} untuk ${it.name} tercatat.`,
        type:"cicilan", is_read:false, link:"/dashboard/member/cicilan",
      });
    } catch {}
    const updated: Item = { ...it, paid: ke, sisa: Math.max(0, it.sisa - it.monthly), status: done ? "lunas" : "berjalan" };
    setDetail(updated);
    await openDetail(updated);
    await load();
    setActing(null);
  }

  // Setujui pengajuan cicilan member (pending -> active)
  async function approveCicilan(it: Item) {
    setActing(it.id);
    const due = new Date(); due.setMonth(due.getMonth() + 1);
    await (supabase.from("installments") as any).update({ status:"active", next_due_date: due.toISOString().slice(0,10) }).eq("id", it.id);
    try { await (supabase.from("notifications") as any).insert({ user_id:it.user_id, title:"Cicilan Disetujui", body:`Pengajuan cicilan ${it.name} disetujui.`, type:"cicilan", is_read:false, link:"/dashboard/member/cicilan" }); } catch {}
    setDetail({ ...it, status:"berjalan" }); await load(); setActing(null);
  }

  async function removeItem(it: Item) {
    if (!window.confirm(`Hapus cicilan "${it.name}" milik ${it.memberName}? Tidak bisa dibatalkan.`)) return;
    setActing(it.id);
    await (supabase.from("installments") as any).delete().eq("id", it.id);
    setDetail(null);
    await load();
    setActing(null);
  }

  const filtered = filter === "semua" ? rows
    : filter === "pending" ? rows.filter(r => r.status === "pending")
    : filter === "berjalan" ? rows.filter(r => r.status === "berjalan" || r.status === "terlambat")
    : rows.filter(r => r.status === "lunas");

  const STATUS_COLOR: Record<string,string> = { pending:"#fbbf24", berjalan:"#60a5fa", lunas:"#34d399", terlambat:"#f87171" };
  const STATUS_LABEL: Record<string,string> = { pending:"Pengajuan", berjalan:"Berjalan", lunas:"Lunas", terlambat:"Terlambat" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Kelola Cicilan</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Pantau angsuran anggota (cicilan emas & gadai) + catat pembayaran</p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
            <RefreshCw style={{ width:13, height:13 }} /> Refresh
          </button>
          <button onClick={()=>{ setShowForm(true); setFormErr(""); }} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(167,139,250,0.12)", border:"1px solid rgba(167,139,250,0.3)", borderRadius:10, padding:"8px 16px", color:"#a78bfa", cursor:"pointer", fontSize:".85rem", fontWeight:600 }}>
            <Plus style={{ width:14, height:14 }} /> Cicilan Baru
          </button>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {FILTERS.map(f => (
          <button key={f} onClick={()=>setFilter(f)}
            style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${filter===f?"rgba(212,175,55,0.35)":"rgba(255,255,255,0.08)"}`, background:filter===f?"rgba(212,175,55,0.1)":"transparent", color:filter===f?"#D4AF37":"rgba(255,255,255,0.45)", cursor:"pointer", fontSize:".8rem", fontWeight:filter===f?700:400, textTransform:"capitalize" }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color:"rgba(255,255,255,0.3)" }}>Memuat...</p>
        : filtered.length === 0 ? (
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:"48px", textAlign:"center" }}>
            <CreditCard style={{ width:38, height:38, color:"rgba(255,255,255,0.15)", margin:"0 auto 12px" }} />
            <p style={{ color:"rgba(255,255,255,0.4)", margin:0 }}>Belum ada cicilan / gadai.</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filtered.map((r,i)=>{
              const color = STATUS_COLOR[r.status] || "#60a5fa";
              const pct = r.tenor > 0 ? Math.round((r.paid / r.tenor) * 100) : 0;
              return (
                <motion.div key={`${r.kind}-${r.id}`} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:Math.min(i*.03,.3) }}
                  style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${color}25`, borderRadius:14, padding:"14px 18px" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
                    <div style={{ minWidth:180 }}>
                      <p style={{ color:"#fff", fontWeight:700, fontSize:".92rem", margin:0, display:"flex", alignItems:"center", gap:6 }}>
                        <CreditCard style={{ width:13, height:13, color:"#a78bfa" }} />
                        {r.memberName} <span style={{ color:"rgba(255,255,255,0.4)", fontWeight:400 }}>· {r.name}</span>
                      </p>
                      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".76rem", margin:"3px 0 0" }}>
                        {fmt(r.monthly)}/bln · Total {fmt(r.total)}
                      </p>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                      <div style={{ textAlign:"right" }}>
                        <p style={{ color:"#fff", fontWeight:700, fontSize:".85rem", margin:0 }}>{r.paid}/{r.tenor} angsuran</p>
                        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".74rem", margin:0 }}>Sisa {fmt(r.sisa)}</p>
                      </div>
                      <span style={{ background:`${color}18`, border:`1px solid ${color}40`, color, borderRadius:20, padding:"3px 12px", fontSize:".74rem", fontWeight:600 }}>{STATUS_LABEL[r.status]||r.status}</span>
                      <button onClick={()=>openDetail(r)} style={{ background:"rgba(96,165,250,0.1)", border:"1px solid rgba(96,165,250,0.25)", borderRadius:8, padding:"6px 12px", color:"#60a5fa", cursor:"pointer", fontSize:".78rem", fontWeight:600 }}>Detail</button>
                    </div>
                  </div>
                  <div style={{ height:6, background:"rgba(255,255,255,0.08)", borderRadius:4, overflow:"hidden", marginTop:12 }}>
                    <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${color},${color}aa)`, borderRadius:4, transition:"width .4s" }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      {/* Create cicilan modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={()=>setShowForm(false)}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
            <motion.div onClick={e=>e.stopPropagation()} initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:.95 }}
              style={{ width:"min(460px,94vw)", background:"#0f0f0f", border:"1px solid rgba(167,139,250,0.25)", borderRadius:20, padding:24, maxHeight:"90vh", overflowY:"auto" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
                <h2 style={{ color:"#fff", fontWeight:700, fontSize:"1.05rem", margin:0 }}>Cicilan Baru</h2>
                <button onClick={()=>setShowForm(false)} style={{ background:"rgba(255,255,255,0.07)", border:"none", borderRadius:8, width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.5)", cursor:"pointer" }}><X style={{ width:14, height:14 }} /></button>
              </div>
              {formErr && <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:10, padding:"10px 14px", color:"#f87171", fontSize:".82rem", marginBottom:14 }}>{formErr}</div>}
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {/* Anggota */}
                <div>
                  <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:7 }}>Anggota *</label>
                  <MemberPicker value={form.user_id} onChange={m=>setForm(p=>({...p,user_id:m?.id||""}))} />
                </div>

                {/* Berat */}
                <div>
                  <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:7 }}>Berat Emas *</label>
                  {goldRows.length > 0 ? (
                    <Select value={form.gram} placeholder="Pilih berat emas"
                      options={goldRows.map(r=>({ value:String(r.gram), label:`${r.gram % 1 === 0 ? r.gram : r.gram.toFixed(1)} gram — ${fmt(r.harga)}` }))}
                      onChange={v=>setForm(p=>({...p,gram:v}))} />
                  ) : (
                    <p style={{ color:"#f87171", fontSize:".8rem", margin:0 }}>Harga emas belum tersedia. Tambahkan di menu Harga.</p>
                  )}
                </div>

                {/* Tenor */}
                <div>
                  <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:7 }}>Tenor *</label>
                  <Select value={form.tenor} placeholder="Pilih tenor"
                    options={CICILAN_TENORS.map(t=>({ value:String(t), label:`${t} bulan` }))}
                    onChange={v=>setForm(p=>({...p,tenor:v}))} />
                </div>

                {/* Preview otomatis */}
                {selectedRow && (
                  <div style={{ background:"rgba(167,139,250,0.07)", border:"1px solid rgba(167,139,250,0.25)", borderRadius:12, padding:"14px 16px" }}>
                    <p style={{ color:"#a78bfa", fontWeight:700, fontSize:".8rem", margin:"0 0 10px" }}>Rincian Cicilan (Anggota)</p>
                    {[
                      { label:"Berat",          val:`${selectedRow.gram} gram` },
                      { label:"Harga Anggota",   val:fmt(selectedRow.harga) },
                    ].map(r=>(
                      <div key={r.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <span style={{ color:"rgba(255,255,255,0.5)", fontSize:".82rem" }}>{r.label}</span>
                        <span style={{ color:"#fff", fontWeight:600, fontSize:".82rem" }}>{r.val}</span>
                      </div>
                    ))}
                    <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:10, marginTop:6, display:"flex", flexDirection:"column", gap:8 }}>
                      {/* Step 1 DP */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                          <span style={{ background:"#60a5fa", color:"#0a0a0a", borderRadius:"50%", width:18, height:18, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:".65rem", fontWeight:900 }}>1</span>
                          <span style={{ color:"rgba(255,255,255,0.65)", fontSize:".83rem" }}>DP disetor dulu</span>
                        </div>
                        <span style={{ color:"#60a5fa", fontWeight:800, fontSize:".9rem" }}>{calcDp > 0 ? fmt(calcDp) : "—"}</span>
                      </div>
                      {/* Step 2 Angsuran */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                          <span style={{ background:"#D4AF37", color:"#0a0a0a", borderRadius:"50%", width:18, height:18, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:".65rem", fontWeight:900 }}>2</span>
                          <span style={{ color:"rgba(255,255,255,0.65)", fontSize:".83rem" }}>Angsuran {tenor}×</span>
                        </div>
                        <span style={{ color:"#D4AF37", fontWeight:800, fontSize:".9rem" }}>
                          {fmt(calcAngsuran)}<span style={{ color:"rgba(255,255,255,0.4)", fontSize:".72rem", fontWeight:400 }}>/bln</span>
                        </span>
                      </div>
                      {/* Total */}
                      <div style={{ display:"flex", justifyContent:"space-between", borderTop:"1px dashed rgba(255,255,255,0.07)", paddingTop:8, marginTop:2 }}>
                        <span style={{ color:"rgba(255,255,255,0.35)", fontSize:".75rem" }}>Total Keseluruhan</span>
                        <span style={{ color:"rgba(255,255,255,0.6)", fontWeight:600, fontSize:".78rem" }}>{fmt(calcTotal + calcDp)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <button onClick={createCicilan} disabled={saving || !form.user_id || !form.gram}
                  style={{ padding:"12px", borderRadius:11, background:"linear-gradient(135deg,#a78bfa,#c4b5fd)", border:"none", color:"#0a0a0a", fontWeight:700, fontSize:".95rem", cursor:saving||!form.user_id||!form.gram?"not-allowed":"pointer", opacity:saving?.7:1 }}>
                  {saving ? "Menyimpan..." : "Buat Cicilan"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail modal */}
      <AnimatePresence>
        {detail && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={()=>setDetail(null)}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
            <motion.div onClick={e=>e.stopPropagation()} initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:.95 }}
              style={{ width:"min(520px,96vw)", background:"#0f0f0f", border:"1px solid rgba(212,175,55,0.2)", borderRadius:20, maxHeight:"90vh", overflowY:"auto" }}>
              <div style={{ padding:"20px 22px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
                <div>
                  <h2 style={{ color:"#fff", fontWeight:700, fontSize:"1.05rem", margin:0 }}>{detail.name}</h2>
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".8rem", margin:"2px 0 0" }}>{detail.memberName} · Cicilan</p>
                </div>
                <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                  {isMaster && (
                    <button onClick={()=>removeItem(detail)} disabled={acting===detail.id} title="Hapus (master)"
                      style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", color:"#f87171", cursor:"pointer", opacity:acting===detail.id?.6:1 }}>
                      <Trash2 style={{ width:15, height:15 }} />
                    </button>
                  )}
                  <button onClick={()=>setDetail(null)} style={{ background:"rgba(255,255,255,0.07)", border:"none", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.5)", cursor:"pointer" }}><X style={{ width:15, height:15 }} /></button>
                </div>
              </div>

              <div style={{ padding:"18px 22px 24px" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
                  {[
                    { label:"Total Cicilan", value:fmt(detail.total), color:"#fff" },
                    ...(detail.downPayment > 0 ? [{ label:"DP Disetor", value:fmt(detail.downPayment), color:"#60a5fa" }] : []),
                    { label:"Angsuran/bln", value:fmt(detail.monthly), color:"#a78bfa" },
                    { label:"Terbayar", value:`${detail.paid}/${detail.tenor}`, color:"#34d399" },
                    { label:"Sisa", value:fmt(detail.sisa), color: detail.sisa>0 ? "#f87171" : "#34d399" },
                  ].map(c=>(
                    <div key={c.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 14px" }}>
                      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".72rem", margin:"0 0 4px" }}>{c.label}</p>
                      <p style={{ color:c.color, fontWeight:700, fontSize:".95rem", margin:0 }}>{c.value}</p>
                    </div>
                  ))}
                </div>

                {detail.status === "pending" ? (
                  <button onClick={()=>approveCicilan(detail)} disabled={acting===detail.id}
                    style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", borderRadius:11, background:"linear-gradient(135deg,#fbbf24,#fcd34d)", border:"none", color:"#0a0a0a", fontWeight:700, fontSize:".92rem", cursor:acting===detail.id?"not-allowed":"pointer", opacity:acting===detail.id?.7:1, marginBottom:18 }}>
                    <Check style={{ width:16, height:16 }} /> Setujui Pengajuan Cicilan
                  </button>
                ) : detail.status !== "lunas" ? (
                  <button onClick={()=>recordPayment(detail)} disabled={acting===detail.id}
                    style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", borderRadius:11, background:"linear-gradient(135deg,#34d399,#6ee7b7)", border:"none", color:"#0a0a0a", fontWeight:700, fontSize:".92rem", cursor:acting===detail.id?"not-allowed":"pointer", opacity:acting===detail.id?.7:1, marginBottom:18 }}>
                    <Check style={{ width:16, height:16 }} /> Catat Bayar Angsuran ke-{detail.paid + 1} ({fmt(detail.monthly)})
                  </button>
                ) : (
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", borderRadius:11, background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.3)", color:"#34d399", fontWeight:700, marginBottom:18 }}>
                    <CheckCircle style={{ width:16, height:16 }} /> Sudah Lunas
                  </div>
                )}

                <h3 style={{ color:"rgba(255,255,255,0.6)", fontSize:".8rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", marginBottom:10 }}>Jadwal Angsuran</h3>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {Array.from({ length: detail.tenor }, (_, idx) => {
                    const ke = idx + 1;
                    const paid = ke <= detail.paid;
                    const pay = payments.find(p => p.angsuran_ke === ke);
                    return (
                      <div key={ke} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.03)", borderRadius:9, padding:"9px 14px" }}>
                        <span style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ width:22, height:22, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", background: paid?"rgba(52,211,153,0.15)":"rgba(255,255,255,0.06)", color: paid?"#34d399":"rgba(255,255,255,0.4)", fontSize:".72rem", fontWeight:700 }}>{ke}</span>
                          <span style={{ color:"rgba(255,255,255,0.75)", fontSize:".83rem" }}>Angsuran ke-{ke}</span>
                        </span>
                        <span style={{ color:"rgba(255,255,255,0.6)", fontSize:".82rem" }}>{fmt(detail.monthly)}</span>
                        {paid ? (
                          <span style={{ display:"flex", alignItems:"center", gap:4, color:"#34d399", fontSize:".74rem" }}>
                            <Check style={{ width:11, height:11 }} /> {pay ? fmtDate(pay.paid_at) : "Lunas"}
                          </span>
                        ) : (
                          <span style={{ display:"flex", alignItems:"center", gap:4, color:"rgba(255,255,255,0.35)", fontSize:".74rem" }}>
                            <Clock style={{ width:11, height:11 }} /> Belum
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <h3 style={{ color:"rgba(255,255,255,0.6)", fontSize:".8rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", margin:"18px 0 10px" }}>Riwayat Pembayaran</h3>
                {detailLoading ? <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".85rem" }}>Memuat...</p>
                  : payments.length === 0 ? <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".85rem" }}>Belum ada pembayaran.</p>
                  : (
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {payments.map(p=>(
                        <div key={p.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(52,211,153,0.06)", border:"1px solid rgba(52,211,153,0.15)", borderRadius:9, padding:"9px 14px" }}>
                          <span style={{ color:"rgba(255,255,255,0.7)", fontSize:".83rem" }}>Angsuran ke-{p.angsuran_ke}</span>
                          <span style={{ color:"#34d399", fontWeight:600, fontSize:".83rem" }}>{fmt(p.amount)}</span>
                          <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem" }}>{fmtDate(p.paid_at)}</span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

