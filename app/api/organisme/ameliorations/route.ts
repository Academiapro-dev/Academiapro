import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// LE REGISTRE D AMELIORATION CONTINUE — 09/09 (Mr LMS, indicateur 32).
//
// CE QUI MANQUAIT. Les evaluations (indicateur 30) et les reclamations
// (31) existaient. Mais RIEN NE GARDAIT TRACE DE CE QUE L ORGANISME EN
// FAIT : l indicateur 32 demande de prouver que les retours ont produit des
// decisions, et un auditeur veut lire la liste.
//
// CE QUE FAIT CETTE ROUTE : une ligne par decision, avec ce qui l a
// declenchee (une evaluation, une reclamation, un audit, autre), le
// constat, la decision, qui s en charge, pour quand, et ou on en est.
//
// 🚨 CLOISONNEMENT PAR TENANT, comme partout : le tenant vient de la
// session, jamais du corps. L administrateur peut lire un tenant par
// ?tenant=, comme dans les autres routes organisme.
//
// ⚠️ ON N EFFACE PAS UNE DECISION : un registre qui perd des lignes ne
// prouve plus rien. Une decision abandonnee passe au statut « abandonne »,
// avec la raison dans `commentaire`.
// ══════════════════════════════════════════════════════════════════════════

const ADMINS = ["contact@academiapro.fr"];
const SOURCES = ["evaluation", "reclamation", "audit", "autre"];
const STATUTS = ["a_faire", "en_cours", "fait", "abandonne"];

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

function texte(v: any, max: number): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return t ? t.slice(0, max) : null;
}

function dateOuNull(v: any): string | null {
  const t = String(v || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    const tenant = tenantDe(req, session);
    if (!tenant) return NextResponse.json({ ok: false, erreur: "Aucun organisme rattache a votre compte." }, { status: 403 });

    const { data, error } = await supabase
      .from("organisme_ameliorations")
      .select("*")
      .eq("tenant_id", tenant)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });

    const liste = data || [];
    return NextResponse.json({
      ok: true,
      sources: SOURCES,
      statuts: STATUTS,
      total: liste.length,
      ouvertes: liste.filter(function (a: any) { return a.statut === "a_faire" || a.statut === "en_cours"; }).length,
      ameliorations: liste,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    if (session.role === "stagiaire") {
      return NextResponse.json({ ok: false, erreur: "Seul votre organisme enregistre ses decisions." }, { status: 403 });
    }
    const tenant = tenantDe(req, session);
    if (!tenant) return NextResponse.json({ ok: false, erreur: "Aucun organisme rattache a votre compte." }, { status: 403 });

    const b = await req.json().catch(function () { return null; });
    if (!b) return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });

    const source = String(b.source || "autre").trim().toLowerCase();
    if (SOURCES.indexOf(source) < 0) return NextResponse.json({ ok: false, erreur: "Source inconnue." }, { status: 400 });

    const constat = texte(b.constat, 2000);
    const decision = texte(b.decision, 2000);
    if (!constat || !decision) {
      return NextResponse.json({ ok: false, erreur: "Le constat et la decision sont obligatoires." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("organisme_ameliorations")
      .insert({
        tenant_id: tenant,
        source: source,
        reference: texte(b.reference, 200),
        formation_code: texte(b.formation_code, 40) ? String(b.formation_code).trim().toUpperCase() : null,
        constat: constat,
        decision: decision,
        responsable: texte(b.responsable, 200),
        echeance: dateOuNull(b.echeance),
        statut: "a_faire",
        cree_par: session.email,
      })
      .select("id")
      .maybeSingle();

    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data ? data.id : null });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    const tenant = tenantDe(req, session);
    if (!tenant) return NextResponse.json({ ok: false, erreur: "Aucun organisme rattache a votre compte." }, { status: 403 });

    const b = await req.json().catch(function () { return null; });
    if (!b || !b.id) return NextResponse.json({ ok: false, erreur: "Identifiant manquant" }, { status: 400 });

    const modifications: any = {};
    if (b.statut !== undefined) {
      const s = String(b.statut || "").trim().toLowerCase();
      if (STATUTS.indexOf(s) < 0) return NextResponse.json({ ok: false, erreur: "Statut inconnu." }, { status: 400 });
      modifications.statut = s;
      modifications.fait_le = s === "fait" ? new Date().toISOString() : null;
    }
    if (b.commentaire !== undefined) modifications.commentaire = texte(b.commentaire, 2000);
    if (b.responsable !== undefined) modifications.responsable = texte(b.responsable, 200);
    if (b.echeance !== undefined) modifications.echeance = dateOuNull(b.echeance);

    if (Object.keys(modifications).length === 0) {
      return NextResponse.json({ ok: false, erreur: "Rien a modifier." }, { status: 400 });
    }

    const { error } = await supabase
      .from("organisme_ameliorations")
      .update(modifications)
      .eq("id", b.id)
      .eq("tenant_id", tenant);

    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, modifie: b.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
