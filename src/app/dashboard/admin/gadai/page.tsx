"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Landmark, RefreshCw, Check, X, CheckCircle, Clock, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { getStaffMap, fmtTgl } from "@/lib/staff";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" });

const STATUS: Record<string,{label:string;color:string}> = {
  pengajuan:  { label:"Pengajuan", color:"#92400e" },
  disetujui:  { label:"Disetujui", color:"#065f46" },
  aktif:      { label:"Aktif",     color:"#1d4ed8" },
  lunas:      { label:"Lunas",     color:"#065f46" },
  ditolak:    { label:"Ditolak",   color:"#991b1b" },
  gagal_bayar:{ label:"Gagal Bayar", color:"#991b1b" },
};

const FILTERS = ["semua","pengajuan","aktif","lunas"] as const;

const paidCountOf = (g: any) => (g.angsuran_per_bulan > 0 ? Math.min(g.tenor, Math.round((g.dana_cair - g.sisa_tagihan) / g.angsuran_per_bulan)) : 0);

export default function AdminGadaiPage() {
  const { user } = useAuthStore();
  const isMaster = user?.role === "master";
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [filter, setFilter] = useState<typeof FILTERS[number]>("semua");
  const [detail, setDetail] = useState<any | null>(null);
  const [pmts, setPmts] = useState<any[]>([]);
  const [pmtLoading, setPmtLoading] = useState(false);
  const [staff, setStaff] = useState<Record<string,string>>({});
  const [catatanEdit, setCatatanEdit] = useState("");
  const [savingCatatan, setSavingCatatan] = useState(false);

  // Nama penginput: staff (admin/master) atau anggota sendiri bila ia yang mengajukan.
  const recorderName = (g: any) => g?.recorded_by ? (staff[g.recorded_by] || (g.recorded_by === g.user_id ? (g.profiles?.name || "Anggota") : "—")) : "—";

  async function load() {
    setLoading(true);
    const [{ data }, staffMap] = await Promise.all([
      (supabase.from("gadai") as any)
        .select("id, user_id, dana_cair, sisa_tagihan, nilai_jaminan, gram_setara, tenor, angsuran_per_bulan, status, created_at, transaction_date, recorded_by, keterangan, catatan_admin, profiles:profiles!user_id(name)")
        .order("created_at",{ascending:false}).limit(200),
      getStaffMap(),
    ]);
    setRows(data || []);
    setStaff(staffMap);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function notify(uid: string, title: string, body: string) {
    try { await (supabase.from("notifications") as any).insert({ user_id:uid, title, body, type:"gadai", is_read:false, link:"/dashboard/member/gadai" }); } catch {}
  }

  async function setStatus(row: any, status: string) {
    if ((status === "aktif" || status === "ditolak") && !isMaster) {
      alert("Hanya master yang bisa menyetujui/menolak pengajuan gadai.");
      return;
    }
    setActing(row.id);
    const patch: any = { status, verified_by: user?.id };
    if (status === "aktif")  patch.tanggal_cair = new Date().toISOString();
    if (status === "lunas")  { patch.tanggal_lunas = new Date().toISOString(); patch.sisa_tagihan = 0; }
    await (supabase.from("gadai") as any).update(patch).eq("id", row.id);
    const msg: Record<string,string> = {
      aktif: `Gadai ${fmt(row.dana_cair)} disetujui & dana dicairkan.`,
      ditolak: `Pengajuan gadai ${fmt(row.dana_cair)} ditolak.`,
      lunas: `Selamat! Gadai ${fmt(row.dana_cair)} telah dinyatakan LUNAS.`,
    };
    if (msg[status]) await notify(row.user_id, "Update Gadai", msg[status]);
    setDetail((d: any) => d && d.id === row.id ? ({ ...d, status, ...patch }) : d);
    await load(); setActing(null);
  }

  async function openDetail(g: any) {
    setDetail(g); setPmtLoading(true); setPmts([]); setCatatanEdit(g.catatan_admin || "");
    const { data } = await (supabase.from("gadai_pembayaran") as any)
      .select("id, angsuran_ke, amount, paid_at").eq("gadai_id", g.id).order("paid_at",{ascending:true});
    setPmts(data || []); setPmtLoading(false);
  }

  async function saveCatatanAdmin(g: any) {
    setSavingCatatan(true);
    const { error } = await (supabase.from("gadai") as any).update({ catatan_admin: catatanEdit || null }).eq("id", g.id);
    if (!error) {
      setDetail((d: any) => d ? ({ ...d, catatan_admin: catatanEdit || null }) : d);
      setRows(list => list.map(r => r.id === g.id ? { ...r, catatan_admin: catatanEdit || null } : r));
    }
    setSavingCatatan(false);
  }

  async function recordGadaiPayment(g: any) {
    const paid = paidCountOf(g);
    if (g.sisa_tagihan <= 0 || paid >= g.tenor) return;
    setActing(g.id);
    const ke = paid + 1;
    const newSisa = Math.max(0, g.sisa_tagihan - g.angsuran_per_bulan);
    const done = newSisa <= 0;
    await (supabase.from("gadai_pembayaran") as any).insert({
      gadai_id: g.id, user_id: g.user_id, angsuran_ke: ke, amount: g.angsuran_per_bulan, recorded_by: user?.id,
    });
    await (supabase.from("gadai") as any).update({
      sisa_tagihan: newSisa, status: done ? "lunas" : "aktif",
      ...(done ? { tanggal_lunas: new Date().toISOString() } : {}),
    }).eq("id", g.id);
    await notify(g.user_id, done ? "Gadai Lunas 🎉" : "Pembayaran Gadai", done ? `Gadai ${fmt(g.dana_cair)} telah LUNAS.` : `Angsuran ke-${ke} ${fmt(g.angsuran_per_bulan)} tercatat.`);
    const updated = { ...g, sisa_tagihan: newSisa, status: done ? "lunas" : "aktif" };
    setDetail(updated); await openDetail(updated); await load(); setActing(null);
  }

  async function removeGadai(g: any) {
    if (!window.confirm(`Hapus gadai ${fmt(g.dana_cair)} milik ${g.profiles?.name||"anggota"}?`)) return;
    setActing(g.id);
    await (supabase.from("gadai") as any).delete().eq("id", g.id);
    setDetail(null); await load(); setActing(null);
  }

  const filtered = filter === "semua" ? rows
    : filter === "aktif" ? rows.filter(r => ["disetujui","aktif"].includes(r.status))
    : rows.filter(r => r.status === filter);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#2D1B00", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Kelola Gadai Simpanan</h1>
          <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".85rem", margin:"4px 0 0" }}>Setujui pengajuan, cairkan dana, dan tandai lunas</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#8B6010", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {FILTERS.map(f => (
          <button key={f} onClick={()=>setFilter(f)}
            style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${filter===f?"rgba(212,175,55,0.35)":"rgba(201,162,39,0.15)"}`, background:filter===f?"rgba(212,175,55,0.1)":"transparent", color:filter===f?"#D4AF37":"rgba(101,67,14,0.5)", cursor:"pointer", fontSize:".8rem", fontWeight:filter===f?700:400, textTransform:"capitalize" }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color:"rgba(101,67,14,0.35)" }}>Memuat...</p>
        : filtered.length === 0 ? (
          <div style={{ background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.12)", borderRadius:16, padding:"48px", textAlign:"center" }}>
            <Landmark style={{ width:38, height:38, color:"rgba(101,67,14,0.2)", margin:"0 auto 12px" }} />
            <p style={{ color:"rgba(101,67,14,0.45)", margin:0 }}>Tidak ada data gadai.</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filtered.map((g,i)=>{
              const s = STATUS[g.status] || STATUS.pengajuan;
              return (
                <motion.div key={g.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.03 }}
                  style={{ background:"rgba(255,255,255,0.72)", border:`1px solid ${s.color}30`, borderRadius:14, padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:14, flexWrap:"wrap" }}>
                  <div>
                    <p style={{ color:"#2D1B00", fontWeight:700, fontSize:".9rem", margin:0 }}>
                      {g.profiles?.name||"—"} <span style={{ color:"rgba(101,67,14,0.45)", fontWeight:400 }}>· {g.tenor} bln · {Number(g.gram_setara).toFixed(1)} gr</span>
                    </p>
                    <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".76rem", margin:"2px 0 0" }}>
                      Pinjaman {fmt(g.dana_cair)} · Sisa {fmt(g.sisa_tagihan)} · Angsuran {fmt(g.angsuran_per_bulan)}/bln · Tgl transaksi {fmtTgl(g.transaction_date || g.created_at)}
                    </p>
                    <p style={{ color:"rgba(101,67,14,0.35)", fontSize:".72rem", margin:"2px 0 0" }}>
                      Diinput oleh: <span style={{ color:"#1d4ed8" }}>{recorderName(g)}</span> · Diinput {fmtDate(g.created_at)}
                    </p>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ background:`${s.color}18`, border:`1px solid ${s.color}40`, color:s.color, borderRadius:20, padding:"3px 12px", fontSize:".74rem", fontWeight:600 }}>{s.label}</span>
                    {g.status === "pengajuan" && (
                      isMaster ? (
                        <>
                          <button onClick={()=>setStatus(g,"aktif")} disabled={acting===g.id}
                            style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(6,95,70,0.09)", border:"1px solid rgba(52,211,153,0.3)", borderRadius:8, padding:"6px 12px", color:"#065f46", cursor:"pointer", fontSize:".78rem", fontWeight:600, opacity:acting===g.id?.6:1 }}>
                            <Check style={{ width:12, height:12 }} /> Setujui & Cairkan
                          </button>
                          <button onClick={()=>setStatus(g,"ditolak")} disabled={acting===g.id}
                            style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(153,27,27,0.06)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:8, padding:"6px 12px", color:"#991b1b", cursor:"pointer", fontSize:".78rem", fontWeight:600, opacity:acting===g.id?.6:1 }}>
                            <X style={{ width:12, height:12 }} /> Tolak
                          </button>
                        </>
                      ) : (
                        <span style={{ color:"rgba(101,67,14,0.4)", fontSize:".76rem", fontStyle:"italic" }}>Menunggu approval master</span>
                      )
                    )}
                    <button onClick={()=>openDetail(g)}
                      style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.22)", borderRadius:8, padding:"6px 12px", color:"rgba(101,67,14,0.75)", cursor:"pointer", fontSize:".78rem", fontWeight:600 }}>
                      Detail{g.status!=="pengajuan" ? " / Bayar" : ""}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      {/* Detail gadai + pembayaran */}
      <AnimatePresence>
        {detail && (() => {
          const paid = paidCountOf(detail);
          const s = STATUS[detail.status] || STATUS.aktif;
          return (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={()=>setDetail(null)}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
            <motion.div onClick={e=>e.stopPropagation()} initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:.95 }}
              style={{ width:"min(520px,96vw)", background:"rgba(255,252,220,0.95)", border:"1px solid rgba(96,165,250,0.25)", borderRadius:20, maxHeight:"90vh", overflowY:"auto" }}>
              <div style={{ padding:"20px 22px 16px", borderBottom:"1px solid rgba(201,162,39,0.12)", display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
                <div>
                  <h2 style={{ color:"#2D1B00", fontWeight:700, fontSize:"1.05rem", margin:0 }}>Gadai · {detail.profiles?.name||"—"}</h2>
                  <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".8rem", margin:"2px 0 0" }}>{Number(detail.gram_setara).toFixed(1)} gr · {detail.tenor} bln · <span style={{ color:s.color }}>{s.label}</span></p>
                  <p style={{ color:"rgba(101,67,14,0.4)", fontSize:".74rem", margin:"3px 0 0" }}>Diinput oleh {recorderName(detail)} · Tgl transaksi {fmtTgl(detail.transaction_date || detail.created_at)}</p>
                </div>
                <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                  {isMaster && (
                    <button onClick={()=>removeGadai(detail)} disabled={acting===detail.id} title="Hapus (master)"
                      style={{ background:"rgba(153,27,27,0.08)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", color:"#991b1b", cursor:"pointer" }}>
                      <Trash2 style={{ width:15, height:15 }} />
                    </button>
                  )}
                  <button onClick={()=>setDetail(null)} style={{ background:"rgba(255,255,255,0.72)", border:"none", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(101,67,14,0.55)", cursor:"pointer" }}><X style={{ width:15, height:15 }} /></button>
                </div>
              </div>
              <div style={{ padding:"18px 22px 24px" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
                  {[
                    { label:"Pinjaman", value:fmt(detail.dana_cair), color:"#2D1B00" },
                    { label:"Angsuran/bln", value:fmt(detail.angsuran_per_bulan), color:"#1d4ed8" },
                    { label:"Terbayar", value:`${paid}/${detail.tenor}`, color:"#065f46" },
                    { label:"Sisa", value:fmt(detail.sisa_tagihan), color: detail.sisa_tagihan>0?"#f87171":"#34d399" },
                  ].map(c=>(
                    <div key={c.label} style={{ background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.12)", borderRadius:12, padding:"12px 14px" }}>
                      <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".72rem", margin:"0 0 4px" }}>{c.label}</p>
                      <p style={{ color:c.color, fontWeight:700, fontSize:".95rem", margin:0 }}>{c.value}</p>
                    </div>
                  ))}
                </div>

                {detail.status === "pengajuan" ? (
                  isMaster ? (
                    <div style={{ display:"flex", gap:8, marginBottom:18 }}>
                      <button onClick={()=>setStatus(detail,"aktif")} disabled={acting===detail.id}
                        style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", borderRadius:11, background:"linear-gradient(135deg,#34d399,#6ee7b7)", border:"none", color:"#0a0a0a", fontWeight:700, fontSize:".92rem", cursor:acting===detail.id?"not-allowed":"pointer", opacity:acting===detail.id?.7:1 }}>
                        <Check style={{ width:16, height:16 }} /> Setujui & Cairkan
                      </button>
                      <button onClick={()=>setStatus(detail,"ditolak")} disabled={acting===detail.id}
                        style={{ padding:"12px 18px", borderRadius:11, background:"rgba(153,27,27,0.06)", border:"1px solid rgba(248,113,113,0.25)", color:"#991b1b", fontWeight:700, fontSize:".92rem", cursor:acting===detail.id?"not-allowed":"pointer" }}>
                        <X style={{ width:16, height:16 }} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", borderRadius:11, background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.3)", color:"#8B6010", fontWeight:600, fontSize:".85rem", marginBottom:18 }}>
                      <Clock style={{ width:16, height:16 }} /> Menunggu persetujuan Master
                    </div>
                  )
                ) : detail.sisa_tagihan > 0 ? (
                  <button onClick={()=>recordGadaiPayment(detail)} disabled={acting===detail.id}
                    style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", borderRadius:11, background:"linear-gradient(135deg,#34d399,#6ee7b7)", border:"none", color:"#0a0a0a", fontWeight:700, fontSize:".92rem", cursor:acting===detail.id?"not-allowed":"pointer", opacity:acting===detail.id?.7:1, marginBottom:18 }}>
                    <Check style={{ width:16, height:16 }} /> Catat Bayar Angsuran ke-{paid+1} ({fmt(detail.angsuran_per_bulan)})
                  </button>
                ) : (
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", borderRadius:11, background:"rgba(6,95,70,0.09)", border:"1px solid rgba(52,211,153,0.3)", color:"#065f46", fontWeight:700, marginBottom:18 }}>
                    <CheckCircle style={{ width:16, height:16 }} /> Lunas
                  </div>
                )}

                {detail.keterangan && (
                  <div style={{ marginBottom:14 }}>
                    <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 4px" }}>Keterangan Anggota</p>
                    <p style={{ color:"rgba(101,67,14,0.75)", fontSize:".85rem", margin:0 }}>{detail.keterangan}</p>
                  </div>
                )}

                <div style={{ marginBottom:18 }}>
                  <label style={{ color:"rgba(101,67,14,0.7)", fontSize:".8rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", display:"block", marginBottom:8 }}>Catatan Admin</label>
                  <textarea rows={2} value={catatanEdit} onChange={e=>setCatatanEdit(e.target.value)}
                    style={{ width:"100%", background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.2)", borderRadius:10, padding:"10px 14px", color:"#2D1B00", fontSize:".9rem", outline:"none", boxSizing:"border-box", resize:"vertical", fontFamily:"inherit" }}
                    placeholder="Keterangan tambahan…" />
                  <button onClick={()=>saveCatatanAdmin(detail)} disabled={savingCatatan || catatanEdit === (detail.catatan_admin||"")}
                    style={{ marginTop:8, background:"rgba(212,175,55,0.12)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:8, padding:"7px 14px", color:"#8B6010", cursor: savingCatatan || catatanEdit===(detail.catatan_admin||"") ? "not-allowed" : "pointer", fontSize:".8rem", fontWeight:700, opacity: savingCatatan || catatanEdit===(detail.catatan_admin||"") ? .5 : 1 }}>
                    {savingCatatan ? "Menyimpan…" : "Simpan Catatan"}
                  </button>
                </div>

                <h3 style={{ color:"rgba(101,67,14,0.7)", fontSize:".8rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", marginBottom:10 }}>Jadwal Angsuran</h3>
                <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:18 }}>
                  {Array.from({ length: detail.tenor }, (_, idx) => {
                    const ke = idx + 1; const isPaid = ke <= paid; const pay = pmts.find(p=>p.angsuran_ke===ke);
                    return (
                      <div key={ke} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.72)", borderRadius:9, padding:"9px 14px" }}>
                        <span style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ width:22, height:22, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", background: isPaid?"rgba(6,95,70,0.1)":"rgba(201,162,39,0.12)", color: isPaid?"#34d399":"rgba(101,67,14,0.45)", fontSize:".72rem", fontWeight:700 }}>{ke}</span>
                          <span style={{ color:"rgba(101,67,14,0.75)", fontSize:".83rem" }}>Angsuran ke-{ke}</span>
                        </span>
                        <span style={{ color:"rgba(101,67,14,0.7)", fontSize:".82rem" }}>{fmt(detail.angsuran_per_bulan)}</span>
                        {isPaid
                          ? <span style={{ display:"flex", alignItems:"center", gap:4, color:"#065f46", fontSize:".74rem" }}><Check style={{ width:11, height:11 }} /> {pay?fmtDate(pay.paid_at):"Lunas"}</span>
                          : <span style={{ display:"flex", alignItems:"center", gap:4, color:"rgba(101,67,14,0.4)", fontSize:".74rem" }}><Clock style={{ width:11, height:11 }} /> Belum</span>}
                      </div>
                    );
                  })}
                </div>

                <h3 style={{ color:"rgba(101,67,14,0.7)", fontSize:".8rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", marginBottom:10 }}>Riwayat Pembayaran</h3>
                {pmtLoading ? <p style={{ color:"rgba(101,67,14,0.35)", fontSize:".85rem" }}>Memuat...</p>
                  : pmts.length === 0 ? <p style={{ color:"rgba(101,67,14,0.35)", fontSize:".85rem" }}>Belum ada pembayaran.</p>
                  : (
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {pmts.map(p=>(
                        <div key={p.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(52,211,153,0.06)", border:"1px solid rgba(52,211,153,0.15)", borderRadius:9, padding:"9px 14px" }}>
                          <span style={{ color:"rgba(101,67,14,0.75)", fontSize:".83rem" }}>Angsuran ke-{p.angsuran_ke}</span>
                          <span style={{ color:"#065f46", fontWeight:600, fontSize:".83rem" }}>{fmt(p.amount)}</span>
                          <span style={{ color:"rgba(101,67,14,0.45)", fontSize:".75rem" }}>{fmtDate(p.paid_at)}</span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </motion.div>
          </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
