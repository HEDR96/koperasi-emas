import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}

export function formatGoldWeight(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(3)} kg`;
  }
  return `${grams.toFixed(4)} gram`;
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function calculateROI(initial: number, current: number): number {
  return ((current - initial) / initial) * 100;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: "badge-success",
    pending: "badge-warning",
    rejected: "badge-danger",
    completed: "badge-success",
    processing: "badge-warning",
    cancelled: "badge-danger",
    paid: "badge-success",
    unpaid: "badge-warning",
  };
  return map[status.toLowerCase()] || "badge-gold";
}

export function generateReferralCode(userId: string): string {
  return `KE${userId.slice(0, 4).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/**
 * Ubah link Google Drive ("share link") menjadi URL gambar langsung yang bisa
 * dipakai di <img src>. Mendukung beberapa format link Drive; jika bukan link
 * Drive, kembalikan apa adanya.
 *   https://drive.google.com/file/d/<ID>/view?usp=...  →  thumbnail langsung
 *   https://drive.google.com/open?id=<ID>
 *   https://drive.google.com/uc?id=<ID>
 */
export function gdriveImage(url: string | null | undefined): string {
  if (!url) return "";
  const u = String(url).trim();
  let id = "";
  const m1 = u.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  const m2 = u.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m1) id = m1[1];
  else if (m2) id = m2[1];
  if (!id) return u; // bukan link Drive — pakai langsung
  // Endpoint thumbnail paling andal untuk ditampilkan di <img>.
  return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
}
