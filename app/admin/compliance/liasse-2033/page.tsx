"use client";
import { useState, useEffect } from "react";

export default function PageLiasse2033() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [ouvert, setOuvert] = useState<any>({});

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
      const r = await fetch("/api/compliance/liasse-2033?societe_id=" + dossier);
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
  const CHAMP: any = { width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box" };
  const LIBELLE: any = { display: "block", color: "#c8a96e", fontSize: "13px", marginBottom: "5px" };

  function euros(n: any) {
    const v = Number(n) || 0;
    if (v === 0) return "";
    return v.toLocaleString("fr-FR", { minimumFractionDigits: 2 });
  }

  function Bloc({ titre, lignes, total, libelleTotal }: any) {
    return (
      <div style={{ marginBottom: "18px" }}>
        <h2 style={{ color: "#c8a96e", fontSize: "16px", margin: "0 0 10px" }}>{titre}</h2>
        <div style={{ border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", overflow: "hidden" }}>
          {lignes.map(function (c: any) {
            const estOuvert = ouvert[c.code] === true;
            return (
              <div key={c.code}>
                <div
                  onClick={() => c.comptes.length > 0 && setOuvert({ ...ouvert, [c.code]: !estOuvert })}
                  style={{ display: "grid", gridTemplateColumns: "0.6fr 2.6fr 1fr", padding: "11px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "13.5px", color: "rgba(255,255,255,0.8)", cursor: c.comptes.length > 0 ? "pointer" : "default", background: c.montant !== 0 ? "transparent" : "rgba(255,255,255,0.01)" }}
                >
                  <span style={{ fontFamily: "monospace", color: "#c8a96e" }}>{c.code}</span>
                  <span style={{ color: c.montant !== 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)" }}>
                    {c.libelle}
                    {c.comptes.length > 0 ? <span style={{ color: "rgba(255,255,255,0.3)" }}> · {c.comptes.length}</span> : null}
                  </span>
                  <span style={{ textAlign: "right", color: c.montant !== 0 ? "#fff" : "rgba(255,255,255,0.25)" }}>
                    {euros(c.montant) || "—"}
                  </span>
                </div>

                {estOuvert && c.comptes.map(function (x: any, i: number) {
                  return (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "0.6fr 2.6fr 1fr", padding: "7px 14px 7px 30px", background: "rgba(200,169,110,0.06)", fontSize: "12.5px", color: "rgba(255,255,255,0.6)" }}>
                      <span style={{ fontFamily: "monospace" }}>{x.compte}</span>
                      <span>{x.libelle}</span>
                      <span style={{ textAlign: "right" }}>{euros(x.montant)}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {libelleTotal && (
            <div style={{ display: "grid", gridTemplateColumns: "0.6fr 2.6fr 1fr", padding: "13px 14px", borderTop: "1px solid rgba(200,169,110,0.35)", background: "rgba(200,169,110,0.12)", fontSize: "14px", color: "#c8a96e", fontWeight: "bold" }}>
              <span></span>
              <span>{libelleTotal}</span>
              <span style={{ textAlign: "right" }}>{euros(total) || "0,00"}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <a href="/admin/compliance/societes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux dossiers
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Liasse 2033</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          Le bilan et le compte de resultat, case par case
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

        {erreur && <p style={{ color: "#e8836a", fontSize: "15px" }}>{erreur}</p>}

        {chargement ? (
          <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Ventilation en cours...</p></div>
        ) : !d ? null : (
          <>
            <div style={{ ...CARTE, border: "2px solid " + (d.pret_pour_edi ? "rgba(76,175,80,0.5)" : "rgba(232,163,61,0.5)") }}>
              <p style={{ color: "#c8a96e", fontSize: "12.5px", margin: "0 0 6px" }}>
                {d.dossier.raison_sociale}
                {d.dossier.siren ? " · SIREN " + d.dossier.siren : " · SIREN manquant"} · exercice du{" "}
                {new Date(d.periode.debut).toLocaleDateString("fr-FR")} au{" "}
                {new Date(d.periode.fin).toLocaleDateString("fr-FR")}
              </p>
              <p style={{ color: d.pret_pour_edi ? "#4caf50" : "#e8a33d", fontSize: "17px", fontWeight: "bold", margin: "0 0 10px" }}>
                {d.pret_pour_edi ? "Liasse coherente" : "La liasse ne tombe pas juste"}
              </p>
              {d.controles.map(function (c: any, i: number) {
                return (
                  <p key={i} style={{ color: c.ok ? "rgba(255,255,255,0.6)" : "#e8836a", fontSize: "13.5px", margin: "0 0 4px", lineHeight: "1.7" }}>
                    {c.ok ? "· " : "✕ "}{c.nom} — {c.detail}
                  </p>
                );
              })}
            </div>

            {d.orphelins.length > 0 && (
              <div style={{ ...CARTE, border: "1px solid rgba(232,131,106,0.5)" }}>
                <p style={{ color: "#e8836a", fontSize: "15px", fontWeight: "bold", margin: "0 0 10px" }}>
                  {d.orphelins.length} compte(s) ne rentrent dans aucune case
                </p>
                {d.orphelins.map(function (o: any, i: number) {
                  return (
                    <p key={i} style={{ color: "rgba(255,255,255,0.7)", fontSize: "13.5px", margin: "0 0 4px" }}>
                      <span style={{ fontFamily: "monospace", color: "#c8a96e" }}>{o.compte}</span>{" "}
                      {o.libelle} · {euros(o.solde)}
                    </p>
                  );
                })}
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "10px 0 0", lineHeight: "1.7" }}>
                  Leur montant n apparait dans aucun total : la liasse serait fausse.
                </p>
              </div>
            )}

            <h2 style={{ color: "#fff", fontSize: "19px", margin: "24px 0 12px" }}>
              2033-A · Bilan simplifie
            </h2>
            <Bloc titre="Actif" lignes={d.formulaire_2033_a.actif} total={d.formulaire_2033_a.total_actif} libelleTotal="TOTAL ACTIF NET" />
            <Bloc titre="Passif" lignes={d.formulaire_2033_a.passif} total={d.formulaire_2033_a.total_passif} libelleTotal="TOTAL PASSIF" />

            <h2 style={{ color: "#fff", fontSize: "19px", margin: "24px 0 12px" }}>
              2033-B · Compte de resultat simplifie
            </h2>
            <Bloc titre="Produits et charges" lignes={d.formulaire_2033_b.lignes} total={d.formulaire_2033_b.resultat} libelleTotal="RESULTAT DE L EXERCICE" />

            <div style={{ ...CARTE, background: "rgba(232,163,61,0.06)", border: "1px solid rgba(232,163,61,0.35)" }}>
              <p style={{ color: "#e8a33d", fontSize: "14px", margin: 0, lineHeight: "1.8" }}>
                {d.avertissement}
              </p>
            </div>

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "14px 0 0", lineHeight: "1.7" }}>
              Touchez une case pour voir les comptes qui l alimentent. C est cette tracabilite
              qui permet de justifier un chiffre devant un controleur.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
