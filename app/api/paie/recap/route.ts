import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { limiter, ipDe } from "../../../../lib/limiteur";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 28/09 — LE RECAPITULATIF DE PAIE, COTE CLIENT
//
// Le cabinet prepare la paie ; avant toute emission, l employeur recoit par
// courriel la liste de ses salaries, de leurs elements du mois (heures,
// primes, absences) et de leurs nets, et CONFIRME — ou signale ce qui ne va
// pas. C est le seul garde-fou contre l erreur plausible (une prime de
// 200 € saisie 250 €) : aucun controle automatique ne l attrape, lui seul
// sait la verite.
//
// CETTE ROUTE EST PUBLIQUE : le client n a pas de compte. Ce qui le protege,
// c est le JETON du lien, tire au hasard (24 octets) et envoye a lui seul.
//   GET  ?jeton=…   ce qu il doit verifier
//   POST {jeton, reponse: "confirme" | "conteste", remarque}
//
// ⚠️ UNE REPONSE NE SE REPREND PAS : une fois confirme ou conteste, le
// recapitulatif est fige. Si la paie change, le cabinet en renvoie un
// nouveau, qui remplace celui-ci (l ancien lien le dit).
// ⚠️ LA REPONSE EST INSCRITE AU JOURNAL (compta_audit), avec l adresse IP,
// et le cabinet est prevenu par courriel.
// ═══════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Un lien de recapitulatif vaut 60 jours : au-dela, la paie du mois est
// depuis longtemps reglee, et un vieux lien qui traine ne doit plus rien
// pouvoir confirmer.
const DUREE_LIEN_JOURS = 60;

const MARQUES: Record<string, { nom: string; expediteur: string }> = {
  "mrcomptable.fr": { nom: "Mr. Comptable", expediteur: "Mr. Comptable <contact@mrcomptable.fr>" },
  "www.mrcomptable.fr": { nom: "Mr. Comptable", expediteur: "Mr. Comptable <contact@mrcomptable.fr>" },
  "academiapro.fr": { nom: "AcadéMIA Pro", expediteur: "AcadéMIA Pro <contact@academiapro.fr>" },
};

function marqueDe(req: Request) {
  const h = (req.headers.get("host") || "").split(":")[0].toLowerCase();
  return MARQUES[h] || MARQUES["academiapro.fr"];
}

function repondre(corps: any, status?: number) {
  return NextResponse.json(corps, {
    status: status || 200,
    headers: { "Cache-Control": "no-store" },
  });
}

function moisEnClair(periode: string): string {
  const noms = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août",
    "septembre", "octobre", "novembre", "décembre"];
  const m = Number(String(periode).slice(5, 7));
  return (noms[m - 1] || "") + " " + String(periode).slice(0, 4);
}

function html(t: any): string {
  return String(t === null || t === undefined ? "" : t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function jetonPropre(v: any): string | null {
  const t = String(v || "").trim();
  if (t.length < 20 || t.length > 100) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(t)) return null;
  return t;
}

async function lire(jeton: string): Promise<any | null> {
  const { data } = await supabase
    .from("paie_recaps")
    .select("id, societe_id, periode, contenu, statut, destinataire, envoye_par, remarque, repondu_le, cree_le")
    .eq("jeton", jeton)
    .maybeSingle();
  return data || null;
}

function perime(r: any): boolean {
  const cree = new Date(String(r.cree_le || "")).getTime();
  if (!isFinite(cree)) return false;
  return Date.now() - cree > DUREE_LIEN_JOURS * 24 * 3600 * 1000;
}

export async function GET(req: Request) {
  try {
    if (!limiter(ipDe(req), "recap_paie_lecture", 60, 60 * 60 * 1000)) {
      return repondre({ success: false, erreur: "Trop de demandes. Réessayez dans une heure." }, 429);
    }
    const url = new URL(req.url);
    const jeton = jetonPropre(url.searchParams.get("jeton"));
    if (!jeton) return repondre({ success: false, erreur: "Lien incomplet." }, 400);

    const r = await lire(jeton);
    if (!r || r.statut === "leve") {
      return repondre({ success: false, erreur: "Ce lien n'existe pas ou n'est plus valable." }, 404);
    }
    if (perime(r)) {
      return repondre({ success: false, erreur: "Ce lien a expiré. Demandez à votre cabinet de vous renvoyer le récapitulatif." }, 410);
    }

    const contenu: any = r.contenu || {};
    return repondre({
      success: true,
      statut: r.statut,
      periode: r.periode,
      mois: moisEnClair(r.periode),
      societe: contenu.societe || "",
      lignes: contenu.lignes || [],
      totaux: contenu.totaux || { brut: 0, net: 0 },
      envoye_le: r.cree_le,
      repondu_le: r.repondu_le,
      remarque: r.remarque,
      remplace: r.statut === "remplace",
    });
  } catch (e: any) {
    console.error("[paie/recap] GET :", String(e));
    return repondre({ success: false, erreur: "Lecture impossible pour le moment." }, 500);
  }
}

export async function POST(req: Request) {
  try {
    if (!limiter(ipDe(req), "recap_paie_reponse", 20, 60 * 60 * 1000)) {
      return repondre({ success: false, erreur: "Trop de demandes. Réessayez dans une heure." }, 429);
    }
    const corps: any = await req.json().catch(function () { return {}; });
    const jeton = jetonPropre(corps.jeton);
    const reponse = String(corps.reponse || "");
    const remarque = String(corps.remarque || "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, 2000);

    if (!jeton) return repondre({ success: false, erreur: "Lien incomplet." }, 400);
    if (reponse !== "confirme" && reponse !== "conteste") {
      return repondre({ success: false, erreur: "Réponse inattendue." }, 400);
    }
    if (reponse === "conteste" && remarque.length < 5) {
      return repondre({ success: false, erreur: "Dites en quelques mots ce qui ne va pas : votre cabinet corrigera." }, 400);
    }

    const r = await lire(jeton);
    if (!r || r.statut === "leve") {
      return repondre({ success: false, erreur: "Ce lien n'existe pas ou n'est plus valable." }, 404);
    }
    if (perime(r)) {
      return repondre({ success: false, erreur: "Ce lien a expiré. Demandez à votre cabinet de vous renvoyer le récapitulatif." }, 410);
    }
    if (r.statut === "remplace") {
      return repondre({ success: false, erreur: "Un récapitulatif plus récent vous a été envoyé : répondez depuis le dernier courriel reçu." }, 409);
    }
    if (r.statut !== "envoye") {
      return repondre({ success: false, erreur: "Vous avez déjà répondu à ce récapitulatif.", statut: r.statut }, 409);
    }

    const ip = ipDe(req);
    const maintenant = new Date().toISOString();
    const { data: maj, error } = await supabase
      .from("paie_recaps")
      .update({ statut: reponse, repondu_le: maintenant, remarque: remarque || null, adresse_ip: ip })
      .eq("id", r.id)
      .eq("statut", "envoye")
      .select("id")
      .maybeSingle();
    if (error) {
      console.error("[paie/recap] mise a jour :", error.message);
      return repondre({ success: false, erreur: "Enregistrement impossible pour le moment." }, 500);
    }
    if (!maj) {
      return repondre({ success: false, erreur: "Vous avez déjà répondu à ce récapitulatif." }, 409);
    }

    // Le journal : qui a confirme quoi, quand, d ou.
    const { error: eJ } = await supabase.from("compta_audit").insert({
      societe_id: r.societe_id,
      email: String(r.destinataire || "client"),
      action: reponse === "confirme" ? "paie.recap_confirme" : "paie.recap_conteste",
      cible: "paie_recaps",
      reference: String(r.id),
      avant: null,
      apres: { periode: r.periode, remarque: remarque || null },
      adresse_ip: ip,
    });
    if (eJ) console.error("[paie/recap] journal :", eJ.message);

    // Le cabinet est prevenu. Un courriel qui ne part pas n annule pas la
    // reponse : elle est enregistree et se voit dans « Validation du mois ».
    const cle = process.env.RESEND_API_KEY || "";
    const dest = String(r.envoye_par || "");
    if (cle && dest.indexOf("@") > 0) {
      try {
        const contenu: any = r.contenu || {};
        const marque = marqueDe(req);
        const resend = new Resend(cle);
        const titre = "Paie de " + moisEnClair(r.periode) + " — " + String(contenu.societe || "")
          + (reponse === "confirme" ? " : confirmée par le client" : " : le client signale une erreur");
        const envoi: any = await resend.emails.send({
          from: marque.expediteur,
          to: dest,
          subject: titre,
          html: '<div style="font-family:Georgia,serif;color:#222;max-width:600px;margin:0 auto;padding:20px">'
            + "<h2>" + html(titre) + "</h2>"
            + (reponse === "confirme"
              ? "<p>Le client (" + html(r.destinataire) + ") a confirmé le récapitulatif. Les bulletins du mois "
                + "peuvent être émis depuis « Validation du mois ».</p>"
              : "<p>Le client (" + html(r.destinataire) + ") signale : <b>« " + html(remarque) + " »</b></p>"
                + "<p>Corrigez la paie, puis renvoyez-lui le récapitulatif. Aucun bulletin du mois ne "
                + "peut être émis en attendant.</p>")
            + "</div>",
        } as any);
        if (envoi && envoi.error) console.error("[paie/recap] courriel :", String(envoi.error.message || envoi.error));
      } catch (e: any) {
        console.error("[paie/recap] courriel :", String(e));
      }
    }

    return repondre({
      success: true,
      statut: reponse,
      message: reponse === "confirme"
        ? "Merci : votre confirmation est enregistrée. Votre cabinet peut émettre les bulletins du mois."
        : "Merci : votre remarque est transmise à votre cabinet, qui corrigera et vous renverra le récapitulatif.",
    });
  } catch (e: any) {
    console.error("[paie/recap] POST :", String(e));
    return repondre({ success: false, erreur: "Enregistrement impossible pour le moment." }, 500);
  }
}
