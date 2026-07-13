"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, LogOut, ChevronLeft, ChevronRight, X,
  BarChart2, Users, ShieldCheck, Coins, CheckSquare,
  Bell, Settings, Upload, MessageSquare, PlusCircle,
  Send, History, Star, HelpCircle, Image, Landmark, CreditCard, UserCircle,
  Wallet, UserCheck, Newspaper, FileText, Receipt, Activity, Megaphone, FileSpreadsheet, Ticket, Package,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSiteName } from "@/store/useSettingsStore";

const NAV: Record<string, { group: string; items: { label:string; href:string; icon:any }[] }[]> = {
  master: [
    { group:"Utama", items:[
      { label:"Dashboard",  href:"/dashboard/master",           icon:LayoutDashboard },
      { label:"Statistik",  href:"/dashboard/master/statistik", icon:BarChart2 },
    ]},
    { group:"Manajemen", items:[
      { label:"Kelola Admin",    href:"/dashboard/master/admin",  icon:ShieldCheck },
      { label:"Kelola Anggota",  href:"/dashboard/master/member", icon:Users },
      { label:"Harga Emas",      href:"/dashboard/master/harga",  icon:Coins },
    ]},
    { group:"Konten Landing", items:[
      { label:"Produk",     href:"/dashboard/master/promo",     icon:Megaphone },
      { label:"Testimoni",  href:"/dashboard/master/testimoni", icon:Star },
      { label:"FAQ",        href:"/dashboard/master/faq",       icon:HelpCircle },
      { label:"Foto Gedung",href:"/dashboard/master/konten",    icon:Image },
    ]},
    { group:"Transaksi", items:[
      { label:"Approval",           href:"/dashboard/master/approval",         icon:CheckSquare },
      { label:"Input Transaksi",    href:"/dashboard/master/input-transaksi",  icon:PlusCircle },
      { label:"Input Simpanan",      href:"/dashboard/master/simpanan",         icon:Wallet },
      { label:"Kelola Cicilan",     href:"/dashboard/master/cicilan",          icon:CreditCard },
      { label:"Voucher",            href:"/dashboard/master/voucher",          icon:Ticket },
      { label:"Riwayat",            href:"/dashboard/master/riwayat",          icon:History },
      { label:"Laporan",            href:"/dashboard/master/laporan",          icon:FileSpreadsheet },
    ]},
    { group:"Sistem", items:[
      { label:"Log Aktivitas", href:"/dashboard/master/audit",      icon:Activity },
      { label:"Notifikasi",    href:"/dashboard/master/notifikasi", icon:Bell },
      { label:"Pengaturan",    href:"/dashboard/master/settings",   icon:Settings },
      { label:"Profil Saya",   href:"/dashboard/profil",            icon:UserCircle },
    ]},
  ],
  admin: [
    { group:"Utama", items:[
      { label:"Dashboard", href:"/dashboard/admin", icon:LayoutDashboard },
      { label:"Harga Emas", href:"/dashboard/admin/harga", icon:Coins },
    ]},
    { group:"Transaksi", items:[
      { label:"Ajukan Transaksi",     href:"/dashboard/admin/ajukan",          icon:Send },
      { label:"Transaksi & Approval", href:"/dashboard/admin/transaksi",       icon:CheckSquare },
      { label:"Input Transaksi",      href:"/dashboard/admin/input-transaksi", icon:PlusCircle },
      { label:"Verifikasi Bayar",     href:"/dashboard/admin/pembayaran",      icon:Receipt },
      { label:"Riwayat",              href:"/dashboard/admin/riwayat",         icon:History },
      { label:"Invoice",              href:"/dashboard/admin/invoice",         icon:FileText },
      { label:"Laporan",              href:"/dashboard/admin/laporan",         icon:FileSpreadsheet },
    ]},
    { group:"Anggota", items:[
      { label:"Kelola Anggota",    href:"/dashboard/admin/member",    icon:Users },
      { label:"Verifikasi Anggota",href:"/dashboard/admin/verifikasi",icon:UserCheck },
    ]},
    { group:"Keuangan", items:[
      { label:"Input Simpanan", href:"/dashboard/admin/simpanan", icon:Wallet },
      { label:"Kelola Cicilan", href:"/dashboard/admin/cicilan",  icon:CreditCard },
      { label:"Kelola Gadai",   href:"/dashboard/admin/gadai",    icon:Landmark },
      { label:"Voucher",        href:"/dashboard/admin/voucher",  icon:Ticket },
    ]},
    { group:"Konten", items:[
      { label:"Kelola Produk", href:"/dashboard/admin/promo",  icon:Upload },
      { label:"Berita",       href:"/dashboard/admin/berita", icon:Newspaper },
      { label:"Chat",         href:"/dashboard/admin/chat",   icon:MessageSquare },
    ]},
    { group:"Akun", items:[
      { label:"Profil Saya", href:"/dashboard/profil", icon:UserCircle },
    ]},
  ],
  member: [
    { group:"Utama", items:[
      { label:"Dashboard",  href:"/dashboard/member",          icon:LayoutDashboard },
      { label:"Harga Emas", href:"/dashboard/member/harga",    icon:Coins },
      { label:"Produk",     href:"/dashboard/member/promo",    icon:Package },
    ]},
    { group:"Keuangan", items:[
      { label:"Simpanan",    href:"/dashboard/member/simpanan", icon:Wallet },
      { label:"Buyback Emas",href:"/dashboard/member/buyback",  icon:Coins },
      { label:"Gadai",       href:"/dashboard/member/gadai",    icon:Landmark },
      { label:"Cicilan",     href:"/dashboard/member/cicilan",  icon:CreditCard },
    ]},
    { group:"Transaksi", items:[
      { label:"Ajukan Transaksi", href:"/dashboard/member/request",  icon:Send },
      { label:"Histori",          href:"/dashboard/member/histori",  icon:History },
      { label:"Laporan Saya",     href:"/dashboard/member/laporan",  icon:FileSpreadsheet },
    ]},
  ],
};

interface SidebarProps { mobileOpen: boolean; onMobileClose: () => void; }

function SidebarInner({ collapsed, onToggle, onClose }: { collapsed: boolean; onToggle: () => void; onClose: () => void }) {
  const { user, logout } = useAuthStore();
  const siteName = useSiteName();
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
            <img src="/logo.jpg" alt="KE" style={{ width:30, height:30, objectFit:"cover", borderRadius:"50%" }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display="none"; }}
            />
            <div>
              <div className="text-gold-gradient" style={{ fontWeight:900, fontSize:".82rem", lineHeight:1, letterSpacing:".02em" }}>{siteName.toUpperCase()}</div>
              <div style={{ fontSize:".65rem", color:"rgba(255,255,255,0.3)", textTransform:"capitalize", marginTop:3 }}>{role} Panel</div>
            </div>
          </div>
        )}
        {collapsed && (
          <img src="/logo.jpg" alt="KE" style={{ width:30, height:30, objectFit:"cover", borderRadius:"50%" }}
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

