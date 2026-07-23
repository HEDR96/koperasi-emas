"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, RefreshCw, Lock, User, Star, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

const inp: React.CSSProperties = {
  width:"100%", background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.2)",
  borderRadius:10, padding:"11px 14px", color:"#2D1B00", fontSize:".9rem", outline:"none", boxSizing:"border-box",
};

export default function ProfilPage() {
  const { user, syncUser } = useAuthStore();

  const [dataForm, setDataForm] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [savingData, setSavingData]   = useState(false);
  const [savedData, setSavedData]     = useState(false);
  const [dataErr, setDataErr]         = useState("");

  const [passForm, setPassForm] = useState({ current:"", newPass:"", confirm:"" });
  const [savingPass, setSavingPass]   = useState(false);
  const [savedPass, setSavedPass]     = useState(false);
  const [passErr, setPassErr]         = useState("");

  const [emailForm, setEmailForm] = useState({ current:"", newEmail:"" });
  const [savingEmail, setSavingEmail] = useState(false);
  const [savedEmail, setSavedEmail]   = useState(false);
  const [emailErr, setEmailErr]       = useState("");

  const [poin, setPoin] = useState<number | null>(null);
  useEffect(() => {
    if (!user?.id) return;
    (supabase.from("profiles") as any).select("poin").eq("id", user.id).single()
      .then(({ data }: any) => { if (data) setPoin(Number(data.poin) || 0); });
  }, [user?.id]);

  async function handleSaveData() {
    if (!dataForm.name.trim()) return;
    setSavingData(true); setDataErr("");
    try {
      const { error } = await (supabase.from("profiles") as any)
        .update({ name: dataForm.name.trim(), phone: dataForm.phone.trim() })
        .eq("id", user?.id);
      if (error) { setDataErr(error.message); }
      else {
        setSavedData(true);
        setTimeout(() => setSavedData(false), 2500);
        await syncUser();
      }
    } catch { setDataErr("Terjadi kesalahan."); }
    setSavingData(false);
  }

  async function handleResetPassword() {
    if (!passForm.newPass || passForm.newPass !== passForm.confirm) {
      setPassErr("Password baru tidak cocok."); return;
    }
    if (passForm.newPass.length < 6) {
      setPassErr("Password minimal 6 karakter."); return;
    }
    setSavingPass(true); setPassErr("");
    try {
      // Verify current password first by re-signing in
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email: user?.email || "", password: passForm.current,
      });
      if (loginErr) { setPassErr("Password saat ini salah."); setSavingPass(false); return; }

      const { error } = await supabase.auth.updateUser({ password: passForm.newPass });
      if (error) { setPassErr(error.message); }
      else {
        setSavedPass(true);
        setPassForm({ current:"", newPass:"", confirm:"" });
        setTimeout(() => setSavedPass(false), 3000);
      }
    } catch { setPassErr("Terjadi kesalahan."); }
    setSavingPass(false);
  }

  async function handleChangeEmail() {
    const newEmail = emailForm.newEmail.trim().toLowerCase();
    if (!newEmail || newEmail === user?.email) {
      setEmailErr("Masukkan email baru yang berbeda."); return;
    }
    setSavingEmail(true); setEmailErr("");
    try {
      // Verify current password first
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email: user?.email || "", password: emailForm.current,
      });
      if (loginErr) { setEmailErr("Password salah."); setSavingEmail(false); return; }

      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) { setEmailErr(error.message); }
      else {
        setSavedEmail(true);
        setEmailForm({ current:"", newEmail:"" });
        setTimeout(() => setSavedEmail(false), 6000);
      }
    } catch { setEmailErr("Terjadi kesalahan."); }
    setSavingEmail(false);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:600 }}>
      <div>
        <h1 style={{ color:"#2D1B00", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Profil Saya</h1>
        <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".85rem", margin:"4px 0 0" }}>
          Update data diri dan ganti password
        </p>
      </div>

      {/* Info card */}
      <div style={{ display:"flex", alignItems:"center", gap:14, background:"rgba(201,162,39,0.08)", border:"1px solid rgba(201,162,39,0.22)", borderRadius:14, padding:"16px 20px" }}>
        <div style={{ width:48, height:48, borderRadius:12, background:"linear-gradient(135deg,#D4AF37,#F5D060)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:"#2D1B00", fontSize:"1.2rem", flexShrink:0 }}>
          {user?.name?.[0]?.toUpperCase() || "U"}
        </div>
        <div>
          <p style={{ color:"#2D1B00", fontWeight:700, fontSize:"1rem", margin:0 }}>{user?.name}</p>
          <p style={{ color:"rgba(101,67,14,0.5)", fontSize:".82rem", margin:0 }}>{user?.email}</p>
          <span style={{ display:"inline-block", marginTop:4, padding:"2px 10px", borderRadius:20, background:"rgba(201,162,39,0.15)", color:"#8B6010", fontSize:".72rem", fontWeight:700, textTransform:"capitalize" }}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Poin Agen */}
      {poin !== null && (
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          style={{ display:"flex", alignItems:"center", gap:14, background:"rgba(146,64,14,0.06)", border:"1px solid rgba(146,64,14,0.2)", borderRadius:14, padding:"16px 20px" }}>
          <div style={{ width:44, height:44, borderRadius:11, background:"rgba(146,64,14,0.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Star style={{ width:20, height:20, color:"#92400e", fill:"#92400e" }} />
          </div>
          <div>
            <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".75rem", margin:"0 0 2px" }}>POIN AGEN</p>
            <p style={{ color:"#92400e", fontWeight:900, fontSize:"1.4rem", margin:0, lineHeight:1 }}>{poin} <span style={{ color:"rgba(101,67,14,0.4)", fontWeight:400, fontSize:".8rem" }}>poin</span></p>
            <p style={{ color:"rgba(101,67,14,0.35)", fontSize:".72rem", margin:"3px 0 0" }}>Didapat setiap pesanan yang Anda referensikan berhasil dibayar</p>
          </div>
        </motion.div>
      )}

      {/* Update Data */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
        style={{ background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.2)", borderRadius:16, overflow:"hidden" }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(201,162,39,0.15)", display:"flex", alignItems:"center", gap:8 }}>
          <User style={{ width:16, height:16, color:"#8B6010" }} />
          <p style={{ color:"#8B6010", fontWeight:700, fontSize:".88rem", margin:0 }}>Update Data Diri</p>
        </div>
        <div style={{ padding:"20px" }}>
          {dataErr && <div style={{ background:"rgba(153,27,27,0.08)", border:"1px solid rgba(153,27,27,0.2)", borderRadius:10, padding:"10px 14px", color:"#991b1b", fontSize:".82rem", marginBottom:14 }}>{dataErr}</div>}
          {savedData && <div style={{ background:"rgba(6,95,70,0.08)", border:"1px solid rgba(6,95,70,0.2)", borderRadius:10, padding:"10px 14px", color:"#065f46", fontSize:".82rem", marginBottom:14 }}>Data berhasil diperbarui!</div>}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ color:"rgba(101,67,14,0.5)", fontSize:".78rem", display:"block", marginBottom:7 }}>Nama Lengkap</label>
              <input value={dataForm.name} onChange={e => setDataForm(p => ({...p, name: e.target.value}))} style={inp} placeholder="Nama lengkap" />
            </div>
            <div>
              <label style={{ color:"rgba(101,67,14,0.5)", fontSize:".78rem", display:"block", marginBottom:7 }}>No. Telepon / WhatsApp</label>
              <input value={dataForm.phone} onChange={e => setDataForm(p => ({...p, phone: e.target.value}))} style={inp} placeholder="08xx-xxxx-xxxx" />
            </div>
            <button onClick={handleSaveData} disabled={savingData || !dataForm.name.trim()}
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"11px", borderRadius:11, background: savedData ? "rgba(6,95,70,0.12)" : "linear-gradient(135deg,#D4AF37,#F5D060)", border: savedData ? "1px solid #065f46" : "none", color: savedData ? "#065f46" : "#2D1B00", fontWeight:700, fontSize:".9rem", cursor:"pointer", transition:"all .3s" }}>
              {savingData ? <><RefreshCw style={{ width:15, height:15, animation:"spin 1s linear infinite" }} /> Menyimpan...</> : savedData ? "✓ Data Diperbarui" : <><Save style={{ width:15, height:15 }} /> Simpan Perubahan</>}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Reset Password */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.05 }}
        style={{ background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.2)", borderRadius:16, overflow:"hidden" }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(201,162,39,0.15)", display:"flex", alignItems:"center", gap:8 }}>
          <Lock style={{ width:16, height:16, color:"#6d28d9" }} />
          <p style={{ color:"#6d28d9", fontWeight:700, fontSize:".88rem", margin:0 }}>Ganti Password</p>
        </div>
        <div style={{ padding:"20px" }}>
          {passErr && <div style={{ background:"rgba(153,27,27,0.08)", border:"1px solid rgba(153,27,27,0.2)", borderRadius:10, padding:"10px 14px", color:"#991b1b", fontSize:".82rem", marginBottom:14 }}>{passErr}</div>}
          {savedPass && <div style={{ background:"rgba(6,95,70,0.08)", border:"1px solid rgba(6,95,70,0.2)", borderRadius:10, padding:"10px 14px", color:"#065f46", fontSize:".82rem", marginBottom:14 }}>Password berhasil diubah!</div>}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {[
              { key:"current", label:"Password Saat Ini" },
              { key:"newPass", label:"Password Baru" },
              { key:"confirm", label:"Konfirmasi Password Baru" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ color:"rgba(101,67,14,0.5)", fontSize:".78rem", display:"block", marginBottom:7 }}>{f.label}</label>
                <input type="password" value={(passForm as any)[f.key]}
                  onChange={e => setPassForm(p => ({...p, [f.key]: e.target.value}))}
                  style={inp} placeholder="••••••••" />
              </div>
            ))}
            <button onClick={handleResetPassword} disabled={savingPass || !passForm.current || !passForm.newPass}
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"11px", borderRadius:11, background: savedPass ? "rgba(6,95,70,0.12)" : "rgba(109,40,217,0.1)", border: savedPass ? "1px solid #065f46" : "1px solid rgba(109,40,217,0.3)", color: savedPass ? "#065f46" : "#6d28d9", fontWeight:700, fontSize:".9rem", cursor:"pointer", transition:"all .3s" }}>
              {savingPass ? <><RefreshCw style={{ width:15, height:15, animation:"spin 1s linear infinite" }} /> Mengubah...</> : savedPass ? "✓ Password Diubah" : <><Lock style={{ width:15, height:15 }} /> Ganti Password</>}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Ganti Email */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.1 }}
        style={{ background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.2)", borderRadius:16, overflow:"hidden" }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(201,162,39,0.15)", display:"flex", alignItems:"center", gap:8 }}>
          <Mail style={{ width:16, height:16, color:"#0369a1" }} />
          <p style={{ color:"#0369a1", fontWeight:700, fontSize:".88rem", margin:0 }}>Ganti Email</p>
        </div>
        <div style={{ padding:"20px" }}>
          {emailErr && <div style={{ background:"rgba(153,27,27,0.08)", border:"1px solid rgba(153,27,27,0.2)", borderRadius:10, padding:"10px 14px", color:"#991b1b", fontSize:".82rem", marginBottom:14 }}>{emailErr}</div>}
          {savedEmail && <div style={{ background:"rgba(6,95,70,0.08)", border:"1px solid rgba(6,95,70,0.2)", borderRadius:10, padding:"10px 14px", color:"#065f46", fontSize:".82rem", marginBottom:14 }}>Link konfirmasi telah dikirim ke email lama & email baru. Email akan berganti setelah kamu mengklik link konfirmasi di kedua email tersebut.</div>}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ color:"rgba(101,67,14,0.5)", fontSize:".78rem", display:"block", marginBottom:7 }}>Email Saat Ini</label>
              <input value={user?.email || ""} disabled style={{ ...inp, opacity:.4, cursor:"not-allowed" }} />
            </div>
            <div>
              <label style={{ color:"rgba(101,67,14,0.5)", fontSize:".78rem", display:"block", marginBottom:7 }}>Email Baru</label>
              <input type="email" value={emailForm.newEmail} onChange={e => setEmailForm(p => ({...p, newEmail: e.target.value}))}
                style={inp} placeholder="email-baru@example.com" />
            </div>
            <div>
              <label style={{ color:"rgba(101,67,14,0.5)", fontSize:".78rem", display:"block", marginBottom:7 }}>Password (untuk verifikasi)</label>
              <input type="password" value={emailForm.current} onChange={e => setEmailForm(p => ({...p, current: e.target.value}))}
                style={inp} placeholder="••••••••" />
            </div>
            <button onClick={handleChangeEmail} disabled={savingEmail || !emailForm.current || !emailForm.newEmail}
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"11px", borderRadius:11, background: savedEmail ? "rgba(6,95,70,0.12)" : "rgba(3,105,161,0.1)", border: savedEmail ? "1px solid #065f46" : "1px solid rgba(3,105,161,0.3)", color: savedEmail ? "#065f46" : "#0369a1", fontWeight:700, fontSize:".9rem", cursor:"pointer", transition:"all .3s" }}>
              {savingEmail ? <><RefreshCw style={{ width:15, height:15, animation:"spin 1s linear infinite" }} /> Mengirim...</> : savedEmail ? "✓ Konfirmasi Terkirim" : <><Mail style={{ width:15, height:15 }} /> Ganti Email</>}
            </button>
          </div>
        </div>
      </motion.div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
