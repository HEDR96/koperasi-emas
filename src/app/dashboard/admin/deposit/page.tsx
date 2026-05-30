"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

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
  const [members, setMembers]  = useState<MemberOption[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberOption | null>(null);
  const [form, setForm]        = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]  = useState("");
  const [error, setError]      = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from("profiles") as any)
        .select("id,name,phone")
        .eq("role","member")
        .eq("status","active")
        .order("name");
      setMembers(data ?? []);
    })();
  }, []);

  const filteredMembers = memberSearch
    ? members.filter(m =>
        m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        (m.phone||"").includes(memberSearch)
      )
    : members.slice(0,8);

  function selectMember(m: MemberOption) {
    setSelectedMember(m);
    setForm(f => ({ ...f, memberId: m.id }));
    setMemberSearch(m.name);
    setShowDropdown(false);
  }

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
      setMemberSearch("");
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
        <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Input Deposit</h1>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>
          Input transaksi langsung atas nama member. Status otomatis menjadi selesai.
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
          <div style={{ position:"relative" }}>
            <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:7 }}>Pilih Member *</label>
            <div style={{ position:"relative" }}>
              <Search style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:14, height:14, color:"rgba(255,255,255,0.3)" }} />
              <input
                value={memberSearch}
                onChange={e=>{ setMemberSearch(e.target.value); setShowDropdown(true); setSelectedMember(null); setForm(f=>({...f,memberId:""})); }}
                onFocus={()=>setShowDropdown(true)}
                placeholder="Cari nama atau nomor HP..."
                style={{ ...inputStyle, paddingLeft:36 }}
              />
            </div>
            {showDropdown && filteredMembers.length > 0 && (
              <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"#1a1a1a", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, zIndex:50, maxHeight:220, overflowY:"auto", marginTop:4, boxShadow:"0 8px 32px rgba(0,0,0,0.5)" }}>
                {filteredMembers.map(m => (
                  <div key={m.id} onClick={()=>selectMember(m)}
                    style={{ padding:"11px 16px", cursor:"pointer", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", justifyContent:"space-between", alignItems:"center" }}
                    onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="rgba(212,175,55,0.08)"}
                    onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}
                  >
                    <span style={{ color:"#fff", fontSize:".88rem", fontWeight:600 }}>{m.name}</span>
                    <span style={{ color:"rgba(255,255,255,0.35)", fontSize:".78rem" }}>{m.phone||"—"}</span>
                  </div>
                ))}
              </div>
            )}
            {showDropdown && (
              <div style={{ position:"fixed", inset:0, zIndex:49 }} onClick={()=>setShowDropdown(false)} />
            )}
          </div>

          {/* Type */}
          <div>
            <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:7 }}>Jenis Transaksi *</label>
            <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}
              style={{ ...inputStyle, cursor:"pointer" }}>
              {TX_TYPES.map(t=>(
                <option key={t.value} value={t.value} style={{ background:"#1a1a1a" }}>{t.label}</option>
              ))}
            </select>
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
            <input type="number" min="0" value={form.amount}
              onChange={e=>setForm(f=>({...f,amount:e.target.value}))}
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
            <select value={form.paymentMethod} onChange={e=>setForm(f=>({...f,paymentMethod:e.target.value}))}
              style={{ ...inputStyle, cursor:"pointer" }}>
              {PAYMENT_METHODS.map(m=>(
                <option key={m} value={m} style={{ background:"#1a1a1a" }}>{m}</option>
              ))}
            </select>
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
