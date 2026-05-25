"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, ArrowRight, Shield } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const DEMO = [
  { email:"master@ked.id", password:"master123", role:"master" as const, name:"Super Admin" },
  { email:"admin@ked.id",  password:"admin123",  role:"admin"  as const, name:"Admin Koperasi" },
  { email:"member@ked.id", password:"member123", role:"member" as const, name:"Budi Santoso" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ email:"", password:"" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cardStyle: React.CSSProperties = {
    background: "rgba(14,14,14,0.85)",
    border: "1px solid rgba(212,175,55,0.2)",
    borderRadius: 22,
    padding: "32px 28px",
    backdropFilter: "blur(20px)",
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    await new Promise(r => setTimeout(r, 1000));
    const u = DEMO.find(u => u.email === form.email && u.password === form.password);
    if (!u) { setError("Email atau password tidak valid."); setLoading(false); return; }
    login({ id:`user_${u.role}`, name:u.name, email:u.email, phone:"+62-811-0000-0000", role:u.role,
      referralCode:"KED-DEMO", isVerified:true, createdAt:"2023-01-01", lastLogin:new Date().toISOString(),
      balance:{ gold:125.5, rupiah:5000000, savings:2500000 } }, "demo_token");
    router.push(`/dashboard/${u.role}`);
  }

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={cardStyle}>
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <div style={{ width:54, height:54, borderRadius:15, background:"rgba(212,175,55,0.1)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 14px" }}>
          <Lock style={{ width:26, height:26, color:"#D4AF37" }} />
        </div>
        <h1 style={{ color:"#fff", fontWeight:900, fontSize:"1.4rem", marginBottom:6 }}>Masuk ke Akun</h1>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem" }}>Selamat datang kembali</p>
      </div>

      {error && (
        <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:12, padding:"10px 14px", color:"#f87171", fontSize:".83rem", marginBottom:16 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {/* Email */}
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          <label style={{ color:"rgba(255,255,255,0.6)", fontSize:".82rem", fontWeight:500 }}>Email</label>
          <input type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm({...form,email:e.target.value})} required
            className="input-gold" style={{ borderRadius:12, padding:"11px 14px", fontSize:".88rem" }} />
        </div>
        {/* Password */}
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          <label style={{ color:"rgba(255,255,255,0.6)", fontSize:".82rem", fontWeight:500 }}>Password</label>
          <div style={{ position:"relative" }}>
            <input type={showPass ? "text":"password"} placeholder="••••••••" value={form.password} onChange={e => setForm({...form,password:e.target.value})} required
              className="input-gold" style={{ borderRadius:12, padding:"11px 40px 11px 14px", fontSize:".88rem", width:"100%" }} />
            <button type="button" onClick={() => setShowPass(!showPass)}
              style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(255,255,255,0.35)", cursor:"pointer" }}>
              {showPass ? <EyeOff style={{ width:17, height:17 }} /> : <Eye style={{ width:17, height:17 }} />}
            </button>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <label style={{ display:"flex", alignItems:"center", gap:8, color:"rgba(255,255,255,0.4)", fontSize:".82rem", cursor:"pointer" }}>
            <input type="checkbox" /> Ingat saya
          </label>
          <a href="#" style={{ color:"#D4AF37", fontSize:".82rem", textDecoration:"none" }}>Lupa password?</a>
        </div>

        <button type="submit" disabled={loading} className="btn-gold"
          style={{ padding:"13px", borderRadius:13, fontSize:".95rem", border:"none", cursor:loading?"not-allowed":"pointer", marginTop:4, display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity:loading?.6:1 }}>
          {loading ? "Memuat..." : <><span>Masuk</span><ArrowRight style={{ width:17, height:17 }} /></>}
        </button>
      </form>

      {/* Demo */}
      <div style={{ margin:"20px 0 16px", display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.08)" }} />
        <span style={{ color:"rgba(255,255,255,0.25)", fontSize:".75rem" }}>Demo Login</span>
        <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.08)" }} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:20 }}>
        {DEMO.map(u => (
          <button key={u.role} onClick={() => setForm({ email:u.email, password:u.password })}
            style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:11, padding:"10px 6px", cursor:"pointer", textAlign:"center", transition:"border-color .2s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor="rgba(212,175,55,0.3)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.08)"}
          >
            <div className="bg-gold-gradient" style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#0a0a0a", fontSize:".75rem", margin:"0 auto 6px" }}>{u.name[0]}</div>
            <p style={{ color:"rgba(255,255,255,0.55)", fontSize:".72rem", fontWeight:600, textTransform:"capitalize" }}>{u.role}</p>
          </button>
        ))}
      </div>

      <p style={{ textAlign:"center", color:"rgba(255,255,255,0.35)", fontSize:".83rem" }}>
        Belum punya akun?{" "}
        <Link href="/auth/register" style={{ color:"#D4AF37", fontWeight:600, textDecoration:"none" }}>Daftar Member</Link>
      </p>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginTop:14, color:"rgba(255,255,255,0.2)", fontSize:".72rem" }}>
        <Shield style={{ width:12, height:12 }} />
        Dilindungi enkripsi SSL 256-bit
      </div>
    </motion.div>
  );
}
