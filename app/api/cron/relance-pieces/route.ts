import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// RELANCE DES PIECES MANQUANTES.
//
// Reclamer les justificatifs est ce qui coute le plus de temps a un cabinet :
// chaque mois, il faut ecrire a chaque client pour lui redemander les memes
// factures. Cette route le fait a sa place.
//
// UN JUSTIFICATIF PEUT SE TROUVER A DEUX ENDROITS, et les deux comptent :
//
//   compta_pieces — le depot direct, par le client ou le cabinet ;
//   depenses      — la saisie de dépense, qui porte son propre pdf_url.
//                   L ecriture garde alors le lien dans source_table et
//                   source_id.
//
// Ne regarder que la premiere ferait crier au manque sur des pieces
// parfaitement deposees. C est l erreur a ne pas commettre : une relance
// injustifiee fait perdre confiance dans toutes les autres.
//
// On ne relance que ce qui le merite :
//   - les journaux d achat et de vente, ou la piece est obligatoire ;
//   - au-dela d un montant plancher, pour ne pas harceler sur trois euros ;
//   - passe un delai de grace, le temps que le client depose ;
//   - une seule fois par mois et par societe.
//
// 🚨 ET SEULEMENT POUR LES CABINETS QUI L ONT ARME — ajoute le 23/08.
//
// LE DEFAUT CORRIGE. Cette route relancait TOUS les dossiers actifs de TOUS
// les cabinets, sans que personne ait rien demande. Tant que Jacques etait
// seul client, cela ne se voyait pas. Le jour ou un cabinet arrive, ses
// propres clients recevraient des relances signees de son nom, sur des
// pieces qu il n a pas juge bon de reclamer.
//
// Un cabinet ne pardonne pas cela : la relation avec son client lui
// appartient. Le silence ne vaut pas consentement.
//
// ⚠️ LE MEME VERROU EXISTE DANS /api/cron/relances-cabinet. Les deux routes
// se partagent le terrain : celle-ci reclame les pieces des ECRITURES,
// l autre les pieces des OPERATIONS BANCAIRES et les factures impayees du
// cabinet. Toute modification de l une doit interroger l autre.
const JOURNAUX = ["AC", "ACH", "VE", "VTE", "HA", "BQ"];
const MONTANT_PLANCHER = 50;
const JOURS_DE_GRACE = 15;

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

function jour(d: any): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR");
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const autorisation = req.headers.get("authorization") || "";
    const secretCron = process.env.CRON_SECRET || "";
    const parCron = secretCron.length > 0 && autorisation === "Bearer " + secretCron;

    // Les deux cles sont acceptees : CRON_SECRET comme CLE_API_FACTURE.
    // Rester bloque dehors parce qu on a pris la mauvaise des deux fait
    // perdre plus de temps que le risque evite.
    let cle = url.searchParams.get("cle") || "";
    try {
      cle = decodeURIComponent(cle);
    } catch (e) {
      // deja decodee
    }
    cle = cle.trim();

    const cleFacture = process.env.CLE_API_FACTURE || "";
    const parCle = cle.length > 0
      && ((cleFacture.length > 0 && cle === cleFacture)
        || (secretCron.length > 0 && cle === secretCron));

    if (!parCron && !parCle) {
      return NextResponse.json({
        ok: false,
        erreur: "Non autorise",
        diagnostic: {
          longueur_recue: cle.length,
          longueur_cron_secret: secretCron.length,
          longueur_cle_facture: cleFacture.length,
        },
      }, { status: 401 });
    }

    const essai = url.searchParams.get("essai") === "1";

    // ---- LES CABINETS QUI ONT ARME LA RELANCE ----
    //
    // Sans cette liste, aucune societe n est traitee. C est voulu : mieux
    // vaut une fonction qui ne part pas qu une relance envoyee au nom d un
    // cabinet qui ne l a pas voulu.
    const { data: cabinets, error: eCab } = await supabase
      .from("organismes_formation")
      .select("tenant_id, raison_sociale, relance_auto")
      .eq("relance_auto", true)
      .limit(500);

    if (eCab) {
      return NextResponse.json({
        ok: false,
        erreur: eCab.message,
        aide: eCab.message.indexOf("relance_auto") >= 0
          ? "La colonne relance_auto n existe pas : alter table "
            + "organismes_formation add column relance_auto boolean default false;"
          : undefined,
      }, { status: 500 });
    }

    const armes: string[] = [];
    for (const c of cabinets || []) {
      if (c.tenant_id) armes.push(String(c.tenant_id));
    }

    if (armes.length === 0) {
      return NextResponse.json({
        ok: true,
        info: "aucun cabinet n a arme la relance automatique",
        aide: "update organismes_formation set relance_auto = true where tenant_id = '...';",
        cabinets: 0,
        relances: 0,
      });
    }

    // Le delai de grace : on ne reclame pas une piece du jour meme.
    const limite = new Date();
    limite.setDate(limite.getDate() - JOURS_DE_GRACE);

    // Les depenses qui portent deja leur justificatif. On les lit une fois
    // pour toutes : c est une table courte, et cela evite une requete par
    // ecriture.
    const { data: depenses } = await supabase
      .from("depenses")
      .select("id, pdf_url")
      .not("pdf_url", "is", null)
      .limit(20000);

    const depensesJustifiees: string[] = [];
    for (const d of depenses || []) {
      if (d.id && String(d.pdf_url || "").length > 3) {
        depensesJustifiees.push(String(d.id));
      }
    }

    // ⚠️ LE FILTRE SUR LES CABINETS ARMES SE FAIT ICI, dans la requete, et
    // non plus tard dans une condition : une societe d un cabinet non arme
    // ne doit meme pas etre lue.
    const { data: societes, error: eSoc } = await supabase
      .from("compta_societes")
      .select("id, tenant_id, code, raison_sociale, email_contact, actif")
      .eq("actif", true)
      .in("tenant_id", armes)
      .limit(2000);

    if (eSoc) {
      return NextResponse.json({ ok: false, erreur: eSoc.message }, { status: 500 });
    }

    const resultats: any[] = [];

    for (const s of societes || []) {
      const { data: ecritures, error: eEcr } = await supabase
        .from("compta_ecritures")
        .select("ecriture_num, ecriture_date, journal_code, ecriture_lib, debit, credit, "
          + "piece_ref, source_table, source_id")
        .eq("societe_id", s.id)
        .lte("ecriture_date", limite.toISOString().slice(0, 10))
        .limit(5000);

      if (eEcr) {
        resultats.push({ societe: s.raison_sociale, statut: "lecture impossible", detail: eEcr.message });
        continue;
      }

      // Les justificatifs deposes directement.
      const { data: pieces } = await supabase
        .from("compta_pieces")
        .select("ecriture_num")
        .eq("societe_id", s.id)
        .limit(20000);

      const deposees: string[] = [];
      for (const p of pieces || []) {
        if (p.ecriture_num && deposees.indexOf(p.ecriture_num) < 0) {
          deposees.push(p.ecriture_num);
        }
      }

      // On regroupe par numero d ecriture : une ecriture comptable porte
      // plusieurs lignes, mais un seul justificatif.
      const parNumero: any = {};

      for (const e of ecritures || []) {
        const journal = String(e.journal_code || "").toUpperCase();
        if (JOURNAUX.indexOf(journal) < 0) continue;
        if (!e.ecriture_num) continue;

        // Piece deposee directement : rien a reclamer.
        if (deposees.indexOf(e.ecriture_num) >= 0) continue;

        // Piece portee par la depense d origine : rien a reclamer non plus.
        if (String(e.source_table || "") === "depenses"
            && e.source_id
            && depensesJustifiees.indexOf(String(e.source_id)) >= 0) {
          continue;
        }

        const montant = Math.max(Number(e.debit) || 0, Number(e.credit) || 0);

        if (!parNumero[e.ecriture_num]) {
          parNumero[e.ecriture_num] = {
            numero: e.ecriture_num,
            date: e.ecriture_date,
            journal: journal,
            libelle: e.ecriture_lib || "",
            montant: 0,
          };
        }
        parNumero[e.ecriture_num].montant = parNumero[e.ecriture_num].montant + montant;
      }

      const manquantes = Object.keys(parNumero)
        .map(function (k) { return parNumero[k]; })
        .filter(function (m: any) { return m.montant >= MONTANT_PLANCHER; })
        .sort(function (a: any, b: any) { return b.montant - a.montant; });

      if (manquantes.length === 0) {
        continue;
      }

      const total = r2(manquantes.reduce(function (acc: number, m: any) {
        return acc + m.montant;
      }, 0));

      // ---- A QUI ECRIRE ----
      //
      // 🆕 LE CONTACT DU CRM PASSE AVANT L ADRESSE DU DOSSIER — 23/08.
      //
      // compta_contacts porte la personne que le cabinet a designee, avec son
      // prenom. email_contact du dossier est souvent une adresse generique de
      // societe, que personne ne lit. Ecrire a une personne nommee vaut mieux
      // qu ecrire a « contact@ ».
      const { data: contacts } = await supabase
        .from("compta_contacts")
        .select("id, nom, email, principal")
        .eq("societe_id", s.id)
        .not("email", "is", null)
        .limit(10);

      const principal = (contacts || []).filter(function (c: any) { return c.principal; })[0]
        || (contacts || [])[0] || null;

      const destinataire = (principal && principal.email) || s.email_contact || "";
      const prenom = principal && principal.nom
        ? String(principal.nom).split(/\s+/)[0] : "";

      if (essai) {
        resultats.push({
          societe: s.raison_sociale,
          destinataire: destinataire || null,
          contact: principal ? principal.nom : null,
          pieces_manquantes: manquantes.length,
          montant_concerne: total,
          exemple: manquantes.slice(0, 5),
          statut: destinataire ? "essai, rien envoye" : "sans adresse",
        });
        continue;
      }

      if (!destinataire) {
        resultats.push({
          societe: s.raison_sociale,
          pieces_manquantes: manquantes.length,
          statut: "sans adresse, rien envoye",
        });
        continue;
      }

      // Verrou : une seule relance par mois et par societe.
      const periode = new Date().toISOString().slice(0, 7);
      const marque = "relance_pieces_" + String(s.id).slice(0, 8);

      const { error: eVerrou } = await supabase
        .from("facturation_periodes")
        .insert({
          tenant_id: s.tenant_id,
          periode: periode,
          produit: marque,
          nb_dossiers: manquantes.length,
          montant_ht: 0,
        });

      if (eVerrou) {
        resultats.push({ societe: s.raison_sociale, statut: "deja relance ce mois" });
        continue;
      }

      const lignes = manquantes.slice(0, 40).map(function (m: any) {
        return "<tr>"
          + "<td style=\"padding:7px 10px;border-bottom:1px solid #eee\">" + jour(m.date) + "</td>"
          + "<td style=\"padding:7px 10px;border-bottom:1px solid #eee\">" + m.numero + "</td>"
          + "<td style=\"padding:7px 10px;border-bottom:1px solid #eee\">" + (m.libelle || "") + "</td>"
          + "<td style=\"padding:7px 10px;border-bottom:1px solid #eee;text-align:right\">"
          + m.montant.toFixed(2) + " €</td>"
          + "</tr>";
      }).join("");

      const reste = manquantes.length > 40
        ? "<p style=\"color:#666;font-size:13px\">… et " + (manquantes.length - 40)
          + " autre(s) écriture(s) dans votre espace.</p>"
        : "";

      const html =
        "<div style=\"font-family:Georgia,serif;max-width:640px;margin:auto;padding:24px;color:#222\">"
        + "<p style=\"letter-spacing:3px;color:#1a3a6b;text-align:center;font-size:12px\">MR. COMPTABLE</p>"
        + "<h1 style=\"font-size:21px;text-align:center;margin:6px 0 24px\">Justificatifs manquants</h1>"
        + "<p>" + (prenom ? "Bonjour " + prenom : "Bonjour") + ",</p>"
        + "<p>Votre comptabilité comporte <b>" + manquantes.length + " écriture(s)</b> sans "
        + "justificatif, pour un total de <b>" + total.toFixed(2) + " €</b>.</p>"
        + "<p>Ces pièces sont exigées en cas de contrôle, et elles conditionnent la "
        + "déduction de la taxe sur la valeur ajoutée. Merci de les déposer dès que "
        + "possible.</p>"
        + "<table style=\"width:100%;border-collapse:collapse;font-size:13px;margin:20px 0\">"
        + "<tr style=\"background:#f4f4f6\">"
        + "<th style=\"padding:8px 10px;text-align:left\">Date</th>"
        + "<th style=\"padding:8px 10px;text-align:left\">Écriture</th>"
        + "<th style=\"padding:8px 10px;text-align:left\">Libellé</th>"
        + "<th style=\"padding:8px 10px;text-align:right\">Montant</th>"
        + "</tr>" + lignes + "</table>"
        + reste
        + "<p style=\"text-align:center;margin:28px 0\">"
        + "<a href=\"https://mrcomptable.fr/admin/compliance/pieces\" "
        + "style=\"background:#1a3a6b;color:#fff;padding:13px 26px;text-decoration:none;"
        + "border-radius:8px;font-weight:bold\">Déposer mes justificatifs</a></p>"
        + "<p style=\"font-size:13px;color:#666;line-height:1.7\">Une photographie nette "
        + "suffit : le document est lu automatiquement et rattaché à la bonne écriture.</p>"
        + "<p style=\"font-size:12px;color:#999;margin-top:24px\">Ce message est envoyé "
        + "automatiquement par votre cabinet.</p></div>";

      const rk = process.env.RESEND_API_KEY || "";
      let envoye = false;

      if (rk) {
        try {
          const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: "Bearer " + rk, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "Mr. Comptable <contact@mrcomptable.fr>",
              to: [destinataire],
              subject: manquantes.length + " justificatif(s) manquant(s) — " + (s.raison_sociale || ""),
              html: html,
            }),
          });
          envoye = r.ok;
        } catch (e) {}
      }

      if (!envoye) {
        // L envoi a echoue : on libere le verrou pour pouvoir relancer.
        await supabase
          .from("facturation_periodes")
          .delete()
          .eq("tenant_id", s.tenant_id)
          .eq("periode", periode)
          .eq("produit", marque);
      }

      // 🆕 LA TRACE VA AUSSI DANS compta_relances, comme toutes les autres.
      //
      // Sans elle, l ecran du CRM affiche « jamais relance » sur un dossier
      // qui vient de recevoir un courriel, et le collaborateur relance une
      // seconde fois le meme jour.
      await supabase.from("compta_relances").insert({
        tenant_id: s.tenant_id,
        societe_id: s.id,
        contact_id: principal ? principal.id : null,
        motif: "piece_manquante",
        canal: "email",
        objet: manquantes.length + " justificatif(s) manquant(s)",
        corps: html,
        reference: manquantes.length + " écriture(s)",
        montant: total,
        statut: envoye ? "envoyee" : "echec",
        motif_echec: envoye ? null : "envoi refuse par Resend",
      });

      resultats.push({
        societe: s.raison_sociale,
        destinataire: destinataire,
        contact: principal ? principal.nom : null,
        pieces_manquantes: manquantes.length,
        montant_concerne: total,
        statut: envoye ? "relance envoyee" : "echec d envoi",
      });
    }

    return NextResponse.json({
      ok: true,
      declencheur: parCron ? "cron" : "manuel",
      cabinets_armes: armes.length,
      societes_examinees: (societes || []).length,
      relances: resultats.length,
      resultats: resultats,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
