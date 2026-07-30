"use client";
import { useState, useEffect } from "react";

export default function PageSousTraitance() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);
  const [ouvert, setOuvert] = useState<any>({});
  const [brouillon, setBrouillon] = useState<any>({});

  const [prestataire, setPrestataire] = useState("");
  const [objet, setObjet] = useState("");
  const [siret, setSiret] = useState("");
  const [numeroDa, setNumeroDa] = useState("");
  const [contact, setContact] = useState("");

  useEffect(function () {
    charger();
  }, []);

  function suffixe() {
    try {
      const t = new URLSearchParams(window.location.search).get("tenant");
      return t ? "?tenant=" + t : "";
    } catch {
      return "";
    }
  }

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/soustraitance" + suffixe());
      const data = await r.json();
      if (data.ok) {
        setD(data);
        const b: any = {};
        for (const s of data.prestataires || []) {
          b[s.id] = {
            competence: s.competence_verifiee || "",
            evaluation: s.evaluation_prestation || "",
            formations: s.formations_concernees || "",
          };
        }
        setBrouillon(b);
      } else {
        setErreur(data.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function ajouter() {
    if (prestataire.trim().length < 2 || objet.trim().length < 5) {
      setErreur("Indiquez le prestataire et ce que vous lui confiez.");
      return;
    }
    setOccupe(true);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/soustraitance" + suffixe(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prestataire: prestataire,
          objet_confie: objet,
          siret: siret,
          numero_da: numeroDa,
          contact_email: contact,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(prestataire + " ajoute au registre.");
        setPrestataire(""); setObjet(""); setSiret(""); setNumeroDa(""); setContact("");
        setFormulaire(false);
        await charger();
      } else {
        setErreur(data.erreur || "Ajout impossible.");
      }
    } catch (e: any) {
      setErreur("Ajout impossible : " + String(e));
    }
    setOccupe(false);
  }

  async function modifier(id: string, corps: any) {
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/soustraitance" + suffixe(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, ...corps }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Enregistre.");
        await charger();
      } else {
        setErreur(data.erreur || "Modification impossible.");
      }
    } catch (e: any) {
      setErreur("Modification impossible : " + String(e));
    }
  }

  async function retirer(id: string, n: string) {
    setMessage("");
    setErreur("");
    try {
      const sep = suffixe() ? suffixe() + "&" : "?";
      const r = await fetch("/api/organisme/soustraitance" + sep + "id=" + id, { method: "DELETE" });
      const data = await r.json();
      if (data.ok) {
        setMessage(n + " retire.");
        await charger();
      } else {
        setErreur(data.erreur || "Suppression impossible.");
      }
    } catch (e: any) {
      setErreur("Suppression impossible : " + String(e));
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
    padding: "22px 26px",
    marginBottom: "18px",
  };

  const CHAMP: any = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "15px",
    lineHeight: "1.7",
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

  function pastille(actif: boolean, libelle: string, poser: any) {
    return (
      <span
        onClick={poser}
        style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "7px 14px", borderRadius: "20px", cursor: "pointer", background: actif ? "rgba(76,175,80,0.18)" : "rgba(255,255,255,0.05)", border: actif ? "1px solid rgba(76,175,80,0.5)" : "1px solid rgba(255,255,255,0.15)", color: actif ? "#4caf50" : "rgba(255,255,255,0.55)", fontSize: "13px" }}
      >
        {actif ? "✓" : "○"} {libelle}
      </span>
    );
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          PRESTATAIRES EXTERIEURS
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Ma sous-traitance</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Indicateur 27 du referentiel national qualite
        </p>

        {d && (
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "24px 0" }}>
            <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
              <p style={{ color: "#c8a96e", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>{d.actifs}</p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Prestataire(s) actif(s)</p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
              <p style={{ color: d.sans_contrat > 0 ? "#e8836a" : "#4caf50", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                {d.sans_contrat}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Sans contrat signe</p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
              <p style={{ color: d.sans_evaluation > 0 ? "#e8a33d" : "#4caf50", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                {d.sans_evaluation}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Sans evaluation</p>
            </div>
          </div>
        )}

        {d && d.actifs === 0 && !chargement && (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>
              Aucun prestataire enregistre. Si vous ne sous-traitez rien, l indicateur 27 ne
              vous concerne pas et vous pouvez le declarer non applicable dans votre profil.
              En revanche, si vous faites appel a un formateur independant ou a un autre
              organisme, il s applique et vous devez le documenter ici.
            </p>
          </div>
        )}

        <button
          onClick={() => setFormulaire(!formulaire)}
          style={{ background: formulaire ? "none" : "#c8a96e", color: formulaire ? "#c8a96e" : "#050508", border: formulaire ? "1px solid rgba(200,169,110,0.45)" : "none", padding: "12px 24px", borderRadius: "20px", cursor: "pointer", fontSize: "15px", fontFamily: "Georgia,serif", fontWeight: "bold", marginBottom: "20px" }}
        >
          {formulaire ? "Annuler" : "Ajouter un prestataire"}
        </button>

        {formulaire && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <span style={LIBELLE}>Prestataire</span>
            <input value={prestataire} onChange={(e) => setPrestataire(e.target.value)} placeholder="Cabinet Formation Plus" style={CHAMP} />

            <span style={LIBELLE}>Ce que vous lui confiez</span>
            <textarea value={objet} onChange={(e) => setObjet(e.target.value)} rows={3} placeholder="Animation des seances en direct du module 3" style={CHAMP} />

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 180px" }}>
                <span style={LIBELLE}>SIRET</span>
                <input value={siret} onChange={(e) => setSiret(e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 180px" }}>
                <span style={LIBELLE}>Numero de declaration</span>
                <input value={numeroDa} onChange={(e) => setNumeroDa(e.target.value)} style={CHAMP} />
              </div>
            </div>

            <span style={LIBELLE}>Contact</span>
            <input value={contact} onChange={(e) => setContact(e.target.value)} style={CHAMP} />

            <button
              onClick={ajouter}
              disabled={occupe}
              style={{ background: occupe ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe ? "#8a8a8a" : "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: occupe ? "default" : "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
            >
              {occupe ? "Ajout..." : "Ajouter"}
            </button>
          </div>
        )}

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement...</p>
          </div>
        ) : (
          (d ? d.prestataires : []).map(function (s: any) {
            const estOuvert = ouvert[s.id] === true;
            return (
              <div key={s.id} style={{ ...CARTE, border: "1px solid " + (s.complet ? "rgba(76,175,80,0.35)" : "rgba(232,131,106,0.45)"), opacity: s.actif ? 1 : 0.55 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ flex: "1 1 260px" }}>
                    <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 4px" }}>{s.prestataire}</h3>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                      {s.siret ? "SIRET " + s.siret : ""}
                      {s.numero_da ? " · DA " + s.numero_da : ""}
                      {s.contact_email ? " · " + s.contact_email : ""}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: "8px 0 0", lineHeight: "1.7" }}>
                      {s.objet_confie}
                    </p>
                  </div>
                  <span style={{ color: s.complet ? "#4caf50" : "#e8836a", fontSize: "13px", fontWeight: "bold" }}>
                    {s.complet ? "Dossier complet" : "A completer"}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
                  {pastille(s.contrat_signe, "Contrat signe", function () {
                    modifier(s.id, { contrat_signe: !s.contrat_signe, contrat_date: !s.contrat_signe ? new Date().toISOString().slice(0, 10) : null });
                  })}
                  {pastille(s.qualiopi_prestataire, "Certifie Qualiopi", function () {
                    modifier(s.id, { qualiopi_prestataire: !s.qualiopi_prestataire });
                  })}

                  <button
                    onClick={() => setOuvert({ ...ouvert, [s.id]: !estOuvert })}
                    style={{ background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "7px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" }}
                  >
                    {estOuvert ? "Fermer" : "Competence et evaluation"}
                  </button>

                  <button
                    onClick={() => modifier(s.id, { actif: !s.actif })}
                    style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "13px", padding: "0 6px" }}
                  >
                    {s.actif ? "Desactiver" : "Reactiver"}
                  </button>

                  <button
                    onClick={() => retirer(s.id, s.prestataire)}
                    style={{ background: "none", border: "none", color: "#e8836a", cursor: "pointer", fontSize: "13px", padding: 0 }}
                  >
                    Retirer
                  </button>
                </div>

                {!estOuvert && s.evaluation_prestation && (
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "12px 0 0" }}>
                    Evaluee le {s.evaluation_date ? new Date(s.evaluation_date).toLocaleDateString("fr-FR") : "—"}
                  </p>
                )}

                {estOuvert && (
                  <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <span style={LIBELLE}>Formations concernees</span>
                    <input
                      value={(brouillon[s.id] && brouillon[s.id].formations) || ""}
                      onChange={(e) => setBrouillon({ ...brouillon, [s.id]: { ...(brouillon[s.id] || {}), formations: e.target.value } })}
                      placeholder="F028, F030"
                      style={CHAMP}
                    />

                    <span style={LIBELLE}>Comment vous avez verifie sa competence AVANT</span>
                    <textarea
                      value={(brouillon[s.id] && brouillon[s.id].competence) || ""}
                      onChange={(e) => setBrouillon({ ...brouillon, [s.id]: { ...(brouillon[s.id] || {}), competence: e.target.value } })}
                      rows={3}
                      placeholder="CV recu, diplome verifie, entretien du 12 mars, references appelees..."
                      style={CHAMP}
                    />

                    <span style={{ ...LIBELLE, color: "#e8a33d" }}>
                      Comment vous avez evalue sa prestation APRES
                    </span>
                    <textarea
                      value={(brouillon[s.id] && brouillon[s.id].evaluation) || ""}
                      onChange={(e) => setBrouillon({ ...brouillon, [s.id]: { ...(brouillon[s.id] || {}), evaluation: e.target.value } })}
                      rows={3}
                      placeholder="C est cette case que les organismes oublient : retours des stagiaires, bilan avec le prestataire, decision de reconduire."
                      style={{ ...CHAMP, border: "1px solid rgba(232,163,61,0.5)" }}
                    />

                    <button
                      onClick={() => modifier(s.id, {
                        formations_concernees: brouillon[s.id] ? brouillon[s.id].formations : "",
                        competence_verifiee: brouillon[s.id] ? brouillon[s.id].competence : "",
                        evaluation_prestation: brouillon[s.id] ? brouillon[s.id].evaluation : "",
                      })}
                      style={{ background: "#c8a96e", color: "#050508", padding: "12px 24px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
                    >
                      Enregistrer
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
