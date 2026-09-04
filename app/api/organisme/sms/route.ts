import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession, tenantDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ══════════════════════════════════════════════════════════════════════════
// L ENVOI DE SMS PAR UN CLIENT — 04/09.
//
// CETTE ROUTE EST LE PENDANT CLIENT DE /api/admin/envoyer-sms. Celle-la est
// reservee a contact@academiapro.fr et envoie sous le nom des marques de la
// maison ; celle-ci est ouverte a tout utilisateur connecte portant un
// organisme, et envoie SOUS LE NOM DE SON ORGANISME.
//
// 🚨 POURQUOI DEUX ROUTES ET NON UNE SEULE OUVERTE PLUS LARGEMENT.
// Trois regles ne valent que pour un client et n auraient aucun sens pour
// l administrateur : le cloisonnement par organisme, le decompte des
// credits, et le nom d expediteur propre. Melanger les deux aurait produit
// une route pleine de conditions — et c est dans ces conditions-la qu on
// oublie un filtre.
//
// 🚨 LES TROIS REGLES, DANS L ORDRE OU ELLES S APPLIQUENT :
//
//   1. CLOISONNEMENT. Chaque ligne de `sms_envoyes` porte le `tenant_id` de
//      l organisme. Sans lui, un client verrait les SMS de tous les autres
//      dans son journal. ⚠️ UNE REQUETE POSTGREST SANS FILTRE REND TOUT :
//      le filtre n est pas une precaution, c est la seule barriere.
//
//   2. NOM D EXPEDITEUR. Un client qui ecrit a SON client doit signer de
//      SON nom, jamais de « AcademiaPro ». Le nom vit dans
//      `organismes_formation.sms_expediteur`.
//      ⚠️ ONZE CARACTERES AU MAXIMUM, lettres et chiffres seulement. C est
//      une contrainte des OPERATEURS, pas de Brevo : un expediteur plus
//      long est tronque ou refuse selon les reseaux. La contrainte est
//      posee en base ; on la reverifie ici, parce qu une donnee ancienne
//      peut avoir ete inseree avant elle.
//      ⚠️ UN NOM D EXPEDITEUR DOIT PARFOIS ETRE DECLARE CHEZ BREVO AVANT DE
//      FONCTIONNER, selon les operateurs. Un premier envoi qui echoue avec
//      un nom neuf ne veut pas dire que la route est cassee.
//
//   3. CREDITS. Decision de Jacques du 04/09 : ON BLOQUE. Un client sans
//      credit ne peut pas envoyer, et le message le lui dit clairement
//      plutot que de le laisser deviner.
//
// 🚨 LE DECOMPTE SE FAIT AVANT L APPEL A BREVO, ET IL EST RENDU EN CAS
// D ECHEC. Decompter apres laisserait passer les envois simultanes d un
// client a zero credit ; ne jamais rendre ferait payer un SMS qui n est
// jamais parti.
//
// ⚠️ UN SMS DE PLUS DE 160 CARACTERES COMPTE POUR PLUSIEURS. L operateur
// le decoupe et facture chaque morceau : le decompte suit cette regle, et
// le nombre est annonce dans la reponse pour que la depense ne soit jamais
// une surprise.
//
// ⚠️ LE MARQUAGE PRECEDE L ENVOI, comme dans la route administrateur. Si
// l appel echoue en cours de route, la trace existe deja : mieux vaut une
// ligne en erreur qu un envoi dont on ignore tout.
// ══════════════════════════════════════════════════════════════════════════

const URL_BREVO = "https://api.brevo.com/v3/transactionalSMS/sms";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// LE NUMERO AU FORMAT INTERNATIONAL, SANS PLUS NI ESPACES.
//
// Brevo attend 33612345678. Les numeros importes arrivent en
// "+33 6 12 34 56 78", ceux saisis a la main en "06 12 34 56 78". On
// normalise les deux plutot que d exiger une saisie parfaite du client.
function numeroPropre(brut: string): string | null {
  let t = String(brut || "").replace(/[^0-9+]/g, "");
  if (!t) return null;

  if (t.indexOf("+") === 0) t = t.slice(1);
  else if (t.indexOf("00") === 0) t = t.slice(2);
  else if (t.indexOf("0") === 0) t = "33" + t.slice(1);

  if (/^33[1-9]\d{8}$/.test(t)) return t;
  if (/^\d{8,15}$/.test(t)) return t;

  return null;
}

// LE SMS EST LIMITE. Cent soixante caracteres pour un message simple ;
// au-dela, l operateur le decoupe en morceaux de 153 et facture chacun.
function morceaux(texte: string): number {
  const n = String(texte || "").length;
  if (n <= 160) return 1;
  return Math.ceil(n / 153);
}

// ⚠️ LE NOM D EXPEDITEUR EST RECONTROLE ICI. La contrainte en base couvre
// les ecritures futures ; une ligne inseree avant elle pourrait porter un
// nom trop long, que les operateurs tronqueraient sans rien dire.
function expediteurValide(brut: any): string | null {
  const t = String(brut || "").trim();
  if (!t) return null;
  if (!/^[A-Za-z0-9]{3,11}$/.test(t)) return null;
  return t;
}

export async function POST(req: NextRequest) {
  try {
    const email = emailDeSession();
    if (!email) {
      return NextResponse.json(
        { ok: false, erreur: "Vous devez être connecté." },
        { status: 401 }
      );
    }

    const tenant = tenantDeSession();
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattaché à votre compte." },
        { status: 403 }
      );
    }

    const cle = process.env.BREVO_API_KEY || "";
    if (!cle) {
      // 🚨 LE DETAIL RESTE DANS LES JOURNAUX, JAMAIS DANS LA REPONSE.
      // Nommer une variable d environnement au visiteur, c est du
      // renseignement offert a qui sonde le site.
      console.error("[organisme/sms] BREVO_API_KEY absente.");
      return NextResponse.json(
        { ok: false, erreur: "Envoi indisponible pour le moment." },
        { status: 500 }
      );
    }

    const b = await req.json().catch(function () { return null; });
    if (!b || !b.numero || !b.message) {
      return NextResponse.json(
        { ok: false, erreur: "Le numéro et le message sont obligatoires." },
        { status: 400 }
      );
    }

    const numero = numeroPropre(b.numero);
    if (!numero) {
      return NextResponse.json(
        { ok: false, erreur: "Ce numéro n'est pas lisible : "
          + String(b.numero).slice(0, 30) },
        { status: 400 }
      );
    }

    const texte = String(b.message).trim();
    if (texte.length < 2) {
      return NextResponse.json(
        { ok: false, erreur: "Le message est vide." },
        { status: 400 }
      );
    }
    if (texte.length > 640) {
      return NextResponse.json(
        { ok: false, erreur: "Message trop long : 640 caractères au maximum." },
        { status: 400 }
      );
    }

    const nb = morceaux(texte);

    // ---- L ORGANISME : SON NOM D EXPEDITEUR ET SES CREDITS -------------
    const { data: orga, error: erreurOrga } = await supabase
      .from("organismes_formation")
      .select("id, raison_sociale, sms_expediteur, sms_credits")
      .eq("tenant_id", tenant)
      .limit(1)
      .maybeSingle();

    if (erreurOrga || !orga) {
      return NextResponse.json(
        { ok: false, erreur: "Organisme introuvable." },
        { status: 404 }
      );
    }

    const expediteur = expediteurValide(orga.sms_expediteur);
    if (!expediteur) {
      // ⛔ ON N ENVOIE PAS SOUS UN NOM PAR DEFAUT. Un SMS signe
      // « AcademiaPro » arrivant chez le client d un client serait
      // incomprehensible pour lui, et embarrassant pour l organisme.
      return NextResponse.json(
        {
          ok: false,
          erreur: "Votre nom d'expéditeur SMS n'est pas encore réglé. "
            + "Il apparaît à la place du numéro chez votre destinataire : "
            + "onze caractères au maximum, lettres et chiffres seulement. "
            + "Écrivez-nous pour le faire poser.",
        },
        { status: 400 }
      );
    }

    const credits = Number(orga.sms_credits || 0);
    if (credits < nb) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Crédits SMS insuffisants : il vous en reste " + credits
            + (nb > 1
              ? ", et ce message en consomme " + nb
                + " car il dépasse 160 caractères."
              : ".")
            + " Écrivez-nous pour en ajouter.",
          credits_restants: credits,
          credits_necessaires: nb,
        },
        { status: 402 }
      );
    }

    // ---- LE DECOMPTE, AVANT L ENVOI ------------------------------------
    //
    // 🚨 IL EST CONDITIONNE AU SOLDE (`gte`). Deux envois lances en meme
    // temps par le meme client liraient tous deux le meme solde ; sans
    // cette condition, les deux passeraient et le solde deviendrait
    // negatif. Ici, le second echoue proprement.
    const { data: debite } = await supabase
      .from("organismes_formation")
      .update({ sms_credits: credits - nb })
      .eq("id", orga.id)
      .gte("sms_credits", nb)
      .select("id")
      .maybeSingle();

    if (!debite) {
      return NextResponse.json(
        { ok: false, erreur: "Crédits SMS insuffisants." },
        { status: 402 }
      );
    }

    // ---- LA TRACE, AVANT L ENVOI ---------------------------------------
    const origine = String(b.origine || "crm").slice(0, 40);
    const { data: trace } = await supabase
      .from("sms_envoyes")
      .insert({
        tenant_id: tenant,
        destinataire: numero,
        message: texte,
        origine: origine,
        reference_id: b.reference_id || null,
        statut: "en_cours",
        envoye_par: email,
      })
      .select("id")
      .maybeSingle();

    // ---- L ENVOI --------------------------------------------------------
    const r = await fetch(URL_BREVO, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": cle,
        accept: "application/json",
      },
      body: JSON.stringify({
        type: "transactional",
        sender: expediteur,
        recipient: numero,
        content: texte,
      }),
    });

    const brut = await r.text();
    let reponse: any = null;
    try { reponse = JSON.parse(brut); } catch (e) {}

    if (!r.ok) {
      // 🚨 LES CREDITS SONT RENDUS. Le message n est pas parti : le client
      // ne doit pas le payer. Sans cette ligne, un incident chez Brevo
      // viderait le solde d un client sans qu il recoive quoi que ce soit.
      await supabase
        .from("organismes_formation")
        .update({ sms_credits: credits })
        .eq("id", orga.id);

      if (trace) {
        await supabase
          .from("sms_envoyes")
          .update({ statut: "echec", erreur: brut.slice(0, 400) })
          .eq("id", trace.id);
      }

      console.error("[organisme/sms] Brevo " + r.status + " : " + brut.slice(0, 300));

      return NextResponse.json(
        {
          ok: false,
          erreur: "Le message n'est pas parti. Vos crédits n'ont pas été "
            + "décomptés. Si cela se reproduit, écrivez-nous.",
        },
        { status: 502 }
      );
    }

    const identifiant = reponse && (reponse.messageId || reponse.reference)
      ? String(reponse.messageId || reponse.reference)
      : null;

    if (trace) {
      await supabase
        .from("sms_envoyes")
        .update({ statut: "envoye", message_id: identifiant })
        .eq("id", trace.id);
    }

    return NextResponse.json({
      ok: true,
      destinataire: numero,
      expediteur: expediteur,
      caracteres: texte.length,
      sms_decomptes: nb,
      credits_restants: credits - nb,
      message: "Message envoyé sous le nom " + expediteur
        + (nb > 1 ? " — " + nb + " SMS décomptés (message long)." : ".")
        + " Il vous reste " + (credits - nb) + " crédit(s).",
    });
  } catch (e: any) {
    console.error("[organisme/sms] exception :", String(e));
    return NextResponse.json(
      { ok: false, erreur: "Envoi impossible pour le moment." },
      { status: 500 }
    );
  }
}
