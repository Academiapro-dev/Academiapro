import { NextRequest, NextResponse } from "next/server";

// TEST DE LA CHAINE BC SOLUTIONS - SANDBOX.
//
// A QUOI SERT CETTE ROUTE. Elle fait, en deux gestes, ce que fera
// desormais tout appel vers BC Solutions :
//   1. demander un jeton au serveur d authentification (Keycloak)
//   2. presenter ce jeton a l API metier
// Si les deux reussissent, la chaine est prouvee de bout en bout.
//
// ELLE NE MODIFIE RIEN. Aucun tenant cree, aucune facture deposee.
// Elle lit, elle rend compte.
//
// COMMENT L APPELER :
//   https://academiapro.fr/api/bcs/test?secret=VOTRE_CRON_SECRET
//
// LE SECRET N EST JAMAIS RENVOYE. La reponse donne seulement la
// LONGUEUR de chaque variable : c est ce qui permet de reperer une
// valeur tronquee au collage, qui echouerait autrement en silence.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  const authUrl = process.env.BCS_AUTH_URL || "";
  const apiUrl = process.env.BCS_API_URL || "";
  const tenantApiUrl = process.env.BCS_TENANT_API_URL || "";
  const clientId = process.env.BCS_CLIENT_ID || "";
  const clientSecret = process.env.BCS_CLIENT_SECRET || "";

  // ETAPE 0 : les cinq variables sont-elles bien la ?
  const variables = {
    BCS_AUTH_URL: authUrl ? authUrl : "ABSENTE",
    BCS_API_URL: apiUrl ? apiUrl : "ABSENTE",
    BCS_TENANT_API_URL: tenantApiUrl ? tenantApiUrl : "ABSENTE",
    BCS_CLIENT_ID: clientId
      ? "presente, " + clientId.length + " caracteres" : "ABSENTE",
    BCS_CLIENT_SECRET: clientSecret
      ? "presente, " + clientSecret.length + " caracteres" : "ABSENTE",
  };

  const manquantes: string[] = [];
  if (!authUrl) manquantes.push("BCS_AUTH_URL");
  if (!apiUrl) manquantes.push("BCS_API_URL");
  if (!clientId) manquantes.push("BCS_CLIENT_ID");
  if (!clientSecret) manquantes.push("BCS_CLIENT_SECRET");

  if (manquantes.length > 0) {
    return NextResponse.json({
      etape: "0 - lecture des variables",
      resultat: "ECHEC",
      variables: variables,
      manquantes: manquantes,
      conseil: "Creez ces variables dans Vercel, puis REDEPLOYEZ A LA MAIN."
        + " Une variable ajoutee sans redeploiement n existe pas pour le code.",
    }, { status: 500 });
  }

  // ETAPE 1 : obtenir un jeton.
  // Le grant client_credentials est celui d une machine qui parle a une
  // autre machine : pas d utilisateur, pas de mot de passe personnel.
  let jeton = "";
  let jetonExpire = 0;

  try {
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
      return NextResponse.json({
        etape: "1 - demande du jeton",
        resultat: "ECHEC",
        code_http: r.status,
        reponse: texte.slice(0, 500),
        variables: variables,
        conseil: r.status === 401
          ? "Identifiants refuses : verifiez que le client_id et le"
            + " client_secret ne sont pas tronques au collage."
          : "Verifiez l adresse BCS_AUTH_URL.",
      }, { status: 500 });
    }

    let donnees: any = null;
    try {
      donnees = JSON.parse(texte);
    } catch (e) {
      return NextResponse.json({
        etape: "1 - demande du jeton",
        resultat: "ECHEC",
        raison: "reponse illisible",
        reponse: texte.slice(0, 500),
      }, { status: 500 });
    }

    jeton = donnees.access_token || "";
    jetonExpire = donnees.expires_in || 0;

    if (!jeton) {
      return NextResponse.json({
        etape: "1 - demande du jeton",
        resultat: "ECHEC",
        raison: "aucun access_token dans la reponse",
        cles_recues: Object.keys(donnees),
      }, { status: 500 });
    }
  } catch (e: any) {
    return NextResponse.json({
      etape: "1 - demande du jeton",
      resultat: "ECHEC",
      raison: String(e),
      variables: variables,
    }, { status: 500 });
  }

  // ETAPE 2 : presenter le jeton a l API metier.
  // GET /v1/tenants ne modifie rien : il liste les cabinets deja
  // rattaches au compte partenaire. Au premier appel, la liste est vide,
  // et c est le resultat attendu.
  try {
    const r = await fetch(apiUrl + "/v1/tenants?limit=50&offset=0", {
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

    if (!r.ok) {
      return NextResponse.json({
        etape: "2 - appel de l API metier",
        resultat: "ECHEC",
        code_http: r.status,
        reponse: texte.slice(0, 800),
        jeton_obtenu: true,
        jeton_valide_secondes: jetonExpire,
        conseil: r.status === 403
          ? "Jeton valide mais droits insuffisants sur cette route."
          : "Verifiez l adresse BCS_API_URL.",
      }, { status: 500 });
    }

    const items = (donnees && donnees.items) || [];
    const meta = (donnees && donnees.meta) || {};

    return NextResponse.json({
      resultat: "SUCCES",
      message: "La chaine fonctionne de bout en bout :"
        + " jeton obtenu, API metier joignable.",
      etape_1_jeton: {
        obtenu: true,
        longueur: jeton.length,
        valide_secondes: jetonExpire,
      },
      etape_2_api: {
        code_http: r.status,
        tenants_trouves: items.length,
        total_annonce: meta.total,
      },
      tenants: items.map(function (t: any) {
        return {
          tenantSlug: t.tenantSlug,
          name: t.name,
          organizationName: t.organizationName,
          status: t.status,
        };
      }),
      variables: variables,
    });
  } catch (e: any) {
    return NextResponse.json({
      etape: "2 - appel de l API metier",
      resultat: "ECHEC",
      raison: String(e),
      jeton_obtenu: true,
    }, { status: 500 });
  }
}
