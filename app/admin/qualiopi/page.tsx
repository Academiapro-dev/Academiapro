"use client";

import { useEffect, useState } from "react";

const VERDICTS: Record<string, { label: string; couleur: string }> = {
  non_commence: { label: "Non commencé", couleur: "#999999" },
  a_retravailler: { label: "À retravailler", couleur: "#c62828" },
  en_bonne_voie: { label: "En bonne voie", couleur: "#8a6d2f" },
  pret_pour_audit: { label: "Prêt pour l'audit", couleur: "#2e7d32" },
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

  // LA SOUSCRIPTION. Le diagnostic est ouvert a tous ; l export du dossier
  // ne l est qu a ceux qui ont souscrit. C est ce qui distingue voir son
  // etat d emporter le travail.
  const [souscription, setSouscription] = useState<any>(null);
  const [souscrire, setSouscrire] = useState(false);
  const [messageSouscription, setMessageSouscription] = useState<string | null>(null);

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

    try {
      const rs = await fetch("/api/qualiopi/souscription", { cache: "no-store" });
      const ds = await rs.json();
      if (ds.ok) setSouscription(ds);
    } catch (e) {}

    setChargement(false);
  }

  useEffect(() => {
    charger();
  }, []);

  async function souscrireMaintenant() {
    setSouscrire(true);
    setMessageSouscription(null);
    try {
      const r = await fetch("/api/qualiopi/souscription", { method: "POST" });
      const d = await r.json();
      if (d.ok) {
        setMessageSouscription(d.message || "Souscription enregistrée.");
        charger();
      } else {
        setErreur(d.erreur || "Souscription impossible.");
      }
    } catch (e: any) {
      setErreur(String(e));
    }
    setSouscrire(false);
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
      setMessageExport("Dossier téléchargé.");
      charger();
    } catch (e: any) {
      setErreur(String(e));
    }
    setExportEnCours(false);
  }

  const prets = compte ? (compte.pret_pour_audit || 0) : 0;
  const pourcentage =
    compte && compte.total > 0 ? Math.round((prets / compte.total) * 100) : 0;

  const aSouscrit = souscription && souscription.souscrit === true;

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
          Préparation Qualiopi
        </h1>

        {chargement && <p>Chargement…</p>}

        {profilManquant && (
          <div style={STYLE_CARTE}>
            <p style={{ marginTop: 0 }}>
              Renseignez d'abord le profil de votre organisme : c'est lui qui
              détermine les indicateurs qui vous concernent.
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
                  Audit prévu le{" "}
                  {new Date(organisme.date_audit_prevue).toLocaleDateString("fr-FR")}
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
                    {prets} sur {compte.total} indicateurs prêts pour l'audit
                  </strong>
                  {" (" + pourcentage + " %)"}
                </div>
              </div>
            </div>

            {/* LA SOUSCRIPTION. Elle s affiche tant qu elle n a pas eu lieu,
                et elle explique ce qu elle ouvre — pas seulement son prix. */}
            {!aSouscrit && (
              <div
                style={{
                  ...STYLE_CARTE,
                  border: "2px solid #0a3d2e",
                  background: "#f7faf8",
                }}
              >
                <h2 style={{ color: "#0a3d2e", fontSize: 19, marginTop: 0 }}>
                  Emporter votre dossier
                </h2>
                <p style={{ fontSize: 15.5, lineHeight: 1.75, margin: "0 0 8px" }}>
                  Vous voyez où vous en êtes sur les {compte.total} indicateurs qui vous
                  concernent. La souscription ouvre l'export du dossier de preuves
                  complet, classé dans l'ordre du référentiel, celui que vous
                  présenterez à l'auditeur.
                </p>
                <p style={{ fontSize: 15, lineHeight: 1.75, color: "#555", margin: "0 0 18px" }}>
                  1 190 € hors taxes, une fois, pour douze mois — ce qui couvre la
                  préparation et l'audit initial. Remboursement sur simple demande
                  dans les trente jours, tant que le dossier n'a pas été exporté.
                </p>
                <button
                  onClick={souscrireMaintenant}
                  disabled={souscrire}
                  style={{ ...STYLE_BOUTON, fontSize: 16, padding: "13px 26px", marginBottom: 0 }}
                >
                  {souscrire ? "Enregistrement…" : "Souscrire — 1 190 € HT"}
                </button>
                {messageSouscription && (
                  <p style={{ color: "#0a3d2e", fontWeight: "bold", marginBottom: 0 }}>
                    {messageSouscription}
                  </p>
                )}
              </div>
            )}

            {aSouscrit && souscription.souscription && souscription.souscription.facture_numero && (
              <p style={{ color: "#666", fontSize: 14, marginBottom: 20 }}>
                Souscription enregistrée · facture {souscription.souscription.facture_numero}
              </p>
            )}

            <div>
              <a href="/admin/qualiopi/mon-organisme" style={STYLE_LIEN}>
                Modifier le profil de mon organisme
              </a>
              {aSouscrit ? (
                <button
                  onClick={exporterPdf}
                  disabled={exportEnCours}
                  style={STYLE_BOUTON}
                >
                  {exportEnCours
                    ? "Génération en cours…"
                    : "Télécharger le dossier PDF"}
                </button>
              ) : (
                <button
                  disabled
                  title="La souscription ouvre l'export du dossier"
                  style={{ ...STYLE_BOUTON, background: "#cccccc", cursor: "default" }}
                >
                  Télécharger le dossier PDF
                </button>
              )}
            </div>

            {messageExport && (
              <p style={{ color: "#0a3d2e", fontWeight: "bold" }}>{messageExport}</p>
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
                  Critère {g.numero} - {g.intitule}
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
