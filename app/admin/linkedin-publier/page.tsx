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
//
// ---- LES PAGES SE LISENT EN BASE — 04/09 -------------------------------
//
// 🚨 LE DEFAUT CORRIGE. La liste des pages etait ECRITE EN DUR dans ce
// fichier. La page Mr LMS, creee sur LinkedIn et inseree dans
// `linkedin_pages`, n apparaissait donc pas ici : ajouter une page en base
// ne servait a rien, et rien ne le signalait.
//
// Elle vient desormais de la route, qui lit `linkedin_pages`. Une page
// ajoutee en base apparait a la prochaine ouverture de l ecran.
//
// ⚠️ NE PAS REINTRODUIRE DE TABLEAU EN DUR ICI. C est la regle de la
// maison : un contenu affiche se lit en base, jamais dans le code.
// ---------------------------------------------------------------------------

const OR = "#c8a96e";
const NUIT = "#050508";

export default function PageLinkedIn() {
  const [pages, setPages] = useState<any[]>([]);
  const [produit, setProduit] = useState("");
  const [texte, setTexte] = useState("");
  const [url, setUrl] = useState("");
  const [titre, setTitre] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [historique, setHistorique] = useState<any[]>([]);

  async function chargerHistorique() {
    try {
      const r = await fetch("/api/linkedin/publier", { cache: "no-store" });
      const d = await r.json();
      if (d.ok) {
        setHistorique(d.publications || []);
        const liste = d.pages || [];
        setPages(liste);
        // La premiere page devient le choix par defaut, mais seulement si
        // aucun choix n a encore ete fait : sinon un rechargement apres
        // publication ramenerait le formulaire sur la mauvaise page.
        setProduit(function (avant) {
          if (avant) return avant;
          return liste.length > 0 ? liste[0].produit : "";
        });
      }
    } catch (e) {}
    setChargement(false);
  }

  useEffect(function () { chargerHistorique(); }, []);

  function nomDe(code: string): string {
    const p = pages.find(function (x: any) { return x.produit === code; });
    return p ? p.nom : code;
  }

  async function publier() {
    if (!texte.trim()) {
      setErreur("Le texte est vide.");
      return;
    }
    if (!produit) {
      setErreur("Aucune page choisie.");
      return;
    }
    if (!window.confirm("Publier maintenant sur la page " + nomDe(produit) + " ?")) {
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

          {/* La liste vient de `linkedin_pages`. Si elle est vide, on le dit
              plutot que d afficher un menu sans option — le message indique
              quoi faire. */}
          {chargement ? (
            <p style={{ color: "rgba(255,255,255,0.45)", margin: "0 0 14px" }}>Chargement des pages…</p>
          ) : pages.length === 0 ? (
            <p style={{ color: "#e8836a", margin: "0 0 14px", lineHeight: "1.7" }}>
              Aucune page en base. Ajoutez-en une dans la table linkedin_pages.
            </p>
          ) : (
            <select value={produit} onChange={(e) => setProduit(e.target.value)} style={CHAMP}>
              {pages.map(function (p: any) {
                return <option key={p.produit} value={p.produit}>{p.nom}</option>;
              })}
            </select>
          )}

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
            disabled={occupe || !texte.trim() || !produit}
            style={{
              background: "linear-gradient(135deg,#c8a96e,#a07840)",
              color: NUIT, border: "none", borderRadius: "9px", padding: "14px 28px",
              fontSize: "15px", fontWeight: "bold", fontFamily: "Georgia,serif",
              cursor: occupe || !texte.trim() || !produit ? "not-allowed" : "pointer",
              opacity: occupe || !texte.trim() || !produit ? 0.5 : 1, width: "100%",
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
