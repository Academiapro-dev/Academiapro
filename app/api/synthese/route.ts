import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MINIMUM_MOTS = 150;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Renvoie la synthese deja deposee pour ce module, s il y en a une.
export async function GET(req: Request) {
  try {
    const email = emailDeSession();
    if (!email) {
      return NextResponse.json({ ok: false, erreur: "connectez-vous pour deposer votre synthese" }, { status: 401 });
    }

    const url = new URL(req.url);
    const code = (url.searchParams.get("code") || "").trim().toUpperCase();
    const cible = (url.searchParams.get("cible") || "").trim().toLowerCase();

    if (!code || !cible) {
      return NextResponse.json({ ok: false, erreur: "code ou module manquant" }, { status: 400 });
    }

    const { data } = await supabase
      .from("syntheses")
      .select("id, texte, statut, note, retour, created_at")
      .eq("email", email)
      .eq("formation_code", code)
      .eq("module_cible", cible)
      .order("created_at", { ascending: false })
      .limit(1);

    const ligne = data && data.length > 0 ? data[0] : null;

    return NextResponse.json({ ok: true, email: email, synthese: ligne });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// Depose ou remplace la synthese du stagiaire pour ce module.
export async function POST(req: Request) {
  try {
    const email = emailDeSession();
    if (!email) {
      return NextResponse.json({ ok: false, erreur: "connectez-vous pour deposer votre synthese" }, { status: 401 });
    }

    const corps = await req.json().catch(function () { return null; });
    if (!corps) {
      return NextResponse.json({ ok: false, erreur: "requete illisible" }, { status: 400 });
    }

    const code = String(corps.code || "").trim().toUpperCase();
    const cible = String(corps.cible || "").trim().toLowerCase();
    const titre = String(corps.titre || "").trim();
    const texte = String(corps.texte || "").trim();

    if (!code || !cible) {
      return NextResponse.json({ ok: false, erreur: "code ou module manquant" }, { status: 400 });
    }

    const mots = texte.split(/\s+/).filter(Boolean).length;
    if (mots < MINIMUM_MOTS) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Votre synthese fait " + mots + " mots. Il en faut au moins " + MINIMUM_MOTS + ".",
          mots: mots,
        },
        { status: 400 }
      );
    }

    // Le stagiaire peut revenir sur sa synthese tant qu elle n a pas ete evaluee.
    const { data: existante } = await supabase
      .from("syntheses")
      .select("id, statut")
      .eq("email", email)
      .eq("formation_code", code)
      .eq("module_cible", cible)
      .order("created_at", { ascending: false })
      .limit(1);

    const ligne = existante && existante.length > 0 ? existante[0] : null;

    if (ligne && ligne.statut === "deposee") {
      const { error } = await supabase
        .from("syntheses")
        .update({ texte: texte, module_titre: titre || null, updated_at: new Date().toISOString() })
        .eq("id", ligne.id);

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, mise_a_jour: true, mots: mots });
    }

    const { error } = await supabase.from("syntheses").insert({
      email: email,
      formation_code: code,
      module_cible: cible,
      module_titre: titre || null,
      texte: texte,
      statut: "deposee",
    });

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, deposee: true, mots: mots });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
