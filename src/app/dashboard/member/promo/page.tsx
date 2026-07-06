"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, RefreshCw, ShoppingCart, CheckCircle2, Clock, X, MessageCircle, Minus, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { useSiteSettings } from "@/store/useSettingsStore";
import { gdriveImage } from "@/lib/utils";

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
    const [{ data: prods }, { data: ords }] = await Promise.all([
      (supabase.from("promos") as any).select("*").eq("is_active",true).or(`expired_at.is.null,expired_at.gt.${nowIso}`).order("created_at",{ascending:false}),
      user?.id ? (supabase.from("product_orders") as any).select("*").eq("user_id",user.id).order("created_at",{ascending:false}) : Promise.resolve({ data:[] }),
    ]);
    setProduk(prods || []);
    setOrders(ords || []);
    setLoading(false);
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

  async function submitDirectOrder() {
    if (!orderModal || !user) return;
    const { produk, qty } = orderModal;
    if (!produk.price) { setOrderErr("Produk belum ada harga."); return; }
    setSubmittingOrder(true); setOrderErr("");
    const item = { product_id: produk.id, title: produk.title, gram_weight: produk.gram_weight ?? null, price: produk.price, quantity: qty, image_url: produk.image_url ?? null };
    const { error } = await (supabase.from("product_orders") as any).insert({
      user_id: user.id,
      customer_name: user.name || user.email,
      customer_phone: user.phone || null,
      items: [item],
      total_amount: produk.price * qty,
      status: "pending",
      source: "dashboard",
    });
    if (error) { setOrderErr(error.message); setSubmittingOrder(false); return; }
    setOrderModal(null); setSubmittingOrder(false); load();
  }

  function dismissCart() { localStorage.removeItem(CART_KEY); setPendingCart([]); }

  function waOrder(items: CartItem[]) {
    const lines = ["Halo, saya ingin memesan produk berikut:", ""];
    items.forEach((it,i) => lines.push(`${i+1}. ${it.title}${it.gram_weight?` (${it.gram_weight}gr)`:""} ×${it.quantity} — ${fmt(it.price*it.quantity)}`));
    const total = items.reduce((s,it)=>s+it.price*it.quantity,0);
    lines.push("","Total: "+fmt(total),"","Mohon konfirmasi. Terima kasih.");
    return `https://wa.me/${waNum}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  const statusColor = (s: string) => s==="approved"?"#34d399":s==="rejected"?"#f87171":s==="pending"?"#fbbf24":"rgba(255,255,255,0.3)";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Produk</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>Produk & penawaran aktif untuk Anda</p>
        </div>
        <button onClick={load} style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:10, padding:"8px 14px", color:"#D4AF37", cursor:"pointer", fontSize:".85rem" }}>
          <RefreshCw style={{ width:13, height:13 }} /> Refresh
        </button>
      </div>


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
                <button onClick={submitDirectOrder} disabled={submittingOrder}
                  style={{ padding:"12px", borderRadius:11, background:"linear-gradient(135deg,#D4AF37,#F5D060)", border:"none", color:"#0a0a0a", fontWeight:800, fontSize:".88rem", cursor:submittingOrder?"not-allowed":"pointer", opacity:submittingOrder?.6:1 }}>
                  {submittingOrder?"Mengirim…":"Kirim Pesanan"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
