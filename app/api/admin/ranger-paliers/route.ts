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

// Rattachement des supports aux huit paliers hypnose et PNL.
const PLAN: { de: string; vers: string; quoi: string }[] = [
  { de: "B_F115_support_cours.html", vers: "F321_support_cours.html", quoi: "Hypnose Technicien" },
  { de: "F117_support_cours.html", vers: "F322_support_cours.html", quoi: "Hypnose Maitre Praticien" },
  { de: "B_F118_support_cours.html", vers: "F323_support_cours.html", quoi: "Hypnose Enseignant" },
  { de: "B_F119_support_cours.html", vers: "F324_support_cours.html", quoi: "PNL Technicien" },
  { de: "B_F120_support_cours.html", vers: "F029_support_cours.html", quoi: "PNL Praticien" },
  { de: "B_F237_support_cours.html", vers: "F325_support_cours.html", quoi: "PNL Maitre Praticien (fichier groupe, provisoire)" },
  { de: "B_F121_support_cours.html", vers: "F326_support_cours.html", quoi: "PNL Enseignant" },
];

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

    const aFaire: any[] = [];
    const bloques: any[] = [];

    for (const op of PLAN) {
      if (!existants.has(op.de)) {
        bloques.push({ ...op, motif: "fichier source introuvable" });
        continue;
      }
      if (existants.has(op.vers)) {
        bloques.push({ ...op, motif: "la cible est deja occupee" });
        continue;
      }
      aFaire.push(op);
    }

    if (!executer) {
      return NextResponse.json({
        ok: true,
        mode: "SIMULATION - aucun fichier touche",
        a_ranger: aFaire.length,
        bloques: bloques.length,
        detail: aFaire,
        liste_bloques: bloques,
        pour_executer: "/api/admin/ranger-paliers?executer=oui",
      });
    }

    const faits: string[] = [];
    const echecs: any[] = [];

    for (const op of aFaire) {
      const { error } = await supabase.storage.from(BUCKET).move(op.de, op.vers);
      if (error) {
        echecs.push({ ...op, erreur: error.message });
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
      faits.push(op.de + " -> " + op.vers + " (" + op.quoi + ")");
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
