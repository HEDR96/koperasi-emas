"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, ShieldCheck, KeyRound, AlertTriangle } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

export default function MasterLoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const ok = await login(form.email, form.password);
    if (!ok) {
      setAttempts(a => a + 1);
      const realErr = useAuthStore.getState().error;
      setError(realErr || "Kredensial tidak valid. Akses ditolak.");
      return;
    }
    const user = useAuthStore.getState().user;
    if (user?.role !== "master") {
      useAuthStore.getState().logout?.();
      setAttempts(a => a + 1);
      setError("Akun ini tidak memiliki hak akses master.");
      return;
    }
    router.push("/dashboard/master");
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#060606",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background effects */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position:"absolute", top:"10%", left:"10%", width:"35vw", height:"35vw", borderRadius:"50%", background:"radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 70%)", filter:"blur(80px)" }} />
        <div style={{ position:"absolute", bottom:"5%", right:"10%", width:"25vw", height:"25vw", borderRadius:"50%", background:"radial-gradient(circle, rgba(212,175,55,0.03) 0%, transparent 70%)", filter:"blur(60px)" }} />
        <div style={{ position:"absolute", inset:0, opacity:0.025, backgroundImage:"linear-gradient(rgba(212,175,55,1) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,1) 1px, transparent 1px)", backgroundSize:"40px 40px" }} />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}
      >
        <img src="/logo.svg" alt="KE" style={{ width: 52, height: 52, objectFit: "contain", borderRadius: 13 }}
          onError={e => { const el = e.currentTarget as HTMLImageElement; el.style.display="none"; (el.nextElementSibling as HTMLElement).style.display="flex"; }}
        />
        <div className="bg-gold-gradient" style={{ width:52, height:52, borderRadius:13, display:"none", alignItems:"center", justifyContent:"center", fontSize:"1.3rem", fontWeight:900, color:"#0a0a0a", flexShrink:0 }}>K</div>
        <div>
          <div className="text-gold-gradient" style={{ fontWeight: 900, fontSize: "1.1rem", lineHeight: 1 }}>Koperasi Emas</div>
          <div style={{ fontSize: ".65rem", color: "rgba(255,255,255,0.25)", marginTop: 2 }}>Master Control Panel</div>
        </div>
      </motion.div>

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: 420,
          background: "rgba(10,10,10,0.92)",
          border: "1px solid rgba(212,175,55,0.25)",
          borderRadius: 24, padding: "36px 30px",
          backdropFilter: "blur(24px)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.08)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18,
            background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))",
            border: "1px solid rgba(212,175,55,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <ShieldCheck style={{ width: 28, height: 28, color: "#D4AF37" }} />
          </div>
          <h1 style={{ color: "#fff", fontWeight: 900, fontSize: "1.45rem", marginBottom: 6, letterSpacing: "-.02em" }}>
            Master Login
          </h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: ".83rem" }}>
            Akses khusus administrator sistem
          </p>
        </div>

        {/* Warning */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(251,146,60,0.07)", border: "1px solid rgba(251,146,60,0.2)",
          borderRadius: 12, padding: "10px 14px", marginBottom: 22,
        }}>
          <AlertTriangle style={{ width: 15, height: 15, color: "#fb923c", flexShrink: 0 }} />
          <p style={{ color: "rgba(251,146,60,0.8)", fontSize: ".75rem", lineHeight: 1.5 }}>
            Halaman ini hanya untuk akun <strong>Master</strong>. Semua aktivitas login dicatat dalam audit log.
          </p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              key="err"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 12, padding: "10px 14px", color: "#f87171", fontSize: ".83rem",
                display: "flex", alignItems: "center", gap: 8, marginBottom: 16, overflow: "hidden",
              }}
            >
              <Lock style={{ width: 14, height: 14, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{error}</span>
              {attempts >= 3 && (
                <span style={{ color: "rgba(239,68,68,0.55)", fontSize: ".72rem", whiteSpace: "nowrap" }}>
                  {attempts}× gagal
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ color: "rgba(255,255,255,0.5)", fontSize: ".78rem", fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase" }}>
              Email Master
            </label>
            <input
              type="email" placeholder="master@koperasiemas.co.id"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required autoComplete="username"
              className="input-gold"
              style={{ borderRadius: 12, padding: "12px 14px", fontSize: ".88rem" }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ color: "rgba(255,255,255,0.5)", fontSize: ".78rem", fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase" }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required autoComplete="current-password"
                className="input-gold"
                style={{ borderRadius: 12, padding: "12px 44px 12px 14px", fontSize: ".88rem", width: "100%" }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 4 }}>
                {showPass ? <EyeOff style={{ width: 17, height: 17 }} /> : <Eye style={{ width: 17, height: 17 }} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-gold"
            style={{
              padding: "14px", borderRadius: 13, fontSize: ".93rem",
              border: "none", cursor: isLoading ? "not-allowed" : "pointer",
              marginTop: 6, display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8,
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            <KeyRound style={{ width: 17, height: 17 }} />
            {isLoading ? "Memverifikasi..." : "Masuk sebagai Master"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 22, color: "rgba(255,255,255,0.15)", fontSize: ".72rem" }}>
          <ShieldCheck style={{ width: 12, height: 12 }} />
          Sesi master dienkripsi &amp; diaudit secara otomatis
        </div>
      </motion.div>

      {/* Back link */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ position: "relative", zIndex: 1, marginTop: 20 }}
      >
        <a href="/auth/login"
          style={{ color: "rgba(255,255,255,0.2)", fontSize: ".75rem", textDecoration: "none" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.2)"}
        >
          ← Kembali ke login biasa
        </a>
      </motion.p>
    </div>
  );
}
