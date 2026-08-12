"use client";
import { useState, useEffect } from "react";

// Minuscules, sans accents : « Tresorerie » se trouve en tapant tresorerie.
function sansAccent(s: any): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function PageRapprochement() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [d, setD] = useState<any>(null);
  const [prop, setProp] = useState<any>(null);
  const [comptes, setComptes] = useState<any[]>([]);
  const [choixCompte, setChoixCompte] = useState<any>({});
  const [rechercheCompte, setRechercheCompte] = useState<any>({});
  const [chargement, setChargement] = useState(false);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(function () {
    (async function () {
      try {
        const r = await fetch("/api/compliance/societes");
        const data = await r.json();
        if (data.ok) {
          setSocietes(data.societes || []);
          const p = new URLSearchParams(window.location.search).get("societe_id");
          if (p) setDossier(p);
          else if ((data.societes || []).length === 1) setDossier(data.societes[0].id);
        }
      } catch (e) {}
    })();
  }, []);

  useEffect(function () {
    if (dossier) charger();
  }, [dossier]);

  async function charger() {
    setChargement(true);
    setErreur("");
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch("/api/compliance/rapprochement?societe_id=" + dossier),
        fetch("/api/compliance/ecriture-depuis-releve?societe_id=" + dossier),
        fetch("/api/compliance/comptes?societe_id=" + dossier),
      ]);
      const a = await r1.json();
      const b = await r2.json();
      const c = await r3.json();
      if (a.ok) setD(a); else setErreur(a.erreur || "Lecture impossible.");
      if (b.ok) {
        setProp(b);
        const pre: any = {};
        for (const l of b.lignes || []) {
          if (l.proposition) pre[l.id] = l.proposition.compte;
        }
        setChoixCompte(pre);
      }
      if (c.ok) {
        setComptes((c.comptes || []).filter(function (x: any) {
          return x.actif !== false && x.numero.charAt(0) !== "5";
        }));
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  // LA RECHERCHE DE COMPTE : un numero, un debut de numero, ou un mot du
  // libelle. Taper 6 ne laisse que les charges. Le compte deja choisi reste
  // toujours propose, sans quoi la ligne se viderait toute seule.
  function comptesProposes(q: string, courant: string) {
    const t = sansAccent(q).trim();
    if (!t) return comptes;

    const trouves = comptes.filter(function (c: any) {
      return sansAccent(c.numero + " " + (c.libelle || "")).indexOf(t) >= 0;
    });

    if (courant && !trouves.some(function (c: any) { return c.numero === courant; })) {
      const garde = comptes.find(function (c: any) { return c.numero === courant; });
      if (garde) return [garde].concat(trouves);
    }
    return trouves;
  }

  async function agir(id: string, corps: any) {
    setOccupe(id);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/rapprochement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id, ...corps }),
      });
      const data = await r.json();
      if (data.ok) { setMessage(data.message); await charger(); }
      else setErreur(data.erreur || "Action impossible.");
    } catch (e: any) {
      setErreur("Action impossible : " + String(e));
    }
    setOccupe("");
  }

  async function creerEcriture(l: any) {
    const compte = choixCompte[l.id];
    if (!compte) { setErreur("Choisissez un compte de contrepartie."); return; }
    setOccupe(l.id);
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/ecriture-depuis-releve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ releve_id: l.id, compte: compte, libelle: l.libelle }),
      });
      const data = await r.json();
      if (data.ok) { setMessage(data.message); await charger(); }
      else setErreur(data.erreur || "Création impossible.");
    } catch (e: any) {
      setErreur("Création impossible : " + String(e));
    }
    setOccupe("");
  }

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
  const CHAMP: any = { width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px", fontFamily: "Georgia,serif", boxSizing: "border-box" };
  const LIBELLE: any = { display: "block", color: "#c8a96e", fontSize: "13px", marginBottom: "5px" };
  const BOUTON: any = { background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "8px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" };

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
  }

  function propositionDe(id: string) {
    if (!prop) return null;
    const l = (prop.lignes || []).find(function (x: any) { return x.id === id; });
    return l ? l.proposition : null;
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/admin/compliance/releve" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux relevés
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITÉ
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Rapprochement bancaire</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Rapprocher d'une écriture existante, ou la créer
        </p>

        <div style={{ ...CARTE, marginTop: "24px" }}>
          <span style={LIBELLE}>Dossier</span>
          <select value={dossier} onChange={(e) => setDossier(e.target.value)} style={CHAMP}>
            <option value="">— choisir un dossier —</option>
            {societes.map(function (s) {
              return <option key={s.id} value={s.id}>{s.raison_sociale} ({s.code})</option>;
            })}
          </select>
        </div>

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px", lineHeight: "1.7" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Recherche des correspondances…</p></div>
        ) : !d ? null : (
          <>
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "18px" }}>
              <div style={{ ...CARTE, flex: "1 1 140px", marginBottom: 0 }}>
                <p style={{ color: "#c8a96e", fontSize: "23px", fontWeight: "bold", margin: "0 0 4px" }}>{d.a_traiter}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>À traiter</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 140px", marginBottom: 0 }}>
                <p style={{ color: "#4caf50", fontSize: "23px", fontWeight: "bold", margin: "0 0 4px" }}>{d.certaines}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>Correspondances sûres</p>
              </div>
              <div style={{ ...CARTE, flex: "1 1 140px", marginBottom: 0 }}>
                <p style={{ color: "#e8a33d", fontSize: "23px", fontWeight: "bold", margin: "0 0 4px" }}>{d.sans_candidat}</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: 0 }}>À saisir</p>
              </div>
            </div>

            {d.propositions.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "#4caf50", margin: 0, fontSize: "15px" }}>
                  Tout est rapproché. La banque tombe juste.
                </p>
              </div>
            ) : (
              d.propositions.map(function (p: any) {
                const suggestion = propositionDe(p.id);
                const q = rechercheCompte[p.id] || "";
                const proposes = comptesProposes(q, choixCompte[p.id] || "");
                return (
                  <div key={p.id} style={{ ...CARTE, border: p.certaine ? "1px solid rgba(76,175,80,0.45)" : CARTE.border }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ flex: "1 1 260px" }}>
                        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12.5px", margin: "0 0 3px" }}>
                          Relevé du {new Date(p.operation_date).toLocaleDateString("fr-FR")}
                        </p>
                        <h3 style={{ color: "#fff", fontSize: "16px", margin: 0 }}>{p.libelle}</h3>
                      </div>
                      <span style={{ color: p.montant < 0 ? "#e8836a" : "#4caf50", fontSize: "17px", fontWeight: "bold" }}>
                        {euros(p.montant)}
                      </span>
                    </div>

                    {p.candidats.length > 0 && (
                      <div style={{ marginTop: "12px" }}>
                        {p.candidats.map(function (c: any) {
                          return (
                            <div key={c.ecriture_num} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap", padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", marginBottom: "8px" }}>
                              <div style={{ flex: "1 1 240px" }}>
                                <p style={{ color: "#c8a96e", fontSize: "12.5px", margin: "0 0 2px" }}>
                                  {c.ecriture_num} · {new Date(c.date).toLocaleDateString("fr-FR")}
                                  {c.ecart_jours > 0 ? " · " + c.ecart_jours + " j d'écart" : " · même jour"}
                                </p>
                                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", margin: 0 }}>{c.libelle}</p>
                              </div>
                              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <span style={{ color: c.note >= 80 ? "#4caf50" : "rgba(255,255,255,0.45)", fontSize: "12.5px" }}>
                                  {c.note} %
                                </span>
                                <button
                                  onClick={() => agir(p.id, { ecriture_num: c.ecriture_num })}
                                  disabled={occupe !== ""}
                                  style={{ ...BOUTON, background: "#c8a96e", color: "#050508", border: "none", fontWeight: "bold" }}
                                >
                                  {occupe === p.id ? "…" : "Rapprocher"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                      <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "13px", margin: "0 0 8px", lineHeight: "1.7" }}>
                        {p.candidats.length === 0
                          ? "Aucune écriture de ce montant. Créez-la en choisissant sa contrepartie :"
                          : "Ou créez une nouvelle écriture :"}
                        {suggestion ? " (proposé : " + suggestion.compte + " " + suggestion.libelle + ", " + suggestion.confiance + " %)" : ""}
                      </p>

                      <input
                        value={q}
                        onChange={(e) => setRechercheCompte({ ...rechercheCompte, [p.id]: e.target.value })}
                        placeholder="Chercher un compte : 606, 6, fournitures…"
                        style={{ ...CHAMP, marginBottom: "6px" }}
                      />
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", margin: "0 0 8px" }}>
                        {q
                          ? proposes.length + " compte(s) sur " + comptes.length
                          : comptes.length + " compte(s) — tapez un chiffre pour n'avoir qu'une classe"}
                      </p>

                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                        <select
                          value={choixCompte[p.id] || ""}
                          onChange={(e) => setChoixCompte({ ...choixCompte, [p.id]: e.target.value })}
                          style={{ ...CHAMP, flex: "1 1 260px" }}
                        >
                          <option value="">— compte de contrepartie —</option>
                          {proposes.map(function (c: any) {
                            return (
                              <option key={c.numero} value={c.numero}>
                                {c.numero} — {c.libelle}
                              </option>
                            );
                          })}
                        </select>
                        <button
                          onClick={() => creerEcriture(p)}
                          disabled={occupe !== "" || !choixCompte[p.id]}
                          style={{ ...BOUTON, background: !choixCompte[p.id] ? "none" : "#c8a96e", color: !choixCompte[p.id] ? "#c8a96e" : "#050508", border: !choixCompte[p.id] ? BOUTON.border : "none", fontWeight: "bold", padding: "10px 20px" }}
                        >
                          {occupe === p.id ? "…" : "Créer l'écriture"}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => agir(p.id, { action: "ignorer" })}
                      disabled={occupe !== ""}
                      style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "13px", padding: "10px 0 0" }}
                    >
                      Écarter cette ligne
                    </button>
                  </div>
                );
              })
            )}

            <div style={{ ...CARTE, background: "rgba(200,169,110,0.05)", marginTop: "20px" }}>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "13.5px", margin: 0, lineHeight: "1.8" }}>
                Le compte proposé vient des écritures déjà passées sur ce dossier : plus il est
                tenu, plus la proposition tombe juste. Si le compte porte un taux de TVA, la
                ventilation se fait toute seule.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
