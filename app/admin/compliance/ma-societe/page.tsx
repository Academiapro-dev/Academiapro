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

// Codes officiels a deux lettres. Le catalogue de regles s'appuie dessus :
// une saisie libre ("WYOMING" au lieu de "WY") ferait echouer la generation
// des echeances propres a l'Etat.
const ETATS = [
  { code: "", libelle: "-- Choisir --" },
  { code: "WY", libelle: "Wyoming (WY)" },
  { code: "DE", libelle: "Delaware (DE)" },
  { code: "FL", libelle: "Floride (FL)" },
  { code: "TX", libelle: "Texas (TX)" },
  { code: "NM", libelle: "Nouveau-Mexique (NM)" },
  { code: "NV", libelle: "Nevada (NV)" },
  { code: "CA", libelle: "Californie (CA)" },
  { code: "NY", libelle: "New York (NY)" },
  { code: "GB", libelle: "Royaume-Uni (GB)" },
  { code: "AUTRE", libelle: "Autre - a preciser en notes" },
];

const RESIDENCES = [
  { code: "FR", libelle: "France (FR)" },
  { code: "BE", libelle: "Belgique (BE)" },
  { code: "CH", libelle: "Suisse (CH)" },
  { code: "LU", libelle: "Luxembourg (LU)" },
  { code: "CA", libelle: "Canada (CA)" },
  { code: "AUTRE", libelle: "Autre" },
];

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

  // 🆕 09/09 : le contact des relances (courriel, SMS a J-7 et J-1,
  // interrupteur), modifiable a tout moment par le titulaire.
  const [emailContact, setEmailContact] = useState("");
  const [telephoneContact, setTelephoneContact] = useState("");
  const [relanceAuto, setRelanceAuto] = useState(false);
  const [contactEnCours, setContactEnCours] = useState(false);
  const [contactMsg, setContactMsg] = useState<string | null>(null);

  async function charger() {
    setChargement(true);
    try {
      const r = await fetch("/api/compliance/onboarding");
      const d = await r.json();
      if (d.success) {
        setSociete(d.societe);
        if (d.societe) {
          setEmailContact(d.societe.email_contact || "");
          setTelephoneContact(d.societe.telephone_contact || "");
          setRelanceAuto(d.societe.relance_auto === true);
        }
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
    if (!formationState) {
      setMsg("Erreur : choisissez l'Etat ou pays de constitution.");
      return;
    }

    setEnCours(true);
    setMsg(null);
    try {
      const r = await fetch("/api/compliance/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          legal_name: legalName.trim(),
          formation_state: formationState,
          formation_date: formationDate || null,
          wy_filing_id: wyFilingId.trim() || null,
          registered_agent_name: registeredAgent.trim() || null,
          mailing_address: mailingAddress.trim() || null,
          principal_office_address: principalOffice.trim() || null,
          member_residence: memberResidence,
          notes: notes.trim() || null,
          email_contact: emailContact.trim() || null,
          telephone_contact: telephoneContact.trim() || null,
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

  async function enregistrerContact() {
    setContactEnCours(true);
    setContactMsg(null);
    try {
      const r = await fetch("/api/compliance/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entite_id: societe ? societe.id : undefined,
          email_contact: emailContact.trim(),
          telephone_contact: telephoneContact.trim(),
          relance_auto: relanceAuto,
        }),
      });
      const d = await r.json();
      if (d.success) setContactMsg("Contact enregistre." + (relanceAuto ? " Les relances sont armees." : " Les relances sont desarmees."));
      else setContactMsg("Erreur : " + (d.error || "inconnue"));
    } catch (e) {
      setContactMsg("Erreur : " + String(e));
    }
    setContactEnCours(false);
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

            {/* 🆕 09/09 : le contact des relances, modifiable ici. */}
            <div style={{ border: "2px solid #0a3d2e", borderRadius: 10, padding: 18, margin: "24px 0" }}>
              <h2 style={{ color: "#0a3d2e", fontSize: 18, marginTop: 0 }}>Contact et relances</h2>
              <p style={{ fontSize: 14, color: "#555", marginTop: 0 }}>
                Les relances d'echeance partent a cette adresse ; a J-7 et J-1, un SMS part aussi a ce
                numero s'il est renseigne. C'est aussi l'adresse qui recoit les documents a signer.
              </p>
              <span style={STYLE_LIBELLE}>Adresse electronique de contact</span>
              <input value={emailContact} onChange={(e) => setEmailContact(e.target.value)} placeholder="vous@exemple.fr" style={STYLE_CHAMP} />
              <span style={STYLE_LIBELLE}>Telephone mobile (SMS a J-7 et J-1)</span>
              <input value={telephoneContact} onChange={(e) => setTelephoneContact(e.target.value)} placeholder="06 12 34 56 78" style={STYLE_CHAMP} />
              <label style={{ display: "block", fontSize: 15, marginBottom: 16, cursor: "pointer" }}>
                <input type="checkbox" checked={relanceAuto} onChange={(e) => setRelanceAuto(e.target.checked)} />{" "}
                Relances automatiques armees (J-60, J-30, J-15, J-7, J-1)
              </label>
              <button
                onClick={enregistrerContact}
                disabled={contactEnCours}
                style={{ background: "#0a3d2e", color: "#ffffff", border: "none", padding: "12px 20px", borderRadius: 6, cursor: "pointer", fontSize: 15, fontWeight: 600 }}
              >
                {contactEnCours ? "Enregistrement..." : "Enregistrer le contact"}
              </button>
              {contactMsg && (
                <p style={{ marginTop: 12, color: contactMsg.indexOf("Erreur") === 0 ? "#c62828" : "#0a3d2e" }}>{contactMsg}</p>
              )}
            </div>

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
            <select
              value={formationState}
              onChange={(e) => setFormationState(e.target.value)}
              style={STYLE_CHAMP}
            >
              {ETATS.map((e) => (
                <option key={e.code} value={e.code}>{e.libelle}</option>
              ))}
            </select>
            <p style={{ marginTop: -12, marginBottom: 16, fontSize: 13, color: "#666" }}>
              Vos echeances declaratives dependent de ce choix. Si votre Etat
              n'apparait pas, choisissez "Autre" et precisez-le en notes.
            </p>

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
            <select
              value={memberResidence}
              onChange={(e) => setMemberResidence(e.target.value)}
              style={STYLE_CHAMP}
            >
              {RESIDENCES.map((r) => (
                <option key={r.code} value={r.code}>{r.libelle}</option>
              ))}
            </select>

            {/* 🆕 09/09 : le contact des relances, des la creation. */}
            <span style={STYLE_LIBELLE}>Adresse electronique de contact (relances et documents a signer)</span>
            <input
              value={emailContact}
              onChange={(e) => setEmailContact(e.target.value)}
              placeholder="vous@exemple.fr"
              style={STYLE_CHAMP}
            />

            <span style={STYLE_LIBELLE}>Telephone mobile (SMS a J-7 et J-1, facultatif)</span>
            <input
              value={telephoneContact}
              onChange={(e) => setTelephoneContact(e.target.value)}
              placeholder="06 12 34 56 78"
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
