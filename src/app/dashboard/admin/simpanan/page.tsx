"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Wallet, RefreshCw, Save, Search, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import Select from "@/components/ui/Select";

interface Member { id: string; name: string; phone: string | null; }

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" });

const inp: React.CSSProperties = {
  width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:".9rem", outline:"none", boxSizing:"border-box",
};

const TYPE_OPTS = [
  { value:"pokok",    label:"Simpanan Pokok" },
  { value:"wajib",    label:"Simpanan Wajib" },
  { value:"sukarela", label:"Simpanan Sukarela" },
];
const TYPE_LABEL: Record<string,string> = { pokok:"Pokok", wajib:"Wajib", sukarela:"Sukarela" };
const STATUS_COLOR: Record<string,string> = { pending:"#fbbf24", completed:"#34d399", rejected:"#f87171" };

export default function AdminSimpananPage() {
  const { user } = useAuthStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch]   = useState("");
  const [form, setForm]       = useState({ user_id:"", type:"wajib", amount:"", description:"" });
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState("");
  const [recent, setRecent]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadMembers() {
    const { data } = await (supabase.from("profiles") as any).select("id, name, phone").eq("role","member").order("name");
    setMembers(data || []);
  }
  async function loadRecent() {
    setLoading(true);
    const { data } = await (supabase.from("simpanan") as any)
      .select("id, type, amount, status, created_at, profiles(name)")
      .order("created_at",{ascending:false}).limit(15);
    setRecent(data || []);
    setLoading(false);
  }
  useEffect(() => { loadMembers(); loadRecent(); }, []);

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) || (m.phone||"").includes(search));
  const selected = members.find(m => m.id === form.user_id);

  async function save() {
    if (!form.user_id || !form.amount) { setError("Pilih anggota dan isi nominal."); return; }
    setSaving(true); setError("");
    try {
      const { error: err } = await (supabase.from("simpanan") as any).insert({
        user_id: form.user_id,
        type: form.type,
        amount: Number(form.amount),
        description: form.description || null,
        status: "completed",        // langsung sah karena diinput admin
        verified_by: user?.id,
      });
      if (err) { setError(err.message); }
      else {
        setSaved(true); setTimeout(()=>setSaved(false), 2500);
        try {
          await (supabase.from("notifications") as any).insert({
            user_id: form.user_id, title:"Simpanan Ditambahkan",
            body:`Admin menambahkan ${TYPE_LABEL[form.type]} ${fmt(Number(form.amount))} ke simpanan Anda.`,
            type:"simpanan", is_read:false, link:"/dashboard/member/simpanan",
          });
        } catch {}
        setForm({ user_id:"", type:"wajib", amount:"", description:"" }); setSearch("");
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
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Catat setoran simpanan pokok / wajib / sukarela anggota</p>
        </div>
        <button onClick={()=>{loadMembers();loadRecent();}} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
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
            <div style={{ position:"relative", marginBottom:8 }}>
              <Search style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:14, height:14, color:"rgba(255,255,255,0.3)" }} />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama / HP..." style={{ ...inp, paddingLeft:34 }} />
            </div>
            {search && filtered.length > 0 && !selected && (
              <div style={{ background:"rgba(10,10,10,0.95)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, maxHeight:160, overflowY:"auto" }}>
                {filtered.slice(0,6).map(m => (
                  <button key={m.id} onClick={()=>{ setForm(p=>({...p,user_id:m.id})); setSearch(m.name); }}
                    style={{ width:"100%", display:"flex", flexDirection:"column", padding:"10px 14px", background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,0.05)", color:"#fff", cursor:"pointer", textAlign:"left" }}>
                    <span style={{ fontWeight:600, fontSize:".85rem" }}>{m.name}</span>
                    <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem" }}>{m.phone || "-"}</span>
                  </button>
                ))}
              </div>
            )}
            {selected && (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.25)", borderRadius:9, padding:"8px 12px" }}>
                <span style={{ color:"#a78bfa", fontWeight:600, fontSize:".85rem" }}>✓ {selected.name}</span>
                <button onClick={()=>{setForm(p=>({...p,user_id:""}));setSearch("");}} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", cursor:"pointer" }}>×</button>
              </div>
            )}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Jenis</label>
              <Select value={form.type} onChange={v=>setForm(p=>({...p,type:v}))} options={TYPE_OPTS} />
            </div>
            <div>
              <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Nominal (Rp) *</label>
              <input type="number" min={0} value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} style={inp} placeholder="0" />
            </div>
          </div>

          <div>
            <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".78rem", display:"block", marginBottom:7 }}>Keterangan</label>
            <input value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} style={inp} placeholder="Contoh: Setoran wajib Juni" />
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
                  <span style={{ color:"#a78bfa", fontWeight:700, fontSize:".82rem" }}>{TYPE_LABEL[r.type]||r.type}</span>
                  <span style={{ color:STATUS_COLOR[r.status]||"#fff", fontSize:".72rem", textTransform:"capitalize" }}>{r.status}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ color:"rgba(255,255,255,0.55)", fontSize:".8rem" }}>{r.profiles?.name||"-"} · {fmtDate(r.created_at)}</span>
                  <span style={{ color:"#fff", fontWeight:700, fontSize:".85rem" }}>{fmt(r.amount)}</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
