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

export async function GET(req: Request) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const url = new URL(req.url);
    const executer = url.searchParams.get("executer") === "oui";
    const debut = Number(url.searchParams.get("debut") || 0);
    const taille = Math.min(Number(url.searchParams.get("taille") || 15), 25);

    const { data: sauvegardes, error: erreurListe } = await supabase.storage
      .from(BUCKET)
      .list("originaux", { limit: 1000, sortBy: { column: "name", order: "asc" } });

    if (erreurListe) {
      return NextResponse.json({ ok: false, erreur: erreurListe.message }, { status: 500 });
    }

    const noms = (sauvegardes || [])
      .map((f) => f.name)
      .filter((n) => n.indexOf("_support_cours.html") > 0)
      .sort();

    const lot = noms.slice(debut, debut + taille);
    const restaures: string[] = [];
    const echecs: any[] = [];

    for (const nom of lot) {
      try {
        const { data } = await supabase.storage.from(BUCKET).download("originaux/" + nom);
        if (!data) {
          echecs.push({ nom: nom, erreur: "sauvegarde illisible" });
          continue;
        }

        const contenu = await data.text();

        if (!executer) {
          restaures.push(nom);
          continue;
        }

        const ecriture = await supabase.storage
          .from(BUCKET)
          .upload(nom, new Blob([contenu], { type: "text/html" }), {
            upsert: true,
            cacheControl: "60",
          });

        if (ecriture.error) {
          echecs.push({ nom: nom, erreur: ecriture.error.message });
          continue;
        }

        restaures.push(nom);
      } catch (e: any) {
        echecs.push({ nom: nom, erreur: String(e) });
      }
    }

    const suivant = debut + taille;
    return NextResponse.json({
      ok: true,
      mode: executer ? "EXECUTION" : "SIMULATION - aucun fichier touche",
      total_supports: noms.length,
      lot: debut + " a " + Math.min(suivant, noms.length),
      a_modifier: restaures.length,
      deja_propres: 0,
      echecs: echecs,
      exemples: restaures.slice(0, 10),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
