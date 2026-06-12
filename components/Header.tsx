import React from "react";
"use client";
import Link from "next/link";

export default function Header() {
  return (
    <header style={{ background: "#050508", borderBottom: "1px solid rgba(200,169,110,0.2)", padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Link href="/" style={{ color: "#c8a96e", textDecoration: "none", fontSize: "18px", fontWeight: "bold", fontFamily: "Georgia, serif" }}>
        AcadémIA Pro
      </Link>
      <nav style={{ display: "flex", gap: "24px" }}>
        <Link href="/formations" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px" }}>Formations</Link>
        <Link href="/seances" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px" }}>Séances</Link>
        <Link href="/packs" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px" }}>Packs</Link>
        <Link href="/blog" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px" }}>Blog</Link>
        <Link href="/contact" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px" }}>Contact</Link>
      </nav>
      <Link href="/dashboard" style={{ background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", padding: "8px 20px", borderRadius: "8px", textDecoration: "none", fontSize: "14px", fontWeight: "bold" }}>
        Mon espace
      </Link>
    </header>
  );
}
