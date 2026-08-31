import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ---------------------------------------------------------------------------
// PLUSIEURS SOCIETES PAR ORGANISME — 31/08.
//
// CE QUI CHANGE. Cette route listait « les » comptes etrangers du compte,
// tous melanges. Un gestionnaire qui suit plusieurs LLC aurait vu les
// comptes bancaires de toutes ses societes sur un meme ecran, sans savoir
// lequel appartient a qui — et la fiche 3916 aurait ete generee avec les
// comptes de tout le portefeuille.
//
// 🚨 L IDENTIFIANT D ENTITE VIENT DU NAVIGATEUR, ET C EST NORMAL : c est un
// choix dans une liste. Mais il n est JAMAIS une autorisation. Il est
// verifie contre le tenant de la session avant d etre ecrit, et toutes les
// lectures restent bornees par tenant_id.
//
// ⚠️ CE QUE CES LIGNES CONTIENNENT : des numeros de comptes bancaires
// etrangers. C est la donnee la plus sensible du module apres l identite du
// declarant. Aucun raccourci ici.
// ---------------------------------------------------------------------------

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
// sb_user, un cookie forge permettait de lire, d ajouter et de supprimer
// les comptes etrangers d un autre organisme.
function tenantDeLaSession(): string | null {
  const session = sessionCourante();
  return session ? session.tenantId : null;
}

// Verifie qu une entite appartient bien a l organisme de la session.
// Rend son identifiant, ou null si elle n existe pas / n est pas a lui.
//
// C EST LA FONCTION QUI REND L IDENTIFIANT RECU INOFFENSIF : le filtre
// tenant_id fait qu une societe d un autre gestionnaire ne correspond a
// aucune ligne.
async function entiteAutorisee(tenantId: string, entiteId: string): Promise<string | null> {
  if (!entiteId) return null;
  const { data } = await supabase
    .from("compliance_tenants")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id", entiteId)
    .maybeSingle();
  return data ? data.id : null;
}

// Liste des comptes d'un exercice, pour une societe donnee.
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

  try {
    const { searchParams } = new URL(req.url);
    const annee = Number(searchParams.get("year")) || new Date().getFullYear();
    const entiteDemandee = (searchParams.get("entite") || "").trim();

    let requete = supabase
      .from("compliance_comptes_etrangers")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("exercice", annee)
      .order("date_ouverture", { ascending: true })
      .limit(500);

    // Sans parametre, on rend les comptes de tout l organisme — c est
    // l ancien comportement, conserve pour ne casser aucun appel existant.
    let entiteId: string | null = null;
    if (entiteDemandee) {
      entiteId = await entiteAutorisee(tenantId, entiteDemandee);
      if (!entiteId) {
        return NextResponse.json({ error: "Societe introuvable." }, { status: 404 });
      }
      requete = requete.eq("entite_id", entiteId);
    }

    const { data, error } = await requete;

    if (error) {
      console.error("[comptes-etrangers] lecture :", error.message);
      return NextResponse.json({ error: "Lecture impossible." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      annee,
      tenant_id: tenantId,
      entite_id: entiteId,
      comptes: data ?? [],
    });
  } catch (e: unknown) {
    console.error("[comptes-etrangers] exception GET :",
      e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// Ajout d'un compte
export async function POST(req: NextRequest) {
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

  try {
    const body = await req.json();

    if (!body.designation) {
      return NextResponse.json({ error: "La designation est obligatoire" }, { status: 400 });
    }
    if (!body.organisme_nom) {
      return NextResponse.json({ error: "Le nom de l'organisme est obligatoire" }, { status: 400 });
    }

    // ---- LA SOCIETE DE RATTACHEMENT ----
    //
    // ⚠️ UN COMPTE SANS SOCIETE SERAIT ORPHELIN : il n apparaitrait sur
    // aucune fiche 3916, donc il ne serait jamais declare. Quand aucune
    // societe n est precisee et que l organisme n en a qu une, on la prend ;
    // au-dela, on exige le choix plutot que de deviner.
    let entiteId: string | null = null;
    const entiteDemandee = String(body.entite_id || "").trim();

    if (entiteDemandee) {
      entiteId = await entiteAutorisee(tenantId, entiteDemandee);
      if (!entiteId) {
        return NextResponse.json({ error: "Societe introuvable." }, { status: 404 });
      }
    } else {
      const { data: entites } = await supabase
        .from("compliance_tenants")
        .select("id")
        .eq("tenant_id", tenantId)
        .limit(2);

      if (entites && entites.length === 1) {
        entiteId = entites[0].id;
      } else if (entites && entites.length > 1) {
        return NextResponse.json(
          { error: "Precisez la societe a laquelle rattacher ce compte." },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: "Aucune societe enregistree." },
          { status: 400 }
        );
      }
    }

    const ligne = {
      tenant_id: tenantId,
      entite_id: entiteId,
      designation: body.designation,
      type_compte: body.type_compte || null,
      caractere: body.caractere || null,
      organisme_nom: body.organisme_nom,
      organisme_adresse: body.organisme_adresse || null,
      organisme_pays: body.organisme_pays || null,
      numero_compte: body.numero_compte || null,
      date_ouverture: body.date_ouverture || null,
      date_cloture: body.date_cloture || null,
      devise: body.devise || null,
      titulaire: body.titulaire || null,
      titulaire_precision: body.titulaire_precision || null,
      valide_par_fiscaliste: body.valide_par_fiscaliste === true,
      notes: body.notes || null,
      exercice: Number(body.exercice) || new Date().getFullYear(),
    };

    const { data, error } = await supabase
      .from("compliance_comptes_etrangers")
      .insert(ligne)
      .select()
      .single();

    if (error) {
      console.error("[comptes-etrangers] insertion :", error.message);
      return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
    }

    return NextResponse.json({ success: true, compte: data });
  } catch (e: unknown) {
    console.error("[comptes-etrangers] exception POST :",
      e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// Suppression d'un compte
export async function DELETE(req: NextRequest) {
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

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    // Le filtre tenant_id empeche de supprimer le compte d'un autre client.
    // Il reste la seule barriere necessaire : un identifiant appartenant a
    // un autre organisme ne correspond a aucune ligne.
    const { error } = await supabase
      .from("compliance_comptes_etrangers")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) {
      console.error("[comptes-etrangers] suppression :", error.message);
      return NextResponse.json({ error: "Suppression impossible." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    console.error("[comptes-etrangers] exception DELETE :",
      e instanceof Error ? e.message : String(e));
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
