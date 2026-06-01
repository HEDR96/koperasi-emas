"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, RefreshCw, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import Select from "@/components/ui/Select";
import MemberPicker from "@/components/ui/MemberPicker";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);

const inp: React.CSSProperties = {
  width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:".9rem", outline:"none", boxSizing:"border-box",
};

const TYPE_OPTS = [
  { value:"buy",           label:"Beli Emas" },
  { value:"buyback",       label:"Buyback Emas" },
  { value:"cicilan",       label:"Cicilan Emas" },
  { value:"transfer",      label:"Transfer Saldo" },
  { value:"referral_bonus",label:"Bonus Referral" },
];

const STATUS_OPTS = [
  { value:"completed",  label:"Selesai (Completed)" },
  { value:"pending",    label:"Menunggu (Pending)" },
  { value:"processing", label:"Diproses (Processing)" },
  { value:"rejected",   label:"Ditolak (Rejected)" },
];

const EMPTY = {
  user_id:"", type:"buy", gram:"", amount:"", price_per_gram:"",
  payment_method:"", notes:"", status:"completed",
  created_at: new Date().toISOString().slice(0,16),
};

export default function InputTransaksiPage() {
  const { user } = useAuthStore();
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");
  const [recent, setRecent]     = useState<any[]>([]);

  async function loadRecent() {
    const { data } = await (supabase.from("transactions") as any)
      .select("id, type, amount, gram, status, created_at, profiles(name)")
      .order("created_at", { ascending: false })
      .limit(10);
    setRecent(data || []);
  }

  useEffect(() => { loadRecent(); }, []);

  async function handleSave() {
    if (!form.user_id || !form.amount) { setError("Pilih anggota dan isi jumlah."); return; }
    setSaving(true); setError("");
    try {
      const payload: any = {
        user_id:        form.user_id,
        type:           form.type,
        amount:         Number(form.amount),
        status:         form.status,
        payment_method: form.payment_method || null,
        notes:          form.notes || null,
        created_at:     new Date(form.created_at).toISOString(),
        updated_at:     new Date(form.created_at).toISOString(),
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
            Catat transaksi historis atau transaksi yang belum terinput
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
              <Select value={form.type} onChange={v=>setForm(p=>({...p,type:v}))} options={TYPE_OPTS} />
            </div>
            <div>
              <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Status</label>
              <Select value={form.status} onChange={v=>setForm(p=>({...p,status:v}))} options={STATUS_OPTS} />
            </div>
          </div>

          {/* Jumlah & Gram */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Jumlah (Rp) *</label>
              <input type="number" min={0} value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} style={inp} placeholder="0" />
            </div>
            <div>
              <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Berat (gram)</label>
              <input type="number" min={0} step={0.01} value={form.gram} onChange={e=>setForm(p=>({...p,gram:e.target.value}))} style={inp} placeholder="0.00" />
            </div>
          </div>

          {/* Harga & Metode */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Harga/gram (Rp)</label>
              <input type="number" min={0} value={form.price_per_gram} onChange={e=>setForm(p=>({...p,price_per_gram:e.target.value}))} style={inp} placeholder="0" />
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

          <button onClick={handleSave} disabled={saving || !form.user_id || !form.amount}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", borderRadius:11, background: saved ? "rgba(52,211,153,0.2)" : "linear-gradient(135deg,#D4AF37,#F5D060)", border: saved ? "1px solid #34d399" : "none", color: saved ? "#34d399" : "#0a0a0a", fontWeight:700, fontSize:".95rem", cursor: saving || !form.user_id || !form.amount ? "not-allowed" : "pointer", opacity: saving ? .7 : 1, transition:"all .3s" }}>
            {saving ? <><RefreshCw style={{ width:15, height:15, animation:"spin 1s linear infinite" }} /> Menyimpan...</> : saved ? "✓ Transaksi Tersimpan" : <><Save style={{ width:15, height:15 }} /> Simpan Transaksi</>}
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
                  <span style={{ color:"rgba(255,255,255,0.35)", fontSize:".72rem" }}>
                    {new Date(tx.created_at).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" })}
                  </span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ color:"rgba(255,255,255,0.55)", fontSize:".8rem" }}>
                    {tx.profiles?.name || "-"}
                    {tx.gram ? ` · ${Number(tx.gram).toFixed(2)}g` : ""}
                  </span>
                  <span style={{ color:"#fff", fontWeight:700, fontSize:".85rem" }}>{fmt(tx.amount)}</span>
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
