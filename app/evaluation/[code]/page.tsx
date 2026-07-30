"use client";
import { useState, useEffect } from "react";

const ETOILES = [1, 2, 3, 4, 5];

export default function PageEvaluation({ params }: { params: { code: string } }) {
  const code = (params.code || "").toUpperCase();

  const [moment, setMoment] = useState("chaud");
  const [globale, setGlobale] = useState(0);
  const [contenu, setContenu] = useState(0);
  const [accompagnement, setAccompagnement] = useState(0);
  const [plateforme, setPlateforme] = useState(0);
  const [recommanderait, setRecommanderait] = useState<any>(null);
  const [pointsForts, setPointsForts] = useState("");
  const [pointsAmeliorer, setPointsAmeliorer] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [objectifs, setObjectifs] = useState("");
  const [pratique, setPratique] = useState("");

  const [envoye, setEnvoye] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    charger("chaud");
  }, []);

  async function charger(m: string) {
    setErreur("");
    try {
      const r = await fetch("/api/organisme/evaluation?vue=mienne&formation_code=" + code + "&moment=" + m);
      const data = await r.json();
      if (data.ok && data.evaluation) {
        const e = data.evaluation;
        setGlobale(e.note_globale || 0);
        setContenu(e.note_contenu || 0);
        setAccompagnement(e.note_accompagnement || 0);
        setPlateforme(e.note_plateforme || 0);
        setRecommanderait(e.recommanderait);
        setPointsForts(e.points_forts || "");
        setPointsAmeliorer(e.points_ameliorer || "");
        setCommentaire(e.commentaire_libre || "");
        setObjectifs(e.objectifs_atteints || "");
        setPratique(e.mise_en_pratique || "");
        setEnvoye(true);
      } else {
        setGlobale(0); setContenu(0); setAccompagnement(0); setPlateforme(0);
        setRecommanderait(null); setPointsForts(""); setPointsAmeliorer("");
        setCommentaire(""); setObjectifs(""); setPratique("");
        setEnvoye(false);
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
  }

  function changerMoment(m: string) {
    setMoment(m);
    charger(m);
  }

  async function envoyer() {
    if (!globale) {
      setErreur("Donnez au moins une appreciation globale.");
      return;
    }
    setOccupe(true);
    setErreur("");
    try {
      const r = await fetch("/api/organisme/evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formation_code: code,
          moment: moment,
          note_globale: globale,
          note_contenu: contenu || null,
          note_accompagnement: accompagnement || null,
          note_plateforme: plateforme || null,
          recommanderait: recommanderait,
          points_forts: pointsForts,
          points_ameliorer: pointsAmeliorer,
          commentaire_libre: commentaire,
          objectifs_atteints: objectifs,
          mise_en_pratique: pratique,
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
    marginBottom: "18px",
  };

  const QUESTION: any = {
    color: "#1a1a1a",
    fontSize: "16px",
    margin: "0 0 8px",
    fontWeight: "bold",
  };

  function etoiles(valeur: number, poser: any, libelle: string) {
    return (
      <div style={{ marginBottom: "22px" }}>
        <p style={QUESTION}>{libelle}</p>
        <div style={{ display: "flex", gap: "8px" }}>
          {ETOILES.map(function (n) {
            const actif = valeur >= n;
            return (
              <span
                key={n}
                onClick={() => poser(n)}
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: actif ? "#c8a96e" : "#f2f2f2",
                  color: actif ? "#050508" : "#999",
                  border: actif ? "1px solid #c8a96e" : "1px solid #ddd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  fontSize: "17px",
                }}
              >
                {n}
              </span>
            );
          })}
        </div>
        <p style={{ color: "#888", fontSize: "13px", margin: "6px 0 0" }}>
          1 = pas du tout satisfait · 5 = tres satisfait
        </p>
      </div>
    );
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 8px" }}>
          VOTRE AVIS · {code}
        </p>
        <h1 style={{ color: "#fff", fontSize: "28px", margin: "0 0 10px" }}>
          Comment s est passee votre formation ?
        </h1>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "15px", lineHeight: "1.7", marginTop: 0 }}>
          Quelques minutes suffisent. Vos reponses servent a ameliorer la formation
          pour ceux qui la suivront apres vous.
        </p>

        <div style={{ display: "flex", gap: "10px", margin: "26px 0 20px" }}>
          {[["chaud", "A la fin de ma formation"], ["froid", "Quelques mois apres"]].map(function (m) {
            const actif = moment === m[0];
            return (
              <button
                key={m[0]}
                onClick={() => changerMoment(m[0])}
                style={{ padding: "11px 20px", borderRadius: "8px", border: "none", cursor: "pointer", background: actif ? "#c8a96e" : "rgba(255,255,255,0.06)", color: actif ? "#050508" : "rgba(255,255,255,0.6)", fontSize: "15px", fontFamily: "Georgia,serif", fontWeight: actif ? "bold" : "normal" }}
              >
                {m[1]}
              </button>
            );
          })}
        </div>

        {envoye && (
          <div style={{ ...CARTE, background: "#f2f9f3", border: "1px solid #b8ddbd" }}>
            <p style={{ color: "#2e7d32", fontSize: "17px", fontWeight: "bold", margin: "0 0 6px" }}>
              Merci, votre reponse est enregistree.
            </p>
            <p style={{ color: "#4a6a4d", fontSize: "15px", margin: 0, lineHeight: "1.7" }}>
              Vous pouvez la modifier ci-dessous si vous le souhaitez.
            </p>
          </div>
        )}

        {erreur && (
          <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>
        )}

        <div style={CARTE}>
          {etoiles(globale, setGlobale, "Dans l ensemble, etes-vous satisfait de cette formation ?")}
          {etoiles(contenu, setContenu, "Le contenu etait-il clair et utile ?")}
          {etoiles(accompagnement, setAccompagnement, "Les corrections et l accompagnement vous ont-ils aide ?")}
          {etoiles(plateforme, setPlateforme, "La plateforme etait-elle simple a utiliser ?")}

          <p style={QUESTION}>Recommanderiez-vous cette formation ?</p>
          <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
            {[[true, "Oui"], [false, "Non"]].map(function (x: any) {
              const actif = recommanderait === x[0];
              return (
                <span
                  key={String(x[0])}
                  onClick={() => setRecommanderait(x[0])}
                  style={{ padding: "11px 26px", borderRadius: "8px", cursor: "pointer", background: actif ? "#c8a96e" : "#f2f2f2", color: actif ? "#050508" : "#666", border: actif ? "1px solid #c8a96e" : "1px solid #ddd", fontWeight: "bold", fontSize: "15px" }}
                >
                  {x[1]}
                </span>
              );
            })}
          </div>

          {moment === "froid" && (
            <>
              <p style={QUESTION}>Avez-vous atteint les objectifs que vous vous etiez fixes ?</p>
              <textarea value={objectifs} onChange={(e) => setObjectifs(e.target.value)} rows={3} style={CHAMP} />

              <p style={QUESTION}>Qu avez-vous mis en pratique depuis ?</p>
              <textarea value={pratique} onChange={(e) => setPratique(e.target.value)} rows={3} style={CHAMP} />
            </>
          )}

          <p style={QUESTION}>Ce qui vous a le plus servi</p>
          <textarea value={pointsForts} onChange={(e) => setPointsForts(e.target.value)} rows={3} style={CHAMP} />

          <p style={QUESTION}>Ce qui pourrait etre ameliore</p>
          <textarea value={pointsAmeliorer} onChange={(e) => setPointsAmeliorer(e.target.value)} rows={3} style={CHAMP} />

          <p style={QUESTION}>Autre chose a nous dire (facultatif)</p>
          <textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={3} style={CHAMP} />

          <button
            onClick={envoyer}
            disabled={occupe || !globale}
            style={{ background: occupe || !globale ? "#e3d9c2" : "#c8a96e", color: occupe || !globale ? "#8a8a8a" : "#050508", padding: "16px 30px", borderRadius: "8px", border: "none", cursor: occupe || !globale ? "default" : "pointer", fontWeight: "bold", fontSize: "17px", fontFamily: "Georgia,serif", width: "100%" }}
          >
            {occupe ? "Envoi..." : envoye ? "Modifier ma reponse" : "Envoyer ma reponse"}
          </button>

          <p style={{ color: "#888", fontSize: "13px", margin: "14px 0 0", lineHeight: "1.6" }}>
            Votre reponse est transmise a votre organisme de formation, qui l utilise pour
            ameliorer ses prestations. Elle n est jamais publiee nominativement.
          </p>
        </div>
      </div>
    </div>
  );
}
