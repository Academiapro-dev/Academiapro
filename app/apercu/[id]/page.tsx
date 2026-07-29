import { createClient } from "@supabase/supabase-js";
import ManuelDynamique from "../../../components/ManuelDynamique";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CARACTERES_APERCU = 6000;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function nettoyer(l: string): string {
  return l.replace(/\*\*/g, "").replace(/`/g, "").trim();
}

// Convertit le texte du module en pages du lecteur : un bloc par page.
function enPages(contenu: string): any[] {
  const brut = String(contenu || "");
  if (!brut) return [];

  const extrait = brut.length > CARACTERES_APERCU ? brut.slice(0, CARACTERES_APERCU) : brut;
  const lignes = extrait.split("\n");

  const pages: any[] = [];
  let paragraphe: string[] = [];
  let liste: string[] = [];

  function viderParagraphe() {
    if (paragraphe.length) {
      const t = nettoyer(paragraphe.join(" "));
      if (t.length > 40) pages.push({ type: "paragraphe", contenu: t });
      paragraphe = [];
    }
  }

  function viderListe() {
    if (liste.length) {
      pages.push({ type: "liste", contenu: liste.join("\n") });
      liste = [];
    }
  }

  for (const ligne of lignes) {
    const l = ligne.trim();

    if (!l) {
      viderParagraphe();
      viderListe();
      continue;
    }

    if (/^#{1,6}\s+/.test(l)) {
      viderParagraphe();
      viderListe();
      const t = nettoyer(l.replace(/^#{1,6}\s+/, ""));
      if (t) pages.push({ type: "titre_section", contenu: t });
      continue;
    }

    if (/^[-*\u2022]\s+/.test(l)) {
      viderParagraphe();
      const t = nettoyer(l.replace(/^[-*\u2022]\s+/, ""));
      if (t) liste.push(t);
      continue;
    }

    viderListe();
    paragraphe.push(l);
  }

  viderParagraphe();
  viderListe();

  return pages;
}

export default async function Apercu({ params }: { params: { id: string } }) {
  const code = String(params.id || "").trim().toUpperCase();

  const { data: fiche } = await supabase
    .from("formations")
    .select("code, titre, duree, prix")
    .eq("code", code)
    .maybeSingle();

  const { data: modules } = await supabase
    .from("lms_plans")
    .select("module_num, module_titre")
    .eq("formation_code", code)
    .gt("chapitre_num", 0)
    .order("chapitre_num", { ascending: true })
    .order("module_num", { ascending: true });

  const { data: ligne } = await supabase
    .from("lms_cache")
    .select("contenu")
    .eq("cache_key", code + "_ch1_mod1_fr")
    .maybeSingle();

  const pages = enPages(String((ligne && ligne.contenu) || ""));

  if (!fiche) {
    return (
      <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", padding: "40px 20px", fontFamily: "Georgia, serif" }}>
        <div style={{ maxWidth: "820px", margin: "0 auto" }}>
          <h1 style={{ color: "#c8a96e" }}>Formation introuvable</h1>
          <a href="/formations" style={{ color: "#c8a96e" }}>Retour au catalogue</a>
        </div>
      </div>
    );
  }

  const premierModule = modules && modules.length > 0 ? modules[0].module_titre : "Module 1";

  return (
    <div style={{ background: "#f5f5f5" }}>
      {pages.length > 0 ? (
        <ManuelDynamique
          titre={premierModule}
          formation={fiche.titre}
          apprenant="Apercu gratuit"
          pages={pages}
        />
      ) : (
        <div style={{ minHeight: "50vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: "#555" }}>
          L apercu de cette formation sera disponible prochainement.
        </div>
      )}

      <div style={{ background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
        <div style={{ maxWidth: "820px", margin: "0 auto" }}>
          <div
            style={{
              padding: "24px",
              background: "rgba(200,169,110,0.08)",
              border: "1px solid rgba(200,169,110,0.3)",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <p style={{ color: "rgba(255,255,255,0.75)", margin: "0 0 16px" }}>
              Ceci est le debut du premier module. Le manuel complet couvre les{" "}
              {modules && modules.length ? modules.length : ""} modules de la formation,
              avec exercices corriges, QCM et examen final.
            </p>
            <a
              href={"/formation/" + code.toLowerCase()}
              style={{
                display: "inline-block",
                background: "#c8a96e",
                color: "#050508",
                padding: "14px 32px",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "bold",
              }}
            >
              Retour a la formation
            </a>
          </div>

          {modules && modules.length > 0 && (
            <div style={{ marginTop: "32px" }}>
              <h2 style={{ color: "#c8a96e", fontSize: "18px" }}>Sommaire du manuel</h2>
              {modules.map(function (m: any, i: number) {
                return (
                  <div
                    key={i}
                    style={{
                      padding: "10px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "14px",
                    }}
                  >
                    <span style={{ color: "#c8a96e", marginRight: "10px" }}>{i + 1}.</span>
                    {m.module_titre}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
