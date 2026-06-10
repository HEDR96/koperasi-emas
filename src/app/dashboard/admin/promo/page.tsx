"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Plus, Eye, EyeOff, Trash2, ImageOff, Pencil, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { gdriveImage } from "@/lib/utils";
import RupiahInput from "@/components/ui/RupiahInput";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
const fmtExp = (s: string | null) => s ? new Date(s).toLocaleString("id-ID",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—";

const inp: React.CSSProperties = {
  width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:".9rem", outline:"none", boxSizing:"border-box",
};
const lbl: React.CSSProperties = { color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:6 };

const EMPTY = { title:"", description:"", image_url:"", gram_weight:"", price:"", expired_at:"", category:"emas" };

export default function AdminPromoPage() {
  const { user } = useAuthStore();
  const isMaster = user?.role === "master";
  const [promos, setPromos] = useState<any[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    const { data } = await (supabase.from("promos") as any).select("*").order("created_at",{ascending:false});
    setPromos(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function startEdit(p: any) {
    setEditingId(p.id);
    setForm({
      title: p.title ?? "",
      description: p.description ?? "",
      image_url: p.image_url ?? "",
      gram_weight: p.gram_weight != null ? String(p.gram_weight) : "",
      price: p.price != null ? String(p.price) : "",
      expired_at: p.expired_at ? new Date(p.expired_at).toISOString().slice(0,16) : "",
      category: p.gram_weight != null ? "emas" : "lain-lain",
    });
    setError("");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 50);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
    setError("");
  }

  async function save() {
    if (!form.title) { setError("Nama promo wajib diisi."); return; }
    setSaving(true); setError("");

    const payload = {
      title: form.title,
      description: form.description || null,
      image_url: form.image_url || null,
      gram_weight: form.category === "emas" && form.gram_weight ? Number(form.gram_weight) : null,
      price: form.price ? Number(form.price) : null,
      expired_at: form.expired_at ? new Date(form.expired_at).toISOString() : null,
    };

    let err;
    if (editingId) {
      ({ error: err } = await (supabase.from("promos") as any).update(payload).eq("id", editingId));
    } else {
      ({ error: err } = await (supabase.from("promos") as any).insert({
        ...payload,
        discount_percent: 0,
        is_active: true,
      }));
    }

    if (err) setError(err.message);
    else { cancelEdit(); load(); }
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

  const previewSrc = gdriveImage(form.image_url);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:960 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Kelola Promo</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Buat & atur promo yang tampil di landing page (di bawah harga emas)</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      {/* Form */}
      <div ref={formRef} style={{ background:"rgba(212,175,55,0.04)", border:`1px solid ${editingId ? "rgba(212,175,55,0.4)" : "rgba(212,175,55,0.2)"}`, borderRadius:16, padding:20 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".85rem", margin:0, display:"flex", alignItems:"center", gap:6 }}>
            {editingId ? <><Pencil style={{ width:14, height:14 }} /> Edit Promo</> : <><Plus style={{ width:14, height:14 }} /> Tambah Promo Baru</>}
          </p>
          {editingId && (
            <button onClick={cancelEdit} style={{ display:"flex", alignItems:"center", gap:4, background:"transparent", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, padding:"5px 10px", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:".78rem" }}>
              <X style={{ width:12, height:12 }} /> Batal
            </button>
          )}
        </div>
        {error && <p style={{ color:"#f87171", fontSize:".82rem", marginBottom:10 }}>{error}</p>}

        {/* Kategori */}
        <div style={{ marginBottom:12 }}>
          <label style={lbl}>Kategori Promo *</label>
          <div style={{ display:"flex", gap:8 }}>
            {(["emas","lain-lain"] as const).map(cat => (
              <button key={cat} onClick={() => setForm(p => ({ ...p, category: cat, gram_weight: cat === "lain-lain" ? "" : p.gram_weight }))}
                style={{ flex:1, padding:"9px 14px", borderRadius:10, border:`1px solid ${form.category === cat ? "rgba(212,175,55,0.6)" : "rgba(255,255,255,0.1)"}`, background: form.category === cat ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.03)", color: form.category === cat ? "#D4AF37" : "rgba(255,255,255,0.5)", fontWeight: form.category === cat ? 700 : 400, fontSize:".88rem", cursor:"pointer", textTransform:"capitalize" }}>
                {cat === "emas" ? "Emas" : "Lain-lain"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12, marginBottom:12 }}>
          <div>
            <label style={lbl}>Nama Promo *</label>
            <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} style={inp} placeholder="cth: Emas 5gr Spesial" />
          </div>
          {form.category === "emas" && (
            <div>
              <label style={lbl}>Berat (gram)</label>
              <input type="number" min={0} step={0.01} value={form.gram_weight} onChange={e=>setForm(p=>({...p,gram_weight:e.target.value}))} style={inp} placeholder="5" />
            </div>
          )}
          <div>
            <label style={lbl}>Harga (Rp)</label>
            <RupiahInput value={form.price} onValueChange={v=>setForm(p=>({...p,price:v}))} style={inp} placeholder="8.000.000" />
          </div>
          <div>
            <label style={lbl}>Kadaluarsa (tanggal & jam)</label>
            <input type="datetime-local" value={form.expired_at} onChange={e=>setForm(p=>({...p,expired_at:e.target.value}))} style={inp} />
          </div>
        </div>

        <label style={lbl}>Link Gambar (Google Drive)</label>
        <input value={form.image_url} onChange={e=>setForm(p=>({...p,image_url:e.target.value}))} style={{ ...inp, marginBottom:8 }} placeholder="https://drive.google.com/file/d/..../view?usp=drive_link" />
        {form.image_url && (
          <div style={{ marginBottom:12, borderRadius:12, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)", maxWidth:280, background:"rgba(255,255,255,0.03)" }}>
            <img src={previewSrc} alt="Preview" style={{ width:"100%", height:160, objectFit:"cover", display:"block" }}
              onError={e=>{ (e.currentTarget as HTMLImageElement).style.display="none"; }} />
          </div>
        )}

        <label style={lbl}>Deskripsi (opsional)</label>
        <textarea rows={2} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} style={{ ...inp, resize:"vertical", fontFamily:"inherit", marginBottom:12 }} placeholder="Keterangan tambahan promo" />

        <button onClick={save} disabled={saving || !form.title}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 20px", borderRadius:10, background:"linear-gradient(135deg,#D4AF37,#F5D060)", border:"none", color:"#0a0a0a", fontWeight:700, fontSize:".88rem", cursor:saving||!form.title?"not-allowed":"pointer", opacity:saving?.7:1 }}>
          {saving ? "Menyimpan..." : editingId ? "Update Promo" : "Simpan Promo"}
        </button>
        {!editingId && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem", marginTop:8 }}>Setelah disimpan, atur Aktif/Nonaktif di bawah. Hanya promo Aktif yang tampil di landing page.</p>}
      </div>

      {/* List */}
      {loading ? <p style={{ color:"rgba(255,255,255,0.3)" }}>Memuat...</p>
        : promos.length === 0 ? <p style={{ color:"rgba(255,255,255,0.3)" }}>Belum ada promo.</p>
        : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
            {promos.map(p=>{
              const src = gdriveImage(p.image_url);
              const isEditing = editingId === p.id;
              return (
              <motion.div key={p.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${isEditing ? "rgba(212,175,55,0.5)" : p.is_active ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.07)"}`, borderRadius:14, overflow:"hidden" }}>
                {p.image_url
                  ? <img src={src} alt={p.title} style={{ width:"100%", height:140, objectFit:"cover" }} onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}} />
                  : <div style={{ width:"100%", height:140, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(212,175,55,0.06)" }}><ImageOff style={{ width:28, height:28, color:"rgba(255,255,255,0.2)" }} /></div>}
                <div style={{ padding:"14px 16px" }}>
                  <p style={{ color:"#fff", fontWeight:700, fontSize:".92rem", margin:0 }}>{p.title}</p>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:8 }}>
                    {p.gram_weight != null && <span style={{ background:"rgba(212,175,55,0.12)", color:"#D4AF37", borderRadius:6, padding:"2px 8px", fontSize:".72rem", fontWeight:700 }}>{p.gram_weight} gram</span>}
                    {p.price != null && <span style={{ background:"rgba(52,211,153,0.12)", color:"#34d399", borderRadius:6, padding:"2px 8px", fontSize:".72rem", fontWeight:700 }}>{fmt(p.price)}</span>}
                    {p.gram_weight == null && <span style={{ background:"rgba(148,163,184,0.1)", color:"rgba(148,163,184,0.8)", borderRadius:6, padding:"2px 8px", fontSize:".72rem" }}>Lain-lain</span>}
                  </div>
                  {p.description && <p style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", margin:"8px 0 0", lineHeight:1.5 }}>{p.description}</p>}
                  <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem", margin:"8px 0 0" }}>Kadaluarsa: {fmtExp(p.expired_at)}</p>
                  <div style={{ display:"flex", gap:8, marginTop:12 }}>
                    <button onClick={()=>isEditing ? cancelEdit() : startEdit(p)}
                      style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:5, background: isEditing ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)", border:`1px solid ${isEditing ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius:8, padding:"7px 10px", color: isEditing ? "#D4AF37" : "rgba(255,255,255,0.5)", cursor:"pointer", fontSize:".78rem", fontWeight:600 }}>
                      {isEditing ? <><X style={{width:12,height:12}}/> Batal</> : <><Pencil style={{width:12,height:12}}/> Edit</>}
                    </button>
                    <button onClick={()=>toggle(p)}
                      style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5, background: p.is_active?"rgba(52,211,153,0.1)":"rgba(255,255,255,0.05)", border:`1px solid ${p.is_active?"rgba(52,211,153,0.25)":"rgba(255,255,255,0.1)"}`, borderRadius:8, padding:"7px", color:p.is_active?"#34d399":"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:".78rem", fontWeight:600 }}>
                      {p.is_active ? <><Eye style={{width:12,height:12}}/> Aktif</> : <><EyeOff style={{width:12,height:12}}/> Nonaktif</>}
                    </button>
                    {isMaster && (
                      <button onClick={()=>remove(p.id)} title="Hapus (master)"
                        style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:8, padding:"7px 10px", color:"#f87171", cursor:"pointer" }}>
                        <Trash2 style={{ width:13, height:13 }} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );})}
          </div>
        )}
    </div>
  );
}
