import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function origineLegitime(req: NextRequest): boolean {
  const origine = req.headers.get("origin") || "";
  const referent = req.headers.get("referer") || "";
  return (
    origine.includes("academiapro.fr") || referent.includes("academiapro.fr") ||
    origine.includes("vercel.app") || referent.includes("vercel.app") ||
    origine.includes("localhost") || referent.includes("localhost")
  );
}

// L organisme vient du JETON SIGNE session_academia. Avec l ancien cookie
// sb_user, un cookie forge donnait acces au coffre complet d un autre
// organisme, avec des URL de telechargement valables une heure.
function tenantDeLaSession(): string | null {
  const session = sessionCourante();
  return session ? session.tenantId : null;
}

// ---------------------------------------------------------------------------
// 🚨 PLUSIEURS ENTITES PAR ORGANISME — 31/08.
//
// LE DEFAUT QUI AURAIT CASSE EN PREMIER. Cette route lisait le profil avec
// un `.single()` sur tenant_id. Tant qu un organisme n avait qu une societe,
// cela fonctionnait. A la SECONDE, `.single()` echoue — PostgREST refuse de
// choisir — et le tableau de bord serait tombe en erreur, sans que rien
// n indique pourquoi.
//
// Les echeances et les documents avaient un defaut moins visible mais pire :
// filtres sur le seul tenant_id, ils auraient MELANGE les obligations de
// toutes les societes du portefeuille. Un gestionnaire aurait vu les trois
// cents echeances de ses clients sur une seule page, sans savoir laquelle
// appartient a qui.
//
// LA CORRECTION : la route accepte `?entite=<id>` et filtre sur entite_id.
//
// ⚠️ L IDENTIFIANT VIENT DE LA REQUETE, ET C EST NORMAL — c est un choix
// dans une liste. Mais il est VERIFIE contre le tenant de la session avant
// tout usage : une entite d un autre organisme est refusee. C est
// exactement le defaut trouve le meme jour dans f5472 et f3916, ou le
// tenant etait pris dans le corps sans verification.
//
// ⚠️ COMPATIBILITE : sans parametre, la route prend la premiere entite de
// l organisme. L usage actuel — un client, une societe — continue donc de
// fonctionner a l identique, sans changer une ligne dans les ecrans
// existants.
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const tenantId = tenantDeLaSession();
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  const journal: string[] = [];
  const entiteDemandee = (req.nextUrl.searchParams.get("entite") || "").trim();

  try {
    // ---- L ENTITE A AFFICHER ----
    //
    // La requete est TOUJOURS bornee au tenant de la session. Un identifiant
    // appartenant a un autre organisme ne correspond donc a aucune ligne et
    // rend simplement « entite introuvable » : rien ne fuit.
    let requeteEntite = supabase
      .from("compliance_tenants")
      .select("id, label, legal_name, wy_filing_id, member_residence, "
        + "has_us_source_income, formation_state, formation_date, anniversary_month, "
        + "fr_tax_resident, registered_agent_name")
      .eq("tenant_id", tenantId);

    if (entiteDemandee) {
      requeteEntite = requeteEntite.eq("id", entiteDemandee);
    }

    // limit(1) + maybeSingle() plutot que single() : sans parametre, un
    // organisme qui a plusieurs societes doit rendre la premiere, pas une
    // erreur.
    const { data: tenant, error: eTenant } = await requeteEntite
      .order("label", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (eTenant) {
      console.error("[compliance/dashboard] lecture entite :", eTenant.message);
      return NextResponse.json({ error: "Lecture impossible." }, { status: 500 });
    }

    if (!tenant) {
      return NextResponse.json(
        {
          error: entiteDemandee
            ? "Societe introuvable."
            : "Aucune societe enregistree. Ajoutez-en une depuis le portefeuille.",
        },
        { status: 404 }
      );
    }

    const entiteId = tenant.id;

    // ---- ECHEANCES DE CETTE ENTITE ----
    //
    // Le double filtre tenant_id + entite_id est volontaire : le premier
    // borne a l organisme, le second a la societe choisie. Garder les deux
    // protege meme si un entite_id venait a etre mal renseigne en base.
    const { data: deadlinesRaw, error: eDead } = await supabase
      .from("compliance_deadlines")
      .select("id, rule_code, period_label, due_date, status, amount_due, currency")
      .eq("tenant_id", tenantId)
      .eq("entite_id", entiteId)
      .order("due_date", { ascending: true })
      .limit(500);

    if (eDead) {
      journal.push("Lecture echeances : " + eDead.message);
    }

    // Titres des regles (catalogue commun a tous les tenants)
    const { data: rules } = await supabase
      .from("compliance_rules")
      .select("code, title, jurisdiction, channel")
      .limit(500);
    const titreMap: Record<string, any> = {};
    for (const r of rules || []) {
      titreMap[r.code] = r;
    }
    const deadlines = (deadlinesRaw || []).map((d: any) => ({
      ...d,
      title: titreMap[d.rule_code]?.title || d.rule_code,
      jurisdiction: titreMap[d.rule_code]?.jurisdiction || "",
      channel: titreMap[d.rule_code]?.channel || "",
    }));

    // ---- COFFRE DE CETTE ENTITE ----
    const { data: docsRaw, error: eDocs } = await supabase
      .from("compliance_documents")
      .select("id, doc_type, title, version, storage_path, uploaded_at")
      .eq("tenant_id", tenantId)
      .eq("entite_id", entiteId)
      .order("uploaded_at", { ascending: false })
      .limit(200);

    if (eDocs) {
      journal.push("Lecture documents : " + eDocs.message);
    }

    const nbLus = (docsRaw || []).length;

    const docs = [];
    for (const doc of docsRaw || []) {
      const p = (doc.storage_path || "").replace(/^compliance-docs\//, "");
      let url = null;
      try {
        const { data: signed, error: eSign } = await supabase.storage
          .from("compliance-docs")
          .createSignedUrl(p, 3600);
        url = signed?.signedUrl || null;
        if (eSign) {
          journal.push("URL signee KO pour " + doc.title + " : " + eSign.message);
        }
      } catch (e: unknown) {
        journal.push(
          "URL signee exception pour " + doc.title + " : " +
          (e instanceof Error ? e.message : String(e))
        );
      }
      docs.push({ ...doc, download_url: url });
    }

    // Le nombre total d entites permet a l ecran de savoir s il doit
    // proposer un retour au portefeuille : inutile quand il n y en a qu une.
    const { count: nbEntites } = await supabase
      .from("compliance_tenants")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      entite_id: entiteId,
      nb_entites: nbEntites === null || nbEntites === undefined ? 1 : nbEntites,
      tenant,
      deadlines,
      documents: docs,
      diagnostic: {
        nb_documents_lus: nbLus,
        nb_documents_renvoyes: docs.length,
        avertissements: journal,
      },
    });
  } catch (e: any) {
    console.error("[compliance/dashboard] exception :", String(e && e.message ? e.message : e));
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
