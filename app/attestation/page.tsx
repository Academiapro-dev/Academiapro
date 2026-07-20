"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function Attestation() {
  const sp = useSearchParams();
  const nom = sp.get("nom") || sp.get("email") || "";
  const formation = sp.get("formation") || "";
  const score = sp.get("score") || ""; const total = sp.get("total") || "";
  const heures = sp.get("heures") || "";
  const date = new Date().toLocaleDateString("fr-FR");
  return (
    <div style={{ maxWidth: 760, margin: "30px auto", padding: 40, fontFamily: "Georgia, serif", border: "3px double #1d4ed8" }}>
      <p style={{ textAlign: "center", letterSpacing: 3, color: "#1d4ed8" }}>ACADEMIA PRO</p>
      <h1 style={{ textAlign: "center" }}>Certificat de r&eacute;alisation</h1>
      <p style={{ fontSize: 18, lineHeight: 1.7 }}>
        Acad&eacute;mIA Pro LLC atteste que <b>{nom}</b> a suivi et achev&eacute; la formation
        <b> {formation}</b>{heures ? <> d une dur&eacute;e de <b>{heures} heures</b></> : null}.
      </p>
      {score && total ? <p style={{ fontSize: 18 }}>Evaluation finale des acquis : <b>{score} / {total}</b>.</p> : null}
      <p style={{ fontSize: 18 }}>Fait le {date}.</p>
      <p style={{ marginTop: 40 }}>Jacques Lalou<br />Fondateur, Acad&eacute;mIA Pro LLC<br />30 N Gould St STE R, Sheridan, WY 82801, USA</p>
      <p style={{ fontSize: 12, color: "#666" }}>Document g&eacute;n&eacute;r&eacute; &eacute;lectroniquement par academiapro.fr</p>
      <div className="no-print" style={{ textAlign: "center", marginTop: 24 }}>
        <button onClick={() => window.print()} style={{ padding: "10px 24px", background: "#1d4ed8", color: "#fff", border: 0, borderRadius: 8 }}>Imprimer / Enregistrer en PDF</button>
      </div>
      <style>{"@media print { .no-print { display: none; } }"}</style>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<p style={{ padding: 24 }}>Chargement...</p>}><Attestation /></Suspense>;
}
