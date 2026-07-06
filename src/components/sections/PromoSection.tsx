"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ShoppingCart, MessageCircle, Plus, Minus, X, ArrowRight, Package, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/store/useSettingsStore";
import { useAuthStore } from "@/store/useAuthStore";
import { gdriveImage } from "@/lib/utils";

const fmtRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);

const CART_KEY = "koperasi_product_cart";

interface ProdukItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  gram_weight: number | null;
  price: number | null;
  expired_at: string | null;
  stok: number | null;
}

interface CartItem { product_id: string; title: string; gram_weight: number|null; price: number; quantity: number; image_url: string|null; }

function ProdukCard({ item, index, onAddCart }: { item: ProdukItem; index: number; onAddCart: (item: ProdukItem) => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:index*0.07 }}
      whileHover={{ y:-6, transition:{ duration:0.2 } }}
      style={{ background:"rgba(14,14,14,0.85)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:20, overflow:"hidden", display:"flex", flexDirection:"column", transition:"border-color .3s, box-shadow .3s", cursor:"default" }}
      onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.borderColor="rgba(212,175,55,0.4)"; (e.currentTarget as HTMLElement).style.boxShadow="0 20px 48px rgba(212,175,55,0.1)"; }}
      onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor="rgba(212,175,55,0.15)"; (e.currentTarget as HTMLElement).style.boxShadow="none"; }}>

      {/* image */}
      <div style={{ position:"relative", width:"100%", paddingTop:"62%", background:"rgba(212,175,55,0.06)", flexShrink:0 }}>
        {item.image_url && !imgError ? (
          <img src={gdriveImage(item.image_url)} alt={item.title} onError={()=>setImgError(true)} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
        ) : (
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <ShoppingBag style={{ width:40, height:40, color:"rgba(212,175,55,0.25)" }} />
          </div>
        )}
        {item.gram_weight!=null && (
          <div style={{ position:"absolute", top:12, right:12, background:"linear-gradient(135deg,#D4AF37,#F5D060)", color:"#0a0a0a", borderRadius:10, padding:"4px 10px", fontSize:".75rem", fontWeight:900 }}>
            {item.gram_weight} gram
          </div>
        )}
        {item.stok!=null && item.stok<=0 && (
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ background:"rgba(248,113,113,0.9)", color:"#fff", borderRadius:10, padding:"6px 14px", fontSize:".8rem", fontWeight:700 }}>Stok Habis</span>
          </div>
        )}
      </div>

      {/* content */}
      <div style={{ padding:"16px 18px 20px", display:"flex", flexDirection:"column", gap:8, flex:1 }}>
        <h3 style={{ color:"#fff", fontWeight:800, fontSize:".95rem", lineHeight:1.3, margin:0 }}>{item.title}</h3>
        {item.price!=null && <p style={{ color:"#D4AF37", fontWeight:900, fontSize:"1.05rem", margin:0 }}>{fmtRp(item.price)}</p>}
        {item.stok!=null && item.stok>0 && <p style={{ color:"#60a5fa", fontSize:".76rem", margin:0, fontWeight:600 }}>Stok: {item.stok}</p>}
        {item.description && <p style={{ color:"rgba(255,255,255,0.65)", fontSize:".8rem", lineHeight:1.6, flex:1, margin:0 }}>{item.description}</p>}
        {item.expired_at && (
          <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".72rem", margin:0 }}>
            s/d {new Date(item.expired_at).toLocaleString("id-ID",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})}
          </p>
        )}
        <button
          disabled={item.stok!=null && item.stok<=0}
          onClick={() => onAddCart(item)}
          style={{ marginTop:4, display:"flex", alignItems:"center", justifyContent:"center", gap:8, width:"100%", padding:"10px", borderRadius:12, background:item.stok!=null&&item.stok<=0?"rgba(255,255,255,0.04)":"linear-gradient(135deg,#D4AF37,#F5D060)", border:"none", color:item.stok!=null&&item.stok<=0?"rgba(255,255,255,0.3)":"#0a0a0a", fontWeight:800, fontSize:".82rem", cursor:item.stok!=null&&item.stok<=0?"not-allowed":"pointer", transition:"opacity .2s" }}>
          <ShoppingCart style={{ width:14, height:14 }} />
          {item.stok!=null&&item.stok<=0?"Stok Habis":"Tambah ke Keranjang"}
        </button>
      </div>
    </motion.div>
  );
}

const PLACEHOLDER_ITEMS: ProdukItem[] = [
  { id:"1", title:"Simpanan Emas Perdana", description:"Mulai simpanan emas pertama Anda dengan harga spesial member.", image_url:null, gram_weight:null, price:null, expired_at:null, stok:null },
  { id:"2", title:"Cicilan Emas 0% Bunga", description:"Beli emas impian dengan cicilan tanpa bunga khusus anggota aktif.", image_url:null, gram_weight:null, price:null, expired_at:null, stok:null },
  { id:"3", title:"Buyback Harga Terbaik", description:"Jual kembali emas Anda dengan harga buyback terbaik. Dana cair 1×24 jam.", image_url:null, gram_weight:null, price:null, expired_at:null, stok:null },
  { id:"4", title:"Bonus Referral Member", description:"Ajak teman bergabung dan dapatkan bonus emas untuk setiap referral.", image_url:null, gram_weight:null, price:null, expired_at:null, stok:null },
];

export default function PromoSection() {
  const router = useRouter();
  const { user } = useAuthStore();
  const settings = useSiteSettings();
  const waNum = settings.whatsapp?.replace(/^0/,"62").replace(/[^0-9]/g,"") || "6281297533899";

  const [items, setItems] = useState<ProdukItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [justAdded, setJustAdded] = useState<string|null>(null);

  useEffect(() => {
    async function load() {
      try {
        const nowIso = new Date().toISOString();
        const { data } = await (supabase.from("promos") as any)
          .select("id,title,description,image_url,gram_weight,price,expired_at,stok,is_active")
          .eq("is_active",true).or(`expired_at.is.null,expired_at.gt.${nowIso}`)
          .order("created_at",{ ascending:false });
        setItems(data?.length ? data : PLACEHOLDER_ITEMS);
      } catch { setItems(PLACEHOLDER_ITEMS); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  function addToCart(prod: ProdukItem) {
    if (!prod.price) return;
    setCart(prev => {
      const existing = prev.find(it => it.product_id === prod.id);
      if (existing) return prev.map(it => it.product_id===prod.id ? {...it, quantity:it.quantity+1} : it);
      return [...prev, { product_id:prod.id, title:prod.title, gram_weight:prod.gram_weight, price:prod.price!, quantity:1, image_url:prod.image_url }];
    });
    setJustAdded(prod.id);
    setTimeout(()=>setJustAdded(null), 1200);
    setCartOpen(true);
  }

  function updateQty(product_id: string, delta: number) {
    setCart(prev => {
      const next = prev.map(it => it.product_id===product_id ? {...it, quantity:Math.max(0,it.quantity+delta)} : it).filter(it=>it.quantity>0);
      return next;
    });
  }

  function removeFromCart(product_id: string) { setCart(prev => prev.filter(it => it.product_id!==product_id)); }

  const cartTotal = cart.reduce((s,it)=>s+it.price*it.quantity,0);
  const cartCount = cart.reduce((s,it)=>s+it.quantity,0);

  function buildWaMessage() {
    const lines = ["Halo, saya ingin memesan produk berikut:", ""];
    cart.forEach((it,i)=>lines.push(`${i+1}. ${it.title}${it.gram_weight?` (${it.gram_weight}gr)`:""} ×${it.quantity} — ${fmtRp(it.price*it.quantity)}`));
    lines.push("","Total: "+fmtRp(cartTotal),"","Mohon dikonfirmasi. Terima kasih.");
    return encodeURIComponent(lines.join("\n"));
  }

  function handlePesan() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.open(`https://wa.me/${waNum}?text=${buildWaMessage()}`, "_blank");
    if (user) {
      router.push("/dashboard/member/promo");
    } else {
      router.push("/auth/login?callbackUrl=/dashboard/member/promo");
    }
    setCartOpen(false);
  }

  return (
    <section id="produk" style={{ padding:"80px 0", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg,#000,rgba(13,9,0,0.6),#000)", pointerEvents:"none" }} />

      <div style={{ position:"relative", maxWidth:1200, margin:"0 auto", padding:"0 24px" }}>

        {/* Header */}
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:"center", marginBottom:48, position:"relative" }}>
          {/* cart icon — top right */}
          {cartCount > 0 && (
            <button onClick={()=>setCartOpen(true)}
              style={{ position:"absolute", right:0, top:0, display:"flex", alignItems:"center", gap:6, padding:"8px 16px", background:"linear-gradient(135deg,#D4AF37,#F5D060)", border:"none", borderRadius:12, color:"#0a0a0a", cursor:"pointer", fontWeight:800, fontSize:".82rem" }}>
              <ShoppingCart style={{ width:15, height:15 }} />
              Keranjang ({cartCount})
            </button>
          )}
          <span style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:20, padding:"5px 16px", color:"#D4AF37", fontWeight:700, fontSize:".78rem", marginBottom:14 }}>
            <Package style={{ width:14, height:14 }} />
            Produk & Penawaran
          </span>
          <h2 style={{ color:"#fff", fontWeight:900, fontSize:"clamp(1.8rem,4vw,2.8rem)", marginBottom:12 }}>
            Produk{" "}<span className="text-gold-gradient">Unggulan Kami</span>
          </h2>
          <p style={{ color:"rgba(255,255,255,0.75)", fontSize:"clamp(.9rem,2vw,1.05rem)", maxWidth:500, margin:"0 auto" }}>
            Pilih produk, tambahkan ke keranjang, dan pesan langsung via WhatsApp.
          </p>
        </motion.div>

        {/* grid */}
        {loading ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,0.3)" }}>
            <RefreshCw style={{ width:28, height:28, animation:"spin 1s linear infinite", margin:"0 auto 12px" }} />
            <p>Memuat produk...</p>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:20 }}>
            {items.map((item,i) => (
              <div key={item.id} style={{ position:"relative" }}>
                <ProdukCard item={item} index={i} onAddCart={addToCart} />
                <AnimatePresence>
                  {justAdded===item.id && (
                    <motion.div initial={{ opacity:0, scale:.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:.8 }}
                      style={{ position:"absolute", top:12, left:12, background:"#34d399", color:"#fff", borderRadius:10, padding:"4px 10px", fontSize:".74rem", fontWeight:800, pointerEvents:"none" }}>
                      ✓ Ditambahkan
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}

        {/* sticky cart bar */}
        <AnimatePresence>
          {cartCount>0 && !cartOpen && (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:20 }}
              style={{ position:"fixed", bottom:80, right:24, zIndex:40 }}>
              <button onClick={()=>setCartOpen(true)}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 20px", background:"linear-gradient(135deg,#D4AF37,#F5D060)", border:"none", borderRadius:50, color:"#0a0a0a", fontWeight:900, fontSize:".9rem", cursor:"pointer", boxShadow:"0 8px 32px rgba(212,175,55,0.35)" }}>
                <ShoppingCart style={{ width:18, height:18 }} />
                {cartCount} item · {fmtRp(cartTotal)}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── CART MODAL ── */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", zIndex:100, display:"flex", alignItems:"flex-end", justifyContent:"flex-end" }}
            onClick={e=>{ if(e.target===e.currentTarget) setCartOpen(false); }}>
            <motion.div initial={{ x:400 }} animate={{ x:0 }} exit={{ x:400 }} transition={{ type:"spring", stiffness:280, damping:28 }}
              style={{ width:"100%", maxWidth:420, height:"100vh", background:"#0e0e0e", borderLeft:"1px solid rgba(212,175,55,0.2)", display:"flex", flexDirection:"column", overflow:"hidden" }}>

              {/* cart header */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 20px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:"rgba(212,175,55,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <ShoppingCart style={{ width:16, height:16, color:"#D4AF37" }} />
                  </div>
                  <div>
                    <p style={{ color:"#fff", fontWeight:800, margin:0, fontSize:".95rem" }}>Keranjang</p>
                    <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".75rem", margin:"1px 0 0" }}>{cartCount} item dipilih</p>
                  </div>
                </div>
                <button onClick={()=>setCartOpen(false)} style={{ width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"rgba(255,255,255,0.4)", cursor:"pointer" }}>
                  <X style={{ width:14, height:14 }} />
                </button>
              </div>

              {/* cart items */}
              <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>
                {cart.length===0 ? (
                  <div style={{ textAlign:"center", padding:"48px 0", color:"rgba(255,255,255,0.25)" }}>
                    <ShoppingCart style={{ width:36, height:36, margin:"0 auto 12px" }} />
                    <p>Keranjang kosong</p>
                  </div>
                ) : (
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    {cart.map(it => (
                      <motion.div key={it.product_id} layout initial={{ opacity:0 }} animate={{ opacity:1 }}
                        style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"12px 14px" }}>
                        {it.image_url ? (
                          <img src={gdriveImage(it.image_url!)} alt={it.title} style={{ width:48, height:48, objectFit:"cover", borderRadius:9, flexShrink:0 }} onError={e=>{(e.currentTarget as HTMLImageElement).style.display="none";}} />
                        ) : (
                          <div style={{ width:48, height:48, borderRadius:9, background:"rgba(212,175,55,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            <Package style={{ width:20, height:20, color:"rgba(212,175,55,0.3)" }} />
                          </div>
                        )}
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ color:"#fff", fontWeight:700, fontSize:".85rem", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{it.title}{it.gram_weight?` (${it.gram_weight}gr)`:""}</p>
                          <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".82rem", margin:"3px 0 0" }}>{fmtRp(it.price*it.quantity)}</p>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                          <button onClick={()=>updateQty(it.product_id,-1)} style={{ width:26, height:26, borderRadius:7, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Minus style={{ width:11, height:11 }} /></button>
                          <span style={{ color:"#fff", fontWeight:700, minWidth:20, textAlign:"center", fontSize:".85rem" }}>{it.quantity}</span>
                          <button onClick={()=>updateQty(it.product_id,1)} style={{ width:26, height:26, borderRadius:7, background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.25)", color:"#D4AF37", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><Plus style={{ width:11, height:11 }} /></button>
                          <button onClick={()=>removeFromCart(it.product_id)} style={{ width:26, height:26, borderRadius:7, background:"rgba(248,113,113,0.06)", border:"1px solid rgba(248,113,113,0.15)", color:"#f87171", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", marginLeft:4 }}><X style={{ width:11, height:11 }} /></button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* cart footer */}
              {cart.length>0 && (
                <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", padding:"16px 20px 24px", display:"flex", flexDirection:"column", gap:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ color:"rgba(255,255,255,0.5)", fontSize:".85rem" }}>Total</span>
                    <span style={{ color:"#D4AF37", fontWeight:900, fontSize:"1.15rem" }}>{fmtRp(cartTotal)}</span>
                  </div>
                  <button onClick={handlePesan}
                    style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, width:"100%", padding:"14px", borderRadius:14, background:"linear-gradient(135deg,#D4AF37,#F5D060)", border:"none", color:"#0a0a0a", fontWeight:900, fontSize:".9rem", cursor:"pointer" }}>
                    <MessageCircle style={{ width:16, height:16 }} />
                    Pesan via WhatsApp
                    <ArrowRight style={{ width:14, height:14 }} />
                  </button>
                  <p style={{ color:"rgba(255,255,255,0.3)", fontSize:".74rem", textAlign:"center", margin:0 }}>
                    Anda akan diarahkan ke WhatsApp & dashboard untuk konfirmasi
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}
