import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// LINKEDIN — DEPART DE LA CONNEXION OAUTH — 02/09.
//
// Cette route se visite UNE FOIS, par Jacques, connecte comme administrateur
// sur academiapro.fr : elle l envoie chez LinkedIn, qui lui demande
// d autoriser l application « AcadeMIA Pro Pages » (259180094) a publier au
// nom de ses pages. LinkedIn le renvoie ensuite sur /api/linkedin/rappel
// avec un code, que cette derniere echange contre un jeton.
//
// ⚠️ L ADRESSE DE RETOUR DOIT ETRE EXACTEMENT CELLE DECLAREE DANS
// L APPLICATION (onglet Auth, « Authorized redirect URLs »). Un caractere
// d ecart et LinkedIn refuse sans expliquer.
//
// ⚠️ LES DROITS DEMANDES SONT CEUX DE COMMUNITY MANAGEMENT API :
//   - w_organization_social : publier au nom d une page
//   - r_organization_social : relire ce qui a ete publie
//   - rw_organization_admin : lister les pages dont le compte est admin
// Ils sont visibles dans l onglet Auth de l application ; un droit absent
// de cette liste ferait echouer la demande.
// ---------------------------------------------------------------------------

const ADMINS = ["contact@academiapro.fr"];
const RETOUR = "https://academiapro.fr/api/linkedin/rappel";
const DROITS = "w_organization_social r_organization_social rw_organization_admin";

export async function GET(req: NextRequest) {
  const session = sessionCourante();
  if (!session || ADMINS.indexOf(session.email) < 0) {
    return NextResponse.json({ ok: false, erreur: "Reserve a l'administrateur." }, { status: 403 });
  }

  const clientId = (process.env.LINKEDIN_CLIENT_ID || "").trim();
  if (!clientId) {
    return NextResponse.json({ ok: false, erreur: "LINKEDIN_CLIENT_ID absente." }, { status: 500 });
  }

  // L etat est un secret jetable : LinkedIn le renvoie tel quel, et la
  // route de rappel le compare au cookie. Sans lui, n importe quel lien
  // forge pourrait faire enregistrer un jeton etranger.
  const etat = crypto.randomBytes(16).toString("hex");

  const url = "https://www.linkedin.com/oauth/v2/authorization"
    + "?response_type=code"
    + "&client_id=" + encodeURIComponent(clientId)
    + "&redirect_uri=" + encodeURIComponent(RETOUR)
    + "&state=" + encodeURIComponent(etat)
    + "&scope=" + encodeURIComponent(DROITS);

  const reponse = NextResponse.redirect(url);
  reponse.cookies.set({
    name: "linkedin_etat",
    value: etat,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return reponse;
}
