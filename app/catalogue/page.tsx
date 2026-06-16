"use client";
import { useState, useEffect } from "react";

const T: Record<string, Record<string, string>> = {
  fr: {
    titre: "Catalogue AcadémIA Pro",
    rechercher: "Rechercher une formation...",
    resultats: "résultats",
    chargement: "Chargement...",
    aucune: "Aucune formation trouvée",
    formations: "formations disponibles",
    tous: "Tous",
  },
  en: {
    titre: "AcadémIA Pro Catalog",
    rechercher: "Search for a course...",
    resultats: "results",
    chargement: "Loading...",
    aucune: "No course found",
    formations: "courses available",
    tous: "All",
  },
  es: {
    titre: "Catálogo AcadémIA Pro",
    rechercher: "Buscar un curso...",
    resultats: "resultados",
    chargement: "Cargando...",
    aucune: "No se encontró ningún curso",
    formations: "cursos disponibles",
    tous: "Todos",
  },
  ar: {
    titre: "كتالوج AcadémIA Pro",
    rechercher: "ابحث عن دورة...",
    resultats: "نتائج",
    chargement: "جار التحميل...",
    aucune: "لم يتم العثور على دورة",
    formations: "دورات متاحة",
    tous: "الكل",
  },
  he: {
    titre: "קטלוג AcadémIA Pro",
    rechercher: "חפש קורס...",
    resultats: "תוצאות",
    chargement: "טוען...",
    aucune: "לא נמצא קורס",
    formations: "קורסים זמינים",
    tous: "הכל",
  },
};


function TitreFormation({ titre, code, langue, style }: { titre: string; code: string; langue: string; style?: any }) {
  const [titreAffiche, setTitreAffiche] = useState(titre);

  useEffect(() => {
    if (langue === "fr") {
      setTitreAffiche(titre);
      return;
    }
    const cacheKey = `${langue}:${code}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setTitreAffiche(cached);
      return;
    }
    fetch("/api/traduire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texte: titre, langue_cible: langue }),
    })
    .then(r => r.json())
    .then(data => {
      const t = data.traduction || titre;
      sessionStorage.setItem(cacheKey, t);
      setTitreAffiche(t);
    })
    .catch(() => setTitreAffiche(titre));
  }, [titre, code, langue]);

  if (style) return <span style={style}>{titreAffiche}</span>;
  return <span style={{ color: "#fff", fontSize: "14px", flex: 1 }}>{titreAffiche}</span>;
}

export default function CataloguePage() {
  const [formations, setFormations] = useState<any[]>([]);
  const [vueGrille, setVueGrille] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [domaine, setDomaine] = useState("Tous");
  const [loading, setLoading] = useState(true);
  const [langue, setLangue] = useState(() => typeof window !== "undefined" ? localStorage.getItem("langue") || "fr" : "fr");

  useEffect(() => {

    fetch("/api/catalogue")
      .then(r => r.json())
      .then(data => {
        setFormations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);


  const [titresCache, setTitresCache] = useState<Record<string, string>>({});

  async function traduireTitre(titre: string, code: string): Promise<string> {
    if (langue === "fr") return titre;
    const cacheKey = `${langue}:${code}`;
    if (titresCache[cacheKey]) return titresCache[cacheKey];
    try {
      const res = await fetch("/api/traduire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texte: titre, langue_cible: langue }),
      });
      const data = await res.json();
      const traduction = data.traduction || titre;
      setTitresCache(prev => ({ ...prev, [cacheKey]: traduction }));
      return traduction;
    } catch {
      return titre;
    }
  }

  const t = (cle: string) => T[langue]?.[cle] || T["fr"][cle] || cle;

  const domaines = [t("tous"), ...Array.from(new Set(formations.map((f: any) => f.domaine).filter(Boolean))) as string[]];

  const filtrees = formations.filter((f: any) => {
    const matchR = !recherche || f.titre?.toLowerCase().includes(recherche.toLowerCase()) || f.code?.toLowerCase().includes(recherche.toLowerCase());
    const matchD = domaine === t("tous") || domaine === "Tous" || f.domaine === domaine;
    return matchR && matchD;
  });

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "50px 40px", textAlign: "center" }}>
        <h1 style={{ color: "#c8a96e", fontFamily: "Georgia,serif", fontSize: "2.2rem", marginBottom: "10px" }}>
          {t("titre")}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.6)" }}>
          {loading ? t("chargement") : `${formations.length} ${t("formations")}`}
        </p>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "25px 20px" }}>
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          <input type="text" placeholder={t("rechercher")} value={recherche}
            onChange={e => setRecherche(e.target.value)}
            style={{ flex: 1, minWidth: "200px", padding: "10px 15px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px" }} />
          <select value={domaine} onChange={e => setDomaine(e.target.value)}
            style={{ padding: "10px 15px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "#1a1a2e", color: "#fff" }}>
            {domaines.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button onClick={() => setVueGrille(false)}
            style={{ padding: "10px 14px", borderRadius: "8px", border: "none", background: !vueGrille ? "#c8a96e" : "rgba(255,255,255,0.08)", color: !vueGrille ? "#050508" : "#fff", cursor: "pointer", fontSize: "16px" }}>☰</button>
          <button onClick={() => setVueGrille(true)}
            style={{ padding: "10px 14px", borderRadius: "8px", border: "none", background: vueGrille ? "#c8a96e" : "rgba(255,255,255,0.08)", color: vueGrille ? "#050508" : "#fff", cursor: "pointer", fontSize: "16px" }}>⊞</button>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>{filtrees.length} {t("resultats")}</span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px", color: "#c8a96e", fontSize: "18px" }}>{t("chargement")}</div>
        ) : filtrees.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px", color: "rgba(255,255,255,0.4)" }}>{t("aucune")}</div>
        ) : vueGrille ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {filtrees.map((f: any) => (
              <a key={f.code} href={`/formation/${f.code}`} style={{ textDecoration: "none" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "20px" }}>
                  <div style={{ color: "#c8a96e", fontSize: "11px", marginBottom: "8px" }}>{f.code} · {f.domaine}</div>
                  <TitreFormation titre={f.titre} code={f.code} langue={langue} style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: "15px", margin: "0 0 12px", lineHeight: "1.4", display: "block" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{f.duree}</span>
                    {f.prix && <span style={{ background: "#c8a96e", color: "#050508", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>{f.prix}€</span>}
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {filtrees.map((f: any) => (
              <a key={f.code} href={`/formation/${f.code}`} style={{ textDecoration: "none" }}>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.1)", borderRadius: "8px", padding: "11px 18px", display: "flex", alignItems: "center", gap: "15px" }}>
                  <span style={{ color: "#c8a96e", fontSize: "11px", fontWeight: "bold", minWidth: "55px", fontFamily: "monospace" }}>{f.code}</span>
                  <TitreFormation titre={f.titre} code={f.code} langue={langue} />
                  <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", minWidth: "80px", textAlign: "right" }}>{f.domaine}</span>
                  {f.duree && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", minWidth: "35px", textAlign: "right" }}>{f.duree}</span>}
                  {f.prix && <span style={{ color: "#c8a96e", fontSize: "13px", fontWeight: "bold", minWidth: "55px", textAlign: "right" }}>{f.prix}€</span>}
                  <span style={{ color: "rgba(200,169,110,0.5)" }}>→</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
