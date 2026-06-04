"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import Select from "@/components/ui/Select";
import RupiahInput from "@/components/ui/RupiahInput";

const TX_TYPES = [
  { value: "buy",      label: "Beli Emas",       desc: "Beli emas dengan pembayaran ke koperasi",    color: "#D4AF37" },
  { value: "tabungan", label: "Setor Tabungan",   desc: "Setoran ke rekening tabungan emas Anda",    color: "#34d399" },
  { value: "buyback",  label: "Jual Kembali",     desc: "Jual emas Anda kembali ke koperasi",        color: "#60a5fa" },
];

const PAYMENT_METHODS = ["Transfer Bank","QRIS","Tunai","BRI","BCA","Mandiri","BNI","BSI"];

const STATUS_COLOR: Record<string,string> = {
  pending:"#fbbf24", processing:"#60a5fa", completed:"#34d399", rejected:"#f87171",
};
const STATUS_BG: Record<string,string> = {
  pending:"rgba(251,191,36,0.12)", processing:"rgba(96,165,250,0.12)",
  completed:"rgba(52,211,153,0.12)", rejected:"rgba(248,113,113,0.12)",
};
const STATUS_LABEL: Record<string,string> = {
  pending:"Menunggu Persetujuan", processing:"Diproses", completed:"Disetujui", rejected:"Ditolak",
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  pending:    <Clock style={{ width:12, height:12 }} />,
  completed:  <CheckCircle style={{ width:12, height:12 }} />,
  rejected:   <XCircle style={{ width:12, height:12 }} />,
};

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n);
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
}

interface TxRow {
  id: string;
  type: string;
  amount: number;
  gram: number | null;
  status: string;
  notes: string | null;
  payment_method: string | null;
  created_at: string;
}

const DEFAULT_FORM = {
  type: "buy",
  gram: "",
  amount: "",
  paymentMethod: "Transfer Bank",
  notes: "",
};

const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
  padding: "11px 14px", color: "#fff", fontSize: ".9rem",
  outline: "none", boxSizing: "border-box",
};

export default function MemberRequestPage() {
  const { user }           = useAuthStore();
  const [form, setForm]    = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError]  = useState("");
  const [myRequests, setMyRequests] = useState<TxRow[]>([]);
  const [loadingReq, setLoadingReq] = useState(true);

  const selectedType = TX_TYPES.find(t => t.value === form.type)!;

  async function loadRequests() {
    if (!user?.id) return;
    setLoadingReq(true);
    try {
      const { data } = await (supabase.from("transactions") as any)
        .select("id,type,amount,gram,status,notes,payment_method,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setMyRequests(data ?? []);
    } catch {}
    setLoadingReq(false);
  }

  useEffect(() => { loadRequests(); }, [user?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.amount || Number(form.amount) <= 0) { setError("Jumlah rupiah harus diisi."); return; }
    if (form.type === "buyback" && !form.gram) { setError("Jumlah gram wajib diisi untuk Jual Kembali."); return; }

    setSubmitting(true);
    try {
      const { error: txErr } = await (supabase.from("transactions") as any).insert({
        user_id: user!.id,
        type: form.type,
        amount: Number(form.amount),
        gram: form.gram ? Number(form.gram) : null,
        status: "pending",
        payment_method: form.type !== "buyback" ? form.paymentMethod : null,
        notes: form.notes || null,
      });

      if (txErr) { setError("Gagal mengirim permintaan: " + txErr.message); setSubmitting(false); return; }

      // Notify all admins
      try {
        const { data: admins } = await (supabase.from("profiles") as any)
          .select("id").in("role", ["admin","master"]);
        if (admins?.length) {
          await (supabase.from("notifications") as any).insert(
            admins.map((a: any) => ({
              user_id: a.id,
              title: "Permintaan Transaksi Baru",
              body: `${user?.name} mengajukan ${selectedType.label} sebesar ${fmt(Number(form.amount))}.`,
              type: "transaction",
              is_read: false,
              link: "/dashboard/admin/transaksi",
            }))
          );
        }
      } catch {}

      setSuccess(`Permintaan ${selectedType.label} berhasil dikirim! Menunggu persetujuan admin.`);
      setForm(DEFAULT_FORM);
      loadRequests();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    }
    setSubmitting(false);
  }

  const pendingCount = myRequests.filter(r => r.status === "pending").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 760 }}>

      {/* Header */}
      <div>
        <h1 style={{ color: "#fff", fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>Ajukan Transaksi</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: ".85rem", margin: "4px 0 0" }}>
          Permintaan Anda akan ditinjau dan disetujui oleh admin.
        </p>
      </div>

      {/* Type Selector */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {TX_TYPES.map(t => (
          <button key={t.value} onClick={() => setForm(f => ({ ...f, type: t.value }))}
            style={{ background: form.type === t.value ? `${t.color}18` : "rgba(255,255,255,0.03)", border: `1px solid ${form.type === t.value ? t.color+"55" : "rgba(255,255,255,0.07)"}`, borderRadius: 14, padding: "14px 12px", cursor: "pointer", textAlign: "left", transition: "all .2s" }}>
            <p style={{ color: form.type === t.value ? t.color : "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: ".88rem", margin: "0 0 4px" }}>{t.label}</p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: ".74rem", margin: 0, lineHeight: 1.4 }}>{t.desc}</p>
          </button>
        ))}
      </div>

      {/* Form */}
      <motion.div key={form.type} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${selectedType.color}25`, borderRadius: 18, padding: 24 }}>

        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 10, padding: "12px 16px", color: "#34d399", display: "flex", alignItems: "center", gap: 8, marginBottom: 18, fontSize: ".88rem" }}>
            <CheckCircle style={{ width: 15, height: 15, flexShrink: 0 }} />
            {success}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Gram — untuk buy dan buyback */}
          {(form.type === "buy" || form.type === "buyback") && (
            <div>
              <label style={{ color: "rgba(255,255,255,0.5)", fontSize: ".8rem", display: "block", marginBottom: 6 }}>
                Jumlah Gram {form.type === "buyback" ? "*" : "(opsional)"}
              </label>
              <input type="number" min="0" step="0.001"
                value={form.gram}
                onChange={e => setForm(f => ({ ...f, gram: e.target.value }))}
                placeholder="Contoh: 1.5"
                style={inputStyle} />
            </div>
          )}

          {/* Amount */}
          <div>
            <label style={{ color: "rgba(255,255,255,0.5)", fontSize: ".8rem", display: "block", marginBottom: 6 }}>
              Total Rupiah *
            </label>
            <RupiahInput value={form.amount}
              onValueChange={v => setForm(f => ({ ...f, amount: v }))}
              style={inputStyle} />
            {form.amount && Number(form.amount) > 0 && (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: ".78rem", marginTop: 5 }}>{fmt(Number(form.amount))}</p>
            )}
          </div>

          {/* Payment method — tidak untuk buyback */}
          {form.type !== "buyback" && (
            <div>
              <label style={{ color: "rgba(255,255,255,0.5)", fontSize: ".8rem", display: "block", marginBottom: 6 }}>Metode Pembayaran</label>
              <Select value={form.paymentMethod} onChange={v => setForm(f => ({ ...f, paymentMethod: v }))} options={PAYMENT_METHODS.map(m=>({value:m,label:m}))} />
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={{ color: "rgba(255,255,255,0.5)", fontSize: ".8rem", display: "block", marginBottom: 6 }}>Catatan (opsional)</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Contoh: Bukti transfer sudah dikirim via WA"
              rows={2}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
          </div>

          {error && <p style={{ color: "#f87171", fontSize: ".83rem", margin: 0 }}>{error}</p>}

          <button type="submit" disabled={submitting}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: `linear-gradient(135deg,${selectedType.color},${selectedType.color}cc)`, border: "none", borderRadius: 12, padding: "13px", color: "#0a0a0a", fontWeight: 700, fontSize: ".95rem", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? .7 : 1, marginTop: 4 }}>
            {submitting
              ? <><RefreshCw style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Mengirim...</>
              : <><Send style={{ width: 16, height: 16 }} /> Kirim Permintaan {selectedType.label}</>}
          </button>
        </form>
      </motion.div>

      {/* My Requests */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ color: "rgba(255,255,255,0.7)", fontSize: ".9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", margin: 0 }}>
            Riwayat Permintaan
            {pendingCount > 0 && (
              <span style={{ marginLeft: 8, background: "rgba(251,191,36,0.15)", color: "#fbbf24", borderRadius: 20, padding: "2px 8px", fontSize: ".72rem" }}>
                {pendingCount} Pending
              </span>
            )}
          </h2>
          <button onClick={loadRequests}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: ".78rem" }}>
            <RefreshCw style={{ width: 12, height: 12 }} /> Refresh
          </button>
        </div>

        {loadingReq ? (
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: ".85rem" }}>Memuat...</p>
        ) : myRequests.length === 0 ? (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "32px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: ".88rem" }}>
            Belum ada permintaan transaksi.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {myRequests.map(req => (
              <motion.div key={req.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <p style={{ color: "#fff", fontWeight: 600, fontSize: ".88rem", margin: "0 0 3px" }}>
                    {TX_TYPES.find(t => t.value === req.type)?.label || req.type}
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: ".75rem", margin: 0 }}>
                    {fmtDate(req.created_at)}
                    {req.gram && ` · ${req.gram} gr`}
                    {req.payment_method && ` · ${req.payment_method}`}
                  </p>
                </div>
                <p style={{ color: "#D4AF37", fontWeight: 700, fontSize: ".95rem", margin: 0 }}>{fmt(req.amount)}</p>
                <span style={{ background: STATUS_BG[req.status]||"rgba(255,255,255,0.08)", color: STATUS_COLOR[req.status]||"#fff", borderRadius: 8, padding: "4px 10px", fontSize: ".75rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                  {STATUS_ICON[req.status]}
                  {STATUS_LABEL[req.status] || req.status}
                </span>
                {req.status === "rejected" && req.notes && (
                  <p style={{ width: "100%", color: "#f87171", fontSize: ".78rem", margin: "4px 0 0", background: "rgba(248,113,113,0.06)", borderRadius: 6, padding: "6px 10px" }}>
                    Alasan: {req.notes}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
