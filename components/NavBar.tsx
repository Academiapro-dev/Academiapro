"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const T = {
  fr: { formations: "Formations", seances: "Séances", blog: "Blog", tarifs: "Tarifs", contact: "Contact", partenaire: "Partenaire", connexion: "Se connecter", demarrer: "Démarrer" },
  en: { formations: "Courses", seances: "Sessions", blog: "Blog", tarifs: "Pricing", contact: "Contact", partenaire: "Affiliate", connexion: "Sign in", demarrer: "Get Started" },
  es: { formations: "Cursos", seances: "Sesiones", blog: "Blog", tarifs: "Precios", contact: "Contacto", partenaire: "Afiliado", connexion: "Iniciar sesión", demarrer: "Comenzar" },
  pt: { formations: "Cursos", seances: "Sessoes", blog: "Blog", tarifs: "Preços", contact: "Contato", partenaire: "Afiliado", connexion: "Entrar", demarrer: "Comecar" },
  de: { formations: "Kurse", seances: "Sitzungen", blog: "Blog", tarifs: "Preise", contact: "Kontakt", partenaire: "Partner", connexion: "Anmelden", demarrer: "Loslegen" },
  ar: { formations: "الدورات", seances: "الجلسات", blog: "المدونة", tarifs: "الأسعار", contact: "اتصل", partenaire: "شريك", connexion: "تسجيل الدخول", demarrer: "ابدأ" },
  he: { formations: "קורסים", seances: "פגישות", blog: "בלוג", tarifs: "מחירים", contact: "צור קשר", partenaire: "שותף", connexion: "התחברות", demarrer: "התחל" },
};

// LES ECRANS DE MR. COMPTABLE.
//
// Un cabinet comptable ne doit pas lire « Formations », « Séances » ni
// « Blog » dans son espace de travail : il a paye un logiciel de
// comptabilite, pas un catalogue de formation. La barre change donc de
// marque et de menu des qu on entre chez lui.
const CHEMINS_COMPTABLE = [
  "/comptable",
  "/admin/compliance",
  "/admin/mr-comptable",
];

// Le logo de la marque, en or sur fond noir : les memes teintes que le site,
// donc aucun rectangle blanc au milieu du bandeau.
const LOGO_COMPTABLE = "/IMG_4100.jpeg";

function estComptable(chemin) {
  for (const p of CHEMINS_COMPTABLE) {
    if (chemin === p || chemin.indexOf(p + "/") === 0) return true;
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

  // MARQUE BLANCHE. Sur la vitrine d un organisme client, notre barre ne doit
  // pas apparaitre : le visiteur y verrait la marque du fournisseur avant
  // celle de son prestataire, avec un lien pour partir chez nous.
  if (chemin.indexOf("/of/") === 0) return null;

  // Les pages de vitrine de Mr. Comptable portent deja leur propre en-tete :
  // deux barres superposees feraient doublon.
  if (chemin === "/comptable" || chemin.indexOf("/comptable/") === 0) return null;

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
  };

  // ---- Espace de travail comptable : marque et menu propres --------------
  // On y arrive soit par mrcomptable.fr, soit depuis academiapro.fr sur un
  // ecran comptable. Dans les deux cas le client doit lire sa marque.
  if (estComptable(chemin) || hote.indexOf("mrcomptable.fr") >= 0) {
    return (
      <header style={barre}>
        <a href="/admin/compliance/tableau-de-bord" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img
            src={LOGO_COMPTABLE}
            alt="Mr. Comptable"
            style={{ height: "46px", width: "auto", display: "block" }}
          />
        </a>
        <nav style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <a href="/admin/compliance/tableau-de-bord" style={lienMenu}>Tableau de bord</a>
          <a href="/admin/compliance/societes" style={lienMenu}>Mes dossiers</a>
          <a href="/admin/compliance/saisie" style={lienMenu}>Saisie</a>
          <a href="/admin/compliance/pieces" style={lienMenu}>Pièces</a>
          <a href="/admin/compliance/acces-clients" style={lienMenu}>Espaces clients</a>
          <a href="/admin/compliance/tva" style={lienMenu}>TVA</a>
          <a href="/admin/compliance/teledec" style={lienMenu}>Télétransmissions</a>
        </nav>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <a href="/admin/compliance/ma-societe" style={{ color: "#c8a96e", border: "1px solid rgba(200,169,110,0.45)", padding: "8px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "14px" }}>
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
      <nav style={{ display: "flex", gap: "25px" }}>
        <a href={"/catalogue?lang=" + langue} style={lienMenu}>{t("formations")}</a>
        <a href={"/seances?lang=" + langue} style={lienMenu}>{t("seances")}</a>
        <a href="/blog" style={lienMenu}>{t("blog")}</a>
        <a href="/tarifs" style={lienMenu}>{t("tarifs")}</a>
        <a href="/partenaire" style={lienMenu}>{t("partenaire")}</a>
        <a href="/contact" style={lienMenu}>{t("contact")}</a>
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
        <a href="/connexion" style={{ color: "#c8a96e", border: "1px solid rgba(200,169,110,0.45)", padding: "8px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "14px" }}>
          {t("connexion")}
        </a>
        <a href="/login" style={{ background: "linear-gradient(135deg,#c8a96e,#a07840)", color: "#050508", padding: "8px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "14px" }}>
          {t("demarrer")}
        </a>
      </div>
    </header>
  );
}
