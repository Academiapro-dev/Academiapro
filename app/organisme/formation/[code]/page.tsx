"use client";
import { useState, useEffect } from "react";

const CARACTERES_PAR_PAGE = 2500;

function propre(t: any) {
  return String(t || "").replace(/\*\*/g, "").replace(/`/g, "").trim();
}

export default function LecteurCoursPropre({ params }: { params: { code: string } }) {
  const code = (params.code || "").toUpperCase();

  const [cours, setCours] = useState<any>(null);
  const [chapitres, setChapitres] = useState<any[]>([]);
  const [chapitreActif, setChapitreActif] = useState(1);
  const [moduleActif, setModuleActif] = useState(1);
  const [contenu, setContenu] = useState("");
  const [pageModule, setPageModule] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [chargementModule, setChargementModule] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    charger(1, 1);
  }, []);

  function suffixe() {
    try {
      const t = new URLSearchParams(window.location.search).get("tenant");
      return t ? "&tenant=" + t : "";
    } catch {
      return "";
    }
  }

  async function charger(ch: number, mo: number) {
    setChargementModule(true);
    setErreur("");
    try {
      const r = await fetch(
        "/api/organisme/lire?code=" + code + "&chapitre=" + ch + "&module=" + mo + suffixe()
      );
      const data = await r.json();
      if (data.ok) {
        setCours(data.cours);
        setChapitres(data.chapitres || []);
        setContenu(data.contenu || "");
        setPageModule(0);
      } else {
        setErreur(data.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargementModule(false);
    setChargement(false);
  }

  function ouvrir(ch: number, mo: number) {
    setChapitreActif(ch);
    setModuleActif(mo);
    charger(ch, mo);
  }

  const pages = (function () {
    const lignes = String(contenu || "")
      .split("\n")
      .filter(function (l) { return l.trim() && l.trim() !== "---"; });
    const resultat: string[] = [];
    let bloc: string[] = [];
    let taille = 0;
    for (const ligne of lignes) {
      bloc.push(ligne);
      taille = taille + ligne.length;
      if (taille >= CARACTERES_PAR_PAGE && !/^#{1,6}\s/.test(ligne.trim())) {
        resultat.push(bloc.join("\n"));
        bloc = [];
        taille = 0;
      }
    }
    if (bloc.length > 0) resultat.push(bloc.join("\n"));
    return resultat.length > 0 ? resultat : [String(contenu || "")];
  })();

  const totalPages = pages.length;
  const pageCourante = pages[pageModule] || pages[0] || "";

  const CADRE: any = {
    minHeight: "100vh",
    background: "#050508",
    color: "#fff",
    fontFamily: "Georgia, serif",
  };

  const styleNav = (actif: boolean) => ({
    background: actif ? "#c8a96e" : "#eee",
    color: actif ? "#050508" : "#999",
    border: "none",
    borderRadius: "6px",
    padding: "8px 20px",
    cursor: actif ? "pointer" : "default",
    fontWeight: "bold",
  });

  if (chargement) {
    return (
      <div style={{ ...CADRE, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#c8a96e", fontSize: "18px" }}>Chargement...</p>
      </div>
    );
  }

  if (erreur && !cours) {
    return (
      <div style={{ ...CADRE, padding: "44px 20px" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h1 style={{ color: "#c8a96e", fontSize: "24px" }}>Formation indisponible</h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px", lineHeight: "1.7" }}>{erreur}</p>
          <a href="/organisme" style={{ color: "#c8a96e" }}>Retour au tableau de bord</a>
        </div>
      </div>
    );
  }

  return (
    <div style={CADRE}>
      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "20px 30px", borderBottom: "2px solid rgba(200,169,110,0.3)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 2px" }}>
            {cours ? cours.code : ""}{cours && cours.domaine ? " · " + cours.domaine : ""}
            {cours && cours.duree ? " · " + cours.duree + " h" : ""}
          </p>
          <h1 style={{ color: "#fff", fontSize: "21px", margin: 0 }}>{cours ? cours.titre : code}</h1>
        </div>
      </div>

      {cours && !cours.publie && (
        <div style={{ maxWidth: "1200px", margin: "16px auto 0", padding: "12px 18px", background: "rgba(232,163,61,0.12)", border: "1px solid rgba(232,163,61,0.4)", borderRadius: "8px", color: "#e8c887", fontSize: "13px" }}>
          Cette formation est encore un brouillon. Vos stagiaires ne la voient pas.
        </div>
      )}

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px", display: "grid", gridTemplateColumns: "280px 1fr", gap: "20px" }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,169,110,0.2)", borderRadius: "12px", padding: "15px", height: "fit-content" }}>
          <h3 style={{ color: "#c8a96e", margin: "0 0 15px", fontSize: "14px" }}>Programme</h3>

          {chapitres.map(function (ch: any) {
            return (
              <div key={ch.numero} style={{ marginBottom: "10px" }}>
                <p style={{ color: "#c8a96e", fontSize: "12px", fontWeight: "bold", margin: "0 0 5px" }}>
                  Ch.{ch.numero} {ch.titre}
                </p>
                {(ch.modules || []).map(function (mod: any) {
                  const actif = chapitreActif === ch.numero && moduleActif === mod.numero;
                  const icone = mod.type === "theorie" ? "📖" : mod.type === "pratique" ? "🛠️" : "📝";
                  return (
                    <div
                      key={mod.numero}
                      onClick={() => ouvrir(ch.numero, mod.numero)}
                      style={{ padding: "8px 10px", marginBottom: "4px", borderRadius: "6px", cursor: "pointer", background: actif ? "rgba(200,169,110,0.2)" : "transparent", border: actif ? "1px solid rgba(200,169,110,0.4)" : "1px solid transparent", display: "flex", alignItems: "center", gap: "8px" }}
                    >
                      <span>{mod.redige ? "•" : "○"}</span>
                      <span style={{ color: actif ? "#c8a96e" : "rgba(255,255,255,0.6)", fontSize: "11px" }}>
                        {icone} {ch.numero}.{mod.numero} {mod.titre}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div style={{ background: "#ffffff", borderRadius: "12px", padding: "40px 45px", boxShadow: "0 4px 30px rgba(0,0,0,0.4)", minHeight: "420px" }}>
          {chargementModule ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ color: "#c8a96e", fontSize: "16px" }}>Chargement du module...</p>
            </div>
          ) : !contenu ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#999", fontSize: "16px", lineHeight: "1.7" }}>
              Ce module n a pas encore ete redige.
            </div>
          ) : (
            <div>
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                  <button onClick={() => setPageModule(function (p) { return Math.max(0, p - 1); })} disabled={pageModule === 0} style={styleNav(pageModule > 0)}>← Précédent</button>
                  <span style={{ color: "#c8a96e", fontWeight: "bold", fontSize: "13px" }}>Page {pageModule + 1} / {totalPages}</span>
                  <button onClick={() => setPageModule(function (p) { return Math.min(totalPages - 1, p + 1); })} disabled={pageModule === totalPages - 1} style={styleNav(pageModule < totalPages - 1)}>Suivant →</button>
                </div>
              )}

              {pageCourante.split("\n").filter(function (l) { return l.trim(); }).map(function (ligne, i) {
                const l = ligne.trim();
                if (/^#{1,6}\s/.test(l)) {
                  const texte = l.replace(/^#{1,6}\s+/, "");
                  const niveau = (l.match(/^(#{1,6})/) || ["", ""])[1].length;
                  if (niveau <= 2) {
                    return <h2 key={i} style={{ color: "#c8a96e", fontSize: "22px", margin: "20px 0 10px" }}>{texte}</h2>;
                  }
                  return <h3 key={i} style={{ color: "#333", fontSize: "18px", margin: "15px 0 8px", fontWeight: "bold" }}>{texte}</h3>;
                }
                if (l === "---") return <hr key={i} style={{ border: "none", borderTop: "1px solid #ddd", margin: "16px 0" }} />;
                if (l.startsWith("> ")) {
                  return <blockquote key={i} style={{ borderLeft: "4px solid #c8a96e", paddingLeft: "16px", margin: "16px 0", color: "#555", fontStyle: "italic", fontSize: "18px" }}>{propre(l.replace(/^> /, ""))}</blockquote>;
                }
                if (/^[-*]\s+/.test(l)) {
                  return <p key={i} style={{ color: "#1a1a1a", fontSize: "18px", lineHeight: "1.8", margin: "0 0 10px 22px" }}>• {propre(l.replace(/^[-*]\s+/, ""))}</p>;
                }
                return <p key={i} style={{ color: "#1a1a1a", fontSize: "18px", lineHeight: "1.85", marginBottom: "16px", textAlign: "justify" }}>{propre(l)}</p>;
              })}

              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "30px", padding: "15px 0", borderTop: "1px solid #eee" }}>
                  <button onClick={() => setPageModule(function (p) { return Math.max(0, p - 1); })} disabled={pageModule === 0} style={styleNav(pageModule > 0)}>← Précédent</button>
                  <span style={{ color: "#999", fontSize: "13px" }}>Page {pageModule + 1} / {totalPages}</span>
                  <button onClick={() => setPageModule(function (p) { return Math.min(totalPages - 1, p + 1); })} disabled={pageModule === totalPages - 1} style={styleNav(pageModule < totalPages - 1)}>Suivant →</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
