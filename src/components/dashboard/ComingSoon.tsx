"use client";

import { Wrench } from "lucide-react";

interface Props {
  title?: string;
}

export default function ComingSoon({ title }: Props) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: 320, textAlign: "center", padding: 40,
    }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.22)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <Wrench style={{ width: 28, height: 28, color: "#8B6010" }} />
      </div>
      {title && (
        <h2 style={{ color: "#2D1B00", fontWeight: 700, fontSize: "1.1rem", marginBottom: 8 }}>{title}</h2>
      )}
      <p style={{ color: "rgba(101,67,14,0.55)", fontSize: ".9rem", marginBottom: 6 }}>Halaman sedang dalam pengembangan</p>
      <p style={{ color: "rgba(101,67,14,0.35)", fontSize: ".8rem" }}>Fitur ini akan tersedia segera</p>
    </div>
  );
}
