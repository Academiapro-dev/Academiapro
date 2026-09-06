import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";

// ---------------------------------------------------------------------------
// ARTICLE DU BLOG MYSTERLLC — 01/09.
//
// Ne sert QUE les articles de marque « mysterllc » : un slug d une autre
// marque renvoie 404 ici. C est ce filtre qui garantit qu aucun contenu
// d une autre marque n apparaisse sur ce domaine.
//
// 🆕 TROIS CORRECTIONS LE 04/09.
//
// 1. AUCUN EN-TETE, AUCUN MENU. Un article est souvent la premiere page vue
//    par quelqu un venu d une recherche. Il lisait, et ne pouvait aller
//    nulle part : ni voir les fonctions, ni ecrire. Le site n avait
//    d ailleurs qu une seule page jusqu a ce jour.
//
// 2. LE BOUTON OUVRAIT UN `mailto:`. Sur un appareil sans messagerie
//    configuree, un lien mailto NE FAIT RIEN DU TOUT : le lecteur clique,
//    rien ne se passe, il repart. Il pointe desormais sur
//    app/mysterllc/contact/page.tsx, un vrai formulaire.
//    ⛔ NE JAMAIS REMETTRE DE `mailto:` COMME SEUL MOYEN DE CONTACT.
//
// 3. `SITE` VALAIT « https://mysterllc.com », SANS www, alors que le
//    domaine redirige vers www. La canonique designait donc une adresse qui
//    repond par une redirection, ce que Search Console refuse d indexer.
//
// ⚠️ POUR QUE LA BARRE DE TRAVAIL NE S AFFICHE PAS par-dessus l en-tete de
// cette page, /blog figure dans PAGES_PUBLIQUES_MYSTERLLC de
// components/NavBar.tsx — le test par prefixe couvre /blog/<slug>.
//
// 🚨 LES DEUX DEFAUTS CORRIGES LE 26/08 SUR MR. COMPTABLE SONT REPRIS ICI,
// et il ne faut pas les reintroduire :
//
// 1. LA LIGNE « --- » DOIT ETRE TRAITEE. Elle n est ni vide, ni un titre,
//    ni une puce : sans branche dediee, elle rejoint le paragraphe en cours
//    et s affiche telle quelle.
//
// 2. LES PUCES CONSECUTIVES SE REGROUPENT EN UNE VRAIE LISTE. Sans ce
//    regroupement, chaque puce reste un paragraphe isole et un bloc de
//    liens ne se distingue plus du texte.
//
// ⚠️ LE CACHE. revalidate = 3600 : un article modifie en base ne change
// qu au bout d une heure, ou apres un redeploiement. Ne jamais conclure
// qu un contenu ne s affiche pas sans avoir tenu compte de ce delai.
//
// ⚠️ AUCUNE DEPENDANCE MARKDOWN AJOUTEE. La conversion est volontairement
// minimale — titres, gras, italique, listes, liens, separateurs. Suffisant
// pour des articles ecrits a la main, et rien a maintenir.
// ---------------------------------------------------------------------------

export const revalidate = 3600;

const OR = "#c8a96e";
const OR_PALE = "rgba(200,169,110,0.75)";
const NOIR = "#050508";
const SITE = "https://www.mysterllc.com";
const LEGAL = "https://academiapro.fr";

// ⚠️ VERIFIER LE NOM REEL AVANT DE LE CHANGER : le fichier s appelle
// IMG_4723.jpeg, il n a pas ete renomme.
const BANNIERE = "/IMG_4723.jpeg";

const SECTION: any = {
  maxWidth: "1000px",
  margin: "0 auto",
  padding: "0 24px",
};

const LIEN_ENTETE: any = {
  color: "rgba(255,255,255,0.75)",
  textDecoration: "none",
  fontSize: "14px",
  whiteSpace: "nowrap",
};

function clientLecture() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");
}

async function lireArticle(slug: string) {
  const supabase = clientLecture();
  const { data } = await supabase
    .from("blog")
    .select("id, titre, slug, extrait, contenu, categorie, created_at")
    .eq("publie", true)
    .eq("marque", "mysterllc")
    .eq("slug", slug)
    .limit(1);
  return (data && data[0]) || null;
}

export async function generateMetadata({ params }: any) {
  const p = await params;
  const article = await lireArticle(p.slug);
  if (!article) {
    return { title: "Article introuvable — MysterLLC" };
  }
  return {
    title: article.titre + " — MysterLLC",
    description: article.extrait || "",
    alternates: {
      canonical: SITE + "/blog/" + article.slug,
    },
    // Les balises sociales doivent parler de MysterLLC : sans elles, celles
    // du layout racine annonceraient AcadéMIA Pro sur un article destiné aux
    // gestionnaires de sociétés américaines.
    openGraph: {
      title: article.titre,
      description: article.extrait || "",
      url: SITE + "/blog/" + article.slug,
      siteName: "MysterLLC",
      locale: "fr_FR",
      type: "article",
    },
  };
}

// Conversion markdown minimale : titres, gras, listes, paragraphes,
// separateurs. Aucune dependance ajoutee pour cela.
function enBlocs(contenu: string) {
  const lignes = (contenu || "").split("\n");
  const blocs: any[] = [];
  let paragraphe: string[] = [];

  function viderParagraphe() {
    if (paragraphe.length > 0) {
      blocs.push({ type: "p", texte: paragraphe.join(" ") });
      paragraphe = [];
    }
  }

  for (const ligne of lignes) {
    const l = ligne.trim();
    if (l === "") {
      viderParagraphe();
    } else if (l === "---" || l === "***" || l === "___") {
      // LE SEPARATEUR. Sans cette branche, il finirait dans le paragraphe
      // courant et s afficherait tel quel.
      viderParagraphe();
      blocs.push({ type: "trait" });
    } else if (l.startsWith("### ")) {
      viderParagraphe();
      blocs.push({ type: "h3", texte: l.slice(4) });
    } else if (l.startsWith("## ")) {
      viderParagraphe();
      blocs.push({ type: "h2", texte: l.slice(3) });
    } else if (l.startsWith("# ")) {
      viderParagraphe();
      blocs.push({ type: "h2", texte: l.slice(2) });
    } else if (l.startsWith("- ") || l.startsWith("* ")
        || l.startsWith("· ")) {
      viderParagraphe();
      blocs.push({ type: "li", texte: l.slice(2) });
    } else {
      paragraphe.push(l);
    }
  }
  viderParagraphe();
  return blocs;
}

// Rend le gras, l italique et les liens markdown internes.
function enFragments(texte: string) {
  const morceaux: any[] = [];
  const regex = /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(\[[^\]]+\]\([^)]+\))/g;
  let position = 0;
  let trouve;

  while ((trouve = regex.exec(texte)) !== null) {
    if (trouve.index > position) {
      morceaux.push({ type: "texte",
        valeur: texte.slice(position, trouve.index) });
    }
    const brut = trouve[0];
    if (brut.startsWith("**")) {
      morceaux.push({ type: "gras", valeur: brut.slice(2, -2) });
    } else if (brut.startsWith("[")) {
      const coupure = brut.indexOf("](");
      morceaux.push({
        type: "lien",
        valeur: brut.slice(1, coupure),
        href: brut.slice(coupure + 2, -1),
      });
    } else {
      morceaux.push({ type: "italique", valeur: brut.slice(1, -1) });
    }
    position = trouve.index + brut.length;
  }
  if (position < texte.length) {
    morceaux.push({ type: "texte", valeur: texte.slice(position) });
  }
  return morceaux;
}

function Rendu({ texte }: any) {
  const morceaux = enFragments(texte);
  return (
    <>
      {morceaux.map((m: any, i: number) => {
        if (m.type === "gras") {
          return <strong key={i} style={{ color: "#fff" }}>{m.valeur}</strong>;
        }
        if (m.type === "italique") {
          return (
            <em key={i} style={{ color: "rgba(255,255,255,0.6)" }}>
              {m.valeur}
            </em>
          );
        }
        if (m.type === "lien") {
          return (
            <Link key={i} href={m.href}
              style={{ color: OR, textDecoration: "underline" }}>
              {m.valeur}
            </Link>
          );
        }
        return <span key={i}>{m.valeur}</span>;
      })}
    </>
  );
}

export default async function ArticleMysterLLC({ params }: any) {
  const p = await params;
  const article = await lireArticle(p.slug);
  if (!article) notFound();

  const blocs = enBlocs(article.contenu || "");

  // LES PUCES CONSECUTIVES SONT REGROUPEES EN UNE VRAIE LISTE.
  const rendu: any[] = [];
  let i = 0;
  while (i < blocs.length) {
    const b = blocs[i];

    if (b.type === "li") {
      const puces: any[] = [];
      while (i < blocs.length && blocs[i].type === "li") {
        puces.push(blocs[i].texte);
        i = i + 1;
      }
      rendu.push(
        <ul key={"ul" + i} style={{ color: "rgba(255,255,255,0.75)",
          fontSize: "16px", lineHeight: "1.85",
          margin: "0 0 20px", paddingLeft: "24px" }}>
          {puces.map(function (t: string, j: number) {
            return (
              <li key={j} style={{ marginBottom: "9px" }}>
                <Rendu texte={t} />
              </li>
            );
          })}
        </ul>
      );
      continue;
    }

    if (b.type === "trait") {
      rendu.push(
        <hr key={"hr" + i} style={{ border: "none",
          borderTop: "1px solid rgba(200,169,110,0.25)",
          margin: "40px 0 30px" }} />
      );
      i = i + 1;
      continue;
    }

    if (b.type === "h2") {
      rendu.push(
        <h2 key={i} style={{ color: OR, fontSize: "22px",
          lineHeight: "1.4", margin: "38px 0 14px" }}>
          <Rendu texte={b.texte} />
        </h2>
      );
      i = i + 1;
      continue;
    }

    if (b.type === "h3") {
      rendu.push(
        <h3 key={i} style={{ color: "#fff", fontSize: "19px",
          lineHeight: "1.4", margin: "28px 0 12px" }}>
          <Rendu texte={b.texte} />
        </h3>
      );
      i = i + 1;
      continue;
    }

    rendu.push(
      <p key={i} style={{ color: "rgba(255,255,255,0.75)",
        fontSize: "16px", lineHeight: "1.85", margin: "0 0 18px" }}>
        <Rendu texte={b.texte} />
      </p>
    );
    i = i + 1;
  }

  return (
    <div style={{ minHeight: "100vh", background: NOIR, color: "#fff",
      fontFamily: "Georgia, serif" }}>

      {/* ---- EN-TETE ---- LE MEME SUR TOUTES LES PAGES DU SITE. */}
      <header style={{ borderBottom: "1px solid rgba(200,169,110,0.15)",
        background: "#000" }}>
        <div style={{ ...SECTION, display: "flex",
          justifyContent: "space-between", alignItems: "center",
          padding: "10px 24px", gap: "16px" }}>
          <a href={SITE + "/"} style={{ display: "block", lineHeight: 0,
            flexShrink: 0 }}>
            <img
              src={BANNIERE}
              alt="MysterLLC"
              style={{ width: "520px", maxWidth: "58vw", height: "auto",
                display: "block", margin: "-4px", clipPath: "inset(4px)" }}
            />
          </a>
          <nav style={{ display: "flex", alignItems: "center", gap: "18px",
            flexShrink: 0 }}>
            <a href={SITE + "/fonctionnalites"} style={LIEN_ENTETE}>Fonctions</a>
            <a href={SITE + "/etats"} style={LIEN_ENTETE}>États</a>
            <a href={SITE + "/blog"} style={LIEN_ENTETE}>Blog</a>
            <a href={SITE + "/contact"} style={LIEN_ENTETE}>Contact</a>
            <a href="/connexion" style={{ color: OR,
              border: "1px solid rgba(200,169,110,0.45)",
              padding: "9px 18px", borderRadius: "8px",
              textDecoration: "none", fontSize: "14px",
              whiteSpace: "nowrap" }}>
              Se connecter
            </a>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: "760px", margin: "0 auto",
        padding: "70px 24px 90px" }}>
        {/* ⚠️ LIEN ABSOLU, comme sur la liste. Le middleware sert cette page
            depuis mysterllc.com ; un lien relatif renverrait vers le blog
            AcadéMIA Pro si l article est ouvert depuis academiapro.fr. */}
        <a href={SITE + "/blog"}
          style={{ color: OR, fontSize: "14px",
            textDecoration: "none" }}>
          &larr; Tous les articles
        </a>

        {article.categorie && (
          <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px",
            margin: "26px 0 14px" }}>
            {String(article.categorie).toUpperCase()}
          </p>
        )}

        <h1 style={{ fontSize: "34px", lineHeight: "1.3",
          margin: "0 0 30px" }}>
          {article.titre}
        </h1>

        {rendu}

        {/* ══════════════════════════════════════════════════════════════
            LE BLOC DE FIN D ARTICLE — REECRIT LE 06/09.

            🚨 IL EST ICI ET NON DANS CHAQUE ARTICLE. Un seul endroit a
            modifier : tout article present et futur le porte
            automatiquement, sans qu on ait a le recopier.

            🚨 EN FIN D ARTICLE, JAMAIS AU DEBUT. Le lecteur arrive d un
            moteur avec une question ; lui proposer quelque chose avant de
            lui repondre le fait partir. A la fin, il a obtenu sa reponse et
            vu qu on maitrise le sujet.

            ⚠️ CE QUE DISAIT L ANCIEN TEXTE : « suit les obligations,
            agenda, formulaires pre-remplis, relances ». Exact mais plat —
            une liste de fonctions, pas une promesse.

            🚨 CE QU IL DIT MAINTENANT, ET C EST LE POINT DE JACQUES (06/09) :
            la charge administrative est PRISE EN CHARGE, jusqu a
            l expert-comptable qui n a plus qu a controler et deposer.
            ⛔ NE JAMAIS ECRIRE QUE LA PLATEFORME DEPOSE LES DOCUMENTS :
            c est le professionnel qui les transmet aux administrations.
            Le dire autrement serait promettre une conformite qu on ne
            garantit pas.
            ══════════════════════════════════════════════════════════════ */}
        {/* 🆕 MISE EN VALEUR — 06/09.

            LE DEFAUT CONSTATE A L ECRAN : le bloc avait exactement
            l apparence de l article — meme fond, meme taille, meme couleur.
            L oeil ne voyait pas qu on changeait de registre, et la
            proposition passait pour un paragraphe de plus.

            CE QUI LE DISTINGUE MAINTENANT :
            - un fond legerement eclairci et une bordure doree : c est un
              encadre, pas la suite du texte
            - la premiere phrase en 19px et en blanc — c est elle qui porte
              la promesse, elle doit se lire avant tout le reste
            - le trait de separation au-dessus est plus marque

            ⚠️ SANS EXCES POUR AUTANT. Un bloc criard sur un article de fond
            decredibiliserait ce qui precede : le lecteur vient d apprendre
            quelque chose, il ne doit pas avoir l impression d etre tombe
            dans une publicite. */}
        <div style={{ marginTop: "56px",
          background: "rgba(200,169,110,0.06)",
          border: "1px solid rgba(200,169,110,0.35)",
          borderRadius: "14px",
          padding: "32px 34px" }}>
          <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px",
            margin: "0 0 18px" }}>
            MYSTERLLC
          </p>
          <p style={{ color: "#fff", fontSize: "19px",
            lineHeight: "1.7", margin: "0 0 20px" }}>
            Toute cette charge administrative — savoir ce qui est dû, à
            quelle date, sous quelle forme, et préparer chaque document —
            MysterLLC la prend à votre place.
          </p>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "15px",
            lineHeight: "1.85", margin: "0 0 16px" }}>
            La plateforme suit vos échéances état par état et au niveau
            fédéral, avec les montants et la source officielle de chaque
            règle. Elle prépare les documents préremplis à partir des
            informations de votre société : rapport annuel, formulaire 5472,
            1120 pro forma, 7004, et le CERFA 3916 pour votre compte
            bancaire.
          </p>
          {/* ⚠️ « OU A L ADMINISTRATION DIRECTEMENT » — AJOUTE LE 06/09.
              Aucun texte americain n impose de passer par un professionnel
              pour deposer un 5472, un 1120 ou un rapport annuel d Etat :
              le proprietaire peut le faire lui-meme. Ecrire que
              l expert-comptable est OBLIGATOIRE serait faux, et ajouterait
              un frein imaginaire.
              ⛔ NE JAMAIS ECRIRE QUE LA PLATEFORME DEPOSE LES DOCUMENTS :
              elle les prepare, le depot appartient au titulaire ou a son
              conseil. */}
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "15px",
            lineHeight: "1.85", margin: "0 0 26px" }}>
            Vous n&apos;avez plus qu&apos;à les transmettre à votre
            expert-comptable pour contrôle, ou à les déposer vous-même
            auprès des administrations. Dans les deux cas, le dossier est
            constitué.
          </p>
          {/* MysterLLC n a pas de parcours d inscription en ligne : les
              comptes se créent après entretien. Le bouton mène donc à la
              page de contact — et non plus à un lien mailto, qui ne fait
              rien sur un appareil sans messagerie configurée. */}
          <a href={SITE + "/contact"}
            style={{ display: "inline-block", background: OR,
              color: NOIR, padding: "15px 30px", borderRadius: "9px",
              textDecoration: "none", fontWeight: "bold",
              fontSize: "16px" }}>
            Demander une présentation
          </a>
        </div>
      </main>

      {/* ---- PIED ---- Pages legales sur academiapro.fr, en absolu. */}
      <footer style={{ borderTop: "1px solid rgba(200,169,110,0.15)",
        padding: "26px 0" }}>
        <div style={{ ...SECTION, color: "rgba(255,255,255,0.4)",
          fontSize: "13px", lineHeight: "1.8" }}>
          <p style={{ margin: "0 0 6px" }}>
            MysterLLC — une solution ACADÉMIA PRO LLC
          </p>
          <p style={{ margin: 0 }}>
            <a href={SITE + "/"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Accueil</a>
            {"  ·  "}
            <a href={SITE + "/fonctionnalites"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Fonctions</a>
            {"  ·  "}
            <a href={SITE + "/etats"} style={{ color: OR_PALE,
              textDecoration: "none" }}>États</a>
            {"  ·  "}
            <a href={SITE + "/blog"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Blog</a>
            {"  ·  "}
            <a href={SITE + "/contact"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Contact</a>
            {"  ·  "}
            <a href={LEGAL + "/mentions-legales"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Mentions légales</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
