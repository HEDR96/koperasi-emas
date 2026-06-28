"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Landmark, Coins, RefreshCw, ArrowRight, X, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getGadaiParams, nilaiGadaiMax, angsuranGadai,
  type GadaiParams, GADAI_PARAM_DEFAULTS,
} from "@/lib/harga";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
const fmtDate = (s: string | null) => s
  ? new Date(s).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" })
  : "-";
const fmtGram = (n: number) => `${n.toFixed(1)} gram`;
const fmtRibuan = (v: string | number) => {
  const digits = String(v ?? "").replace(/\D/g, "");
  return digits ? new Intl.NumberFormat("id-ID").format(Number(digits)) : "";
};

interface SimpananRow { id: string; type: string; amount: number; status: string; transaction_date: string | null; created_at: string; description: string | null; }

export default function SimpananPage() {
  const { user } = useAuthStore();

  const [totalSimpanan, setTotalSimpanan] = useState(0);
  const [rows, setRows]   = useState<SimpananRow[]>([]);
  const [buybackHarga, setBuybackHarga] = useState(0);
  const [gramSetara, setGramSetara]     = useState(0);
  const [activeGadai, setActiveGadai]   = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Gadai form
  const [gadaiParams, setGadaiParams] = useState<GadaiParams>(GADAI_PARAM_DEFAULTS);

  const [showGadai, setShowGadai]     = useState(false);
  const [tenor, setTenor]             = useState(1);
  const [pinjamanInput, setPinjamanInput] = useState(""); // Rp yang ingin dipinjam
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [gadaiErr, setGadaiErr]       = useState("");

  async function load() {
    if (!user) return;
    setLoading(true);
    try {
      // Simpanan data
      const { data: simpananData } = await (supabase.from("simpanan") as any)
        .select("id, type, amount, status, transaction_date, created_at, description")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("transaction_date", { ascending: false });

      const rowData: SimpananRow[] = simpananData || [];
      setRows(rowData);
      const total = rowData.reduce((s: number, r: SimpananRow) => s + (r.amount || 0), 0);
      setTotalSimpanan(total);

      // Buyback price (1g baseline)
      const { data: bb } = await (supabase.from("harga_emas_berat") as any)
        .select("gram, harga")
        .eq("kategori","buyback")
        .order("created_at", { ascending:false })
        .limit(10);

      let harga = 0;
      if (bb?.length) {
        const oneGram = bb.find((r: any) => Number(r.gram) === 1);
        harga = Number((oneGram || bb[0]).harga) / Number((oneGram || bb[0]).gram);
      } else {
        const { data: gp } = await (supabase.from("gold_prices") as any)
          .select("buyback_member").order("created_at", { ascending:false }).limit(1).single();
        if (gp) harga = Number(gp.buyback_member);
      }
      setBuybackHarga(harga);
      if (harga > 0) setGramSetara(total / harga);

      // Gadai params
      const gp = await getGadaiParams();
      setGadaiParams(gp);

      // Active gadai
      const { data: gadai } = await (supabase.from("gadai") as any)
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["pengajuan","disetujui","aktif"])
        .order("created_at", { ascending:false })
        .limit(1);
      setActiveGadai(gadai?.[0] || null);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [user]);

  // Nilai gadai maks = total simpanan × 80% − admin gadai
  const maxPinjaman  = nilaiGadaiMax(totalSimpanan, gadaiParams.adminAnggota);
  const pinjamanRp   = Math.min(Number(pinjamanInput) || 0, maxPinjaman);
  const angsuran     = angsuranGadai(pinjamanRp, gadaiParams.persenAnggota, tenor);

  async function submitGadai() {
    if (!user) return;
    if (pinjamanRp <= 0) { setGadaiErr("Masukkan jumlah pinjaman."); return; }
    if (pinjamanRp > maxPinjaman) { setGadaiErr(`Maksimal ${fmt(maxPinjaman)}`); return; }
    setGadaiErr(""); setSubmitting(true);
    try {
      const gramSetaraGadai = buybackHarga > 0 ? pinjamanRp / buybackHarga : 0;
      const { error } = await (supabase.from("gadai") as any).insert({
        user_id:             user.id,
        nilai_jaminan:       pinjamanRp,
        harga_buyback:       Math.round(buybackHarga),
        gram_setara:         gramSetaraGadai,
        dana_cair:           pinjamanRp,
        sisa_tagihan:        pinjamanRp,
        tenor:               tenor,
        angsuran_per_bulan:  angsuran,
        status:              "pengajuan",
        keterangan:          `Pengajuan gadai simpanan ${fmt(pinjamanRp)}, tenor ${tenor} bulan`,
        recorded_by:         user.id,
        transaction_date:    new Date().toISOString(),
      });
      if (error) { setGadaiErr("Gagal mengajukan gadai: " + error.message); }
      else { setSubmitted(true); setShowGadai(false); load(); }
    } catch { setGadaiErr("Terjadi kesalahan."); }
    setSubmitting(false);
  }

  const totalRows = rows;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:800 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Simpanan Koperasi</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Rincian Simpanan dan konversi ke emas</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      {submitted && (
        <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
          style={{ background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.25)", borderRadius:12, padding:"14px 18px", color:"#34d399", fontSize:".88rem" }}>
          Pengajuan gadai berhasil dikirim! Admin akan memproses dalam 1x24 jam.
        </motion.div>
      )}

      {loading ? <p style={{ color:"rgba(255,255,255,0.3)" }}>Memuat data simpanan...</p> : (
        <>
          {/* Total card */}
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            style={{ background:"linear-gradient(135deg,rgba(212,175,55,0.12),rgba(212,175,55,0.04))", border:"1px solid rgba(212,175,55,0.3)", borderRadius:20, padding:24 }}>
            <p style={{ color:"rgba(255,255,255,0.5)", fontSize:".82rem", marginBottom:6 }}>Total Simpanan</p>
            <p style={{ color:"#D4AF37", fontSize:"2.2rem", fontWeight:900, margin:0, lineHeight:1 }}>{fmt(totalSimpanan)}</p>
            {buybackHarga > 0 && (
              <div style={{ marginTop:14, display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                <Coins style={{ width:15, height:15, color:"#D4AF37" }} />
                <span style={{ color:"rgba(255,255,255,0.6)", fontSize:".85rem" }}>
                  Setara <strong style={{ color:"#D4AF37" }}>{fmtGram(gramSetara)}</strong> · harga gadai {fmt(buybackHarga)}/gram
                </span>
              </div>
            )}
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".75rem", marginTop:8 }}>
              Nilai Simpanan dapat digunakan sebagai jaminan gadai pinjaman
            </p>
          </motion.div>

          {/* Detail simpanan */}
          {rows.length === 0 ? (
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".88rem", textAlign:"center", padding:"24px 0" }}>Belum ada setoran simpanan.</p>
          ) : (
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 130px 1fr", padding:"8px 18px", borderBottom:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.03)" }}>
                <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", margin:0 }}>Nominal</p>
                <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", margin:0 }}>Tgl Transaksi</p>
                <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", margin:0 }}>Keterangan</p>
              </div>
              {rows.map((r, i) => (
                <div key={r.id} style={{ display:"grid", gridTemplateColumns:"1fr 130px 1fr", padding:"10px 18px", borderBottom: i < rows.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none", alignItems:"center" }}>
                  <p style={{ color:"#fff", fontWeight:700, fontSize:".88rem", margin:0 }}>{fmt(r.amount)}</p>
                  <p style={{ color:"rgba(255,255,255,0.55)", fontSize:".82rem", margin:0 }}>{fmtDate(r.transaction_date || r.created_at)}</p>
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".82rem", margin:0 }}>{r.description || "-"}</p>
                </div>
              ))}
            </div>
          )}

          {/* Gadai Section */}
          <div style={{ background:"rgba(96,165,250,0.05)", border:"1px solid rgba(96,165,250,0.2)", borderRadius:16, padding:22 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <Landmark style={{ width:20, height:20, color:"#60a5fa" }} />
              <div>
                <p style={{ color:"#60a5fa", fontWeight:700, fontSize:"1rem", margin:0 }}>Gadai Simpanan</p>
                <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem", margin:0 }}>Ajukan pinjaman dengan simpanan sebagai jaminan</p>
              </div>
            </div>

            {activeGadai ? (
              <div style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:10 }}>
                <AlertCircle style={{ width:18, height:18, color:"#f87171", flexShrink:0 }} />
                <div>
                  <p style={{ color:"#f87171", fontWeight:600, fontSize:".88rem", margin:0 }}>Ada Gadai Aktif</p>
                  <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", margin:0 }}>
                    Pinjaman {fmt(activeGadai.dana_cair)} · Status: <strong style={{ color:"#D4AF37", textTransform:"capitalize" }}>{activeGadai.status}</strong>
                    {" "}· Sisa tagihan: {fmt(activeGadai.sisa_tagihan)}
                  </p>
                  <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem", margin:"4px 0 0" }}>Lunasi gadai ini terlebih dahulu untuk mengajukan gadai baru.</p>
                </div>
              </div>
            ) : totalSimpanan > 0 ? (
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:14, fontSize:".82rem" }}>
                  {[
                    { label:"Maks. Pinjaman", value:fmt(maxPinjaman), color:"#60a5fa" },
                    { label:"Jaminan (setara gram)", value:fmtGram(gramSetara), color:"#D4AF37" },
                    { label:"Tenor Tersedia", value:"1 - 4 bulan", color:"#34d399" },
                  ].map(i => (
                    <div key={i.label} style={{ background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"12px 14px" }}>
                      <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".72rem", margin:"0 0 4px" }}>{i.label}</p>
                      <p style={{ color:i.color, fontWeight:700, margin:0 }}>{i.value}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setShowGadai(true); setSubmitted(false); setGadaiErr(""); setPinjamanInput(""); setTenor(1); }}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 22px", borderRadius:10, background:"rgba(96,165,250,0.15)", border:"1px solid rgba(96,165,250,0.35)", color:"#60a5fa", fontWeight:700, fontSize:".9rem", cursor:"pointer" }}>
                  <ArrowRight style={{ width:16, height:16 }} /> Ajukan Gadai
                </button>
              </div>
            ) : (
              <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".85rem" }}>Belum ada simpanan yang dapat dijadikan jaminan gadai.</p>
            )}
          </div>
        </>
      )}

      {/* Gadai Modal */}
      <AnimatePresence>
        {showGadai && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setShowGadai(false)}
              style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:1000 }} />
            <motion.div
              initial={{ opacity:0, scale:.92, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:.92 }}
              style={{ position:"fixed", top:"50%", left:"50%", transform:"translate(-50%,-50%)", zIndex:1001, width:"min(440px,94vw)", background:"rgba(12,12,12,0.98)", border:"1px solid rgba(96,165,250,0.3)", borderRadius:20, padding:26 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                <h3 style={{ color:"#fff", fontWeight:700, fontSize:"1.05rem", margin:0 }}>Ajukan Gadai Simpanan</h3>
                <button onClick={() => setShowGadai(false)}
                  style={{ background:"rgba(255,255,255,0.07)", border:"none", borderRadius:8, width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.5)", cursor:"pointer" }}>
                  <X style={{ width:15, height:15 }} />
                </button>
              </div>

              {gadaiErr && (
                <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:10, padding:"10px 14px", color:"#f87171", fontSize:".82rem", marginBottom:14 }}>
                  {gadaiErr}
                </div>
              )}

              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                {/* Info maks pinjaman */}
                <div style={{ background:"rgba(96,165,250,0.06)", border:"1px solid rgba(96,165,250,0.18)", borderRadius:10, padding:"10px 14px" }}>
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem", margin:"0 0 2px" }}>Maksimal Pinjaman</p>
                  <p style={{ color:"#60a5fa", fontWeight:900, fontSize:"1.1rem", margin:0 }}>{fmt(maxPinjaman)}</p>
                  <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".7rem", margin:"2px 0 0" }}>
                    = Simpanan {fmt(totalSimpanan)} × 80%{gadaiParams.adminAnggota > 0 ? ` − admin ${fmt(gadaiParams.adminAnggota)}` : ""}
                  </p>
                </div>

                {/* Input pinjaman (Rupiah) */}
                <div>
                  <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                    <span>Jumlah Pinjaman (Rp)</span>
                    <button type="button" onClick={() => setPinjamanInput(String(maxPinjaman))} style={{ background:"none", border:"none", color:"#D4AF37", cursor:"pointer", fontSize:".76rem" }}>Maks</button>
                  </label>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.35)", fontSize:".85rem", pointerEvents:"none" }}>Rp</span>
                    <input inputMode="numeric" value={fmtRibuan(pinjamanInput)}
                      onChange={e => setPinjamanInput(e.target.value.replace(/\D/g,""))}
                      style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, padding:"11px 14px 11px 40px", color:"#fff", fontSize:"1rem", outline:"none", boxSizing:"border-box" }}
                      placeholder="0" />
                  </div>
                </div>

                {/* Tenor */}
                <div>
                  <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:7 }}>Tenor (bulan)</label>
                  <div style={{ display:"flex", gap:8 }}>
                    {[1,2,3,4].map(t => (
                      <button key={t} onClick={() => setTenor(t)}
                        style={{ flex:1, padding:"10px", borderRadius:10, fontWeight:700, fontSize:".9rem", cursor:"pointer",
                          border: tenor===t ? "1px solid #60a5fa" : "1px solid rgba(255,255,255,0.1)",
                          background: tenor===t ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.04)",
                          color: tenor===t ? "#60a5fa" : "rgba(255,255,255,0.5)" }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {pinjamanRp > 0 && (
                  <div style={{ background:"rgba(96,165,250,0.07)", border:"1px solid rgba(96,165,250,0.2)", borderRadius:12, padding:"14px 16px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ color:"rgba(255,255,255,0.5)", fontSize:".82rem" }}>Pinjaman (dana cair)</span>
                      <span style={{ color:"#fff", fontWeight:700 }}>{fmt(pinjamanRp)}</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ color:"rgba(255,255,255,0.5)", fontSize:".82rem" }}>Tenor</span>
                      <span style={{ color:"#fff", fontWeight:700 }}>{tenor} bulan</span>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", paddingTop:8, borderTop:"1px solid rgba(255,255,255,0.07)" }}>
                      <span style={{ color:"rgba(255,255,255,0.7)", fontSize:".88rem", fontWeight:600 }}>Angsuran/bulan</span>
                      <span style={{ color:"#60a5fa", fontSize:"1.1rem", fontWeight:900 }}>{fmt(angsuran)}</span>
                    </div>
                    <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".72rem", marginTop:6, marginBottom:0 }}>
                      {fmt(pinjamanRp)} × (1 + {gadaiParams.persenAnggota}%) / {tenor} = {fmt(angsuran)}/bln
                    </p>
                  </div>
                )}

                <button onClick={submitGadai} disabled={submitting || pinjamanRp <= 0}
                  style={{ padding:"13px", borderRadius:11, background:"linear-gradient(135deg,#60a5fa,#93c5fd)", border:"none", color:"#0a0a0a", fontWeight:700, fontSize:"1rem", cursor:submitting?"not-allowed":"pointer", opacity:submitting?0.7:1 }}>
                  {submitting ? "Mengajukan..." : "Ajukan Gadai"}
                </button>
                <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".75rem", textAlign:"center", margin:0 }}>
                  Pengajuan akan diproses admin dalam 1×24 jam kerja
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

