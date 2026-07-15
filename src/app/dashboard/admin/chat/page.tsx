"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, RefreshCw, Search, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Member { id: string; name: string; phone: string | null; status: string; }

// Normalisasi nomor HP Indonesia ke format wa.me (62...)
function toWa(phone: string | null): string | null {
  if (!phone) return null;
  let p = phone.replace(/[^0-9]/g, "");
  if (p.startsWith("0")) p = "62" + p.slice(1);
  else if (p.startsWith("8")) p = "62" + p;
  else if (!p.startsWith("62")) return null;
  return p;
}

export default function AdminChatPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await (supabase.from("profiles") as any)
      .select("id, name, phone, status").or("role.eq.member,is_member.eq.true").order("name");
    setMembers(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) || (m.phone||"").includes(search));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:820 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#2D1B00", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Hubungi Anggota</h1>
          <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".85rem", margin:"4px 0 0" }}>Kontak anggota langsung via WhatsApp</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#8B6010", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      <div style={{ position:"relative", maxWidth:400 }}>
        <Search style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:15, height:15, color:"rgba(101,67,14,0.35)" }} />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama atau nomor HP..."
          style={{ width:"100%", background:"rgba(255,255,255,0.72)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:10, padding:"10px 14px 10px 38px", color:"#2D1B00", fontSize:".88rem", outline:"none", boxSizing:"border-box" }} />
      </div>

      {loading ? <p style={{ color:"rgba(101,67,14,0.35)" }}>Memuat...</p>
        : filtered.length === 0 ? <p style={{ color:"rgba(101,67,14,0.35)" }}>Tidak ada anggota.</p>
        : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {filtered.map((m,i)=>{
              const wa = toWa(m.phone);
              return (
                <motion.div key={m.id} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.02 }}
                  style={{ background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.15)", borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:"rgba(6,95,70,0.09)", display:"flex", alignItems:"center", justifyContent:"center", color:"#065f46", fontWeight:700, fontSize:".85rem" }}>
                      {m.name?.[0]?.toUpperCase()||"M"}
                    </div>
                    <div>
                      <p style={{ color:"#2D1B00", fontWeight:600, fontSize:".88rem", margin:0 }}>{m.name}</p>
                      <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".76rem", margin:"2px 0 0" }}>{m.phone||"Tidak ada nomor"}</p>
                    </div>
                  </div>
                  {wa ? (
                    <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
                      style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(37,211,102,0.12)", border:"1px solid rgba(37,211,102,0.3)", borderRadius:9, padding:"7px 14px", color:"#25d366", textDecoration:"none", fontSize:".82rem", fontWeight:600 }}>
                      <MessageCircle style={{ width:14, height:14 }} /> WhatsApp
                    </a>
                  ) : (
                    <span style={{ display:"flex", alignItems:"center", gap:6, color:"rgba(101,67,14,0.3)", fontSize:".8rem" }}>
                      <Phone style={{ width:13, height:13 }} /> —
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
    </div>
  );
}
