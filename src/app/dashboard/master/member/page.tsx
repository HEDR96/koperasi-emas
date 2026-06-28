"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, RefreshCw, UserPlus, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import Select from "@/components/ui/Select";
import {
  getGadaiParams, nilaiGadaiMax, angsuranGadai,
  getMarkup, withMarkup, getCicilanParams,
  cicilanHargaTenor, cicilanDpTenor, CICILAN_TENORS,
  type GadaiParams, GADAI_PARAM_DEFAULTS,
  type CicilanParams, CICILAN_PARAM_DEFAULTS,
} from "@/lib/harga";

interface MemberRow {
  id: string;
  name: string;
  nik: string | null;
  phone: string | null;
  status: string;
  gold_grams: number;
  rupiah_balance: number;
  created_at: string;
  role?: string;
}

interface MemberDetail extends MemberRow {
  transactions: any[];
  savings: any[];
  installments: any[];
  simpanan: any[];
  gadai: any[];
}

const DEFAULT_FORM = { name:"", nik:"", email:"", password:"", phone:"" };

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n);
}
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"});
}

const STATUS_COLOR: Record<string,string> = { active:"#34d399", pending:"#fbbf24", suspended:"#f87171", rejected:"#fb923c" };
const STATUS_BG:    Record<string,string> = { active:"rgba(52,211,153,0.12)", pending:"rgba(251,191,36,0.12)", suspended:"rgba(248,113,113,0.12)", rejected:"rgba(251,146,60,0.12)" };

export default function MemberManagementPage() {
  const { user } = useAuthStore();
  const [members, setMembers]       = useState<MemberRow[]>([]);
  const [filtered, setFiltered]     = useState<MemberRow[]>([]);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");
  const [detail, setDetail]         = useState<MemberDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [buybackHarga, setBuybackHarga]     = useState(0);
  const [gadaiParams, setGadaiParams]       = useState<GadaiParams>(GADAI_PARAM_DEFAULTS);
  // Data harga emas (sudah termasuk markup anggota) untuk dropdown gram + auto-isi.
  const [goldRows, setGoldRows]             = useState<{ gram:number; harga:number }[]>([]);
  const [cicilanParams, setCicilanParams]   = useState<CicilanParams>(CICILAN_PARAM_DEFAULTS);
  // Form aksi di profil — pinjaman sekarang dalam Rupiah
  const [gForm, setGForm] = useState({ open:false, pinjaman:"", tenor:1, saving:false, err:"" });
  // Cicilan/beli otomatis: pilih tipe (beli/cicilan) + berat (gram) → harga & angsuran auto.
  const C_EMPTY = { open:false, type:"cicilan", gram:"", tenor:"6", saving:false, err:"" };
  const [cForm, setCForm] = useState(C_EMPTY);

  useEffect(() => {
    (async () => {
      const { data: bb } = await (supabase.from("harga_emas_berat") as any)
        .select("gram, harga").eq("kategori","buyback").order("created_at",{ascending:false}).limit(10);
      let hb = 0;
      if (bb?.length) { const one = bb.find((r:any)=>Number(r.gram)===1)||bb[0]; hb = Number(one.harga)/Number(one.gram); }
      else {
        const { data: gp } = await (supabase.from("gold_prices") as any).select("buyback_member").order("created_at",{ascending:false}).limit(1).single();
        if (gp) hb = Number(gp.buyback_member);
      }
      setBuybackHarga(hb);
      const gp = await getGadaiParams();
      setGadaiParams(gp);

      // Daftar harga emas (jual) + markup anggota per berat, untuk dropdown gram.
      const [{ data: e }, markup, cp] = await Promise.all([
        ((supabase as any).rpc("get_latest_harga_berat", { kat: "emas" }) as any),
        getMarkup(),
        getCicilanParams(),
      ]);
      const seen = new Set<number>();
      const rows = (e||[])
        .filter((r:any)=>{ const g=Number(r.gram); if(seen.has(g)) return false; seen.add(g); return true; })
        .map((r:any)=>({ gram:Number(r.gram), harga: withMarkup(r.harga, Number(r.gram), markup.anggota) }))
        .sort((a:any,bb:any)=>a.gram-bb.gram);
      setGoldRows(rows);
      setCicilanParams(cp);
    })();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const { data } = await (supabase.from("profiles") as any)
        .select("id,name,nik,phone,status,gold_grams,rupiah_balance,created_at,role")
        .or("role.eq.member,is_member.eq.true")
        .order("created_at",{ ascending:false });
      const list = data ?? [];
      setMembers(list);
      setFiltered(list);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // Kata kunci status (Indonesia) supaya bisa dicari "aktif", "menunggu", dll.
  const statusKeywords: Record<string,string> = {
    active: "active aktif", pending: "pending menunggu pending verifikasi",
    suspended: "suspended suspend nonaktif dinonaktifkan", rejected: "rejected ditolak tolak",
  };

  useEffect(() => {
    const q = search.toLowerCase().trim();
    if (!q) { setFiltered(members); return; }
    // Normalisasi: paksa string, lowercase, buang spasi — supaya NIK/HP cocok walau ada beda kapital/spasi.
    const norm = (v: unknown) => String(v ?? "").toLowerCase().replace(/\s+/g, "");
    const qn = q.replace(/\s+/g, "");
    setFiltered(
      members.filter(m => {
        const hay = [
          norm(m.name),
          norm(m.nik),
          norm(m.phone),
          norm(m.status),
          norm(statusKeywords[m.status]),
        ].join(" ");
        // Cocokkan baik versi mentah (q) maupun tanpa spasi (qn).
        return hay.includes(q) || hay.includes(qn);
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, members]);

  async function openDetail(m: MemberRow) {
    setDetail({ ...m, transactions:[], savings:[], installments:[], simpanan:[], gadai:[] });
    setDetailLoading(true);
    try {
      const [txRes, savRes, insRes, simRes, gadaiRes] = await Promise.all([
        (supabase.from("transactions") as any).select("*").eq("user_id",m.id).order("created_at",{ascending:false}).limit(5),
        (supabase.from("savings") as any).select("*").eq("user_id",m.id),
        (supabase.from("installments") as any).select("*").eq("user_id",m.id).order("created_at",{ascending:false}),
        (supabase.from("simpanan") as any).select("id, type, amount, status, transaction_date, created_at, description").eq("user_id",m.id).order("transaction_date",{ascending:false}),
        (supabase.from("gadai") as any).select("id, dana_cair, sisa_tagihan, status, tenor, angsuran_per_bulan, created_at").eq("user_id",m.id).order("created_at",{ascending:false}),
      ]);
      setDetail(d => d ? ({ ...d, transactions:txRes.data||[], savings:savRes.data||[], installments:insRes.data||[], simpanan:simRes.data||[], gadai:gadaiRes.data||[] }) : d);
    } catch {}
    setDetailLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await (supabase.from("profiles") as any)
      .update({ status, status_changed_by: user?.id ?? null, status_changed_at: new Date().toISOString() })
      .eq("id", id);
    load();
  }

  // ── Aksi: Ajukan Gadai dari profil (admin atas nama anggota) ──
  // Nilai gadai = total simpanan × 80% − admin gadai
  async function submitGadai(m: MemberDetail, totalSim: number) {
    const maxPin = nilaiGadaiMax(totalSim, gadaiParams.adminAnggota);
    const dana   = Math.min(Number(gForm.pinjaman) || 0, maxPin);
    if (dana <= 0)          { setGForm(f=>({...f,err:"Masukkan jumlah pinjaman."})); return; }
    if (dana > maxPin)      { setGForm(f=>({...f,err:`Maksimal ${fmt(maxPin)}`})); return; }
    setGForm(f=>({...f,saving:true,err:""}));
    const angsuran = angsuranGadai(dana, gadaiParams.persenAnggota, gForm.tenor);
    const gramSetaraGadai = buybackHarga > 0 ? dana / buybackHarga : 0;
    const { error } = await (supabase.from("gadai") as any).insert({
      user_id: m.id, nilai_jaminan: dana, harga_buyback: Math.round(buybackHarga),
      gram_setara: gramSetaraGadai, dana_cair: dana, sisa_tagihan: dana, tenor: gForm.tenor,
      angsuran_per_bulan: angsuran, status: "aktif", tanggal_cair: new Date().toISOString(),
      keterangan: `Gadai simpanan ${fmt(dana)}, tenor ${gForm.tenor} bulan (dari profil admin)`,
      recorded_by: user?.id, transaction_date: new Date().toISOString(),
    });
    if (error) { setGForm(f=>({...f,saving:false,err:error.message})); return; }
    try { await (supabase.from("notifications") as any).insert({ user_id:m.id, title:"Gadai Disetujui", body:`Gadai ${fmt(dana)} (tenor ${gForm.tenor} bln, angsuran ${fmt(angsuran)}/bln) telah aktif.`, type:"gadai", is_read:false, link:"/dashboard/member/gadai" }); } catch {}
    setGForm({ open:false, pinjaman:"", tenor:1, saving:false, err:"" });
    await openDetail(m); load();
  }

  // Hitung harga/angsuran/DP otomatis dari berat emas terpilih + tenor.
  //  • Beli Emas  → total = harga emas jual berat tsb (markup anggota).
  //  • Cicilan    → total = harga cicilan (a+b−DP) tenor terpilih; angsuran = total/tenor; DP flat.
  function cicilanCalc() {
    const g = Number(cForm.gram) || 0;
    const row = goldRows.find(r => r.gram === g);
    if (!row) return { row: null, gram: g, total: 0, monthly: 0, dp: 0, tenor: Number(cForm.tenor) || 1 };
    const tenor = Number(cForm.tenor) || 1;
    if (cForm.type === "buy") {
      return { row, gram: g, total: Math.round(row.harga), monthly: 0, dp: 0, tenor };
    }
    const total = cicilanHargaTenor(row.harga, tenor, cicilanParams.adminAnggota, cicilanParams.persenBulanAnggota, cicilanParams.persenDpAnggota);
    const dp    = cicilanDpTenor(row.harga, tenor, cicilanParams.adminAnggota, cicilanParams.persenBulanAnggota, cicilanParams.persenDpAnggota);
    return { row, gram: g, total, monthly: tenor > 0 ? Math.ceil(total / tenor) : 0, dp, tenor };
  }

  // ── Aksi: Buat Beli Emas / Cicilan dari profil ──
  async function submitCicilan(m: MemberDetail) {
    const c = cicilanCalc();
    if (!c.row) { setCForm(f=>({...f,err:"Pilih berat emas terlebih dahulu."})); return; }
    setCForm(f=>({...f,saving:true,err:""}));
    const produk = `Emas ${c.gram} gram`;

    if (cForm.type === "buy") {
      const { error } = await (supabase.from("transactions") as any).insert({
        user_id: m.id, type: "buy", amount: c.total, gram: c.gram,
        price_per_gram: Math.round(c.row.harga / c.gram), status: "completed",
        transaction_date: new Date().toISOString(), recorded_by: user?.id || null,
        notes: `${produk} (dari profil admin)`,
      });
      if (error) { setCForm(f=>({...f,saving:false,err:error.message})); return; }
      try { await (supabase.from("notifications") as any).insert({ user_id:m.id, title:"Pembelian Emas", body:`Pembelian ${produk} ${fmt(c.total)} tercatat.`, type:"transaksi", is_read:false, link:"/dashboard/member/histori" }); } catch {}
    } else {
      const due = new Date(); due.setMonth(due.getMonth()+1);
      const { error } = await (supabase.from("installments") as any).insert({
        user_id: m.id, product_name: produk, total_gram: c.gram, total_amount: c.total,
        monthly_amount: c.monthly, tenor: c.tenor, down_payment: c.dp,
        paid_installments: 0, status: "active", next_due_date: due.toISOString().slice(0,10),
      });
      if (error) { setCForm(f=>({...f,saving:false,err:error.message})); return; }
      try { await (supabase.from("notifications") as any).insert({ user_id:m.id, title:"Cicilan Baru", body:`Cicilan ${produk} ${fmt(c.total)} (${c.tenor}x ${fmt(c.monthly)}, DP ${fmt(c.dp)}) dibuat.`, type:"cicilan", is_read:false, link:"/dashboard/member/cicilan" }); } catch {}
    }
    setCForm(C_EMPTY);
    await openDetail(m); load();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.name||!form.email||!form.password) { setError("Nama, email, password wajib."); return; }
    setSubmitting(true);
    try {
      // Member yang didaftarkan admin harus diverifikasi dulu; master langsung aktif.
      const requireVerification = user?.role === "admin";
      const res = await fetch("/api/register-user",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ name:form.name, email:form.email, password:form.password, phone:form.phone, nik:form.nik, role:"member", requireVerification, createdBy:user?.id }),
      });
      const json = await res.json();
      if (!res.ok||json.error) { setError(json.error||"Gagal mendaftar member."); }
      else {
        setSuccess(json.adminAsMember
          ? "Email ini milik admin — akun tersebut kini juga terdaftar sebagai anggota."
          : json.status === "pending"
          ? "Member terdaftar. Menunggu verifikasi admin sebelum bisa login."
          : "Member berhasil didaftarkan!");
        setForm(DEFAULT_FORM);
        setTimeout(()=>{ setShowForm(false); setSuccess(""); load(); }, 1600);
      }
    } catch { setError("Kesalahan jaringan."); }
    setSubmitting(false);
  }

  const inputStyle: React.CSSProperties = {
    width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
    borderRadius:10, padding:"10px 14px", color:"#fff", fontSize:".9rem", outline:"none", boxSizing:"border-box",
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Kelola Member</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>
            {members.length} member terdaftar
          </p>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={load}
            style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
            <RefreshCw style={{ width:14, height:14 }} /> Refresh
          </button>
          <button onClick={()=>{ setShowForm(true); setError(""); setSuccess(""); setForm(DEFAULT_FORM); }}
            style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.25)", borderRadius:10, padding:"8px 16px", color:"#34d399", cursor:"pointer", fontSize:".85rem", fontWeight:600 }}>
            <UserPlus style={{ width:14, height:14 }} /> Daftar Member Baru
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position:"relative", maxWidth:400 }}>
        <Search style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:15, height:15, color:"rgba(255,255,255,0.3)" }} />
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama, ID, HP, atau status (aktif/pending/suspend/ditolak)..."
          style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:10, padding:"10px 14px 10px 38px", color:"#fff", fontSize:".88rem", outline:"none", boxSizing:"border-box" }} />
      </div>

      {/* Table */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
        style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                {["Nama","ID","HP","Status","Emas (gr)","Saldo","Aksi"].map(h=>(
                  <th key={h} style={{ padding:"12px 18px", textAlign:"left", color:"rgba(255,255,255,0.3)", fontSize:".75rem", fontWeight:600, textTransform:"uppercase", letterSpacing:".05em", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding:"40px", textAlign:"center", color:"rgba(255,255,255,0.3)" }}>Memuat...</td></tr>
              ) : filtered.length===0 ? (
                <tr><td colSpan={7} style={{ padding:"40px", textAlign:"center", color:"rgba(255,255,255,0.3)" }}>Tidak ada member{search?" yang cocok":""}.</td></tr>
              ) : filtered.map(m=>(
                <tr key={m.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.02)"}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}
                >
                  <td style={{ padding:"13px 18px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:32, height:32, borderRadius:8, background:"rgba(52,211,153,0.12)", display:"flex", alignItems:"center", justifyContent:"center", color:"#34d399", fontWeight:700, fontSize:".85rem", flexShrink:0 }}>
                        {m.name?.[0]||"M"}
                      </div>
                      <span style={{ color:"#fff", fontWeight:600, fontSize:".88rem" }}>{m.name}</span>
                      {m.role && m.role !== "member" && (
                        <span style={{ background:"rgba(212,175,55,0.14)", color:"#D4AF37", borderRadius:6, padding:"2px 8px", fontSize:".68rem", fontWeight:600 }}>
                          {m.role === "master" ? "Master" : "Admin"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding:"13px 18px", color:"rgba(255,255,255,0.5)", fontSize:".83rem" }}>{m.nik||"—"}</td>
                  <td style={{ padding:"13px 18px", color:"rgba(255,255,255,0.5)", fontSize:".83rem" }}>{m.phone||"—"}</td>
                  <td style={{ padding:"13px 18px" }}>
                    <span style={{ background:STATUS_BG[m.status]||"rgba(255,255,255,0.08)", color:STATUS_COLOR[m.status]||"#fff", borderRadius:6, padding:"3px 10px", fontSize:".75rem", fontWeight:600, textTransform:"capitalize" }}>
                      {m.status}
                    </span>
                  </td>
                  <td style={{ padding:"13px 18px", color:"#D4AF37", fontWeight:600, fontSize:".88rem" }}>
                    {Number(m.gold_grams).toFixed(1)}
                  </td>
                  <td style={{ padding:"13px 18px", color:"rgba(255,255,255,0.65)", fontSize:".83rem" }}>
                    {fmt(m.rupiah_balance)}
                  </td>
                  <td style={{ padding:"13px 18px" }}>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={()=>openDetail(m)}
                        style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(96,165,250,0.1)", border:"1px solid rgba(96,165,250,0.2)", borderRadius:8, padding:"5px 10px", color:"#60a5fa", cursor:"pointer", fontSize:".78rem", fontWeight:600 }}>
                        <Eye style={{ width:12, height:12 }} /> Profil
                      </button>
                      {m.status==="pending" && (
                        <button onClick={()=>updateStatus(m.id,"active")}
                          style={{ background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:8, padding:"5px 10px", color:"#34d399", cursor:"pointer", fontSize:".78rem", fontWeight:600 }}>
                          Setujui
                        </button>
                      )}
                      {m.status==="active" && (
                        <button onClick={()=>updateStatus(m.id,"suspended")}
                          style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:8, padding:"5px 10px", color:"#f87171", cursor:"pointer", fontSize:".78rem", fontWeight:600 }}>
                          Suspend
                        </button>
                      )}
                      {(m.status==="suspended" || m.status==="rejected") && (
                        <button onClick={()=>updateStatus(m.id,"active")}
                          style={{ background:"rgba(52,211,153,0.08)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:8, padding:"5px 10px", color:"#34d399", cursor:"pointer", fontSize:".78rem", fontWeight:600 }}>
                          Aktifkan
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {detail && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={()=>setDetail(null)}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
            <motion.div onClick={e=>e.stopPropagation()}
              initial={{ opacity:0, scale:.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:.95 }}
              style={{ width:"min(560px,96vw)", background:"#0f0f0f", border:"1px solid rgba(212,175,55,0.2)", borderRadius:22, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 32px 80px rgba(0,0,0,0.6)" }}
            >
              {/* Modal Header */}
              <div style={{ padding:"20px 22px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,rgba(212,175,55,0.3),rgba(212,175,55,0.1))", display:"flex", alignItems:"center", justifyContent:"center", color:"#D4AF37", fontWeight:800, fontSize:"1.1rem", flexShrink:0 }}>
                  {detail.name?.[0]?.toUpperCase()||"M"}
                </div>
                <div style={{ flex:1 }}>
                  <h2 style={{ color:"#fff", fontWeight:700, fontSize:"1.05rem", margin:0 }}>{detail.name}</h2>
                  <span style={{ background:STATUS_BG[detail.status]||"rgba(255,255,255,0.08)", color:STATUS_COLOR[detail.status]||"#fff", borderRadius:5, padding:"2px 8px", fontSize:".72rem", fontWeight:600, textTransform:"capitalize" }}>{detail.status}</span>
                </div>
                <button onClick={()=>setDetail(null)}
                  style={{ background:"rgba(255,255,255,0.07)", border:"none", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.5)", cursor:"pointer", flexShrink:0 }}>
                  <X style={{ width:15, height:15 }} />
                </button>
              </div>

              <div style={{ padding:"18px 22px 24px" }}>
                {/* Emas & Saldo highlight */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
                  <div style={{ background:"rgba(212,175,55,0.07)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:12, padding:"14px 16px" }}>
                    <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".73rem", margin:"0 0 5px" }}>Total Emas</p>
                    <p style={{ color:"#D4AF37", fontWeight:800, fontSize:"1.3rem", margin:0 }}>{Number(detail.gold_grams).toFixed(1)}<span style={{ fontSize:".78rem", fontWeight:500, marginLeft:4 }}>gram</span></p>
                  </div>
                  <div style={{ background:"rgba(96,165,250,0.07)", border:"1px solid rgba(96,165,250,0.15)", borderRadius:12, padding:"14px 16px" }}>
                    <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".73rem", margin:"0 0 5px" }}>Saldo Rupiah</p>
                    <p style={{ color:"#60a5fa", fontWeight:800, fontSize:"1.1rem", margin:0 }}>{fmt(detail.rupiah_balance)}</p>
                  </div>
                </div>

                {/* Info rows */}
                <div style={{ display:"flex", flexDirection:"column", gap:0, marginBottom:18, background:"rgba(255,255,255,0.02)", borderRadius:12, overflow:"hidden", border:"1px solid rgba(255,255,255,0.05)" }}>
                  {[
                    ["ID",        detail.nik||"—"],
                    ["Nomor HP",  detail.phone||"—"],
                    ["Bergabung", fmtDate(detail.created_at)],
                  ].map(([k,v], i, arr)=>(
                    <div key={k} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 16px", borderBottom: i < arr.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".83rem" }}>{k}</span>
                      <span style={{ color:"#fff", fontWeight:600, fontSize:".83rem" }}>{v}</span>
                    </div>
                  ))}
                </div>
              {/* Simpanan */}
              {(() => {
                const simDone = detail.simpanan.filter((s:any)=>s.status==="completed");
                const totalSim = simDone.reduce((a:number,s:any)=>a+(s.amount||0),0);
                const activeGadai = detail.gadai.find((g:any)=>["pengajuan","disetujui","aktif"].includes(g.status));
                const gram = buybackHarga > 0 ? totalSim / buybackHarga : 0;
                const maxPin = nilaiGadaiMax(totalSim, gadaiParams.adminAnggota);
                return (
                  <>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                      <h3 style={{ color:"rgba(255,255,255,0.6)", fontSize:".8rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", margin:0 }}>Simpanan</h3>
                      <span style={{ color:"#a78bfa", fontWeight:700, fontSize:".88rem" }}>{fmt(totalSim)}</span>
                    </div>
                    {buybackHarga > 0 && totalSim > 0 && (
                      <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".76rem", margin:"0 0 10px", textAlign:"right" }}>
                        Setara <strong style={{ color:"#D4AF37" }}>{gram.toFixed(1)} gram</strong>
                        <span style={{ color:"rgba(255,255,255,0.3)" }}> · harga gadai {fmt(buybackHarga)}/gr</span>
                      </p>
                    )}
                    {totalSim > 0 && (
                      activeGadai ? (
                        <div style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
                          <p style={{ color:"#f87171", fontSize:".8rem", fontWeight:600, margin:0 }}>⚠ Ada gadai aktif — belum bisa gadai baru</p>
                          <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".75rem", margin:"3px 0 0" }}>Pinjaman {fmt(activeGadai.dana_cair)} · sisa {fmt(activeGadai.sisa_tagihan)} · {activeGadai.tenor} bln</p>
                        </div>
                      ) : (
                        <div style={{ background:"rgba(52,211,153,0.06)", border:"1px solid rgba(52,211,153,0.2)", borderRadius:10, padding:"10px 14px", marginBottom:10 }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, flexWrap:"wrap" }}>
                            <div>
                              <p style={{ color:"#34d399", fontSize:".8rem", fontWeight:600, margin:0 }}>Dapat digadai hingga {fmt(maxPin)}</p>
                              <p style={{ color:"rgba(255,255,255,0.45)", fontSize:".75rem", margin:"3px 0 0" }}>≈ {gram.toFixed(1)} gram · tenor 1-4 bulan</p>
                            </div>
                            {!gForm.open && (
                              <button onClick={()=>setGForm({ open:true, pinjaman:"", tenor:1, saving:false, err:"" })}
                                style={{ background:"rgba(96,165,250,0.15)", border:"1px solid rgba(96,165,250,0.35)", borderRadius:8, padding:"7px 14px", color:"#60a5fa", cursor:"pointer", fontSize:".8rem", fontWeight:600 }}>
                                Ajukan Gadai
                              </button>
                            )}
                          </div>
                          {gForm.open && (() => {
                            const pinRp = Math.min(Number(gForm.pinjaman)||0, maxPin);
                            const angs  = angsuranGadai(pinRp, gadaiParams.persenAnggota, gForm.tenor);
                            const fmtR  = (v:string|number) => { const d=String(v??"").replace(/\D/g,""); return d?new Intl.NumberFormat("id-ID").format(Number(d)):""; };
                            return (
                            <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:10 }}>
                              {gForm.err && <p style={{ color:"#f87171", fontSize:".78rem", margin:0 }}>{gForm.err}</p>}
                              <div>
                                <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".75rem", display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                                  <span>Jumlah Pinjaman (maks {fmt(maxPin)})</span>
                                  <button onClick={()=>setGForm(f=>({...f,pinjaman:String(maxPin)}))} style={{ background:"none", border:"none", color:"#D4AF37", cursor:"pointer", fontSize:".74rem" }}>Maks</button>
                                </label>
                                <div style={{ position:"relative" }}>
                                  <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.4)", fontSize:".8rem", pointerEvents:"none" }}>Rp</span>
                                  <input inputMode="numeric" value={fmtR(gForm.pinjaman)} onChange={e=>setGForm(f=>({...f,pinjaman:e.target.value.replace(/\D/g,"")}))} style={{ ...inputStyle, paddingLeft:30 }} placeholder="0" />
                                </div>
                              </div>
                              <div>
                                <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".75rem", display:"block", marginBottom:5 }}>Tenor (bulan)</label>
                                <div style={{ display:"flex", gap:6 }}>
                                  {[1,2,3,4].map(t=>(
                                    <button key={t} onClick={()=>setGForm(f=>({...f,tenor:t}))}
                                      style={{ flex:1, padding:"8px", borderRadius:8, fontWeight:700, fontSize:".85rem", cursor:"pointer", border: gForm.tenor===t?"1px solid #60a5fa":"1px solid rgba(255,255,255,0.1)", background: gForm.tenor===t?"rgba(96,165,250,0.15)":"rgba(255,255,255,0.04)", color: gForm.tenor===t?"#60a5fa":"rgba(255,255,255,0.5)" }}>{t}</button>
                                  ))}
                                </div>
                              </div>
                              {pinRp > 0 && (
                                <div style={{ background:"rgba(96,165,250,0.07)", border:"1px solid rgba(96,165,250,0.2)", borderRadius:9, padding:"10px 12px", fontSize:".8rem" }}>
                                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                                    <span style={{ color:"rgba(255,255,255,0.5)" }}>Dana cair</span>
                                    <strong style={{ color:"#fff" }}>{fmt(pinRp)}</strong>
                                  </div>
                                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                                    <span style={{ color:"rgba(255,255,255,0.5)" }}>Angsuran/bln ({fmt(pinRp)} × (1+{gadaiParams.persenAnggota}%) / {gForm.tenor})</span>
                                    <strong style={{ color:"#60a5fa" }}>{fmt(angs)}</strong>
                                  </div>
                                </div>
                              )}
                              <div style={{ display:"flex", gap:8 }}>
                                <button onClick={()=>setGForm(f=>({...f,open:false}))} style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px", color:"rgba(255,255,255,0.6)", cursor:"pointer", fontSize:".82rem" }}>Batal</button>
                                <button onClick={()=>submitGadai(detail, totalSim)} disabled={gForm.saving} style={{ flex:1, background:"linear-gradient(135deg,#60a5fa,#93c5fd)", border:"none", borderRadius:8, padding:"9px", color:"#0a0a0a", fontWeight:700, cursor:gForm.saving?"not-allowed":"pointer", fontSize:".82rem", opacity:gForm.saving?.7:1 }}>{gForm.saving?"Memproses...":"Buat Gadai"}</button>
                              </div>
                            </div>
                            );
                          })()}
                        </div>
                      )
                    )}
                    {detailLoading ? (
                      <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".85rem", marginBottom:18 }}>Memuat...</p>
                    ) : detail.simpanan.length===0 ? (
                      <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".85rem", marginBottom:18 }}>Belum ada simpanan.</p>
                    ) : (
                      <div style={{ display:"flex", flexDirection:"column", gap:0, marginBottom:18, border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, overflow:"hidden" }}>
                        {/* Header */}
                        <div style={{ display:"flex", background:"rgba(255,255,255,0.04)", borderBottom:"1px solid rgba(255,255,255,0.07)", padding:"6px 12px" }}>
                          <span style={{ color:"rgba(255,255,255,0.3)", fontSize:".68rem", fontWeight:700, textTransform:"uppercase", width:70, flexShrink:0 }}>Jenis</span>
                          <span style={{ color:"rgba(255,255,255,0.3)", fontSize:".68rem", fontWeight:700, textTransform:"uppercase", width:110, flexShrink:0 }}>Nominal</span>
                          <span style={{ color:"rgba(255,255,255,0.3)", fontSize:".68rem", fontWeight:700, textTransform:"uppercase", width:90, flexShrink:0 }}>Tgl Transaksi</span>
                          <span style={{ color:"rgba(255,255,255,0.3)", fontSize:".68rem", fontWeight:700, textTransform:"uppercase", flex:1 }}>Keterangan</span>
                        </div>
                        {detail.simpanan.map((s:any, i:number)=>{
                          const simLabel: Record<string,string> = { pokok:"Pokok", wajib:"Wajib", sukarela:"Sukarela" };
                          const simColor: Record<string,string> = { pokok:"#D4AF37", wajib:"#60a5fa", sukarela:"#34d399" };
                          return (
                            <div key={s.id} style={{ display:"flex", alignItems:"center", padding:"8px 12px", borderBottom: i < detail.simpanan.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none", background:"rgba(255,255,255,0.02)" }}>
                              <span style={{ color:simColor[s.type]||"rgba(255,255,255,0.6)", fontSize:".8rem", fontWeight:700, width:70, flexShrink:0 }}>{simLabel[s.type]||s.type}</span>
                              <span style={{ color:"#fff", fontSize:".82rem", fontWeight:700, width:110, flexShrink:0 }}>{fmt(s.amount)}</span>
                              <span style={{ color:"rgba(255,255,255,0.5)", fontSize:".78rem", width:90, flexShrink:0 }}>{fmtDate(s.transaction_date||s.created_at)}</span>
                              <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem", flex:1 }}>{s.description||"-"}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Recent Transactions */}
              <h3 style={{ color:"rgba(255,255,255,0.6)", fontSize:".8rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", marginBottom:10 }}>5 Transaksi Terakhir</h3>
              {detailLoading ? (
                <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".85rem" }}>Memuat...</p>
              ) : detail.transactions.length===0 ? (
                <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".85rem" }}>Belum ada transaksi.</p>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:18 }}>
                  {detail.transactions.map((tx:any)=>{
                    const TX_LBL: Record<string,string> = { buy:"Beli Emas", buyback:"Buyback", cicilan:"Cicilan", tabungan:"Setor Simpanan", transfer:"Transfer", referral_bonus:"Bonus Referral" };
                    return (
                      <div key={tx.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.03)", borderRadius:9, padding:"9px 14px", gap:8 }}>
                        <span style={{ color:"rgba(255,255,255,0.7)", fontSize:".83rem", flex:1 }}>{TX_LBL[tx.type]||tx.type}</span>
                        <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".75rem" }}>{fmtDate(tx.transaction_date||tx.created_at)}</span>
                        <span style={{ color:"#D4AF37", fontWeight:600, fontSize:".83rem" }}>{fmt(tx.amount)}</span>
                        <span style={{ color:STATUS_COLOR[tx.status]||"#fff", fontSize:".75rem", background:STATUS_BG[tx.status]||"rgba(255,255,255,0.06)", borderRadius:5, padding:"2px 8px" }}>{tx.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Savings */}
              {detail.savings.length>0 && (
                <>
                  <h3 style={{ color:"rgba(255,255,255,0.6)", fontSize:".8rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", marginBottom:10 }}>Simpanan</h3>
                  <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:18 }}>
                    {detail.savings.map((s:any)=>(
                      <div key={s.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.03)", borderRadius:9, padding:"9px 14px" }}>
                        <span style={{ color:"rgba(255,255,255,0.7)", fontSize:".83rem" }}>{s.name}</span>
                        <span style={{ color:"#D4AF37", fontSize:".83rem" }}>{s.current_gram}/{s.target_gram} gr</span>
                        <span style={{ color:STATUS_COLOR[s.status]||"#fff", fontSize:".75rem" }}>{s.status}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {/* Beli / Cicilan Emas */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", margin:"18px 0 10px" }}>
                <h3 style={{ color:"rgba(255,255,255,0.6)", fontSize:".8rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", margin:0 }}>Beli / Cicilan Emas</h3>
                {!cForm.open && (
                  <button onClick={()=>setCForm({ ...C_EMPTY, open:true })}
                    style={{ background:"rgba(167,139,250,0.12)", border:"1px solid rgba(167,139,250,0.3)", borderRadius:8, padding:"5px 12px", color:"#a78bfa", cursor:"pointer", fontSize:".76rem", fontWeight:600 }}>
                    + Buat
                  </button>
                )}
              </div>
              {cForm.open && (() => { const cc = cicilanCalc(); return (
                <div style={{ background:"rgba(167,139,250,0.05)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:10, padding:14, marginBottom:12, display:"flex", flexDirection:"column", gap:10 }}>
                  {cForm.err && <p style={{ color:"#f87171", fontSize:".78rem", margin:0 }}>{cForm.err}</p>}
                  <div style={{ display:"grid", gridTemplateColumns: cForm.type==="cicilan" ? "1fr 1fr 1fr" : "1fr 1fr", gap:8 }}>
                    <Select value={cForm.type} onChange={v=>setCForm(f=>({...f,type:v}))}
                      options={[{value:"buy",label:"Beli Emas"},{value:"cicilan",label:"Cicilan Emas"}]} placeholder="Tipe" />
                    <Select value={cForm.gram} onChange={v=>setCForm(f=>({...f,gram:v}))}
                      options={goldRows.map(r=>({ value:String(r.gram), label:`${r.gram % 1 === 0 ? r.gram : r.gram.toFixed(1)} gram` }))}
                      placeholder={goldRows.length ? "Pilih berat" : "Memuat..."} />
                    {cForm.type==="cicilan" && (
                      <Select value={cForm.tenor} onChange={v=>setCForm(f=>({...f,tenor:v}))}
                        options={CICILAN_TENORS.map(t=>({ value:String(t), label:`${t} bulan` }))} placeholder="Tenor" />
                    )}
                  </div>
                  {cc.row && (
                    <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:9, padding:"10px 14px", display:"flex", flexDirection:"column", gap:6 }}>
                      {[
                        { label:"Harga emas", value:fmt(cc.row.harga), color:"rgba(255,255,255,0.6)" },
                        ...(cForm.type==="cicilan" ? [
                          { label:`Total cicilan (${cc.tenor} bln)`, value:fmt(cc.total), color:"rgba(255,255,255,0.6)" },
                          { label:"DP (uang muka)", value:fmt(cc.dp), color:"#60a5fa" },
                          { label:"Angsuran / bln", value:fmt(cc.monthly), color:"#a78bfa" },
                        ] : [
                          { label:"Total bayar", value:fmt(cc.total), color:"#D4AF37" },
                        ]),
                      ].map(r=>(
                        <div key={r.label} style={{ display:"flex", justifyContent:"space-between" }}>
                          <span style={{ color:"rgba(255,255,255,0.45)", fontSize:".8rem" }}>{r.label}</span>
                          <span style={{ color:r.color, fontWeight:700, fontSize:".82rem" }}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>setCForm(f=>({...f,open:false}))} style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, padding:"9px", color:"rgba(255,255,255,0.6)", cursor:"pointer", fontSize:".82rem" }}>Batal</button>
                    <button onClick={()=>submitCicilan(detail)} disabled={cForm.saving || !cForm.gram} style={{ flex:1, background:"linear-gradient(135deg,#a78bfa,#c4b5fd)", border:"none", borderRadius:8, padding:"9px", color:"#0a0a0a", fontWeight:700, cursor:(cForm.saving||!cForm.gram)?"not-allowed":"pointer", fontSize:".82rem", opacity:(cForm.saving||!cForm.gram)?.7:1 }}>{cForm.saving?"Menyimpan...":(cForm.type==="buy"?"Catat Beli Emas":"Buat Cicilan")}</button>
                  </div>
                </div>
              ); })()}
              {detail.installments.length===0 ? (
                <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".83rem", marginBottom:8 }}>Belum ada cicilan.</p>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {detail.installments.map((ins:any)=>(
                    <div key={ins.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.03)", borderRadius:9, padding:"9px 14px" }}>
                      <span style={{ color:"rgba(255,255,255,0.7)", fontSize:".83rem" }}>{ins.product_name}</span>
                      <span style={{ color:"rgba(255,255,255,0.5)", fontSize:".83rem" }}>
                        {ins.paid_installments}/{ins.tenor} angsuran · sisa {fmt(Math.max(0,(ins.tenor-ins.paid_installments)*ins.monthly_amount))}
                      </span>
                      <span style={{ color:STATUS_COLOR[ins.status]||"#fff", fontSize:".75rem" }}>{ins.status}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Gadai */}
              {detail.gadai.length>0 && (
                <>
                  <h3 style={{ color:"rgba(255,255,255,0.6)", fontSize:".8rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", margin:"18px 0 10px" }}>Gadai</h3>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {detail.gadai.map((g:any)=>(
                      <div key={g.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.03)", borderRadius:9, padding:"9px 14px" }}>
                        <span style={{ color:"rgba(255,255,255,0.7)", fontSize:".83rem" }}>Pinjaman {fmt(g.dana_cair)}</span>
                        <span style={{ color:"rgba(255,255,255,0.5)", fontSize:".83rem" }}>sisa {fmt(g.sisa_tagihan)} · {g.tenor} bln</span>
                        <span style={{ color:"#60a5fa", fontSize:".75rem", textTransform:"capitalize" }}>{g.status}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              </div>{/* end padding wrapper */}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Register Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={()=>setShowForm(false)}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
            <motion.div onClick={e=>e.stopPropagation()}
              initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:.95 }}
              style={{ width:"min(460px,94vw)", background:"#111", border:"1px solid rgba(52,211,153,0.2)", borderRadius:20, padding:28, maxHeight:"90vh", overflowY:"auto" }}
            >
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22 }}>
                <h2 style={{ color:"#fff", fontWeight:700, fontSize:"1.1rem", margin:0 }}>Daftar Member Baru</h2>
                <button onClick={()=>setShowForm(false)}
                  style={{ background:"rgba(255,255,255,0.07)", border:"none", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.5)", cursor:"pointer" }}>
                  <X style={{ width:15, height:15 }} />
                </button>
              </div>
              <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {[
                  { key:"name",     label:"Nama Lengkap *",  placeholder:"Siti Rahayu",       type:"text" },
                  { key:"nik",      label:"ID Anggota",      placeholder:"Contoh: KIA202501013", type:"text" },
                  { key:"email",    label:"Email *",         placeholder:"member@gmail.com",   type:"email" },
                  { key:"password", label:"Password *",      placeholder:"Min. 8 karakter",    type:"password" },
                  { key:"phone",    label:"Nomor HP",        placeholder:"08123456789",        type:"text" },
                ].map(f=>(
                  <div key={f.key}>
                    <label style={{ color:"rgba(255,255,255,0.5)", fontSize:".8rem", display:"block", marginBottom:6 }}>{f.label}</label>
                    <input type={f.type} value={(form as any)[f.key]} onChange={e=>setForm(prev=>({...prev,[f.key]:e.target.value}))}
                      placeholder={f.placeholder} style={inputStyle} />
                  </div>
                ))}
                {error   && <p style={{ color:"#f87171", fontSize:".83rem", margin:0 }}>{error}</p>}
                {success && <p style={{ color:"#34d399", fontSize:".83rem", margin:0 }}>{success}</p>}
                <button type="submit" disabled={submitting}
                  style={{ background:"linear-gradient(135deg,#34d399,#10b981)", border:"none", borderRadius:12, padding:"12px", color:"#0a0a0a", fontWeight:700, fontSize:".95rem", cursor:submitting?"not-allowed":"pointer", opacity:submitting?.7:1, marginTop:4 }}>
                  {submitting ? "Mendaftarkan..." : "Daftar Member"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

