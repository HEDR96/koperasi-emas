"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, KeyRound, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const cardStyle: React.CSSProperties = {
  background: "rgba(255,252,220,0.85)",
  border: "1px solid rgba(201,162,39,0.25)",
  borderRadius: 22,
  padding: "32px 28px",
  backdropFilter: "blur(20px)",
  boxShadow: "0 8px 32px rgba(201,162,39,0.15)",
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [sessionValid, setSessionValid] = useState(false);
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionValid(!!data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setSessionValid(true);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password: form.password });
    setIsLoading(false);
    if (error) {
      setError(error.message || "Gagal mengubah password.");
      return;
    }
    setDone(true);
    await supabase.auth.signOut();
    setTimeout(() => router.push("/auth/login"), 2500);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ width: 54, height: 54, borderRadius: 15, background: "rgba(201,162,39,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <KeyRound style={{ width: 26, height: 26, color: "#8B6010" }} />
        </div>
        <h1 style={{ color: "#2D1B00", fontWeight: 900, fontSize: "1.4rem", marginBottom: 6 }}>Reset Password</h1>
        <p style={{ color: "rgba(101,67,14,0.5)", fontSize: ".85rem" }}>Buat password baru untuk akun kamu</p>
      </div>

      {error && (
        <div style={{ background: "rgba(153,27,27,0.08)", border: "1px solid rgba(153,27,27,0.25)", borderRadius: 12, padding: "10px 14px", color: "#991b1b", fontSize: ".83rem", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {!ready ? (
        <p style={{ textAlign: "center", color: "rgba(101,67,14,0.5)", fontSize: ".85rem" }}>Memuat...</p>
      ) : done ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(22,163,74,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 style={{ width: 26, height: 26, color: "#16a34a" }} />
          </div>
          <p style={{ color: "rgba(101,67,14,0.7)", fontSize: ".88rem", lineHeight: 1.6 }}>
            Password berhasil diubah. Mengalihkan ke halaman masuk...
          </p>
        </div>
      ) : !sessionValid ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", textAlign: "center" }}>
          <p style={{ color: "rgba(101,67,14,0.7)", fontSize: ".88rem", lineHeight: 1.6 }}>
            Link reset password tidak valid atau sudah kedaluwarsa. Silakan minta link baru.
          </p>
          <Link href="/auth/forgot-password" className="btn-gold"
            style={{ padding: "11px 20px", borderRadius: 13, fontSize: ".88rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
            Minta Link Baru
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ color: "rgba(101,67,14,0.65)", fontSize: ".82rem", fontWeight: 500 }}>Password Baru</label>
            <div style={{ position: "relative" }}>
              <input type={showPass ? "text" : "password"} placeholder="••••••••" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required
                className="input-gold" style={{ borderRadius: 12, padding: "11px 40px 11px 14px", fontSize: ".88rem", width: "100%" }} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(101,67,14,0.4)", cursor: "pointer" }}>
                {showPass ? <EyeOff style={{ width: 17, height: 17 }} /> : <Eye style={{ width: 17, height: 17 }} />}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ color: "rgba(101,67,14,0.65)", fontSize: ".82rem", fontWeight: 500 }}>Konfirmasi Password</label>
            <input type={showPass ? "text" : "password"} placeholder="••••••••" value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })} required
              className="input-gold" style={{ borderRadius: 12, padding: "11px 14px", fontSize: ".88rem" }} />
          </div>

          <button type="submit" disabled={isLoading} className="btn-gold"
            style={{ padding: "13px", borderRadius: 13, fontSize: ".95rem", border: "none", cursor: isLoading ? "not-allowed" : "pointer", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: isLoading ? .6 : 1 }}>
            {isLoading ? "Menyimpan..." : <><span>Simpan Password Baru</span><ArrowRight style={{ width: 17, height: 17 }} /></>}
          </button>
        </form>
      )}
    </motion.div>
  );
}
