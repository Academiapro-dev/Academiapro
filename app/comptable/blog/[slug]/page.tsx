import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";

// Article du blog Mr. Comptable. Ne sert QUE les articles de marque
// mrcomptable : un slug academiapro renvoie 404 ici.

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
      canonical: "https://mrcomptable.fr/comptable/blog/" + article.slug,
    },
  };
}

// Conversion markdown minimale : titres, gras, paragraphes. Aucune
// dependance ajoutee pour cela.
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
    } else if (l.startsWith("### ")) {
      viderParagraphe();
      blocs.push({ type: "h3", texte: l.slice(4) });
    } else if (l.startsWith("## ")) {
      viderParagraphe();
      blocs.push({ type: "h2", texte: l.slice(3) });
    } else if (l.startsWith("# ")) {
      viderParagraphe();
      blocs.push({ type: "h2", texte: l.slice(2) });
    } else if (l.startsWith("- ") || l.startsWith("* ")) {
      viderParagraphe();
      blocs.push({ type: "li", texte: l.slice(2) });
    } else {
      paragraphe.push(l);
    }
  }
  viderParagraphe();
  return blocs;
}

// Rend le gras et les liens markdown internes.
function enFragments(texte: string) {
  const morceaux: any[] = [];
  const regex = /(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/g;
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
    } else {
      const coupure = brut.indexOf("](");
      morceaux.push({
        type: "lien",
        valeur: brut.slice(1, coupure),
        href: brut.slice(coupure + 2, -1),
      });
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
        if (m.type === "lien") {
          return (
            <Link key={i} href={m.href} style={{ color: OR }}>
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

        {blocs.map((b: any, i: number) => {
          if (b.type === "h2") {
            return (
              <h2 key={i} style={{ color: OR, fontSize: "22px",
                lineHeight: "1.4", margin: "38px 0 14px" }}>
                <Rendu texte={b.texte} />
              </h2>
            );
          }
          if (b.type === "h3") {
            return (
              <h3 key={i} style={{ color: "#fff", fontSize: "19px",
                lineHeight: "1.4", margin: "28px 0 12px" }}>
                <Rendu texte={b.texte} />
              </h3>
            );
          }
          if (b.type === "li") {
            return (
              <p key={i} style={{ color: "rgba(255,255,255,0.75)",
                fontSize: "16px", lineHeight: "1.85",
                margin: "0 0 8px", paddingLeft: "18px" }}>
                — <Rendu texte={b.texte} />
              </p>
            );
          }
          return (
            <p key={i} style={{ color: "rgba(255,255,255,0.75)",
              fontSize: "16px", lineHeight: "1.85", margin: "0 0 18px" }}>
              <Rendu texte={b.texte} />
            </p>
          );
        })}

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
