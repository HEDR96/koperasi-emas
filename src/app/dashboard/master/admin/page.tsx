"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RefreshCw, UserPlus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface AdminRow {
  id: string;
  name: string;
  phone: string | null;
  status: string;
  created_at: string;
  permissions?: {
    can_approve_transactions: boolean;
    can_input_transactions: boolean;
    can_manage_members: boolean;
    can_manage_promos: boolean;
    can_view_reports: boolean;
  } | null;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  can_approve_transactions: boolean;
  can_input_transactions: boolean;
  can_manage_members: boolean;
  can_manage_promos: boolean;
  can_view_reports: boolean;
}

const PERM_LABELS: { key: keyof FormData; label: string }[] = [
  { key: "can_approve_transactions", label: "Approve Transaksi" },
  { key: "can_input_transactions",   label: "Input Transaksi" },
  { key: "can_manage_members",       label: "Kelola Member" },
  { key: "can_manage_promos",        label: "Kelola Promo" },
  { key: "can_view_reports",         label: "Lihat Laporan" },
];

const DEFAULT_FORM: FormData = {
  name: "", email: "", password: "", phone: "",
  can_approve_transactions: true,
  can_input_transactions: true,
  can_manage_members: true,
  can_manage_promos: false,
  can_view_reports: false,
};

function getEmail(admin: AdminRow) {
  // email stored in auth, not profiles — show placeholder
  return "—";
}

export default function AdminManagementPage() {
  const [admins, setAdmins]       = useState<AdminRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState<FormData>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data } = await (supabase.from("profiles") as any)
        .select("id,name,phone,status,created_at")
        .eq("role", "admin")
        .order("created_at", { ascending: false });

      const adminList: AdminRow[] = data ?? [];

      // Try to fetch permissions (table may not exist)
      try {
        const ids = adminList.map(a => a.id);
        if (ids.length > 0) {
          const { data: perms } = await (supabase.from("admin_permissions") as any)
            .select("*")
            .in("admin_id", ids);
          if (perms) {
            const permMap: Record<string, any> = {};
            (perms as any[]).forEach(p => { permMap[p.admin_id] = p; });
            adminList.forEach(a => { a.permissions = permMap[a.id] ?? null; });
          }
        }
      } catch { /* table not yet created */ }

      setAdmins(adminList);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.name || !form.email || !form.password) {
      setError("Nama, email, dan password wajib diisi."); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/register-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, email: form.email, password: form.password,
          phone: form.phone, role: "admin",
          permissions: {
            can_approve_transactions: form.can_approve_transactions,
            can_input_transactions:   form.can_input_transactions,
            can_manage_members:       form.can_manage_members,
            can_manage_promos:        form.can_manage_promos,
            can_view_reports:         form.can_view_reports,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) { setError(json.error || "Gagal mendaftar admin."); }
      else {
        setSuccess("Admin berhasil didaftarkan!");
        setForm(DEFAULT_FORM);
        setTimeout(() => { setShowModal(false); setSuccess(""); load(); }, 1200);
      }
    } catch { setError("Terjadi kesalahan jaringan."); }
    setSubmitting(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Hapus admin "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const res = await fetch("/api/admin/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      if (res.ok) load();
    } catch { /* ignore */ }
  }

  async function toggleStatus(admin: AdminRow) {
    const newStatus = admin.status === "active" ? "suspended" : "active";
    await (supabase.from("profiles") as any).update({ status: newStatus }).eq("id", admin.id);
    load();
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: ".9rem", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>Kelola Admin</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: ".85rem", margin: "4px 0 0" }}>
            Daftar seluruh admin aktif beserta hak akses mereka.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={load}
            style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
            <RefreshCw style={{ width:14, height:14 }} /> Refresh
          </button>
          <button onClick={() => { setShowModal(true); setError(""); setSuccess(""); setForm(DEFAULT_FORM); }}
            style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.15)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:10, padding:"8px 16px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem", fontWeight:600 }}>
            <UserPlus style={{ width:14, height:14 }} /> Daftar Admin Baru
          </button>
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
        style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                {["Nama","HP","Status","Permissions","Aksi"].map(h => (
                  <th key={h} style={{ padding:"13px 18px", textAlign:"left", color:"rgba(255,255,255,0.3)", fontSize:".75rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".05em", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding:"40px", textAlign:"center", color:"rgba(255,255,255,0.3)" }}>Memuat...</td></tr>
              ) : admins.length === 0 ? (
                <tr><td colSpan={5} style={{ padding:"40px", textAlign:"center", color:"rgba(255,255,255,0.3)" }}>Belum ada admin terdaftar.</td></tr>
              ) : admins.map(a => (
                <tr key={a.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.02)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background="transparent"}
                >
                  <td style={{ padding:"13px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:34, height:34, borderRadius:9, background:"rgba(212,175,55,0.15)", display:"flex", alignItems:"center", justifyContent:"center", color:"#D4AF37", fontWeight:700, fontSize:".9rem", flexShrink:0 }}>
                        {a.name?.[0] || "A"}
                      </div>
                      <span style={{ color:"#fff", fontWeight:600, fontSize:".9rem" }}>{a.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:"13px 18px", color:"rgba(255,255,255,0.55)", fontSize:".85rem" }}>{a.phone || "—"}</td>
                  <td style={{ padding:"13px 18px" }}>
                    <span style={{
                      background: a.status === "active" ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)",
                      color: a.status === "active" ? "#34d399" : "#f87171",
                      borderRadius:6, padding:"3px 10px", fontSize:".75rem", fontWeight:600, textTransform:"capitalize",
                    }}>{a.status}</span>
                  </td>
                  <td style={{ padding:"13px 18px" }}>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                      {a.permissions ? (
                        <>
                          {a.permissions.can_approve_transactions && <Badge label="Approve" />}
                          {a.permissions.can_input_transactions    && <Badge label="Input Tx" />}
                          {a.permissions.can_manage_members        && <Badge label="Member" />}
                          {a.permissions.can_manage_promos         && <Badge label="Promo" />}
                          {a.permissions.can_view_reports          && <Badge label="Laporan" />}
                        </>
                      ) : <span style={{ color:"rgba(255,255,255,0.25)", fontSize:".75rem" }}>—</span>}
                    </div>
                  </td>
                  <td style={{ padding:"13px 18px" }}>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={() => toggleStatus(a)}
                        style={{ background: a.status === "active" ? "rgba(248,113,113,0.1)" : "rgba(52,211,153,0.1)", border:`1px solid ${a.status==="active"?"rgba(248,113,113,0.25)":"rgba(52,211,153,0.25)"}`, borderRadius:8, padding:"5px 12px", color: a.status==="active" ? "#f87171" : "#34d399", cursor:"pointer", fontSize:".78rem", fontWeight:600 }}>
                        {a.status === "active" ? "Suspend" : "Aktifkan"}
                      </button>
                      <button onClick={() => handleDelete(a.id, a.name)}
                        style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:8, padding:"5px 10px", color:"#f87171", cursor:"pointer" }}>
                        <Trash2 style={{ width:13, height:13 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={() => setShowModal(false)}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
            <motion.div onClick={e => e.stopPropagation()}
              initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:.95 }}
              style={{ width:"min(480px,94vw)", background:"#111", border:"1px solid rgba(212,175,55,0.2)", borderRadius:20, padding:28, maxHeight:"90vh", overflowY:"auto" }}
            >
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22 }}>
                <h2 style={{ color:"#fff", fontWeight:700, fontSize:"1.1rem", margin:0 }}>Daftar Admin Baru</h2>
                <button onClick={() => setShowModal(false)}
                  style={{ background:"rgba(255,255,255,0.07)", border:"none", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.5)", cursor:"pointer" }}>
                  <X style={{ width:15, height:15 }} />
                </button>
              </div>
              <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div>
                  <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:6 }}>Nama Lengkap *</label>
                  <input value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} placeholder="Budi Santoso" style={inputStyle} />
                </div>
                <div>
                  <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:6 }}>Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email:e.target.value}))} placeholder="admin@koperasi.com" style={inputStyle} />
                </div>
                <div>
                  <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:6 }}>Password *</label>
                  <input type="password" value={form.password} onChange={e => setForm(f => ({...f, password:e.target.value}))} placeholder="Min. 8 karakter" style={inputStyle} />
                </div>
                <div>
                  <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:6 }}>Nomor HP</label>
                  <input value={form.phone} onChange={e => setForm(f => ({...f, phone:e.target.value}))} placeholder="08123456789" style={inputStyle} />
                </div>
                <div>
                  <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:10 }}>Hak Akses</label>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {PERM_LABELS.map(p => (
                      <label key={p.key} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                        <input type="checkbox" checked={!!form[p.key]} onChange={e => setForm(f => ({...f, [p.key]:e.target.checked}))}
                          style={{ width:16, height:16, accentColor:"#D4AF37" }} />
                        <span style={{ color:"rgba(255,255,255,0.7)", fontSize:".88rem" }}>{p.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {error   && <p style={{ color:"#f87171", fontSize:".83rem", margin:0 }}>{error}</p>}
                {success && <p style={{ color:"#34d399", fontSize:".83rem", margin:0 }}>{success}</p>}
                <button type="submit" disabled={submitting}
                  style={{ background:"linear-gradient(135deg,#D4AF37,#f0d060)", border:"none", borderRadius:12, padding:"12px", color:"#0a0a0a", fontWeight:700, fontSize:".95rem", cursor:submitting?"not-allowed":"pointer", opacity:submitting?.7:1, marginTop:6 }}>
                  {submitting ? "Mendaftarkan..." : "Daftar Admin"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span style={{ background:"rgba(212,175,55,0.12)", color:"#D4AF37", borderRadius:5, padding:"2px 8px", fontSize:".72rem", fontWeight:600 }}>
      {label}
    </span>
  );
}
