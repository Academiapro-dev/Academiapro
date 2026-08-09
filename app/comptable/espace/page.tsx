"use client";
import { useState, useEffect } from "react";

// L ESPACE DU DIRIGEANT.
//
// Il n est pas comptable et ne le sera jamais. Il vient pour trois choses,
// dans cet ordre : savoir ce qu on lui reclame, envoyer une photo de
// facture, repartir. Tout le reste le ferait fuir.
//
// La page est concue pour le TELEPHONE : c est la que la photo se prend.
// Un bouton unique, tres grand, qui ouvre directement l appareil photo.

const BLEU = "#1a3a6b";
const OR = "#c8a96e";
const NOIR = "#050508";

export default function EspaceClient() {
  const [jeton, setJeton] = useState("");
  const [donnees, setDonnees] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState("");
  const [pour, setPour] = useState("");

  useEffect(function () {
    const j = new URLSearchParams(window.location.search).get("j") || "";
    setJeton(j);
    if (j) charger(j);
    else {
      setErreur("Ce lien est incomplet. Utilisez celui que votre cabinet vous a envoyé.");
      setChargement(false);
    }
  }, []);

  async function charger(j: string) {
    setChargement(true);
    try {
      const r = await fetch("/api/comptable/portail?j=" + encodeURIComponent(j), { cache: "no-store" });
      const d = await r.json();
      if (d.ok) { setDonnees(d); setErreur(""); }
      else setErreur(d.erreur || "Accès impossible.");
    } catch (e: any) {
      setErreur("Connexion impossible. Réessayez dans un instant.");
    }
    setChargement(false);
  }

  async function envoyer(fichier: File | null) {
    if (!fichier) return;
    setEnvoi(true);
    setMessage("");
    try {
      const fd = new FormData();
      fd.append("fichier", fichier);
      if (pour) fd.append("ecriture_num", pour);

      const r = await fetch("/api/comptable/portail?j=" + encodeURIComponent(jeton), {
        method: "POST",
        body: fd,
      });
      const d = await r.json();

      if (d.ok) {
        setMessage("Votre document est bien arrivé.");
        setPour("");
        charger(jeton);
      } else {
        setMessage(d.erreur || "L'envoi n'a pas abouti.");
      }
    } catch (e: any) {
      setMessage("L'envoi n'a pas abouti. Réessayez.");
    }
    setEnvoi(false);
  }

  const page: any = {
    minHeight: "100vh",
    background: NOIR,
    color: "#fff",
    fontFamily: "Georgia, serif",
    padding: "0 0 60px",
  };

  const dedans: any = { maxWidth: "680px", margin: "0 auto", padding: "0 18px" };

  const carte: any = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(200,169,110,0.22)",
    borderRadius: "14px",
    padding: "20px",
    marginBottom: "14px",
  };

  function jour(d: any) {
    if (!d) return "";
    return new Date(d).toLocaleDateString("fr-FR");
  }

  if (chargement) {
    return (
      <div style={{ ...page, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: OR }}>Un instant…</p>
      </div>
    );
  }

  if (erreur && !donnees) {
    return (
      <div style={page}>
        <div style={{ ...dedans, paddingTop: "80px", textAlign: "center" }}>
          <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px" }}>MR. COMPTABLE</p>
          <h1 style={{ fontSize: "24px", margin: "16px 0" }}>Accès impossible</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: "1.7" }}>{erreur}</p>
        </div>
      </div>
    );
  }

  const attendues = (donnees && donnees.attendues) || [];
  const deposees = (donnees && donnees.deposees) || [];

  return (
    <div style={page}>

      <header style={{ borderBottom: "1px solid rgba(200,169,110,0.15)", padding: "22px 0", marginBottom: "26px" }}>
        <div style={dedans}>
          <p style={{ color: OR, fontSize: "11px", letterSpacing: "3px", margin: "0 0 6px" }}>MR. COMPTABLE</p>
          <h1 style={{ fontSize: "22px", margin: 0 }}>{donnees.societe.nom}</h1>
        </div>
      </header>

      <div style={dedans}>

        {/* LE DEPOT, EN PREMIER. C est ce pour quoi il est venu. */}
        <div style={{ ...carte, borderColor: "rgba(200,169,110,0.45)", textAlign: "center", padding: "28px 20px" }}>
          <h2 style={{ fontSize: "19px", margin: "0 0 8px" }}>Envoyer une facture</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px", lineHeight: "1.6", margin: "0 0 20px" }}>
            Photographiez le document. Une photo nette suffit : il est lu
            automatiquement.
          </p>

          {pour && (
            <p style={{ color: OR, fontSize: "13px", margin: "0 0 14px" }}>
              Pour l'écriture {pour} · <span onClick={function () { setPour(""); }} style={{ textDecoration: "underline", cursor: "pointer" }}>annuler</span>
            </p>
          )}

          <label
            style={{
              display: "block",
              background: envoi ? "rgba(200,169,110,0.3)" : OR,
              color: envoi ? "#8a8a8a" : NOIR,
              padding: "18px 20px",
              borderRadius: "10px",
              fontWeight: "bold",
              fontSize: "17px",
              cursor: envoi ? "default" : "pointer",
            }}
          >
            {envoi ? "Envoi en cours…" : "Prendre une photo ou choisir un fichier"}
            <input
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              disabled={envoi}
              onChange={function (e) { envoyer(e.target.files ? e.target.files[0] : null); }}
              style={{ display: "none" }}
            />
          </label>

          {message && (
            <p style={{ color: message.indexOf("arrivé") >= 0 ? "#00e676" : "#e8836a", fontSize: "14px", margin: "14px 0 0" }}>
              {message}
            </p>
          )}
        </div>

        {/* CE QU ON LUI RECLAME. */}
        {attendues.length > 0 && (
          <div style={carte}>
            <h2 style={{ fontSize: "18px", margin: "0 0 6px" }}>
              {attendues.length} justificatif{attendues.length > 1 ? "s" : ""} attendu{attendues.length > 1 ? "s" : ""}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0 0 16px" }}>
              {donnees.total_attendu.toFixed(2)} € au total. Touchez une ligne pour y
              rattacher votre envoi.
            </p>

            {attendues.map(function (m: any) {
              return (
                <div
                  key={m.numero}
                  onClick={function () { setPour(m.numero); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  style={{
                    padding: "12px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.libelle || m.numero}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", marginTop: "3px" }}>
                      {jour(m.date)} · {m.numero}
                    </div>
                  </div>
                  <div style={{ color: OR, fontSize: "14px", whiteSpace: "nowrap" }}>
                    {m.montant.toFixed(2)} €
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {attendues.length === 0 && (
          <div style={carte}>
            <p style={{ color: "#00e676", fontSize: "15px", margin: 0 }}>
              Rien ne vous est réclamé. Tous vos justificatifs sont arrivés.
            </p>
          </div>
        )}

        {/* CE QU IL A DEJA ENVOYE. Le rassurer, pour qu il n envoie pas deux
            fois la meme piece. */}
        {deposees.length > 0 && (
          <div style={carte}>
            <h2 style={{ fontSize: "17px", margin: "0 0 14px" }}>Vos derniers envois</h2>
            {deposees.map(function (p: any, i: number) {
              return (
                <div key={i} style={{ padding: "9px 0", borderBottom: i < deposees.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none", fontSize: "13px", color: "rgba(255,255,255,0.6)" }}>
                  {p.nom}
                  <span style={{ color: "rgba(255,255,255,0.35)", marginLeft: "8px" }}>
                    {jour(p.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", textAlign: "center", marginTop: "26px", lineHeight: "1.7" }}>
          Ce lien vous est personnel. Ne le transmettez pas.
        </p>

      </div>
    </div>
  );
}
