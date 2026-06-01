"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Coins, RefreshCw, ArrowDownCircle, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
const fmtGram = (n: number) => `${n.toFixed(4)} gram`;
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });

interface TxRow { id: string; type: string; amount: number; gram: number | null; status: string; created_at: string; notes: string | null; }

const GRAM_IN = new Set(["buy", "cicilan", "tabungan"]);
const STATUS_COLOR: Record<string,string> = { pending:"#fbbf24", processing:"#60a5fa", completed:"#34d399", rejected:"#f87171" };
const STATUS_LABEL: Record<string,string> = { pending:"Menunggu", processing:"Diproses", completed:"Selesai", rejected:"Ditolak" };

export default function MemberBuybackPage() {
  const { user } = useAuthStore();

  const [emasGram, setEmasGram]       = useState(0);     // emas tersimpan (completed net)
  const [pendingGram, setPendingGram] = useState(0);     // buyback pending yg belum diproses
  const [hargaBuyback, setHargaBuyback] = useState(0);
  const [riwayat, setRiwayat]         = useState<TxRow[]>([]);
  const [loading, setLoading]         = useState(true);

  const [gram, setGram]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [err, setErr]         = useState("");

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [txRes, bbRes] = await Promise.all([
        (supabase.from("transactions") as any)
          .select("id, type, amount, gram, status, created_at, notes")
          .eq("user_id", user.id)
          .order("created_at", { ascending:false }),
        (supabase.from("harga_emas_berat") as any)
          .select("gram, harga").eq("kategori","buyback").order("created_at",{ascending:false}).limit(30),
      ]);

      const txs: TxRow[] = txRes.data || [];
      const net = txs.reduce((acc, t) => {
        if (t.status !== "completed" || !t.gram) return acc;
        if (GRAM_IN.has(t.type)) return acc + Number(t.gram);
        if (t.type === "buyback") return acc - Number(t.gram);
        return acc;
      }, 0);
      setEmasGram(Math.max(0, net));

      const pend = txs.reduce((acc, t) =>
        t.type === "buyback" && (t.status === "pending" || t.status === "processing") && t.gram
          ? acc + Number(t.gram) : acc, 0);
      setPendingGram(pend);

      setRiwayat(txs.filter(t => t.type === "buyback").slice(0, 8));

      let hb = 0;
      if (bbRes.data?.length) {
        const one = bbRes.data.find((r: any) => Number(r.gram) === 1) || bbRes.data[0];
        hb = Number(one.harga) / Number(one.gram);
      } else {
        const { data: gp } = await (supabase.from("gold_prices") as any)
          .select("buyback_member").order("created_at",{ascending:false}).limit(1).single();
        if (gp) hb = Number(gp.buyback_member);
      }
      setHargaBuyback(hb);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [user?.id]);

  const available = Math.max(0, emasGram - pendingGram);
  const gramNum   = Number(gram) || 0;
  const danaCair  = Math.round(gramNum * hargaBuyback);

  async function submit() {
    if (!user?.id) return;
    if (gramNum <= 0)            { setErr("Masukkan jumlah gram yang valid."); return; }
    if (gramNum > available)     { setErr(`Maksimal ${fmtGram(available)} yang bisa dijual.`); return; }
    if (hargaBuyback <= 0)       { setErr("Harga buyback belum tersedia. Hubungi admin."); return; }
    setErr(""); setSubmitting(true);
    try {
      const { error } = await (supabase.from("transactions") as any).insert({
        user_id:        user.id,
        type:           "buyback",
        gram:           gramNum,
        amount:         danaCair,
        price_per_gram: Math.round(hargaBuyback),
        status:         "pending",
        notes:          `Pengajuan buyback ${gramNum} gram @ ${fmt(hargaBuyback)}/gram`,
      });
      if (error) { setErr("Gagal mengajukan buyback: " + error.message); }
      else {
        setSubmitted(true); setGram("");
        // Notifikasi ke admin & master (best-effort)
        try {
          const { data: staff } = await (supabase.from("profiles") as any).select("id").in("role",["admin","master"]);
          if (staff?.length) {
            await (supabase.from("notifications") as any).insert(
              staff.map((s: any) => ({
                user_id: s.id,
                title: "Pengajuan Buyback Baru",
                body: `${user.name} mengajukan buyback ${gramNum} gram (${fmt(danaCair)}).`,
                type: "transaction",
                is_read: false,
                link: "/dashboard/admin/transaksi",
              }))
            );
          }
        } catch {}
        load();
      }
    } catch { setErr("Terjadi kesalahan."); }
    setSubmitting(false);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:760 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Buyback Emas</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>
            Jual kembali emas tersimpan Anda sesuai harga buyback berlaku
          </p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      {submitted && (
        <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
          style={{ background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.25)", borderRadius:12, padding:"14px 18px", color:"#34d399", fontSize:".88rem", display:"flex", alignItems:"center", gap:10 }}>
          <CheckCircle style={{ width:16, height:16, flexShrink:0 }} />
          Pengajuan buyback berhasil dikirim! Admin akan memproses dan dana ditransfer setelah disetujui.
        </motion.div>
      )}

      {loading ? <p style={{ color:"rgba(255,255,255,0.3)" }}>Memuat data...</p> : (
        <>
          {/* Ringkasan */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14 }}>
            <div style={{ background:"linear-gradient(135deg,rgba(212,175,55,0.12),rgba(212,175,55,0.04))", border:"1px solid rgba(212,175,55,0.3)", borderRadius:16, padding:"18px 20px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <Coins style={{ width:15, height:15, color:"#D4AF37" }} />
                <p style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem", margin:0 }}>Emas Tersimpan</p>
              </div>
              <p style={{ color:"#D4AF37", fontWeight:900, fontSize:"1.5rem", margin:0 }}>{fmtGram(emasGram)}</p>
              {pendingGram > 0 && (
                <p style={{ color:"#fbbf24", fontSize:".75rem", marginTop:6 }}>
                  {fmtGram(pendingGram)} sedang diajukan
                </p>
              )}
            </div>
            <div style={{ background:"rgba(52,211,153,0.06)", border:"1px solid rgba(52,211,153,0.22)", borderRadius:16, padding:"18px 20px" }}>
              <p style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem", marginBottom:8 }}>Harga Buyback / gram</p>
              <p style={{ color:"#34d399", fontWeight:900, fontSize:"1.5rem", margin:0 }}>{fmt(hargaBuyback)}</p>
            </div>
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"18px 20px" }}>
              <p style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem", marginBottom:8 }}>Bisa Dijual</p>
              <p style={{ color:"#fff", fontWeight:900, fontSize:"1.5rem", margin:0 }}>{fmtGram(available)}</p>
            </div>
          </div>

          {/* Form jual */}
          {available > 0 ? (
            <div style={{ background:"rgba(52,211,153,0.04)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:16, padding:22 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                <ArrowDownCircle style={{ width:20, height:20, color:"#34d399" }} />
                <div>
                  <p style={{ color:"#34d399", fontWeight:700, fontSize:"1rem", margin:0 }}>Ajukan Buyback</p>
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem", margin:0 }}>Masukkan jumlah gram emas yang ingin dijual</p>
                </div>
              </div>

              {err && (
                <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.25)", borderRadius:10, padding:"10px 14px", color:"#f87171", fontSize:".82rem", marginBottom:14 }}>
                  {err}
                </div>
              )}

              <div style={{ marginBottom:14 }}>
                <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:7 }}>
                  Jumlah Gram (maks. {fmtGram(available)})
                </label>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                  <input type="number" min={0} step={0.0001} max={available} value={gram}
                    onChange={e => setGram(e.target.value)} placeholder="0.0000"
                    style={{ flex:1, minWidth:160, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, padding:"11px 14px", color:"#fff", fontSize:"1rem", outline:"none", boxSizing:"border-box" }} />
                  <button onClick={() => setGram(String(available))}
                    style={{ background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"0 18px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem", fontWeight:600 }}>
                    Maks
                  </button>
                </div>
              </div>

              {gramNum > 0 && (
                <div style={{ background:"rgba(52,211,153,0.07)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:12, padding:"14px 16px", marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ color:"rgba(255,255,255,0.5)", fontSize:".82rem" }}>Jumlah</span>
                    <span style={{ color:"#fff", fontWeight:700 }}>{fmtGram(gramNum)}</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ color:"rgba(255,255,255,0.5)", fontSize:".82rem" }}>Harga / gram</span>
                    <span style={{ color:"#fff", fontWeight:700 }}>{fmt(hargaBuyback)}</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", paddingTop:8, borderTop:"1px solid rgba(255,255,255,0.07)" }}>
                    <span style={{ color:"rgba(255,255,255,0.7)", fontSize:".88rem", fontWeight:600 }}>Dana Diterima</span>
                    <span style={{ color:"#34d399", fontSize:"1.15rem", fontWeight:900 }}>{fmt(danaCair)}</span>
                  </div>
                </div>
              )}

              <button onClick={submit} disabled={submitting || gramNum <= 0}
                style={{ width:"100%", padding:"13px", borderRadius:11, background:"linear-gradient(135deg,#34d399,#6ee7b7)", border:"none", color:"#0a0a0a", fontWeight:700, fontSize:"1rem", cursor: submitting || gramNum<=0 ? "not-allowed" : "pointer", opacity: submitting || gramNum<=0 ? 0.6 : 1 }}>
                {submitting ? "Mengajukan..." : "Ajukan Buyback"}
              </button>
              <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".75rem", textAlign:"center", margin:"10px 0 0" }}>
                Pengajuan diproses admin. Dana ditransfer setelah disetujui (1×24 jam kerja).
              </p>
            </div>
          ) : (
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:"32px 24px", display:"flex", alignItems:"center", gap:12, justifyContent:"center" }}>
              <AlertCircle style={{ width:20, height:20, color:"rgba(255,255,255,0.3)" }} />
              <p style={{ color:"rgba(255,255,255,0.4)", margin:0, fontSize:".9rem" }}>
                Belum ada emas tersimpan yang bisa dijual.
              </p>
            </div>
          )}

          {/* Riwayat buyback */}
          {riwayat.length > 0 && (
            <div>
              <p style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 12px" }}>Riwayat Buyback</p>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {riwayat.map(tx => (
                  <div key={tx.id} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"13px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                    <div>
                      <p style={{ color:"#fff", fontWeight:600, fontSize:".88rem", margin:0 }}>
                        {tx.gram ? fmtGram(Number(tx.gram)) : "-"}
                      </p>
                      <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".75rem", margin:"2px 0 0" }}>{fmtDate(tx.created_at)}</p>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <p style={{ color:"#34d399", fontWeight:700, fontSize:".9rem", margin:0 }}>{fmt(tx.amount)}</p>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:4, color:STATUS_COLOR[tx.status]||"#fff", fontSize:".72rem" }}>
                        {tx.status==="pending"   && <Clock style={{ width:10, height:10 }} />}
                        {tx.status==="completed" && <CheckCircle style={{ width:10, height:10 }} />}
                        {tx.status==="rejected"  && <XCircle style={{ width:10, height:10 }} />}
                        {STATUS_LABEL[tx.status]||tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
