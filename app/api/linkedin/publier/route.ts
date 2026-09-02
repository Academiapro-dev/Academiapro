import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// LINKEDIN — PUBLIER SUR LA PAGE D UN PRODUIT — 02/09.
//
// POST { produit, texte, url?, titre? }
//   produit : academiapro | mrcomptable | mysterllc | hebrewpro
//   texte   : le corps du post, tel qu il s affichera
//   url     : facultatif — l article a partager (carte de lien sous le texte)
//   titre   : facultatif — titre de la carte de lien
//
// QUI PEUT APPELER : l administrateur en session, ou un appel serveur
// portant l en-tete x-cle-publication egal a LINKEDIN_CLE_PUBLICATION
// (pour les crons). Sans l un des deux : 403.
//
// 🚨 RIEN NE SE PUBLIE SANS LECTURE DE JACQUES. Cette route est un OUTIL :
// elle publie ce qu on lui donne, quand on le lui donne. Aucun cron ne
// l appelle aujourd hui. Le jour ou un cron l appellera, il ne devra
// envoyer que des textes deja relus.
//
// ⚠️ LA REPONSE DE LINKEDIN EST VIDE EN CAS DE SUCCES : l identifiant du
// post est dans l en-tete x-restli-id. Le lire dans le corps donnerait
// « echec » sur un post pourtant publie.
//
// ⚠️ LIMITES DU NIVEAU « DEVELOPMENT » : quelques centaines d appels par
// jour pour l application. Quatre pages, quelques posts par jour : sans
// effet ici.
// ---------------------------------------------------------------------------

const VERSION_LINKEDIN = "202607";
const ADMINS = ["contact@academiapro.fr"];
const PRODUITS = ["academiapro", "mrcomptable", "mysterllc", "hebrewpro"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function autorise(req: NextRequest): boolean {
  const session = sessionCourante();
  if (session && ADMINS.indexOf(session.email) >= 0) return true;
  const cle = process.env.LINKEDIN_CLE_PUBLICATION || "";
  const recue = req.headers.get("x-cle-publication") || "";
  return !!cle && recue === cle;
}

export async function POST(req: NextRequest) {
  if (!autorise(req)) {
    return NextResponse.json({ ok: false, erreur: "Acces refuse." }, { status: 403 });
  }

  const b = await req.json().catch(function () { return {}; });
  const produit = String(b.produit || "").trim().toLowerCase();
  const texte = String(b.texte || "").trim();
  const url = String(b.url || "").trim();
  const titre = String(b.titre || "").trim();

  if (PRODUITS.indexOf(produit) < 0) {
    return NextResponse.json({ ok: false, erreur: "Produit inconnu : " + produit }, { status: 400 });
  }
  if (!texte) {
    return NextResponse.json({ ok: false, erreur: "Le texte est vide." }, { status: 400 });
  }
  if (texte.length > 3000) {
    return NextResponse.json({ ok: false, erreur: "Texte trop long (3 000 caracteres maximum)." }, { status: 400 });
  }

  // ---- LA PAGE ----
  const { data: pageLi } = await supabase
    .from("linkedin_pages")
    .select("organisation_id, nom")
    .eq("produit", produit)
    .limit(1)
    .maybeSingle();

  if (!pageLi) {
    return NextResponse.json(
      { ok: false, erreur: "Aucune page LinkedIn rattachee au produit " + produit + " (table linkedin_pages, colonne produit)." },
      { status: 400 }
    );
  }

  // ---- LE JETON ----
  const { data: jeton } = await supabase
    .from("linkedin_jetons")
    .select("access_token, expire_le")
    .order("cree_le", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!jeton || !jeton.access_token) {
    return NextResponse.json(
      { ok: false, erreur: "Aucun jeton LinkedIn. Passez d'abord par /api/linkedin/connexion." },
      { status: 400 }
    );
  }
  if (new Date(jeton.expire_le).getTime() < Date.now()) {
    return NextResponse.json(
      { ok: false, erreur: "Jeton LinkedIn expire le " + String(jeton.expire_le).slice(0, 10) + ". Repassez par /api/linkedin/connexion." },
      { status: 400 }
    );
  }

  // ---- LE POST ----
  const auteur = "urn:li:organization:" + pageLi.organisation_id;
  const corps: any = {
    author: auteur,
    commentary: texte,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  if (url) {
    corps.content = { article: { source: url, title: titre || url } };
  }

  let statut = 0;
  let postUrn = "";
  let reponseTexte = "";

  try {
    const r = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + jeton.access_token,
        "LinkedIn-Version": VERSION_LINKEDIN,
        "X-Restli-Protocol-Version": "2.0.0",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(corps),
    });
    statut = r.status;
    postUrn = r.headers.get("x-restli-id") || "";
    reponseTexte = (await r.text()).slice(0, 500);
  } catch (e: any) {
    reponseTexte = String(e && e.message ? e.message : e);
  }

  await supabase.from("linkedin_publications").insert({
    produit: produit,
    organisation_id: pageLi.organisation_id,
    texte: texte,
    url: url || null,
    post_urn: postUrn || null,
    statut_http: statut || null,
    reponse: reponseTexte || null,
  });

  if (statut === 201 && postUrn) {
    return NextResponse.json({ ok: true, produit: produit, page: pageLi.nom, post: postUrn });
  }

  console.error("[linkedin/publier]", produit, statut, reponseTexte);
  return NextResponse.json(
    { ok: false, erreur: "LinkedIn a refuse la publication (HTTP " + statut + ").", detail: reponseTexte },
    { status: 502 }
  );
}
