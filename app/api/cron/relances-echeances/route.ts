import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// ---------------------------------------------------------------------------
// LA RELANCE AUTOMATIQUE DES ECHEANCES — 31/08.
//
// 🚨 C EST LA FONCTION QUI SE VEND. Un gestionnaire qui suit des centaines
// de societes ne consulte pas un ecran chaque matin : il veut etre PREVENU.
// Ce qu il achete, ce n est pas le calendrier — c est de ne plus avoir a y
// penser.
//
// CE QUI EST EN JEU CHEZ SES CLIENTS : un 5472 non depose coute 25 000 USD
// par societe et par an. Une relance envoyee a temps vaut donc bien plus
// que l abonnement.
//
// 🚨 TROIS GARDE-FOUS, ET AUCUN N EST NEGOCIABLE :
//
//   1. JAMAIS DEUX FOIS LA MEME ECHEANCE DANS LA MEME FENETRE. Un client
//      relance tous les matins pour la meme chose se desabonne. On relance
//      a J-60, J-30, J-15, J-7 et J-1, jamais entre.
//   2. RIEN SUR UNE ECHEANCE DEJA TRAITEE. Une echeance deposee ou archivee
//      ne se relance pas : reclamer ce qui est fait detruit la confiance
//      plus vite que ne pas relancer du tout.
//   3. LE GESTIONNAIRE DOIT L AVOIR ARME, societe par societe. Le silence
//      ne vaut pas consentement : la relance part en son nom, a SON client.
//
// ⚠️ LE DIAGNOSTIC RESTE DANS LES JOURNAUX. Les trois crons existants
// disaient a qui les appelait sans cle la LONGUEUR EXACTE des secrets —
// corrige le 31/08. Ne pas reintroduire le defaut ici en copiant un ancien
// modele.
//
// ---- DEFAUT TROUVE A L AUDIT DU SOIR — 31/08 ---------------------------
//
// 🚨 LE MODE ESSAI COMPTAIT SES SIMULATIONS COMME DES ENVOIS. La reponse
// annoncait « envoyees: 47 » alors que rien n etait parti. Deux facons de
// se tromper, dans les deux sens :
//   - croire que 47 courriels sont partis chez des clients alors qu il ne
//     s est rien passe, et ne pas armer ce qu il fallait armer ;
//   - lire « envoyees: 0 » un jour de vrai passage et croire a une panne.
//
// UN COMPTEUR QUI MENT EST PIRE QU UN COMPTEUR ABSENT : on lui fait
// confiance. Les deux chiffres sont desormais SEPARES — `envoyees` ne
// compte que les envois reels, `simulees` compte l essai. Le champ
// `envoyees` vaut donc toujours 0 en mode essai, ce qui est la verite.
// ---------------------------------------------------------------------------

// Les paliers de relance, en jours avant l echeance. Ils sont espaces : le
// premier laisse le temps de reunir les pieces, le dernier est un rappel.
const PALIERS = [60, 30, 15, 7, 1];

// Tolerance : le cron tourne une fois par jour, mais un retard d execution
// ne doit pas faire sauter un palier. On relance si l echeance tombe dans
// la fenetre du palier, a un jour pres.
const TOLERANCE_JOURS = 1;

// Deux relances pour la meme echeance ne peuvent pas partir a moins de
// cinq jours d intervalle, quel que soit le palier.
const JOURS_ENTRE_DEUX = 5;

// Plafond par passage et par organisme : un gestionnaire qui decouvre deux
// cents courriels partis le meme matin s inquiete, meme s ils sont justes.
const PLAFOND_PAR_ORGANISME = 200;

const EXPEDITEUR = process.env.COMPLIANCE_EXPEDITEUR
  || "Suivi des echeances <contact@academiapro.fr>";

function jourISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function joursAvant(date: string): number {
  const d = new Date(String(date).slice(0, 10)).getTime();
  return Math.ceil((d - Date.now()) / 86400000);
}

function echapper(t: any): string {
  return String(t === null || t === undefined ? "" : t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function jolieDate(d: any): string {
  if (!d) return "";
  try {
    return new Date(String(d).slice(0, 10)).toLocaleDateString("fr-FR");
  } catch (e) {
    return String(d);
  }
}

// Le ton suit l urgence. A soixante jours on informe, a un jour on alerte :
// le meme message aux deux moments serait faux dans les deux cas.
function tonSelonDelai(jours: number): { entete: string; intro: string } {
  if (jours > 30) {
    return {
      entete: "Echeance a preparer",
      intro: "Une echeance approche pour votre societe. Il reste du temps, "
        + "mais les pieces necessaires se reunissent mieux maintenant qu au dernier moment.",
    };
  }
  if (jours > 7) {
    return {
      entete: "Echeance dans moins d un mois",
      intro: "L echeance suivante arrive. Si les elements ne sont pas encore reunis, "
        + "c est le moment de s en occuper.",
    };
  }
  return {
    entete: "Echeance imminente",
    intro: "L echeance suivante arrive tres bientot. Un depot hors delai expose "
      + "a des penalites.",
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

export async function GET(req: NextRequest) {
  const debut = Date.now();

  try {
    // ---- L AUTORISATION ----
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
      // 🚨 LE DIAGNOSTIC VA DANS LES JOURNAUX, JAMAIS DANS LA REPONSE.
      // Dire la longueur d un secret a qui appelle sans cle reduit
      // considerablement le travail de qui cherche a le deviner.
      console.error("[cron/relances-echeances] refus d autorisation", {
        longueur_recue: fournie.length,
        longueur_cron_secret: secretCron.length,
        longueur_cle_facture: cleFacture.length,
        entete_presente: autorisation.length > 0,
      });
      return NextResponse.json({ ok: false, erreur: "Non autorise" }, { status: 401 });
    }

    // 🚨 L ESSAI NE PART PAS. Il montre ce QUI SERAIT envoye, a qui, et
    // pourquoi. Avant d armer des relances chez un gestionnaire, on regarde
    // ce qu elles feraient.
    const essai = req.nextUrl.searchParams.get("essai") === "1";

    // ---- LES SOCIETES QUI ONT ARME LA RELANCE ----
    //
    // ⚠️ PAGINATION EXPLICITE. Supabase tronque silencieusement a 1000
    // objets : sans pagination, un gestionnaire au-dela de ce seuil verrait
    // ses dernieres societes ignorees, SANS AUCUNE ERREUR.
    const entites: any[] = [];
    let offset = 0;
    const PAS = 500;

    while (true) {
      const { data, error } = await supabase
        .from("compliance_tenants")
        .select("id, tenant_id, label, legal_name, email_contact, relance_auto")
        .eq("relance_auto", true)
        .not("email_contact", "is", null)
        .order("id", { ascending: true })
        .range(offset, offset + PAS - 1);

      if (error) {
        console.error("[cron/relances-echeances] lecture entites :", error.message);
        return NextResponse.json({ ok: false, erreur: "Lecture impossible." }, { status: 500 });
      }

      const lot = data || [];
      for (const e of lot) entites.push(e);
      if (lot.length < PAS) break;
      offset = offset + PAS;
    }

    if (entites.length === 0) {
      return NextResponse.json({
        ok: true,
        info: "aucune societe n a arme la relance automatique",
        aide: "Pour armer une societe : update compliance_tenants "
          + "set relance_auto = true, email_contact = '...' where id = '...';",
        societes: 0,
      });
    }

    // ---- LES ECHEANCES DANS LES FENETRES DE RELANCE ----
    //
    // On borne la lecture a la plus large des fenetres : inutile de
    // rapatrier des echeances a deux ans.
    const horizon = jourISO(new Date(Date.now() + (PALIERS[0] + TOLERANCE_JOURS) * 86400000));
    const aujourdhui = jourISO(new Date());

    const idsEntites = entites.map(function (e: any) { return e.id; });
    const parId: any = {};
    for (const e of entites) parId[e.id] = e;

    const echeances: any[] = [];
    let offsetE = 0;

    while (true) {
      const { data, error } = await supabase
        .from("compliance_deadlines")
        .select("id, tenant_id, entite_id, rule_code, period_label, due_date, status, amount_due, currency")
        .in("entite_id", idsEntites)
        .in("status", ["a_venir", "prepare"])
        .gte("due_date", aujourdhui)
        .lte("due_date", horizon)
        .order("due_date", { ascending: true })
        .range(offsetE, offsetE + PAS - 1);

      if (error) {
        console.error("[cron/relances-echeances] lecture echeances :", error.message);
        return NextResponse.json({ ok: false, erreur: "Lecture impossible." }, { status: 500 });
      }

      const lot = data || [];
      for (const l of lot) echeances.push(l);
      if (lot.length < PAS) break;
      offsetE = offsetE + PAS;
    }

    if (echeances.length === 0) {
      return NextResponse.json({
        ok: true,
        info: "aucune echeance dans les fenetres de relance",
        societes: entites.length,
        envoyees: 0,
      });
    }

    // ---- L HISTORIQUE RECENT, POUR NE PAS RELANCER DEUX FOIS ----
    const depuis = new Date(Date.now() - 90 * 86400000).toISOString();
    const idsEch = echeances.map(function (e: any) { return e.id; });

    const { data: histo } = await supabase
      .from("compliance_relances")
      .select("deadline_id, jours_avant, envoye_le, statut")
      .in("deadline_id", idsEch)
      .gte("envoye_le", depuis)
      .limit(5000);

    const passees = histo || [];

    function dejaRelancee(deadlineId: string, palier: number): boolean {
      const limite = Date.now() - JOURS_ENTRE_DEUX * 86400000;
      for (const h of passees) {
        if (h.deadline_id !== deadlineId) continue;
        if (h.statut !== "envoyee") continue;
        // Le meme palier ne se repete jamais.
        if (h.jours_avant === palier) return true;
        // Deux relances rapprochees, meme de paliers differents, sont
        // vecues comme du harcelement.
        if (new Date(h.envoye_le).getTime() > limite) return true;
      }
      return false;
    }

    // ---- LES TITRES DES REGLES ----
    const { data: regles } = await supabase
      .from("compliance_rules")
      .select("code, title, jurisdiction, channel")
      .limit(500);

    const titres: any = {};
    for (const r of regles || []) titres[r.code] = r;

    // ---- L ENVOI ----
    //
    // ⚠️ DEUX COMPTEURS SEPARES, ET C EST VOLONTAIRE. `totalEnvoyees` ne
    // compte QUE les envois reels ; `totalSimulees` compte ce que l essai
    // aurait envoye. Les melanger — c etait le defaut — produit un chiffre
    // auquel on fait confiance et qui ment.
    const parOrganisme: any = {};
    const resultats: any[] = [];
    let totalEnvoyees = 0;
    let totalSimulees = 0;
    let totalIgnorees = 0;

    for (const ech of echeances) {
      if ((Date.now() - debut) / 1000 > 240) {
        resultats.push({ info: "arret a 240 secondes, reprise au prochain passage" });
        break;
      }

      const entite = parId[ech.entite_id];
      if (!entite || !entite.email_contact) {
        totalIgnorees++;
        continue;
      }

      const compteur = parOrganisme[entite.tenant_id] || 0;
      if (compteur >= PLAFOND_PAR_ORGANISME) {
        totalIgnorees++;
        continue;
      }

      const jours = joursAvant(ech.due_date);

      // Le palier applicable : celui dont la fenetre contient le delai.
      let palier: number | null = null;
      for (const p of PALIERS) {
        if (Math.abs(jours - p) <= TOLERANCE_JOURS) {
          palier = p;
          break;
        }
      }
      if (palier === null) continue;

      if (dejaRelancee(ech.id, palier)) {
        totalIgnorees++;
        continue;
      }

      const regle = titres[ech.rule_code] || {};
      const titre = regle.title || ech.rule_code;
      const ton = tonSelonDelai(jours);

      const sujet = ton.entete + " — " + titre + " — " + entite.label;

      const html = "<p>Bonjour,</p>"
        + "<p>" + ton.intro + "</p>"
        + "<ul>"
        + "<li>Societe : <strong>" + echapper(entite.legal_name || entite.label) + "</strong></li>"
        + "<li>Obligation : <strong>" + echapper(titre) + "</strong></li>"
        + (ech.period_label ? "<li>Periode : " + echapper(ech.period_label) + "</li>" : "")
        + "<li>Date limite : <strong>" + jolieDate(ech.due_date) + "</strong>"
        + " (dans " + jours + " jour" + (jours > 1 ? "s" : "") + ")</li>"
        + (ech.amount_due
          ? "<li>Montant : " + echapper(ech.amount_due) + " " + echapper(ech.currency || "USD") + "</li>"
          : "")
        + (regle.jurisdiction ? "<li>Juridiction : " + echapper(regle.jurisdiction) + "</li>" : "")
        + (regle.channel ? "<li>Canal de depot : " + echapper(regle.channel) + "</li>" : "")
        + "</ul>"
        + "<p>Si cette echeance a deja ete traitee, vous pouvez ignorer ce message.</p>"
        + "<p>Bien cordialement.</p>";

      if (essai) {
        resultats.push({
          societe: entite.label,
          obligation: titre,
          destinataire: entite.email_contact,
          echeance: ech.due_date,
          palier: "J-" + palier,
          statut: "essai, rien envoye",
        });
        // Le plafond par organisme est bien simule, sinon l essai ne
        // montrerait pas ou il s arreterait un jour reel.
        parOrganisme[entite.tenant_id] = compteur + 1;
        totalSimulees++;
        continue;
      }

      const resultat = await envoyer(entite.email_contact, sujet, html);

      await supabase.from("compliance_relances").insert({
        tenant_id: entite.tenant_id,
        entite_id: entite.id,
        deadline_id: ech.id,
        rule_code: ech.rule_code,
        destinataire: entite.email_contact,
        objet: sujet,
        corps: html,
        jours_avant: palier,
        statut: resultat.ok ? "envoyee" : "echec",
        motif_echec: resultat.ok ? null : String(resultat.detail).slice(0, 500),
      });

      if (resultat.ok) {
        parOrganisme[entite.tenant_id] = compteur + 1;
        totalEnvoyees++;
        // L historique en memoire est complete au fil de l eau : deux
        // echeances de la meme societe dans le meme passage ne doivent pas
        // produire deux courriels rapproches.
        passees.push({
          deadline_id: ech.id,
          jours_avant: palier,
          envoye_le: new Date().toISOString(),
          statut: "envoyee",
        });
        resultats.push({
          societe: entite.label,
          obligation: titre,
          destinataire: entite.email_contact,
          echeance: ech.due_date,
          palier: "J-" + palier,
        });
      } else {
        totalIgnorees++;
        resultats.push({
          societe: entite.label,
          obligation: titre,
          statut: "echec d envoi",
        });
      }
    }

    // ⚠️ `envoyees` VAUT TOUJOURS 0 EN MODE ESSAI, et c est la verite : rien
    // n est parti. Le nombre de courriels qu un vrai passage produirait se
    // lit dans `simulees`.
    return NextResponse.json({
      ok: true,
      essai: essai,
      societes_armees: entites.length,
      echeances_examinees: echeances.length,
      envoyees: totalEnvoyees,
      simulees: totalSimulees,
      ignorees: totalIgnorees,
      secondes: Math.round((Date.now() - debut) / 1000),
      resultats: resultats,
    });
  } catch (e: any) {
    console.error("[cron/relances-echeances] exception :", String(e && e.message ? e.message : e));
    return NextResponse.json(
      { ok: false, erreur: "Erreur serveur.", secondes: Math.round((Date.now() - debut) / 1000) },
      { status: 500 }
    );
  }
}
