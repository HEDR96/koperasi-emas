"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Coins, Save, RefreshCw, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

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
  const [tab, setTab] = useState<Tab>("emas");

  // ─── Harga Emas per Berat ───
  const [hargaEmas, setHargaEmas]     = useState<HargaBerat[]>([]);
  const [newGram, setNewGram]         = useState("");
  const [newHarga, setNewHarga]       = useState("");
  const [savingEmas, setSavingEmas]   = useState(false);
  const [savedEmas, setSavedEmas]     = useState(false);

  // ─── Cicilan ───
  const [cicilan, setCicilan]         = useState<CicilanRow[]>([]);
  const [cForm, setCForm]             = useState({ gram:"", tenor:"12", harga_jual:"", angsuran:"", uang_muka_persen:"10" });
  const [savingCicilan, setSavingCicilan] = useState(false);
  const [savedCicilan, setSavedCicilan]   = useState(false);

  // ─── Buyback ───
  const [hargaBuyback, setHargaBuyback]   = useState<HargaBerat[]>([]);
  const [bbGram, setBbGram]               = useState("");
  const [bbHarga, setBbHarga]             = useState("");
  const [savingBb, setSavingBb]           = useState(false);
  const [savedBb, setSavedBb]             = useState(false);

  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [{ data: e }, { data: c }, { data: b }] = await Promise.all([
        (supabase.from("harga_emas_berat") as any).select("*").eq("kategori","emas").order("gram").order("created_at", { ascending:false }).limit(100),
        (supabase.from("cicilan_harga") as any).select("*").order("gram").order("tenor").limit(200),
        (supabase.from("harga_emas_berat") as any).select("*").eq("kategori","buyback").order("gram").order("created_at", { ascending:false }).limit(100),
      ]);
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

  // ─── Save Cicilan ───
  async function saveCicilan() {
    if (!cForm.gram || !cForm.tenor || !cForm.harga_jual || !cForm.angsuran) return;
    setSavingCicilan(true);
    await (supabase.from("cicilan_harga") as any).insert({
      gram: Number(cForm.gram), tenor: Number(cForm.tenor),
      harga_jual: Number(cForm.harga_jual), angsuran: Number(cForm.angsuran),
      uang_muka_persen: Number(cForm.uang_muka_persen), updated_by: user?.id,
    });
    setCForm({ gram:"", tenor:"12", harga_jual:"", angsuran:"", uang_muka_persen:"10" });
    setSavedCicilan(true); setTimeout(() => setSavedCicilan(false), 2000);
    load();
    setSavingCicilan(false);
  }


  // ─── Save Buyback ───
  async function saveBuyback() {
    if (!bbGram || !bbHarga) return;
    setSavingBb(true);
    await (supabase.from("harga_emas_berat") as any).insert({ gram: Number(bbGram), harga: Number(bbHarga), kategori:"buyback", updated_by: user?.id });
    setBbGram(""); setBbHarga("");
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
          {/* Current table */}
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:16, overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".85rem", margin:0 }}>Harga Beli Aktif (per berat)</p>
            </div>
            {hargaEmas.length === 0 ? <p style={{ padding:"20px", color:"rgba(255,255,255,0.3)", fontSize:".85rem" }}>Belum ada data</p> : (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  {["Berat", "Harga Terkini", "Terakhir Update"].map(h=>(
                    <th key={h} style={{ padding:"10px 18px", textAlign:"left", color:"rgba(255,255,255,0.3)", fontSize:".72rem", fontWeight:600, textTransform:"uppercase" }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {hargaEmas.map((r,i)=>(
                    <tr key={r.gram} style={{ borderBottom: i<hargaEmas.length-1?"1px solid rgba(255,255,255,0.04)":"none" }}>
                      <td style={{ padding:"12px 18px", color:"#fff", fontWeight:700 }}>{r.gram} gram</td>
                      <td style={{ padding:"12px 18px", color:"#D4AF37", fontWeight:900 }}>{fmt(r.harga)}</td>
                      <td style={{ padding:"12px 18px", color:"rgba(255,255,255,0.35)", fontSize:".8rem" }}>
                        {new Date(r.created_at).toLocaleString("id-ID", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                    {["Gram", "Tenor", "Harga Jual", "UM %", "Angsuran/bln"].map(h=>(
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add new */}
          <div style={{ background:"rgba(167,139,250,0.04)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:16, padding:20 }}>
            <p style={{ color:"#a78bfa", fontWeight:700, fontSize:".85rem", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}>
              <Plus style={{ width:14, height:14 }} /> Tambah Paket Cicilan
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginBottom:14 }}>
              {[
                { label:"Berat (gram)", key:"gram",             ph:"1",        type:"number" },
                { label:"Tenor (bulan)",key:"tenor",            ph:"12",       type:"number" },
                { label:"Harga Jual",   key:"harga_jual",       ph:"1698000",  type:"number" },
                { label:"Angsuran/bln", key:"angsuran",         ph:"150000",   type:"number" },
                { label:"Uang Muka %",  key:"uang_muka_persen", ph:"10",       type:"number" },
              ].map(f=>(
                <div key={f.key}>
                  <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:6 }}>{f.label}</label>
                  <input type={f.type} min={0} value={(cForm as any)[f.key]}
                    onChange={e=>setCForm(p=>({...p,[f.key]:e.target.value}))}
                    style={inpSm} placeholder={f.ph} />
                </div>
              ))}
            </div>
            <button onClick={saveCicilan} disabled={savingCicilan||!cForm.gram||!cForm.harga_jual||!cForm.angsuran}
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
                  {["Berat", "Harga Buyback", "Terakhir Update"].map(h=>(
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
                <input type="number" min={0} step={0.5} value={bbGram} onChange={e=>setBbGram(e.target.value)} style={inp} placeholder="1" />
              </div>
              <div>
                <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:6 }}>Harga Buyback (Rp)</label>
                <input type="number" min={0} value={bbHarga} onChange={e=>setBbHarga(e.target.value)} style={inp} placeholder="1658000" />
              </div>
            </div>
            <button onClick={saveBuyback} disabled={savingBb||!bbGram||!bbHarga}
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
