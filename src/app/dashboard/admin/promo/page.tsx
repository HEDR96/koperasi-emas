"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, Plus, Eye, EyeOff, Trash2, ImageOff,
  Pencil, X, Tag, Clock, Coins, Sparkles, CheckCircle2,
  ToggleLeft, ToggleRight, Zap,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { gdriveImage } from "@/lib/utils";
import RupiahInput from "@/components/ui/RupiahInput";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const fmtExp = (s: string | null) =>
  s
    ? new Date(s).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Tidak ada";

const G  = "#D4AF37";
const G2 = "#F5D060";

const field: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
  padding: "11px 14px", color: "#fff", fontSize: ".88rem",
  outline: "none", boxSizing: "border-box",
};
const label: React.CSSProperties = {
  color: "rgba(255,255,255,0.38)", fontSize: ".7rem",
  fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
  display: "block", marginBottom: 5,
};

const EMPTY = { title: "", description: "", image_url: "", gram_weight: "", price: "", expired_at: "", category: "emas" };

/* ────────────────────────────────────────────────────────────── */
export default function AdminPromoPage() {
  const { user }  = useAuthStore();
  const isMaster  = user?.role === "master";

  const [promos, setPromos]       = useState<any[]>([]);
  const [form, setForm]           = useState(EMPTY);
  const [editId, setEditId]       = useState<string | null>(null);
  const [modal, setModal]         = useState(false);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState("");

  async function load() {
    setLoading(true);
    const { data } = await (supabase.from("promos") as any)
      .select("*").order("created_at", { ascending: false });
    setPromos(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setEditId(null); setForm(EMPTY); setErr(""); setModal(true);
  }
  function openEdit(p: any) {
    setEditId(p.id);
    setForm({
      title: p.title ?? "", description: p.description ?? "",
      image_url: p.image_url ?? "",
      gram_weight: p.gram_weight != null ? String(p.gram_weight) : "",
      price: p.price != null ? String(p.price) : "",
      expired_at: p.expired_at ? new Date(p.expired_at).toISOString().slice(0, 16) : "",
      category: p.gram_weight != null ? "emas" : "lain-lain",
    });
    setErr(""); setModal(true);
  }
  function closeModal() { setModal(false); setEditId(null); setForm(EMPTY); setErr(""); }

  async function save() {
    if (!form.title) { setErr("Nama promo wajib diisi."); return; }
    setSaving(true); setErr("");
    const payload = {
      title: form.title, description: form.description || null,
      image_url: form.image_url || null,
      gram_weight: form.category === "emas" && form.gram_weight ? Number(form.gram_weight) : null,
      price: form.price ? Number(form.price) : null,
      expired_at: form.expired_at ? new Date(form.expired_at).toISOString() : null,
    };
    const t = supabase.from("promos") as any;
    const { error: e } = editId
      ? await t.update(payload).eq("id", editId)
      : await t.insert({ ...payload, discount_percent: 0, is_active: true });
    if (e) { setErr(e.message); setSaving(false); return; }
    closeModal(); load(); setSaving(false);
  }

  async function toggle(p: any) {
    await (supabase.from("promos") as any).update({ is_active: !p.is_active }).eq("id", p.id);
    load();
  }
  async function remove(id: string) {
    if (!confirm("Hapus promo ini?")) return;
    await (supabase.from("promos") as any).delete().eq("id", id);
    load();
  }

  const total  = promos.length;
  const aktif  = promos.filter(p => p.is_active).length;
  const nonAkt = total - aktif;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1020 }}>

      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: "1.4rem", fontWeight: 800, margin: 0, letterSpacing: "-.02em" }}>Kelola Promo</h1>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: ".82rem", margin: "3px 0 0" }}>
            Promo yang tampil di halaman utama
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} style={{ width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
            <RefreshCw style={{ width: 14, height: 14 }} />
          </button>
          <button onClick={openNew} style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 18px", height: 38, background: `linear-gradient(135deg,${G},${G2})`, border: "none", borderRadius: 10, color: "#0a0a0a", cursor: "pointer", fontSize: ".85rem", fontWeight: 800 }}>
            <Plus style={{ width: 14, height: 14 }} /> Tambah Promo
          </button>
        </div>
      </div>

      {/* ── STAT STRIP ──────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {[
          { label: "Total Promo", value: total,  icon: <Sparkles style={{ width: 15, height: 15 }} />, color: "rgba(212,175,55,0.8)"  },
          { label: "Aktif",       value: aktif,  icon: <CheckCircle2 style={{ width: 15, height: 15 }} />, color: "#34d399" },
          { label: "Nonaktif",    value: nonAkt, icon: <ToggleLeft style={{ width: 15, height: 15 }} />,   color: "rgba(255,255,255,0.25)" },
        ].map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: s.color, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <p style={{ color: s.color, fontSize: "1.25rem", fontWeight: 800, margin: 0, lineHeight: 1 }}>{s.value}</p>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: ".72rem", margin: "3px 0 0" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── PROMO LIST ──────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 72, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }} />
          ))}
        </div>
      ) : promos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 20px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 16 }}>
          <Zap style={{ width: 28, height: 28, color: "rgba(212,175,55,0.25)", margin: "0 auto 10px" }} />
          <p style={{ color: "rgba(255,255,255,0.25)", margin: 0, fontSize: ".88rem" }}>Belum ada promo — klik "Tambah Promo" untuk mulai</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {promos.map((p, i) => {
            const src = gdriveImage(p.image_url);
            return (
              <motion.div key={p.id} layout
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * .04 }}
                style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${p.is_active ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.06)"}`, borderRadius: 14, padding: "12px 16px", transition: "border-color .2s" }}>

                {/* thumbnail */}
                <div style={{ width: 54, height: 54, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "rgba(212,175,55,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {p.image_url
                    ? <img src={src} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    : <ImageOff style={{ width: 18, height: 18, color: "rgba(255,255,255,0.15)" }} />}
                </div>

                {/* info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <p style={{ color: "#fff", fontWeight: 700, fontSize: ".9rem", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</p>
                    <span style={{ flexShrink: 0, fontSize: ".66rem", fontWeight: 700, borderRadius: 20, padding: "2px 8px", background: p.is_active ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.05)", color: p.is_active ? "#34d399" : "rgba(255,255,255,0.25)", border: `1px solid ${p.is_active ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.08)"}` }}>
                      {p.is_active ? "AKTIF" : "NONAKTIF"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {p.gram_weight != null && (
                      <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: ".72rem", color: G, background: "rgba(212,175,55,0.08)", borderRadius: 5, padding: "2px 8px", fontWeight: 600 }}>
                        <Coins style={{ width: 9, height: 9 }} />{p.gram_weight} gram
                      </span>
                    )}
                    {p.price != null && (
                      <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: ".72rem", color: "#34d399", background: "rgba(52,211,153,0.08)", borderRadius: 5, padding: "2px 8px", fontWeight: 600 }}>
                        <Tag style={{ width: 9, height: 9 }} />{fmt(p.price)}
                      </span>
                    )}
                    {p.gram_weight == null && (
                      <span style={{ fontSize: ".72rem", color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.04)", borderRadius: 5, padding: "2px 8px" }}>
                        Lain-lain
                      </span>
                    )}
                    <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: ".7rem", color: "rgba(255,255,255,0.25)", padding: "2px 0" }}>
                      <Clock style={{ width: 9, height: 9 }} />{fmtExp(p.expired_at)}
                    </span>
                  </div>
                </div>

                {/* actions */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => openEdit(p)} title="Edit"
                    style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.18)", borderRadius: 8, color: G, cursor: "pointer" }}>
                    <Pencil style={{ width: 13, height: 13 }} />
                  </button>
                  <button onClick={() => toggle(p)} title={p.is_active ? "Nonaktifkan" : "Aktifkan"}
                    style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: p.is_active ? "rgba(52,211,153,0.07)" : "rgba(255,255,255,0.04)", border: `1px solid ${p.is_active ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.1)"}`, borderRadius: 8, color: p.is_active ? "#34d399" : "rgba(255,255,255,0.3)", cursor: "pointer" }}>
                    {p.is_active ? <ToggleRight style={{ width: 14, height: 14 }} /> : <ToggleLeft style={{ width: 14, height: 14 }} />}
                  </button>
                  {isMaster && (
                    <button onClick={() => remove(p.id)} title="Hapus"
                      style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 8, color: "#f87171", cursor: "pointer" }}>
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── MODAL ───────────────────────────────────────────── */}
      <AnimatePresence>
        {modal && (
          <>
            {/* backdrop */}
            <motion.div onClick={closeModal}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", zIndex: 50 }} />

            {/* panel */}
            <motion.div
              initial={{ opacity: 0, scale: .95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: .95, y: 16 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "min(540px, 92vw)", maxHeight: "88vh", overflowY: "auto", background: "#111", border: `1px solid ${editId ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 20, zIndex: 51, boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>

              {/* modal header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: editId ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {editId ? <Pencil style={{ width: 14, height: 14, color: G }} /> : <Plus style={{ width: 14, height: 14, color: "rgba(255,255,255,0.5)" }} />}
                  </div>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: ".95rem" }}>
                    {editId ? "Edit Promo" : "Promo Baru"}
                  </span>
                </div>
                <button onClick={closeModal} style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>

              <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>

                {/* error */}
                {err && (
                  <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: ".82rem" }}>
                    {err}
                  </div>
                )}

                {/* kategori */}
                <div>
                  <label style={label}>Kategori</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {(["emas", "lain-lain"] as const).map(cat => (
                      <button key={cat}
                        onClick={() => setForm(p => ({ ...p, category: cat, gram_weight: cat === "lain-lain" ? "" : p.gram_weight }))}
                        style={{ padding: "11px", borderRadius: 10, cursor: "pointer", fontSize: ".85rem", fontWeight: 600, transition: "all .15s", border: `1px solid ${form.category === cat ? "rgba(212,175,55,0.45)" : "rgba(255,255,255,0.08)"}`, background: form.category === cat ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.03)", color: form.category === cat ? G : "rgba(255,255,255,0.35)" }}>
                        {cat === "emas" ? "🪙  Emas" : "🏷️  Lain-lain"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* nama */}
                <div>
                  <label style={label}>Nama Promo *</label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    style={field} placeholder="cth: Emas 5gr Spesial Lebaran" />
                </div>

                {/* gram (conditional) + harga */}
                <div style={{ display: "grid", gridTemplateColumns: form.category === "emas" ? "1fr 1fr" : "1fr", gap: 12 }}>
                  <AnimatePresence>
                    {form.category === "emas" && (
                      <motion.div key="gram" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <label style={label}>Berat (gram)</label>
                        <input type="number" min={0} step={0.01} value={form.gram_weight}
                          onChange={e => setForm(p => ({ ...p, gram_weight: e.target.value }))}
                          style={field} placeholder="5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div>
                    <label style={label}>Harga (Rp)</label>
                    <RupiahInput value={form.price} onValueChange={v => setForm(p => ({ ...p, price: v }))}
                      style={field} placeholder="8.000.000" />
                  </div>
                </div>

                {/* kadaluarsa */}
                <div>
                  <label style={label}>Kadaluarsa (tanggal & jam)</label>
                  <input type="datetime-local" value={form.expired_at}
                    onChange={e => setForm(p => ({ ...p, expired_at: e.target.value }))} style={field} />
                </div>

                {/* gambar */}
                <div>
                  <label style={label}>Link Gambar (Google Drive)</label>
                  <input value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))}
                    style={field} placeholder="https://drive.google.com/file/d/…/view" />
                  {form.image_url && (
                    <div style={{ marginTop: 8, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", maxHeight: 140 }}>
                      <img src={gdriveImage(form.image_url)} alt="Preview"
                        style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  )}
                </div>

                {/* deskripsi */}
                <div>
                  <label style={label}>Deskripsi (opsional)</label>
                  <textarea rows={2} value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    style={{ ...field, resize: "vertical", fontFamily: "inherit" }}
                    placeholder="Keterangan tambahan…" />
                </div>

                {/* submit */}
                <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                  <button onClick={save} disabled={saving || !form.title}
                    style={{ flex: 1, padding: "12px", borderRadius: 11, background: `linear-gradient(135deg,${G},${G2})`, border: "none", color: "#0a0a0a", fontWeight: 800, fontSize: ".88rem", cursor: saving || !form.title ? "not-allowed" : "pointer", opacity: saving ? .6 : 1 }}>
                    {saving ? "Menyimpan…" : editId ? "Update Promo" : "Simpan Promo"}
                  </button>
                  <button onClick={closeModal}
                    style={{ padding: "12px 18px", borderRadius: 11, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: ".85rem" }}>
                    Batal
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
