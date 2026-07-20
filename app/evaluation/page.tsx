"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function Evaluation() {
  const sp = useSearchParams();
  const formation = sp.get("formation") || "";
  const type = sp.get("type") || "positionnement";
  const [email, setEmail] = useState(sp.get("email") || "");
  const [questions, setQuestions] = useState<any[]>([]);
  const [reponses, setReponses] = useState<number[]>([]);
  const [resultat, setResultat] = useState<any>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (!formation) return;
    fetch("/api/evaluations?formation=" + encodeURIComponent(formation) + "&type=" + type)
      .then(r => r.json()).then(d => setQuestions(d.questions || []));
  }, [formation, type]);

  const envoyer = async () => {
    setEnvoi(true);
    const r = await fetch("/api/evaluations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, formation, type, reponses }) });
    setResultat(await r.json()); setEnvoi(false);
  };

  if (resultat) return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: 24, fontFamily: "system-ui" }}>
      <h1>{type === "finale" ? "Evaluation finale" : "Positionnement"} : r&eacute;sultat</h1>
      <p style={{ fontSize: 22 }}>Score : <b>{resultat.score} / {resultat.total}</b></p>
      {type === "finale" && resultat.total > 0 && resultat.score / resultat.total >= 0.6 && (
        <a href={"/attestation?email=" + encodeURIComponent(email) + "&formation=" + encodeURIComponent(formation) + "&score=" + resultat.score + "&total=" + resultat.total} style={{ color: "#1d4ed8" }}>Voir mon certificat de r&eacute;alisation</a>
      )}
      <p><a href={"/satisfaction?email=" + encodeURIComponent(email) + "&formation=" + encodeURIComponent(formation)} style={{ color: "#1d4ed8" }}>Donner mon avis sur la formation</a></p>
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: 24, fontFamily: "system-ui" }}>
      <h1>{type === "finale" ? "Evaluation finale des acquis" : "Questionnaire de positionnement"}</h1>
      <p>Formation : <b>{formation}</b></p>
      <label>Votre email<br /><input value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6 }} /></label>
      {questions.map((q, i) => (
        <div key={q.id} style={{ margin: "18px 0", padding: 12, border: "1px solid #e5e7eb", borderRadius: 8 }}>
          <p><b>{i + 1}. {q.question}</b></p>
          {(q.options || []).map((opt: string, j: number) => (
            <label key={j} style={{ display: "block", margin: "6px 0" }}>
              <input type="radio" name={"q" + i} checked={reponses[i] === j} onChange={() => { const c = [...reponses]; c[i] = j; setReponses(c); }} /> {opt}
            </label>
          ))}
        </div>
      ))}
      {questions.length > 0 && <button onClick={envoyer} disabled={envoi || !email} style={{ padding: "10px 24px", background: "#1d4ed8", color: "#fff", border: 0, borderRadius: 8 }}>{envoi ? "Envoi..." : "Valider mes r\u00e9ponses"}</button>}
      {questions.length === 0 && <p>Aucune question disponible pour cette formation.</p>}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<p style={{ padding: 24 }}>Chargement...</p>}><Evaluation /></Suspense>;
}
