"use client";
import { useState, useEffect } from "react";

// LE GUIDE.
//
// Il s ouvre au premier passage sur un ecran, explique ce qu on y fait, et
// ne revient plus une fois lu. Deux principes.
//
// IL NE BLOQUE RIEN. Pas de fenetre modale, pas de fond grise, pas de
// parcours en sept etapes qu il faut subir avant de travailler. Celui qui
// sait deja ferme et continue.
//
// IL NE COUTE RIEN S IL ECHOUE. Une aide qui empeche d utiliser le logiciel
// parce que sa requete a echoue serait pire que pas d aide du tout : en cas
// d erreur, il ne s affiche simplement pas.
//
// Usage : <Guide ecran="comptable.pieces" />

export default function Guide({ ecran, couleur }: { ecran: string; couleur?: string }) {
  const [guide, setGuide] = useState<any>(null);
  const [ouvert, setOuvert] = useState(false);
  const [ferme, setFerme] = useState(false);

  const teinte = couleur || "#c8a96e";

  useEffect(function () {
    let vivant = true;

    (async function () {
      try {
        const r = await fetch("/api/guide?ecran=" + encodeURIComponent(ecran), {
          cache: "no-store",
        });
        const d = await r.json();
        if (!vivant) return;
        if (d.ok && d.guide) {
          setGuide(d.guide);
          setOuvert(!d.vu);
        }
      } catch (e) {
        // Silence : l aide ne doit jamais gener le travail.
      }
    })();

    return function () { vivant = false; };
  }, [ecran]);

  async function jAiCompris() {
    setFerme(true);
    setOuvert(false);
    try {
      await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ecran: ecran }),
      });
    } catch (e) {}
  }

  if (!guide) return null;

  // Une fois lu, il reste une porte discrete pour le rouvrir : personne ne
  // retient tout du premier coup.
  if (!ouvert) {
    return (
      <button
        onClick={function () { setOuvert(true); }}
        style={{
          background: "none",
          border: "1px solid " + teinte + "55",
          color: teinte,
          borderRadius: "20px",
          padding: "6px 16px",
          fontSize: "13px",
          fontFamily: "Georgia, serif",
          cursor: "pointer",
          marginBottom: "18px",
        }}
      >
        Comment ça marche ?
      </button>
    );
  }

  return (
    <div
      style={{
        background: teinte + "0f",
        border: "1px solid " + teinte + "44",
        borderRadius: "12px",
        padding: "20px 24px",
        marginBottom: "22px",
        fontFamily: "Georgia, serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "14px" }}>
        <h2 style={{ color: teinte, fontSize: "17px", margin: "0 0 10px", lineHeight: "1.4" }}>
          {guide.titre}
        </h2>
        <button
          onClick={function () { setOuvert(false); }}
          aria-label="Fermer"
          style={{
            background: "none",
            border: "none",
            color: teinte + "99",
            fontSize: "20px",
            cursor: "pointer",
            lineHeight: 1,
            padding: 0,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>

      <p style={{ color: "inherit", opacity: 0.85, fontSize: "15px", lineHeight: "1.75", margin: "0 0 14px" }}>
        {guide.texte}
      </p>

      {Array.isArray(guide.points) && guide.points.length > 0 && (
        <div style={{ margin: "0 0 18px" }}>
          {guide.points.map(function (p: string, i: number) {
            return (
              <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "9px", alignItems: "flex-start" }}>
                <span style={{ color: teinte, fontSize: "14px", lineHeight: "1.7", flexShrink: 0 }}>·</span>
                <span style={{ opacity: 0.75, fontSize: "14.5px", lineHeight: "1.7" }}>{p}</span>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={jAiCompris}
        style={{
          background: teinte,
          color: "#050508",
          border: "none",
          borderRadius: "8px",
          padding: "10px 22px",
          fontSize: "14px",
          fontWeight: "bold",
          fontFamily: "Georgia, serif",
          cursor: "pointer",
        }}
      >
        {ferme ? "Enregistré" : "J'ai compris"}
      </button>
    </div>
  );
}
