"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Coins, TrendingUp, FileText, Settings,
  LogOut, ChevronLeft, ChevronRight, Shield, Tag,
  BarChart3, CreditCard, ArrowLeftRight, Wallet, Gift,
  MessageCircle, Upload, Building, X, PiggyBank,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const NAV: Record<string, { group: string; items: { label:string; href:string; icon:any }[] }[]> = {
  master: [
    { group:"Utama", items:[
      { label:"Dashboard", href:"/dashboard/master", icon:LayoutDashboard },
      { label:"Statistik", href:"/dashboard/master/statistik", icon:BarChart3 },
    ]},
    { group:"Manajemen", items:[
      { label:"Kelola Admin", href:"/dashboard/master/admin", icon:Shield },
      { label:"Kelola Member", href:"/dashboard/master/member", icon:Users },
      { label:"Harga Emas", href:"/dashboard/master/harga", icon:Coins },
      { label:"Promo", href:"/dashboard/master/promo", icon:Tag },
      { label:"Cabang", href:"/dashboard/master/cabang", icon:Building },
    ]},
    { group:"Laporan", items:[
      { label:"Approval", href:"/dashboard/master/approval", icon:FileText },
      { label:"Laporan", href:"/dashboard/master/laporan", icon:BarChart3 },
      { label:"Audit Log", href:"/dashboard/master/audit", icon:FileText },
    ]},
    { group:"Sistem", items:[
      { label:"Pengaturan", href:"/dashboard/master/settings", icon:Settings },
    ]},
  ],
  admin: [
    { group:"Utama", items:[
      { label:"Dashboard", href:"/dashboard/admin", icon:LayoutDashboard },
    ]},
    { group:"Operasional", items:[
      { label:"Transaksi", href:"/dashboard/admin/transaksi", icon:ArrowLeftRight },
      { label:"Pembayaran", href:"/dashboard/admin/pembayaran", icon:CreditCard },
      { label:"Verifikasi", href:"/dashboard/admin/verifikasi", icon:FileText },
      { label:"Kelola Member", href:"/dashboard/admin/member", icon:Users },
    ]},
    { group:"Simpanan", items:[
      { label:"Verif. Simpanan", href:"/dashboard/admin/simpanan", icon:PiggyBank },
    ]},
    { group:"Konten", items:[
      { label:"Upload Promo", href:"/dashboard/admin/promo",   icon:Tag },
      { label:"Berita",       href:"/dashboard/admin/berita",  icon:FileText },
      { label:"Chat Member",  href:"/dashboard/admin/chat",    icon:MessageCircle },
      { label:"Invoice",      href:"/dashboard/admin/invoice", icon:FileText },
    ]},
  ],
  member: [
    { group:"Portofolio", items:[
      { label:"Dashboard",    href:"/dashboard/member",          icon:LayoutDashboard },
      { label:"Saldo & Emas", href:"/dashboard/member/saldo",    icon:Coins },
      { label:"Simpanan",     href:"/dashboard/member/simpanan", icon:PiggyBank },
    ]},
    { group:"Transaksi", items:[
      { label:"Beli Emas",    href:"/dashboard/member/beli",     icon:TrendingUp },
      { label:"Buyback",      href:"/dashboard/member/buyback",  icon:ArrowLeftRight },
      { label:"Cicilan Emas", href:"/dashboard/member/cicilan",  icon:CreditCard },
      { label:"Tabungan Emas",href:"/dashboard/member/tabungan", icon:Wallet },
    ]},
    { group:"Akun", items:[
      { label:"Histori",      href:"/dashboard/member/histori",  icon:FileText },
      { label:"Referral",     href:"/dashboard/member/referral", icon:Gift },
      { label:"Upload Bukti", href:"/dashboard/member/upload",   icon:Upload },
    ]},
  ],
};

interface SidebarProps { mobileOpen: boolean; onMobileClose: () => void; }

function SidebarInner({ collapsed, onToggle, onClose }: { collapsed: boolean; onToggle: () => void; onClose: () => void }) {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const role = user?.role || "member";
  const groups = NAV[role] || NAV.member;

  const handleLogout = () => { logout(); router.push("/"); };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      {/* Top */}
      <div style={{ padding:"16px 14px", borderBottom:"1px solid rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent: collapsed ? "center" : "space-between", gap:8, flexShrink:0 }}>
        {!collapsed && (
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <img src="/logo.svg" alt="KE" style={{ width:30, height:30, objectFit:"contain", borderRadius:7 }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display="none"; }}
            />
            <div>
              <div className="text-gold-gradient" style={{ fontWeight:900, fontSize:".9rem", lineHeight:1 }}>KE</div>
              <div style={{ fontSize:".65rem", color:"rgba(255,255,255,0.3)", textTransform:"capitalize" }}>{role} Panel</div>
            </div>
          </div>
        )}
        {collapsed && (
          <img src="/logo.svg" alt="KE" style={{ width:30, height:30, objectFit:"contain", borderRadius:7 }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display="none"; }}
          />
        )}
        <button onClick={onToggle}
          style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.4)", cursor:"pointer", flexShrink:0 }}
          className="desktop-toggle"
        >
          {collapsed ? <ChevronRight style={{ width:14, height:14 }} /> : <ChevronLeft style={{ width:14, height:14 }} />}
        </button>
        <button onClick={onClose} className="mobile-close-btn"
          style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, width:30, height:30, display:"none", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.4)", cursor:"pointer" }}>
          <X style={{ width:14, height:14 }} />
        </button>
      </div>

      {/* User */}
      {!collapsed && (
        <div style={{ padding:"14px 14px", borderBottom:"1px solid rgba(255,255,255,0.05)", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div className="bg-gold-gradient" style={{ width:34, height:34, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#0a0a0a", fontSize:".85rem", flexShrink:0 }}>
              {user?.name?.[0] || "U"}
            </div>
            <div style={{ overflow:"hidden" }}>
              <p style={{ color:"#fff", fontSize:".85rem", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.name}</p>
              <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".72rem", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <div style={{ flex:1, overflowY:"auto", padding:"10px 10px", scrollbarWidth:"thin" }}>
        {groups.map(g => (
          <div key={g.group} style={{ marginBottom:18 }}>
            {!collapsed && (
              <p style={{ color:"rgba(255,255,255,0.2)", fontSize:".62rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".1em", padding:"0 8px", marginBottom:4 }}>{g.group}</p>
            )}
            {g.items.map(item => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={onClose} title={collapsed ? item.label : undefined}
                  style={{ display:"flex", alignItems:"center", gap:10, padding: collapsed ? "9px" : "9px 10px", borderRadius:10, marginBottom:1, borderLeft: active ? "3px solid #D4AF37" : "3px solid transparent", background: active ? "rgba(212,175,55,0.1)" : "transparent", color: active ? "#D4AF37" : "rgba(255,255,255,0.5)", textDecoration:"none", fontSize:".85rem", fontWeight:500, transition:"all .2s", justifyContent: collapsed ? "center" : "flex-start" }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background="rgba(212,175,55,0.07)"; (e.currentTarget as HTMLElement).style.color="#D4AF37"; }}}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background="transparent"; (e.currentTarget as HTMLElement).style.color="rgba(255,255,255,0.5)"; }}}
                >
                  <Icon style={{ width:16, height:16, flexShrink:0 }} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Logout */}
      <div style={{ padding:"10px", borderTop:"1px solid rgba(255,255,255,0.05)", flexShrink:0 }}>
        <button onClick={handleLogout}
          style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding: collapsed ? "9px" : "9px 10px", borderRadius:10, background:"none", border:"none", color:"rgba(255,255,255,0.35)", cursor:"pointer", fontSize:".85rem", transition:"all .2s", justifyContent: collapsed ? "center" : "flex-start" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color="#f87171"; (e.currentTarget as HTMLElement).style.background="rgba(239,68,68,0.08)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color="rgba(255,255,255,0.35)"; (e.currentTarget as HTMLElement).style.background="none"; }}
        >
          <LogOut style={{ width:16, height:16, flexShrink:0 }} />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
      <style>{`
        @media (max-width:899px) { .desktop-toggle { display:none !important; } .mobile-close-btn { display:flex !important; } }
      `}</style>
    </div>
  );
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop */}
      <motion.aside animate={{ width: collapsed ? 60 : 230 }} transition={{ duration:.2 }}
        style={{ height:"100vh", position:"sticky", top:0, background:"rgba(8,8,8,0.95)", borderRight:"1px solid rgba(212,175,55,0.1)", flexShrink:0, overflow:"hidden" }}
        className="desktop-sidebar"
      >
        <SidebarInner collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} onClose={() => {}} />
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={onMobileClose}
              style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.65)", zIndex:200 }}
            />
            <motion.aside
              initial={{ x:-230 }} animate={{ x:0 }} exit={{ x:-230 }} transition={{ type:"spring", damping:25, stiffness:300 }}
              style={{ position:"fixed", left:0, top:0, bottom:0, width:230, background:"rgba(8,8,8,0.98)", borderRight:"1px solid rgba(212,175,55,0.15)", zIndex:201, overflow:"hidden" }}
            >
              <SidebarInner collapsed={false} onToggle={() => {}} onClose={onMobileClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width:899px) { .desktop-sidebar { display:none !important; } }
      `}</style>
    </>
  );
}
