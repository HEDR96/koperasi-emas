"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import Select from "@/components/ui/Select";
import MemberPicker from "@/components/ui/MemberPicker";
import RupiahInput from "@/components/ui/RupiahInput";

interface MemberOption {
  id: string;
  name: string;
  phone: string | null;
}

const TX_TYPES = [
  { value:"buy",      label:"Beli Emas" },
  { value:"tabungan", label:"Tabungan Emas" },
  { value:"cicilan",  label:"Cicilan Emas" },
];

const PAYMENT_METHODS = [
  "Transfer Bank","QRIS","Tunai","BRI","BCA","Mandiri","BNI","BSI",
];

const DEFAULT_FORM = {
  memberId: "",
  type: "buy",
  gram: "",
  amount: "",
  paymentMethod: "Transfer Bank",
  notes: "",
};

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n);
}

export default function AdminDepositPage() {
  const { user }               = useAuthStore();
  const [selectedMember, setSelectedMember] = useState<MemberOption | null>(null);
  const [form, setForm]        = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]  = useState("");
  const [error, setError]      = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.memberId) { setError("Pilih member terlebih dahulu."); return; }
    if (!form.amount || Number(form.amount) <= 0) { setError("Jumlah harus lebih dari 0."); return; }

    setSubmitting(true);
    try {
      const txPayload: any = {
        user_id: form.memberId,
        type: form.type,
        amount: Number(form.amount),
        gram: form.gram ? Number(form.gram) : null,
        status: "completed",
        payment_method: form.paymentMethod,
        notes: form.notes || null,
      };

      const { data: txData, error: txErr } = await (supabase.from("transactions") as any)
        .insert(txPayload)
        .select("id")
        .single();

      if (txErr) { setError("Gagal membuat transaksi: " + txErr.message); setSubmitting(false); return; }

      // Notify member
      try {
        await (supabase.from("notifications") as any).insert({
          user_id: form.memberId,
          title: "Transaksi Masuk",
          body: `Admin menginput transaksi ${TX_TYPES.find(t=>t.value===form.type)?.label||form.type} sebesar ${fmt(Number(form.amount))}.`,
          type: "transaction",
          is_read: false,
          link: "/dashboard/member/histori",
        });
      } catch {}

      // Notify master users
      try {
        const { data: masters } = await (supabase.from("profiles") as any)
          .select("id").eq("role","master");
        if (masters?.length) {
          await (supabase.from("notifications") as any).insert(
            masters.map((m: any) => ({
              user_id: m.id,
              title: "Transaksi Baru Diinput Admin",
              body: `${user?.name} menginput transaksi untuk ${selectedMember?.name}: ${fmt(Number(form.amount))}.`,
              type: "transaction",
              is_read: false,
              link: "/dashboard/master/approval",
            }))
          );
        }
      } catch {}

      setSuccess(`Transaksi berhasil diinput! ID: ${txData?.id?.slice(0,8)}...`);
      setForm(DEFAULT_FORM);
      setSelectedMember(null);
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan.");
    }
    setSubmitting(false);
  }

  const inputStyle: React.CSSProperties = {
    width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
    borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:".9rem", outline:"none", boxSizing:"border-box",
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:560 }}>
      {/* Header */}
      <div>
        <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Input Transaksi Member</h1>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>
          Input transaksi atas nama member. Status langsung Selesai (tidak perlu approval).
        </p>
      </div>

      {success && (
        <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
          style={{ background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:12, padding:"14px 18px", color:"#34d399", display:"flex", alignItems:"center", gap:10 }}>
          <CheckCircle style={{ width:16, height:16, flexShrink:0 }} />
          {success}
        </motion.div>
      )}

      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
        style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:28 }}>
        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:18 }}>

          {/* Member select */}
          <div>
            <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:7 }}>Pilih Member *</label>
            <MemberPicker value={form.memberId} onChange={m=>{ setSelectedMember(m); setForm(f=>({...f,memberId:m?.id||""})); }} />
          </div>

          {/* Type */}
          <div>
            <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:7 }}>Jenis Transaksi *</label>
            <Select value={form.type} onChange={v=>setForm(f=>({...f,type:v}))} options={TX_TYPES} />
          </div>

          {/* Gram */}
          {form.type === "buy" && (
            <div>
              <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:7 }}>Jumlah Gram</label>
              <input type="number" min="0" step="0.01" value={form.gram}
                onChange={e=>setForm(f=>({...f,gram:e.target.value}))}
                placeholder="Contoh: 1.5"
                style={inputStyle} />
            </div>
          )}

          {/* Amount */}
          <div>
            <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:7 }}>Total Rupiah *</label>
            <RupiahInput value={form.amount}
              onValueChange={v=>setForm(f=>({...f,amount:v}))}
              placeholder="Contoh: 1500000"
              style={inputStyle} />
            {form.amount && Number(form.amount) > 0 && (
              <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".78rem", margin:"5px 0 0" }}>
                {fmt(Number(form.amount))}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:7 }}>Metode Pembayaran</label>
            <Select value={form.paymentMethod} onChange={v=>setForm(f=>({...f,paymentMethod:v}))} options={PAYMENT_METHODS.map(m=>({value:m,label:m}))} />
          </div>

          {/* Notes */}
          <div>
            <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:7 }}>Catatan</label>
            <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}
              placeholder="Catatan tambahan (opsional)"
              rows={3}
              style={{ ...inputStyle, resize:"vertical", fontFamily:"inherit" }} />
          </div>

          {error && <p style={{ color:"#f87171", fontSize:".83rem", margin:0 }}>{error}</p>}

          <button type="submit" disabled={submitting}
            style={{ background:"linear-gradient(135deg,#D4AF37,#f0d060)", border:"none", borderRadius:12, padding:"13px", color:"#0a0a0a", fontWeight:700, fontSize:".95rem", cursor:submitting?"not-allowed":"pointer", opacity:submitting?.7:1, marginTop:4 }}>
            {submitting ? "Memproses..." : "Input Transaksi"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
