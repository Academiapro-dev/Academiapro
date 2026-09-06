import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession, tenantDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ══════════════════════════════════════════════════════════════════════════
// APPELER DEPUIS L OUTIL — 06/09.
//
// CE QUE FAIT CETTE ROUTE. Elle demande a Plivo d appeler d abord LE
// CLIENT, puis, quand il decroche, de composer le numero du contact et de
// mettre les deux en relation.
//
// 🚨 POURQUOI DANS CET ORDRE. Le client n a pas de standard : il travaille
// avec son telephone. On ne peut donc pas « passer un appel depuis
// l ordinateur » — on organise une mise en relation. Son telephone sonne,
// il decroche, et le contact sonne a son tour. C est le montage que tous
// les CRM utilisent.
//
// ⚠️ LE NUMERO AFFICHE CHEZ LE CONTACT EST CELUI DE L ORGANISME
// (`tel_numero`), pas celui de Plivo : un numero inconnu ne se rappelle
// pas, et l appel manque son but.
//
// 🚨 LES APPELS HORS EUROPE SONT REFUSES. Meme regle que pour les SMS,
// meme liste d indicatifs : hors EEA la minute coute jusqu a sept fois le
// prix facture (0,3030 $ contre 0,0426 $ vers un mobile europeen). Chaque
// appel lointain serait une perte seche.
// ⚠️ LA LISTE EST RECOPIEE DE /api/organisme/sms — si l une change,
// changer l autre. Deux regles qui divergent feraient passer par un canal
// ce qu on refuse sur l autre.
//
// ⚠️ LES CREDITS SE DECOMPTENT A LA FIN, PAS AU DEPART — contrairement aux
// SMS. Un SMS a un prix connu d avance ; un appel non. On verifie donc
// qu il reste de quoi parler, et le webhook decompte la duree reelle.
// ══════════════════════════════════════════════════════════════════════════

const URL_PLIVO = "https://api.plivo.com/v1/Account/";

// Le minimum pour lancer un appel : sans cela, on ouvrirait une
// communication qu on ne peut pas payer.
const CREDIT_MINIMUM_SEC = 60;

const INDICATIFS_EEA = [
  "33", "32", "352", "41", "49", "31", "34", "351", "39", "43", "353",
  "45", "46", "358", "47", "354", "423", "48", "420", "421", "36", "40",
  "359", "385", "386", "370", "371", "372", "30", "357", "356",
];

// ⚠️ DU PLUS LONG AU PLUS COURT : « 33 » est le prefixe de « 350 »
// (Gibraltar). Sans ce tri, un numero gibraltarien passerait pour francais.
const INDICATIFS_TRIES = INDICATIFS_EEA.slice().sort(function (a, b) {
  return b.length - a.length;
});

function estEuropeen(numero: string): boolean {
  for (const i of INDICATIFS_TRIES) {
    if (numero.indexOf(i) === 0) return true;
  }
  return false;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// LE NUMERO AU FORMAT INTERNATIONAL, SANS PLUS NI ESPACES.
// Meme normalisation que pour les SMS : les numeros arrivent en
// « +33 6 12 34 56 78 » ou « 06 12 34 56 78 ».
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

export async function POST(req: NextRequest) {
  try {
    const email = emailDeSession();
    const tenant = tenantDeSession();
    if (!email) {
      return NextResponse.json({ ok: false, erreur: "Vous devez être connecté." }, { status: 401 });
    }
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattaché à votre compte." },
        { status: 403 }
      );
    }

    const id = process.env.PLIVO_AUTH_ID || "";
    const jeton = process.env.PLIVO_AUTH_TOKEN || "";
    if (!id || !jeton) {
      // 🚨 LE DETAIL RESTE DANS LES JOURNAUX. Nommer une variable
      // d environnement au visiteur, c est du renseignement offert.
      console.error("[organisme/appeler] identifiants Plivo absents");
      return NextResponse.json(
        { ok: false, erreur: "La téléphonie n'est pas encore active sur votre compte." },
        { status: 503 }
      );
    }

    const b = await req.json().catch(function () { return null; });
    if (!b || !b.numero) {
      return NextResponse.json({ ok: false, erreur: "Numéro manquant." }, { status: 400 });
    }

    const cible = numeroPropre(b.numero);
    if (!cible) {
      return NextResponse.json(
        { ok: false, erreur: "Ce numéro n'est pas lisible : " + String(b.numero).slice(0, 30) },
        { status: 400 }
      );
    }

    if (!estEuropeen(cible)) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Ce numéro n'est pas européen. Les appels ne partent que "
            + "vers l'Europe et la Suisse : ailleurs, la minute coûte "
            + "plusieurs fois le prix facturé.",
        },
        { status: 400 }
      );
    }

    // ---- L ORGANISME : SON NUMERO ET SON CREDIT ----
    const { data: orga } = await supabase
      .from("organismes_formation")
      .select("id, raison_sociale, tel_numero, minutes_credits")
      .eq("tenant_id", tenant)
      .limit(1)
      .maybeSingle();

    if (!orga) {
      return NextResponse.json({ ok: false, erreur: "Organisme introuvable." }, { status: 404 });
    }

    const monNumero = numeroPropre(orga.tel_numero || "");
    if (!monNumero) {
      // ⛔ ON N APPELLE PAS SOUS UN NUMERO PAR DEFAUT. Un appel qui
      // s affiche sous un numero inconnu ne se rappelle pas.
      return NextResponse.json(
        {
          ok: false,
          erreur: "Votre numéro d'appel n'est pas encore réglé. C'est lui "
            + "qui s'affiche chez la personne appelée. Écrivez-nous pour "
            + "le faire poser.",
        },
        { status: 400 }
      );
    }

    // Le numero du collaborateur, celui qui va parler. Il vient de la
    // requete : dans une equipe, chacun appelle depuis son propre poste.
    const monPoste = numeroPropre(b.mon_numero || orga.tel_numero || "");
    if (!monPoste) {
      return NextResponse.json(
        { ok: false, erreur: "Indiquez le numéro sur lequel vous voulez être appelé." },
        { status: 400 }
      );
    }

    const credits = Number(orga.minutes_credits || 0);
    if (credits < CREDIT_MINIMUM_SEC) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Crédit d'appel insuffisant : il vous reste "
            + Math.floor(credits / 60) + " minute(s). Écrivez-nous pour en ajouter.",
          credits_restants: credits,
        },
        { status: 402 }
      );
    }

    // ---- LA TRACE, AVANT L APPEL ----
    //
    // ⚠️ ELLE PRECEDE L APPEL, comme pour les SMS. Si Plivo echoue en cours
    // de route, la ligne existe deja : mieux vaut un appel en erreur qu un
    // appel dont on ignore tout.
    const { data: trace } = await supabase
      .from("crm_appels")
      .insert({
        tenant_id: tenant,
        fiche_email: String(b.fiche_email || "").toLowerCase() || null,
        numero: cible,
        sens: "sortant",
        etat: "lance",
        saisi_par: "automatique",
      })
      .select("id")
      .maybeSingle();

    // ---- L APPEL ----
    //
    // 🚨 DEUX JAMBES. Plivo appelle d abord `monPoste` — le telephone du
    // collaborateur. Quand il decroche, `answer_url` lui dit quoi faire :
    // composer `cible` et mettre les deux en relation.
    //
    // ⚠️ `caller_id` EST LE NUMERO DE L ORGANISME, pas celui de Plivo :
    // c est ce que verra la personne appelee.
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.mrcrm.fr";
    const reference = trace ? String(trace.id) : "";

    const corps = new URLSearchParams({
      from: monNumero,
      to: monPoste,
      answer_url: site + "/api/organisme/appeler/repondre?vers="
        + encodeURIComponent(cible) + "&ref=" + encodeURIComponent(reference),
      answer_method: "GET",
      hangup_url: site + "/api/organisme/appeler/fin",
      hangup_method: "POST",
      // ⚠️ TRENTE SECONDES DE SONNERIE. Au-dela, l appel est abandonne :
      // laisser sonner plus longtemps consomme sans rien apporter.
      ring_timeout: "30",
    });

    const r = await fetch(URL_PLIVO + id + "/Call/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(id + ":" + jeton).toString("base64"),
      },
      body: JSON.stringify(Object.fromEntries(corps)),
    });

    const brut = await r.text();
    let reponse: any = null;
    try { reponse = JSON.parse(brut); } catch (e) {}

    if (!r.ok) {
      if (trace) {
        await supabase
          .from("crm_appels")
          .update({ etat: "echec", notes: brut.slice(0, 400) })
          .eq("id", trace.id);
      }
      console.error("[organisme/appeler] Plivo " + r.status + " : " + brut.slice(0, 300));
      return NextResponse.json(
        { ok: false, erreur: "L'appel n'a pas pu être lancé. Réessayez." },
        { status: 502 }
      );
    }

    const appelId = reponse && reponse.request_uuid ? String(reponse.request_uuid) : null;

    if (trace && appelId) {
      await supabase
        .from("crm_appels")
        .update({ appel_id: appelId, etat: "sonne" })
        .eq("id", trace.id);
    }

    return NextResponse.json({
      ok: true,
      appel_id: appelId,
      message: "Votre téléphone va sonner. Décrochez : "
        + cible + " sera appelé aussitôt.",
    });
  } catch (e: any) {
    console.error("[organisme/appeler] exception : " + String(e));
    return NextResponse.json(
      { ok: false, erreur: "Appel impossible pour le moment." },
      { status: 500 }
    );
  }
}
