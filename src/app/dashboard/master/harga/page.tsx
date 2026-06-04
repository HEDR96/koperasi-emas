"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, RefreshCw, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { getMarkup, saveMarkup, type Markup } from "@/lib/harga";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);

const inp: React.CSSProperties = {
  width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:".9rem", outline:"none", boxSizing:"border-box",
};
const inpSm: React.CSSProperties = { ...inp, padding:"8px 12px", fontSize:".85rem" };

type Tab = "emas" | "cicilan" | "buyback";

interface HargaBerat { id: number; gram: number; harga: number; created_at: string; }
interface CicilanRow { id: number; gram: number; tenor: number; harga_jual: number; angsuran: number; uang_muka_persen: number; created_at: string; }

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

  // ─── Cicilan (angsuran per tenor diisi sekaligus) ───
  const TENOR_OPTIONS = [12, 24, 36, 48, 60];
  const [cicilan, setCicilan]         = useState<CicilanRow[]>([]);
  const [cForm, setCForm]             = useState<{ gram:string; harga_jual:string; uang_muka_persen:string; angsuran: Record<number,string> }>(
    { gram:"", harga_jual:"", uang_muka_persen:"10", angsuran:{} }
  );
  const [savingCicilan, setSavingCicilan] = useState(false);
  const [savedCicilan, setSavedCicilan]   = useState(false);

  // ─── Buyback (hanya 1 gram) ───
  const [hargaBuyback, setHargaBuyback]   = useState<HargaBerat[]>([]);
  const [bbHarga, setBbHarga]             = useState("");
  const [savingBb, setSavingBb]           = useState(false);
  const [savedBb, setSavedBb]             = useState(false);

  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [{ data: e }, { data: c }, { data: b }, mk] = await Promise.all([
        (supabase.from("harga_emas_berat") as any).select("*").eq("kategori","emas").order("gram").order("created_at", { ascending:false }).limit(100),
        (supabase.from("cicilan_harga") as any).select("*").order("gram").order("tenor").limit(200),
        (supabase.from("harga_emas_berat") as any).select("*").eq("kategori","buyback").order("gram").order("created_at", { ascending:false }).limit(100),
        getMarkup(),
      ]);
      setMarkup(mk);
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
      setCicilan((c||[]).map((r:any) => ({...r, gram: Number(r.gram)})));
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

  // ─── Save Cicilan: tambah semua tenor yang diisi sekaligus ───
  async function saveCicilan() {
    if (!cForm.gram || !cForm.harga_jual) return;
    // Bangun satu baris per tenor yang angsurannya diisi.
    const rows = TENOR_OPTIONS
      .filter(t => Number(cForm.angsuran[t]) > 0)
      .map(t => ({
        gram: Number(cForm.gram), tenor: t,
        harga_jual: Number(cForm.harga_jual), angsuran: Number(cForm.angsuran[t]),
        uang_muka_persen: Number(cForm.uang_muka_persen) || 0, updated_by: user?.id,
      }));
    if (rows.length === 0) return;
    setSavingCicilan(true);
    await (supabase.from("cicilan_harga") as any).insert(rows);
    setCForm({ gram:"", harga_jual:"", uang_muka_persen:"10", angsuran:{} });
    setSavedCicilan(true); setTimeout(() => setSavedCicilan(false), 2000);
    load();
    setSavingCicilan(false);
  }

  async function deleteCicilan(id: number) {
    if (!window.confirm("Hapus paket cicilan ini?")) return;
    await (supabase.from("cicilan_harga") as any).delete().eq("id", id);
    load();
  }

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
                        <input type="number" min={0} value={markupForm.anggota[String(r.gram)] ?? ""} disabled={!isMaster}
                          onChange={e=>setMarkupCell("anggota", r.gram, e.target.value)}
                          style={{ ...inpSm, width:120 }} placeholder="0" />
                      </td>
                      <td style={{ padding:"10px 16px", color:"#34d399", fontWeight:900, whiteSpace:"nowrap" }}>{fmt(r.harga + mkA)}</td>
                      <td style={{ padding:"10px 16px" }}>
                        <input type="number" min={0} value={markupForm.nonAnggota[String(r.gram)] ?? ""} disabled={!isMaster}
                          onChange={e=>setMarkupCell("nonAnggota", r.gram, e.target.value)}
                          style={{ ...inpSm, width:120 }} placeholder="0" />
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
                <input type="number" min={0} value={newHarga} onChange={e=>setNewHarga(e.target.value)} style={inp} placeholder="1698000" />
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

      {/* ─── TAB: CICILAN ─── */}
      {tab === "cicilan" && (
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {/* Existing */}
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:16, overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ color:"#a78bfa", fontWeight:700, fontSize:".85rem", margin:0 }}>Paket Cicilan Tersedia</p>
            </div>
            {cicilan.length === 0 ? <p style={{ padding:"20px", color:"rgba(255,255,255,0.3)", fontSize:".85rem" }}>Belum ada paket cicilan</p> : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead><tr style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    {["Gram", "Tenor", "Harga Jual", "UM %", "Angsuran/bln", ...(isMaster?[""]:[])].map(h=>(
                      <th key={h} style={{ padding:"10px 16px", textAlign:"left", color:"rgba(255,255,255,0.3)", fontSize:".72rem", fontWeight:600, textTransform:"uppercase" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {cicilan.map((r,i)=>(
                      <tr key={r.id} style={{ borderBottom: i<cicilan.length-1?"1px solid rgba(255,255,255,0.04)":"none" }}>
                        <td style={{ padding:"11px 16px", color:"#fff", fontWeight:700 }}>{r.gram}g</td>
                        <td style={{ padding:"11px 16px", color:"rgba(255,255,255,0.7)" }}>{r.tenor} bln</td>
                        <td style={{ padding:"11px 16px", color:"#a78bfa", fontWeight:700 }}>{fmt(r.harga_jual)}</td>
                        <td style={{ padding:"11px 16px", color:"rgba(255,255,255,0.5)" }}>{r.uang_muka_persen}%</td>
                        <td style={{ padding:"11px 16px", color:"#D4AF37", fontWeight:900 }}>{fmt(r.angsuran)}</td>
                        {isMaster && (
                          <td style={{ padding:"11px 16px" }}>
                            <button onClick={() => deleteCicilan(r.id)} title="Hapus (master)"
                              style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:7, padding:"5px 8px", color:"#f87171", cursor:"pointer" }}>
                              <Trash2 style={{ width:13, height:13 }} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add new — isi angsuran untuk semua tenor sekaligus */}
          <div style={{ background:"rgba(167,139,250,0.04)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:16, padding:20 }}>
            <p style={{ color:"#a78bfa", fontWeight:700, fontSize:".85rem", marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>
              <Plus style={{ width:14, height:14 }} /> Tambah Paket Cicilan
            </p>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".74rem", margin:"0 0 14px" }}>
              Isi berat, harga jual & uang muka, lalu masukkan angsuran/bln untuk tenor yang diinginkan. Baris tenor yang diisi akan tersimpan sekaligus dalam satu klik.
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginBottom:16 }}>
              <div>
                <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:6 }}>Berat (gram)</label>
                <input type="number" min={0} step={0.5} value={cForm.gram} onChange={e=>setCForm(p=>({...p,gram:e.target.value}))} style={inpSm} placeholder="1" />
              </div>
              <div>
                <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:6 }}>Harga Jual</label>
                <input type="number" min={0} value={cForm.harga_jual} onChange={e=>setCForm(p=>({...p,harga_jual:e.target.value}))} style={inpSm} placeholder="1698000" />
              </div>
              <div>
                <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:6 }}>Uang Muka %</label>
                <input type="number" min={0} value={cForm.uang_muka_persen} onChange={e=>setCForm(p=>({...p,uang_muka_persen:e.target.value}))} style={inpSm} placeholder="10" />
              </div>
            </div>

            <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:8 }}>Angsuran / bulan per tenor</label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12, marginBottom:16 }}>
              {TENOR_OPTIONS.map(t=>(
                <div key={t}>
                  <label style={{ color:"rgba(255,255,255,0.55)", fontSize:".76rem", display:"block", marginBottom:6, fontWeight:600 }}>{t} bulan</label>
                  <input type="number" min={0} value={cForm.angsuran[t] ?? ""}
                    onChange={e=>setCForm(p=>({...p, angsuran:{ ...p.angsuran, [t]: e.target.value }}))}
                    style={inpSm} placeholder="angsuran/bln" />
                </div>
              ))}
            </div>

            <button onClick={saveCicilan} disabled={savingCicilan||!cForm.gram||!cForm.harga_jual||!TENOR_OPTIONS.some(t=>Number(cForm.angsuran[t])>0)}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 20px", borderRadius:10, background: savedCicilan?"rgba(52,211,153,0.2)":"rgba(167,139,250,0.2)", border: savedCicilan?"1px solid #34d399":"1px solid rgba(167,139,250,0.4)", color: savedCicilan?"#34d399":"#a78bfa", fontWeight:700, fontSize:".88rem", cursor:"pointer", transition:"all .3s" }}>
              {savingCicilan ? <><RefreshCw style={{ width:14, height:14 }} /> Menyimpan...</> : savedCicilan ? "✓ Paket Ditambahkan" : <><Plus style={{ width:14, height:14 }} /> Tambah Paket</>}
            </button>
          </div>
        </motion.div>
      )}

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
                <input type="number" min={0} value={bbHarga} onChange={e=>setBbHarga(e.target.value)} style={inp} placeholder="1658000" />
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
