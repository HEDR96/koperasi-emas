import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "gold" | "success" | "warning" | "danger" | "info" | "default";
}

export function Badge({ className, variant = "default", children, style, ...props }: BadgeProps) {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex", alignItems: "center",
    padding: "2px 10px", borderRadius: 20,
    fontSize: ".7rem", fontWeight: 600,
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    gold:    { background:"rgba(212,175,55,.15)", color:"#D4AF37", border:"1px solid rgba(212,175,55,.3)" },
    success: { background:"rgba(34,197,94,.15)",  color:"#4ade80", border:"1px solid rgba(34,197,94,.3)" },
    warning: { background:"rgba(234,179,8,.15)",  color:"#fbbf24", border:"1px solid rgba(234,179,8,.3)" },
    danger:  { background:"rgba(239,68,68,.15)",  color:"#f87171", border:"1px solid rgba(239,68,68,.3)" },
    info:    { background:"rgba(96,165,250,.15)", color:"#60a5fa", border:"1px solid rgba(96,165,250,.3)" },
    default: { background:"rgba(255,255,255,.08)", color:"rgba(255,255,255,.6)", border:"1px solid rgba(255,255,255,.1)" },
  };

  return (
    <span className={className} style={{ ...baseStyle, ...variantStyles[variant], ...style }} {...props}>
      {children}
    </span>
  );
}
