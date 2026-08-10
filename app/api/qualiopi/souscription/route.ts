import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PRIX = 1190;
const PROJET = "academia";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// LA SOUSCRIPTION.
//
// Le clic vaut commande : c est lui qui fait naitre la facture. Aucune
// facture n est jamais emise sans ce geste — facturer quelqu un qui n a
// rien demande est un impaye garanti et un motif de plainte.
//
// Le prix est fige a la souscription. Une hausse de tarif ne remonte
// jamais sur un client deja engage.

export async function GET() {
  try {
    const session = sessionCourante();
    if (!session || !session.tenantId) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const { data } = await supabase
      .from("qualiopi_souscriptions")
      .select("statut, montant_ht, facture_numero, souscrit_le, regle_le, premier_export_le, nb_exports")
      .eq("tenant_id", session.tenantId)
      .maybeSingle();

    // La garantie court trente jours et tombe des que le dossier est
    // emporte. C est la seule condition, et elle se verifie ici.
    let garantie = false;
    if (data && data.statut !== "rembourse") {
      const depart = new Date(data.souscrit_le).getTime();
      const trenteJours = 30 * 24 * 60 * 60 * 1000;
      garantie = !data.premier_export_le && Date.now() - depart < trenteJours;
    }

    return NextResponse.json({
      ok: true,
      prix: PRIX,
      souscrit: !!data,
      souscription: data || null,
      garantie_ouverte: garantie,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || !session.tenantId) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const tenantId = session.tenantId;

    // Une souscription par organisme. Le second clic ne doit pas produire
    // une seconde facture.
    const { data: deja } = await supabase
      .from("qualiopi_souscriptions")
      .select("id, statut, facture_numero")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (deja) {
      return NextResponse.json({
        ok: true,
        deja: true,
        facture: deja.facture_numero,
        message: "Votre souscription est deja enregistree.",
      });
    }

    const { data: organisme } = await supabase
      .from("qualiopi_organisme")
      .select("raison_sociale, numero_da")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    const nom = (organisme && organisme.raison_sociale) || "Organisme " + String(tenantId).slice(0, 8);
    const email = session.email;

    const { data: ligne, error: eLigne } = await supabase
      .from("qualiopi_souscriptions")
      .insert({
        tenant_id: tenantId,
        raison_sociale: nom,
        email: email,
        montant_ht: PRIX,
        statut: "a_regler",
      })
      .select("id")
      .maybeSingle();

    if (eLigne) {
      return NextResponse.json({ ok: false, erreur: eLigne.message }, { status: 500 });
    }

    // LA FACTURE. Prestataire hors Union europeenne, preneur assujetti :
    // la taxe est autoliquidee par le client.
    const cleFacture = process.env.CLE_API_FACTURE || "";
    let numero: string | null = null;
    let factureId: string | null = null;

    try {
      const reponse = await fetch(new URL("/api/admin/creer-facture", req.url).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cle-facture": cleFacture,
        },
        body: JSON.stringify({
          projet: PROJET,
          tenant_id: tenantId,
          client_nom: nom,
          client_email: email,
          client_pays: "FR",
          type_client: "B2B",
          montant_ht: PRIX,
          taux_tva: 0,
          autoliquidation: true,
          zone: "UE",
          devise: "EUR",
          description: "Mr. Qualiopi — préparation à la certification Qualiopi, "
            + "accès douze mois, Référentiel National Qualité",
        }),
      });

      const jf = await reponse.json().catch(function () { return null; });

      if (jf && jf.success) {
        numero = jf.numero || null;
        factureId = jf.facture_id || null;

        await supabase
          .from("qualiopi_souscriptions")
          .update({ facture_numero: numero, facture_id: factureId })
          .eq("id", ligne ? ligne.id : "");
      }
    } catch (e) {}

    const rk = process.env.RESEND_API_KEY || "";

    if (rk) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: "Bearer " + rk, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "AcademIA Pro <contact@academiapro.fr>",
            to: ["contact@academiapro.fr"],
            subject: "Souscription Qualiopi — " + nom,
            html:
              "<div style=\"font-family:Georgia,serif\"><h2>Souscription Mr. Qualiopi</h2>"
              + "<p><b>" + nom + "</b> — " + email + "</p>"
              + "<p>Montant : " + PRIX + " € HT</p>"
              + "<p>Facture : " + (numero || "a emettre a la main") + "</p>"
              + "<p><a href=\"https://academiapro.fr/admin/facturier\">Ouvrir le facturier</a></p></div>",
          }),
        });
      } catch (e) {}
    }

    return NextResponse.json({
      ok: true,
      facture: numero,
      montant: PRIX,
      message: numero
        ? "Votre souscription est enregistree. La facture " + numero + " vous a ete adressee."
        : "Votre souscription est enregistree. La facture vous parvient sous peu.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
