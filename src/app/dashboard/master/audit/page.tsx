"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, RefreshCw, Coins, Landmark, Wallet, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
const fmtDate = (s: string) =>
  new Date(s).toLocaleString("id-ID", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });

const TX_LABEL: Record<string,string> = { buy:"Beli Emas", buyback:"Buyback", cicilan:"Cicilan", tabungan:"Tabungan", transfer:"Transfer", referral_bonus:"Bonus Referral" };

interface Item { id: string; ts: string; kind: "transaksi"|"gadai"|"simpanan"|"member"; who: string; detail: string; amount?: number; status?: string; }

const KIND_META: Record<string,{icon:any;color:string;label:string}> = {
  transaksi: { icon:Coins,    color:"#D4AF37", label:"Transaksi" },
  gadai:     { icon:Landmark, color:"#60a5fa", label:"Gadai" },
  simpanan:  { icon:Wallet,   color:"#a78bfa", label:"Simpanan" },
  member:    { icon:UserPlus, color:"#34d399", label:"Anggota" },
};

const FILTERS = ["semua","transaksi","gadai","simpanan","member"] as const;

export default function MasterAuditPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<typeof FILTERS[number]>("semua");

  async function load() {
    setLoading(true);
    try {
      const [txRes, gadaiRes, simRes, memRes] = await Promise.all([
        (supabase.from("transactions") as any).select("id, type, amount, status, updated_at, created_at, profiles:profiles!user_id(name)").order("created_at",{ascending:false}).limit(40),
        (supabase.from("gadai") as any).select("id, dana_cair, status, updated_at, created_at, profiles:profiles!user_id(name)").order("updated_at",{ascending:false}).limit(30),
        (supabase.from("simpanan") as any).select("id, type, amount, status, created_at, profiles:profiles!user_id(name)").order("created_at",{ascending:false}).limit(30),
        (supabase.from("profiles") as any).select("id, name, status, created_at").eq("role","member").order("created_at",{ascending:false}).limit(20),
      ]);

      const merged: Item[] = [];
      (txRes.data||[]).forEach((t: any) => merged.push({
        id:`tx-${t.id}`, ts:t.created_at, kind:"transaksi", who:t.profiles?.name||"â€”",
        detail:`${TX_LABEL[t.type]||t.type}`, amount:t.amount, status:t.status,
      }));
      (gadaiRes.data||[]).forEach((g: any) => merged.push({
        id:`gd-${g.id}`, ts:g.updated_at||g.created_at, kind:"gadai", who:g.profiles?.name||"â€”",
        detail:"Gadai simpanan", amount:g.dana_cair, status:g.status,
      }));
      (simRes.data||[]).forEach((s: any) => merged.push({
        id:`sm-${s.id}`, ts:s.created_at, kind:"simpanan", who:s.profiles?.name||"â€”",
        detail:`Simpanan ${s.type}`, amount:s.amount, status:s.status,
      }));
      (memRes.data||[]).forEach((m: any) => merged.push({
        id:`mb-${m.id}`, ts:m.created_at, kind:"member", who:m.name||"â€”",
        detail:"Pendaftaran anggota", status:m.status,
      }));

      merged.sort((a,b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
      setItems(merged.slice(0, 100));
    } catch {}
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = filter === "semua" ? items : items.filter(i => i.kind === filter);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Log Aktivitas</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Riwayat aktivitas terbaru seluruh sistem</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {FILTERS.map(f => (
          <button key={f} onClick={()=>setFilter(f)}
            style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${filter===f?"rgba(212,175,55,0.35)":"rgba(255,255,255,0.08)"}`, background:filter===f?"rgba(212,175,55,0.1)":"transparent", color:filter===f?"#D4AF37":"rgba(255,255,255,0.45)", cursor:"pointer", fontSize:".8rem", fontWeight:filter===f?700:400, textTransform:"capitalize" }}>
            {f}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color:"rgba(255,255,255,0.3)" }}>Memuat...</p>
        : filtered.length === 0 ? (
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:"48px", textAlign:"center" }}>
            <Activity style={{ width:38, height:38, color:"rgba(255,255,255,0.15)", margin:"0 auto 12px" }} />
            <p style={{ color:"rgba(255,255,255,0.4)", margin:0 }}>Belum ada aktivitas.</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {filtered.map((it,i)=>{
              const meta = KIND_META[it.kind];
              const Icon = meta.icon;
              return (
                <motion.div key={it.id} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:Math.min(i*.015,.3) }}
                  style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:`${meta.color}18`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Icon style={{ width:16, height:16, color:meta.color }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ color:"#fff", fontWeight:600, fontSize:".86rem", margin:0 }}>
                      {it.who} <span style={{ color:"rgba(255,255,255,0.4)", fontWeight:400 }}>Â· {it.detail}</span>
                    </p>
                    <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".73rem", margin:"2px 0 0" }}>{fmtDate(it.ts)}</p>
                  </div>
                  {it.amount != null && <span style={{ color:meta.color, fontWeight:700, fontSize:".85rem", whiteSpace:"nowrap" }}>{fmt(it.amount)}</span>}
                  {it.status && <span style={{ color:"rgba(255,255,255,0.45)", fontSize:".72rem", textTransform:"capitalize", marginLeft:8 }}>{it.status}</span>}
                </motion.div>
              );
            })}
          </div>
        )}
    </div>
  );
}

