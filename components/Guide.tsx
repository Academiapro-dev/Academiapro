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
// d erreur, elle se tait.
//
// Usage : <Guide ecran="comptable.pieces" />
//         <Guide ecran="qualiopi.grille" couleur="#0a3d2e" fond="clair" />

export default function Guide({
  ecran,
  couleur,
  fond,
}: {
  ecran: string;
  couleur?: string;
  fond?: string;
}) {
  const [guide, setGuide] = useState<any>(null);
  const [ouvert, setOuvert] = useState(false);
  const [confirme, setConfirme] = useState(false);
  const [lu, setLu] = useState(false);

  const teinte = couleur || "#c8a96e";

  // LE GUIDE VIT SUR DEUX SORTES D ECRANS.
  //
  // Mr. Comptable, le LMS et le CRM sont sombres ; la grille Qualiopi est
  // blanche. Un texte clair y serait illisible. La teinte du texte suit donc
  // le fond, au lieu d etre fixee une fois pour toutes.
  const clair = fond === "clair";
  const encre = clair ? "#1a1a1a" : "#f2f2f2";
  const opaciteTexte = clair ? 1 : 0.85;
  const opacitePoints = clair ? 0.9 : 0.75;

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
          setLu(Boolean(d.vu));
          setOuvert(!d.vu);
        }
      } catch (e) {
        // Silence : l aide ne doit jamais gener le travail.
      }
    })();

    return function () { vivant = false; };
  }, [ecran]);

  // FERMER, C EST AVOIR LU.
  //
  // Il y avait deux sorties pour un seul geste : le bouton enregistrait, la
  // croix non. Celui qui fermait d un geste rapide retrouvait le guide
  // ouvert a chaque visite et croyait le logiciel casse. Les deux sorties
  // enregistrent desormais.
  async function marquerLu() {
    if (lu) return;
    setLu(true);
    try {
      await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ecran: ecran }),
      });
    } catch (e) {}
  }

  function fermerParLaCroix() {
    setOuvert(false);
    marquerLu();
  }

  // La confirmation s affichait dans le meme rendu que le repli : elle etait
  // donc invisible. Elle tient maintenant une seconde avant que le bloc se
  // referme.
  function jAiCompris() {
    setConfirme(true);
    marquerLu();
    setTimeout(function () { setOuvert(false); }, 900);
  }

  if (!guide) return null;

  // UNE FOIS LU, L AIDE DOIT RESTER TROUVABLE.
  //
  // La pastille etait sans fond et sans icone : discrete au point de
  // disparaitre. Une aide que personne ne retrouve n existe plus apres le
  // premier passage.
  if (!ouvert) {
    return (
      <button
        onClick={function () { setConfirme(false); setOuvert(true); }}
        style={{
          background: teinte + (clair ? "12" : "1a"),
          border: "1px solid " + teinte + "88",
          color: teinte,
          borderRadius: "20px",
          padding: "9px 20px",
          fontSize: "14px",
          fontWeight: "bold",
          fontFamily: "Georgia, serif",
          cursor: "pointer",
          marginBottom: "18px",
          display: "inline-flex",
          alignItems: "center",
          gap: "9px",
        }}
      >
        <span style={{ fontSize: "16px", lineHeight: 1 }}>💡</span>
        Aide sur cet écran
      </button>
    );
  }

  return (
    <div
      style={{
        background: teinte + (clair ? "0a" : "0f"),
        border: "1px solid " + teinte + "44",
        borderRadius: "12px",
        padding: "20px 24px",
        marginBottom: "22px",
        fontFamily: "Georgia, serif",
        color: encre,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "14px" }}>
        <h2 style={{ color: teinte, fontSize: "17px", margin: "0 0 10px", lineHeight: "1.4" }}>
          {guide.titre}
        </h2>
        <button
          onClick={fermerParLaCroix}
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

      <p style={{ opacity: opaciteTexte, fontSize: "15px", lineHeight: "1.75", margin: "0 0 14px" }}>
        {guide.texte}
      </p>

      {Array.isArray(guide.points) && guide.points.length > 0 && (
        <div style={{ margin: "0 0 18px" }}>
          {guide.points.map(function (p: string, i: number) {
            return (
              <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "9px", alignItems: "flex-start" }}>
                <span style={{ color: teinte, fontSize: "14px", lineHeight: "1.7", flexShrink: 0 }}>·</span>
                <span style={{ opacity: opacitePoints, fontSize: "14.5px", lineHeight: "1.7" }}>{p}</span>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={jAiCompris}
        disabled={confirme}
        style={{
          background: confirme ? teinte + "55" : teinte,
          color: confirme ? encre : "#ffffff",
          border: "none",
          borderRadius: "8px",
          padding: "10px 22px",
          fontSize: "14px",
          fontWeight: "bold
