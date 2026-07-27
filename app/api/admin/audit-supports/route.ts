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
    .replace(/\s+/g, " ")
    .trim();
}

// Le titre de la formation doit se retrouver dans le debut du document.
function concorde(titreBase: string, debutTexte: string): boolean {
  const mots = simplifier(titreBase).split(" ").filter(m => m.length > 3);
  const cible = simplifier(debutTexte);
  if (mots.length === 0 || !cible) return false;
  let trouves = 0;
  for (const mot of mots) if (cible.indexOf(mot) >= 0) trouves++;
  return trouves >= Math.ceil(mots.length / 2);
}

export async function GET(req: Request) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const url = new URL(req.url);
    const debut = Number(url.searchParams.get("debut") || 0);
    const taille = Math.min(Number(url.searchParams.get("taille") || 30), 60);

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

    const discordances: any[] = [];
    const sansFiche: string[] = [];
    let conformes = 0;

    for (const nom of lot) {
      const code = nom.split("_")[0];
      const titreBase = titres[code];
      if (!titreBase) { sansFiche.push(nom); continue; }
      try {
        const { data } = await supabase.storage.from("formations-pdf").download(nom);
        if (!data) continue;
        const brut = texteBrut((await data.text()).slice(0, 30000)).slice(0, 4000);
        if (concorde(titreBase, brut)) {
          conformes++;
        } else {
          discordances.push({ code, titre_base: titreBase, extrait: brut.slice(0, 220) });
        }
      } catch (e) {
        discordances.push({ code, titre_base: titreBase, extrait: "LECTURE IMPOSSIBLE" });
      }
    }

    const suivant = debut + taille;
    return NextResponse.json({
      ok: true,
      total_supports: supports.length,
      lot: debut + " a " + Math.min(suivant, supports.length),
      conformes: conformes,
      nb_discordances: discordances.length,
      discordances: discordances,
      fichiers_sans_fiche: sansFiche,
      suite: suivant < supports.length ? "/api/admin/audit-supports?debut=" + suivant : null,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
