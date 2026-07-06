"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RefreshCw, Plus, Trash2, ImageOff,
  Pencil, X, Tag, Clock, Coins, Sparkles, CheckCircle2,
  ToggleLeft, ToggleRight, Zap, ShoppingCart, Package,
  Upload, ChevronDown, Printer, CheckCheck, XCircle,
  AlertCircle, FileText,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import RupiahInput from "@/components/ui/RupiahInput";
import { useSiteSettings } from "@/store/useSettingsStore";
import { gdriveImage } from "@/lib/utils";

/* ── formatting ── */
const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const fmtExp = (s: string | null) =>
  s ? new Date(s).toLocaleString("id-ID", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "Tidak ada";
const fmtDt = (s: string) =>
  new Date(s).toLocaleString("id-ID", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });

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

const EMPTY_PROD = { title:"", description:"", image_url:"", gram_weight:"", price:"", expired_at:"", category:"emas", stok:"" };
const PAY_METHODS = ["BSI", "Cash", "Kartu Kredit", "Kartu Debit"];

/* ── upload bukti bayar ke Google Drive ── */
async function uploadProof(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload/gdrive", { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error || "Upload ke Google Drive gagal");
  return json.url as string;
}

/* ── invoice printer ── */
function printInvoice(order: any, payment: any, siteName: string) {
  const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items || "[]");
  const kembalian = Math.max(0, payment.terbayar - payment.nominal);
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8">
<title>Invoice #${order.id.slice(-8).toUpperCase()}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,sans-serif;font-size:13px;color:#111;padding:24px;max-width:640px;margin:0 auto}
  .logo{font-size:1.3rem;font-weight:900;color:#B8860B;text-align:center;margin-bottom:4px}
  .sub{text-align:center;color:#555;font-size:.8rem;margin-bottom:20px}
  h2{font-size:1rem;font-weight:700;margin-bottom:12px;border-bottom:2px solid #B8860B;padding-bottom:6px}
  table{width:100%;border-collapse:collapse;margin-bottom:16px}
  th{background:#B8860B;color:#fff;padding:8px 10px;text-align:left;font-size:.8rem}
  td{padding:8px 10px;border-bottom:1px solid #eee;font-size:.82rem}
  .right{text-align:right}
  .total-row td{font-weight:700;border-top:2px solid #B8860B;border-bottom:none}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}
  .info-item label{color:#777;font-size:.75rem;display:block;margin-bottom:2px}
  .info-item span{font-weight:600}
  .footer{text-align:center;color:#888;font-size:.75rem;margin-top:24px;border-top:1px solid #eee;padding-top:12px}
  @media print{body{padding:0}}
</style></head><body>
<div class="logo">${siteName}</div>
<div class="sub">INVOICE PEMBELIAN PRODUK</div>
<div class="info-grid">
  <div class="info-item"><label>No. Invoice</label><span>#${order.id.slice(-8).toUpperCase()}</span></div>
  <div class="info-item"><label>Tanggal</label><span>${fmtDt(payment.created_at || order.created_at)}</span></div>
  <div class="info-item"><label>Pelanggan</label><span>${order.customer_name}</span></div>
  <div class="info-item"><label>Telepon</label><span>${order.customer_phone || "-"}</span></div>
</div>
<h2>Detail Pesanan</h2>
<table>
  <thead><tr><th>Produk</th><th>Qty</th><th class="right">Harga Satuan</th><th class="right">Subtotal</th></tr></thead>
  <tbody>
    ${items.map((it: any) => `
    <tr>
      <td>${it.title}${it.gram_weight ? ` (${it.gram_weight}gr)` : ""}</td>
      <td>${it.quantity}</td>
      <td class="right">${fmt(it.price)}</td>
      <td class="right">${fmt(it.price * it.quantity)}</td>
    </tr>`).join("")}
    <tr class="total-row"><td colspan="3">Total</td><td class="right">${fmt(order.total_amount)}</td></tr>
  </tbody>
</table>
<h2>Pembayaran</h2>
<div class="info-grid">
  <div class="info-item"><label>Metode</label><span>${payment.payment_method}</span></div>
  <div class="info-item"><label>Nominal Tagihan</label><span>${fmt(payment.nominal)}</span></div>
  <div class="info-item"><label>Terbayar</label><span>${fmt(payment.terbayar)}</span></div>
  <div class="info-item"><label>Kembalian</label><span>${fmt(kembalian)}</span></div>
</div>
<div class="footer">Terima kasih atas kepercayaan Anda • ${siteName}</div>
<script>window.onload=()=>{window.print();}</script>
</body></html>`);
  w.document.close();
}

/* ═══════════════════════════════════════════════════════════ */
export default function AdminProdukPage() {
  const { user } = useAuthStore();
  const isMaster = user?.role === "master";
  const settings = useSiteSettings();

  const [tab, setTab] = useState<"produk" | "pesanan">("produk");

  /* ── produk state ── */
  const [produk, setProduk] = useState<any[]>([]);
  const [form, setForm] = useState(EMPTY_PROD);
  const [editId, setEditId] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [loadingProduk, setLoadingProduk] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  /* ── pesanan state ── */
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [approveOrder, setApproveOrder] = useState<any | null>(null);
  const [payForm, setPayForm] = useState({ customer_name:"", nominal:"", terbayar:"", payment_method:"BSI", notes:"", proof_url:"" });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState("");
  const [savingPay, setSavingPay] = useState(false);
  const [payErr, setPayErr] = useState("");
  const proofRef = useRef<HTMLInputElement>(null);
  const [invoiceModal, setInvoiceModal] = useState<{ order: any; payment: any } | null>(null);
  const [orderFilter, setOrderFilter] = useState<"all"|"pending"|"approved"|"rejected">("all");

  /* ── loaders ── */
  async function loadProduk() {
    setLoadingProduk(true);
    const { data } = await (supabase.from("promos") as any)
      .select("*").order("created_at", { ascending: false });
    setProduk(data || []);
    setLoadingProduk(false);
  }
  async function loadOrders() {
    setLoadingOrders(true);
    const { data } = await (supabase.from("product_orders") as any)
      .select("*, product_payments(*)").order("created_at", { ascending: false });
    setOrders(data || []);
    setLoadingOrders(false);
  }
  useEffect(() => { loadProduk(); loadOrders(); }, []);

  /* ── produk CRUD ── */
  function openNew() { setEditId(null); setForm(EMPTY_PROD); setErr(""); setModal(true); }
  function openEdit(p: any) {
    setEditId(p.id);
    setForm({ title:p.title??"", description:p.description??"", image_url:p.image_url??"", gram_weight:p.gram_weight!=null?String(p.gram_weight):"", price:p.price!=null?String(p.price):"", expired_at:p.expired_at?new Date(p.expired_at).toISOString().slice(0,16):"", category:p.gram_weight!=null?"emas":"lain-lain", stok:p.stok!=null?String(p.stok):"" });
    setErr(""); setModal(true);
  }
  function closeModal() { setModal(false); setEditId(null); setForm(EMPTY_PROD); setErr(""); }

  async function save() {
    if (!form.title) { setErr("Nama produk wajib diisi."); return; }
    setSaving(true); setErr("");
    const payload = {
      title: form.title, description: form.description || null,
      image_url: form.image_url || null,
      gram_weight: form.category === "emas" && form.gram_weight ? Number(form.gram_weight) : null,
      price: form.price ? Number(form.price) : null,
      expired_at: form.expired_at ? new Date(form.expired_at).toISOString() : null,
      stok: form.stok !== "" ? Number(form.stok) : null,
    };
    const t = supabase.from("promos") as any;
    const { error: e } = editId ? await t.update(payload).eq("id", editId) : await t.insert({ ...payload, discount_percent:0, is_active:true });
    if (e) { setErr(e.message); setSaving(false); return; }
    closeModal(); loadProduk(); setSaving(false);
  }
  async function toggle(p: any) { await (supabase.from("promos") as any).update({ is_active:!p.is_active }).eq("id", p.id); loadProduk(); }
  async function remove(id: string) { if (!confirm("Hapus produk ini?")) return; await (supabase.from("promos") as any).delete().eq("id", id); loadProduk(); }

  /* ── pesanan handlers ── */
  function openApprove(o: any) {
    setApproveOrder(o);
    const items = Array.isArray(o.items) ? o.items : JSON.parse(o.items || "[]");
    const total = items.reduce((s: number, it: any) => s + it.price * it.quantity, 0);
    setPayForm({ customer_name:o.customer_name, nominal:String(total), terbayar:String(total), payment_method:"BSI", notes:"", proof_url:"" });
    setProofFile(null); setProofPreview(""); setPayErr("");
  }
  function closeApprove() { setApproveOrder(null); setPayForm({ customer_name:"", nominal:"", terbayar:"", payment_method:"BSI", notes:"", proof_url:"" }); setProofFile(null); setProofPreview(""); setPayErr(""); }

  function handleProofPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setProofFile(f); setProofPreview(URL.createObjectURL(f));
  }

  async function doApprove() {
    if (!approveOrder) return;
    if (!payForm.nominal || !payForm.terbayar) { setPayErr("Nominal dan terbayar wajib diisi."); return; }
    setSavingPay(true); setPayErr("");
    let proofUrl = payForm.proof_url;
    if (proofFile) {
      try { proofUrl = await uploadProof(proofFile); } catch (e: any) { setPayErr(e.message); setSavingPay(false); return; }
    }
    // insert payment
    const { error: pe } = await (supabase.from("product_payments") as any).insert({
      order_id: approveOrder.id,
      customer_name: payForm.customer_name,
      nominal: Number(payForm.nominal),
      terbayar: Number(payForm.terbayar),
      payment_method: payForm.payment_method,
      proof_url: proofUrl || null,
      notes: payForm.notes || null,
      verified_by: user?.id,
    });
    if (pe) { setPayErr(pe.message); setSavingPay(false); return; }
    // update order status
    await (supabase.from("product_orders") as any).update({ status:"approved", updated_at:new Date().toISOString() }).eq("id", approveOrder.id);
    // deduct stok
    const items = Array.isArray(approveOrder.items) ? approveOrder.items : JSON.parse(approveOrder.items || "[]");
    for (const it of items) {
      if (!it.product_id) continue;
      const { data: prod } = await (supabase.from("promos") as any).select("stok").eq("id", it.product_id).single();
      if (prod?.stok != null) {
        const newStok = Math.max(0, prod.stok - it.quantity);
        await (supabase.from("promos") as any).update({ stok: newStok }).eq("id", it.product_id);
      }
    }
    const payment = { order_id:approveOrder.id, customer_name:payForm.customer_name, nominal:Number(payForm.nominal), terbayar:Number(payForm.terbayar), payment_method:payForm.payment_method, proof_url:proofUrl||null, created_at:new Date().toISOString() };
    const orderCopy = { ...approveOrder };
    closeApprove();
    loadOrders(); loadProduk();
    setSavingPay(false);
    setInvoiceModal({ order:orderCopy, payment });
  }

  async function doReject(o: any) {
    if (!confirm("Tolak pesanan ini?")) return;
    await (supabase.from("product_orders") as any).update({ status:"rejected", updated_at:new Date().toISOString() }).eq("id", o.id);
    loadOrders();
  }

  async function showInvoice(o: any) {
    const pays = o.product_payments || [];
    const pay = pays[pays.length - 1];
    if (!pay) { alert("Belum ada data pembayaran."); return; }
    setInvoiceModal({ order:o, payment:pay });
  }

  const filteredOrders = orderFilter === "all" ? orders : orders.filter(o => o.status === orderFilter);
  const totalProduk = produk.length;
  const aktifProduk = produk.filter(p => p.is_active).length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const approvedOrders = orders.filter(o => o.status === "approved").length;

  /* ─────────────────────────────────── render ─────────────────────────────────── */
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:1060 }}>

      {/* PAGE HEADER */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:800, margin:0, letterSpacing:"-.02em" }}>Kelola Produk</h1>
          <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".82rem", margin:"3px 0 0" }}>Produk & pesanan yang tampil di halaman utama</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => { loadProduk(); loadOrders(); }} style={{ width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:"rgba(255,255,255,0.4)", cursor:"pointer" }}>
            <RefreshCw style={{ width:14, height:14 }} />
          </button>
          {tab === "produk" && (
            <button onClick={openNew} style={{ display:"flex", alignItems:"center", gap:7, padding:"0 18px", height:38, background:`linear-gradient(135deg,${G},${G2})`, border:"none", borderRadius:10, color:"#0a0a0a", cursor:"pointer", fontSize:".85rem", fontWeight:800 }}>
              <Plus style={{ width:14, height:14 }} /> Tambah Produk
            </button>
          )}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:4 }}>
        {([["produk","Kelola Produk",<Package style={{ width:14, height:14 }} />],["pesanan","Pembelian",<ShoppingCart style={{ width:14, height:14 }} />]] as const).map(([key, lbl2, icon]) => (
          <button key={key} onClick={() => setTab(key as any)}
            style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"9px 16px", borderRadius:9, border:"none", cursor:"pointer", fontSize:".85rem", fontWeight:600, transition:"all .15s", background: tab===key ? "rgba(212,175,55,0.12)" : "transparent", color: tab===key ? G : "rgba(255,255,255,0.4)", borderBottom: tab===key ? `2px solid ${G}` : "2px solid transparent" }}>
            {icon}{lbl2}
            {key==="pesanan" && pendingOrders > 0 && (
              <span style={{ background:"#f87171", color:"#fff", borderRadius:20, padding:"1px 7px", fontSize:".68rem", fontWeight:800 }}>{pendingOrders}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══ TAB: PRODUK ═══ */}
      {tab === "produk" && (
        <>
          {/* stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
            {[
              { label:"Total Produk", value:totalProduk, icon:<Sparkles style={{ width:15, height:15 }} />, color:"rgba(212,175,55,0.8)" },
              { label:"Aktif",        value:aktifProduk, icon:<CheckCircle2 style={{ width:15, height:15 }} />, color:"#34d399" },
              { label:"Nonaktif",     value:totalProduk-aktifProduk, icon:<ToggleLeft style={{ width:15, height:15 }} />, color:"rgba(255,255,255,0.25)" },
            ].map(s => (
              <div key={s.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:34, height:34, borderRadius:9, background:"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", color:s.color, flexShrink:0 }}>{s.icon}</div>
                <div>
                  <p style={{ color:s.color, fontSize:"1.25rem", fontWeight:800, margin:0, lineHeight:1 }}>{s.value}</p>
                  <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem", margin:"3px 0 0" }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* list */}
          {loadingProduk ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>{[1,2,3].map(i=><div key={i} style={{ height:72, borderRadius:12, background:"rgba(255,255,255,0.03)" }} />)}</div>
          ) : produk.length === 0 ? (
            <div style={{ textAlign:"center", padding:"56px 20px", background:"rgba(255,255,255,0.02)", border:"1px dashed rgba(255,255,255,0.08)", borderRadius:16 }}>
              <Zap style={{ width:28, height:28, color:"rgba(212,175,55,0.25)", margin:"0 auto 10px" }} />
              <p style={{ color:"rgba(255,255,255,0.25)", margin:0, fontSize:".88rem" }}>Belum ada produk</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {produk.map((p, i) => (
                <motion.div key={p.id} layout initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*.04 }}
                  style={{ display:"flex", alignItems:"center", gap:14, background:"rgba(255,255,255,0.03)", border:`1px solid ${p.is_active?"rgba(52,211,153,0.15)":"rgba(255,255,255,0.06)"}`, borderRadius:14, padding:"12px 16px" }}>
                  <div style={{ width:54, height:54, borderRadius:10, overflow:"hidden", flexShrink:0, background:"rgba(212,175,55,0.06)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {p.image_url
                      ? <img src={gdriveImage(p.image_url)} alt={p.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}} />
                      : <ImageOff style={{ width:18, height:18, color:"rgba(255,255,255,0.15)" }} />}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                      <p style={{ color:"#fff", fontWeight:700, fontSize:".9rem", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.title}</p>
                      <span style={{ flexShrink:0, fontSize:".66rem", fontWeight:700, borderRadius:20, padding:"2px 8px", background:p.is_active?"rgba(52,211,153,0.12)":"rgba(255,255,255,0.05)", color:p.is_active?"#34d399":"rgba(255,255,255,0.25)", border:`1px solid ${p.is_active?"rgba(52,211,153,0.25)":"rgba(255,255,255,0.08)"}` }}>
                        {p.is_active?"AKTIF":"NONAKTIF"}
                      </span>
                    </div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {p.gram_weight!=null && <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:".72rem", color:G, background:"rgba(212,175,55,0.08)", borderRadius:5, padding:"2px 8px", fontWeight:600 }}><Coins style={{ width:9, height:9 }} />{p.gram_weight}gr</span>}
                      {p.price!=null && <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:".72rem", color:"#34d399", background:"rgba(52,211,153,0.08)", borderRadius:5, padding:"2px 8px", fontWeight:600 }}><Tag style={{ width:9, height:9 }} />{fmt(p.price)}</span>}
                      {p.stok!=null && <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:".72rem", color:"#60a5fa", background:"rgba(96,165,250,0.08)", borderRadius:5, padding:"2px 8px", fontWeight:600 }}><Package style={{ width:9, height:9 }} />Stok: {p.stok}</span>}
                      <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:".7rem", color:"rgba(255,255,255,0.25)", padding:"2px 0" }}><Clock style={{ width:9, height:9 }} />{fmtExp(p.expired_at)}</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    <button onClick={() => openEdit(p)} style={{ width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(212,175,55,0.07)", border:"1px solid rgba(212,175,55,0.18)", borderRadius:8, color:G, cursor:"pointer" }}>
                      <Pencil style={{ width:13, height:13 }} />
                    </button>
                    <button onClick={() => toggle(p)} style={{ width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", background:p.is_active?"rgba(52,211,153,0.07)":"rgba(255,255,255,0.04)", border:`1px solid ${p.is_active?"rgba(52,211,153,0.25)":"rgba(255,255,255,0.1)"}`, borderRadius:8, color:p.is_active?"#34d399":"rgba(255,255,255,0.3)", cursor:"pointer" }}>
                      {p.is_active?<ToggleRight style={{ width:14, height:14 }} />:<ToggleLeft style={{ width:14, height:14 }} />}
                    </button>
                    {isMaster && (
                      <button onClick={() => remove(p.id)} style={{ width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(248,113,113,0.06)", border:"1px solid rgba(248,113,113,0.15)", borderRadius:8, color:"#f87171", cursor:"pointer" }}>
                        <Trash2 style={{ width:13, height:13 }} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ═══ TAB: PESANAN ═══ */}
      {tab === "pesanan" && (
        <>
          {/* stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
            {[
              { label:"Total", value:orders.length, color:"rgba(255,255,255,0.6)" },
              { label:"Pending", value:pendingOrders, color:"#fbbf24" },
              { label:"Disetujui", value:approvedOrders, color:"#34d399" },
              { label:"Ditolak", value:orders.filter(o=>o.status==="rejected").length, color:"#f87171" },
            ].map(s => (
              <div key={s.label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"14px 16px" }}>
                <p style={{ color:s.color, fontSize:"1.25rem", fontWeight:800, margin:0 }}>{s.value}</p>
                <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem", margin:"3px 0 0" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* filter */}
          <div style={{ display:"flex", gap:6 }}>
            {(["all","pending","approved","rejected"] as const).map(f => (
              <button key={f} onClick={() => setOrderFilter(f)}
                style={{ padding:"6px 14px", borderRadius:8, border:`1px solid ${orderFilter===f?"rgba(212,175,55,0.4)":"rgba(255,255,255,0.1)"}`, background:orderFilter===f?"rgba(212,175,55,0.1)":"transparent", color:orderFilter===f?G:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:".8rem", fontWeight:600 }}>
                {f==="all"?"Semua":f==="pending"?"Pending":f==="approved"?"Disetujui":"Ditolak"}
              </button>
            ))}
          </div>

          {/* orders list */}
          {loadingOrders ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>{[1,2,3].map(i=><div key={i} style={{ height:88, borderRadius:12, background:"rgba(255,255,255,0.03)" }} />)}</div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ textAlign:"center", padding:"56px 20px", background:"rgba(255,255,255,0.02)", border:"1px dashed rgba(255,255,255,0.08)", borderRadius:16 }}>
              <ShoppingCart style={{ width:28, height:28, color:"rgba(212,175,55,0.25)", margin:"0 auto 10px" }} />
              <p style={{ color:"rgba(255,255,255,0.25)", margin:0, fontSize:".88rem" }}>Belum ada pesanan</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {filteredOrders.map((o, i) => {
                const items = Array.isArray(o.items) ? o.items : JSON.parse(o.items || "[]");
                const statusColor = o.status==="approved"?"#34d399":o.status==="rejected"?"#f87171":o.status==="pending"?"#fbbf24":"rgba(255,255,255,0.3)";
                return (
                  <motion.div key={o.id} layout initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.03 }}
                    style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${o.status==="pending"?"rgba(251,191,36,0.2)":o.status==="approved"?"rgba(52,211,153,0.15)":"rgba(255,255,255,0.07)"}`, borderRadius:14, padding:"14px 16px" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:8 }}>
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <p style={{ color:"#fff", fontWeight:700, fontSize:".9rem", margin:0 }}>{o.customer_name}</p>
                          {o.customer_phone && <span style={{ color:"rgba(255,255,255,0.35)", fontSize:".78rem" }}>{o.customer_phone}</span>}
                          <span style={{ fontSize:".67rem", fontWeight:700, borderRadius:20, padding:"2px 8px", background:`${statusColor}1a`, color:statusColor, border:`1px solid ${statusColor}44` }}>
                            {o.status.toUpperCase()}
                          </span>
                        </div>
                        <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem", margin:"3px 0 0" }}>{fmtDt(o.created_at)} · #{o.id.slice(-8).toUpperCase()}</p>
                      </div>
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <p style={{ color:G, fontWeight:800, fontSize:".95rem", margin:0 }}>{fmt(o.total_amount)}</p>
                        <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem", margin:"2px 0 0" }}>{items.length} produk</p>
                      </div>
                    </div>
                    {/* items preview */}
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                      {items.slice(0,3).map((it: any, j: number) => (
                        <span key={j} style={{ fontSize:".76rem", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:"3px 9px", color:"rgba(255,255,255,0.6)" }}>
                          {it.title}{it.gram_weight?` ${it.gram_weight}gr`:""} ×{it.quantity}
                        </span>
                      ))}
                      {items.length>3 && <span style={{ fontSize:".76rem", color:"rgba(255,255,255,0.3)", padding:"3px 0" }}>+{items.length-3} lainnya</span>}
                    </div>
                    {/* actions */}
                    <div style={{ display:"flex", gap:8 }}>
                      {o.status === "pending" && (
                        <>
                          <button onClick={() => openApprove(o)} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, background:"rgba(52,211,153,0.1)", border:"1px solid rgba(52,211,153,0.3)", color:"#34d399", cursor:"pointer", fontSize:".8rem", fontWeight:700 }}>
                            <CheckCheck style={{ width:13, height:13 }} /> Setujui
                          </button>
                          <button onClick={() => doReject(o)} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, background:"rgba(248,113,113,0.07)", border:"1px solid rgba(248,113,113,0.2)", color:"#f87171", cursor:"pointer", fontSize:".8rem", fontWeight:700 }}>
                            <XCircle style={{ width:13, height:13 }} /> Tolak
                          </button>
                        </>
                      )}
                      {o.status === "approved" && (
                        <button onClick={() => showInvoice(o)} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.3)", color:G, cursor:"pointer", fontSize:".8rem", fontWeight:700 }}>
                          <Printer style={{ width:13, height:13 }} /> Print Invoice
                        </button>
                      )}
                      {o.notes && <span style={{ color:"rgba(255,255,255,0.3)", fontSize:".78rem", padding:"7px 0", display:"flex", alignItems:"center", gap:4 }}><AlertCircle style={{ width:12, height:12 }} />{o.notes}</span>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══ MODAL: TAMBAH/EDIT PRODUK ═══ */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", backdropFilter:"blur(4px)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
            onClick={e => { if (e.target===e.currentTarget) closeModal(); }}>
            <motion.div initial={{ opacity:0, scale:.95, y:16 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:.95, y:16 }} transition={{ type:"spring", stiffness:300, damping:28 }}
              style={{ width:"100%", maxWidth:540, maxHeight:"88vh", overflowY:"auto", background:"#111", border:`1px solid ${editId?"rgba(212,175,55,0.4)":"rgba(255,255,255,0.1)"}`, borderRadius:20, boxShadow:"0 24px 80px rgba(0,0,0,0.6)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 22px 14px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:9, background:editId?"rgba(212,175,55,0.12)":"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {editId?<Pencil style={{ width:14, height:14, color:G }} />:<Plus style={{ width:14, height:14, color:"rgba(255,255,255,0.5)" }} />}
                  </div>
                  <span style={{ color:"#fff", fontWeight:700, fontSize:".95rem" }}>{editId?"Edit Produk":"Produk Baru"}</span>
                </div>
                <button onClick={closeModal} style={{ width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"rgba(255,255,255,0.4)", cursor:"pointer" }}><X style={{ width:14, height:14 }} /></button>
              </div>
              <div style={{ padding:"20px 22px", display:"flex", flexDirection:"column", gap:16 }}>
                {err && <div style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:10, padding:"10px 14px", color:"#f87171", fontSize:".82rem" }}>{err}</div>}

                {/* kategori */}
                <div>
                  <label style={lbl}>Kategori</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {(["emas","lain-lain"] as const).map(cat => (
                      <button key={cat} onClick={() => setForm(p=>({...p,category:cat,gram_weight:cat==="lain-lain"?"":p.gram_weight}))}
                        style={{ padding:11, borderRadius:10, cursor:"pointer", fontSize:".85rem", fontWeight:600, transition:"all .15s", border:`1px solid ${form.category===cat?"rgba(212,175,55,0.45)":"rgba(255,255,255,0.08)"}`, background:form.category===cat?"rgba(212,175,55,0.1)":"rgba(255,255,255,0.03)", color:form.category===cat?G:"rgba(255,255,255,0.35)" }}>
                        {cat==="emas"?"🪙  Emas":"🏷️  Lain-lain"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={lbl}>Nama Produk *</label>
                  <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} style={field} placeholder="cth: Emas 5gr Special Edition" />
                </div>

                <div style={{ display:"grid", gridTemplateColumns:form.category==="emas"?"1fr 1fr 1fr":"1fr 1fr", gap:12 }}>
                  <AnimatePresence>
                    {form.category==="emas" && (
                      <motion.div key="gram" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                        <label style={lbl}>Berat (gram)</label>
                        <input type="number" min={0} step={0.01} value={form.gram_weight} onChange={e=>setForm(p=>({...p,gram_weight:e.target.value}))} style={field} placeholder="5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div>
                    <label style={lbl}>Harga (Rp)</label>
                    <RupiahInput value={form.price} onValueChange={v=>setForm(p=>({...p,price:v}))} style={field} placeholder="8.000.000" />
                  </div>
                  <div>
                    <label style={lbl}>Stok</label>
                    <input type="number" min={0} value={form.stok} onChange={e=>setForm(p=>({...p,stok:e.target.value}))} style={field} placeholder="∞ kosongkan jika tidak terbatas" />
                  </div>
                </div>

                <div>
                  <label style={lbl}>Kadaluarsa</label>
                  <input type="datetime-local" value={form.expired_at} onChange={e=>setForm(p=>({...p,expired_at:e.target.value}))} style={field} />
                </div>

                {/* gambar gdrive */}
                <div>
                  <label style={lbl}>Link Gambar (Google Drive)</label>
                  <input value={form.image_url} onChange={e=>setForm(p=>({...p,image_url:e.target.value}))}
                    style={field} placeholder="https://drive.google.com/file/d/…/view" />
                  {form.image_url && (
                    <div style={{ marginTop:8, borderRadius:10, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)", maxHeight:140 }}>
                      <img src={gdriveImage(form.image_url)} alt="Preview" style={{ width:"100%", height:140, objectFit:"cover", display:"block" }}
                        onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}} />
                    </div>
                  )}
                </div>

                <div>
                  <label style={lbl}>Deskripsi (opsional)</label>
                  <textarea rows={2} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} style={{ ...field, resize:"vertical", fontFamily:"inherit" }} placeholder="Keterangan tambahan…" />
                </div>

                <div style={{ display:"flex", gap:8, paddingTop:4 }}>
                  <button onClick={save} disabled={saving||!form.title}
                    style={{ flex:1, padding:12, borderRadius:11, background:`linear-gradient(135deg,${G},${G2})`, border:"none", color:"#0a0a0a", fontWeight:800, fontSize:".88rem", cursor:saving||!form.title?"not-allowed":"pointer", opacity:saving?.6:1 }}>
                    {saving?"Menyimpan…":editId?"Update Produk":"Simpan Produk"}
                  </button>
                  <button onClick={closeModal} style={{ padding:"12px 18px", borderRadius:11, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", color:"rgba(255,255,255,0.35)", cursor:"pointer", fontSize:".85rem" }}>Batal</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ MODAL: APPROVE PESANAN ═══ */}
      <AnimatePresence>
        {approveOrder && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
            onClick={e => { if (e.target===e.currentTarget) closeApprove(); }}>
            <motion.div initial={{ opacity:0, scale:.95, y:16 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:.95, y:16 }} transition={{ type:"spring", stiffness:300, damping:28 }}
              style={{ width:"100%", maxWidth:560, maxHeight:"90vh", overflowY:"auto", background:"#111", border:"1px solid rgba(52,211,153,0.35)", borderRadius:20, boxShadow:"0 24px 80px rgba(0,0,0,0.7)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 22px 14px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:9, background:"rgba(52,211,153,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <CheckCheck style={{ width:14, height:14, color:"#34d399" }} />
                  </div>
                  <span style={{ color:"#fff", fontWeight:700, fontSize:".95rem" }}>Setujui Pesanan</span>
                </div>
                <button onClick={closeApprove} style={{ width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"rgba(255,255,255,0.4)", cursor:"pointer" }}><X style={{ width:14, height:14 }} /></button>
              </div>
              <div style={{ padding:"20px 22px", display:"flex", flexDirection:"column", gap:16 }}>
                {payErr && <div style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:10, padding:"10px 14px", color:"#f87171", fontSize:".82rem" }}>{payErr}</div>}

                {/* items summary */}
                <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"12px 14px" }}>
                  <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 8px" }}>Detail Pesanan</p>
                  {(Array.isArray(approveOrder.items)?approveOrder.items:JSON.parse(approveOrder.items||"[]")).map((it: any, j: number) => (
                    <div key={j} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ color:"rgba(255,255,255,0.7)", fontSize:".83rem" }}>{it.title}{it.gram_weight?` (${it.gram_weight}gr)`:""} ×{it.quantity}</span>
                      <span style={{ color:G, fontSize:".83rem", fontWeight:600 }}>{fmt(it.price*it.quantity)}</span>
                    </div>
                  ))}
                  <div style={{ display:"flex", justifyContent:"space-between", paddingTop:8 }}>
                    <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".83rem", fontWeight:700 }}>Total</span>
                    <span style={{ color:"#fff", fontSize:".9rem", fontWeight:800 }}>{fmt(approveOrder.total_amount)}</span>
                  </div>
                </div>

                <div>
                  <label style={lbl}>Nama Pemesan</label>
                  <input value={payForm.customer_name} onChange={e=>setPayForm(p=>({...p,customer_name:e.target.value}))} style={field} />
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div>
                    <label style={lbl}>Nominal Tagihan (Rp)</label>
                    <RupiahInput value={payForm.nominal} onValueChange={v=>setPayForm(p=>({...p,nominal:v}))} style={field} />
                  </div>
                  <div>
                    <label style={lbl}>Terbayar (Rp)</label>
                    <RupiahInput value={payForm.terbayar} onValueChange={v=>setPayForm(p=>({...p,terbayar:v}))} style={field} />
                  </div>
                </div>

                <div>
                  <label style={lbl}>Metode Pembayaran</label>
                  <div style={{ position:"relative" }}>
                    <select value={payForm.payment_method} onChange={e=>setPayForm(p=>({...p,payment_method:e.target.value}))}
                      style={{ ...field, appearance:"none", paddingRight:36 }}>
                      {PAY_METHODS.map(m => <option key={m} value={m} style={{ background:"#111" }}>{m}</option>)}
                    </select>
                    <ChevronDown style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", width:14, height:14, color:"rgba(255,255,255,0.3)", pointerEvents:"none" }} />
                  </div>
                </div>

                {/* bukti bayar upload */}
                <div>
                  <label style={lbl}>Upload Bukti Bayar (opsional)</label>
                  <input ref={proofRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleProofPick} />
                  {proofPreview ? (
                    <div style={{ position:"relative", borderRadius:10, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)", maxHeight:120 }}>
                      <img src={proofPreview} alt="Bukti" style={{ width:"100%", height:120, objectFit:"cover", display:"block" }} />
                      <button onClick={() => { setProofFile(null); setProofPreview(""); if(proofRef.current) proofRef.current.value=""; }}
                        style={{ position:"absolute", top:6, right:6, width:26, height:26, borderRadius:"50%", background:"rgba(0,0,0,0.7)", border:"none", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <X style={{ width:12, height:12 }} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => proofRef.current?.click()}
                      style={{ width:"100%", padding:"18px 14px", borderRadius:10, border:"2px dashed rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.3)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                      <Upload style={{ width:16, height:16 }} />
                      <span style={{ fontSize:".82rem" }}>Upload foto bukti transfer</span>
                    </button>
                  )}
                </div>

                <div>
                  <label style={lbl}>Catatan (opsional)</label>
                  <textarea rows={2} value={payForm.notes} onChange={e=>setPayForm(p=>({...p,notes:e.target.value}))} style={{ ...field, resize:"vertical", fontFamily:"inherit" }} placeholder="Keterangan tambahan…" />
                </div>

                <div style={{ display:"flex", gap:8, paddingTop:4 }}>
                  <button onClick={doApprove} disabled={savingPay}
                    style={{ flex:1, padding:12, borderRadius:11, background:"linear-gradient(135deg,#34d399,#10b981)", border:"none", color:"#fff", fontWeight:800, fontSize:".88rem", cursor:savingPay?"not-allowed":"pointer", opacity:savingPay?.6:1 }}>
                    {savingPay?"Memproses…":"Setujui & Simpan Pembayaran"}
                  </button>
                  <button onClick={closeApprove} style={{ padding:"12px 18px", borderRadius:11, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", color:"rgba(255,255,255,0.35)", cursor:"pointer", fontSize:".85rem" }}>Batal</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ MODAL: INVOICE ═══ */}
      <AnimatePresence>
        {invoiceModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
            onClick={e => { if (e.target===e.currentTarget) setInvoiceModal(null); }}>
            <motion.div initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:.95 }}
              style={{ background:"#111", border:"1px solid rgba(212,175,55,0.4)", borderRadius:20, padding:"24px", maxWidth:480, width:"100%", boxShadow:"0 24px 80px rgba(0,0,0,0.7)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <FileText style={{ width:18, height:18, color:G }} />
                  <span style={{ color:"#fff", fontWeight:700 }}>Invoice Siap</span>
                </div>
                <button onClick={()=>setInvoiceModal(null)} style={{ width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"rgba(255,255,255,0.4)", cursor:"pointer" }}><X style={{ width:14, height:14 }} /></button>
              </div>
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"14px 16px", marginBottom:16 }}>
                <p style={{ color:"#fff", fontWeight:700, margin:"0 0 4px" }}>{invoiceModal.order.customer_name}</p>
                <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".8rem", margin:0 }}>#{invoiceModal.order.id.slice(-8).toUpperCase()} · {fmt(invoiceModal.order.total_amount)}</p>
                <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".8rem", margin:"4px 0 0" }}>{invoiceModal.payment.payment_method} · Terbayar {fmt(invoiceModal.payment.terbayar)}</p>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => printInvoice(invoiceModal.order, invoiceModal.payment, settings.siteName || "Koperasi Emas")}
                  style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:12, borderRadius:11, background:`linear-gradient(135deg,${G},${G2})`, border:"none", color:"#0a0a0a", fontWeight:800, cursor:"pointer" }}>
                  <Printer style={{ width:15, height:15 }} /> Print Invoice
                </button>
                <button onClick={()=>setInvoiceModal(null)} style={{ padding:"12px 18px", borderRadius:11, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", color:"rgba(255,255,255,0.35)", cursor:"pointer", fontSize:".85rem" }}>Tutup</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
