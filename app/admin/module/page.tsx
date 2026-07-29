import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export default async function LireModule({
  searchParams,
}: {
  searchParams: { code?: string; cible?: string; langue?: string };
}) {
  const code = String(searchParams.code || "").trim().toUpperCase();
  const cible = String(searchParams.cible || "ch1_mod1").trim().toLowerCase();
  const langue = String(searchParams.langue || "fr").trim();

  const cadre: any = {
    minHeight: "100vh",
    background: "#050508",
    color: "#fff",
    padding: "40px 20px",
    fontFamily: "Georgia, serif",
  };

  if (!code) {
    return (
      <div style={cadre}>
        <div style={{ maxWidth: "820px", margin: "0 auto" }}>
          <h1 style={{ color: "#c8a96e" }}>Lecture d un module</h1>
          <p style={{ color: "rgba(255,255,255,0.6)" }}>
            Ajoutez le code et la cible dans l adresse, par exemple :
            /admin/module?code=F028&amp;cible=ch1_mod1
          </p>
        </div>
      </div>
    );
  }

  const cle = code + "_" + cible.replace("_mod", "_mod") + "_" + langue;

  const { data } = await supabase
    .from("lms_cache")
    .select("contenu")
    .eq("cache_key", cle)
    .maybeSingle();

  const contenu = String((data && data.contenu) || "");

  return (
    <div style={cadre}>
      <div style={{ maxWidth: "820px", margin: "0 auto" }}>
        <h1 style={{ color: "#c8a96e", marginBottom: "4px" }}>
          {code} — {cible}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", marginTop: 0 }}>
          {contenu.length} caracteres, environ {Math.round(contenu.length / 3200)} pages
        </p>

        {contenu ? (
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              lineHeight: "1.7",
              fontFamily: "Georgia, serif",
              fontSize: "15px",
              color: "rgba(255,255,255,0.85)",
              background: "#12121e",
              border: "1px solid rgba(200,169,110,0.25)",
              borderRadius: "10px",
              padding: "24px",
            }}
          >
            {contenu}
          </pre>
        ) : (
          <p style={{ color: "#c8a96e" }}>
            Aucun contenu pour la cle {cle}.
          </p>
        )}
      </div>
    </div>
  );
}
