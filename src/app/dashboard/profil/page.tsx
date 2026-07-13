"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, RefreshCw, Lock, User, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

const inp: React.CSSProperties = {
  width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:10, padding:"11px 14px", color:"#fff", fontSize:".9rem", outline:"none", boxSizing:"border-box",
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

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:600 }}>
      <div>
        <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Profil Saya</h1>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>
          Update data diri dan ganti password
        </p>
      </div>

      {/* Info card */}
      <div style={{ display:"flex", alignItems:"center", gap:14, background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:14, padding:"16px 20px" }}>
        <div style={{ width:48, height:48, borderRadius:12, background:"linear-gradient(135deg,#D4AF37,#F5D060)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:"#0a0a0a", fontSize:"1.2rem", flexShrink:0 }}>
          {user?.name?.[0]?.toUpperCase() || "U"}
        </div>
        <div>
          <p style={{ color:"#fff", fontWeight:700, fontSize:"1rem", margin:0 }}>{user?.name}</p>
          <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".82rem", margin:0 }}>{user?.email}</p>
          <span style={{ display:"inline-block", marginTop:4, padding:"2px 10px", borderRadius:20, background:"rgba(212,175,55,0.15)", color:"#D4AF37", fontSize:".72rem", fontWeight:700, textTransform:"capitalize" }}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Poin Agen */}
      {poin !== null && (
        <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          style={{ display:"flex", alignItems:"center", gap:14, background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:14, padding:"16px 20px" }}>
          <div style={{ width:44, height:44, borderRadius:11, background:"rgba(251,191,36,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Star style={{ width:20, height:20, color:"#fbbf24", fill:"#fbbf24" }} />
          </div>
          <div>
            <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".75rem", margin:"0 0 2px" }}>POIN AGEN</p>
            <p style={{ color:"#fbbf24", fontWeight:900, fontSize:"1.4rem", margin:0, lineHeight:1 }}>{poin} <span style={{ color:"rgba(255,255,255,0.35)", fontWeight:400, fontSize:".8rem" }}>poin</span></p>
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem", margin:"3px 0 0" }}>Didapat setiap pesanan yang Anda referensikan berhasil dibayar</p>
          </div>
        </motion.div>
      )}

      {/* Update Data */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
        style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, overflow:"hidden" }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", gap:8 }}>
          <User style={{ width:16, height:16, color:"#D4AF37" }} />
          <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".88rem", margin:0 }}>Update Data Diri</p>
        </div>
        <div style={{ padding:"20px" }}>
          {dataErr && <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:10, padding:"10px 14px", color:"#f87171", fontSize:".82rem", marginBottom:14 }}>{dataErr}</div>}
          {savedData && <div style={{ background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:10, padding:"10px 14px", color:"#34d399", fontSize:".82rem", marginBottom:14 }}>Data berhasil diperbarui!</div>}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Nama Lengkap</label>
              <input value={dataForm.name} onChange={e => setDataForm(p => ({...p, name: e.target.value}))} style={inp} placeholder="Nama lengkap" />
            </div>
            <div>
              <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>No. Telepon / WhatsApp</label>
              <input value={dataForm.phone} onChange={e => setDataForm(p => ({...p, phone: e.target.value}))} style={inp} placeholder="08xx-xxxx-xxxx" />
            </div>
            <div>
              <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Email</label>
              <input value={user?.email || ""} disabled style={{ ...inp, opacity:.4, cursor:"not-allowed" }} />
              <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".72rem", marginTop:5 }}>Email tidak dapat diubah.</p>
            </div>
            <button onClick={handleSaveData} disabled={savingData || !dataForm.name.trim()}
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"11px", borderRadius:11, background: savedData ? "rgba(52,211,153,0.2)" : "linear-gradient(135deg,#D4AF37,#F5D060)", border: savedData ? "1px solid #34d399" : "none", color: savedData ? "#34d399" : "#0a0a0a", fontWeight:700, fontSize:".9rem", cursor:"pointer", transition:"all .3s" }}>
              {savingData ? <><RefreshCw style={{ width:15, height:15, animation:"spin 1s linear infinite" }} /> Menyimpan...</> : savedData ? "✓ Data Diperbarui" : <><Save style={{ width:15, height:15 }} /> Simpan Perubahan</>}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Reset Password */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.05 }}
        style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, overflow:"hidden" }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", gap:8 }}>
          <Lock style={{ width:16, height:16, color:"#a78bfa" }} />
          <p style={{ color:"#a78bfa", fontWeight:700, fontSize:".88rem", margin:0 }}>Ganti Password</p>
        </div>
        <div style={{ padding:"20px" }}>
          {passErr && <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:10, padding:"10px 14px", color:"#f87171", fontSize:".82rem", marginBottom:14 }}>{passErr}</div>}
          {savedPass && <div style={{ background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:10, padding:"10px 14px", color:"#34d399", fontSize:".82rem", marginBottom:14 }}>Password berhasil diubah!</div>}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {[
              { key:"current", label:"Password Saat Ini" },
              { key:"newPass", label:"Password Baru" },
              { key:"confirm", label:"Konfirmasi Password Baru" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>{f.label}</label>
                <input type="password" value={(passForm as any)[f.key]}
                  onChange={e => setPassForm(p => ({...p, [f.key]: e.target.value}))}
                  style={inp} placeholder="••••••••" />
              </div>
            ))}
            <button onClick={handleResetPassword} disabled={savingPass || !passForm.current || !passForm.newPass}
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"11px", borderRadius:11, background: savedPass ? "rgba(52,211,153,0.2)" : "rgba(167,139,250,0.2)", border: savedPass ? "1px solid #34d399" : "1px solid rgba(167,139,250,0.4)", color: savedPass ? "#34d399" : "#a78bfa", fontWeight:700, fontSize:".9rem", cursor:"pointer", transition:"all .3s" }}>
              {savingPass ? <><RefreshCw style={{ width:15, height:15, animation:"spin 1s linear infinite" }} /> Mengubah...</> : savedPass ? "✓ Password Diubah" : <><Lock style={{ width:15, height:15 }} /> Ganti Password</>}
            </button>
          </div>
        </div>
      </motion.div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
