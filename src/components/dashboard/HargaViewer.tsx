"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  getMarkup, withMarkup,
  buildDerivedCicilan, type DerivedCicilan, CICILAN_TENORS, getCicilanParams,
} from "@/lib/harga";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);

type Tab = "emas" | "cicilan" | "buyback";

interface HargaBerat { gram: number; harga: number; created_at: string; }

// Tampilan read-only harga emas untuk anggota (member) & admin.
// Harga emas = harga dasar + (markup anggota × berat). Harga dasar & markup tidak ditampilkan.
export default function HargaViewer() {
  const [tab, setTab] = useState<Tab>("emas");
  const [hargaEmas, setHargaEmas]     = useState<HargaBerat[]>([]);
  const [hargaBuyback, setHargaBuyback] = useState<HargaBerat[]>([]);
  const [cicilan, setCicilan]         = useState<DerivedCicilan[]>([]);
  const [loading, setLoading]         = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [{ data: e }, { data: b }, markup, params] = await Promise.all([
        (supabase.rpc("get_latest_harga_berat", { kat: "emas" }) as any),
        (supabase.rpc("get_latest_harga_berat", { kat: "buyback" }) as any),
        getMarkup(),
        getCicilanParams(),
      ]);
      const latestPerGram = (rows: any[], markupMap: Record<string, number>) => {
        const seen = new Set<number>();
        return (rows||[])
          .filter(r => { const g = Number(r.gram); if (seen.has(g)) return false; seen.add(g); return true; })
          .map(r => ({ ...r, gram: Number(r.gram), harga: withMarkup(r.harga, Number(r.gram), markupMap) }))
          .sort((a,b) => a.gram - b.gram);
      };
      const emasAnggota = latestPerGram(e||[], markup.anggota);
      setHargaEmas(emasAnggota);
      setHargaBuyback(latestPerGram(b||[], {})); // buyback ditampilkan apa adanya
      // Cicilan diturunkan otomatis dari harga anggota (emasAnggota.harga sudah termasuk markup).
      setCicilan(buildDerivedCicilan(emasAnggota, {}, params));
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const TABS: { id: Tab; label: string; color: string }[] = [
    { id:"emas",    label:"Harga Emas",    color:"#D4AF37" },
    { id:"cicilan", label:"Harga Cicilan", color:"#a78bfa" },
    { id:"buyback", label:"Harga Buyback", color:"#34d399" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:760 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Harga Emas</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Daftar harga emas, cicilan, dan buyback koperasi emas</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

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
        {tab === "emas" && (
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:16, overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".85rem", margin:0 }}>Harga Beli Emas (per berat)</p>
              <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem" }}>harga koperasi emas</span>
            </div>
            {hargaEmas.length === 0 ? <p style={{ padding:"20px", color:"rgba(255,255,255,0.3)", fontSize:".85rem" }}>Belum ada data</p> : (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  {["Berat", "Harga", "Terakhir Update"].map(h=>(
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
          </motion.div>
        )}

        {tab === "cicilan" && (
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:16, overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ color:"#a78bfa", fontWeight:700, fontSize:".85rem", margin:0 }}>Paket Cicilan Tersedia</p>
              <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".74rem", margin:"4px 0 0" }}>
                Angsuran/bln otomatis dari harga emas anggota + admin, bunga per bulan, dan potongan DP sesuai pengaturan koperasi.
              </p>
            </div>
            {cicilan.length === 0 ? <p style={{ padding:"20px", color:"rgba(255,255,255,0.3)", fontSize:".85rem" }}>Belum ada data harga emas</p> : (
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead><tr style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                    {["Gram", "Harga", ...CICILAN_TENORS.map(t=>`${t} bln`)].map(h=>(
                      <th key={h} style={{ padding:"10px 16px", textAlign:"left", color:"rgba(255,255,255,0.3)", fontSize:".72rem", fontWeight:600, textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {cicilan.map((r,i)=>(
                      <tr key={r.gram} style={{ borderBottom: i<cicilan.length-1?"1px solid rgba(255,255,255,0.04)":"none" }}>
                        <td style={{ padding:"11px 16px", color:"#fff", fontWeight:700, whiteSpace:"nowrap" }}>{r.gram}g</td>
                        <td style={{ padding:"11px 16px", color:"#a78bfa", fontWeight:700, whiteSpace:"nowrap" }}>{fmt(r.hargaAnggota)}</td>
                        {r.tenors.map(t=>(
                          <td key={t.tenor} style={{ padding:"11px 16px", whiteSpace:"nowrap" }}>
                            {t.dp > 0 && <div style={{ color:"#60a5fa", fontSize:".68rem", fontWeight:600, marginBottom:2 }}>DP {fmt(t.dp)}</div>}
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
          </motion.div>
        )}

        {tab === "buyback" && (
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
            style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(52,211,153,0.15)", borderRadius:16, overflow:"hidden" }}>
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
          </motion.div>
        )}
      </>
      )}
    </div>
  );
}
