"use client";

import { useEffect, useState } from "react";

// ══════════════════════════════════════════════════════════════════════════
// L ECRAN DE CONNEXION A GOOGLE AGENDA — 14/09.
//
// Le client clique une fois, autorise chez Google, revient ici. Tant qu il
// n a pas connecte son agenda, aucun rendez-vous ne peut etre pose depuis
// une fiche du CRM.
//
// ⚠️ LA CONNEXION EST UNE REDIRECTION, PAS UN APPEL : la route
// /api/organisme/google repond par un renvoi vers Google. On change donc
// l adresse de la page, on ne fait jamais de fetch pour se connecter.
// ══════════════════════════════════════════════════════════════════════════

type Compte = {
  email?: string | null;
  calendar_id?: string | null;
  actif?: boolean | null;
  connecte_le?: string | null;
  expire_le?: string | null;
};

export default function AgendaPage() {
  const [chargement, setChargement] = useState(true);
  const [connecte, setConnecte] = useState(false);
  const [compte, setCompte] = useState<Compte | null>(null);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  async function lireEtat() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/google?etat=1", { cache: "no-store" });
      const j = await r.json();
      if (!j.ok) {
        setErreur(j.erreur || "Lecture impossible pour le moment.");
      } else {
        setConnecte(!!j.connecte);
        setCompte(j.compte || null);
      }
    } catch {
      setErreur("Lecture impossible pour le moment.");
    }
    setChargement(false);
  }

  useEffect(() => {
    lireEtat();
    const p = new URLSearchParams(window.location.search);
    if (p.get("connecte") === "1") setMessage("Votre agenda est connecté.");
    if (p.get("erreur")) setErreur("La connexion a échoué : " + p.get("erreur"));
  }, []);

  function connecter() {
    window.location.href = "/api/organisme/google";
  }

  async function deconnecter() {
    if (!confirm("Déconnecter votre agenda ? Les rendez-vous déjà créés y restent.")) return;
    try {
      const r = await fetch("/api/organisme/google?deconnecter=1", { cache: "no-store" });
      const j = await r.json();
      setMessage(j.message || "Agenda déconnecté.");
    } catch {
      setErreur("La déconnexion n'a pas abouti.");
    }
    lireEtat();
  }

  const cadre = {
    border: "1px solid #e2e2e2",
    borderRadius: 10,
    padding: 20,
    marginTop: 18,
    background: "#fff",
  } as const;

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: 26, marginBottom: 6 }}>Mon agenda</h1>
      <p style={{ color: "#555", marginTop: 0, lineHeight: 1.5 }}>
        Reliez votre agenda Google pour poser vos rendez-vous directement depuis la fiche d&apos;un client.
        Vous restez propriétaire de votre agenda : vous pouvez le détacher à tout moment.
      </p>

      {message ? (
        <div style={{ background: "#eef7ee", border: "1px solid #bcd9bc", borderRadius: 8, padding: "12px 14px", marginTop: 16 }}>
          {message}
        </div>
      ) : null}

      {erreur ? (
        <div style={{ background: "#fdecec", border: "1px solid #efb9b9", borderRadius: 8, padding: "12px 14px", marginTop: 16 }}>
          {erreur}
        </div>
      ) : null}

      <div style={cadre}>
        {chargement ? (
          <p style={{ margin: 0, color: "#666" }}>Lecture en cours…</p>
        ) : connecte ? (
          <>
            <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: 17 }}>Agenda connecté</p>
            <p style={{ margin: "0 0 14px", color: "#555" }}>
              {compte?.email ? "Compte : " + compte.email : "Compte Google relié."}
              {compte?.connecte_le ? " · depuis le " + new Date(compte.connecte_le).toLocaleDateString("fr-FR") : ""}
            </p>
            <button onClick={deconnecter} style={{ padding: "10px 16px", fontSize: 15, borderRadius: 8, border: "1px solid #c9c9c9", background: "#fafafa", cursor: "pointer" }}>
              Détacher cet agenda
            </button>
          </>
        ) : (
          <>
            <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: 17 }}>Aucun agenda relié</p>
            <p style={{ margin: "0 0 14px", color: "#555" }}>
              Google vous demandera votre accord, puis vous ramènera ici.
            </p>
            <button onClick={connecter} style={{ padding: "12px 20px", fontSize: 16, fontWeight: 600, borderRadius: 8, border: "none", background: "#1a73e8", color: "#fff", cursor: "pointer" }}>
              Connecter mon agenda Google →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
