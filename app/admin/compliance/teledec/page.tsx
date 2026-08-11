"use client";
import { useState, useEffect } from "react";
import Guide from "../../../../components/Guide";

const OR = "#c8a96e";
const NOIR = "#050508";

// Chaque statut a sa couleur et son mot. Un comptable doit voir en un coup
// d oeil ce qui reclame son attention : un rejet passe avant tout le reste.
const STATUTS: any = {
  acceptee: { mot: "Acceptée", couleur: "#00e676" },
  rejetee: { mot: "Rejetée", couleur: "#e8836a" },
  transmise: { mot: "Transmise, en attente", couleur: OR },
  creee: { mot: "Créée, pas encore transmise", couleur: "rgba(255,255,255,0.6)" },
  envoyee: { mot: "Envoyée, sans retour", couleur: "rgba(255,255,255,0.5)" },
  inconnu: { mot: "Statut non reconnu", couleur: "#e8836a" },
};

export default function TeledecPage() {
  const [lignes, setLignes] = useState<any[]>([]);
  const [rejetees, setRejetees] = useState(0);
  const [enAttente, setEnAttente] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(function () { charger(); }, []);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/teledec/declarations", { cache: "no-store" });
      const d = await r.json();
      if (d.ok) {
        setLignes(d.declarations || []);
        setRejetees(d.rejetees || 0);
        setEnAttente(d.en_attente || 0);
      } else {
        setErreur(d.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur(String(e));
    }
    setChargement(false);
  }

  const carte: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.22)",
    borderRadius: "12px",
    padding: "22px",
    marginBottom: "14px",
  };

  function date(v: string) {
    if (!v) return "";
    return new Date(v).toLocaleString("fr-FR");
  }

  function jour(v: string) {
    if (!v) return "";
    return new Date(v).toLocaleDateString("fr-FR");
  }

  // LES REJETS, LISIBLEMENT.
  //
  // L administration renvoie deux natures d anomalies : les erreurs
  // metier — un calcul faux, un report incoherent — et les erreurs de
  // syntaxe, propres au format d echange.
  //
  // Les afficher en bloc technique obligeait le comptable a dechiffrer des
  // accolades pour savoir quel champ corriger. Il lui faut le formulaire,
  // le champ, son libelle et ce qu on lui reproche.
  function Anomalies({ erreurs }: any) {
    if (!erreurs) return null;

    const metier = Array.isArray(erreurs.declaration) ? erreurs.declaration : [];
    const syntaxe = Array.isArray(erreurs.syntaxe) ? erreurs.syntaxe : [];

    if (metier.length === 0 && syntaxe.length === 0) {
      // Format inattendu : plutot que de perdre l information, on la montre.
      return (
        <pre style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", lineHeight: "1.6", margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
          {JSON.stringify(erreurs, null, 2)}
        </pre>
      );
    }

    const ligne: any = {
      padding: "12px 0",
      borderBottom: "1px solid rgba(232,131,106,0.18)",
    };

    return (
      <div>
        {metier.length > 0 && (
          <div style={{ marginBottom: syntaxe.length > 0 ? "18px" : 0 }}>
            <p style={{ color: "#e8836a", fontSize: "12.5px", letterSpacing: "1px", margin: "0 0 6px" }}>
              ANOMALIES DE DÉCLARATION
            </p>
            {metier.map(function (e: any, i: number) {
              return (
                <div key={i} style={ligne}>
                  <p style={{ color: "#fff", fontSize: "14.5px", margin: "0 0 4px" }}>
                    {e.champLibelle || e.champ || "Champ non précisé"}
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "13.5px", margin: "0 0 4px", lineHeight: "1.6" }}>
                    {e.libelle || "Anomalie signalée sans explication."}
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", margin: 0 }}>
                    {e.formulaire ? "Formulaire " + e.formulaire : ""}
                    {e.champ ? " · champ " + e.champ : ""}
                    {e.code ? " · code " + e.code : ""}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {syntaxe.length > 0 && (
          <div>
            <p style={{ color: "#e8836a", fontSize: "12.5px", letterSpacing: "1px", margin: "0 0 6px" }}>
              ANOMALIES DE FORMAT
            </p>
            {syntaxe.map(function (e: any, i: number) {
              return (
                <div key={i} style={ligne}>
                  <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "14px", margin: "0 0 4px", lineHeight: "1.6" }}>
                    {e.libelleErreur || "Anomalie de format."}
                  </p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", margin: 0 }}>
                    {e.formulaire ? "Formulaire " + e.formulaire : ""}
                    {e.champ ? " · champ " + e.champ : ""}
                    {e.codeErreur ? " · " + e.codeErreur : ""}
                    {e.ligne ? " · ligne " + e.ligne : ""}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: NOIR, color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>

        <a href="/admin/compliance/tableau-de-bord" style={{ color: OR, fontSize: "14px", textDecoration: "none" }}>
          ← Retour à vos dossiers
        </a>

        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "26px 0 10px" }}>
          COMPTABILITÉ
        </p>
        <h1 style={{ fontSize: "30px", margin: "0 0 10px" }}>Télétransmissions</h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "15px", lineHeight: "1.7", margin: "0 0 24px", maxWidth: "700px" }}>
          Les liasses envoyées à l'administration et leur réponse. Un accusé de réception
          vaut dépôt ; un rejet indique le formulaire et le champ à corriger.
        </p>

        <Guide ecran="comptable.teledec" />

        {/* Ce qui reclame une action, avant la liste. */}
        {(rejetees > 0 || enAttente > 0) && !chargement && (
          <p style={{ color: rejetees > 0 ? "#e8836a" : "rgba(255,255,255,0.6)", fontSize: "15px", margin: "0 0 20px", lineHeight: "1.7" }}>
            {rejetees > 0 ? rejetees + " déclaration(s) rejetée(s) à corriger. " : ""}
            {enAttente > 0 ? enAttente + " en attente de réponse." : ""}
          </p>
        )}

        <button
          onClick={charger}
          style={{ background: "transparent", color: OR, border: "1px solid rgba(200,169,110,0.3)", borderRadius: "8px", padding: "10px 22px", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: "14px", marginBottom: "26px" }}
        >
          Rafraîchir
        </button>

        {chargement && (
          <p style={{ color: "rgba(255,255,255,0.5)" }}>Lecture en cours…</p>
        )}

        {erreur && (
          <p style={{ color: "#e8836a", fontSize: "14px" }}>{erreur}</p>
        )}

        {!chargement && !erreur && lignes.length === 0 && (
          <div style={carte}>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.7", margin: 0 }}>
              Aucune télétransmission pour le moment. Les liasses envoyées depuis un dossier
              apparaîtront ici, avec la réponse de l'administration.
            </p>
          </div>
        )}

        {lignes.map(function (l: any) {
          const s = STATUTS[l.statut] || STATUTS.inconnu;
          const rejet = l.statut === "rejetee";

          return (
            <div key={l.id} style={{ ...carte, borderColor: rejet ? "rgba(232,131,106,0.5)" : "rgba(200,169,110,0.22)" }}>

              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
                <span style={{ color: s.couleur, fontWeight: "bold", fontSize: "16px" }}>{s.mot}</span>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                  envoyée le {date(l.envoyee_le)}
                </span>
              </div>

              {/* Le dossier concerne, avant tout le reste : un cabinet en
                  suit cinquante, et le SIREN seul ne lui dit rien. */}
              {l.nom_entreprise && (
                <h2 style={{ color: "#fff", fontSize: "18px", margin: "0 0 6px" }}>
                  {l.nom_entreprise}
                </h2>
              )}

              {l.statut_libelle && (
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px", lineHeight: "1.6", margin: "0 0 10px" }}>
                  {l.statut_libelle}
                </p>
              )}

              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", lineHeight: "1.8", margin: 0 }}>
                {l.siren ? "SIREN " + l.siren : ""}
                {l.declaration_type ? " · " + l.declaration_type : ""}
                {l.formulaire ? " · formulaire " + l.formulaire : ""}
                {l.millesime ? " · exercice " + l.millesime : ""}
                {l.rof ? " · obligation " + l.rof : ""}
              </p>

              {(l.periode_debut || l.periode_fin) && (
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", lineHeight: "1.8", margin: "3px 0 0" }}>
                  Période du {jour(l.periode_debut)} au {jour(l.periode_fin)}
                </p>
              )}

              {(l.reference_dgfip || l.repondu_le) && (
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", lineHeight: "1.8", margin: "3px 0 0" }}>
                  {l.reference_dgfip ? "Réf. DGFiP " + l.reference_dgfip : ""}
                  {l.numero_traitement_dgfip ? " · traitement " + l.numero_traitement_dgfip : ""}
                  {l.repondu_le ? " · réponse le " + date(l.repondu_le) : ""}
                </p>
              )}

              {rejet && l.erreurs && (
                <div style={{ background: "rgba(232,131,106,0.08)", border: "1px solid rgba(232,131,106,0.3)", borderRadius: "8px", padding: "16px 18px", marginTop: "16px" }}>
                  <p style={{ color: "#e8836a", fontSize: "14px", fontWeight: "bold", margin: "0 0 14px" }}>
                    À corriger avant de renvoyer
                  </p>
                  <Anomalies erreurs={l.erreurs} />
                </div>
              )}

              {l.pdf_chemin && (
                <p style={{ margin: "14px 0 0" }}>
                  <a
                    href={"/api/teledec/pdf?reference=" + encodeURIComponent(l.reference)}
                    style={{ color: OR, fontSize: "14px" }}
                  >
                    Ouvrir la liasse déposée
                  </a>
                </p>
              )}

            </div>
          );
        })}

      </div>
    </div>
  );
}
