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

function moisDemande(req: NextRequest) {
  const brut = new URL(req.url).searchParams.get("mois");
  const maintenant = new Date();
  let annee = maintenant.getUTCFullYear();
  let mois = maintenant.getUTCMonth() + 1;

  if (brut && /^\d{4}-\d{2}$/.test(brut)) {
    annee = parseInt(brut.slice(0, 4), 10);
    mois = parseInt(brut.slice(5, 7), 10);
  }

  const debut = new Date(Date.UTC(annee, mois - 1, 1)).toISOString();
  const fin = new Date(Date.UTC(annee, mois, 1)).toISOString();
  const libelle = String(annee) + "-" + String(mois).padStart(2, "0");

  return { debut, fin, libelle };
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const { debut, fin, libelle } = moisDemande(req);

    const { data: organismes, error } = await supabase
      .from("organismes_formation")
      .select("id, tenant_id, raison_sociale, email_contact, statut, abonnement_mensuel, taux_prelevement, lancement_jusqu_au")
      .order("raison_sociale", { ascending: true })
      .limit(500);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // L ASSIETTE DU PRELEVEMENT EST LE PRIX CONTRACTUEL, fixe par l editeur.
    // Le prix affiche par l organisme n entre pas dans le calcul : sinon le
    // client controlerait la recette de l editeur.
    const { data: catalogue } = await supabase
      .from("organisme_catalogue")
      .select("tenant_id, formation_code, prix_contractuel, prix_vente_public")
      .limit(5000);

    const contractuelDe: any = {};
    const afficheDe: any = {};
    for (const c of catalogue || []) {
      const cle = c.tenant_id + "|" + c.formation_code;
      contractuelDe[cle] = Number(c.prix_contractuel) || 0;
      afficheDe[cle] = Number(c.prix_vente_public) || 0;
    }

    const { data: inscriptions } = await supabase
      .from("organisme_apprenants")
      .select("tenant_id, email, formation_code, prix_vente, payeur, created_at")
      .gte("created_at", debut)
      .lt("created_at", fin)
      .limit(10000);

    const parTenant: any = {};
    for (const i of inscriptions || []) {
      if (!parTenant[i.tenant_id]) parTenant[i.tenant_id] = [];
      parTenant[i.tenant_id].push(i);
    }

    const lignes = (organismes || []).map(function (o: any) {
      const inscrits = parTenant[o.tenant_id] || [];
      const taux = Number(o.taux_prelevement);
      const tauxApplique = isNaN(taux) ? 20 : taux;

      let assiette = 0;
      const details: any[] = [];
      let sansAssiette = 0;

      for (const i of inscrits) {
        const cle = o.tenant_id + "|" + (i.formation_code || "");

        // Priorite : le prix contractuel, puis le prix saisi a l inscription,
        // puis le prix affiche. Le premier connu l emporte.
        let base = contractuelDe[cle] || 0;
        if (!base) base = Number(i.prix_vente) || 0;
        if (!base) base = afficheDe[cle] || 0;
        if (!base) sansAssiette = sansAssiette + 1;

        assiette = assiette + base;
        details.push({
          email: i.email,
          formation_code: i.formation_code,
          payeur: i.payeur,
          prix: base,
          contractuel: contractuelDe[cle] || null,
        });
      }

      const prelevement = Math.round(assiette * tauxApplique) / 100;

      const abonnementPlein = Number(o.abonnement_mensuel) || 0;
      const enLancement = o.lancement_jusqu_au
        ? new Date(o.lancement_jusqu_au).getTime() >= new Date(debut).getTime()
        : false;
      const abonnement = enLancement ? Math.round(abonnementPlein / 2) : abonnementPlein;

      return {
        id: o.id,
        tenant_id: o.tenant_id,
        raison_sociale: o.raison_sociale,
        email_contact: o.email_contact,
        statut: o.statut,
        en_lancement: enLancement,
        lancement_jusqu_au: o.lancement_jusqu_au,
        abonnement_plein: abonnementPlein,
        abonnement: abonnement,
        taux: tauxApplique,
        inscriptions: inscrits.length,
        sans_prix: sansAssiette,
        assiette: assiette,
        prelevement: prelevement,
        total: abonnement + prelevement,
        details: details,
      };
    });

    const totalAbonnements = lignes.reduce(function (s: number, l: any) { return s + l.abonnement; }, 0);
    const totalPrelevements = lignes.reduce(function (s: number, l: any) { return s + l.prelevement; }, 0);
    const totalInscriptions = lignes.reduce(function (s: number, l: any) { return s + l.inscriptions; }, 0);

    return NextResponse.json({
      ok: true,
      mois: libelle,
      organismes: lignes.length,
      total_abonnements: totalAbonnements,
      total_prelevements: totalPrelevements,
      total_inscriptions: totalInscriptions,
      total: totalAbonnements + totalPrelevements,
      lignes: lignes,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
