import { NextRequest, NextResponse } from "next/server";

// SEQUENCE COMPLETE D ONBOARDING D UN CABINET CHEZ BC SOLUTIONS.
//
// CE QUE FAIT CETTE ROUTE. Elle deroule les dix etapes decrites par la
// documentation Partners API, de la creation du tenant jusqu au moment
// ou les bureaux deviennent creables. A chaque etape, elle note ce qui
// s est passe. Si une etape echoue, elle s arrete et rend le compte
// rendu complet : on voit exactement ou et pourquoi.
//
// ⚠️ ELLE CREE DES CHOSES CHEZ EUX. Ce n est pas une route de lecture.
// Elle est faite pour la SANDBOX. Le tenant cree porte un nom qui dit
// explicitement qu il s agit d un test, pour qu aucune facturation ne
// puisse etre declenchee par erreur.
//
// COMMENT L APPELER :
//   https://academiapro.fr/api/bcs/onboarding?secret=VOTRE_CRON_SECRET
//
// PARAMETRES OPTIONNELS :
//   &nom=Cabinet Test AcadeMIA    le nom du tenant a creer
//   &siren=123456789              le SIREN recherche dans l annuaire
//   &email=test@exemple.test      le courriel de l utilisateur principal
//
// 🚨 L ETAPE 6 EST LA PLUS DELICATE. La rotation du secret d un tenant
// ne le renvoie QU UNE SEULE FOIS. BC Solutions n en garde que
// l empreinte. Si le secret n est pas conserve a cet instant, il est
// perdu et il faut refaire une rotation. Ici, la route le RENVOIE dans
// sa reponse pour que Jacques le mette en lieu sur. Le jour ou cette
// sequence tournera pour de vrai, il faudra l ECRIRE EN BASE, chiffre,
// AVANT toute autre operation.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Etape = {
  numero: number;
  nom: string;
  resultat: string;
  code_http?: number;
  details?: any;
};

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

async function appel(
  jeton: string,
  methode: string,
  chemin: string,
  corps?: any
): Promise<{ ok: boolean; code: number; donnees: any; texte: string }> {
  const base = (process.env.BCS_API_URL || "").replace(/\/+$/, "");

  const options: any = {
    method: methode,
    headers: {
      "Authorization": "Bearer " + jeton,
      "Accept": "application/json",
    },
    cache: "no-store",
  };

  if (corps !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(corps);
  }

  const r = await fetch(base + chemin, options);
  const texte = await r.text();

  let donnees: any = null;
  try { donnees = JSON.parse(texte); } catch (e) { donnees = null; }

  return { ok: r.ok, code: r.status, donnees: donnees, texte: texte };
}

function attendre(ms: number): Promise<void> {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  const nom = req.nextUrl.searchParams.get("nom") || "Cabinet Test AcadeMIA";
  const siren = (req.nextUrl.searchParams.get("siren") || "123456789")
    .replace(/\D/g, "");
  const email = req.nextUrl.searchParams.get("email")
    || "test.academia@exemple.test";

  const etapes: Etape[] = [];
  let tenantSlug = "";
  let apiAccessId = "";
  let tenantClientId = "";
  let tenantClientSecret = "";
  let legalUnitId = "";

  function rendre(statut: number, extra?: any) {
    return NextResponse.json({
      resultat: statut === 200 ? "SUCCES" : "ARRET",
      tenantSlug: tenantSlug || null,
      legalUnitId: legalUnitId || null,
      identifiants_du_tenant: tenantClientId
        ? {
            client_id: tenantClientId,
            client_secret: tenantClientSecret || "non obtenu",
            avertissement: "Le secret n est renvoye qu une seule fois."
              + " Mettez-le en lieu sur immediatement.",
          }
        : null,
      etapes: etapes,
      ...(extra || {}),
    }, { status: statut });
  }

  // ETAPE 1 : le jeton.
  const auth = await obtenirJeton();
  if (!auth.jeton) {
    etapes.push({ numero: 1, nom: "Authentification",
      resultat: "ECHEC", details: auth.erreur });
    return rendre(500);
  }
  etapes.push({ numero: 1, nom: "Authentification", resultat: "OK" });
  const jeton = auth.jeton;

  // ETAPE 2 : creer le tenant. Il nait en draft.
  const creation = await appel(jeton, "POST", "/v1/tenants", {
    name: nom,
    organizationName: nom,
    principalUserFirstName: "Jacques",
    principalUserLastName: "Lalou",
    principalUserEmail: email,
    allowUiAccess: true,
    onboardingMode: "AUTO",
  });

  if (!creation.ok) {
    etapes.push({ numero: 2, nom: "Creation du tenant",
      resultat: "ECHEC", code_http: creation.code,
      details: creation.texte.slice(0, 800) });
    return rendre(500);
  }

  tenantSlug = (creation.donnees && creation.donnees.tenantSlug) || "";
  etapes.push({ numero: 2, nom: "Creation du tenant", resultat: "OK",
    code_http: creation.code,
    details: { tenantSlug: tenantSlug,
      status: creation.donnees && creation.donnees.status } });

  if (!tenantSlug) {
    return rendre(500, { arret: "aucun tenantSlug renvoye" });
  }

  // ETAPE 3 : lancer l approvisionnement.
  const provision = await appel(jeton, "POST",
    "/v1/tenants/" + tenantSlug + "/provision", {});

  etapes.push({ numero: 3, nom: "Approvisionnement",
    resultat: provision.ok ? "OK" : "ECHEC",
    code_http: provision.code,
    details: provision.ok ? undefined : provision.texte.slice(0, 800) });

  if (!provision.ok) return rendre(500);

  // ETAPE 4 : attendre que le tenant devienne actif.
  // L approvisionnement est asynchrone : on interroge jusqu a dix fois,
  // trois secondes entre chaque passage.
  let statutTenant = "";
  for (let i = 0; i < 10; i = i + 1) {
    await attendre(3000);
    const liste = await appel(jeton, "GET", "/v1/tenants?limit=50&offset=0");
    const items = (liste.donnees && liste.donnees.items) || [];
    const mien = items.find(function (t: any) {
      return t.tenantSlug === tenantSlug;
    });
    if (mien) {
      statutTenant = mien.status || "";
      if (statutTenant === "active") break;
    }
  }

  etapes.push({ numero: 4, nom: "Attente du statut actif",
    resultat: statutTenant === "active" ? "OK" : "ECHEC",
    details: { statut_obtenu: statutTenant || "inconnu" } });

  if (statutTenant !== "active") {
    return rendre(500, {
      arret: "le tenant n est pas devenu actif dans le temps imparti."
        + " Il peut le devenir plus tard : rappelez la route de test.",
    });
  }

  // ETAPE 5 : lire les identifiants d API du tenant.
  const acces = await appel(jeton, "GET",
    "/v1/tenants/" + tenantSlug + "/public-api-access");

  if (!acces.ok) {
    etapes.push({ numero: 5, nom: "Lecture des acces du tenant",
      resultat: "ECHEC", code_http: acces.code,
      details: acces.texte.slice(0, 800) });
    return rendre(500);
  }

  const d5: any = acces.donnees || {};
  apiAccessId = d5.id || d5.apiAccessId
    || (d5.items && d5.items[0] && d5.items[0].id) || "";
  tenantClientId = d5.clientId || d5.client_id
    || (d5.items && d5.items[0] && d5.items[0].clientId) || "";

  etapes.push({ numero: 5, nom: "Lecture des acces du tenant",
    resultat: "OK", code_http: acces.code,
    details: { apiAccessId: apiAccessId, client_id: tenantClientId } });

  // ETAPE 6 : faire tourner le secret du tenant.
  // 🚨 Le secret n est renvoye qu ici, une seule fois.
  if (apiAccessId) {
    const rotation = await appel(jeton, "POST",
      "/v1/tenants/" + tenantSlug + "/public-api-access/"
      + apiAccessId + "/rotate", {});

    if (rotation.ok) {
      const d6: any = rotation.donnees || {};
      tenantClientSecret = d6.clientSecret || d6.client_secret || "";
      if (!tenantClientId) {
        tenantClientId = d6.clientId || d6.client_id || tenantClientId;
      }
      etapes.push({ numero: 6, nom: "Rotation du secret du tenant",
        resultat: tenantClientSecret ? "OK" : "OK mais secret absent",
        code_http: rotation.code });
    } else {
      etapes.push({ numero: 6, nom: "Rotation du secret du tenant",
        resultat: "ECHEC", code_http: rotation.code,
        details: rotation.texte.slice(0, 800) });
    }
  } else {
    etapes.push({ numero: 6, nom: "Rotation du secret du tenant",
      resultat: "IGNOREE", details: "aucun apiAccessId trouve" });
  }

  // ETAPE 7 : chercher l entreprise dans l annuaire francais.
  const annuaire = await appel(jeton, "GET",
    "/v1/tenants/" + tenantSlug + "/directory/french?q=" + siren);

  etapes.push({ numero: 7, nom: "Recherche dans l annuaire francais",
    resultat: annuaire.ok ? "OK" : "ECHEC",
    code_http: annuaire.code,
    details: annuaire.ok
      ? annuaire.donnees
      : annuaire.texte.slice(0, 800) });

  // ETAPE 8 : creer l unite legale racine.
  const uniteLegale = await appel(jeton, "POST",
    "/v1/tenants/" + tenantSlug + "/legal-units", {
      countryCode: "FR",
      name: nom,
      siren: siren,
    });

  if (!uniteLegale.ok) {
    etapes.push({ numero: 8, nom: "Creation de l unite legale",
      resultat: "ECHEC", code_http: uniteLegale.code,
      details: uniteLegale.texte.slice(0, 800) });
    return rendre(500);
  }

  const d8: any = uniteLegale.donnees || {};
  legalUnitId = d8.id || d8.legalUnitId || "";

  etapes.push({ numero: 8, nom: "Creation de l unite legale",
    resultat: "OK", code_http: uniteLegale.code,
    details: { legalUnitId: legalUnitId } });

  if (!legalUnitId) {
    return rendre(500, { arret: "aucun legalUnitId renvoye" });
  }

  // ETAPE 9 : lancer l onboarding de l unite legale.
  const claim = await appel(jeton, "POST",
    "/v1/tenants/" + tenantSlug + "/legal-units/"
    + legalUnitId + "/claim", {});

  const d9: any = claim.donnees || {};
  const prochaineAction = d9.nextAction || "";

  etapes.push({ numero: 9, nom: "Lancement de l onboarding",
    resultat: claim.ok ? "OK" : "ECHEC",
    code_http: claim.code,
    details: claim.ok
      ? { nextAction: prochaineAction }
      : claim.texte.slice(0, 800) });

  if (!claim.ok) return rendre(500);

  // ETAPE 10 : approuver le KYB si la reponse le demande.
  if (prochaineAction === "approve_kyb") {
    const kyb = await appel(jeton, "POST",
      "/v1/tenants/" + tenantSlug + "/legal-units/"
      + legalUnitId + "/kyb/approve", {});

    etapes.push({ numero: 10, nom: "Approbation du KYB",
      resultat: kyb.ok ? "OK" : "ECHEC",
      code_http: kyb.code,
      details: kyb.ok ? undefined : kyb.texte.slice(0, 800) });
  } else {
    etapes.push({ numero: 10, nom: "Approbation du KYB",
      resultat: "NON DEMANDEE",
      details: { nextAction: prochaineAction || "aucune" } });
  }

  // ETAPE 11 : attendre que l onboarding soit actif.
  let statutOnboarding = "";
  let bureauxCreables = false;

  for (let i = 0; i < 10; i = i + 1) {
    await attendre(3000);
    const etat = await appel(jeton, "GET",
      "/v1/tenants/" + tenantSlug + "/legal-units/"
      + legalUnitId + "/onboarding/state");

    const d11: any = etat.donnees || {};
    statutOnboarding = d11.onboardingStatus || "";
    bureauxCreables = d11.canCreateOffices === true;

    if (statutOnboarding === "active" && bureauxCreables) break;
  }

  etapes.push({ numero: 11, nom: "Attente de l onboarding actif",
    resultat: (statutOnboarding === "active" && bureauxCreables)
      ? "OK" : "PAS ENCORE",
    details: { onboardingStatus: statutOnboarding || "inconnu",
      canCreateOffices: bureauxCreables } });

  return rendre(200, {
    message: (statutOnboarding === "active" && bureauxCreables)
      ? "Sequence complete : le cabinet est operationnel."
      : "Sequence deroulee. L onboarding n est pas encore actif :"
        + " il peut le devenir plus tard.",
  });
}
