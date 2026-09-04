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
//   produit : le code d une ligne de `linkedin_pages`
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
// jour pour l application. Quelques pages, quelques posts par jour : sans
// effet ici.
// ---------------------------------------------------------------------------

const VERSION_LINKEDIN = "202607";
const ADMINS = ["contact@academiapro.fr"];

// ══════════════════════════════════════════════════════════════════════════
// 🚨 LA LISTE DES PRODUITS N EST PLUS ECRITE ICI — 04/09.
//
// LE DEFAUT, ET IL ETAIT SILENCIEUX. Un tableau en dur portait les quatre
// produits d origine. La page Mr LMS a ete creee sur LinkedIn, inseree dans
// `linkedin_pages`, et elle n apparaissait NULLE PART : ni dans le choix de
// l ecran, ni comme produit accepte par cette route. Ajouter une page en
// base ne servait a rien, et rien ne le signalait.
//
// C est la regle de la maison prise en defaut : UN CONTENU AFFICHE NE
// S ECRIT PAS DANS LE CODE, IL SE LIT EN BASE. La table `linkedin_pages`
// EST la liste des pages ; il n y a pas de seconde liste a tenir a jour.
//
// ⚠️ NE PAS REINTRODUIRE DE TABLEAU EN DUR. Pour ajouter une page :
//   insert into linkedin_pages (organisation_id, nom, produit, mis_a_jour_le)
//   values ('<id LinkedIn>', '<nom>', '<code>', now());
// et elle apparait, sans qu une ligne de code change.
//
// ⚠️ LE CONTROLE DU PRODUIT SE FAIT PAR LA LECTURE DE LA PAGE, plus bas :
// un produit sans ligne en base est refuse la, avec un message clair.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function autorise(req: NextRequest): boolean {
  const session = sessionCourante();
  if (session && ADMINS.indexOf(session.email) >= 0) return true;
  const cle = (process.env.LINKEDIN_CLE_PUBLICATION || "").trim();
  const recue = req.headers.get("x-cle-publication") || "";
  return !!cle && recue === cle;
}

// GET — les pages disponibles et les vingt dernieres publications.
//
// ⚠️ LES PAGES SONT RENVOYEES ICI, ET L ECRAN LES AFFICHE TELLES QUELLES.
// C est ce qui garantit qu une page ajoutee en base apparait aussitot, sans
// qu on touche au code.
export async function GET(req: NextRequest) {
  if (!autorise(req)) {
    return NextResponse.json({ ok: false, erreur: "Acces refuse." }, { status: 403 });
  }

  const { data: pages } = await supabase
    .from("linkedin_pages")
    .select("produit, nom")
    .order("nom", { ascending: true })
    .limit(100);

  const { data } = await supabase
    .from("linkedin_publications")
    .select("id, produit, texte, url, post_urn, statut_http, publie_le")
    .order("publie_le", { ascending: false })
    .limit(20);

  return NextResponse.json({
    ok: true,
    pages: pages || [],
    publications: data || [],
  });
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

  if (!produit) {
    return NextResponse.json({ ok: false, erreur: "Aucune page choisie." }, { status: 400 });
  }
  if (!texte) {
    return NextResponse.json({ ok: false, erreur: "Le texte est vide." }, { status: 400 });
  }
  if (texte.length > 3000) {
    return NextResponse.json({ ok: false, erreur: "Texte trop long (3 000 caracteres maximum)." }, { status: 400 });
  }

  // ---- LA PAGE ----
  // C est cette lecture qui valide le produit : un code sans ligne en base
  // est refuse ici, avec un message qui dit quoi faire.
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
  //
  // ⚠️ UN JETON NE CONNAIT QUE LES PAGES EXISTANTES AU MOMENT DE SON
  // EMISSION. Une page creee apres coup sera refusee par LinkedIn avec un
  // 403, meme si elle figure en base : il faut repasser par
  // /api/linkedin/connexion pour emettre un jeton qui la porte.
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

  // 🚨 UN 403 SUR UNE PAGE RECENTE VIENT PRESQUE TOUJOURS DU JETON, pas de
  // la page. Le message le dit, sinon on cherche du cote de la page pendant
  // que la cause est ailleurs.
  const indice = statut === 403
    ? " Si cette page a ete creee apres l emission du jeton, repassez par /api/linkedin/connexion pour en emettre un qui la porte."
    : "";

  console.error("[linkedin/publier]", produit, statut, reponseTexte);
  return NextResponse.json(
    {
      ok: false,
      erreur: "LinkedIn a refuse la publication (HTTP " + statut + ")." + indice,
      detail: reponseTexte,
    },
    { status: 502 }
  );
}
