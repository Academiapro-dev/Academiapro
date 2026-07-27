import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function simplifier(t: string): string {
  return String(t || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function texteBrut(html: string): string {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function concorde(titreBase: string, debutTexte: string): boolean {
  const mots = simplifier(titreBase).split(" ").filter(m => m.length > 3);
  const cible = simplifier(debutTexte);
  if (mots.length === 0 || !cible) return false;
  let trouves = 0;
  for (const mot of mots) if (cible.indexOf(mot) >= 0) trouves++;
  return trouves >= Math.ceil(mots.length / 2);
}

// Le titre du catalogue B precede la marque : "Permaculture ... - AcademIA Pro".
function titreInterne(texte: string): string {
  const debut = texte.slice(0, 400);
  const coupe = debut.search(/Acad[eé]|AcadeÌ|AcadÃ©/);
  if (coupe > 3) return debut.slice(0, coupe).replace(/[\u2014\u2013-]\s*$/, "").trim();
  return debut.slice(0, 90).trim();
}

function codeInterne(texte: string): string {
  const m = texte.slice(0, 1500).match(/Code\s*:?\s*(F\s?\d{1,3})/i);
  return m ? m[1].replace(/\s/g, "").toUpperCase() : "";
}

function compterSections(texte: string): number {
  const cible = simplifier(texte);
  const cles = ["objectif", "prerequis", "public cible", "programme", "module", "competence"];
  let n = 0;
  for (const c of cles) if (cible.indexOf(c) >= 0) n++;
  return n;
}

function detecteBavardage(texte: string): boolean {
  const cible = simplifier(texte.slice(0, 3000));
  const signaux = [
    "je vais generer",
    "note preliminaire",
    "formation non identifiable",
    "je vais construire",
    "j applique le protocole",
  ];
  for (const s of signaux) if (cible.indexOf(s) >= 0) return true;
  return false;
}

export async function GET(req: Request) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const url = new URL(req.url);
    const debut = Number(url.searchParams.get("debut") || 0);
    const taille = Math.min(Number(url.searchParams.get("taille") || 40), 60);

    const { data: fichiers, error: erreurListe } = await supabase.storage
      .from("formations-pdf")
      .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });

    if (erreurListe) {
      return NextResponse.json({ ok: false, erreur: erreurListe.message }, { status: 500 });
    }

    const supports = (fichiers || [])
      .map(f => f.name)
      .filter(n => n.indexOf("_support_cours.html") > 0)
      .sort();

    const lot = supports.slice(debut, debut + taille);

    const { data: formations } = await supabase.from("formations").select("code, titre");
    const titres: Record<string, string> = {};
    for (const f of formations || []) titres[f.code] = f.titre;

    const lignes: any[] = [];
    const compte: Record<string, number> = { conforme: 0, catalogue_b: 0, sans_fiche: 0, illisible: 0 };

    for (const nom of lot) {
      const codeFichier = nom.split("_")[0];
      const titreFiche = titres[codeFichier] || null;
      try {
        const { data } = await supabase.storage.from("formations-pdf").download(nom);
        if (!data) continue;
        const html = await data.text();
        const brut = texteBrut(html.slice(0, 60000));
        let statut = "";
        if (!titreFiche) statut = "sans_fiche";
        else if (concorde(titreFiche, brut.slice(0, 4000))) statut = "conforme";
        else statut = "catalogue_b";
        compte[statut] = (compte[statut] || 0) + 1;
        lignes.push({
          fichier: nom,
          code_fichier: codeFichier,
          code_interne: codeInterne(brut),
          titre_interne: titreInterne(brut),
          titre_fiche: titreFiche,
          statut: statut,
          taille: html.length,
          bavardage: detecteBavardage(brut),
          sections: compterSections(brut),
          extrait: brut.slice(0, 300),
          vu_le: new Date().toISOString(),
        });
      } catch (e) {
        compte.illisible++;
        lignes.push({
          fichier: nom,
          code_fichier: codeFichier,
          titre_fiche: titreFiche,
          statut: "illisible",
          taille: 0,
          bavardage: false,
          sections: 0,
          extrait: "LECTURE IMPOSSIBLE",
          vu_le: new Date().toISOString(),
        });
      }
    }

    if (lignes.length > 0) {
      const { error: erreurEcriture } = await supabase
        .from("supports_inventaire")
        .upsert(lignes, { onConflict: "fichier" });
      if (erreurEcriture) {
        return NextResponse.json({ ok: false, erreur: erreurEcriture.message }, { status: 500 });
      }
    }

    const suivant = debut + taille;
    return NextResponse.json({
      ok: true,
      total_supports: supports.length,
      lot: debut + " a " + Math.min(suivant, supports.length),
      enregistres: lignes.length,
      compte: compte,
      suite: suivant < supports.length ? "/api/admin/audit-supports?debut=" + suivant : "TERMINE",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
