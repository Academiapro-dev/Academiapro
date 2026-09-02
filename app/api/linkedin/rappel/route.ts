import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// LINKEDIN — RETOUR DE LA CONNEXION OAUTH — 02/09.
//
// LinkedIn renvoie ici avec ?code=...&state=... apres que Jacques a
// autorise l application. Dans l ordre :
//   1. verifier que l etat correspond au cookie pose au depart ;
//   2. echanger le code contre un jeton d acces (valable deux mois) ;
//   3. enregistrer le jeton dans linkedin_jetons — une seule ligne vivante ;
//   4. lister les pages dont le compte est administrateur et les ecrire
//      dans linkedin_pages, pour que Jacques y rattache chaque produit.
//
// 🚨 LE JETON N EST JAMAIS AFFICHE. Avec lui, n importe qui publierait au
// nom des quatre pages. Il ne vit qu en base ; la page de fin ne montre
// que sa date d expiration.
//
// ⚠️ LA VERSION D API EST OBLIGATOIRE SUR CHAQUE APPEL /rest/. LinkedIn
// en publie une par mois et retire chacune au bout d un an environ :
// 202607 vaut jusqu au 15 juillet 2027. Le jour ou les appels repondent
// 426, c est cette constante qu il faut avancer — ici et dans
// /api/linkedin/publier.
// ---------------------------------------------------------------------------

const VERSION_LINKEDIN = "202607";
const RETOUR = "https://academiapro.fr/api/linkedin/rappel";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function page(titre: string, corps: string, statut: number) {
  const html = "<!DOCTYPE html><html lang=\"fr\"><head><meta charset=\"utf-8\">"
    + "<title>" + titre + "</title></head>"
    + "<body style=\"font-family:Georgia,serif;background:#050508;color:#fff;padding:40px;max-width:640px;margin:0 auto;line-height:1.7\">"
    + "<h1 style=\"color:#c8a96e;font-size:22px\">" + titre + "</h1>" + corps + "</body></html>";
  return new NextResponse(html, { status: statut, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function echappe(t: string): string {
  return String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = String(url.searchParams.get("code") || "");
  const etat = String(url.searchParams.get("state") || "");
  const refus = String(url.searchParams.get("error") || "");

  if (refus) {
    return page("Autorisation refusée",
      "<p>LinkedIn a répondu : <strong>" + echappe(refus) + "</strong> — "
      + echappe(String(url.searchParams.get("error_description") || "")) + "</p>", 400);
  }

  const attendu = req.cookies.get("linkedin_etat")?.value || "";
  if (!code || !etat || !attendu || etat !== attendu) {
    return page("Lien invalide",
      "<p>L'état de la demande ne correspond pas. Recommencez depuis "
      + "<a href=\"/api/linkedin/connexion\" style=\"color:#c8a96e\">/api/linkedin/connexion</a>.</p>", 400);
  }

  const clientId = (process.env.LINKEDIN_CLIENT_ID || "").trim();
  const secret = (process.env.LINKEDIN_CLIENT_SECRET || "").trim();
  if (!clientId || !secret) {
    return page("Configuration incomplète",
      "<p>LINKEDIN_CLIENT_ID ou LINKEDIN_CLIENT_SECRET manque dans Vercel.</p>", 500);
  }

  // ---- 2. LE JETON ----
  const corps = new URLSearchParams({
    grant_type: "authorization_code",
    code: code,
    redirect_uri: RETOUR,
    client_id: clientId,
    client_secret: secret,
  });

  const rJeton = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: corps.toString(),
  });
  const jeton: any = await rJeton.json().catch(function () { return {}; });

  if (!rJeton.ok || !jeton.access_token) {
    console.error("[linkedin/rappel] jeton :", rJeton.status, JSON.stringify(jeton).slice(0, 300));
    return page("Échange du code refusé",
      "<p>LinkedIn n'a pas rendu de jeton (HTTP " + rJeton.status + ").</p>"
      + "<p>Réponse de LinkedIn : <code>" + echappe(JSON.stringify(jeton).slice(0, 300)) + "</code></p>"
      + "<p>Ce que le serveur lit dans Vercel : Client ID de <strong>" + clientId.length
      + "</strong> caractères, Client Secret de <strong>" + secret.length + "</strong> caractères "
      + "(0 = variable absente ou mal nommée, ou non cochée pour Production).</p>"
      + "<p><code>invalid_client</code> = Client ID ou Client Secret refusé dans Vercel ; "
      + "<code>invalid_redirect_uri</code> = adresse de retour différente de "
      + "<code>" + RETOUR + "</code> dans l'application.</p>", 502);
  }

  const maintenant = Date.now();
  const expireLe = new Date(maintenant + Number(jeton.expires_in || 0) * 1000).toISOString();
  const refreshExpireLe = jeton.refresh_token_expires_in
    ? new Date(maintenant + Number(jeton.refresh_token_expires_in) * 1000).toISOString()
    : null;

  // ---- 3. UNE SEULE LIGNE VIVANTE ----
  await supabase.from("linkedin_jetons").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { error: eJeton } = await supabase.from("linkedin_jetons").insert({
    access_token: jeton.access_token,
    expire_le: expireLe,
    refresh_token: jeton.refresh_token || null,
    refresh_expire_le: refreshExpireLe,
    scopes: jeton.scope || null,
  });
  if (eJeton) {
    console.error("[linkedin/rappel] enregistrement :", eJeton.message);
    return page("Enregistrement impossible", "<p>" + echappe(eJeton.message) + "</p>", 500);
  }

  // ---- 4. LES PAGES ADMINISTREES ----
  //
  // organizationAcls rend les roles du compte ; on ne garde que les
  // ADMINISTRATOR approuves. Le nom de chaque page est lu ensuite, un
  // appel par page — quatre pages, quatre appels, c est acceptable ici.
  const entetes = {
    Authorization: "Bearer " + jeton.access_token,
    "LinkedIn-Version": VERSION_LINKEDIN,
    "X-Restli-Protocol-Version": "2.0.0",
  };

  const lignes: string[] = [];
  let nbPages = 0;

  try {
    const rAcl = await fetch(
      "https://api.linkedin.com/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&count=50",
      { headers: entetes }
    );
    const acl: any = await rAcl.json().catch(function () { return {}; });

    if (!rAcl.ok) {
      lignes.push("<li>Lecture des pages refusée (HTTP " + rAcl.status + ") : "
        + echappe(JSON.stringify(acl).slice(0, 200)) + "</li>");
    } else {
      for (const e of acl.elements || []) {
        const urn = String(e.organization || "");
        const id = urn.split(":").pop() || "";
        if (!id) continue;

        let nom = "";
        try {
          const rOrg = await fetch("https://api.linkedin.com/rest/organizations/" + id, { headers: entetes });
          const org: any = await rOrg.json().catch(function () { return {}; });
          nom = String(org.localizedName || org.vanityName || "");
        } catch (e) {}

        await supabase.from("linkedin_pages").upsert(
          { organisation_id: id, nom: nom || null, mis_a_jour_le: new Date().toISOString() },
          { onConflict: "organisation_id" }
        );
        nbPages = nbPages + 1;
        lignes.push("<li><code>" + echappe(id) + "</code> — " + echappe(nom || "(nom non lu)") + "</li>");
      }
    }
  } catch (e: any) {
    lignes.push("<li>Lecture des pages impossible : " + echappe(String(e && e.message ? e.message : e)) + "</li>");
  }

  const reponse = page("Connexion LinkedIn enregistrée",
    "<p>Jeton valable jusqu'au <strong>" + echappe(expireLe.slice(0, 10)) + "</strong>"
    + (refreshExpireLe ? ", renouvelable jusqu'au " + echappe(refreshExpireLe.slice(0, 10)) : ", sans jeton de renouvellement")
    + ".</p>"
    + "<p>Pages administrées trouvées : <strong>" + nbPages + "</strong></p><ul>" + lignes.join("") + "</ul>"
    + "<p style=\"color:rgba(255,255,255,0.6)\">Étape suivante : dans Supabase, table <code>linkedin_pages</code>, "
    + "renseignez la colonne <code>produit</code> de chaque ligne "
    + "(academiapro, mrcomptable, mysterllc, hebrewpro).</p>", 200);
  reponse.cookies.set({ name: "linkedin_etat", value: "", path: "/", maxAge: 0 });
  return reponse;
}
