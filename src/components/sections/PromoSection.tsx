"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Tag, RefreshCw, LogIn, MessageCircle } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { gdriveImage } from "@/lib/utils";

const fmtRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);

// Nomor WhatsApp koperasi (sama dengan halaman cicilan).
const WA_ADMIN    = "6281297533899";
const WA_PENGURUS = "6288214460345";

interface PromoItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  gram_weight: number | null;
  price: number | null;
  expired_at: string | null;
}

// Susun pesan WhatsApp sesuai promo yang diklik.
function promoWaMessage(item: PromoItem): string {
  const lines = ["Halo, saya tertarik dengan promo berikut:", `• Promo: ${item.title}`];
  if (item.gram_weight != null) lines.push(`• Berat: ${item.gram_weight} gram`);
  if (item.price != null)       lines.push(`• Harga: ${fmtRp(item.price)}`);
  lines.push("", "Mohon info lebih lanjut. Terima kasih.");
  return encodeURIComponent(lines.join("\n"));
}

function PromoCard({ item, index }: { item: PromoItem; index: number }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      style={{
        background: "rgba(14,14,14,0.85)",
        border: "1px solid rgba(212,175,55,0.15)",
        borderRadius: 20,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "border-color .3s, box-shadow .3s",
        cursor: "pointer",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.4)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 48px rgba(212,175,55,0.1)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.15)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", width: "100%", paddingTop: "62%", background: "rgba(212,175,55,0.06)", flexShrink: 0 }}>
        {item.image_url && !imgError ? (
          <img
            src={gdriveImage(item.image_url)}
            alt={item.title}
            onError={() => setImgError(true)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShoppingBag style={{ width: 40, height: 40, color: "rgba(212,175,55,0.25)" }} />
          </div>
        )}
        {/* Gram badge */}
        {item.gram_weight != null && (
          <div style={{
            position: "absolute", top: 12, right: 12,
            background: "linear-gradient(135deg,#D4AF37,#F5D060)",
            color: "#0a0a0a", borderRadius: 10, padding: "4px 10px",
            fontSize: ".75rem", fontWeight: 900,
          }}>
            {item.gram_weight} gram
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "16px 18px 20px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <h3 style={{ color: "#fff", fontWeight: 800, fontSize: ".95rem", lineHeight: 1.3 }}>{item.title}</h3>
        {item.price != null && (
          <p style={{ color: "#D4AF37", fontWeight: 900, fontSize: "1.05rem", margin: 0 }}>{fmtRp(item.price)}</p>
        )}
        {item.description && (
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: ".8rem", lineHeight: 1.6, flex: 1 }}>
            {item.description}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
          {item.expired_at && (
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: ".72rem" }}>
              s/d {new Date(item.expired_at).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <span style={{ background: "rgba(212,175,55,0.1)", color: "#D4AF37", borderRadius: 8, padding: "3px 10px", fontSize: ".7rem", fontWeight: 700, marginLeft: "auto" }}>
            <Tag style={{ width: 10, height: 10, display: "inline", marginRight: 4 }} />
            Promo
          </span>
        </div>

        {/* Tombol WhatsApp — kirim pesan otomatis sesuai promo */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
          <a
            href={`https://wa.me/${WA_ADMIN}?text=${promoWaMessage(item)}`}
            target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "9px 4px", borderRadius: 10, background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.3)", textDecoration: "none" }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#25d366", fontWeight: 700, fontSize: ".78rem" }}>
              <MessageCircle style={{ width: 13, height: 13 }} /> WA Admin
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: ".66rem" }}>0812-9753-3899</span>
          </a>
          <a
            href={`https://wa.me/${WA_PENGURUS}?text=${promoWaMessage(item)}`}
            target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "9px 4px", borderRadius: 10, background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.3)", textDecoration: "none" }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#25d366", fontWeight: 700, fontSize: ".78rem" }}>
              <MessageCircle style={{ width: 13, height: 13 }} /> WA Pengurus
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: ".66rem" }}>0882-1446-0345</span>
          </a>
        </div>
      </div>
    </motion.div>
  );
}

const PLACEHOLDER_ITEMS: PromoItem[] = [
  { id: "1", title: "Tabungan Emas Perdana", description: "Mulai tabungan emas pertama Anda dengan harga spesial member. Nikmati kemudahan menabung emas dari Rp 10.000.", image_url: null, gram_weight: null, price: null, expired_at: null },
  { id: "2", title: "Cicilan Emas 0% Bunga", description: "Beli emas impian dengan cicilan tanpa bunga khusus untuk anggota aktif koperasi.", image_url: null, gram_weight: null, price: null, expired_at: null },
  { id: "3", title: "Buyback Harga Terbaik", description: "Jual kembali emas Anda dengan harga buyback terbaik di kelasnya. Dana cair dalam 1x24 jam.", image_url: null, gram_weight: null, price: null, expired_at: null },
  { id: "4", title: "Bonus Referral Member", description: "Ajak teman bergabung dan dapatkan bonus emas untuk setiap referral yang berhasil mendaftar.", image_url: null, gram_weight: null, price: null, expired_at: null },
];

export default function PromoSection() {
  const [items, setItems] = useState<PromoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const nowIso = new Date().toISOString();
        const { data } = await (supabase.from("promos") as any)
          .select("id,title,description,image_url,gram_weight,price,expired_at,is_active")
          .eq("is_active", true)
          .or(`expired_at.is.null,expired_at.gt.${nowIso}`)
          .order("created_at", { ascending: false });
        setItems(data?.length ? data : PLACEHOLDER_ITEMS);
      } catch {
        setItems(PLACEHOLDER_ITEMS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section id="promo" style={{ padding: "80px 0", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#000,rgba(13,9,0,0.6),#000)", pointerEvents: "none" }} />

      <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 20, padding: "5px 16px", color: "#D4AF37", fontWeight: 700, fontSize: ".78rem", marginBottom: 14 }}>
            <ShoppingBag style={{ width: 14, height: 14 }} />
            Promo & Penawaran
          </span>
          <h2 style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(1.8rem,4vw,2.8rem)", marginBottom: 12 }}>
            Penawaran{" "}
            <span className="text-gold-gradient">Terbaik Kami</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "clamp(.9rem,2vw,1.05rem)", maxWidth: 500, margin: "0 auto" }}>
            Produk dan program eksklusif untuk anggota koperasi. Login untuk melihat harga member.
          </p>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)" }}>
            <RefreshCw style={{ width: 28, height: 28, animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
            <p>Memuat promo...</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 20 }}>
            {items.map((item, i) => (
              <PromoCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ textAlign: "center", marginTop: 40 }}>
          <Link href="/auth/login" style={{ textDecoration: "none" }}>
            <button className="btn-gold" style={{ padding: "13px 32px", borderRadius: 14, border: "none", cursor: "pointer", fontSize: ".95rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 8 }}>
              <LogIn style={{ width: 16, height: 16 }} />
              Login untuk Harga Member
            </button>
          </Link>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: ".78rem", marginTop: 10 }}>
            Harga anggota lebih hemat dari non-anggota
          </p>
        </motion.div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}
