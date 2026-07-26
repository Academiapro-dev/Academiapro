"use client";

import { useEffect, useState } from "react";

type Question = { code: string; ordre: number; question: string; options: string[] };
type Obligation = {
  code: string; document: string; juridiction: string;
  consequence: string; source: string; validee_par_fiscaliste: boolean;
};
type Ecarte = { code: string; document: string; raison: string };

function libelle(opt: string): string {
  const table: Record<string, string> = {
    france: "France", autre: "Autre", usa: "USA",
    smllc: "LLC unipersonnelle (SMLLC)", llc_multi: "LLC multi-membres",
    corporation: "Corporation", oui: "Oui", non: "Non",
    remboursement_compte_courant: "Remboursement de compte courant",
    distributions: "Distributions", direct: "Oui, en direct",
    merchant_of_record: "Oui, via merchant of record",
    transparente: "Transparente", opaque_siege_france: "Opaque (siege en France)",
    non_tranchee: "Non tranchee",
  };
  return table[opt] || opt.replace(/_/g, " ");
}

function estAConfirmer(consequence: string): boolean {
  return /A CONFIRMER/i.test(consequence || "");
}

function nettoyerConsequence(consequence: string): string {
  return (consequence || "").replace(/\s*(â€”|—|–|-)?\s*A CONFIRMER\s*$/i, "").trim();
}

export default function QualificationPage() {
  const [donnees, setDonnees] = useState<any>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string>("");

  async function charger(param?: string) {
    setChargement(true);
    setErreur("");
    try {
      const url = "/api/compliance/qualification" + (param ? "?" + param : "");
      const rep = await fetch(url, { cache: "no-store" });
      const json = await rep.json();
      if (!rep.ok || !json.success) {
        setErreur(json.error || "Erreur inconnue");
      } else {
        setDonnees(json);
      }
    } catch (e: any) {
      setErreur(String(e && e.message ? e.message : e));
    }
    setChargement(false);
  }

  useEffect(() => {
    charger();
  }, []);

  function repondre(code: string, valeur: string) {
    charger(code + "=" + encodeURIComponent(valeur));
  }

  const questions: Question[] = donnees?.questions || [];
  const reponses: Record<string, string> = donnees?.reponses || {};
  const obligations: Obligation[] = donnees?.obligations || [];
  const ecartes: Ecarte[] = donnees?.documents_ecartes || [];
  const manquantes = donnees?.questions_manquantes?.length || 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0e241a", color: "#f2efe6", fontFamily: "Georgia, serif", padding: "24px 16px" }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <h1 style={{ color: "#d4af37", fontSize: 26, marginBottom: 4 }}>Qualification de votre situation</h1>
        <p style={{ color: "#bdb8a8", marginTop: 0 }}>
          Repondez aux questions : votre carte d&apos;obligations se met a jour instantanement.
        </p>

        {erreur && (
          <div style={{ background: "#5b1f1f", padding: 12, borderRadius: 8, margin: "12px 0" }}>{erreur}</div>
        )}

        {questions.map((q) => (
          <div key={q.code} style={{ background: "#143122", borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
            <div style={{ marginBottom: 10 }}>
              <span style={{ color: "#d4af37", fontWeight: "bold" }}>{q.code}.</span> {q.question}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {q.options.map((opt) => {
                const actif = reponses[q.code] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => repondre(q.code, opt)}
                    disabled={chargement}
                    style={{
                      padding: "8px 14px", borderRadius: 20, cursor: "pointer",
                      border: actif ? "2px solid #d4af37" : "1px solid #3c5a48",
                      background: actif ? "#d4af37" : "transparent",
                      color: actif ? "#0e241a" : "#f2efe6",
                      fontWeight: actif ? "bold" : "normal", fontSize: 15,
                    }}
                  >
                    {libelle(opt)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {chargement && <p style={{ color: "#bdb8a8" }}>Chargement…</p>}

        {!chargement && donnees && (
          <>
            <h2 style={{ color: "#d4af37", fontSize: 22, borderBottom: "2px solid #d4af37", paddingBottom: 4, marginTop: 28 }}>
              Vos obligations ({obligations.length}){manquantes > 0 ? " — " + manquantes + " question(s) sans reponse" : ""}
            </h2>
            {obligations.map((o) => (
              <div key={o.code} style={{ background: "#143122", borderLeft: "4px solid #d4af37", borderRadius: 8, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ fontWeight: "bold" }}>
                  {o.document} <span style={{ color: "#bdb8a8", fontWeight: "normal" }}>({o.juridiction})</span>
                  {estAConfirmer(o.consequence) && (
                    <span style={{ marginLeft: 8, fontSize: 12, background: "#7a5c1e", padding: "2px 8px", borderRadius: 10, color: "#f2efe6", fontWeight: "normal" }}>
                      a confirmer
                    </span>
                  )}
                </div>
                <div style={{ marginTop: 4 }}>{nettoyerConsequence(o.consequence)}</div>
                <div style={{ marginTop: 4, fontSize: 13, color: "#bdb8a8" }}>Source : {o.source}</div>
              </div>
            ))}

            <h2 style={{ color: "#d4af37", fontSize: 22, borderBottom: "2px solid #d4af37", paddingBottom: 4, marginTop: 28 }}>
              Ce qui ne vous concerne pas ({ecartes.length})
            </h2>
            {ecartes.map((e) => (
              <div key={e.code} style={{ background: "#112619", borderRadius: 8, padding: "10px 14px", marginBottom: 8, color: "#bdb8a8" }}>
                <span style={{ color: "#f2efe6", fontWeight: "bold" }}>{e.document}</span> — {e.raison}
              </div>
            ))}

            <p style={{ marginTop: 24, fontSize: 13, color: "#bdb8a8", borderTop: "1px solid #3c5a48", paddingTop: 10 }}>
              {donnees.avertissement}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
