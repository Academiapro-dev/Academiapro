import { NextRequest, NextResponse } from "next/server";
import { NOM_COOKIE_SESSION } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// LA DECONNEXION — 02/09.
//
// CONSTATE EN TEST REEL SUR MYSTERLLC : aucun bouton, aucune route ne
// permettait de quitter la session. Un gestionnaire qui voulait verifier
// le parcours d un client restait connecte malgre lui, et la session
// survivait a tout — y compris a un changement d hote (mysterllc.com et
// www.mysterllc.com portent chacun leur cookie).
//
// CE QUE FAIT CETTE ROUTE : elle efface le cookie de session sur l hote
// qui la sert, puis renvoie a la racine de ce meme hote — la vitrine.
// Le cookie n a pas d attribut domain (voir /api/auth/valider) : il est
// donc efface la ou il a ete pose, ni plus ni moins.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const reponse = NextResponse.redirect(new URL("/", req.url));
  reponse.cookies.set({
    name: NOM_COOKIE_SESSION,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return reponse;
}
