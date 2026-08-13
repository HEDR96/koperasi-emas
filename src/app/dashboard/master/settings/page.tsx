"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, RefreshCw, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSettingsStore, waNumber } from "@/store/useSettingsStore";
import RupiahInput from "@/components/ui/RupiahInput";
import { FEATURES } from "@/lib/constants";

const ICON_OPTIONS = [
  "PiggyBank","CreditCard","ArrowLeftRight","TrendingUp",
  "ShoppingBag","Send","Users","Gift","FileText","Wallet",
  "Landmark","BadgeDollarSign",
];

interface FeatureCard { icon: string; title: string; desc: string; }

const DEFAULT_FEATURES: FeatureCard[] = FEATURES.map(f => ({ icon: f.icon, title: f.title, desc: f.desc }));

// Bersihkan input persen: hanya digit & satu titik desimal.
const sanitizePercent = (v: string) => {
  const cleaned = v.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  return parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleaned;
};

interface Setting {
  key: string;
  value: string;
  label: string;
  type: string;
  group_name: string;
}

const DEFAULTS: Setting[] = [
  // Informasi Umum
  { key:"site_name",      value:"Koperasi Emas",                label:"Nama Koperasi",           type:"text",     group_name:"Informasi Umum" },
  { key:"tagline",        value:"Investasi Emas Terpercaya",    label:"Tagline / Slogan",        type:"text",     group_name:"Informasi Umum" },
  { key:"legal_number",   value:"BH.0012345/KOP.2019",          label:"Nomor Badan Hukum",       type:"text",     group_name:"Informasi Umum" },
  { key:"total_anggota",  value:"150.000+",                     label:"Jumlah Anggota (tampil)", type:"text",     group_name:"Informasi Umum" },
  // Hero / Beranda
  { key:"hero_badge",         value:"Terdaftar Kementerian Koperasi & UKM RI", label:"Badge Atas Judul",   type:"text",     group_name:"Hero (Beranda)" },
  { key:"hero_subtitle",      value:"Platform koperasi emas terpercaya untuk 150.000+ anggota Indonesia. Tabung, cicil, buyback, gadai simpanan, dan dapatkan SHU tahunan.", label:"Subjudul", type:"textarea", group_name:"Hero (Beranda)" },
  { key:"hero_cta_primary",   value:"Masuk & Mulai Investasi",  label:"Tombol CTA Utama",   type:"text",     group_name:"Hero (Beranda)" },
  { key:"hero_cta_secondary", value:"Lihat Harga Emas",         label:"Tombol CTA Kedua",   type:"text",     group_name:"Hero (Beranda)" },
  // Fitur Unggulan
  { key:"features_badge",    value:"Fitur Lengkap",                        label:"Badge",    type:"text",     group_name:"Fitur Unggulan" },
  { key:"features_title",    value:"Semua Kebutuhan Emas dalam Satu Platform", label:"Judul", type:"text",     group_name:"Fitur Unggulan" },
  { key:"features_subtitle", value:"Dari Simpanan harian hingga investasi jangka panjang, ekosistem lengkap untuk perjalanan emas Anda.", label:"Subjudul", type:"textarea", group_name:"Fitur Unggulan" },
  { key:"features_json",     value:JSON.stringify(DEFAULT_FEATURES),       label:"Kartu Fitur", type:"features_list", group_name:"Fitur Unggulan" },
  // Promo
  { key:"promo_badge",    value:"Produk & Penawaran",       label:"Badge",    type:"text",     group_name:"Promo" },
  { key:"promo_title",    value:"Produk Unggulan Kami",     label:"Judul",    type:"text",     group_name:"Promo" },
  { key:"promo_subtitle", value:"Pilih produk, tambahkan ke keranjang, dan pesan langsung via WhatsApp.", label:"Subjudul", type:"textarea", group_name:"Promo" },
  // Testimoni
  { key:"testimoni_badge",    value:"Testimoni Anggota",                  label:"Badge",    type:"text",     group_name:"Testimoni" },
  { key:"testimoni_subtitle", value:"Cerita sukses anggota koperasi dari seluruh Indonesia.", label:"Subjudul", type:"textarea", group_name:"Testimoni" },
  // FAQ
  { key:"faq_badge",    value:"FAQ",                    label:"Badge",    type:"text",     group_name:"FAQ" },
  { key:"faq_title",    value:"Pertanyaan Umum",         label:"Judul",    type:"text",     group_name:"FAQ" },
  { key:"faq_subtitle", value:"Temukan jawaban atas pertanyaan yang paling sering ditanyakan.", label:"Subjudul", type:"textarea", group_name:"FAQ" },
  // Section Kontak (teks landing page, bukan data kontak)
  { key:"kontak_badge",    value:"Hubungi Kami",            label:"Badge",    type:"text",     group_name:"Section Kontak" },
  { key:"kontak_title",    value:"Kami Siap Membantu Anda", label:"Judul",    type:"text",     group_name:"Section Kontak" },
  { key:"kontak_subtitle", value:"Tim kami tersedia 7 hari seminggu untuk menjawab pertanyaan dan membantu kebutuhan Anda.", label:"Subjudul", type:"textarea", group_name:"Section Kontak" },
  // Bisnis
  { key:"jam_operasional",value:"Senin – Sabtu: 08.00 – 17.00 WIB", label:"Jam Operasional",   type:"text",     group_name:"Bisnis" },
  { key:"simpanan_pokok", value:"Rp 5.000.000",                 label:"Simpanan Pokok",          type:"text",     group_name:"Bisnis" },
  { key:"simpanan_wajib", value:"Rp 200.000/bulan",             label:"Simpanan Wajib",          type:"text",     group_name:"Bisnis" },
  // Kontak
  { key:"wa_number",      value:"",  label:"Nomor WhatsApp",    type:"text",     group_name:"Kontak" },
  { key:"email",          value:"",  label:"Email",             type:"email",    group_name:"Kontak" },
  { key:"phone",          value:"",  label:"Telepon",           type:"text",     group_name:"Kontak" },
  { key:"instagram",      value:"",  label:"Instagram",         type:"text",     group_name:"Kontak" },
  // Lokasi
  { key:"address",        value:"",  label:"Alamat",            type:"textarea", group_name:"Lokasi" },
  { key:"map_url",        value:"",  label:"URL Google Maps",   type:"url",      group_name:"Lokasi" },
  { key:"map_embed",      value:"",  label:"Embed Maps (iframe src)", type:"url", group_name:"Lokasi" },
  // Cicilan — parameter rumus cicilan (a + b − c)
  { key:"cicilan_admin_anggota",          value:"0", label:"Admin Anggota (Rp)",          type:"rupiah",  group_name:"Cicilan" },
  { key:"cicilan_admin_non_anggota",      value:"0", label:"Admin Non-Anggota (Rp)",      type:"rupiah",  group_name:"Cicilan" },
  { key:"cicilan_persen_bulan_anggota",   value:"0", label:"Persen per Bulan Anggota (%)",     type:"percent", group_name:"Cicilan" },
  { key:"cicilan_persen_bulan_non_anggota", value:"0", label:"Persen per Bulan Non-Anggota (%)", type:"percent", group_name:"Cicilan" },
  { key:"cicilan_persen_dp_anggota",      value:"0", label:"Persen DP Anggota (%)",       type:"percent", group_name:"Cicilan" },
  { key:"cicilan_persen_dp_non_anggota",  value:"0", label:"Persen DP Non-Anggota (%)",   type:"percent", group_name:"Cicilan" },
  // Gadai — parameter rumus gadai simpanan
  { key:"gadai_admin_anggota",   value:"0", label:"Biaya Admin Gadai Anggota (Rp)", type:"rupiah",  group_name:"Gadai" },
  { key:"gadai_persen_anggota",  value:"0", label:"Persen Gadai Anggota (%)",       type:"percent", group_name:"Gadai" },
];

const GROUPS = [
  "Informasi Umum","Hero (Beranda)","Fitur Unggulan","Promo","Testimoni","FAQ","Section Kontak",
  "Bisnis","Kontak","Lokasi","Cicilan","Gadai",
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string,string>>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [savingCicilan, setSavingCicilan] = useState(false);
  const [savedCicilan, setSavedCicilan]   = useState(false);
  const [savingGadai, setSavingGadai]     = useState(false);
  const [savedGadai, setSavedGadai]       = useState(false);
  const [error, setError]           = useState("");
  const [featuresList, setFeaturesList] = useState<FeatureCard[]>(DEFAULT_FEATURES);

  function parseFeatures(json: string): FeatureCard[] {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {}
    return DEFAULT_FEATURES;
  }

  // Update daftar kartu fitur + simpan sebagai JSON di settings["features_json"]
  // supaya ikut tersimpan lewat tombol "Simpan Pengaturan" utama.
  function syncFeaturesJson(next: FeatureCard[]) {
    setFeaturesList(next);
    setSettings(s => ({ ...s, features_json: JSON.stringify(next) }));
  }

  async function load() {
    setLoading(true);
    try {
      const { data } = await (supabase.from("site_settings") as any).select("key,value");
      const map: Record<string,string> = {};
      // seed defaults first
      DEFAULTS.forEach(d => { map[d.key] = d.value; });
      // override with DB values
      (data||[]).forEach((row:any) => { map[row.key] = row.value ?? ""; });
      setSettings(map);
      setFeaturesList(parseFeatures(map["features_json"]));
    } catch {
      // table may not exist yet, use defaults
      const map: Record<string,string> = {};
      DEFAULTS.forEach(d => { map[d.key] = d.value; });
      setSettings(map);
      setFeaturesList(parseFeatures(map["features_json"]));
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    setSaving(true); setError(""); setSaved(false);
    try {
      const rows = DEFAULTS.map(d => ({
        key:        d.key,
        value:      settings[d.key] ?? "",
        label:      d.label,
        type:       d.type,
        group_name: d.group_name,
      }));
      const { error: err } = await (supabase.from("site_settings") as any).upsert(rows, { onConflict:"key" });
      if (err) { setError("Gagal menyimpan: " + err.message); }
      else {
        // Perbarui store langsung supaya semua komponen ikut berubah tanpa reload.
        useSettingsStore.setState({
          siteName:       (settings["site_name"]      ?? "").trim() || useSettingsStore.getState().siteName,
          tagline:        (settings["tagline"]         ?? "").trim(),
          legalNumber:    (settings["legal_number"]    ?? "").trim(),
          totalAnggota:   (settings["total_anggota"]   ?? "").trim(),
          operatingHours: (settings["jam_operasional"] ?? "").trim(),
          simpananPokok:  (settings["simpanan_pokok"]  ?? "").trim(),
          simpananWajib:  (settings["simpanan_wajib"]  ?? "").trim(),
          phone:          (settings["phone"]           ?? "").trim(),
          email:          (settings["email"]           ?? "").trim(),
          whatsapp:       waNumber(settings["wa_number"] ?? ""),
          instagram:      (settings["instagram"]       ?? "").trim(),
          address:        (settings["address"]         ?? "").trim(),
          mapEmbed:       (settings["map_embed"]       ?? "").trim(),
          mapUrl:         (settings["map_url"]         ?? "").trim(),

          heroBadge:         (settings["hero_badge"]         ?? "").trim(),
          heroSubtitle:      (settings["hero_subtitle"]      ?? "").trim(),
          heroCtaPrimary:    (settings["hero_cta_primary"]   ?? "").trim(),
          heroCtaSecondary:  (settings["hero_cta_secondary"] ?? "").trim(),
          featuresBadge:     (settings["features_badge"]     ?? "").trim(),
          featuresTitle:     (settings["features_title"]     ?? "").trim(),
          featuresSubtitle:  (settings["features_subtitle"]  ?? "").trim(),
          featuresJson:      (settings["features_json"]      ?? "").trim(),
          promoBadge:        (settings["promo_badge"]        ?? "").trim(),
          promoTitle:        (settings["promo_title"]        ?? "").trim(),
          promoSubtitle:     (settings["promo_subtitle"]     ?? "").trim(),
          testimoniBadge:    (settings["testimoni_badge"]    ?? "").trim(),
          testimoniSubtitle: (settings["testimoni_subtitle"] ?? "").trim(),
          faqBadge:          (settings["faq_badge"]          ?? "").trim(),
          faqTitle:          (settings["faq_title"]          ?? "").trim(),
          faqSubtitle:       (settings["faq_subtitle"]       ?? "").trim(),
          kontakBadge:       (settings["kontak_badge"]       ?? "").trim(),
          kontakTitle:       (settings["kontak_title"]       ?? "").trim(),
          kontakSubtitle:    (settings["kontak_subtitle"]    ?? "").trim(),
          status: "ready",
        });
        setSaved(true); setTimeout(()=>setSaved(false), 2500);
      }
    } catch (e:any) {
      setError(e.message || "Terjadi kesalahan.");
    }
    setSaving(false);
  }

  // Simpan hanya parameter gadai (2 key)
  async function handleSaveGadai() {
    setSavingGadai(true); setError(""); setSavedGadai(false);
    try {
      const gadaiKeys = DEFAULTS.filter(d => d.group_name === "Gadai");
      const rows = gadaiKeys.map(d => ({ key:d.key, value:settings[d.key]??"0", label:d.label, type:d.type, group_name:d.group_name }));
      const { error: err } = await (supabase.from("site_settings") as any).upsert(rows, { onConflict:"key" });
      if (err) setError("Gagal menyimpan gadai: " + err.message);
      else { setSavedGadai(true); setTimeout(()=>setSavedGadai(false), 3000); }
    } catch (e:any) { setError(e?.message||"Terjadi kesalahan."); }
    setSavingGadai(false);
  }

  // Preview kalkulasi gadai (contoh simpanan Rp 10.000.000)
  function previewGadai() {
    const admin  = Number(settings["gadai_admin_anggota"])  || 0;
    const persen = Number(settings["gadai_persen_anggota"]) || 0;
    const contoh = 10_000_000;
    const nilaiMax = Math.max(0, Math.round(contoh * 0.8 - admin));
    return [1,2,3,4].map(t => ({
      tenor: t,
      angsuran: t > 0 ? Math.ceil(nilaiMax * (1 + persen/100) / t) : 0,
    }));
  }

  // Simpan hanya parameter cicilan (6 key)
  async function handleSaveCicilan() {
    setSavingCicilan(true); setError(""); setSavedCicilan(false);
    try {
      const cicilanKeys = DEFAULTS.filter(d => d.group_name === "Cicilan");
      const rows = cicilanKeys.map(d => ({
        key: d.key,
        value: settings[d.key] ?? "0",
        label: d.label,
        type: d.type,
        group_name: d.group_name,
      }));
      const { error: err } = await (supabase.from("site_settings") as any).upsert(rows, { onConflict:"key" });
      if (err) setError("Gagal menyimpan cicilan: " + err.message);
      else { setSavedCicilan(true); setTimeout(()=>setSavedCicilan(false), 3000); }
    } catch (e:any) { setError(e?.message||"Terjadi kesalahan."); }
    setSavingCicilan(false);
  }

  // Preview kalkulasi cicilan langsung dari input saat ini (contoh: 1 gram harga 2.000.000)
  function previewCicilan() {
    const admin    = Number(settings["cicilan_admin_anggota"])          || 0;
    const pBulan   = Number(settings["cicilan_persen_bulan_anggota"])   || 0;
    const pDp      = Number(settings["cicilan_persen_dp_anggota"])      || 0;
    const contohHarga = 2_000_000; // Rp 2.000.000 (patokan preview)
    const tenors = [6, 12, 24];
    return tenors.map(t => {
      const a = contohHarga + admin;
      const b = a * (pBulan / 100) * t;
      const c = Math.round((a + b) * (pDp / 100));
      const total = Math.round(a + b - c);
      return { tenor: t, dp: c, angsuran: t > 0 ? Math.round(total / t) : 0 };
    });
  }

  const inputStyle: React.CSSProperties = {
    width:"100%", background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.2)",
    borderRadius:10, padding:"10px 14px", color:"#2D1B00", fontSize:".9rem", outline:"none", boxSizing:"border-box",
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:28, maxWidth:720 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#2D1B00", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Pengaturan Sistem</h1>
          <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".85rem", margin:"4px 0 0" }}>
            Konfigurasi informasi dan kontak koperasi.
          </p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={load}
            style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.2)", borderRadius:10, padding:"8px 14px", color:"rgba(101,67,14,0.55)", cursor:"pointer", fontSize:".85rem" }}>
            <RefreshCw style={{ width:14, height:14 }} /> Reset
          </button>
          <button onClick={handleSave} disabled={saving||loading}
            style={{ display:"flex", alignItems:"center", gap:6, background:"linear-gradient(135deg,#D4AF37,#f0d060)", border:"none", borderRadius:10, padding:"8px 18px", color:"#0a0a0a", cursor:saving?"not-allowed":"pointer", fontSize:".88rem", fontWeight:700, opacity:saving?.7:1 }}>
            <Save style={{ width:14, height:14 }} /> {saving?"Menyimpan...":"Simpan Pengaturan"}
          </button>
        </div>
      </div>

      {saved && (
        <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
          style={{ background:"rgba(6,95,70,0.08)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:12, padding:"12px 18px", color:"#065f46", fontSize:".88rem" }}>
          Pengaturan berhasil disimpan.
        </motion.div>
      )}
      {error && (
        <div style={{ background:"rgba(153,27,27,0.08)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:12, padding:"12px 18px", color:"#991b1b", fontSize:".88rem" }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color:"rgba(101,67,14,0.35)" }}>Memuat pengaturan...</p>
      ) : (
        GROUPS.map(group => {
          const fields = DEFAULTS.filter(d => d.group_name === group && d.type !== "features_list");
          return (
            <motion.div key={group} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              style={{ background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.15)", borderRadius:16, overflow:"hidden" }}>
              <div style={{ padding:"16px 22px", borderBottom:"1px solid rgba(201,162,39,0.12)" }}>
                <h2 style={{ color:"#8B6010", fontWeight:700, fontSize:".9rem", margin:0, textTransform:"uppercase", letterSpacing:".06em" }}>{group}</h2>
              </div>
              <div style={{ padding:"20px 22px", display:"flex", flexDirection:"column", gap:16 }}>
                {fields.map(f => (
                  <div key={f.key}>
                    <label style={{ color:"rgba(101,67,14,0.55)", fontSize:".8rem", display:"block", marginBottom:7 }}>{f.label}</label>
                    {f.type === "textarea" ? (
                      <textarea value={settings[f.key]??""} onChange={e=>setSettings(s=>({...s,[f.key]:e.target.value}))}
                        rows={3} placeholder={f.label}
                        style={{ ...inputStyle, resize:"vertical", fontFamily:"inherit" }} />
                    ) : f.type === "rupiah" ? (
                      <RupiahInput value={settings[f.key]??""} onValueChange={v=>setSettings(s=>({...s,[f.key]:v}))}
                        placeholder="0" style={inputStyle} />
                    ) : f.type === "percent" ? (
                      <div style={{ position:"relative" }}>
                        <input inputMode="decimal" value={settings[f.key]??""}
                          onChange={e=>setSettings(s=>({...s,[f.key]:sanitizePercent(e.target.value)}))}
                          placeholder="0" style={{ ...inputStyle, paddingRight:34 }} />
                        <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", color:"rgba(101,67,14,0.45)", fontSize:".9rem", pointerEvents:"none" }}>%</span>
                      </div>
                    ) : (
                      <input type={f.type === "url" ? "text" : f.type}
                        value={settings[f.key]??""}
                        onChange={e=>setSettings(s=>({...s,[f.key]:e.target.value}))}
                        placeholder={f.label}
                        style={inputStyle} />
                    )}
                  </div>
                ))}

                {/* Fitur Unggulan: editor daftar kartu */}
                {group === "Fitur Unggulan" && (
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <label style={{ color:"rgba(101,67,14,0.55)", fontSize:".8rem" }}>Kartu Fitur ({featuresList.length})</label>
                      <button type="button"
                        onClick={() => syncFeaturesJson([...featuresList, { icon:"Gift", title:"Fitur Baru", desc:"" }])}
                        style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:8, background:"rgba(201,162,39,0.12)", border:"1px solid rgba(201,162,39,0.3)", color:"#8B6010", cursor:"pointer", fontSize:".78rem", fontWeight:700 }}>
                        + Tambah Kartu
                      </button>
                    </div>
                    {featuresList.map((f, i) => (
                      <div key={i} style={{ border:"1px solid rgba(201,162,39,0.18)", borderRadius:12, padding:14, display:"flex", flexDirection:"column", gap:8, background:"rgba(255,255,255,0.5)" }}>
                        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                          <select value={f.icon}
                            onChange={e => syncFeaturesJson(featuresList.map((it,idx) => idx===i ? {...it, icon:e.target.value} : it))}
                            style={{ ...inputStyle, width:170, flexShrink:0 }}>
                            {ICON_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                          <input value={f.title} placeholder="Judul kartu"
                            onChange={e => syncFeaturesJson(featuresList.map((it,idx) => idx===i ? {...it, title:e.target.value} : it))}
                            style={{ ...inputStyle, flex:1 }} />
                          <button type="button" onClick={() => syncFeaturesJson(featuresList.filter((_,idx) => idx!==i))}
                            title="Hapus kartu"
                            style={{ width:34, height:34, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:8, background:"rgba(153,27,27,0.08)", border:"1px solid rgba(248,113,113,0.25)", color:"#991b1b", cursor:"pointer" }}>
                            ✕
                          </button>
                        </div>
                        <textarea value={f.desc} rows={2} placeholder="Deskripsi kartu"
                          onChange={e => syncFeaturesJson(featuresList.map((it,idx) => idx===i ? {...it, desc:e.target.value} : it))}
                          style={{ ...inputStyle, resize:"vertical", fontFamily:"inherit" }} />
                      </div>
                    ))}
                    {featuresList.length===0 && (
                      <p style={{ color:"rgba(101,67,14,0.35)", fontSize:".78rem", margin:0 }}>Belum ada kartu fitur. Klik "Tambah Kartu" untuk menambahkan.</p>
                    )}
                  </div>
                )}

                {/* Gadai: preview kalkulasi + tombol simpan sendiri */}
                {group === "Gadai" && (() => {
                  const fmt = (n:number) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n);
                  const prev = previewGadai();
                  const admin  = Number(settings["gadai_admin_anggota"])  || 0;
                  const persen = Number(settings["gadai_persen_anggota"]) || 0;
                  const hasVal = admin > 0 || persen > 0;
                  const nilaiMax = Math.max(0, Math.round(10_000_000 * 0.8 - admin));
                  return (
                    <>
                      <div style={{ background:"rgba(96,165,250,0.06)", border:"1px solid rgba(96,165,250,0.2)", borderRadius:12, padding:"14px 16px" }}>
                        <p style={{ color:"#1d4ed8", fontWeight:700, fontSize:".8rem", margin:"0 0 6px" }}>
                          Rumus: Nilai Gadai Maks = Simpanan × 80% − Admin · Angsuran/bln = Nilai × (1 + {persen}%) / Tenor
                        </p>
                        {hasVal ? (
                          <>
                            <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".75rem", margin:"0 0 10px" }}>
                              Contoh simpanan Rp 10.000.000 → Nilai gadai maks: <strong style={{color:"#1d4ed8"}}>{fmt(nilaiMax)}</strong>
                            </p>
                            <div style={{ overflowX:"auto" }}>
                              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:".78rem" }}>
                                <thead>
                                  <tr style={{ borderBottom:"1px solid rgba(201,162,39,0.15)" }}>
                                    {["Tenor","Angsuran/bln"].map(h=>(
                                      <th key={h} style={{ padding:"6px 10px", textAlign:"left", color:"rgba(101,67,14,0.4)", fontWeight:600, textTransform:"uppercase", fontSize:".68rem" }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {prev.map(p=>(
                                    <tr key={p.tenor} style={{ borderBottom:"1px solid rgba(201,162,39,0.1)" }}>
                                      <td style={{ padding:"7px 10px", color:"#2D1B00", fontWeight:600 }}>{p.tenor} bln</td>
                                      <td style={{ padding:"7px 10px", color:"#1d4ed8", fontWeight:700 }}>{fmt(p.angsuran)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        ) : (
                          <p style={{ color:"rgba(101,67,14,0.35)", fontSize:".78rem", margin:0 }}>Isi nilai admin dan persen di atas untuk melihat preview.</p>
                        )}
                      </div>
                      <button onClick={handleSaveGadai} disabled={savingGadai}
                        style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 22px", borderRadius:11,
                          background: savedGadai ? "rgba(6,95,70,0.1)" : "linear-gradient(135deg,#60a5fa,#93c5fd)",
                          border: savedGadai ? "1px solid #34d399" : "none",
                          color: savedGadai ? "#34d399" : "#0a0a0a",
                          fontWeight:700, fontSize:".88rem", cursor:savingGadai?"not-allowed":"pointer",
                          opacity:savingGadai?.7:1, transition:"all .3s", width:"fit-content" }}>
                        {savingGadai ? <><RefreshCw style={{width:14,height:14}}/> Menyimpan...</>
                          : savedGadai ? <><CheckCircle style={{width:14,height:14}}/> Parameter Gadai Tersimpan!</>
                          : <><Save style={{width:14,height:14}}/> Simpan Parameter Gadai</>}
                      </button>
                      {savedGadai && (
                        <p style={{ color:"#065f46", fontSize:".78rem", margin:0 }}>
                          ✓ Tersimpan. Halaman Simpanan anggota akan langsung menggunakan nilai baru.
                        </p>
                      )}
                    </>
                  );
                })()}

                {/* Cicilan: preview kalkulasi + tombol simpan sendiri */}
                {group === "Cicilan" && (() => {
                  const fmt = (n:number) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n);
                  const preview = previewCicilan();
                  const hasValues = Number(settings["cicilan_persen_bulan_anggota"]) > 0 ||
                                    Number(settings["cicilan_persen_dp_anggota"])    > 0 ||
                                    Number(settings["cicilan_admin_anggota"])        > 0;
                  return (
                    <>
                      {/* Live preview */}
                      <div style={{ background:"rgba(167,139,250,0.06)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:12, padding:"14px 16px" }}>
                        <p style={{ color:"#a78bfa", fontWeight:700, fontSize:".8rem", margin:"0 0 10px" }}>
                          Preview Kalkulasi (contoh: harga emas Rp 2.000.000 / Anggota)
                        </p>
                        {!hasValues ? (
                          <p style={{ color:"rgba(101,67,14,0.35)", fontSize:".78rem", margin:0 }}>
                            Isi nilai admin, % per bulan, dan % DP di atas untuk melihat preview.
                          </p>
                        ) : (
                          <div style={{ overflowX:"auto" }}>
                            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:".78rem" }}>
                              <thead>
                                <tr style={{ borderBottom:"1px solid rgba(201,162,39,0.15)" }}>
                                  {["Tenor","DP (bayar dulu)","Angsuran/bln"].map(h=>(
                                    <th key={h} style={{ padding:"6px 10px", textAlign:"left", color:"rgba(101,67,14,0.4)", fontWeight:600, textTransform:"uppercase", fontSize:".68rem", whiteSpace:"nowrap" }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {preview.map(p=>(
                                  <tr key={p.tenor} style={{ borderBottom:"1px solid rgba(201,162,39,0.1)" }}>
                                    <td style={{ padding:"7px 10px", color:"#2D1B00", fontWeight:600 }}>{p.tenor} bln</td>
                                    <td style={{ padding:"7px 10px", color:"#1d4ed8", fontWeight:700 }}>{p.dp > 0 ? fmt(p.dp) : "—"}</td>
                                    <td style={{ padding:"7px 10px", color:"#8B6010", fontWeight:700 }}>{fmt(p.angsuran)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Tombol simpan khusus cicilan */}
                      <button onClick={handleSaveCicilan} disabled={savingCicilan}
                        style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 22px", borderRadius:11,
                          background: savedCicilan ? "rgba(6,95,70,0.1)" : "linear-gradient(135deg,#a78bfa,#c4b5fd)",
                          border: savedCicilan ? "1px solid #34d399" : "none",
                          color: savedCicilan ? "#34d399" : "#0a0a0a",
                          fontWeight:700, fontSize:".88rem", cursor:savingCicilan?"not-allowed":"pointer",
                          opacity:savingCicilan?.7:1, transition:"all .3s", width:"fit-content" }}>
                        {savingCicilan ? (
                          <><RefreshCw style={{ width:14, height:14 }} /> Menyimpan...</>
                        ) : savedCicilan ? (
                          <><CheckCircle style={{ width:14, height:14 }} /> Parameter Cicilan Tersimpan!</>
                        ) : (
                          <><Save style={{ width:14, height:14 }} /> Simpan Parameter Cicilan</>
                        )}
                      </button>
                      {savedCicilan && (
                        <p style={{ color:"#065f46", fontSize:".78rem", margin:0 }}>
                          ✓ Nilai telah tersimpan ke database. Buka tab Harga → Cicilan untuk melihat angsuran ter-update.
                        </p>
                      )}
                    </>
                  );
                })()}

                {/* Map preview */}
                {group === "Lokasi" && settings["map_embed"] && (
                  <div>
                    <label style={{ color:"rgba(101,67,14,0.4)", fontSize:".75rem", display:"block", marginBottom:8 }}>Preview Peta</label>
                    <div style={{ borderRadius:12, overflow:"hidden", border:"1px solid rgba(201,162,39,0.18)" }}>
                      <iframe
                        src={settings["map_embed"]}
                        width="100%" height="260"
                        style={{ display:"block", border:"none" }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
}

