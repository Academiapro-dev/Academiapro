"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const T = {
  fr: { formations: "Formations", seances: "S\u00e9ances", blog: "Blog", tarifs: "Tarifs", contact: "Contact", connexion: "Se connecter", demarrer: "D\u00e9marrer", solutions: "Nos solutions", espacePro: "Espace pro", monEspace: "Mon espace" },
  en: { formations: "Courses", seances: "Sessions", blog: "Blog", tarifs: "Pricing", contact: "Contact", connexion: "Sign in", demarrer: "Get Started", solutions: "Our solutions", espacePro: "Pro area", monEspace: "My space" },
  es: { formations: "Cursos", seances: "Sesiones", blog: "Blog", tarifs: "Precios", contact: "Contacto", connexion: "Iniciar sesi\u00f3n", demarrer: "Comenzar", solutions: "Soluciones", espacePro: "\u00c1rea pro", monEspace: "Mi espacio" },
  pt: { formations: "Cursos", seances: "Sessoes", blog: "Blog", tarifs: "Pre\u00e7os", contact: "Contato", connexion: "Entrar", demarrer: "Comecar", solutions: "Solu\u00e7\u00f5es", espacePro: "\u00c1rea pro", monEspace: "Meu espa\u00e7o" },
  de: { formations: "Kurse", seances: "Sitzungen", blog: "Blog", tarifs: "Preise", contact: "Kontakt", connexion: "Anmelden", demarrer: "Loslegen", solutions: "L\u00f6sungen", espacePro: "Pro-Bereich", monEspace: "Mein Bereich" },
  ar: { formations: "\u0627\u0644\u062f\u0648\u0631\u0627\u062a", seances: "\u0627\u0644\u062c\u0644\u0633\u0627\u062a", blog: "\u0627\u0644\u0645\u062f\u0648\u0646\u0629", tarifs: "\u0627\u0644\u0623\u0633\u0639\u0627\u0631", contact: "\u0627\u062a\u0635\u0644", connexion: "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644", demarrer: "\u0627\u0628\u062f\u0623", solutions: "\u062d\u0644\u0648\u0644\u0646\u0627", espacePro: "\u0645\u0633\u0627\u062d\u0629 \u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629", monEspace: "\u0645\u0633\u0627\u062d\u062a\u064a" },
  he: { formations: "\u05e7\u05d5\u05e8\u05e1\u05d9\u05dd", seances: "\u05e4\u05d2\u05d9\u05e9\u05d5\u05ea", blog: "\u05d1\u05dc\u05d5\u05d2", tarifs: "\u05de\u05d7\u05d9\u05e8\u05d9\u05dd", contact: "\u05e6\u05d5\u05e8 \u05e7\u05e9\u05e8", connexion: "\u05d4\u05ea\u05d7\u05d1\u05e8\u05d5\u05ea", demarrer: "\u05d4\u05ea\u05d7\u05dc", solutions: "\u05d4\u05e4\u05ea\u05e8\u05d5\u05e0\u05d5\u05ea \u05e9\u05dc\u05e0\u05d5", espacePro: "\u05d0\u05d6\u05d5\u05e8 \u05de\u05e7\u05e6\u05d5\u05e2\u05d9", monEspace: "\u05d4\u05d0\u05d6\u05d5\u05e8 \u05e9\u05dc\u05d9" },
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

// 🚨 MYSTERLLC — DECISION DE JACQUES DU 31/08.
//
// Mr Compliance est un PRODUIT SEPARE de Mr Comptable, vendu sous la marque
// MysterLLC (mysterllc.com) a des gestionnaires de LLC pour expatries.
// « Quelqu un qui propose des LLC, l expatriation, les ouvertures de compte
// bancaire ne sera pas interesse par un logiciel de comptabilite
// francaise. » La barre Mr Comptable — « logiciel de comptabilite pour
// cabinet comptable » — serait incoherente au-dessus d un portefeuille de
// LLC.
//
// LES DEUX PRODUITS PARTAGENT POURTANT LE PREFIXE /admin/compliance : les
// ecrans comptables (saisie, TVA, liasses…) y vivent aussi. La separation
// se fait donc sur DEUX CRITERES :
//   - le DOMAINE : tout ecran de travail vu depuis mysterllc.com porte la
//     barre MysterLLC, quel que soit le chemin ;
//   - le CHEMIN : le tableau de bord compliance (/admin/compliance exact),
//     le portefeuille (/entites) et l agenda (/agenda) portent la barre
//     MysterLLC meme depuis academiapro.fr.
// Les ecrans comptables vus depuis academiapro.fr ou mrcomptable.fr
// gardent la barre Mr Comptable.
//
// 🆕 LE REGISTRE DES SIGNATURES ET L ECRAN DE PREPARATION — 01/09. Ils
// appartiennent au meme produit : un ecran de signature qui porterait la
// barre Mr Comptable au-dessus d un mandat MysterLLC serait incoherent.
const CHEMINS_MYSTERLLC = [
  "/admin/compliance/entites",
  "/admin/compliance/agenda",
  "/admin/compliance/signatures",
  "/admin/compliance/faire-signer",
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

// La banniere MysterLLC deposee dans public/ le 31/08 : format large 4:1,
// fond noir, M vegetal-circuit, nom et base line integres dans l image.
// Le format carre (IMG_4722.jpeg) servira au favicon et a l Open Graph.
const LOGO_MYSTERLLC = "/IMG_4723.jpeg";

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

function estCheminMysterLLC(chemin) {
  // Le tableau de bord compliance est /admin/compliance EXACT : les ecrans
  // comptables vivent tous plus profond (saisie, tva…), donc l exactitude
  // suffit a les distinguer.
  if (chemin === "/admin/compliance") return true;
  for (const p of CHEMINS_MYSTERLLC) {
    if (chemin === p || chemin.indexOf(p + "/") === 0) return true;
  }
  return false;
}

export default function NavBar() {
  const [langue, setLangue] = useState("fr");
  const [hote, setHote] = useState("");
  // 🆕 LA BARRE SAIT QUI LA REGARDE — 01/09.
  //
  // Elle affichait « Se connecter » et « Demarrer » a tout le monde, meme
  // en pleine session — Jacques : « Imagine que ce soit un nouveau
  // client ». Elle interroge desormais /api/auth/session : connecte, les
  // deux boutons laissent place a « Mon espace » ; et le lien Admin n est
  // montre qu a l administrateur. En cas d echec de l appel, la barre
  // retombe sur son comportement public — jamais pire qu avant.
  const [connecte, setConnecte] = useState(false);
  const [admin, setAdmin] = useState(false);
  const chemin = usePathname() || "";

  useEffect(() => {
    const saved = localStorage.getItem("langue") || "fr";
    setLangue(saved);
    setHote(window.location.hostname.toLowerCase());

    fetch("/api/auth/session")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.connecte) setConnecte(true);
        if (d && d.admin) setAdmin(true);
      })
      .catch(function () {});
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
  const surMysterLLC = hote.indexOf("mysterllc.com") >= 0;

  if (chemin.indexOf("/of/") === 0) return null;
  if (chemin === "/comptable" || chemin.indexOf("/comptable/") === 0) return null;
  if (surMrComptable && estPagePubliqueComptable(chemin)) return null;

  // La vitrine MysterLLC porte son propre en-tete, comme celle de
  // Mr Comptable : la barre s efface sur ses pages, qu elles soient
  // demandees par leur chemin interne (/mysterllc) ou par la racine du
  // domaine (mysterllc.com/, reecrite par le middleware).
  if (chemin === "/mysterllc" || chemin.indexOf("/mysterllc/") === 0) return null;
  if (surMysterLLC && chemin === "/") return null;

  // 🚨 L ECRAN DE SIGNATURE N A PAS DE BARRE — 01/09.
  //
  // Il s adresse au CLIENT du gestionnaire, pas au gestionnaire. Lui
  // afficher une barre de navigation vers le portefeuille et l agenda lui
  // proposerait des ecrans auxquels il n a pas acces, et brouillerait un
  // moment ou il ne doit y avoir qu une seule chose a faire : lire, puis
  // signer.
  if (chemin.indexOf("/compliance/signature/") === 0) return null;

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

  // ---- Espace de travail MysterLLC ---------------------------------------
  //
  // La banniere porte deja le nom et la base line : rien d autre a ecrire a
  // cote (lecon HebrewPro v3 — un texte pose pres d un logo s etire en
  // colonne illisible). Montage identique a celui de Mr Comptable :
  // largeur controlee, jamais etiree, bord rogne d un cheveu pour fondre le
  // fond de l image dans le noir de la barre.
  //
  // 🚨 SUR MYSTERLLC.COM, TOUTE PAGE PORTE CETTE BARRE — correction du
  // 31/08 au soir. La page /connexion affichait la barre AcadeMIA Pro
  // (formations, catalogue) : un gestionnaire de LLC arrivant sur le
  // domaine voyait une ecole de formation. La regle est la meme que pour
  // mrcomptable.fr : le domaine impose la marque, seules les pages de
  // vitrine (qui portent leur propre en-tete) y echappent, via les
  // return null plus haut.
  if (estCheminMysterLLC(chemin) || surMysterLLC) {
    return (
      <header style={{ ...barre, padding: "0 30px", background: "#000" }}>
        <a
          href="/admin/compliance/entites"
          style={{ display: "block", textDecoration: "none", flexShrink: 0, overflow: "hidden", lineHeight: 0 }}
        >
          <img
            src={LOGO_MYSTERLLC}
            alt="MysterLLC"
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
          <a href="/admin/compliance/entites" style={lienMenu}>Portefeuille</a>
          <a href="/admin/compliance/agenda" style={lienMenu}>Agenda</a>
          <a href="/admin/compliance" style={lienMenu}>Tableau de bord</a>
          {/* 🆕 LE REGISTRE — 01/09. Sans ce lien, l ecran existait mais
              n etait atteignable qu en tapant son adresse : c est
              exactement le defaut signale par Jacques le 17/08 sur l ecran
              LinkedIn. */}
          <a href="/admin/compliance/signatures" style={lienMenu}>Signatures</a>
        </nav>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexShrink: 0 }}>
          <a href="/admin/compliance/ma-societe" style={{ color: "#c8a96e", border: "1px solid rgba(200,169,110,0.45)", padding: "8px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap" }}>
            {"Ma soci\u00e9t\u00e9"}
          </a>
        </div>
      </header>
    );
  }

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
          <a href="/admin/compliance/pieces" style={lienMenu}>{"Pi\u00e8ces"}</a>
          <a href="/admin/compliance/acces-clients" style={lienMenu}>Espaces clients</a>
          <a href="/admin/compliance/tva" style={lienMenu}>TVA</a>
          <a href="/admin/compliance/teledec" style={lienMenu}>{"T\u00e9l\u00e9transmissions"}</a>
        </nav>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexShrink: 0 }}>
          <a href="/admin/compliance/ma-societe" style={{ color: "#c8a96e", border: "1px solid rgba(200,169,110,0.45)", padding: "8px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap" }}>
            Mon cabinet
          </a>
        </div>
      </header>
    );
  }

  // ---- Vitrine AcadémIA Pro ---------------------------------------------
  return (
    <header style={barre}>
      <a href="/" style={lienMarque}>
        {"Acad\u00e9mIA Pro"}
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
            {t("solutions")} {"\u25be"}
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
        {admin && (
          <a href="/admin" style={{ ...lienMenu, color: "#c8a96e", fontWeight: "bold" }}>Admin</a>
        )}
      </nav>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <select
          value={langue}
          onChange={e => changerLangue(e.target.value)}
          style={{ background: "rgba(200,169,110,0.15)", border: "1px solid rgba(200,169,110,0.4)", color: "#c8a96e", padding: "6px 10px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}
        >
          <option value="fr">{"\ud83c\uddeb\ud83c\uddf7 FR"}</option>
          <option value="en">{"\ud83c\uddec\ud83c\udde7 EN"}</option>
          <option value="es">{"\ud83c\uddea\ud83c\uddf8 ES"}</option>
          <option value="pt">{"\ud83c\udde7\ud83c\uddf7 PT"}</option>
          <option value="de">{"\ud83c\udde9\ud83c\uddea DE"}</option>
          <option value="ar">{"\ud83c\uddf8\ud83c\udde6 AR"}</option>
          <option value="he">{"\ud83c\uddee\ud83c\uddf1 HE"}</option>
          </select>
        {connecte ? (
          <a href="/espace-prive" style={{ background: "linear-gradient(135deg,#c8a96e,#a07840)", color: "#050508", padding: "8px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap" }}>
            {t("monEspace")}
          </a>
        ) : (
          <>
            <a href="/connexion" style={{ color: "#c8a96e", border: "1px solid rgba(200,169,110,0.45)", padding: "8px 16px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap" }}>
              {t("connexion")}
            </a>
            <a href="/login" style={{ background: "linear-gradient(135deg,#c8a96e,#a07840)", color: "#050508", padding: "8px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "14px", whiteSpace: "nowrap" }}>
              {t("demarrer")}
            </a>
          </>
        )}
      </div>
    </header>
  );
}
