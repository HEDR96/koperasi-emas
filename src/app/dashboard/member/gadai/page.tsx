"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Landmark, CheckCircle, Clock, AlertCircle, ShieldCheck,
  Coins, TrendingDown, ChevronRight, XCircle, Info,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { useGoldStore } from "@/store/useGoldStore";

type GadaiRow = {
  id: string;
  nilai_jaminan: number;
  harga_buyback: number;
  gram_setara: number;
  dana_cair: number;
  sisa_tagihan: number;
  status: "pengajuan" | "disetujui" | "aktif" | "lunas" | "ditolak" | "gagal_bayar";
  keterangan: string | null;
  catatan_admin: string | null;
  tanggal_cair: string | null;
  created_at: string;
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pengajuan:  { label: "Menunggu",     color: "#fb923c", bg: "rgba(251,146,60,0.1)"  },
  disetujui:  { label: "Disetujui",    color: "#60a5fa", bg: "rgba(96,165,250,0.1)"  },
  aktif:      { label: "Aktif",        color: "#4ade80", bg: "rgba(74,222,128,0.1)"  },
  lunas:      { label: "Lunas",        color: "#4ade80", bg: "rgba(74,222,128,0.08)" },
  ditolak:    { label: "Ditolak",      color: "#f87171", bg: "rgba(248,113,113,0.1)" },
  gagal_bayar:{ label: "Gagal Bayar",  color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

export default function GadaiPage() {
  const { user } = useAuthStore();
  const { prices } = useGoldStore();

  const [rows, setRows]         = useState<GadaiRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [simpananTotal, setSimpananTotal] = useState(0);
  const [step, setStep]         = useState<"info"|"form"|"confirm"|"done">("info");
  const [jumlahPinjam, setJumlahPinjam] = useState(0);
  const [keterangan, setKeterangan]     = useState("");
  const [submitting, setSubmitting]     = useState(false);

  const buybackPrice = prices.buybackMember;
  const gramSetara   = jumlahPinjam > 0 ? jumlahPinjam / buybackPrice : 0;

  // Ambil simpanan completed
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const [{ data: simpanan }, { data: gadai }] = await Promise.all([
      (supabase.from("simpanan") as any)
        .select("amount, status")
        .eq("user_id", user.id)
        .eq("status", "completed"),
      (supabase.from("gadai") as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    const total = (simpanan ?? []).reduce((a: number, b: any) => a + b.amount, 0);
    setSimpananTotal(total);
    setJumlahPinjam(total); // default = full simpanan
    setRows(gadai ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const hasActiveGadai = rows.some(r => r.status === "aktif" || r.status === "pengajuan" || r.status === "disetujui");

  const handleSubmit = async () => {
    if (!user?.id || jumlahPinjam <= 0) return;
    setSubmitting(true);
    await (supabase.from("gadai") as any).insert({
      user_id:       user.id,
      nilai_jaminan: simpananTotal,
      harga_buyback: buybackPrice,
      gram_setara:   gramSetara,
      dana_cair:     jumlahPinjam,
      sisa_tagihan:  jumlahPinjam,
      keterangan:    keterangan || null,
    });
    setSubmitting(false);
    setStep("done");
    loadData();
  };

  if (step === "done") {
    return (
      <motion.div initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }}
        style={{ maxWidth:480, margin:"40px auto", background:"rgba(14,14,14,0.9)", border:"1px solid rgba(74,222,128,0.3)", borderRadius:22, padding:"40px 32px", textAlign:"center" }}>
        <div style={{ width:70, height:70, borderRadius:20, background:"rgba(74,222,128,0.1)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
          <CheckCircle style={{ width:36, height:36, color:"#4ade80" }} />
        </div>
        <h2 style={{ color:"#fff", fontWeight:900, fontSize:"1.4rem", marginBottom:8 }}>Pengajuan Terkirim!</h2>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", marginBottom:20 }}>
          Pengajuan gadai simpanan kamu sedang diverifikasi admin. Dana akan dicairkan setelah disetujui.
        </p>
        <div style={{ background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:14, padding:"16px 20px", marginBottom:24, textAlign:"left" }}>
          {[
            { label:"Nilai Jaminan",     value: formatCurrency(simpananTotal) },
            { label:"Dana Akan Cair",    value: formatCurrency(jumlahPinjam) },
            { label:"Setara Emas",       value: `${gramSetara.toFixed(4)} gram` },
            { label:"Harga Buyback",     value: formatCurrency(buybackPrice)+"/g" },
            { label:"Estimasi Proses",   value: "1–2 Hari Kerja" },
          ].map(r => (
            <div key={r.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".8rem" }}>{r.label}</span>
              <span style={{ color:"#fff", fontWeight:600, fontSize:".82rem" }}>{r.value}</span>
            </div>
          ))}
        </div>
        <button className="btn-gold" onClick={() => setStep("info")}
          style={{ padding:"12px 28px", borderRadius:13, border:"none", cursor:"pointer", fontSize:".9rem" }}>
          Lihat Status
        </button>
      </motion.div>
    );
  }

  return (
    <div style={{ maxWidth:640, margin:"0 auto", display:"flex", flexDirection:"column", gap:20 }}>

      {/* Header info */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
        style={{ background:"linear-gradient(135deg, rgba(212,175,55,0.08), rgba(96,165,250,0.04))", border:"1px solid rgba(212,175,55,0.2)", borderRadius:20, padding:22 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
          <div style={{ width:44, height:44, borderRadius:13, background:"rgba(212,175,55,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Landmark style={{ width:22, height:22, color:"#D4AF37" }} />
          </div>
          <div>
            <h2 style={{ color:"#fff", fontWeight:900, fontSize:"1.05rem" }}>Gadai / Pinjaman Berbasis Simpanan</h2>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem" }}>Cairkan dana dengan simpanan sebagai jaminan</p>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
          {[
            { label:"Total Simpanan",  value: formatCurrency(simpananTotal), color:"#D4AF37", icon:"🏦" },
            { label:"Setara Emas",     value: `${(simpananTotal/buybackPrice).toFixed(4)}g`, color:"#fb923c", icon:"⚖️" },
            { label:"Harga Buyback",   value: formatCurrency(buybackPrice)+"/g", color:"#4ade80", icon:"📈" },
          ].map(s => (
            <div key={s.label} style={{ background:"rgba(0,0,0,0.25)", borderRadius:14, padding:"14px 12px", textAlign:"center" }}>
              <div style={{ fontSize:"1.2rem", marginBottom:4 }}>{s.icon}</div>
              <p style={{ color:s.color, fontWeight:900, fontSize:".9rem", lineHeight:1 }}>{s.value}</p>
              <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".68rem", marginTop:4 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Cara Kerja */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:.1 }}
        style={{ background:"rgba(96,165,250,0.05)", border:"1px solid rgba(96,165,250,0.15)", borderRadius:18, padding:18 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <Info style={{ width:16, height:16, color:"#60a5fa" }} />
          <p style={{ color:"#60a5fa", fontWeight:700, fontSize:".85rem" }}>Cara Kerja Gadai Simpanan</p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { step:"1", text:"Simpanan kamu (total) dijadikan jaminan ke koperasi" },
            { step:"2", text:`Dana senilai simpanan dikonversi ke emas (${formatCurrency(simpananTotal)} ÷ ${formatCurrency(buybackPrice)}/g = ${(simpananTotal/buybackPrice).toFixed(4)}g) lalu dicairkan` },
            { step:"3", text:"Simpananmu tetap tercatat — tidak berkurang selama aktif melunasi" },
            { step:"4", text:"Jika tidak mampu melunasi, simpanan otomatis menjadi pelunasan pinjaman" },
          ].map(s => (
            <div key={s.step} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
              <div style={{ width:22, height:22, borderRadius:"50%", background:"rgba(96,165,250,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".72rem", fontWeight:800, color:"#60a5fa", flexShrink:0, marginTop:1 }}>{s.step}</div>
              <p style={{ color:"rgba(255,255,255,0.55)", fontSize:".8rem", lineHeight:1.5 }}>{s.text}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Riwayat Gadai */}
      {!loading && rows.length > 0 && (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:.15 }}
          style={{ background:"rgba(14,14,14,0.85)", border:"1px solid rgba(212,175,55,0.12)", borderRadius:20, padding:22 }}>
          <h3 style={{ color:"#fff", fontWeight:700, marginBottom:16 }}>Riwayat Pengajuan</h3>
          {rows.map((r, i) => {
            const st = STATUS_MAP[r.status];
            return (
              <div key={r.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"14px 0", borderBottom: i<rows.length-1?"1px solid rgba(255,255,255,0.04)":"none", flexWrap:"wrap", gap:8 }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{ background:st.bg, color:st.color, borderRadius:8, padding:"3px 10px", fontSize:".72rem", fontWeight:700 }}>{st.label}</span>
                    <span style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem" }}>
                      {new Date(r.created_at).toLocaleDateString("id-ID",{ day:"2-digit", month:"short", year:"numeric" })}
                    </span>
                  </div>
                  <p style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem" }}>
                    Jaminan: <strong style={{ color:"#D4AF37" }}>{formatCurrency(r.nilai_jaminan)}</strong>
                    {" · "}Setara: <strong style={{ color:"#fb923c" }}>{Number(r.gram_setara).toFixed(4)}g</strong>
                  </p>
                  {r.catatan_admin && (
                    <p style={{ color:"rgba(248,113,113,0.8)", fontSize:".75rem", marginTop:3 }}>
                      Catatan admin: {r.catatan_admin}
                    </p>
                  )}
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ color:"#4ade80", fontWeight:900, fontSize:".95rem" }}>{formatCurrency(r.dana_cair)}</p>
                  {(r.status==="aktif") && (
                    <p style={{ color:"#f87171", fontSize:".72rem" }}>Sisa: {formatCurrency(r.sisa_tagihan)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Syarat & Tombol Ajukan */}
      {simpananTotal < 5_000_000 ? (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{ background:"rgba(248,113,113,0.06)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:18, padding:20, display:"flex", gap:12, alignItems:"flex-start" }}>
          <XCircle style={{ width:22, height:22, color:"#f87171", flexShrink:0, marginTop:2 }} />
          <div>
            <p style={{ color:"#f87171", fontWeight:700, marginBottom:4 }}>Belum Memenuhi Syarat</p>
            <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".82rem", lineHeight:1.6 }}>
              Simpanan pokok minimal <strong style={{ color:"#fff" }}>Rp 5.000.000</strong> harus lunas untuk dapat mengajukan gadai.
              Simpanan kamu saat ini: <strong style={{ color:"#D4AF37" }}>{formatCurrency(simpananTotal)}</strong>
            </p>
          </div>
        </motion.div>
      ) : hasActiveGadai ? (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{ background:"rgba(251,146,60,0.06)", border:"1px solid rgba(251,146,60,0.2)", borderRadius:18, padding:20, display:"flex", gap:12, alignItems:"flex-start" }}>
          <AlertCircle style={{ width:22, height:22, color:"#fb923c", flexShrink:0, marginTop:2 }} />
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:".82rem" }}>
            Kamu masih memiliki gadai yang aktif atau dalam proses. Selesaikan terlebih dahulu sebelum mengajukan yang baru.
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          {step === "info" && (
            <motion.div key="info" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              style={{ background:"rgba(14,14,14,0.85)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:20, padding:22 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <ShieldCheck style={{ width:20, height:20, color:"#4ade80" }} />
                <p style={{ color:"#4ade80", fontWeight:700 }}>Kamu memenuhi syarat gadai</p>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ color:"rgba(255,255,255,0.45)", fontSize:".83rem" }}>Nilai jaminan (simpanan)</span>
                <span style={{ color:"#D4AF37", fontWeight:700 }}>{formatCurrency(simpananTotal)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ color:"rgba(255,255,255,0.45)", fontSize:".83rem" }}>Setara emas @ {formatCurrency(buybackPrice)}/g</span>
                <span style={{ color:"#fb923c", fontWeight:700 }}>{(simpananTotal/buybackPrice).toFixed(4)}g</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
                <span style={{ color:"rgba(255,255,255,0.45)", fontSize:".83rem" }}>Dana yang bisa dicairkan</span>
                <span style={{ color:"#4ade80", fontWeight:900, fontSize:"1.05rem" }}>{formatCurrency(simpananTotal)}</span>
              </div>
              <button className="btn-gold" onClick={() => setStep("form")}
                style={{ width:"100%", padding:"13px", borderRadius:13, border:"none", cursor:"pointer", fontSize:".92rem", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                <Landmark style={{ width:16, height:16 }} />
                Ajukan Gadai Simpanan
                <ChevronRight style={{ width:15, height:15 }} />
              </button>
            </motion.div>
          )}

          {step === "form" && (
            <motion.div key="form" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
              style={{ background:"rgba(14,14,14,0.85)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:20, padding:24 }}>
              <h3 style={{ color:"#fff", fontWeight:700, marginBottom:20 }}>Formulir Pengajuan Gadai</h3>

              {/* Jumlah */}
              <div style={{ marginBottom:18 }}>
                <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:6 }}>
                  Jumlah Dana yang Dipinjam
                </label>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                  <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem" }}>Rp</span>
                  <input type="number" value={jumlahPinjam}
                    onChange={e => setJumlahPinjam(Math.min(+e.target.value, simpananTotal))}
                    max={simpananTotal} min={100000} step={100000}
                    className="input-gold" style={{ flex:1, borderRadius:12, padding:"11px 14px", fontSize:".88rem" }} />
                </div>
                <input type="range" min={100000} max={simpananTotal} step={100000} value={jumlahPinjam}
                  onChange={e => setJumlahPinjam(+e.target.value)}
                  style={{ width:"100%", marginBottom:4 }} />
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:".72rem", color:"rgba(255,255,255,0.25)" }}>
                  <span>Rp 100.000</span>
                  <span>Maks: {formatCurrency(simpananTotal)}</span>
                </div>
              </div>

              {/* Setara emas */}
              <div style={{ background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:14, padding:14, marginBottom:18 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <Coins style={{ width:14, height:14, color:"#D4AF37" }} />
                  <span style={{ color:"#D4AF37", fontSize:".8rem", fontWeight:600 }}>Konversi ke Emas</span>
                </div>
                <p style={{ color:"rgba(255,255,255,0.6)", fontSize:".82rem" }}>
                  {formatCurrency(jumlahPinjam)} ÷ {formatCurrency(buybackPrice)}/g ={" "}
                  <strong style={{ color:"#fb923c" }}>{gramSetara.toFixed(4)} gram</strong>
                </p>
              </div>

              {/* Keterangan */}
              <div style={{ marginBottom:18 }}>
                <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:6 }}>Keterangan / Alasan (opsional)</label>
                <input type="text" placeholder="mis. kebutuhan mendesak pendidikan..." value={keterangan}
                  onChange={e => setKeterangan(e.target.value)}
                  className="input-gold" style={{ borderRadius:12, padding:"11px 14px", fontSize:".88rem", width:"100%" }} />
              </div>

              <div style={{ background:"rgba(248,113,113,0.06)", border:"1px solid rgba(248,113,113,0.15)", borderRadius:12, padding:"11px 14px", marginBottom:18, fontSize:".78rem", color:"rgba(255,255,255,0.4)" }}>
                ⚠️ Jika tidak mampu melunasi, simpananmu senilai <strong style={{ color:"#f87171" }}>{formatCurrency(simpananTotal)}</strong> akan otomatis digunakan sebagai pelunasan.
              </div>

              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => setStep("info")} className="btn-outline-gold"
                  style={{ flex:1, padding:"12px", borderRadius:12, cursor:"pointer", fontSize:".87rem" }}>Batal</button>
                <button onClick={() => setStep("confirm")} className="btn-gold"
                  style={{ flex:2, padding:"12px", borderRadius:12, border:"none", cursor:"pointer", fontSize:".87rem" }}>
                  Lanjut Konfirmasi
                </button>
              </div>
            </motion.div>
          )}

          {step === "confirm" && (
            <motion.div key="confirm" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
              style={{ background:"rgba(14,14,14,0.85)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:20, padding:24 }}>
              <h3 style={{ color:"#fff", fontWeight:700, marginBottom:6 }}>Konfirmasi Pengajuan Gadai</h3>
              <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".82rem", marginBottom:20 }}>Baca dan pastikan semua detail sudah benar</p>
              <div style={{ background:"rgba(212,175,55,0.05)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:14, padding:18, marginBottom:16 }}>
                {[
                  { label:"Nilai Jaminan (Simpanan)",  value: formatCurrency(simpananTotal) },
                  { label:"Dana yang Dipinjam",         value: formatCurrency(jumlahPinjam), hi: true },
                  { label:"Setara Emas",                value: `${gramSetara.toFixed(4)} gram` },
                  { label:"Harga Buyback Saat Ini",     value: formatCurrency(buybackPrice)+"/g" },
                ].map(r => (
                  <div key={r.label} style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                    <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".82rem" }}>{r.label}</span>
                    <span style={{ color:(r as any).hi?"#4ade80":"rgba(255,255,255,0.8)", fontWeight:(r as any).hi?900:500, fontSize:".83rem" }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:"rgba(248,113,113,0.07)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:12, padding:"12px 14px", marginBottom:18, fontSize:".78rem", color:"rgba(255,255,255,0.45)", lineHeight:1.6 }}>
                Dengan mengajukan, kamu menyetujui bahwa simpanan senilai{" "}
                <strong style={{ color:"#f87171" }}>{formatCurrency(simpananTotal)}</strong>{" "}
                digunakan sebagai jaminan. Simpanan tetap utuh selama kamu melunasi pinjaman.
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={() => setStep("form")} className="btn-outline-gold"
                  style={{ flex:1, padding:"12px", borderRadius:12, cursor:"pointer", fontSize:".87rem" }}>Kembali</button>
                <button onClick={handleSubmit} disabled={submitting} className="btn-gold"
                  style={{ flex:2, padding:"12px", borderRadius:12, border:"none", cursor:submitting?"not-allowed":"pointer", fontSize:".87rem", opacity:submitting?.65:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  <TrendingDown style={{ width:15, height:15 }} />
                  {submitting ? "Mengirim..." : "Ajukan Gadai"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
