"use client";

import { useEffect, useState } from "react";

const VERDICTS: Record<string, { label: string; couleur: string }> = {
  non_commence: { label: "Non commence", couleur: "#999999" },
  a_retravailler: { label: "A retravailler", couleur: "#c62828" },
  en_bonne_voie: { label: "En bonne voie", couleur: "#8a6d2f" },
  pret_pour_audit: { label: "Pret pour l'audit", couleur: "#2e7d32" },
  non_applicable: { label: "Non applicable", couleur: "#666666" },
};

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

const STYLE_BOUTON_INDICATEUR = {
  display: "inline-block",
  background: "#0a3d2e",
  color: "#ffffff",
  border: "none",
  padding: "10px 20px",
  borderRadius: 6,
  textDecoration: "none",
  fontSize: 15,
  fontWeight: "bold" as const,
};

export default function GrilleQualiopi() {
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [profilManquant, setProfilManquant] = useState(false);
  const [organisme, setOrganisme] = useState<any>(null);
  const [compte, setCompte] = useState<any>(null);
  const [groupes, setGroupes] = useState<any[]>([]);
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

  const prets = compte
    ? (compte.pret_pour_audit || 0)
    : 0;
  const pourcentage =
    compte && compte.total > 0
      ? Math.round((prets / compte.total) * 100)
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
                    {prets} sur {compte.total} indicateurs prets pour l'audit
                  </strong>
                  {" (" + pourcentage + " %)"}
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

                {g.indicateurs.map((i: any) => {
                  const v = VERDICTS[i.statut] || VERDICTS.non_commence;
                  return (
                    <div
                      key={i.id}
                      style={{
                        padding: "18px 0",
                        borderBottom: "1px solid #f0f0f0",
                      }}
                    >
                      <div style={{ marginBottom: 8 }}>
                        <strong style={{ color: "#0a3d2e" }}>
                          Indicateur {i.numero}
                        </strong>
                        <span style={{ marginLeft: 8 }}>{i.intitule}</span>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <span
                          style={{
                            display: "inline-block",
                            background: v.couleur,
                            color: "#ffffff",
                            padding: "4px 12px",
                            borderRadius: 12,
                            fontSize: 13,
                            marginRight: 10,
                          }}
                        >
                          {v.label}
                        </span>
                        {i.nb_preuves > 0 && (
                          <span style={{ fontSize: 13, color: "#666666" }}>
                            {i.nb_preuves} preuve(s)
                          </span>
                        )}
                      </div>

                      <a
                        href={"/admin/qualiopi/indicateur/" + i.id}
                        style={STYLE_BOUTON_INDICATEUR}
                      >
                        {i.statut === "non_commence"
                          ? "Commencer cet indicateur"
                          : "Continuer cet indicateur"}
                      </a>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
