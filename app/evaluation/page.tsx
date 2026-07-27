"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const SEUIL_QCM = 0.7;

const CONSIGNE =
  "Avec vos propres mots, en 200 a 400 mots : ce que vous retenez de cette formation, comment vous comptez l appliquer concretement dans votre activite (donnez un exemple precis), puis les points forts et les points a ameliorer de la formation.";

function Evaluation() {
  const sp = useSearchParams();
  const formation = sp.get("formation") || "";
  const type = sp.get("type") || "positionnement";
  const finale = type === "finale";

  const [email, setEmail] = useState("");
  const [autorise, setAutorise] = useState<boolean | null>(null);
  const [nom, setNom] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [preparation, setPreparation] = useState(false);
  const [erreurPrep, setErreurPrep] = useState("");
  const [reponses, setReponses] = useState<number[]>([]);
  const [texte, setTexte] = useState("");
  const [collage, setCollage] = useState(false);
  const [debut, setDebut] = useState<number | null>(null);
  const [resultat, setResultat] = useState<any>(null);
  const [avisResume, setAvisResume] = useState<any>(null);
  const [certif, setCertif] = useState<any>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    fetch("/api/mes-formations")
      .then(r => r.json())
      .then(d => {
        if (!d || !d.success) { setAutorise(false); return; }
        setEmail(d.email || "");
        const liste = d.formations || [];
        setAutorise(liste.some((f: any) => String(f.code) === String(formation)));
      })
      .catch(() => setAutorise(false));
  }, [formation]);

  async function chargerQuestions() {
    const r = await fetch("/api/evaluations?formation=" + encodeURIComponent(formation) + "&type=" + type);
    const d = await r.json();
    return d.questions || [];
  }

  useEffect(() => {
    if (!formation || autorise !== true) return;
    let annule = false;
    (async () => {
      let q = await chargerQuestions();
      if (!annule && q.length === 0) {
        setPreparation(true);
        try {
          const g = await fetch("/api/evaluations/generer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ formation, type }),
          });
          const dg = await g.json();
          if (!dg.ok) setErreurPrep(dg.erreur || "generation impossible");
          else q = await chargerQuestions();
        } catch (e) {
          setErreurPrep("generation impossible");
        }
        setPreparation(false);
      }
      if (!annule) {
        setQuestions(q);
        if (q.length > 0) setDebut(Date.now());
      }
    })();
    return () => { annule = true; };
  }, [formation, type, autorise]);

  const imprimer = () => {
    if (!certif || !certif.certif_html) return;
    const win = window.open("", "_blank");
    if (win) { win.document.write(certif.certif_html); win.document.close(); win.print(); }
  };

  const nbMots = texte.trim() ? texte.trim().split(/\s+/).length : 0;
  const toutesRepondues = questions.length > 0 && reponses.filter(r => r !== undefined && r !== null).length === questions.length;
  const pretAEnvoyer = toutesRepondues && (!finale || (nbMots >= 150 && nom.trim().length > 1));

  const envoyer = async () => {
    setEnvoi(true);
    try {
      const r = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, formation, type, reponses }),
      });
      const d = await r.json();
      setResultat(d);

      const qcmOk = d.total > 0 && d.score / d.total >= SEUIL_QCM;

      if (finale) {
        const duree = debut ? Math.round((Date.now() - debut) / 1000) : 0;
        const rr = await fetch("/api/evaluations/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formation,
            texte,
            consigne: CONSIGNE,
            duree_secondes: duree,
            collage_detecte: collage,
          }),
        });
        const dr = await rr.json();
        setAvisResume(dr);

        if (qcmOk && dr.ok && dr.verdict === "suffisant") {
          const rc = await fetch("/api/admin/certificat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nom: nom || email,
              formation: formation,
              code: formation,
              niveau: "Certifi&eacute;",
              date: new Date().toLocaleDateString("fr-FR"),
              userEmail: email,
            }),
          });
          setCertif(await rc.json());
        }
      }
    } catch (e) {
      setResultat({ score: 0, total: 0, erreur: String(e) });
    }
    setEnvoi(false);
  };

  const cadre = { margin: "18px 0", padding: 14, border: "1px solid #e5e7eb", borderRadius: 8 } as any;

  if (autorise === null) return <p style={{ padding: 24, fontFamily: "system-ui" }}>Verification de vos acces...</p>;

  if (autorise === false) return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: 24, fontFamily: "system-ui" }}>
      <h1>Acc&egrave;s non autoris&eacute;</h1>
      <p>Cette &eacute;valuation est r&eacute;serv&eacute;e aux personnes inscrites &agrave; la formation <b>{formation}</b>.</p>
      <p><a href="/catalogue" style={{ color: "#1d4ed8" }}>Voir le catalogue des formations</a> &mdash; <a href="/dashboard" style={{ color: "#1d4ed8" }}>Mon espace</a></p>
    </div>
  );

  if (resultat) {
    const qcmOk = resultat.total > 0 && resultat.score / resultat.total >= SEUIL_QCM;
    const resumeOk = avisResume && avisResume.ok && avisResume.verdict === "suffisant";
    return (
      <div style={{ maxWidth: 760, margin: "40px auto", padding: 24, fontFamily: "system-ui" }}>
        <h1>{finale ? "Evaluation finale" : "Positionnement"} : r&eacute;sultat</h1>

        <div style={cadre}>
          <p style={{ fontSize: 20, margin: 0 }}>
            Questionnaire : <b>{resultat.score} / {resultat.total}</b>{" "}
            {finale && (qcmOk ? <span style={{ color: "#15803d" }}>&mdash; valid&eacute;</span> : <span style={{ color: "#b91c1c" }}>&mdash; non valid&eacute; (70 % requis)</span>)}
          </p>
        </div>

        {finale && avisResume && (
          <div style={cadre}>
            <p style={{ margin: "0 0 6px" }}>
              Restitution &eacute;crite : <b>{avisResume.note} / 100</b>{" "}
              {resumeOk ? <span style={{ color: "#15803d" }}>&mdash; valid&eacute;e</span> : <span style={{ color: "#b91c1c" }}>&mdash; non valid&eacute;e (60 requis)</span>}
            </p>
            {avisResume.justification && <p style={{ margin: 0, color: "#4b5563" }}>{avisResume.justification}</p>}
            {avisResume.erreur && <p style={{ margin: 0, color: "#b91c1c" }}>{avisResume.erreur}</p>}
          </div>
        )}

        {certif && certif.success && (
          <div style={{ padding: 14, border: "1px solid #D4AF37", borderRadius: 8, margin: "12px 0" }}>
            <p><b>Certificat officiel {certif.certif_id}</b> &mdash; un email de confirmation vous a &eacute;t&eacute; envoy&eacute;.</p>
            <iframe srcDoc={certif.certif_html} style={{ width: "100%", height: 430, border: 0, borderRadius: 8, background: "#000", marginTop: 10 }} />
            <div style={{ marginTop: 10 }}>
              <button onClick={imprimer} style={{ padding: "10px 24px", background: "#D4AF37", color: "#0a0a1a", border: 0, borderRadius: 8, fontWeight: 700 }}>Imprimer / Enregistrer en PDF</button>
            </div>
          </div>
        )}

        {finale && !certif && (
          <p>Les deux &eacute;preuves doivent &ecirc;tre valid&eacute;es pour obtenir le certificat. Vous pouvez repasser l &eacute;valuation.</p>
        )}

        <p><a href={"/satisfaction?email=" + encodeURIComponent(email) + "&formation=" + encodeURIComponent(formation)} style={{ color: "#1d4ed8" }}>Donner mon avis sur la formation</a></p>
      </div>
    );
  }

  if (preparation) return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: 24, fontFamily: "system-ui" }}>
      <h1>Pr&eacute;paration de votre &eacute;valuation</h1>
      <p>Vos questions sont en cours de constitution &agrave; partir du support de cours. Cela prend quelques instants.</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 24, fontFamily: "system-ui" }}>
      <h1>{finale ? "Evaluation finale des acquis" : "Questionnaire de positionnement"}</h1>
      <p>Formation : <b>{formation}</b></p>
      <p style={{ color: "#4b5563" }}>Connect&eacute; en tant que <b>{email}</b></p>

      {erreurPrep && <p style={{ color: "#b91c1c" }}>Pr&eacute;paration impossible : {erreurPrep}</p>}

      {finale && (
        <label>Votre nom complet (pour le certificat)<br />
          <input value={nom} onChange={e => setNom(e.target.value)} style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6 }} />
        </label>
      )}

      {questions.map((q, i) => (
        <div key={q.id || i} style={cadre}>
          <p><b>{i + 1}. {q.question}</b></p>
          {(q.options || []).map((opt: string, j: number) => (
            <label key={j} style={{ display: "block", margin: "6px 0" }}>
              <input type="radio" name={"q" + i} checked={reponses[i] === j} onChange={() => { const c = [...reponses]; c[i] = j; setReponses(c); }} /> {opt}
            </label>
          ))}
        </div>
      ))}

      {finale && questions.length > 0 && (
        <div style={cadre}>
          <p><b>Restitution &eacute;crite</b></p>
          <p style={{ color: "#4b5563" }}>{CONSIGNE}</p>
          <textarea
            value={texte}
            onChange={e => setTexte(e.target.value)}
            onPaste={() => setCollage(true)}
            rows={12}
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 6, fontFamily: "inherit", fontSize: 15 }}
          />
          <p style={{ color: nbMots >= 150 ? "#15803d" : "#4b5563", fontSize: 14, margin: "6px 0 0" }}>
            {nbMots} mots {nbMots < 150 ? "(150 minimum)" : ""}
          </p>
        </div>
      )}

      {questions.length > 0 && (
        <button onClick={envoyer} disabled={envoi || !pretAEnvoyer} style={{ padding: "12px 28px", background: pretAEnvoyer ? "#1d4ed8" : "#9ca3af", color: "#fff", border: 0, borderRadius: 8, fontSize: 16 }}>
          {envoi ? "Analyse en cours..." : "Valider mon evaluation"}
        </button>
      )}

      {questions.length === 0 && !preparation && !erreurPrep && <p>Aucune question disponible pour cette formation.</p>}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<p style={{ padding: 24 }}>Chargement...</p>}><Evaluation /></Suspense>;
}
