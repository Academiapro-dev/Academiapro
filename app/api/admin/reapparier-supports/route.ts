import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "formations-pdf";
const SEUIL = 0.85;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

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

    const { data: lignes, error } = await supabase
      .from("supports_inventaire")
      .select("fichier, titre_interne, code_proche, titre_proche, proximite, taille")
      .gte("proximite", SEUIL)
      .eq("statut", "catalogue_b_range")
      .order("taille", { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const vus = new Set<string>();
    const aFaire: any[] = [];
    const ignores: any[] = [];

    for (const l of lignes || []) {
      const code = String(l.code_proche || "");
      if (!code) continue;
      if (vus.has(code)) {
        ignores.push({ fichier: l.fichier, motif: "doublon, un fichier plus gros a deja ete retenu", code: code });
        continue;
      }
      vus.add(code);
      const cible = code + "_support_cours.html";
      if (existants.has(cible)) {
        ignores.push({ fichier: l.fichier, motif: "la formation a deja un support conforme", cible: cible });
        continue;
      }
      aFaire.push({ de: l.fichier, vers: cible, titre: l.titre_interne, fiche: l.titre_proche });
    }

    if (!executer) {
      return NextResponse.json({
        ok: true,
        mode: "SIMULATION - aucun fichier touche",
        a_reapparier: aFaire.length,
        ignores: ignores.length,
        detail: aFaire,
        liste_ignores: ignores,
        pour_executer: "/api/admin/reapparier-supports?executer=oui",
      });
    }

    const faits: string[] = [];
    const echecs: any[] = [];

    for (const op of aFaire) {
      const { error: erreurMove } = await supabase.storage.from(BUCKET).move(op.de, op.vers);
      if (erreurMove) {
        echecs.push({ de: op.de, vers: op.vers, erreur: erreurMove.message });
        continue;
      }
      await supabase
        .from("supports_inventaire")
        .update({
          fichier: op.vers,
          code_fichier: op.vers.split("_")[0],
          statut: "conforme",
        })
        .eq("fichier", op.de);
      faits.push(op.de + " -> " + op.vers);
    }

    return NextResponse.json({
      ok: true,
      mode: "EXECUTION",
      reappariees: faits.length,
      echecs: echecs,
      detail: faits,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
