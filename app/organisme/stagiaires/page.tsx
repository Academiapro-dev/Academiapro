"use client";
import { useState, useEffect } from "react";

const LIBELLE_PAYEUR: any = {
  entreprise: "Entreprise (salariés)",
  opco: "OPCO",
  cpf: "CPF",
  pouvoirs_publics: "Pouvoirs publics",
  particulier: "Particulier (à ses frais)",
  organisme_formation: "Autre organisme de formation",
  fonds_propres: "Fonds propres",
  non_renseigne: "Non renseigné",
};

const LIBELLE_STATUT: any = {
  salarie_prive: "Salarié d'employeur privé",
  apprenti: "Apprenti",
  recherche_emploi: "En recherche d'emploi",
  particulier: "Particulier à ses frais",
  autre: "Autre stagiaire",
};

const LIBELLE_DISPOSITIF: any = {
  apprentissage: "Contrat d'apprentissage",
  professionnalisation: "Contrat de professionnalisation",
  reconversion_alternance: "Reconversion par alternance",
  transition_pro: "Projet de transition professionnelle",
  cpf: "Compte personnel de formation",
  demandeur_emploi: "Dispositif demandeurs d'emploi",
  travailleur_non_salarie: "Dispositif travailleurs non salariés",
  plan_developpement: "Plan de développement des compétences",
  public_europe: "Instances européennes",
  public_etat: "État",
  public_region: "Conseil régional",
  public_france_travail: "France Travail",
  public_autre: "Autres ressources publiques",
};

export default function PageStagiaires() {
  const [apprenants, setApprenants] = useState<any[]>([]);
  const [payeurs, setPayeurs] = useState<string[]>([]);
  const [statuts, setStatuts] = useState<string[]>([]);
  const [dispositifs, setDispositifs] = useState<string[]>([]);
  const [parPayeur, setParPayeur] = useState<any>({});
  const [chiffre, setChiffre] = useState(0);
  const [incomplets, setIncomplets] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [invitationEnCours, setInvitationEnCours] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  // La fiche ouverte en modification. Une seule a la fois : ouvrir tous les
  // champs de toutes les fiches ferait un mur illisible sur un registre de
  // cent stagiaires.
  const [ouverte, setOuverte] = useState("");
  const [brouillon, setBrouillon] = useState<any>({});

  const [saisie, setSaisie] = useState("");
  const [payeur, setPayeur] = useState("");
  const [statutStagiaire, setStatutStagiaire] = useState("");
  const [dispositif, setDispositif] = useState("");
  const [formation, setFormation] = useState("");
  const [prix, setPrix] = useState("");

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
      const r = await fetch("/api/organisme/stagiaires" + suffixe());
      const data = await r.json();
      if (data.ok) {
        setApprenants(data.apprenants || []);
        setPayeurs(data.payeurs || []);
        setStatuts(data.statuts || []);
        setDispositifs(data.dispositifs || []);
        setParPayeur(data.par_payeur || {});
        setChiffre(data.chiffre_declare || 0);
        setIncomplets(data.incomplets || 0);
      } else {
        setErreur(data.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function ajouter() {
    if (!saisie.trim()) return;
    setOccupe(true);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/stagiaires" + suffixe(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: saisie,
          payeur: payeur,
          statut_stagiaire: statutStagiaire,
          dispositif: dispositif,
          formation_code: formation,
          prix_vente: prix,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.ajoutes + " stagiaire(s) inscrit(s). Ils n'ont pas encore reçu leur accès.");
        setSaisie("");
        await charger();
      } else {
        setErreur(data.erreur || "Inscription impossible.");
      }
    } catch (e: any) {
      setErreur("Inscription impossible : " + String(e));
    }
    setOccupe(false);
  }

  async function inviter(id: string) {
    setInvitationEnCours(id || "tous");
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/inviter" + suffixe(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id: id } : {}),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.envoyes + " invitation(s) envoyée(s)");
        await charger();
      } else {
        setErreur(data.erreur || "Envoi impossible.");
      }
    } catch (e: any) {
      setErreur("Envoi impossible : " + String(e));
    }
    setInvitationEnCours("");
  }

  async function modifier(id: string, champ: string, valeur: string) {
    setMessage("");
    setErreur("");
    const corps: any = { id: id };
    corps[champ] = valeur;
    try {
      const r = await fetch("/api/organisme/stagiaires" + suffixe(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corps),
      });
      const data = await r.json();
      if (data.ok) await charger();
      else setErreur(data.erreur || "Modification impossible.");
    } catch (e: any) {
      setErreur("Modification impossible : " + String(e));
    }
  }

  // Le nom, le code formation et le prix se saisissent au clavier : on ne
  // les envoie qu une fois la saisie finie, sinon chaque lettre ferait un
  // appel.
  async function enregistrerFiche(id: string) {
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/stagiaires" + suffixe(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: id,
          nom: brouillon.nom !== undefined ? brouillon.nom : undefined,
          formation_code: brouillon.formation_code !== undefined ? brouillon.formation_code : undefined,
          prix_vente: brouillon.prix_vente !== undefined ? brouillon.prix_vente : undefined,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Fiche mise à jour.");
        setOuverte("");
        setBrouillon({});
        await charger();
      } else {
        setErreur(data.erreur || "Modification impossible.");
      }
    } catch (e: any) {
      setErreur("Modification impossible : " + String(e));
    }
  }

  function ouvrir(a: any) {
    if (ouverte === a.id) {
      setOuverte("");
      setBrouillon({});
      return;
    }
    setOuverte(a.id);
    setBrouillon({
      nom: a.nom || "",
      formation_code: a.formation_code || "",
      prix_vente: a.prix_vente !== null && a.prix_vente !== undefined ? String(a.prix_vente) : "",
    });
  }

  async function retirer(id: string, email: string) {
    setMessage("");
    setErreur("");
    if (!confirm("Retirer " + email + " du registre ?")) return;
    try {
      const sep = suffixe() ? suffixe() + "&" : "?";
      const r = await fetch("/api/organisme/stagiaires" + sep + "id=" + id, { method: "DELETE" });
      const data = await r.json();
      if (data.ok) {
        setMessage(email + " a été retiré du registre.");
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
    fontSize: "16px",
    fontFamily: "Georgia,serif",
    boxSizing: "border-box",
    marginBottom: "12px",
  };

  const PETIT: any = {
    padding: "7px 11px",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontSize: "13px",
    fontFamily: "Georgia,serif",
  };

  const LIBELLE: any = {
    display: "block",
    color: "#c8a96e",
    fontSize: "14px",
    marginBottom: "6px",
  };

  const commences = apprenants.filter(function (a) { return (a.modules_valides || 0) > 0; }).length;
  const aInviter = apprenants.filter(function (a) { return a.statut === "invite"; }).length;

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          REGISTRE DES STAGIAIRES
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Mes stagiaires</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          {apprenants.length} inscrit(s) · {commences} ont commencé · {chiffre.toLocaleString("fr-FR")} € déclarés
          {incomplets > 0 ? " · " + incomplets + " fiche(s) incomplète(s) pour le bilan" : ""}
        </p>

        {aInviter > 0 && (
          <div style={{ ...CARTE, marginTop: "24px", border: "1px solid rgba(200,169,110,0.5)" }}>
            <p style={{ color: "#fff", fontSize: "16px", margin: "0 0 12px" }}>
              {aInviter} stagiaire(s) n'ont pas encore reçu leur accès.
            </p>
            <button
              onClick={() => inviter("")}
              disabled={invitationEnCours !== ""}
              style={{ background: invitationEnCours !== "" ? "rgba(200,169,110,0.3)" : "#c8a96e", color: invitationEnCours !== "" ? "#8a8a8a" : "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: invitationEnCours !== "" ? "default" : "pointer", fontWeight: "bold", fontSize: "16px", fontFamily: "Georgia,serif" }}
            >
              {invitationEnCours === "tous" ? "Envoi en cours…" : "Envoyer les invitations"}
            </button>
          </div>
        )}

        <div style={{ ...CARTE, marginTop: "22px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "19px", margin: "0 0 8px" }}>Inscrire des stagiaires</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px", marginTop: 0, lineHeight: "1.6" }}>
            Le statut et le dispositif remplissent les cadres C et F-1 de votre bilan
            pédagogique. Renseignez-les maintenant : dans un an, personne ne s'en souviendra.
          </p>

          <span style={LIBELLE}>Adresses électroniques</span>
          <textarea
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            rows={4}
            placeholder={"marie.dupont@exemple.fr\npaul.martin@exemple.fr"}
            disabled={occupe}
            style={CHAMP}
          />

          <span style={LIBELLE}>Statut du stagiaire (cadre F-1)</span>
          <select value={statutStagiaire} onChange={(e) => setStatutStagiaire(e.target.value)} style={CHAMP}>
            <option value="">— à préciser —</option>
            {statuts.map(function (s) {
              return <option key={s} value={s}>{LIBELLE_STATUT[s] || s}</option>;
            })}
          </select>

          <span style={LIBELLE}>Qui finance ?</span>
          <select value={payeur} onChange={(e) => setPayeur(e.target.value)} style={CHAMP}>
            <option value="">— à préciser —</option>
            {payeurs.map(function (p) {
              return <option key={p} value={p}>{LIBELLE_PAYEUR[p] || p}</option>;
            })}
          </select>

          <span style={LIBELLE}>Dispositif de financement (cadre C)</span>
          <select value={dispositif} onChange={(e) => setDispositif(e.target.value)} style={CHAMP}>
            <option value="">— sans dispositif —</option>
            {dispositifs.map(function (dd) {
              return <option key={dd} value={dd}>{LIBELLE_DISPOSITIF[dd] || dd}</option>;
            })}
          </select>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px" }}>
              <span style={LIBELLE}>Formation (code)</span>
              <input value={formation} onChange={(e) => setFormation(e.target.value)} placeholder="F028" style={CHAMP} />
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <span style={LIBELLE}>Prix de vente (€)</span>
              <input value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="1500" style={CHAMP} />
            </div>
          </div>

          <button
            onClick={ajouter}
            disabled={occupe || !saisie.trim()}
            style={{ background: occupe || !saisie.trim() ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe || !saisie.trim() ? "#8a8a8a" : "#050508", padding: "14px 30px", borderRadius: "8px", border: "none", cursor: occupe || !saisie.trim() ? "default" : "pointer", fontWeight: "bold", fontSize: "16px", fontFamily: "Georgia,serif", width: "100%" }}
          >
            {occupe ? "Inscription…" : "Inscrire ces stagiaires"}
          </button>
        </div>

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {Object.keys(parPayeur).length > 0 && (
          <div style={CARTE}>
            <h2 style={{ color: "#c8a96e", fontSize: "17px", margin: "0 0 14px" }}>Ventilation des financements</h2>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {Object.keys(parPayeur).map(function (p) {
                return (
                  <span key={p} style={{ background: p === "non_renseigne" ? "rgba(232,131,106,0.15)" : "rgba(200,169,110,0.15)", color: p === "non_renseigne" ? "#e8836a" : "#c8a96e", padding: "8px 16px", borderRadius: "20px", fontSize: "14px" }}>
                    {LIBELLE_PAYEUR[p] || p} : <strong>{parPayeur[p]}</strong>
                  </span>
                );
              })}
            </div>
            <a href="/organisme/bilan" style={{ color: "#c8a96e", fontSize: "14px", display: "inline-block", marginTop: "14px" }}>
              Voir mon bilan pédagogique et financier →
            </a>
          </div>
        )}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement du registre…</p>
          </div>
        ) : apprenants.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
              Aucun stagiaire inscrit pour le moment.
            </p>
          </div>
        ) : (
          apprenants.map(function (a) {
            const invite = a.statut === "invitation_envoyee";
            const complet = a.statut_stagiaire && a.payeur;
            const enModification = ouverte === a.id;

            return (
              <div key={a.id} style={{ ...CARTE, padding: "18px 22px", marginBottom: "12px", border: complet ? "1px solid rgba(200,169,110,0.25)" : "1px solid rgba(232,131,106,0.4)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ flex: "1 1 260px" }}>
                    <p style={{ color: "#fff", fontSize: "16px", margin: "0 0 4px", wordBreak: "break-all" }}>
                      {a.email}
                      {a.nom ? <span style={{ color: "rgba(255,255,255,0.45)" }}> — {a.nom}</span> : null}
                    </p>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: 0 }}>
                      {a.formation_code || "aucune formation"}
                      {a.prix_vente ? " · " + Number(a.prix_vente).toLocaleString("fr-FR") + " €" : ""}
                      {a.dispositif ? " · " + (LIBELLE_DISPOSITIF[a.dispositif] || a.dispositif) : ""}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ color: (a.modules_valides || 0) > 0 ? "#4caf50" : "rgba(255,255,255,0.35)", fontSize: "20px", fontWeight: "bold" }}>
                      {a.modules_valides || 0}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}> module(s)</span>
                  </div>
                </div>

                {/* MODIFICATION DE LA FICHE. Le nom, la formation et le prix
                    se corrigent sans avoir a supprimer le stagiaire — ce qui
                    ferait perdre sa progression. */}
                {enModification && (
                  <div style={{ marginTop: "16px", padding: "16px", background: "rgba(200,169,110,0.06)", borderRadius: "10px" }}>
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 220px" }}>
                        <span style={LIBELLE}>Nom du stagiaire</span>
                        <input
                          value={brouillon.nom}
                          onChange={(e) => setBrouillon({ ...brouillon, nom: e.target.value })}
                          placeholder="Marie Dupont"
                          style={CHAMP}
                        />
                      </div>
                      <div style={{ flex: "1 1 140px" }}>
                        <span style={LIBELLE}>Formation (code)</span>
                        <input
                          value={brouillon.formation_code}
                          onChange={(e) => setBrouillon({ ...brouillon, formation_code: e.target.value })}
                          placeholder="F028"
                          style={CHAMP}
                        />
                      </div>
                      <div style={{ flex: "1 1 140px" }}>
                        <span style={LIBELLE}>Prix de vente (€)</span>
                        <input
                          value={brouillon.prix_vente}
                          onChange={(e) => setBrouillon({ ...brouillon, prix_vente: e.target.value })}
                          placeholder="1500"
                          style={CHAMP}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => enregistrerFiche(a.id)}
                        style={{ background: "#c8a96e", color: "#050508", border: "none", padding: "10px 22px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px", fontFamily: "Georgia,serif" }}
                      >
                        Enregistrer
                      </button>
                      <button
                        onClick={() => { setOuverte(""); setBrouillon({}); }}
                        style={{ background: "none", border: "1px solid rgba(200,169,110,0.4)", color: "#c8a96e", padding: "10px 22px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontFamily: "Georgia,serif" }}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "14px", flexWrap: "wrap" }}>
                  <select
                    value={a.statut_stagiaire || ""}
                    onChange={(e) => modifier(a.id, "statut_stagiaire", e.target.value)}
                    style={{ ...PETIT, border: a.statut_stagiaire ? "1px solid rgba(200,169,110,0.35)" : "1px solid rgba(232,131,106,0.5)" }}
                  >
                    <option value="">Statut F-1</option>
                    {statuts.map(function (s) {
                      return <option key={s} value={s}>{LIBELLE_STATUT[s] || s}</option>;
                    })}
                  </select>

                  <select
                    value={a.payeur || ""}
                    onChange={(e) => modifier(a.id, "payeur", e.target.value)}
                    style={{ ...PETIT, border: a.payeur ? "1px solid rgba(200,169,110,0.35)" : "1px solid rgba(232,131,106,0.5)" }}
                  >
                    <option value="">Financeur</option>
                    {payeurs.map(function (p) {
                      return <option key={p} value={p}>{LIBELLE_PAYEUR[p] || p}</option>;
                    })}
                  </select>

                  <select
                    value={a.dispositif || ""}
                    onChange={(e) => modifier(a.id, "dispositif", e.target.value)}
                    style={{ ...PETIT, border: "1px solid rgba(200,169,110,0.2)" }}
                  >
                    <option value="">Dispositif C</option>
                    {dispositifs.map(function (dd) {
                      return <option key={dd} value={dd}>{LIBELLE_DISPOSITIF[dd] || dd}</option>;
                    })}
                  </select>

                  <button
                    onClick={() => ouvrir(a)}
                    style={{ background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "7px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" }}
                  >
                    {enModification ? "Fermer" : "Modifier la fiche"}
                  </button>

                  <button
                    onClick={() => inviter(a.id)}
                    disabled={invitationEnCours !== ""}
                    style={{ background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "7px 16px", borderRadius: "20px", cursor: invitationEnCours !== "" ? "default" : "pointer", fontSize: "13px", fontFamily: "Georgia,serif" }}
                  >
                    {invitationEnCours === a.id ? "Envoi…" : invite ? "Renvoyer" : "Envoyer l'accès"}
                  </button>

                  <button
                    onClick={() => retirer(a.id, a.email)}
                    style={{ background: "none", border: "none", color: "#e8836a", cursor: "pointer", fontSize: "13px", padding: 0 }}
                  >
                    Retirer
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
