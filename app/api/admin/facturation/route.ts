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
      .select("id, tenant_id, raison_sociale, email_contact, statut, abonnement_mensuel, taux_prelevement, plancher_stagiaire")
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
        : 40;
      const redevance = o.plancher_stagiaire !== null && o.plancher_stagiaire !== undefined
        ? Number(o.plancher_stagiaire)
        : 30;

      // Un organisme suspendu n est plus facture : ni abonnement, ni
      // inscriptions. On le presente quand meme, pour qu il ne disparaisse
      // pas du suivi.
      const suspendu = o.statut !== "actif";

      let partTotale = 0;
      let redevanceTotale = 0;
      let horsCatalogue = 0;
      let facturees = 0;
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
            part: 0,
            redevance: 0,
            du: 0,
            motif: "formation propre du client",
          });
          continue;
        }

        let prix = Number(i.prix_vente) || 0;
        if (!prix) prix = prixDe[cle] || 0;

        // 🚨🚨 LA PART ET LA REDEVANCE S'ADDITIONNENT — corrige le 17/08.
        //
        // LA GRILLE DEFINITIVE, arretee en fin de journee :
        //   390 EUR HT par mois (LMS + CRM)
        //   + 40 % du prix de vente hors taxes
        //   + 30 EUR HT PAR STAGIAIRE INSCRIT, QUI S'AJOUTENT
        // La gestion administrative est COMPRISE, bilan pedagogique et
        // financier annuel inclus. Aucune option a facturer separement.
        //
        // 🚨 CE QUE CETTE CORRECTION REPARE, ET C'ETAIT UNE PERTE SECHE : le
        // code retenait `Math.max(part, plancher)` — le plus eleve des deux.
        // Sur une formation vendue 600 EUR, la part fait 240 EUR et les
        // 30 EUR n'entraient JAMAIS dans le calcul. Pour cent stagiaires,
        // c'etaient 3 000 EUR par an qui n'auraient jamais ete factures.
        //
        // ⚠️ LE MOT « MINIMUM » NE CONVIENT PLUS. Ce n'est plus un plancher
        // qui se substitue a la part quand celle-ci est trop faible, c'est
        // une REDEVANCE PAR STAGIAIRE INSCRIT qui s'y ajoute toujours. Le bon
        // de commande porte encore la phrase « lorsque la part calculee lui
        // est superieure, seule cette part est due » : ELLE EST DEVENUE
        // FAUSSE et un client s'en servirait pour refuser la redevance. A
        // reecrire dans le document.
        //
        // POURQUOI CE MONTAGE PLUTOT QUE LES 35 % + 49 EUR PAR MOIS ET PAR
        // STAGIAIRE ACTIF, envisages l'apres-midi meme : celui-la obligeait a
        // compter l'activite mois par mois, et surtout il entrait en
        // contradiction avec la promesse d'une gestion annuelle — le bilan
        // pedagogique se produit en janvier alors que les stagiaires ont fini
        // en juin, et plus rien n'aurait ete facture depuis six mois. Ses
        // mots : « on va rester prudent ».
        const part = Math.round(prix * taux) / 100;
        const du = Math.round((part + redevance) * 100) / 100;

        partTotale = partTotale + part;
        redevanceTotale = redevanceTotale + redevance;
        facturees = facturees + 1;

        details.push({
          email: i.email,
          formation_code: i.formation_code,
          payeur: i.payeur,
          prix: prix,
          part: part,
          redevance: redevance,
          du: du,
          motif: taux + " % + " + redevance + " EUR par stagiaire",
        });
      }

      partTotale = Math.round(partTotale * 100) / 100;
      redevanceTotale = Math.round(redevanceTotale * 100) / 100;
      const du = Math.round((partTotale + redevanceTotale) * 100) / 100;

      // 🚨 PLUS AUCUN TARIF DE LANCEMENT. Ce calcul divisait l abonnement PAR
      // DEUX des que la colonne lancement_jusqu_au portait une date. Supprime
      // le 16/08 : le montant facture est TOUJOURS le prix plein.
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
        redevance_unitaire: redevance,
        inscriptions: inscrits.length,
        facturees: suspendu ? 0 : facturees,
        hors_catalogue: horsCatalogue,
        part_totale: suspendu ? 0 : partTotale,
        redevance_totale: suspendu ? 0 : redevanceTotale,
        prelevement: prelevement,
        total: Math.round((abonnement + prelevement) * 100) / 100,
        details: details,
      };
    });

    const totalAbonnements = lignes.reduce(function (s: number, l: any) { return s + l.abonnement; }, 0);
    const totalPrelevements = lignes.reduce(function (s: number, l: any) { return s + l.prelevement; }, 0);
    const totalParts = lignes.reduce(function (s: number, l: any) { return s + l.part_totale; }, 0);
    const totalRedevances = lignes.reduce(function (s: number, l: any) { return s + l.redevance_totale; }, 0);
    const totalInscriptions = lignes.reduce(function (s: number, l: any) {
      return s + (l.suspendu ? 0 : l.inscriptions);
    }, 0);

    return NextResponse.json({
      ok: true,
      mois: libelle,
      organismes: lignes.length,
      suspendus: lignes.filter(function (l: any) { return l.suspendu; }).length,
      total_abonnements: Math.round(totalAbonnements * 100) / 100,
      total_prelevements: Math.round(totalPrelevements * 100) / 100,
      total_parts: Math.round(totalParts * 100) / 100,
      total_redevances: Math.round(totalRedevances * 100) / 100,
      total_inscriptions: totalInscriptions,
      total: Math.round((totalAbonnements + totalPrelevements) * 100) / 100,
      lignes: lignes,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
