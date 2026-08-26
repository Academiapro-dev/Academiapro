import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";

// Article du blog Mr. Comptable. Ne sert QUE les articles de marque
// mrcomptable : un slug academiapro renvoie 404 ici.
//
// LA CANONIQUE EST SANS PREFIXE. Le middleware sert cette page sous
// mrcomptable.fr/blog/{slug} : c est cette adresse que le sitemap declare.
//
// 🚨 DEUX DEFAUTS CORRIGES LE 26/08, APRES LA POSE DU MAILLAGE INTERNE.
//
// 1. LA LIGNE « --- » N ETAIT PAS TRAITEE. Elle n est ni vide, ni un
//    titre, ni une puce : elle rejoignait donc le paragraphe en cours et
//    s affichait telle quelle. Le bloc « A lire aussi » commence par un
//    separateur : il faut le reconnaitre et en faire un trait.
//
// 2. LES PUCES S AFFICHAIENT COMME DES PARAGRAPHES precedes d un tiret
//    cadratin, jamais comme une vraie liste. Cosmetique en apparence,
//    mais un bloc de liens ainsi rendu ne se distingue pas du texte.
//
// ⚠️ LE CACHE. revalidate = 3600 : une page modifiee en base ne change
// qu au bout d une heure, ou apres un redeploiement manuel. Ne jamais
// conclure qu un contenu n est pas affiche sans avoir tenu compte de ce
// delai.

export const revalidate = 3600;

const OR = "#c8a96e";
const NOIR = "#050508";

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
    .eq("marque", "mrcomptable")
    .eq("slug", slug)
    .limit(1);
  return (data && data[0]) || null;
}

export async function generateMetadata({ params }: any) {
  const p = await params;
  const article = await lireArticle(p.slug);
  if (!article) {
    return { title: "Article introuvable — Mr. Comptable" };
  }
  return {
    title: article.titre + " — Mr. Comptable",
    description: article.extrait || "",
    alternates: {
      canonical: "https://mrcomptable.fr/blog/" + article.slug,
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
      // 🆕 LE SEPARATEUR. Sans cette branche, il finissait dans le
      // paragraphe courant et s affichait tel quel.
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

export default async function ArticleComptable({ params }: any) {
  const p = await params;
  const article = await lireArticle(p.slug);
  if (!article) notFound();

  const blocs = enBlocs(article.contenu || "");

  const section: any = {
    maxWidth: "760px",
    margin: "0 auto",
    padding: "0 24px",
  };

  // 🆕 LES PUCES CONSECUTIVES SONT REGROUPEES EN UNE VRAIE LISTE.
  // Sans ce regroupement, chaque puce restait un paragraphe isole.
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
        <Link href="/comptable/blog"
          style={{ color: OR, fontSize: "14px",
            textDecoration: "none" }}>
          &larr; Tous les articles
        </Link>

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
          <Link href="/comptable/inscription"
            style={{ display: "inline-block", background: OR,
              color: NOIR, padding: "15px 30px", borderRadius: "9px",
              textDecoration: "none", fontWeight: "bold",
              fontSize: "16px" }}>
            Ouvrir mon espace
          </Link>
        </div>
      </div>
    </main>
  );
}
