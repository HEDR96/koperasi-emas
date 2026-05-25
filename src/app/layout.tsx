import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Koperasi Emas | Investasi Emas Aman & Terpercaya",
    template: "%s | Koperasi Emas",
  },
  description:
    "Platform koperasi emas terpercaya. Tabungan emas, cicilan 0%, buyback instan, dan investasi emas untuk 150.000+ anggota Indonesia.",
  keywords: ["koperasi emas", "investasi emas", "tabungan emas", "cicilan emas", "buyback emas"],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://koperasiemas.co.id",
    title: "Koperasi Emas",
    description: "Platform koperasi emas terpercaya",
    siteName: "Koperasi Emas",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <body
        className="antialiased min-h-screen"
        style={{ background: "#0a0a0a", color: "#f0f0f0", fontFamily: "var(--font-inter), system-ui, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
