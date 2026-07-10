"use client";
import { useState, useEffect } from "react";

// Mecanisme unique de traduction a la volee d AcademIA Pro.
// Le francais est la seule source de verite ; chaque texte
// part vers /api/traduire (memoire Supabase incluse).
// AFFICHAGE PROGRESSIF : chaque texte apparait des que sa
// traduction arrive - jamais de tout-ou-rien.

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

// Copie profonde simple (objets/tableaux/chaines).
function copier(valeur: any): any {
  if (Array.isArray(valeur)) return valeur.map(copier);
  if (valeur && typeof valeur === "object") {
    const r: any = {};
    for (const c of Object.keys(valeur)) r[c] = copier(valeur[c]);
    return r;
  }
  return valeur;
}

// Liste les chemins de toutes les chaines de l objet.
function listerChemins(
  valeur: any, prefixe: Array<string | number>,
  sortie: Array<Array<string | number>>) {
  if (typeof valeur === "string") {
    sortie.push(prefixe);
    return;
  }
  if (Array.isArray(valeur)) {
    valeur.forEach((v, i) =>
      listerChemins(v, [...prefixe, i], sortie));
    return;
  }
  if (valeur && typeof valeur === "object") {
    for (const c of Object.keys(valeur)) {
      listerChemins(valeur[c], [...prefixe, c], sortie);
    }
  }
}

function lireChemin(objet: any, chemin: Array<string | number>) {
  let v = objet;
  for (const p of chemin) v = v[p];
  return v;
}

function ecrireChemin(
  objet: any, chemin: Array<string | number>, valeur: string) {
  let v = objet;
  for (let i = 0; i < chemin.length - 1; i++) v = v[chemin[i]];
  v[chemin[chemin.length - 1]] = valeur;
}

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
    const chemins: Array<Array<string | number>> = [];
    listerChemins(textesFr, [], chemins);
    let travail = copier(textesFr);

    // Groupes de 3 avec rendu apres CHAQUE groupe : la page
    // se remplit au fil de l eau.
    (async () => {
      for (let i = 0; i < chemins.length; i += 3) {
        const groupe = chemins.slice(i, i + 3);
        await Promise.all(groupe.map(async (chemin) => {
          const source = lireChemin(textesFr, chemin);
          const traduit = await traduireTexte(source, l);
          ecrireChemin(travail, chemin, traduit);
        }));
        if (!actif) return;
        travail = copier(travail); // nouvelle reference
        setTxt(travail);
      }
    })();

    return () => { actif = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { txt, langue };
}

export default useTraductionAuto;
