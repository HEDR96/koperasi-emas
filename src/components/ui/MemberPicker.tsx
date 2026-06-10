"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";

export interface PickMember { id: string; name: string; phone: string | null; nik: string | null; }

interface Props {
  value: string;                          // id anggota terpilih
  onChange: (m: PickMember | null) => void;
  placeholder?: string;
}

/**
 * Combobox pemilih anggota: klik → langsung tampil daftar anggota AKTIF,
 * plus kolom cari di atas. Dipakai di form Input Simpanan / Transaksi / Deposit.
 */
export default function MemberPicker({ value, onChange, placeholder = "Pilih anggota aktif..." }: Props) {
  const [members, setMembers] = useState<PickMember[]>([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await (supabase.from("profiles") as any)
        .select("id, name, phone, nik").or("role.eq.member,is_member.eq.true").eq("status", "active").order("name");
      setMembers(data || []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const selected = members.find(m => m.id === value);
  const filtered = q
    ? members.filter(m =>
        m.name.toLowerCase().includes(q.toLowerCase()) ||
        (m.nik || "").toLowerCase().includes(q.toLowerCase()) ||
        (m.phone || "").includes(q))
    : members;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
          background: "rgba(255,255,255,0.05)", border: `1px solid ${selected ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.1)"}`,
          borderRadius: 10, padding: "10px 14px", color: selected ? "#fff" : "rgba(255,255,255,0.4)",
          fontSize: ".9rem", cursor: "pointer", boxSizing: "border-box", textAlign: "left",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected ? `${selected.name}${selected.nik ? " · " + selected.nik : ""}` : placeholder}
        </span>
        <ChevronDown style={{ width: 16, height: 16, color: "rgba(255,255,255,0.4)", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 1000,
          background: "#1a1a1a", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 10,
          boxShadow: "0 12px 32px rgba(0,0,0,0.6)", overflow: "hidden",
        }}>
          <div style={{ position: "relative", padding: 8, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <Search style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "rgba(255,255,255,0.3)" }} />
            <input
              autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Cari nama / ID..."
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 10px 8px 32px", color: "#fff", fontSize: ".85rem", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto", padding: 4 }}>
            {loading ? (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: ".82rem", padding: "12px 14px", margin: 0 }}>Memuat anggota...</p>
            ) : filtered.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: ".82rem", padding: "12px 14px", margin: 0 }}>Tidak ada anggota aktif.</p>
            ) : filtered.map(m => {
              const active = m.id === value;
              return (
                <button
                  key={m.id} type="button"
                  onClick={() => { onChange(m); setOpen(false); setQ(""); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                    background: active ? "rgba(212,175,55,0.15)" : "transparent", border: "none",
                    borderRadius: 7, padding: "9px 12px", cursor: "pointer", textAlign: "left",
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.08)"; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ color: active ? "#D4AF37" : "#fff", fontWeight: 600, fontSize: ".86rem" }}>{m.name}</span>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: ".74rem" }}>{m.nik || "—"}</span>
                  </span>
                  {active && <Check style={{ width: 14, height: 14, color: "#D4AF37", flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
