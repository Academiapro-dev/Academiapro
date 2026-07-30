import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMINS = ["contact@academiapro.fr"];

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

// Un dossier de sous-traitance est complet au sens de l indicateur 27
// lorsque le contrat est signe, la competence verifiee AVANT, et la
// prestation evaluee APRES. C est ce dernier point que les organismes
// oublient systematiquement.
function complet(s: any): boolean {
  if (!s.contrat_signe) return false;
  if (!s.competence_verifiee || String(s.competence_verifiee).trim().length < 5) return false;
  if (!s.evaluation_prestation || String(s.evaluation_prestation).trim().length < 5) return false;
  return true;
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
      .from("organisme_soustraitance")
      .select("*")
      .eq("tenant_id", tenant)
      .order("prestataire", { ascending: true })
      .limit(500);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const liste = (data || []).map(function (s: any) {
      return { ...s, complet: complet(s) };
    });

    const actifs = liste.filter(function (s: any) { return s.actif; });

    return NextResponse.json({
      ok: true,
      total: liste.length,
      actifs: actifs.length,
      complets: actifs.filter(function (s: any) { return s.complet; }).length,
      sans_contrat: actifs.filter(function (s: any) { return !s.contrat_signe; }).length,
      sans_evaluation: actifs.filter(function (s: any) {
        return !s.evaluation_prestation || String(s.evaluation_prestation).trim().length < 5;
      }).length,
      prestataires: liste,
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

    const prestataire = String(b.prestataire || "").trim();
    const objet = String(b.objet_confie || "").trim();

    if (prestataire.length < 2 || objet.length < 5) {
      return NextResponse.json(
        { ok: false, erreur: "Indiquez le prestataire et ce que vous lui confiez." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("organisme_soustraitance")
      .insert({
        tenant_id: tenant,
        prestataire: prestataire,
        siret: b.siret ? String(b.siret).trim() : null,
        numero_da: b.numero_da ? String(b.numero_da).trim() : null,
        contact_email: b.contact_email ? String(b.contact_email).trim().toLowerCase() : null,
        objet_confie: objet,
        formations_concernees: b.formations_concernees ? String(b.formations_concernees).trim() : null,
        contrat_signe: b.contrat_signe === true,
        contrat_date: b.contrat_date || null,
        competence_verifiee: b.competence_verifiee ? String(b.competence_verifiee).trim() : null,
        qualiopi_prestataire: b.qualiopi_prestataire === true,
        notes: b.notes ? String(b.notes).trim() : null,
      })
      .select("id, prestataire")
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, prestataire: (data || [])[0] || null });
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

    const textes = [
      "prestataire", "siret", "numero_da", "contact_email",
      "objet_confie", "formations_concernees", "competence_verifiee",
      "evaluation_prestation", "notes",
    ];

    for (const c of textes) {
      if (b[c] !== undefined) m[c] = b[c] ? String(b[c]).trim() : null;
    }

    if (b.contrat_date !== undefined) m.contrat_date = b.contrat_date || null;
    if (b.contrat_signe !== undefined) m.contrat_signe = b.contrat_signe === true;
    if (b.qualiopi_prestataire !== undefined) m.qualiopi_prestataire = b.qualiopi_prestataire === true;
    if (b.actif !== undefined) m.actif = b.actif === true;

    // Une evaluation nouvelle est datee : l auditeur regarde si elle est recente.
    if (b.evaluation_prestation !== undefined && String(b.evaluation_prestation || "").trim().length >= 5) {
      m.evaluation_date = b.evaluation_date || new Date().toISOString().slice(0, 10);
    }

    const { error } = await supabase
      .from("organisme_soustraitance")
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
      .from("organisme_soustraitance")
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
