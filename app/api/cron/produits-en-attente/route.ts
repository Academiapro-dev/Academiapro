import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ══════════════════════════════════════════════════════════════════════════
// LE RAPPEL DU LUNDI — 06/09.
//
// CE QU IL FAIT. Il compte les fiches dont un produit SECONDAIRE attend son
// message depuis assez longtemps, et envoie un courriel a Jacques. Rien de
// plus.
//
// 🚨 IL N ENVOIE AUCUN MESSAGE A PERSONNE D AUTRE. Les messages partent par
// la MESSAGERIE LINKEDIN, que Jacques ouvre a la main : LinkedIn n ouvre
// pas l ecriture de messages a une application comme celle-ci — c est
// reserve a ses partenaires sous contrat. Ce cron ne peut donc que
// RAPPELER, et c est ce qu on lui demande.
//
// POURQUOI UN RAPPEL PLUTOT QU UNE PREPARATION EN BASE. L ecran
// /admin/linkedin calcule deja cette liste a chaque ouverture, sur des
// donnees qu il a en main. Un cron qui ecrirait le meme calcul dans une
// table ajouterait une piece a maintenir sans rien apporter — et deux
// calculs finissent toujours par diverger. Ce qui manquait, c etait le
// rappel : sans lui, il faut penser a ouvrir l ecran.
//
// LUNDI 8 H 15 — choix de Jacques. Le lundi parce que la semaine commence ;
// 8 h 15 et non 8 h parce que deux crons y sont deja (/api/cron/relances et
// /api/campagne-organismes) et qu il est inutile de les empiler.
//
// ⚠️ SEPT JOURS DEPUIS LE DERNIER MESSAGE, QUEL QU IL SOIT. Le meme calcul
// que dans l ecran : on prend la date la plus RECENTE parmi le message
// principal et tous les produits deja envoyes. Compter produit par produit
// laisserait partir trois messages le meme jour.
// 🚨 SI CE DELAI CHANGE ICI, LE CHANGER AUSSI dans app/admin/linkedin/page.tsx
// (constante DELAI_ENTRE_MESSAGES). Deux regles qui divergent donneraient un
// rappel pour des fiches que l ecran refuse encore d ouvrir.
// ══════════════════════════════════════════════════════════════════════════

const DELAI_ENTRE_MESSAGES = 7;

const NOMS: any = {
  academiapro: "AcadéMIA Pro",
  mrcomptable: "Mr. Comptable",
  mysterllc: "MysterLLC",
  mrcrm: "Mr. CRM",
  mrlms: "Mr. LMS",
};

const DESTINATAIRE = "contact@academiapro.fr";
const EXPEDITEUR = "AcadéMIA Pro <contact@academiapro.fr>";
const SITE = "https://academiapro.fr";

function clientAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

// La date du dernier message envoye a cette personne, tous produits
// confondus. Rend null si aucun n est jamais parti.
function dernierMessageDe(l: any): number | null {
  let plusRecent: number | null = null;

  function retenir(d: any) {
    if (!d) return;
    const t = new Date(d).getTime();
    if (!isNaN(t) && (plusRecent === null || t > plusRecent)) plusRecent = t;
  }

  retenir(l.linkedin_relance_le);
  const p = l.produits;
  if (p && typeof p === "object") {
    for (const cle of Object.keys(p)) retenir(p[cle]);
  }
  return plusRecent;
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  const supabase = clientAdmin();

  // ⚠️ ON NE LIT QUE LES FICHES QUI PORTENT DES PRODUITS SECONDAIRES.
  // `produits <> '{}'` ecarte d emblee celles a une seule campagne — de
  // loin les plus nombreuses. Sans ce filtre, on chargerait toute la table
  // pour n en retenir qu une poignee.
  const { data: fiches, error } = await supabase
    .from("crm")
    .select("id, nom, dirigeant_prenom, dirigeant_nom, organisme, campagne, produits, linkedin_relance_le, linkedin_statut, desinscrit")
    .neq("produits", "{}")
    .not("desinscrit", "is", true)
    .limit(500);

  if (error) {
    console.error("[cron/produits-en-attente] " + error.message);
    return NextResponse.json({ erreur: error.message }, { status: 500 });
  }

  const prets: any[] = [];
  let enAttente = 0;

  for (const f of fiches || []) {
    const p = f.produits;
    if (!p || typeof p !== "object") continue;

    // ⚠️ SEULES LES FICHES DONT LE PREMIER MESSAGE EST PARTI. Proposer un
    // second produit a quelqu un qui n a pas encore recu le premier n a
    // aucun sens — et l ecran ne l afficherait pas non plus.
    if (!f.linkedin_relance_le) continue;

    const dernier = dernierMessageDe(f);
    const jours = dernier === null
      ? 999
      : Math.floor((Date.now() - dernier) / 86400000);

    const restants = Object.keys(p).filter(function (cle) { return !p[cle]; });
    if (restants.length === 0) continue;

    if (jours >= DELAI_ENTRE_MESSAGES) {
      const nom = ((f.dirigeant_prenom || "") + " " + (f.dirigeant_nom || "")).trim()
        || f.nom || "sans nom";
      prets.push({
        nom: nom,
        organisme: f.organisme || "",
        produits: restants.map(function (c) { return NOMS[c] || c; }),
      });
    } else {
      enAttente++;
    }
  }

  if (prets.length === 0) {
    return NextResponse.json({
      ok: true,
      prets: 0,
      en_attente: enAttente,
      info: "aucun produit a ecrire aujourd hui, aucun courriel envoye",
    });
  }

  // ---- LE COURRIEL ----
  //
  // Il liste les fiches, sans les messages : ceux-ci se lisent dans
  // l ecran, ou ils sont ecrits dans la voix du produit et copiables d un
  // geste. Un courriel qui les contiendrait tous serait illisible et
  // inutilisable — on ne colle pas depuis sa boite vers LinkedIn.
  const lignes = prets.slice(0, 30).map(function (x: any) {
    return '<li style="margin-bottom:7px;">'
      + '<strong>' + x.nom + '</strong>'
      + (x.organisme ? ' <span style="color:#888;">· ' + x.organisme + '</span>' : "")
      + '<br/><span style="color:#8a6d3b;font-size:13px;">'
      + x.produits.join(" · ") + '</span></li>';
  }).join("");

  const html = '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/>'
    + '<meta name="viewport" content="width=device-width,initial-scale=1"/>'
    + '</head><body style="margin:0;padding:0;background:#ffffff;">'
    + '<div style="font-family:Georgia,serif;font-size:15px;line-height:1.7;'
    + 'color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px;">'
    + '<p>' + prets.length + ' fiche(s) attendent un second message.</p>'
    + '<ul style="padding-left:18px;margin:16px 0;">' + lignes + '</ul>'
    + (prets.length > 30
      ? '<p style="color:#888;font-size:13px;">… et ' + (prets.length - 30) + ' autres.</p>'
      : "")
    + (enAttente > 0
      ? '<p style="color:#888;font-size:13px;">' + enAttente
        + ' autre(s) fiche(s) n ont pas encore atteint le délai de '
        + DELAI_ENTRE_MESSAGES + ' jours.</p>'
      : "")
    + '<p style="margin-top:22px;"><a href="' + SITE + '/admin/linkedin" '
    + 'style="color:#8a6d3b;">Ouvrir « Messages envoyés »</a> — les messages y '
    + 'sont écrits dans la voix de chaque produit, prêts à copier.</p>'
    + '</div></body></html>';

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + (process.env.RESEND_API_KEY || ""),
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        from: EXPEDITEUR,
        to: DESTINATAIRE,
        subject: prets.length + " fiche(s) attendent un second message",
        html: html,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error("[cron/produits-en-attente] Resend " + r.status + " : " + detail.slice(0, 300));
      return NextResponse.json(
        { ok: false, prets: prets.length, erreur: "courriel non parti" },
        { status: 502 }
      );
    }
  } catch (e: any) {
    console.error("[cron/produits-en-attente] " + String(e));
    return NextResponse.json(
      { ok: false, prets: prets.length, erreur: String(e) },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    prets: prets.length,
    en_attente: enAttente,
    courriel: DESTINATAIRE,
  });
}
