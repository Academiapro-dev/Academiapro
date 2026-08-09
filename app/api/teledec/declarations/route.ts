import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ADMINS = ["contact@academiapro.fr"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    global: {
      fetch: function (url: any, options: any) {
        return fetch(url, { ...(options || {}), cache: "no-store" });
      },
    },
  }
);

// Les teletransmissions d un cabinet, et d un seul. Le tenant vient de la
// SESSION, jamais du navigateur : une liasse porte le chiffre d affaires et
// le resultat d une entreprise, c est la donnee la plus sensible du produit.
export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const email = String(session.email || "").toLowerCase().trim();
    const estAdmin = ADMINS.indexOf(email) >= 0;

    // L administrateur peut consulter un autre dossier en le precisant :
    // c est le support. Personne d autre ne le peut.
    const demande = new URL(req.url).searchParams.get("tenant");
    const tenant = estAdmin && demande ? demande : session.tenantId;

    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("teledec_declarations")
      .select("id, reference, siren, formulaire, millesime, statut, statut_libelle, "
        + "reference_dgfip, numero_traitement_dgfip, date_heure_dgfip, "
        + "pdf_chemin, erreurs, envoyee_le, repondu_le")
      .eq("tenant_id", tenant)
      .order("envoyee_le", { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const lignes = data || [];

    return NextResponse.json({
      ok: true,
      nombre: lignes.length,
      en_attente: lignes.filter(function (l: any) {
        return l.statut === "envoyee" || l.statut === "transmise" || l.statut === "creee";
      }).length,
      rejetees: lignes.filter(function (l: any) { return l.statut === "rejetee"; }).length,
      declarations: lignes,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
