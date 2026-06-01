"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, RefreshCw, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}) : "—";

const inp: React.CSSProperties = {
  width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:".9rem", outline:"none", boxSizing:"border-box",
};

const EMPTY = { title:"", description:"", image_url:"", discount_percent:"0", start_date:"", end_date:"" };

export default function AdminPromoPage() {
  const [promos, setPromos] = useState<any[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  async function load() {
    setLoading(true);
    const { data } = await (supabase.from("promos") as any).select("*").order("created_at",{ascending:false});
    setPromos(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.title) { setError("Judul wajib diisi."); return; }
    setSaving(true); setError("");
    const { error: err } = await (supabase.from("promos") as any).insert({
      title: form.title,
      description: form.description || null,
      image_url: form.image_url || null,
      discount_percent: Number(form.discount_percent) || 0,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      is_active: true,
    });
    if (err) setError(err.message);
    else { setForm(EMPTY); load(); }
    setSaving(false);
  }

  async function toggle(p: any) {
    await (supabase.from("promos") as any).update({ is_active: !p.is_active }).eq("id", p.id);
    load();
  }
  async function remove(id: string) {
    await (supabase.from("promos") as any).delete().eq("id", id);
    load();
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:960 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Kelola Promo</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Buat & atur promo yang tampil di landing page</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      {/* Form */}
      <div style={{ background:"rgba(212,175,55,0.04)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:16, padding:20 }}>
        <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".85rem", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
          <Plus style={{ width:14, height:14 }} /> Tambah Promo Baru
        </p>
        {error && <p style={{ color:"#f87171", fontSize:".82rem", marginBottom:10 }}>{error}</p>}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12, marginBottom:12 }}>
          <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} style={inp} placeholder="Judul promo *" />
          <input type="number" min={0} max={100} value={form.discount_percent} onChange={e=>setForm(p=>({...p,discount_percent:e.target.value}))} style={inp} placeholder="Diskon %" />
          <input type="date" value={form.start_date} onChange={e=>setForm(p=>({...p,start_date:e.target.value}))} style={inp} />
          <input type="date" value={form.end_date} onChange={e=>setForm(p=>({...p,end_date:e.target.value}))} style={inp} />
        </div>
        <input value={form.image_url} onChange={e=>setForm(p=>({...p,image_url:e.target.value}))} style={{ ...inp, marginBottom:12 }} placeholder="URL gambar (opsional)" />
        <textarea rows={2} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} style={{ ...inp, resize:"vertical", fontFamily:"inherit", marginBottom:12 }} placeholder="Deskripsi promo" />
        <button onClick={save} disabled={saving || !form.title}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 20px", borderRadius:10, background:"linear-gradient(135deg,#D4AF37,#F5D060)", border:"none", color:"#0a0a0a", fontWeight:700, fontSize:".88rem", cursor:saving||!form.title?"not-allowed":"pointer", opacity:saving?.7:1 }}>
          {saving ? "Menyimpan..." : "Simpan Promo"}
        </button>
      </div>

      {/* List */}
      {loading ? <p style={{ color:"rgba(255,255,255,0.3)" }}>Memuat...</p>
        : promos.length === 0 ? <p style={{ color:"rgba(255,255,255,0.3)" }}>Belum ada promo.</p>
        : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
            {promos.map(p=>(
              <motion.div key={p.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${p.is_active?"rgba(52,211,153,0.25)":"rgba(255,255,255,0.07)"}`, borderRadius:14, overflow:"hidden" }}>
                {p.image_url && <img src={p.image_url} alt={p.title} style={{ width:"100%", height:120, objectFit:"cover" }} onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}} />}
                <div style={{ padding:"14px 16px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                    <p style={{ color:"#fff", fontWeight:700, fontSize:".92rem", margin:0 }}>{p.title}</p>
                    {p.discount_percent > 0 && <span style={{ background:"rgba(212,175,55,0.15)", color:"#D4AF37", borderRadius:6, padding:"2px 8px", fontSize:".72rem", fontWeight:700, flexShrink:0 }}>{p.discount_percent}%</span>}
                  </div>
                  {p.description && <p style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", margin:"6px 0 0", lineHeight:1.5 }}>{p.description}</p>}
                  <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem", margin:"8px 0 0" }}>{fmtDate(p.start_date)} — {fmtDate(p.end_date)}</p>
                  <div style={{ display:"flex", gap:8, marginTop:12 }}>
                    <button onClick={()=>toggle(p)}
                      style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5, background: p.is_active?"rgba(52,211,153,0.1)":"rgba(255,255,255,0.05)", border:`1px solid ${p.is_active?"rgba(52,211,153,0.25)":"rgba(255,255,255,0.1)"}`, borderRadius:8, padding:"7px", color:p.is_active?"#34d399":"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:".78rem", fontWeight:600 }}>
                      {p.is_active ? <><Eye style={{width:12,height:12}}/> Aktif</> : <><EyeOff style={{width:12,height:12}}/> Nonaktif</>}
                    </button>
                    <button onClick={()=>remove(p.id)}
                      style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:8, padding:"7px 10px", color:"#f87171", cursor:"pointer" }}>
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
