"use client";

import { useEffect, useState } from "react";

const STATUTS = [
  { code: "non_commence", label: "Non commence", couleur: "#999999" },
  { code: "en_cours", label: "En cours", couleur: "#8a6d2f" },
  { code: "a_verifier", label: "A verifier", couleur: "#1565c0" },
  { code: "conforme", label: "Conforme", couleur: "#2e7d32" },
  { code: "non_applicable", label: "Non applicable", couleur: "#666666" },
];

const STYLE_CARTE = {
  border: "1px solid #dddddd",
  borderRadius: 8,
  padding: 20,
  marginBottom: 20,
  background: "#ffffff",
};

const STYLE_LIEN = {
  display: "inline-block",
  background: "#ffffff",
  color: "#0a3d2e",
  border: "1px solid #0a3d2e",
  padding: "10px 18px",
  borderRadius: 6,
  textDecoration: "none",
  fontSize: 15,
  marginBottom: 20,
  marginRight: 10,
};

const STYLE_BOUTON = {
  background: "#0a3d2e",
  color: "#ffffff",
  border: "none",
  padding: "10px 18px",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 15,
  marginBottom: 20,
};

export default function GrilleQualiopi() {
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [profilManquant, setProfilManquant] = useState(false);
  const [organisme, setOrganisme] = useState<any>(null);
  const [compte, setCompte] = useState<any>(null);
  const [groupes, setGroupes] = useState<any[]>([]);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [exportEnCours, setExportEnCours] = useState(false);
  const [messageExport, setMessageExport] = useState<string | null>(null);

  async function charger() {
    setChargement(true);
    setErreur(null);
    setProfilManquant(false);
    try {
      const r = await fetch("/api/qualiopi/grille");
      const data = await r.json();
      if (!data.ok) {
        if (data.profil_manquant) setProfilManquant(true);
        else setErreur(data.erreur || "Erreur de chargement");
      } else {
        setOrganisme(data.organisme);
        setCompte(data.compte);
        setGroupes(data.groupes || []);
      }
    } catch (e: any) {
      setErreur(String(e));
    }
    setChargement(false);
  }

  useEffect(() => {
    charger();
  }, []);

  function recalculer(nouveaux: any[]) {
    const tous: any[] = [];
    nouveaux.forEach((g) => g.indicateurs.forEach((i: any) => tous.push(i)));
    setCompte({
      total: tous.length,
      conforme: tous.filter((i) => i.statut === "conforme").length,
      a_verifier: tous.filter((i) => i.statut === "a_verifier").length,
      en_cours: tous.filter((i) => i.statut === "en_cours").length,
      non_commence: tous.filter((i) => i.statut === "non_commence").length,
      non_applicable: tous.filter((i) => i.statut === "non_applicable").length,
    });
  }

  async function changerStatut(indicateurId: string, statut: string) {
    setEnCours(indicateurId);
    setErreur(null);
    try {
      const r = await fetch("/api/qualiopi/grille", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ indicateur_id: indicateurId, statut: statut }),
      });
      const data = await r.json();
      if (data.ok) {
        const nouveaux = groupes.map((g) => ({
          numero: g.numero,
          intitule: g.intitule,
          indicateurs: g.indicateurs.map((i: any) =>
            i.id === indicateurId ? { ...i, statut: statut } : i
          ),
        }));
        setGroupes(nouveaux);
        recalculer(nouveaux);
      } else {
        setErreur(data.erreur || "Erreur d'enregistrement");
      }
    } catch (e: any) {
      setErreur(String(e));
    }
    setEnCours(null);
  }

  async function exporterPdf() {
    setExportEnCours(true);
    setMessageExport(null);
    setErreur(null);
    try {
      const r = await fetch("/api/qualiopi/export", { method: "POST" });
      if (!r.ok) {
        const data = await r.json();
        setErreur(data.erreur || "Erreur de generation");
        setExportEnCours(false);
        return;
      }
      const blob = await r.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dossier_qualiopi.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setMessageExport("Dossier telecharge.");
    } catch (e: any) {
      setErreur(String(e));
    }
    setExportEnCours(false);
  }

  const pourcentage =
    compte && compte.total > 0
      ? Math.round((compte.conforme / compte.total) * 100)
      : 0;

  return (
    <div
      style={{
        fontFamily: "Georgia, serif",
        background: "#ffffff",
        color: "#1a1a1a",
        minHeight: "100vh",
        colorScheme: "light",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 32 }}>
        <h1
          style={{
            color: "#0a3d2e",
            borderBottom: "3px solid #0a3d2e",
            paddingBottom: 10,
          }}
        >
          Preparation Qualiopi
        </h1>

        {chargement && <p>Chargement...</p>}

        {profilManquant && (
          <div style={STYLE_CARTE}>
            <p style={{ marginTop: 0 }}>
              Renseignez d'abord le profil de votre organisme : c'est lui qui
              determine les indicateurs qui vous concernent.
            </p>
            <a href="/admin/qualiopi/mon-organisme" style={STYLE_LIEN}>
              Renseigner mon organisme
            </a>
          </div>
        )}

        {erreur && <p style={{ color: "#c62828" }}>Erreur : {erreur}</p>}

        {!chargement && !profilManquant && compte && (
          <div>
            <div
              style={{
                background: "#f4f4f0",
                padding: 20,
                borderRadius: 8,
                marginBottom: 24,
              }}
            >
              <strong style={{ fontSize: 18 }}>
                {organisme && organisme.raison_sociale
                  ? organisme.raison_sociale
                  : "Mon organisme"}
              </strong>
              {organisme && organisme.numero_da && (
                <span style={{ color: "#666666" }}>
                  {" - DA " + organisme.numero_da}
                </span>
              )}
              {organisme && organisme.date_audit_prevue && (
                <div style={{ marginTop: 6, color: "#8a6d2f" }}>
                  Audit prevu le{" "}
                  {new Date(organisme.date_audit_prevue).toLocaleDateString(
                    "fr-FR"
                  )}
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    height: 24,
                    background: "#dddddd",
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: pourcentage + "%",
                      background: "#2e7d32",
                    }}
                  />
                </div>
                <div style={{ marginTop: 8, fontSize: 15 }}>
                  <strong>
                    {compte.conforme} sur {compte.total} indicateurs conformes
                  </strong>
                  {" (" + pourcentage + " %)"}
                </div>
                <div style={{ marginTop: 6, fontSize: 14, color: "#555555" }}>
                  {compte.en_cours} en cours, {compte.a_verifier} a verifier,{" "}
                  {compte.non_commence} non commences
                </div>
              </div>
            </div>

            <div>
              <a href="/admin/qualiopi/mon-organisme" style={STYLE_LIEN}>
                Modifier le profil de mon organisme
              </a>
              <button
                onClick={exporterPdf}
                disabled={exportEnCours}
                style={STYLE_BOUTON}
              >
                {exportEnCours
                  ? "Generation en cours..."
                  : "Telecharger le dossier PDF"}
              </button>
            </div>

            {messageExport && (
              <p style={{ color: "#0a3d2e", fontWeight: "bold" }}>
                {messageExport}
              </p>
            )}

            {groupes.map((g: any) => (
              <div key={g.numero} style={STYLE_CARTE}>
                <h2
                  style={{
                    color: "#0a3d2e",
                    fontSize: 17,
                    marginTop: 0,
                    borderBottom: "1px solid #eeeeee",
                    paddingBottom: 8,
                  }}
                >
                  Critere {g.numero} - {g.intitule}
                  <span style={{ color: "#999999", fontWeight: "normal" }}>
                    {" (" + g.indicateurs.length + ")"}
                  </span>
                </h2>

                {g.indicateurs.map((i: any) => (
                  <div
                    key={i.id}
                    style={{
                      padding: "14px 0",
                      borderBottom: "1px solid #f0f0f0",
                    }}
                  >
                    <div style={{ marginBottom: 8 }}>
                      <strong style={{ color: "#0a3d2e" }}>
                        Indicateur {i.numero}
                      </strong>
                      <span style={{ marginLeft: 8 }}>{i.intitule}</span>
                    </div>

                    <div style={{ marginBottom: 8 }}>
                      <a
                        href={"/admin/qualiopi/indicateur/" + i.id}
                        style={{ color: "#0a3d2e", fontSize: 14 }}
                      >
                        Gerer les preuves
                        {i.nb_preuves > 0 ? " (" + i.nb_preuves + ")" : ""}
                      </a>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {STATUTS.map((s) => (
                        <button
                          key={s.code}
                          onClick={() => changerStatut(i.id, s.code)}
                          disabled={enCours === i.id}
                          style={{
                            border:
                              i.statut === s.code
                                ? "2px solid " + s.couleur
                                : "1px solid #cccccc",
                            background:
                              i.statut === s.code ? s.couleur : "#ffffff",
                            color: i.statut === s.code ? "#ffffff" : "#555555",
                            padding: "6px 12px",
                            borderRadius: 14,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
