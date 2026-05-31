"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Save, Trash2, RefreshCw, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Testi {
  id: number; nama: string; peran: string; inisial: string;
  rating: number; komentar: string; emas_saved: string;
  tahun_gabung: number | null; is_active: boolean; urutan: number;
}

const EMPTY: Omit<Testi, "id"> = {
  nama:"", peran:"", inisial:"", rating:5, komentar:"", emas_saved:"", tahun_gabung: null, is_active:true, urutan:0,
};

const inp: React.CSSProperties = {
  width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:".88rem", outline:"none", boxSizing:"border-box",
};

export default function TestimoniPage() {
  const [items, setItems]     = useState<Testi[]>([]);
  const [form, setForm]       = useState<Omit<Testi,"id">>(EMPTY);
  const [editId, setEditId]   = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await (supabase.from("testimonials") as any).select("*").order("urutan").order("created_at");
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!form.nama || !form.komentar) return;
    setSaving(true);
    if (editId !== null) {
      await (supabase.from("testimonials") as any).update(form).eq("id", editId);
    } else {
      await (supabase.from("testimonials") as any).insert(form);
    }
    setForm(EMPTY); setEditId(null);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    load(); setSaving(false);
  }

  async function handleDelete(id: number) {
    await (supabase.from("testimonials") as any).delete().eq("id", id);
    load();
  }

  function startEdit(t: Testi) {
    setEditId(t.id);
    setForm({ nama:t.nama, peran:t.peran, inisial:t.inisial, rating:t.rating, komentar:t.komentar, emas_saved:t.emas_saved, tahun_gabung:t.tahun_gabung, is_active:t.is_active, urutan:t.urutan });
    window.scrollTo({ top:0, behavior:"smooth" });
  }

  const f = (key: keyof typeof form, label: string, type="text", rows=0) => (
    <div>
      <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:6 }}>{label}</label>
      {rows > 0 ? (
        <textarea rows={rows} value={(form as any)[key] ?? ""}
          onChange={e => setForm(p => ({...p, [key]: e.target.value}))}
          style={{ ...inp, resize:"vertical", fontFamily:"inherit" }} />
      ) : (
        <input type={type} value={(form as any)[key] ?? ""}
          onChange={e => setForm(p => ({...p, [key]: type==="number" ? Number(e.target.value) : e.target.value}))}
          style={inp} />
      )}
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:860 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Kelola Testimoni</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Edit, tambah, dan hapus testimoni anggota di landing page</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      {/* Form */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
        style={{ background:"rgba(212,175,55,0.04)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:16, padding:22 }}>
        <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".9rem", marginBottom:18 }}>
          {editId !== null ? "✏️ Edit Testimoni" : "＋ Tambah Testimoni Baru"}
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14, marginBottom:14 }}>
          {f("nama",        "Nama Lengkap")}
          {f("peran",       "Peran / Kota")}
          {f("inisial",     "Inisial (2 huruf)")}
          {f("emas_saved",  "Emas Terkumpul (contoh: 45 gram)")}
          {f("tahun_gabung","Tahun Bergabung", "number")}
          {f("urutan",      "Urutan Tampil", "number")}
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:6 }}>Rating (1-5)</label>
          <div style={{ display:"flex", gap:8 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setForm(p=>({...p,rating:n}))}
                style={{ width:36, height:36, borderRadius:9, border:"1px solid rgba(255,255,255,0.1)", background: form.rating >= n ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.03)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Star style={{ width:16, height:16, color: form.rating >= n ? "#D4AF37" : "rgba(255,255,255,0.2)", fill: form.rating >= n ? "#D4AF37" : "none" }} />
              </button>
            ))}
          </div>
        </div>
        {f("komentar", "Komentar / Testimoni", "text", 3)}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:14, flexWrap:"wrap" }}>
          <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", color:"rgba(255,255,255,0.6)", fontSize:".85rem" }}>
            <input type="checkbox" checked={form.is_active} onChange={e=>setForm(p=>({...p,is_active:e.target.checked}))} />
            Tampilkan di landing page
          </label>
          <div style={{ marginLeft:"auto", display:"flex", gap:10 }}>
            {editId !== null && (
              <button onClick={() => { setForm(EMPTY); setEditId(null); }}
                style={{ padding:"10px 18px", borderRadius:10, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:".88rem" }}>
                Batal
              </button>
            )}
            <button onClick={handleSave} disabled={saving||!form.nama||!form.komentar}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 22px", borderRadius:10, background: saved?"rgba(52,211,153,0.2)":"linear-gradient(135deg,#D4AF37,#F5D060)", border: saved?"1px solid #34d399":"none", color: saved?"#34d399":"#0a0a0a", fontWeight:700, fontSize:".88rem", cursor:"pointer", transition:"all .3s" }}>
              {saving ? <><RefreshCw style={{ width:14, height:14 }} /> Menyimpan...</> : saved ? "✓ Tersimpan" : <><Save style={{ width:14, height:14 }} /> {editId!==null?"Simpan Perubahan":"Tambah Testimoni"}</>}
            </button>
          </div>
        </div>
      </motion.div>

      {/* List */}
      {loading ? <p style={{ color:"rgba(255,255,255,0.3)" }}>Memuat...</p> : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {items.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.04 }}
              style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${t.is_active?"rgba(212,175,55,0.15)":"rgba(255,255,255,0.06)"}`, borderRadius:14, padding:"16px 20px", display:"flex", alignItems:"flex-start", gap:14 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:"linear-gradient(135deg,#D4AF37,#F5D060)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:"#0a0a0a", fontSize:".85rem", flexShrink:0 }}>
                {t.inisial || t.nama.slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                  <span style={{ color:"#fff", fontWeight:700, fontSize:".9rem" }}>{t.nama}</span>
                  <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem" }}>{t.peran}</span>
                  <div style={{ display:"flex", gap:2 }}>
                    {[1,2,3,4,5].map(n=><Star key={n} style={{ width:11, height:11, color: t.rating>=n?"#D4AF37":"rgba(255,255,255,0.15)", fill: t.rating>=n?"#D4AF37":"none" }} />)}
                  </div>
                  {!t.is_active && <span style={{ background:"rgba(248,113,113,0.15)", color:"#f87171", fontSize:".7rem", padding:"2px 8px", borderRadius:6 }}>Disembunyikan</span>}
                </div>
                <p style={{ color:"rgba(255,255,255,0.65)", fontSize:".82rem", lineHeight:1.5, margin:0 }}>"{t.komentar}"</p>
                {(t.emas_saved || t.tahun_gabung) && (
                  <div style={{ display:"flex", gap:12, marginTop:8 }}>
                    {t.emas_saved && <span style={{ color:"#D4AF37", fontSize:".75rem", fontWeight:600 }}>🥇 {t.emas_saved}</span>}
                    {t.tahun_gabung && <span style={{ color:"rgba(255,255,255,0.35)", fontSize:".75rem" }}>Bergabung {t.tahun_gabung}</span>}
                  </div>
                )}
              </div>
              <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                <button onClick={() => startEdit(t)}
                  style={{ padding:"6px 12px", borderRadius:8, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.2)", color:"#D4AF37", cursor:"pointer", fontSize:".78rem" }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(t.id)}
                  style={{ padding:"6px 8px", borderRadius:8, background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)", color:"#f87171", cursor:"pointer" }}>
                  <Trash2 style={{ width:13, height:13 }} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
