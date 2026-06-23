"use client";
import { useState, useEffect } from "react";

const T = {
  fr: {
    hero_titre: "Formez-vous avec votre agent IA personnel",
    hero_sub: "265 formations certifiantes · Agent IA 24h/24 · Seances therapeutiques",
    btn_formations: "Voir les formations",
    btn_ebook: "E-book gratuit",
    btn_demarrer: "Demarrer",
    stat1: "Formations certifiantes",
    stat2: "Competences validees",
    stat3: "Therapeutes IA",
    stat4: "Garantie satisfait",
    nav_formations: "Formations", nav_seances: "Seances", nav_packs: "Packs", nav_competences: "Competences", nav_blog: "Blog", nav_contact: "Contact",
    footer_desc: "La plateforme de formation propulsee par l IA. 265 formations certifiantes.",
    voir_formation: "Voir la formation", voir_tout: "Voir les 265 formations", nos_formations: "Nos formations phares",
    nos_formations_sub: "Certification AcadeMIA Pro · Paiement 3x sans frais · Garantie 30 jours",
  },
  en: {
    hero_titre: "Train with your personal AI agent",
    hero_sub: "265 certified courses · AI Agent 24/7 · Therapeutic sessions",
    btn_formations: "View courses", btn_ebook: "Free e-book", btn_demarrer: "Get Started",
    stat1: "Certified courses", stat2: "Validated skills", stat3: "AI Therapists", stat4: "Satisfaction guarantee",
    nav_formations: "Courses", nav_seances: "Sessions", nav_packs: "Packs", nav_competences: "Skills", nav_blog: "Blog", nav_contact: "Contact",
    footer_desc: "The AI-powered training platform. 265 certified courses.",
    voir_formation: "View course", voir_tout: "View all 265 courses", nos_formations: "Our featured courses",
    nos_formations_sub: "AcadeMIA Pro Certification · 3x payment · 30-day guarantee",
  },
  es: {
    hero_titre: "Formese con su agente IA personal",
    hero_sub: "265 cursos certificados · Agente IA 24h · Sesiones terapeuticas",
    btn_formations: "Ver cursos", btn_ebook: "E-book gratis", btn_demarrer: "Comenzar",
    stat1: "Cursos certificados", stat2: "Habilidades validadas", stat3: "Terapeutas IA", stat4: "Garantia satisfaccion",
    nav_formations: "Cursos", nav_seances: "Sesiones", nav_packs: "Packs", nav_competences: "Habilidades", nav_blog: "Blog", nav_contact: "Contacto",
    footer_desc: "La plataforma de formacion impulsada por IA. 265 cursos certificados.",
    voir_formation: "Ver curso", voir_tout: "Ver los 265 cursos", nos_formations: "Nuestros cursos destacados",
    nos_formations_sub: "Certificacion AcadeMIA Pro · Pago 3x · Garantia 30 dias",
  },
  pt: {
    hero_titre: "Forme-se com seu agente IA pessoal",
    hero_sub: "265 cursos certificados · Agente IA 24h · Sessoes terapeuticas",
    btn_formations: "Ver cursos", btn_ebook: "E-book gratuito", btn_demarrer: "Comecar",
    stat1: "Cursos certificados", stat2: "Competencias validadas", stat3: "Terapeutas IA", stat4: "Garantia de satisfacao",
    nav_formations: "Cursos", nav_seances: "Sessoes", nav_packs: "Packs", nav_competences: "Competencias", nav_blog: "Blog", nav_contact: "Contato",
    footer_desc: "A plataforma de formacao impulsionada por IA. 265 cursos certificados.",
    voir_formation: "Ver curso", voir_tout: "Ver os 265 cursos", nos_formations: "Nossos cursos em destaque",
    nos_formations_sub: "Certificacao AcadeMIA Pro · Pagamento 3x · Garantia 30 dias",
  },
  de: {
    hero_titre: "Weiterbilden mit Ihrem personlichen KI-Agenten",
    hero_sub: "265 zertifizierte Kurse · KI-Agent 24h · Therapeutische Sitzungen",
    btn_formations: "Kurse ansehen", btn_ebook: "Kostenloses E-Book", btn_demarrer: "Loslegen",
    stat1: "Zertifizierte Kurse", stat2: "Validierte Kompetenzen", stat3: "KI-Therapeuten", stat4: "Zufriedenheitsgarantie",
    nav_formations: "Kurse", nav_seances: "Sitzungen", nav_packs: "Pakete", nav_competences: "Kompetenzen", nav_blog: "Blog", nav_contact: "Kontakt",
    footer_desc: "Die KI-gestutzte Weiterbildungsplattform. 265 zertifizierte Kurse.",
    voir_formation: "Kurs ansehen", voir_tout: "Alle 265 Kurse ansehen", nos_formations: "Unsere Top-Kurse",
    nos_formations_sub: "AcadeMIA Pro Zertifizierung · 3x Zahlung · 30-Tage-Garantie",
  },
  ar: {
    hero_titre: "تدرب مع وكيل الذكاء الاصطناعي الشخصي",
    hero_sub: "265 دورة معتمدة · وكيل ذكاء اصطناعي 24/24 · جلسات علاجية",
    btn_formations: "عرض الدورات", btn_ebook: "كتاب مجاني", btn_demarrer: "ابدأ",
    stat1: "دورات معتمدة", stat2: "مهارات معتمدة", stat3: "معالجون AI", stat4: "ضمان الرضا",
    nav_formations: "الدورات", nav_seances: "الجلسات", nav_packs: "الباقات", nav_competences: "المهارات", nav_blog: "المدونة", nav_contact: "اتصل",
    footer_desc: "منصة التدريب المدعومة بالذكاء الاصطناعي. 265 دورة معتمدة.",
    voir_formation: "عرض الدورة", voir_tout: "عرض جميع الدورات 265", nos_formations: "دوراتنا المميزة",
    nos_formations_sub: "شهادة AcadeMIA Pro · دفع 3x · ضمان 30 يوماً",
  },
};

export default function HomePage() {
  const [langue, setLangue] = useState("fr");

  useEffect(() => {
    const saved = localStorage.getItem("langue") || "fr";
    setLangue(saved);
  }, []);

  const t = (cle) => T[langue]?.[cle] || T["fr"][cle] || cle;

  function changerLangue(l) {
    localStorage.setItem("langue", l);
    setLangue(l);
    window.location.reload();
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", direction: langue === "he" || langue === "ar" ? "rtl" : "ltr" }}>

      <header style={{ background: "rgba(5,5,8,0.98)", borderBottom: "1px solid rgba(200,169,110,0.2)", padding: "0 40px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: "0", zIndex: "100" }}>
        <a href="/" style={{ color: "#c8a96e", textDecoration: "none", fontSize: "20px", fontWeight: "bold" }}>AcadémIA Pro</a>
        <nav style={{ display: "flex", gap: "28px" }}>
          <a href="/catalogue" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" }}>{t("nav_formations")}</a>
          <a href="/seances" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" }}>{t("nav_seances")}</a>
          <a href="/catalogue" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" }}>{t("nav_packs")}</a>
          <a href="/catalogue" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" }}>{t("nav_competences")}</a>
          <a href="/blog" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" }}>{t("nav_blog")}</a>
          <a href="/contact" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" }}>{t("nav_contact")}</a>
        </nav>
        <select value={langue} onChange={e => changerLangue(e.target.value)}
          style={{ background: "rgba(200,169,110,0.15)", border: "1px solid rgba(200,169,110,0.4)", color: "#c8a96e", padding: "6px 10px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>
          <option value="fr">🇫🇷 FR</option>
          <option value="en">🇬🇧 EN</option>
          <option value="es">🇪🇸 ES</option>
          <option value="pt">🇧🇷 PT</option>
          <option value="de">🇩🇪 DE</option>
          <option value="ar">🇸🇦 AR</option>
        </select>
        <a href="/login" style={{ background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", padding: "10px 24px", borderRadius: "8px", textDecoration: "none", fontSize: "15px", fontWeight: "bold" }}>{t("btn_demarrer")}</a>
      </header>

      <section style={{ padding: "100px 40px", textAlign: "center", maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ color: "#c8a96e", fontSize: "15px", letterSpacing: "4px", margin: "0 0 24px" }}>LA PLATEFORME DE FORMATION IA</p>
        <h1 style={{ fontSize: "52px", fontWeight: "bold", margin: "0 0 24px", lineHeight: "1.2" }}>{t("hero_titre")}</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "18px", margin: "0 0 40px", lineHeight: "1.7" }}>{t("hero_sub")}</p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/catalogue" style={{ background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", padding: "16px 36px", borderRadius: "10px", textDecoration: "none", fontSize: "16px", fontWeight: "bold" }}>{t("btn_formations")}</a>
          <a href="/lead-magnets/ebook" style={{ background: "transparent", color: "#c8a96e", padding: "16px 36px", borderRadius: "10px", textDecoration: "none", fontSize: "16px", border: "1px solid #c8a96e" }}>{t("btn_ebook")}</a>
        </div>
      </section>

      <section style={{ background: "#1a1a2e", padding: "60px 40px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "32px", textAlign: "center" }}>
          {[{ nb: "265", label: t("stat1") }, { nb: "100+", label: t("stat2") }, { nb: "5", label: t("stat3") }, { nb: "30j", label: t("stat4") }].map((s) => (
            <div key={s.label}>
              <p style={{ color: "#c8a96e", fontSize: "40px", fontWeight: "bold", margin: "0 0 8px" }}>{s.nb}</p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", margin: "0" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "80px 40px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "15px", letterSpacing: "3px", margin: "0 0 12px" }}>CATALOGUE</p>
          <h2 style={{ fontSize: "36px", margin: "0 0 12px" }}>{t("nos_formations")}</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px" }}>{t("nos_formations_sub")}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
          {[
            { code: "F128", titre: "Expert Claude et IA Generative", prix: "690€", cat: "IA" },
            { code: "F129", titre: "No-Code et Automatisation IA", prix: "790€", cat: "IA" },
            { code: "F130", titre: "Apps Natives avec IA", prix: "990€", cat: "IA" },
            { code: "F235", titre: "Marketing Digital x IA", prix: "890€", cat: "Marketing" },
            { code: "F001", titre: "Management et Leadership", prix: "490€", cat: "Business" },
            { code: "F003", titre: "Gestion du Stress et Bien-etre", prix: "390€", cat: "Bien-etre" },
          ].map((f) => (
            <div key={f.code} style={{ background: "#1a1a2e", borderRadius: "12px", padding: "24px", border: "1px solid rgba(200,169,110,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ color: "#c8a96e", fontSize: "14px" }}>{f.code}</span>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>{f.cat}</span>
              </div>
              <h3 style={{ color: "#fff", fontSize: "15px", margin: "0 0 16px", lineHeight: "1.4" }}>{f.titre}</h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "bold" }}>{f.prix}</span>
                <span style={{ background: "#050508", color: "#c8a96e", padding: "3px 10px", borderRadius: "12px", fontSize: "14px" }}>Certifiant</span>
              </div>
              <a href={"/formation/" + f.code.toLowerCase()} style={{ display: "block", background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: "bold", textAlign: "center", textDecoration: "none" }}>{t("voir_formation")}</a>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <a href="/catalogue" style={{ color: "#c8a96e", textDecoration: "none", fontSize: "15px", border: "1px solid #c8a96e", padding: "12px 32px", borderRadius: "8px" }}>{t("voir_tout")}</a>
        </div>
      </section>

      <footer style={{ background: "#050508", borderTop: "1px solid rgba(200,169,110,0.2)", padding: "60px 40px 40px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "40px", marginBottom: "40px" }}>
          <div>
            <h3 style={{ color: "#c8a96e", fontSize: "18px", margin: "0 0 16px" }}>AcadémIA Pro</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", lineHeight: "1.7", margin: "0" }}>{t("footer_desc")}</p>
          </div>
          <div>
            <h4 style={{ color: "#fff", fontSize: "15px", margin: "0 0 16px" }}>{t("nav_formations")}</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href="/catalogue" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Catalogue complet</a>
              <a href="/catalogue" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Nos packs</a>
              <a href="/tarifs" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Tarifs</a>
            </div>
          </div>
          <div>
            <h4 style={{ color: "#fff", fontSize: "15px", margin: "0 0 16px" }}>{t("nav_seances")}</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href="/seances" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Toutes les specialites</a>
              <a href="/abonnements" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Abonnements</a>
              <a href="/classe-virtuelle" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Classes virtuelles</a>
            </div>
          </div>
          <div>
            <h4 style={{ color: "#fff", fontSize: "15px", margin: "0 0 16px" }}>Ressources</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href="/blog" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>{t("nav_blog")}</a>
              <a href="/faq" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>FAQ</a>
              <a href="/communaute" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Communaute</a>
              <a href="/a-propos" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>A propos</a>
            </div>
          </div>
          <div>
            <h4 style={{ color: "#fff", fontSize: "15px", margin: "0 0 16px" }}>Legal</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href="/cgv" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>CGV</a>
              <a href="/politique-confidentialite" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Confidentialite</a>
              <a href="/mentions-legales" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Mentions legales</a>
              <a href="/garantie" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Garantie 30 jours</a>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(200,169,110,0.1)", paddingTop: "24px", textAlign: "center" }}>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "15px", margin: "0" }}>© 2026 AcadémIA Pro · Certification AcadémIA Pro · Tous droits reserves</p>
        </div>
      </footer>

    </div>
  );
}
