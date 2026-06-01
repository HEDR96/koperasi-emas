"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Newspaper, RefreshCw, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

const fmtDate = (s: string) => new Date(s).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"});

const inp: React.CSSProperties = {
  width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:".9rem", outline:"none", boxSizing:"border-box",
};

const EMPTY = { title:"", content:"", category:"Umum", image_url:"" };

export default function AdminBeritaPage() {
  const { user } = useAuthStore();
  const [news, setNews] = useState<any[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  async function load() {
    setLoading(true);
    const { data } = await (supabase.from("news") as any).select("*").order("created_at",{ascending:false});
    setNews(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.title) { setError("Judul wajib diisi."); return; }
    setSaving(true); setError("");
    const { error: err } = await (supabase.from("news") as any).insert({
      title: form.title, content: form.content || null, category: form.category || null,
      image_url: form.image_url || null, author_id: user?.id, is_published: true,
    });
    if (err) setError(err.message);
    else { setForm(EMPTY); load(); }
    setSaving(false);
  }
  async function togglePublish(n: any) {
    await (supabase.from("news") as any).update({ is_published: !n.is_published }).eq("id", n.id);
    load();
  }
  async function remove(id: string) {
    await (supabase.from("news") as any).delete().eq("id", id);
    load();
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:900 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Kelola Berita</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Publikasikan berita & pengumuman koperasi</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      <div style={{ background:"rgba(212,175,55,0.04)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:16, padding:20 }}>
        <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".85rem", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
          <Plus style={{ width:14, height:14 }} /> Tulis Berita Baru
        </p>
        {error && <p style={{ color:"#f87171", fontSize:".82rem", marginBottom:10 }}>{error}</p>}
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:12, marginBottom:12 }}>
          <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} style={inp} placeholder="Judul berita *" />
          <input value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} style={inp} placeholder="Kategori" />
        </div>
        <input value={form.image_url} onChange={e=>setForm(p=>({...p,image_url:e.target.value}))} style={{ ...inp, marginBottom:12 }} placeholder="URL gambar (opsional)" />
        <textarea rows={4} value={form.content} onChange={e=>setForm(p=>({...p,content:e.target.value}))} style={{ ...inp, resize:"vertical", fontFamily:"inherit", marginBottom:12 }} placeholder="Isi berita..." />
        <button onClick={save} disabled={saving || !form.title}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 20px", borderRadius:10, background:"linear-gradient(135deg,#D4AF37,#F5D060)", border:"none", color:"#0a0a0a", fontWeight:700, fontSize:".88rem", cursor:saving||!form.title?"not-allowed":"pointer", opacity:saving?.7:1 }}>
          {saving ? "Menyimpan..." : "Publikasikan"}
        </button>
      </div>

      {loading ? <p style={{ color:"rgba(255,255,255,0.3)" }}>Memuat...</p>
        : news.length === 0 ? <p style={{ color:"rgba(255,255,255,0.3)" }}>Belum ada berita.</p>
        : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {news.map(n=>(
              <motion.div key={n.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:14, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <p style={{ color:"#fff", fontWeight:700, fontSize:".92rem", margin:0 }}>{n.title}</p>
                    {n.category && <span style={{ background:"rgba(96,165,250,0.12)", color:"#60a5fa", borderRadius:6, padding:"2px 8px", fontSize:".7rem" }}>{n.category}</span>}
                  </div>
                  <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".74rem", margin:"4px 0 0" }}>{fmtDate(n.created_at)}</p>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>togglePublish(n)}
                    style={{ display:"flex", alignItems:"center", gap:5, background: n.is_published?"rgba(52,211,153,0.1)":"rgba(255,255,255,0.05)", border:`1px solid ${n.is_published?"rgba(52,211,153,0.25)":"rgba(255,255,255,0.1)"}`, borderRadius:8, padding:"6px 12px", color:n.is_published?"#34d399":"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:".78rem", fontWeight:600 }}>
                    {n.is_published ? <><Eye style={{width:12,height:12}}/> Tayang</> : <><EyeOff style={{width:12,height:12}}/> Draft</>}
                  </button>
                  <button onClick={()=>remove(n.id)}
                    style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:8, padding:"6px 10px", color:"#f87171", cursor:"pointer" }}>
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
