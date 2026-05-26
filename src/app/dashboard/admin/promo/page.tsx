"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Tag, Edit2, Trash2, Eye, EyeOff, X, Check, Loader2, Calendar, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const GRAM_WEIGHTS = [0.5, 1, 2, 3, 5, 10, 25, 50, 100];

interface GramPrice {
  gram_weight: number;
  price_member: number;
  price_non_member: number;
  buyback_price: number;
}

interface Promo {
  id: string;
  title: string;
  description?: string;
  type: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  gram_prices?: GramPrice[];
}

const emptyGramPrices = (): GramPrice[] =>
  GRAM_WEIGHTS.map(g => ({ gram_weight: g, price_member: 0, price_non_member: 0, buyback_price: 0 }));

const ModalOverlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <div onClick={onClose}
    style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:999, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:16, overflowY:"auto" }}>
    <div onClick={e => e.stopPropagation()} style={{ margin:"auto" }}>{children}</div>
  </div>
);

export default function AdminPromoPage() {
  const [promos, setPromos]         = useState<Promo[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState<Promo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Promo | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title:"", description:"", type:"harga", start_date:"", end_date:"", is_active:true,
  });
  const [gramPrices, setGramPrices] = useState<GramPrice[]>(emptyGramPrices());

  const loadPromos = useCallback(async () => {
    setLoading(true);
    const { data: promosData } = await (supabase.from("promos") as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (!promosData) { setLoading(false); return; }

    const { data: gramData } = await (supabase.from("promo_gram_prices") as any)
      .select("*")
      .in("promo_id", promosData.map((p: Promo) => p.id));

    const enriched = promosData.map((p: Promo) => ({
      ...p,
      gram_prices: (gramData || []).filter((g: { promo_id: string }) => g.promo_id === p.id),
    }));

    setPromos(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { loadPromos(); }, [loadPromos]);

  function openCreate() {
    setEditing(null);
    setForm({ title:"", description:"", type:"harga", start_date:"", end_date:"", is_active:true });
    setGramPrices(emptyGramPrices());
    setSaveError("");
    setShowModal(true);
  }

  function openEdit(promo: Promo) {
    setEditing(promo);
    setForm({
      title: promo.title, description: promo.description || "",
      type: promo.type || "harga", start_date: promo.start_date || "",
      end_date: promo.end_date || "", is_active: promo.is_active,
    });
    const existing = promo.gram_prices || [];
    setGramPrices(GRAM_WEIGHTS.map(g => {
      const found = existing.find((x: GramPrice) => Number(x.gram_weight) === g);
      return found ?? { gram_weight: g, price_member: 0, price_non_member: 0, buyback_price: 0 };
    }));
    setSaveError("");
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim()) { setSaveError("Judul promo wajib diisi."); return; }
    setSaving(true); setSaveError("");

    let promoId = editing?.id;

    // Build payload — try with 'type', fallback without if column missing
    const buildPayload = (withType: boolean) => ({
      title: form.title,
      description: form.description,
      ...(withType ? { type: form.type } : {}),
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      is_active: form.is_active,
    });

    if (editing) {
      let { error } = await (supabase.from("promos") as any)
        .update(buildPayload(true)).eq("id", editing.id);
      // If 'type' column missing, retry without it
      if (error?.message?.includes("type")) {
        const r2 = await (supabase.from("promos") as any)
          .update(buildPayload(false)).eq("id", editing.id);
        error = r2.error;
      }
      if (error) { setSaveError(error.message); setSaving(false); return; }
    } else {
      let { data, error } = await (supabase.from("promos") as any)
        .insert(buildPayload(true)).select().single();
      // If 'type' column missing, retry without it
      if (error?.message?.includes("type")) {
        const r2 = await (supabase.from("promos") as any)
          .insert(buildPayload(false)).select().single();
        data  = r2.data;
        error = r2.error;
      }
      if (error || !data) { setSaveError(error?.message || "Gagal membuat promo."); setSaving(false); return; }
      promoId = data.id;
    }

    const toUpsert = gramPrices.filter(g => g.price_member > 0 || g.price_non_member > 0).map(g => ({
      promo_id: promoId, gram_weight: g.gram_weight,
      price_member: g.price_member, price_non_member: g.price_non_member, buyback_price: g.buyback_price,
    }));

    if (toUpsert.length > 0) {
      await (supabase.from("promo_gram_prices") as any).delete().eq("promo_id", promoId);
      const { error: gpErr } = await (supabase.from("promo_gram_prices") as any).insert(toUpsert);
      if (gpErr) { setSaveError("Promo tersimpan, gagal simpan harga: " + gpErr.message); setSaving(false); return; }
    }

    setSaving(false);
    setShowModal(false);
    loadPromos();
  }

  async function toggleActive(promo: Promo) {
    await (supabase.from("promos") as any).update({ is_active: !promo.is_active }).eq("id", promo.id);
    loadPromos();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await (supabase.from("promos") as any).delete().eq("id", deleteTarget.id);
    setDeleteLoading(false);
    setDeleteTarget(null);
    loadPromos();
  }

  const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" }) : "—";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:16 }}>
        {[
          { label:"Total Promo", value: loading?"…":promos.length, color:"#D4AF37" },
          { label:"Aktif",       value: loading?"…":promos.filter(p=>p.is_active).length, color:"#4ade80" },
          { label:"Nonaktif",    value: loading?"…":promos.filter(p=>!p.is_active).length, color:"#f87171" },
        ].map(s => (
          <div key={s.label} style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:16, padding:"20px 18px" }}>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem", marginBottom:6 }}>{s.label}</p>
            <p style={{ color:s.color, fontSize:"1.8rem", fontWeight:900 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <h3 style={{ color:"#fff", fontWeight:700 }}>Daftar Promo & Harga</h3>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".8rem", marginTop:2 }}>Kelola promo dan daftar harga emas per gramasi</p>
        </div>
        <button className="btn-gold" onClick={openCreate}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:12, border:"none", cursor:"pointer", fontSize:".85rem" }}>
          <Plus style={{ width:15, height:15 }} /> Buat Promo
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,0.3)" }}>
          <Loader2 style={{ width:30, height:30, animation:"spin 1s linear infinite", margin:"0 auto 12px" }} />
          <p>Memuat promo...</p>
        </div>
      ) : promos.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,0.25)", background:"rgba(14,14,14,0.7)", border:"1px solid rgba(212,175,55,0.1)", borderRadius:18 }}>
          <Tag style={{ width:44, height:44, margin:"0 auto 14px", opacity:.3 }} />
          <p style={{ fontSize:".95rem", fontWeight:600, marginBottom:6 }}>Belum ada promo</p>
          <p style={{ fontSize:".82rem" }}>Klik "Buat Promo" untuk menambahkan.</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {promos.map((promo, i) => (
            <motion.div key={promo.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
              style={{ background:"rgba(14,14,14,0.8)", border:`1px solid ${promo.is_active?"rgba(212,175,55,0.25)":"rgba(255,255,255,0.07)"}`, borderRadius:18, overflow:"hidden" }}>

              <div style={{ padding:"18px 22px", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                <div style={{ width:44, height:44, borderRadius:12, background: promo.is_active?"rgba(212,175,55,0.1)":"rgba(255,255,255,0.04)", border:`1px solid ${promo.is_active?"rgba(212,175,55,0.3)":"rgba(255,255,255,0.1)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <Tag style={{ width:20, height:20, color: promo.is_active?"#D4AF37":"rgba(255,255,255,0.3)" }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                    <p style={{ color:"#fff", fontWeight:700, fontSize:".92rem" }}>{promo.title}</p>
                    <span style={{ background: promo.is_active?"rgba(74,222,128,0.12)":"rgba(248,113,113,0.12)", color: promo.is_active?"#4ade80":"#f87171", borderRadius:6, padding:"2px 8px", fontSize:".7rem", fontWeight:700 }}>
                      {promo.is_active ? "AKTIF" : "NONAKTIF"}
                    </span>
                    <span style={{ background:"rgba(96,165,250,0.1)", color:"#60a5fa", borderRadius:6, padding:"2px 8px", fontSize:".7rem", fontWeight:600 }}>
                      {promo.type === "harga" ? "Daftar Harga" : promo.type === "cashback" ? "Cashback" : promo.type === "diskon" ? "Diskon" : "Bonus"}
                    </span>
                  </div>
                  <div style={{ display:"flex", gap:12, marginTop:4, flexWrap:"wrap" }}>
                    {promo.description && <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem" }}>{promo.description}</p>}
                    <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".75rem", display:"flex", alignItems:"center", gap:4 }}>
                      <Calendar style={{ width:11, height:11 }} />
                      {fmtDate(promo.start_date)} – {fmtDate(promo.end_date)}
                    </p>
                  </div>
                  {(promo.gram_prices?.length ?? 0) > 0 && (
                    <p style={{ color:"rgba(212,175,55,0.6)", fontSize:".74rem", marginTop:3 }}>
                      {promo.gram_prices?.length} gramasi terdaftar
                    </p>
                  )}
                </div>
                <div style={{ display:"flex", gap:7, flexShrink:0 }}>
                  {(promo.gram_prices?.length ?? 0) > 0 && (
                    <button onClick={() => setExpandedId(expandedId===promo.id ? null : promo.id)} title="Lihat harga"
                      style={{ width:32, height:32, borderRadius:8, background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.2)", color:"#D4AF37", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                      {expandedId===promo.id ? <EyeOff style={{ width:13, height:13 }} /> : <Eye style={{ width:13, height:13 }} />}
                    </button>
                  )}
                  <button onClick={() => toggleActive(promo)}
                    style={{ width:32, height:32, borderRadius:8, background: promo.is_active?"rgba(248,113,113,0.08)":"rgba(74,222,128,0.08)", border:`1px solid ${promo.is_active?"rgba(248,113,113,0.2)":"rgba(74,222,128,0.2)"}`, color: promo.is_active?"#f87171":"#4ade80", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    {promo.is_active ? <EyeOff style={{ width:13, height:13 }} /> : <Eye style={{ width:13, height:13 }} />}
                  </button>
                  <button onClick={() => openEdit(promo)}
                    style={{ width:32, height:32, borderRadius:8, background:"rgba(96,165,250,0.08)", border:"1px solid rgba(96,165,250,0.2)", color:"#60a5fa", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <Edit2 style={{ width:13, height:13 }} />
                  </button>
                  <button onClick={() => setDeleteTarget(promo)}
                    style={{ width:32, height:32, borderRadius:8, background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", color:"#f87171", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    <Trash2 style={{ width:13, height:13 }} />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedId === promo.id && (promo.gram_prices?.length ?? 0) > 0 && (
                  <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} style={{ overflow:"hidden" }}>
                    <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"16px 22px" }}>
                      <div style={{ overflowX:"auto" }}>
                        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:".8rem" }}>
                          <thead>
                            <tr style={{ background:"rgba(212,175,55,0.06)" }}>
                              {["Gramasi","Harga Anggota","Harga Non-Anggota","Buyback"].map(h => (
                                <th key={h} style={{ color:"rgba(255,255,255,0.45)", fontWeight:600, padding:"8px 12px", textAlign:"left", whiteSpace:"nowrap" }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[...(promo.gram_prices||[])].sort((a,b) => a.gram_weight-b.gram_weight).map(gp => (
                              <tr key={gp.gram_weight} style={{ borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                                <td style={{ padding:"8px 12px", color:"#D4AF37", fontWeight:700 }}>{gp.gram_weight}g</td>
                                <td style={{ padding:"8px 12px", color:"#4ade80" }}>Rp {Number(gp.price_member).toLocaleString("id-ID")}</td>
                                <td style={{ padding:"8px 12px", color:"rgba(255,255,255,0.6)" }}>Rp {Number(gp.price_non_member).toLocaleString("id-ID")}</td>
                                <td style={{ padding:"8px 12px", color:"#60a5fa" }}>Rp {Number(gp.buyback_price).toLocaleString("id-ID")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── FORM MODAL ── */}
      <AnimatePresence>
        {showModal && (
          <ModalOverlay onClose={() => setShowModal(false)}>
            <motion.div initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:.95 }}
              style={{ background:"#0f0f0f", border:"1px solid rgba(212,175,55,0.25)", borderRadius:22, padding:28, width:"100%", maxWidth:660, maxHeight:"90vh", overflowY:"auto" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
                <h3 style={{ color:"#fff", fontWeight:800, fontSize:"1.1rem" }}>{editing ? "Edit Promo" : "Buat Promo Baru"}</h3>
                <button onClick={() => setShowModal(false)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer" }}><X /></button>
              </div>

              {saveError && (
                <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, padding:"10px 14px", color:"#f87171", fontSize:".82rem", marginBottom:16, display:"flex", gap:8, alignItems:"flex-start" }}>
                  <AlertCircle style={{ width:15, height:15, flexShrink:0, marginTop:1 }} />{saveError}
                </div>
              )}

              <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:22 }}>
                <div>
                  <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem", display:"block", marginBottom:6 }}>Judul Promo *</label>
                  <input className="input-gold" placeholder="Contoh: HARGA EMAS HARI INI — SENIN 10 NOV 2025"
                    value={form.title} onChange={e => setForm(f => ({ ...f, title:e.target.value }))}
                    style={{ borderRadius:10, padding:"10px 13px", fontSize:".88rem", width:"100%" }} />
                </div>
                <div>
                  <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem", display:"block", marginBottom:6 }}>Deskripsi</label>
                  <input className="input-gold" placeholder="Keterangan tambahan (opsional)"
                    value={form.description} onChange={e => setForm(f => ({ ...f, description:e.target.value }))}
                    style={{ borderRadius:10, padding:"10px 13px", fontSize:".88rem", width:"100%" }} />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                  <div>
                    <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem", display:"block", marginBottom:6 }}>Tipe Promo</label>
                    <select className="input-gold" value={form.type} onChange={e => setForm(f => ({ ...f, type:e.target.value }))}
                      style={{ borderRadius:10, padding:"10px 13px", fontSize:".85rem", width:"100%" }}>
                      <option value="harga">Daftar Harga</option>
                      <option value="cashback">Cashback</option>
                      <option value="diskon">Diskon</option>
                      <option value="bonus">Bonus</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem", display:"block", marginBottom:6 }}>Tanggal Mulai</label>
                    <input type="date" className="input-gold" value={form.start_date}
                      onChange={e => setForm(f => ({ ...f, start_date:e.target.value }))}
                      style={{ borderRadius:10, padding:"10px 13px", fontSize:".85rem", width:"100%" }} />
                  </div>
                  <div>
                    <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem", display:"block", marginBottom:6 }}>Tanggal Berakhir</label>
                    <input type="date" className="input-gold" value={form.end_date}
                      onChange={e => setForm(f => ({ ...f, end_date:e.target.value }))}
                      style={{ borderRadius:10, padding:"10px 13px", fontSize:".85rem", width:"100%" }} />
                  </div>
                </div>
                <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active:e.target.checked }))}
                    style={{ accentColor:"#D4AF37", width:16, height:16 }} />
                  <span style={{ color:"rgba(255,255,255,0.55)", fontSize:".83rem" }}>Aktifkan promo ini sekarang</span>
                </label>
              </div>

              {/* Gram Prices */}
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)", paddingTop:18, marginBottom:14 }}>
                <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".85rem", marginBottom:4 }}>Harga per Gramasi</p>
                <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".75rem", marginBottom:14 }}>Isi harga 0 untuk gramasi yang tidak termasuk promo ini.</p>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:".8rem" }}>
                    <thead>
                      <tr style={{ background:"rgba(212,175,55,0.06)" }}>
                        {["Gram","Harga Anggota (Rp)","Harga Non-Anggota (Rp)","Buyback (Rp)"].map(h => (
                          <th key={h} style={{ color:"rgba(255,255,255,0.45)", fontWeight:600, padding:"8px 10px", textAlign:"left", whiteSpace:"nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {gramPrices.map((gp, i) => (
                        <tr key={gp.gram_weight} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding:"5px 10px", color:"#D4AF37", fontWeight:700, whiteSpace:"nowrap" }}>{gp.gram_weight}g</td>
                          {(["price_member","price_non_member","buyback_price"] as const).map(field => (
                            <td key={field} style={{ padding:"4px 6px" }}>
                              <input type="number" className="input-gold"
                                value={gp[field] || ""}
                                placeholder="0"
                                onChange={e => {
                                  const val = Number(e.target.value) || 0;
                                  setGramPrices(prev => prev.map((x,j) => j===i ? { ...x, [field]:val } : x));
                                }}
                                style={{ borderRadius:8, padding:"7px 10px", fontSize:".82rem", width:"100%", minWidth:110 }} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display:"flex", gap:10, marginTop:22 }}>
                <button className="btn-gold" onClick={handleSave} disabled={saving}
                  style={{ flex:1, padding:"12px", borderRadius:13, border:"none", cursor:saving?"not-allowed":"pointer", fontSize:".9rem", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {saving ? <><Loader2 style={{ width:15, height:15, animation:"spin 1s linear infinite" }} /> Menyimpan...</> : <><Check style={{ width:15, height:15 }} /> Simpan Promo</>}
                </button>
                <button onClick={() => setShowModal(false)} className="btn-outline-gold"
                  style={{ padding:"12px 20px", borderRadius:13, cursor:"pointer", fontSize:".9rem" }}>Batal</button>
              </div>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* ── DELETE ── */}
      <AnimatePresence>
        {deleteTarget && (
          <ModalOverlay onClose={() => setDeleteTarget(null)}>
            <motion.div initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:.95 }}
              style={{ background:"#0f0f0f", border:"1px solid rgba(248,113,113,0.3)", borderRadius:20, padding:28, width:"100%", maxWidth:360, textAlign:"center" }}>
              <div style={{ width:50, height:50, borderRadius:14, background:"rgba(248,113,113,0.1)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
                <Trash2 style={{ width:22, height:22, color:"#f87171" }} />
              </div>
              <h3 style={{ color:"#fff", fontWeight:800, marginBottom:8 }}>Hapus Promo?</h3>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".83rem", marginBottom:20, lineHeight:1.6 }}>
                <strong style={{ color:"#fff" }}>{deleteTarget.title}</strong> dan semua harga gramasi-nya akan dihapus permanen.
              </p>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={handleDelete} disabled={deleteLoading}
                  style={{ flex:1, padding:"11px", borderRadius:11, background:"#ef4444", border:"none", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:".88rem" }}>
                  {deleteLoading ? "Menghapus..." : "Hapus"}
                </button>
                <button onClick={() => setDeleteTarget(null)} className="btn-outline-gold"
                  style={{ flex:1, padding:"11px", borderRadius:11, cursor:"pointer", fontSize:".88rem" }}>Batal</button>
              </div>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  );
}
