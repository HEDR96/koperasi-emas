"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, RefreshCw, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getMarkup, saveMarkup, type Markup,
  buildDerivedCicilan, CICILAN_TENORS,
  getCicilanParams, type CicilanParams, CICILAN_PARAM_DEFAULTS,
} from "@/lib/harga";
import RupiahInput from "@/components/ui/RupiahInput";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);

// Tampilkan angka dengan pemisah ribuan (1000000 -> "1.000.000"); kosong jika tak ada angka.
const fmtRibuan = (v: string) => {
  const digits = (v ?? "").replace(/\D/g, "");
  return digits ? new Intl.NumberFormat("id-ID").format(Number(digits)) : "";
};
// Ambil hanya digit dari input bermask.
const onlyDigits = (v: string) => v.replace(/\D/g, "");

const inp: React.CSSProperties = {
  width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:".9rem", outline:"none", boxSizing:"border-box",
};
const inpSm: React.CSSProperties = { ...inp, padding:"8px 12px", fontSize:".85rem" };

type Tab = "emas" | "cicilan" | "buyback";

interface HargaBerat { id: number; gram: number; harga: number; created_at: string; }

export default function HargaEmasPage() {
  const { user } = useAuthStore();
  const isMaster = user?.role === "master";
  const [tab, setTab] = useState<Tab>("emas");

  // ─── Harga Emas per Berat ───
  const [hargaEmas, setHargaEmas]     = useState<HargaBerat[]>([]);
  const [newGram, setNewGram]         = useState("");
  const [newHarga, setNewHarga]       = useState("");
  const [savingEmas, setSavingEmas]   = useState(false);
  const [savedEmas, setSavedEmas]     = useState(false);

  // ─── Markup per gram tier (tiap berat punya markup sendiri) ───
  const [markup, setMarkup]           = useState<Markup>({ anggota:{}, nonAnggota:{} });
  // form editable: { anggota: { "<gram>": "<rp>" }, nonAnggota: {...} }
  const [markupForm, setMarkupForm]   = useState<{ anggota: Record<string,string>; nonAnggota: Record<string,string> }>({ anggota:{}, nonAnggota:{} });
  const [savingMarkup, setSavingMarkup] = useState(false);
  const [savedMarkup, setSavedMarkup] = useState(false);

  // ─── Cicilan: diturunkan otomatis dari Harga Emas + markup + parameter pengaturan ───
  const [cicilanParams, setCicilanParams] = useState<CicilanParams>(CICILAN_PARAM_DEFAULTS);
  // Master bisa melihat cicilan Anggota (yang tampil di login member) & Non-Anggota (yang tampil di landing).
  const [cicilanView, setCicilanView] = useState<"anggota" | "nonAnggota">("anggota");

  // ─── Buyback (hanya 1 gram) ───
  const [hargaBuyback, setHargaBuyback]   = useState<HargaBerat[]>([]);
  const [bbHarga, setBbHarga]             = useState("");
  const [savingBb, setSavingBb]           = useState(false);
  const [savedBb, setSavedBb]             = useState(false);

  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [{ data: e }, { data: b }, mk, cp] = await Promise.all([
        ((supabase as any).rpc("get_latest_harga_berat", { kat: "emas" }) as any),
        ((supabase as any).rpc("get_latest_harga_berat", { kat: "buyback" }) as any),
        getMarkup(),
        getCicilanParams(),
      ]);
      setMarkup(mk);
      setCicilanParams(cp);
      const toForm = (m: Record<string, number>) => {
        const o: Record<string, string> = {};
        Object.keys(m).forEach(k => { o[k] = String(m[k]); });
        return o;
      };
      setMarkupForm({ anggota: toForm(mk.anggota), nonAnggota: toForm(mk.nonAnggota) });
      // Latest per gram for display
      const latestPerGram = (rows: any[]) => {
        const seen = new Set<number>();
        return (rows||[]).filter(r => { const g=Number(r.gram); if(seen.has(g)) return false; seen.add(g); return true; })
          .map(r => ({...r, gram: Number(r.gram)}))
          .sort((a,b) => a.gram - b.gram);
      };
      setHargaEmas(latestPerGram(e||[]));
      setHargaBuyback(latestPerGram(b||[]));
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // ─── Save Harga Emas ───
  async function saveHargaEmas() {
    if (!newGram || !newHarga) return;
    setSavingEmas(true);
    await (supabase.from("harga_emas_berat") as any).insert({ gram: Number(newGram), harga: Number(newHarga), kategori:"emas", updated_by: user?.id });
    setNewGram(""); setNewHarga("");
    setSavedEmas(true); setTimeout(() => setSavedEmas(false), 2000);
    load();
    setSavingEmas(false);
  }

  // ─── Save Markup (per gram tier) ───
  async function saveMarkupHandler() {
    setSavingMarkup(true);
    const toMap = (form: Record<string, string>) => {
      const m: Record<string, number> = {};
      Object.keys(form).forEach(k => { const v = Number(form[k]) || 0; if (v) m[k] = v; });
      return m;
    };
    const next: Markup = { anggota: toMap(markupForm.anggota), nonAnggota: toMap(markupForm.nonAnggota) };
    const { error } = await saveMarkup(next);
    if (!error) {
      setMarkup(next);
      setSavedMarkup(true); setTimeout(() => setSavedMarkup(false), 2000);
    }
    setSavingMarkup(false);
  }
  const setMarkupCell = (kind: "anggota"|"nonAnggota", gram: number, val: string) =>
    setMarkupForm(p => ({ ...p, [kind]: { ...p[kind], [String(gram)]: val } }));

  // ─── Cicilan dihitung otomatis (lihat lib/harga.ts) — tidak ada simpan/hapus ───

  // ─── Save Buyback (selalu 1 gram) ───
  async function saveBuyback() {
    if (!bbHarga) return;
    setSavingBb(true);
    await (supabase.from("harga_emas_berat") as any).insert({ gram: 1, harga: Number(bbHarga), kategori:"buyback", updated_by: user?.id });
    setBbHarga("");
    setSavedBb(true); setTimeout(() => setSavedBb(false), 2000);
    load();
    setSavingBb(false);
  }

  const TABS: { id: Tab; label: string; color: string }[] = [
    { id:"emas",    label:"Harga Emas",       color:"#D4AF37" },
    { id:"cicilan", label:"Harga Cicilan",    color:"#a78bfa" },
    { id:"buyback", label:"Harga Buyback",    color:"#34d399" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:960 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Manajemen Harga</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Kelola harga emas, cicilan, dan buyback</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:"8px 20px", borderRadius:10, fontSize:".88rem", fontWeight:600, cursor:"pointer", transition:"all .2s",
              border: tab === t.id ? `1px solid ${t.color}` : "1px solid rgba(255,255,255,0.1)",
              background: tab === t.id ? `${t.color}22` : "rgba(255,255,255,0.03)",
              color: tab === t.id ? t.color : "rgba(255,255,255,0.5)" }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color:"rgba(255,255,255,0.3)" }}>Memuat data...</p> : (

      <>
      {/* ─── TAB: HARGA EMAS ─── */}
      {tab === "emas" && (
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {/* Current table + markup per baris */}
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:16, overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".85rem", margin:0 }}>Harga Beli Aktif & Markup (per berat)</p>
              <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".74rem", margin:"4px 0 0" }}>
                Markup diisi per baris berat (nominal Rp ditambahkan langsung). Harga Anggota = harga dasar + markup anggota baris itu · Harga Non-Anggota (landing) = harga dasar + markup non-anggota. Harga dasar & markup tidak ditampilkan ke anggota/publik.
              </p>
            </div>
            {hargaEmas.length === 0 ? <p style={{ padding:"20px", color:"rgba(255,255,255,0.3)", fontSize:".85rem" }}>Belum ada data</p> : (
              <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  {["Berat", "Harga Dasar", "Markup Anggota", "Harga Anggota", "Markup Non-Anggota", "Harga Non-Anggota", ...(isMaster?[""]:[])].map(h=>(
                    <th key={h} style={{ padding:"10px 16px", textAlign:"left", color:"rgba(255,255,255,0.3)", fontSize:".7rem", fontWeight:600, textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {hargaEmas.map((r,i)=>{
                    const mkA = Number(markupForm.anggota[String(r.gram)]) || 0;
                    const mkN = Number(markupForm.nonAnggota[String(r.gram)]) || 0;
                    return (
                    <tr key={r.gram} style={{ borderBottom: i<hargaEmas.length-1?"1px solid rgba(255,255,255,0.04)":"none" }}>
                      <td style={{ padding:"10px 16px", color:"#fff", fontWeight:700, whiteSpace:"nowrap" }}>{r.gram} gram</td>
                      <td style={{ padding:"10px 16px", color:"rgba(255,255,255,0.55)", fontWeight:700, whiteSpace:"nowrap" }}>{fmt(r.harga)}</td>
                      <td style={{ padding:"10px 16px" }}>
                        <div style={{ position:"relative", width:120 }}>
                          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.4)", fontSize:".8rem", pointerEvents:"none" }}>Rp</span>
                          <input inputMode="numeric" value={fmtRibuan(markupForm.anggota[String(r.gram)])} disabled={!isMaster}
                            onChange={e=>setMarkupCell("anggota", r.gram, onlyDigits(e.target.value))}
                            style={{ ...inpSm, width:120, paddingLeft:32 }} placeholder="0" />
                        </div>
                      </td>
                      <td style={{ padding:"10px 16px", color:"#34d399", fontWeight:900, whiteSpace:"nowrap" }}>{fmt(r.harga + mkA)}</td>
                      <td style={{ padding:"10px 16px" }}>
                        <div style={{ position:"relative", width:120 }}>
                          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.4)", fontSize:".8rem", pointerEvents:"none" }}>Rp</span>
                          <input inputMode="numeric" value={fmtRibuan(markupForm.nonAnggota[String(r.gram)])} disabled={!isMaster}
                            onChange={e=>setMarkupCell("nonAnggota", r.gram, onlyDigits(e.target.value))}
                            style={{ ...inpSm, width:120, paddingLeft:32 }} placeholder="0" />
                        </div>
                      </td>
                      <td style={{ padding:"10px 16px", color:"#D4AF37", fontWeight:900, whiteSpace:"nowrap" }}>{fmt(r.harga + mkN)}</td>
                      {isMaster && (
                        <td style={{ padding:"10px 16px" }}>
                          <button onClick={()=>{ setNewGram(String(r.gram)); setNewHarga(String(r.harga)); }}
                            style={{ background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:7, padding:"5px 12px", color:"#D4AF37", cursor:"pointer", fontSize:".76rem", fontWeight:600 }}>
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  );})}
                </tbody>
              </table>
              </div>
            )}
            {isMaster && hargaEmas.length > 0 && (
              <div style={{ padding:"14px 16px", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                <button onClick={saveMarkupHandler} disabled={savingMarkup}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", borderRadius:10, background: savedMarkup?"rgba(52,211,153,0.2)":"linear-gradient(135deg,#34d399,#6ee7b7)", border: savedMarkup?"1px solid #34d399":"none", color: savedMarkup?"#34d399":"#0a0a0a", fontWeight:700, fontSize:".85rem", cursor:"pointer", transition:"all .3s" }}>
                  {savingMarkup ? <><RefreshCw style={{ width:14, height:14 }} /> Menyimpan...</> : savedMarkup ? "✓ Markup Tersimpan" : <><Save style={{ width:14, height:14 }} /> Simpan Markup</>}
                </button>
              </div>
            )}
          </div>

          {/* Add new */}
          <div style={{ background:"rgba(212,175,55,0.04)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:16, padding:20 }}>
            <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".85rem", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
              <Plus style={{ width:14, height:14 }} /> Input Harga Baru
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              <div>
                <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:6 }}>Berat (gram)</label>
                <input type="number" min={0} step={0.5} value={newGram} onChange={e=>setNewGram(e.target.value)} style={inp} placeholder="1" />
              </div>
              <div>
                <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:6 }}>Harga (Rp)</label>
                <RupiahInput value={newHarga} onValueChange={setNewHarga} style={inp} placeholder="1.698.000" />
              </div>
            </div>
            <button onClick={saveHargaEmas} disabled={savingEmas||!newGram||!newHarga}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 20px", borderRadius:10, background: savedEmas?"rgba(52,211,153,0.2)":"linear-gradient(135deg,#D4AF37,#F5D060)", border: savedEmas?"1px solid #34d399":"none", color: savedEmas?"#34d399":"#0a0a0a", fontWeight:700, fontSize:".88rem", cursor:"pointer", transition:"all .3s" }}>
              {savingEmas ? <><RefreshCw style={{ width:14, height:14 }} /> Menyimpan...</> : savedEmas ? "✓ Tersimpan" : <><Save style={{ width:14, height:14 }} /> Simpan Harga</>}
            </button>
            <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".75rem", marginTop:8 }}>Setiap input akan tersimpan sebagai histori perubahan harga.</p>
          </div>
        </motion.div>
      )}

      {/* ─── TAB: CICILAN (otomatis dari Harga Emas + parameter pengaturan) ─── */}
      {tab === "cicilan" && (() => {
        const isAnggota = cicilanView === "anggota";
        const markupMap = isAnggota ? markup.anggota : markup.nonAnggota;
        const derived = buildDerivedCicilan(hargaEmas, markupMap, cicilanParams, cicilanView);
        const vAdmin  = isAnggota ? cicilanParams.adminAnggota      : cicilanParams.adminNonAnggota;
        const vBulan  = isAnggota ? cicilanParams.persenBulanAnggota: cicilanParams.persenBulanNonAnggota;
        const vDp     = isAnggota ? cicilanParams.persenDpAnggota   : cicilanParams.persenDpNonAnggota;
        return (
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {/* Toggle Anggota / Non-Anggota (khusus master untuk verifikasi) */}
          <div style={{ display:"flex", gap:8 }}>
            {([
              { id:"anggota",    label:"Anggota (login member)" },
              { id:"nonAnggota", label:"Non-Anggota (landing page)" },
            ] as const).map(v => (
              <button key={v.id} onClick={()=>setCicilanView(v.id)}
                style={{ padding:"7px 16px", borderRadius:9, fontSize:".82rem", fontWeight:600, cursor:"pointer",
                  border: cicilanView===v.id ? "1px solid #a78bfa" : "1px solid rgba(255,255,255,0.1)",
                  background: cicilanView===v.id ? "rgba(167,139,250,0.18)" : "rgba(255,255,255,0.03)",
                  color: cicilanView===v.id ? "#a78bfa" : "rgba(255,255,255,0.5)" }}>
                {v.label}
              </button>
            ))}
          </div>

          <div style={{ background:"rgba(167,139,250,0.04)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:14, padding:"14px 18px" }}>
            <p style={{ color:"#a78bfa", fontWeight:700, fontSize:".85rem", margin:0 }}>
              Cicilan {isAnggota ? "Anggota" : "Non-Anggota"} dihitung otomatis dari Harga Emas
            </p>
            <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".76rem", margin:"6px 0 0", lineHeight:1.6 }}>
              Berat &amp; harga mengikuti tabel Harga Emas (markup {isAnggota ? "anggota" : "non-anggota"}). Rumus per tenor:
              {" "}<b>a</b> = harga + admin <b>{fmt(vAdmin)}</b>,
              {" "}<b>b</b> = a × <b>{vBulan}%</b>/bln × tenor,
              {" "}<b>c</b> = (a+b) × DP <b>{vDp}%</b>,
              {" "}harga cicilan = a + b − c, lalu angsuran/bln = harga cicilan ÷ tenor.
              {" "}Atur admin/%/DP di <b>Pengaturan → Cicilan</b>.
            </p>
          </div>

          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:16, overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ color:"#a78bfa", fontWeight:700, fontSize:".85rem", margin:0 }}>Angsuran per Tenor (harga {isAnggota ? "anggota" : "non-anggota"} / bulan)</p>
            </div>
            {derived.length === 0 ? <p style={{ padding:"20px", color:"rgba(255,255,255,0.3)", fontSize:".85rem" }}>Belum ada data harga emas. Tambahkan harga di tab Harga Emas.</p> : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead><tr style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    {["Berat", isAnggota ? "Harga Anggota" : "Harga Non-Anggota", ...CICILAN_TENORS.map(t=>`${t} bln (DP + angsuran)`)].map(h=>(
                      <th key={h} style={{ padding:"10px 16px", textAlign:"left", color:"rgba(255,255,255,0.3)", fontSize:".7rem", fontWeight:600, textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {derived.map((r,i)=>(
                      <tr key={r.gram} style={{ borderBottom: i<derived.length-1?"1px solid rgba(255,255,255,0.04)":"none" }}>
                        <td style={{ padding:"11px 16px", color:"#fff", fontWeight:700, whiteSpace:"nowrap" }}>{r.gram} gram</td>
                        <td style={{ padding:"11px 16px", color:"#34d399", fontWeight:900, whiteSpace:"nowrap" }}>{fmt(r.hargaAnggota)}</td>
                        {r.tenors.map(t=>(
                          <td key={t.tenor} style={{ padding:"11px 16px", whiteSpace:"nowrap" }}>
                            {t.dp > 0 && <div style={{ color:"#60a5fa", fontSize:".72rem", fontWeight:600 }}>DP {fmt(t.dp)}</div>}
                            <span style={{ color:"#D4AF37", fontWeight:900 }}>{fmt(t.angsuran)}</span>
                            <span style={{ color:"rgba(255,255,255,0.3)", fontWeight:500, fontSize:".7rem" }}>/bln</span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {isMaster && (
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".74rem", margin:0 }}>
              Catatan: markup anggota yang dipakai adalah yang sudah <b>tersimpan</b>. Simpan markup di tab Harga Emas &amp; atur parameter cicilan di Pengaturan agar tabel ikut berubah.
            </p>
          )}
        </motion.div>
        );
      })()}

      {/* ─── TAB: BUYBACK ─── */}
      {tab === "buyback" && (
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(52,211,153,0.15)", borderRadius:16, overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ color:"#34d399", fontWeight:700, fontSize:".85rem", margin:0 }}>Harga Buyback Aktif</p>
            </div>
            {hargaBuyback.length === 0 ? <p style={{ padding:"20px", color:"rgba(255,255,255,0.3)", fontSize:".85rem" }}>Belum ada data</p> : (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  {["Berat", "Harga Buyback", "Terakhir Update", ...(isMaster?[""]:[])].map(h=>(
                    <th key={h} style={{ padding:"10px 18px", textAlign:"left", color:"rgba(255,255,255,0.3)", fontSize:".72rem", fontWeight:600, textTransform:"uppercase" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {hargaBuyback.map((r,i)=>(
                    <tr key={r.gram} style={{ borderBottom: i<hargaBuyback.length-1?"1px solid rgba(255,255,255,0.04)":"none" }}>
                      <td style={{ padding:"12px 18px", color:"#fff", fontWeight:700 }}>{r.gram} gram</td>
                      <td style={{ padding:"12px 18px", color:"#34d399", fontWeight:900 }}>{fmt(r.harga)}</td>
                      <td style={{ padding:"12px 18px", color:"rgba(255,255,255,0.35)", fontSize:".8rem" }}>
                        {new Date(r.created_at).toLocaleString("id-ID", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}
                      </td>
                      {isMaster && (
                        <td style={{ padding:"12px 18px" }}>
                          <button onClick={()=>{ setBbHarga(String(r.harga)); }}
                            style={{ background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.25)", borderRadius:7, padding:"5px 12px", color:"#34d399", cursor:"pointer", fontSize:".76rem", fontWeight:600 }}>
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ background:"rgba(52,211,153,0.04)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:16, padding:20 }}>
            <p style={{ color:"#34d399", fontWeight:700, fontSize:".85rem", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
              <Plus style={{ width:14, height:14 }} /> Input Harga Buyback Baru
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              <div>
                <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:6 }}>Berat (gram)</label>
                <input type="text" value="1 gram" readOnly disabled style={{ ...inp, opacity:.6, cursor:"not-allowed" }} />
              </div>
              <div>
                <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:6 }}>Harga Buyback (Rp)</label>
                <RupiahInput value={bbHarga} onValueChange={setBbHarga} style={inp} placeholder="1.658.000" />
              </div>
            </div>
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem", margin:"0 0 12px" }}>Harga buyback hanya untuk 1 gram (acuan per gram).</p>
            <button onClick={saveBuyback} disabled={savingBb||!bbHarga}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 20px", borderRadius:10, background: savedBb?"rgba(52,211,153,0.2)":"linear-gradient(135deg,#34d399,#6ee7b7)", border: savedBb?"1px solid #34d399":"none", color: savedBb?"#34d399":"#0a0a0a", fontWeight:700, fontSize:".88rem", cursor:"pointer", transition:"all .3s" }}>
              {savingBb ? <><RefreshCw style={{ width:14, height:14 }} /> Menyimpan...</> : savedBb ? "✓ Tersimpan" : <><Save style={{ width:14, height:14 }} /> Simpan Harga Buyback</>}
            </button>
          </div>
        </motion.div>
      )}
      </>
      )}
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}
