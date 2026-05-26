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
  "/dashboard/master/member": "Kelola Member",
  "/dashboard/master/harga": "Manajemen Harga Emas",
  "/dashboard/master/promo": "Manajemen Promo",

  "/dashboard/master/approval": "Approval Transaksi",
  "/dashboard/master/laporan": "Laporan Koperasi",
  "/dashboard/master/audit": "Audit Log",
  "/dashboard/master/settings": "Pengaturan Sistem",
  "/dashboard/admin": "Admin Dashboard",
  "/dashboard/admin/simpanan": "Verifikasi Simpanan",
  "/dashboard/admin/transaksi": "Data Transaksi",
  "/dashboard/admin/pembayaran": "Pembayaran",
  "/dashboard/admin/verifikasi": "Verifikasi Pembayaran",
  "/dashboard/admin/member": "Kelola Member",
  "/dashboard/admin/promo": "Upload Promo",
  "/dashboard/admin/berita": "Manajemen Berita",
  "/dashboard/admin/chat": "Chat Member",
  "/dashboard/admin/invoice": "Invoice",
  "/dashboard/admin/gadai": "Gadai Emas Member",
  "/dashboard/member": "Dashboard Saya",
  "/dashboard/member/saldo": "Saldo & Emas",
  "/dashboard/member/beli": "Beli Emas",
  "/dashboard/member/buyback": "Buyback Emas",
  "/dashboard/member/cicilan": "Cicilan Emas",
  "/dashboard/member/simpanan": "Simpanan Koperasi",
  "/dashboard/member/tabungan": "Tabungan Emas",
  "/dashboard/member/promo": "Promo & Harga Emas",
  "/dashboard/member/histori": "Histori Transaksi",
  "/dashboard/member/referral": "Program Referral",
  "/dashboard/member/upload": "Upload Bukti Bayar",
  "/dashboard/member/gadai": "Gadai Simpanan",
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

  if (!isAuthenticated || !user) return null;

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
