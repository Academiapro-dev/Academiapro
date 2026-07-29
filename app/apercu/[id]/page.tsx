import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CARACTERES_APERCU = 6000;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// On prend le debut du premier module, coupe proprement a la fin d une phrase,
// et on retire les marques de mise en forme du texte source.
function extraitLisible(contenu: string): string {
  let t = String(contenu || "");
  if (!t) return "";

  t = t
    .split("\n")
    .map(function (l: string) {
      return l.replace(/^\s*#{1,6}\s*/, "").replace(/\*\*/g, "").replace(/^\s*[-*]\s+/, "\u2022 ");
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (t.length <= CARACTERES_APERCU) return t;

  const coupe = t.slice(0, CARACTERES_APERCU);
  const point = coupe.lastIndexOf(". ");
  return (point > 2000 ? coupe.slice(0, point + 1) : coupe) + "\n\n[...]";
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

  const extrait = extraitLisible(String((ligne && ligne.contenu) || ""));

  const cadre: any = {
    minHeight: "100vh",
    background: "#050508",
    color: "#fff",
    fontFamily: "Georgia, serif",
    padding: "40px 20px",
  };

  if (!fiche) {
    return (
      <div style={cadre}>
        <div style={{ maxWidth: "820px", margin: "0 auto" }}>
          <h1 style={{ color: "#c8a96e" }}>Formation introuvable</h1>
          <a href="/formations" style={{ color: "#c8a96e" }}>Retour au catalogue</a>
        </div>
      </div>
    );
  }

  const premierModule = modules && modules.length > 0 ? modules[0].module_titre : "";

  return (
    <div style={cadre}>
      <div style={{ maxWidth: "820px", margin: "0 auto" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 8px" }}>
          APERCU DU MANUEL
        </p>
        <h1 style={{ color: "#fff", fontSize: "28px", margin: "0 0 6px" }}>{fiche.titre}</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginTop: 0 }}>
          {fiche.duree ? fiche.duree + " de formation" : ""}
          {modules && modules.length ? " \u00B7 " + modules.length + " modules" : ""}
        </p>

        {extrait ? (
          <div
            style={{
              background: "#12121e",
              border: "1px solid rgba(200,169,110,0.25)",
              borderRadius: "12px",
              padding: "28px",
              marginTop: "24px",
            }}
          >
            {premierModule && (
              <p style={{ color: "#c8a96e", fontSize: "13px", letterSpacing: "2px", margin: "0 0 18px" }}>
                MODULE 1 &mdash; {premierModule.toUpperCase()}
              </p>
            )}
            <div
              style={{
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                lineHeight: "1.85",
                fontSize: "16px",
                color: "rgba(255,255,255,0.88)",
              }}
            >
              {extrait}
            </div>
          </div>
        ) : (
          <p style={{ color: "rgba(255,255,255,0.6)", marginTop: "24px" }}>
            L apercu de cette formation sera disponible prochainement.
          </p>
        )}

        <div
          style={{
            marginTop: "28px",
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
  );
}
