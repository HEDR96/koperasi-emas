"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSettingsStore, waNumber } from "@/store/useSettingsStore";
import RupiahInput from "@/components/ui/RupiahInput";

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
];

const GROUPS = ["Informasi Umum","Bisnis","Kontak","Lokasi","Cicilan"];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string,string>>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");

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
    } catch {
      // table may not exist yet, use defaults
      const map: Record<string,string> = {};
      DEFAULTS.forEach(d => { map[d.key] = d.value; });
      setSettings(map);
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
          status: "ready",
        });
        setSaved(true); setTimeout(()=>setSaved(false), 2500);
      }
    } catch (e:any) {
      setError(e.message || "Terjadi kesalahan.");
    }
    setSaving(false);
  }

  const inputStyle: React.CSSProperties = {
    width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
    borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:".9rem", outline:"none", boxSizing:"border-box",
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:28, maxWidth:720 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Pengaturan Sistem</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>
            Konfigurasi informasi dan kontak koperasi.
          </p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={load}
            style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"8px 14px", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:".85rem" }}>
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
          style={{ background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:12, padding:"12px 18px", color:"#34d399", fontSize:".88rem" }}>
          Pengaturan berhasil disimpan.
        </motion.div>
      )}
      {error && (
        <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:12, padding:"12px 18px", color:"#f87171", fontSize:".88rem" }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color:"rgba(255,255,255,0.3)" }}>Memuat pengaturan...</p>
      ) : (
        GROUPS.map(group => {
          const fields = DEFAULTS.filter(d => d.group_name === group);
          return (
            <motion.div key={group} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, overflow:"hidden" }}>
              <div style={{ padding:"16px 22px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <h2 style={{ color:"#D4AF37", fontWeight:700, fontSize:".9rem", margin:0, textTransform:"uppercase", letterSpacing:".06em" }}>{group}</h2>
              </div>
              <div style={{ padding:"20px 22px", display:"flex", flexDirection:"column", gap:16 }}>
                {fields.map(f => (
                  <div key={f.key}>
                    <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:7 }}>{f.label}</label>
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
                        <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.4)", fontSize:".9rem", pointerEvents:"none" }}>%</span>
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

                {/* Map preview */}
                {group === "Lokasi" && settings["map_embed"] && (
                  <div>
                    <label style={{ color:"rgba(255,255,255,0.35)", fontSize:".75rem", display:"block", marginBottom:8 }}>Preview Peta</label>
                    <div style={{ borderRadius:12, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)" }}>
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
