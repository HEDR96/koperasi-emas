"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, RefreshCw, KeyRound, Copy, Check } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { supabase } from "@/lib/supabase";

interface AccountRow {
  id: string;
  name: string;
  email: string | null;
  role: string;
  status: string;
  phone: string | null;
  created_at: string;
}

const ROLE_LABEL: Record<string, string> = { master: "Master", admin: "Admin", member: "Anggota" };
const ROLE_COLOR: Record<string, string> = { master: "#a78bfa", admin: "#8B6010", member: "#065f46" };
const STATUS_COLOR: Record<string, string> = { active: "#34d399", pending: "#fbbf24", suspended: "#f87171", rejected: "#fb923c" };
const STATUS_BG: Record<string, string> = { active: "rgba(6,95,70,0.09)", pending: "rgba(251,191,36,0.12)", suspended: "rgba(153,27,27,0.09)", rejected: "rgba(251,146,60,0.12)" };

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 12; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function KelolaAkunPage() {
  const { user } = useAuthStore();
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [filtered, setFiltered] = useState<AccountRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pwTarget, setPwTarget] = useState<AccountRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);

  async function load() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/master/accounts", {
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      });
      const json = await res.json();
      if (res.ok) {
        setAccounts(json.accounts ?? []);
        setFiltered(json.accounts ?? []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, [user?.id]);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    if (!q) { setFiltered(accounts); return; }
    setFiltered(accounts.filter(a =>
      [a.name, a.email, a.phone, a.role, a.status].some(v => (v || "").toLowerCase().includes(q))
    ));
  }, [search, accounts]);

  function openPwModal(a: AccountRow) {
    setPwTarget(a);
    setNewPassword("");
    setShowPw(false);
    setError("");
    setSuccess("");
    setCopied(false);
  }

  async function submitPassword() {
    if (!pwTarget || !user?.id) return;
    if (newPassword.length < 8) { setError("Password minimal 8 karakter."); return; }
    setSaving(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/master/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ userId: pwTarget.id, newPassword }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error || "Gagal mengubah password.");
      } else {
        setSuccess("Password berhasil diubah.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    }
    setSaving(false);
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.72)", border: "1px solid rgba(201,162,39,0.2)",
    borderRadius: 10, padding: "10px 14px", color: "#2D1B00", fontSize: ".9rem", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "#2D1B00", fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>Kelola Akun</h1>
          <p style={{ color: "rgba(101,67,14,0.45)", fontSize: ".85rem", margin: "4px 0 0" }}>
            Nama &amp; email seluruh akun (master, admin, anggota) — reset password bila diperlukan.
          </p>
        </div>
        <button onClick={load}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 10, padding: "8px 14px", color: "#8B6010", cursor: "pointer", fontSize: ".85rem" }}>
          <RefreshCw style={{ width: 14, height: 14 }} /> Refresh
        </button>
      </div>

      <div style={{ position: "relative", maxWidth: 400 }}>
        <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "rgba(101,67,14,0.35)" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, email, HP, role, atau status..."
          style={{ width: "100%", background: "rgba(255,255,255,0.72)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, padding: "10px 14px 10px 38px", color: "#2D1B00", fontSize: ".88rem", outline: "none", boxSizing: "border-box" }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: "rgba(255,255,255,0.72)", border: "1px solid rgba(201,162,39,0.15)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(201,162,39,0.12)" }}>
                {["Nama", "Email", "Role", "Status", "Bergabung", "Aksi"].map(h => (
                  <th key={h} style={{ padding: "12px 18px", textAlign: "left", color: "rgba(101,67,14,0.35)", fontSize: ".75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "rgba(101,67,14,0.35)" }}>Memuat...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "rgba(101,67,14,0.35)" }}>Tidak ada akun{search ? " yang cocok" : ""}.</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} style={{ borderBottom: "1px solid rgba(201,162,39,0.1)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(201,162,39,0.04)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <td style={{ padding: "13px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(212,175,55,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8B6010", fontWeight: 700, fontSize: ".85rem", flexShrink: 0 }}>
                        {a.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span style={{ color: "#2D1B00", fontWeight: 600, fontSize: ".88rem" }}>{a.name || "—"}</span>
                    </div>
                  </td>
                  <td style={{ padding: "13px 18px", color: "rgba(101,67,14,0.7)", fontSize: ".83rem" }}>{a.email || "—"}</td>
                  <td style={{ padding: "13px 18px" }}>
                    <span style={{ color: ROLE_COLOR[a.role] || "#8B6010", fontWeight: 600, fontSize: ".82rem" }}>{ROLE_LABEL[a.role] || a.role}</span>
                  </td>
                  <td style={{ padding: "13px 18px" }}>
                    <span style={{ background: STATUS_BG[a.status] || "rgba(201,162,39,0.15)", color: STATUS_COLOR[a.status] || "#fff", borderRadius: 6, padding: "3px 10px", fontSize: ".75rem", fontWeight: 600, textTransform: "capitalize" }}>
                      {a.status}
                    </span>
                  </td>
                  <td style={{ padding: "13px 18px", color: "rgba(101,67,14,0.55)", fontSize: ".83rem" }}>{fmtDate(a.created_at)}</td>
                  <td style={{ padding: "13px 18px" }}>
                    <button onClick={() => openPwModal(a)}
                      style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(29,78,216,0.08)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 8, padding: "5px 10px", color: "#1d4ed8", cursor: "pointer", fontSize: ".78rem", fontWeight: 600 }}>
                      <KeyRound style={{ width: 12, height: 12 }} /> Ubah Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {pwTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !saving && setPwTarget(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <motion.div onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .95 }}
              style={{ width: "min(420px,94vw)", background: "#FFFDF4", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 20, padding: 26 }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div>
                  <h2 style={{ color: "#2D1B00", fontWeight: 700, fontSize: "1.05rem", margin: 0 }}>Ubah Password</h2>
                  <p style={{ color: "rgba(101,67,14,0.5)", fontSize: ".8rem", margin: "4px 0 0" }}>{pwTarget.name} · {pwTarget.email}</p>
                </div>
                <button onClick={() => !saving && setPwTarget(null)}
                  style={{ background: "rgba(255,255,255,0.72)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(101,67,14,0.55)", cursor: "pointer" }}>
                  <X style={{ width: 15, height: 15 }} />
                </button>
              </div>

              {!success ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ color: "rgba(101,67,14,0.55)", fontSize: ".8rem", display: "block", marginBottom: 6 }}>Password Baru</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input type={showPw ? "text" : "password"} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        placeholder="Min. 8 karakter" style={inputStyle} />
                      <button type="button" onClick={() => setShowPw(s => !s)}
                        style={{ background: "rgba(255,255,255,0.72)", border: "1px solid rgba(201,162,39,0.2)", borderRadius: 10, padding: "0 12px", color: "#8B6010", cursor: "pointer", fontSize: ".78rem", whiteSpace: "nowrap" }}>
                        {showPw ? "Sembunyikan" : "Lihat"}
                      </button>
                    </div>
                  </div>
                  <button type="button" onClick={() => setNewPassword(randomPassword())}
                    style={{ alignSelf: "flex-start", background: "none", border: "none", color: "#8B6010", cursor: "pointer", fontSize: ".78rem", padding: 0, textDecoration: "underline" }}>
                    Buatkan password acak
                  </button>
                  {error && <p style={{ color: "#991b1b", fontSize: ".83rem", margin: 0 }}>{error}</p>}
                  <button onClick={submitPassword} disabled={saving}
                    style={{ background: "linear-gradient(135deg,#D4AF37,#f0d060)", border: "none", borderRadius: 12, padding: "12px", color: "#0a0a0a", fontWeight: 700, fontSize: ".95rem", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? .7 : 1, marginTop: 4 }}>
                    {saving ? "Menyimpan..." : "Simpan Password Baru"}
                  </button>
                  <p style={{ color: "rgba(101,67,14,0.4)", fontSize: ".72rem", margin: 0 }}>
                    Password lama tidak bisa dilihat — sistem hanya bisa mengganti dengan yang baru.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <p style={{ color: "#065f46", fontSize: ".85rem", margin: 0 }}>{success}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.72)", border: "1px solid rgba(201,162,39,0.2)", borderRadius: 10, padding: "10px 14px" }}>
                    <code style={{ color: "#2D1B00", fontSize: ".9rem", flex: 1, wordBreak: "break-all" }}>{newPassword}</code>
                    <button onClick={() => { navigator.clipboard.writeText(newPassword); setCopied(true); }}
                      style={{ background: "none", border: "none", color: "#8B6010", cursor: "pointer" }}>
                      {copied ? <Check style={{ width: 16, height: 16 }} /> : <Copy style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                  <p style={{ color: "rgba(101,67,14,0.45)", fontSize: ".75rem", margin: 0 }}>
                    Sampaikan password baru ini ke pemilik akun secara pribadi/aman.
                  </p>
                  <button onClick={() => setPwTarget(null)}
                    style={{ background: "rgba(255,255,255,0.72)", border: "1px solid rgba(201,162,39,0.2)", borderRadius: 12, padding: "11px", color: "rgba(101,67,14,0.7)", cursor: "pointer", fontSize: ".9rem" }}>
                    Tutup
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
