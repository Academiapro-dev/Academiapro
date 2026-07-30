"use client";
import { useState, useEffect } from "react";

const LIBELLE_STATUT: any = {
  emise: "Emise",
  reglee: "Reglee",
  partielle: "Partiellement reglee",
  impayee: "Impayee",
  annulee: "Annulee",
};

export default function PageFactures() {
  const [d, setD] = useState<any>(null);
  const [annee, setAnnee] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);
  const [reglement, setReglement] = useState<any>({});

  const [type, setType] = useState("stagiaire");
  const [nom, setNom] = useState("");
  const [emailDest, setEmailDest] = useState("");
  const [designation, setDesignation] = useState("");
  const [quantite, setQuantite] = useState("1");
  const [prix, setPrix] = useState("");
  const [tva, setTva] = useState("0");
  const [echeance, setEcheance] = useState("");
  const [codeFormation, setCodeFormation] = useState("");

  useEffect(function () {
    charger(0);
  }, []);

  function suffixe(a: number) {
    let s = "";
    try {
      const t = new URLSearchParams(window.location.search).get("tenant");
      if (t) s = "tenant=" + t;
    } catch {}
    if (a) s = s ? s + "&annee=" + a : "annee=" + a;
    return s ? "?" + s : "";
  }

  async function charger(a: number) {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/facture" + suffixe(a));
      const data = await r.json();
      if (data.ok) {
        setD(data);
        setAnnee(data.annee);
        const reg: any = {};
        for (const f of data.factures || []) {
          reg[f.id] = String(f.montant_regle || "");
        }
        setReglement(reg);
      } else {
        setErreur(data.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function creer() {
    if (nom.trim().length < 2 || designation.trim().length < 3 || !prix) {
      setErreur("Indiquez le destinataire, la designation et le prix.");
      return;
    }
    setOccupe(true);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/facture" + suffixe(0), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinataire_type: type,
          destinataire_nom: nom,
          destinataire_email: emailDest,
          stagiaire_email: type === "stagiaire" ? emailDest : "",
          formation_code: codeFormation,
          designation: designation,
          quantite: quantite,
          prix_unitaire: prix,
          tva_taux: tva,
          echeance: echeance || null,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Facture " + (data.facture ? data.facture.numero : "") + " emise.");
        setNom(""); setEmailDest(""); setDesignation(""); setPrix(""); setQuantite("1");
        setEcheance(""); setCodeFormation("");
        setFormulaire(false);
        await charger(annee);
      } else {
        setErreur(data.erreur || "Emission impossible.");
      }
    } catch (e: any) {
      setErreur("Emission impossible : " + String(e));
    }
    setOccupe(false);
  }

  async function modifier(id: string, corps: any) {
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/facture" + suffixe(0), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, ...corps }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Enregistre.");
        await charger(annee);
      } else {
        setErreur(data.erreur || "Modification impossible.");
      }
    } catch (e: any) {
      setErreur("Modification impossible : " + String(e));
    }
  }

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR") + " EUR";
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
    padding: "20px 24px",
    marginBottom: "16px",
  };

  const CHAMP: any = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "15px",
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

  const BOUTON: any = {
    background: "none",
    border: "1px solid rgba(200,169,110,0.45)",
    color: "#c8a96e",
    padding: "8px 18px",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "Georgia,serif",
  };

  function enRetard(f: any) {
    if (f.statut === "reglee" || f.statut === "annulee") return false;
    if (!f.echeance) return false;
    return new Date(f.echeance).getTime() < Date.now();
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          FACTURATION
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 16px" }}>Mes factures</h1>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "24px", flexWrap: "wrap" }}>
          <button onClick={() => charger(annee - 1)} style={BOUTON}>← {annee - 1}</button>
          <span style={{ color: "#c8a96e", fontSize: "18px", fontWeight: "bold" }}>{annee}</span>
          <button onClick={() => charger(annee + 1)} style={BOUTON}>{annee + 1} →</button>
        </div>

        {d && (
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "20px" }}>
            <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
              <p style={{ color: "#c8a96e", fontSize: "22px", fontWeight: "bold", margin: "0 0 4px" }}>
                {euros(d.facture_ht)}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                Facture HT · {d.nombre} facture(s)
              </p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
              <p style={{ color: "#4caf50", fontSize: "22px", fontWeight: "bold", margin: "0 0 4px" }}>
                {euros(d.encaisse)}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Encaisse</p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
              <p style={{ color: d.reste_du > 0 ? "#e8a33d" : "#4caf50", fontSize: "22px", fontWeight: "bold", margin: "0 0 4px" }}>
                {euros(d.reste_du)}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Reste du</p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
              <p style={{ color: d.en_retard > 0 ? "#e8836a" : "#4caf50", fontSize: "22px", fontWeight: "bold", margin: "0 0 4px" }}>
                {euros(d.en_retard_montant)}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                En retard · {d.en_retard} facture(s)
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => setFormulaire(!formulaire)}
          style={{ background: formulaire ? "none" : "#c8a96e", color: formulaire ? "#c8a96e" : "#050508", border: formulaire ? "1px solid rgba(200,169,110,0.45)" : "none", padding: "12px 24px", borderRadius: "20px", cursor: "pointer", fontSize: "15px", fontFamily: "Georgia,serif", fontWeight: "bold", marginBottom: "20px" }}
        >
          {formulaire ? "Annuler" : "Emettre une facture"}
        </button>

        {formulaire && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <span style={LIBELLE}>Qui paie ?</span>
            <select value={type} onChange={(e) => setType(e.target.value)} style={CHAMP}>
              {Object.keys(d && d.destinataires ? d.destinataires : { stagiaire: "Stagiaire" }).map(function (k) {
                return <option key={k} value={k}>{d.destinataires[k]}</option>;
              })}
            </select>

            <span style={LIBELLE}>Nom ou raison sociale</span>
            <input value={nom} onChange={(e) => setNom(e.target.value)} style={CHAMP} />

            <span style={LIBELLE}>Email</span>
            <input value={emailDest} onChange={(e) => setEmailDest(e.target.value)} style={CHAMP} />

            <span style={LIBELLE}>Designation</span>
            <input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Formation Hypnose Praticien - 100 heures" style={CHAMP} />

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 120px" }}>
                <span style={LIBELLE}>Code formation</span>
                <input value={codeFormation} onChange={(e) => setCodeFormation(e.target.value)} placeholder="F028" style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 100px" }}>
                <span style={LIBELLE}>Quantite</span>
                <input value={quantite} onChange={(e) => setQuantite(e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 120px" }}>
                <span style={LIBELLE}>Prix unitaire HT</span>
                <input value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="1500" style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 100px" }}>
                <span style={LIBELLE}>TVA (%)</span>
                <input value={tva} onChange={(e) => setTva(e.target.value)} style={CHAMP} />
              </div>
            </div>

            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: "-4px 0 12px", lineHeight: "1.6" }}>
              La formation professionnelle continue est exoneree de TVA si vous detenez
              l attestation prevue a l article 261-4-4 a du Code general des impots. Laissez
              zero dans ce cas.
            </p>

            <span style={LIBELLE}>Echeance</span>
            <input type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} style={CHAMP} />

            <button
              onClick={creer}
              disabled={occupe}
              style={{ background: occupe ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe ? "#8a8a8a" : "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: occupe ? "default" : "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
            >
              {occupe ? "Emission..." : "Emettre la facture"}
            </button>
          </div>
        )}

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement...</p>
          </div>
        ) : !d || d.factures.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucune facture pour {annee}.
            </p>
          </div>
        ) : (
          d.factures.map(function (f: any) {
            const retard = enRetard(f);
            return (
              <div key={f.id} style={{ ...CARTE, border: "1px solid " + (f.statut === "annulee" ? "rgba(255,255,255,0.12)" : f.statut === "reglee" ? "rgba(76,175,80,0.35)" : retard ? "rgba(232,131,106,0.55)" : "rgba(232,163,61,0.35)"), opacity: f.statut === "annulee" ? 0.5 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ flex: "1 1 260px" }}>
                    <p style={{ color: "#c8a96e", fontSize: "13px", margin: "0 0 3px" }}>
                      Facture {f.numero} · emise le {new Date(f.emise_le).toLocaleDateString("fr-FR")}
                      {f.echeance ? " · echeance " + new Date(f.echeance).toLocaleDateString("fr-FR") : ""}
                    </p>
                    <h3 style={{ color: "#fff", fontSize: "16px", margin: "0 0 3px" }}>{f.destinataire_nom}</h3>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: 0 }}>
                      {(d.destinataires && d.destinataires[f.destinataire_type]) || f.destinataire_type}
                      {f.formation_code ? " · " + f.formation_code : ""}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "14px", margin: "8px 0 0" }}>
                      {f.designation}
                    </p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <p style={{ color: "#c8a96e", fontSize: "20px", fontWeight: "bold", margin: "0 0 2px" }}>
                      {euros(f.montant_ttc)}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", margin: 0 }}>
                      {euros(f.montant_ht)} HT
                      {Number(f.montant_tva) > 0 ? " + " + euros(f.montant_tva) + " TVA" : " · exonere"}
                    </p>
                    <p style={{ color: f.statut === "reglee" ? "#4caf50" : retard ? "#e8836a" : "#e8a33d", fontSize: "13px", fontWeight: "bold", margin: "6px 0 0" }}>
                      {retard ? "En retard" : LIBELLE_STATUT[f.statut] || f.statut}
                    </p>
                  </div>
                </div>

                {f.statut !== "annulee" && (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "14px", flexWrap: "wrap" }}>
                    <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px" }}>Regle</span>
                    <input
                      value={reglement[f.id] || ""}
                      onChange={(e) => setReglement({ ...reglement, [f.id]: e.target.value })}
                      placeholder="0"
                      style={{ ...CHAMP, width: "120px", marginBottom: 0, fontSize: "14px", padding: "8px 12px" }}
                    />
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                      sur {euros(f.montant_ttc)}
                    </span>

                    <button
                      onClick={() => modifier(f.id, { montant_regle: reglement[f.id] || 0 })}
                      style={BOUTON}
                    >
                      Enregistrer
                    </button>

                    <button
                      onClick={() => modifier(f.id, { montant_regle: f.montant_ttc })}
                      style={{ ...BOUTON, border: "1px solid rgba(76,175,80,0.5)", color: "#4caf50" }}
                    >
                      Reglee en totalite
                    </button>

                    <button
                      onClick={() => modifier(f.id, { annuler: true })}
                      style={{ background: "none", border: "none", color: "#e8836a", cursor: "pointer", fontSize: "13px", padding: 0 }}
                    >
                      Annuler la facture
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
