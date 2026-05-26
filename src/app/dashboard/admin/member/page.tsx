"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserCheck, UserX, Eye, X, Coins, PiggyBank, CreditCard, TrendingUp } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

type Member = {
  id: string; name: string; email: string | null; phone: string | null;
  gold_grams: number; status: string; created_at: string;
};
type MemberDetail = Member & {
  simpanan: { pokok: number; wajib: number; total: number };
  transaksi: { beli: number; buyback: number; totalGram: number };
  cicilan: { aktif: number; items: { product_name: string; paid_installments: number; tenor: number; monthly_amount: number }[] };
};

const S_MAP: Record<string, { label: string; bg: string; color: string }> = {
  active:    { label:"Aktif",        bg:"rgba(74,222,128,0.1)",  color:"#4ade80" },
  pending:   { label:"Menunggu",     bg:"rgba(251,146,60,0.1)",  color:"#fb923c" },
  suspended: { label:"Suspend",      bg:"rgba(248,113,113,0.1)", color:"#f87171" },
};

export default function AdminMemberPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("all");
  const [page, setPage]         = useState(1);
  const [detail, setDetail]     = useState<MemberDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const PER = 10;

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase.from("profiles") as any)
      .select("id, name, email, phone, gold_grams, status, created_at")
      .eq("role", "member")
      .order("created_at", { ascending: false });
    setMembers(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: string) => {
    await (supabase.from("profiles") as any).update({ status }).eq("id", id);
    setMembers(m => m.map(x => x.id === id ? { ...x, status } : x));
    if (detail?.id === id) setDetail(d => d ? { ...d, status } : d);
  };

  const openDetail = async (m: Member) => {
    setDetailLoading(true);
    setDetail({ ...m, simpanan:{ pokok:0, wajib:0, total:0 }, transaksi:{ beli:0, buyback:0, totalGram:0 }, cicilan:{ aktif:0, items:[] } });

    const [simpRows, txRows, cicRows] = await Promise.all([
      (supabase.from("simpanan") as any).select("type, amount").eq("user_id", m.id).eq("status", "completed"),
      (supabase.from("transactions") as any).select("type, gram, status").eq("user_id", m.id),
      (supabase.from("installments") as any).select("product_name, paid_installments, tenor, monthly_amount").eq("user_id", m.id).eq("status", "active"),
    ]);

    const simp = simpRows.data ?? [];
    const txs  = txRows.data  ?? [];
    const cics = cicRows.data ?? [];

    const pokok = simp.filter((s: any) => s.type==="pokok").reduce((a: number, b: any) => a + b.amount, 0);
    const wajib = simp.filter((s: any) => s.type==="wajib").reduce((a: number, b: any) => a + b.amount, 0);
    const beliDone = txs.filter((t: any) => t.type==="buy" && t.status==="completed");
    const backDone = txs.filter((t: any) => t.type==="buyback" && t.status==="completed");

    setDetail({
      ...m,
      simpanan: { pokok, wajib, total: pokok + wajib },
      transaksi: { beli: beliDone.length, buyback: backDone.length, totalGram: beliDone.reduce((a: number, b: any) => a + (b.gram||0), 0) },
      cicilan: { aktif: cics.length, items: cics },
    });
    setDetailLoading(false);
  };

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const ok = !q || m.name.toLowerCase().includes(q) || (m.email||"").toLowerCase().includes(q);
    return ok && (filter==="all" || m.status===filter);
  });
  const paged = filtered.slice((page-1)*PER, page*PER);
  const pages = Math.ceil(filtered.length / PER);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:16 }}>
        {[
          { label:"Total",    value: members.length,                              color:"#D4AF37" },
          { label:"Aktif",    value: members.filter(m=>m.status==="active").length,    color:"#4ade80" },
          { label:"Menunggu", value: members.filter(m=>m.status==="pending").length,   color:"#fb923c" },
          { label:"Suspend",  value: members.filter(m=>m.status==="suspended").length, color:"#f87171" },
        ].map(s => (
          <div key={s.label} style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:16, padding:"18px 16px" }}>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".76rem", marginBottom:4 }}>{s.label}</p>
            <p style={{ color:s.color, fontSize:"1.7rem", fontWeight:900 }}>{loading?"…":s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        style={{ background:"rgba(14,14,14,0.8)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", gap:6 }}>
            {(["all","pending","active","suspended"] as const).map(f => (
              <button key={f} onClick={()=>{ setFilter(f); setPage(1); }}
                style={{ padding:"5px 11px", borderRadius:20, border:"1px solid", fontSize:".74rem", fontWeight:600, cursor:"pointer",
                  borderColor: filter===f?"#D4AF37":"rgba(255,255,255,0.1)",
                  background:  filter===f?"rgba(212,175,55,0.1)":"transparent",
                  color:       filter===f?"#D4AF37":"rgba(255,255,255,0.35)" }}>
                {f==="all"?"Semua":f==="pending"?"Menunggu":f==="active"?"Aktif":"Suspend"}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"7px 12px" }}>
            <Search style={{ width:13, height:13, color:"rgba(255,255,255,0.3)" }} />
            <input value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} placeholder="Cari nama / email..."
              style={{ background:"none", border:"none", outline:"none", color:"rgba(255,255,255,0.7)", fontSize:".8rem", width:160 }} />
          </div>
        </div>

        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                {["Member","Email","Emas","Bergabung","Status","Aksi"].map(h => (
                  <th key={h} style={{ color:"rgba(255,255,255,0.3)", fontSize:".73rem", fontWeight:600, padding:"8px 14px", textAlign:"left", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding:40, textAlign:"center", color:"rgba(255,255,255,0.25)", fontSize:".83rem" }}>Memuat data member...</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={6} style={{ padding:40, textAlign:"center", color:"rgba(255,255,255,0.25)", fontSize:".83rem" }}>Tidak ada member</td></tr>
              ) : paged.map((m, i) => {
                const s = S_MAP[m.status] ?? S_MAP.suspended;
                return (
                  <tr key={m.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding:"12px 14px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div className="bg-gold-gradient" style={{ width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#0a0a0a", fontSize:".72rem", flexShrink:0 }}>{m.name?.[0]||"?"}</div>
                        <div>
                          <p style={{ color:"#fff", fontSize:".82rem", fontWeight:600 }}>{m.name}</p>
                          <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".7rem" }}>{m.phone||"-"}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:"12px 14px", color:"rgba(255,255,255,0.45)", fontSize:".8rem" }}>{m.email}</td>
                    <td style={{ padding:"12px 14px", color:"#D4AF37", fontWeight:700, fontSize:".82rem" }}>{(m.gold_grams||0).toFixed(2)}g</td>
                    <td style={{ padding:"12px 14px", color:"rgba(255,255,255,0.3)", fontSize:".77rem" }}>{formatDate(m.created_at)}</td>
                    <td style={{ padding:"12px 14px" }}>
                      <span style={{ background:s.bg, color:s.color, borderRadius:8, padding:"3px 9px", fontSize:".73rem", fontWeight:700 }}>{s.label}</span>
                    </td>
                    <td style={{ padding:"12px 14px" }}>
                      <div style={{ display:"flex", gap:5 }}>
                        <button onClick={()=>openDetail(m)} title="Detail"
                          style={{ width:27, height:27, borderRadius:7, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                          <Eye style={{ width:11, height:11 }} />
                        </button>
                        {m.status==="pending" && (
                          <button onClick={()=>setStatus(m.id,"active")} title="Aktifkan"
                            style={{ width:27, height:27, borderRadius:7, background:"rgba(74,222,128,0.08)", border:"1px solid rgba(74,222,128,0.2)", color:"#4ade80", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                            <UserCheck style={{ width:11, height:11 }} />
                          </button>
                        )}
                        {m.status==="active" && (
                          <button onClick={()=>setStatus(m.id,"suspended")} title="Suspend"
                            style={{ width:27, height:27, borderRadius:7, background:"rgba(248,113,113,0.06)", border:"1px solid rgba(248,113,113,0.15)", color:"#f87171", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                            <UserX style={{ width:11, height:11 }} />
                          </button>
                        )}
                        {m.status==="suspended" && (
                          <button onClick={()=>setStatus(m.id,"active")} title="Aktifkan kembali"
                            style={{ width:27, height:27, borderRadius:7, background:"rgba(74,222,128,0.08)", border:"1px solid rgba(74,222,128,0.2)", color:"#4ade80", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                            <UserCheck style={{ width:11, height:11 }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div style={{ padding:"12px 18px", borderTop:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
            <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".78rem" }}>{filtered.length} member</p>
            <div style={{ display:"flex", gap:5 }}>
              {Array.from({length:Math.min(pages,8)},(_,i)=>i+1).map(p=>(
                <button key={p} onClick={()=>setPage(p)}
                  style={{ width:30, height:30, borderRadius:8, fontSize:".78rem", fontWeight:600, cursor:"pointer", border:"1px solid",
                    borderColor: p===page?"#D4AF37":"rgba(255,255,255,0.08)",
                    background:  p===page?"rgba(212,175,55,0.15)":"transparent",
                    color:       p===page?"#D4AF37":"rgba(255,255,255,0.4)" }}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {detail && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={()=>setDetail(null)}
              style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:300,
                display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
            <motion.div initial={{ opacity:0, scale:.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:.95 }}
              onClick={e=>e.stopPropagation()}
              style={{ width:"100%", maxWidth:540, maxHeight:"88vh", overflowY:"auto",
                background:"#0e0e0e", border:"1px solid rgba(212,175,55,0.25)", borderRadius:22, padding:26 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div className="bg-gold-gradient" style={{ width:40, height:40, borderRadius:11, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:"#0a0a0a", fontSize:"1rem" }}>{detail.name?.[0]}</div>
                  <div>
                    <p style={{ color:"#fff", fontWeight:800, fontSize:"1rem" }}>{detail.name}</p>
                    <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".78rem" }}>{detail.email}</p>
                  </div>
                </div>
                <button onClick={()=>setDetail(null)} style={{ width:32, height:32, borderRadius:9, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                  <X style={{ width:14, height:14 }} />
                </button>
              </div>

              {detailLoading ? (
                <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", padding:"40px 0" }}>Memuat detail...</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {/* Simpanan */}
                  <div style={{ background:"rgba(192,132,252,0.07)", border:"1px solid rgba(192,132,252,0.2)", borderRadius:14, padding:16 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                      <PiggyBank style={{ width:15, height:15, color:"#c084fc" }} />
                      <p style={{ color:"#fff", fontWeight:700, fontSize:".88rem" }}>Simpanan Koperasi</p>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                      {[
                        { label:"Pokok", value:formatCurrency(detail.simpanan.pokok),  color:"#D4AF37" },
                        { label:"Wajib", value:formatCurrency(detail.simpanan.wajib),  color:"#60a5fa" },
                        { label:"Total", value:formatCurrency(detail.simpanan.total),  color:"#c084fc" },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign:"center", background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"10px 6px" }}>
                          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".7rem", marginBottom:4 }}>{s.label}</p>
                          <p style={{ color:s.color, fontWeight:800, fontSize:".82rem" }}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Transaksi */}
                  <div style={{ background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.18)", borderRadius:14, padding:16 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                      <TrendingUp style={{ width:15, height:15, color:"#D4AF37" }} />
                      <p style={{ color:"#fff", fontWeight:700, fontSize:".88rem" }}>Jual Beli Emas</p>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                      {[
                        { label:"Beli",       value:`${detail.transaksi.beli}x`,                 color:"#4ade80" },
                        { label:"Buyback",    value:`${detail.transaksi.buyback}x`,               color:"#fb923c" },
                        { label:"Vol. Beli",  value:`${detail.transaksi.totalGram.toFixed(2)}g`, color:"#D4AF37" },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign:"center", background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"10px 6px" }}>
                          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".7rem", marginBottom:4 }}>{s.label}</p>
                          <p style={{ color:s.color, fontWeight:800, fontSize:".82rem" }}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cicilan */}
                  <div style={{ background:"rgba(96,165,250,0.06)", border:"1px solid rgba(96,165,250,0.18)", borderRadius:14, padding:16 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                      <CreditCard style={{ width:15, height:15, color:"#60a5fa" }} />
                      <p style={{ color:"#fff", fontWeight:700, fontSize:".88rem" }}>Cicilan Aktif ({detail.cicilan.aktif})</p>
                    </div>
                    {detail.cicilan.items.length===0 ? (
                      <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".8rem" }}>Tidak ada cicilan aktif</p>
                    ) : detail.cicilan.items.map((c,i)=>(
                      <div key={i} style={{ background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"10px 12px", marginBottom: i<detail.cicilan.items.length-1?8:0 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <p style={{ color:"#fff", fontSize:".81rem", fontWeight:600 }}>{c.product_name}</p>
                          <p style={{ color:"#60a5fa", fontSize:".77rem", fontWeight:700 }}>{c.paid_installments}/{c.tenor} bln</p>
                        </div>
                        <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:4, overflow:"hidden", marginBottom:4 }}>
                          <div style={{ height:"100%", width:`${(c.paid_installments/c.tenor)*100}%`, background:"linear-gradient(90deg,#60a5fa,#93c5fd)", borderRadius:4 }} />
                        </div>
                        <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem" }}>{formatCurrency(c.monthly_amount)}/bln</p>
                      </div>
                    ))}
                  </div>

                  {/* Saldo emas */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(212,175,55,0.05)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:12, padding:"10px 14px" }}>
                    <Coins style={{ width:15, height:15, color:"#D4AF37" }} />
                    <span style={{ color:"rgba(255,255,255,0.5)", fontSize:".82rem" }}>Saldo Emas:</span>
                    <span style={{ color:"#D4AF37", fontWeight:900 }}>{(detail.gold_grams||0).toFixed(4)}g</span>
                    <span style={{ marginLeft:"auto" }}>
                      <span style={{ background:(S_MAP[detail.status]||S_MAP.suspended).bg, color:(S_MAP[detail.status]||S_MAP.suspended).color, borderRadius:8, padding:"3px 9px", fontSize:".72rem", fontWeight:700 }}>{(S_MAP[detail.status]||S_MAP.suspended).label}</span>
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display:"flex", gap:10 }}>
                    {detail.status==="pending" && (
                      <button onClick={()=>setStatus(detail.id,"active")} className="btn-gold"
                        style={{ flex:1, padding:"11px", borderRadius:12, border:"none", cursor:"pointer", fontSize:".87rem", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                        <UserCheck style={{ width:15, height:15 }} /> Aktifkan Member
                      </button>
                    )}
                    {detail.status==="active" && (
                      <button onClick={()=>setStatus(detail.id,"suspended")}
                        style={{ flex:1, padding:"11px", borderRadius:12, cursor:"pointer", fontSize:".87rem", background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.25)", color:"#f87171", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                        <UserX style={{ width:15, height:15 }} /> Suspend
                      </button>
                    )}
                    {detail.status==="suspended" && (
                      <button onClick={()=>setStatus(detail.id,"active")} className="btn-gold"
                        style={{ flex:1, padding:"11px", borderRadius:12, border:"none", cursor:"pointer", fontSize:".87rem", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                        <UserCheck style={{ width:15, height:15 }} /> Aktifkan Kembali
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
