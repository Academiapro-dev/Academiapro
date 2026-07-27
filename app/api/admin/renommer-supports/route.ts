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

function nouveauNom(codeInterne: string, codeFichier: string): string {
  const source = (codeInterne || codeFichier || "").replace(/[^0-9]/g, "");
  if (!source) return "";
  const num = parseInt(source, 10);
  if (!(num > 0)) return "";
  return "B" + String(num).padStart(3, "0") + "_support_cours.html";
}

export async function GET(req: Request) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const url = new URL(req.url);
    const executer = url.searchParams.get("executer") === "oui";
    const taille = Math.min(Number(url.searchParams.get("taille") || 40), 60);

    const { data: fichiers } = await supabase.storage
      .from(BUCKET)
      .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });
    const existants = new Set((fichiers || []).map(f => f.name));

    const { data: lignes, error } = await supabase
      .from("supports_inventaire")
      .select("fichier, code_fichier, code_interne, titre_interne, statut")
      .in("statut", ["catalogue_b", "sans_fiche"])
      .order("fichier", { ascending: true });

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const aFaire: any[] = [];
    const conflits: any[] = [];
    const cibles = new Set<string>();

    for (const l of lignes || []) {
      if (String(l.fichier || "").indexOf("B") === 0) continue;
      if (String(l.fichier || "").indexOf("SK") === 0) continue;
      const cible = nouveauNom(l.code_interne || "", l.code_fichier || "");
      if (!cible) {
        conflits.push({ fichier: l.fichier, motif: "code illisible", titre: l.titre_interne });
        continue;
      }
      if (existants.has(cible) || cibles.has(cible)) {
        conflits.push({ fichier: l.fichier, cible: cible, motif: "cible deja prise", titre: l.titre_interne });
        continue;
      }
      cibles.add(cible);
      aFaire.push({ de: l.fichier, vers: cible, titre: l.titre_interne });
    }

    if (!executer) {
      return NextResponse.json({
        ok: true,
        mode: "SIMULATION - aucun fichier touche",
        a_renommer: aFaire.length,
        conflits: conflits.length,
        apercu: aFaire.slice(0, 15),
        liste_conflits: conflits.slice(0, 20),
        pour_executer: "/api/admin/renommer-supports?executer=oui",
      });
    }

    const lot = aFaire.slice(0, taille);
    const faits: string[] = [];
    const echecs: any[] = [];

    for (const op of lot) {
      const { error: erreurMove } = await supabase.storage.from(BUCKET).move(op.de, op.vers);
      if (erreurMove) {
        echecs.push({ de: op.de, vers: op.vers, erreur: erreurMove.message });
        continue;
      }
      await supabase
        .from("supports_inventaire")
        .update({ fichier: op.vers, code_fichier: op.vers.split("_")[0], statut: "catalogue_b_range" })
        .eq("fichier", op.de);
      faits.push(op.de + " -> " + op.vers);
    }

    return NextResponse.json({
      ok: true,
      mode: "EXECUTION",
      renommes: faits.length,
      restants: Math.max(aFaire.length - faits.length, 0),
      echecs: echecs,
      exemples: faits.slice(0, 10),
      suite: aFaire.length - faits.length > 0 ? "/api/admin/renommer-supports?executer=oui" : "TERMINE",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
