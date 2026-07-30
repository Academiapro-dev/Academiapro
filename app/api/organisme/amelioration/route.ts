import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMINS = ["contact@academiapro.fr"];

const ORIGINES: any = {
  evaluation: "Evaluation d un stagiaire",
  reclamation: "Reclamation",
  veille: "Veille",
  audit: "Audit ou controle",
  formateur: "Retour d un formateur",
  interne: "Constat interne",
};

const STATUTS = ["a_engager", "en_cours", "close", "abandonnee"];

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
      .from("organisme_ameliorations")
      .select("*")
      .eq("tenant_id", tenant)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const toutes = data || [];
    const maintenant = Date.now();

    // Ce que l auditeur regarde vraiment : les boucles fermees, c est-a-dire
    // les actions closes AVEC un resultat observe. Une liste d actions
    // eternellement en cours prouve l inverse de ce qu elle veut montrer.
    const closes = toutes.filter(function (a: any) { return a.statut === "close"; });
    const bouclees = closes.filter(function (a: any) {
      return a.resultat_observe && a.resultat_observe.trim().length > 0;
    }).length;

    const enRetard = toutes.filter(function (a: any) {
      if (a.statut === "close" || a.statut === "abandonnee") return false;
      if (!a.echeance) return false;
      return new Date(a.echeance).getTime() < maintenant;
    }).length;

    const sansAction = toutes.filter(function (a: any) {
      return !a.action_decidee || a.action_decidee.trim().length === 0;
    }).length;

    const parOrigine: any = {};
    for (const a of toutes) {
      const o = a.origine || "interne";
      parOrigine[o] = (parOrigine[o] || 0) + 1;
    }

    return NextResponse.json({
      ok: true,
      origines: ORIGINES,
      statuts: STATUTS,
      total: toutes.length,
      closes: closes.length,
      bouclees: bouclees,
      en_retard: enRetard,
      sans_action: sansAction,
      par_origine: parOrigine,
      ameliorations: toutes,
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

    const constat = String(b.constat || "").trim();
    if (constat.length < 10) {
      return NextResponse.json(
        { ok: false, erreur: "Decrivez le constat en une phrase au moins." },
        { status: 400 }
      );
    }

    const origine = String(b.origine || "interne").trim().toLowerCase();
    if (!ORIGINES[origine]) {
      return NextResponse.json({ ok: false, erreur: "Origine inconnue." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("organisme_ameliorations")
      .insert({
        tenant_id: tenant,
        origine: origine,
        origine_reference: b.origine_reference ? String(b.origine_reference).trim() : null,
        constat: constat,
        action_decidee: b.action_decidee ? String(b.action_decidee).trim() : null,
        responsable: b.responsable ? String(b.responsable).trim() : null,
        echeance: b.echeance || null,
        statut: b.action_decidee ? "en_cours" : "a_engager",
      })
      .select("id")
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, amelioration: (data || [])[0] || null });
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

    for (const c of ["constat", "action_decidee", "responsable", "resultat_observe", "origine_reference"]) {
      if (b[c] !== undefined) m[c] = b[c] ? String(b[c]).trim() : null;
    }

    if (b.echeance !== undefined) m.echeance = b.echeance || null;

    if (b.statut !== undefined) {
      const s = String(b.statut || "").trim().toLowerCase();
      if (STATUTS.indexOf(s) < 0) {
        return NextResponse.json({ ok: false, erreur: "Statut inconnu." }, { status: 400 });
      }

      // On refuse de clore une action sans resultat observe : c est
      // exactement ce que l indicateur 32 exige de constater.
      if (s === "close") {
        const resultat = b.resultat_observe !== undefined
          ? String(b.resultat_observe || "").trim()
          : null;

        if (resultat === null || resultat.length < 5) {
          const { data: existante } = await supabase
            .from("organisme_ameliorations")
            .select("resultat_observe")
            .eq("id", b.id)
            .eq("tenant_id", tenant)
            .maybeSingle();

          const dejaLa = existante && existante.resultat_observe
            ? String(existante.resultat_observe).trim()
            : "";

          if (dejaLa.length < 5) {
            return NextResponse.json(
              {
                ok: false,
                erreur: "Pour clore une action, decrivez le resultat observe. C est ce que l auditeur verifie.",
              },
              { status: 400 }
            );
          }
        }
        m.cloture_le = new Date().toISOString();
      } else {
        m.cloture_le = null;
      }

      m.statut = s;
    }

    const { error } = await supabase
      .from("organisme_ameliorations")
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
      .from("organisme_ameliorations")
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
