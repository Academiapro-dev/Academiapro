import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPEDITEUR = "AcadeMIA Pro <contact@academiapro.fr>";
const EDITEUR = "contact@academiapro.fr";

// LA COMMANDE D UNE FORMATION SUR MESURE.
//
// C EST LE GESTE QUI SERT LA STRATEGIE. Decision de Jacques le 16/08 :
// AcadeMIA Pro ne vend pas un outil de fabrication, elle DEVIENT LE
// CATALOGUE. Un client qui fabrique lui-meme fait de nous un concurrent de
// Digiforma sur son terrain ; un client qui NOUS COMMANDE ses formations
// fait grossir notre catalogue et ne peut plus partir.
//
// La redaction assistee reste ouverte a cote — on n interdit rien, on
// oriente. Les 90 EUR par formation redigee rendent la fabrication moins
// attirante que la commande ; ce formulaire rend la commande plus simple.
//
// AUCUN PRIX N EST ANNONCE ICI, et c est volontaire : une formation sur
// mesure se chiffre apres avoir su ce que le client veut. Le devis part
// apres l echange, comme pour le pack et pour Mr. Comptable.

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

function propre(v: any, max: number): string {
  return String(v === null || v === undefined ? "" : v).trim().slice(0, max);
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    if (session.role === "stagiaire") {
      return NextResponse.json(
        { ok: false, erreur: "Seul votre organisme peut commander une formation." },
        { status: 403 }
      );
    }

    const tenant = session.tenantId
      || (new URL(req.url).searchParams.get("tenant"));

    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const b = await req.json().catch(function () { return null; });
    const sujet = propre(b && b.sujet, 200);

    if (sujet.length < 4) {
      return NextResponse.json(
        { ok: false, erreur: "Indiquez le sujet de la formation souhaitee." },
        { status: 400 }
      );
    }

    const duree = propre(b && b.duree, 60);
    const public_vise = propre(b && b.public_vise, 300);
    const objectifs = propre(b && b.objectifs, 2000);
    const echeance = propre(b && b.echeance, 100);

    const { data: org } = await supabase
      .from("organismes_formation")
      .select("raison_sociale, email_contact, telephone, numero_da")
      .eq("tenant_id", tenant)
      .maybeSingle();

    const nom = (org && org.raison_sociale) || "Organisme";

    // La demande est ENREGISTREE avant d etre envoyee : si le courriel
    // echoue, elle n est pas perdue et se retrouve dans le journal.
    await supabase.from("organisme_usage_ia").insert({
      tenant_id: tenant,
      email: session.email,
      type: "commande_formation",
      reference: sujet,
      jetons_entree: 0,
      jetons_sortie: 0,
      cout_estime: 0,
      montant_facture: 0,
    });

    const corps = [
      "Nouvelle demande de formation sur mesure.",
      "",
      "ORGANISME : " + nom,
      org && org.numero_da ? "N de declaration : " + org.numero_da : "",
      "Demandeur : " + session.email,
      org && org.telephone ? "Telephone : " + org.telephone : "",
      "",
      "SUJET : " + sujet,
      duree ? "Duree souhaitee : " + duree : "",
      echeance ? "Pour quand : " + echeance : "",
      public_vise ? "Public vise : " + public_vise : "",
      "",
      objectifs ? "CE QUE LE STAGIAIRE DOIT SAVOIR FAIRE :" : "",
      objectifs,
    ].filter(Boolean).join("\n");

    if (process.env.RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + process.env.RESEND_API_KEY,
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          from: EXPEDITEUR,
          reply_to: session.email,
          to: EDITEUR,
          subject: "Formation sur mesure demandee par " + nom,
          html: '<div style="font-family:Georgia,serif;line-height:1.75;font-size:15px">'
            + corps.replace(/\n/g, "<br/>") + "</div>",
        }),
      });
    }

    return NextResponse.json({
      ok: true,
      message:
        "Votre demande est transmise. Nous revenons vers vous sous quarante-huit heures " +
        "avec le contenu envisage et son tarif.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
