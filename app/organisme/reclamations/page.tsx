"use client";
import { useState, useEffect } from "react";

const LIBELLE_STATUT: any = {
  ouverte: "Ouverte",
  en_cours: "En cours",
  traitee: "Traitee",
  classee_sans_suite: "Classee sans suite",
};

const LIBELLE_ORIGINE: any = {
  stagiaire: "Stagiaire",
  entreprise: "Entreprise",
  financeur: "Financeur",
  formateur: "Formateur",
  autre: "Autre",
};

export default function PageReclamations() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);
  const [ouvert, setOuvert] = useState<any>({});
  const [brouillon, setBrouillon] = useState<any>({});

  const [auteur, setAuteur] = useState("");
  const [nom, setNom] = useState("");
  const [origine, setOrigine] = useState("stagiaire");
  const [objet, setObjet] = useState("");
  const [texte, setTexte] = useState("");

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
      const r = await fetch("/api/organisme/reclamation" + suffixe());
      const data = await r.json();
      if (data.ok) {
        setD(data);
        const b: any = {};
        for (const x of data.reclamations || []) {
          b[x.id] = { reponse: x.reponse || "", action: x.action_corrective || "" };
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

  async function consigner() {
    if (objet.trim().length < 3 || texte.trim().length < 10) {
      setErreur("Indiquez un objet et decrivez la reclamation.");
      return;
    }
    setOccupe(true);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/reclamation" + suffixe(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auteur_email: auteur || "non-renseigne@exemple.fr",
          auteur_nom: nom,
          origine: origine,
          objet: objet,
          message: texte,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Reclamation consignee au registre.");
        setAuteur(""); setNom(""); setObjet(""); setTexte("");
        setFormulaire(false);
        await charger();
      } else {
        setErreur(data.erreur || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setOccupe(false);
  }

  async function enregistrer(id: string, statut?: string) {
    setMessage("");
    setErreur("");
    const corps: any = { id: id };
    if (brouillon[id]) {
      corps.reponse = brouillon[id].reponse;
      corps.action_corrective = brouillon[id].action;
    }
    if (statut) corps.statut = statut;
    try {
      const r = await fetch("/api/organisme/reclamation" + suffixe(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
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

  function couleurStatut(s: string) {
    if (s === "traitee") return "#4caf50";
    if (s === "en_cours") return "#e8a33d";
    if (s === "classee_sans_suite") return "rgba(255,255,255,0.5)";
    return "#e8836a";
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          REGISTRE DES RECLAMATIONS
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Reclamations</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Indicateur 31 du referentiel national qualite
        </p>

        {d && (
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "24px 0" }}>
            <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
              <p style={{ color: d.ouvertes > 0 ? "#e8836a" : "#4caf50", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                {d.ouvertes}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                En attente · {d.total} au total
              </p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
              <p style={{ color: "#c8a96e", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                {d.delai_moyen_jours !== null ? d.delai_moyen_jours + " j" : "—"}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Delai moyen de reponse</p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
              <p style={{ color: "#c8a96e", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                {d.avec_action_corrective}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Avec action corrective</p>
            </div>
          </div>
        )}

        <button
          onClick={() => setFormulaire(!formulaire)}
          style={{ background: formulaire ? "none" : "#c8a96e", color: formulaire ? "#c8a96e" : "#050508", border: formulaire ? "1px solid rgba(200,169,110,0.45)" : "none", padding: "12px 24px", borderRadius: "20px", cursor: "pointer", fontSize: "15px", fontFamily: "Georgia,serif", fontWeight: "bold", marginBottom: "20px" }}
        >
          {formulaire ? "Annuler" : "Consigner une reclamation"}
        </button>

        {formulaire && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px", marginTop: 0, lineHeight: "1.6" }}>
              Pour une reclamation recue par telephone, par courrier ou de vive voix. Celles
              deposees par vos stagiaires depuis leur espace arrivent ici automatiquement.
            </p>

            <span style={LIBELLE}>Auteur (email)</span>
            <input value={auteur} onChange={(e) => setAuteur(e.target.value)} placeholder="marie.dupont@exemple.fr" style={CHAMP} />

            <span style={LIBELLE}>Nom</span>
            <input value={nom} onChange={(e) => setNom(e.target.value)} style={CHAMP} />

            <span style={LIBELLE}>Origine</span>
            <select value={origine} onChange={(e) => setOrigine(e.target.value)} style={CHAMP}>
              {(d && d.origines ? d.origines : ["stagiaire"]).map(function (o: string) {
                return <option key={o} value={o}>{LIBELLE_ORIGINE[o] || o}</option>;
              })}
            </select>

            <span style={LIBELLE}>Objet</span>
            <input value={objet} onChange={(e) => setObjet(e.target.value)} placeholder="Acces a la plateforme" style={CHAMP} />

            <span style={LIBELLE}>Ce qui a ete reproche</span>
            <textarea value={texte} onChange={(e) => setTexte(e.target.value)} rows={4} style={CHAMP} />

            <button
              onClick={consigner}
              disabled={occupe}
              style={{ background: occupe ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe ? "#8a8a8a" : "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: occupe ? "default" : "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
            >
              {occupe ? "Enregistrement..." : "Consigner"}
            </button>
          </div>
        )}

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement...</p>
          </div>
        ) : !d || d.reclamations.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: "1.7" }}>
              Aucune reclamation enregistree. Un registre vide n est pas un defaut, mais
              l auditeur verifiera que la procedure existe et que vos stagiaires la connaissent :
              elle figure dans leur livret d accueil.
            </p>
          </div>
        ) : (
          d.reclamations.map(function (r: any) {
            const estOuvert = ouvert[r.id] === true;
            return (
              <div key={r.id} style={{ ...CARTE, border: "1px solid " + (r.statut === "traitee" ? "rgba(200,169,110,0.25)" : "rgba(232,131,106,0.4)") }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ flex: "1 1 280px" }}>
                    <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 4px" }}>{r.objet}</h3>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0, wordBreak: "break-all" }}>
                      {r.auteur_nom ? r.auteur_nom + " · " : ""}{r.auteur_email} · {LIBELLE_ORIGINE[r.origine] || r.origine}
                      {" · recue le " + new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <span style={{ color: couleurStatut(r.statut), fontSize: "14px", fontWeight: "bold" }}>
                    {LIBELLE_STATUT[r.statut] || r.statut}
                  </span>
                </div>

                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "15px", lineHeight: "1.7", margin: "14px 0 0", whiteSpace: "pre-wrap" }}>
                  {r.message}
                </p>

                {r.reponse && !estOuvert && (
                  <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <p style={{ color: "#c8a96e", fontSize: "13px", margin: "0 0 4px" }}>
                      Reponse du {r.repondue_le ? new Date(r.repondue_le).toLocaleDateString("fr-FR") : ""}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: 0, lineHeight: "1.7", whiteSpace: "pre-wrap" }}>
                      {r.reponse}
                    </p>
                    {r.action_corrective && (
                      <>
                        <p style={{ color: "#c8a96e", fontSize: "13px", margin: "10px 0 4px" }}>Action corrective</p>
                        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: 0, lineHeight: "1.7" }}>
                          {r.action_corrective}
                        </p>
                      </>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px", marginTop: "14px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => setOuvert({ ...ouvert, [r.id]: !estOuvert })}
                    style={{ background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "7px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" }}
                  >
                    {estOuvert ? "Fermer" : r.reponse ? "Modifier la reponse" : "Repondre"}
                  </button>

                  {r.statut !== "traitee" && r.reponse && (
                    <button
                      onClick={() => enregistrer(r.id, "traitee")}
                      style={{ background: "none", border: "1px solid rgba(76,175,80,0.5)", color: "#4caf50", padding: "7px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" }}
                    >
                      Marquer traitee
                    </button>
                  )}
                </div>

                {estOuvert && (
                  <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <span style={LIBELLE}>Votre reponse ecrite</span>
                    <textarea
                      value={(brouillon[r.id] && brouillon[r.id].reponse) || ""}
                      onChange={(e) => setBrouillon({ ...brouillon, [r.id]: { ...(brouillon[r.id] || {}), reponse: e.target.value } })}
                      rows={4}
                      style={CHAMP}
                    />

                    <span style={LIBELLE}>Action corrective engagee</span>
                    <textarea
                      value={(brouillon[r.id] && brouillon[r.id].action) || ""}
                      onChange={(e) => setBrouillon({ ...brouillon, [r.id]: { ...(brouillon[r.id] || {}), action: e.target.value } })}
                      rows={3}
                      placeholder="Ce que vous avez change pour que cela ne se reproduise pas"
                      style={CHAMP}
                    />

                    <button
                      onClick={() => enregistrer(r.id, "en_cours")}
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
