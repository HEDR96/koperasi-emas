"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UserCheck, RefreshCw, Check, X, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric" });

export default function AdminVerifikasiPage() {
  const { user } = useAuthStore();
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await (supabase.from("profiles") as any)
      .select("id, name, nik, phone, status, created_at")
      .eq("role","member").eq("status","pending")
      .order("created_at",{ascending:false});
    setPending(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function act(row: any, approve: boolean) {
    setActing(row.id);
    await (supabase.from("profiles") as any).update({
      status: approve ? "active" : "rejected",
      status_changed_by: user?.id ?? null,
      status_changed_at: new Date().toISOString(),
      status_reason: approve ? "Verifikasi disetujui" : "Verifikasi ditolak",
    }).eq("id", row.id);
    try {
      await (supabase.from("notifications") as any).insert({
        user_id: row.id, title: approve ? "Akun Diaktifkan" : "Verifikasi Ditolak",
        body: approve ? "Selamat! Akun keanggotaan Anda telah diverifikasi dan aktif." : "Mohon maaf, verifikasi keanggotaan Anda ditolak. Hubungi admin.",
        type:"akun", is_read:false, link:"/dashboard/member",
      });
    } catch {}
    await load(); setActing(null);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:820 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Verifikasi Anggota</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Setujui anggota baru yang menunggu verifikasi</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      {loading ? <p style={{ color:"rgba(255,255,255,0.3)" }}>Memuat...</p>
        : pending.length === 0 ? (
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:"48px 24px", textAlign:"center" }}>
            <UserCheck style={{ width:40, height:40, color:"rgba(255,255,255,0.15)", margin:"0 auto 12px" }} />
            <p style={{ color:"rgba(255,255,255,0.4)", margin:0 }}>Tidak ada anggota menunggu verifikasi.</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {pending.map((m,i) => (
              <motion.div key={m.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.04 }}
                style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:14, padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:14, flexWrap:"wrap" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:"rgba(251,191,36,0.12)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fbbf24", fontWeight:700 }}>
                    {m.name?.[0]?.toUpperCase()||"M"}
                  </div>
                  <div>
                    <p style={{ color:"#fff", fontWeight:700, fontSize:".92rem", margin:0 }}>{m.name}</p>
                    <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".76rem", margin:"2px 0 0" }}>
                      ID {m.nik||"—"} · {m.phone||"—"} · Daftar {fmtDate(m.created_at)}
                    </p>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:4, color:"#fbbf24", fontSize:".75rem", marginRight:4 }}>
                    <Clock style={{ width:11, height:11 }} /> Pending
                  </span>
                  <button onClick={()=>act(m,true)} disabled={acting===m.id}
                    style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.3)", borderRadius:8, padding:"6px 12px", color:"#34d399", cursor:"pointer", fontSize:".78rem", fontWeight:600, opacity:acting===m.id?.6:1 }}>
                    <Check style={{ width:12, height:12 }} /> Aktifkan
                  </button>
                  <button onClick={()=>act(m,false)} disabled={acting===m.id}
                    style={{ display:"flex", alignItems:"center", gap:4, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:8, padding:"6px 12px", color:"#f87171", cursor:"pointer", fontSize:".78rem", fontWeight:600, opacity:acting===m.id?.6:1 }}>
                    <X style={{ width:12, height:12 }} /> Tolak
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
    </div>
  );
}
