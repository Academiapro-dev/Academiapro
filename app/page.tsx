"use client";
import { useState, useEffect } from "react";




const T: Record<string, Record<string, string>> = {
  fr: {
    hero_titre: "Formez-vous avec votre agent IA personnel",
    hero_sub: "235 formations certifiantes · Agent IA 24h/24 · Seances therapeutiques",
    btn_formations: "Voir les formations",
    btn_ebook: "E-book gratuit",
    btn_demarrer: "Demarrer",
    stat1: "Formations certifiantes",
    stat2: "Competences validees",
    stat3: "Therapeutes IA",
    stat4: "Garantie satisfait",
    nav_formations: "Formations",
    nav_seances: "Seances",
    nav_packs: "Packs",
    nav_competences: "Competences",
    nav_blog: "Blog",
    nav_contact: "Contact",
    footer_desc: "La plateforme de formation propulsee par l IA. 235 formations certifiantes.",
    catalogue_titre: "Catalogue",
    catalogue_desc: "Decouvrez nos formations",
  },
  en: {
    hero_titre: "Learn with your personal AI agent",
    hero_sub: "235 certified courses · AI tutor 24/7 · Therapeutic sessions",
    btn_formations: "View courses",
    btn_ebook: "Free e-book",
    btn_demarrer: "Get Started",
    stat1: "Certified courses",
    stat2: "Validated skills",
    stat3: "AI Therapists",
    stat4: "Satisfaction guarantee",
    nav_formations: "Courses",
    nav_seances: "Sessions",
    nav_packs: "Packs",
    nav_competences: "Skills",
    nav_blog: "Blog",
    nav_contact: "Contact",
    footer_desc: "The AI-powered training platform. 235 certified courses.",
    catalogue_titre: "Catalog",
    catalogue_desc: "Discover our courses",
  },
  es: {
    hero_titre: "Formese con su agente IA personal",
    hero_sub: "235 cursos certificados · Tutor IA 24h · Sesiones terapeuticas",
    btn_formations: "Ver cursos",
    btn_ebook: "E-book gratis",
    btn_demarrer: "Comenzar",
    stat1: "Cursos certificados",
    stat2: "Habilidades validadas",
    stat3: "Terapeutas IA",
    stat4: "Garantia satisfaccion",
    nav_formations: "Cursos",
    nav_seances: "Sesiones",
    nav_packs: "Packs",
    nav_competences: "Habilidades",
    nav_blog: "Blog",
    nav_contact: "Contacto",
    footer_desc: "La plataforma de formacion impulsada por IA. 235 cursos certificados.",
    catalogue_titre: "Catalogo",
    catalogue_desc: "Descubra nuestros cursos",
  },
  ar: {
    hero_titre: "تدرب مع وكيل الذكاء الاصطناعي الشخصي",
    hero_sub: "235 دورة معتمدة · مدرس ذكاء اصطناعي · جلسات علاجية",
    btn_formations: "عرض الدورات",
    btn_ebook: "كتاب مجاني",
    btn_demarrer: "ابدأ",
    stat1: "دورات معتمدة",
    stat2: "مهارات معتمدة",
    stat3: "معالجون AI",
    stat4: "ضمان الرضا",
    nav_formations: "الدورات",
    nav_seances: "الجلسات",
    nav_packs: "الباقات",
    nav_competences: "المهارات",
    nav_blog: "المدونة",
    nav_contact: "اتصل",
    footer_desc: "منصة التدريب المدعومة بالذكاء الاصطناعي. 235 دورة معتمدة.",
    catalogue_titre: "الكتالوج",
    catalogue_desc: "اكتشف دوراتنا",
  },
  he: {
    hero_titre: "התאמן עם סוכן הבינה המלאכותית האישי שלך",
    hero_sub: "235 קורסים מוסמכים · מדריך AI 24/7 · פגישות טיפוליות",
    btn_formations: "צפה בקורסים",
    btn_ebook: "ספר חינמי",
    btn_demarrer: "התחל",
    stat1: "קורסים מוסמכים",
    stat2: "כישורים מאומתים",
    stat3: "מטפלים AI",
    stat4: "ערובת שביעות רצון",
    nav_formations: "קורסים",
    nav_seances: "פגישות",
    nav_packs: "חבילות",
    nav_competences: "כישורים",
    nav_blog: "בלוג",
    nav_contact: "צור קשר",
    footer_desc: "פלטפורמת ההכשרה המופעלת על ידי AI. 235 קורסים מוסמכים.",
    catalogue_titre: "קטלוג",
    catalogue_desc: "גלה את הקורסים שלנו",
  },
};

export default function HomePage() {
  const [langue, setLangue] = useState(() => typeof window !== "undefined" ? localStorage.getItem("langue") || "fr" : "fr");

  const t = (cle: string) => T[langue]?.[cle] || T["fr"][cle] || cle;

    return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif" }}>

      {/* HEADER */}
      <header style={{ background: "rgba(5,5,8,0.98)", borderBottom: "1px solid rgba(200,169,110,0.2)", padding: "0 40px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: "0", zIndex: "100" }}>
        <a href="/" style={{ color: "#c8a96e", textDecoration: "none", fontSize: "100+px", fontWeight: "bold" }}>AcadémIA Pro</a>
        <nav style={{ display: "flex", gap: "28px" }}>
          <a href="/catalogue" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" }}>{t('nav_formations')}</a>
          <a href="/seances" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" }}>{t('nav_seances')}</a>
          <a href="/catalogue" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" }}>{t('nav_packs')}</a>
          <a href="/catalogue" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" }}>{t('nav_competences')}</a>
          <a href="/blog" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" }}>{t('nav_blog')}</a>
          <a href="/contact" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" }}>{t('nav_contact')}</a>
        </nav>
        <select
          value={langue} onChange={e => { localStorage.setItem("langue", e.target.value); setLangue(e.target.value); window.location.reload(); }}
          style={{ background: "rgba(200,169,110,0.15)", border: "1px solid rgba(200,169,110,0.4)", color: "#c8a96e", padding: "6px 10px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}
        >
          <option value="fr">🇫🇷 FR</option>
          <option value="en">🇬🇧 EN</option>
          <option value="es">🇪🇸 ES</option>
          <option value="ar">🇸🇦 AR</option>
          <option value="he">🇮🇱 HE</option>
        </select>
        <a href="/login" style={{ background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", padding: "10px 24px", borderRadius: "8px", textDecoration: "none", fontSize: "15px", fontWeight: "bold" }}>{t('btn_demarrer')}</a>
      </header>

      {/* HERO */}
      <section style={{ padding: "100px 40px", textAlign: "center", maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ color: "#c8a96e", fontSize: "15px", letterSpacing: "4px", margin: "0 0 24px" }}>LA PLATEFORME DE FORMATION IA</p>
        <h1 style={{ fontSize: "52px", fontWeight: "bold", margin: "0 0 24px", lineHeight: "1.2" }}>{t('hero_titre')}</h1>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "18px", margin: "0 0 40px", lineHeight: "1.7" }}>{t('hero_sub')}</p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/catalogue" style={{ background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", padding: "16px 36px", borderRadius: "10px", textDecoration: "none", fontSize: "16px", fontWeight: "bold" }}>{t('btn_formations')}</a>
          <a href="/lead-magnets/ebook" style={{ background: "transparent", color: "#c8a96e", padding: "16px 36px", borderRadius: "10px", textDecoration: "none", fontSize: "16px", border: "1px solid #c8a96e" }}>{t('btn_ebook')}</a>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: "#1a1a2e", padding: "60px 40px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "32px", textAlign: "center" }}>
          {[
            { nb: "235", label: t("stat1") },
            { nb: "100+", label: t("stat2") },
            { nb: "5", label: t("stat3") },
            { nb: "30j", label: t("stat4") },
          ].map((s) => (
            <div key={s.label}>
              <p style={{ color: "#c8a96e", fontSize: "40px", fontWeight: "bold", margin: "0 0 8px" }}>{s.nb}</p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", margin: "0" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FORMATIONS */}
      <section style={{ padding: "80px 40px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p style={{ color: "#c8a96e", fontSize: "15px", letterSpacing: "3px", margin: "0 0 12px" }}>CATALOGUE</p>
          <h2 style={{ fontSize: "36px", margin: "0 0 12px" }}>Nos formations phares</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px" }}>Certification AcadémIA Pro · Paiement 3x sans frais · Garantie 30 jours</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
          {[
            { code: "F128", titre: "Expert Claude et IA Generative", prix: "690euro", cat: "IA" },
            { code: "F129", titre: "No-Code et Automatisation IA", prix: "790euro", cat: "IA" },
            { code: "F130", titre: "Apps Natives avec IA", prix: "990euro", cat: "IA" },
            { code: "F235", titre: "Marketing Digital x IA", prix: "890euro", cat: "Marketing" },
            { code: "F001", titre: "Management et Leadership", prix: "490euro", cat: "Business" },
            { code: "F003", titre: "Gestion du Stress et Bien-etre", prix: "390euro", cat: "Bien-etre" },
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
              <a href={"/formation/" + f.code.toLowerCase()} style={{ display: "block", background: "linear-gradient(135deg, #c8a96e, #a07840)", color: "#050508", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: "bold", textAlign: "center", textDecoration: "none" }}>Voir la formation</a>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <a href="/catalogue" style={{ color: "#c8a96e", textDecoration: "none", fontSize: "15px", border: "1px solid #c8a96e", padding: "12px 32px", borderRadius: "8px" }}>Voir les 235 formations</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#050508", borderTop: "1px solid rgba(200,169,110,0.2)", padding: "60px 40px 40px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "40px", marginBottom: "40px" }}>
          <div>
            <h3 style={{ color: "#c8a96e", fontSize: "18px", margin: "0 0 16px" }}>AcadémIA Pro</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", lineHeight: "1.7", margin: "0" }}>La plateforme de formation propulsee par l IA. 235 formations certifiantes · Agent IA 24h/24.</p>
          </div>
          <div>
            <h4 style={{ color: "#fff", fontSize: "15px", margin: "0 0 16px" }}>Formations</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href="/catalogue" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Catalogue complet</a>
              <a href="/catalogue" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Nos packs</a>
              <a href="/catalogue" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>{t('nav_competences')}</a>
              <a href="/tarifs" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Tarifs</a>
            </div>
          </div>
          <div>
            <h4 style={{ color: "#fff", fontSize: "15px", margin: "0 0 16px" }}>Seances</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href="/seances" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Toutes les specialites</a>
              <a href="/abonnements" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Abonnements</a>
              <a href="/classe-virtuelle" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>Classes virtuelles</a>
            </div>
          </div>
          <div>
            <h4 style={{ color: "#fff", fontSize: "15px", margin: "0 0 16px" }}>Ressources</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a href="/blog" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontSize: "13px" }}>{t('nav_blog')}</a>
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
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "15px", margin: "0" }}>2026 AcadémIA Pro · Certification AcadémIA Pro · Tous droits reserves</p>
        </div>
      </footer>

    </div>
  );
}