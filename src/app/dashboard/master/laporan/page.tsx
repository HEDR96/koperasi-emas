"use client";

import { useState } from "react";
import {
  FileSpreadsheet, Download, Calendar, Coins, CreditCard,
  Landmark, ArrowDownCircle, Wallet, RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

/* ─── helpers ─── */
const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

function tglIndo(s: string | null) {
  if (!s) return "-";
  return new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function toISOStart(d: string) { return d + "T00:00:00.000Z"; }
function toISOEnd(d: string)   { return d + "T23:59:59.999Z"; }

/* ─── helpers ─── */
function cleanPhone(v: string | null): string {
  if (!v) return "-";
  return String(v).replace(/\D/g, "");
}

// Format notes baru: "{catatan user} | [Ongkir: 5000, Diskon: 2000]"
// Format lama:       "Disetujui. Ongkir: Rp 5.000, Diskon: Rp 10.000. Total final: Rp 100.000."
function parseNotes(notes: string | null): { ongkir: number; diskon: number; catatan: string } {
  if (!notes) return { ongkir: 0, diskon: 0, catatan: "-" };

  // Format baru: bracket [Ongkir: x, Diskon: y]
  const bracketMatch = notes.match(/\[Ongkir:\s*([\d]+),\s*Diskon:\s*([\d]+)\]/i);
  if (bracketMatch) {
    const catatan = notes.replace(/\s*\|\s*\[Ongkir:[^\]]+\]/, "").trim() || "-";
    return { ongkir: Number(bracketMatch[1]), diskon: Number(bracketMatch[2]), catatan };
  }

  // Format lama: "Disetujui. Ongkir: Rp 5.000, Diskon: Rp 10.000. Total final: ..."
  const ongkirMatch = notes.match(/Ongkir:\s*Rp\s*([\d.]+)/i);
  const diskonMatch = notes.match(/Diskon:\s*Rp\s*([\d.]+)/i);
  const ongkir = ongkirMatch ? Number(ongkirMatch[1].replace(/\./g, "")) : 0;
  const diskon = diskonMatch ? Number(diskonMatch[1].replace(/\./g, "")) : 0;
  const cleaned = notes
    .replace(/Disetujui\.\s*/i, "")
    .replace(/Ongkir:\s*Rp\s*[\d.,]+,?\s*/i, "")
    .replace(/Diskon:\s*Rp\s*[\d.,]+\.?\s*/i, "")
    .replace(/Total final:\s*Rp\s*[\d.,]+\.?\s*/i, "")
    .replace(/Pengajuan [^.]+\.\s*/i, "")
    .trim().replace(/^[|,\s]+|[|,\s]+$/g, "").trim();
  return { ongkir, diskon, catatan: cleaned || "-" };
}

/* ─── Excel download via SheetJS ─── */
// colFmt per kolom:
//   "text"    → string, no warning
//   "phone"   → strip non-digit, string
//   "gram"    → number, format 0.00
//   "rupiah"  → number, format #,##0
//   "number"  → number plain
//   "auto"    → biarkan
async function downloadXLSX(
  sheetName: string,
  headers: string[],
  rows: (string | number | null)[][],
  filename: string,
  colFmt: ("text" | "phone" | "gram" | "rupiah" | "number" | "auto")[] = [],
) {
  const XLSX = await import("xlsx");

  const normalizedRows = rows.map(row =>
    row.map((cell, ci) => {
      const f = colFmt[ci] ?? "auto";
      if (f === "phone")  return cleanPhone(String(cell ?? ""));
      if (f === "gram")   return cell === null || cell === "" ? 0 : Number(Number(cell).toFixed(2));
      if (f === "rupiah") return cell === null || cell === "" || cell === "-" ? 0 : Number(cell) || 0;
      if (f === "number") return cell === null || cell === "" ? 0 : Number(cell) || 0;
      if (f === "text")   return String(cell ?? "");
      return cell;
    })
  );

  const ws = XLSX.utils.aoa_to_sheet([headers, ...normalizedRows]);
  const totalRows = normalizedRows.length;

  // Format & type tiap kolom
  colFmt.forEach((f, ci) => {
    const col = XLSX.utils.encode_col(ci);
    for (let r = 1; r <= totalRows; r++) {
      const addr = col + (r + 1);
      if (!ws[addr]) return;
      if (f === "phone" || f === "text") {
        ws[addr].t = "s"; ws[addr].z = "@";
      } else if (f === "gram") {
        ws[addr].t = "n"; ws[addr].z = "0.00";
      } else if (f === "rupiah") {
        ws[addr].t = "n"; ws[addr].z = '#,##0';
      }
    }
  });

  // Auto column width
  ws["!cols"] = headers.map((h, ci) => ({
    wch: Math.min(Math.max(h.length, ...normalizedRows.map(r => String(r[ci] ?? "").length)) + 2, 45),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

/* ─── report configs ─── */
type ReportType = "transaksi" | "buyback" | "cicilan" | "gadai" | "simpanan";

const REPORTS: { id: ReportType; label: string; icon: any; color: string; desc: string }[] = [
  { id:"transaksi", label:"Transaksi Beli Emas", icon:Coins,          color:"#D4AF37", desc:"Semua transaksi beli emas dalam periode" },
  { id:"buyback",   label:"Buyback Emas",        icon:ArrowDownCircle,color:"#34d399", desc:"Semua transaksi buyback dalam periode" },
  { id:"cicilan",   label:"Cicilan Emas",         icon:CreditCard,     color:"#a78bfa", desc:"Data cicilan emas dalam periode" },
  { id:"gadai",     label:"Gadai Emas",           icon:Landmark,       color:"#60a5fa", desc:"Data gadai emas dalam periode" },
  { id:"simpanan",  label:"Simpanan",             icon:Wallet,         color:"#f59e0b", desc:"Data simpanan anggota dalam periode" },
];

/* ─── helpers filter: pakai transaction_date jika ada, fallback created_at ─── */
function applyDateFilter(query: any, from: string, to: string) {
  // Baris dengan transaction_date terisi → filter transaction_date
  // Baris dengan transaction_date null → filter created_at sebagai fallback
  return query.or(
    `and(transaction_date.gte.${toISOStart(from)},transaction_date.lte.${toISOEnd(to)}),` +
    `and(transaction_date.is.null,created_at.gte.${toISOStart(from)},created_at.lte.${toISOEnd(to)})`
  );
}

/* ─── fetch functions ─── */
async function fetchTransaksi(from: string, to: string) {
  const base = (supabase.from("transactions") as any)
    .select("id, type, amount, gram, status, payment_method, notes, transaction_date, created_at, profiles:profiles!user_id(name, phone)")
    .eq("type", "buy")
    .limit(5000);
  const { data } = await applyDateFilter(base, from, to).order("transaction_date", { ascending: true, nullsFirst: false });
  return (data || []).sort((a: any, b: any) => {
    const da = a.transaction_date || a.created_at;
    const db = b.transaction_date || b.created_at;
    return da < db ? -1 : 1;
  });
}

async function fetchBuyback(from: string, to: string) {
  const base = (supabase.from("transactions") as any)
    .select("id, type, amount, gram, status, payment_method, notes, transaction_date, created_at, profiles:profiles!user_id(name, phone)")
    .eq("type", "buyback")
    .limit(5000);
  const { data } = await applyDateFilter(base, from, to).order("transaction_date", { ascending: true, nullsFirst: false });
  return (data || []).sort((a: any, b: any) => {
    const da = a.transaction_date || a.created_at;
    const db = b.transaction_date || b.created_at;
    return da < db ? -1 : 1;
  });
}

async function fetchCicilan(from: string, to: string) {
  const base = (supabase.from("installments") as any)
    .select("id, product_name, total_amount, monthly_amount, down_payment, tenor, paid_installments, status, transaction_date, created_at, profiles:profiles!user_id(name, phone)")
    .limit(5000);
  const { data } = await applyDateFilter(base, from, to).order("transaction_date", { ascending: true, nullsFirst: false });
  return (data || []).sort((a: any, b: any) => {
    const da = a.transaction_date || a.created_at;
    const db = b.transaction_date || b.created_at;
    return da < db ? -1 : 1;
  });
}

async function fetchGadai(from: string, to: string) {
  const base = (supabase.from("gadai") as any)
    .select("id, dana_cair, gram_setara, tenor, angsuran_per_bulan, sisa_tagihan, nilai_jaminan, status, keterangan, transaction_date, created_at, profiles:profiles!user_id(name, phone)")
    .limit(5000);
  const { data } = await applyDateFilter(base, from, to).order("transaction_date", { ascending: true, nullsFirst: false });
  return (data || []).sort((a: any, b: any) => {
    const da = a.transaction_date || a.created_at;
    const db = b.transaction_date || b.created_at;
    return da < db ? -1 : 1;
  });
}

async function fetchSimpanan(from: string, to: string) {
  const base = (supabase.from("simpanan") as any)
    .select("id, type, amount, status, description, transaction_date, created_at, profiles:profiles!user_id(name, phone)")
    .limit(5000);
  const { data } = await applyDateFilter(base, from, to).order("transaction_date", { ascending: true, nullsFirst: false });
  return (data || []).sort((a: any, b: any) => {
    const da = a.transaction_date || a.created_at;
    const db = b.transaction_date || b.created_at;
    return da < db ? -1 : 1;
  });
}

/* ─── Excel builders ─── */
type ColFmt = "auto" | "text" | "phone" | "gram" | "rupiah" | "number";

async function xlsxTransaksi(rows: any[], from: string, to: string) {
  const headers = ["No","Tanggal Transaksi","Nama Anggota","No HP","Gram","Harga Total (Rp)","Ongkir (Rp)","Diskon (Rp)","Metode Bayar","Keterangan","Status","Tgl Input"];
  const colFmt: ColFmt[] = ["auto","auto","auto","phone","gram","rupiah","rupiah","rupiah","auto","auto","auto","auto"];
  const data = rows.map((r, i) => {
    const { ongkir, diskon, catatan } = parseNotes(r.notes);
    return [
      i + 1, tglIndo(r.transaction_date || r.created_at),
      r.profiles?.name || "-", r.profiles?.phone || "-",
      r.gram, r.amount, ongkir, diskon, r.payment_method || "-", catatan, r.status, tglIndo(r.created_at),
    ];
  });
  await downloadXLSX("Beli Emas", headers, data, `Laporan_Beli_Emas_${from}_sd_${to}.xlsx`, colFmt);
}

async function xlsxBuyback(rows: any[], from: string, to: string) {
  const headers = ["No","Tanggal Transaksi","Nama Anggota","No HP","Gram","Dana Cair (Rp)","Ongkir (Rp)","Diskon (Rp)","Keterangan","Status","Tgl Input"];
  const colFmt: ColFmt[] = ["auto","auto","auto","phone","gram","rupiah","rupiah","rupiah","auto","auto","auto"];
  const data = rows.map((r, i) => {
    const { ongkir, diskon, catatan } = parseNotes(r.notes);
    return [
      i + 1, tglIndo(r.transaction_date || r.created_at),
      r.profiles?.name || "-", r.profiles?.phone || "-",
      r.gram, r.amount, ongkir, diskon, catatan, r.status, tglIndo(r.created_at),
    ];
  });
  await downloadXLSX("Buyback", headers, data, `Laporan_Buyback_${from}_sd_${to}.xlsx`, colFmt);
}

async function xlsxCicilan(rows: any[], from: string, to: string) {
  const headers = ["No","Tanggal Transaksi","Nama Anggota","No HP","Produk","Total (Rp)","DP (Rp)","Angsuran/Bln (Rp)","Tenor","Terbayar","Status","Tgl Input"];
  const fmt: ColFmt[] = ["auto","auto","auto","phone","auto","rupiah","rupiah","rupiah","number","number","auto","auto"];
  const data = rows.map((r, i) => [
    i + 1, tglIndo(r.transaction_date || r.created_at),
    r.profiles?.name || "-", r.profiles?.phone || "-",
    r.product_name || "-", r.total_amount, r.down_payment ?? 0,
    r.monthly_amount, r.tenor, r.paid_installments ?? 0, r.status, tglIndo(r.created_at),
  ]);
  await downloadXLSX("Cicilan Emas", headers, data, `Laporan_Cicilan_${from}_sd_${to}.xlsx`, fmt);
}

async function xlsxGadai(rows: any[], from: string, to: string) {
  const headers = ["No","Tanggal Transaksi","Nama Anggota","No HP","Dana Cair (Rp)","Gram Setara","Nilai Jaminan (Rp)","Tenor","Angsuran/Bln (Rp)","Sisa Tagihan (Rp)","Keterangan","Status","Tgl Input"];
  const fmt: ColFmt[] = ["auto","auto","auto","phone","rupiah","gram","rupiah","number","rupiah","rupiah","auto","auto","auto"];
  const data = rows.map((r, i) => [
    i + 1, tglIndo(r.transaction_date || r.created_at),
    r.profiles?.name || "-", r.profiles?.phone || "-",
    r.dana_cair, r.gram_setara, r.nilai_jaminan,
    r.tenor, r.angsuran_per_bulan, r.sisa_tagihan, r.keterangan || "-", r.status, tglIndo(r.created_at),
  ]);
  await downloadXLSX("Gadai Emas", headers, data, `Laporan_Gadai_${from}_sd_${to}.xlsx`, fmt);
}

async function xlsxSimpanan(rows: any[], from: string, to: string) {
  const headers = ["No","Tanggal Transaksi","Nama Anggota","No HP","Jumlah (Rp)","Keterangan","Status","Tgl Input"];
  const fmt: ColFmt[] = ["auto","auto","auto","phone","rupiah","auto","auto","auto"];
  const data = rows.map((r, i) => [
    i + 1, tglIndo(r.transaction_date || r.created_at),
    r.profiles?.name || "-", r.profiles?.phone || "-",
    r.amount, r.description || "-", r.status, tglIndo(r.created_at),
  ]);
  await downloadXLSX("Simpanan", headers, data, `Laporan_Simpanan_${from}_sd_${to}.xlsx`, fmt);
}

/* ─── summary stats ─── */
function summary(type: ReportType, rows: any[]) {
  if (!rows.length) return null;
  if (type === "transaksi" || type === "buyback") {
    const total  = rows.reduce((s, r) => s + (r.amount || 0), 0);
    const totalGram = rows.reduce((s, r) => s + (Number(r.gram) || 0), 0);
    return { total, totalGram, count: rows.length };
  }
  if (type === "cicilan") {
    const total = rows.reduce((s, r) => s + (r.total_amount || 0), 0);
    return { total, count: rows.length };
  }
  if (type === "gadai") {
    const total = rows.reduce((s, r) => s + (r.dana_cair || 0), 0);
    return { total, count: rows.length };
  }
  if (type === "simpanan") {
    const total = rows.reduce((s, r) => s + (r.amount || 0), 0);
    return { total, count: rows.length };
  }
  return null;
}

/* ─── component ─── */
export default function LaporanPage() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + "01";

  const [from, setFrom]   = useState(firstOfMonth);
  const [to, setTo]       = useState(today);
  const [active, setActive] = useState<ReportType | null>(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows]   = useState<any[]>([]);
  const [fetched, setFetched] = useState<ReportType | null>(null);

  async function handleDownload(type: ReportType) {
    if (!from || !to) return;
    setLoading(true);
    setActive(type);
    try {
      let data: any[] = [];
      if (type === "transaksi") data = await fetchTransaksi(from, to);
      if (type === "buyback")   data = await fetchBuyback(from, to);
      if (type === "cicilan")   data = await fetchCicilan(from, to);
      if (type === "gadai")     data = await fetchGadai(from, to);
      if (type === "simpanan")  data = await fetchSimpanan(from, to);

      setRows(data);
      setFetched(type);

      if (!data.length) { setLoading(false); return; }

      if (type === "transaksi") await xlsxTransaksi(data, from, to);
      if (type === "buyback")   await xlsxBuyback(data, from, to);
      if (type === "cicilan")   await xlsxCicilan(data, from, to);
      if (type === "gadai")     await xlsxGadai(data, from, to);
      if (type === "simpanan")  await xlsxSimpanan(data, from, to);
    } catch {}
    setLoading(false);
  }

  const sum = fetched ? summary(fetched, rows) : null;
  const reportInfo = REPORTS.find(r => r.id === (active || fetched));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Header */}
      <div>
        <h1 style={{ color:"#fff", fontSize:"1.4rem", fontWeight:700, margin:0 }}>Laporan</h1>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".85rem", margin:"4px 0 0" }}>
          Download laporan transaksi dalam format Excel (.xlsx)
        </p>
      </div>

      {/* Filter periode */}
      <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"20px 22px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
          <Calendar style={{ width:16, height:16, color:"#D4AF37" }} />
          <p style={{ color:"#D4AF37", fontWeight:700, fontSize:".88rem", margin:0 }}>Filter Periode</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".75rem" }}>Dari Tanggal</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:9, padding:"9px 12px", color:"#fff", fontSize:".88rem", outline:"none", colorScheme:"dark" }} />
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".75rem" }}>Sampai Tanggal</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:9, padding:"9px 12px", color:"#fff", fontSize:".88rem", outline:"none", colorScheme:"dark" }} />
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <label style={{ color:"rgba(255,255,255,0.45)", fontSize:".75rem" }}>Shortcut</label>
            <div style={{ display:"flex", gap:6 }}>
              {[
                { label:"Bulan ini",   fn: () => { setFrom(firstOfMonth); setTo(today); } },
                { label:"3 bln",       fn: () => { const d = new Date(); d.setMonth(d.getMonth()-3); setFrom(d.toISOString().slice(0,10)); setTo(today); } },
                { label:"Tahun ini",   fn: () => { setFrom(today.slice(0,4)+"-01-01"); setTo(today); } },
              ].map(s => (
                <button key={s.label} onClick={s.fn}
                  style={{ background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:7, padding:"6px 10px", color:"#D4AF37", fontSize:".75rem", cursor:"pointer", whiteSpace:"nowrap" }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pilih laporan & download */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14 }}>
        {REPORTS.map(r => {
          const Icon = r.icon;
          const isActive = active === r.id && loading;
          return (
            <div key={r.id}
              style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${r.color}25`, borderRadius:16, padding:"18px 20px", display:"flex", flexDirection:"column", gap:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ width:38, height:38, borderRadius:11, background:`${r.color}18`, border:`1px solid ${r.color}30`, display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
                  <Icon style={{ width:18, height:18, color:r.color }} />
                </span>
                <div>
                  <p style={{ color:"#fff", fontWeight:700, fontSize:".9rem", margin:0 }}>{r.label}</p>
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".74rem", margin:"2px 0 0" }}>{r.desc}</p>
                </div>
              </div>
              <button onClick={() => handleDownload(r.id)} disabled={isActive || !from || !to}
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, width:"100%", padding:"10px", borderRadius:10,
                  background: isActive ? "rgba(255,255,255,0.05)" : `${r.color}18`,
                  border:`1px solid ${r.color}35`,
                  color: isActive ? "rgba(255,255,255,0.4)" : r.color,
                  cursor: isActive ? "wait" : "pointer", fontWeight:700, fontSize:".84rem", transition:"all .2s" }}>
                {isActive
                  ? <><RefreshCw style={{ width:14, height:14, animation:"spin 1s linear infinite" }} /> Memuat...</>
                  : <><Download style={{ width:14, height:14 }} /> Download Excel</>}
              </button>
            </div>
          );
        })}
      </div>

      {/* Hasil preview singkat */}
      {fetched && !loading && (
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"18px 22px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
            <FileSpreadsheet style={{ width:16, height:16, color:reportInfo?.color || "#fff" }} />
            <p style={{ color:reportInfo?.color || "#fff", fontWeight:700, fontSize:".9rem", margin:0 }}>
              {reportInfo?.label} — {tglIndo(from)} s/d {tglIndo(to)}
            </p>
          </div>
          {rows.length === 0 ? (
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:".88rem", margin:0 }}>Tidak ada data dalam periode ini.</p>
          ) : (
            <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
              <div>
                <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".73rem", margin:"0 0 3px" }}>Total Data</p>
                <p style={{ color:"#fff", fontWeight:800, fontSize:"1.2rem", margin:0 }}>{sum?.count ?? rows.length} baris</p>
              </div>
              {sum && "total" in sum && (
                <div>
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".73rem", margin:"0 0 3px" }}>Total Nominal</p>
                  <p style={{ color:reportInfo?.color || "#D4AF37", fontWeight:800, fontSize:"1.2rem", margin:0 }}>{fmt(sum.total)}</p>
                </div>
              )}
              {sum && "totalGram" in sum && (
                <div>
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:".73rem", margin:"0 0 3px" }}>Total Gram</p>
                  <p style={{ color:"#D4AF37", fontWeight:800, fontSize:"1.2rem", margin:0 }}>{(sum.totalGram as number).toFixed(2)} gr</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
