import { supabase } from "@/lib/supabase";

export type VoucherTarget = "produk" | "angsuran";
export type DiscountType = "percent" | "fixed";

export interface Voucher {
  id: string;
  code: string;
  target: VoucherTarget;
  discount_type: DiscountType;
  discount_value: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

// Kode voucher acak: VCH-XXXXXX (huruf besar & angka).
export function genVoucherCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `VCH-${s}`;
}

// Insert voucher baru dengan kode yang sudah ditampilkan ke admin (preferredCode);
// hanya generate kode baru kalau bentrok unique constraint.
export async function insertVoucherWithUniqueCode(payload: {
  code: string; target: VoucherTarget; discount_type: DiscountType; discount_value: number;
  description: string | null; created_by?: string | null;
}): Promise<{ data?: any; error?: string }> {
  let code = payload.code;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await (supabase.from("vouchers") as any)
      .insert({ ...payload, code, is_active: true })
      .select().single();
    if (!error) return { data };
    // 23505 = unique_violation di Postgres
    if (error.code !== "23505") return { error: error.message };
    code = genVoucherCode();
  }
  return { error: "Gagal membuat kode voucher unik, coba lagi." };
}

// Hitung nominal setelah potongan voucher. Tidak boleh negatif.
export function applyDiscount(base: number, type: DiscountType, value: number): number {
  const b = Number(base) || 0;
  const v = Number(value) || 0;
  const cut = type === "percent" ? b * (v / 100) : v;
  return Math.max(0, Math.round(b - cut));
}

// Nominal potongan (Rp) dari voucher terhadap base.
export function discountAmount(base: number, type: DiscountType, value: number): number {
  return Math.max(0, Math.round(Number(base) || 0) - applyDiscount(base, type, value));
}

export function fmtDiscount(type: DiscountType, value: number): string {
  return type === "percent" ? `${value}%` : new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(value);
}
