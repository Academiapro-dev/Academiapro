import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// LA MISE EN RELATION — 06/09.
//
// 🚨 CETTE ROUTE N EST PAS APPELEE PAR LE NAVIGATEUR. C est PLIVO qui la
// demande, au moment ou le collaborateur decroche son telephone. Elle lui
// repond en XML : « compose ce numero et mets les deux en relation ».
//
// ⚠️ ELLE NE PORTE AUCUNE SESSION ET N EN A PAS BESOIN. Plivo n a pas de
// cookie. Ce qui la protege, c est qu elle ne fait RIEN d autre que rendre
// un XML : elle ne lit ni n ecrit en base, et le numero qu elle compose
// vient de l adresse posee par /api/organisme/appeler — laquelle a deja
// verifie la session, le credit et le perimetre europeen.
//
// ⚠️ ELLE EST DONC SANS DANGER MEME SI QUELQU UN L APPELLE A LA MAIN : il
// obtiendrait un bout de XML, rien de plus. Aucun appel ne part d ici.
//
// 🚨 LE XML EST LA SEULE REPONSE QUE PLIVO COMPRENNE. Un JSON, meme
// correct, ferait raccrocher : l appel s ouvrirait et se fermerait aussitot
// sans que personne comprenne pourquoi.
// ══════════════════════════════════════════════════════════════════════════

function xml(contenu: string) {
  return new Response('<?xml version="1.0" encoding="UTF-8"?>' + contenu, {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

// ⚠️ LES CARACTERES INTERDITS EN XML DOIVENT ETRE ECHAPPES. Un numero ne
// devrait en contenir aucun, mais la valeur vient de l adresse : la
// supposer propre serait une porte ouverte.
function propre(t: string): string {
  return String(t || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(req: NextRequest) {
  const vers = String(req.nextUrl.searchParams.get("vers") || "").replace(/[^0-9]/g, "");

  if (!vers) {
    // Rien a composer : on raccroche proprement plutot que de laisser la
    // ligne ouverte au compteur.
    return xml("<Response><Hangup/></Response>");
  }

  // 🚨 `callerId` EST LE NUMERO DE L ORGANISME, transmis par la route
  // d appel. C est ce que verra la personne appelee — un numero inconnu
  // ne se rappelle pas.
  const depuis = String(req.nextUrl.searchParams.get("de") || "").replace(/[^0-9]/g, "");

  // ⚠️ `timeout` A TRENTE SECONDES, comme la premiere jambe. Au-dela on
  // abandonne : laisser sonner plus longtemps consomme sans rien apporter.
  return xml(
    "<Response>"
    + '<Dial timeout="30"'
    + (depuis ? ' callerId="' + propre(depuis) + '"' : "")
    + ">"
    + "<Number>" + propre(vers) + "</Number>"
    + "</Dial>"
    + "</Response>"
  );
}
