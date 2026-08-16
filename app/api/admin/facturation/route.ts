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
      .select("id, tenant_id, raison_sociale, email_contact, statut, abonnement_mensuel, taux_prelevement, plancher_stagiaire, forfait_gestion, gestion_souscrite")
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

    // LES FORMATIONS PROPRES REDIGEES PAR L ASSISTANT — 90 EUR HT chacune.
    //
    // Le montant est pose par /api/organisme/rediger-module au PREMIER module
    // de chaque formation, jamais ensuite : une formation de vingt modules
    // porte donc une seule ligne a 90 EUR. Ici on ne fait que RELEVER ce qui a
    // deja ete decide la-bas — aucun calcul n est refait, sans quoi les deux
    // routes pourraient diverger.
    //
    // Sans ce releve, le montant restait enregistre en base sans jamais
    // apparaitre sur aucune facture.
    const { data: redactions } = await supabase
      .from("organisme_usage_ia")
      .select("tenant_id, cours_id, reference, montant_facture, created_at")
      .eq("type", "redaction_module")
      .gt("montant_facture", 0)
      .gte("created_at", debut)
      .lt("created_at", fin)
      .limit(5000);

    const redactionsDe: any = {};
    for (const r of redactions || []) {
      if (!redactionsDe[r.tenant_id]) redactionsDe[r.tenant_id] = [];
      redactionsDe[r.tenant_id].push(r);
    }

    const lignes = (organismes || []).map(function (o: any) {
      const inscrits = parTenant[o.tenant_id] || [];

      const taux = o.taux_prelevement !== null && o.taux_prelevement !== undefined
        ? Number(o.taux_prelevement)
        : 35;
      const plancher = o.plancher_stagiaire !== null && o.plancher_stagiaire !== undefined
        ? Number(o.plancher_stagiaire)
        : 30;

      // GESTION ADMINISTRATIVE. Optionnelle : elle n est due que si le client
      // l a souscrite. Elle remplace alors le minimum par stagiaire, sans s y
      // ajouter — c est ce que dit son contrat et son bon de commande.
      const gestionSouscrite = o.gestion_souscrite === true;
      const forfaitGestion = o.forfait_gestion !== null && o.forfait_gestion !== undefined
        ? Number(o.forfait_gestion)
        : 0;
      const minimum = gestionSouscrite && forfaitGestion > 0 ? forfaitGestion : plancher;

      // Un organisme suspendu n est plus facture : ni abonnement, ni
      // inscriptions. On le presente quand meme, pour qu il ne disparaisse pas
      // du suivi.
      const suspendu = o.statut !== "actif";

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
        // On retient le plus eleve des deux : la part, ou le minimum retenu
        // pour ce client. C est ce qui rend l illimite sans risque.
        const retenu = Math.max(part, minimum);

        if (retenu === minimum && part < minimum) auPlancher = auPlancher + 1;
        else auTaux = auTaux + 1;

        du = du + retenu;

        details.push({
          email: i.email,
          formation_code: i.formation_code,
          payeur: i.payeur,
          prix: prix,
          part: part,
          du: retenu,
          motif: part < minimum
            ? (gestionSouscrite && forfaitGestion > 0
                ? "forfait gestion administrative"
                : "minimum par stagiaire")
            : "part au taux",
        });
      }

      du = Math.round(du * 100) / 100;

      // Les redactions du mois pour ce client. Un organisme suspendu n en
      // porte aucune : il ne peut plus rien produire.
      const sesRedactions = redactionsDe[o.tenant_id] || [];
      const montantRedactions = suspendu
        ? 0
        : Math.round(sesRedactions.reduce(function (s: number, r: any) {
            return s + (Number(r.montant_facture) || 0);
          }, 0) * 100) / 100;

      const detailsRedactions = sesRedactions.map(function (r: any) {
        return {
          reference: r.reference,
          cours_id: r.cours_id,
          montant: Number(r.montant_facture) || 0,
          le: r.created_at,
        };
      });

      // 🚨 PLUS AUCUN TARIF DE LANCEMENT. Ce calcul divisait l abonnement PAR
      // DEUX des que la colonne lancement_jusqu_au portait une date. Supprime
      // le 16/08 sur decision de Jacques : « je n ai pas demande a ce qu on
      // mette le lancement a 50 % du prix ». Le montant facture est TOUJOURS
      // le prix plein. Ne pas le reintroduire.
      const abonnementPlein = Number(o.abonnement_mensuel) || 0;

      const abonnement = suspendu ? 0 : abonnementPlein;
      const prelevement = suspendu ? 0 : du;

      return {
        id: o.id,
        tenant_id: o.tenant_id,
        raison_sociale: o.raison_sociale,
        email_contact: o.email_contact,
        statut: o.statut,
        suspendu: suspendu,
        abonnement_plein: abonnementPlein,
        abonnement: abonnement,
        taux: taux,
        plancher: plancher,
        gestion_souscrite: gestionSouscrite,
        forfait_gestion: forfaitGestion,
        minimum_retenu: minimum,
        inscriptions: inscrits.length,
        au_taux: auTaux,
        au_plancher: auPlancher,
        hors_catalogue: horsCatalogue,
        prelevement: prelevement,
        formations_redigees: sesRedactions.length,
        redactions: montantRedactions,
        details_redactions: detailsRedactions,
        total: Math.round((abonnement + prelevement + montantRedactions) * 100) / 100,
        details: details,
      };
    });

    const totalAbonnements = lignes.reduce(function (s: number, l: any) { return s + l.abonnement; }, 0);
    const totalPrelevements = lignes.reduce(function (s: number, l: any) { return s + l.prelevement; }, 0);
    const totalRedactions = lignes.reduce(function (s: number, l: any) { return s + l.redactions; }, 0);
    const totalInscriptions = lignes.reduce(function (s: number, l: any) {
      return s + (l.suspendu ? 0 : l.inscriptions);
    }, 0);
    const totalPlancher = lignes.reduce(function (s: number, l: any) {
      return s + (l.suspendu ? 0 : l.au_plancher);
    }, 0);
    const totalFormationsRedigees = lignes.reduce(function (s: number, l: any) {
      return s + l.formations_redigees;
    }, 0);

    return NextResponse.json({
      ok: true,
      mois: libelle,
      organismes: lignes.length,
      suspendus: lignes.filter(function (l: any) { return l.suspendu; }).length,
      total_abonnements: Math.round(totalAbonnements * 100) / 100,
      total_prelevements: Math.round(totalPrelevements * 100) / 100,
      total_redactions: Math.round(totalRedactions * 100) / 100,
      total_formations_redigees: totalFormationsRedigees,
      total_inscriptions: totalInscriptions,
      total_au_plancher: totalPlancher,
      total: Math.round((totalAbonnements + totalPrelevements + totalRedactions) * 100) / 100,
      lignes: lignes,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
