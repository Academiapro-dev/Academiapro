import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function sections(contenu: string): { titre: string; texte: string }[] {
  const t = String(contenu || "");
  const morceaux = t.split(/\n(?=## )/);
  return morceaux
    .map(function (m: string) {
      const fin = m.indexOf("\n");
      const titre = m.slice(0, fin > 0 ? fin : m.length).replace(/^##\s*/, "").trim();
      const texte = fin > 0 ? m.slice(fin + 1).trim() : "";
      return { titre: titre, texte: texte };
    })
    .filter(function (s: any) { return s.titre; });
}

export default async function LireModule({
  searchParams,
}: {
  searchParams: { code?: string; cible?: string; langue?: string; section?: string };
}) {
  const code = String(searchParams.code || "").trim().toUpperCase();
  const cible = String(searchParams.cible || "ch1_mod1").trim().toLowerCase();
  const langue = String(searchParams.langue || "fr").trim();
  const choisie = Number(searchParams.section || 0);

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
            Exemple : /admin/module?code=F028&amp;cible=ch1_mod2
          </p>
        </div>
      </div>
    );
  }

  const cle = code + "_" + cible + "_" + langue;

  const { data } = await supabase
    .from("lms_cache")
    .select("contenu")
    .eq("cache_key", cle)
    .maybeSingle();

  const contenu = String((data && data.contenu) || "");
  const parties = sections(contenu);
  const partie = parties[choisie] || parties[0];

  const bouton: any = {
    display: "inline-block",
    padding: "8px 14px",
    margin: "0 8px 8px 0",
    borderRadius: "20px",
    fontSize: "13px",
    textDecoration: "none",
    border: "1px solid rgba(200,169,110,0.4)",
  };

  return (
    <div style={cadre}>
      <div style={{ maxWidth: "820px", margin: "0 auto" }}>
        <h1 style={{ color: "#c8a96e", marginBottom: "4px" }}>
          {code} — {cible}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", marginTop: 0 }}>
          {contenu.length} caracteres, environ {Math.round(contenu.length / 3200)} pages,{" "}
          {parties.length} sections
        </p>

        {parties.length > 0 && (
          <div style={{ margin: "20px 0 24px" }}>
            {parties.map(function (s: any, i: number) {
              const actif = i === choisie || (!searchParams.section && i === 0);
              return (
                <a
                  key={i}
                  href={
                    "/admin/module?code=" + code + "&cible=" + cible + "&langue=" + langue + "&section=" + i
                  }
                  style={{
                    ...bouton,
                    background: actif ? "#c8a96e" : "transparent",
                    color: actif ? "#050508" : "#c8a96e",
                    fontWeight: actif ? "bold" : "normal",
                  }}
                >
                  {s.titre}
                </a>
              );
            })}
          </div>
        )}

        {partie ? (
          <div>
            <h2 style={{ color: "#c8a96e", fontSize: "20px" }}>{partie.titre}</h2>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                lineHeight: "1.75",
                fontFamily: "Georgia, serif",
                fontSize: "15px",
                color: "rgba(255,255,255,0.88)",
                background: "#12121e",
                border: "1px solid rgba(200,169,110,0.25)",
                borderRadius: "10px",
                padding: "24px",
              }}
            >
              {partie.texte}
            </pre>
          </div>
        ) : (
          <p style={{ color: "#c8a96e" }}>Aucun contenu pour la cle {cle}.</p>
        )}
      </div>
    </div>
  );
}
