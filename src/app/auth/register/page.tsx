"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Pendaftaran mandiri dinonaktifkan — anggota didaftarkan oleh admin/master.
// Halaman ini dialihkan ke login.
export default function RegisterPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/auth/login"); }, [router]);
  return (
    <div style={{ minHeight:"60vh", display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.5)", fontSize:".9rem" }}>
      Mengalihkan ke halaman login...
    </div>
  );
}
