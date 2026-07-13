"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, Plus, Trash2, Pencil, X, Ticket,
  ToggleLeft, ToggleRight, Percent, Coins, RotateCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import RupiahInput from "@/components/ui/RupiahInput";
import { genVoucherCode, insertVoucherWithUniqueCode, fmtDiscount, type VoucherTarget, type DiscountType } from "@/lib/voucher";

const G = "#D4AF37"; const G2 = "#F5D060";

const field: React.CSSProperties = {
  width:"100%", background:"rgba(255,255,255,0.05)",
  border:"1px solid rgba(255,255,255,0.1)", borderRadius:10,
  padding:"11px 14px", color:"#fff", fontSize:".88rem",
  outline:"none", boxSizing:"border-box",
};
const lbl: React.CSSProperties = {
  color:"rgba(255,255,255,0.38)", fontSize:".7rem",
  fontWeight:700, letterSpacing:".06em", textTransform:"uppercase",
  display:"block", marginBottom:5,
};

const fmtDt = (s: string) =>
  new Date(s).toLocaleString("id-ID", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });

const EMPTY_FORM = { code: genVoucherCode(), target:"produk" as VoucherTarget, discount_type:"percent" as DiscountType, discount_value:"", description:"" };

export default function AdminVoucherPage() {
  const { user } = useAuthStore();
  const isMaster = user?.role === "master";

  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await (supabase.from("vouchers") as any).select("*").order("created_at", { ascending: false });
    setList(data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() { setEditId(null); setForm({ ...EMPTY_FORM, code: genVoucherCode() }); setErr(""); setModal(true); }
  function openEdit(v: any) {
    setEditId(v.id);
    setForm({ code:v.code, target:v.target, discount_type:v.discount_type, discount_value:String(v.discount_value), description:v.description ?? "" });
    setErr(""); setModal(true);
  }
  function closeModal() { setModal(false); setEditId(null); setErr(""); }

  async function save() {
    if (!form.discount_value || Number(form.discount_value) <= 0) { setErr("Nilai potongan wajib diisi."); return; }
    setSaving(true); setErr("");
    if (editId) {
      const { error } = await (supabase.from("vouchers") as any).update({
        target: form.target, discount_type: form.discount_type,
        discount_value: Number(form.discount_value), description: form.description || null,
        updated_at: new Date().toISOString(),
      }).eq("id", editId);
      if (error) { setErr(error.message); setSaving(false); return; }
    } else {
      const { error } = await insertVoucherWithUniqueCode({
        code: form.code, target: form.target, discount_type: form.discount_type,
        discount_value: Number(form.discount_value), description: form.description || null,
        created_by: user?.id || null,
      });
      if (error) { setErr(error); setSaving(false); return; }
    }
    closeModal(); load(); setSaving(false);
  }
  async function toggle(v: any) { await (supabase.from("vouchers") as any).update({ is_active: !v.is_active }).eq("id", v.id); load(); }
  async function remove(id: string) { if (!confirm("Hapus voucher ini?")) return; await (supabase.from("vouchers") as any).delete().eq("id", id); load(); }

  const totalVoucher = list.length;
  const aktifVoucher = list.filter(v => v.is_active).length;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:900 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:800, margin:0, letterSpacing:"-.02em" }}>Voucher</h1>
          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".82rem", margin:"3px 0 0" }}>Kelola voucher potongan harga produk & angsuran</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={load} style={{ width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:"rgba(255,255,255,0.4)", cursor:"pointer" }}>
            <RefreshCw style={{ width:14, height:14 }} />
          </button>
          <button onClick={openNew} style={{ display:"flex", alignItems:"center", gap:7, padding:"0 18px", height:38, background:`linear-gradient(135deg,${G},${G2})`, border:"none", borderRadius:10, color:"#0a0a0a", cursor:"pointer", fontSize:".85rem", fontWeight:800 }}>
            <Plus style={{ width:14, height:14 }} /> Voucher Baru
          </button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
        {[
          { label:"Total Voucher", value:totalVoucher, color:"rgba(212,175,55,0.8)" },
          { label:"Aktif",         value:aktifVoucher, color:"#34d399" },
          { label:"Nonaktif",      value:totalVoucher-aktifVoucher, color:"rgba(255,255,255,0.25)" },
        ].map(s => (
          <div key={s.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"14px 16px" }}>
            <p style={{ color:s.color, fontSize:"1.25rem", fontWeight:800, margin:0 }}>{s.value}</p>
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem", margin:"3px 0 0" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>{[1,2,3].map(i=><div key={i} style={{ height:64, borderRadius:12, background:"rgba(255,255,255,0.03)" }} />)}</div>
      ) : list.length === 0 ? (
        <div style={{ textAlign:"center", padding:"56px 20px", background:"rgba(255,255,255,0.02)", border:"1px dashed rgba(255,255,255,0.08)", borderRadius:16 }}>
          <Ticket style={{ width:28, height:28, color:"rgba(212,175,55,0.25)", margin:"0 auto 10px" }} />
          <p style={{ color:"rgba(255,255,255,0.25)", margin:0, fontSize:".88rem" }}>Belum ada voucher</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {list.map((v, i) => (
            <motion.div key={v.id} layout initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*.04 }}
              style={{ display:"flex", alignItems:"center", gap:14, background:"rgba(255,255,255,0.03)", border:`1px solid ${v.is_active?"rgba(52,211,153,0.15)":"rgba(255,255,255,0.06)"}`, borderRadius:14, padding:"12px 16px" }}>
              <div style={{ width:38, height:38, borderRadius:10, background:"rgba(212,175,55,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Ticket style={{ width:16, height:16, color:G }} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5, flexWrap:"wrap" }}>
                  <p style={{ color:"#fff", fontWeight:800, fontSize:".9rem", margin:0, letterSpacing:".03em" }}>{v.code}</p>
                  <span style={{ fontSize:".66rem", fontWeight:700, borderRadius:20, padding:"2px 8px", background:v.is_active?"rgba(52,211,153,0.12)":"rgba(255,255,255,0.05)", color:v.is_active?"#34d399":"rgba(255,255,255,0.25)", border:`1px solid ${v.is_active?"rgba(52,211,153,0.25)":"rgba(255,255,255,0.08)"}` }}>
                    {v.is_active?"AKTIF":"NONAKTIF"}
                  </span>
                  <span style={{ fontSize:".66rem", fontWeight:700, borderRadius:20, padding:"2px 8px", background:"rgba(167,139,250,0.1)", color:"#a78bfa", border:"1px solid rgba(167,139,250,0.25)" }}>
                    {v.target === "produk" ? "Produk" : "Angsuran"}
                  </span>
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:".72rem", color:"#34d399", background:"rgba(52,211,153,0.08)", borderRadius:5, padding:"2px 8px", fontWeight:600 }}>
                    {v.discount_type==="percent" ? <Percent style={{ width:9, height:9 }} /> : <Coins style={{ width:9, height:9 }} />}
                    Potongan {fmtDiscount(v.discount_type, v.discount_value)}
                  </span>
                  {v.description && <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".76rem" }}>{v.description}</span>}
                </div>
                <p style={{ color:"rgba(255,255,255,0.25)", fontSize:".7rem", margin:"5px 0 0" }}>Dibuat {fmtDt(v.created_at)}</p>
              </div>
              <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                <button onClick={() => openEdit(v)} style={{ width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(212,175,55,0.07)", border:"1px solid rgba(212,175,55,0.18)", borderRadius:8, color:G, cursor:"pointer" }}>
                  <Pencil style={{ width:13, height:13 }} />
                </button>
                <button onClick={() => toggle(v)} style={{ width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", background:v.is_active?"rgba(52,211,153,0.07)":"rgba(255,255,255,0.04)", border:`1px solid ${v.is_active?"rgba(52,211,153,0.25)":"rgba(255,255,255,0.1)"}`, borderRadius:8, color:v.is_active?"#34d399":"rgba(255,255,255,0.3)", cursor:"pointer" }}>
                  {v.is_active?<ToggleRight style={{ width:14, height:14 }} />:<ToggleLeft style={{ width:14, height:14 }} />}
                </button>
                {isMaster && (
                  <button onClick={() => remove(v.id)} style={{ width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(248,113,113,0.06)", border:"1px solid rgba(248,113,113,0.15)", borderRadius:8, color:"#f87171", cursor:"pointer" }}>
                    <Trash2 style={{ width:13, height:13 }} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* MODAL: TAMBAH/EDIT VOUCHER */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", backdropFilter:"blur(4px)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
            onClick={e => { if (e.target===e.currentTarget) closeModal(); }}>
            <motion.div initial={{ opacity:0, scale:.95, y:16 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:.95, y:16 }} transition={{ type:"spring", stiffness:300, damping:28 }}
              style={{ width:"100%", maxWidth:480, maxHeight:"88vh", overflowY:"auto", background:"#111", border:`1px solid ${editId?"rgba(212,175,55,0.4)":"rgba(255,255,255,0.1)"}`, borderRadius:20, boxShadow:"0 24px 80px rgba(0,0,0,0.6)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 22px 14px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:9, background:editId?"rgba(212,175,55,0.12)":"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {editId?<Pencil style={{ width:14, height:14, color:G }} />:<Plus style={{ width:14, height:14, color:"rgba(255,255,255,0.5)" }} />}
                  </div>
                  <span style={{ color:"#fff", fontWeight:700, fontSize:".95rem" }}>{editId?"Edit Voucher":"Voucher Baru"}</span>
                </div>
                <button onClick={closeModal} style={{ width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"rgba(255,255,255,0.4)", cursor:"pointer" }}><X style={{ width:14, height:14 }} /></button>
              </div>
              <div style={{ padding:"20px 22px", display:"flex", flexDirection:"column", gap:16 }}>
                {err && <div style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:10, padding:"10px 14px", color:"#f87171", fontSize:".82rem" }}>{err}</div>}

                <div>
                  <label style={lbl}>Kode Voucher</label>
                  <div style={{ display:"flex", gap:8 }}>
                    <input value={form.code} readOnly disabled style={{ ...field, opacity:.6, letterSpacing:".05em", fontWeight:700 }} />
                    {!editId && (
                      <button onClick={() => setForm(p=>({...p,code:genVoucherCode()}))}
                        style={{ width:42, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:10, color:G, cursor:"pointer", flexShrink:0 }} title="Buat kode baru">
                        <RotateCw style={{ width:14, height:14 }} />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label style={lbl}>Target Potongan</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {([["produk","Harga Produk"],["angsuran","Angsuran (Cicilan)"]] as const).map(([val,label]) => (
                      <button key={val} onClick={() => setForm(p=>({...p,target:val}))}
                        style={{ padding:11, borderRadius:10, cursor:"pointer", fontSize:".84rem", fontWeight:600, transition:"all .15s", border:`1px solid ${form.target===val?"rgba(212,175,55,0.45)":"rgba(255,255,255,0.08)"}`, background:form.target===val?"rgba(212,175,55,0.1)":"rgba(255,255,255,0.03)", color:form.target===val?G:"rgba(255,255,255,0.35)" }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={lbl}>Tipe Potongan</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {([["percent","Persen (%)"],["fixed","Nominal (Rp)"]] as const).map(([val,label]) => (
                      <button key={val} onClick={() => setForm(p=>({...p,discount_type:val}))}
                        style={{ padding:11, borderRadius:10, cursor:"pointer", fontSize:".84rem", fontWeight:600, transition:"all .15s", border:`1px solid ${form.discount_type===val?"rgba(212,175,55,0.45)":"rgba(255,255,255,0.08)"}`, background:form.discount_type===val?"rgba(212,175,55,0.1)":"rgba(255,255,255,0.03)", color:form.discount_type===val?G:"rgba(255,255,255,0.35)" }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={lbl}>Nilai Potongan {form.discount_type==="percent" ? "(%)" : "(Rp)"}</label>
                  {form.discount_type === "percent" ? (
                    <input type="number" min={0} max={100} value={form.discount_value} onChange={e=>setForm(p=>({...p,discount_value:e.target.value}))} style={field} placeholder="10" />
                  ) : (
                    <RupiahInput value={form.discount_value} onValueChange={v=>setForm(p=>({...p,discount_value:v}))} style={field} placeholder="50.000" />
                  )}
                </div>

                <div>
                  <label style={lbl}>Deskripsi (opsional)</label>
                  <textarea rows={2} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} style={{ ...field, resize:"vertical", fontFamily:"inherit" }} placeholder="Keterangan voucher…" />
                </div>

                <div style={{ display:"flex", gap:8, paddingTop:4 }}>
                  <button onClick={save} disabled={saving||!form.discount_value}
                    style={{ flex:1, padding:12, borderRadius:11, background:`linear-gradient(135deg,${G},${G2})`, border:"none", color:"#0a0a0a", fontWeight:800, fontSize:".88rem", cursor:saving||!form.discount_value?"not-allowed":"pointer", opacity:saving?.6:1 }}>
                    {saving?"Menyimpan…":editId?"Update Voucher":"Simpan Voucher"}
                  </button>
                  <button onClick={closeModal} style={{ padding:"12px 18px", borderRadius:11, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", color:"rgba(255,255,255,0.35)", cursor:"pointer", fontSize:".85rem" }}>Batal</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
