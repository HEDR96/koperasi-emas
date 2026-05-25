"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, ImageIcon, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const VERIF = Array.from({ length: 10 }, (_, i) => ({
  id: `VRF${String(i+1).padStart(5,"0")}`,
  member: ["Budi Santoso","Siti Rahayu","Ahmad Fauzi","Dewi Kartika","Rino Pratama"][i%5],
  type: ["Beli Emas","Cicilan Bulan "+String(i+1),"Tabungan","Buyback","Beli Emas"][i%5],
  amount: (i+1)*980000+50000,
  proofFile: `bukti_transfer_${String(i+1).padStart(3,"0")}.jpg`,
  fileSize: `${(Math.random()*500+100).toFixed(0)} KB`,
  uploadedAt: new Date(Date.now()-i*3600000).toISOString(),
  status: i<3?"pending":(i<7?"approved":"rejected") as "pending"|"approved"|"rejected",
  notes: i>=7?"Bukti tidak sesuai nominal":"",
}));

const S_MAP = {
  pending: { label:"Menunggu", bg:"rgba(251,146,60,0.1)", color:"#fb923c" },
  approved: { label:"Disetujui", bg:"rgba(74,222,128,0.1)", color:"#4ade80" },
  rejected: { label:"Ditolak", bg:"rgba(248,113,113,0.1)", color:"#f87171" },
};

export default function VerifikasiPage() {
  const [items, setItems] = useState(VERIF);
  const [selected, setSelected] = useState<string|null>(null);
  const [notes, setNotes] = useState("");

  const approve = (id: string) => setItems(a => a.map(x => x.id===id?{...x,status:"approved" as const}:x));
  const reject  = (id: string) => setItems(a => a.map(x => x.id===id?{...x,status:"rejected" as const,notes}:x));

  const sel = items.find(i=>i.id===selected);

  return (
    <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
      {/* List */}
      <div style={{ flex:"1 1 400px", display:"flex", flexDirection:"column", gap:12 }}>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          {(["pending","approved","rejected"] as const).map(s => (
            <div key={s} style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:12, padding:"12px 16px", flex:1, minWidth:100 }}>
              <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".74rem" }}>{S_MAP[s].label}</p>
              <p style={{ color:S_MAP[s].color, fontSize:"1.5rem", fontWeight:900 }}>{items.filter(i=>i.status===s).length}</p>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {items.map((item, i) => {
            const s = S_MAP[item.status];
            return (
              <motion.div key={item.id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.04 }}
                onClick={() => setSelected(item.id)}
                style={{ background: selected===item.id?"rgba(212,175,55,0.06)":"rgba(14,14,14,0.8)", border:`1px solid ${selected===item.id?"rgba(212,175,55,0.3)":"rgba(212,175,55,0.1)"}`, borderRadius:14, padding:"14px 16px", cursor:"pointer", transition:"all .2s" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div className="bg-gold-gradient" style={{ width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#0a0a0a", fontSize:".72rem", flexShrink:0 }}>{item.member[0]}</div>
                    <div>
                      <p style={{ color:"#fff", fontSize:".83rem", fontWeight:600 }}>{item.member}</p>
                      <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".72rem" }}>{item.type}</p>
                    </div>
                  </div>
                  <span style={{ background:s.bg, color:s.color, borderRadius:8, padding:"2px 8px", fontSize:".72rem", fontWeight:700 }}>{s.label}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ color:"#D4AF37", fontWeight:700, fontSize:".82rem" }}>{formatCurrency(item.amount)}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:4, color:"rgba(255,255,255,0.3)", fontSize:".72rem" }}>
                    <ImageIcon style={{ width:11, height:11 }} />
                    {item.proofFile}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Detail Panel */}
      <div style={{ flex:"0 0 300px", minWidth:260 }}>
        {sel ? (
          <motion.div key={sel.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
            style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:20, padding:22, position:"sticky", top:80 }}>
            <h3 style={{ color:"#fff", fontWeight:700, marginBottom:16 }}>Detail Verifikasi</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:18 }}>
              {[
                { label:"ID", value:sel.id },
                { label:"Member", value:sel.member },
                { label:"Jenis", value:sel.type },
                { label:"Nominal", value:formatCurrency(sel.amount) },
                { label:"Status", value:<span style={{ color:S_MAP[sel.status].color, fontWeight:700 }}>{S_MAP[sel.status].label}</span> },
              ].map(r => (
                <div key={r.label} style={{ display:"flex", justifyContent:"space-between", gap:8 }}>
                  <span style={{ color:"rgba(255,255,255,0.35)", fontSize:".78rem" }}>{r.label}</span>
                  <span style={{ color:"rgba(255,255,255,0.75)", fontSize:".78rem", textAlign:"right" }}>{r.value as any}</span>
                </div>
              ))}
            </div>
            {/* Proof mock */}
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px dashed rgba(212,175,55,0.2)", borderRadius:12, padding:20, textAlign:"center", marginBottom:16 }}>
              <ImageIcon style={{ width:28, height:28, color:"rgba(255,255,255,0.2)", margin:"0 auto 8px" }} />
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem" }}>{sel.proofFile}</p>
              <p style={{ color:"rgba(255,255,255,0.2)", fontSize:".7rem" }}>{sel.fileSize}</p>
              <button style={{ marginTop:8, display:"flex", alignItems:"center", gap:5, margin:"8px auto 0", background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:8, padding:"5px 12px", color:"#D4AF37", cursor:"pointer", fontSize:".75rem" }}>
                <Download style={{ width:11, height:11 }} /> Lihat Bukti
              </button>
            </div>
            {sel.status === "pending" && (
              <>
                <div style={{ marginBottom:12 }}>
                  <label style={{ color:"rgba(255,255,255,0.4)", fontSize:".76rem", display:"block", marginBottom:6 }}>Catatan (opsional)</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Catatan jika ditolak..."
                    style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"8px 12px", color:"rgba(255,255,255,0.7)", fontSize:".8rem", resize:"none", outline:"none" }} />
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={() => approve(sel.id)} className="btn-gold"
                    style={{ flex:1, padding:"10px", borderRadius:11, border:"none", cursor:"pointer", fontSize:".83rem", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                    <CheckCircle style={{ width:14, height:14 }} /> Setujui
                  </button>
                  <button onClick={() => reject(sel.id)}
                    style={{ flex:1, padding:"10px", borderRadius:11, border:"1px solid rgba(248,113,113,0.3)", background:"rgba(248,113,113,0.08)", color:"#f87171", cursor:"pointer", fontSize:".83rem", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                    <XCircle style={{ width:14, height:14 }} /> Tolak
                  </button>
                </div>
              </>
            )}
            {sel.notes && (
              <div style={{ marginTop:12, background:"rgba(248,113,113,0.08)", borderRadius:10, padding:"10px 12px" }}>
                <p style={{ color:"#f87171", fontSize:".76rem" }}>Alasan: {sel.notes}</p>
              </div>
            )}
          </motion.div>
        ) : (
          <div style={{ background:"rgba(14,14,14,0.6)", border:"1px solid rgba(212,175,55,0.08)", borderRadius:20, padding:32, textAlign:"center" }}>
            <Clock style={{ width:32, height:32, color:"rgba(255,255,255,0.15)", margin:"0 auto 10px" }} />
            <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".83rem" }}>Pilih item untuk melihat detail</p>
          </div>
        )}
      </div>
    </div>
  );
}
