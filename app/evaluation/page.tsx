"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function Evaluation() {
  const sp = useSearchParams();
  const formation = sp.get("formation") || "";
  const type = sp.get("type") || "positionnement";
  const [email, setEmail] = useState("");
  const [autorise, setAutorise] = useState<boolean | null>(null);
  const [nom, setNom] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [reponses, setReponses] = useState<number[]>([]);
  const [resultat, setResultat] = useState<any>(null);
  const [certif, setCertif] = useState<any>(null);
  const [envoi, setEnvoi] = useState(false);

  // L'identite vient de la session, jamais d'un champ ni de l'URL.
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

  useEffect(() => {
    if (!formation || autorise !== true) return;
    fetch("/api/evaluations?formation=" + encodeURIComponent(formation) + "&type=" + type)
      .then(r => r.json()).then(d => setQuestions(d.questions || []));
  }, [formation, type, autorise]);

  const imprimer = () => {
    if (!certif || !certif.certif_html) return;
    const win = window.open("", "_blank");
    if (win) { win.document.write(certif.certif_html); win.document.close(); win.print(); }
  };

  const envoyer = async () => {
    setEnvoi(true);
    try {
      const r = await fetch("/api/evaluations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, formation, type, reponses }) });
      const d = await r.json();
      setResultat(d);
      if (type === "finale" && d.total > 0 && d.score / d.total >= 0.6) {
        const rc = await fetch("/api/admin/certificat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom: nom || email, formation: formation, code: formation, niveau: "Certifi&eacute;", date: new Date().toLocaleDateString("fr-FR"), userEmail: email }) });
        setCertif(await rc.json());
      }
    } catch (e) { setResultat({ score: 0, total: 0, erreur: String(e) }); }
    setEnvoi(false);
  };

  if (autorise === null) return <p style={{ padding: 24, fontFamily: "system-ui" }}>Verification de vos acces...</p>;

  if (autorise === false) return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: 24, fontFamily: "system-ui" }}>
      <h1>Acc&egrave;s non autoris&eacute;</h1>
      <p>Cette &eacute;valuation est r&eacute;serv&eacute;e aux personnes inscrites &agrave; la formation <b>{formation}</b>.</p>
      <p><a href="/catalogue" style={{ color: "#1d4ed8" }}>Voir le catalogue des formations</a> &mdash; <a href="/dashboard" style={{ color: "#1d4ed8" }}>Mon espace</a></p>
    </div>
  );

  if (resultat) return (
    <div style={{ maxWidth: 760, margin: "40px auto", padding: 24, fontFamily: "system-ui" }}>
      <h1>{type === "finale" ? "Evaluation finale" : "Positionnement"} : r&eacute;sultat</h1>
      <p style={{ fontSize: 22 }}>Score : <b>{resultat.score} / {resultat.total}</b></p>
      {certif && certif.success && (
        <div style={{ padding: 14, border: "1px solid #D4AF37", borderRadius: 8, margin: "12px 0" }}>
          <p><b>Certificat officiel {certif.certif_id}</b> &mdash; un email de confirmation vous a &eacute;t&eacute; envoy&eacute;.</p>
          <iframe srcDoc={certif.certif_html} style={{ width: "100%", height: 430, border: 0, borderRadius: 8, background: "#000", marginTop: 10 }} />
          <div style={{ marginTop: 10 }}>
            <button onClick={imprimer} style={{ padding: "10px 24px", background: "#D4AF37", color: "#0a0a1a", border: 0, borderRadius: 8, fontWeight: 700 }}>Imprimer / Enregistrer en PDF</button>
          </div>
        </div>
      )}
      {certif && !certif.success && (
        <p style={{ color: "#b91c1c" }}>La g&eacute;n&eacute;ration du certificat officiel a rencontr&eacute; un probl&egrave;me &mdash; votre r&eacute;ussite est bien enregistr&eacute;e, le certificat pourra &ecirc;tre r&eacute;&eacute;mis.</p>
      )}
      {type === "finale" && resultat.total > 0 && resultat.score / resultat.total < 0.6 && (
        <p>Score inf&eacute;rieur au seuil de r&eacute;ussite (60%). Vous pouvez repasser l &eacute;valuation.</p>
      )}
      <p><a href={"/satisfaction?email=" + encodeURIComponent(email) + "&formation=" + encodeURIComponent(formation)} style={{ color: "#1d4ed8" }}>Donner mon avis sur la formation</a></p>
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: 24, fontFamily: "system-ui" }}>
      <h1>{type === "finale" ? "Evaluation finale des acquis" : "Questionnaire de positionnement"}</h1>
      <p>Formation : <b>{formation}</b></p>
      <p style={{ color: "#4b5563" }}>Connect&eacute; en tant que <b>{email}</b></p>
      {type === "finale" && (
        <label>Votre nom complet (pour le certificat)<br /><input value={nom} onChange={e => setNom(e.target.value)} style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6 }} /></label>
      )}
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
