"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MapPin, Phone, Mail, MessageCircle, Clock, Send } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";
import { useState } from "react";

export default function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

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
          <p className="text-white/50 max-w-xl mx-auto">
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
              { icon: MapPin, label: "Alamat Kantor", value: SITE_CONFIG.address, color: "text-yellow-400" },
              { icon: Phone, label: "Telepon", value: SITE_CONFIG.phone, color: "text-green-400" },
              { icon: Mail, label: "Email", value: SITE_CONFIG.email, color: "text-blue-400" },
              { icon: Clock, label: "Jam Operasional", value: "Senin - Sabtu: 08.00 - 17.00 WIB", color: "text-purple-400" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <Card key={i} variant="glass" className="gradient-border">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-white/40 text-xs mb-0.5">{item.label}</p>
                      <p className="text-white font-medium text-sm">{item.value}</p>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* WhatsApp */}
            <a
              href={`https://wa.me/${SITE_CONFIG.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 glass-dark gold-border-glow rounded-2xl p-5 hover:bg-green-500/5 hover:border-green-500/30 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                <MessageCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Chat via WhatsApp</p>
                <p className="text-white/40 text-sm">Respon dalam 5-15 menit</p>
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
                  <p className="text-white/50 mb-6">Tim kami akan menghubungi Anda dalam 1x24 jam.</p>
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
                    <label className="text-sm font-medium text-white/70">Pesan</label>
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

        {/* ── Map Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          style={{ marginTop: 32 }}
        >
          <div style={{
            background: "rgba(14,14,14,0.85)",
            border: "1px solid rgba(212,175,55,0.18)",
            borderRadius: 20,
            overflow: "hidden",
          }}>
            {/* Map header */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(212,175,55,0.1)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(212,175,55,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MapPin style={{ width: 18, height: 18, color: "#D4AF37" }} />
              </div>
              <div>
                <p style={{ color: "#fff", fontWeight: 700, fontSize: ".9rem", lineHeight: 1 }}>Lokasi Kantor Kami</p>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: ".75rem", marginTop: 3 }}>{SITE_CONFIG.address}</p>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE_CONFIG.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)", color: "#D4AF37", fontSize: ".78rem", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}
              >
                <MapPin style={{ width: 13, height: 13 }} />
                Buka di Maps
              </a>
            </div>
            {/* Iframe */}
            <iframe
              title="Lokasi Koperasi Emas"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(SITE_CONFIG.address)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
              width="100%"
              height="380"
              style={{ display: "block", border: "none", filter: "invert(90%) hue-rotate(180deg)" }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </motion.div>

      </div>
    </section>
  );
}
