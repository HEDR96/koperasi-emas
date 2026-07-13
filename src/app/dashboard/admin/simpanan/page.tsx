"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wallet, RefreshCw, Save, CheckCircle, CheckCheck, XCircle, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import MemberPicker from "@/components/ui/MemberPicker";
import RupiahInput from "@/components/ui/RupiahInput";
import { getStaffMap, fmtTgl, fmtTglJam } from "@/lib/staff";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
const inp: React.CSSProperties = {
  width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:".9rem", outline:"none", boxSizing:"border-box",
};

const STATUS_COLOR: Record<string,string> = { pending:"#fbbf24", completed:"#34d399", rejected:"#f87171" };

export default function AdminSimpananPage() {
  const { user } = useAuthStore();
  const today = new Date().toISOString().slice(0,10);
  const [form, setForm]       = useState({ user_id:"", amount:"", description:"", tgl: today });
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState("");
  const [recent, setRecent]   = useState<any[]>([]);
  const [staff, setStaff]     = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  async function loadRecent() {
    setLoading(true);
    const [{ data }, staffMap] = await Promise.all([
      (supabase.from("simpanan") as any)
        .select("id, type, amount, status, created_at, transaction_date, recorded_by, profiles:profiles!user_id(name)")
        .order("created_at",{ascending:false}).limit(15),
      getStaffMap(),
    ]);
    setRecent(data || []);
    setStaff(staffMap);
    setLoading(false);
  }

  async function loadPending() {
    setLoadingPending(true);
    const { data } = await (supabase.from("simpanan") as any)
      .select("id, type, amount, description, status, created_at, user_id, profiles:profiles!user_id(name)")
      .eq("status","pending").order("created_at",{ascending:true});
    setPending(data || []);
    setLoadingPending(false);
  }

  useEffect(() => { loadRecent(); loadPending(); }, []);

  async function approvePending(row: any) {
    setActingId(row.id);
    await (supabase.from("simpanan") as any).update({ status:"completed", verified_by:user?.id }).eq("id", row.id);
    try {
      await (supabase.from("notifications") as any).insert({
        user_id: row.user_id, title:"Setoran Simpanan Disetujui",
        body:`Setoran simpanan Anda ${fmt(Number(row.amount))} telah disetujui.`,
        type:"simpanan", is_read:false, link:"/dashboard/member/simpanan",
      });
    } catch {}
    setActingId(null);
    loadPending(); loadRecent();
  }

  async function rejectPending(row: any) {
    if (!confirm("Tolak setoran simpanan ini?")) return;
    setActingId(row.id);
    await (supabase.from("simpanan") as any).update({ status:"rejected", verified_by:user?.id }).eq("id", row.id);
    try {
      await (supabase.from("notifications") as any).insert({
        user_id: row.user_id, title:"Setoran Simpanan Ditolak",
        body:`Setoran simpanan Anda ${fmt(Number(row.amount))} ditolak.`,
        type:"simpanan", is_read:false, link:"/dashboard/member/simpanan",
      });
    } catch {}
    setActingId(null);
    loadPending(); loadRecent();
  }

  async function save() {
    if (!form.user_id || !form.amount) { setError("Pilih anggota dan isi nominal."); return; }
    setSaving(true); setError("");
    try {
      const { error: err } = await (supabase.from("simpanan") as any).insert({
        user_id: form.user_id,
        type: "simpanan",
        amount: Number(form.amount),
        description: form.description || null,
        status: "completed",        // langsung sah karena diinput admin
        verified_by: user?.id,
        recorded_by: user?.id,
        transaction_date: new Date(form.tgl).toISOString(),
      });
      if (err) { setError(err.message); }
      else {
        setSaved(true); setTimeout(()=>setSaved(false), 2500);
        try {
          await (supabase.from("notifications") as any).insert({
            user_id: form.user_id, title:"Simpanan Ditambahkan",
            body:`Admin menambahkan Simpanan ${fmt(Number(form.amount))} ke Simpanan Anda.`,
            type:"simpanan", is_read:false, link:"/dashboard/member/simpanan",
          });
        } catch {}
        setForm({ user_id:"", amount:"", description:"", tgl: today });
        loadRecent();
      }
    } catch { setError("Terjadi kesalahan."); }
    setSaving(false);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:900 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Input Simpanan Anggota</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Catat setoran simpanan anggota</p>
        </div>
        <button onClick={()=>{loadRecent();loadPending();}} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>

      {/* Menunggu Persetujuan — setoran mandiri dari member (Ajukan Transaksi) */}
      <div>
        <p style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 12px", display:"flex", alignItems:"center", gap:8 }}>
          <Clock style={{ width:13, height:13, color:"#fbbf24" }} /> Menunggu Persetujuan
          {pending.length > 0 && <span style={{ background:"rgba(251,191,36,0.15)", color:"#fbbf24", borderRadius:20, padding:"2px 8px", fontSize:".72rem" }}>{pending.length}</span>}
        </p>
        {loadingPending ? (
          <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".85rem" }}>Memuat...</p>
        ) : pending.length === 0 ? (
          <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".85rem" }}>Tidak ada setoran yang menunggu persetujuan.</p>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {pending.map(r => (
              <div key={r.id} style={{ background:"rgba(251,191,36,0.04)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:160 }}>
                  <p style={{ color:"#fff", fontWeight:600, fontSize:".88rem", margin:"0 0 3px" }}>{r.profiles?.name||"-"}</p>
                  <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".75rem", margin:0 }}>{fmtTglJam(r.created_at)}{r.description?` · ${r.description}`:""}</p>
                </div>
                <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".95rem", margin:0 }}>{fmt(r.amount)}</p>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>approvePending(r)} disabled={actingId===r.id}
                    style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.3)", color:"#34d399", cursor:actingId===r.id?"not-allowed":"pointer", fontSize:".8rem", fontWeight:700 }}>
                    <CheckCheck style={{ width:13, height:13 }} /> Setujui
                  </button>
                  <button onClick={()=>rejectPending(r)} disabled={actingId===r.id}
                    style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, background:"rgba(248,113,113,0.07)", border:"1px solid rgba(248,113,113,0.2)", color:"#f87171", cursor:actingId===r.id?"not-allowed":"pointer", fontSize:".8rem", fontWeight:700 }}>
                    <XCircle style={{ width:13, height:13 }} /> Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
        {/* Form */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
          style={{ background:"rgba(167,139,250,0.04)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:16, padding:22, display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Wallet style={{ width:16, height:16, color:"#a78bfa" }} />
            <p style={{ color:"#a78bfa", fontWeight:700, fontSize:".9rem", margin:0 }}>Form Simpanan</p>
          </div>
          {error && <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:10, padding:"10px 14px", color:"#f87171", fontSize:".82rem" }}>{error}</div>}
          {saved && <div style={{ background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:10, padding:"10px 14px", color:"#34d399", fontSize:".82rem", display:"flex", alignItems:"center", gap:8 }}><CheckCircle style={{width:14,height:14}}/> Simpanan tersimpan!</div>}

          {/* Member */}
          <div>
            <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Anggota *</label>
            <MemberPicker value={form.user_id} onChange={m=>setForm(p=>({...p,user_id:m?.id||""}))} />
          </div>

          <div>
            <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Nominal (Rp) *</label>
            <RupiahInput value={form.amount} onValueChange={v=>setForm(p=>({...p,amount:v}))} style={inp} />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Tanggal Setoran</label>
              <input type="date" value={form.tgl} onChange={e=>setForm(p=>({...p,tgl:e.target.value}))} style={inp} />
            </div>
            <div>
              <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Keterangan</label>
              <input value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} style={inp} placeholder="Contoh: Setoran wajib Juni" />
            </div>
          </div>

          <button onClick={save} disabled={saving || !form.user_id || !form.amount}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"12px", borderRadius:11, background: saved ? "rgba(52,211,153,0.2)" : "linear-gradient(135deg,#a78bfa,#c4b5fd)", border:"none", color: saved ? "#34d399" : "#0a0a0a", fontWeight:700, fontSize:".95rem", cursor: saving||!form.user_id||!form.amount ? "not-allowed" : "pointer", opacity: saving?.7:1 }}>
            {saving ? "Menyimpan..." : saved ? "✓ Tersimpan" : <><Save style={{ width:15, height:15 }} /> Simpan Simpanan</>}
          </button>
        </motion.div>

        {/* Recent */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", margin:0 }}>Simpanan Terbaru</p>
          {loading ? <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".85rem" }}>Memuat...</p>
            : recent.length === 0 ? <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".85rem" }}>Belum ada data.</p>
            : recent.map(r => (
              <div key={r.id} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ color:"#a78bfa", fontWeight:700, fontSize:".82rem" }}>{"Simpanan"}</span>
                  <span style={{ color:STATUS_COLOR[r.status]||"#fff", fontSize:".72rem", textTransform:"capitalize" }}>{r.status}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ color:"rgba(255,255,255,0.55)", fontSize:".8rem" }}>{r.profiles?.name||"-"} · Tgl setor {fmtTgl(r.transaction_date || r.created_at)}</span>
                  <span style={{ color:"#fff", fontWeight:700, fontSize:".85rem" }}>{fmt(r.amount)}</span>
                </div>
                <div style={{ marginTop:6, paddingTop:6, borderTop:"1px solid rgba(255,255,255,0.05)", display:"flex", justifyContent:"space-between", gap:8, flexWrap:"wrap" }}>
                  <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".7rem" }}>Diinput oleh: <span style={{ color:"#a78bfa" }}>{staff[r.recorded_by] || "—"}</span></span>
                  <span style={{ color:"rgba(255,255,255,0.3)", fontSize:".7rem" }}>Diinput: {fmtTglJam(r.created_at)}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

