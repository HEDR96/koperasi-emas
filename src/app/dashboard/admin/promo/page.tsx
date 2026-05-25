"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Image, X, CheckCircle, Tag } from "lucide-react";

const UPLOADED = [
  { id:"IMG001", title:"Banner Ramadan Sale", size:"245 KB", date:"2024-03-10", active:true },
  { id:"IMG002", title:"Promo Emas Merdeka", size:"312 KB", date:"2024-02-15", active:true },
  { id:"IMG003", title:"Flash Sale Akhir Bulan", size:"198 KB", date:"2024-01-30", active:false },
];

export default function AdminPromoPage() {
  const [drag, setDrag] = useState(false);
  const [uploaded, setUploaded] = useState(UPLOADED);
  const [title, setTitle] = useState("");
  const [success, setSuccess] = useState(false);

  const handleUpload = () => {
    if (!title) return;
    const newItem = { id:`IMG${String(uploaded.length+1).padStart(3,"0")}`, title, size:"128 KB", date:new Date().toISOString().slice(0,10), active:true };
    setUploaded(u => [newItem, ...u]);
    setTitle("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Upload Form */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:28 }}>
        <h3 style={{ color:"#fff", fontWeight:700, marginBottom:4 }}>Upload Banner Promo</h3>
        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".82rem", marginBottom:20 }}>Format: JPG, PNG, GIF · Maks. 2MB</p>

        {/* Drop Zone */}
        <div onDragEnter={() => setDrag(true)} onDragLeave={() => setDrag(false)} onDrop={() => setDrag(false)}
          style={{ border:`2px dashed ${drag?"#D4AF37":"rgba(212,175,55,0.2)"}`, borderRadius:16, padding:"36px 24px", textAlign:"center", cursor:"pointer", transition:"all .2s", background: drag?"rgba(212,175,55,0.04)":"transparent", marginBottom:20 }}>
          <div style={{ width:56, height:56, borderRadius:16, background:"rgba(212,175,55,0.08)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
            <Upload style={{ width:24, height:24, color:"#D4AF37" }} />
          </div>
          <p style={{ color:"rgba(255,255,255,0.6)", fontSize:".9rem", fontWeight:500, marginBottom:4 }}>
            Seret & lepas file di sini
          </p>
          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".8rem", marginBottom:14 }}>atau</p>
          <label style={{ display:"inline-block" }}>
            <input type="file" accept="image/*" style={{ display:"none" }} />
            <span className="btn-outline-gold" style={{ padding:"8px 20px", borderRadius:10, cursor:"pointer", fontSize:".83rem" }}>Pilih File</span>
          </label>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:12, alignItems:"flex-end" }}>
          <div>
            <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:6 }}>Judul Banner</label>
            <input className="input-gold" value={title} onChange={e => setTitle(e.target.value)} placeholder="Judul promo banner..."
              style={{ borderRadius:11, padding:"10px 14px", fontSize:".85rem", width:"100%" }} />
          </div>
          <button className="btn-gold" onClick={handleUpload}
            style={{ display:"flex", alignItems:"center", gap:7, padding:"11px 22px", borderRadius:11, border:"none", cursor:"pointer", fontSize:".85rem", whiteSpace:"nowrap" }}>
            <Upload style={{ width:15, height:15 }} />
            Upload
          </button>
        </div>
        {success && (
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
            style={{ marginTop:12, display:"flex", alignItems:"center", gap:8, color:"#4ade80", fontSize:".83rem" }}>
            <CheckCircle style={{ width:16, height:16 }} />
            Banner berhasil diupload!
          </motion.div>
        )}
      </motion.div>

      {/* Uploaded List */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24 }}>
        <h3 style={{ color:"#fff", fontWeight:700, marginBottom:16 }}>Daftar Banner</h3>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
          {uploaded.map((img, i) => (
            <motion.div key={img.id} initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} transition={{ delay:i*0.06 }}
              style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${img.active?"rgba(212,175,55,0.2)":"rgba(255,255,255,0.07)"}`, borderRadius:14, overflow:"hidden" }}>
              {/* Mock image preview */}
              <div style={{ height:120, background:`linear-gradient(135deg, rgba(212,175,55,0.${img.active?"15":"06"}), rgba(0,0,0,0.5))`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Image style={{ width:32, height:32, color:`${img.active?"#D4AF37":"rgba(255,255,255,0.15)"}` }} />
              </div>
              <div style={{ padding:"12px 14px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                  <p style={{ color:"#fff", fontSize:".83rem", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{img.title}</p>
                  <button style={{ width:22, height:22, borderRadius:6, background:"rgba(248,113,113,0.08)", border:"none", color:"rgba(248,113,113,0.6)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, marginLeft:6 }}>
                    <X style={{ width:10, height:10 }} />
                  </button>
                </div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem" }}>{img.size} · {img.date}</span>
                  <span style={{ background: img.active?"rgba(74,222,128,0.1)":"rgba(255,255,255,0.05)", color: img.active?"#4ade80":"rgba(255,255,255,0.3)", borderRadius:6, padding:"2px 8px", fontSize:".7rem", fontWeight:700 }}>
                    {img.active ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
