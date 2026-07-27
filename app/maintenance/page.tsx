"use client";
import { useState } from "react";

type Ligne = { texte: string; type: string };

export default function MaintenancePage() {
  const [journal, setJournal] = useState<Ligne[]>([]);
  const [enCours, setEnCours] = useState("");

  const ajouter = (texte: string, type: string) => {
    setJournal((j) => [...j, { texte: texte, type: type }]);
  };

  async function lancerLots(nom: string, base: string, pas: number, executer: boolean) {
    if (enCours) return;
    setEnCours(nom);
    setJournal([]);
    ajouter(nom + (executer ? " - EXECUTION" : " - simulation"), "titre");

    let debut = 0;
    let total = 0;
    let tours = 0;

    try {
      while (tours < 100) {
        const url =
          base +
          (base.indexOf("?") >= 0 ? "&" : "?") +
          "debut=" + debut +
          (executer ? "&executer=oui" : "");

        const r = await fetch(url);
        const d = await r.json();

        if (!d || d.ok !== true) {
          ajouter("Arret : " + ((d && d.erreur) || "reponse illisible"), "erreur");
          break;
        }

        if (!total) total = d.total_supports || 0;

        const traites = (d.a_modifier || 0) + (d.deja_propres || 0) + (d.enregistres || 0);
        const echecs = (d.echecs || []).length;

        ajouter(
          "Lot " + d.lot + " : " +
          (d.a_modifier !== undefined ? d.a_modifier + " traites" : traites + " traites") +
          (echecs ? " - " + echecs + " ECHECS" : ""),
          echecs ? "erreur" : "ok"
        );

        if (echecs) {
          ajouter("Arret sur echec, rien n a ete perdu.", "erreur");
          break;
        }

        debut = debut + pas;
        tours++;
        if (total && debut >= total) {
          ajouter("TERMINE - " + total + " fichiers parcourus.", "fin");
          break;
        }
      }
    } catch (e: any) {
      ajouter("Interruption : " + String(e), "erreur");
    }

    setEnCours("");
  }

  async function genererSupports() {
    if (enCours) return;
    setEnCours("Generation des supports");
    setJournal([]);
    ajouter("Generation des supports manquants", "titre");

    let tours = 0;
    try {
      while (tours < 300) {
        const r = await fetch("/api/admin/generer-support");
        const d = await r.json();

        if (!d || d.ok !== true) {
          ajouter("Arret : " + ((d && d.erreur) || "reponse illisible"), "erreur");
          break;
        }

        if (d.termine) {
          ajouter("TERMINE - plus aucune formation sans support.", "fin");
          break;
        }

        ajouter(
          d.code + " - " + (d.titre || "") + " (" + (d.taille || 0) + " caracteres) - reste " + d.restants,
          "ok"
        );

        tours++;
        if (d.restants === 0) {
          ajouter("TERMINE - toutes les formations ont un support.", "fin");
          break;
        }
      }
    } catch (e: any) {
      ajouter("Interruption : " + String(e), "erreur");
    }

    setEnCours("");
  }

  const bouton = (actif: boolean) =>
    ({
      display: "block",
      width: "100%",
      padding: "14px",
      marginBottom: "10px",
      background: actif ? "#c8a96e" : "#3a3a4a",
      color: actif ? "#050508" : "rgba(255,255,255,0.4)",
      border: 0,
      borderRadius: "8px",
      fontSize: "15px",
      fontWeight: "bold",
      cursor: actif ? "pointer" : "not-allowed",
      textAlign: "left",
    } as any);

  const couleur = (type: string) =>
    type === "erreur" ? "#ff6b6b" : type === "fin" ? "#22c55e" : type === "titre" ? "#c8a96e" : "rgba(255,255,255,0.75)";

  const libre = enCours === "";

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <h1 style={{ color: "#c8a96e", fontSize: "28px", marginBottom: "6px" }}>Maintenance</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginTop: 0, marginBottom: "28px" }}>
          Chaque bouton enchaine les lots tout seul. Les simulations ne modifient rien.
        </p>

        <h2 style={{ color: "#fff", fontSize: "16px", marginBottom: "12px" }}>Contenu</h2>

        <button style={bouton(libre)} disabled={!libre} onClick={genererSupports}>
          Generer les supports manquants
        </button>

        <h2 style={{ color: "#fff", fontSize: "16px", margin: "26px 0 12px" }}>Reparation des accents</h2>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", marginTop: 0, marginBottom: "12px" }}>
          Restaurer d abord, nettoyer ensuite. L ordre inverse abime a nouveau les accents.
        </p>

        <button
          style={bouton(libre)}
          disabled={!libre}
          onClick={() => lancerLots("Restauration des originaux", "/api/admin/restaurer-supports", 15, false)}
        >
          1 - Simuler la restauration
        </button>

        <button
          style={bouton(libre)}
          disabled={!libre}
          onClick={() => lancerLots("Restauration des originaux", "/api/admin/restaurer-supports", 15, true)}
        >
          2 - Restaurer les originaux
        </button>

        <button
          style={bouton(libre)}
          disabled={!libre}
          onClick={() => lancerLots("Nettoyage des supports", "/api/admin/admin/nettoyer-supports", 15, true)}
        >
          3 - Executer le nettoyage
        </button>

        <h2 style={{ color: "#fff", fontSize: "16px", margin: "26px 0 12px" }}>Verifications</h2>

        <button
          style={bouton(libre)}
          disabled={!libre}
          onClick={() => lancerLots("Nettoyage des supports", "/api/admin/admin/nettoyer-supports", 15, false)}
        >
          Simuler le nettoyage
        </button>

        <button
          style={bouton(libre)}
          disabled={!libre}
          onClick={() => lancerLots("Audit des supports", "/api/admin/audit-supports", 40, false)}
        >
          Relancer l inventaire complet
        </button>

        {enCours && (
          <p style={{ color: "#c8a96e", fontSize: "14px" }}>
            {enCours} en cours, ne ferme pas cette page...
          </p>
        )}

        {journal.length > 0 && (
          
