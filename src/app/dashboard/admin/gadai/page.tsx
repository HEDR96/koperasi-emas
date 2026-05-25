"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Landmark, CheckCircle, XCircle, Clock, Search, Coins } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

type GadaiItem = {
  id: string;
  user_id: string;
  nilai_jaminan: number;
  harga_buyback: number;
  gram_setara: number;
  dana_cair: number;
  sisa_tagihan: number;
  status: string;
  keterangan: string | null;
  catatan_admin: string | null;
  created_at: string;
  profiles?: { name: string; phone: string | null } | null;
};

const S_MAP: Record<string, { label:string; bg:string; color:string }> = {
  pengajuan:   { label:"Menunggu",    bg:"rgba(251,146,60,0.1)",   color:"#fb923c" },
  disetujui:   { label:"Disetujui",   bg:"rgba(96,165,250,0.1)",   color:"#60a5fa" },
  aktif:       { label:"Aktif",       bg:"rgba(74,222,128,0.1)",   color:"#4ade80" },
  lunas:       { label:"Lunas",       bg:"rgba(74,222,128,0.08)",  color:"#4ade80" },
  ditolak:     { label:"Ditolak",     bg:"rgba(248,113,113,0.1)",  color:"#f87171" },
  gagal_bayar: { label:"Gagal Bayar", bg:"rgba(248,113,113,0.12)", color:"#f87171" },
};

export default function AdminGadaiPage() {
  const { user } = useAuthStore();
  const [rows, setRows]       = useState<GadaiItem[]>([]);
  const [filter, setFilter]   = useState<"all"|"pengajuan"|"aktif"|"lunas"|"ditolak">("pengajuan");
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);
  const [catatanMap, setCatatanMap] = useState<Record<string,string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase
      .from("gadai")
      .select("*, profiles(name, phone)")
      .order("created_at", { ascending: false }) as any);
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id: string, action: "disetujui"|"aktif"|"ditolak"|"lunas", catatan?: string) => {
    const update: any = { status: action, verified_by: user?.id };
    if (catatan) update.catatan_admin = catatan;
    if (action === "aktif" || action === "disetujui") update.tanggal_cair = new Date().toISOString();
    if (action === "lunas") update.tanggal_lunas = new Date().toISOString();
    await (supabase.from("gadai") as any).update(update).eq("id", id);
    setRows(r => r.map(x => x.id === id ? { ...x, ...update } : x));
  };

  const filtered = rows
    .filter(r => filter === "all" || r.status === filter)
    .filter(r => !search || (r.profiles?.name ?? "").toLowerCase().includes(search.toLowerCase()));

  const pengajuanCount = rows.filter(r => r.status === "pengajuan").length;
  const aktifCount     = rows.filter(r => r.status === "aktif").length;
  const totalDicairkan = rows.filter(r => r.status !== "ditolak" && r.status !== "pengajuan").reduce((a,b) => a+b.dana_cair, 0);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
        {[
          { label:"Menunggu Approval", value:String(pengajuanCount), color:"#fb923c" },
          { label:"Gadai Aktif",        value:String(aktifCount),     color:"#4ade80" },
          { label:"Total Dana Dicairkan", value:formatCurrency(totalDicairkan), color:"#D4AF37" },
        ].map(s => (
          <motion.div key={s.label} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.12)", borderRadius:16, padding:"18px 16px", textAlign:"center" }}>
            <p style={{ color:s.color, fontWeight:900, fontSize:"1.2rem", marginBottom:4 }}>{s.value}</p>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".75rem" }}>{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter + Search */}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:6 }}>
          {(["all","pengajuan","aktif","lunas","ditolak"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:"7px 14px", borderRadius:9, border:"1px solid", fontSize:".78rem", fontWeight:600, cursor:"pointer",
                borderColor: filter===f?"#D4AF37":"rgba(255,255,255,0.1)",
                background:  filter===f?"rgba(212,175,55,0.1)":"rgba(255,255,255,0.02)",
                color:       filter===f?"#D4AF37":"rgba(255,255,255,0.45)" }}>
              {{ all:"Semua", pengajuan:"Menunggu", aktif:"Aktif", lunas:"Lunas", ditolak:"Ditolak" }[f]}
              {f==="pengajuan" && pengajuanCount>0 && (
                <span style={{ marginLeft:6, background:"#fb923c", color:"#000", borderRadius:999, padding:"1px 7px", fontSize:".68rem", fontWeight:800 }}>{pengajuanCount}</span>
              )}
            </button>
          ))}
        </div>
        <div style={{ flex:1, minWidth:200, position:"relative" }}>
          <Search style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:15, height:15, color:"rgba(255,255,255,0.25)" }} />
          <input placeholder="Cari nama member..." value={search} onChange={e => setSearch(e.target.value)}
            className="input-gold" style={{ width:"100%", borderRadius:10, padding:"8px 12px 8px 36px", fontSize:".83rem" }} />
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
        style={{ background:"rgba(14,14,14,0.85)", border:"1px solid rgba(212,175,55,0.12)", borderRadius:20, overflow:"hidden" }}>
        {loading ? (
          <div style={{ padding:"40px 0", textAlign:"center", color:"rgba(255,255,255,0.2)" }}>Memuat data gadai...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:"40px 0", textAlign:"center" }}>
            <Landmark style={{ width:36, height:36, color:"rgba(255,255,255,0.1)", margin:"0 auto 10px" }} />
            <p style={{ color:"rgba(255,255,255,0.2)", fontSize:".85rem" }}>Tidak ada data gadai</p>
          </div>
        ) : (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 1.2fr 0.8fr 1.8fr", padding:"12px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              {["Member","Nilai Jaminan","Dana Cair","Status","Aksi"].map(h => (
                <span key={h} style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".05em" }}>{h}</span>
              ))}
            </div>
            {filtered.map((r, i) => {
              const st = S_MAP[r.status] ?? S_MAP.pengajuan;
              return (
                <div key={r.id} style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 1.2fr 0.8fr 1.8fr", padding:"14px 20px", alignItems:"center",
                  borderBottom: i<filtered.length-1?"1px solid rgba(255,255,255,0.04)":"none",
                  background: r.status==="pengajuan"?"rgba(251,146,60,0.02)":"transparent" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div className="bg-gold-gradient" style={{ width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#0a0a0a", fontSize:".75rem", flexShrink:0 }}>
                      {(r.profiles?.name?.[0] ?? "?")}
                    </div>
                    <div>
                      <p style={{ color:"#fff", fontSize:".83rem", fontWeight:600 }}>{r.profiles?.name ?? r.user_id.slice(0,8)}</p>
                      <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".7rem" }}>
                        {new Date(r.created_at).toLocaleDateString("id-ID",{ day:"2-digit", month:"short", year:"numeric" })}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".84rem" }}>{formatCurrency(r.nilai_jaminan)}</p>
                    <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem" }}>{Number(r.gram_setara).toFixed(4)}g</p>
                  </div>
                  <span style={{ color:"#4ade80", fontWeight:700, fontSize:".84rem" }}>{formatCurrency(r.dana_cair)}</span>
                  <span style={{ background:st.bg, color:st.color, borderRadius:8, padding:"4px 10px", fontSize:".72rem", fontWeight:700, display:"inline-block", width:"fit-content" }}>{st.label}</span>
                  <div style={{ display:"flex", gap:6, flexDirection:"column" }}>
                    {r.status === "pengajuan" && (
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={() => act(r.id, "aktif")}
                          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:4, padding:"6px 8px", borderRadius:8, border:"1px solid rgba(74,222,128,0.3)", background:"rgba(74,222,128,0.08)", color:"#4ade80", fontSize:".73rem", fontWeight:600, cursor:"pointer" }}>
                          <CheckCircle style={{ width:11, height:11 }} /> Setuju
                        </button>
                        <button onClick={() => act(r.id, "ditolak", catatanMap[r.id])}
                          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:4, padding:"6px 8px", borderRadius:8, border:"1px solid rgba(248,113,113,0.3)", background:"rgba(248,113,113,0.08)", color:"#f87171", fontSize:".73rem", fontWeight:600, cursor:"pointer" }}>
                          <XCircle style={{ width:11, height:11 }} /> Tolak
                        </button>
                      </div>
                    )}
                    {r.status === "aktif" && (
                      <button onClick={() => act(r.id, "lunas")}
                        style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:4, padding:"6px 12px", borderRadius:8, border:"1px solid rgba(96,165,250,0.3)", background:"rgba(96,165,250,0.08)", color:"#60a5fa", fontSize:".73rem", fontWeight:600, cursor:"pointer" }}>
                        <CheckCircle style={{ width:11, height:11 }} /> Mark Lunas
                      </button>
                    )}
                    {(r.status==="lunas"||r.status==="ditolak"||r.status==="gagal_bayar") && (
                      <span style={{ color:"rgba(255,255,255,0.2)", fontSize:".73rem" }}>
                        {r.status==="lunas"?"✓ Lunas":r.status==="ditolak"?"✗ Ditolak":"⚠ Gagal Bayar"}
                      </span>
                    )}
                    {r.status === "pengajuan" && (
                      <input placeholder="Catatan (opsional)..." value={catatanMap[r.id]||""}
                        onChange={e => setCatatanMap(m => ({...m,[r.id]:e.target.value}))}
                        className="input-gold" style={{ borderRadius:8, padding:"5px 10px", fontSize:".72rem", width:"100%" }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
