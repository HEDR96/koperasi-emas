"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, RefreshCw, CheckCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";

interface Notif {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

const TYPE_COLOR: Record<string, string> = {
  transaction: "#D4AF37",
  member:      "#60a5fa",
  system:      "#a78bfa",
  promo:       "#f97316",
};
const TYPE_BG: Record<string, string> = {
  transaction: "rgba(212,175,55,0.12)",
  member:      "rgba(96,165,250,0.12)",
  system:      "rgba(167,139,250,0.12)",
  promo:       "rgba(249,115,22,0.12)",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "Baru saja";
  if (mins  < 60) return `${mins} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  return `${days} hari lalu`;
}

export default function NotifikasiPage() {
  const { user }                    = useAuthStore();
  const [notifs, setNotifs]         = useState<Notif[]>([]);
  const [loading, setLoading]       = useState(true);
  const [tableExists, setTableExists] = useState(true);
  const [marking, setMarking]       = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await (supabase.from("notifications") as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          setTableExists(false);
        }
        setNotifs([]);
      } else {
        setTableExists(true);
        setNotifs(data ?? []);
      }
    } catch {
      setTableExists(false);
      setNotifs([]);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function markAllRead() {
    if (!user) return;
    setMarking(true);
    try {
      await (supabase.from("notifications") as any)
        .update({ is_read: true })
        .eq("is_read", false);
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
    setMarking(false);
  }

  async function markOne(id: string) {
    try {
      await (supabase.from("notifications") as any)
        .update({ is_read: true })
        .eq("id", id);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  }

  const unreadCount = notifs.filter(n => !n.is_read).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ color: "#2D1B00", fontSize: "1.4rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            Notifikasi
            {unreadCount > 0 && (
              <span style={{ background: "rgba(212,175,55,0.2)", color: "#D4AF37", borderRadius: 20, padding: "2px 10px", fontSize: ".75rem", fontWeight: 700 }}>
                {unreadCount} baru
              </span>
            )}
          </h1>
          <p style={{ color: "rgba(101,67,14,0.45)", fontSize: ".85rem", margin: "4px 0 0" }}>
            Semua notifikasi sistem koperasi.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={load}
            style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.72)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:10, padding:"8px 14px", color:"rgba(101,67,14,0.55)", cursor:"pointer", fontSize:".85rem" }}>
            <RefreshCw style={{ width:14, height:14 }} /> Refresh
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead} disabled={marking}
              style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 16px", color:"#8B6010", cursor:"pointer", fontSize:".85rem", fontWeight:600 }}>
              <CheckCheck style={{ width:14, height:14 }} /> Tandai Semua Dibaca
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!tableExists ? (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{ background:"rgba(167,139,250,0.06)", border:"1px solid rgba(167,139,250,0.15)", borderRadius:16, padding:"32px", textAlign:"center" }}>
          <Bell style={{ width:40, height:40, color:"rgba(167,139,250,0.4)", margin:"0 auto 14px" }} />
          <p style={{ color:"rgba(101,67,14,0.55)", fontSize:".95rem", margin:"0 0 8px", fontWeight:600 }}>Tabel notifikasi belum dibuat</p>
          <p style={{ color:"rgba(101,67,14,0.35)", fontSize:".82rem", margin:0 }}>
            Jalankan migrasi SQL untuk membuat tabel <code style={{ color:"#a78bfa" }}>notifications</code> terlebih dahulu.
          </p>
        </motion.div>
      ) : loading ? (
        <p style={{ color:"rgba(101,67,14,0.35)" }}>Memuat notifikasi...</p>
      ) : notifs.length === 0 ? (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          style={{ background:"rgba(255,255,255,0.72)", border:"1px solid rgba(201,162,39,0.15)", borderRadius:16, padding:"48px", textAlign:"center" }}>
          <Bell style={{ width:40, height:40, color:"rgba(201,162,39,0.2)", margin:"0 auto 14px" }} />
          <p style={{ color:"rgba(101,67,14,0.4)", fontSize:".95rem", margin:0 }}>Belum ada notifikasi.</p>
        </motion.div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {notifs.map((n, i) => (
            <motion.div key={n.id}
              initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay: i*0.04 }}
              onClick={() => !n.is_read && markOne(n.id)}
              style={{
                background: n.is_read ? "rgba(255,255,255,0.02)" : "rgba(212,175,55,0.05)",
                border: `1px solid ${n.is_read ? "rgba(201,162,39,0.12)" : "rgba(212,175,55,0.12)"}`,
                borderRadius: 14, padding: "16px 18px",
                cursor: n.is_read ? "default" : "pointer",
                display: "flex", gap: 14, alignItems: "flex-start",
              }}
            >
              {/* Dot */}
              <div style={{ flexShrink:0, marginTop:4 }}>
                {!n.is_read ? (
                  <div style={{ width:8, height:8, borderRadius:"50%", background:"#D4AF37" }} />
                ) : (
                  <div style={{ width:8, height:8, borderRadius:"50%", background:"rgba(201,162,39,0.2)" }} />
                )}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                  <p style={{ color: n.is_read ? "rgba(255,255,255,0.7)" : "#fff", fontWeight: n.is_read ? 500 : 700, fontSize:".9rem", margin:0 }}>
                    {n.title}
                  </p>
                  <span style={{ background: TYPE_BG[n.type]||"rgba(201,162,39,0.15)", color: TYPE_COLOR[n.type]||"rgba(101,67,14,0.55)", borderRadius:5, padding:"2px 8px", fontSize:".7rem", fontWeight:600, textTransform:"capitalize" }}>
                    {n.type}
                  </span>
                </div>
                <p style={{ color:"rgba(101,67,14,0.45)", fontSize:".83rem", margin:"0 0 6px", lineHeight:1.5 }}>{n.body}</p>
                <p style={{ color:"rgba(101,67,14,0.3)", fontSize:".75rem", margin:0 }}>{timeAgo(n.created_at)}</p>
              </div>
              {n.link && (
                <a href={n.link}
                  style={{ color:"#8B6010", fontSize:".75rem", textDecoration:"none", flexShrink:0, marginTop:2 }}
                  onClick={e => e.stopPropagation()}>
                  Lihat →
                </a>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
