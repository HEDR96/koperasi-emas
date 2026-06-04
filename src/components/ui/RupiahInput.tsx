"use client";

import React from "react";

// Format angka jadi pemisah ribuan ala Indonesia: 1000000 -> "1.000.000".
export const fmtRibuan = (v: string | number | null | undefined) => {
  const digits = String(v ?? "").replace(/\D/g, "");
  return digits ? new Intl.NumberFormat("id-ID").format(Number(digits)) : "";
};
// Ambil hanya digit dari teks bermask (buang titik, "Rp", spasi, dll).
export const onlyDigits = (v: string) => v.replace(/\D/g, "");

interface RupiahInputProps {
  value: string;
  onValueChange: (digits: string) => void;
  style?: React.CSSProperties;
  wrapperStyle?: React.CSSProperties;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Input nominal Rupiah: menampilkan pemisah ribuan + prefix "Rp",
 * tapi mengirim digit murni (string angka) lewat onValueChange.
 */
export default function RupiahInput({
  value, onValueChange, style, wrapperStyle, placeholder = "0", disabled,
}: RupiahInputProps) {
  return (
    <div style={{ position: "relative", width: "100%", ...wrapperStyle }}>
      <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)", fontSize: ".85rem", pointerEvents: "none" }}>Rp</span>
      <input
        inputMode="numeric"
        value={fmtRibuan(value)}
        disabled={disabled}
        onChange={e => onValueChange(onlyDigits(e.target.value))}
        style={{ ...style, paddingLeft: 36 }}
        placeholder={placeholder}
      />
    </div>
  );
}
