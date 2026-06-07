"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, RefreshCw, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import Select from "@/components/ui/Select";
import MemberPicker from "@/components/ui/MemberPicker";
import { getStaffMap, fmtTgl, fmtTglJam } from "@/lib/staff";
import {
  getMarkup, withMarkup, getCicilanParams, cicilanHargaTenor, cicilanDpTenor,
  type CicilanParams, CICILAN_PARAM_DEFAULTS,
} from "@/lib/harga";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);

// Tampilkan angka dengan pemisah ribuan (1000000 -> "1.000.000"); kosong jika tak ada angka.
const fmtRibuan = (v: string) => {
  const digits = v.replace(/\D/g, "");
  return digits ? new Intl.NumberFormat("id-ID").format(Number(digits)) : "";
};
// Ambil hanya digit dari input bermask.
const onlyDigits = (v: string) => v.replace(/\D/g, "");

const inp: React.CSSProperties = {
  width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:".9rem", outline:"none", boxSizing:"border-box",
};

const TYPE_OPTS = [
  { value:"buy",     label:"Beli Emas" },
  { value:"buyback", label:"Buyback Emas" },
  { value:"cicilan", label:"Cicilan Emas" },
];

const STATUS_OPTS = [
  { value:"pending",    label:"Menunggu / ke Approval (Pending)" },
  { value:"completed",  label:"Selesai (Completed)" },
  { value:"processing", label:"Diproses (Processing)" },
  { value:"rejected",   label:"Ditolak (Rejected)" },
];

const EMPTY = {
  user_id:"", type:"buy", gram:"", amount:"", price_per_gram:"",
  // Default "pending" supaya transaksi yang diinput masuk ke Pusat Approval.
  // Admin bisa memilih "Selesai" untuk mencatat transaksi historis tanpa approval.
  payment_method:"", notes:"", status:"pending", tenor:"6", dp:"",
  created_at: new Date().toISOString().slice(0,16),
};

export default function InputTransaksiPage() {
  const { user } = useAuthStore();
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");
  const [recent, setRecent]     = useState<any[]>([]);
  const [staff, setStaff]       = useState<Record<string,string>>({});

  // Data harga untuk dropdown gram + auto-isi nominal.
  const [goldRows, setGoldRows]           = useState<{ gram:number; harga:number }[]>([]);
  const [buybackPerGram, setBuybackPerGram] = useState(0);
  const [cicilanParams, setCicilanParams] = useState<CicilanParams>(CICILAN_PARAM_DEFAULTS);

  async function loadRecent() {
    const [{ data }, staffMap] = await Promise.all([
      (supabase.from("transactions") as any)
        .select("id, type, amount, gram, status, created_at, transaction_date, recorded_by, profiles:profiles!user_id(name)")
        .order("created_at", { ascending: false })
        .limit(10),
      getStaffMap(),
    ]);
    setRecent(data || []);
    setStaff(staffMap);
  }

  async function loadGold() {
    const [{ data: e }, { data: b }, markup, params] = await Promise.all([
      (supabase.from("harga_emas_berat") as any).select("gram,harga,created_at").eq("kategori","emas").order("created_at",{ascending:false}).limit(200),
      (supabase.from("harga_emas_berat") as any).select("gram,harga,created_at").eq("kategori","buyback").order("created_at",{ascending:false}).limit(20),
      getMarkup(),
      getCicilanParams(),
    ]);
    // Harga emas jual = harga dasar + markup anggota (per berat). Ambil terbaru per gram.
    const seen = new Set<number>();
    const rows = (e||[])
      .filter((r:any)=>{ const g=Number(r.gram); if(seen.has(g)) return false; seen.add(g); return true; })
      .map((r:any)=>({ gram:Number(r.gram), harga: withMarkup(r.harga, Number(r.gram), markup.anggota) }))
      .sort((a:any,bb:any)=>a.gram-bb.gram);
    setGoldRows(rows);
    // Buyback per gram dari baris 1 gram (acuan).
    if (b?.length) {
      const one = b.find((r:any)=>Number(r.gram)===1) || b[0];
      setBuybackPerGram(Number(one.harga) / Number(one.gram));
    }
    setCicilanParams(params);
  }

  useEffect(() => { loadRecent(); loadGold(); }, []);

  const cicilanTenor   = Number(form.tenor) || 1;
  const cicilanAngsuran = form.amount ? Math.ceil(Number(form.amount) / cicilanTenor) : 0;

  // Opsi gram dari daftar harga emas.
  const gramOpts = goldRows.map(r => ({ value:String(r.gram), label:`${r.gram} gram` }));

  // Hitung nominal & harga/gram otomatis sesuai berat + tipe transaksi.
  //  â€¢ Beli Emas  â†’ nominal = harga emas jual berat tsb.
  //  â€¢ Buyback    â†’ nominal = harga buyback Ã— berat.
  //  â€¢ Cicilan    â†’ nominal = harga cicilan (a+bâˆ’c) untuk tenor terpilih; angsuran dihitung dari nominalÃ·tenor.
  function autoFields(gram: string, type: string, tenor: string): Partial<typeof EMPTY> {
    const g = Number(gram) || 0;
    const row = goldRows.find(r => r.gram === g);
    if (!g || !row) return {};
    if (type === "buyback") {
      const ppg = Math.round(buybackPerGram);
      return { amount: String(Math.round(buybackPerGram * g)), price_per_gram: String(ppg) };
    }
    if (type === "cicilan") {
      const t = Number(tenor) || 1;
      const total = cicilanHargaTenor(row.harga, t, cicilanParams.adminAnggota, cicilanParams.persenBulanAnggota, cicilanParams.persenDpAnggota);
      // DP otomatis = c = (a+b) Ã— %DP anggota (DP yang disetujui).
      const dp = cicilanDpTenor(row.harga, t, cicilanParams.adminAnggota, cicilanParams.persenBulanAnggota, cicilanParams.persenDpAnggota);
      return { amount: String(total), price_per_gram: String(Math.round(row.harga / g)), dp: String(dp) };
    }
    // buy (default) â€” harga emas jual
    return { amount: String(Math.round(row.harga)), price_per_gram: String(Math.round(row.harga / g)) };
  }

  async function handleSave() {
    if (!form.user_id || !form.amount) { setError("Pilih anggota dan pilih berat emas."); return; }
    setSaving(true); setError("");
    try {
      if (form.type === "cicilan") {
        // Buat cicilan (installment) yang bisa dilacak di Kelola Cicilan.
        // Status "completed" pada form â†’ cicilan langsung "active"; selain itu "pending"
        // supaya muncul di Pusat Approval untuk disetujui dulu.
        const total = Number(form.amount);
        const langsungAktif = form.status === "completed";
        const due = new Date(form.created_at); due.setMonth(due.getMonth() + 1);
        const { error: err } = await (supabase.from("installments") as any).insert({
          user_id:        form.user_id,
          product_name:   form.notes || "Cicilan Emas",
          total_gram:     form.gram ? Number(form.gram) : 0,
          total_amount:   total,
          monthly_amount: cicilanAngsuran,
          tenor:          cicilanTenor,
          down_payment:   form.dp ? Number(form.dp) : 0,
          paid_installments: 0,
          status:         langsungAktif ? "active" : "pending",
          ...(langsungAktif ? { next_due_date: due.toISOString().slice(0,10) } : {}),
        });
        if (err) { setError(err.message); setSaving(false); return; }
        // Notifikasi: kalau pending â†’ beri tahu admin/master untuk approve; kalau aktif â†’ beri tahu anggota.
        try {
          if (langsungAktif) {
            await (supabase.from("notifications") as any).insert({ user_id:form.user_id, title:"Cicilan Baru", body:`Cicilan ${form.notes||"Emas"} ${fmt(total)} (${cicilanTenor}x) dibuat.`, type:"cicilan", is_read:false, link:"/dashboard/member/cicilan" });
          } else {
            const { data: staff } = await (supabase.from("profiles") as any).select("id").in("role",["admin","master"]);
            if (staff?.length) await (supabase.from("notifications") as any).insert(
              staff.map((s:any)=>({ user_id:s.id, title:"Pengajuan Cicilan Baru", body:`Cicilan ${form.notes||"Emas"} ${fmt(total)} (${cicilanTenor}x) menunggu persetujuan.`, type:"cicilan", is_read:false, link:"/dashboard/admin/cicilan" }))
            );
          }
        } catch {}
        setSaved(true); setTimeout(() => setSaved(false), 2500); setForm(EMPTY); loadRecent();
        setSaving(false); return;
      }

      const payload: any = {
        user_id:        form.user_id,
        type:           form.type,
        amount:         Number(form.amount),
        status:         form.status,
        payment_method: form.payment_method || null,
        notes:          form.notes || null,
        // transaction_date = kapan transaksi terjadi (dipilih); created_at biar default NOW (kapan diinput)
        transaction_date: new Date(form.created_at).toISOString(),
        recorded_by:    user?.id || null,
      };
      if (form.gram)           payload.gram           = Number(form.gram);
      if (form.price_per_gram) payload.price_per_gram = Number(form.price_per_gram);

      const { error: err } = await (supabase.from("transactions") as any).insert(payload);
      if (err) { setError(err.message); }
      else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        setForm(EMPTY);
        loadRecent();
      }
    } catch { setError("Terjadi kesalahan."); }
    setSaving(false);
  }

  const TYPE_COLOR: Record<string,string> = {
    buy:"#D4AF37", buyback:"#34d399", cicilan:"#a78bfa",
    transfer:"#60a5fa", referral_bonus:"#f97316",
  };
  const TYPE_LABEL: Record<string,string> = {
    buy:"Beli Emas", buyback:"Buyback", cicilan:"Cicilan",
    transfer:"Transfer", referral_bonus:"Bonus Referral",
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:900 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Input Transaksi Manual</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>
            Status <b style={{color:"#D4AF37"}}>Menunggu</b> akan masuk ke Pusat Approval; pilih <b style={{color:"#34d399"}}>Selesai</b> untuk mencatat transaksi historis langsung.
          </p>
        </div>
        <button onClick={() => { loadRecent(); }}
          style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

        {/* Form */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          style={{ background:"rgba(212,175,55,0.04)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:16, padding:22, display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <PlusCircle style={{ width:16, height:16, color:"#D4AF37" }} />
            <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".9rem", margin:0 }}>Form Transaksi</p>
          </div>

          {error && <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:10, padding:"10px 14px", color:"#f87171", fontSize:".82rem" }}>{error}</div>}
          {saved && <div style={{ background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:10, padding:"10px 14px", color:"#34d399", fontSize:".82rem" }}>Transaksi berhasil disimpan!</div>}

          {/* Pilih anggota */}
          <div>
            <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Anggota *</label>
            <MemberPicker value={form.user_id} onChange={m=>setForm(p=>({...p,user_id:m?.id||""}))} />
          </div>

          {/* Tipe & Status */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Tipe Transaksi *</label>
              <Select value={form.type} onChange={v=>setForm(p=>({...p,type:v,gram:"",amount:"",price_per_gram:"",dp:""}))} options={TYPE_OPTS} />
            </div>
            <div>
              <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Status</label>
              <Select value={form.status} onChange={v=>setForm(p=>({...p,status:v}))} options={STATUS_OPTS} />
            </div>
          </div>

          {/* â”€â”€â”€ BELI EMAS: form sederhana â€” pilih gram â†’ harga otomatis â”€â”€â”€ */}
          {form.type === "buy" && (
            <>
              <div>
                <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Pilih Berat Emas *</label>
                {gramOpts.length > 0 ? (
                  <Select value={form.gram} onChange={v=>setForm(p=>({...p,gram:v,...autoFields(v,"buy",p.tenor)}))} options={gramOpts} placeholder="Pilih berat emas" />
                ) : (
                  <p style={{ color:"#f87171", fontSize:".8rem" }}>Harga emas belum tersedia. Tambahkan harga di menu Harga.</p>
                )}
              </div>

              {/* Preview harga otomatis */}
              {form.gram && form.amount && (
                <div style={{ background:"rgba(212,175,55,0.07)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:12, padding:"14px 16px", display:"flex", flexDirection:"column", gap:10 }}>
                  <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".82rem", margin:0 }}>Detail Harga Beli Emas</p>
                  {[
                    { label:"Berat",       val:`${form.gram} gram` },
                    { label:"Harga/gram",  val:`Rp ${fmtRibuan(form.price_per_gram)}` },
                    { label:"Total Bayar", val:`Rp ${fmtRibuan(form.amount)}`, gold:true },
                  ].map(r=>(
                    <div key={r.label} style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ color:"rgba(255,255,255,0.5)", fontSize:".83rem" }}>{r.label}</span>
                      <span style={{ color: r.gold ? "#D4AF37" : "#fff", fontWeight: r.gold ? 900 : 600, fontSize:".88rem" }}>{r.val}</span>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Metode Bayar</label>
                <input value={form.payment_method} onChange={e=>setForm(p=>({...p,payment_method:e.target.value}))} style={inp} placeholder="Transfer, Tunai, dll" />
              </div>
              <div>
                <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Tanggal Transaksi</label>
                <input type="datetime-local" value={form.created_at} onChange={e=>setForm(p=>({...p,created_at:e.target.value}))} style={inp} />
              </div>
              <div>
                <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Catatan</label>
                <textarea rows={2} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
                  style={{ ...inp, resize:"vertical", fontFamily:"inherit" }} placeholder="Keterangan tambahan..." />
              </div>
            </>
          )}

          {/* â”€â”€â”€ TIPE LAIN (buyback / cicilan): form lengkap â”€â”€â”€ */}
          {form.type !== "buy" && (
            <>
              {/* Berat */}
              <div>
                <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Berat (gram)</label>
                {gramOpts.length > 0 ? (
                  <Select value={form.gram} onChange={v=>setForm(p=>({...p,gram:v,...autoFields(v,p.type,p.tenor)}))} options={gramOpts} placeholder="Pilih berat" />
                ) : (
                  <input type="number" min={0} step={0.01} value={form.gram} onChange={e=>setForm(p=>({...p,gram:e.target.value}))} style={inp} placeholder="0.00" />
                )}
              </div>

              {/* Jumlah otomatis (read-only) */}
              {form.amount && (
                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".82rem" }}>Jumlah (otomatis)</span>
                  <span style={{ color:"#D4AF37", fontWeight:700, fontSize:".92rem" }}>Rp {fmtRibuan(form.amount)}</span>
                </div>
              )}

              {/* Harga & Metode */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div>
                  <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Harga/gram (Rp)</label>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.4)", fontSize:".9rem", pointerEvents:"none" }}>Rp</span>
                    <input inputMode="numeric" value={fmtRibuan(form.price_per_gram)} onChange={e=>setForm(p=>({...p,price_per_gram:onlyDigits(e.target.value)}))} style={{ ...inp, paddingLeft:36 }} placeholder="0" />
                  </div>
                </div>
                <div>
                  <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Metode Bayar</label>
                  <input value={form.payment_method} onChange={e=>setForm(p=>({...p,payment_method:e.target.value}))} style={inp} placeholder="Transfer, Tunai, dll" />
                </div>
              </div>

              {/* Tanggal */}
              <div>
                <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Tanggal Transaksi</label>
                <input type="datetime-local" value={form.created_at} onChange={e=>setForm(p=>({...p,created_at:e.target.value}))} style={inp} />
              </div>

              {/* Catatan */}
              <div>
                <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Catatan</label>
                <textarea rows={2} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))}
                  style={{ ...inp, resize:"vertical", fontFamily:"inherit" }} placeholder="Keterangan tambahan..." />
              </div>
            </>
          )}

          {/* Tenor & angsuran â€” khusus Cicilan Emas */}
          {form.type === "cicilan" && (
            <div style={{ background:"rgba(167,139,250,0.05)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:12, padding:16, display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Tenor (bulan)</label>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {[3,6,12,24,36,48,60].map(t => (
                    <button key={t} type="button" onClick={()=>setForm(p=>({...p,tenor:String(t), ...autoFields(p.gram, p.type, String(t))}))}
                      style={{ flex:"1 0 auto", minWidth:48, padding:"8px", borderRadius:8, fontWeight:700, fontSize:".85rem", cursor:"pointer",
                        border: cicilanTenor===t ? "1px solid #a78bfa" : "1px solid rgba(255,255,255,0.1)",
                        background: cicilanTenor===t ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.04)",
                        color: cicilanTenor===t ? "#a78bfa" : "rgba(255,255,255,0.5)" }}>{t}</button>
                  ))}
                </div>
              </div>
              {/* DP / uang muka yang sudah disetorkan â€” otomatis sesuai DP yang disetujui, bisa diubah */}
              <div>
                <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>DP / Uang Muka Disetorkan (Rp)</label>
                <div style={{ position:"relative" }}>
                  <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.4)", fontSize:".9rem", pointerEvents:"none" }}>Rp</span>
                  <input inputMode="numeric" value={fmtRibuan(form.dp)} onChange={e=>setForm(p=>({...p,dp:onlyDigits(e.target.value)}))} style={{ ...inp, paddingLeft:36 }} placeholder="0" />
                </div>
                <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".7rem", margin:"5px 0 0" }}>Terisi otomatis sesuai DP yang disetujui; ubah bila nominal yang disetor berbeda.</p>
              </div>
              {form.amount && Number(form.amount) > 0 && (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:8, borderTop:"1px solid rgba(255,255,255,0.07)" }}>
                  <span style={{ color:"rgba(255,255,255,0.6)", fontSize:".85rem", fontWeight:600 }}>Angsuran/bulan</span>
                  <span style={{ color:"#a78bfa", fontSize:"1.1rem", fontWeight:900 }}>{fmt(cicilanAngsuran)}</span>
                </div>
              )}
              <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem", margin:0 }}>
                Total Ã· tenor = {form.amount?fmt(Number(form.amount)):"Rp 0"} Ã· {cicilanTenor} = {fmt(cicilanAngsuran)}/bln Â· DP {form.dp?fmt(Number(form.dp)):"Rp 0"} Â· akan masuk ke Kelola Cicilan.
              </p>
            </div>
          )}

          <button onClick={handleSave} disabled={saving || !form.user_id || !form.amount}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", borderRadius:11, background: saved ? "rgba(52,211,153,0.2)" : "linear-gradient(135deg,#D4AF37,#F5D060)", border: saved ? "1px solid #34d399" : "none", color: saved ? "#34d399" : "#0a0a0a", fontWeight:700, fontSize:".95rem", cursor: saving || !form.user_id || !form.amount ? "not-allowed" : "pointer", opacity: saving ? .7 : 1, transition:"all .3s" }}>
            {saving ? <><RefreshCw style={{ width:15, height:15, animation:"spin 1s linear infinite" }} /> Menyimpan...</> : saved ? "âœ“ Tersimpan" : <><Save style={{ width:15, height:15 }} /> {form.type==="cicilan" ? "Buat Cicilan" : "Simpan Transaksi"}</>}
          </button>
        </motion.div>

        {/* Recent transactions */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.06 }}
          style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", margin:0 }}>
            10 Transaksi Terbaru
          </p>
          {recent.length === 0 ? (
            <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".85rem" }}>Belum ada transaksi.</p>
          ) : (
            recent.map((tx, i) => (
              <div key={tx.id}
                style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                  <span style={{ color: TYPE_COLOR[tx.type] || "#fff", fontWeight:700, fontSize:".82rem" }}>
                    {TYPE_LABEL[tx.type] || tx.type}
                  </span>
                  <span style={{ color:"rgba(255,255,255,0.45)", fontSize:".72rem" }}>
                    Tgl transaksi: {fmtTgl(tx.transaction_date || tx.created_at)}
                  </span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ color:"rgba(255,255,255,0.55)", fontSize:".8rem" }}>
                    {tx.profiles?.name || "-"}
                    {tx.gram ? ` Â· ${Number(tx.gram).toFixed(2)}g` : ""}
                  </span>
                  <span style={{ color:"#fff", fontWeight:700, fontSize:".85rem" }}>{fmt(tx.amount)}</span>
                </div>
                <div style={{ marginTop:6, paddingTop:6, borderTop:"1px solid rgba(255,255,255,0.05)", display:"flex", justifyContent:"space-between", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                  <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".7rem" }}>
                    Diinput oleh: <span style={{ color:"#D4AF37" }}>{staff[tx.recorded_by] || "â€”"}</span>
                  </span>
                  <span style={{ color:"rgba(255,255,255,0.3)", fontSize:".7rem" }}>
                    Diinput: {fmtTglJam(tx.created_at)}
                  </span>
                </div>
              </div>
            ))
          )}
        </motion.div>
      </div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}

