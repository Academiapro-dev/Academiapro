import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession, tenantDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// LE JOURNAL D APPELS — 06/09.
//
// 🚨 CE N EST PAS DE LA TELEPHONIE. Aucun appel ne part d ici, aucune duree
// n est mesuree. Le numero d une fiche est un lien `tel:` qui compose sur
// le telephone ; le client rappelle ensuite ce qui s est dit.
//
// POURQUOI MAINTENANT. La vitrine Mr CRM annoncait « appels rattaches a la
// fiche » — promesse retiree le 04/09 parce que rien ne revenait dans
// l outil. Ceci la tient, sans abonnement ni webhook : ce qui a ete dit au
// dernier appel figure enfin sur la fiche.
//
// ⚠️ LE JOUR OU PLIVO SERA BRANCHE, cette table recevra les appels reels
// sans changer de forme : `sens`, `duree_min` et `numero` sont deja la.
// Seul `saisi_par` deviendra « automatique ».
//
// ⚠️ TOUT EST FILTRE SUR LE TENANT DE LA SESSION, lu dans le cookie signe,
// jamais dans la requete.
// ══════════════════════════════════════════════════════════════════════════

const RESULTATS = ["repondu", "absent", "rappeler", "refus"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function contexte() {
  const email = emailDeSession();
  const tenant = tenantDeSession();
  if (!email) return { erreur: "Vous devez être connecté.", code: 401 };
  if (!tenant) return { erreur: "Aucun organisme rattaché à votre compte.", code: 403 };
  return { email: email, tenant: tenant };
}

// ---- LIRE LE JOURNAL ----
//
// ⚠️ SANS PARAMETRE, ON REND LES CENT DERNIERS APPELS DE L ORGANISME. Avec
// `fiche`, seulement ceux d un contact : c est ce que l ecran demande pour
// afficher l historique sous une fiche.
export async function GET(req: NextRequest) {
  const c: any = await contexte();
  if (c.erreur) return NextResponse.json({ ok: false, erreur: c.erreur }, { status: c.code });

  const fiche = String(req.nextUrl.searchParams.get("fiche") || "").trim().toLowerCase();

  let q = supabase
    .from("crm_appels")
    .select("id, fiche_email, numero, sens, duree_min, resultat, notes, appele_le, saisi_par")
    .eq("tenant_id", c.tenant)
    .order("appele_le", { ascending: false });

  if (fiche) q = q.eq("fiche_email", fiche);

  const { data, error } = await q.limit(fiche ? 50 : 100);

  if (error) {
    console.error("[organisme/appels] GET : " + error.message);
    return NextResponse.json({ ok: false, erreur: "Lecture impossible." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, appels: data || [] });
}

// ---- ENREGISTRER OU SUPPRIMER UN APPEL ----
export async function POST(req: NextRequest) {
  const c: any = await contexte();
  if (c.erreur) return NextResponse.json({ ok: false, erreur: c.erreur }, { status: c.code });

  const body = await req.json().catch(function () { return null; });
  if (!body || !body.action) {
    return NextResponse.json({ ok: false, erreur: "Action manquante." }, { status: 400 });
  }

  if (body.action === "creer") {
    const fiche = String(body.fiche_email || "").trim().toLowerCase();
    if (!fiche || fiche.indexOf("@") < 1) {
      return NextResponse.json(
        { ok: false, erreur: "Fiche non précisée." },
        { status: 400 }
      );
    }

    const resultat = String(body.resultat || "").trim();
    if (RESULTATS.indexOf(resultat) < 0) {
      return NextResponse.json(
        { ok: false, erreur: "Indiquez comment l'appel s'est terminé." },
        { status: 400 }
      );
    }

    // ⚠️ LA DUREE EST FACULTATIVE ET BORNEE. Un appel qu on n a pas
    // chronometre ne doit pas empecher la saisie ; une valeur aberrante
    // fausserait les totaux le jour ou on en fera.
    let duree: number | null = null;
    if (body.duree_min !== undefined && body.duree_min !== null && body.duree_min !== "") {
      const n = parseInt(String(body.duree_min), 10);
      if (!isNaN(n) && n >= 0 && n <= 600) duree = n;
    }

    const { data, error } = await supabase
      .from("crm_appels")
      .insert({
        tenant_id: c.tenant,
        fiche_email: fiche,
        numero: String(body.numero || "").slice(0, 40) || null,
        sens: body.sens === "entrant" ? "entrant" : "sortant",
        duree_min: duree,
        resultat: resultat,
        notes: String(body.notes || "").slice(0, 2000) || null,
        saisi_par: c.email,
      })
      .select("id, fiche_email, numero, sens, duree_min, resultat, notes, appele_le, saisi_par")
      .maybeSingle();

    if (error) {
      console.error("[organisme/appels] creer : " + error.message);
      return NextResponse.json({ ok: false, erreur: "Enregistrement impossible." }, { status: 500 });
    }

    // 🚨 UN APPEL EST UNE INTERACTION. On repousse `derniere_interaction`
    // de la fiche : sans cela, un contact appele hier resterait dans
    // « jamais relances » et remonterait dans les rappels.
    // ⚠️ ON NE TOUCHE PAS A `relance_le`, qui porte les messages ecrits :
    // les deux canaux se comptent separement.
    await supabase
      .from("crm")
      .update({ derniere_interaction: new Date().toISOString() })
      .eq("tenant_id", c.tenant)
      .eq("email", fiche);

    return NextResponse.json({ ok: true, appel: data });
  }

  if (body.action === "supprimer") {
    const id = String(body.id || "");
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Appel non précisé." }, { status: 400 });
    }

    // ⚠️ ICI ON SUPPRIME REELLEMENT. Un appel saisi par erreur — mauvaise
    // fiche, doublon — n a aucune valeur d historique : le garder
    // desactive polluerait le journal sans rien apporter.
    const { error } = await supabase
      .from("crm_appels")
      .delete()
      .eq("id", id)
      .eq("tenant_id", c.tenant);

    if (error) {
      console.error("[organisme/appels] supprimer : " + error.message);
      return NextResponse.json({ ok: false, erreur: "Suppression impossible." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, erreur: "Action inconnue." }, { status: 400 });
}
