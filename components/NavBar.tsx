"use client";
import { useState, useEffect } from "react";

const T = {
  fr: { formations: "Formations", seances: "Seances", blog: "Blog", contact: "Contact", demarrer: "Demarrer" },
  en: { formations: "Courses", seances: "Sessions", blog: "Blog", contact: "Contact", demarrer: "Get Started" },
  es: { formations: "Cursos", seances: "Sesiones", blog: "Blog", contact: "Contacto", demarrer: "Comenzar" },
  pt: { formations: "Cursos", seances: "Sessoes", blog: "Blog", contact: "Contato", demarrer: "Comecar" },
  de: { formations: "Kurse", seances: "Sitzungen", blog: "Blog", contact: "Kontakt", demarrer: "Loslegen" },
  ar: { formations: "الدورات", seances: "الجلسات", blog: "المدونة", contact: "اتصل", demarrer: "ابدأ" },
};

export default function NavBar() {
  const [langue, setLangue] = useState("fr");

  useEffect(() => {
    const saved = localStorage.getItem("langue") || "fr";
    setLangue(saved);
  }, []);

  function changerLangue(l) {
    localStorage.setItem("langue", l);
    setLangue(l);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", l);
    window.location.href = url.toString();
  }

  const t = (cle) => T[langue]?.[cle] || T["fr"][cle] || cle;

  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 40px", background: "rgba(5,5,8,0.95)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(200,169,110,0.15)", position: "sticky", top: 0, zIndex: 1000 }}>
      <a href="/" style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "20px", fontWeight: "bold", textDecoration: "none" }}>
        AcadémIA Pro
      </a>
      <nav style={{ display: "flex", gap: "25px" }}>
        <a href={"/catalogue?lang=" + langue} style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px" }}>{t("formations")}</a>
        <a href={"/seances?lang=" + langue} style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px" }}>{t("seances")}</a>
        <a href="/blog" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px" }}>{t("blog")}</a>
        <a href="/contact" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "14px" }}>{t("contact")}</a>
      </nav>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <select
          value={langue}
          onChange={e => changerLangue(e.target.value)}
          style={{ background: "rgba(200,169,110,0.15)", border: "1px solid rgba(200,169,110,0.4)", color: "#c8a96e", padding: "6px 10px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}
        >
          <option value="fr">🇫🇷 FR</option>
          <option value="en">🇬🇧 EN</option>
          <option value="es">🇪🇸 ES</option>
          <option value="pt">🇧🇷 PT</option>
          <option value="de">🇩🇪 DE</option>
          <option value="ar">🇸🇦 AR</option>
          </select>
        <a href="/login" style={{ background: "linear-gradient(135deg,#c8a96e,#a07840)", color: "#050508", padding: "8px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "14px" }}>
          {t("demarrer")}
        </a>
      </div>
    </header>
  );
}
