"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold" | "outline-gold" | "ghost" | "danger" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  fullWidth?: boolean;
}

const sizeMap = {
  sm:  { padding:"6px 14px",  fontSize:".8rem",   borderRadius:9  },
  md:  { padding:"9px 20px",  fontSize:".875rem", borderRadius:11 },
  lg:  { padding:"11px 28px", fontSize:"1rem",    borderRadius:13 },
  xl:  { padding:"14px 36px", fontSize:"1.05rem", borderRadius:14 },
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "gold", size = "md", loading, fullWidth, children, disabled, style, ...props }, ref) => {
    const sz = sizeMap[size];

    const base: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      fontWeight: 600,
      border: "none",
      cursor: disabled || loading ? "not-allowed" : "pointer",
      opacity: disabled || loading ? 0.5 : 1,
      position: "relative",
      overflow: "hidden",
      outline: "none",
      textDecoration: "none",
      whiteSpace: "nowrap",
      transition: "all .25s ease",
      width: fullWidth ? "100%" : undefined,
      ...sz,
    };

    const variants: Record<string, React.CSSProperties> = {
      gold: { background:"linear-gradient(135deg,#D4AF37 0%,#F5D060 50%,#B8960C 100%)", color:"#0a0a0a" },
      "outline-gold": { background:"transparent", border:"1px solid rgba(212,175,55,0.45)", color:"#D4AF37" },
      ghost: { background:"transparent", color:"rgba(255,255,255,0.7)" },
      danger: { background:"rgba(239,68,68,0.9)", color:"#fff" },
      dark: { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.75)" },
    };

    return (
      <button
        ref={ref}
        className={cn(variant === "gold" ? "btn-gold" : variant === "outline-gold" ? "btn-outline-gold" : "", className)}
        disabled={disabled || loading}
        style={{ ...base, ...variants[variant], ...style }}
        {...props}
      >
        {loading && <Loader2 style={{ width:15, height:15, animation:"spin .8s linear infinite" }} />}
        {children}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
