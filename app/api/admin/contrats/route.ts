import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

function jours(depuis: any): number {
  if (!depuis) return 0;
  const t = new Date(depuis).getTime();
  if (!t) return 0;
  return Math.floor((Date.now() - t) / 86400000);
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const { data: organismes } = await supabase
      .from("organismes_formation")
      .select("id, tenant_id, raison_sociale, email_contact, statut, abonnement_mensuel, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    const { data: documents } = await supabase
      .from("organisme_documents")
      .select("tenant_id, type, reference, stagiaire_email, emis_le, donnees")
      .eq("type", "bon_commande")
      .order("emis_le", { ascending: false })
      .limit(2000);

    const { data: signatures } = await supabase
      .from("organisme_signatures")
      .select("tenant_id, document_type, document_reference, signataire_email, signataire_nom, signataire_qualite, signe_le, annulee, code_verifie_le, empreinte_sha256")
      .limit(5000);

    // Une signature vaut pour la reference du document qu elle scelle.
    const signeePour: any = {};
    for (const s of signatures || []) {
      if (s.annulee) continue;
      if (!s.document_reference) continue;
      const actuelle = signeePour[s.document_reference];
      if (!actuelle || new Date(s.signe_le).getTime() > new Date(actuelle.signe_le).getTime()) {
        signeePour[s.document_reference] = s;
      }
    }

    // On ne garde que le dernier bon edite par client : c est celui qui
    // fait foi, les precedents sont des brouillons remplaces.
    const dernierBon: any = {};
    for (const d of documents || []) {
      if (!dernierBon[d.tenant_id]) dernierBon[d.tenant_id] = d;
    }

    const { data: coffre } = await supabase
      .from("coffre_documents")
      .select("tenant_id, categorie, signe")
      .limit(2000);

    const auCoffre: any = {};
    let contratsPropres = 0;
    for (const c of coffre || []) {
      if (!c.tenant_id) {
        contratsPropres = contratsPropres + 1;
        continue;
      }
      auCoffre[c.tenant_id] = (auCoffre[c.tenant_id] || 0) + 1;
    }

    const lignes = (organismes || []).map(function (o: any) {
      const bon = dernierBon[o.tenant_id] || null;
      const signature = bon ? signeePour[bon.reference] || null : null;

      let etat = "sans_bon";
      if (bon && signature) etat = "signe";
      else if (bon) etat = "en_attente";

      return {
        id: o.id,
        tenant_id: o.tenant_id,
        raison_sociale: o.raison_sociale,
        email_contact: o.email_contact,
        statut: o.statut,
        abonnement: Number(o.abonnement_mensuel) || 0,
        etat: etat,
        reference: bon ? bon.reference : null,
        emis_le: bon ? bon.emis_le : null,
        jours_attente: bon && !signature ? jours(bon.emis_le) : 0,
        signe_le: signature ? signature.signe_le : null,
        signataire: signature
          ? {
              nom: signature.signataire_nom,
              email: signature.signataire_email,
              qualite: signature.signataire_qualite,
              code_verifie: !!signature.code_verifie_le,
              empreinte: signature.empreinte_sha256,
            }
          : null,
        pieces_coffre: auCoffre[o.tenant_id] || 0,
      };
    });

    const signes = lignes.filter(function (l: any) { return l.etat === "signe"; }).length;
    const attente = lignes.filter(function (l: any) { return l.etat === "en_attente"; });
    const sansBon = lignes.filter(function (l: any) { return l.etat === "sans_bon"; }).length;

    // Ceux qui refroidissent : un bon envoye il y a plus de dix jours et
    // toujours pas signe, c est une affaire qui s eloigne.
    const relancer = attente.filter(function (l: any) { return l.jours_attente >= 10; });

    return NextResponse.json({
      ok: true,
      total: lignes.length,
      signes: signes,
      en_attente: attente.length,
      sans_bon: sansBon,
      a_relancer: relancer.length,
      contrats_propres: contratsPropres,
      lignes: lignes,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
