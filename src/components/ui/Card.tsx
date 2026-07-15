import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "gold" | "dark" | "plain";
  glow?: boolean;
  hover?: boolean;
}

const variantStyles: Record<string, React.CSSProperties> = {
  glass: {
    background: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    border: "1px solid rgba(201,162,39,0.22)",
    borderRadius: 20,
    padding: 24,
  },
  gold: {
    background: "linear-gradient(rgba(255,255,255,0.85),rgba(255,255,255,0.85)) padding-box, linear-gradient(135deg,rgba(201,162,39,0.5),rgba(201,162,39,0.1),rgba(201,162,39,0.5)) border-box",
    border: "1px solid transparent",
    borderRadius: 20,
    padding: 24,
  },
  dark: {
    background: "rgba(255,255,255,0.7)",
    border: "1px solid rgba(201,162,39,0.2)",
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
        ...(glow && { boxShadow:"0 0 25px rgba(201,162,39,0.3)" }),
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
  return <h3 className={className} style={{ fontSize:"1rem", fontWeight:700, color:"#2D1B00", ...style }} {...props}>{children}</h3>;
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props}>{children}</div>;
}
