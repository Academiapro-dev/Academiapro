import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const PRODUIT = "pack";
const PROJET = "academia";

// GRILLE DU PACK, TELLE QUE LE CONTRAT L ECRIT.
//
// Mise en service, UNE SEULE FOIS, a la premiere facture. La date de
// facturation est enregistree a la fiche : sans ce marqueur, un cron
// mensuel la reprendrait chaque mois.
//
// Abonnement mensuel, du quel que soit l usage.
//
// Puis, POUR CHAQUE STAGIAIRE INSCRIT DANS LE MOIS, selon l origine de son
// inscription :
//
//   catalogue : le taux de la fiche s applique au prix de vente. Un minimum
//               par stagiaire est du lorsque la part calculee lui est
//               inferieure — il couvre les couts que chaque inscription
//               engendre, meme quand la formation n est vendue a personne.
//   propre    : formation creee par le Client, elle lui appartient. AUCUNE
//               part. Le minimum ne s applique pas davantage.
//   orientee  : affaire trouvee par l Editeur et confiee au Client, qui
//               seul detient la certification exigee. Partage a 50 %.
//
// GESTION ADMINISTRATIVE. Quand le Client l a souscrite, le forfait par
// stagiaire REMPLACE le minimum, il ne s y ajoute pas. Et le taux sur le
// catalogue est reduit — c est la contrepartie ecrite au contrat.
const TAUX_ORIENTEE_DEFAUT = 50;

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const autorisation = req.headers.get("authorization") || "";
    const secretCron = process.env.CRON_SECRET || "";
    const parCron = secretCron.length > 0 && autorisation === "Bearer " + secretCron;

    const cle = req.headers.get("x-cle-facture") || url.searchParams.get("cle") || "";
    const cleFacture = process.env.CLE_API_FACTURE || "";
    const parCle = cleFacture.length > 0 && cle === cleFacture;

    if (!parCron && !parCle) {
      return NextResponse.json({ ok: false, erreur: "Non autorise" }, { status: 401 });
    }

    // Periode : le mois ECOULE par defaut.
    const force = url.searchParams.get("periode");
    let annee: number;
    let mois: number;

    if (force && /^\d{4}-\d{2}$/.test(force)) {
      annee = parseInt(force.slice(0, 4), 10);
      mois = parseInt(force.slice(5, 7), 10);
    } else {
      const now = new Date();
      const p = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      annee = p.getUTCFullYear();
      mois = p.getUTCMonth() + 1;
    }

    const periode = String(annee) + "-" + String(mois).padStart(2, "0");
    const debut = new Date(Date.UTC(annee, mois - 1, 1)).toISOString();
    const fin = new Date(Date.UTC(annee, mois, 1)).toISOString();

    const essai = url.searchParams.get("essai") === "1";

    const { data: clients, error: eCli } = await supabase
      .from("organismes_formation")
      .select("tenant_id, raison_sociale, email_contact, numero_tva, statut, profils, "
        + "abonnement_mensuel, taux_prelevement, plancher_stagiaire, forfait_gestion, "
        + "gestion_souscrite, taux_apport, frais_installation, mise_en_service_facturee_le")
      .limit(2000);

    if (eCli) {
      return NextResponse.json({ ok: false, erreur: eCli.message }, { status: 500 });
    }

    const resultats: any[] = [];

    for (const org of clients || []) {
      const tenant = org.tenant_id;
      if (!tenant) continue;

      // Un cabinet comptable seul est facture par l autre route.
      const profils = Array.isArray(org.profils) ? org.profils : [];
      const seulementComptable = profils.length === 1 && profils[0] === "cabinet_comptable";
      if (seulementComptable) continue;

      // Un client suspendu ou resilie n est pas facture.
      const statut = String(org.statut || "").toLowerCase();
      if (statut === "suspendu" || statut === "resilie" || statut === "annule") {
        resultats.push({ tenant, client: org.raison_sociale, statut: "client " + statut });
        continue;
      }

      const abonnement = Number(org.abonnement_mensuel) || 0;
      const gestionSouscrite = org.gestion_souscrite === true;

      const taux = org.taux_prelevement !== null && org.taux_prelevement !== undefined
        ? Number(org.taux_prelevement)
        : (gestionSouscrite ? 10 : 40);
      const plancher = org.plancher_stagiaire !== null && org.plancher_stagiaire !== undefined
        ? Number(org.plancher_stagiaire)
        : 30;
      const forfait = gestionSouscrite && org.forfait_gestion !== null && org.forfait_gestion !== undefined
        ? Number(org.forfait_gestion)
        : 0;
      const tauxOrientee = org.taux_apport !== null && org.taux_apport !== undefined
        ? Number(org.taux_apport)
        : TAUX_ORIENTEE_DEFAUT;

      // MISE EN SERVICE : une seule fois, jamais reprise.
      const fraisFiche = Number(org.frais_installation) || 0;
      const dejaFacturee = !!org.mise_en_service_facturee_le;
      const miseEnService = !dejaFacturee && fraisFiche > 0 ? fraisFiche : 0;

      // Les stagiaires inscrits DANS LE MOIS. Le fait generateur est
      // l inscription, pas l achevement : le contrat le dit expressement.
      const { data: inscrits, error: eIns } = await supabase
        .from("organisme_apprenants")
        .select("email, formation_code, prix_vente, origine, created_at")
        .eq("tenant_id", tenant)
        .gte("created_at", debut)
        .lt("created_at", fin)
        .limit(20000);

      if (eIns) {
        resultats.push({ tenant, client: org.raison_sociale, statut: "lecture impossible", detail: eIns.message });
        continue;
      }

      let partCatalogue = 0;
      let partOrientee = 0;
      let partGestion = 0;
      let nbCatalogue = 0;
      let nbPropres = 0;
      let nbOrientees = 0;

      for (const i of inscrits || []) {
        const origine = String(i.origine || "catalogue").toLowerCase();
        const prix = Number(i.prix_vente) || 0;

        if (origine === "orientee") {
          nbOrientees = nbOrientees + 1;
          partOrientee = partOrientee + prix * (tauxOrientee / 100);
          if (forfait > 0) partGestion = partGestion + forfait;
          continue;
        }

        if (origine === "propre") {
          nbPropres = nbPropres + 1;
          // Aucune part sur les formations du Client. Seule la gestion,
          // si elle est souscrite, est due pour ce stagiaire.
          if (forfait > 0) partGestion = partGestion + forfait;
          continue;
        }

        // Catalogue de l Editeur.
        nbCatalogue = nbCatalogue + 1;
        const part = prix * (taux / 100);

        if (forfait > 0) {
          // Le forfait remplace le minimum : on prend la part calculee,
          // sans plancher, et le forfait s ajoute une fois par stagiaire.
          partCatalogue = partCatalogue + part;
          partGestion = partGestion + forfait;
        } else {
          partCatalogue = partCatalogue + Math.max(part, plancher);
        }
      }

      partCatalogue = r2(partCatalogue);
      partOrientee = r2(partOrientee);
      partGestion = r2(partGestion);

      const montant_ht = r2(miseEnService + abonnement + partCatalogue + partOrientee + partGestion);

      if (montant_ht <= 0) {
        resultats.push({ tenant, client: org.raison_sociale, statut: "rien a facturer" });
        continue;
      }

      const lignes: string[] = [];
      if (miseEnService > 0) {
        lignes.push("mise en service " + miseEnService + " € HT, facturée une seule fois");
      }
      lignes.push("abonnement " + abonnement + " € HT");
      if (nbCatalogue > 0) {
        lignes.push(nbCatalogue + " stagiaire(s) catalogue à " + taux + " % : " + partCatalogue.toFixed(2) + " € HT");
      }
      if (nbOrientees > 0) {
        lignes.push(nbOrientees + " affaire(s) orientée(s) à " + tauxOrientee + " % : " + partOrientee.toFixed(2) + " € HT");
      }
      if (partGestion > 0) {
        const nbGeres = nbCatalogue + nbPropres + nbOrientees;
        lignes.push("gestion administrative, " + nbGeres + " stagiaire(s) × " + forfait + " € HT : " + partGestion.toFixed(2) + " € HT");
      }
      if (nbPropres > 0 && partGestion === 0) {
        lignes.push(nbPropres + " stagiaire(s) sur vos formations propres : sans part");
      }

      const description = "Pack LMS et CRM — période " + periode + " : " + lignes.join(" ; ");

      if (essai) {
        resultats.push({
          tenant,
          client: org.raison_sociale,
          periode,
          mise_en_service: miseEnService,
          mise_en_service_deja_facturee: dejaFacturee,
          abonnement,
          catalogue: { nombre: nbCatalogue, taux: taux, montant: partCatalogue },
          orientees: { nombre: nbOrientees, taux: tauxOrientee, montant: partOrientee },
          propres: nbPropres,
          gestion: { souscrite: gestionSouscrite, forfait: forfait, montant: partGestion },
          montant_ht,
          numero_tva: org.numero_tva || null,
          statut: "essai, rien emis",
        });
        continue;
      }

      // Verrou d unicite : (tenant, periode, produit). C est la base qui
      // empeche la double facturation, pas le code.
      const { error: eVerrou } = await supabase
        .from("facturation_periodes")
        .insert({
          tenant_id: tenant,
          periode: periode,
          produit: PRODUIT,
          nb_dossiers: nbCatalogue + nbPropres + nbOrientees,
          montant_ht: montant_ht,
        });

      if (eVerrou) {
        resultats.push({ tenant, client: org.raison_sociale, periode, statut: "deja facture" });
        continue;
      }

      const reponse = await fetch(new URL("/api/admin/creer-facture", req.url).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cle-facture": cleFacture,
        },
        body: JSON.stringify({
          projet: PROJET,
          tenant_id: tenant,
          client_nom: org.raison_sociale || "Client " + String(tenant).slice(0, 8),
          client_email: org.email_contact || null,
          client_pays: "FR",
          type_client: "B2B",
          numero_tva_client: org.numero_tva || null,
          montant_ht: montant_ht,
          taux_tva: 0,
          autoliquidation: true,
          zone: "UE",
          devise: "EUR",
          description: description,
        }),
      });

      const jf = await reponse.json().catch(function () { return null; });

      if (!jf || !jf.success) {
        await supabase
          .from("facturation_periodes")
          .delete()
          .eq("tenant_id", tenant)
          .eq("periode", periode)
          .eq("produit", PRODUIT);

        resultats.push({
          tenant,
          client: org.raison_sociale,
          periode,
          statut: "echec facture",
          detail: (jf && jf.error) || "reponse illisible",
        });
        continue;
      }

      await supabase
        .from("facturation_periodes")
        .update({ facture_numero: jf.numero, facture_id: jf.facture_id })
        .eq("tenant_id", tenant)
        .eq("periode", periode)
        .eq("produit", PRODUIT);

      // La mise en service est marquee APRES l emission : si la facture
      // avait echoue, elle doit pouvoir repartir au prochain passage.
      if (miseEnService > 0) {
        await supabase
          .from("organismes_formation")
          .update({ mise_en_service_facturee_le: new Date().toISOString() })
          .eq("tenant_id", tenant);
      }

      resultats.push({
        tenant,
        client: org.raison_sociale,
        periode,
        mise_en_service: miseEnService,
        abonnement,
        catalogue: { nombre: nbCatalogue, taux: taux, montant: partCatalogue },
        orientees: { nombre: nbOrientees, taux: tauxOrientee, montant: partOrientee },
        propres: nbPropres,
        gestion: { souscrite: gestionSouscrite, forfait: forfait, montant: partGestion },
        montant_ht,
        numero: jf.numero,
        sans_tva_client: !org.numero_tva,
        statut: "facture emise",
      });
    }

    return NextResponse.json({
      ok: true,
      periode: periode,
      produit: PRODUIT,
      declencheur: parCron ? "cron" : "manuel",
      clients: resultats.length,
      resultats: resultats,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
