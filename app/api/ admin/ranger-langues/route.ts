import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "formations-pdf";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function simplifier(t: string): string {
  return String(t || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Langue = les six premieres lettres du titre simplifie.
// Cela rapproche « Hebreu » de « Hebreux » et « Francais FLE » de « Francais ».
function langueDe(titre: string): string {
  const t = simplifier(titre).replace(/[^a-z ]/g, "");
  if (!t) return "";
  return t.slice(0, 6);
}

function niveauDe(titre: string): string {
  const m = String(titre || "").toUpperCase().match(/\b(A1|A2|B1|B2|C1|C2)\b/);
  return m ? m[1] : "";
}

export async function GET(req: Request) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const executer = new URL(req.url).searchParams.get("executer") === "oui";

    const { data: fichiers } = await supabase.storage
      .from(BUCKET)
      .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });
    const existants = new Set((fichiers || []).map(f => f.name));

    const { data: supports } = await supabase
      .from("supports_inventaire")
      .select("fichier, titre_interne, taille")
      .eq("statut", "catalogue_b_range")
      .order("taille", { ascending: false });

    const { data: formations } = await supabase
      .from("formations")
      .select("code, titre");

    const aFaire: any[] = [];
    const bloques: any[] = [];
    const dejaPris = new Set<string>();

    for (const f of formations || []) {
      const niveau = niveauDe(f.titre);
      if (!niveau) continue;
      const langue = langueDe(f.titre);
      if (!langue) continue;

      const cible = f.code + "_support_cours.html";
      if (existants.has(cible)) continue;

      const candidat = (supports || []).find(
        (s: any) =>
          !dejaPris.has(s.fichier) &&
          niveauDe(s.titre_interne) === niveau &&
          langueDe(s.titre_interne) === langue
      );

      if (!candidat) continue;
      dejaPris.add(candidat.fichier);
      aFaire.push({
        de: candidat.fichier,
        vers: cible,
        support: candidat.titre_interne,
        fiche: f.titre,
        niveau: niveau,
        taille: candidat.taille,
      });
    }

    if (!executer) {
      return NextResponse.json({
        ok: true,
        mode: "SIMULATION - aucun fichier touche",
        a_ranger: aFaire.length,
        bloques: bloques.length,
        detail: aFaire,
        pour_executer: "/api/admin/ranger-langues?executer=oui",
      });
    }

    const faits: string[] = [];
    const echecs: any[] = [];

    for (const op of aFaire) {
      const { error } = await supabase.storage.from(BUCKET).move(op.de, op.vers);
      if (error) {
        echecs.push({ de: op.de, vers: op.vers, erreur: error.message });
        continue;
      }
      await supabase
        .from("supports_inventaire")
        .update({ fichier: op.vers, code_fichier: op.vers.split("_")[0], statut: "conforme" })
        .eq("fichier", op.de);
      faits.push(op.support + " -> " + op.fiche + " (" + op.vers + ")");
    }

    return NextResponse.json({
      ok: true,
      mode: "EXECUTION",
      ranges: faits.length,
      echecs: echecs,
      detail: faits,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
