import { NextResponse } from "next/server";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMINS = ["contact@academiapro.fr"];

// L ETAT DE SESSION POUR LA BARRE DE NAVIGATION — ajout du 01/09.
//
// La barre affichait « Se connecter » et « Demarrer » a tout le monde, y
// compris en pleine session : elle n avait aucun moyen de savoir qui la
// regardait. Cette route ne rend QUE le strict necessaire — connecte ou
// non, administrateur ou non. Ni l adresse, ni le tenant : la barre n en a
// pas besoin, et une route publique ne doit rien dire de plus que ce que
// son lecteur doit savoir.
//
// 10/10 — DEUX CHOSES DE PLUS, POUR QUE L ECRAN DISE QUI EST CONNECTE.
// Constate a l essai : apres avoir signe avec le compte d une cliente,
// rien ne disait a l ecran quelle adresse etait connectee, et la cliente
// voyait le menu d un cabinet. La route rend donc aussi :
//   - email   : l adresse de celui qui regarde, a lui-meme et a lui seul
//               (elle vient de son propre jeton de session) ;
//   - cabinet : vrai si son compte porte un organisme, faux sinon (une
//               personne qui n a de compte que pour signer un document).
// Sans session, rien de plus qu avant.
export async function GET() {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: true, connecte: false, admin: false });
    }
    return NextResponse.json({
      ok: true,
      connecte: true,
      admin: ADMINS.indexOf(session.email) >= 0,
      email: session.email,
      cabinet: !!session.tenantId,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: true, connecte: false, admin: false });
  }
}
