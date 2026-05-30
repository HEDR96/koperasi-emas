"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Coins, Save, RefreshCw, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

interface GoldPrice {
  id: number;
  buy_member: number;
  buy_non_member: number;
  buyback_member: number;
  buyback_non_member: number;
  change_amount: number;
  change_percent: number;
  trend: string;
  updated_by: string | null;
  created_at: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
  padding: "11px 14px", color: "#fff", fontSize: "1rem",
  outline: "none", boxSizing: "border-box", fontWeight: 600,
};

export default function HargaEmasPage() {
  const { user } = useAuthStore();
  const [current, setCurrent] = useState<GoldPrice | null>(null);
  const [history, setHistory]  = useState<GoldPrice[]>([]);
  const [loading, setLoading]  = useState(true);
  const [saving, setSaving]    = useState(false);
  const [saved, setSaved]      = useState(false);

  const [form, setForm] = useState({
    buy_member:       0,
    buy_non_member:   0,
    buyback_member:   0,
    buyback_non_member: 0,
    change_amount:    0,
    trend:            "stable" as "up" | "down" | "stable",
  });

  async function load() {
    setLoading(true);
    try {
      const { data } = await (supabase.from("gold_prices") as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (data?.length) {
        const latest = data[0] as GoldPrice;
        setCurrent(latest);
        setHistory(data.slice(1));
        setForm({
          buy_member:         latest.buy_member,
          buy_non_member:     latest.buy_non_member,
          buyback_member:     latest.buyback_member,
          buyback_non_member: latest.buyback_non_member,
          change_amount:      latest.change_amount,
          trend:              latest.trend as any,
        });
      }
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!form.buy_member || !form.buy_non_member) return;
    setSaving(true);
    try {
      const changePercent = current
        ? Number(((form.buy_member - current.buy_member) / current.buy_member * 100).toFixed(2))
        : 0;
      await (supabase.from("gold_prices") as any).insert({
        buy_member:         form.buy_member,
        buy_non_member:     form.buy_non_member,
        buyback_member:     form.buyback_member,
        buyback_non_member: form.buyback_non_member,
        change_amount:      form.change_amount,
        change_percent:     changePercent,
        trend:              form.trend,
        updated_by:         user?.id ?? null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      load();
    } catch {}
    setSaving(false);
  }

  const field = (key: keyof typeof form, label: string, sub: string) => (
    <div>
      <label style={{ color: "rgba(255,255,255,0.5)", fontSize: ".8rem", display: "block", marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", fontSize: ".88rem" }}>Rp</span>
        <input
          type="number" min={0}
          value={(form as any)[key] || ""}
          onChange={e => setForm(p => ({ ...p, [key]: Number(e.target.value) }))}
          style={{ ...inputStyle, paddingLeft: 34 }}
          placeholder="0"
        />
      </div>
      <p style={{ color: "rgba(255,255,255,0.25)", fontSize: ".72rem", marginTop: 4 }}>{sub}</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>Harga Emas</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: ".85rem", margin: "4px 0 0" }}>
            Atur harga jual &amp; buyback emas koperasi
          </p>
        </div>
        <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 10, padding: "8px 14px", color: "#D4AF37", cursor: "pointer", fontSize: ".85rem" }}>
          <RefreshCw style={{ width: 13, height: 13 }} /> Refresh
        </button>
      </div>

      {/* Current price cards */}
      {current && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14 }}>
          {[
            { label: "Harga Beli Member",       value: current.buy_member,         color: "#D4AF37" },
            { label: "Harga Beli Non-Member",   value: current.buy_non_member,     color: "#a78bfa" },
            { label: "Buyback Member",          value: current.buyback_member,     color: "#34d399" },
            { label: "Buyback Non-Member",      value: current.buyback_non_member, color: "#60a5fa" },
          ].map(c => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px 18px" }}>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: ".75rem", marginBottom: 8 }}>{c.label}</p>
              <p style={{ color: c.color, fontWeight: 900, fontSize: "1.2rem", margin: 0 }}>{fmt(c.value)}</p>
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: ".7rem", marginTop: 4 }}>per gram</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Update form */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 18, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(212,175,55,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Coins style={{ width: 18, height: 18, color: "#D4AF37" }} />
          </div>
          <div>
            <h2 style={{ color: "#fff", fontWeight: 700, fontSize: "1rem", margin: 0 }}>Update Harga Baru</h2>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: ".78rem", margin: 0 }}>Akan menimpa harga aktif saat ini</p>
          </div>
        </div>

        {loading ? (
          <p style={{ color: "rgba(255,255,255,0.3)" }}>Memuat harga...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Harga Beli */}
            <div>
              <p style={{ color: "#D4AF37", fontWeight: 700, fontSize: ".82rem", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>Harga Beli</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {field("buy_member",     "Member",     "Harga khusus anggota aktif")}
                {field("buy_non_member", "Non-Member", "Harga untuk umum")}
              </div>
            </div>

            {/* Buyback */}
            <div>
              <p style={{ color: "#34d399", fontWeight: 700, fontSize: ".82rem", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>Harga Buyback</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {field("buyback_member",     "Buyback Member",     "Koperasi beli kembali dari member")}
                {field("buyback_non_member", "Buyback Non-Member", "Koperasi beli dari umum")}
              </div>
            </div>

            {/* Perubahan & Tren */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: ".8rem", display: "block", marginBottom: 6 }}>Perubahan Harga (±)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", fontSize: ".88rem" }}>Rp</span>
                  <input type="number"
                    value={form.change_amount || ""}
                    onChange={e => setForm(p => ({ ...p, change_amount: Number(e.target.value) }))}
                    style={{ ...inputStyle, paddingLeft: 34 }} placeholder="0" />
                </div>
              </div>
              <div>
                <label style={{ color: "rgba(255,255,255,0.5)", fontSize: ".8rem", display: "block", marginBottom: 6 }}>Tren Harga</label>
                <select value={form.trend} onChange={e => setForm(p => ({ ...p, trend: e.target.value as any }))}
                  style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="up">⬆ Naik</option>
                  <option value="down">⬇ Turun</option>
                  <option value="stable">➡ Stabil</option>
                </select>
              </div>
            </div>

            <button onClick={handleSave} disabled={saving || !form.buy_member}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: saved ? "rgba(52,211,153,0.2)" : "linear-gradient(135deg,#D4AF37,#F5D060)", border: saved ? "1px solid #34d399" : "none", borderRadius: 12, padding: "13px", color: saved ? "#34d399" : "#0a0a0a", fontWeight: 700, fontSize: "1rem", cursor: saving || !form.buy_member ? "not-allowed" : "pointer", opacity: saving ? .7 : 1, transition: "all .3s", marginTop: 4 }}>
              {saving ? <><RefreshCw style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Menyimpan...</>
               : saved  ? "✓ Harga Diperbarui!"
               : <><Save style={{ width: 16, height: 16 }} /> Simpan Harga Baru</>}
            </button>
          </div>
        )}
      </motion.div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <h3 style={{ color: "rgba(255,255,255,0.5)", fontSize: ".8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 12 }}>
            Riwayat Perubahan Harga
          </h3>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {["Waktu", "Beli Member", "Non-Member", "Buyback", "Tren"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "rgba(255,255,255,0.3)", fontSize: ".73rem", fontWeight: 600, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={h.id} style={{ borderBottom: i < history.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.4)", fontSize: ".78rem" }}>
                        <Clock style={{ width: 11, height: 11 }} />
                        {new Date(h.created_at).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td style={{ padding: "10px 16px", color: "#D4AF37", fontSize: ".83rem", fontWeight: 600 }}>{fmt(h.buy_member)}</td>
                    <td style={{ padding: "10px 16px", color: "rgba(255,255,255,0.5)", fontSize: ".83rem" }}>{fmt(h.buy_non_member)}</td>
                    <td style={{ padding: "10px 16px", color: "#34d399", fontSize: ".83rem" }}>{fmt(h.buyback_member)}</td>
                    <td style={{ padding: "10px 16px" }}>
                      {h.trend === "up"     && <span style={{ color: "#34d399", fontSize: ".78rem" }}>⬆ Naik</span>}
                      {h.trend === "down"   && <span style={{ color: "#f87171", fontSize: ".78rem" }}>⬇ Turun</span>}
                      {h.trend === "stable" && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: ".78rem" }}>➡ Stabil</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
