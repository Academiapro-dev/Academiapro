"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const T = {
  fr: { formations: "Formations", seances: "Séances", blog: "Blog", tarifs: "Tarifs", contact: "Contact", connexion: "Se connecter", demarrer: "Démarrer", solutions: "Nos solutions", espacePro: "Espace pro" },
  en: { formations: "Courses", seances: "Sessions", blog: "Blog", tarifs: "Pricing", contact: "Contact", connexion: "Sign in", demarrer: "Get Started", solutions: "Our solutions", espacePro: "Pro area" },
  es: { formations: "Cursos", seances: "Sesiones", blog: "Blog", tarifs: "Precios", contact: "Contacto", connexion: "Iniciar sesión", demarrer: "Comenzar", solutions: "Soluciones", espacePro: "Área pro" },
  pt: { formations: "Cursos", seances: "Sessoes", blog: "Blog", tarifs: "Preços", contact: "Contato", connexion: "Entrar", demarrer: "Comecar", solutions: "Soluções", espacePro: "Área pro" },
  de: { formations: "Kurse", seances: "Sitzungen", blog: "Blog", tarifs: "Preise", contact: "Kontakt", connexion: "Anmelden", demarrer: "Loslegen", solutions: "Lösungen", espacePro: "Pro-Bereich" },
  ar: { formations: "الدورات", seances: "الجلسات", blog: "المدونة", tarifs: "الأسعار", contact: "اتصل", connexion: "تسجيل الدخول", demarrer: "ابدأ", solutions: "حلولنا", espacePro: "مساحة احترافية" },
  he: { formations: "קורסים", seances: "פגישות", blog: "בלוג", tarifs: "מחירים", contact: "צור קשר", connexion: "התחברות", demarrer: "התחל", solutions: "הפתרונות שלנו", espacePro: "אזור מקצועי" },
};

// LE MENU DEROULANT DES SOLUTIONS METIER.
//
// Chaque entree mene a SA PROPRE PAGE VITRINE, publique et redigee pour
// etre trouvee dans un moteur de recherche. L outil, lui, reste derriere la
// session : c est « Espace pro » qui y mene.
//
// LA DISTINCTION EST DEMANDEE PAR JACQUES : « CRM » et « LMS » decrivent le
// produit a qui ne le connait pas ; « Espace pro » ouvre la porte a qui est
// deja client. Sans elle, un visiteur pouvait croire que la page reservee
// etait tout ce qui existait.
const SOLUTIONS = [
  { nom: "Pour les organismes de formation", href: "/pack" },
  { nom: "Mr. Qualiopi", href: "/qualiopi" },
  { nom: "Le CRM", href: "/crm" },
  { nom: "La plateforme d'apprentissage (LMS)", href: "/plateforme-apprentissage" },
  { nom: "Mr. Comptable", href: "/comptable" },
];

// L ESPACE DE TRAVAIL DU CABINET.
const CHEMINS_COMPTABLE = [
  "/admin/compliance",
  "/admin/mr-comptable",
];

// LES PAGES PUBLIQUES DE MRCOMPTABLE.FR.
//
// Elles portent DEJA leur propre en-tete. Tester le chemin ne suffit pas :
// le middleware sert /comptable/tenue sous mrcomptable.fr/tenue, et le
// chemin vu ici est alors « /tenue ». On teste donc le DOMAINE.
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
          {/* 🚨 LE CRM SE VOIT DEPUIS TOUS LES ECRANS DU CABINET — 23/08.
              Le mot dit au collaborateur, et surtout au prospect qui regarde
              par-dessus l epaule, que le logiciel ne s arrete pas a la
              production comptable : il gere aussi la relation client. Cache
              en bas d une page, il ne servait a personne. */}
          <a href="/admin/compliance/crm" style={lienMenu}>CRM</a>
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
  return (
    <header style={barre}>
      <a href="/" style={lienMarque}>
        AcadémIA Pro
      </a>
      <nav style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
        <a href={"/catalogue?lang=" + langue} style={lienMenu}>{t("formations")}</a>
        <a href={"/seances?lang=" + langue} style={lienMenu}>{t("seances")}</a>
        <a href="/blog" style={lienMenu}>{t("blog")}</a>
        <a href="/tarifs" style={lienMenu}>{t("tarifs")}</a>
        <a href="/contact" style={lienMenu}>{t("contact")}</a>

        {/* Le menu deroulant est en CSS pur — details et summary — pour ne
            dependre d aucun etat : il fonctionne meme si le JavaScript
            n a pas encore ete charge. */}
        <details style={{ position: "relative" }}>
          <summary style={{ ...lienMenu, color: "#c8a96e", cursor: "pointer", listStyle: "none", fontWeight: "bold" }}>
            {t("solutions")} ▾
          </summary>
          <div style={{
            position: "absolute",
            top: "26px",
            left: 0,
            background: "#0d0d16",
            border: "1px solid rgba(200,169,110,0.3)",
            borderRadius: "10px",
            padding: "10px 0",
            minWidth: "290px",
            zIndex: 100,
          }}>
            {SOLUTIONS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                style={{ display: "block", padding: "9px 20px", color: "rgba(255,255,255,0.75)", textDecoration: "none", fontSize: "14.5px", whiteSpace: "nowrap" }}
              >
                {s.nom}
              </a>
            ))}
          </div>
        </details>

        <a href="/espace-prive" style={lienMenu}>{t("espacePro")}</a>
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
