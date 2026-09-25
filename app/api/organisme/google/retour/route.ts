import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// LE RETOUR DE GOOGLE — 14/09.
//
// Google renvoie ici avec un code a usage unique. On l echange contre un
// jeton d acces (une heure) et un jeton de rafraichissement (durable), et
// on les garde pour ce client.
//
// 🚨 L ETAT EST VERIFIE AVANT TOUT. Il porte le tenant et sa signature :
// sans ce controle, n importe qui pourrait rattacher son agenda au compte
// d un autre en fabriquant l adresse de retour.
//
// ⚠️ CETTE ROUTE N EXIGE PAS DE SESSION, et c est voulu : Google appelle
// le navigateur du client, pas notre application, et le cookie de session
// peut ne pas suivre. C est la signature de l etat qui tient lieu de
// preuve — pas la session.
//
// ⚠️ SI GOOGLE NE REND PAS DE refresh_token, on refuse la connexion et on
// le dit. Un compte sans jeton durable cesse de fonctionner au bout d une
// heure, et le client ne comprendrait pas pourquoi.
//
// 🆕 25/09 — LES DEUX JETONS SONT CHIFFRES AVANT D ETRE ENREGISTRES (voir
// cleJetons plus bas). La route evenement les dechiffre au moment de s en
// servir. ⛔ Sans cle de chiffrement, rien n est enregistre.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function sceau(charge: string): string {
  return crypto.createHmac("sha256", process.env.SESSION_SECRET || "").update(charge).digest("hex");
}

// ---- 🆕 25/09 — LES JETONS GOOGLE SONT CHIFFRES ----
//
// La politique de confidentialite de Mr CRM le dit, et Google l a relue :
// « les jetons d acces delivres par Google sont conserves chiffres ».
// Jusqu au 25/09, c etait FAUX : ils etaient ecrits en clair dans
// organisme_google. Desormais : AES-256-GCM, comme les mots de passe
// net-entreprises de la DSN.
//   · la cle vient de GOOGLE_CLE_CHIFFREMENT, a defaut de
//     DSN_CLE_CHIFFREMENT (deja presente dans Vercel) ; elle est passee
//     dans SHA-256 pour donner toujours 32 octets, quel que soit son format ;
//   · forme stockee : « g1:<iv>:<marque>:<chiffre> », en base 64 ;
//   · un jeton SANS le prefixe « g1: » est un ancien jeton en clair, ecrit
//     avant le 25/09 : il est lu tel quel, puis rechiffre au premier usage.
// ⛔ SI LA CLE MANQUE, ON N ECRIT RIEN EN CLAIR : on refuse.
// ⛔ SI LA CLE EST PERDUE, les jetons deviennent illisibles : chaque client
// devra reconnecter son agenda (rien d autre n est perdu).
function cleJetons(): Buffer | null {
  const brut = (process.env.GOOGLE_CLE_CHIFFREMENT || process.env.DSN_CLE_CHIFFREMENT || "").trim();
  if (!brut) return null;
  return crypto.createHash("sha256").update(brut).digest();
}

function chiffrerJeton(clair: string | null | undefined): string | null {
  if (!clair) return null;
  const cle = cleJetons();
  if (!cle) return null;
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", cle, iv);
  const chiffre = Buffer.concat([c.update(String(clair), "utf8"), c.final()]);
  const marque = c.getAuthTag();
  return "g1:" + iv.toString("base64") + ":" + marque.toString("base64") + ":" + chiffre.toString("base64");
}

function page(titre: string, texte: string, ok: boolean): NextResponse {
  const html = "<!doctype html><html lang=fr><head><meta charset=utf-8>"
    + "<meta name=viewport content='width=device-width,initial-scale=1'>"
    + "<title>" + titre + "</title></head>"
    + "<body style=\"background:#050508;color:#fff;font-family:Georgia,serif;display:flex;"
    + "align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px\">"
    + "<div style='max-width:460px;text-align:center'>"
    + "<h1 style='color:" + (ok ? "#4caf50" : "#e8836a") + ";font-size:24px;margin:0 0 12px'>" + titre + "</h1>"
    + "<p style='color:rgba(255,255,255,0.6);font-size:15px;line-height:1.75;margin:0 0 24px'>" + texte + "</p>"
    + "<a href='/organisme/agenda' style=\"display:inline-block;background:#c8a96e;color:#050508;"
    + "padding:13px 26px;border-radius:8px;text-decoration:none;font-weight:bold\">Revenir à mon espace</a>"
    + "</div></body></html>";
  return new NextResponse(html, { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const erreur = url.searchParams.get("error");
  if (erreur) {
    return page("Connexion refusée", "Vous avez refusé l'accès, ou Google l'a interrompu (" + erreur + "). Rien n'a été enregistré.", false);
  }

  const code = String(url.searchParams.get("code") || "");
  const etat = String(url.searchParams.get("state") || "");
  if (!code || !etat) return page("Retour incomplet", "Google n'a pas renvoyé les éléments attendus. Recommencez la connexion.", false);

  const morceaux = etat.split("|");
  if (morceaux.length !== 3) return page("Retour invalide", "Le jeton de sécurité est illisible. Recommencez la connexion.", false);
  const tenant = morceaux[0];
  const charge = morceaux[0] + "|" + morceaux[1];
  if (sceau(charge) !== morceaux[2]) {
    return page("Retour refusé", "Le jeton de sécurité ne correspond pas. Par précaution, rien n'a été enregistré.", false);
  }
  // ⚠️ UNE AUTORISATION VIEILLE DE PLUS D UNE HEURE N EST PLUS ACCEPTEE.
  if (Date.now() - (Number(morceaux[1]) || 0) > 3600000) {
    return page("Demande expirée", "Cette demande de connexion a plus d'une heure. Recommencez depuis votre espace.", false);
  }

  const id = (process.env.GOOGLE_CLIENT_ID || "").trim();
  const secret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();
  const retour = (process.env.GOOGLE_REDIRECT_URI || "").trim();
  if (!id || !secret || !retour) return page("Configuration incomplète", "La connexion à Google n'est pas configurée sur ce serveur.", false);

  let jetons: any = null;
  try {
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code, client_id: id, client_secret: secret,
        redirect_uri: retour, grant_type: "authorization_code",
      }).toString(),
    });
    jetons = await r.json();
    if (!r.ok) {
      return page("Échange refusé", "Google a refusé l'échange (" + (jetons && jetons.error_description ? jetons.error_description : r.status) + ").", false);
    }
  } catch (e: any) {
    return page("Échange impossible", "Le serveur n'a pas pu joindre Google : " + String(e), false);
  }

  if (!jetons.refresh_token) {
    return page(
      "Connexion incomplète",
      "Google n'a pas fourni d'autorisation durable. Retirez l'accès de Mr CRM dans votre compte Google (Sécurité, applications tierces), puis recommencez.",
      false
    );
  }

  // L adresse du compte connecte, pour que le client sache QUEL agenda il
  // a relie. ⚠️ Sans elle, un client a deux comptes Google ne sait plus
  // lequel il a autorise.
  let compte = "";
  try {
    const ru = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: "Bearer " + jetons.access_token },
    });
    const du = await ru.json();
    compte = (du && du.email) || "";
  } catch (e) { compte = ""; }

  const expire = new Date(Date.now() + ((Number(jetons.expires_in) || 3600) - 60) * 1000).toISOString();

  // 🆕 25/09 — CHIFFRES AVANT D ETRE GARDES. Sans cle, on refuse : un jeton
  // en clair dans la base, c est l agenda du client a la portee de quiconque
  // lirait la table.
  const accesChiffre = chiffrerJeton(jetons.access_token);
  const durableChiffre = chiffrerJeton(jetons.refresh_token);
  if (!accesChiffre || !durableChiffre) {
    return page(
      "Configuration incomplète",
      "La clé de chiffrement des jetons est absente de ce serveur. Par précaution, rien n'a été enregistré.",
      false
    );
  }

  const { error } = await supabase.from("organisme_google").upsert({
    tenant_id: tenant,
    email: compte || null,
    access_token: accesChiffre,
    refresh_token: durableChiffre,
    expire_le: expire,
    calendar_id: "primary",
    actif: true,
    connecte_le: new Date().toISOString(),
    maj_le: new Date().toISOString(),
  }, { onConflict: "tenant_id" });

  if (error) return page("Enregistrement impossible", error.message, false);

  return page(
    "Agenda connecté",
    "Vos rendez-vous pris depuis le CRM apparaîtront dans l'agenda de " + (compte || "votre compte Google") + ".",
    true
  );
}
