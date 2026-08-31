import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const EXPEDITEUR = "Mr. Comptable <contact@academiapro.fr>";

// ---------------------------------------------------------------------------
// L EMISSION AUTOMATIQUE DES ABONNEMENTS.
//
// Chaque matin, les echeances arrivees produisent leur facture. Le cabinet
// n a rien a faire — c est tout l objet de la facturation recurrente.
//
// 🚨 DEUX COMPORTEMENTS, SELON CE QUE LE CABINET A CHOISI :
//
//   envoi_auto = false (par defaut) — un BROUILLON est cree, sans numero.
//     Le cabinet le relit et l emet lui-meme. Rien ne part sans son accord.
//
//   envoi_auto = true — la facture est numerotee, figee, et envoyee au
//     client. C est un choix explicite, jamais une valeur par defaut : un
//     cabinet qui decouvre qu une facture est partie sans qu il l ait vue
//     coupe la fonction et ne la rallume jamais.
//
// ⚠️ LE RATTRAPAGE. Si le cron n a pas tourne pendant trois jours, les
// echeances passees sont traitees a leur tour — mais UNE SEULE FOIS par
// echeance, parce que prochaine_emission avance a chaque emission. Un
// abonnement mensuel ne produira jamais deux factures pour le meme mois.
// ---------------------------------------------------------------------------

const FREQUENCES: any = {
  mensuelle: 1,
  trimestrielle: 3,
  semestrielle: 6,
  annuelle: 12,
};

// Plafond par passage : un cabinet qui decouvre cinquante factures parties
// le meme matin panique, meme si elles sont justes.
const PLAFOND = 100;

function r2(n: any): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function euros(n: any): string {
  return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
}

function jourISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function echapper(t: any): string {
  return String(t === null || t === undefined ? "" : t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ⚠️ LE 31 N EXISTE PAS TOUS LES MOIS. Un abonnement cale au 31 doit tomber
// le 28 en fevrier, pas deborder sur le 3 mars — ce que fait JavaScript si
// on le laisse faire.
function prochaine(depuis: Date, frequence: string, jourDuMois: number): string {
  const pas = FREQUENCES[frequence] || 1;
  const annee = depuis.getUTCFullYear();
  const mois = depuis.getUTCMonth() + pas;
  const dernierJour = new Date(Date.UTC(annee, mois + 1, 0)).getUTCDate();
  const jour = Math.min(Math.max(1, jourDuMois || 1), dernierJour);
  return jourISO(new Date(Date.UTC(annee, mois, jour)));
}

// LE NUMERO — la meme serie que les factures manuelles.
//
// 🚨 PAS DE SERIE PARALLELE. Deux numerotations distinctes feraient deux
// suites avec des trous chacune, et un controleur demanderait pourquoi.
async function numeroSuivant(tenant: string): Promise<string> {
  const annee = new Date().getFullYear();
  const prefixe = "F-" + annee + "-";

  const { data } = await supabase
    .from("devis_factures")
    .select("numero")
    .eq("tenant_id", tenant)
    .in("type", ["facture", "avoir"])
    .not("numero", "is", null)
    .order("numero", { ascending: false })
    .limit(1);

  let dernier = 0;
  if (data && data.length > 0 && data[0].numero) {
    const morceaux = String(data[0].numero).split("-");
    const n = parseInt(morceaux[morceaux.length - 1], 10);
    if (!isNaN(n)) dernier = n;
  }

  return prefixe + String(dernier + 1).padStart(4, "0");
}

export async function GET(req: NextRequest) {
  const debut = Date.now();

  try {
    const autorisation = req.headers.get("authorization") || "";
    const secretCron = process.env.CRON_SECRET || "";
    const cleFacture = process.env.CLE_API_FACTURE || "";

    const parCron = secretCron.length > 0 && autorisation === "Bearer " + secretCron;

    let fournie = req.nextUrl.searchParams.get("cle") || "";
    try {
      fournie = decodeURIComponent(fournie);
    } catch (e) {
      // deja decodee
    }
    fournie = fournie.trim();

    const parCle = fournie.length > 0
      && ((secretCron.length > 0 && fournie === secretCron)
        || (cleFacture.length > 0 && fournie === cleFacture));

    if (!parCron && !parCle) {
      // 🚨 LE DIAGNOSTIC EST SORTI DE LA REPONSE — 31/08.
      //
      // CE QUE CETTE ROUTE DISAIT A QUI L APPELAIT SANS CLE : la longueur
      // exacte de CRON_SECRET et celle de CLE_API_FACTURE. Connaitre la
      // LONGUEUR d un secret reduit considerablement le travail de qui
      // cherche a le deviner — et l information s obtenait en un appel,
      // depuis n importe quel navigateur.
      //
      // LE BESOIN D ORIGINE RESTE LEGITIME : un refus muet est
      // indebogable, et c est pour cela que ce diagnostic existait. Il est
      // donc CONSERVE — mais ecrit dans les journaux Vercel, ou seul
      // Jacques le lit, jamais dans la reponse HTTP.
      //
      // POUR LE RELIRE : tableau de bord Vercel, onglet Logs, filtrer sur
      // cette route. Le detail y figure a chaque refus.
      console.error("[cron/facturation-recurrente] refus d autorisation", {
        longueur_recue: fournie.length,
        longueur_cron_secret: secretCron.length,
        longueur_cle_facture: cleFacture.length,
        entete_presente: autorisation.length > 0,
      });
      return NextResponse.json({ ok: false, erreur: "Non autorise" }, { status: 401 });
    }

    // 🚨 L ESSAI NE PRODUIT RIEN. Il montre ce qui SERAIT facture, a qui, et
    // pour combien. Avant de laisser un cron emettre des factures chez un
    // cabinet, on regarde ce qu il ferait.
    const essai = req.nextUrl.searchParams.get("essai") === "1";

    const aujourdhui = jourISO(new Date());

    const { data: abonnements, error } = await supabase
      .from("facturation_recurrente")
      .select("*")
      .eq("actif", true)
      .lte("prochaine_emission", aujourdhui)
      .order("prochaine_emission", { ascending: true })
      .limit(PLAFOND);

    if (error) {
      return NextResponse.json({
        ok: false,
        erreur: error.message,
        aide: error.message.indexOf("facturation_recurrente") >= 0
          ? "La table facturation_recurrente n existe pas encore."
          : undefined,
      }, { status: 500 });
    }

    if (!abonnements || abonnements.length === 0) {
      return NextResponse.json({
        ok: true,
        info: "aucune echeance aujourd hui",
        emises: 0,
      });
    }

    let emises = 0;
    let brouillons = 0;
    let envoyees = 0;
    const resultats: any[] = [];

    for (const a of abonnements) {
      if ((Date.now() - debut) / 1000 > 240) {
        resultats.push({ info: "arret a 240 secondes, reprise au prochain passage" });
        break;
      }

      // L abonnement arrive a son terme : on le desactive plutot que de le
      // facturer une fois de trop.
      if (a.date_fin && String(a.date_fin).slice(0, 10) < aujourdhui) {
        if (!essai) {
          await supabase
            .from("facturation_recurrente")
            .update({ actif: false })
            .eq("id", a.id);
        }
        resultats.push({
          abonnement: a.libelle,
          client: a.client_nom,
          statut: "terminé, désactivé",
        });
        continue;
      }

      const lignes = Array.isArray(a.lignes) ? a.lignes : [];
      if (lignes.length === 0) {
        resultats.push({
          abonnement: a.libelle,
          client: a.client_nom,
          statut: "aucune ligne, ignoré",
        });
        continue;
      }

      let ht = 0, tva = 0, ttc = 0;
      for (const l of lignes) {
        ht = ht + (Number(l.total_ht) || 0);
        tva = tva + (Number(l.total_tva) || 0);
        ttc = ttc + (Number(l.total_ttc) || 0);
      }

      const maintenant = new Date();
      const echeance = new Date(maintenant.getTime()
        + (Number(a.delai_paiement) || 30) * 86400000);

      // LA PERIODE FACTUREE FIGURE DANS L OBJET. « Honoraires » tout seul ne
      // dit pas de quel mois il s agit, et le client appelle pour demander.
      const periode = maintenant.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
      const objet = String((a.objet || a.libelle) + " — " + periode).slice(0, 300);

      if (essai) {
        resultats.push({
          abonnement: a.libelle,
          client: a.client_nom,
          destinataire: a.client_email || null,
          montant: r2(ttc),
          objet: objet,
          mode: a.envoi_auto ? "émission et envoi" : "brouillon",
          statut: "essai, rien produit",
        });
        emises++;
        continue;
      }

      const champs: any = {
        tenant_id: a.tenant_id,
        societe_id: a.societe_id || null,
        type: "facture",
        client_nom: a.client_nom,
        client_email: a.client_email,
        client_adresse: a.client_adresse,
        client_code_postal: a.client_code_postal,
        client_ville: a.client_ville,
        client_pays: a.client_pays || "FR",
        client_siren: a.client_siren,
        client_tva: a.client_tva,
        objet: objet,
        date_echeance: jourISO(echeance),
        autoliquidation: a.autoliquidation === true,
        total_ht: r2(ht),
        total_tva: r2(tva),
        total_ttc: r2(ttc),
        statut: "brouillon",
        cree_par: "abonnement " + a.id,
      };

      if (a.envoi_auto === true) {
        champs.numero = await numeroSuivant(a.tenant_id);
        champs.statut = "envoye";
        champs.date_emission = jourISO(maintenant);
        champs.envoye_le = new Date().toISOString();
        champs.reste_du = r2(ttc);
      }

      const { data: facture, error: eFacture } = await supabase
        .from("devis_factures")
        .insert(champs)
        .select()
        .single();

      if (eFacture) {
        resultats.push({
          abonnement: a.libelle,
          client: a.client_nom,
          statut: "échec : " + eFacture.message,
        });
        continue;
      }

      for (let i = 0; i < lignes.length; i++) {
        const l = lignes[i];
        await supabase.from("devis_factures_lignes").insert({
          document_id: facture.id,
          rang: i,
          designation: l.designation,
          detail: l.detail,
          quantite: l.quantite,
          unite: l.unite,
          prix_unitaire: l.prix_unitaire,
          remise_pct: l.remise_pct,
          taux_tva: l.taux_tva,
          total_ht: l.total_ht,
          total_tva: l.total_tva,
          total_ttc: l.total_ttc,
          compte_produit: l.compte_produit,
        });
      }

      // ---- L ENVOI AU CLIENT ----
      //
      // ⚠️ SANS PIECE JOINTE ICI. Generer le PDF demande Puppeteer et
      // Chromium, trop lourd pour un cron qui traite cent abonnements. Le
      // courriel annonce la facture et renvoie vers l espace ; le cabinet
      // peut toujours l envoyer avec son PDF depuis « Devis et factures ».
      let envoi = false;
      if (a.envoi_auto === true && a.client_email && process.env.RESEND_API_KEY) {
        try {
          const html = "<p>Bonjour,</p>"
            + "<p>Vous trouverez ci-dessous votre facture <strong>"
            + echapper(champs.numero) + "</strong> concernant "
            + echapper(objet) + ".</p>"
            + "<p>Montant : <strong>" + euros(ttc) + " TTC</strong><br/>"
            + "Échéance : " + new Date(champs.date_echeance).toLocaleDateString("fr-FR") + "</p>"
            + "<p>Bien cordialement.</p>";

          const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": "Bearer " + process.env.RESEND_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: EXPEDITEUR,
              to: a.client_email,
              subject: "Facture " + champs.numero + " — " + objet,
              html: html,
            }),
          });
          envoi = r.ok;
        } catch (e) {
          envoi = false;
        }
      }

      // L abonnement avance : c est CE QUI EMPECHE UNE SECONDE FACTURE pour
      // la meme echeance, meme si le cron repasse dans l heure.
      await supabase
        .from("facturation_recurrente")
        .update({
          derniere_emission: jourISO(maintenant),
          prochaine_emission: prochaine(maintenant, a.frequence, a.jour_du_mois),
          nb_emises: (Number(a.nb_emises) || 0) + 1,
        })
        .eq("id", a.id);

      emises++;
      if (a.envoi_auto === true) envoyees++;
      else brouillons++;

      resultats.push({
        abonnement: a.libelle,
        client: a.client_nom,
        numero: champs.numero || null,
        montant: r2(ttc),
        statut: a.envoi_auto
          ? (envoi ? "émise et envoyée" : "émise, envoi échoué")
          : "brouillon créé",
        prochaine: prochaine(maintenant, a.frequence, a.jour_du_mois),
      });
    }

    return NextResponse.json({
      ok: true,
      essai: essai,
      echeances: abonnements.length,
      emises: emises,
      brouillons: brouillons,
      envoyees: envoyees,
      secondes: Math.round((Date.now() - debut) / 1000),
      resultats: resultats,
    });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      erreur: String(e.message || e),
      secondes: Math.round((Date.now() - debut) / 1000),
    }, { status: 500 });
  }
}
