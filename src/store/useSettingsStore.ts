"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { SITE_CONFIG } from "@/lib/constants";

// Semua field yang ada di halaman Pengaturan disimpan di sini dan dibagikan
// ke seluruh komponen. Setiap kali master menyimpan pengaturan, store ini
// langsung diperbarui sehingga UI berubah tanpa reload.
export interface SiteSettings {
  siteName:       string;   // site_name
  tagline:        string;   // tagline  → HeroSection + auth layout
  phone:          string;   // phone
  email:          string;   // email
  whatsapp:       string;   // wa_number  (format: 628xxx tanpa +)
  instagram:      string;   // instagram  (boleh "@handle" atau "handle")
  address:        string;   // address
  mapEmbed:       string;   // map_embed  (iframe src)
  mapUrl:         string;   // map_url    (Google Maps link langsung)
  legalNumber:    string;   // legal_number → Footer BH badge
  operatingHours: string;   // jam_operasional → ContactSection
  totalAnggota:   string;   // total_anggota → Hero subtitle, Testimonials, Footer
  simpananPokok:  string;   // simpanan_pokok → FeaturesSection note
  simpananWajib:  string;   // simpanan_wajib → FeaturesSection note
}

// Keys DB → field store
const KEY_MAP: Record<string, keyof SiteSettings> = {
  site_name:       "siteName",
  tagline:         "tagline",
  phone:           "phone",
  email:           "email",
  wa_number:       "whatsapp",
  instagram:       "instagram",
  address:         "address",
  map_embed:       "mapEmbed",
  map_url:         "mapUrl",
  legal_number:    "legalNumber",
  jam_operasional: "operatingHours",
  total_anggota:   "totalAnggota",
  simpanan_pokok:  "simpananPokok",
  simpanan_wajib:  "simpananWajib",
};

const DEFAULTS: SiteSettings = {
  siteName:       SITE_CONFIG.name,
  tagline:        SITE_CONFIG.tagline,
  phone:          SITE_CONFIG.phone,
  email:          SITE_CONFIG.email,
  whatsapp:       SITE_CONFIG.whatsapp,
  instagram:      SITE_CONFIG.instagram,
  address:        SITE_CONFIG.address,
  mapEmbed:       "",
  mapUrl:         "",
  legalNumber:    SITE_CONFIG.legalNumber,
  operatingHours: "Senin – Sabtu: 08.00 – 17.00 WIB",
  totalAnggota:   "150.000+",
  simpananPokok:  "Rp 5.000.000",
  simpananWajib:  "Rp 200.000/bulan",
};

interface SettingsState extends SiteSettings {
  status: "idle" | "loading" | "ready";
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  status: "idle",

  fetchSettings: async () => {
    if (get().status !== "idle") return; // muat sekali per sesi
    set({ status: "loading" });
    try {
      const { data } = await (supabase.from("site_settings") as any)
        .select("key,value");

      const patch: Partial<SiteSettings> = {};
      (data || []).forEach((row: any) => {
        const field = KEY_MAP[row.key];
        if (field && row.value != null) {
          (patch as any)[field] = String(row.value);
        }
      });

      set({ ...patch, status: "ready" });
    } catch {
      set({ status: "ready" });
    }
  },
}));

// ── Hooks ────────────────────────────────────────────────────────────────────

function useLoadSettings() {
  const fetchSettings = useSettingsStore((s) => s.fetchSettings);
  useEffect(() => { fetchSettings(); }, [fetchSettings]);
}

/** Nama koperasi (site_name). */
export function useSiteName(): string {
  useLoadSettings();
  return useSettingsStore((s) => s.siteName);
}

/** Semua settings sekaligus (untuk komponen yang butuh banyak field). */
export function useSiteSettings(): SiteSettings {
  useLoadSettings();
  return useSettingsStore((s) => ({
    siteName:       s.siteName,
    tagline:        s.tagline,
    phone:          s.phone,
    email:          s.email,
    whatsapp:       s.whatsapp,
    instagram:      s.instagram,
    address:        s.address,
    mapEmbed:       s.mapEmbed,
    mapUrl:         s.mapUrl,
    legalNumber:    s.legalNumber,
    operatingHours: s.operatingHours,
    totalAnggota:   s.totalAnggota,
    simpananPokok:  s.simpananPokok,
    simpananWajib:  s.simpananWajib,
  }));
}

/** Normalise instagram handle → tanpa "@". */
export function igHandle(val: string): string {
  return val.replace(/^@/, "");
}

/** Normalise whatsapp → angka saja, format 628xxx. */
export function waNumber(val: string): string {
  const digits = val.replace(/\D/g, "");
  if (!digits) return "";
  // 08xxx → 628xxx
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  return digits;
}
