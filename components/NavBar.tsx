"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const T = {
  fr: { formations: "Formations", seances: "Séances", blog: "Blog", tarifs: "Tarifs", contact: "Contact", partenaire: "Partenaire", connexion: "Se connecter", demarrer: "Démarrer", pack: "Pour les organismes de formation", crm: "CRM", lms: "LMS" },
  en: { formations: "Courses", seances: "Sessions", blog: "Blog", tarifs: "Pricing", contact: "Contact", partenaire: "Affiliate", connexion: "Sign in", demarrer: "Get Started", pack: "For training providers", crm: "CRM", lms: "LMS" },
  es: { formations: "Cursos", seances: "Sesiones", blog: "Blog", tarifs: "Precios", contact: "Contacto", partenaire: "Afiliado", connexion: "Iniciar sesión", demarrer: "Comenzar", pack: "Para organismos de formación", crm: "CRM", lms: "LMS" },
  pt: { formations: "Cursos", seances: "Sessoes", blog: "Blog", tarifs: "Preços", contact: "Contato", partenaire: "Afiliado", connexion: "Entrar", demarrer: "Comecar", pack: "Para organismos de formação", crm: "CRM", lms: "LMS" },
  de: { formations: "Kurse", seances: "Sitzungen", blog: "Blog", tarifs: "Preise", contact: "Kontakt", partenaire: "Partner", connexion: "Anmelden", demarrer: "Loslegen", pack: "Für Bildungsanbieter", crm: "CRM", lms: "LMS" },
  ar: { formations: "الدورات", seances: "الجلسات", blog: "المدونة", tarifs: "الأسعار", contact: "اتصل", partenaire: "شريك", connexion: "تسجيل الدخول", demarrer: "ابدأ", pack: "لمؤسسات التدريب", crm: "CRM", lms: "LMS" },
  he: { formations: "קורסים", seances: "פגישות", blog: "בלוג", tarifs: "מחירים", contact: "צור קשר", partenaire: "שותף", connexion: "התחברות", demarrer: "התחל", pack: "לארגוני הכשרה", crm: "CRM", lms: "LMS" },
};

// L ESPACE DE TRAVAIL DU CABINET.
const CHEMINS_COMPTABLE = [
  "/admin/compliance",
  "/admin/mr-comptable",
];

// LES PAGES PUBLIQUES DE MRCOMPTABLE.FR.
//
// Elles portent DEJA leur propre en-tete. NavBar ne doit rien afficher
// dessus. Tester le chemin ne suffit pas : le middleware sert
// /comptable/tenue sous mrcomptable.fr/tenue, et le chemin vu ici est
// alors « /tenue ». On teste donc le DOMAINE, pas seulement le chemin.
const PAGES_PUBLIQUES_COMPTABLE = [
  "/",
  "/inscription",
  "/facture-electronique",
  "/rapprochement-bancaire",
  "/lecture-des-pieces",
  "/tenue",
  "/declarations",
  "/relance-justificatifs",
  "/blog",
  "/contact",
  "/cgv",
  "/mentions",
];

const LOGO_COMPTABLE = "/IMG_4100.jpeg";

function estComptable(chemin) {
  for (const p of CHEMINS_COMPTABLE) {
    if (chemin === p || chemin.indexOf(p + "/") === 0) return true;
  }
  return false;
}

function estPagePubliqueComptable(chemin) {
  for (const p of PAGES_PUBLIQUES_COMPTABLE) {
    if (chemin === p) return true;
    if (p !== "/" && chemin.indexOf(p + "/") === 0) return true;
  }
  return false;
}

export default function NavBar() {
  const [langue, setLangue] = useState("fr");
  const [hote, setHote] = useState("");
  const chemin = usePathname() || "";

  useEffect(() => {
    const saved = localStorage.getItem("langue") || "fr";
    setLangue(saved);
    setHote(window.location.hostname.toLowerCase());
  }, []);

  function changerLangue(l) {
    localStorage.setItem("langue", l);
    setLangue(l);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", l);
    window.location.href = url.toString();
  }

  const t = (cle) => T[langue]?.[cle] || T["fr"][cle] || cle;

  const surMrComptable = hote.indexOf("mrcomptable.fr") >= 0;

  // MARQUE BLANCHE. Sur la vitrine d un organisme client, notre barre ne
  // doit pas apparaitre.
  if (chemin.indexOf("/of/") === 0) return null;

  if (chemin === "/comptable" || chemin.indexOf("/comptable/") === 0) return null;
  if (surMrComptable && estPagePubliqueComptable(chemin)) return null;

  const barre = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 40px",
    background: "rgba(5,5,8,0.95)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid rgba(200,169,110,0.15)",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  };

  const lienMarque = {
    color: "#c8a96e",
    fontFamily: "Georgia,serif",
    fontSize: "20px",
    fontWeight: "bold",
    textDecoration: "none",
  };

  const lienMenu = {
    color: "rgba(255,255,255,0.7)",
    textDecoration: "none",
    fontSize: "14px",
    whiteSpace: "nowrap",
  };

  // ---- Espace de travail comptable ---------------------------------------
  if (estComptable(chemin) || surMrComptable) {
    return (
      <header style={{ ...barre, padding: "0 30px", background: "#000" }}>
        <a
          href="/admin/compliance/tableau-de-bord"
          style={{ display: "block", textDecoration: "none", flexShrink: 0, overflow: "hidden", lineHeight: 0 }}
        >
          <img
            src={LOGO_COMPTABLE}
            alt="Mr. Comptable"
            style={{
              width: "400px",
              maxWidth: "40vw",
              height: "auto",
              display: "block",
              margin: "-4px",
              clipPath: "inset(4px)",
            }}
          />
        </a>
        <nav style={{ display: "flex", gap: "18px", flexWrap: "wrap", justifyContent: "center" }}>
          <a href="/admin/compliance/tableau-de-bord" style={lienMenu}>Tableau de bord</a>
          <a href="/admin/compliance/societes" style={lienMenu}>Mes dossiers</a>
          <a href="/admin/compliance/saisie" style={lienMenu}>Saisie</a>
          <a href="/admin/compliance/pieces" style={lienMenu}>Pièces</a>
          <a href="/admin/compliance/acces-clients" style={lienMenu}>Espaces clients</a>
          <a href="/admin/compliance/tva" style={lienMenu}>TVA</a>
          <a href="/admin/compliance/teledec" style={lienMenu}>Télétransmissions</a>
        </nav>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexShrink: 0 }}>
          <a href="/admin/compliance/ma-societe" style={{ color: "#c8a96e", border: "1px solid rgba(200,169,110,0.45)", padding: "8px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap" }}>
            Mon cabinet
          </a>
        </div>
      </header>
    );
  }

  // ---- Vitrine AcadéMIA Pro ---------------------------------------------
  //
  // TOUTE L OFFRE EST VISIBLE : offre aux organismes, Mr. Qualiopi, CRM,
  // LMS. Un seul onglet nomme pour un public — « Pour les organismes de
  // formation » — laisse entendre que tout le reste s adresse au particulier.
  //
  // L ONGLET ADMIN MENE AU TABLEAU DE BORD. Sans lui, il fallait retenir
  // l adresse par coeur pour retrouver ses propres depenses ou son CRM.
  // L acces reste protege par la session : un visiteur qui appuie dessus
  // sans etre connecte est renvoye vers la connexion.
  return (
    <header style={barre}>
      <a href="/" style={lienMarque}>
        AcadémIA Pro
      </a>
      <nav style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
        <a href={"/catalogue?lang=" + langue} style={lienMenu}>{t("formations")}</a>
        <a href={"/seances?lang=" + langue} style={lienMenu}>{t("seances")}</a>
        <a href="/blog" style={lienMenu}>{t("blog")}</a>
        <a href="/tarifs" style={lienMenu}>{t("tarifs")}</a>
        <a href="/contact" style={lienMenu}>{t("contact")}</a>
        <a href="/pack" style={{ ...lienMenu, color: "#c8a96e" }}>{t("pack")}</a>
        <a href="/qualiopi" style={lienMenu}>Mr. Qualiopi</a>
        <a href="/espace-prive?p=crm" style={lienMenu}>{t("crm")}</a>
        <a href="/espace-prive?p=lms" style={lienMenu}>{t("lms")}</a>
        <a href="/admin" style={{ ...lienMenu, color: "#c8a96e", fontWeight: "bold" }}>Admin</a>
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
          <option value="he">🇮🇱 HE</option>
          </select>
        <a href="/connexion" style={{ color: "#c8a96e", border: "1px solid rgba(200,169,110,0.45)", padding: "8px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap" }}>
          {t("connexion")}
        </a>
        <a href="/login" style={{ background: "linear-gradient(135deg,#c8a96e,#a07840)", color: "#050508", padding: "8px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap" }}>
          {t("demarrer")}
        </a>
      </div>
    </header>
  );
}
