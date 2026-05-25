"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle, AlertCircle, X, Image, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const PENDING_PAYMENTS = [
  { id:"PAY001", type:"Beli Emas 5g", amount:9800000, dueDate:"2024-03-20", bank:"BCA 1234567890" },
  { id:"PAY002", type:"Cicilan Bulan 8", amount:980000, dueDate:"2024-04-01", bank:"Mandiri 0987654321" },
];

const UPLOAD_HISTORY = [
  { id:"UPL001", txId:"TX001234", fileName:"bukti_transfer_2024031.jpg", uploadedAt:"2024-03-15", status:"approved" as const },
  { id:"UPL002", txId:"TX001180", fileName:"bukti_transfer_2024030.jpg", uploadedAt:"2024-03-01", status:"approved" as const },
  { id:"UPL003", txId:"TX001105", fileName:"bukti_bayar_cic7.jpg", uploadedAt:"2024-02-15", status:"rejected" as const, notes:"Nominal tidak sesuai" },
];

const S_MAP = {
  approved:{ label:"Disetujui", bg:"rgba(74,222,128,0.1)", color:"#4ade80" },
  pending:{ label:"Menunggu", bg:"rgba(251,146,60,0.1)", color:"#fb923c" },
  rejected:{ label:"Ditolak", bg:"rgba(248,113,113,0.1)", color:"#f87171" },
};

export default function UploadBuktiPage() {
  const [selectedPayment, setSelectedPayment] = useState<string|null>(null);
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!selectedPayment || !file) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setFile(null); setSelectedPayment(null); }, 3000);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Upload Form */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:28 }}>
        <h3 style={{ color:"#fff", fontWeight:700, marginBottom:4 }}>Upload Bukti Pembayaran</h3>
        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".82rem", marginBottom:22 }}>Pilih transaksi dan unggah bukti transfer kamu</p>

        {/* Select Payment */}
        <div style={{ marginBottom:20 }}>
          <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:10 }}>Pilih Transaksi</label>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {PENDING_PAYMENTS.map(p => (
              <button key={p.id} onClick={() => setSelectedPayment(selectedPayment===p.id?null:p.id)}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", borderRadius:14, border:"1px solid", cursor:"pointer", textAlign:"left", transition:"all .2s",
                  borderColor: selectedPayment===p.id?"#D4AF37":"rgba(255,255,255,0.08)",
                  background: selectedPayment===p.id?"rgba(212,175,55,0.08)":"rgba(255,255,255,0.02)" }}>
                <div>
                  <p style={{ color:"#fff", fontSize:".85rem", fontWeight:600 }}>{p.type}</p>
                  <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".75rem" }}>Transfer ke: {p.bank}</p>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".88rem" }}>{formatCurrency(p.amount)}</p>
                  <p style={{ color:"rgba(251,146,60,0.8)", fontSize:".72rem" }}>Batas: {p.dueDate}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* File Drop Zone */}
        <div onDragEnter={() => setDrag(true)} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); setFile("bukti_transfer.jpg"); }}
          style={{ border:`2px dashed ${drag?"#D4AF37":file?"rgba(74,222,128,0.4)":"rgba(212,175,55,0.2)"}`, borderRadius:16, padding:"32px 24px", textAlign:"center", cursor:"pointer", transition:"all .2s", background: file?"rgba(74,222,128,0.04)":drag?"rgba(212,175,55,0.04)":"transparent", marginBottom:20, position:"relative" }}>
          {file ? (
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:8 }}>
                <Image style={{ width:22, height:22, color:"#4ade80" }} />
                <span style={{ color:"#4ade80", fontWeight:600, fontSize:".88rem" }}>{file}</span>
                <button onClick={e => { e.stopPropagation(); setFile(null); }}
                  style={{ width:20, height:20, borderRadius:"50%", background:"rgba(248,113,113,0.2)", border:"none", color:"#f87171", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <X style={{ width:10, height:10 }} />
                </button>
              </div>
              <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".75rem" }}>File siap diupload</p>
            </div>
          ) : (
            <label style={{ cursor:"pointer" }}>
              <input type="file" accept="image/*,.pdf" style={{ display:"none" }} onChange={e => e.target.files?.[0] && setFile(e.target.files[0].name)} />
              <div style={{ width:52, height:52, borderRadius:14, background:"rgba(212,175,55,0.08)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
                <Upload style={{ width:22, height:22, color:"#D4AF37" }} />
              </div>
              <p style={{ color:"rgba(255,255,255,0.55)", fontSize:".88rem", marginBottom:4 }}>Seret file atau klik untuk upload</p>
              <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".76rem" }}>JPG, PNG, PDF · Maks. 5MB</p>
            </label>
          )}
        </div>

        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              style={{ background:"rgba(74,222,128,0.08)", border:"1px solid rgba(74,222,128,0.2)", borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", gap:8, marginBottom:14, color:"#4ade80", fontSize:".83rem" }}>
              <CheckCircle style={{ width:16, height:16 }} />
              Bukti berhasil diupload! Admin akan segera memverifikasi.
            </motion.div>
          )}
        </AnimatePresence>

        <button className="btn-gold" onClick={handleSubmit} disabled={!selectedPayment||!file||loading}
          style={{ width:"100%", padding:"13px", borderRadius:13, border:"none", cursor:(!selectedPayment||!file||loading)?"not-allowed":"pointer", fontSize:".9rem", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            opacity:(!selectedPayment||!file)?0.5:1 }}>
          <Upload style={{ width:16, height:16 }} />
          {loading ? "Mengupload..." : "Upload Bukti Bayar"}
        </button>
      </motion.div>

      {/* Info */}
      <div style={{ background:"rgba(96,165,250,0.06)", border:"1px solid rgba(96,165,250,0.15)", borderRadius:14, padding:"12px 16px", display:"flex", gap:10 }}>
        <AlertCircle style={{ width:15, height:15, color:"#60a5fa", flexShrink:0, marginTop:2 }} />
        <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".79rem", lineHeight:1.6 }}>
          Bukti pembayaran akan diverifikasi admin dalam <strong style={{ color:"#60a5fa" }}>1×24 jam kerja</strong>.
          Pastikan nominal pada bukti transfer sesuai dengan tagihan. Foto harus jelas dan terbaca.
        </p>
      </div>

      {/* History */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, padding:24 }}>
        <h3 style={{ color:"#fff", fontWeight:700, marginBottom:16 }}>Riwayat Upload</h3>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {UPLOAD_HISTORY.map((u, i) => {
            const s = S_MAP[u.status];
            return (
              <motion.div key={u.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.06 }}
                style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:"rgba(212,175,55,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <FileText style={{ width:16, height:16, color:"#D4AF37" }} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ color:"#fff", fontSize:".83rem", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.fileName}</p>
                  <div style={{ display:"flex", gap:8, marginTop:2 }}>
                    <span style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem" }}>TX: {u.txId}</span>
                    <span style={{ color:"rgba(255,255,255,0.2)", fontSize:".72rem" }}>·</span>
                    <span style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem", display:"flex", alignItems:"center", gap:3 }}>
                      <Clock style={{ width:10, height:10 }} />{u.uploadedAt}
                    </span>
                  </div>
                  {u.notes && <p style={{ color:"#f87171", fontSize:".72rem", marginTop:2 }}>Alasan: {u.notes}</p>}
                </div>
                <span style={{ background:s.bg, color:s.color, borderRadius:8, padding:"3px 10px", fontSize:".73rem", fontWeight:700, flexShrink:0 }}>{s.label}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
