"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { useAuthStore } from "@/store/useAuthStore";

const TITLES: Record<string, string> = {
  "/dashboard/master": "Master Dashboard",
  "/dashboard/master/statistik": "Statistik & Analitik",
  "/dashboard/master/admin": "Kelola Admin",
  "/dashboard/master/member": "Kelola Anggota",
  "/dashboard/master/harga": "Manajemen Harga Emas",
  "/dashboard/master/promo": "Manajemen Promo",
  "/dashboard/master/testimoni": "Kelola Testimoni",
  "/dashboard/master/faq": "Kelola FAQ",
  "/dashboard/master/konten": "Konten Landing Page",
  "/dashboard/master/approval": "Pusat Approval",
  "/dashboard/master/audit": "Log Aktivitas",
  "/dashboard/master/settings": "Pengaturan Sistem",
  "/dashboard/master/input-transaksi": "Input Transaksi Manual",
  "/dashboard/admin/input-transaksi":  "Input Transaksi Manual",
  "/dashboard/profil": "Profil Saya",
  "/dashboard/admin": "Admin Dashboard",
  "/dashboard/admin/simpanan": "Input Simpanan Anggota",
  "/dashboard/admin/transaksi": "Transaksi & Approval",
  "/dashboard/admin/pembayaran": "Verifikasi Pembayaran",
  "/dashboard/admin/verifikasi": "Verifikasi Anggota",
  "/dashboard/admin/member": "Kelola Anggota",
  "/dashboard/admin/promo": "Upload Promo",
  "/dashboard/admin/berita": "Manajemen Berita",
  "/dashboard/admin/chat": "Chat Anggota",
  "/dashboard/admin/invoice": "Invoice",
  "/dashboard/admin/gadai": "Kelola Gadai",
  "/dashboard/admin/cicilan": "Kelola Cicilan",
  "/dashboard/master/cicilan": "Kelola Cicilan",
  "/dashboard/admin/riwayat": "Riwayat",
  "/dashboard/master/riwayat": "Riwayat",
  "/dashboard/master/simpanan": "Input Simpanan Anggota",
  "/dashboard/member": "Dashboard Saya",
  "/dashboard/member/saldo": "Saldo & Emas",
  "/dashboard/member/beli": "Beli Emas",
  "/dashboard/member/buyback": "Buyback Emas",
  "/dashboard/member/cicilan": "Cicilan Emas",
  "/dashboard/member/simpanan": "Simpanan Koperasi",
  "/dashboard/member/gadai": "Gadai Simpanan",
  "/dashboard/member/promo": "Promo & Harga Emas",
  "/dashboard/member/histori": "Histori Transaksi",
  "/dashboard/member/referral": "Program Referral",
  "/dashboard/member/upload": "Upload Bukti Bayar",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user, syncUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Sync Supabase session on mount
    syncUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, router]);

  // Role guard: member hanya boleh di area /dashboard/member & /dashboard/profil
  useEffect(() => {
    if (!user) return;
    if (user.role === "member" &&
        (pathname.startsWith("/dashboard/admin") || pathname.startsWith("/dashboard/master"))) {
      router.replace("/dashboard/member");
    }
  }, [user, pathname, router]);

  if (!isAuthenticated || !user) return null;
  // Cegah flash konten admin/master untuk member
  if (user.role === "member" &&
      (pathname.startsWith("/dashboard/admin") || pathname.startsWith("/dashboard/master"))) {
    return null;
  }

  const title = TITLES[pathname] || "Dashboard";

  return (
    <div style={{ display:"flex", height:"100vh", background:"#0a0a0a", overflow:"hidden" }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <DashboardHeader title={title} onMenuClick={() => setMobileOpen(true)} />
        <main style={{ flex:1, overflowY:"auto", padding:"24px", scrollbarWidth:"thin" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
