"use client";

import { useEffect, useState } from "react";

const STYLE_CARTE = {
  border: "1px solid #dddddd",
  borderRadius: 8,
  padding: 20,
  marginBottom: 20,
  background: "#ffffff",
};

const STYLE_CHAMP = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #cccccc",
  borderRadius: 6,
  fontSize: 15,
  background: "#ffffff",
  color: "#1a1a1a",
  marginBottom: 14,
};

const STYLE_BOUTON = {
  background: "#0a3d2e",
  color: "#ffffff",
  border: "none",
  padding: "12px 24px",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 15,
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
};

function taille(octets: number): string {
  if (!octets) return "";
  if (octets < 1024) return octets + " o";
  if (octets < 1024 * 1024) return Math.round(octets / 1024) + " Ko";
  return (octets / (1024 * 1024)).toFixed(1) + " Mo";
}

export default function PageIndicateur({ params }: { params: { id: string } }) {
  const indicateurId = params.id;

  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [preuves, setPreuves] = useState<any[]>([]);
  const [envoi, setEnvoi] = useState(false);
  const [titre, setTitre] = useState("");
  const [notes, setNotes] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);

  async function charger() {
    setChargement(true);
    setErreur(null);
    try {
      const r = await fetch(
        "/api/qualiopi/preuves?indicateur_id=" + indicateurId
      );
      const data = await r.json();
      if (data.ok) {
        setPreuves(data.preuves || []);
      } else {
        setErreur(data.erreur || "Erreur de chargement");
      }
    } catch (e: any) {
      setErreur(String(e));
    }
    setChargement(false);
  }

  useEffect(() => {
    charger();
  }, []);

  async function deposer() {
    if (!fichier) {
      setErreur("Choisissez d'abord un fichier.");
      return;
    }
    setEnvoi(true);
    setErreur(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("indicateur_id", indicateurId);
      form.append("titre", titre);
      form.append("notes", notes);
      form.append("fichier", fichier);

      const r = await fetch("/api/qualiopi/preuves", {
        method: "POST",
        body: form,
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Preuve deposee.");
        setTitre("");
        setNotes("");
        setFichier(null);
        charger();
      } else {
        setErreur(data.erreur || "Erreur de depot");
      }
    } catch (e: any) {
      setErreur(String(e));
    }
    setEnvoi(false);
  }

  async function supprimer(id: string) {
    setErreur(null);
    setMessage(null);
    try {
      const r = await fetch("/api/qualiopi/preuves?id=" + id, {
        method: "DELETE",
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Preuve supprimee.");
        charger();
      } else {
        setErreur(data.erreur || "Erreur de suppression");
      }
    } catch (e: any) {
      setErreur(String(e));
    }
  }

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
      <div style={{ maxWidth: 800, margin: "0 auto", padding: 32 }}>
        <a href="/admin/qualiopi" style={STYLE_LIEN}>
          Retour a la grille
        </a>

        <h1
          style={{
            color: "#0a3d2e",
            borderBottom: "3px solid #0a3d2e",
            paddingBottom: 10,
          }}
        >
          Preuves de l'indicateur
        </h1>

        <div style={STYLE_CARTE}>
          <h2 style={{ color: "#0a3d2e", fontSize: 18, marginTop: 0 }}>
            Deposer une preuve
          </h2>

          <span
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: 6,
              color: "#0a3d2e",
            }}
          >
            Fichier
          </span>
          <input
            type="file"
            onChange={(e) =>
              setFichier(e.target.files && e.target.files[0] ? e.target.files[0] : null)
            }
            style={STYLE_CHAMP}
          />

          <span
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: 6,
              color: "#0a3d2e",
            }}
          >
            Titre (facultatif)
          </span>
          <input
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Ex : Catalogue 2026 publie sur le site"
            style={STYLE_CHAMP}
          />

          <span
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: 6,
              color: "#0a3d2e",
            }}
          >
            Notes (facultatif)
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Ce que ce document prouve, ou l'auditeur le trouvera"
            style={STYLE_CHAMP}
          />

          <button onClick={deposer} disabled={envoi} style={STYLE_BOUTON}>
            {envoi ? "Depot en cours..." : "Deposer la preuve"}
          </button>

          <p style={{ fontSize: 13, color: "#666666", marginTop: 12 }}>
            20 Mo maximum par fichier. Chaque depot est horodate et scelle par
            une empreinte SHA-256.
          </p>
        </div>

        {message && (
          <p style={{ color: "#0a3d2e", fontWeight: "bold" }}>{message}</p>
        )}
        {erreur && <p style={{ color: "#c62828" }}>Erreur : {erreur}</p>}

        <div style={STYLE_CARTE}>
          <h2 style={{ color: "#0a3d2e", fontSize: 18, marginTop: 0 }}>
            Preuves deposees
            <span style={{ color: "#999999", fontWeight: "normal" }}>
              {" (" + preuves.length + ")"}
            </span>
          </h2>

          {chargement && <p>Chargement...</p>}

          {!chargement && preuves.length === 0 && (
            <p style={{ color: "#666666" }}>
              Aucune preuve deposee pour cet indicateur.
            </p>
          )}

          {preuves.map((p: any) => (
            <div
              key={p.id}
              style={{
                padding: "14px 0",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <div style={{ marginBottom: 6 }}>
                <strong>{p.titre}</strong>
                <span style={{ color: "#666666", fontSize: 13 }}>
                  {" "}
                  {taille(p.size_bytes)}
                </span>
              </div>

              {p.notes && (
                <div
                  style={{ fontSize: 14, color: "#555555", marginBottom: 6 }}
                >
                  {p.notes}
                </div>
              )}

              <div style={{ fontSize: 13, color: "#888888", marginBottom: 8 }}>
                Depose le{" "}
                {new Date(p.uploaded_at).toLocaleDateString("fr-FR")}
              </div>

              <div>
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: "#0a3d2e",
                      fontWeight: "bold",
                      marginRight: 16,
                    }}
                  >
                    Telecharger
                  </a>
                )}
                <button
                  onClick={() => supprimer(p.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#c62828",
                    cursor: "pointer",
                    fontSize: 14,
                    padding: 0,
                  }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
