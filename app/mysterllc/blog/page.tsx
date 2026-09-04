import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// LE BLOG MYSTERLLC — 01/09.
//
// Meme mecanisme que les autres blogs : une seule table `blog`, separee par
// la colonne `marque`. Ici « mysterllc ». Les articles d AcadeMIA Pro, de
// Mr. Comptable, de Mr LMS et de Mr CRM ne paraissent jamais ici, et
// reciproquement.
//
// 🚨 LA CANONIQUE EST ABSOLUE. Le middleware sert cette page sous
// mysterllc.com/blog : c est cette adresse-la que le visiteur voit et que
// le sitemap declare. L absolu est indispensable — metadataBase pointe sur
// academiapro.fr, donc une canonique relative se resoudrait vers le mauvais
// domaine.
//
// 🆕 AVEC www — CORRIGE LE 04/09. `SITE` valait « https://mysterllc.com »,
// sans www, alors que le domaine REDIRIGE vers www.mysterllc.com. La
// canonique et les liens des articles designaient donc des adresses qui
// repondent par une redirection, ce que Search Console refuse d indexer.
// C est le defaut releve sur ce domaine depuis plusieurs jours.
//
// 🚨 LES LIENS DES ARTICLES SONT ABSOLUS EUX AUSSI. C est la lecon du
// 17/08 sur Mr. Comptable : des liens relatifs rendaient chaque article
// atteignable a DEUX adresses, et Google signalait « page en double sans
// URL canonique selectionnee ».
//
// 🆕 L EN-TETE ET LE PIED — AJOUTES LE 04/09.
//
// Cette page n avait AUCUN menu : un lecteur arrive par une recherche
// lisait l article et ne pouvait aller nulle part — ni voir les fonctions,
// ni ecrire. Le site n avait d ailleurs qu une seule page jusqu a ce jour.
// ⚠️ TOUTE PAGE PUBLIQUE DE MYSTERLLC PORTE LES MEMES CINQ ENTREES. Pour
// que la barre de travail ne s affiche pas par-dessus, /blog figure dans
// PAGES_PUBLIQUES_MYSTERLLC de components/NavBar.tsx.
//
// ⚠️ publie = true RESTE LE CRITERE D AFFICHAGE. La colonne publier_le ne
// se lit pas ici : c est le cron qui bascule publie a true quand la date
// arrive. Filtrer sur publier_le ferait doublon.
//
// ⚠️ TOUT TEXTE VISIBLE PAR UN TIERS EST ACCENTUE. Le code peut rester en
// ASCII, pas ce qui s affiche.
// ---------------------------------------------------------------------------

export const revalidate = 3600;

const SITE = "https://www.mysterllc.com";
const LEGAL = "https://academiapro.fr";

const OR = "#c8a96e";
const OR_PALE = "rgba(200,169,110,0.75)";
const NOIR = "#050508";

// ⚠️ VERIFIER LE NOM REEL AVANT DE LE CHANGER : le fichier s appelle
// IMG_4723.jpeg, il n a pas ete renomme.
const BANNIERE = "/IMG_4723.jpeg";

export const metadata = {
  title: "Blog — MysterLLC | Obligations américaines des LLC",
  description:
    "Form 5472, 1120 pro forma, BOI FinCEN, Annual Report : des articles"
    + " pour ceux qui administrent des LLC ou en possèdent une.",
  alternates: {
    canonical: SITE + "/blog",
  },
  // LES BALISES SOCIALES DOIVENT PARLER DE MYSTERLLC. Sans ces lignes,
  // celles du layout racine s appliquent — le HTML servi annoncerait
  // « AcadéMIA Pro, plateforme de formation » sur une page destinée aux
  // gestionnaires de sociétés américaines.
  openGraph: {
    title: "Blog — MysterLLC",
    description:
      "Form 5472, 1120 pro forma, BOI FinCEN, Annual Report : ce qu'il faut"
      + " savoir des obligations américaines des LLC.",
    url: SITE + "/blog",
    siteName: "MysterLLC",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Blog — MysterLLC",
    description:
      "Les obligations américaines des LLC, expliquées sans jargon.",
  },
};

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

export default async function BlogMysterLLC() {
  const supabase = clientLecture();
  const { data } = await supabase
    .from("blog")
    .select("id, titre, slug, extrait, contenu, categorie, created_at")
    .eq("publie", true)
    .eq("marque", "mysterllc")
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

      <main style={{ ...SECTION, paddingTop: "70px",
        paddingBottom: "90px" }}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px",
          margin: "0 0 18px" }}>
          MYSTERLLC — LE BLOG
        </p>
        <h1 style={{ fontSize: "38px", lineHeight: "1.25",
          margin: "0 0 18px", maxWidth: "760px" }}>
          Ce que l&apos;administration américaine attend de vous
        </h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "17px",
          lineHeight: "1.75", maxWidth: "680px", margin: "0 0 44px" }}>
          Form 5472, 1120 pro forma, Form 7004, BOI FinCEN, Annual Report.
          Des articles pour ceux qui administrent des LLC comme pour ceux
          qui en possèdent une.
        </p>

        {articles.length === 0 && (
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "16px" }}>
            Aucun article pour le moment.
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

      {/* ---- PIED ---- Pages legales sur academiapro.fr, en absolu : un
          lien relatif serait reecrit par le middleware vers /mysterllc/... */}
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
