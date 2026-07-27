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

// Variantes d'ecriture identifiees a la main : meme formation, autre orthographe.
const VARIANTES = [
  "scrum master",
  "bilan de competences",
  "droit du travail",
  "ecriture creative",
  "enneagramme",
  "entrepreneuriat",
  "finance comptabilite",
  "immobilier professionnel",
  "management leadership",
  "meditation",
  "rse et transition",
  "soft skills",
  "cybersecurite",
  "naturopathie",
];

function simplifier(t: string): string {
  return String(t || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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

    const { data: lignes } = await supabase
      .from("supports_inventaire")
      .select("fichier, titre_interne, code_proche, titre_proche, proximite, taille")
      .eq("statut", "catalogue_b_range")
      .gte("proximite", 0.5)
      .lt("proximite", 0.85)
      .order("taille", { ascending: false });

    const aFaire: any[] = [];
    const ignores: any[] = [];
    const vus = new Set<string>();

    for (const l of lignes || []) {
      const t = simplifier(l.titre_interne || "");
      const correspond = VARIANTES.some(v => t.indexOf(v) >= 0);
      if (!correspond) continue;

      const code = String(l.code_proche || "");
      if (!code) continue;
      if (vus.has(code)) {
        ignores.push({ fichier: l.fichier, motif: "doublon, plus gros deja retenu", code: code });
        continue;
      }
      const cible = code + "_support_cours.html";
      if (existants.has(cible)) {
        ignores.push({ fichier: l.fichier, motif: "la formation a deja un support", cible: cible });
        continue;
      }
      vus.add(code);
      aFaire.push({
        de: l.fichier,
        vers: cible,
        support: l.titre_interne,
        fiche: l.titre_proche,
        proximite: l.proximite,
      });
    }

    if (!executer) {
      return NextResponse.json({
        ok: true,
        mode: "SIMULATION - aucun fichier touche",
        a_ranger: aFaire.length,
        ignores: ignores.length,
        detail: aFaire,
        liste_ignores: ignores,
        pour_executer: "/api/admin/ranger-variantes?executer=oui",
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
