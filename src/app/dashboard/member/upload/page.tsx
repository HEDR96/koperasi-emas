"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Upload, RefreshCw, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
const fmtDate = (s: string) => new Date(s).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"});

const inp: React.CSSProperties = {
  width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:".9rem", outline:"none", boxSizing:"border-box",
};
const PAYMENT_METHODS = ["Transfer Bank","QRIS","Tunai","BRI","BCA","Mandiri","BNI","BSI"];
const TYPE_LABEL: Record<string,string> = { buy:"Beli Emas", buyback:"Buyback", cicilan:"Cicilan", tabungan:"Tabungan" };

export default function MemberUploadPage() {
  const { user } = useAuthStore();
  const [pendingTx, setPendingTx] = useState<any[]>([]);
  const [myPayments, setMyPayments] = useState<any[]>([]);
  const [form, setForm] = useState({ transaction_id:"", amount:"", payment_method:"Transfer Bank", proof_url:"", notes:"" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [txRes, payRes] = await Promise.all([
        (supabase.from("transactions") as any)
          .select("id, type, amount, created_at").eq("user_id", user.id).eq("status","pending").order("created_at",{ascending:false}),
        (supabase.from("payments") as any)
          .select("id, amount, payment_method, status, created_at").eq("user_id", user.id).order("created_at",{ascending:false}).limit(10),
      ]);
      setPendingTx(txRes.data || []);
      setMyPayments(payRes.data || []);
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, [user?.id]);

  const selectedTx = pendingTx.find(t => t.id === form.transaction_id);

  async function submit() {
    if (!user?.id) return;
    if (!form.transaction_id) { setError("Pilih transaksi yang ingin dibayar."); return; }
    const amount = Number(form.amount) || selectedTx?.amount || 0;
    if (amount <= 0) { setError("Nominal pembayaran tidak valid."); return; }
    setSaving(true); setError("");
    try {
      const { error: err } = await (supabase.from("payments") as any).insert({
        transaction_id: form.transaction_id,
        user_id: user.id,
        amount,
        payment_method: form.payment_method,
        proof_url: form.proof_url || null,
        notes: form.notes || null,
        status: "pending",
      });
      if (err) { setError(err.message); }
      else {
        setSaved(true); setTimeout(()=>setSaved(false), 2500);
        try {
          const { data: staff } = await (supabase.from("profiles") as any).select("id").in("role",["admin","master"]);
          if (staff?.length) await (supabase.from("notifications") as any).insert(
            staff.map((s: any) => ({ user_id:s.id, title:"Bukti Bayar Masuk", body:`${user.name} mengirim bukti pembayaran ${fmt(amount)}.`, type:"pembayaran", is_read:false, link:"/dashboard/admin/pembayaran" }))
          );
        } catch {}
        setForm({ transaction_id:"", amount:"", payment_method:"Transfer Bank", proof_url:"", notes:"" });
        load();
      }
    } catch { setError("Terjadi kesalahan."); }
    setSaving(false);
  }

  const STATUS_COLOR: Record<string,string> = { pending:"#fbbf24", verified:"#34d399", rejected:"#f87171" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:680 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Upload Bukti Pembayaran</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Kirim bukti pembayaran untuk transaksi pending</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
        style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:22, display:"flex", flexDirection:"column", gap:16 }}>
        {error && <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:10, padding:"10px 14px", color:"#f87171", fontSize:".82rem" }}>{error}</div>}
        {saved && <div style={{ background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:10, padding:"10px 14px", color:"#34d399", fontSize:".82rem", display:"flex", alignItems:"center", gap:8 }}><CheckCircle style={{width:14,height:14}}/> Bukti pembayaran terkirim!</div>}

        <div>
          <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:7 }}>Transaksi *</label>
          {loading ? <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".85rem" }}>Memuat...</p>
            : pendingTx.length === 0 ? <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".85rem" }}>Tidak ada transaksi pending. Ajukan transaksi dulu di menu Ajukan Transaksi.</p>
            : (
              <select value={form.transaction_id} onChange={e=>{ const tx=pendingTx.find(t=>t.id===e.target.value); setForm(p=>({...p, transaction_id:e.target.value, amount:tx?String(tx.amount):""})); }} style={{ ...inp, cursor:"pointer" }}>
                <option value="">— Pilih transaksi —</option>
                {pendingTx.map(t=>(
                  <option key={t.id} value={t.id}>{TYPE_LABEL[t.type]||t.type} · {fmt(t.amount)} · {fmtDate(t.created_at)}</option>
                ))}
              </select>
            )}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div>
            <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:7 }}>Nominal (Rp)</label>
            <input type="number" min={0} value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} style={inp} placeholder="0" />
          </div>
          <div>
            <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:7 }}>Metode</label>
            <select value={form.payment_method} onChange={e=>setForm(p=>({...p,payment_method:e.target.value}))} style={{ ...inp, cursor:"pointer" }}>
              {PAYMENT_METHODS.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:7 }}>Link Bukti Transfer (opsional)</label>
          <input value={form.proof_url} onChange={e=>setForm(p=>({...p,proof_url:e.target.value}))} style={inp} placeholder="URL foto bukti (Drive / imgur / dll)" />
          <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".72rem", marginTop:5 }}>Tempel link foto bukti transfer, atau kirim via WhatsApp ke admin.</p>
        </div>

        <div>
          <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:7 }}>Catatan</label>
          <textarea rows={2} value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} style={{ ...inp, resize:"vertical", fontFamily:"inherit" }} placeholder="Keterangan tambahan..." />
        </div>

        <button onClick={submit} disabled={saving || !form.transaction_id}
          style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", borderRadius:11, background:"linear-gradient(135deg,#D4AF37,#F5D060)", border:"none", color:"#0a0a0a", fontWeight:700, fontSize:".95rem", cursor: saving||!form.transaction_id ? "not-allowed" : "pointer", opacity: saving?.7:1 }}>
          {saving ? "Mengirim..." : <><Upload style={{ width:15, height:15 }} /> Kirim Bukti Pembayaran</>}
        </button>
      </motion.div>

      {/* Riwayat pembayaran */}
      {myPayments.length > 0 && (
        <div>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 12px" }}>Riwayat Bukti Bayar</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {myPayments.map(p=>(
              <div key={p.id} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                <span style={{ color:"rgba(255,255,255,0.6)", fontSize:".82rem" }}>{p.payment_method||"—"} · {fmtDate(p.created_at)}</span>
                <span style={{ color:"#D4AF37", fontWeight:700, fontSize:".85rem" }}>{fmt(p.amount)}</span>
                <span style={{ color:STATUS_COLOR[p.status]||"#fff", fontSize:".74rem", textTransform:"capitalize" }}>{p.status==="verified"?"Terverifikasi":p.status==="rejected"?"Ditolak":"Menunggu"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
