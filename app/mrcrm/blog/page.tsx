import { createClient } from "@supabase/supabase-js";

// ══════════════════════════════════════════════════════════════════════════
// LE BLOG DE MR CRM — 04/09.
//
// DECISION DE JACQUES DU 04/09 : chaque produit a son blog, sur son
// domaine. Publier les articles Mr CRM sur le blog AcadéMIA diluerait la
// separation construite les 03 et 04/09 : si Mr CRM est un produit a part
// entiere, il lui faut son propre contenu.
//
// Ne lit QUE les articles de marque `mrcrm`. Les articles AcadéMIA Pro,
// Mr Comptable, MysterLLC et Mr LMS ne se melangent jamais ici.
//
// 🚨 LA CANONIQUE ET LES LIENS SONT ABSOLUS, SUR www.mrcrm.fr.
//
// Le middleware sert cette page sous mrcrm.fr/blog : c est cette adresse-la
// que le sitemap declare et que le visiteur voit. L absolu est indispensable
// — metadataBase pointe sur academiapro.fr, donc une canonique relative se
// resoudrait vers le mauvais domaine. Et la page est AUSSI servie depuis
// academiapro.fr/mrcrm/blog : un lien relatif vers /blog/<slug> y menerait
// au blog AcadéMIA Pro, qui n a rien a voir.
//
// AVEC www, PAS SANS. mrcrm.fr redirige vers www.mrcrm.fr. Une canonique
// sans www designerait une adresse qui redirige — exactement le defaut
// releve sur MysterLLC et encore non resolu la-bas. Ici on ne le cree pas.
//
// LA PAGE PORTE SON PROPRE EN-TETE, comme la vitrine et le devis. Sans
// cela, la barre de travail Mr CRM (« Mes contacts », « Publier »)
// s afficherait au-dessus des articles pour un visiteur qui n a pas de
// compte. Pour que la barre s efface, /blog figure dans
// PAGES_PUBLIQUES_MRCRM de components/NavBar.tsx.
//
// ⚠️ La telephonie n est proposee qu aux clients europeens : ne jamais
// promettre une couverture mondiale dans un article.
// ⚠️ Aucun prix, aucun concurrent nomme, aucune statistique non verifiee.
// ⚠️ Le nom s ecrit « Mr CRM », SANS POINT. L image porte « Mr.CRM » :
// c est un dessin.
//
// ⚠️ LE CACHE. revalidate = 3600 : un article publie en base n apparait
// qu au bout d une heure, ou apres un redeploiement.
// ══════════════════════════════════════════════════════════════════════════

export const revalidate = 3600;

const SITE = "https://www.mrcrm.fr";
const MARQUE = "mrcrm";
const LEGAL = "https://academiapro.fr";

// 🆕 LE CONTACT EST CELUI DE MR CRM — 04/09. La page existe
// (app/mrcrm/contact/page.tsx) : le prospect ne quitte plus la marque.
const CONTACT = SITE + "/contact";

export const metadata = {
  title: "Blog — Mr CRM | Savoir qui rappeler, et quoi lui dire",
  description:
    "Relances, historique des échanges, appels, SMS, documents signés :"
    + " des articles écrits pour les indépendants et les équipes qui"
    + " suivent leurs clients.",
  alternates: {
    canonical: SITE + "/blog",
  },
  // LES BALISES SOCIALES DOIVENT PARLER DE MR CRM, pas d AcadéMIA Pro.
  // Sans ces lignes, celles du layout racine s appliquent.
  openGraph: {
    title: "Blog — Mr CRM",
    description:
      "Des articles écrits pour ceux qui suivent leurs clients : qui"
      + " rappeler, quoi lui dire, et comment ne rien perdre entre deux.",
    url: SITE + "/blog",
    siteName: "Mr CRM",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Blog — Mr CRM",
    description:
      "Relances, historique des échanges, appels, SMS et documents signés.",
  },
};

const OR = "#c8a96e";
const OR_PALE = "rgba(200,169,110,0.75)";
const FOND = "#050508";

// ⚠️ SANS ESPACE NI DOUBLE EXTENSION, contrairement au logo carre
// (« mrcrm-logo .png ») et aux images Mr LMS. Verifier le nom reel dans
// public/ avant tout changement.
const BANNIERE = "/mrcrm-banniere.png";

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

function extraireTexte(contenu: string) {
  return (contenu || "")
    .replace(/[#*_>`-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

export default async function BlogMrCRM() {
  const supabase = clientLecture();
  const { data } = await supabase
    .from("blog")
    .select("id, titre, slug, extrait, contenu, categorie, created_at")
    .eq("publie", true)
    .eq("marque", MARQUE)
    .order("created_at", { ascending: false });
  const articles = data || [];

  const carte: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.22)",
    borderRadius: "14px",
    overflow: "hidden",
    textDecoration: "none",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    padding: "26px",
  };

  return (
    <div style={{ minHeight: "100vh", background: FOND, color: "#fff",
      fontFamily: "Georgia, serif" }}>

      {/* ---- EN-TETE ---- Meme montage que la vitrine : la banniere
          porte le nom et la base line, rien n est ecrit a cote. */}
      <header style={{ borderBottom: "1px solid rgba(200,169,110,0.15)",
        background: "#000" }}>
        <div style={{ ...SECTION, display: "flex",
          justifyContent: "space-between", alignItems: "center",
          padding: "10px 24px", gap: "16px" }}>
          <a href={SITE + "/"} style={{ display: "block", lineHeight: 0,
            flexShrink: 0 }}>
            <img
              src={BANNIERE}
              alt="Mr CRM"
              style={{ width: "560px", maxWidth: "62vw", height: "auto",
                display: "block", margin: "-4px", clipPath: "inset(4px)" }}
            />
          </a>
          <nav style={{ display: "flex", alignItems: "center", gap: "18px",
            flexShrink: 0 }}>
            {/* 🚨 LE MEME MENU SUR TOUTES LES PAGES, SANS EXCEPTION —
                04/09. Cette page avait ete ecrite avant que /fonctionnalites
                existe : son en-tete n en portait pas le lien. Un menu qui
                change d une page a l autre donne l impression d un site
                inacheve, et le visiteur ne sait plus ou il peut aller.
                ⚠️ TOUTE PAGE PUBLIQUE PORTE EXACTEMENT LES MEMES ENTREES. */}
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

      <main style={{ ...SECTION, paddingTop: "70px",
        paddingBottom: "90px" }}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px",
          margin: "0 0 18px" }}>
          MR CRM — LE BLOG
        </p>
        <h1 style={{ fontSize: "38px", lineHeight: "1.25",
          margin: "0 0 18px", maxWidth: "760px" }}>
          Savoir qui rappeler, et quoi lui dire
        </h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "17px",
          lineHeight: "1.75", maxWidth: "680px", margin: "0 0 44px" }}>
          Les relances, l&apos;historique des échanges, les appels et les SMS
          depuis la fiche, les documents signés. Des articles écrits pour
          ceux qui suivent leurs clients, seuls ou en équipe, à partir de ce
          qui se passe dans leur journée.
        </p>

        {articles.length === 0 && (
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px" }}>
            Les premiers articles arrivent.
          </p>
        )}

        <div style={{ display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
          gap: "18px" }}>
          {articles.map((a: any) => (
            <a key={a.id} href={SITE + "/blog/" + a.slug} style={carte}>
              {a.categorie && (
                <span style={{ alignSelf: "flex-start",
                  background: "rgba(200,169,110,0.15)",
                  color: OR, borderRadius: "20px",
                  padding: "3px 12px", fontSize: "12px",
                  marginBottom: "14px" }}>
                  {a.categorie}
                </span>
              )}
              <h2 style={{ fontSize: "19px", margin: "0 0 12px",
                lineHeight: "1.4" }}>
                {a.titre}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.65)",
                fontSize: "15px", lineHeight: "1.7",
                margin: "0 0 18px", flex: 1 }}>
                {a.extrait || extraireTexte(a.contenu)}
              </p>
              <span style={{ color: OR, fontSize: "14px",
                fontWeight: "bold" }}>
                Lire &rarr;
              </span>
            </a>
          ))}
        </div>
      </main>

      {/* ---- PIED ----
          ⚠️ LES PAGES LEGALES SONT CELLES D ACADEMIA PRO, EN ABSOLU. Un lien
          relatif /cgv serait reecrit par le middleware vers /mrcrm/cgv, qui
          n existe pas. Les CGV, mentions et politique de confidentialite
          existent sur academiapro.fr (declarees dans son sitemap) et
          valent pour toutes les solutions de la maison. */}
      <footer style={{ borderTop: "1px solid rgba(200,169,110,0.15)",
        padding: "26px 0" }}>
        <div style={{ ...SECTION, color: "rgba(255,255,255,0.4)",
          fontSize: "13px", lineHeight: "1.8" }}>
          <p style={{ margin: "0 0 6px" }}>
            Mr CRM — une solution ACADÉMIA PRO LLC
          </p>
          <p style={{ margin: 0 }}>
            <a href={SITE + "/"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Accueil</a>
            {"  ·  "}
            <a href={SITE + "/fonctionnalites"} style={{ color: OR_PALE,
              textDecoration: "none" }}>Fonctions</a>
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
