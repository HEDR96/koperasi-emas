"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Wallet, ArrowDownCircle, CheckCircle, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import Select from "@/components/ui/Select";
import MemberPicker from "@/components/ui/MemberPicker";
import RupiahInput from "@/components/ui/RupiahInput";
import { PAYMENT_METHODS, DEFAULT_PAYMENT_METHOD } from "@/lib/paymentMethods";
import { getMarkup, withMarkup } from "@/lib/harga";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const inp: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: ".9rem", outline: "none", boxSizing: "border-box",
};

type Tab = "beli" | "simpanan" | "buyback";

const TABS: { id: Tab; label: string; icon: any; color: string }[] = [
  { id: "beli",     label: "Beli Emas",      icon: Coins,          color: "#D4AF37" },
  { id: "simpanan", label: "Setor Simpanan",  icon: Wallet,         color: "#34d399" },
  { id: "buyback",  label: "Jual Kembali",    icon: ArrowDownCircle,color: "#60a5fa" },
];

const SIM_TYPE_OPTS = [
  { value: "pokok",    label: "Simpanan Pokok" },
  { value: "wajib",    label: "Simpanan Wajib" },
  { value: "sukarela", label: "Simpanan Sukarela" },
];

const EMPTY_BELI     = { user_id: "", gram: "", amount: "", paymentMethod: DEFAULT_PAYMENT_METHOD, notes: "" };
const EMPTY_SIMPANAN = { user_id: "", simType: "wajib", amount: "", paymentMethod: DEFAULT_PAYMENT_METHOD, notes: "" };
const EMPTY_BUYBACK  = { user_id: "", gram: "", amount: "", paymentMethod: DEFAULT_PAYMENT_METHOD, notes: "" };

export default function AdminAjukanPage() {
  const { user } = useAuthStore();
  const [tab, setTab]         = useState<Tab>("beli");
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError]     = useState("");

  const [beli,     setBeli]     = useState(EMPTY_BELI);
  const [simpanan, setSimpanan] = useState(EMPTY_SIMPANAN);
  const [buyback,  setBuyback]  = useState(EMPTY_BUYBACK);

  const [goldRows, setGoldRows]       = useState<{ gram: number; harga: number }[]>([]);
  const [bbPerGram, setBbPerGram]     = useState(0);
  const [loadingGold, setLoadingGold] = useState(true);

  useEffect(() => {
    (async () => {
      setLoadingGold(true);
      try {
        const [{ data: e }, { data: b }, markup] = await Promise.all([
          ((supabase as any).rpc("get_latest_harga_berat", { kat: "emas" }) as any),
          ((supabase as any).rpc("get_latest_harga_berat", { kat: "buyback" }) as any),
          getMarkup(),
        ]);
        const seen = new Set<number>();
        const rows = (e || [])
          .filter((r: any) => { const g = Number(r.gram); if (seen.has(g)) return false; seen.add(g); return true; })
          .map((r: any) => ({ gram: Number(r.gram), harga: withMarkup(r.harga, Number(r.gram), markup.anggota) }))
          .sort((a: any, bb: any) => a.gram - bb.gram);
        setGoldRows(rows);
        if (b?.length) {
          const one = b.find((r: any) => Number(r.gram) === 1) || b[0];
          setBbPerGram(Number(one.harga) / Number(one.gram));
        }
      } catch {}
      setLoadingGold(false);
    })();
  }, []);

  const gramBeliOpts   = goldRows.map(r => ({ value: String(r.gram), label: `${r.gram} gram — ${fmt(r.harga)}` }));
  const gramBuybackOpts = goldRows.map(r => ({ value: String(r.gram), label: `${r.gram} gram — ${fmt(Math.round(r.gram * bbPerGram))}` }));

  function onGramBeli(v: string) {
    const row = goldRows.find(r => r.gram === Number(v));
    setBeli(p => ({ ...p, gram: v, amount: row ? String(Math.round(row.harga)) : p.amount }));
  }
  function onGramBuyback(v: string) {
    const g = Number(v);
    setBuyback(p => ({ ...p, gram: v, amount: bbPerGram > 0 ? String(Math.round(g * bbPerGram)) : p.amount }));
  }

  function reset() {
    setBeli(EMPTY_BELI); setSimpanan(EMPTY_SIMPANAN); setBuyback(EMPTY_BUYBACK);
  }

  async function notifyAdminAndMember(memberId: string, title: string, body: string, link: string) {
    try {
      await (supabase.from("notifications") as any).insert({ user_id: memberId, title, body, type: "transaction", is_read: false, link });
    } catch {}
    try {
      const { data: masters } = await (supabase.from("profiles") as any).select("id").eq("role", "master");
      if (masters?.length) {
        await (supabase.from("notifications") as any).insert(
          masters.map((m: any) => ({ user_id: m.id, title, body, type: "transaction", is_read: false, link: "/dashboard/master/approval" }))
        );
      }
    } catch {}
  }

  async function submitBeli() {
    if (!beli.user_id) { setError("Pilih anggota terlebih dahulu."); return; }
    if (!beli.gram)    { setError("Pilih berat emas."); return; }
    setSaving(true); setError("");
    try {
      const amount = Number(beli.amount) || 0;
      const { error: err } = await (supabase.from("transactions") as any).insert({
        user_id:        beli.user_id,
        type:           "buy",
        gram:           Number(beli.gram),
        amount,
        price_per_gram: amount > 0 && Number(beli.gram) > 0 ? Math.round(amount / Number(beli.gram)) : null,
        payment_method: beli.paymentMethod,
        notes:          beli.notes || null,
        status:         "pending",
        recorded_by:    user?.id,
        transaction_date: new Date().toISOString(),
      });
      if (err) { setError(err.message); setSaving(false); return; }
      setSuccess("Pengajuan Beli Emas berhasil! Menunggu persetujuan.");
      await notifyAdminAndMember(beli.user_id, "Pengajuan Beli Emas", `Admin mengajukan beli ${beli.gram} gram emas (${fmt(amount)}).`, "/dashboard/member/histori");
      reset();
    } catch { setError("Terjadi kesalahan."); }
    setSaving(false);
  }

  async function submitSimpanan() {
    if (!simpanan.user_id) { setError("Pilih anggota terlebih dahulu."); return; }
    if (!simpanan.amount)  { setError("Isi nominal simpanan."); return; }
    setSaving(true); setError("");
    try {
      const amount = Number(simpanan.amount) || 0;
      const { error: err } = await (supabase.from("simpanan") as any).insert({
        user_id:          simpanan.user_id,
        type:             simpanan.simType,
        amount,
        description:      simpanan.notes || null,
        payment_method:   simpanan.paymentMethod,
        status:           "completed",
        verified_by:      user?.id,
        recorded_by:      user?.id,
        transaction_date: new Date().toISOString(),
      });
      if (err) { setError(err.message); setSaving(false); return; }
      setSuccess("Setoran simpanan berhasil dicatat.");
      await notifyAdminAndMember(simpanan.user_id, "Simpanan Masuk", `Admin mencatat setoran simpanan ${fmt(amount)}.`, "/dashboard/member/simpanan");
      reset();
    } catch { setError("Terjadi kesalahan."); }
    setSaving(false);
  }

  async function submitBuyback() {
    if (!buyback.user_id) { setError("Pilih anggota terlebih dahulu."); return; }
    if (!buyback.gram)    { setError("Pilih berat emas untuk dijual kembali."); return; }
    setSaving(true); setError("");
    try {
      const amount = Number(buyback.amount) || 0;
      const { error: err } = await (supabase.from("transactions") as any).insert({
        user_id:          buyback.user_id,
        type:             "buyback",
        gram:             Number(buyback.gram),
        amount,
        price_per_gram:   amount > 0 && Number(buyback.gram) > 0 ? Math.round(amount / Number(buyback.gram)) : null,
        payment_method:   buyback.paymentMethod,
        notes:            buyback.notes || null,
        status:           "pending",
        recorded_by:      user?.id,
        transaction_date: new Date().toISOString(),
      });
      if (err) { setError(err.message); setSaving(false); return; }
      setSuccess("Pengajuan Jual Kembali berhasil! Menunggu persetujuan.");
      await notifyAdminAndMember(buyback.user_id, "Pengajuan Jual Kembali", `Admin mengajukan buyback ${buyback.gram} gram emas (${fmt(amount)}).`, "/dashboard/member/histori");
      reset();
    } catch { setError("Terjadi kesalahan."); }
    setSaving(false);
  }

  function handleSubmit() {
    setSuccess(""); setError("");
    if (tab === "beli")     return submitBeli();
    if (tab === "simpanan") return submitSimpanan();
    if (tab === "buyback")  return submitBuyback();
  }

  const activeTab = TABS.find(t => t.id === tab)!;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 600 }}>
      {/* Header */}
      <div>
        <h1 style={{ color: "#fff", fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>Ajukan Transaksi</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: ".85rem", margin: "4px 0 0" }}>
          Ajukan transaksi atas nama anggota — masuk ke antrian approval
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {TABS.map(t => {
          const Icon = t.icon; const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => { setTab(t.id); setSuccess(""); setError(""); }}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 11, fontSize: ".88rem", fontWeight: 700, cursor: "pointer",
                border: active ? `1px solid ${t.color}` : "1px solid rgba(255,255,255,0.1)",
                background: active ? `${t.color}20` : "rgba(255,255,255,0.03)",
                color: active ? t.color : "rgba(255,255,255,0.45)" }}>
              <Icon style={{ width: 15, height: 15 }} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Form card */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .18 }}
          style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${activeTab.color}25`, borderRadius: 18, padding: 26, display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Feedback */}
          {success && (
            <div style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 10, padding: "11px 16px", color: "#34d399", display: "flex", alignItems: "center", gap: 8, fontSize: ".85rem" }}>
              <CheckCircle style={{ width: 15, height: 15, flexShrink: 0 }} /> {success}
            </div>
          )}
          {error && (
            <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 10, padding: "11px 16px", color: "#f87171", fontSize: ".85rem" }}>
              {error}
            </div>
          )}

          {/* Pilih Anggota */}
          <div>
            <label style={{ color: "rgba(255,255,255,0.5)", fontSize: ".8rem", display: "block", marginBottom: 7 }}>Anggota *</label>
            <MemberPicker
              value={tab === "beli" ? beli.user_id : tab === "simpanan" ? simpanan.user_id : buyback.user_id}
              onChange={m => {
                const id = m?.id || "";
                if (tab === "beli")     setBeli(p => ({ ...p, user_id: id }));
                if (tab === "simpanan") setSimpanan(p => ({ ...p, user_id: id }));
                if (tab === "buyback")  setBuyback(p => ({ ...p, user_id: id }));
              }}
            />
          </div>

          {/* ── BELI EMAS ── */}
          {tab === "beli" && (
            <>
              <div>
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: ".8rem", display: "block", marginBottom: 7 }}>Berat Emas *</label>
                {loadingGold ? <p style={{ color: "rgba(255,255,255,0.3)", fontSize: ".85rem" }}>Memuat harga...</p>
                  : gramBeliOpts.length === 0 ? <p style={{ color: "#f87171", fontSize: ".85rem" }}>Harga belum tersedia.</p>
                  : <Select value={beli.gram} onChange={onGramBeli} options={gramBeliOpts} placeholder="Pilih berat emas" />}
              </div>
              <div>
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: ".8rem", display: "block", marginBottom: 7 }}>Total Nominal (Rp)</label>
                <RupiahInput value={beli.amount} onValueChange={v => setBeli(p => ({ ...p, amount: v }))} style={inp} />
                {beli.amount && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: ".75rem", margin: "4px 0 0" }}>{fmt(Number(beli.amount))}</p>}
              </div>
            </>
          )}

          {/* ── SETOR SIMPANAN ── */}
          {tab === "simpanan" && (
            <>
              <div>
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: ".8rem", display: "block", marginBottom: 7 }}>Jenis Simpanan</label>
                <Select value={simpanan.simType} onChange={v => setSimpanan(p => ({ ...p, simType: v }))} options={SIM_TYPE_OPTS} />
              </div>
              <div>
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: ".8rem", display: "block", marginBottom: 7 }}>Nominal (Rp) *</label>
                <RupiahInput value={simpanan.amount} onValueChange={v => setSimpanan(p => ({ ...p, amount: v }))} style={inp} />
                {simpanan.amount && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: ".75rem", margin: "4px 0 0" }}>{fmt(Number(simpanan.amount))}</p>}
              </div>
            </>
          )}

          {/* ── JUAL KEMBALI ── */}
          {tab === "buyback" && (
            <>
              <div>
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: ".8rem", display: "block", marginBottom: 7 }}>Berat Emas *</label>
                {loadingGold ? <p style={{ color: "rgba(255,255,255,0.3)", fontSize: ".85rem" }}>Memuat harga...</p>
                  : gramBuybackOpts.length === 0 ? <p style={{ color: "#f87171", fontSize: ".85rem" }}>Harga buyback belum tersedia.</p>
                  : <Select value={buyback.gram} onChange={onGramBuyback} options={gramBuybackOpts} placeholder="Pilih berat emas" />}
              </div>
              <div>
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: ".8rem", display: "block", marginBottom: 7 }}>Dana Cair (Rp)</label>
                <RupiahInput value={buyback.amount} onValueChange={v => setBuyback(p => ({ ...p, amount: v }))} style={inp} />
                {buyback.amount && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: ".75rem", margin: "4px 0 0" }}>{fmt(Number(buyback.amount))}</p>}
              </div>
            </>
          )}

          {/* Metode Bayar — semua tab */}
          {tab !== "simpanan" && (
            <div>
              <label style={{ color: "rgba(255,255,255,0.5)", fontSize: ".8rem", display: "block", marginBottom: 7 }}>Metode Pembayaran</label>
              <Select
                value={tab === "beli" ? beli.paymentMethod : buyback.paymentMethod}
                onChange={v => {
                  if (tab === "beli")    setBeli(p => ({ ...p, paymentMethod: v }));
                  if (tab === "buyback") setBuyback(p => ({ ...p, paymentMethod: v }));
                }}
                options={PAYMENT_METHODS}
              />
            </div>
          )}
          {tab === "simpanan" && (
            <div>
              <label style={{ color: "rgba(255,255,255,0.5)", fontSize: ".8rem", display: "block", marginBottom: 7 }}>Metode Pembayaran</label>
              <Select value={simpanan.paymentMethod} onChange={v => setSimpanan(p => ({ ...p, paymentMethod: v }))} options={PAYMENT_METHODS} />
            </div>
          )}

          {/* Catatan */}
          <div>
            <label style={{ color: "rgba(255,255,255,0.5)", fontSize: ".8rem", display: "block", marginBottom: 7 }}>Catatan (opsional)</label>
            <input
              value={tab === "beli" ? beli.notes : tab === "simpanan" ? simpanan.notes : buyback.notes}
              onChange={e => {
                const v = e.target.value;
                if (tab === "beli")     setBeli(p => ({ ...p, notes: v }));
                if (tab === "simpanan") setSimpanan(p => ({ ...p, notes: v }));
                if (tab === "buyback")  setBuyback(p => ({ ...p, notes: v }));
              }}
              style={inp} placeholder="Catatan tambahan (opsional)"
            />
          </div>

          {/* Submit */}
          <button onClick={handleSubmit} disabled={saving}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", borderRadius: 12, border: "none",
              background: saving ? "rgba(255,255,255,0.05)" : `linear-gradient(135deg,${activeTab.color},${activeTab.color}cc)`,
              color: saving ? "rgba(255,255,255,0.4)" : "#0a0a0a", fontWeight: 800, fontSize: ".95rem",
              cursor: saving ? "wait" : "pointer" }}>
            {saving ? "Menyimpan..." : <><Send style={{ width: 15, height: 15 }} /> Ajukan {activeTab.label}</>}
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
