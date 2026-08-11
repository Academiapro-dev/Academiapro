import { NextResponse } from "next/server";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const ADMINS = ["contact@academiapro.fr"];

// LE BAC A SABLE, PAS LA PRODUCTION.
//
// Plaid expose trois environnements. Sandbox travaille sur des banques
// fictives et des identifiants d essai : aucun compte reel n est touche,
// rien n est facture. Le passage en production demandera un autre domaine
// et d autres identifiants — et une conversation tarifaire avec Plaid.
const PLAID = "https://sandbox.plaid.com";

// Ce que Mr. Comptable demande a la banque du client : la liste de ses
// comptes, et le detail de ses ecritures. Rien d autre.
const PRODUITS = ["transactions"];

export async function GET() {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const clientId = process.env.PLAID_CLIENT_ID || "";
    const secret = process.env.PLAID_SECRET || "";

    if (!clientId || !secret) {
      return NextResponse.json({
        ok: false,
        erreur: "PLAID_CLIENT_ID ou PLAID_SECRET absente des variables Vercel",
      }, { status: 500 });
    }

    // PREMIER APPEL : fabriquer un jeton de liaison.
    //
    // C est ce jeton qui ouvrira, cote client, la fenetre de connexion a sa
    // banque. S il revient, la chaine d authentification tient : identifiants
    // reconnus, produits autorises, pays couvert.
    const r = await fetch(PLAID + "/link/token/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        secret: secret,
        client_name: "Mr. Comptable",
        language: "fr",
        country_codes: ["FR"],
        products: PRODUITS,
        user: { client_user_id: "essai-" + Date.now() },
      }),
    });

    const reponse = await r.json();

    if (!r.ok) {
      return NextResponse.json({
        ok: false,
        etape: "link/token/create",
        code: r.status,
        erreur: reponse.error_message || reponse.error_code || "reponse illisible",
        detail: reponse.display_message || null,
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: "Les identifiants Plaid fonctionnent. Le jeton de liaison est cree.",
      environnement: "sandbox",
      pays: "FR",
      produits: PRODUITS,
      expire_le: reponse.expiration || null,
      // Le jeton lui-meme n est pas renvoye entier : il ouvre une fenetre de
      // connexion bancaire, il n a pas a trainer dans un navigateur.
      jeton_recu: !!reponse.link_token,
      request_id: reponse.request_id || null,
    });

  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
