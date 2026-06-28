"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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

export default function Select({ value, onChange, options, placeholder = "Pilih...", style, disabled }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const updateRect = useCallback(() => {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
  }, []);

  function handleOpen() {
    if (disabled) return;
    updateRect();
    setOpen(o => !o);
  }

  useEffect(() => {
    if (!open) return;
    function onClose(e: MouseEvent) {
      if (
        btnRef.current && btnRef.current.contains(e.target as Node) ||
        dropRef.current && dropRef.current.contains(e.target as Node)
      ) return;
      setOpen(false);
    }
    function onScroll() { updateRect(); }
    document.addEventListener("mousedown", onClose);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onClose);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, updateRect]);

  const selected = options.find(o => o.value === value);

  // Posisi dropdown: buka ke bawah atau ke atas tergantung ruang
  const spaceBelow = rect ? window.innerHeight - rect.bottom : 0;
  const dropUp = rect ? spaceBelow < 220 && rect.top > 220 : false;
  const dropStyle: React.CSSProperties = rect ? {
    position: "fixed",
    left: rect.left,
    width: rect.width,
    zIndex: 99999,
    ...(dropUp
      ? { bottom: window.innerHeight - rect.top + 4 }
      : { top: rect.bottom + 4 }),
    background: "#1a1a1a",
    border: "1px solid rgba(212,175,55,0.25)",
    borderRadius: 10,
    boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
    maxHeight: 240,
    overflowY: "auto",
    padding: 4,
  } : {};

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
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

      {open && rect && typeof document !== "undefined" && createPortal(
        <div ref={dropRef} style={dropStyle}>
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
        </div>,
        document.body
      )}
    </div>
  );
}
