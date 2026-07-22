"use client";

import { useEffect, useState } from "react";

const STYLE_CHAMP = {
  width: "100%",
  padding: 10,
  fontSize: 15,
  marginTop: 4,
  marginBottom: 16,
  border: "1px solid #ccc",
  borderRadius: 4,
  background: "#ffffff",
  color: "#1a1a1a",
};

const STYLE_LIBELLE = {
  display: "block",
  fontWeight: 600,
  fontSize: 14,
};

export default function MaSociete() {
  const [chargement, setChargement] = useState(true);
  const [societe, setSociete] = useState<any>(null);
  const [enCours, setEnCours] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [legalName, setLegalName] = useState("");
  const [formationState, setFormationState] = useState("");
  const [formationDate, setFormationDate] = useState("");
  const [wyFilingId, setWyFilingId] = useState("");
  const [registeredAgent, setRegisteredAgent] = useState("");
  const [mailingAddress, setMailingAddress] = useState("");
  const [principalOffice, setPrincipalOffice] = useState("");
  const [memberResidence, setMemberResidence] = useState("FR");
  const [notes, setNotes] = useState("");

  async function charger() {
    setChargement(true);
    try {
      const r = await fetch("/api/compliance/onboarding");
      const d = await r.json();
      if (d.success) {
        setSociete(d.societe);
      } else {
        setMsg("Erreur : " + (d.error || "inconnue"));
      }
    } catch (e) {
      setMsg("Erreur : " + String(e));
    }
    setChargement(false);
  }

  useEffect(() => {
    charger();
  }, []);

  async function enregistrer() {
    setEnCours(true);
    setMsg(null);
    try {
      const r = await fetch("/api/compliance/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          legal_name: legalName.trim(),
          formation_state: formationState.trim(),
          formation_date: formationDate || null,
          wy_filing_id: wyFilingId.trim() || null,
          registered_agent_name: registeredAgent.trim() || null,
          mailing_address: mailingAddress.trim() || null,
          principal_office_address: principalOffice.trim() || null,
          member_residence: memberResidence,
          notes: notes.trim() || null,
        }),
      });
      const d = await r.json();
      if (d.success) {
        let m = "Societe enregistree : " + d.legal_name + ".";
        if (d.echeances?.generees) {
          m += " Vos echeances ont ete generees.";
        } else {
          m += " ATTENTION : les echeances n'ont pas pu etre generees (" +
            (d.echeances?.raison || "cause inconnue") + ").";
        }
        m += " Deconnectez-vous et reconnectez-vous pour acceder a votre tableau de bord.";
        setMsg(m);
        charger();
      } else {
        setMsg("Erreur : " + (d.error || "inconnue"));
      }
    } catch (e) {
      setMsg("Erreur : " + String(e));
    }
    setEnCours(false);
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
        <h1 style={{ color: "#0a3d2e", borderBottom: "3px solid #0a3d2e", paddingBottom: 10 }}>
          Ma societe
        </h1>

        {chargement && <p>Chargement...</p>}

        {!chargement && societe && (
          <>
            <div
              style={{
                background: "#f0f5f2",
                borderLeft: "4px solid #0a3d2e",
                padding: 16,
                marginBottom: 24,
              }}
            >
              <strong>{societe.legal_name}</strong><br />
              Nom d'usage : {societe.label}<br />
              Etat / pays de constitution : {societe.formation_state}<br />
              Date de constitution : {societe.formation_date || "-"}<br />
              Numero d'immatriculation : {societe.wy_filing_id || "-"}<br />
              Residence fiscale du fondateur : {societe.member_residence}
            </div>
            <p>
              Votre societe est enregistree. Pour modifier ces informations,
              contactez le support.
            </p>
            <p style={{ marginTop: 24 }}>
              <a href="/admin/compliance" style={{ color: "#0a3d2e" }}>
                Aller au tableau de bord
              </a>
            </p>
          </>
        )}

        {!chargement && !societe && (
          <>
            <div
              style={{
                background: "#f0f5f2",
                borderLeft: "4px solid #0a3d2e",
                padding: 16,
                marginBottom: 24,
              }}
            >
              Renseignez votre societe pour activer votre suivi de conformite.
              Vos echeances declaratives seront generees automatiquement a partir
              de ces informations.
            </div>

            <span style={STYLE_LIBELLE}>Nom d'usage (obligatoire)</span>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ma societe"
              style={STYLE_CHAMP}
            />

            <span style={STYLE_LIBELLE}>Denomination legale exacte (obligatoire)</span>
            <input
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="EXEMPLE PRO LLC"
              style={STYLE_CHAMP}
            />
            <p style={{ marginTop: -12, marginBottom: 16, fontSize: 13, color: "#666" }}>
              Exactement comme sur vos documents officiels, majuscules comprises.
            </p>

            <span style={STYLE_LIBELLE}>Etat ou pays de constitution (obligatoire)</span>
            <input
              value={formationState}
              onChange={(e) => setFormationState(e.target.value)}
              placeholder="WY"
              style={STYLE_CHAMP}
            />

            <span style={STYLE_LIBELLE}>Date de constitution</span>
            <input
              type="date"
              value={formationDate}
              onChange={(e) => setFormationDate(e.target.value)}
              style={STYLE_CHAMP}
            />

            <span style={STYLE_LIBELLE}>Numero d'immatriculation</span>
            <input
              value={wyFilingId}
              onChange={(e) => setWyFilingId(e.target.value)}
              style={STYLE_CHAMP}
            />

            <span style={STYLE_LIBELLE}>Agent enregistre</span>
            <input
              value={registeredAgent}
              onChange={(e) => setRegisteredAgent(e.target.value)}
              style={STYLE_CHAMP}
            />

            <span style={STYLE_LIBELLE}>Adresse postale</span>
            <input
              value={mailingAddress}
              onChange={(e) => setMailingAddress(e.target.value)}
              style={STYLE_CHAMP}
            />

            <span style={STYLE_LIBELLE}>Adresse du siege</span>
            <input
              value={principalOffice}
              onChange={(e) => setPrincipalOffice(e.target.value)}
              style={STYLE_CHAMP}
            />

            <span style={STYLE_LIBELLE}>Residence fiscale du fondateur</span>
            <input
              value={memberResidence}
              onChange={(e) => setMemberResidence(e.target.value)}
              style={STYLE_CHAMP}
            />

            <span style={STYLE_LIBELLE}>Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={STYLE_CHAMP}
            />

            <button
              onClick={enregistrer}
              disabled={enCours}
              style={{
                background: "#0a3d2e",
                color: "#ffffff",
                border: "none",
                padding: "14px 22px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {enCours ? "Enregistrement..." : "Enregistrer ma societe"}
            </button>
          </>
        )}

        {msg && (
          <p style={{ marginTop: 16, color: msg.indexOf("Erreur") === 0 || msg.indexOf("ATTENTION") !== -1 ? "#c62828" : "#0a3d2e" }}>
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}
