"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MapPin, Phone, Mail, MessageCircle, Clock, Send } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useSiteSettings, waNumber } from "@/store/useSettingsStore";

const FALLBACK_PHOTO = "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&q=80";

export default function ContactSection() {
  const s = useSiteSettings();
  const siteName = s.siteName;
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buildingPhoto, setBuildingPhoto] = useState<string>(FALLBACK_PHOTO);

  useEffect(() => {
    supabase
      .from("site_settings" as any)
      .select("value")
      .eq("key", "building_photo_url")
      .maybeSingle()                          // ← tidak throw 406 saat baris belum ada
      .then(({ data }) => {
        if (data && (data as any).value) {
          setBuildingPhoto((data as any).value);
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setSent(true);
  };

  return (
    <section id="kontak" className="py-20 lg:py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0d0d00]/30 to-black" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="gold" className="mb-4">Hubungi Kami</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4">
            Kami Siap <span className="text-gold-gradient">Membantu Anda</span>
          </h2>
          <p className="text-white/80 max-w-xl mx-auto">
            Tim kami tersedia 7 hari seminggu untuk menjawab pertanyaan dan membantu kebutuhan Anda.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {[
              { icon: MapPin, label: "Alamat Kantor", value: s.address   || SITE_CONFIG.address, color: "text-yellow-400" },
              { icon: Phone, label: "Telepon",        value: s.phone     || SITE_CONFIG.phone,   color: "text-green-400" },
              { icon: Mail, label: "Email",           value: s.email     || SITE_CONFIG.email,   color: "text-blue-400" },
              { icon: Clock, label: "Jam Operasional", value: s.operatingHours || "Senin – Sabtu: 08.00 – 17.00 WIB", color: "text-purple-400" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <Card key={i} variant="glass" className="gradient-border">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-white/65 text-xs mb-0.5">{item.label}</p>
                      <p className="text-white font-medium text-sm">{item.value}</p>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* WhatsApp */}
            <a
              href={`https://wa.me/${waNumber(s.whatsapp) || SITE_CONFIG.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 glass-dark gold-border-glow rounded-2xl p-5 hover:bg-green-500/5 hover:border-green-500/30 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                <MessageCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Chat via WhatsApp</p>
                <p className="text-white/70 text-sm">Respon dalam 5-15 menit</p>
              </div>
              <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </a>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card variant="glass" className="gradient-border">
              {sent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <Send className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Pesan Terkirim!</h3>
                  <p className="text-white/80 mb-6">Tim kami akan menghubungi Anda dalam 1x24 jam.</p>
                  <Button variant="outline-gold" onClick={() => setSent(false)}>Kirim Pesan Lain</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="text-lg font-bold text-white mb-6">Kirim Pesan</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Nama Lengkap"
                      placeholder="Masukkan nama Anda"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                    <Input
                      label="Email"
                      type="email"
                      placeholder="email@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                  <Input
                    label="No. WhatsApp / Telepon"
                    placeholder="08xx-xxxx-xxxx"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-white/85">Pesan</label>
                    <textarea
                      rows={4}
                      placeholder="Tuliskan pertanyaan atau pesan Anda..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      required
                      className="input-gold w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 resize-none"
                    />
                  </div>
                  <Button type="submit" variant="gold" fullWidth size="lg" loading={loading}>
                    <Send className="w-4 h-4" />
                    Kirim Pesan
                  </Button>
                </form>
              )}
            </Card>
          </motion.div>
        </div>

        {/* ── Map + Building Photo ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, background: "rgba(14,14,14,0.85)", border: "1px solid rgba(212,175,55,0.18)", borderRadius: 20, overflow: "hidden" }}
          className="map-grid"
        >
          {/* Building Photo — left */}
          <div style={{ position: "relative", minHeight: 420, overflow: "hidden" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={buildingPhoto}
              alt="Gedung Kantor Koperasi"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block", minHeight: 420 }}
            />
            {/* Dark gradient overlay */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.1) 100%)" }} />
            {/* Gold ring top-right decoration */}
            <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", border: "1px solid rgba(212,175,55,0.12)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", border: "1px solid rgba(212,175,55,0.08)", pointerEvents: "none" }} />

            {/* Content overlay */}
            <div style={{ position: "absolute", inset: 0, padding: 28, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              {/* Top badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 10, padding: "6px 14px", width: "fit-content", backdropFilter: "blur(10px)" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
                <span style={{ color: "#D4AF37", fontWeight: 700, fontSize: ".75rem" }}>Kantor Buka Hari Ini</span>
              </div>

              {/* Bottom info */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <img src="/logo.jpg" alt="KE" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(212,175,55,0.4)" }} />
                  <div>
                    <p style={{ color: "#fff", fontWeight: 900, fontSize: ".95rem", lineHeight: 1.1 }}>{siteName}</p>
                    <p style={{ color: "#D4AF37", fontSize: ".72rem", fontWeight: 600 }}>Kantor Pusat</p>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {[
                    { icon: MapPin, text: s.address || SITE_CONFIG.address, color: "#D4AF37" },
                    { icon: Phone,  text: s.phone   || SITE_CONFIG.phone,   color: "#4ade80" },
                    { icon: Clock,  text: s.operatingHours || "Senin–Sabtu: 08.00 – 17.00 WIB", color: "#60a5fa" },
                  ].map(({ icon: Icon, text, color }) => (
                    <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <Icon style={{ width: 13, height: 13, color, flexShrink: 0, marginTop: 2 }} />
                      <span style={{ color: "rgba(255,255,255,0.7)", fontSize: ".78rem", lineHeight: 1.5 }}>{text}</span>
                    </div>
                  ))}
                </div>
                <a
                  href={s.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address || SITE_CONFIG.address)}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 16, padding: "8px 16px", borderRadius: 10, background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.35)", color: "#D4AF37", fontSize: ".78rem", fontWeight: 700, textDecoration: "none", backdropFilter: "blur(10px)" }}>
                  <MapPin style={{ width: 12, height: 12 }} />
                  Buka di Google Maps
                </a>
              </div>
            </div>
          </div>

          {/* Google Maps — right */}
          <div style={{ position: "relative", minHeight: 420 }}>
            <iframe
              title={`Lokasi ${siteName}`}
              src={s.mapEmbed || `https://maps.google.com/maps?q=${encodeURIComponent(s.address || SITE_CONFIG.address)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
              width="100%"
              height="100%"
              style={{ display: "block", border: "none", minHeight: 420, filter: "invert(90%) hue-rotate(180deg)" }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </motion.div>

      </div>
    </section>
  );
}
