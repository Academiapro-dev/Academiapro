"use client";
import { useState, useEffect } from "react";

const LIBELLE_NIVEAU: any = {
  debutant: "Debute entierement",
  notions: "Quelques notions",
  intermediaire: "Pratique deja",
  avance: "Maitrise, veut approfondir",
};

export default function PagePositionnements() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [ouvert, setOuvert] = useState<any>({});
  const [brouillon, setBrouillon] = useState<any>({});

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
      const r = await fetch("/api/organisme/positionnement" + suffixe());
      const data = await r.json();
      if (data.ok) {
        setD(data);
        const b: any = {};
        for (const p of data.positionnements || []) {
          b[p.id] = p.adaptation_proposee || "";
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

  async function enregistrer(id: string) {
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/positionnement" + suffixe(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, adaptation_proposee: brouillon[id] || "" }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Adaptation enregistree. Le stagiaire la verra dans son espace.");
        setOuvert({ ...ouvert, [id]: false });
        await charger();
      } else {
        setErreur(data.erreur || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
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

  const ETIQUETTE: any = {
    color: "#c8a96e",
    fontSize: "13px",
    margin: "0 0 3px",
  };

  const TEXTE: any = {
    color: "rgba(255,255,255,0.78)",
    fontSize: "14px",
    margin: "0 0 12px",
    lineHeight: "1.7",
    whiteSpace: "pre-wrap",
  };

  // Les besoins sans reponse d abord : c est ce qui coute le plus cher en audit.
  const liste = d
    ? (d.positionnements || []).slice().sort(function (a: any, b: any) {
        const ua = a.besoins_specifiques && !a.adaptation_proposee ? 0 : a.adaptation_proposee ? 2 : 1;
        const ub = b.besoins_specifiques && !b.adaptation_proposee ? 0 : b.adaptation_proposee ? 2 : 1;
        return ua - ub;
      })
    : [];

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          ANALYSE DU BESOIN
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Positionnements</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Indicateurs 4, 8 et 26 du referentiel national qualite
        </p>

        {d && (
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", margin: "24px 0" }}>
            <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
              <p style={{ color: "#c8a96e", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>{d.total}</p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Questionnaire(s) recu(s)</p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
              <p style={{ color: d.sans_adaptation > 0 ? "#e8a33d" : "#4caf50", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                {d.sans_adaptation}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Sans reponse ecrite</p>
            </div>
            <div style={{ ...CARTE, flex: "1 1 150px", marginBottom: 0 }}>
              <p style={{ color: d.besoin_sans_reponse > 0 ? "#e8836a" : "#4caf50", fontSize: "26px", fontWeight: "bold", margin: "0 0 4px" }}>
                {d.besoin_sans_reponse}
              </p>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>
                Besoin d amenagement sans reponse
              </p>
            </div>
          </div>
        )}

        {d && d.besoin_sans_reponse > 0 && (
          <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.6)" }}>
            <p style={{ color: "#e8836a", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>
              {d.besoin_sans_reponse} stagiaire(s) ont signale un besoin d amenagement sans
              recevoir de reponse ecrite. C est l ecart le plus grave de tout le referentiel :
              recueillir un besoin sans y repondre vaut moins que ne pas l avoir demande.
              Traitez-les en premier, ils sont en tete de liste.
            </p>
          </div>
        )}

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement...</p>
          </div>
        ) : liste.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: "1.7" }}>
              Aucun questionnaire recu. Envoyez a vos stagiaires le lien de positionnement de
              leur formation avant leur entree : c est ce document qui prouve l analyse du besoin.
            </p>
          </div>
        ) : (
          liste.map(function (p: any) {
            const estOuvert = ouvert[p.id] === true;
            const urgent = p.besoins_specifiques && !p.adaptation_proposee;
            return (
              <div key={p.id} style={{ ...CARTE, border: "1px solid " + (urgent ? "rgba(232,131,106,0.6)" : p.adaptation_proposee ? "rgba(76,175,80,0.35)" : "rgba(232,163,61,0.4)") }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
                  <div style={{ flex: "1 1 260px" }}>
                    <h3 style={{ color: "#fff", fontSize: "16px", margin: "0 0 3px", wordBreak: "break-all" }}>
                      {p.stagiaire_email}
                    </h3>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                      {p.formation_code || "—"}
                      {p.niveau_declare ? " · " + (LIBELLE_NIVEAU[p.niveau_declare] || p.niveau_declare) : ""}
                      {" · recu le " + new Date(p.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <span style={{ color: p.adaptation_proposee ? "#4caf50" : urgent ? "#e8836a" : "#e8a33d", fontSize: "13px", fontWeight: "bold" }}>
                    {p.adaptation_proposee ? "Traite" : urgent ? "A traiter en priorite" : "A traiter"}
                  </span>
                </div>

                {p.attentes && (
                  <>
                    <p style={ETIQUETTE}>Ce qu il attend</p>
                    <p style={TEXTE}>{p.attentes}</p>
                  </>
                )}

                {p.experience && (
                  <>
                    <p style={ETIQUETTE}>Son experience</p>
                    <p style={TEXTE}>{p.experience}</p>
                  </>
                )}

                {p.objectif_professionnel && (
                  <>
                    <p style={ETIQUETTE}>Son objectif professionnel</p>
                    <p style={TEXTE}>{p.objectif_professionnel}</p>
                  </>
                )}

                {p.contraintes && (
                  <>
                    <p style={ETIQUETTE}>Ses contraintes</p>
                    <p style={TEXTE}>{p.contraintes}</p>
                  </>
                )}

                {p.besoins_specifiques && (
                  <div style={{ background: "rgba(232,131,106,0.08)", border: "1px solid rgba(232,131,106,0.3)", borderRadius: "8px", padding: "14px 16px", marginBottom: "14px" }}>
                    <p style={{ ...ETIQUETTE, color: "#e8836a" }}>Besoin d amenagement declare</p>
                    <p style={{ ...TEXTE, margin: 0 }}>{p.besoins_specifiques}</p>
                  </div>
                )}

                {p.adaptation_proposee && !estOuvert && (
                  <div style={{ background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.3)", borderRadius: "8px", padding: "14px 16px", marginBottom: "14px" }}>
                    <p style={{ ...ETIQUETTE, color: "#4caf50" }}>
                      Votre reponse
                      {p.adaptation_le ? " du " + new Date(p.adaptation_le).toLocaleDateString("fr-FR") : ""}
                    </p>
                    <p style={{ ...TEXTE, margin: 0 }}>{p.adaptation_proposee}</p>
                  </div>
                )}

                {estOuvert ? (
                  <div style={{ paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <p style={{ ...ETIQUETTE, color: "#e8a33d" }}>
                      Ce que vous adaptez pour ce stagiaire
                    </p>
                    <textarea
                      value={brouillon[p.id] || ""}
                      onChange={(e) => setBrouillon({ ...brouillon, [p.id]: e.target.value })}
                      rows={4}
                      placeholder="Rythme amenage, supports agrandis, entretien telephonique prealable, orientation vers un autre parcours..."
                      style={CHAMP}
                    />
                    <button
                      onClick={() => enregistrer(p.id)}
                      style={{ background: "#c8a96e", color: "#050508", padding: "12px 24px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" }}
                    >
                      Enregistrer et informer le stagiaire
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setOuvert({ ...ouvert, [p.id]: true })}
                    style={{ background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "8px 18px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" }}
                  >
                    {p.adaptation_proposee ? "Modifier ma reponse" : "Ecrire mon adaptation"}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
