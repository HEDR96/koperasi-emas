"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Landmark, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);

interface GadaiRow {
  id: string; nilai_jaminan: number; dana_cair: number; sisa_tagihan: number;
  status: string; tenor: number; angsuran_per_bulan: number; created_at: string;
  catatan_admin: string | null;
}

const STATUS: Record<string, { label:string; color:string; icon:any }> = {
  pengajuan: { label:"Menunggu Review",  color:"#D4AF37", icon:Clock },
  disetujui: { label:"Disetujui",        color:"#34d399", icon:CheckCircle },
  aktif:     { label:"Aktif",            color:"#60a5fa", icon:Landmark },
  lunas:     { label:"Lunas",            color:"#34d399", icon:CheckCircle },
  ditolak:   { label:"Ditolak",          color:"#f87171", icon:XCircle },
  gagal_bayar:{ label:"Gagal Bayar",     color:"#f87171", icon:AlertCircle },
};

export default function GadaiPage() {
  const { user } = useAuthStore();
  const [gadais, setGadais] = useState<GadaiRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase.from("gadai") as any)
      .select("id, nilai_jaminan, dana_cair, sisa_tagihan, status, tenor, angsuran_per_bulan, created_at, catatan_admin")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setGadais(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [user]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:800 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Gadai Simpanan</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Riwayat dan status pengajuan gadai Anda</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      <div style={{ background:"rgba(96,165,250,0.06)", border:"1px solid rgba(96,165,250,0.2)", borderRadius:14, padding:"14px 18px" }}>
        <p style={{ color:"rgba(255,255,255,0.6)", fontSize:".82rem", margin:0, lineHeight:1.7 }}>
          💡 Untuk mengajukan gadai baru, buka halaman <strong style={{ color:"#60a5fa" }}>Simpanan</strong> dan klik tombol <strong style={{ color:"#60a5fa" }}>Ajukan Gadai</strong>. Pastikan tidak ada gadai aktif terlebih dahulu.
        </p>
      </div>

      {loading ? (
        <p style={{ color:"rgba(255,255,255,0.3)" }}>Memuat riwayat gadai...</p>
      ) : gadais.length === 0 ? (
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:"40px 24px", textAlign:"center" }}>
          <Landmark style={{ width:40, height:40, color:"rgba(255,255,255,0.15)", margin:"0 auto 12px" }} />
          <p style={{ color:"rgba(255,255,255,0.4)", margin:0 }}>Belum ada pengajuan gadai</p>
          <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".82rem", marginTop:6 }}>Ajukan gadai melalui halaman Simpanan</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {gadais.map((g, i) => {
            const s = STATUS[g.status] || STATUS.pengajuan;
            const Icon = s.icon;
            const progress = g.dana_cair > 0 ? Math.min(100, ((g.dana_cair - g.sisa_tagihan) / g.dana_cair) * 100) : 0;
            return (
              <motion.div key={g.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.05 }}
                style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${s.color}30`, borderRadius:16, overflow:"hidden" }}>
                {/* Header */}
                <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:`${s.color}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Icon style={{ width:18, height:18, color:s.color }} />
                    </div>
                    <div>
                      <p style={{ color:"#fff", fontWeight:700, fontSize:".9rem", margin:0 }}>
                        Gadai {fmt(g.dana_cair)}
                      </p>
                      <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".72rem", margin:0 }}>
                        {new Date(g.created_at).toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric" })}
                      </p>
                    </div>
                  </div>
                  <span style={{ padding:"4px 12px", borderRadius:20, background:`${s.color}18`, border:`1px solid ${s.color}40`, color:s.color, fontWeight:600, fontSize:".78rem" }}>
                    {s.label}
                  </span>
                </div>

                {/* Details */}
                <div style={{ padding:"16px 20px", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:14 }}>
                  {[
                    { label:"Pinjaman",       value:fmt(g.dana_cair),           color:"#fff" },
                    { label:"Angsuran/bln",   value:g.angsuran_per_bulan > 0 ? fmt(g.angsuran_per_bulan) : "-", color:"#D4AF37" },
                    { label:"Tenor",          value:g.tenor ? `${g.tenor} bulan` : "-", color:"rgba(255,255,255,0.7)" },
                    { label:"Sisa Tagihan",   value:fmt(g.sisa_tagihan),        color:g.sisa_tagihan > 0 ? "#f87171" : "#34d399" },
                  ].map(d => (
                    <div key={d.label}>
                      <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".72rem", margin:"0 0 4px" }}>{d.label}</p>
                      <p style={{ color:d.color, fontWeight:700, fontSize:".9rem", margin:0 }}>{d.value}</p>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                {g.status === "aktif" && g.dana_cair > 0 && (
                  <div style={{ padding:"0 20px 16px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ color:"rgba(255,255,255,0.35)", fontSize:".72rem" }}>Progres Pelunasan</span>
                      <span style={{ color:"#60a5fa", fontSize:".72rem", fontWeight:600 }}>{Math.round(progress)}%</span>
                    </div>
                    <div style={{ height:6, background:"rgba(255,255,255,0.08)", borderRadius:4, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg,#60a5fa,#93c5fd)", borderRadius:4, transition:"width .5s" }} />
                    </div>
                  </div>
                )}

                {/* Catatan admin */}
                {g.catatan_admin && (
                  <div style={{ margin:"0 20px 16px", background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:10, padding:"10px 14px" }}>
                    <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".72rem", margin:"0 0 4px" }}>Catatan Admin</p>
                    <p style={{ color:"rgba(255,255,255,0.7)", fontSize:".82rem", margin:0 }}>{g.catatan_admin}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
