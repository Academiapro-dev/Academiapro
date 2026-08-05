import { NextResponse } from "next/server";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];

// Service d authentification TELEDEC (AWS Cognito), norme OAuth2, flow
// client_credentials. Le couple clientId / clientSecret est dans Vercel :
// TELEDEC_API = clientId, TELEDEC_MDP = clientSecret.
const URL_TOKEN = "https://auth.partners.teledec.fr/oauth2/token";

// Le token vaut une heure. On le garde en memoire du serveur et on le
// renouvelle une minute avant l echeance, pour ne pas tomber sur un 401
// en plein appel.
let jetonCache: { valeur: string; expireA: number } | null = null;
const MARGE = 60 * 1000;

export async function obtenirJeton(): Promise<string> {
  const maintenant = Date.now();
  if (jetonCache && jetonCache.expireA - MARGE > maintenant) {
    return jetonCache.valeur;
  }

  const id = process.env.TELEDEC_API || "";
  const secret = process.env.TELEDEC_MDP || "";
  if (!id || !secret) {
    throw new Error("TELEDEC_API ou TELEDEC_MDP absente des variables d environnement");
  }

  const basique = Buffer.from(id + ":" + secret).toString("base64");

  const corps = new URLSearchParams();
  corps.set("grant_type", "client_credentials");
  // Aucun scope demande : le token porte alors tous les droits accordes
  // au partenaire, ce qui est le plus simple pour demarrer.

  const r = await fetch(URL_TOKEN, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + basique,
    },
    body: corps.toString(),
    cache: "no-store",
  });

  const brut = await r.text();

  if (!r.ok) {
    throw new Error("TELEDEC a repondu " + r.status + " : " + brut.slice(0, 300));
  }

  let donnees: any = null;
  try {
    donnees = JSON.parse(brut);
  } catch (e) {
    throw new Error("Reponse illisible de TELEDEC : " + brut.slice(0, 200));
  }

  const jeton = donnees.access_token || "";
  if (!jeton) {
    throw new Error("Aucun access_token dans la reponse : " + brut.slice(0, 200));
  }

  const duree = Number(donnees.expires_in || 3600) * 1000;
  jetonCache = { valeur: jeton, expireA: maintenant + duree };

  return jeton;
}

// Un JWT porte ses informations dans sa partie centrale, encodee en base64.
// On la lit pour verifier les scopes reellement accordes, sans jamais
// renvoyer le jeton lui-meme.
function lireCharge(jeton: string): any {
  try {
    const parties = jeton.split(".");
    if (parties.length < 2) return null;
    const json = Buffer.from(parties[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export async function GET() {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    // On force un appel reel plutot que de rendre le cache : c est le but.
    jetonCache = null;
    const jeton = await obtenirJeton();
    const charge = lireCharge(jeton);

    return NextResponse.json({
      ok: true,
      message: "Connexion a TELEDEC etablie.",
      longueur_du_jeton: jeton.length,
      debut_du_jeton: jeton.slice(0, 12) + "...",
      scopes: charge && charge.scope ? charge.scope : "non lisible",
      client: charge && charge.client_id ? charge.client_id : "non lisible",
      emis_par: charge && charge.iss ? charge.iss : "non lisible",
      expire_dans_secondes:
        charge && charge.exp ? Math.max(0, charge.exp - Math.floor(Date.now() / 1000)) : null,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e.message || e) }, { status: 500 });
  }
}
