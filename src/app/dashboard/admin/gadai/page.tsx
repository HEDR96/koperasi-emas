"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Landmark, RefreshCw, Check, X, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" });

const STATUS: Record<string,{label:string;color:string}> = {
  pengajuan:  { label:"Pengajuan", color:"#fbbf24" },
  disetujui:  { label:"Disetujui", color:"#34d399" },
  aktif:      { label:"Aktif",     color:"#60a5fa" },
  lunas:      { label:"Lunas",     color:"#34d399" },
  ditolak:    { label:"Ditolak",   color:"#f87171" },
  gagal_bayar:{ label:"Gagal Bayar", color:"#f87171" },
};

const FILTERS = ["semua","pengajuan","aktif","lunas"] as const;

export default function AdminGadaiPage() {
  const { user } = useAuthStore();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [filter, setFilter] = useState<typeof FILTERS[number]>("semua");

  async function load() {
    setLoading(true);
    const { data } = await (supabase.from("gadai") as any)
      .select("id, user_id, dana_cair, sisa_tagihan, nilai_jaminan, gram_setara, tenor, angsuran_per_bulan, status, created_at, profiles(name)")
      .order("created_at",{ascending:false}).limit(200);
    setRows(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function notify(uid: string, title: string, body: string) {
    try { await (supabase.from("notifications") as any).insert({ user_id:uid, title, body, type:"gadai", is_read:false, link:"/dashboard/member/gadai" }); } catch {}
  }

  async function setStatus(row: any, status: string) {
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
    await load(); setActing(null);
  }

  const filtered = filter === "semua" ? rows
    : filter === "aktif" ? rows.filter(r => ["disetujui","aktif"].includes(r.status))
    : rows.filter(r => r.status === filter);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Kelola Gadai Simpanan</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Setujui pengajuan, cairkan dana, dan tandai lunas</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
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
            <Landmark style={{ width:38, height:38, color:"rgba(255,255,255,0.15)", margin:"0 auto 12px" }} />
            <p style={{ color:"rgba(255,255,255,0.4)", margin:0 }}>Tidak ada data gadai.</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {filtered.map((g,i)=>{
              const s = STATUS[g.status] || STATUS.pengajuan;
              return (
                <motion.div key={g.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.03 }}
                  style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${s.color}30`, borderRadius:14, padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:14, flexWrap:"wrap" }}>
                  <div>
                    <p style={{ color:"#fff", fontWeight:700, fontSize:".9rem", margin:0 }}>
                      {g.profiles?.name||"—"} <span style={{ color:"rgba(255,255,255,0.4)", fontWeight:400 }}>· {g.tenor} bln · {Number(g.gram_setara).toFixed(4)} gr</span>
                    </p>
                    <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".76rem", margin:"2px 0 0" }}>
                      Pinjaman {fmt(g.dana_cair)} · Sisa {fmt(g.sisa_tagihan)} · Angsuran {fmt(g.angsuran_per_bulan)}/bln · {fmtDate(g.created_at)}
                    </p>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ background:`${s.color}18`, border:`1px solid ${s.color}40`, color:s.color, borderRadius:20, padding:"3px 12px", fontSize:".74rem", fontWeight:600 }}>{s.label}</span>
                    {g.status === "pengajuan" && (
                      <>
                        <button onClick={()=>setStatus(g,"aktif")} disabled={acting===g.id}
                          style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.3)", borderRadius:8, padding:"6px 12px", color:"#34d399", cursor:"pointer", fontSize:".78rem", fontWeight:600, opacity:acting===g.id?.6:1 }}>
                          <Check style={{ width:12, height:12 }} /> Setujui & Cairkan
                        </button>
                        <button onClick={()=>setStatus(g,"ditolak")} disabled={acting===g.id}
                          style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:8, padding:"6px 12px", color:"#f87171", cursor:"pointer", fontSize:".78rem", fontWeight:600, opacity:acting===g.id?.6:1 }}>
                          <X style={{ width:12, height:12 }} /> Tolak
                        </button>
                      </>
                    )}
                    {["disetujui","aktif"].includes(g.status) && (
                      <button onClick={()=>setStatus(g,"lunas")} disabled={acting===g.id}
                        style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(96,165,250,0.12)", border:"1px solid rgba(96,165,250,0.3)", borderRadius:8, padding:"6px 12px", color:"#60a5fa", cursor:"pointer", fontSize:".78rem", fontWeight:600, opacity:acting===g.id?.6:1 }}>
                        <CheckCircle style={{ width:12, height:12 }} /> Tandai Lunas
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
    </div>
  );
}
