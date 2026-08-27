"use client";
import { useState, useEffect } from "react";

const OR = "#c8a96e";
const NOIR = "#050508";
const VERT = "#00e676";
const ROUGE = "#e8836a";

// ---------------------------------------------------------------------------
// ETABLIR LA LIASSE FISCALE D UN DOSSIER.
//
// 🚨 L IFRAME N EST PAS UN DETAIL DE PRESENTATION.
//
// L ecran de saisie appartient a notre partenaire de teletransmission. Ouvert
// comme un lien ordinaire, son adresse s affiche dans la barre du navigateur
// — et le cabinet voit passer le nom d une maison qu il ne connait pas, dans
// un outil qu il paye a une autre.
//
// Charge EN IFRAME, c est mrcomptable.fr qui reste affiche. L ecran est
// entierement encapsule : ni dans la page, ni dans l adresse, aucune marque
// tierce n apparait.
//
// ⚠️ NE JAMAIS REMPLACER CETTE IFRAME PAR UN window.open NI PAR UN LIEN.
// C est precisement le defaut corrige le 27/08, et il annulerait tout le
// travail de marque blanche fait sur une trentaine de fichiers.
//
// LA MARCHE A SUIVRE, DU POINT DE VUE DU CABINET :
//   1. il choisit le dossier
//   2. la balance de l exercice part vers le service de teletransmission
//   3. la liasse pre-remplie s ouvre ICI, dans la page
//   4. il la relit, la complete, et la teletransmet depuis « Teletransmissions »
// ---------------------------------------------------------------------------

export default function PageLiasse() {
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [choisi, setChoisi] = useState("");
  const [annee, setAnnee] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState("");
  const [detail, setDetail] = useState("");
  const [liasse, setLiasse] = useState<any>(null);
  const [pleinEcran, setPleinEcran] = useState(false);

  useEffect(function () { chargerDossiers(); }, []);

  async function chargerDossiers() {
    try {
      const r = await fetch("/api/compliance/crm", { cache: "no-store" });
      const d = await r.json();
      if (d.ok && Array.isArray(d.clients)) {
        setDossiers(d.clients);
        if (d.clients.length === 1) setChoisi(d.clients[0].id);
      }
    } catch (e) { /* la liste se recharge, ce n est pas bloquant */ }
  }

  async function etablir() {
    if (!choisi) {
      setErreur("Choisissez d'abord un dossier.");
      return;
    }
    setOccupe(true);
    setErreur("");
    setDetail("");
    setLiasse(null);
    try {
      const r = await fetch("/api/teledec/liasse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          societe_id: choisi,
          annee: annee ? parseInt(annee, 10) : undefined,
        }),
      });
      const d = await r.json();
      if (d.ok && d.url) {
        setLiasse(d);
      } else {
        setErreur(d.erreur || "La liasse n'a pas pu être établie.");
        if (d.reponse) setDetail(String(d.reponse).slice(0, 400));
        if (d.rappel) setDetail(String(d.rappel));
      }
    } catch (e: any) {
      setErreur("Établissement impossible : " + String(e));
    }
    setOccupe(false);
  }

  const CADRE: any = {
    minHeight: "100vh", background: NOIR, color: "#fff",
    fontFamily: "Georgia, serif", padding: "40px 20px",
  };
  const CARTE: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "12px", padding: "22px 24px", marginBottom: "16px",
  };
  const CHAMP: any = {
    width: "100%", padding: "12px 14px", borderRadius: "9px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "#12121f", color: "#fff",
    fontSize: "15px", fontFamily: "Georgia, serif",
    boxSizing: "border-box",
  };
  const LIBELLE: any = {
    display: "block", color: OR, fontSize: "13px", marginBottom: "6px",
  };

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR",
      { minimumFractionDigits: 2 }) + " €";
  }

  // LE PLEIN ECRAN. Une liasse fiscale compte des centaines de cases : la
  // lire dans un cadre de six cents pixels est une epreuve. Le plein ecran
  // reste DANS notre page — ce n est pas une nouvelle fenetre.
  if (liasse && pleinEcran) {
    return (
      <div style={{ position: "fixed", inset: 0, background: NOIR,
        zIndex: 100, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", padding: "12px 18px", flexWrap: "wrap",
          gap: "10px", borderBottom: "1px solid rgba(200,169,110,0.25)" }}>
          <span style={{ color: OR, fontSize: "14px" }}>
            Liasse — {liasse.dossier ? liasse.dossier.raison_sociale : ""}
          </span>
          <button onClick={() => setPleinEcran(false)}
            style={{ background: "rgba(255,255,255,0.06)", color: OR,
              border: "1px solid rgba(200,169,110,0.35)",
              borderRadius: "8px", padding: "9px 18px", cursor: "pointer",
              fontFamily: "Georgia, serif", fontSize: "13.5px" }}>
            Réduire
          </button>
        </div>
        <iframe
          src={liasse.url}
          title="Liasse fiscale"
          style={{ flex: 1, width: "100%", border: "none",
            background: "#fff" }}
        />
      </div>
    );
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

        <a href="/admin/comptable/tableau-de-bord"
          style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>
          ← Retour à vos dossiers
        </a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px",
          margin: "26px 0 10px" }}>
          LIASSE FISCALE
        </p>
        <h1 style={{ fontSize: "30px", margin: "0 0 10px" }}>
          Établir la liasse
        </h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "15px",
          lineHeight: "1.7", margin: "0 0 26px", maxWidth: "720px" }}>
          La balance de l'exercice alimente la liasse, qui s'ouvre ici même,
          pré-remplie. Vous la relisez, vous la complétez, puis vous la
          télétransmettez depuis l'écran des télétransmissions.
        </p>

        {!liasse && (
          <div style={CARTE}>
            <span style={LIBELLE}>Le dossier</span>
            <select value={choisi} onChange={(e) => setChoisi(e.target.value)}
              style={{ ...CHAMP, marginBottom: "16px", cursor: "pointer" }}>
              <option value="">Choisissez un dossier…</option>
              {dossiers.map(function (d: any) {
                return (
                  <option key={d.id} value={d.id}>
                    {d.raison_sociale}{d.code ? " (" + d.code + ")" : ""}
                  </option>
                );
              })}
            </select>

            <span style={LIBELLE}>
              L'exercice (facultatif — celui du dossier par défaut)
            </span>
            <input value={annee} onChange={(e) => setAnnee(e.target.value)}
              placeholder="2025"
              style={{ ...CHAMP, marginBottom: "18px" }} />

            <button onClick={etablir} disabled={occupe || !choisi}
              style={{
                width: "100%",
                background: occupe || !choisi
                  ? "rgba(200,169,110,0.3)" : OR,
                color: occupe || !choisi ? "#8a8a8a" : NOIR,
                border: "none", borderRadius: "9px", padding: "15px",
                fontSize: "15.5px", fontWeight: "bold",
                fontFamily: "Georgia, serif",
                cursor: occupe ? "wait" : (choisi ? "pointer" : "default"),
              }}>
              {occupe ? "Établissement en cours…" : "Établir la liasse"}
            </button>

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px",
              lineHeight: "1.75", margin: "14px 0 0" }}>
              Rien n'est transmis à l'administration à cette étape. La liasse
              est préparée et vous reste ouverte tant que vous ne l'avez pas
              télétransmise.
            </p>
          </div>
        )}

        {erreur && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.5)" }}>
            <p style={{ color: ROUGE, fontSize: "15px", lineHeight: "1.75",
              margin: 0 }}>
              {erreur}
            </p>
            {detail && (
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px",
                lineHeight: "1.7", margin: "10px 0 0" }}>
                {detail}
              </p>
            )}
          </div>
        )}

        {liasse && (
          <>
            <div style={{ ...CARTE, border: "1px solid rgba(0,230,118,0.4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                flexWrap: "wrap", gap: "12px", alignItems: "baseline" }}>
                <div>
                  <p style={{ color: VERT, fontSize: "15.5px",
                    fontWeight: "bold", margin: "0 0 6px" }}>
                    {liasse.message}
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.55)",
                    fontSize: "13.5px", lineHeight: "1.8", margin: 0 }}>
                    Exercice du{" "}
                    {new Date(liasse.exercice.debut).toLocaleDateString("fr-FR")}
                    {" "}au{" "}
                    {new Date(liasse.exercice.fin).toLocaleDateString("fr-FR")}
                    {" · "}{liasse.balance.comptes} comptes
                    {" · "}{liasse.balance.lignes} lignes
                    <br />
                    Balance équilibrée à {euros(liasse.balance.debit)}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px",
                  flexWrap: "wrap" }}>
                  <button onClick={() => setPleinEcran(true)}
                    style={{ background: OR, color: NOIR, border: "none",
                      borderRadius: "8px", padding: "11px 20px",
                      cursor: "pointer", fontFamily: "Georgia, serif",
                      fontSize: "14px", fontWeight: "bold" }}>
                    Plein écran
                  </button>
                  <button onClick={() => { setLiasse(null); setPleinEcran(false); }}
                    style={{ background: "rgba(255,255,255,0.06)", color: OR,
                      border: "1px solid rgba(200,169,110,0.35)",
                      borderRadius: "8px", padding: "11px 20px",
                      cursor: "pointer", fontFamily: "Georgia, serif",
                      fontSize: "14px" }}>
                    Un autre dossier
                  </button>
                </div>
              </div>
            </div>

            {/* 🚨 L IFRAME. C est elle qui garde le cabinet chez nous.
                Voir le commentaire en tete de fichier. */}
            <div style={{ border: "1px solid rgba(200,169,110,0.25)",
              borderRadius: "12px", overflow: "hidden",
              background: "#fff" }}>
              <iframe
                src={liasse.url}
                title="Liasse fiscale"
                style={{ width: "100%", height: "760px", border: "none",
                  display: "block" }}
              />
            </div>

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px",
              lineHeight: "1.75", margin: "14px 0 0" }}>
              Cette liasse reste accessible tant qu'elle n'est pas
              télétransmise. Une fois envoyée, sa réponse et son accusé de
              réception apparaîtront dans{" "}
              <a href="/admin/comptable/teledec" style={{ color: OR }}>
                les télétransmissions
              </a>.
            </p>
          </>
        )}

      </div>
    </div>
  );
}
