import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMINS = ["contact@academiapro.fr"];

const FINANCEURS: any = {
  edof: "EDOF · Compte personnel de formation",
  opco: "OPCO",
  france_travail: "France Travail",
  region: "Conseil regional",
  entreprise: "Entreprise",
  autre: "Autre financeur",
};

// Circuit reel d un dossier, dans l ordre. La declaration de service fait
// est l etape que les organismes oublient : sans elle, aucun paiement.
const ETAPES: any = {
  a_deposer: "A deposer",
  depose: "Depose, en attente de decision",
  accorde: "Accorde",
  service_fait: "Service fait declare",
  regle: "Regle",
  refuse: "Refuse",
  annule: "Annule",
};

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

function tenantDe(req: NextRequest, session: any): string | null {
  if (session.tenantId) return session.tenantId;
  if (ADMINS.indexOf(session.email) >= 0) {
    return new URL(req.url).searchParams.get("tenant");
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const tenant = tenantDe(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("organisme_dossiers_financement")
      .select("*")
      .eq("tenant_id", tenant)
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const vivants = (data || []).filter(function (x: any) {
      return x.etape !== "refuse" && x.etape !== "annule";
    });

    const aDeposer = vivants.filter(function (x: any) { return x.etape === "a_deposer"; });
    const enAttente = vivants.filter(function (x: any) { return x.etape === "depose"; });

    // Ce qui bloque l argent, dans l ordre de gravite.
    const accordeSansServiceFait = vivants.filter(function (x: any) {
      return x.etape === "accorde" && !x.service_fait_le;
    });

    const serviceFaitNonRegle = vivants.filter(function (x: any) {
      return x.service_fait_le && !x.regle_le;
    });

    function somme(ensemble: any[], champ: string) {
      const t = ensemble.reduce(function (s: number, x: any) {
        return s + (Number(x[champ]) || 0);
      }, 0);
      return Math.round(t * 100) / 100;
    }

    const parFinanceur: any = {};
    for (const x of vivants) {
      const f = x.financeur || "autre";
      if (!parFinanceur[f]) parFinanceur[f] = { nombre: 0, demande: 0, accorde: 0, regle: 0 };
      parFinanceur[f].nombre = parFinanceur[f].nombre + 1;
      parFinanceur[f].demande = parFinanceur[f].demande + (Number(x.montant_demande) || 0);
      parFinanceur[f].accorde = parFinanceur[f].accorde + (Number(x.montant_accorde) || 0);
      if (x.regle_le) parFinanceur[f].regle = parFinanceur[f].regle + (Number(x.montant_accorde) || 0);
    }

    return NextResponse.json({
      ok: true,
      financeurs: FINANCEURS,
      etapes: ETAPES,
      total: (data || []).length,
      a_deposer: aDeposer.length,
      en_attente: enAttente.length,
      accorde_sans_service_fait: accordeSansServiceFait.length,
      accorde_sans_service_fait_montant: somme(accordeSansServiceFait, "montant_accorde"),
      service_fait_non_regle: serviceFaitNonRegle.length,
      service_fait_non_regle_montant: somme(serviceFaitNonRegle, "montant_accorde"),
      total_accorde: somme(vivants, "montant_accorde"),
      par_financeur: parFinanceur,
      dossiers: data || [],
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const tenant = tenantDe(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    const email = String(b.stagiaire_email || "").trim().toLowerCase();
    if (!email || email.indexOf("@") < 1) {
      return NextResponse.json({ ok: false, erreur: "Indiquez le stagiaire." }, { status: 400 });
    }

    const financeur = String(b.financeur || "edof").trim().toLowerCase();
    if (!FINANCEURS[financeur]) {
      return NextResponse.json({ ok: false, erreur: "Financeur inconnu." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("organisme_dossiers_financement")
      .insert({
        tenant_id: tenant,
        stagiaire_email: email,
        stagiaire_nom: b.stagiaire_nom ? String(b.stagiaire_nom).trim() : null,
        formation_code: b.formation_code ? String(b.formation_code).trim().toUpperCase() : null,
        financeur: financeur,
        reference_dossier: b.reference_dossier ? String(b.reference_dossier).trim() : null,
        montant_demande: b.montant_demande ? Number(b.montant_demande) : null,
        etape: "a_deposer",
      })
      .select("id")
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, dossier: (data || [])[0] || null });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const tenant = tenantDe(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const b = await req.json().catch(function () { return null; });
    if (!b || !b.id) {
      return NextResponse.json({ ok: false, erreur: "Identifiant manquant" }, { status: 400 });
    }

    const m: any = { updated_at: new Date().toISOString() };
    const aujourdhui = new Date().toISOString().slice(0, 10);

    for (const c of ["reference_dossier", "pieces_manquantes", "notes", "stagiaire_nom"]) {
      if (b[c] !== undefined) m[c] = b[c] ? String(b[c]).trim() : null;
    }

    if (b.montant_demande !== undefined) {
      m.montant_demande = b.montant_demande === null || b.montant_demande === "" ? null : Number(b.montant_demande);
    }
    if (b.montant_accorde !== undefined) {
      m.montant_accorde = b.montant_accorde === null || b.montant_accorde === "" ? null : Number(b.montant_accorde);
    }

    if (b.etape !== undefined) {
      const e = String(b.etape).trim().toLowerCase();
      if (!ETAPES[e]) {
        return NextResponse.json({ ok: false, erreur: "Etape inconnue." }, { status: 400 });
      }

      // Chaque avancee date son etape : c est ce qui permet de voir
      // ou un dossier s est arrete et depuis combien de temps.
      if (e === "depose") m.depose_le = b.depose_le || aujourdhui;
      if (e === "accorde" || e === "refuse") m.decision_le = b.decision_le || aujourdhui;
      if (e === "service_fait") m.service_fait_le = b.service_fait_le || aujourdhui;
      if (e === "regle") {
        m.regle_le = b.regle_le || aujourdhui;
        // On ne peut pas etre regle sans service fait : on le date au besoin.
        const { data: existant } = await supabase
          .from("organisme_dossiers_financement")
          .select("service_fait_le")
          .eq("id", b.id)
          .eq("tenant_id", tenant)
          .maybeSingle();
        if (existant && !existant.service_fait_le) m.service_fait_le = aujourdhui;
      }

      m.etape = e;
    }

    const { error } = await supabase
      .from("organisme_dossiers_financement")
      .update(m)
      .eq("id", b.id)
      .eq("tenant_id", tenant);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, modifie: b.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const tenant = tenantDe(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Identifiant manquant" }, { status: 400 });
    }

    const { error } = await supabase
      .from("organisme_dossiers_financement")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenant);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, supprime: id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
