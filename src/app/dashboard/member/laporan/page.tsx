"use client";
import { LaporanPageContent } from "@/app/dashboard/master/laporan/page";
import { useAuthStore } from "@/store/useAuthStore";
export default function MemberLaporanPage() {
  const { user } = useAuthStore();
  if (!user?.id) return null;
  return (
    <LaporanPageContent
      userId={user.id}
      subtitle="Download laporan transaksi Anda sendiri dalam format Excel (.xlsx)"
    />
  );
}
