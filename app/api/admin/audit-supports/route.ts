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

function titreDuFichier(html: string): string {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1) return h1[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (t) return t[1].replace(/\s+/g, " ").trim();
  return "";
}

// Concordance : au moins la moitie des mots significatifs du titre de base
// se retrouvent dans le titre du fichier.
function concorde(titreBase: string, titreFichier: string): boolean {
  const a = simplifier(titreBase).split(" ").filter(m => m.length > 3);
  const b = simplifier(titreFichier);
  if (a.length === 0 || !b) return false;
  let trouves = 0;
  for (const mot of a) if (b.indexOf(mot) >= 0) trouves++;
  return trouves >= Math.ceil(a.length / 2);
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
    let verifies = 0;

    for (const nom of lot) {
      const code = nom.split("_")[0];
      const titreBase = titres[code];
      if (!titreBase) { sansFiche.push(code); continue; }
      try {
        const { data } = await supabase.storage.from("formations-pdf").download(nom);
        if (!data) continue;
        const html = (await data.text()).slice(0, 20000);
        const titreFichier = titreDuFichier(html);
        verifies++;
        if (!concorde(titreBase, titreFichier)) {
          discordances.push({ code, titre_base: titreBase, titre_fichier: titreFichier });
        }
      } catch (e) {
        discordances.push({ code, titre_base: titreBase, titre_fichier: "LECTURE IMPOSSIBLE" });
      }
    }

    const suivant = debut + taille;
    return NextResponse.json({
      ok: true,
      total_supports: supports.length,
      lot: debut + " a " + Math.min(suivant, supports.length),
      verifies: verifies,
      nb_discordances: discordances.length,
      discordances: discordances,
      codes_sans_fiche: sansFiche,
      suite: suivant < supports.length ? "/api/admin/audit-supports?debut=" + suivant : null,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
