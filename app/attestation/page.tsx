"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function jour(v: any) {
  if (!v) return "";
  return new Date(v).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function Attestation() {
  const sp = useSearchParams();
  const certif = sp.get("certif") || "";
  const nomUrl = sp.get("nom") || sp.get("email") || "";
  const formationUrl = sp.get("formation") || "";
  const heuresUrl = sp.get("heures") || "";
  const score = sp.get("score") || "";
  const total = sp.get("total") || "";

  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(function () {
    if (!certif) { setChargement(false); return; }
    fetch("/api/attestation?certif=" + encodeURIComponent(certif))
      .then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.ok) setD(j); })
      .catch(function () {})
      .finally(function () { setChargement(false); });
  }, [certif]);

  const nom = d ? d.attestation.nom : nomUrl;
  const formation = d ? d.formation.titre : formationUrl;
  const heures = d ? d.formation.heures : heuresUrl;
  const date = d ? jour(d.attestation.delivree_le) : new Date().toLocaleDateString("fr-FR");

  const PAGE: any = {
    maxWidth: 780, margin: "30px auto", padding: 40,
    fontFamily: "Georgia, serif", background: "#ffffff", color: "#111",
    border: "3px double #1d4ed8",
  };

  return (
    <div style={{ background: "#ffffff", minHeight: "100vh", padding: "1px 0" }}>
      <div style={PAGE}>
        <p style={{ textAlign: "center", letterSpacing: 3, color: "#1d4ed8", margin: "0 0 6px" }}>ACADEMIA PRO</p>
        <h1 style={{ textAlign: "center", fontSize: 30, margin: "0 0 24px" }}>Attestation de suivi de formation</h1>

        <p style={{ fontSize: 18, lineHeight: 1.7 }}>
          AcadémIA Pro LLC atteste que <b>{nom}</b> a suivi et achevé la formation
          <b> {formation}</b>{heures ? <> d’une durée de <b>{heures} heures</b></> : null}.
        </p>

        {d && d.formation.objectifs ? (
          <div style={{ marginTop: 18 }}>
            <p style={{ fontSize: 15, fontWeight: "bold", margin: "0 0 6px" }}>Objectifs de la formation</p>
            <p style={{ fontSize: 15, lineHeight: 1.7, margin: 0, color: "#333" }}>{d.formation.objectifs}</p>
          </div>
        ) : null}

        {d && d.parcours.total_modules > 0 ? (
          <p style={{ fontSize: 17, marginTop: 18 }}>
            Parcours composé de <b>{d.parcours.total_modules} modules</b> répartis en{" "}
            <b>{d.parcours.chapitres.length} chapitres</b>
            {d.parcours.modules_valides > 0
              ? <>, dont <b>{d.parcours.modules_valides}</b> validés par évaluation.</>
              : <>.</>}
          </p>
        ) : null}

        {score && total ? <p style={{ fontSize: 17 }}>Évaluation finale des acquis : <b>{score} / {total}</b>.</p> : null}

        <p style={{ fontSize: 17, marginTop: 18 }}>Fait le {date}.</p>
        {certif ? <p style={{ fontSize: 15, color: "#444", margin: "4px 0 0" }}>Numéro d’attestation : <b>{certif}</b></p> : null}

        <p style={{ marginTop: 36, fontSize: 16, lineHeight: 1.6 }}>
          Jacques Lalou<br />Fondateur, AcadémIA Pro LLC<br />30 N Gould St STE R, Sheridan, WY 82801, USA
        </p>

        <div style={{ marginTop: 28, padding: "14px 18px", border: "1px solid #999", background: "#f6f6f6" }}>
          <p style={{ fontSize: 12.5, lineHeight: 1.65, margin: 0, color: "#333" }}>
            <b>Portée de la présente attestation.</b> Formation dispensée intégralement à distance ;
            les contenus pédagogiques et la correction des évaluations sont produits par intelligence
            artificielle, aucun formateur humain n’intervient dans leur délivrance. Ce document est
            interne à AcadémIA Pro LLC et n’a aucune valeur légale ou réglementaire externe. Il ne
            constitue ni une certification professionnelle, ni un titre, ni un diplôme reconnu par un
            État ou une autorité publique. La formation n’est enregistrée ni au Répertoire national
            des certifications professionnelles (RNCP), ni au répertoire spécifique, et AcadémIA Pro
            LLC n’est pas certifiée Qualiopi. Elle n’ouvre droit à aucun financement au titre du
            compte personnel de formation ni par un opérateur de compétences.
          </p>
        </div>

        <p style={{ fontSize: 11.5, color: "#666", marginTop: 16 }}>
          Document généré électroniquement par academiapro.fr — vérifiable au moyen du numéro ci-dessus.
        </p>
      </div>

      {d && d.parcours.chapitres.length > 0 ? (
        <div style={{ ...PAGE, marginTop: 30 }} className="page2">
          <p style={{ textAlign: "center", letterSpacing: 3, color: "#1d4ed8", margin: "0 0 6px" }}>ACADEMIA PRO</p>
          <h2 style={{ textAlign: "center", fontSize: 22, margin: "0 0 6px" }}>Détail du parcours suivi</h2>
          <p style={{ textAlign: "center", fontSize: 14, color: "#555", margin: "0 0 26px" }}>
            {formation} — attestation n° {certif}
          </p>

          {d.parcours.chapitres.map(function (c: any) {
            return (
              <div key={c.numero} style={{ marginBottom: 22 }}>
                <p style={{ fontSize: 16, fontWeight: "bold", color: "#1d4ed8", margin: "0 0 8px" }}>
                  Chapitre {c.numero} — {c.titre}
                </p>
                {c.modules.map(function (m: any) {
                  return (
                    <div key={m.numero} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "5px 0", borderBottom: "1px solid #eee" }}>
                      <span style={{ fontSize: 14.5, flex: 1 }}>
                        {m.titre}
                        <span style={{ color: "#888", fontSize: 12.5 }}> · {m.type}</span>
                      </span>
                      <span style={{ fontSize: 13.5, color: m.valide ? "#0a6b2e" : "#999", whiteSpace: "nowrap" }}>
                        {m.valide
                          ? (m.score != null ? m.score + "/20 · " : "") + (m.date ? jour(m.date) : "validé")
                          : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          <p style={{ fontSize: 12.5, color: "#555", marginTop: 20, lineHeight: 1.65 }}>
            Un module est validé à partir d’une note de 14 sur 20. Chaque évaluation fait l’objet
            d’une correction individuelle avec explication des erreurs. Le nombre de tentatives
            n’est pas limité.
          </p>
        </div>
      ) : null}

      <div className="no-print" style={{ textAlign: "center", margin: "24px 0 40px" }}>
        <button onClick={() => window.print()} style={{ padding: "10px 24px", background: "#1d4ed8", color: "#fff", border: 0, borderRadius: 8, fontSize: 15 }}>
          Imprimer / Enregistrer en PDF
        </button>
        {chargement ? <p style={{ fontSize: 13, color: "#666" }}>Chargement du détail du parcours...</p> : null}
      </div>

      <style>{"@media print { .no-print { display: none; } .page2 { page-break-before: always; } body { background: #fff; } }"}</style>
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={<p style={{ padding: 24 }}>Chargement...</p>}><Attestation /></Suspense>;
}
