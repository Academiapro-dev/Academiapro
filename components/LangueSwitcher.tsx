"use client";
import { useState, useEffect, createContext, useContext } from "react";

export const LangueContext = createContext({ langue: "fr", setLangue: (l) => {} });

// ---------------------------------------------------------------------------
// 🚨🚨 SEIZE LANGUES DEPUIS LE 29/08 — LA LISTE ETAIT PLUS COURTE QUE LE
// CATALOGUE.
//
// CE QUI A ETE MESURE CE JOUR-LA :
//   - le selecteur proposait SIX langues (fr, en, es, pt, de, ar)
//   - la route /api/traduire n en connaissait que QUATRE (en, es, ar, he)
//   - les fiches de formation, elles, sont traduites en SIX langues dans
//     formations_traductions (265 lignes chacune, 235 pour l hebreu)
//   - l interface n avait que 641 lignes en anglais, 83 en espagnol,
//     13 en hebreu, et RIEN en portugais, allemand ni arabe
//
// LE RESULTAT VISIBLE : un visiteur choisissait le portugais, voyait les
// formations traduites et tous les menus en francais. Aucune erreur ne
// remontait, parce que la route recevait une langue qu elle ne connaissait
// pas et rendait le texte d origine.
//
// ⚠️ CETTE LISTE ET CELLE DE /api/traduire DOIVENT RESTER IDENTIQUES.
// Une langue ajoutee ici mais absente la-bas s affichera en francais, sans
// message d erreur. C est exactement le defaut qu on vient de corriger.
//
// COMMENT LA TRADUCTION SE REMPLIT : rien n est genere d avance. Chaque
// texte est traduit LA PREMIERE FOIS qu un visiteur l affiche, puis range
// en base. La fois suivante, il est lu depuis la memoire — aucun appel,
// aucun cout. Pour amorcer une langue, il suffit de parcourir le site une
// fois dans cette langue.
//
// L ORDRE N EST PAS ALPHABETIQUE. Les six premieres sont celles dont les
// fiches de formation sont deja traduites : elles rendent une experience
// complete des le premier clic. Les dix autres traduisent l interface mais
// pas encore les fiches.
// ---------------------------------------------------------------------------
const LANGUES = [
  // Les six langues completes : interface ET fiches de formation.
  { code: "fr", label: "FR", drapeau: "🇫🇷", nom: "Français" },
  { code: "en", label: "EN", drapeau: "🇬🇧", nom: "English" },
  { code: "es", label: "ES", drapeau: "🇪🇸", nom: "Español" },
  { code: "pt", label: "PT", drapeau: "🇧🇷", nom: "Português" },
  { code: "de", label: "DE", drapeau: "🇩🇪", nom: "Deutsch" },
  { code: "ar", label: "AR", drapeau: "🇸🇦", nom: "العربية" },
  { code: "he", label: "HE", drapeau: "🇮🇱", nom: "עברית" },

  // Les neuf autres : interface traduite a la demande.
  { code: "it", label: "IT", drapeau: "🇮🇹", nom: "Italiano" },
  { code: "nl", label: "NL", drapeau: "🇳🇱", nom: "Nederlands" },
  { code: "ru", label: "RU", drapeau: "🇷🇺", nom: "Русский" },
  { code: "zh", label: "ZH", drapeau: "🇨🇳", nom: "中文" },
  { code: "ja", label: "JA", drapeau: "🇯🇵", nom: "日本語" },
  { code: "ko", label: "KO", drapeau: "🇰🇷", nom: "한국어" },
  { code: "tr", label: "TR", drapeau: "🇹🇷", nom: "Türkçe" },
  { code: "pl", label: "PL", drapeau: "🇵🇱", nom: "Polski" },
  { code: "el", label: "EL", drapeau: "🇬🇷", nom: "Ελληνικά" },
];

// Les langues qui s ecrivent de droite a gauche. La mise en page bascule
// deja correctement — verifie le 29/08 sur l arabe : logo a droite, menu
// inverse, boutons a gauche. On pose l attribut pour que ce soit explicite
// plutot que laisse au navigateur.
const DROITE_A_GAUCHE = ["ar", "he"];

export function LangueProvider({ children }) {
  const [langue, setLangue] = useState("fr");

  useEffect(() => {
    const saved = localStorage.getItem("langue") || "fr";
    setLangue(saved);
    appliquerSens(saved);
  }, []);

  // Le sens d ecriture se pose sur la balise html, la ou le navigateur
  // l attend. Sans cela, il le devine caractere par caractere : les mots
  // s affichent bien, mais rien ne garantit la mise en page.
  function appliquerSens(l) {
    if (typeof document === "undefined") return;
    const rtl = DROITE_A_GAUCHE.indexOf(l) >= 0;
    document.documentElement.setAttribute("dir", rtl ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", l);
  }

  function changerLangue(l) {
    setLangue(l);
    localStorage.setItem("langue", l);
    appliquerSens(l);
    // Espace blog : chaque langue majeure a sa propre URL
    // (SEO). On navigue au lieu de traduire a la volee.
    if (typeof window !== "undefined") {
      const chemin = window.location.pathname;
      const estBlog = chemin === "/blog"
        || chemin.startsWith("/blog/")
        || chemin === "/en/blog"
        || chemin.startsWith("/en/blog/")
        || chemin === "/es/blog"
        || chemin.startsWith("/es/blog/");
      if (estBlog) {
        if (l === "en") {
          window.location.href = "/en/blog";
        } else if (l === "es") {
          window.location.href = "/es/blog";
        } else {
          window.location.href = "/blog";
        }
      }
    }
  }

  return (
    <LangueContext.Provider value={{ langue, setLangue: changerLangue }}>
      {children}
    </LangueContext.Provider>
  );
}

export function useLangue() {
  return useContext(LangueContext);
}

export default function LangueSwitcher() {
  const { langue, setLangue } = useLangue();
  const [ouvert, setOuvert] = useState(false);

  const langueActuelle = LANGUES.find(l => l.code === langue) || LANGUES[0];

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOuvert(!ouvert)}
        style={{ background: "rgba(200,169,110,0.2)", border: "1px solid rgba(200,169,110,0.4)", color: "#c8a96e", padding: "6px 12px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "bold" }}
      >
        {langueActuelle.drapeau} {langueActuelle.label} ▾
      </button>

      {ouvert && (
        <div style={{ position: "absolute", top: "40px", right: 0, background: "#1a1a2e", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "10px", zIndex: 1000, minWidth: "170px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", maxHeight: "320px", overflowY: "auto" }}>
          {LANGUES.map(l => (
            <button
              key={l.code}
              onClick={() => { setLangue(l.code); setOuvert(false); }}
              style={{ width: "100%", padding: "10px 15px", background: langue === l.code ? "rgba(200,169,110,0.2)" : "none", border: "none", color: langue === l.code ? "#c8a96e" : "rgba(255,255,255,0.7)", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", textAlign: "left" }}
            >
              <span>{l.drapeau}</span>
              <span>{l.nom}</span>
              {langue === l.code && <span style={{ marginLeft: "auto", color: "#c8a96e" }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
