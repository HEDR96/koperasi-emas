"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, RefreshCw, ShoppingCart, CheckCircle2, Clock, X, MessageCircle, Minus, Plus, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { useSiteSettings } from "@/store/useSettingsStore";
import { gdriveImage } from "@/lib/utils";
import RupiahInput from "@/components/ui/RupiahInput";

const G = "#D4AF37"; const G2 = "#F5D060";
const field: React.CSSProperties = {
  width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:10, padding:"11px 14px", color:"#fff", fontSize:".88rem", outline:"none", boxSizing:"border-box",
};
const lbl: React.CSSProperties = {
  color:"rgba(255,255,255,0.38)", fontSize:".7rem", fontWeight:700, letterSpacing:".06em",
  textTransform:"uppercase", display:"block", marginBottom:5,
};
const EMPTY_TAMBAH = { title:"", description:"", image_url:"", gram_weight:"", price:"", stok:"" };
const STATUS_LABEL: Record<string,string> = { pending:"Menunggu Persetujuan", approved:"Aktif", rejected:"Ditolak" };
const STATUS_COLOR: Record<string,string> = { pending:"#fbbf24", approved:"#34d399", rejected:"#f87171" };

const fmt = (n: number) => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n);
const fmtDt = (s: string) => new Date(s).toLocaleString("id-ID",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});

const CART_KEY = "koperasi_product_cart";

interface CartItem { product_id: string; title: string; gram_weight: number|null; price: number; quantity: number; image_url: string|null; }

export default function MemberProdukPage() {
  const { user } = useAuthStore();
  const settings = useSiteSettings();
  const waNum = settings.whatsapp?.replace(/^0/,"62").replace(/[^0-9]/g,"") || "6281297533899";

  const [produk, setProduk] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCart, setPendingCart] = useState<CartItem[]>([]);
  const [confirmingCart, setConfirmingCart] = useState(false);
  const [cartErr, setCartErr] = useState("");
  const [orderModal, setOrderModal] = useState<{ produk: any; qty: number } | null>(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderErr, setOrderErr] = useState("");

  /* multi-product cart */
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  /* ── produk saya (yang saya ajukan) ── */
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [tambahModal, setTambahModal] = useState(false);
  const [tambahForm, setTambahForm] = useState(EMPTY_TAMBAH);
  const [savingTambah, setSavingTambah] = useState(false);
  const [tambahErr, setTambahErr] = useState("");
  const [imgUploading, setImgUploading] = useState(false);
  const imgUploadRef = useRef<HTMLInputElement>(null);

  const quota = user?.productQuota ?? 3;
  const usedQuota = myProducts.filter(p => p.approval_status !== "rejected").length;
  const quotaReached = usedQuota >= quota;

  useEffect(() => {
    const raw = localStorage.getItem(CART_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // support both old format (array) and new format ({ items, customer_name, customer_phone })
        const cart: CartItem[] = Array.isArray(parsed) ? parsed : (parsed.items || []);
        const custName: string = Array.isArray(parsed) ? "" : (parsed.customer_name || "");
        const custPhone: string = Array.isArray(parsed) ? "" : (parsed.customer_phone || "");
        if (cart.length > 0) autoSubmitCart(cart, custName, custPhone);
      } catch {}
    }
    load();
  }, []);

  async function load() {
    setLoading(true);
    const nowIso = new Date().toISOString();
    const [{ data: prods }, { data: ords }, { data: mine }] = await Promise.all([
      (supabase.from("promos") as any).select("*").eq("is_active",true).eq("approval_status","approved").or(`expired_at.is.null,expired_at.gt.${nowIso}`).order("created_at",{ascending:false}),
      user?.id ? (supabase.from("product_orders") as any).select("*").eq("user_id",user.id).order("created_at",{ascending:false}) : Promise.resolve({ data:[] }),
      user?.id ? (supabase.from("promos") as any).select("*").eq("submitted_by",user.id).order("created_at",{ascending:false}) : Promise.resolve({ data:[] }),
    ]);
    setProduk(prods || []);
    setOrders(ords || []);
    setMyProducts(mine || []);
    setLoading(false);
  }

  function openTambah() { setTambahForm(EMPTY_TAMBAH); setTambahErr(""); setTambahModal(true); }
  function closeTambah() { setTambahModal(false); setTambahErr(""); setImgUploading(false); }

  async function handleImgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setImgUploading(true); setTambahErr("");
    try {
      const fd = new FormData(); fd.append("file", f);
      const res = await fetch("/api/upload/gdrive", { method:"POST", body:fd });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Upload gagal");
      setTambahForm(p => ({ ...p, image_url: json.url }));
    } catch (e: any) { setTambahErr("Upload gambar: " + e.message); }
    finally { setImgUploading(false); if (imgUploadRef.current) imgUploadRef.current.value = ""; }
  }

  async function saveTambah() {
    if (!user?.id) return;
    if (!tambahForm.title.trim()) { setTambahErr("Nama produk wajib diisi."); return; }
    if (!tambahForm.price) { setTambahErr("Harga wajib diisi."); return; }
    if (quotaReached) { setTambahErr(`Kuota produk Anda sudah tercapai (maks ${quota}).`); return; }
    setSavingTambah(true); setTambahErr("");
    const { error } = await (supabase.from("promos") as any).insert({
      title: tambahForm.title.trim(),
      description: tambahForm.description || null,
      image_url: tambahForm.image_url || null,
      gram_weight: tambahForm.gram_weight ? Number(tambahForm.gram_weight) : null,
      price: Number(tambahForm.price),
      stok: tambahForm.stok !== "" ? Number(tambahForm.stok) : null,
      is_active: false,
      approval_status: "pending",
      submitted_by: user.id,
      discount_percent: 0,
    });
    if (error) { setTambahErr(error.message); setSavingTambah(false); return; }
    try {
      const { data: staff } = await (supabase.from("profiles") as any).select("id").in("role",["admin","master"]);
      if (staff?.length) await (supabase.from("notifications") as any).insert(
        staff.map((s:any)=>({ user_id:s.id, title:"Produk Baru Diajukan", body:`${user.name} mengajukan produk "${tambahForm.title.trim()}" untuk disetujui.`, type:"transaction", is_read:false, link:"/dashboard/admin/promo" }))
      );
    } catch {}
    closeTambah(); load(); setSavingTambah(false);
  }

  async function autoSubmitCart(cart: CartItem[], custName: string, custPhone: string) {
    let u = useAuthStore.getState().user;
    if (!u) {
      await new Promise<void>(res => {
        const unsub = useAuthStore.subscribe(s => { if (s.user) { unsub(); res(); } });
        setTimeout(res, 4000);
      });
      u = useAuthStore.getState().user;
    }
    if (!u) return;
    const total = cart.reduce((s, it) => s + it.price * it.quantity, 0);
    const { error } = await (supabase.from("product_orders") as any).insert({
      user_id: u.id,
      customer_name: custName || u.name || u.email,
      customer_phone: custPhone || u.phone || null,
      items: cart,
      total_amount: total,
      status: "pending",
      source: "landing_page",
    });
    localStorage.removeItem(CART_KEY);
    if (!error) load();
  }

  async function confirmCart() {
    if (!pendingCart.length || !user) return;
    setConfirmingCart(true); setCartErr("");
    const total = pendingCart.reduce((s,it) => s + it.price * it.quantity, 0);
    const { error } = await (supabase.from("product_orders") as any).insert({
      user_id: user.id,
      customer_name: user.name || user.email,
      customer_phone: user.phone || null,
      items: pendingCart,
      total_amount: total,
      status: "pending",
      source: "landing_page",
    });
    if (error) { setCartErr(error.message); setConfirmingCart(false); return; }
    localStorage.removeItem(CART_KEY);
    setPendingCart([]);
    setConfirmingCart(false);
    load();
  }

  function addModalToCart() {
    if (!orderModal) return;
    const { produk, qty } = orderModal;
    setCart(prev => {
      const existing = prev.find(it => it.product_id === produk.id);
      if (existing) return prev.map(it => it.product_id === produk.id ? { ...it, quantity: it.quantity + qty } : it);
      return [...prev, { product_id: produk.id, title: produk.title, gram_weight: produk.gram_weight ?? null, price: produk.price, quantity: qty, image_url: produk.image_url ?? null }];
    });
    setOrderModal(null);
    setCartOpen(true);
  }

  function updateCartQty(product_id: string, delta: number) {
    setCart(prev => prev.map(it => {
      if (it.product_id !== product_id) return it;
      return { ...it, quantity: Math.max(0, it.quantity + delta) };
    }).filter(it => it.quantity > 0));
  }

  async function submitCartOrder() {
    if (!cart.length || !user) return;
    setSubmittingOrder(true); setOrderErr("");
    const total = cart.reduce((s, it) => s + it.price * it.quantity, 0);
    const { error } = await (supabase.from("product_orders") as any).insert({
      user_id: user.id,
      customer_name: user.name || user.email,
      customer_phone: user.phone || null,
      items: cart,
      total_amount: total,
      status: "pending",
      source: "dashboard",
    });
    if (error) { setOrderErr(error.message); setSubmittingOrder(false); return; }
    setCart([]); setCartOpen(false); setSubmittingOrder(false); load();
  }

  const cartTotal = cart.reduce((s, it) => s + it.price * it.quantity, 0);
  const cartCount = cart.reduce((s, it) => s + it.quantity, 0);

  const statusColor = (s: string) => s==="approved"?"#34d399":s==="rejected"?"#f87171":s==="pending"?"#fbbf24":"rgba(255,255,255,0.3)";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Produk</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Produk & penawaran aktif untuk Anda</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => setCartOpen(true)}
            style={{ display:"flex", alignItems:"center", gap:7, background: cartCount > 0 ? "linear-gradient(135deg,#D4AF37,#F5D060)" : "rgba(212,175,55,0.12)", border: cartCount > 0 ? "none" : "1px solid rgba(212,175,55,0.3)", borderRadius:10, padding:"8px 16px", color: cartCount > 0 ? "#0a0a0a" : "#D4AF37", cursor:"pointer", fontSize:".85rem", fontWeight:800, position:"relative" }}>
            <ShoppingCart style={{ width:14, height:14 }} />
            Keranjang
            {cartCount > 0 && (
              <span style={{ background:"#ef4444", color:"#fff", borderRadius:"50%", width:18, height:18, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:".65rem", fontWeight:900, marginLeft:2 }}>{cartCount}</span>
            )}
          </button>
          <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
            <RefreshCw style={{ width:13, height:13 }} /> Refresh
          </button>
          <button onClick={openTambah} disabled={quotaReached}
            title={quotaReached ? `Kuota produk Anda sudah tercapai (${usedQuota}/${quota})` : undefined}
            style={{ display:"flex", alignItems:"center", gap:7, padding:"0 16px", height:38, background: quotaReached ? "rgba(255,255,255,0.04)" : `linear-gradient(135deg,${G},${G2})`, border: quotaReached ? "1px solid rgba(255,255,255,0.1)" : "none", borderRadius:10, color: quotaReached ? "rgba(255,255,255,0.3)" : "#0a0a0a", cursor: quotaReached ? "not-allowed" : "pointer", fontSize:".85rem", fontWeight:800 }}>
            <Plus style={{ width:14, height:14 }} /> Tambah Produk
          </button>
        </div>
      </div>

      <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".78rem", margin:0 }}>
        Kuota produk Anda: <b style={{ color: quotaReached ? "#f87171" : "#D4AF37" }}>{usedQuota} / {quota}</b> terpakai.
        {quotaReached && " Hubungi admin untuk menambah kuota."}
      </p>


      {/* my orders */}
      {orders.length > 0 && (
        <div>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".75rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 10px" }}>Pesanan Saya</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {orders.map((o,i) => {
              const items = Array.isArray(o.items)?o.items:JSON.parse(o.items||"[]");
              const sc = statusColor(o.status);
              return (
                <motion.div key={o.id} initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.04 }}
                  style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${o.status==="pending"?"rgba(251,191,36,0.2)":o.status==="approved"?"rgba(52,211,153,0.15)":"rgba(255,255,255,0.06)"}`, borderRadius:14, padding:"14px 16px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".78rem" }}>#{o.id.slice(-8).toUpperCase()}</span>
                        <span style={{ fontSize:".67rem", fontWeight:700, borderRadius:20, padding:"2px 8px", background:`${sc}1a`, color:sc, border:`1px solid ${sc}44` }}>{o.status.toUpperCase()}</span>
                      </div>
                      <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem", margin:"3px 0 0" }}>{fmtDt(o.created_at)}</p>
                    </div>
                    <span style={{ color:"#D4AF37", fontWeight:700, fontSize:".9rem" }}>{fmt(o.total_amount)}</span>
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {items.slice(0,3).map((it: any, j: number) => (
                      <span key={j} style={{ fontSize:".76rem", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:"3px 9px", color:"rgba(255,255,255,0.55)" }}>
                        {it.title}{it.gram_weight?` ${it.gram_weight}gr`:""} ×{it.quantity}
                      </span>
                    ))}
                  </div>
                  {o.status==="pending" && (
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:10 }}>
                      <Clock style={{ width:12, height:12, color:"#fbbf24" }} />
                      <span style={{ color:"#fbbf24", fontSize:".76rem" }}>Menunggu konfirmasi dari admin</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* produk saya (yang saya ajukan) */}
      {myProducts.length > 0 && (
        <div>
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".75rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 10px" }}>Produk Saya</p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {myProducts.map((p,i) => {
              const sc = STATUS_COLOR[p.approval_status] || "rgba(255,255,255,0.3)";
              return (
                <motion.div key={p.id} initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.04 }}
                  style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${sc}33`, borderRadius:14, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                  <div style={{ width:44, height:44, borderRadius:9, overflow:"hidden", flexShrink:0, background:"rgba(212,175,55,0.06)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {p.image_url
                      ? <img src={gdriveImage(p.image_url)} alt={p.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}} />
                      : <Package style={{ width:16, height:16, color:"rgba(255,255,255,0.2)" }} />}
                  </div>
                  <div style={{ flex:1, minWidth:140 }}>
                    <p style={{ color:"#fff", fontWeight:700, fontSize:".88rem", margin:"0 0 3px" }}>{p.title}{p.gram_weight!=null?` (${p.gram_weight}gr)`:""}</p>
                    <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".74rem", margin:0 }}>{fmtDt(p.created_at)}{p.stok!=null?` · stok ${p.stok}`:""}</p>
                  </div>
                  {p.price!=null && <span style={{ color:"#D4AF37", fontWeight:700, fontSize:".85rem" }}>{fmt(p.price)}</span>}
                  <span style={{ fontSize:".67rem", fontWeight:700, borderRadius:20, padding:"2px 8px", background:`${sc}1a`, color:sc, border:`1px solid ${sc}44` }}>{(STATUS_LABEL[p.approval_status]||p.approval_status).toUpperCase()}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* produk list */}
      <div>
        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".75rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 10px" }}>Produk Tersedia</p>
        {loading ? (
          <p style={{ color:"rgba(255,255,255,0.3)" }}>Memuat...</p>
        ) : produk.length === 0 ? (
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:"48px", textAlign:"center" }}>
            <Package style={{ width:38, height:38, color:"rgba(255,255,255,0.15)", margin:"0 auto 12px" }} />
            <p style={{ color:"rgba(255,255,255,0.4)", margin:0 }}>Belum ada produk aktif saat ini.</p>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 }}>
            {produk.map((p,i) => (
              <motion.div key={p.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*.05 }}
                style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:16, overflow:"hidden" }}>
                {p.image_url && <img src={gdriveImage(p.image_url)} alt={p.title} style={{ width:"100%", height:140, objectFit:"cover" }} onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}} />}
                <div style={{ padding:"14px 16px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:8 }}>
                    <p style={{ color:"#fff", fontWeight:700, fontSize:".95rem", margin:0, lineHeight:1.3 }}>{p.title}</p>
                    {p.gram_weight!=null && <span style={{ background:"linear-gradient(135deg,#D4AF37,#F5D060)", color:"#0a0a0a", borderRadius:8, padding:"3px 10px", fontSize:".75rem", fontWeight:800, flexShrink:0 }}>{p.gram_weight}gr</span>}
                  </div>
                  {p.price!=null && <p style={{ color:"#D4AF37", fontWeight:900, fontSize:"1rem", margin:"0 0 6px" }}>{fmt(p.price)}</p>}
                  {p.stok!=null && <p style={{ color:p.stok>0?"#60a5fa":"#f87171", fontSize:".78rem", margin:"0 0 8px", fontWeight:600 }}>Stok: {p.stok>0?p.stok:"Habis"}</p>}
                  {p.description && <p style={{ color:"rgba(255,255,255,0.55)", fontSize:".82rem", margin:"0 0 10px", lineHeight:1.6 }}>{p.description}</p>}
                  {p.expired_at && <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".74rem", margin:"0 0 10px" }}>Berlaku s/d {fmtDt(p.expired_at)}</p>}
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => { if(p.price && !(p.stok!=null&&p.stok<=0)) { setOrderModal({ produk:p, qty:1 }); setOrderErr(""); } }}
                      disabled={p.stok!=null&&p.stok<=0}
                      style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"9px", borderRadius:10, background:p.stok!=null&&p.stok<=0?"rgba(255,255,255,0.04)":"linear-gradient(135deg,#D4AF37,#F5D060)", border:"none", color:p.stok!=null&&p.stok<=0?"rgba(255,255,255,0.3)":"#0a0a0a", fontSize:".82rem", fontWeight:800, cursor:p.stok!=null&&p.stok<=0?"not-allowed":"pointer" }}>
                      {p.stok!=null&&p.stok<=0?"Stok Habis":"Pesan Sekarang"}
                    </button>
                    <a href={`https://wa.me/${waNum}?text=${encodeURIComponent(`Halo, saya tertarik dengan produk:\n• ${p.title}${p.gram_weight?` (${p.gram_weight}gr)`:""}\n• Harga: ${p.price?fmt(p.price):"-"}\n\nMohon info lebih lanjut.`)}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"9px 12px", borderRadius:10, background:"rgba(37,211,102,0.1)", border:"1px solid rgba(37,211,102,0.3)", color:"#25d366", textDecoration:"none" }}>
                      <MessageCircle style={{ width:14, height:14 }} />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      {/* modal order langsung */}
      <AnimatePresence>
        {orderModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
            onClick={e => { if(e.target===e.currentTarget) setOrderModal(null); }}>
            <motion.div initial={{ opacity:0, scale:.95, y:16 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:.95 }} transition={{ type:"spring", stiffness:300, damping:28 }}
              style={{ width:"100%", maxWidth:420, background:"#111", border:"1px solid rgba(212,175,55,0.35)", borderRadius:20, overflow:"hidden", boxShadow:"0 24px 80px rgba(0,0,0,0.7)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px 14px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ color:"#fff", fontWeight:700, fontSize:".95rem" }}>Pesan Produk</span>
                <button onClick={() => setOrderModal(null)} style={{ width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:7, color:"rgba(255,255,255,0.4)", cursor:"pointer" }}>
                  <X style={{ width:13, height:13 }} />
                </button>
              </div>
              <div style={{ padding:"18px 20px", display:"flex", flexDirection:"column", gap:14 }}>
                {orderErr && <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)", borderRadius:8, padding:"8px 12px", color:"#f87171", fontSize:".8rem" }}>{orderErr}</div>}
                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"12px 14px" }}>
                  <p style={{ color:"#fff", fontWeight:700, margin:"0 0 4px" }}>{orderModal.produk.title}{orderModal.produk.gram_weight?` (${orderModal.produk.gram_weight}gr)`:""}</p>
                  <p style={{ color:"#D4AF37", fontWeight:800, fontSize:"1rem", margin:0 }}>{fmt(orderModal.produk.price)}</p>
                  {orderModal.produk.stok!=null && <p style={{ color:"#60a5fa", fontSize:".76rem", margin:"4px 0 0" }}>Stok tersedia: {orderModal.produk.stok}</p>}
                </div>
                <div>
                  <p style={{ color:"rgba(255,255,255,0.38)", fontSize:".7rem", fontWeight:700, letterSpacing:".06em", textTransform:"uppercase", margin:"0 0 8px" }}>Jumlah</p>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <button onClick={() => setOrderModal(p => p ? { ...p, qty: Math.max(1, p.qty-1) } : p)}
                      style={{ width:36, height:36, borderRadius:9, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Minus style={{ width:14, height:14 }} />
                    </button>
                    <span style={{ color:"#fff", fontWeight:800, fontSize:"1.1rem", minWidth:28, textAlign:"center" }}>{orderModal.qty}</span>
                    <button onClick={() => setOrderModal(p => { if(!p) return p; const max = p.produk.stok ?? 999; return p.qty < max ? { ...p, qty: p.qty+1 } : p; })}
                      style={{ width:36, height:36, borderRadius:9, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Plus style={{ width:14, height:14 }} />
                    </button>
                    <span style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", marginLeft:4 }}>= {fmt(orderModal.produk.price * orderModal.qty)}</span>
                  </div>
                </div>
                <button onClick={addModalToCart}
                  style={{ padding:"12px", borderRadius:11, background:"linear-gradient(135deg,#D4AF37,#F5D060)", border:"none", color:"#0a0a0a", fontWeight:800, fontSize:".88rem", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                  <ShoppingCart style={{ width:15, height:15 }} /> Tambah ke Keranjang
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* modal tambah produk */}
      <AnimatePresence>
        {tambahModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", backdropFilter:"blur(4px)", zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
            onClick={e => { if (e.target===e.currentTarget) closeTambah(); }}>
            <motion.div initial={{ opacity:0, scale:.95, y:16 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:.95, y:16 }} transition={{ type:"spring", stiffness:300, damping:28 }}
              style={{ width:"100%", maxWidth:480, maxHeight:"88vh", overflowY:"auto", background:"#111", border:"1px solid rgba(212,175,55,0.35)", borderRadius:20, boxShadow:"0 24px 80px rgba(0,0,0,0.6)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 22px 14px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                <div>
                  <span style={{ color:"#fff", fontWeight:700, fontSize:".95rem" }}>Tambah Produk</span>
                  <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".72rem", margin:"1px 0 0" }}>Produk akan tayang setelah disetujui admin</p>
                </div>
                <button onClick={closeTambah} style={{ width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"rgba(255,255,255,0.4)", cursor:"pointer" }}><X style={{ width:14, height:14 }} /></button>
              </div>
              <div style={{ padding:"20px 22px", display:"flex", flexDirection:"column", gap:16 }}>
                {tambahErr && <div style={{ background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:10, padding:"10px 14px", color:"#f87171", fontSize:".82rem" }}>{tambahErr}</div>}

                <div>
                  <label style={lbl}>Nama Produk *</label>
                  <input value={tambahForm.title} onChange={e=>setTambahForm(p=>({...p,title:e.target.value}))} style={field} placeholder="cth: Cincin Emas 2gr" />
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                  <div>
                    <label style={lbl}>Berat (gram)</label>
                    <input type="number" min={0} step={0.01} value={tambahForm.gram_weight} onChange={e=>setTambahForm(p=>({...p,gram_weight:e.target.value}))} style={field} placeholder="opsional" />
                  </div>
                  <div>
                    <label style={lbl}>Harga (Rp) *</label>
                    <RupiahInput value={tambahForm.price} onValueChange={v=>setTambahForm(p=>({...p,price:v}))} style={field} placeholder="500.000" />
                  </div>
                  <div>
                    <label style={lbl}>Stok</label>
                    <input type="number" min={0} value={tambahForm.stok} onChange={e=>setTambahForm(p=>({...p,stok:e.target.value}))} style={field} placeholder="opsional" />
                  </div>
                </div>

                <div>
                  <label style={lbl}>Foto Produk</label>
                  <input ref={imgUploadRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleImgUpload} />
                  {tambahForm.image_url ? (
                    <div style={{ position:"relative", borderRadius:10, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)" }}>
                      <img src={gdriveImage(tambahForm.image_url)} alt="Preview" style={{ width:"100%", height:140, objectFit:"cover", display:"block" }}
                        onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}} />
                      <button onClick={() => setTambahForm(p=>({...p,image_url:""}))}
                        style={{ position:"absolute", top:6, right:6, width:26, height:26, borderRadius:"50%", background:"rgba(0,0,0,0.7)", border:"none", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <X style={{ width:12, height:12 }} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => imgUploadRef.current?.click()} disabled={imgUploading}
                      style={{ width:"100%", padding:"22px 14px", borderRadius:10, border:"2px dashed rgba(212,175,55,0.25)", background:"rgba(212,175,55,0.03)", color:imgUploading?"rgba(212,175,55,0.5)":"rgba(212,175,55,0.6)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                      <Upload style={{ width:16, height:16 }} />
                      <span style={{ fontSize:".82rem", fontWeight:600 }}>{imgUploading?"Mengupload…":"Upload Foto Produk"}</span>
                    </button>
                  )}
                </div>

                <div>
                  <label style={lbl}>Deskripsi (opsional)</label>
                  <textarea rows={2} value={tambahForm.description} onChange={e=>setTambahForm(p=>({...p,description:e.target.value}))} style={{ ...field, resize:"vertical", fontFamily:"inherit" }} placeholder="Keterangan produk…" />
                </div>

                <div style={{ display:"flex", gap:8, paddingTop:4 }}>
                  <button onClick={saveTambah} disabled={savingTambah||!tambahForm.title||!tambahForm.price}
                    style={{ flex:1, padding:12, borderRadius:11, background:`linear-gradient(135deg,${G},${G2})`, border:"none", color:"#0a0a0a", fontWeight:800, fontSize:".88rem", cursor:savingTambah||!tambahForm.title||!tambahForm.price?"not-allowed":"pointer", opacity:savingTambah?.6:1 }}>
                    {savingTambah?"Mengirim…":"Ajukan Produk"}
                  </button>
                  <button onClick={closeTambah} style={{ padding:"12px 18px", borderRadius:11, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.09)", color:"rgba(255,255,255,0.35)", cursor:"pointer", fontSize:".85rem" }}>Batal</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CART SIDEBAR ── */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"flex-end" }}
            onClick={e => { if(e.target===e.currentTarget) setCartOpen(false); }}>
            <motion.div initial={{ x:460 }} animate={{ x:0 }} exit={{ x:460 }} transition={{ type:"spring", stiffness:280, damping:28 }}
              style={{ width:"100%", maxWidth:440, height:"100vh", background:"#0e0e0e", borderLeft:"1px solid rgba(212,175,55,0.2)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
              {/* header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px 14px", borderBottom:"1px solid rgba(255,255,255,0.07)", flexShrink:0 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:"rgba(212,175,55,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <ShoppingCart style={{ width:15, height:15, color:"#D4AF37" }} />
                  </div>
                  <div>
                    <p style={{ color:"#fff", fontWeight:800, margin:0, fontSize:".9rem" }}>Keranjang Pesanan</p>
                    <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".72rem", margin:"1px 0 0" }}>{cartCount} item dipilih</p>
                  </div>
                </div>
                <button onClick={() => setCartOpen(false)} style={{ width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"rgba(255,255,255,0.4)", cursor:"pointer" }}>
                  <X style={{ width:13, height:13 }} />
                </button>
              </div>
              {/* items */}
              <div style={{ flex:1, overflowY:"auto", padding:"16px 20px", display:"flex", flexDirection:"column", gap:10 }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"24px 0 8px", color:"rgba(255,255,255,0.25)" }}>
                    <ShoppingCart style={{ width:28, height:28, margin:"0 auto 8px" }} />
                    <p style={{ fontSize:".82rem", margin:0 }}>Keranjang kosong</p>
                  </div>
                ) : cart.map(it => (
                  <motion.div key={it.product_id} layout initial={{ opacity:0 }} animate={{ opacity:1 }}
                    style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"10px 12px" }}>
                    {it.image_url
                      ? <img src={gdriveImage(it.image_url!)} alt={it.title} style={{ width:44, height:44, objectFit:"cover", borderRadius:8, flexShrink:0 }} onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}} />
                      : <div style={{ width:44, height:44, borderRadius:8, background:"rgba(212,175,55,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Package style={{ width:18, height:18, color:"rgba(212,175,55,0.3)" }} /></div>}
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ color:"#fff", fontWeight:700, fontSize:".82rem", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{it.title}{it.gram_weight?` (${it.gram_weight}gr)`:""}</p>
                      <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".8rem", margin:"2px 0 0" }}>{fmt(it.price * it.quantity)}</p>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
                      <button onClick={() => updateCartQty(it.product_id, -1)} style={{ width:24, height:24, borderRadius:6, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Minus style={{ width:10, height:10 }} /></button>
                      <span style={{ color:"#fff", fontWeight:700, minWidth:18, textAlign:"center", fontSize:".83rem" }}>{it.quantity}</span>
                      <button onClick={() => updateCartQty(it.product_id, 1)} style={{ width:24, height:24, borderRadius:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", color:"#D4AF37", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Plus style={{ width:10, height:10 }} /></button>
                      <button onClick={() => setCart(prev => prev.filter(c => c.product_id !== it.product_id))} style={{ width:24, height:24, borderRadius:6, background:"rgba(248,113,113,0.06)", border:"1px solid rgba(248,113,113,0.15)", color:"#f87171", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", marginLeft:2 }}><X style={{ width:10, height:10 }} /></button>
                    </div>
                  </motion.div>
                ))}

                {/* ── Daftar semua produk tersedia di dalam keranjang ── */}
                {produk.length > 0 && (
                  <div style={{ marginTop: cart.length > 0 ? 14 : 4 }}>
                    <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", margin:"0 0 10px" }}>Produk Tersedia</p>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {produk.map(p => {
                        const inCart = cart.find(it => it.product_id === p.id);
                        const habis = p.stok != null && p.stok <= 0;
                        return (
                          <div key={p.id}
                            style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(212,175,55,0.1)", borderRadius:12, padding:"10px 12px" }}>
                            {p.image_url
                              ? <img src={gdriveImage(p.image_url)} alt={p.title} style={{ width:40, height:40, objectFit:"cover", borderRadius:8, flexShrink:0 }} onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}} />
                              : <div style={{ width:40, height:40, borderRadius:8, background:"rgba(212,175,55,0.06)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Package style={{ width:16, height:16, color:"rgba(212,175,55,0.25)" }} /></div>}
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ color:"#fff", fontWeight:700, fontSize:".8rem", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.title}{p.gram_weight?` (${p.gram_weight}gr)`:""}</p>
                              <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".75rem", margin:"2px 0 0" }}>{p.price ? fmt(p.price) : "-"}</p>
                            </div>
                            {habis ? (
                              <span style={{ fontSize:".68rem", color:"#f87171", fontWeight:600, flexShrink:0 }}>Habis</span>
                            ) : inCart ? (
                              <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
                                <button onClick={() => updateCartQty(p.id, -1)} style={{ width:24, height:24, borderRadius:6, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Minus style={{ width:10, height:10 }} /></button>
                                <span style={{ color:"#fff", fontWeight:700, minWidth:16, textAlign:"center", fontSize:".82rem" }}>{inCart.quantity}</span>
                                <button onClick={() => updateCartQty(p.id, 1)} style={{ width:24, height:24, borderRadius:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", color:"#D4AF37", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Plus style={{ width:10, height:10 }} /></button>
                              </div>
                            ) : (
                              <button onClick={() => {
                                if (!p.price) return;
                                setCart(prev => [...prev, { product_id: p.id, title: p.title, gram_weight: p.gram_weight ?? null, price: p.price, quantity: 1, image_url: p.image_url ?? null }]);
                              }} style={{ flexShrink:0, display:"flex", alignItems:"center", gap:5, background:"rgba(212,175,55,0.12)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:8, padding:"5px 10px", color:"#D4AF37", cursor:"pointer", fontSize:".73rem", fontWeight:700 }}>
                                <Plus style={{ width:11, height:11 }} /> Tambah
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              {/* footer */}
              {cart.length > 0 && (
                <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", padding:"14px 20px 20px", display:"flex", flexDirection:"column", gap:10, flexShrink:0 }}>
                  {orderErr && <div style={{ background:"rgba(248,113,113,0.1)", border:"1px solid rgba(248,113,113,0.3)", borderRadius:8, padding:"8px 12px", color:"#f87171", fontSize:".8rem" }}>{orderErr}</div>}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ color:"rgba(255,255,255,0.5)", fontSize:".85rem" }}>Total</span>
                    <span style={{ color:"#D4AF37", fontWeight:900, fontSize:"1.1rem" }}>{fmt(cartTotal)}</span>
                  </div>
                  <button onClick={submitCartOrder} disabled={submittingOrder}
                    style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:"13px", borderRadius:14, background:"linear-gradient(135deg,#D4AF37,#F5D060)", border:"none", color:"#0a0a0a", fontWeight:900, fontSize:".9rem", cursor:submittingOrder?"not-allowed":"pointer", opacity:submittingOrder?.6:1 }}>
                    <CheckCircle2 style={{ width:16, height:16 }} />
                    {submittingOrder ? "Mengirim…" : "Kirim Pesanan"}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
