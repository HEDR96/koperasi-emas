"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Save, Trash2, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface FAQ { id: number; pertanyaan: string; jawaban: string; is_active: boolean; urutan: number; }

const EMPTY: Omit<FAQ,"id"> = { pertanyaan:"", jawaban:"", is_active:true, urutan:0 };

const inp: React.CSSProperties = {
  width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:".88rem", outline:"none", boxSizing:"border-box",
};

export default function FAQPage() {
  const [items, setItems]     = useState<FAQ[]>([]);
  const [form, setForm]       = useState<Omit<FAQ,"id">>(EMPTY);
  const [editId, setEditId]   = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await (supabase.from("faq_items") as any).select("*").order("urutan").order("created_at");
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!form.pertanyaan || !form.jawaban) return;
    setSaving(true);
    if (editId !== null) {
      await (supabase.from("faq_items") as any).update(form).eq("id", editId);
    } else {
      await (supabase.from("faq_items") as any).insert(form);
    }
    setForm(EMPTY); setEditId(null);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    load(); setSaving(false);
  }

  async function handleDelete(id: number) {
    await (supabase.from("faq_items") as any).delete().eq("id", id);
    load();
  }

  function startEdit(item: FAQ) {
    setEditId(item.id);
    setForm({ pertanyaan:item.pertanyaan, jawaban:item.jawaban, is_active:item.is_active, urutan:item.urutan });
    window.scrollTo({ top:0, behavior:"smooth" });
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:860 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Kelola FAQ</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Edit, tambah, dan hapus pertanyaan umum di landing page</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      {/* Form */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
        style={{ background:"rgba(212,175,55,0.04)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:16, padding:22 }}>
        <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".9rem", marginBottom:18 }}>
          {editId !== null ? "✏️ Edit FAQ" : "＋ Tambah Pertanyaan Baru"}
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div>
            <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:6 }}>Pertanyaan</label>
            <input value={form.pertanyaan} onChange={e=>setForm(p=>({...p,pertanyaan:e.target.value}))} style={inp} placeholder="Bagaimana cara mendaftar menjadi anggota?" />
          </div>
          <div>
            <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:6 }}>Jawaban</label>
            <textarea rows={4} value={form.jawaban} onChange={e=>setForm(p=>({...p,jawaban:e.target.value}))}
              style={{ ...inp, resize:"vertical", fontFamily:"inherit" }} placeholder="Daftar secara online melalui website kami..." />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:6 }}>Urutan Tampil</label>
              <input type="number" value={form.urutan} onChange={e=>setForm(p=>({...p,urutan:Number(e.target.value)}))} style={inp} placeholder="0" />
            </div>
            <div style={{ display:"flex", alignItems:"center", paddingTop:22 }}>
              <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", color:"rgba(255,255,255,0.6)", fontSize:".85rem" }}>
                <input type="checkbox" checked={form.is_active} onChange={e=>setForm(p=>({...p,is_active:e.target.checked}))} />
                Tampilkan di landing page
              </label>
            </div>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            {editId !== null && (
              <button onClick={() => { setForm(EMPTY); setEditId(null); }}
                style={{ padding:"10px 18px", borderRadius:10, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:".88rem" }}>
                Batal
              </button>
            )}
            <button onClick={handleSave} disabled={saving||!form.pertanyaan||!form.jawaban}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 22px", borderRadius:10, background: saved?"rgba(52,211,153,0.2)":"linear-gradient(135deg,#D4AF37,#F5D060)", border: saved?"1px solid #34d399":"none", color: saved?"#34d399":"#0a0a0a", fontWeight:700, fontSize:".88rem", cursor:"pointer", transition:"all .3s" }}>
              {saving ? "Menyimpan..." : saved ? "✓ Tersimpan" : <><Save style={{ width:14, height:14 }} /> {editId!==null?"Simpan":"Tambah FAQ"}</>}
            </button>
          </div>
        </div>
      </motion.div>

      {/* List */}
      {loading ? <p style={{ color:"rgba(255,255,255,0.3)" }}>Memuat...</p> : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {items.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.04 }}
              style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${item.is_active?"rgba(212,175,55,0.12)":"rgba(255,255,255,0.05)"}`, borderRadius:13, padding:"16px 18px" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                    <span style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem", background:"rgba(255,255,255,0.06)", padding:"2px 8px", borderRadius:6 }}>#{item.urutan}</span>
                    {!item.is_active && <span style={{ background:"rgba(248,113,113,0.15)", color:"#f87171", fontSize:".7rem", padding:"2px 8px", borderRadius:6 }}>Disembunyikan</span>}
                  </div>
                  <p style={{ color:"#fff", fontWeight:600, fontSize:".9rem", marginBottom:6 }}>{item.pertanyaan}</p>
                  <p style={{ color:"rgba(255,255,255,0.55)", fontSize:".82rem", lineHeight:1.6, margin:0 }}>{item.jawaban}</p>
                </div>
                <div style={{ display:"flex", gap:8, flexShrink:0 }}>
                  <button onClick={() => startEdit(item)}
                    style={{ padding:"6px 12px", borderRadius:8, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.2)", color:"#D4AF37", cursor:"pointer", fontSize:".78rem" }}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(item.id)}
                    style={{ padding:"6px 8px", borderRadius:8, background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)", color:"#f87171", cursor:"pointer" }}>
                    <Trash2 style={{ width:13, height:13 }} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
