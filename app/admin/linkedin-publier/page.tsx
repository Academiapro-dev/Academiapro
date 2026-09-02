"use client";
import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// PUBLIER SUR LINKEDIN — ECRAN D ADMINISTRATION — 02/09.
//
// Un produit, un texte, un lien facultatif, un bouton. La route
// /api/linkedin/publier fait le reste et refuse tout appel qui n est pas
// l administrateur en session.
//
// 🚨 RIEN NE PART SANS LECTURE : cet ecran n a pas de brouillon automatique,
// pas de planification, pas de generation. Ce qui est dans la zone de texte
// au moment du clic est ce qui est publie. C est voulu.
//
// ⚠️ LE TEXTE PART TEL QUEL. LinkedIn conserve les retours a la ligne ;
// il ne rend ni le gras ni les liens dans le corps — un lien dans le texte
// reste du texte. Le lien de la carte est le champ « Lien de l article ».
// ---------------------------------------------------------------------------

const OR = "#c8a96e";
const NUIT = "#050508";

const PRODUITS = [
  { code: "academiapro", nom: "AcadéMIA Pro" },
  { code: "mrcomptable", nom: "Mr. Comptable" },
  { code: "mysterllc", nom: "MysterLLC" },
  { code: "hebrewpro", nom: "HebrewPro AI" },
];

export default function PageLinkedIn() {
  const [produit, setProduit] = useState("academiapro");
  const [texte, setTexte] = useState("");
  const [url, setUrl] = useState("");
  const [titre, setTitre] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [historique, setHistorique] = useState<any[]>([]);

  async function chargerHistorique() {
    try {
      const r = await fetch("/api/linkedin/publier", { cache: "no-store" });
      const d = await r.json();
      if (d.ok) setHistorique(d.publications || []);
    } catch (e) {}
  }

  useEffect(function () { chargerHistorique(); }, []);

  async function publier() {
    if (!texte.trim()) {
      setErreur("Le texte est vide.");
      return;
    }
    if (!window.confirm("Publier maintenant sur la page " + (PRODUITS.find(function (p) { return p.code === produit; })?.nom || produit) + " ?")) {
      return;
    }
    setOccupe(true);
    setErreur("");
    setMessage("");
    try {
      const r = await fetch("/api/linkedin/publier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ produit: produit, texte: texte, url: url || undefined, titre: titre || undefined }),
      });
      const d = await r.json();
      if (d.ok) {
        setMessage("Publié sur " + (d.page || produit) + " — " + d.post);
        setTexte("");
        setUrl("");
        setTitre("");
        chargerHistorique();
      } else {
        setErreur((d.erreur || "Échec.") + (d.detail ? " — " + d.detail : ""));
      }
    } catch (e: any) {
      setErreur("Appel impossible : " + String(e));
    }
    setOccupe(false);
  }

  const CHAMP: any = {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    fontSize: "15px",
    fontFamily: "Georgia,serif",
    boxSizing: "border-box",
    marginBottom: "14px",
  };

  const CARTE: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "12px",
    padding: "22px 24px",
    marginBottom: "16px",
  };

  return (
    <div style={{ minHeight: "100vh", background: NUIT, color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 8px" }}>LINKEDIN</p>
        <h1 style={{ fontSize: "26px", margin: "0 0 24px" }}>Publier sur une page</h1>

        {erreur && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.5)" }}>
            <p style={{ color: "#e8836a", margin: 0, lineHeight: "1.7" }}>{erreur}</p>
          </div>
        )}
        {message && (
          <div style={{ ...CARTE, border: "1px solid rgba(0,230,118,0.4)" }}>
            <p style={{ color: "#00e676", margin: 0, lineHeight: "1.7" }}>{message}</p>
          </div>
        )}

        <div style={CARTE}>
          <label style={{ color: OR, fontSize: "12.5px", display: "block", marginBottom: "5px" }}>Page</label>
          <select value={produit} onChange={(e) => setProduit(e.target.value)} style={CHAMP}>
            {PRODUITS.map(function (p) {
              return <option key={p.code} value={p.code}>{p.nom}</option>;
            })}
          </select>

          <label style={{ color: OR, fontSize: "12.5px", display: "block", marginBottom: "5px" }}>Texte du post</label>
          <textarea
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            rows={10}
            placeholder="Le texte, tel qu'il s'affichera."
            style={{ ...CHAMP, resize: "vertical", lineHeight: "1.6" }}
          />
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", margin: "-8px 0 14px" }}>
            {texte.length} / 3 000 caractères
          </p>

          <label style={{ color: OR, fontSize: "12.5px", display: "block", marginBottom: "5px" }}>Lien de l&apos;article (facultatif)</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" style={CHAMP} />

          <label style={{ color: OR, fontSize: "12.5px", display: "block", marginBottom: "5px" }}>Titre de la carte de lien (facultatif)</label>
          <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre affiché sous l'aperçu" style={CHAMP} />

          <button
            onClick={publier}
            disabled={occupe || !texte.trim()}
            style={{
              background: "linear-gradient(135deg,#c8a96e,#a07840)",
              color: NUIT, border: "none", borderRadius: "9px", padding: "14px 28px",
              fontSize: "15px", fontWeight: "bold", fontFamily: "Georgia,serif",
              cursor: occupe || !texte.trim() ? "not-allowed" : "pointer",
              opacity: occupe || !texte.trim() ? 0.5 : 1, width: "100%",
            }}
          >
            {occupe ? "Publication…" : "Publier maintenant"}
          </button>
        </div>

        <h2 style={{ fontSize: "18px", margin: "28px 0 12px", color: OR }}>Dernières publications</h2>
        {historique.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.45)" }}>Aucune publication pour l&apos;instant.</p>
        ) : historique.map(function (p: any) {
          const ok = p.statut_http === 201 && p.post_urn;
          return (
            <div key={p.id} style={{ ...CARTE, borderColor: ok ? "rgba(0,230,118,0.3)" : "rgba(232,131,106,0.4)" }}>
              <p style={{ margin: "0 0 6px", color: ok ? "#00e676" : "#e8836a", fontSize: "12.5px" }}>
                {ok ? "Publié" : "Échec (HTTP " + (p.statut_http || "?") + ")"} · {p.produit} · {String(p.publie_le || "").replace("T", " ").slice(0, 16)}
              </p>
              <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: "1.6", color: "rgba(255,255,255,0.8)" }}>{p.texte}</p>
              {p.url && <p style={{ margin: "8px 0 0", fontSize: "12.5px", color: "rgba(255,255,255,0.45)", wordBreak: "break-all" }}>{p.url}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
