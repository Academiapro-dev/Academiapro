import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";

// ---------------------------------------------------------------------------
// ARTICLE DU BLOG MYSTERLLC — 01/09.
//
// Ne sert QUE les articles de marque « mysterllc » : un slug academiapro ou
// mrcomptable renvoie 404 ici. C est ce filtre qui garantit qu aucun contenu
// d une autre marque n apparaisse sur ce domaine.
//
// LA CANONIQUE EST SANS PREFIXE. Le middleware sert cette page sous
// mysterllc.com/blog/{slug} : c est cette adresse que le sitemap declare et
// que le visiteur voit.
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
const NOIR = "#050508";
const SITE = "https://mysterllc.com";

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

  const section: any = {
    maxWidth: "760px",
    margin: "0 auto",
    padding: "0 24px",
  };

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
    <main style={{ minHeight: "100vh", background: NOIR, color: "#fff",
      fontFamily: "Georgia, serif", paddingTop: "70px",
      paddingBottom: "90px" }}>

      <div style={section}>
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

        <div style={{ marginTop: "50px",
          borderTop: "1px solid rgba(200,169,110,0.2)",
          paddingTop: "30px" }}>
          {/* MysterLLC n a pas de parcours d inscription en ligne : les
              comptes se créent après entretien. Le bouton mène donc au
              contact, pas à une page qui n existe pas. */}
          <a href="mailto:contact@mysterllc.com?subject=MysterLLC%20—%20demande%20de%20présentation"
            style={{ display: "inline-block", background: OR,
              color: NOIR, padding: "15px 30px", borderRadius: "9px",
              textDecoration: "none", fontWeight: "bold",
              fontSize: "16px" }}>
            Demander une présentation
          </a>
        </div>
      </div>
    </main>
  );
}
