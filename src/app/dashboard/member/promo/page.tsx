"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tag, Loader2, Calendar, Star, TrendingDown, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface GramPrice {
  gram_weight: number;
  price_member: number;
  price_non_member: number;
  buyback_price: number;
}

interface Promo {
  id: string;
  title: string;
  description?: string;
  type: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  gram_prices: GramPrice[];
}

const TYPE_LABEL: Record<string, string> = {
  harga:"Daftar Harga", cashback:"Cashback", diskon:"Diskon", bonus:"Bonus",
};
const TYPE_COLOR: Record<string, string> = {
  harga:"#D4AF37", cashback:"#4ade80", diskon:"#f87171", bonus:"#a78bfa",
};

export default function MemberPromoPage() {
  const [promos, setPromos]   = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  useEffect(() => {
    loadPromos();
  }, []);

  async function loadPromos() {
    setLoading(true);
    const { data: promosData } = await (supabase.from("promos") as any)
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (!promosData || promosData.length === 0) { setPromos([]); setLoading(false); return; }

    const { data: gramData } = await (supabase.from("promo_gram_prices") as any)
      .select("*")
      .in("promo_id", promosData.map((p: Promo) => p.id))
      .order("gram_weight", { ascending: true });

    const enriched = promosData.map((p: Promo) => ({
      ...p,
      gram_prices: (gramData || [])
        .filter((g: { promo_id: string }) => g.promo_id === p.id)
        .sort((a: GramPrice, b: GramPrice) => a.gram_weight - b.gram_weight),
    }));

    setPromos(enriched);
    setLastUpdate(new Date().toLocaleString("id-ID", { day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" }));
    setLoading(false);
  }

  const fmtPrice = (n: number) => "Rp " + Number(n).toLocaleString("id-ID");
  const fmtDate  = (s?: string) => s ? new Date(s).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" }) : null;

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:300, flexDirection:"column", gap:14, color:"rgba(255,255,255,0.3)" }}>
      <Loader2 style={{ width:32, height:32, animation:"spin 1s linear infinite" }} />
      <p>Memuat promo & harga emas...</p>
    </div>
  );

  if (promos.length === 0) return (
    <div style={{ textAlign:"center", padding:"80px 0", color:"rgba(255,255,255,0.25)" }}>
      <Tag style={{ width:48, height:48, margin:"0 auto 16px", opacity:.25 }} />
      <p style={{ fontSize:"1rem", fontWeight:600 }}>Belum ada promo aktif</p>
      <p style={{ fontSize:".82rem", marginTop:6 }}>Pantau halaman ini untuk promo dan harga terbaru dari koperasi.</p>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div>
          <h2 style={{ color:"#fff", fontWeight:900, fontSize:"1.3rem" }}>Promo & Harga Emas</h2>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".82rem", marginTop:4 }}>
            Harga berlaku untuk anggota koperasi yang aktif
          </p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
          {lastUpdate && (
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".73rem" }}>
              Update: {lastUpdate}
            </p>
          )}
          <button onClick={loadPromos}
            style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:8, padding:"6px 12px", color:"#D4AF37", cursor:"pointer", fontSize:".78rem" }}>
            <RefreshCw style={{ width:12, height:12 }} /> Refresh
          </button>
        </div>
      </div>

      {/* Promo Cards */}
      {promos.map((promo, pi) => (
        <motion.div key={promo.id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:pi*0.08 }}
          style={{ background:"rgba(14,14,14,0.85)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:20, overflow:"hidden", backdropFilter:"blur(14px)" }}>

          {/* Promo Card Header */}
          <div style={{ background:"linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.05))", borderBottom:"1px solid rgba(212,175,55,0.15)", padding:"16px 22px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ display:"flex", gap:4 }}>
                  {[0,1,2].map(i => (
                    <Star key={i} style={{ width:14, height:14, color:"#D4AF37", fill:"#D4AF37" }} />
                  ))}
                </div>
                <div>
                  <p style={{ color:"#fff", fontWeight:900, fontSize:".95rem", lineHeight:1.2 }}>{promo.title}</p>
                  {promo.description && (
                    <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".75rem", marginTop:2 }}>{promo.description}</p>
                  )}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ background:`rgba(${TYPE_COLOR[promo.type]?.replace("#","")},0.12)`, color: TYPE_COLOR[promo.type] || "#D4AF37", borderRadius:8, padding:"4px 10px", fontSize:".73rem", fontWeight:700 }}>
                  {TYPE_LABEL[promo.type] || promo.type}
                </span>
                {(fmtDate(promo.start_date) || fmtDate(promo.end_date)) && (
                  <div style={{ display:"flex", alignItems:"center", gap:5, color:"rgba(255,255,255,0.35)", fontSize:".73rem" }}>
                    <Calendar style={{ width:11, height:11 }} />
                    {fmtDate(promo.start_date) && <span>{fmtDate(promo.start_date)}</span>}
                    {fmtDate(promo.end_date) && <><span>–</span><span>{fmtDate(promo.end_date)}</span></>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Price Table */}
          {promo.gram_prices.length > 0 ? (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                    <th style={{ padding:"10px 18px", textAlign:"left", color:"rgba(255,255,255,0.35)", fontSize:".72rem", fontWeight:600, whiteSpace:"nowrap" }}>GRAMASI</th>
                    <th style={{ padding:"10px 18px", textAlign:"left", color:"rgba(255,255,255,0.35)", fontSize:".72rem", fontWeight:600, whiteSpace:"nowrap" }}>NON ANGGOTA</th>
                    <th style={{ padding:"10px 18px", textAlign:"left", color:"#D4AF37", fontSize:".72rem", fontWeight:700, whiteSpace:"nowrap" }}>ANGGOTA ★</th>
                    <th style={{ padding:"10px 18px", textAlign:"left", color:"rgba(255,255,255,0.35)", fontSize:".72rem", fontWeight:600, whiteSpace:"nowrap" }}>BUYBACK</th>
                  </tr>
                </thead>
                <tbody>
                  {promo.gram_prices.map((gp, i) => (
                    <motion.tr key={gp.gram_weight}
                      initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:pi*0.08 + i*0.03 }}
                      style={{ borderBottom:"1px solid rgba(255,255,255,0.04)", background: i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>
                      {/* Gram weight */}
                      <td style={{ padding:"13px 18px" }}>
                        <span style={{ background:"rgba(212,175,55,0.12)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:8, padding:"4px 10px", color:"#D4AF37", fontWeight:800, fontSize:".82rem" }}>
                          {gp.gram_weight}g
                        </span>
                      </td>
                      {/* Non-member price */}
                      <td style={{ padding:"13px 18px" }}>
                        <p style={{ color:"rgba(255,255,255,0.55)", fontSize:".88rem", fontWeight:500 }}>
                          {fmtPrice(gp.price_non_member)}
                        </p>
                      </td>
                      {/* Member price (highlighted) */}
                      <td style={{ padding:"13px 18px" }}>
                        <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                          <p style={{ color:"#4ade80", fontSize:".92rem", fontWeight:800 }}>
                            {fmtPrice(gp.price_member)}
                          </p>
                          {gp.price_non_member > gp.price_member && gp.price_member > 0 && (
                            <p style={{ color:"rgba(74,222,128,0.6)", fontSize:".68rem", display:"flex", alignItems:"center", gap:3 }}>
                              <TrendingDown style={{ width:10, height:10 }} />
                              Hemat Rp {(gp.price_non_member - gp.price_member).toLocaleString("id-ID")}
                            </p>
                          )}
                        </div>
                      </td>
                      {/* Buyback */}
                      <td style={{ padding:"13px 18px" }}>
                        <p style={{ color:"#60a5fa", fontSize:".88rem", fontWeight:500 }}>
                          {gp.buyback_price > 0 ? fmtPrice(gp.buyback_price) : "—"}
                        </p>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding:"20px 22px", color:"rgba(255,255,255,0.25)", fontSize:".83rem", textAlign:"center" }}>
              Belum ada daftar harga gramasi untuk promo ini.
            </div>
          )}

          {/* Footer note */}
          <div style={{ padding:"10px 18px", borderTop:"1px solid rgba(255,255,255,0.04)", display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ color:"rgba(255,255,255,0.2)", fontSize:".7rem" }}>
              ★ Harga anggota berlaku untuk anggota koperasi aktif. Harga sewaktu-waktu dapat berubah.
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
