import React from "react";

export const metadata = {
  title: "Conditions Générales de Vente et d'Utilisation — AcadémIA Pro",
  description: "CGVU d'AcadémIA Pro — version 2.0 incluant la Classe Virtuelle et les Forfaits d'Intensité.",
};

export const dynamic = "force-dynamic";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Le texte des CGV n est plus ecrit dans le code : il vit dans la table
// textes_legaux. Toute correction se fait en base, sans redeploiement.
async function texteCGV(): Promise<string> {
  try {
    const r = await fetch(
      SB_URL + "/rest/v1/textes_legaux?cle=eq.cgv&select=contenu&limit=1",
      {
        headers: { apikey: KEY, Authorization: "Bearer " + KEY },
        cache: "no-store",
      }
    );
    if (!r.ok) return "";
    const j = await r.json();
    return Array.isArray(j) && j.length > 0 ? String(j[0].contenu || "") : "";
  } catch (e) {
    return "";
  }
}

export default async function PageCGV() {
  const html = await texteCGV();

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "48px 20px 80px",
        lineHeight: 1.7,
        fontSize: 16,
      }}
    >
      <style>{`
        .cgv h1 { font-size: 1.9rem; margin: 1.2em 0 .6em; }
        .cgv h2 { font-size: 1.35rem; margin: 2em 0 .6em; border-bottom: 1px solid rgba(128,128,128,.35); padding-bottom: .3em; }
        .cgv h3 { font-size: 1.1rem; margin: 1.4em 0 .4em; }
        .cgv table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: .95em; }
        .cgv th, .cgv td { border: 1px solid rgba(128,128,128,.4); padding: 8px 10px; text-align: left; vertical-align: top; }
        .cgv blockquote { border-left: 4px solid #c9a227; margin: 1.2em 0; padding: .6em 1em; background: rgba(201,162,39,.08); }
        .cgv hr { border: none; border-top: 1px solid rgba(128,128,128,.35); margin: 2em 0; }
        .cgv ul, .cgv ol { padding-left: 1.4em; }
        .cgv li { margin: .3em 0; }
        .cgv a { color: #c9a227; }
      `}</style>

      {html ? (
        <div className="cgv" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p>Les conditions générales sont momentanément indisponibles. Merci de réessayer dans quelques instants ou d écrire à contact@academiapro.fr.</p>
      )}

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid rgba(128,128,128,.35)", fontSize: 14 }}>
        <p style={{ fontWeight: "bold", marginBottom: 8 }}>Documents complementaires :</p>
        <ul style={{ paddingLeft: "1.4em", lineHeight: 1.9 }}>
          <li><a href="/cgv-prevente" style={{ color: "#c9a227" }}>Avenant &mdash; Conditions Speciales Prevente</a></li>
          <li><a href="/cgv-annexe" style={{ color: "#c9a227" }}>Annexe &mdash; Marques, Propriete Intellectuelle et TVA</a></li>
          <li><a href="/politique-confidentialite" style={{ color: "#c9a227" }}>Politique de Confidentialite</a></li>
          <li><a href="/mentions-legales" style={{ color: "#c9a227" }}>Mentions Legales</a></li>
        </ul>
      </div>
    </main>
  );
}
