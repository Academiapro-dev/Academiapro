import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];

// LE BAC A SABLE, PAS LA PRODUCTION.
//
// Sandbox travaille sur des banques fictives : aucun compte reel n est
// touche, rien n est facture. Le passage en production demandera d autres
// identifiants et une conversation tarifaire avec Plaid.
const PLAID = "https://sandbox.plaid.com";

// LE COMPTE DE BANQUE DU PLAN COMPTABLE.
//
// L identifiant du compte chez Plaid — une suite de trente-sept caracteres —
// etait ecrit dans compte_num : les lignes devenaient invisibles a l ecran de
// rapprochement, qui travaille sur le plan comptable. Trente-six ecritures
// etaient arrivees sans que personne ne puisse les traiter.
const COMPTE_BANQUE = "512000";

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

// LE CABINET NE VOIT QUE SES PROPRES DOSSIERS.
//
// Sans ce controle, une societe_id devinee donnerait acces aux ecritures
// bancaires d un autre cabinet. Le verrou porte sur la societe, pas sur la
// route : c est la societe qui appartient a un tenant.
async function societeAutorisee(societeId: string) {
  const session = sessionCourante();
  if (!session) return { ok: false, code: 401, erreur: "Connectez-vous." };

  const { data: societe } = await supabase
    .from("compta_societes")
    .select("id, tenant_id, raison_sociale")
    .eq("id", societeId)
    .maybeSingle();

  if (!societe) return { ok: false, code: 404, erreur: "Dossier introuvable." };

  const estAdmin = ADMINS.indexOf(session.email) >= 0;
  if (!estAdmin && societe.tenant_id !== session.tenantId) {
    return { ok: false, code: 403, erreur: "Ce dossier n est pas le votre." };
  }

  return { ok: true, societe: societe, session: session };
}

// L EMPREINTE EVITE LES DOUBLONS.
//
// Une synchronisation relancee, ou une operation renvoyee deux fois par la
// banque, ne doit pas creer deux lignes. L empreinte porte sur la reference
// Plaid, qui identifie l operation de maniere unique et durable.
function empreinte(reference: string, date: string, montant: number) {
  return crypto
    .createHash("sha256")
    .update([reference || "", date, String(montant)].join("|"))
    .digest("hex")
    .slice(0, 40);
}

export async function POST(req: NextRequest) {
  try {
    const corps = await req.json().catch(function () { return null; });
    if (!corps || !corps.action) {
      return NextResponse.json({ ok: false, erreur: "Action manquante." }, { status: 400 });
    }

    const societeId = String(corps.societe_id || "");
    if (!societeId) {
      return NextResponse.json({ ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

    const verrou = await societeAutorisee(societeId);
    if (!verrou.ok) {
      return NextResponse.json({ ok: false, erreur: verrou.erreur }, { status: verrou.code });
    }

    // ---- 1. OUVRIR LA FENETRE DE CONNEXION ------------------------------
    //
    // Le jeton de liaison ouvre, chez le client, la fenetre ou il choisit sa
    // banque et saisit ses identifiants. Ces identifiants ne transitent
    // JAMAIS par nous : Plaid les recoit directement.
    if (corps.action === "ouvrir") {
      const { ok, reponse } = await plaid("/link/token/create", {
        client_name: "Mr. Comptable",
        language: "fr",
        country_codes: ["FR"],
        products: ["transactions"],
        user: { client_user_id: societeId },
      });

      if (!ok) {
        return NextResponse.json({
          ok: false,
          erreur: reponse.error_message || "Plaid a refuse la demande.",
        }, { status: 500 });
      }

      return NextResponse.json({ ok: true, link_token: reponse.link_token });
    }

    // ---- 2. ENREGISTRER L ACCES -----------------------------------------
    //
    // Une fois la banque connectee, Plaid renvoie un jeton public a usage
    // unique. On l echange contre un acces permanent, qui reste cote serveur.
    if (corps.action === "enregistrer") {
      const publicToken = String(corps.public_token || "");
      if (!publicToken) {
        return NextResponse.json({ ok: false, erreur: "Jeton manquant." }, { status: 400 });
      }

      const echange = await plaid("/item/public_token/exchange", {
        public_token: publicToken,
      });

      if (!echange.ok) {
        return NextResponse.json({
          ok: false,
          erreur: echange.reponse.error_message || "Echange impossible.",
        }, { status: 500 });
      }

      const acces = echange.reponse.access_token;
      const item = echange.reponse.item_id;

      // Le nom de la banque, pour que le cabinet reconnaisse la connexion.
      let nomBanque = null;
      let idBanque = null;
      try {
        const info = await plaid("/item/get", { access_token: acces });
        idBanque = info.reponse.item && info.reponse.item.institution_id;
        if (idBanque) {
          const banque = await plaid("/institutions/get_by_id", {
            institution_id: idBanque,
            country_codes: ["FR"],
          });
          nomBanque = banque.reponse.institution && banque.reponse.institution.name;
        }
      } catch (e) {}

      // Les comptes ouverts par cette connexion.
      let comptes: any[] = [];
      try {
        const liste = await plaid("/accounts/get", { access_token: acces });
        comptes = (liste.reponse.accounts || []).map(function (c: any) {
          return {
            id: c.account_id,
            nom: c.name,
            masque: c.mask,
            type: c.type,
            sous_type: c.subtype,
            devise: c.balances && c.balances.iso_currency_code,
          };
        });
      } catch (e) {}

      const { error } = await supabase.from("compta_banques").upsert({
        societe_id: societeId,
        tenant_id: verrou.societe.tenant_id,
        fournisseur: "plaid",
        item_id: item,
        access_token: acces,
        institution_nom: nomBanque,
        institution_id: idBanque,
        comptes: comptes,
        statut: "actif",
        updated_at: new Date().toISOString(),
      }, { onConflict: "societe_id,item_id" });

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: (nomBanque || "La banque") + " est connectée. "
          + comptes.length + " compte(s) trouvé(s).",
        banque: nomBanque,
        comptes: comptes,
      });
    }

    // ---- 3. RECUPERER LES ECRITURES -------------------------------------
    //
    // Plaid renvoie les mouvements par vagues, avec un curseur qui marque ou
    // on s est arrete. Le curseur est conserve : la synchronisation suivante
    // ne rapatrie que le nouveau.
    if (corps.action === "synchroniser") {
      const { data: banques } = await supabase
        .from("compta_banques")
        .select("id, access_token, curseur, institution_nom, comptes")
        .eq("societe_id", societeId)
        .eq("statut", "actif");

      if (!banques || banques.length === 0) {
        return NextResponse.json({
          ok: false,
          erreur: "Aucune banque connectee sur ce dossier.",
        }, { status: 404 });
      }

      let ajoutees = 0;
      let deja = 0;
      const echecs: any[] = [];

      for (const banque of banques) {
        let curseur = banque.curseur || null;
        let encore = true;
        let tours = 0;

        while (encore && tours < 10) {
          tours = tours + 1;

          const vague = await plaid("/transactions/sync", {
            access_token: banque.access_token,
            cursor: curseur || undefined,
            count: 500,
          });

          if (!vague.ok) {
            echecs.push({
              banque: banque.institution_nom,
              erreur: vague.reponse.error_message || "synchronisation refusee",
            });
            await supabase
              .from("compta_banques")
              .update({ erreur: vague.reponse.error_message || "erreur", updated_at: new Date().toISOString() })
              .eq("id", banque.id);
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
              societe_id: societeId,
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

          curseur = vague.reponse.next_cursor;
          encore = vague.reponse.has_more === true;
        }

        await supabase
          .from("compta_banques")
          .update({
            curseur: curseur,
            derniere_synchro: new Date().toISOString(),
            erreur: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", banque.id);
      }

      return NextResponse.json({
        ok: true,
        message: ajoutees + " écriture(s) rapatriée(s)"
          + (deja > 0 ? ", " + deja + " déjà connue(s)" : "") + ".",
        ajoutees: ajoutees,
        deja: deja,
        echecs: echecs,
      });
    }

    return NextResponse.json({ ok: false, erreur: "Action inconnue." }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// L etat des connexions d un dossier. Le jeton d acces n est JAMAIS renvoye.
export async function GET(req: NextRequest) {
  try {
    const societeId = new URL(req.url).searchParams.get("societe_id") || "";
    if (!societeId) {
      return NextResponse.json({ ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

    const verrou = await societeAutorisee(societeId);
    if (!verrou.ok) {
      return NextResponse.json({ ok: false, erreur: verrou.erreur }, { status: verrou.code });
    }

    const { data: banques } = await supabase
      .from("compta_banques")
      .select("id, institution_nom, comptes, statut, derniere_synchro, erreur, created_at")
      .eq("societe_id", societeId)
      .order("created_at", { ascending: false });

    return NextResponse.json({
      ok: true,
      societe: verrou.societe.raison_sociale,
      banques: banques || [],
    });

  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
