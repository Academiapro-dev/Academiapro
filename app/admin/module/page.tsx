import { createClient } from "@supabase/supabase-js";
import ManuelDynamique from "../../../components/ManuelDynamique";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Next.js met en cache les appels reseau des pages serveur : on le lui interdit,
// sinon la page continue d afficher une version perimee du module.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    global: {
      fetch: function (url: any, options: any) {
        return fetch(url, { ...(options || {}), cache: "no-store" });
      },
    },
  }
);

function sections(contenu: string): { titre: string; texte: string }[] {
  const t = String(contenu || "");
  return t
    .split(/\n(?=## )/)
    .map(function (m: string) {
      const fin = m.indexOf("\n");
      const titre = m.slice(0, fin > 0 ? fin : m.length).replace(/^##\s*/, "").trim();
      const texte = fin > 0 ? m.slice(fin + 1).trim() : "";
      return { titre: titre, texte: texte };
    })
    .filter(function (s: any) { return s.titre; });
}

function nettoyer(l: string): string {
  return l.replace(/\*\*/g, "").replace(/`/g, "").trim();
}

// Convertit le texte en pages du lecteur : un bloc par page.
function enPages(contenu: string): any[] {
  const lignes = String(contenu || "").split("\n");
  const pages: any[] = [];
  let paragraphe: string[] = [];
  let liste: string[] = [];

  function viderParagraphe() {
    if (paragraphe.length) {
      const t = nettoyer(paragraphe.join(" "));
      if (t.length > 20) pages.push({ type: "paragraphe", contenu: t });
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

    if (/^[-*\u2022]\s+/.test(l) || /^\d+\.\s+/.test(l)) {
      viderParagraphe();
      const t = nettoyer(l.replace(/^[-*\u2022]\s+/, "").replace(/^\d+\.\s+/, ""));
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

export default async function LireModule({
  searchParams,
}: {
  searchParams: { code?: string; cible?: string; langue?: string; section?: string };
}) {
  const code = String(searchParams.code || "").trim().toUpperCase();
  const cible = String(searchParams.cible || "ch1_mod1").trim().toLowerCase();
  const langue = String(searchParams.langue || "fr").trim();
  const choisie = Number(searchParams.section || 0);

  if (!code) {
    return (
      <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", padding: "40px 20px", fontFamily: "Georgia, serif" }}>
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
  const pages = partie ? enPages(partie.texte) : [];

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
    <div style={{ background: "#f5f5f5" }}>
      <div style={{ background: "#050508", padding: "24px 20px", fontFamily: "Georgia, serif" }}>
        <div style={{ maxWidth: "820px", margin: "0 auto" }}>
          <h1 style={{ color: "#c8a96e", margin: "0 0 4px", fontSize: "22px" }}>
            {code} — {cible}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: "0 0 16px" }}>
            {contenu.length} caracteres, environ {Math.round(contenu.length / 3200)} pages,{" "}
            {parties.length} sections
          </p>

          {parties.map(function (s: any, i: number) {
            const actif = i === choisie;
            return (
              <a
                key={i}
                href={"/admin/module?code=" + code + "&cible=" + cible + "&langue=" + langue + "&section=" + i}
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
      </div>

      {partie && pages.length > 0 ? (
        <ManuelDynamique
          titre={partie.titre}
          formation={code + " — " + cible}
          apprenant="Lecture administrateur"
          pages={pages}
        />
      ) : (
        <div style={{ minHeight: "40vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif", color: "#555" }}>
          Aucun contenu pour la cle {cle}.
        </div>
      )}
    </div>
  );
}
