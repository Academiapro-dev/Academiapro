"use client";
import { useState, useEffect } from "react";

const LIBELLE_STATUT: any = {
  interne: "Interne",
  externe: "Externe",
  sous_traitant: "Sous-traitant",
};

export default function PageFormateurs() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState(false);
  const [depot, setDepot] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);
  const [ouvert, setOuvert] = useState<any>({});
  const [brouillon, setBrouillon] = useState<any>({});

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [statut, setStatut] = useState("interne");
  const [qualification, setQualification] = useState("");
  const [annees, setAnnees] = useState("");
  const [domaines, setDomaines] = useState("");

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
      const r = await fetch("/api/organisme/formateurs" + suffixe());
      const data = await r.json();
      if (data.ok) {
        setD(data);
        const b: any = {};
        for (const f of data.formateurs || []) {
          b[f.id] = {
            qualification: f.qualification || "",
            action: f.derniere_action_developpement || "",
            date: f.derniere_action_date || "",
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
    if (nom.trim().length < 2) {
      setErreur("Indiquez le nom du formateur.");
      return;
    }
    setOccupe(true);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/formateurs" + suffixe(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: nom,
          email: email,
          statut: statut,
          qualification: qualification,
          annees_experience: annees,
          domaines: domaines,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(nom + " ajoute a votre equipe.");
        setNom(""); setEmail(""); setQualification(""); setAnnees(""); setDomaines("");
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
      const r = await fetch("/api/organisme/formateurs" + suffixe(), {
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

  // LE DEPOT D UN VRAI FICHIER. Cocher une case ne prouve rien : l auditeur
  // ne demande pas si le CV existe, il demande a le voir. Le fichier part
  // dans un espace prive et le dossier ne devient complet que par sa presence.
  async function deposer(id: string, piece: string, fichier: File | null) {
    if (!fichier) return;

    setDepot(id + "-" + piece);
    setMessage("");
    setErreur("");

    try {
      const corps = new FormData();
      corps.append("id", id);
      corps.append("piece", piece);
      corps.append("fichier", fichier);

      const r = await fetch("/api/organisme/formateur-piece" + suffixe(), {
        method: "POST",
        body: corps,
      });
      const data = await r.json();

      if (data.ok) {
        setMessage(data.piece + " depose pour " + data.formateur + " (" + data.nom_fichier + ").");
        await charger();
      } else {
        setErreur(data.erreur || "Depot impossible.");
      }
    } catch (e: any) {
      setErreur("Depot impossible : " + String(e));
    }

    setDepot("");
  }

  async function voir(id: string, piece: string) {
    setMessage("");
    setErreur("");
    try {
      const sep = suffixe() ? suffixe() + "&" : "?";
      const r = await fetch("/api/organisme/formateur-piece" + sep + "id=" + id + "&piece=" + piece);
      const data = await r.json();
      if (data.ok && data.lien) {
        window.open(data.lien, "_blank");
      } else {
        setErreur(data.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
  }

  async function retirerPiece(id: string, piece: string) {
    setMessage("");
    setErreur("");
    try {
      const sep = suffixe() ? suffixe() + "&" : "?";
      const r = await fetch(
        "/api/organisme/formateur-piece" + sep + "id=" + id + "&piece=" + piece,
        { method: "DELETE" }
      );
      const data = await r.json();
      if (data.ok) {
        setMessage(data.retiree + " retire. Le dossier redevient incomplet.");
        await charger();
      } else {
        setErreur(data.erreur || "Retrait impossible.");
      }
    } catch (e: any) {
      setErreur("Retrait impossible : " + String(e));
    }
  }

  async function retirer(id: string, n: string) {
    setMessage("");
    setErreur("");
    try {
      const sep = suffixe() ? suffixe() + "&" : "?";
      const r = await fetch("/api/organisme/formateurs" + sep + "id=" + id, { method: "DELETE" });
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

  // La piece justificative : soit on la depose, soit on la consulte.
  function piece(f: any, cle: string, libelle: string, deposee: boolean) {
    const champ = "fichier-" + cle + "-" + f.id;
    const enCours = depot === f.id + "-" + cle;

    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
        <input
          id={champ}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          style={{ display: "none" }}
          onChange={(e) => {
            const fichier = e.target.files && e.target.files[0] ? e.target.files[0] : null;
            deposer(f.id, cle, fichier);
            e.target.value = "";
          }}
        />

        <span
          onClick={() => {
            if (enCours) return;
            if (deposee) voir(f.id, cle);
            else {
              const champDom = document.getElementById(champ) as HTMLInputElement | null;
              if (champDom) champDom.click();
            }
          }}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "7px 14px", borderRadius: "20px", cursor: enCours ? "default" : "pointer", background: deposee ? "rgba(76,175,80,0.18)" : "rgba(255,255,255,0.05)", border: deposee ? "1px solid rgba(76,175,80,0.5)" : "1px solid rgba(255,255,255,0.15)", color: deposee ? "#4caf50" : "rgba(255,255,255,0.55)", fontSize: "13px" }}
        >
          {enCours ? "Depot..." : (deposee ? "✓ " + libelle + " · voir" : "○ Deposer le " + libelle)}
        </span>

        {deposee && !enCours && (
          <button
            onClick={() => retirerPiece(f.id, cle)}
            title={"Retirer le " + libelle}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "13px", padding: "0 2px" }}
          >
            ✕
          </button>
        )}
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
          EQUIPE PEDAGOGIQUE
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Mes formateurs</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Indicateurs 21 et 22 du referentiel national qualite
        </p>

        {d && (
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "24px 0" }}>
            <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
              <p style={{ color: "#c8a96e", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>{d.actifs}</p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Formateur(s) actif(s)</p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
              <p style={{ color: d.a_completer > 0 ? "#e8836a" : "#4caf50", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                {d.conformes}/{d.actifs}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Dossiers complets</p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
              <p style={{ color: "#c8a96e", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>{d.sous_traitants}</p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                Sous-traitant(s) · indicateur 27
              </p>
            </div>
          </div>
        )}

        {d && d.a_completer > 0 && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.5)" }}>
            <p style={{ color: "#e8836a", fontSize: "15px", margin: 0, lineHeight: "1.7" }}>
              {d.a_completer} dossier(s) incomplet(s). Un dossier est complet lorsque la
              qualification est renseignee, le CV est REELLEMENT DEPOSE, et qu une action de
              developpement des competences datant de moins de trois ans est enregistree.
              C est ce dernier point qui fait tomber la plupart des organismes en audit.
            </p>
          </div>
        )}

        <button
          onClick={() => setFormulaire(!formulaire)}
          style={{ background: formulaire ? "none" : "#c8a96e", color: formulaire ? "#c8a96e" : "#050508", border: formulaire ? "1px solid rgba(200,169,110,0.45)" : "none", padding: "12px 24px", borderRadius: "20px", cursor: "pointer", fontSize: "15px", fontFamily: "Georgia,serif", fontWeight: "bold", marginBottom: "20px" }}
        >
          {formulaire ? "Annuler" : "Ajouter un formateur"}
        </button>

        {formulaire && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <span style={LIBELLE}>Nom et prenom</span>
            <input value={nom} onChange={(e) => setNom(e.target.value)} style={CHAMP} />

            <span style={LIBELLE}>Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} style={CHAMP} />

            <span style={LIBELLE}>Statut</span>
            <select value={statut} onChange={(e) => setStatut(e.target.value)} style={CHAMP}>
              {(d && d.statuts ? d.statuts : ["interne"]).map(function (s: string) {
                return <option key={s} value={s}>{LIBELLE_STATUT[s] || s}</option>;
              })}
            </select>

            <span style={LIBELLE}>Qualification (diplome, titre, experience reconnue)</span>
            <input value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="Master en psychologie du travail" style={CHAMP} />

            <span style={LIBELLE}>Annees d experience dans le domaine</span>
            <input value={annees} onChange={(e) => setAnnees(e.target.value)} placeholder="12" style={CHAMP} />

            <span style={LIBELLE}>Domaines couverts</span>
            <input value={domaines} onChange={(e) => setDomaines(e.target.value)} placeholder="Bien-etre, psychologie" style={CHAMP} />

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
        ) : !d || d.formateurs.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: "1.7" }}>
              Aucun formateur enregistre. Si vous animez vous-meme vos formations,
              inscrivez-vous : l auditeur demandera votre propre qualification.
            </p>
          </div>
        ) : (
          d.formateurs.map(function (f: any) {
            const estOuvert = ouvert[f.id] === true;
            return (
              <div key={f.id} style={{ ...CARTE, border: "1px solid " + (f.en_regle ? "rgba(76,175,80,0.35)" : "rgba(232,131,106,0.4)"), opacity: f.actif ? 1 : 0.5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ flex: "1 1 260px" }}>
                    <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 4px" }}>{f.nom}</h3>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                      {LIBELLE_STATUT[f.statut] || f.statut}
                      {f.annees_experience ? " · " + f.annees_experience + " ans d experience" : ""}
                      {f.domaines ? " · " + f.domaines : ""}
                    </p>
                    {f.qualification && (
                      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: "6px 0 0" }}>
                        {f.qualification}
                      </p>
                    )}
                  </div>
                  <span style={{ color: f.en_regle ? "#4caf50" : "#e8836a", fontSize: "14px", fontWeight: "bold" }}>
                    {f.en_regle ? "Dossier complet" : "A completer"}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "14px", flexWrap: "wrap", alignItems: "center" }}>
                  {piece(f, "cv", "CV", !!f.cv_depose)}
                  {piece(f, "diplome", "Diplome", !!f.diplome_depose)}

                  <button
                    onClick={() => setOuvert({ ...ouvert, [f.id]: !estOuvert })}
                    style={{ background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "7px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" }}
                  >
                    {estOuvert ? "Fermer" : "Developpement des competences"}
                  </button>

                  <button
                    onClick={() => modifier(f.id, { actif: !f.actif })}
                    style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "13px", padding: "0 6px" }}
                  >
                    {f.actif ? "Desactiver" : "Reactiver"}
                  </button>

                  <button
                    onClick={() => retirer(f.id, f.nom)}
                    style={{ background: "none", border: "none", color: "#e8836a", cursor: "pointer", fontSize: "13px", padding: 0 }}
                  >
                    Retirer
                  </button>
                </div>

                {f.derniere_action_developpement && !estOuvert && (
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "12px 0 0" }}>
                    Derniere action : {f.derniere_action_developpement}
                    {f.derniere_action_date ? " (" + new Date(f.derniere_action_date).toLocaleDateString("fr-FR") + ")" : ""}
                  </p>
                )}

                {estOuvert && (
                  <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <span style={LIBELLE}>Qualification</span>
                    <input
                      value={(brouillon[f.id] && brouillon[f.id].qualification) || ""}
                      onChange={(e) => setBrouillon({ ...brouillon, [f.id]: { ...(brouillon[f.id] || {}), qualification: e.target.value } })}
                      style={CHAMP}
                    />

                    <span style={LIBELLE}>Derniere action de developpement des competences</span>
                    <input
                      value={(brouillon[f.id] && brouillon[f.id].action) || ""}
                      onChange={(e) => setBrouillon({ ...brouillon, [f.id]: { ...(brouillon[f.id] || {}), action: e.target.value } })}
                      placeholder="Formation, colloque, supervision, veille metier..."
                      style={CHAMP}
                    />

                    <span style={LIBELLE}>Date de cette action</span>
                    <input
                      type="date"
                      value={(brouillon[f.id] && brouillon[f.id].date) || ""}
                      onChange={(e) => setBrouillon({ ...brouillon, [f.id]: { ...(brouillon[f.id] || {}), date: e.target.value } })}
                      style={CHAMP}
                    />

                    <button
                      onClick={() => modifier(f.id, {
                        qualification: brouillon[f.id] ? brouillon[f.id].qualification : "",
                        derniere_action_developpement: brouillon[f.id] ? brouillon[f.id].action : "",
                        derniere_action_date: brouillon[f.id] && brouillon[f.id].date ? brouillon[f.id].date : null,
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
