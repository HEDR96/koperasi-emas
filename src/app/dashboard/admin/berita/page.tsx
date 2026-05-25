"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Eye, FileText, Calendar } from "lucide-react";

const ARTICLES = [
  { id:"ART001", title:"Harga Emas Tembus Rp 1.100.000/gram", category:"Berita", date:"2024-03-15", status:"published", views:1240 },
  { id:"ART002", title:"Tips Investasi Emas untuk Pemula 2024", category:"Edukasi", date:"2024-03-12", status:"published", views:856 },
  { id:"ART003", title:"KED Raih Penghargaan Koperasi Digital Terbaik", category:"Pengumuman", date:"2024-03-10", status:"published", views:2180 },
  { id:"ART004", title:"Cara Menghitung ROI Investasi Emas", category:"Edukasi", date:"2024-03-08", status:"draft", views:0 },
  { id:"ART005", title:"Update Regulasi OJK Tentang Koperasi Digital", category:"Regulasi", date:"2024-03-05", status:"published", views:643 },
];

const CAT_COLORS: Record<string, string> = {
  Berita:"#60a5fa", Edukasi:"#4ade80", Pengumuman:"#D4AF37", Regulasi:"#c084fc", Draft:"#fb923c"
};

export default function BeritaPage() {
  const [articles, setArticles] = useState(ARTICLES);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formCat, setFormCat] = useState("Berita");

  const addArticle = () => {
    if (!formTitle) return;
    setArticles(a => [{ id:`ART${String(a.length+1).padStart(3,"0")}`, title:formTitle, category:formCat, date:new Date().toISOString().slice(0,10), status:"draft", views:0 }, ...a]);
    setFormTitle(""); setShowForm(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:16 }}>
        {[
          { label:"Total Artikel", value:articles.length, color:"#D4AF37" },
          { label:"Published", value:articles.filter(a=>a.status==="published").length, color:"#4ade80" },
          { label:"Draft", value:articles.filter(a=>a.status==="draft").length, color:"#fb923c" },
          { label:"Total Views", value:articles.reduce((a,b)=>a+b.views,0).toLocaleString(), color:"#60a5fa" },
        ].map(s => (
          <div key={s.label} style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:16, padding:"18px 16px" }}>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".76rem", marginBottom:4 }}>{s.label}</p>
            <p style={{ color:s.color, fontSize:"1.6rem", fontWeight:900 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <h3 style={{ color:"#fff", fontWeight:700 }}>Manajemen Berita</h3>
        <button className="btn-gold" onClick={() => setShowForm(!showForm)}
          style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 18px", borderRadius:11, border:"none", cursor:"pointer", fontSize:".84rem" }}>
          <Plus style={{ width:14, height:14 }} /> Tulis Artikel
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
          style={{ background:"rgba(212,175,55,0.04)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:16, padding:22 }}>
          <h4 style={{ color:"#D4AF37", fontWeight:700, marginBottom:16 }}>Artikel Baru</h4>
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:12, marginBottom:12 }}>
            <input className="input-gold" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Judul artikel..."
              style={{ borderRadius:10, padding:"10px 14px", fontSize:".85rem", width:"100%" }} />
            <select value={formCat} onChange={e => setFormCat(e.target.value)}
              style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:10, padding:"10px 12px", color:"rgba(255,255,255,0.7)", fontSize:".84rem", cursor:"pointer" }}>
              {Object.keys(CAT_COLORS).filter(c=>c!=="Draft").map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <textarea rows={4} placeholder="Konten artikel..." style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"10px 14px", color:"rgba(255,255,255,0.7)", fontSize:".83rem", resize:"vertical", outline:"none", marginBottom:12 }} />
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn-gold" onClick={addArticle} style={{ padding:"9px 20px", borderRadius:10, border:"none", cursor:"pointer", fontSize:".83rem" }}>Simpan Draft</button>
            <button onClick={() => setShowForm(false)} className="btn-outline-gold" style={{ padding:"9px 20px", borderRadius:10, cursor:"pointer", fontSize:".83rem" }}>Batal</button>
          </div>
        </motion.div>
      )}

      {/* Article List */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {articles.map((art, i) => (
            <motion.div key={art.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.05 }}
              style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 0", borderBottom: i<articles.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
              <div style={{ width:42, height:42, borderRadius:12, background:`${CAT_COLORS[art.category]}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <FileText style={{ width:18, height:18, color:CAT_COLORS[art.category] }} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ color:"#fff", fontSize:".86rem", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{art.title}</p>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:3 }}>
                  <span style={{ background:`${CAT_COLORS[art.category]}18`, color:CAT_COLORS[art.category], borderRadius:6, padding:"1px 7px", fontSize:".7rem", fontWeight:600 }}>{art.category}</span>
                  <span style={{ color:"rgba(255,255,255,0.25)", fontSize:".72rem", display:"flex", alignItems:"center", gap:4 }}>
                    <Calendar style={{ width:10, height:10 }} />{art.date}
                  </span>
                  {art.views > 0 && <span style={{ color:"rgba(255,255,255,0.25)", fontSize:".72rem" }}>{art.views.toLocaleString()} views</span>}
                </div>
              </div>
              <span style={{ background: art.status==="published"?"rgba(74,222,128,0.1)":"rgba(251,146,60,0.1)", color: art.status==="published"?"#4ade80":"#fb923c", borderRadius:8, padding:"3px 10px", fontSize:".72rem", fontWeight:700, flexShrink:0 }}>
                {art.status==="published"?"Published":"Draft"}
              </span>
              <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                <button style={{ width:28, height:28, borderRadius:7, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                  <Eye style={{ width:11, height:11 }} />
                </button>
                <button style={{ width:28, height:28, borderRadius:7, background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.15)", color:"#D4AF37", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                  <Edit2 style={{ width:11, height:11 }} />
                </button>
                <button style={{ width:28, height:28, borderRadius:7, background:"rgba(248,113,113,0.06)", border:"1px solid rgba(248,113,113,0.15)", color:"#f87171", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                  <Trash2 style={{ width:11, height:11 }} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
