import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// ---------------------------------------------------------------------------
// LA SYNCHRONISATION BANCAIRE QUOTIDIENNE.
//
// La route /api/compliance/plaid sait deja tout faire, mais elle exige une
// SESSION OUVERTE : elle est concue pour un collaborateur devant son ecran.
// Un cron n a pas de session — d ou cette route jumelle, autorisee par cle,
// qui parcourt TOUTES les banques connectees sans en oublier une.
//
// 🚨 CE QUI SE JOUE ICI. Un cabinet juge un logiciel comptable sur un point
// avant tous les autres : est-ce que la banque arrive toute seule le matin ?
// Si le collaborateur doit cliquer dossier par dossier, il ne le fera pas, et
// le rapprochement prendra une semaine de retard. C est la premiere chose que
// Pennylane met en avant, et la seule qui manquait vraiment.
//
// ⚠️ SANDBOX : la route soeur pointe sur sandbox.plaid.com, des banques
// fictives. Tant que le domaine n a pas change ET que de nouveaux
// identifiants n ont pas ete obtenus, ce cron ne rapatrie rien de reel.
// ---------------------------------------------------------------------------

const PLAID = "https://sandbox.plaid.com";

// LE COMPTE DE BANQUE DU PLAN COMPTABLE.
//
// ⚠️ NE JAMAIS Y METTRE L IDENTIFIANT PLAID. Une suite de trente-sept
// caracteres a deja ete ecrite dans compte_num : les lignes devenaient
// invisibles a l ecran de rapprochement, qui travaille sur le plan
// comptable. Trente-six ecritures etaient arrivees sans que personne ne
// puisse les traiter.
const COMPTE_BANQUE = "512000";

// Une banque qui a echoue trois fois de suite ne se retente pas chaque
// matin : son acces est probablement revoque, et Plaid facture les appels.
const ECHECS_AVANT_PAUSE = 3;

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

function identifiants() {
  return {
    client_id: process.env.PLAID_CLIENT_ID || "",
    secret: process.env.PLAID_SECRET || "",
  };
}

async function plaid(chemin: string, corps: any) {
  const r = await fetch(PLAID + chemin, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...identifiants(), ...corps }),
  });
  const reponse = await r.json();
  return { ok: r.ok, statut: r.status, reponse: reponse };
}

// L EMPREINTE EVITE LES DOUBLONS.
//
// Elle porte sur la reference Plaid, qui identifie l operation de maniere
// unique et durable. Une synchronisation relancee ne cree pas deux lignes.
//
// ⚠️ LE CALCUL DOIT ETRE IDENTIQUE A CELUI DE /api/compliance/plaid. Deux
// formules differentes produiraient deux empreintes pour la meme operation,
// et le doublon passerait.
function empreinte(reference: string, date: string, montant: number) {
  return crypto
    .createHash("sha256")
    .update([reference || "", date, String(montant)].join("|"))
    .digest("hex")
    .slice(0, 40);
}

export async function GET(req: NextRequest) {
  const debut = Date.now();

  try {
    // ---- L AUTORISATION ----
    //
    // Deux cles acceptees, et le refus dit ce qui manque : un « non
    // autorise » muet fait perdre une heure a chercher entre dix causes.
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
      return NextResponse.json({
        ok: false,
        erreur: "Non autorise",
        diagnostic: {
          longueur_recue: fournie.length,
          longueur_cron_secret: secretCron.length,
          longueur_cle_facture: cleFacture.length,
        },
      }, { status: 401 });
    }

    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
      return NextResponse.json({
        ok: false,
        erreur: "PLAID_CLIENT_ID ou PLAID_SECRET absente des variables Vercel.",
      }, { status: 500 });
    }

    // ---- TOUTES LES BANQUES CONNECTEES ----
    const { data: banques, error: eBanques } = await supabase
      .from("compta_banques")
      .select("id, societe_id, tenant_id, access_token, curseur, institution_nom, echecs")
      .eq("statut", "actif")
      .eq("fournisseur", "plaid")
      .limit(500);

    if (eBanques) {
      return NextResponse.json({ ok: false, erreur: eBanques.message }, { status: 500 });
    }

    if (!banques || banques.length === 0) {
      return NextResponse.json({
        ok: true,
        info: "aucune banque connectee",
        banques: 0,
        aide: "Un cabinet connecte sa banque depuis /admin/compliance/releve.",
      });
    }

    let totalAjoutees = 0;
    let totalDeja = 0;
    const resultats: any[] = [];

    for (const banque of banques) {
      // 🚨 L ARRET AVANT LE PLAFOND VERCEL. Ce qui precede est deja ecrit :
      // les banques restantes seront prises au prochain passage, grace au
      // curseur qui marque ou l on s est arrete.
      if ((Date.now() - debut) / 1000 > 240) {
        resultats.push({ info: "arret a 240 secondes, reprise au prochain passage" });
        break;
      }

      const echecsPasses = Number(banque.echecs) || 0;
      if (echecsPasses >= ECHECS_AVANT_PAUSE) {
        resultats.push({
          banque: banque.institution_nom,
          statut: "en pause apres " + echecsPasses + " echecs — reconnexion a refaire",
        });
        continue;
      }

      let curseur = banque.curseur || null;
      let encore = true;
      let tours = 0;
      let ajoutees = 0;
      let deja = 0;
      let erreur: string | null = null;

      while (encore && tours < 10) {
        tours = tours + 1;

        const vague = await plaid("/transactions/sync", {
          access_token: banque.access_token,
          cursor: curseur || undefined,
          count: 500,
        });

        if (!vague.ok) {
          erreur = vague.reponse.error_message || "synchronisation refusee";
          break;
        }

        const nouvelles = vague.reponse.added || [];

        for (const op of nouvelles) {
          // Plaid compte les depenses en positif ; la comptabilite les veut
          // en negatif sur le releve. On inverse une fois pour toutes.
          const montant = -Number(op.amount);
          const date = op.date;
          const reference = op.transaction_id;
          const trace = empreinte(reference, date, montant);

          const { data: existante } = await supabase
            .from("compta_releves")
            .select("id")
            .eq("empreinte", trace)
            .maybeSingle();

          if (existante) {
            deja = deja + 1;
            continue;
          }

          const { error } = await supabase.from("compta_releves").insert({
            societe_id: banque.societe_id,
            compte_num: COMPTE_BANQUE,
            operation_date: date,
            valeur_date: op.authorized_date || date,
            libelle: String(op.name || op.merchant_name || "Operation").slice(0, 300),
            reference: reference,
            montant: montant,
            devise: op.iso_currency_code || "EUR",
            empreinte: trace,
          });

          if (!error) ajoutees = ajoutees + 1;
        }

        // ⚠️ LES OPERATIONS MODIFIEES ET SUPPRIMEES. Une operation en attente
        // devient definitive et change de montant ; une autre est annulee par
        // la banque. Les ignorer laisserait des lignes fantomes que le
        // rapprochement ne trouverait jamais.
        const supprimees = vague.reponse.removed || [];
        for (const s of supprimees) {
          if (!s.transaction_id) continue;
          await supabase
            .from("compta_releves")
            .delete()
            .eq("reference", s.transaction_id)
            .is("ecriture_num", null);
        }

        curseur = vague.reponse.next_cursor;
        encore = vague.reponse.has_more === true;
      }

      await supabase
        .from("compta_banques")
        .update({
          curseur: curseur,
          derniere_synchro: new Date().toISOString(),
          erreur: erreur,
          echecs: erreur ? echecsPasses + 1 : 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", banque.id);

      totalAjoutees = totalAjoutees + ajoutees;
      totalDeja = totalDeja + deja;

      resultats.push({
        banque: banque.institution_nom,
        dossier: banque.societe_id,
        ajoutees: ajoutees,
        deja_connues: deja,
        statut: erreur ? "echec : " + erreur : "synchronise",
      });
    }

    return NextResponse.json({
      ok: true,
      banques: banques.length,
      ajoutees: totalAjoutees,
      deja_connues: totalDeja,
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
