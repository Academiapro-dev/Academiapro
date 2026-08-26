import AiguillageLangueBlog from "../../../components/AiguillageLangueBlog";

// LA PAGE D UN ARTICLE DE BLOG — ACADEMIA PRO.
//
// 🚨 TROIS DEFAUTS CORRIGES LE 26/08.
//
// 1. LE TITRE AFFICHE PAR GOOGLE PORTAIT « AcademIA Pro » SANS ACCENT.
//    Le meme defaut avait ete corrige le 25/08 sur la page de liste, mais
//    il subsistait ICI — c est-a-dire sur les vingt-six pages que Google
//    indexe le plus. Le titre et la description sont le premier contact
//    d un visiteur avec la marque.
//    LA REGLE : tout texte visible par un tiers est accentue. Le code
//    peut rester en ASCII, pas ce qui s affiche.
//
// 2. LES LIENS DE LANGUE ETAIENT FAUX. Les versions anglaise et
//    espagnole pointaient vers /en/blog et /es/blog — la LISTE des
//    articles, pas l article traduit. Un moteur de recherche a qui l on
//    dit « la version anglaise de cet article est cette page de liste »
//    recoit un signal incoherent.
//    ⚠️ TANT QUE LES TRADUCTIONS NE SONT PAS RELIEES EN BASE, IL VAUT
//    MIEUX N ANNONCER AUCUNE VERSION ETRANGERE QU EN ANNONCER UNE
//    FAUSSE. Le jour ou blog_traductions reliera les articles, on
//    remettra les liens exacts.
//
// 3. LES LISTES A PUCES N ETAIENT PAS AFFICHEES. Le formatage traitait
//    les titres et les paragraphes, mais une ligne commencant par un
//    tiret ressortait telle quelle, tiret compris. Le maillage interne
//    pose le 26/08 est ecrit en listes : sans cette correction, les
//    liens « A lire aussi » ne s affichaient pas.

async function getArticle(slug: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/blog?slug=eq.${slug}&select=*`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data[0] || null;
  } catch { return null; }
}

export async function generateMetadata(
  { params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);
  if (!article) return { title: "AcadéMIA Pro" };
  return {
    title: article.titre + " — AcadéMIA Pro",
    description: article.extrait || "",
    alternates: {
      canonical:
        "https://academiapro.fr/blog/" + params.slug,
    },
  };
}

function formaterContenu(contenu: string) {
  const lignes = (contenu || "").split("\n");
  let html = "";
  let dansListe = false;

  // Les enrichissements communs a un paragraphe et a une puce : le gras,
  // l italique, et les liens internes du maillage.
  function enrichir(texte: string) {
    let t = texte.replace(
      /\*\*([^*]+)\*\*/g,
      "<strong style=\"color:#fff\">$1</strong>");
    t = t.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    t = t.replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g,
      "<a href=\"$2\" style=\"color:#c8a96e;"
      + "text-decoration:underline\">$1</a>");
    return t;
  }

  function fermerListe() {
    if (dansListe) {
      html += "</ul>";
      dansListe = false;
    }
  }

  for (const ligne of lignes) {
    const l = ligne.trim();

    // Une ligne vide ou un separateur ferme la liste en cours.
    if (!l || l === "---") { fermerListe(); continue; }
    if (l.startsWith("# ")) { fermerListe(); continue; }

    if (l.startsWith("## ")) {
      fermerListe();
      html += "<h2 style=\"color:#c8a96e;font-size:22px;"
        + "margin:32px 0 14px\">" + l.slice(3) + "</h2>";
      continue;
    }

    if (l.startsWith("### ")) {
      fermerListe();
      html += "<h3 style=\"color:#c8a96e;font-size:18px;"
        + "margin:26px 0 12px\">" + l.slice(4) + "</h3>";
      continue;
    }

    // 🆕 LES PUCES. Une ligne qui commence par « - » ou « · » entre dans
    // une liste. C est ce qui manquait : le maillage interne et toutes
    // les enumerations des articles s affichaient avec leur tiret.
    if (l.startsWith("- ") || l.startsWith("· ")) {
      if (!dansListe) {
        html += "<ul style=\"color:rgba(255,255,255,0.75);"
          + "font-size:15px;line-height:1.9;"
          + "margin:0 0 16px;padding-left:22px\">";
        dansListe = true;
      }
      html += "<li style=\"margin-bottom:8px\">"
        + enrichir(l.slice(2)) + "</li>";
      continue;
    }

    fermerListe();
    html += "<p style=\"color:rgba(255,255,255,0.75);"
      + "font-size:15px;line-height:1.9;"
      + "margin:0 0 16px\">" + enrichir(l) + "</p>";
  }

  fermerListe();
  return html;
}

export default async function ArticlePage(
  { params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);

  if (!article) {
    return (
      <div style={{ backgroundColor: "#050508",
        minHeight: "100vh", color: "#fff",
        display: "flex", alignItems: "center",
        justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ color: "#c8a96e" }}>
            Article introuvable
          </h1>
          <a href="/blog" style={{ color: "#c8a96e" }}>
            Retour au blog
          </a>
        </div>
      </div>
    );
  }

  const corps = formaterContenu(article.contenu);

  return (
    <>
    <AiguillageLangueBlog languePage="fr" />
    <div style={{ backgroundColor: "#050508",
      minHeight: "100vh", color: "#fff",
      fontFamily: "Georgia, serif",
      padding: "60px 20px" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <a href="/blog" style={{ color: "#c8a96e",
          fontSize: "13px", textDecoration: "none" }}>
          &larr; Retour au blog
        </a>
        <h1 style={{ color: "#fff", fontSize: "34px",
          margin: "20px 0 12px", lineHeight: "1.3" }}>
          {article.titre}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)",
          fontSize: "14px", margin: "0 0 32px" }}>
          {article.extrait}
        </p>
        <div dangerouslySetInnerHTML={{ __html: corps }} />
      </div>
    </div>
    </>
  );
}
