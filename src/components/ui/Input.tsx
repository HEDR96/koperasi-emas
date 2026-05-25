import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, suffix, style, ...props }, ref) => {
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {label && (
          <label style={{ fontSize:".82rem", fontWeight:500, color:"rgba(255,255,255,0.6)" }}>{label}</label>
        )}
        <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
          {prefix && (
            <span style={{ position:"absolute", left:12, color:"rgba(255,255,255,0.35)", fontSize:".85rem", pointerEvents:"none" }}>{prefix}</span>
          )}
          <input
            ref={ref}
            className="input-gold"
            style={{
              width:"100%", borderRadius:12,
              padding: prefix ? "10px 14px 10px 30px" : "10px 14px",
              fontSize:".875rem",
              ...(suffix && { paddingRight:40 }),
              ...(error && { borderColor:"rgba(239,68,68,0.5)" }),
              ...style,
            }}
            {...props}
          />
          {suffix && (
            <span style={{ position:"absolute", right:12, color:"rgba(255,255,255,0.35)", fontSize:".85rem", pointerEvents:"none" }}>{suffix}</span>
          )}
        </div>
        {error && <p style={{ fontSize:".75rem", color:"#f87171" }}>{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
