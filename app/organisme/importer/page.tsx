"use client";
import { useState } from "react";

export default function PageImporter() {
  const [contenu, setContenu] = useState("");
  const [nomFichier, setNomFichier] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [resultat, setResultat] = useState<any>(null);
  const [erreur, setErreur] = useState("");

  function suffixe() {
    try {
      const t = new URLSearchParams(window.location.search).get("tenant");
      return t ? "?tenant=" + t : "";
    } catch {
      return "";
    }
  }

  function lireFichier(e: any) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setNomFichier(f.name);
    setErreur("");
    setResultat(null);
    const lecteur = new FileReader();
    lecteur.onload = function () {
      setContenu(String(lecteur.result || ""));
    };
    lecteur.onerror = function () {
      setErreur("Fichier illisible.");
    };
    lecteur.readAsText(f, "UTF-8");
  }

  async function importer() {
    if (contenu.trim().length < 6) {
      setErreur("Choisissez un fichier ou collez votre liste.");
      return;
    }
    setOccupe(true);
    setErreur("");
    setResultat(null);
    try {
      const r = await fetch("/api/organisme/importer" + suffixe(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenu: contenu }),
      });
      const data = await r.json();
      if (data.ok) {
        setResultat(data);
        setContenu("");
        setNomFichier("");
      } else {
        setErreur(data.erreur || "Import impossible.");
        if (data.rejets) setResultat({ rejets: data.rejets, inscrits: 0, rejetes: data.rejets.length });
      }
    } catch (e: any) {
      setErreur("Import impossible : " + String(e));
    }
    setOccupe(false);
  }

  const CADRE: any = {
    minHeight: "100vh",
    background: "#050508",
    color: "#fff",
    fontFamily: "Georgia, serif",
    padding: "40px 20px",
  };

  const CARTE: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "12px",
    padding: "22px 26px",
    marginBottom: "18px",
  };

  const LIBELLE: any = {
    display: "block",
    color: "#c8a96e",
    fontSize: "13px",
    marginBottom: "7px",
  };

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <a href={"/organisme/stagiaires" + suffixe()} style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          {"\u2190 Retour au registre"}
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          INSCRIPTION EN NOMBRE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Importer mes stagiaires</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          {"Jusqu'\u00e0 cinq cents lignes par import"}
        </p>

        <div style={{ ...CARTE, marginTop: "26px" }}>
          <span style={LIBELLE}>Ordre des colonnes</span>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "14px 16px", marginBottom: "16px" }}>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px", margin: "0 0 8px", fontFamily: "monospace", lineHeight: "1.7" }}>
              email ; nom ; formation ; statut ; financeur ; dispositif
            </p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0, lineHeight: "1.7" }}>
              {"Seule la premi\u00e8re colonne est obligatoire. Exemple :"}
            </p>
            <p style={{ color: "#c8a96e", fontSize: "12.5px", margin: "8px 0 0", fontFamily: "monospace", lineHeight: "1.7", wordBreak: "break-all" }}>
              marie.dupont@exemple.fr ; Marie Dupont ; F028 ; salarie_prive ; entreprise ; plan_developpement
            </p>
          </div>

          <span style={LIBELLE}>Votre fichier</span>
          <input
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            onChange={lireFichier}
            style={{ width: "100%", padding: "13px 14px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "14px" }}
          />

          {nomFichier && (
            <p style={{ color: "#4caf50", fontSize: "13px", margin: "-6px 0 14px" }}>
              {nomFichier}{" \u00b7 "}{contenu.split(/\r?\n/).filter(function (l) { return l.trim(); }).length}{" ligne(s) lue(s)"}
            </p>
          )}

          <span style={LIBELLE}>Ou collez directement votre liste</span>
          <textarea
            value={contenu}
            onChange={(e) => { setContenu(e.target.value); setNomFichier(""); }}
            rows={8}
            placeholder={"marie.dupont@exemple.fr ; Marie Dupont ; F028\njean.martin@exemple.fr ; Jean Martin ; F028"}
            style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px", lineHeight: "1.7", fontFamily: "monospace", boxSizing: "border-box", marginBottom: "16px" }}
          />

          <button
            onClick={importer}
            disabled={occupe || contenu.trim().length < 6}
            style={{ background: occupe || contenu.trim().length < 6 ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe || contenu.trim().length < 6 ? "#8a8a8a" : "#050508", padding: "15px 30px", borderRadius: "8px", border: "none", cursor: occupe || contenu.trim().length < 6 ? "default" : "pointer", fontWeight: "bold", fontSize: "16px", fontFamily: "Georgia,serif", width: "100%" }}
          >
            {occupe ? "Import en cours..." : "Importer"}
          </button>

          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.7" }}>
            {"Point-virgule, virgule ou tabulation : les trois fonctionnent. Une ligne d'en-t\u00eate est ignor\u00e9e. Une adresse d\u00e9j\u00e0 au registre est mise \u00e0 jour, jamais dupliqu\u00e9e."}
          </p>
        </div>

        {erreur && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.55)" }}>
            <p style={{ color: "#e8836a", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>{erreur}</p>
          </div>
        )}

        {resultat && resultat.inscrits > 0 && (
          <div style={{ ...CARTE, border: "1px solid rgba(76,175,80,0.5)" }}>
            <p style={{ color: "#4caf50", fontSize: "17px", fontWeight: "bold", margin: "0 0 8px" }}>
              {resultat.inscrits}{" stagiaire(s) inscrit(s)"}
            </p>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "0 0 14px", lineHeight: "1.75" }}>
              {resultat.message}
            </p>
            <a
              href={"/organisme/stagiaires" + suffixe()}
              style={{ display: "inline-block", background: "#c8a96e", color: "#050508", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "15px" }}
            >
              {"Voir le registre et envoyer les acc\u00e8s"}
            </a>
          </div>
        )}

        {resultat && resultat.rejets && resultat.rejets.length > 0 && (
          <div style={CARTE}>
            <h2 style={{ color: "#e8a33d", fontSize: "16px", margin: "0 0 12px" }}>
              {resultat.rejetes}{" ligne(s) \u00e9cart\u00e9e(s)"}
            </h2>
            {resultat.rejets.map(function (r: any, i: number) {
              return (
                <div key={i} style={{ padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "13px", margin: 0, wordBreak: "break-all" }}>
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>{"Ligne "}{r.ligne}{" \u00b7 "}</span>
                    {r.valeur}
                  </p>
                  <p style={{ color: "#e8a33d", fontSize: "12.5px", margin: "3px 0 0" }}>{r.motif}</p>
                </div>
              );
            })}
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: "14px 0 0", lineHeight: "1.7" }}>
              {"Corrigez ces lignes dans votre fichier et relancez l'import : les stagiaires d\u00e9j\u00e0 inscrits ne seront pas dupliqu\u00e9s."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
