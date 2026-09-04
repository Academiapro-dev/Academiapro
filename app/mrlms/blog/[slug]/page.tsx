import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { notFound } from "next/navigation";

// ══════════════════════════════════════════════════════════════════════════
// ARTICLE DU BLOG MR LMS — 04/09.
//
// Ne sert QUE les articles de marque `mrlms` : un slug d une autre marque
// renvoie 404 ici, meme s il existe en base.
//
// 🚨 CANONIQUE, LIEN DE RETOUR ET BOUTONS SONT ABSOLUS, SUR www.mrlms.fr.
// Le middleware sert cette page sous mrlms.fr/blog/<slug> : c est cette
// adresse que le sitemap declare. La page est aussi servie depuis
// academiapro.fr/mrlms/blog/<slug> ; un lien relatif « Tous les articles »
// vers /blog y menerait au blog AcadéMIA Pro. Le lien de retour du blog
// Mr Comptable pointe encore sur /comptable/blog, l adresse prefixee : on
// ne reproduit pas ce doublon ici.
//
// 🆕 BALISES SOCIALES SUR L ARTICLE. Un article partage sur LinkedIn prend
// son propre titre et son extrait, pas ceux du layout racine.
//
// RENDU DU CONTENU : conversion markdown minimale reprise du blog
// Mr Comptable (titres, gras, italique, liens, listes, separateurs),
// eprouvee la-bas depuis le 26/08. Aucune dependance ajoutee.
//
// ⚠️ LE CACHE. revalidate = 3600 : un article modifie en base ne change
// qu au bout d une heure, ou apres un redeploiement.
// ══════════════════════════════════════════════════════════════════════════

export const revalidate = 3600;

const SITE = "https://www.mrlms.fr";
const MARQUE = "mrlms";
const LEGAL = "https://academiapro.fr";

// 🆕 LE CONTACT EST CELUI DE MR LMS — 04/09.
const CONTACT = SITE + "/contact";

const OR = "#c8a96e";
const OR_PALE = "rgba(200,169,110,0.75)";
const FOND = "#050508";

// 🚨 DOUBLE EXTENSION REELLE ET VOULUE. Le code pointe sur le nom reel.
const BANNIERE = "/mrlms-banniere.jpeg.png";

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
    .eq("marque", MARQUE)
    .eq("slug", slug)
    .limit(1);
  return (data && data[0]) || null;
}

export async function generateMetadata({ params }: any) {
  const p = await params;
  const article = await lireArticle(p.slug);
  if (!article) {
    return { title: "Article introuvable — Mr LMS" };
  }
  const url = SITE + "/blog/" + article.slug;
  return {
    title: article.titre + " — Mr LMS",
    description: article.extrait || "",
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: article.titre,
      description: article.extrait || "",
      url: url,
      siteName: "Mr LMS",
      locale: "fr_FR",
      type: "article",
    },
    twitter: {
      card: "summary",
      title: article.titre,
      description: article.extrait || "",
    },
  };
}

// Conversion markdown minimale : titres, gras, listes, paragraphes,
// separateurs.
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

// Rend le gras, l italique et les liens markdown.
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

export default async function ArticleMrLMS({ params }: any) {
  const p = await params;
  const article = await lireArticle(p.slug);
  if (!article) notFound();

  const blocs = enBlocs(article.contenu || "");

  // Les puces consecutives sont regroupees en une vraie liste.
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
    <div style={{ minHeight: "100vh", background: FOND, color: "#fff",
      fontFamily: "Georgia, serif" }}>

      {/* ---- EN-TETE ---- Meme montage que la vitrine et l index. */}
      <header style={{ borderBottom: "1px solid rgba(200,169,110,0.15)",
        background: "#000" }}>
        <div style={{ ...SECTION, display: "flex",
          justifyContent: "space-between", alignItems: "center",
          padding: "10px 24px", gap: "16px" }}>
          <a href={SITE + "/"} style={{ display: "block", lineHeight: 0,
            flexShrink: 0 }}>
            <img
              src={BANNIERE}
              alt="Mr LMS"
              style={{ width: "560px", maxWidth: "62vw", height: "auto",
                display: "block", margin: "-4px", clipPath: "inset(4px)" }}
            />
          </a>
          {/* 🚨 LE MEME MENU SUR TOUTES LES PAGES — 04/09. Un article lu
              depuis une recherche est souvent la premiere page vue : sans
              menu, le lecteur ne peut aller nulle part.
              ⚠️ TOUTE PAGE PUBLIQUE DE MR LMS PORTE CES QUATRE ENTREES. */}
          <nav style={{ display: "flex", alignItems: "center", gap: "18px",
            flexShrink: 0 }}>
            <a href={SITE + "/fonctionnalites"} style={LIEN_ENTETE}>Fonctions</a>
            <a href={SITE + "/blog"} style={LIEN_ENTETE}>Blog</a>
            <a href={CONTACT} style={LIEN_ENTETE}>Contact</a>
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
        <a href={SITE + "/blog"}
          style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>
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

        {/* ---- APPEL ---- Vers la vitrine, dont l existence est certaine.
            Pas vers /contact : sur mrlms.fr ce chemin serait reecrit vers
            /mrlms/contact. */}
        <div style={{ marginTop: "50px",
          borderTop: "1px solid rgba(200,169,110,0.2)",
          paddingTop: "30px" }}>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px",
            lineHeight: "1.8", margin: "0 0 18px" }}>
            Mr LMS est la plateforme de formation des organismes : vos
            stagiaires, de l&apos;inscription au bilan.
          </p>
          <a href={SITE + "/"}
            style={{ display: "inline-block",
              background: "linear-gradient(135deg,#c8a96e,#a07840)",
              color: FOND, padding: "15px 30px", borderRadius: "9px",
              textDecoration: "none", fontWeight: "bold",
              fontSize: "16px" }}>
            Découvrir Mr LMS
          </a>
        </div>
      </main>

      {/* ---- PIED ---- Pages legales d AcadéMIA Pro, en absolu, comme sur
          l index : un lien relatif serait reecrit vers /mrlms/... */}
      <footer style={{ borderTop: "1px solid rgba(200,169,110,0.15)",
        padding: "26px 0" }}>
        <div style={{ ...SECTION, color: "rgba(255,255,255,0.4)",
          fontSize: "13px", lineHeight: "1.8" }}>
          <p style={{ margin: "0 0 6px" }}>
            Mr LMS — une solution ACADÉMIA PRO LLC
          </p>
          <p style={{ margin: 0 }}>
            <a href={SITE + "/"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Accueil</a>
            {"  ·  "}
            <a href={SITE + "/fonctionnalites"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Fonctions</a>
            {"  ·  "}
            <a href={SITE + "/blog"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Blog</a>
            {"  ·  "}
            <a href={CONTACT} style={{ color: OR_PALE,
              textDecoration: "none" }}>Contact</a>
            {"  ·  "}
            <a href={LEGAL + "/mentions-legales"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Mentions légales</a>
            {"  ·  "}
            <a href={LEGAL + "/cgv"} style={{ color: OR_PALE,
              textDecoration: "none" }}>CGV</a>
            {"  ·  "}
            <a href={LEGAL + "/politique-confidentialite"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Confidentialité</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
