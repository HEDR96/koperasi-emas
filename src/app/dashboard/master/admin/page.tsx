"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Plus, Search, Edit2, Trash2, CheckCircle, XCircle, X, Eye, EyeOff, Loader2, UserCheck, UserX, TrendingUp, ShoppingCart } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Admin {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  created_at: string;
}

interface MemberDetail {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  gold_grams: number;
  rupiah_balance: number;
  created_at: string;
  simpananPokok: number;
  simpananWajib: number;
  totalSimpanan: number;
  beliCount: number;
  buybackCount: number;
  totalGramBeli: number;
  cicilanAktif: number;
}

const ModalOverlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
    <div onClick={e => e.stopPropagation()}>{children}</div>
  </div>
);

export default function KelolaAdminPage() {
  const [admins, setAdmins]           = useState<Admin[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");

  // ── Tambah Modal ──
  const [showAdd, setShowAdd]         = useState(false);
  const [addForm, setAddForm]         = useState({ name:"", email:"", phone:"", password:"" });
  const [showPass, setShowPass]       = useState(false);
  const [addLoading, setAddLoading]   = useState(false);
  const [addError, setAddError]       = useState("");

  // ── Edit Modal ──
  const [editTarget, setEditTarget]   = useState<Admin | null>(null);
  const [editForm, setEditForm]       = useState({ name:"", phone:"", status:"active" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError]     = useState("");

  // ── Delete Confirm ──
  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Member Detail (view simpanan & transaksi) ──
  const [detailAdmin, setDetailAdmin]   = useState<MemberDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Load admins ──
  const loadAdmins = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase.from("profiles") as any)
      .select("id, name, phone, status, created_at")
      .eq("role", "admin")
      .order("created_at", { ascending: false });

    // Get emails from auth — we store them separately
    const ids = (data || []).map((a: Admin) => a.id);
    let emailMap: Record<string, string> = {};
    if (ids.length > 0) {
      const { data: authList } = await (supabase.from("profiles") as any)
        .select("id")
        .in("id", ids);
      void authList; // emails only accessible server-side; skip for now
    }
    void emailMap;

    setAdmins(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadAdmins(); }, [loadAdmins]);

  const filtered = admins.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.email || "").toLowerCase().includes(search.toLowerCase())
  );

  // ── Create Admin ──
  async function handleCreate() {
    setAddError("");
    if (!addForm.name || !addForm.email || !addForm.password) {
      setAddError("Nama, email, dan password wajib diisi."); return;
    }
    setAddLoading(true);
    const res = await fetch("/api/admin/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    const data = await res.json();
    setAddLoading(false);
    if (!res.ok) { setAddError(data.error || "Gagal membuat admin."); return; }
    setShowAdd(false);
    setAddForm({ name:"", email:"", phone:"", password:"" });
    loadAdmins();
  }

  // ── Edit Admin ──
  function openEdit(admin: Admin) {
    setEditTarget(admin);
    setEditForm({ name: admin.name, phone: admin.phone || "", status: admin.status });
    setEditError("");
  }

  async function handleEdit() {
    if (!editTarget) return;
    setEditError("");
    setEditLoading(true);
    const res = await fetch("/api/admin/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: editTarget.id, ...editForm }),
    });
    const data = await res.json();
    setEditLoading(false);
    if (!res.ok) { setEditError(data.error || "Gagal memperbarui."); return; }
    setEditTarget(null);
    loadAdmins();
  }

  // ── Delete Admin ──
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const res = await fetch("/api/admin/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: deleteTarget.id }),
    });
    setDeleteLoading(false);
    if (res.ok) { setDeleteTarget(null); loadAdmins(); }
  }

  // ── Toggle Status ──
  async function toggleStatus(admin: Admin) {
    const newStatus = admin.status === "active" ? "suspended" : "active";
    await fetch("/api/admin/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: admin.id, status: newStatus }),
    });
    loadAdmins();
  }

  // ── View Member Detail (simpanan, transaksi) ──
  async function openDetail(admin: Admin) {
    setDetailLoading(true);
    setDetailAdmin(null);

    const [savRes, txRes, instRes] = await Promise.all([
      (supabase.from("savings") as any).select("type, amount").eq("user_id", admin.id),
      (supabase.from("transactions") as any).select("type, grams").eq("user_id", admin.id),
      (supabase.from("installments") as any).select("id").eq("user_id", admin.id).eq("status", "active"),
    ]);

    const savings: { type: string; amount: number }[] = savRes.data || [];
    const txs: { type: string; grams: number }[] = txRes.data || [];
    const installs: unknown[] = instRes.data || [];

    const pokok = savings.filter(s => s.type === "pokok").reduce((acc, s) => acc + (s.amount || 0), 0);
    const wajib = savings.filter(s => s.type === "wajib").reduce((acc, s) => acc + (s.amount || 0), 0);
    const belis = txs.filter(t => t.type === "buy");
    const buybacks = txs.filter(t => t.type === "buyback");

    setDetailAdmin({
      ...admin,
      gold_grams: 0,
      rupiah_balance: 0,
      simpananPokok: pokok,
      simpananWajib: wajib,
      totalSimpanan: pokok + wajib,
      beliCount: belis.length,
      buybackCount: buybacks.length,
      totalGramBeli: belis.reduce((acc, t) => acc + (t.grams || 0), 0),
      cicilanAktif: installs.length,
    });
    setDetailLoading(false);
  }

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
  const fmtDate = (s: string) => new Date(s).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" });

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:16 }}>
        {[
          { label:"Total Admin", value: loading ? "…" : admins.length, color:"#D4AF37" },
          { label:"Aktif",       value: loading ? "…" : admins.filter(a=>a.status==="active").length, color:"#4ade80" },
          { label:"Nonaktif",    value: loading ? "…" : admins.filter(a=>a.status!=="active").length, color:"#f87171" },
        ].map(s => (
          <div key={s.label} style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:16, padding:"20px 18px", backdropFilter:"blur(12px)" }}>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem", marginBottom:6 }}>{s.label}</p>
            <p style={{ color:s.color, fontSize:"1.8rem", fontWeight:900 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24, backdropFilter:"blur(12px)" }}>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
          <h3 style={{ color:"#fff", fontWeight:700, fontSize:"1rem" }}>Daftar Admin</h3>
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"7px 12px" }}>
              <Search style={{ width:14, height:14, color:"rgba(255,255,255,0.3)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari admin..."
                style={{ background:"none", border:"none", outline:"none", color:"rgba(255,255,255,0.7)", fontSize:".82rem", width:160 }} />
            </div>
            <button className="btn-gold" onClick={() => { setShowAdd(true); setAddError(""); }}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px", borderRadius:10, border:"none", cursor:"pointer", fontSize:".82rem" }}>
              <Plus style={{ width:14, height:14 }} /> Tambah Admin
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:"center", padding:"40px 0", color:"rgba(255,255,255,0.3)" }}>
            <Loader2 style={{ width:28, height:28, animation:"spin 1s linear infinite", margin:"0 auto 10px" }} />
            <p style={{ fontSize:".85rem" }}>Memuat data admin...</p>
          </div>
        ) : admins.length === 0 ? (
          <div style={{ textAlign:"center", padding:"40px 0", color:"rgba(255,255,255,0.25)" }}>
            <Shield style={{ width:40, height:40, margin:"0 auto 12px", opacity:.3 }} />
            <p style={{ fontSize:".9rem" }}>Belum ada admin. Tambahkan admin pertama.</p>
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                  {["Admin","No. HP","Status","Bergabung","Aksi"].map(h => (
                    <th key={h} style={{ color:"rgba(255,255,255,0.35)", fontSize:".75rem", fontWeight:600, padding:"8px 12px", textAlign:"left", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <motion.tr key={a.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.04 }}
                    style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding:"14px 12px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div className="bg-gold-gradient" style={{ width:34, height:34, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#0a0a0a", fontSize:".8rem", flexShrink:0 }}>
                          {a.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p style={{ color:"#fff", fontSize:".83rem", fontWeight:600 }}>{a.name}</p>
                          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem", fontFamily:"monospace" }}>{a.id.slice(0,8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:"14px 12px", color:"rgba(255,255,255,0.5)", fontSize:".82rem" }}>{a.phone || "—"}</td>
                    <td style={{ padding:"14px 12px" }}>
                      <span style={{ background: a.status==="active"?"rgba(74,222,128,0.1)":"rgba(248,113,113,0.1)", color: a.status==="active"?"#4ade80":"#f87171", borderRadius:8, padding:"3px 10px", fontSize:".75rem", fontWeight:600, display:"inline-flex", alignItems:"center", gap:5 }}>
                        {a.status==="active" ? <CheckCircle style={{ width:11, height:11 }} /> : <XCircle style={{ width:11, height:11 }} />}
                        {a.status==="active" ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td style={{ padding:"14px 12px", color:"rgba(255,255,255,0.35)", fontSize:".78rem" }}>{fmtDate(a.created_at)}</td>
                    <td style={{ padding:"14px 12px" }}>
                      <div style={{ display:"flex", gap:6 }}>
                        {/* Detail */}
                        <button onClick={() => openDetail(a)} title="Lihat Detail"
                          style={{ width:30, height:30, borderRadius:8, background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.2)", color:"#D4AF37", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                          <Eye style={{ width:13, height:13 }} />
                        </button>
                        {/* Toggle Status */}
                        <button onClick={() => toggleStatus(a)} title={a.status==="active"?"Nonaktifkan":"Aktifkan"}
                          style={{ width:30, height:30, borderRadius:8, background: a.status==="active"?"rgba(248,113,113,0.08)":"rgba(74,222,128,0.08)", border:`1px solid ${a.status==="active"?"rgba(248,113,113,0.2)":"rgba(74,222,128,0.2)"}`, color: a.status==="active"?"#f87171":"#4ade80", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                          {a.status==="active" ? <UserX style={{ width:13, height:13 }} /> : <UserCheck style={{ width:13, height:13 }} />}
                        </button>
                        {/* Edit */}
                        <button onClick={() => openEdit(a)} title="Edit"
                          style={{ width:30, height:30, borderRadius:8, background:"rgba(96,165,250,0.08)", border:"1px solid rgba(96,165,250,0.2)", color:"#60a5fa", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                          <Edit2 style={{ width:13, height:13 }} />
                        </button>
                        {/* Delete */}
                        <button onClick={() => setDeleteTarget(a)} title="Hapus"
                          style={{ width:30, height:30, borderRadius:8, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", color:"#f87171", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                          <Trash2 style={{ width:13, height:13 }} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ── TAMBAH ADMIN MODAL ── */}
      <AnimatePresence>
        {showAdd && (
          <ModalOverlay onClose={() => setShowAdd(false)}>
            <motion.div initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:.95 }}
              style={{ background:"#0f0f0f", border:"1px solid rgba(212,175,55,0.25)", borderRadius:20, padding:28, width:"100%", maxWidth:480 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <h3 style={{ color:"#fff", fontWeight:800, fontSize:"1.1rem" }}>Tambah Admin Baru</h3>
                <button onClick={() => setShowAdd(false)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer" }}><X /></button>
              </div>
              {addError && (
                <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, padding:"10px 14px", color:"#f87171", fontSize:".82rem", marginBottom:14 }}>{addError}</div>
              )}
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {[
                  { label:"Nama Lengkap *", field:"name", placeholder:"Nama admin" },
                  { label:"Email *",        field:"email", placeholder:"admin@example.com" },
                  { label:"No. HP",         field:"phone", placeholder:"08xx-xxxx-xxxx" },
                ].map(({ label, field, placeholder }) => (
                  <div key={field}>
                    <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem", display:"block", marginBottom:6 }}>{label}</label>
                    <input className="input-gold" placeholder={placeholder}
                      value={(addForm as Record<string,string>)[field]}
                      onChange={e => setAddForm(f => ({ ...f, [field]: e.target.value }))}
                      style={{ borderRadius:10, padding:"10px 13px", fontSize:".85rem", width:"100%" }} />
                  </div>
                ))}
                <div>
                  <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem", display:"block", marginBottom:6 }}>Password *</label>
                  <div style={{ position:"relative" }}>
                    <input className="input-gold" type={showPass?"text":"password"} placeholder="Min. 8 karakter"
                      value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                      style={{ borderRadius:10, padding:"10px 40px 10px 13px", fontSize:".85rem", width:"100%" }} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(255,255,255,0.3)", cursor:"pointer" }}>
                      {showPass ? <EyeOff style={{ width:16, height:16 }} /> : <Eye style={{ width:16, height:16 }} />}
                    </button>
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:20 }}>
                <button className="btn-gold" onClick={handleCreate} disabled={addLoading}
                  style={{ flex:1, padding:"11px", borderRadius:12, border:"none", cursor: addLoading?"not-allowed":"pointer", fontSize:".88rem", opacity: addLoading?.6:1 }}>
                  {addLoading ? "Menyimpan..." : "Buat Admin"}
                </button>
                <button onClick={() => setShowAdd(false)} className="btn-outline-gold"
                  style={{ padding:"11px 20px", borderRadius:12, cursor:"pointer", fontSize:".88rem" }}>Batal</button>
              </div>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* ── EDIT MODAL ── */}
      <AnimatePresence>
        {editTarget && (
          <ModalOverlay onClose={() => setEditTarget(null)}>
            <motion.div initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:.95 }}
              style={{ background:"#0f0f0f", border:"1px solid rgba(96,165,250,0.25)", borderRadius:20, padding:28, width:"100%", maxWidth:420 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <h3 style={{ color:"#fff", fontWeight:800, fontSize:"1.1rem" }}>Edit Admin</h3>
                <button onClick={() => setEditTarget(null)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer" }}><X /></button>
              </div>
              {editError && (
                <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, padding:"10px 14px", color:"#f87171", fontSize:".82rem", marginBottom:14 }}>{editError}</div>
              )}
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div>
                  <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem", display:"block", marginBottom:6 }}>Nama</label>
                  <input className="input-gold" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    style={{ borderRadius:10, padding:"10px 13px", fontSize:".85rem", width:"100%" }} />
                </div>
                <div>
                  <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem", display:"block", marginBottom:6 }}>No. HP</label>
                  <input className="input-gold" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                    style={{ borderRadius:10, padding:"10px 13px", fontSize:".85rem", width:"100%" }} />
                </div>
                <div>
                  <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem", display:"block", marginBottom:6 }}>Status</label>
                  <select className="input-gold" value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                    style={{ borderRadius:10, padding:"10px 13px", fontSize:".85rem", width:"100%" }}>
                    <option value="active">Aktif</option>
                    <option value="suspended">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div style={{ display:"flex", gap:10, marginTop:20 }}>
                <button className="btn-gold" onClick={handleEdit} disabled={editLoading}
                  style={{ flex:1, padding:"11px", borderRadius:12, border:"none", cursor: editLoading?"not-allowed":"pointer", fontSize:".88rem" }}>
                  {editLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
                <button onClick={() => setEditTarget(null)} className="btn-outline-gold"
                  style={{ padding:"11px 20px", borderRadius:12, cursor:"pointer", fontSize:".88rem" }}>Batal</button>
              </div>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRM ── */}
      <AnimatePresence>
        {deleteTarget && (
          <ModalOverlay onClose={() => setDeleteTarget(null)}>
            <motion.div initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:.95 }}
              style={{ background:"#0f0f0f", border:"1px solid rgba(248,113,113,0.3)", borderRadius:20, padding:28, width:"100%", maxWidth:380, textAlign:"center" }}>
              <div style={{ width:52, height:52, borderRadius:14, background:"rgba(248,113,113,0.1)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                <Trash2 style={{ width:22, height:22, color:"#f87171" }} />
              </div>
              <h3 style={{ color:"#fff", fontWeight:800, fontSize:"1.05rem", marginBottom:8 }}>Hapus Admin?</h3>
              <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".85rem", marginBottom:22, lineHeight:1.6 }}>
                Akun <strong style={{ color:"#fff" }}>{deleteTarget.name}</strong> akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
              </p>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={handleDelete} disabled={deleteLoading}
                  style={{ flex:1, padding:"11px", borderRadius:12, background:"#ef4444", border:"none", color:"#fff", fontWeight:700, cursor: deleteLoading?"not-allowed":"pointer", fontSize:".88rem" }}>
                  {deleteLoading ? "Menghapus..." : "Ya, Hapus"}
                </button>
                <button onClick={() => setDeleteTarget(null)} className="btn-outline-gold"
                  style={{ flex:1, padding:"11px", borderRadius:12, cursor:"pointer", fontSize:".88rem" }}>Batal</button>
              </div>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* ── DETAIL MODAL (simpanan & transaksi) ── */}
      <AnimatePresence>
        {(detailLoading || detailAdmin) && (
          <ModalOverlay onClose={() => { setDetailAdmin(null); setDetailLoading(false); }}>
            <motion.div initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:.95 }}
              style={{ background:"#0f0f0f", border:"1px solid rgba(212,175,55,0.25)", borderRadius:20, padding:28, width:"100%", maxWidth:500, maxHeight:"85vh", overflowY:"auto" }}>
              {detailLoading ? (
                <div style={{ textAlign:"center", padding:"40px 0", color:"rgba(255,255,255,0.4)" }}>
                  <Loader2 style={{ width:30, height:30, animation:"spin 1s linear infinite", margin:"0 auto 12px" }} />
                  <p>Memuat detail...</p>
                </div>
              ) : detailAdmin && (
                <>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div className="bg-gold-gradient" style={{ width:44, height:44, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:"#0a0a0a", fontSize:"1rem", flexShrink:0 }}>
                        {detailAdmin.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p style={{ color:"#fff", fontWeight:700, fontSize:".95rem" }}>{detailAdmin.name}</p>
                        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".75rem" }}>{detailAdmin.phone || "—"}</p>
                      </div>
                    </div>
                    <button onClick={() => setDetailAdmin(null)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer" }}><X /></button>
                  </div>

                  {/* Simpanan */}
                  <div style={{ background:"rgba(212,175,55,0.05)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:14, padding:16, marginBottom:14 }}>
                    <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".78rem", textTransform:"uppercase", letterSpacing:".06em", marginBottom:12 }}>Simpanan</p>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                      {[
                        { label:"Pokok", value: fmt(detailAdmin.simpananPokok) },
                        { label:"Wajib", value: fmt(detailAdmin.simpananWajib) },
                        { label:"Total", value: fmt(detailAdmin.totalSimpanan) },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign:"center", background:"rgba(0,0,0,0.3)", borderRadius:10, padding:"10px 8px" }}>
                          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".7rem", marginBottom:4 }}>{s.label}</p>
                          <p style={{ color:"#D4AF37", fontWeight:800, fontSize:".8rem" }}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Transaksi Emas */}
                  <div style={{ background:"rgba(96,165,250,0.05)", border:"1px solid rgba(96,165,250,0.15)", borderRadius:14, padding:16, marginBottom:14 }}>
                    <p style={{ color:"#60a5fa", fontWeight:700, fontSize:".78rem", textTransform:"uppercase", letterSpacing:".06em", marginBottom:12 }}>Transaksi Emas</p>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                      {[
                        { label:"Beli", value: detailAdmin.beliCount + "x", icon: ShoppingCart },
                        { label:"Jual Kembali", value: detailAdmin.buybackCount + "x", icon: TrendingUp },
                        { label:"Total Gram", value: detailAdmin.totalGramBeli.toFixed(3) + " gr", icon: Shield },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign:"center", background:"rgba(0,0,0,0.3)", borderRadius:10, padding:"10px 8px" }}>
                          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".7rem", marginBottom:4 }}>{s.label}</p>
                          <p style={{ color:"#60a5fa", fontWeight:800, fontSize:".85rem" }}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cicilan */}
                  <div style={{ background:"rgba(74,222,128,0.05)", border:"1px solid rgba(74,222,128,0.15)", borderRadius:14, padding:16 }}>
                    <p style={{ color:"#4ade80", fontWeight:700, fontSize:".78rem", textTransform:"uppercase", letterSpacing:".06em", marginBottom:8 }}>Cicilan Aktif</p>
                    <p style={{ color:"#fff", fontSize:"1.6rem", fontWeight:900 }}>
                      {detailAdmin.cicilanAktif}
                      <span style={{ fontSize:".8rem", color:"rgba(255,255,255,0.4)", fontWeight:400, marginLeft:6 }}>cicilan berjalan</span>
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  );
}
