"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function Note({ label, val, set }: { label: string; val: number; set: (n: number) => void }) {
  return (
    <div style={{ margin: "14px 0" }}>
      <p style={{ margin: "4px 0" }}><b>{label}</b></p>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => set(n)} style={{ marginRight: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #ccc", background: val === n ? "#1d4ed8" : "#fff", color: val === n ? "#fff" : "#111" }}>{n}</button>
      ))}
    </div>
  );
}

function Satisfaction() {
  const sp = useSearchParams();
  const formation = sp.get("formation") || "";
  const [email, setEmail] = useState(sp.get("email") || "");
  const [g, setG] = useState(0); const [c, setC] = useState(0);
  const [a, setA] = useState(0); const [u, setU] = useState(0);
  const [reco, setReco] = useState(-1);
  const [com, setCom] = useState("");
  const [ok, setOk] = useState(false);

  const envoyer = async () => {
    const r = await fetch("/api/satisfaction", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, formation, note_globale: g, note_contenu: c, note_animation: a, note_utilite: u, recommande: reco, commentaire: com }) });
    if (r.ok) setOk(true);
  };

  if (ok) return <div style={{ maxWidth: 640, margin: "40px auto", padding: 24, fontFamily: "system-ui" }}><h1>Merci !</h1><p>Votre avis a bien &eacute;t&eacute; enregistr&eacute;.</p></div>;

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: 24, fontFamily: "system-ui" }}>
      <h1>Votre avis sur la formation</h1>
      <p>Formation : <b>{formation}</b></p>
      <label>Votre email<br /><input value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6 }} /></label>
      <Note label="Satisfaction globale" val={g} set={setG} />
      <Note label="Qualite du contenu" val={c} set={setC} />
      <Note label="Qualite de l accompagnement" val={a} set={setA} />
      <Note label="Utilite professionnelle" val={u} set={setU} />
      <div style={{ margin: "14px 0" }}>
        <p style={{ margin: "4px 0" }}><b>Recommanderiez-vous cette formation ? (0-10)</b></p>
        {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
          <button key={n} onClick={() => setReco(n)} style={{ marginRight: 4, marginBottom: 4, padding: "6px 10px", borderRadius: 6, border: "1px solid #ccc", background: reco === n ? "#1d4ed8" : "#fff", color: reco === n ? "#fff" : "#111" }}>{n}</button>
        ))}
      </div>
      <label>Commentaire libre<br /><textarea value={com} onChange={e => setCom(e.target.value)} rows={4} style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6 }} /></label>
      <div style={{ marginTop: 16 }}>
        <button onClick={envoyer} disabled={!email || !g} style={{ padding: "10px 24px", background: "#1d4ed8", color: "#fff", border: 0, borderRadius: 8 }}>Envoyer mon avis</button>
      </div>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<p style={{ padding: 24 }}>Chargement...</p>}><Satisfaction /></Suspense>;
}
