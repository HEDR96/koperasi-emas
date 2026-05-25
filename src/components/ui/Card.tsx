import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "gold" | "dark" | "plain";
  glow?: boolean;
  hover?: boolean;
}

const variantStyles: Record<string, React.CSSProperties> = {
  glass: {
    background: "rgba(14,14,14,0.75)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(212,175,55,0.15)",
    borderRadius: 20,
    padding: 24,
  },
  gold: {
    background: "linear-gradient(#0f0f0f,#0f0f0f) padding-box, linear-gradient(135deg,rgba(212,175,55,0.5),rgba(212,175,55,0.1),rgba(212,175,55,0.5)) border-box",
    border: "1px solid transparent",
    borderRadius: 20,
    padding: 24,
  },
  dark: {
    background: "#111",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 20,
    padding: 24,
  },
  plain: {
    borderRadius: 20,
    padding: 24,
  },
};

export function Card({ className, variant = "glass", glow, hover, children, style, ...props }: CardProps) {
  return (
    <div
      className={cn(hover && "card-hover", className)}
      style={{
        ...variantStyles[variant],
        ...(glow && { boxShadow:"0 0 25px rgba(212,175,55,0.4)" }),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, style, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={className} style={{ marginBottom:16, ...style }} {...props}>{children}</div>;
}

export function CardTitle({ className, children, style, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={className} style={{ fontSize:"1rem", fontWeight:700, color:"#fff", ...style }} {...props}>{children}</h3>;
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props}>{children}</div>;
}
