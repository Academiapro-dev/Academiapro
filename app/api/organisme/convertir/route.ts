import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function tenantDe(req: NextRequest, session: any): string | null {
  if (session.tenantId) return session.tenantId;
  if (ADMINS.indexOf(session.email) >= 0) {
    return new URL(req.url).searchParams.get("tenant");
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    if (session.role === "stagiaire") {
      return NextResponse.json(
        { ok: false, erreur: "Seul votre organisme peut inscrire un prospect." },
        { status: 403 }
      );
    }

    const tenant = tenantDe(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const b = await req.json().catch(function () { return null; });
    const email = b ? String(b.email || "").trim().toLowerCase() : "";

    if (!email || email.indexOf("@") < 1) {
      return NextResponse.json({ ok: false, erreur: "Prospect non precise." }, { status: 400 });
    }

    // Le prospect doit appartenir au CRM de cet organisme.
    let requete = supabase
      .from("crm")
      .select("*")
      .eq("email", email)
      .limit(1);

    requete = session.tenantId
      ? requete.eq("tenant_id", tenant)
      : requete.eq("tenant_id", tenant);

    const { data: prospects } = await requete;
    const prospect = (prospects || [])[0];

    if (!prospect) {
      return NextResponse.json(
        { ok: false, erreur: "Ce prospect ne figure pas dans votre suivi commercial." },
        { status: 404 }
      );
    }

    const code = String(b.formation_code || prospect.formation_interesse || "").trim().toUpperCase();

    // On n inscrit personne a une formation non souscrite : ni au catalogue,
    // ni parmi les cours propres de l organisme.
    if (code) {
      const { data: souscrite } = await supabase
        .from("organisme_catalogue")
        .select("formation_code")
        .eq("tenant_id", tenant)
        .eq("formation_code", code)
        .eq("actif", true)
        .maybeSingle();

      const { data: propre } = await supabase
        .from("organisme_cours")
        .select("code")
        .eq("tenant_id", tenant)
        .eq("code", code)
        .maybeSingle();

      if (!souscrite && !propre) {
        return NextResponse.json(
          { ok: false, erreur: "La formation " + code + " ne fait pas partie de votre offre." },
          { status: 400 }
        );
      }
    }

    const { data: deja } = await supabase
      .from("organisme_apprenants")
      .select("id, statut")
      .eq("tenant_id", tenant)
      .eq("email", email)
      .maybeSingle();

    if (deja) {
      return NextResponse.json(
        { ok: false, erreur: "Cette personne figure deja a votre registre de stagiaires." },
        { status: 409 }
      );
    }

    const prix = b && b.prix_vente ? Number(b.prix_vente) : null;

    const { error: erreurInscription } = await supabase
      .from("organisme_apprenants")
      .insert({
        tenant_id: tenant,
        email: email,
        nom: prospect.nom || null,
        formation_code: code || null,
        prix_vente: prix !== null && !isNaN(prix) ? prix : null,
        statut_stagiaire: b && b.statut_stagiaire ? String(b.statut_stagiaire) : null,
        payeur: b && b.payeur ? String(b.payeur) : null,
        dispositif: b && b.dispositif ? String(b.dispositif) : null,
        statut: "invite",
      });

    if (erreurInscription) {
      return NextResponse.json({ ok: false, erreur: erreurInscription.message }, { status: 500 });
    }

    // Le prospect devient client dans le suivi commercial : on garde la trace,
    // on ne la supprime pas — c est elle qui mesure le taux de conversion.
    await supabase
      .from("crm")
      .update({
        statut: "client",
        derniere_interaction: new Date().toISOString(),
        notes: (prospect.notes ? prospect.notes + "\n" : "") +
          "Inscrit au registre le " + new Date().toLocaleDateString("fr-FR") +
          (code ? " sur la formation " + code : ""),
      })
      .eq("id", prospect.id);

    return NextResponse.json({
      ok: true,
      email: email,
      formation_code: code || null,
      message:
        (prospect.nom || email) + " est inscrit a votre registre. " +
        "Envoyez-lui son acces depuis vos stagiaires.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
