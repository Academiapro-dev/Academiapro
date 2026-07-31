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
      .select("id, tenant_id, raison_sociale, email_contact, statut, abonnement_mensuel, taux_prelevement, plancher_stagiaire, lancement_jusqu_au")
      .order("raison_sociale", { ascending: true })
      .limit(500);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const { data: catalogue } = await supabase
      .from("organisme_catalogue")
      .select("tenant_id, formation_code, prix_vente_public, prix_contractuel")
      .limit(5000);

    const prixDe: any = {};
    const duCatalogue = new Set<string>();
    for (const c of catalogue || []) {
      const cle = c.tenant_id + "|" + c.formation_code;
      prixDe[cle] = Number(c.prix_vente_public) || Number(c.prix_contractuel) || 0;
      duCatalogue.add(cle);
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

      const taux = o.taux_prelevement !== null && o.taux_prelevement !== undefined
        ? Number(o.taux_prelevement)
        : 35;
      const plancher = o.plancher_stagiaire !== null && o.plancher_stagiaire !== undefined
        ? Number(o.plancher_stagiaire)
        : 30;

      let du = 0;
      let auPlancher = 0;
      let auTaux = 0;
      let horsCatalogue = 0;
      const details: any[] = [];

      for (const i of inscrits) {
        const cle = o.tenant_id + "|" + (i.formation_code || "");

        // Rien n est du sur les formations propres du client : seules celles
        // de son catalogue souscrit entrent dans le calcul.
        if (!i.formation_code || !duCatalogue.has(cle)) {
          horsCatalogue = horsCatalogue + 1;
          details.push({
            email: i.email,
            formation_code: i.formation_code,
            payeur: i.payeur,
            prix: null,
            du: 0,
            motif: "formation propre du client",
          });
          continue;
        }

        let prix = Number(i.prix_vente) || 0;
        if (!prix) prix = prixDe[cle] || 0;

        const part = Math.round(prix * taux) / 100;
        // On retient le plus eleve des deux : la part, ou le minimum par
        // stagiaire. C est ce qui rend l illimite sans risque.
        const retenu = Math.max(part, plancher);

        if (retenu === plancher && part < plancher) auPlancher = auPlancher + 1;
        else auTaux = auTaux + 1;

        du = du + retenu;

        details.push({
          email: i.email,
          formation_code: i.formation_code,
          payeur: i.payeur,
          prix: prix,
          part: part,
          du: retenu,
          motif: part < plancher ? "minimum par stagiaire" : "part au taux",
        });
      }

      du = Math.round(du * 100) / 100;

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
        taux: taux,
        plancher: plancher,
        inscriptions: inscrits.length,
        au_taux: auTaux,
        au_plancher: auPlancher,
        hors_catalogue: horsCatalogue,
        prelevement: du,
        total: Math.round((abonnement + du) * 100) / 100,
        details: details,
      };
    });

    const totalAbonnements = lignes.reduce(function (s: number, l: any) { return s + l.abonnement; }, 0);
    const totalPrelevements = lignes.reduce(function (s: number, l: any) { return s + l.prelevement; }, 0);
    const totalInscriptions = lignes.reduce(function (s: number, l: any) { return s + l.inscriptions; }, 0);
    const totalPlancher = lignes.reduce(function (s: number, l: any) { return s + l.au_plancher; }, 0);

    return NextResponse.json({
      ok: true,
      mois: libelle,
      organismes: lignes.length,
      total_abonnements: Math.round(totalAbonnements * 100) / 100,
      total_prelevements: Math.round(totalPrelevements * 100) / 100,
      total_inscriptions: totalInscriptions,
      total_au_plancher: totalPlancher,
      total: Math.round((totalAbonnements + totalPrelevements) * 100) / 100,
      lignes: lignes,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
