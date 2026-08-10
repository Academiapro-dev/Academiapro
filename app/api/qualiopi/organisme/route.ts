import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// L organisme vient desormais du JETON SIGNE, et non plus du cookie sb_user
// qui n etait qu un objet JSON encode : n importe qui pouvait le forger et
// lire les donnees Qualiopi d un autre organisme.
function societeDeSession() {
  const session = sessionCourante();
  if (!session || !session.tenantId) return null;
  return { tenantId: session.tenantId, email: session.email };
}

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    global: {
      fetch: function (u: any, o: any) {
        return fetch(u, { ...(o || {}), cache: "no-store" });
      },
    },
  });
}

// Un champ vide arrive comme chaine vide depuis un formulaire. L enregistrer
// tel quel remplirait la base de chaines vides indiscernables d une valeur
// saisie : on le ramene a l absence de valeur.
function texte(v: any): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).replace(/[\u0000-\u001F\u007F]/g, "").trim();
  return t.length > 0 ? t.slice(0, 300) : null;
}

function nombre(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return isNaN(n) || n < 0 ? null : Math.round(n);
}

export async function GET() {
  const session = societeDeSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, erreur: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  const supabase = client();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, erreur: "Variables Supabase absentes" },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("qualiopi_organisme")
    .select("*")
    .eq("tenant_id", session.tenantId)
    .limit(1);

  if (error) {
    return NextResponse.json(
      { ok: false, erreur: "Lecture qualiopi_organisme: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    existe: (data || []).length > 0,
    organisme: (data || [])[0] || null,
  });
}

export async function POST(req: NextRequest) {
  const session = societeDeSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, erreur: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  const supabase = client();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, erreur: "Variables Supabase absentes" },
      { status: 500 }
    );
  }

  let corps: any = {};
  try {
    corps = await req.json();
  } catch (e) {
    return NextResponse.json(
      { ok: false, erreur: "Corps de requete illisible" },
      { status: 400 }
    );
  }

  const auMoinsUneAction =
    corps.action_formation === true ||
    corps.action_apprentissage === true ||
    corps.action_vae === true ||
    corps.action_bilan === true;

  if (!auMoinsUneAction) {
    return NextResponse.json(
      {
        ok: false,
        erreur:
          "Selectionnez au moins un type d'action : formation continue, apprentissage, VAE ou bilan de competences.",
      },
      { status: 400 }
    );
  }

  // LA FICHE ADMINISTRATIVE COMPTE AUTANT QUE LES CATEGORIES D ACTION.
  //
  // Sans SIRET ni adresse, aucune facture reguliere n est possible. Sans
  // representant legal, aucun document du referentiel ne peut porter de
  // signature — or il en reclame plusieurs.
  const fiche = {
    tenant_id: session.tenantId,
    raison_sociale: texte(corps.raison_sociale),
    numero_da: texte(corps.numero_da),
    date_declaration: corps.date_declaration || null,

    siret: texte(corps.siret),
    numero_tva: texte(corps.numero_tva),
    forme_juridique: texte(corps.forme_juridique),
    adresse: texte(corps.adresse),
    code_postal: texte(corps.code_postal),
    ville: texte(corps.ville),
    pays: texte(corps.pays) || "FR",
    telephone: texte(corps.telephone),
    email_contact: texte(corps.email_contact),
    site_web: texte(corps.site_web),
    representant_nom: texte(corps.representant_nom),
    representant_qualite: texte(corps.representant_qualite),
    effectif: nombre(corps.effectif),

    action_formation: corps.action_formation === true,
    action_apprentissage: corps.action_apprentissage === true,
    action_vae: corps.action_vae === true,
    action_bilan: corps.action_bilan === true,
    formations_certifiantes: corps.formations_certifiantes === true,
    recours_sous_traitance: corps.recours_sous_traitance === true,
    afest: corps.afest === true,
    date_audit_prevue: corps.date_audit_prevue || null,
    certificateur: texte(corps.certificateur),
    notes: corps.notes ? String(corps.notes).slice(0, 4000) : null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("qualiopi_organisme")
    .upsert(fiche, { onConflict: "tenant_id" })
    .select()
    .limit(1);

  if (error) {
    return NextResponse.json(
      { ok: false, erreur: "Ecriture qualiopi_organisme: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    organisme: (data || [])[0] || null,
  });
}
