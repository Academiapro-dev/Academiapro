import { NextRequest, NextResponse } from "next/server";

// ETAT DES CABINETS CHEZ BC SOLUTIONS.
//
// CETTE ROUTE NE CREE RIEN ET NE MODIFIE RIEN. Elle lit et rend compte.
// C est sa raison d etre : la route d onboarding cree un cabinet a
// chaque appel, celle-ci permet de suivre l avancement sans en creer.
//
// CE QU ELLE MONTRE :
//   - la liste des cabinets rattaches au compte partenaire
//   - pour chacun, son statut
//   - si un legalUnitId est fourni, l etat de son onboarding
//
// COMMENT L APPELER :
//   https://academiapro.fr/api/bcs/etat?secret=VOTRE_CRON_SECRET
//
// POUR SUIVRE UN ONBOARDING PRECIS, ajouter les deux parametres :
//   &tenant=p-cabinettestdeux-bpe2mtf9r9
//   &unite=01a03e99-dac5-757b-a9e6-e87047f1547c

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function obtenirJeton(): Promise<{ jeton: string; erreur?: string }> {
  const authUrl = process.env.BCS_AUTH_URL || "";
  const clientId = process.env.BCS_CLIENT_ID || "";
  const clientSecret = process.env.BCS_CLIENT_SECRET || "";

  if (!authUrl || !clientId || !clientSecret) {
    return { jeton: "", erreur: "variables BCS absentes" };
  }

  const corps = new URLSearchParams();
  corps.set("grant_type", "client_credentials");
  corps.set("client_id", clientId);
  corps.set("client_secret", clientSecret);

  const r = await fetch(authUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: corps.toString(),
    cache: "no-store",
  });

  const texte = await r.text();
  if (!r.ok) {
    return { jeton: "", erreur: "HTTP " + r.status + " : " + texte.slice(0, 300) };
  }

  try {
    const d = JSON.parse(texte);
    if (!d.access_token) return { jeton: "", erreur: "aucun access_token" };
    return { jeton: d.access_token };
  } catch (e) {
    return { jeton: "", erreur: "reponse illisible" };
  }
}

async function lire(jeton: string, chemin: string) {
  const base = (process.env.BCS_API_URL || "").replace(/\/+$/, "");

  const r = await fetch(base + chemin, {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + jeton,
      "Accept": "application/json",
    },
    cache: "no-store",
  });

  const texte = await r.text();
  let donnees: any = null;
  try { donnees = JSON.parse(texte); } catch (e) { donnees = null; }

  return { ok: r.ok, code: r.status, donnees: donnees, texte: texte };
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  const auth = await obtenirJeton();
  if (!auth.jeton) {
    return NextResponse.json(
      { resultat: "ECHEC", etape: "authentification", raison: auth.erreur },
      { status: 500 });
  }
  const jeton = auth.jeton;

  // La liste des cabinets rattaches au compte partenaire.
  const liste = await lire(jeton, "/v1/tenants?limit=200&offset=0");

  if (!liste.ok) {
    return NextResponse.json({
      resultat: "ECHEC",
      etape: "liste des cabinets",
      code_http: liste.code,
      reponse: liste.texte.slice(0, 800),
    }, { status: 500 });
  }

  const items = (liste.donnees && liste.donnees.items) || [];
  const meta = (liste.donnees && liste.donnees.meta) || {};

  const cabinets = items.map(function (t: any) {
    return {
      tenantSlug: t.tenantSlug,
      nom: t.name,
      organisation: t.organizationName,
      statut: t.status,
      courriel_principal: t.principalUserEmail,
      cree_le: t.createdAt,
    };
  });

  // Si un onboarding precis est demande, on va lire son etat.
  const tenant = (req.nextUrl.searchParams.get("tenant") || "").trim();
  const unite = (req.nextUrl.searchParams.get("unite") || "").trim();

  let onboarding: any = null;

  if (tenant && unite) {
    const etat = await lire(jeton,
      "/v1/tenants/" + tenant + "/legal-units/" + unite
      + "/onboarding/state");

    if (etat.ok) {
      const d: any = etat.donnees || {};
      onboarding = {
        tenantSlug: tenant,
        legalUnitId: unite,
        onboardingStatus: d.onboardingStatus,
        canCreateOffices: d.canCreateOffices,
        nextAction: d.nextAction,
        pret: d.onboardingStatus === "active" && d.canCreateOffices === true,
        brut: d,
      };
    } else {
      onboarding = {
        tenantSlug: tenant,
        legalUnitId: unite,
        erreur: "HTTP " + etat.code,
        reponse: etat.texte.slice(0, 800),
      };
    }
  }

  return NextResponse.json({
    resultat: "SUCCES",
    nombre_de_cabinets: cabinets.length,
    total_annonce: meta.total,
    cabinets: cabinets,
    onboarding: onboarding,
    aide: onboarding
      ? undefined
      : "Pour suivre un onboarding, ajoutez &tenant=... et &unite=...",
  });
}
