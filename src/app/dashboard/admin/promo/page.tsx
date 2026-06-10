"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, Plus, Eye, EyeOff, Trash2, ImageOff,
  Pencil, X, Tag, Clock, Coins, ChevronRight, Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { gdriveImage } from "@/lib/utils";
import RupiahInput from "@/components/ui/RupiahInput";

/* ─── helpers ──────────────────────────────────────────────── */
const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const fmtExp = (s: string | null) =>
  s ? new Date(s).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

/* ─── shared style tokens ───────────────────────────────────── */
const GOLD   = "#D4AF37";
const GOLD2  = "#F5D060";
const SURFACE = "rgba(255,255,255,0.04)";
const BORDER  = "rgba(255,255,255,0.08)";

const inp: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
  padding: "10px 14px", color: "#fff", fontSize: ".88rem",
  outline: "none", boxSizing: "border-box", transition: "border-color .2s",
};
const lbl: React.CSSProperties = {
  color: "rgba(255,255,255,0.4)", fontSize: ".74rem",
  fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase",
  display: "block", marginBottom: 6,
};

const EMPTY = { title: "", description: "", image_url: "", gram_weight: "", price: "", expired_at: "", category: "emas" };

/* ─── component ─────────────────────────────────────────────── */
export default function AdminPromoPage() {
  const { user } = useAuthStore();
  const isMaster = user?.role === "master";

  const [promos, setPromos]   = useState<any[]>([]);
  const [form, setForm]       = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    const { data } = await (supabase.from("promos") as any)
      .select("*").order("created_at", { ascending: false });
    setPromos(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setEditingId(null);
    setForm(EMPTY);
    setError("");
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function openEdit(p: any) {
    setEditingId(p.id);
    setForm({
      title:       p.title ?? "",
      description: p.description ?? "",
      image_url:   p.image_url ?? "",
      gram_weight: p.gram_weight != null ? String(p.gram_weight) : "",
      price:       p.price != null ? String(p.price) : "",
      expired_at:  p.expired_at ? new Date(p.expired_at).toISOString().slice(0, 16) : "",
      category:    p.gram_weight != null ? "emas" : "lain-lain",
    });
    setError("");
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY);
    setError("");
  }

  async function save() {
    if (!form.title) { setError("Nama promo wajib diisi."); return; }
    setSaving(true); setError("");

    const payload = {
      title:       form.title,
      description: form.description || null,
      image_url:   form.image_url   || null,
      gram_weight: form.category === "emas" && form.gram_weight ? Number(form.gram_weight) : null,
      price:       form.price ? Number(form.price) : null,
      expired_at:  form.expired_at ? new Date(form.expired_at).toISOString() : null,
    };

    const tbl = supabase.from("promos") as any;
    const { error: err } = editingId
      ? await tbl.update(payload).eq("id", editingId)
      : await tbl.insert({ ...payload, discount_percent: 0, is_active: true });

    if (err) { setError(err.message); setSaving(false); return; }
    closeForm();
    load();
    setSaving(false);
  }

  async function toggle(p: any) {
    await (supabase.from("promos") as any).update({ is_active: !p.is_active }).eq("id", p.id);
    load();
  }

  async function remove(id: string) {
    if (!window.confirm("Hapus promo ini?")) return;
    await (supabase.from("promos") as any).delete().eq("id", id);
    load();
  }

  const activeCount   = promos.filter(p => p.is_active).length;
  const previewSrc    = gdriveImage(form.image_url);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 1000 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles style={{ width: 16, height: 16, color: GOLD }} />
            </div>
            <h1 style={{ color: "#fff", fontSize: "1.35rem", fontWeight: 700, margin: 0 }}>Kelola Promo</h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: ".82rem", margin: 0 }}>
            Promo aktif di landing page: <span style={{ color: GOLD, fontWeight: 700 }}>{activeCount}</span> / {promos.length}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "9px 14px", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: ".83rem" }}>
            <RefreshCw style={{ width: 13, height: 13 }} />
          </button>
          <button onClick={openNew} style={{ display: "flex", alignItems: "center", gap: 7, background: `linear-gradient(135deg,${GOLD},${GOLD2})`, border: "none", borderRadius: 10, padding: "9px 18px", color: "#0a0a0a", cursor: "pointer", fontSize: ".85rem", fontWeight: 700 }}>
            <Plus style={{ width: 14, height: 14 }} /> Tambah Promo
          </button>
        </div>
      </div>

      {/* ── Form Panel ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div ref={formRef}
            initial={{ opacity: 0, y: -12, scale: .98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: .98 }}
            transition={{ duration: .2 }}
            style={{ background: "rgba(15,15,15,0.9)", border: `1px solid ${editingId ? "rgba(212,175,55,0.45)" : BORDER}`, borderRadius: 18, overflow: "hidden" }}>

            {/* form header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, background: editingId ? "rgba(212,175,55,0.06)" : "transparent" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: editingId ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {editingId ? <Pencil style={{ width: 13, height: 13, color: GOLD }} /> : <Plus style={{ width: 13, height: 13, color: "rgba(255,255,255,0.5)" }} />}
                </div>
                <span style={{ color: editingId ? GOLD : "#fff", fontWeight: 700, fontSize: ".9rem" }}>
                  {editingId ? "Edit Promo" : "Promo Baru"}
                </span>
              </div>
              <button onClick={closeForm} style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "5px 8px", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
              {error && (
                <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: ".82rem" }}>
                  {error}
                </div>
              )}

              {/* Kategori */}
              <div>
                <label style={lbl}>Kategori</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["emas", "lain-lain"] as const).map(cat => (
                    <button key={cat}
                      onClick={() => setForm(p => ({ ...p, category: cat, gram_weight: cat === "lain-lain" ? "" : p.gram_weight }))}
                      style={{
                        flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer", fontSize: ".85rem", fontWeight: 600, transition: "all .15s",
                        border: `1px solid ${form.category === cat ? "rgba(212,175,55,0.5)" : BORDER}`,
                        background: form.category === cat ? "rgba(212,175,55,0.12)" : SURFACE,
                        color: form.category === cat ? GOLD : "rgba(255,255,255,0.4)",
                      }}>
                      {cat === "emas" ? "🪙 Emas" : "🏷️ Lain-lain"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nama + Gram (conditional) + Harga */}
              <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))`, gap: 12 }}>
                <div>
                  <label style={lbl}>Nama Promo *</label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={inp} placeholder="cth: Emas 5gr Spesial" />
                </div>
                <AnimatePresence>
                  {form.category === "emas" && (
                    <motion.div key="gram" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}>
                      <label style={lbl}>Berat (gram)</label>
                      <input type="number" min={0} step={0.01} value={form.gram_weight}
                        onChange={e => setForm(p => ({ ...p, gram_weight: e.target.value }))} style={inp} placeholder="5" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <div>
                  <label style={lbl}>Harga (Rp)</label>
                  <RupiahInput value={form.price} onValueChange={v => setForm(p => ({ ...p, price: v }))} style={inp} placeholder="8.000.000" />
                </div>
                <div>
                  <label style={lbl}>Kadaluarsa</label>
                  <input type="datetime-local" value={form.expired_at}
                    onChange={e => setForm(p => ({ ...p, expired_at: e.target.value }))} style={inp} />
                </div>
              </div>

              {/* Gambar */}
              <div>
                <label style={lbl}>Link Gambar (Google Drive)</label>
                <input value={form.image_url} onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))}
                  style={inp} placeholder="https://drive.google.com/file/d/…/view" />
                <AnimatePresence>
                  {form.image_url && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      style={{ marginTop: 10, borderRadius: 12, overflow: "hidden", border: `1px solid ${BORDER}`, maxWidth: 260 }}>
                      <img src={previewSrc} alt="Preview"
                        style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Deskripsi */}
              <div>
                <label style={lbl}>Deskripsi (opsional)</label>
                <textarea rows={2} value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  style={{ ...inp, resize: "vertical", fontFamily: "inherit" }}
                  placeholder="Keterangan tambahan…" />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={save} disabled={saving || !form.title}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 24px", borderRadius: 10, background: `linear-gradient(135deg,${GOLD},${GOLD2})`, border: "none", color: "#0a0a0a", fontWeight: 700, fontSize: ".88rem", cursor: saving || !form.title ? "not-allowed" : "pointer", opacity: saving ? .7 : 1 }}>
                  {saving ? "Menyimpan…" : editingId ? <><Pencil style={{ width: 13, height: 13 }} /> Update Promo</> : <><Plus style={{ width: 13, height: 13 }} /> Simpan Promo</>}
                </button>
                <button onClick={closeForm}
                  style={{ padding: "11px 18px", borderRadius: 10, background: SURFACE, border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: ".85rem" }}>
                  Batal
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Promo List ── */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 260, borderRadius: 16, background: SURFACE, border: `1px solid ${BORDER}`, animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      ) : promos.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 18 }}>
          <Sparkles style={{ width: 32, height: 32, color: "rgba(212,175,55,0.3)", margin: "0 auto 12px" }} />
          <p style={{ color: "rgba(255,255,255,0.3)", margin: 0, fontSize: ".9rem" }}>Belum ada promo. Klik "Tambah Promo" untuk mulai.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {promos.map(p => {
            const src = gdriveImage(p.image_url);
            const isEditing = editingId === p.id;
            return (
              <motion.div key={p.id} layout
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  background: "rgba(12,12,12,0.8)",
                  border: `1px solid ${isEditing ? "rgba(212,175,55,0.55)" : p.is_active ? "rgba(52,211,153,0.2)" : BORDER}`,
                  borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column",
                }}>

                {/* thumbnail */}
                <div style={{ position: "relative", height: 150, background: "rgba(212,175,55,0.04)", flexShrink: 0 }}>
                  {p.image_url
                    ? <img src={src} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ImageOff style={{ width: 28, height: 28, color: "rgba(255,255,255,0.12)" }} />
                      </div>
                  }
                  {/* status pill */}
                  <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
                    <span style={{ background: p.is_active ? "rgba(52,211,153,0.9)" : "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", color: p.is_active ? "#0a0a0a" : "rgba(255,255,255,0.4)", borderRadius: 20, padding: "3px 9px", fontSize: ".68rem", fontWeight: 700 }}>
                      {p.is_active ? "AKTIF" : "NONAKTIF"}
                    </span>
                    {p.gram_weight == null && (
                      <span style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.5)", borderRadius: 20, padding: "3px 9px", fontSize: ".68rem" }}>
                        Lain-lain
                      </span>
                    )}
                  </div>
                </div>

                {/* body */}
                <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: ".92rem", margin: 0, lineHeight: 1.3 }}>{p.title}</p>

                  {/* chips */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {p.gram_weight != null && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(212,175,55,0.1)", color: GOLD, borderRadius: 6, padding: "3px 9px", fontSize: ".72rem", fontWeight: 700 }}>
                        <Coins style={{ width: 10, height: 10 }} />{p.gram_weight} gr
                      </span>
                    )}
                    {p.price != null && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(52,211,153,0.1)", color: "#34d399", borderRadius: 6, padding: "3px 9px", fontSize: ".72rem", fontWeight: 700 }}>
                        <Tag style={{ width: 10, height: 10 }} />{fmt(p.price)}
                      </span>
                    )}
                    {p.expired_at && (
                      <span style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", borderRadius: 6, padding: "3px 9px", fontSize: ".7rem" }}>
                        <Clock style={{ width: 10, height: 10 }} />{fmtExp(p.expired_at)}
                      </span>
                    )}
                  </div>

                  {p.description && (
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: ".78rem", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>
                      {p.description}
                    </p>
                  )}

                  {/* actions */}
                  <div style={{ display: "flex", gap: 7, marginTop: "auto", paddingTop: 4 }}>
                    <button onClick={() => isEditing ? closeForm() : openEdit(p)}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, fontSize: ".77rem", fontWeight: 600, cursor: "pointer", transition: "all .15s", border: `1px solid ${isEditing ? "rgba(212,175,55,0.4)" : BORDER}`, background: isEditing ? "rgba(212,175,55,0.1)" : SURFACE, color: isEditing ? GOLD : "rgba(255,255,255,0.45)" }}>
                      {isEditing ? <X style={{ width: 11, height: 11 }} /> : <Pencil style={{ width: 11, height: 11 }} />}
                      {isEditing ? "Batal" : "Edit"}
                    </button>
                    <button onClick={() => toggle(p)}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px", borderRadius: 8, fontSize: ".77rem", fontWeight: 600, cursor: "pointer", transition: "all .15s", border: `1px solid ${p.is_active ? "rgba(52,211,153,0.3)" : BORDER}`, background: p.is_active ? "rgba(52,211,153,0.08)" : SURFACE, color: p.is_active ? "#34d399" : "rgba(255,255,255,0.35)" }}>
                      {p.is_active ? <><Eye style={{ width: 11, height: 11 }} /> Aktif</> : <><EyeOff style={{ width: 11, height: 11 }} /> Nonaktif</>}
                    </button>
                    {isMaster && (
                      <button onClick={() => remove(p.id)}
                        style={{ padding: "7px 10px", borderRadius: 8, background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center" }}>
                        <Trash2 style={{ width: 12, height: 12 }} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
