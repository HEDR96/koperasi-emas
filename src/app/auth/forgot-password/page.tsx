"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const cardStyle: React.CSSProperties = {
  background: "rgba(255,252,220,0.85)",
  border: "1px solid rgba(201,162,39,0.25)",
  borderRadius: 22,
  padding: "32px 28px",
  backdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px rgba(201,162,39,0.15)",
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setIsLoading(false);
    if (error) {
      setError(error.message || "Gagal mengirim email reset password.");
      return;
    }
    setSent(true);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ width: 54, height: 54, borderRadius: 15, background: "rgba(201,162,39,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <Mail style={{ width: 26, height: 26, color: "#8B6010" }} />
        </div>
        <h1 style={{ color: "#2D1B00", fontWeight: 900, fontSize: "1.4rem", marginBottom: 6 }}>Lupa Password</h1>
        <p style={{ color: "rgba(101,67,14,0.5)", fontSize: ".85rem" }}>
          {sent ? "Link reset password telah dikirim" : "Masukkan email untuk menerima link reset password"}
        </p>
      </div>

      {error && (
        <div style={{ background: "rgba(153,27,27,0.08)", border: "1px solid rgba(153,27,27,0.25)", borderRadius: 12, padding: "10px 14px", color: "#991b1b", fontSize: ".83rem", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {sent ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(22,163,74,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 style={{ width: 26, height: 26, color: "#16a34a" }} />
          </div>
          <p style={{ color: "rgba(101,67,14,0.7)", fontSize: ".88rem", lineHeight: 1.6 }}>
            Kami telah mengirim link reset password ke <strong>{email}</strong>. Silakan cek inbox (atau folder spam) dan ikuti instruksinya.
          </p>
          <button type="button" onClick={() => setSent(false)}
            style={{ background: "none", border: "none", color: "#8B6010", fontSize: ".85rem", cursor: "pointer", textDecoration: "underline" }}>
            Kirim ulang ke email lain
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ color: "rgba(101,67,14,0.65)", fontSize: ".82rem", fontWeight: 500 }}>Email</label>
            <input type="email" placeholder="email@example.com" value={email}
              onChange={e => setEmail(e.target.value)} required
              className="input-gold" style={{ borderRadius: 12, padding: "11px 14px", fontSize: ".88rem" }} />
          </div>

          <button type="submit" disabled={isLoading} className="btn-gold"
            style={{ padding: "13px", borderRadius: 13, fontSize: ".95rem", border: "none", cursor: isLoading ? "not-allowed" : "pointer", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: isLoading ? .6 : 1 }}>
            {isLoading ? "Mengirim..." : <><span>Kirim Link Reset</span><ArrowRight style={{ width: 17, height: 17 }} /></>}
          </button>
        </form>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 20 }}>
        <Link href="/auth/login" style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(101,67,14,0.6)", fontSize: ".82rem", textDecoration: "none" }}>
          <ArrowLeft style={{ width: 14, height: 14 }} />
          Kembali ke halaman masuk
        </Link>
      </div>
    </motion.div>
  );
}
