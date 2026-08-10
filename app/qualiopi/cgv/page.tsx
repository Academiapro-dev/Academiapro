import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Conditions générales de vente — Mr. Qualiopi",
  description: "Les conditions applicables à la préparation à la certification Qualiopi.",
};

const VERT = "#3d9970";
const NOIR = "#050508";

// LE TEXTE VIT EN BASE, PAS DANS LE FICHIER.
//
// Des conditions de vente se corrigent : une adresse change, un article se
// precise, un avocat relit. Les enfermer dans le code obligerait a
// redeployer pour une virgule. En base, une requete suffit.
async function lireCgv(): Promise<string> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    const { data } = await supabase
      .from("textes_legaux")
      .select("contenu")
      .eq("cle", "cgv_qualiopi")
      .maybeSingle();

    return (data && data.contenu) || "";
  } catch (e) {
    return "";
  }
}

// Rendu simple du texte : titres, listes, gras. Pas de dependance
// supplementaire pour afficher un document de cinq mille caracteres.
function rendre(texte: string) {
  const lignes = String(texte).split("\n");
  const sortie: any[] = [];

  for (let i = 0; i < lignes.length; i = i + 1) {
    const l = lignes[i];
    const nu = l.trim();

    if (!nu) continue;

    if (nu.indexOf("# ") === 0 && nu.indexOf("## ") !== 0) {
      sortie.push(
        <h1 key={i} style={{ color: "#fff", fontSize: "30px", margin: "0 0 10px", lineHeight: "1.3" }}>
          {nu.slice(2)}
        </h1>
      );
      continue;
    }

    if (nu.indexOf("## ") === 0) {
      sortie.push(
        <h2 key={i} style={{ color: VERT, fontSize: "19px", margin: "36px 0 12px", lineHeight: "1.4" }}>
          {nu.slice(3)}
        </h2>
      );
      continue;
    }

    // Les passages en gras marquent ce qui engage : on ne les perd pas.
    const morceaux = nu.split("**");
    const contenu = morceaux.map(function (m: string, j: number) {
      return j % 2 === 1
        ? <strong key={j} style={{ color: "#fff" }}>{m}</strong>
        : <span key={j}>{m}</span>;
    });

    sortie.push(
      <p key={i} style={{ color: "rgba(255,255,255,0.72)", fontSize: "15.5px", lineHeight: "1.85", margin: "0 0 14px" }}>
        {contenu}
      </p>
    );
  }

  return sortie;
}

export default async function CgvQualiopi() {
  const texte = await lireCgv();

  const section: any = { maxWidth: "820px", margin: "0 auto", padding: "0 24px" };

  return (
    <div style={{ minHeight: "100vh", background: NOIR, color: "#fff", fontFamily: "Georgia, serif" }}>

      <header style={{ borderBottom: "1px solid rgba(61,153,112,0.2)", padding: "22px 0" }}>
        <div style={{ ...section, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <Link href="/qualiopi" style={{ color: VERT, fontSize: "21px", fontWeight: "bold", textDecoration: "none" }}>
            Mr. Qualiopi
          </Link>
          <Link href="/qualiopi" style={{ color: "rgba(255,255,255,0.65)", fontSize: "15px", textDecoration: "none" }}>
            ← Retour
          </Link>
        </div>
      </header>

      <div style={{ ...section, paddingTop: "60px", paddingBottom: "90px" }}>
        {texte ? rendre(texte) : (
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: "1.8" }}>
            Les conditions générales ne sont pas disponibles pour le moment. Écrivez-nous
            à contact@academiapro.fr et nous vous les adressons.
          </p>
        )}
      </div>

      <footer style={{ borderTop: "1px solid rgba(61,153,112,0.2)", padding: "30px 0" }}>
        <div style={section}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13.5px", lineHeight: "1.8", margin: 0 }}>
            AcadéMIA Pro LLC · 30 N Gould St, STE R, Sheridan WY 82801, États-Unis ·
            contact@academiapro.fr
          </p>
        </div>
      </footer>

    </div>
  );
}
