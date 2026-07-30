import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// L organisme vient du JETON SIGNE. L ancien cookie sb_user n etait qu un objet
// JSON encode : n importe qui pouvait le forger avec l identifiant d un autre
// organisme et lire, voire modifier, ses reponses Qualiopi.
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

const CERTIFIANT = [3, 7, 16];
const SOUS_TRAITANCE = [27];
const AFEST = [13, 28];

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

  const { data: orgs, error: errOrg } = await supabase
    .from("qualiopi_organisme")
    .select("*")
    .eq("tenant_id", session.tenantId)
    .limit(1);

  if (errOrg) {
    return NextResponse.json(
      { ok: false, erreur: "Lecture qualiopi_organisme: " + errOrg.message },
      { status: 500 }
    );
  }
  if (!orgs || orgs.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        erreur: "Profil non renseigne",
        profil_manquant: true,
      },
      { status: 404 }
    );
  }
  const org = orgs[0];

  const { data: criteres, error: errCrit } = await supabase
    .from("qualiopi_criteres")
    .select("*")
    .order("ordre")
    .limit(20);

  if (errCrit) {
    return NextResponse.json(
      { ok: false, erreur: "Lecture qualiopi_criteres: " + errCrit.message },
      { status: 500 }
    );
  }

  const { data: indicateurs, error: errInd } = await supabase
    .from("qualiopi_indicateurs")
    .select("*")
    .order("ordre")
    .limit(100);

  if (errInd) {
    return NextResponse.json(
      { ok: false, erreur: "Lecture qualiopi_indicateurs: " + errInd.message },
      { status: 500 }
    );
  }

  const { data: avancement, error: errAv } = await supabase
    .from("qualiopi_avancement")
    .select("*")
    .eq("tenant_id", session.tenantId)
    .limit(100);

  if (errAv) {
    return NextResponse.json(
      { ok: false, erreur: "Lecture qualiopi_avancement: " + errAv.message },
      { status: 500 }
    );
  }

  const { data: preuves, error: errPr } = await supabase
    .from("qualiopi_preuves")
    .select("indicateur_id")
    .eq("tenant_id", session.tenantId)
    .limit(500);

  if (errPr) {
    return NextResponse.json(
      { ok: false, erreur: "Lecture qualiopi_preuves: " + errPr.message },
      { status: 500 }
    );
  }

  const parIndicateur: Record<string, any> = {};
  (avancement || []).forEach((a: any) => {
    parIndicateur[a.indicateur_id] = a;
  });

  const nbPreuves: Record<string, number> = {};
  (preuves || []).forEach((p: any) => {
    nbPreuves[p.indicateur_id] = (nbPreuves[p.indicateur_id] || 0) + 1;
  });

  const applicable = (ind: any): boolean => {
    const n = ind.numero;

    if (CERTIFIANT.indexOf(n) >= 0) {
      return org.formations_certifiantes === true;
    }
    if (SOUS_TRAITANCE.indexOf(n) >= 0) {
      return org.recours_sous_traitance === true;
    }
    if (AFEST.indexOf(n) >= 0) {
      return org.afest === true || org.action_apprentissage === true;
    }

    if (org.action_formation === true && ind.obligatoire_of === true) return true;
    if (org.action_apprentissage === true && ind.obligatoire_cfa === true) return true;
    if (org.action_vae === true && ind.obligatoire_vae === true) return true;
    if (org.action_bilan === true && ind.obligatoire_bilan === true) return true;

    return false;
  };

  const groupes = (criteres || []).map((c: any) => {
    const liste = (indicateurs || [])
      .filter((i: any) => i.critere_id === c.id)
      .filter(applicable)
      .map((i: any) => {
        const av = parIndicateur[i.id];
        return {
          id: i.id,
          numero: i.numero,
          intitule: i.intitule,
          statut: av ? av.statut : "non_commence",
          commentaire: av ? av.commentaire : null,
          date_revue: av ? av.date_revue : null,
          nb_preuves: nbPreuves[i.id] || 0,
        };
      });

    return {
      numero: c.numero,
      intitule: c.intitule,
      indicateurs: liste,
    };
  });

  const tous = groupes.reduce(
    (acc: any[], g: any) => acc.concat(g.indicateurs),
    []
  );

  const compte = {
    total: tous.length,
    conforme: tous.filter((i: any) => i.statut === "conforme").length,
    a_verifier: tous.filter((i: any) => i.statut === "a_verifier").length,
    en_cours: tous.filter((i: any) => i.statut === "en_cours").length,
    non_commence: tous.filter((i: any) => i.statut === "non_commence").length,
    non_applicable: tous.filter((i: any) => i.statut === "non_applicable").length,
  };

  return NextResponse.json({
    ok: true,
    organisme: {
      raison_sociale: org.raison_sociale,
      numero_da: org.numero_da,
      date_audit_prevue: org.date_audit_prevue,
      certificateur: org.certificateur,
    },
    compte,
    groupes: groupes.filter((g: any) => g.indicateurs.length > 0),
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

  if (!corps.indicateur_id) {
    return NextResponse.json(
      { ok: false, erreur: "indicateur_id manquant" },
      { status: 400 }
    );
  }

  const statutsValides = [
    "non_commence",
    "en_cours",
    "a_verifier",
    "conforme",
    "non_applicable",
  ];
  if (corps.statut && statutsValides.indexOf(corps.statut) < 0) {
    return NextResponse.json(
      { ok: false, erreur: "Statut invalide : " + corps.statut },
      { status: 400 }
    );
  }

  const ligne: any = {
    tenant_id: session.tenantId,
    indicateur_id: corps.indicateur_id,
    updated_at: new Date().toISOString(),
  };
  if (corps.statut) ligne.statut = corps.statut;
  if (corps.commentaire !== undefined) ligne.commentaire = corps.commentaire;
  if (corps.date_revue !== undefined) ligne.date_revue = corps.date_revue || null;

  const { data, error } = await supabase
    .from("qualiopi_avancement")
    .upsert(ligne, { onConflict: "tenant_id,indicateur_id" })
    .select()
    .limit(1);

  if (error) {
    return NextResponse.json(
      { ok: false, erreur: "Ecriture qualiopi_avancement: " + error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, avancement: (data || [])[0] || null });
}
