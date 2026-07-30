"use client";
import { useState, useEffect } from "react";

export default function PageOrganismes() {
  const [organismes, setOrganismes] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const [raison, setRaison] = useState("");
  const [emailContact, setEmailContact] = useState("");
  const [siret, setSiret] = useState("");
  const [numeroDa, setNumeroDa] = useState("");
  const [telephone, setTelephone] = useState("");
  const [qualiopi, setQualiopi] = useState(false);
  const [certificateur, setCertificateur] = useState("");

  useEffect(function () {
    charger();
  }, []);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/admin/organismes");
      const data = await r.json();
      if (data.ok) setOrganismes(data.organismes || []);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function creer() {
    if (!raison.trim() || !emailContact.trim()) return;
    setOccupe(true);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/admin/organismes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raison_sociale: raison,
          email_contact: emailContact,
          siret: siret,
          numero_da: numeroDa,
          telephone: telephone,
          qualiopi: qualiopi,
          certificateur: certificateur,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Organisme cree. Identifiant : " + (data.organisme?.tenant_id || ""));
        setRaison(""); setEmailContact(""); setSiret(""); setNumeroDa("");
        setTelephone(""); setQualiopi(false); setCertificateur("");
        await charger();
      } else {
        setErreur(data.erreur || "Creation impossible.");
      }
    } catch (e: any) {
      setErreur("Creation impossible : " + String(e));
    }
    setOccupe(false);
  }

  async function changerStatut(id: string, statut: string) {
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/admin/organismes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, statut: statut }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Statut mis a jour.");
        await charger();
      } else {
        setErreur(data.erreur || "Modification impossible.");
      }
    } catch (e: any) {
      setErreur("Modification impossible : " + String(e));
    }
  }

  const CADRE: any = {
    minHeight: "100vh",
    background: "#050508",
    color: "#fff",
    fontFamily: "Georgia, serif",
    padding: "40px 20px",
  };

  const CARTE: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.25)",
    borderRadius: "12px",
    padding: "24px 28px",
    marginBottom: "22px",
  };

  const CHAMP: any = {
    width: "100%",
    padding: "13px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "16px",
    fontFamily: "Georgia,serif",
    boxSizing: "border-box",
    marginBottom: "12px",
  };

  const LIBELLE: any = {
    display: "block",
    color: "#c8a96e",
    fontSize: "14px",
    marginBottom: "6px",
  };

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 8px" }}>
          CLIENTS DU PACK
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Organismes de formation</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          {organismes.length} organisme(s) · ouvrez un compte, il recevra son propre espace cloisonne
        </p>

        <div style={{ ...CARTE, marginTop: "28px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "19px", margin: "0 0 16px" }}>Ouvrir un compte client</h2>

          <span style={LIBELLE}>Raison sociale</span>
          <input value={raison} onChange={(e) => setRaison(e.target.value)} placeholder="Formation Conseil SARL" style={CHAMP} />

          <span style={LIBELLE}>Email de contact</span>
          <input value={emailContact} onChange={(e) => setEmailContact(e.target.value)} placeholder="direction@exemple.fr" style={CHAMP} />

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}>
              <span style={LIBELLE}>SIRET (facultatif)</span>
              <input value={siret} onChange={(e) => setSiret(e.target.value)} style={CHAMP} />
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <span style={LIBELLE}>Numero de declaration d activite</span>
              <input value={numeroDa} onChange={(e) => setNumeroDa(e.target.value)} style={CHAMP} />
            </div>
          </div>

          <span style={LIBELLE}>Telephone (facultatif)</span>
          <input value={telephone} onChange={(e) => setTelephone(e.target.value)} style={CHAMP} />

          <div
            onClick={() => setQualiopi(!qualiopi)}
            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "8px", cursor: "pointer", background: qualiopi ? "rgba(200,169,110,0.15)" : "rgba(255,255,255,0.04)", border: qualiopi ? "2px solid #c8a96e" : "1px solid rgba(255,255,255,0.12)", marginBottom: "12px" }}
          >
            <span style={{ width: "22px", height: "22px", borderRadius: "5px", background: qualiopi ? "#c8a96e" : "transparent", border: qualiopi ? "2px solid #c8a96e" : "2px solid #999", color: "#050508", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
              {qualiopi ? "✓" : ""}
            </span>
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "15px" }}>Deja certifie Qualiopi</span>
          </div>

          {qualiopi && (
            <>
              <span style={LIBELLE}>Certificateur</span>
              <input value={certificateur} onChange={(e) => setCertificateur(e.target.value)} placeholder="AFNOR, ICPF..." style={CHAMP} />
            </>
          )}

          <button
            onClick={creer}
            disabled={occupe || !raison.trim() || !emailContact.trim()}
            style={{ background: occupe || !raison.trim() || !emailContact.trim() ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe || !raison.trim() || !emailContact.trim() ? "#8a8a8a" : "#050508", padding: "14px 30px", borderRadius: "8px", border: "none", cursor: occupe ? "default" : "pointer", fontWeight: "bold", fontSize: "16px", fontFamily: "Georgia,serif", width: "100%" }}
          >
            {occupe ? "Creation..." : "Ouvrir le compte"}
          </button>
        </div>

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold", wordBreak: "break-all" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement...</p></div>
        ) : organismes.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucun organisme client pour le moment.
            </p>
          </div>
        ) : (
          organismes.map(function (o) {
            return (
              <div key={o.id} style={CARTE}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <h3 style={{ color: "#fff", fontSize: "18px", margin: "0 0 4px" }}>{o.raison_sociale}</h3>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", margin: "0 0 4px" }}>{o.email_contact}</p>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", margin: 0, wordBreak: "break-all" }}>
                      Identifiant : {o.tenant_id}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ color: "#c8a96e", fontSize: "24px", fontWeight: "bold", margin: "0 0 2px" }}>{o.stagiaires}</p>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 }}>stagiaire(s)</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "16px", flexWrap: "wrap" }}>
                  <span style={{ background: o.statut === "actif" ? "rgba(76,175,80,0.18)" : "rgba(232,131,106,0.18)", color: o.statut === "actif" ? "#4caf50" : "#e8836a", padding: "5px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold" }}>
                    {o.statut}
                  </span>
                  {o.qualiopi && (
                    <span style={{ background: "rgba(200,169,110,0.18)", color: "#c8a96e", padding: "5px 14px", borderRadius: "20px", fontSize: "13px" }}>
                      Qualiopi{o.certificateur ? " · " + o.certificateur : ""}
                    </span>
                  )}
                  <button
                    onClick={() => changerStatut(o.id, o.statut === "actif" ? "suspendu" : "actif")}
                    style={{ background: "none", border: "1px solid rgba(200,169,110,0.4)", color: "#c8a96e", padding: "6px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" }}
                  >
                    {o.statut === "actif" ? "Suspendre" : "Reactiver"}
                  </button>
                  <a
                    href={"/organisme/stagiaires?tenant=" + o.tenant_id}
                    style={{ color: "#c8a96e", fontSize: "13px", textDecoration: "underline" }}
                  >
                    Voir ses stagiaires
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
