import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// 🚨 L EXPEDITEUR EST MR. COMPTABLE, PAS ACADEMIA — 23/08. Ces relances
// partent au nom d un cabinet vers SES clients : la marque formation n a
// rien a y faire. espaces-formations.fr est le domaine d envoi neutre,
// verifie chez Resend, deja eprouve par auth/demander. Le reply_to reste
// le courriel du cabinet : les reponses des clients vont chez lui.
const EXPEDITEUR = "Mr. Comptable <contact@espaces-formations.fr>";

// ---------------------------------------------------------------------------
// LA RELANCE AUTOMATIQUE — ce que le collaborateur ne fera jamais a temps.
//
// Un cabinet sait tres bien QUI lui doit de l argent et QUELLE piece manque.
// Ce qu il ne fait pas, c est relancer : il a des dossiers a sortir, et
// reclamer passe apres. Six mois plus tard, la creance est douteuse et le
// justificatif introuvable.
//
// 🚨 TROIS GARDE-FOUS, ET AUCUN N EST NEGOCIABLE :
//
//   1. JAMAIS DEUX FOIS LE MEME MOTIF EN MOINS DE DIX JOURS. Un client
//      relance tous les matins ne paie pas plus vite : il se desabonne, ou
//      il appelle le cabinet pour se plaindre.
//   2. RIEN NE PART SANS ECHEANCE DEPASSEE. Reclamer avant terme fait
//      passer le cabinet pour un creancier nerveux.
//   3. LE CABINET DOIT L AVOIR ARME. Le silence ne vaut pas consentement :
//      une relance part au nom du cabinet, a SON client, et engage sa
//      relation commerciale.
//
// 🚨 LEÇON DU 23/08 : une requete qui REUSSIT avec zero ligne alors que la
// base en contient, sur une table en RLS, signifie que la cle service_role
// de Vercel est fausse ou tronquee. Verifier la variable AVANT de chercher
// ailleurs — deux heures perdues a explorer d autres pistes.
// ---------------------------------------------------------------------------

const JOURS_ENTRE_DEUX = 10;
const JOURS_APRES_ECHEANCE = 7;
const PLAFOND_PAR_CABINET = 10;

function r2(n: any): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function euros(n: any): string {
  return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
}

function jolieDate(d: any): string {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("fr-FR"); } catch (e) { return ""; }
}

function joursDeRetard(echeance: any): number {
  if (!echeance) return 0;
  try {
    const e = new Date(String(echeance).slice(0, 10)).getTime();
    const j = Math.floor((Date.now() - e) / 86400000);
    return j > 0 ? j : 0;
  } catch (e) {
    return 0;
  }
}

function echapper(t: any): string {
  return String(t === null || t === undefined ? "" : t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function tonSelonRetard(jours: number): { entete: string; relance: string } {
  if (jours < 30) {
    return {
      entete: "Rappel de règlement",
      relance: "Sauf erreur de notre part, le règlement de la facture suivante ne nous "
        + "est pas encore parvenu.",
    };
  }
  if (jours < 60) {
    return {
      entete: "Deuxième rappel de règlement",
      relance: "Malgré notre précédent rappel, la facture suivante demeure impayée.",
    };
  }
  return {
    entete: "Relance — facture échue depuis plus de deux mois",
    relance: "La facture suivante reste impayée malgré nos rappels. Nous vous "
      + "remercions de bien vouloir régulariser cette situation rapidement.",
  };
}

async function envoyer(destinataire: string, sujet: string, html: string, repondreA?: string) {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, detail: "RESEND_API_KEY absente" };
  }
  const corps: any = {
    from: EXPEDITEUR,
    to: destinataire,
    subject: sujet,
    html: html,
  };
  if (repondreA) corps.reply_to = repondreA;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(corps),
  });
  const texte = await r.text();
  return { ok: r.ok, detail: texte.slice(0, 300) };
}

function relanceRecente(historique: any[], societeId: string, motif: string): boolean {
  const limite = Date.now() - JOURS_ENTRE_DEUX * 86400000;
  for (const h of historique) {
    if (h.societe_id !== societeId) continue;
    if (h.motif !== motif) continue;
    if (h.statut !== "envoyee") continue;
    if (new Date(h.envoye_le).getTime() > limite) return true;
  }
  return false;
}

export async function GET(req: NextRequest) {
  const debut = Date.now();

  try {
    // ---- L AUTORISATION ----
    //
    // 🚨 UN REFUS MUET EST INDEBOGABLE. « Non autorise » sans autre precision
    // laisse chercher entre dix causes : variable absente, valeur fausse,
    // caractere mal encode par le navigateur, deploiement en retard. La
    // reponse dit donc CE QUI MANQUE, sans jamais divulguer la valeur
    // attendue — on compare des longueurs, pas des secrets.
    //
    // Deux cles sont acceptees : CRON_SECRET, envoye par Vercel en en-tete,
    // et CLE_API_FACTURE, deja utilisee par les crons de facturation. Avoir
    // deux portes evite de rester bloque quand l une des deux resiste.
    const autorisation = req.headers.get("authorization") || "";
    const secretCron = process.env.CRON_SECRET || "";
    const cleFacture = process.env.CLE_API_FACTURE || "";

    const parCron = secretCron.length > 0 && autorisation === "Bearer " + secretCron;

    // La cle du parametre arrive percent-encodee : Safari transforme un « + »
    // en espace et encode les caracteres speciaux. On decode avant de
    // comparer, sans quoi une cle juste serait refusee.
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
          cron_secret_defini: secretCron.length > 0,
          cle_api_facture_definie: cleFacture.length > 0,
          cle_recue: fournie.length > 0,
          longueur_recue: fournie.length,
          longueur_cron_secret: secretCron.length,
          longueur_cle_facture: cleFacture.length,
          entete_presente: autorisation.length > 0,
          aide: secretCron.length === 0 && cleFacture.length === 0
            ? "Aucune des deux variables n existe dans Vercel."
            : fournie.length === 0
              ? "Ajoutez ?cle=LA_VALEUR a l adresse."
              : "La cle recue ne correspond a aucune des deux. Comparez les longueurs "
                + "ci-dessus : si elles different, le copier-coller a ajoute ou perdu "
                + "des caracteres.",
        },
      }, { status: 401 });
    }

    // 🚨 L ESSAI NE PART PAS. Il montre ce QUI SERAIT envoye, a qui, et
    // pourquoi. Avant d armer une relance automatique chez un cabinet, on
    // regarde ce qu elle ferait.
    const essai = req.nextUrl.searchParams.get("essai") === "1";

    const limiteEcheance = new Date(Date.now() - JOURS_APRES_ECHEANCE * 86400000)
      .toISOString().slice(0, 10);

    // ---- LES CABINETS QUI ONT ARME LA RELANCE ----
    const { data: cabinets, error: eCab } = await supabase
      .from("organismes_formation")
      .select("tenant_id, raison_sociale, email_contact, relance_auto")
      .eq("relance_auto", true)
      .limit(500);

    if (eCab) {
      return NextResponse.json({
        ok: false,
        erreur: eCab.message,
        aide: eCab.message.indexOf("relance_auto") >= 0
          ? "La colonne relance_auto n existe pas encore : "
            + "alter table organismes_formation add column relance_auto boolean default false;"
          : undefined,
      }, { status: 500 });
    }

    if (!cabinets || cabinets.length === 0) {
      return NextResponse.json({
        ok: true,
        info: "aucun cabinet n a arme la relance automatique",
        aide: "Pour armer un cabinet : update organismes_formation "
          + "set relance_auto = true where tenant_id = '...';",
        cabinets: 0,
      });
    }

    const resultats: any[] = [];

    for (const cab of cabinets) {
      const tenant = cab.tenant_id;
      if (!tenant) continue;

      let envoyees = 0;
      let ignorees = 0;
      const detail: any[] = [];

      const { data: historique } = await supabase
        .from("compta_relances")
        .select("societe_id, motif, envoye_le, statut")
        .eq("tenant_id", tenant)
        .gte("envoye_le", new Date(Date.now() - 60 * 86400000).toISOString())
        .limit(2000);

      const passees = historique || [];

      // ---- LES FACTURES DU CABINET, ECHUES ET IMPAYEES ----
      const { data: factures } = await supabase
        .from("devis_factures")
        .select("id, numero, societe_id, client_nom, client_email, total_ttc, reste_du, date_emission, date_echeance")
        .eq("tenant_id", tenant)
        .eq("type", "facture")
        .not("numero", "is", null)
        .in("statut", ["envoye", "partiel"])
        .gt("reste_du", 0)
        .not("date_echeance", "is", null)
        .lte("date_echeance", limiteEcheance)
        .order("date_echeance", { ascending: true })
        .limit(200);

      // Regroupees par dossier : un client qui doit trois factures recoit UN
      // message, pas trois.
      const parDossier: any = {};
      for (const f of factures || []) {
        const cle = f.societe_id || ("libre:" + String(f.client_email || f.client_nom));
        if (!parDossier[cle]) parDossier[cle] = [];
        parDossier[cle].push(f);
      }

      for (const cle of Object.keys(parDossier)) {
        if (envoyees >= PLAFOND_PAR_CABINET) {
          ignorees++;
          continue;
        }

        const lot = parDossier[cle];
        const societeId = lot[0].societe_id || null;

        if (societeId && relanceRecente(passees, societeId, "facture_emise")) {
          ignorees++;
          continue;
        }

        let destinataire = "";
        let contactId: any = null;
        let prenom = "";

        if (societeId) {
          const { data: contacts } = await supabase
            .from("compta_contacts")
            .select("id, nom, email, principal")
            .eq("societe_id", societeId)
            .not("email", "is", null)
            .limit(10);

          const principal = (contacts || []).filter(function (c: any) { return c.principal; })[0]
            || (contacts || [])[0] || null;

          if (principal) {
            destinataire = principal.email;
            contactId = principal.id;
            prenom = principal.nom ? String(principal.nom).split(/\s+/)[0] : "";
          }
        }

        if (!destinataire) destinataire = lot[0].client_email || "";
        if (!destinataire) {
          ignorees++;
          continue;
        }

        const retardMax = Math.max.apply(null, lot.map(function (f: any) {
          return joursDeRetard(f.date_echeance);
        }));
        const ton = tonSelonRetard(retardMax);

        const total = r2(lot.reduce(function (t: number, f: any) {
          return t + (Number(f.reste_du) || 0);
        }, 0));

        const lignes = lot.map(function (f: any) {
          const r = joursDeRetard(f.date_echeance);
          return "<li>Facture <strong>" + echapper(f.numero) + "</strong>"
            + (f.date_emission ? " du " + jolieDate(f.date_emission) : "")
            + " — <strong>" + euros(f.reste_du) + "</strong> restant dû"
            + (f.date_echeance ? ", échue le " + jolieDate(f.date_echeance) : "")
            + (r > 0 ? " (" + r + " jour" + (r > 1 ? "s" : "") + " de retard)" : "")
            + "</li>";
        }).join("");

        const html = "<p>" + (prenom ? "Bonjour " + echapper(prenom) : "Bonjour") + ",</p>"
          + "<p>" + ton.relance + "</p>"
          + "<ul>" + lignes + "</ul>"
          + (lot.length > 1
            ? "<p>Soit un total de <strong>" + euros(total) + "</strong>.</p>" : "")
          + "<p>Si le règlement a été effectué entre-temps, merci de ne pas tenir compte "
          + "de ce message.</p>"
          + "<p>Bien cordialement,<br/>" + echapper(cab.raison_sociale || "Votre cabinet comptable") + "</p>";

        const sujet = ton.entete
          + (lot.length === 1 ? " — facture " + lot[0].numero : "")
          + " — " + (cab.raison_sociale || "Votre cabinet");

        if (essai) {
          detail.push({
            motif: "facture_emise",
            dossier: societeId,
            destinataire: destinataire,
            factures: lot.map(function (f: any) { return f.numero; }),
            montant: total,
            retard: retardMax,
            sujet: sujet,
          });
          envoyees++;
          continue;
        }

        const resultat = await envoyer(destinataire, sujet, html, cab.email_contact || undefined);

        if (societeId) {
          await supabase.from("compta_relances").insert({
            tenant_id: tenant,
            societe_id: societeId,
            contact_id: contactId,
            motif: "facture_emise",
            canal: "email",
            objet: sujet,
            corps: html,
            reference: lot.map(function (f: any) { return f.numero; }).join(", "),
            montant: total,
            statut: resultat.ok ? "envoyee" : "echec",
            motif_echec: resultat.ok ? null : String(resultat.detail).slice(0, 500),
          });
        }

        if (resultat.ok) {
          envoyees++;
          detail.push({
            motif: "facture_emise",
            dossier: societeId,
            destinataire: destinataire,
            factures: lot.map(function (f: any) { return f.numero; }),
            montant: total,
            retard: retardMax,
          });
        } else {
          ignorees++;
        }
      }

      // ---- LES OPERATIONS BANCAIRES SANS JUSTIFICATIF ----
      //
      // C est la relance qu aucun concurrent ne fait : les autres SIGNALENT
      // le trou, ils ne reclament pas la piece a la place du cabinet.
      const { data: dossiers } = await supabase
        .from("compta_societes")
        .select("id, raison_sociale")
        .eq("tenant_id", tenant)
        .eq("actif", true)
        .limit(200);

      for (const s of dossiers || []) {
        if (envoyees >= PLAFOND_PAR_CABINET) break;
        if (relanceRecente(passees, s.id, "rapprochement")) continue;

        const { count } = await supabase
          .from("compta_releves")
          .select("id", { count: "exact", head: true })
          .eq("societe_id", s.id)
          .is("ecriture_num", null)
          .eq("ignore", false);

        const trous = count || 0;
        // En dessous de cinq, on ne derange pas : le collaborateur reglera
        // cela en passant.
        if (trous < 5) continue;

        const { data: contacts } = await supabase
          .from("compta_contacts")
          .select("id, nom, email, principal")
          .eq("societe_id", s.id)
          .not("email", "is", null)
          .limit(10);

        const principal = (contacts || []).filter(function (c: any) { return c.principal; })[0]
          || (contacts || [])[0] || null;

        if (!principal || !principal.email) continue;

        const prenom = principal.nom ? String(principal.nom).split(/\s+/)[0] : "";
        const sujet = "Justificatifs manquants — " + (cab.raison_sociale || "votre cabinet");

        const html = "<p>" + (prenom ? "Bonjour " + echapper(prenom) : "Bonjour") + ",</p>"
          + "<p>Nous préparons votre comptabilité et <strong>" + trous + " opérations</strong> "
          + "figurant sur vos relevés bancaires n'ont pas encore de justificatif.</p>"
          + "<p>Sans ces pièces, nous ne pouvons ni rapprocher votre banque ni récupérer "
          + "la TVA correspondante.</p>"
          + "<p>Merci de nous transmettre les factures, notes de frais ou reçus "
          + "correspondants dès que possible.</p>"
          + "<p>Bien cordialement,<br/>" + echapper(cab.raison_sociale || "Votre cabinet comptable") + "</p>";

        if (essai) {
          detail.push({
            motif: "rapprochement",
            dossier: s.id,
            raison_sociale: s.raison_sociale,
            destinataire: principal.email,
            trous: trous,
          });
          envoyees++;
          continue;
        }

        const resultat = await envoyer(principal.email, sujet, html, cab.email_contact || undefined);

        await supabase.from("compta_relances").insert({
          tenant_id: tenant,
          societe_id: s.id,
          contact_id: principal.id,
          motif: "rapprochement",
          canal: "email",
          objet: sujet,
          corps: html,
          reference: trous + " opération(s)",
          statut: resultat.ok ? "envoyee" : "echec",
          motif_echec: resultat.ok ? null : String(resultat.detail).slice(0, 500),
        });

        if (resultat.ok) {
          envoyees++;
          detail.push({
            motif: "rapprochement",
            dossier: s.id,
            raison_sociale: s.raison_sociale,
            destinataire: principal.email,
            trous: trous,
          });
        } else {
          ignorees++;
        }
      }

      resultats.push({
        cabinet: cab.raison_sociale,
        tenant: tenant,
        envoyees: envoyees,
        ignorees: ignorees,
        detail: detail,
      });
    }

    return NextResponse.json({
      ok: true,
      essai: essai,
      cabinets: cabinets.length,
      total_envoyees: resultats.reduce(function (s: number, r: any) { return s + r.envoyees; }, 0),
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
