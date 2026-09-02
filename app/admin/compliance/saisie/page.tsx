"use client";
import { useState, useEffect } from "react";

const JOURNAUX_DEFAUT: any = {
  AC: "Achats",
  VE: "Ventes",
  BQ: "Banque",
  CA: "Caisse",
  OD: "Operations diverses",
  AN: "A nouveaux",
};

// Minuscules, sans accents : « Tresorerie » se trouve en tapant tresorerie.
function sansAccent(s: any): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function PageSaisie() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [dossier, setDossier] = useState("");
  const [comptes, setComptes] = useState<any[]>([]);
  const [d, setD] = useState<any>(null);
  const [chargement, setChargement] = useState(false);
  const [occupe, setOccupe] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const [journal, setJournal] = useState("OD");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [piece, setPiece] = useState("");
  const [libelle, setLibelle] = useState("");
  const [lignes, setLignes] = useState<any[]>([
    { compte: "", libelle: "", debit: "", credit: "" },
    { compte: "", libelle: "", debit: "", credit: "" },
  ]);

  // La recherche vit A COTE des lignes, pas dedans : elle ne doit jamais
  // partir au serveur avec l ecriture.
  const [recherches, setRecherches] = useState<string[]>(["", ""]);

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
    if (dossier) {
      chargerComptes();
      chargerEcritures();
    }
  }, [dossier]);

  async function chargerComptes() {
    try {
      const r = await fetch("/api/compliance/comptes?societe_id=" + dossier);
      const data = await r.json();
      if (data.ok) {
        setComptes((data.comptes || []).filter(function (c: any) { return c.actif !== false; }));
      }
    } catch (e) {}
  }

  async function chargerEcritures() {
    setChargement(true);
    try {
      const r = await fetch("/api/compliance/ecriture?societe_id=" + dossier);
      const data = await r.json();
      if (data.ok) setD(data);
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setChargement(false);
  }

  function poser(i: number, cle: string, v: string) {
    const l = lignes.slice();
    l[i] = { ...l[i], [cle]: v };
    // Un debit et un credit ne coexistent jamais sur une meme ligne.
    if (cle === "debit" && v) l[i].credit = "";
    if (cle === "credit" && v) l[i].debit = "";
    setLignes(l);
  }

  function poserRecherche(i: number, v: string) {
    const r = recherches.slice();
    r[i] = v;
    setRecherches(r);
  }

  function ajouterLigne() {
    setLignes(lignes.concat([{ compte: "", libelle: "", debit: "", credit: "" }]));
    setRecherches(recherches.concat([""]));
  }

  function retirerLigne(i: number) {
    if (lignes.length <= 2) return;
    const l = lignes.slice();
    l.splice(i, 1);
    setLignes(l);
    const r = recherches.slice();
    r.splice(i, 1);
    setRecherches(r);
  }

  // LA RECHERCHE DE COMPTE : un numero, un debut de numero, ou un mot du
  // libelle. Taper 6 ne laisse que les charges. Le compte deja choisi reste
  // toujours propose, sans quoi une ligne en cours se viderait toute seule.
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

  function nombre(v: any) {
    const n = Number(String(v || "").replace(",", "."));
    return isNaN(n) ? 0 : n;
  }

  const totalDebit = lignes.reduce(function (s, l) { return s + nombre(l.debit); }, 0);
  const totalCredit = lignes.reduce(function (s, l) { return s + nombre(l.credit); }, 0);
  const ecart = Math.round((totalDebit - totalCredit) * 100) / 100;
  const equilibre = Math.abs(ecart) < 0.005 && totalDebit > 0;

  const remplies = lignes.filter(function (l) {
    return l.compte && (nombre(l.debit) > 0 || nombre(l.credit) > 0);
  }).length;

  const pret = !!dossier && libelle.trim().length >= 3 && equilibre && remplies >= 2;

  // Les journaux viennent du serveur quand ils sont la, du secours sinon.
  // La liste et son contenu doivent venir de la MEME source, sans quoi la
  // page casse avant meme de s afficher.
  const journaux = d && d.journaux ? d.journaux : JOURNAUX_DEFAUT;

  async function enregistrer() {
    if (!pret) return;
    setOccupe("enr");
    setMessage("");
    setErreur("");
    try {
      const r = await fetch("/api/compliance/ecriture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          societe_id: dossier,
          journal: journal,
          date: date,
          piece_ref: piece,
          libelle: libelle,
          lignes: lignes,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setMessage(data.message);
        setPiece(""); setLibelle("");
        setLignes([
          { compte: "", libelle: "", debit: "", credit: "" },
          { compte: "", libelle: "", debit: "", credit: "" },
        ]);
        setRecherches(["", ""]);
        await chargerEcritures();
      } else {
        setErreur(data.erreur || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setOccupe("");
  }

  const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
  const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
  const CHAMP: any = { width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", marginBottom: "12px" };
  const LIBELLE: any = { display: "block", color: "#c8a96e", fontSize: "13px", marginBottom: "5px" };
  const BOUTON: any = { background: "none", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "8px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px", fontFamily: "Georgia,serif" };

  function euros(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " EUR";
  }

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <a href="/admin/compliance/societes" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>
          ← Retour aux dossiers
        </a>

        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>
          COMPTABILITE
        </p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>Saisie des écritures</h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", marginTop: 0 }}>
          En partie double — le total au débit égale toujours le total au crédit
        </p>

        <div style={{ ...CARTE, marginTop: "24px" }}>
          <span style={LIBELLE}>Dossier</span>
          <select value={dossier} onChange={(e) => setDossier(e.target.value)} style={{ ...CHAMP, marginBottom: 0 }}>
            <option value="">— choisir un dossier —</option>
            {societes.map(function (s) {
              return <option key={s.id} value={s.id}>{s.raison_sociale} ({s.code})</option>;
            })}
          </select>
        </div>

        {message && <p style={{ color: "#4caf50", fontSize: "15px", fontWeight: "bold" }}>{message}</p>}
        {erreur && <p style={{ color: "#e8836a", fontSize: "15px", lineHeight: "1.7" }}>{erreur}</p>}

        {dossier && (
          <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.5)" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 160px" }}>
                <span style={LIBELLE}>Journal</span>
                <select value={journal} onChange={(e) => setJournal(e.target.value)} style={CHAMP}>
                  {Object.keys(journaux).map(function (k) {
                    return <option key={k} value={k}>{k} · {journaux[k]}</option>;
                  })}
                </select>
              </div>
              <div style={{ flex: "1 1 160px" }}>
                <span style={LIBELLE}>Date</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={CHAMP} />
              </div>
              <div style={{ flex: "1 1 160px" }}>
                <span style={LIBELLE}>Pièce de référence</span>
                <input value={piece} onChange={(e) => setPiece(e.target.value)} placeholder="référence du justificatif" style={CHAMP} />
              </div>
            </div>

            <span style={LIBELLE}>Libellé de l'écriture</span>
            <input
              value={libelle}
              onChange={(e) => setLibelle(e.target.value)}
              placeholder="ce que dit la pièce, en clair"
              style={CHAMP}
            />

            <div style={{ marginTop: "8px", marginBottom: "12px" }}>
              {lignes.map(function (l: any, i: number) {
                const q = recherches[i] || "";
                const proposes = comptesProposes(q, l.compte);
                return (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "12px 14px", marginBottom: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                      <span style={{ color: "#c8a96e", fontSize: "13px" }}>Ligne {i + 1}</span>
                      {lignes.length > 2 && (
                        <button
                          onClick={() => retirerLigne(i)}
                          style={{ background: "none", border: "none", color: "#e8836a", cursor: "pointer", fontSize: "13px" }}
                        >
                          Retirer
                        </button>
                      )}
                    </div>

                    <input
                      value={q}
                      onChange={(e) => poserRecherche(i, e.target.value)}
                      placeholder="Chercher un compte : 512, 6, banque..."
                      style={{ ...CHAMP, marginBottom: "6px" }}
                    />
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", margin: "0 0 8px" }}>
                      {q
                        ? proposes.length + " compte(s) sur " + comptes.length
                        : comptes.length + " compte(s) — tapez un chiffre pour n avoir qu une classe"}
                    </p>

                    <select
                      value={l.compte}
                      onChange={(e) => poser(i, "compte", e.target.value)}
                      style={CHAMP}
                    >
                      <option value="">— choisir un compte —</option>
                      {proposes.map(function (c: any) {
                        return (
                          <option key={c.numero} value={c.numero}>
                            {c.numero} — {c.libelle}
                          </option>
                        );
                      })}
                    </select>

                    <input
                      value={l.libelle}
                      onChange={(e) => poser(i, "libelle", e.target.value)}
                      placeholder="libellé propre à la ligne, facultatif"
                      style={CHAMP}
                    />

                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 140px" }}>
                        <span style={LIBELLE}>Débit</span>
                        <input
                          value={l.debit}
                          onChange={(e) => poser(i, "debit", e.target.value)}
                          inputMode="decimal"
                          style={{ ...CHAMP, marginBottom: 0, textAlign: "right" }}
                        />
                      </div>
                      <div style={{ flex: "1 1 140px" }}>
                        <span style={LIBELLE}>Crédit</span>
                        <input
                          value={l.credit}
                          onChange={(e) => poser(i, "credit", e.target.value)}
                          inputMode="decimal"
                          style={{ ...CHAMP, marginBottom: 0, textAlign: "right" }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <button onClick={ajouterLigne} style={BOUTON}>Ajouter une ligne</button>
            </div>

            <div style={{ background: equilibre ? "rgba(76,175,80,0.1)" : "rgba(232,163,61,0.1)", border: "1px solid " + (equilibre ? "rgba(76,175,80,0.4)" : "rgba(232,163,61,0.4)"), borderRadius: "10px", padding: "14px 16px", marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px" }}>
                  Débit {euros(totalDebit)} · Crédit {euros(totalCredit)}
                </span>
                <span style={{ color: equilibre ? "#4caf50" : "#e8a33d", fontSize: "14px", fontWeight: "bold" }}>
                  {equilibre ? "Équilibré" : "Écart de " + euros(Math.abs(ecart))}
                </span>
              </div>
            </div>

            <button
              onClick={enregistrer}
              disabled={occupe !== "" || !pret}
              style={{ background: occupe !== "" || !pret ? "rgba(200,169,110,0.3)" : "#c8a96e", color: occupe !== "" || !pret ? "#8a8a8a" : "#050508", padding: "15px 30px", borderRadius: "8px", border: "none", cursor: occupe !== "" || !pret ? "default" : "pointer", fontWeight: "bold", fontSize: "16px", fontFamily: "Georgia,serif", width: "100%" }}
            >
              {occupe === "enr" ? "Enregistrement..." : "Enregistrer l'écriture"}
            </button>

            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", margin: "12px 0 0", lineHeight: "1.7" }}>
              Le bouton reste inerte tant que le debit n egale pas le credit. Le numero
              d ecriture se fabrique tout seul, par journal et par annee, sans trou.
            </p>
          </div>
        )}

        {dossier && (
          <>
            <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "26px 0 14px" }}>
              Dernieres ecritures
            </h2>

            {chargement ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>Lecture...</p>
              </div>
            ) : !d || !d.ecritures || d.ecritures.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: "15px" }}>
                  Aucune ecriture sur ce dossier.
                </p>
              </div>
            ) : (
              d.ecritures.map(function (e: any) {
                return (
                  <div key={e.ecriture_num} style={{ ...CARTE, border: e.equilibree ? CARTE.border : "1px solid rgba(232,131,106,0.5)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <div>
                        <p style={{ color: "#c8a96e", fontSize: "12.5px", margin: "0 0 3px" }}>
                          {e.ecriture_num} · {e.journal_code}
                          {e.piece_ref ? " · " + e.piece_ref : ""}
                          {e.manuelle ? " · saisie manuelle" : " · automatique"}
                          {e.verrouillee ? " · verrouillee" : ""}
                        </p>
                        <h3 style={{ color: "#fff", fontSize: "15.5px", margin: 0 }}>{e.libelle}</h3>
                      </div>
                      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
                        {new Date(e.ecriture_date).toLocaleDateString("fr-FR")}
                      </span>
                    </div>

                    <div style={{ marginTop: "10px" }}>
                      {e.lignes.map(function (l: any, i: number) {
                        return (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr 1fr", padding: "6px 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none", fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>
                            <span style={{ fontFamily: "monospace", color: "#c8a96e" }}>{l.compte_num}</span>
                            <span style={{ color: "rgba(255,255,255,0.55)" }}>{l.compte_lib}</span>
                            <span style={{ textAlign: "right" }}>
                              {Number(l.debit) > 0 ? euros(l.debit) : ""}
                            </span>
                            <span style={{ textAlign: "right" }}>
                              {Number(l.credit) > 0 ? euros(l.credit) : ""}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <p style={{ color: e.equilibree ? "#4caf50" : "#e8836a", fontSize: "12.5px", margin: "10px 0 0" }}>
                      {e.equilibree
                        ? "Équilibrée · " + euros(e.debit)
                        : "DÉSÉQUILIBRÉE · débit " + euros(e.debit) + " crédit " + euros(e.credit)}
                    </p>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}
