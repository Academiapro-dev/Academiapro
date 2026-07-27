import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const de = (url.searchParams.get("de") || "").trim();
    const vers = (url.searchParams.get("vers") || "").trim();
    const executer = url.searchParams.get("executer") === "oui";

    if (!de || !vers) {
      return NextResponse.json(
        { ok: false, erreur: "parametres de= et vers= obligatoires (noms de fichiers complets)" },
        { status: 400 }
      );
    }

    const { data: fichiers } = await supabase.storage
      .from(BUCKET)
      .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });
    const existants = new Set((fichiers || []).map((f) => f.name));

    if (!existants.has(de)) {
      return NextResponse.json({ ok: false, erreur: "source introuvable : " + de }, { status: 404 });
    }
    if (existants.has(vers)) {
      return NextResponse.json({ ok: false, erreur: "cible deja occupee : " + vers }, { status: 409 });
    }

    if (!executer) {
      return NextResponse.json({
        ok: true,
        mode: "SIMULATION - aucun fichier touche",
        de: de,
        vers: vers,
        pour_executer: "/api/admin/deplacer?de=" + encodeURIComponent(de) + "&vers=" + encodeURIComponent(vers) + "&executer=oui",
      });
    }

    const { error } = await supabase.storage.from(BUCKET).move(de, vers);
    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    await supabase
      .from("supports_inventaire")
      .update({ fichier: vers, code_fichier: vers.split("_")[0], statut: "conforme" })
      .eq("fichier", de);

    return NextResponse.json({ ok: true, mode: "EXECUTION", de: de, vers: vers });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
