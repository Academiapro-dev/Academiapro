"use client";
import { useState, useEffect } from "react";

const LIBELLE_NIVEAU: any = {
  debutant: "Je debute entierement",
  notions: "J ai quelques notions",
  intermediaire: "Je pratique deja",
  avance: "Je maitrise et je veux approfondir",
};

export default function PagePositionnement({ params }: { params: { code: string } }) {
  const code = (params.code || "").toUpperCase();

  const [niveaux, setNiveaux] = useState<string[]>([]);
  const [attentes, setAttentes] = useState("");
  const [niveau, setNiveau] = useState("");
  const [experience, setExperience] = useState("");
  const [objectif, setObjectif] = useState("");
  const [contraintes, setContraintes] = useState("");
  const [besoins, setBesoins] = useState("");
  const [adaptation, setAdaptation] = useState("");

  const [envoye, setEnvoye] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    charger();
  }, []);

  async function charger() {
    setErreur("");
    try {
      const r = await fetch("/api/organisme/positionnement?vue=mien&formation_code=" + code);
      const data = await r.json();
      if (data.ok) {
        setNiveaux(data.niveaux || []);
        if (data.positionnement) {
          const p = data.positionnement;
          setAttentes(p.attentes || "");
          setNiveau(p.niveau_declare || "");
          setExperience(p.experience || "");
          setObjectif(p.objectif_professionnel || "");
          setContraintes(p.contraintes || "");
          setBesoins(p.besoins_specifiques || "");
          setAdaptation(p.adaptation_proposee || "");
          setEnvoye(true);
        }
      } else {
        setErreur(data.erreur || "Lecture impossible.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
  }

  async function envoyer() {
    if (attentes.trim().length < 10) {
      setErreur("Dites-nous en quelques mots ce que vous attendez de cette formation.");
      return;
    }
    setOccupe(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/positionnement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formation_code: code,
          attentes: attentes,
          niveau_declare: niveau,
          experience: experience,
          objectif_professionnel: objectif,
          contraintes: contraintes,
          besoins_specifiques: besoins,
        }),
      });
      const data = await r.json();
      if (data.ok) setEnvoye(true);
      else setErreur(data.erreur || "Envoi impossible.");
    } catch (e: any) {
      setErreur("Envoi impossible : " + String(e));
    }
    setOccupe(false);
  }

  const CADRE: any = {
    minHeight: "100vh",
    background: "#050508",
    color: "#fff",
    fontFamily: "Georgia, serif",
    padding: "44px 20px",
  };

  const CARTE: any = {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "30px 34px",
    marginBottom: "20px",
    boxShadow: "0 4px 30px rgba(0,0,0,0.4)",
    color: "#1a1a1a",
  };

  const CHAMP: any = {
    width: "100%",
    padding: "14px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    background: "#fff",
    color: "#1a1a1a",
    fontSize: "16px",
    lineHeight: "1.7",
    fontFamily: "Georgia,serif",
    boxSizing: "border-box",
    marginBottom: "20px",
  };

  const QUESTION: any = {
    color: "#1a1a1a",
    fontSize: "16px",
    margin: "0 0 8px",
    fontWeight: "bold",
  };

  const AIDE: any = {
    color: "#777",
    fontSize: "14px",
    margin: "-4px 0 8px",
    lineHeight: "1.6",
  };

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 8px" }}>
          AVANT DE COMMENCER · {code}
        </p>
        <h1 style={{ color: "#fff", fontSize: "28px", margin: "0 0 10px" }}>
          Parlez-nous de vous
        </h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "15px", lineHeight: "1.7", marginTop: 0 }}>
          Ces quelques questions nous permettent d adapter la formation a votre situation.
          Il n y a pas de bonne reponse, et rien n est note.
        </p>

        {envoye && adaptation && (
          <div style={{ ...CARTE, background: "#f2f9f3", border: "1px solid #b8ddbd" }}>
            <p style={{ color: "#2e7d32", fontSize: "16px", fontWeight: "bold", margin: "0 0 8px" }}>
              Ce que nous avons prevu pour vous
            </p>
            <p style={{ color: "#3a5a3d", fontSize: "15px", margin: 0, lineHeight: "1.75", whiteSpace: "pre-wrap" }}>
              {adaptation}
            </p>
          </div>
        )}

        {envoye && !adaptation && (
          <div style={{ ...CARTE, background: "#fbf7ef", border: "1px solid #e3d9c2" }}>
            <p style={{ color: "#6b5a33", fontSize: "15px", margin: 0, lineHeight: "1.75" }}>
              Vos reponses sont enregistrees. Votre organisme de formation en prend connaissance
              et reviendra vers vous si un amenagement est necessaire. Vous pouvez les modifier
              ci-dessous.
            </p>
          </div>
        )}

        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        <div style={CARTE}>
          <p style={QUESTION}>Qu attendez-vous de cette formation ?</p>
          <p style={AIDE}>Ce que vous souhaitez savoir faire a la fin, ou ce qui vous a decide.</p>
          <textarea value={attentes} onChange={(e) => setAttentes(e.target.value)} rows={4} style={CHAMP} />

          <p style={QUESTION}>Ou vous situez-vous dans ce domaine ?</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
            {niveaux.map(function (n) {
              const actif = niveau === n;
              return (
                <span
                  key={n}
                  onClick={() => setNiveau(n)}
                  style={{ padding: "13px 16px", borderRadius: "8px", cursor: "pointer", background: actif ? "rgba(200,169,110,0.16)" : "#fafafa", border: actif ? "2px solid #c8a96e" : "1px solid #e2e2e2", color: "#1a1a1a", fontSize: "15px" }}
                >
                  {LIBELLE_NIVEAU[n] || n}
                </span>
              );
            })}
          </div>

          <p style={QUESTION}>Votre experience dans ce domaine (facultatif)</p>
          <p style={AIDE}>Etudes, metier exerce, pratique personnelle.</p>
          <textarea value={experience} onChange={(e) => setExperience(e.target.value)} rows={3} style={CHAMP} />

          <p style={QUESTION}>A quoi cette formation doit-elle vous servir ?</p>
          <p style={AIDE}>Un projet professionnel, une reconversion, une evolution dans votre poste.</p>
          <textarea value={objectif} onChange={(e) => setObjectif(e.target.value)} rows={3} style={CHAMP} />

          <p style={QUESTION}>Avez-vous des contraintes d organisation ?</p>
          <p style={AIDE}>Disponibilites, rythme souhaite, materiel dont vous disposez.</p>
          <textarea value={contraintes} onChange={(e) => setContraintes(e.target.value)} rows={3} style={CHAMP} />

          <div style={{ background: "#f7f9fb", border: "1px solid #dde5ea", borderRadius: "8px", padding: "20px 22px", marginBottom: "20px" }}>
            <p style={{ ...QUESTION, margin: "0 0 8px" }}>
              Avez-vous besoin d un amenagement particulier ?
            </p>
            <p style={{ ...AIDE, margin: "0 0 12px" }}>
              Si une situation de handicap, un trouble de la lecture, une difficulte visuelle ou
              auditive, ou toute autre raison rend le suivi plus difficile, dites-le nous ici.
              Nous chercherons une solution avec vous avant votre entree en formation. Cette
              question est facultative et votre reponse reste confidentielle.
            </p>
            <textarea
              value={besoins}
              onChange={(e) => setBesoins(e.target.value)}
              rows={3}
              style={{ ...CHAMP, marginBottom: 0, background: "#fff" }}
            />
          </div>

          <button
            onClick={envoyer}
            disabled={occupe || attentes.trim().length < 10}
            style={{ background: occupe || attentes.trim().length < 10 ? "#e3d9c2" : "#c8a96e", color: occupe || attentes.trim().length < 10 ? "#8a8a8a" : "#050508", padding: "16px 30px", borderRadius: "8px", border: "none", cursor: occupe || attentes.trim().length < 10 ? "default" : "pointer", fontWeight: "bold", fontSize: "17px", fontFamily: "Georgia,serif", width: "100%" }}
          >
            {occupe ? "Envoi..." : envoye ? "Modifier mes reponses" : "Envoyer mes reponses"}
          </button>
        </div>
      </div>
    </div>
  );
}
