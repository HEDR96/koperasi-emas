"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
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

  // Teks section landing page (semua diatur dari Pengaturan)
  heroBadge:         string;   // hero_badge
  heroSubtitle:      string;   // hero_subtitle
  heroCtaPrimary:    string;   // hero_cta_primary
  heroCtaSecondary:  string;   // hero_cta_secondary
  featuresBadge:     string;   // features_badge
  featuresTitle:     string;   // features_title
  featuresSubtitle:  string;   // features_subtitle
  featuresJson:      string;   // features_json → daftar kartu fitur (JSON)
  promoBadge:        string;   // promo_badge
  promoTitle:        string;   // promo_title
  promoSubtitle:     string;   // promo_subtitle
  testimoniBadge:    string;   // testimoni_badge
  testimoniSubtitle: string;   // testimoni_subtitle
  faqBadge:          string;   // faq_badge
  faqTitle:          string;   // faq_title
  faqSubtitle:       string;   // faq_subtitle
  kontakBadge:       string;   // kontak_badge
  kontakTitle:       string;   // kontak_title
  kontakSubtitle:    string;   // kontak_subtitle
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

  hero_badge:         "heroBadge",
  hero_subtitle:      "heroSubtitle",
  hero_cta_primary:   "heroCtaPrimary",
  hero_cta_secondary: "heroCtaSecondary",
  features_badge:     "featuresBadge",
  features_title:     "featuresTitle",
  features_subtitle:  "featuresSubtitle",
  features_json:      "featuresJson",
  promo_badge:        "promoBadge",
  promo_title:        "promoTitle",
  promo_subtitle:     "promoSubtitle",
  testimoni_badge:    "testimoniBadge",
  testimoni_subtitle: "testimoniSubtitle",
  faq_badge:          "faqBadge",
  faq_title:          "faqTitle",
  faq_subtitle:       "faqSubtitle",
  kontak_badge:       "kontakBadge",
  kontak_title:       "kontakTitle",
  kontak_subtitle:    "kontakSubtitle",
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

  heroBadge:         "",
  heroSubtitle:      "",
  heroCtaPrimary:    "",
  heroCtaSecondary:  "",
  featuresBadge:     "",
  featuresTitle:     "",
  featuresSubtitle:  "",
  featuresJson:      "",
  promoBadge:        "",
  promoTitle:        "",
  promoSubtitle:     "",
  testimoniBadge:    "",
  testimoniSubtitle: "",
  faqBadge:          "",
  faqTitle:          "",
  faqSubtitle:       "",
  kontakBadge:       "",
  kontakTitle:       "",
  kontakSubtitle:    "",
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

/** Semua settings sekaligus (untuk komponen yang butuh banyak field).
 *  useShallow mencegah re-render tak terbatas akibat object reference baru tiap siklus.
 */
export function useSiteSettings(): SiteSettings {
  useLoadSettings();
  return useSettingsStore(
    useShallow((s) => ({
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

      heroBadge:         s.heroBadge,
      heroSubtitle:      s.heroSubtitle,
      heroCtaPrimary:    s.heroCtaPrimary,
      heroCtaSecondary:  s.heroCtaSecondary,
      featuresBadge:     s.featuresBadge,
      featuresTitle:     s.featuresTitle,
      featuresSubtitle:  s.featuresSubtitle,
      featuresJson:      s.featuresJson,
      promoBadge:        s.promoBadge,
      promoTitle:        s.promoTitle,
      promoSubtitle:     s.promoSubtitle,
      testimoniBadge:    s.testimoniBadge,
      testimoniSubtitle: s.testimoniSubtitle,
      faqBadge:          s.faqBadge,
      faqTitle:          s.faqTitle,
      faqSubtitle:       s.faqSubtitle,
      kontakBadge:       s.kontakBadge,
      kontakTitle:       s.kontakTitle,
      kontakSubtitle:    s.kontakSubtitle,
    }))
  );
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
