"use client";
import { useState, useEffect } from "react";

// Fallback FR integre — disponible immediatement sans fetch
const FR: Record<string, any> = {
  nav: { formations: "Formations", seances: "Seances", packs: "Packs", competences: "Competences", blog: "Blog", contact: "Contact", demarrer: "Demarrer" },
  home: { hero_titre: "Formez-vous avec votre agent IA personnel", hero_sub: "265 formations certifiantes · Agent IA 24h/24 · Seances therapeutiques", btn_formations: "Voir les formations", btn_ebook: "E-book gratuit", stat1: "Formations certifiantes", stat2: "Competences validees", stat3: "Therapeutes IA", stat4: "Garantie satisfait" },
  catalogue: { titre: "Catalogue AcadeMIA Pro", rechercher: "Rechercher une formation...", resultats: "resultats", chargement: "Chargement...", aucune: "Aucune formation trouvee", formations: "formations disponibles", tous: "Tous" },
  formation: { elearning: "E-Learning", elearning_sub: "Asynchrone · A votre rythme", coach: "Coach IA 24h/24", coach_sub: "Questions par chat · Immediat", classe: "Classe Virtuelle", classe_sub: "Live · Mardis et Jeudis 20h", objectifs: "Objectifs", prerequis: "Prerequis", public_cible: "Public cible", programme: "Programme complet", acheter: "Acheter", pret: "Pret a commencer ?", acces: "Acces immediat · Agent IA 24h/24 · Garantie 30 jours", coach_btn: "Acceder au Coach IA", classe_btn: "Rejoindre une Classe Live", niveau: "Niveau", description: "Description", support: "Support de cours", support_sub: "Document complet · 300+ pages", voir: "Voir le support", chargement: "Chargement..." },
  seances: { titre: "Seances Therapeutiques", sous_titre: "Choisissez votre therapeute · Disponible maintenant · 24h/24", commencer: "Commencer la seance", changer: "Changer de therapeute", envoyer: "Envoyer", placeholder: "Parlez a", disponible: "En direct", avertissement: "Ces seances sont des simulations IA a des fins de bien-etre." },
  inscription: { titre: "Rejoignez la Liste Prioritaire", sous_titre: "Soyez parmi les premiers a acceder a AcadeMIA Pro", nom: "Votre nom", email: "Votre email", btn: "Rejoindre la liste", merci: "Merci ! Vous etes sur la liste." },
  blog: { titre: "Blog AcadeMIA Pro", sous_titre: "Articles sur l IA, la formation et le bien-etre", lire: "Lire →", bientot: "Bientot" },
  footer: { desc: "La plateforme de formation propulsee par l IA. 265 formations certifiantes.", copyright: "© 2026 AcadeMIA Pro · Tous droits reserves" },
  dashboard: { titre: "Mon Espace Apprenant", bienvenue: "Bienvenue", mes_formations: "Mes formations", progression: "Ma progression", certificats: "Mes certificats", coach: "Coach IA", deconnexion: "Deconnexion" }
};

const cache: Record<string, any> = { fr: FR };

async function chargerLocale(lang: string): Promise<any> {
  if (cache[lang]) return cache[lang];
  try {
    const r = await fetch("/locales/" + lang + ".json");
    if (!r.ok) return FR;
    const json = await r.json();
    cache[lang] = json;
    return json;
  } catch {
    return FR;
  }
}

export function getLangue(): string {
  if (typeof window === "undefined") return "fr";
  const p = new URLSearchParams(window.location.search);
  return p.get("lang") || localStorage.getItem("langue") || "fr";
}

export function useTranslation(section?: string) {
  const [langue, setLangue] = useState<string>(() => {
    if (typeof window === "undefined") return "fr";
    return localStorage.getItem("langue") || "fr";
  });
  const [data, setData] = useState<any>(() => {
    if (typeof window === "undefined") return FR;
    const lang = localStorage.getItem("langue") || "fr";
    return cache[lang] || FR;
  });

  useEffect(() => {
    const lang = getLangue();
    setLangue(lang);
    if (cache[lang]) {
      setData(cache[lang]);
    } else {
      chargerLocale(lang).then(json => { setData(json); });
    }
  }, []);

  function t(cle: string): string {
    const parts = cle.split(".");
    if (parts.length === 1 && section) {
      return data?.[section]?.[cle] || FR?.[section]?.[cle] || cle;
    }
    let val: any = data;
    for (const p of parts) {
      if (val === undefined || val === null) break;
      val = val[p];
    }
    if (val && typeof val === "string") return val;
    // Fallback FR
    let valFr: any = FR;
    for (const p of parts) {
      if (valFr === undefined || valFr === null) return cle;
      valFr = valFr[p];
    }
    return (valFr && typeof valFr === "string") ? valFr : cle;
  }

  return { t, langue, setLangue };
}

export default useTranslation;
