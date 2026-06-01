"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption { value: string; label: string; }

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

/**
 * Dropdown custom (bukan <select> native) supaya popup-nya bisa di-styling
 * gelap di semua OS/browser — native <select> di Windows mengabaikan CSS.
 */
export default function Select({ value, onChange, options, placeholder = "Pilih...", style, disabled }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 10, padding: "10px 14px", color: selected ? "#fff" : "rgba(255,255,255,0.4)",
          fontSize: ".9rem", outline: "none", cursor: disabled ? "not-allowed" : "pointer",
          boxSizing: "border-box", textAlign: "left", opacity: disabled ? 0.6 : 1, ...style,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown style={{ width: 16, height: 16, color: "rgba(255,255,255,0.4)", flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 1000,
            background: "#1a1a1a", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 10,
            boxShadow: "0 12px 32px rgba(0,0,0,0.6)", maxHeight: 240, overflowY: "auto", padding: 4,
          }}
        >
          {options.map(o => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                  background: active ? "rgba(212,175,55,0.15)" : "transparent", border: "none",
                  borderRadius: 7, padding: "9px 12px", color: active ? "#D4AF37" : "rgba(255,255,255,0.8)",
                  fontSize: ".88rem", cursor: "pointer", textAlign: "left",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.08)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <span>{o.label}</span>
                {active && <Check style={{ width: 14, height: 14, flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
