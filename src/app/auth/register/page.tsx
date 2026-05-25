"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Check, Shield } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const STEPS = ["Data Diri", "Akun & Password", "Konfirmasi"];

const cardStyle: React.CSSProperties = {
  background: "rgba(14,14,14,0.85)",
  border: "1px solid rgba(212,175,55,0.2)",
  borderRadius: 22,
  padding: "32px 28px",
  backdropFilter: "blur(20px)",
};

function Field({ label, type="text", placeholder, value, onChange, required }: {
  label: string; type?: string; placeholder?: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean;
}) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ color:"rgba(255,255,255,0.55)", fontSize:".8rem", fontWeight:500 }}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange} required={required}
        className="input-gold" style={{ borderRadius:12, padding:"11px 14px", fontSize:".88rem" }} />
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [step, setStep] = useState(0);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name:"", phone:"", email:"", nik:"",
    password:"", confirmPassword:"", referral:"", agree:false,
  });

  const update = (field: string, value: string|boolean) => setForm(f => ({ ...f, [field]:value }));

  const next = async () => {
    setError("");
    if (step === 0) {
      if (!form.name || !form.nik || !form.phone) { setError("Lengkapi semua data diri."); return; }
      setStep(1);
    } else if (step === 1) {
      if (!form.email || !form.password) { setError("Email dan password wajib diisi."); return; }
      if (form.password.length < 8) { setError("Password minimal 8 karakter."); return; }
      if (form.password !== form.confirmPassword) { setError("Password tidak sama."); return; }
      setStep(2);
    } else {
      const result = await register({
        name: form.name, email: form.email, password: form.password,
        phone: form.phone, nik: form.nik, referral: form.referral || undefined,
      });
      if (!result.success) { setError(result.error || "Pendaftaran gagal."); return; }
      router.push("/auth/login?registered=1");
    }
  };

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={cardStyle}>
      {/* Steps */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:28 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display:"flex", alignItems:"center", gap:8, flex:1 }}>
            <div style={{ width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:".75rem", fontWeight:800, transition:"all .3s",
              background: i<step?"#4ade80":i===step?"linear-gradient(135deg,#D4AF37,#F5D060)":"rgba(255,255,255,0.08)",
              color: i===step?"#0a0a0a":i<step?"#fff":"rgba(255,255,255,0.3)" }}>
              {i<step ? <Check style={{ width:14,height:14 }} /> : i+1}
            </div>
            <span style={{ fontSize:".73rem", fontWeight:600, color:i===step?"#D4AF37":"rgba(255,255,255,0.25)", display:"block" }}>{s}</span>
            {i<STEPS.length-1 && (
              <div style={{ flex:1, height:1, background: i<step?"#4ade80":"rgba(255,255,255,0.08)" }} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:12, padding:"10px 14px", color:"#f87171", fontSize:".83rem", marginBottom:14 }}>
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-30 }} transition={{ duration:.25 }}>
          {step === 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <h2 style={{ color:"#fff", fontWeight:900, fontSize:"1.2rem", marginBottom:4 }}>Data Diri</h2>
              <Field label="Nama Lengkap" placeholder="Sesuai KTP" value={form.name} onChange={e=>update("name",e.target.value)} required />
              <Field label="No. KTP (NIK)" placeholder="16 digit NIK" value={form.nik} onChange={e=>update("nik",e.target.value)} required />
              <Field label="No. WhatsApp / HP" type="tel" placeholder="08xx-xxxx-xxxx" value={form.phone} onChange={e=>update("phone",e.target.value)} required />
            </div>
          )}

          {step === 1 && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <h2 style={{ color:"#fff", fontWeight:900, fontSize:"1.2rem", marginBottom:4 }}>Buat Akun</h2>
              <Field label="Email" type="email" placeholder="email@example.com" value={form.email} onChange={e=>update("email",e.target.value)} required />
              <div style={{ display:"flex", flexDirection:"column", gap:6, position:"relative" }}>
                <label style={{ color:"rgba(255,255,255,0.55)", fontSize:".8rem", fontWeight:500 }}>Password</label>
                <div style={{ position:"relative" }}>
                  <input type={showPass?"text":"password"} placeholder="Min. 8 karakter" value={form.password} onChange={e=>update("password",e.target.value)}
                    className="input-gold" style={{ borderRadius:12, padding:"11px 40px 11px 14px", fontSize:".88rem", width:"100%" }} />
                  <button type="button" onClick={()=>setShowPass(!showPass)}
                    style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(255,255,255,0.35)", cursor:"pointer" }}>
                    {showPass ? <EyeOff style={{ width:15,height:15 }} /> : <Eye style={{ width:15,height:15 }} />}
                  </button>
                </div>
              </div>
              <Field label="Konfirmasi Password" type="password" placeholder="Ulangi password" value={form.confirmPassword} onChange={e=>update("confirmPassword",e.target.value)} required />
              <Field label="Kode Referral (opsional)" placeholder="Masukkan kode referral" value={form.referral} onChange={e=>update("referral",e.target.value)} />
            </div>
          )}

          {step === 2 && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <h2 style={{ color:"#fff", fontWeight:900, fontSize:"1.2rem", marginBottom:4 }}>Konfirmasi Data</h2>
              <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"14px 18px" }}>
                {[
                  { label:"Nama", value:form.name||"-" },
                  { label:"NIK", value:form.nik ? form.nik.slice(0,4)+"••••••••"+form.nik.slice(-4) : "-" },
                  { label:"No. HP", value:form.phone||"-" },
                  { label:"Email", value:form.email||"-" },
                ].map(r => (
                  <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".82rem" }}>{r.label}</span>
                    <span style={{ color:"rgba(255,255,255,0.75)", fontWeight:500, fontSize:".82rem" }}>{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Kewajiban finansial */}
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:14, padding:"14px 16px", display:"flex", gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:"rgba(212,175,55,0.12)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Shield style={{ width:16, height:16, color:"#D4AF37" }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                      <p style={{ color:"#fff", fontSize:".85rem", fontWeight:700 }}>Simpanan Pokok</p>
                      <span style={{ color:"#D4AF37", fontWeight:900, fontSize:".9rem" }}>Rp 5.000.000</span>
                    </div>
                    <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".76rem", lineHeight:1.6 }}>
                      Dibayar sekali saat mendaftar. Dana ini adalah hak Anda sebagai anggota koperasi dan dapat dikembalikan jika keluar.
                    </p>
                  </div>
                </div>
                <div style={{ background:"rgba(96,165,250,0.06)", border:"1px solid rgba(96,165,250,0.2)", borderRadius:14, padding:"14px 16px", display:"flex", gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:"rgba(96,165,250,0.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Shield style={{ width:16, height:16, color:"#60a5fa" }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                      <p style={{ color:"#fff", fontSize:".85rem", fontWeight:700 }}>Simpanan Wajib</p>
                      <span style={{ color:"#60a5fa", fontWeight:900, fontSize:".9rem" }}>Rp 200.000 / bln</span>
                    </div>
                    <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".76rem", lineHeight:1.6 }}>
                      Wajib dibayar setiap bulan. Menambah saldo simpanan koperasi Anda dan menjadi syarat aktif sebagai anggota.
                    </p>
                  </div>
                </div>
              </div>

              <label style={{ display:"flex", alignItems:"flex-start", gap:10, cursor:"pointer" }}>
                <input type="checkbox" checked={form.agree} onChange={e=>update("agree",e.target.checked)} style={{ marginTop:2, accentColor:"#D4AF37" }} />
                <span style={{ color:"rgba(255,255,255,0.45)", fontSize:".8rem", lineHeight:1.6 }}>
                  Saya menyetujui{" "}
                  <a href="#" style={{ color:"#D4AF37", textDecoration:"none" }}>Syarat & Ketentuan</a>
                  {" "}dan{" "}
                  <a href="#" style={{ color:"#D4AF37", textDecoration:"none" }}>Kebijakan Privasi</a>
                  {" "}Koperasi Emas.
                </span>
              </label>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Buttons */}
      <div style={{ display:"flex", gap:10, marginTop:22 }}>
        {step > 0 && (
          <button onClick={()=>setStep(s=>s-1)} className="btn-outline-gold"
            style={{ display:"flex", alignItems:"center", gap:7, padding:"12px 18px", borderRadius:13, cursor:"pointer", fontSize:".88rem" }}>
            <ArrowLeft style={{ width:15,height:15 }} /> Kembali
          </button>
        )}
        <button className="btn-gold" onClick={next} disabled={isLoading||(step===2&&!form.agree)}
          style={{ flex:1, padding:"13px", borderRadius:13, border:"none", cursor:(isLoading||(step===2&&!form.agree))?"not-allowed":"pointer", fontSize:".9rem", display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity:(step===2&&!form.agree)?0.5:1 }}>
          {isLoading ? "Memproses..." : step===STEPS.length-1 ? (
            <><Check style={{ width:16,height:16 }} /> Daftar Sekarang</>
          ) : (
            <>Lanjut <ArrowRight style={{ width:15,height:15 }} /></>
          )}
        </button>
      </div>

      <p style={{ textAlign:"center", color:"rgba(255,255,255,0.35)", fontSize:".83rem", marginTop:16 }}>
        Sudah punya akun?{" "}
        <Link href="/auth/login" style={{ color:"#D4AF37", fontWeight:600, textDecoration:"none" }}>Masuk</Link>
      </p>
    </motion.div>
  );
}
