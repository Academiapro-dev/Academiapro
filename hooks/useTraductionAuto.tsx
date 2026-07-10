"use client";
import { useState, useEffect } from "react";

// Mecanisme unique de traduction a la volee d AcademIA Pro.
// Le francais est la seule source de verite ; chaque texte
// part vers /api/traduire (dotee de la memoire Supabase :
// traduit une fois, servi instantanement ensuite).
// Pendant le chargement, le francais s affiche - jamais de
// page vide, jamais d erreur visible.

export function lireLangue(): string {
  if (typeof window === "undefined") return "fr";
  const p = new URLSearchParams(window.location.search);
  return p.get("lang") || localStorage.getItem("langue") || "fr";
}

async function traduireTexte(
  texte: string, langue: string): Promise<string> {
  try {
    const r = await fetch("/api/traduire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texte, langue_cible: langue }),
    });
    if (!r.ok) return texte;
    const d = await r.json();
    return d.traduction || texte;
  } catch {
    return texte;
  }
}

async function parGroupes(
  taches: Array<() => Promise<void>>, taille: number) {
  for (let i = 0; i < taches.length; i += taille) {
    const groupe = taches.slice(i, i + taille);
    await Promise.all(groupe.map((t) => t()));
  }
}

function planifier(
  valeur: any, langue: string,
  taches: Array<() => Promise<void>>): any {
  if (typeof valeur === "string") {
    const conteneur = { v: valeur };
    taches.push(() => traduireTexte(valeur, langue)
      .then((t) => { conteneur.v = t; }));
    return conteneur;
  }
  if (Array.isArray(valeur)) {
    return valeur.map((v) => planifier(v, langue, taches));
  }
  if (valeur && typeof valeur === "object") {
    const resultat: any = {};
    for (const cle of Object.keys(valeur)) {
      resultat[cle] = planifier(valeur[cle], langue, taches);
    }
    return resultat;
  }
  return valeur;
}

function recolter(structure: any): any {
  if (Array.isArray(structure)) {
    return structure.map(recolter);
  }
  if (structure && typeof structure === "object") {
    if ("v" in structure
        && Object.keys(structure).length === 1) {
      return structure.v;
    }
    const resultat: any = {};
    for (const cle of Object.keys(structure)) {
      resultat[cle] = recolter(structure[cle]);
    }
    return resultat;
  }
  return structure;
}

export async function traduireObjet(
  objet: any, langue: string): Promise<any> {
  if (!langue || langue === "fr") return objet;
  const taches: Array<() => Promise<void>> = [];
  const squelette = planifier(objet, langue, taches);
  await parGroupes(taches, 3);
  return recolter(squelette);
}

// Hook de page : txt contient d abord le francais (affichage
// immediat), puis la traduction des qu elle est prete.
export function useTraductionAuto<T>(textesFr: T): {
  txt: T; langue: string;
} {
  const [langue, setLangue] = useState<string>("fr");
  const [txt, setTxt] = useState<T>(textesFr);

  useEffect(() => {
    const l = lireLangue();
    setLangue(l);
    if (l === "fr") return;
    let actif = true;
    traduireObjet(textesFr, l).then((resultat) => {
      if (actif) setTxt(resultat);
    });
    return () => { actif = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { txt, langue };
}

export default useTraductionAuto;
