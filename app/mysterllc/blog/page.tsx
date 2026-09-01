import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// LE BLOG MYSTERLLC — 01/09.
//
// Meme mecanisme que les deux blogs existants : une seule table `blog`,
// separee par la colonne `marque`. Ici « mysterllc ». Les articles
// d AcadeMIA Pro et de Mr. Comptable ne paraissent jamais ici, et
// reciproquement.
//
// 🚨 LA CANONIQUE EST ABSOLUE ET SANS PREFIXE. Le middleware sert cette
// page sous mysterllc.com/blog : c est cette adresse-la que le visiteur
// voit et que le sitemap doit declarer. L absolu est indispensable —
// metadataBase pointe sur academiapro.fr, donc une canonique relative se
// resoudrait vers le mauvais domaine.
//
// 🚨 LES LIENS DES ARTICLES SONT ABSOLUS EUX AUSSI. C est la lecon du
// 17/08 sur Mr. Comptable : des liens relatifs rendaient chaque article
// atteignable a DEUX adresses, et Google signalait « page en double sans
// URL canonique selectionnee ». Le lien absolu garantit que l article
// s ouvre toujours sur mysterllc.com, quel que soit le point d entree.
//
// ⚠️ CONSEQUENCE CONNUE : ces liens ne passent plus par le routeur interne
// de Next.js, donc chaque clic recharge la page. Sur un blog de quelques
// articles c est sans effet visible, et la coherence des adresses vaut
// largement cette milliseconde.
//
// ⚠️ publie = true RESTE LE CRITERE D AFFICHAGE. La colonne publier_le ne
// se lit pas ici : c est le cron qui bascule publie a true quand la date
// arrive. Filtrer sur publier_le ferait doublon.
//
// ⚠️ TOUT TEXTE VISIBLE PAR UN TIERS EST ACCENTUE. Le code peut rester en
// ASCII, pas ce qui s affiche — c est ce qui apparait dans Google et dans
// l onglet du navigateur.
// ---------------------------------------------------------------------------

export const revalidate = 3600;

const SITE = "https://mysterllc.com";

const OR = "#c8a96e";
const NOIR = "#050508";

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

  const section: any = {
    maxWidth: "1080px",
    margin: "0 auto",
    padding: "0 24px",
  };

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
    <main style={{ minHeight: "100vh", background: NOIR, color: "#fff",
      fontFamily: "Georgia, serif", paddingTop: "70px",
      paddingBottom: "90px" }}>

      <div style={section}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px",
          margin: "0 0 18px" }}>
          MYSTERLLC
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
      </div>
    </main>
  );
}
