"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, ArrowRight, Shield } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const cardStyle: React.CSSProperties = {
  background: "rgba(14,14,14,0.85)",
  border: "1px solid rgba(212,175,55,0.2)",
  borderRadius: 22,
  padding: "32px 28px",
  backdropFilter: "blur(20px)",
};

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const ok = await login(form.email, form.password);
    if (!ok) {
      const storeError = useAuthStore.getState().error;
      setError(storeError || "Email atau password tidak valid.");
      return;
    }
    const user = useAuthStore.getState().user;
    if (user?.status === "pending") {
      useAuthStore.getState().logout();
      setError("Akun kamu masih menunggu persetujuan admin. Coba lagi setelah diaktifkan.");
      return;
    }
    if (user?.status === "suspended") {
      useAuthStore.getState().logout();
      setError("Akun kamu telah dinonaktifkan. Hubungi admin.");
      return;
    }
    router.push(`/dashboard/${user?.role || "member"}`);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ width: 54, height: 54, borderRadius: 15, background: "rgba(212,175,55,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <Lock style={{ width: 26, height: 26, color: "#D4AF37" }} />
        </div>
        <h1 style={{ color: "#fff", fontWeight: 900, fontSize: "1.4rem", marginBottom: 6 }}>Masuk ke Akun</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: ".85rem" }}>Selamat datang kembali</p>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "10px 14px", color: "#f87171", fontSize: ".83rem", marginBottom: 16 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ color: "rgba(255,255,255,0.6)", fontSize: ".82rem", fontWeight: 500 }}>Email</label>
          <input type="email" placeholder="email@example.com" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} required
            className="input-gold" style={{ borderRadius: 12, padding: "11px 14px", fontSize: ".88rem" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ color: "rgba(255,255,255,0.6)", fontSize: ".82rem", fontWeight: 500 }}>Password</label>
          <div style={{ position: "relative" }}>
            <input type={showPass ? "text" : "password"} placeholder="••••••••" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} required
              className="input-gold" style={{ borderRadius: 12, padding: "11px 40px 11px 14px", fontSize: ".88rem", width: "100%" }} />
            <button type="button" onClick={() => setShowPass(!showPass)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer" }}>
              {showPass ? <EyeOff style={{ width: 17, height: 17 }} /> : <Eye style={{ width: 17, height: 17 }} />}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.4)", fontSize: ".82rem", cursor: "pointer" }}>
            <input type="checkbox" /> Ingat saya
          </label>
          <a href="#" style={{ color: "#D4AF37", fontSize: ".82rem", textDecoration: "none" }}>Lupa password?</a>
        </div>

        <button type="submit" disabled={isLoading} className="btn-gold"
          style={{ padding: "13px", borderRadius: 13, fontSize: ".95rem", border: "none", cursor: isLoading ? "not-allowed" : "pointer", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: isLoading ? .6 : 1 }}>
          {isLoading ? "Memuat..." : <><span>Masuk</span><ArrowRight style={{ width: 17, height: 17 }} /></>}
        </button>
      </form>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 20, color: "rgba(255,255,255,0.2)", fontSize: ".72rem" }}>
        <Shield style={{ width: 12, height: 12 }} />
        Dilindungi enkripsi SSL 256-bit
      </div>
    </motion.div>
  );
}
