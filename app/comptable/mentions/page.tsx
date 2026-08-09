import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Mentions légales — Mr. Comptable",
};

const OR = "#c8a96e";
const NOIR = "#050508";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Meme mecanique que les CGV : le texte vit en base, une correction se fait
// par SQL sans redeploiement.
export default async function MentionsComptable() {
  const { data } = await supabase
    .from("textes_legaux")
    .select("titre, contenu, maj_le")
    .eq("cle", "mentions_comptable")
    .maybeSingle();

  const contenu = (data && data.contenu) || "";
  const maj = data && data.maj_le
    ? new Date(data.maj_le).toLocaleDateString("fr-FR")
    : null;

  const lignes = contenu.split("\n");
  const blocs: any[] = [];
  let paragraphe: string[] = [];

  function viderParagraphe(cle: string) {
    if (paragraphe.length > 0) {
      blocs.push({ type: "p", texte: paragraphe.join(" "), cle: cle });
      paragraphe = [];
    }
  }

  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i].trim();
    if (l.length === 0) {
      viderParagraphe("p" + i);
      continue;
    }
    if (l.indexOf("## ") === 0) {
      viderParagraphe("p" + i);
      blocs.push({ type: "h2", texte: l.slice(3), cle: "h" + i });
      continue;
    }
    if (l.indexOf("# ") === 0) {
      viderParagraphe("p" + i);
      blocs.push({ type: "h1", texte: l.slice(2), cle: "h" + i });
      continue;
    }
    paragraphe.push(l);
  }
  viderParagraphe("fin");

  return (
    <div style={{ minHeight: "100vh", background: NOIR, color: "#fff", fontFamily: "Georgia, serif" }}>

      <header style={{ borderBottom: "1px solid rgba(200,169,110,0.15)", padding: "22px 0" }}>
        <div style={{ maxWidth: "820px", margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <a href="/comptable" style={{ color: OR, fontSize: "21px", fontWeight: "bold", textDecoration: "none" }}>
            Mr. Comptable
          </a>
          <a href="/comptable" style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", textDecoration: "none" }}>
            ← Retour
          </a>
        </div>
      </header>

      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "56px 24px 90px" }}>

        {contenu.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px" }}>
            Ce document n'est pas disponible pour le moment. Écrivez-nous à
            contact@mrcomptable.fr et nous vous le transmettons.
          </p>
        ) : (
          <>
            {maj && (
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "0 0 32px" }}>
                Dernière mise à jour : {maj}
              </p>
            )}

            {blocs.map((b) => {
              if (b.type === "h1") {
                return (
                  <h1 key={b.cle} style={{ color: "#fff", fontSize: "30px", lineHeight: "1.35", margin: "0 0 28px" }}>
                    {b.texte}
                  </h1>
                );
              }
              if (b.type === "h2") {
                return (
                  <h2 key={b.cle} style={{ color: OR, fontSize: "19px", margin: "38px 0 14px" }}>
                    {b.texte}
                  </h2>
                );
              }
              return (
                <p key={b.cle} style={{ color: "rgba(255,255,255,0.72)", fontSize: "16px", lineHeight: "1.85", margin: "0 0 16px" }}>
                  {b.texte}
                </p>
              );
            })}
          </>
        )}

      </div>

      <footer style={{ borderTop: "1px solid rgba(200,169,110,0.15)", padding: "30px 0" }}>
        <div style={{ maxWidth: "820px", margin: "0 auto", padding: "0 24px" }}>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", lineHeight: "1.8", margin: 0 }}>
            Mr. Comptable — une marque d'AcadéMIA Pro LLC<br />
            30 N Gould St, STE R, Sheridan WY 82801, États-Unis<br />
            contact@mrcomptable.fr
          </p>
          <p style={{ margin: "16px 0 0" }}>
            <a href="/comptable/cgv" style={{ color: OR, fontSize: "14px" }}>
              Conditions générales de vente
            </a>
          </p>
        </div>
      </footer>

    </div>
  );
}
