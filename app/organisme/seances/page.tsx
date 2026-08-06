"use client";
import { useState, useEffect } from "react";

const LIBELLE_STATUT: any = {
  prevue: "Prévue",
  en_cours: "En cours",
  terminee: "Terminée",
};

// L HEURE SAISIE EST CELLE DE CELUI QUI SAISIT. Le champ du navigateur rend
// "2026-08-03T22:40" sans fuseau ; le serveur, lui, vit en heure universelle
// et comprendrait 22:40 UTC. On lui envoie donc l instant exact, calcule ici,
// avec le fuseau de l ordinateur qui saisit.
function instantExact(saisie: string): string {
  if (!saisie) return "";
  const d = new Date(saisie);
  if (isNaN(d.getTime())) return "";
  return d.toISOString();
}

// LE STATUT ENREGISTRE NE SE FERME PAS TOUT SEUL : une seance restee en base
// a "en_cours" s afficherait ainsi des semaines apres. Le temps tranche avant
// la base — si la fin est passee, la seance est terminee.
function libelleStatut(s: any): string {
  if (s.ouverte) return "Salle ouverte";
  if (s.passee) return "Terminée";
  return LIBELLE_STATUT[s.statut] || s.statut;
}

export default function PageSeances() {
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [formulaire, setFormulaire] = useState(false);

  const [titre, setTitre] = useState("");
  const [formation, setFormation] = useState("");
  const [debut, setDebut] = useState("");
  const [duree, setDuree] = useState("90");
  const [formateur, setFormateur] = useState("");
  const [description, setDescription] = useState("");

  useEffect(function () {
    charger();
  }, []);

  function suffixe(sep: string) {
    try {
      const t = new URLSearchParams(window.location.search).get("tenant");
      return t ? sep + "tenant=" + t : "";
    } catch {
      return "";
    }
  }

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/seance" + suffixe("?"));
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  async function programmer() {
    if (titre.trim().length < 3 || !debut) {
      setErreur("Indiquez un titre et une date.");
      return;
    }

    const instant = instantExact(debut);
    if (!instant) {
      setErreur("Date invalide.");
      return;
    }

    setOccupe("creation");
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/seance" + suffixe("?"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: titre,
          formation_code: formation,
          debut: instant,
          duree_minutes: duree,
          formateur: formateur,
          description: description,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Séance programmée. Pensez à prévenir vos stagiaires.");
        setTitre(""); setFormation(""); setDebut(""); setFormateur(""); setDescription("");
        setFormulaire(false);
        await charger();
      } else {
        setErreur(data.erreur || "Création impossible.");
      }
    } catch (e: any) {
      setErreur("Création impossible : " + String(e));
    }
    setOccupe("");
  }

  async function annoncer(id: string) {
    setOccupe("annonce-" + id);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/annoncer-seance" + suffixe("?"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seance_id: id }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.envoyes + " stagiaire(s) prévenu(s).");
      } else {
        setErreur(data.erreur || "Annonce impossible.");
      }
    } catch (e: any) {
      setErreur("Annonce impossible : " + String(e));
    }
    setOccupe("");
  }

  async function clore(id: string) {
    setOccupe("clore-" + id);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/organisme/seance" + suffixe("?"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seance_id: id, action: "clore" }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage("Séance close.");
        await charger();
      } else {
        setErreur(data.erreur || "Clôture impossible.");
      }
    } catch (e: any) {
      setErreur("Clôture impossible : " + String(e));
    }
    setOccupe("");
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
    fontSize: "13px",
    marginBottom: "5px",
  };

  const BOUTON: any = {
    background: "none",
    border: "1px solid rgba(200,169,110,0.45)",
    color: "#c8a96e",
    padding: "7px 15px",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "13px",
    fontFamily: "Georgia,serif",
    textDecoration: "none",
  };

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/organisme" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour au tableau de bord
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          CLASSES VIRTUELLES
        </p>
        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 6px" }}>Mes séances</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          {d ? d.total : 0} séance(s) · {d ? d.a_venir : 0} à venir · visio et tableau blanc
        </p>

        {d && d.membre && (
          <button
            onClick={() => setFormulaire(!formulaire)}
            style={{ background: formulaire ? "none" : "#c8a96e", color: formulaire ? "#c8a96e" : "#050508", border: formulaire ? "1px solid rgba(200,169,110,0.45)" : "none", padding: "12px 24px", borderRadius: "20px", cursor: "pointer", fontSize: "15px", fontFamily: "Georgia,serif", fontWeight: "bold", margin: "22px 0" }}
          >
            {formulaire ? "Annuler" : "Programmer une séance"}
          </button>
        )}

        {formulaire && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <span style={LIBELLE}>Titre de la séance</span>
            <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Atelier pratique du module 3" style={CHAMP} />

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px" }}>
                <span style={LIBELLE}>Date et heure</span>
                <input type="datetime-local" value={debut} onChange={(e) => setDebut(e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 120px" }}>
                <span style={LIBELLE}>Durée (minutes)</span>
                <input value={duree} onChange={(e) => setDuree(e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 120px" }}>
                <span style={LIBELLE}>Formation</span>
                <input value={formation} onChange={(e) => setFormation(e.target.value)} placeholder="F028" style={CHAMP} />
              </div>
            </div>

            {debut && instantExact(debut) && (
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "-6px 0 12px" }}>
                Soit le {new Date(instantExact(debut)).toLocaleString("fr-FR")} à votre heure.
                La salle ouvrira à{" "}
                {new Date(new Date(instantExact(debut)).getTime() - 15 * 60000)
                  .toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.
              </p>
            )}

            <span style={LIBELLE}>Formateur</span>
            <input value={formateur} onChange={(e) => setFormateur(e.target.value)} style={CHAMP} />

            <span style={LIBELLE}>Ce qui sera abordé</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={CHAMP} />

            <button
              onClick={programmer}
              disabled={occupe === "creation"}
              style={{ background: occupe === "creation" ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe === "creation" ? "#8a8a8a" : "#050508", padding: "13px 26px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif", width: "100%" }}
            >
              {occupe === "creation" ? "Création…" : "Programmer"}
            </button>

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.6" }}>
              Si vous indiquez une formation, seuls ses stagiaires seront prévenus. Sans elle,
              tout votre registre le sera. La salle s'ouvre un quart d'heure avant et les entrées
              sont horodatées : elles tiennent lieu de feuille d'émargement.
            </p>
          </div>
        )}

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Chargement…</p>
          </div>
        ) : !d || d.seances.length === 0 ? (
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px", lineHeight: "1.7" }}>
              Aucune séance programmée. Une classe virtuelle vous permet de réunir vos
              stagiaires en direct, avec la visio et un tableau blanc, et produit au passage
              une preuve d'assiduité horodatée.
            </p>
          </div>
        ) : (
          d.seances.map(function (s: any) {
            return (
              <div key={s.id} style={{ ...CARTE, border: "1px solid " + (s.ouverte ? "rgba(76,175,80,0.5)" : s.passee ? "rgba(255,255,255,0.12)" : "rgba(200,169,110,0.25)"), opacity: s.passee ? 0.7 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ flex: "1 1 260px" }}>
                    <p style={{ color: "#c8a96e", fontSize: "12px", margin: "0 0 3px" }}>
                      {new Date(s.debut).toLocaleString("fr-FR")} · {s.duree_minutes} min
                      {s.formation_code ? " · " + s.formation_code : " · tous les stagiaires"}
                    </p>
                    <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 4px" }}>{s.titre}</h3>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: 0 }}>
                      {s.formateur ? s.formateur + " · " : ""}
                      {s.participants} participant(s)
                      {s.minutes_cumulees ? " · " + s.minutes_cumulees + " min cumulées" : ""}
                    </p>
                  </div>

                  <span style={{ color: s.ouverte ? "#4caf50" : s.passee ? "rgba(255,255,255,0.45)" : "#e8a33d", fontSize: "13px", fontWeight: "bold" }}>
                    {libelleStatut(s)}
                  </span>
                </div>

                {s.description && (
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", margin: "10px 0 0", lineHeight: "1.6" }}>
                    {s.description}
                  </p>
                )}

                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "14px", flexWrap: "wrap" }}>
                  {s.ouverte ? (
                    <a
                      href={"/seance/" + s.id + suffixe("?")}
                      style={{ ...BOUTON, background: "#c8a96e", color: "#050508", border: "none", fontWeight: "bold" }}
                    >
                      Rejoindre la classe
                    </a>
                  ) : s.passee ? (
                    <a href={"/organisme/seances/" + s.id + suffixe("?")} style={BOUTON}>
                      Feuille de présence
                    </a>
                  ) : (
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                      la salle ouvrira à{" "}
                      {new Date(new Date(s.debut).getTime() - 15 * 60000)
                        .toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}

                  {d.membre && !s.passee && (
                    <button
                      onClick={() => annoncer(s.id)}
                      disabled={occupe !== ""}
                      style={BOUTON}
                    >
                      {occupe === "annonce-" + s.id ? "Envoi…" : "Prévenir les stagiaires"}
                    </button>
                  )}

                  {d.membre && s.passee && (
                    <a href={"/organisme/seances/" + s.id + suffixe("?")} style={BOUTON}>
                      Émargement
                    </a>
                  )}

                  {d.membre && !s.passee && s.statut !== "terminee" && (
                    <button
                      onClick={() => clore(s.id)}
                      disabled={occupe !== ""}
                      style={{ background: "none", border: "none", color: "#e8836a", cursor: "pointer", fontSize: "13px", padding: "0 6px" }}
                    >
                      Clore
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
