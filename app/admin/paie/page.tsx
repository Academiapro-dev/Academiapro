"use client";

// ═══════════════════════════════════════════════════════════════════════
// L ECRAN DE PAIE — 15/09/2026
//
// Trois temps : choisir un contrat, saisir ce qui s est passe ce mois-ci,
// sortir le bulletin.
//
// 🚨 LE CALCUL S AFFICHE AVANT DE GENERER LE PDF. On regarde, on verifie,
// PUIS on sort le document. Un bulletin qu on decouvre en l ouvrant est un
// bulletin qu on corrige apres l avoir remis au salarie.
//
// 🚨 LE BULLETIN SORT EN BROUILLON. Il ne devient « emis » que par un geste
// separe, et ce geste est irreversible. C est la meme regle que le registre
// des mandats : ce qui est sorti est sorti.
//
// ⚠️ LE SALAIRE DE BASE NE SE SAISIT PAS : il se calcule depuis le taux
// horaire du contrat et la duree mensuelle. On ne pose ici QUE ce qui sort
// de l ordinaire — heures supplementaires, primes, absences.
// ═══════════════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";

const OR = "#c8a96e";
const VERT = "#7fc97f";
const ROUGE = "#e57373";
const FOND = "#0b0b10";
const CARTE = "rgba(255,255,255,0.04)";
const BORD = "1px solid rgba(255,255,255,0.10)";

const CADRE: any = {
  background: CARTE, border: BORD, borderRadius: "10px",
  padding: "18px", marginBottom: "18px",
};
const CHAMP: any = {
  width: "100%", padding: "9px 11px", borderRadius: "7px",
  border: "1px solid rgba(255,255,255,0.16)", background: "rgba(0,0,0,0.30)",
  color: "#fff", fontSize: "14px", fontFamily: "Georgia,serif",
  boxSizing: "border-box",
};
const LIB: any = {
  display: "block", fontSize: "12px", color: "rgba(255,255,255,0.55)",
  marginBottom: "4px",
};
const BOUTON: any = {
  padding: "10px 18px", borderRadius: "7px", border: "none",
  background: OR, color: "#0b0b10", fontSize: "14px", fontWeight: "bold",
  fontFamily: "Georgia,serif", cursor: "pointer",
};
const SECOND: any = {
  ...BOUTON, background: "transparent", color: OR,
  border: "1px solid " + OR, fontWeight: "normal",
};

// Les six motifs legaux de recours au travail temporaire.
// 🚨 IL N EN EXISTE PAS D AUTRE (art. L1251-6). « Surcroit de travail »
// n en est pas un : c est « accroissement temporaire d activite ».
const MOTIFS = [
  "Remplacement d'un salarié absent",
  "Accroissement temporaire d'activité",
  "Emploi à caractère saisonnier",
  "Usage constant dans le secteur",
  "Remplacement d'un chef d'entreprise",
  "Complément de formation professionnelle",
];

const TYPES_ELEMENT = [
  { cle: "heures_sup_25", nom: "Heures supplémentaires 25 %", soumis: true },
  { cle: "heures_sup_50", nom: "Heures supplémentaires 50 %", soumis: true },
  { cle: "prime", nom: "Prime", soumis: true },
  { cle: "panier", nom: "Panier repas", soumis: false },
  { cle: "transport", nom: "Transport", soumis: false },
  { cle: "absence_maladie", nom: "Absence maladie", soumis: true },
  { cle: "absence_injustifiee", nom: "Absence injustifiée", soumis: true },
];

function moisCourant(): string {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-01";
}

function euros(n: any): string {
  return Number(n || 0).toLocaleString("fr-FR",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PagePaie() {
  const [secret, setSecret] = useState("");
  const [contrats, setContrats] = useState<any[]>([]);
  const [societes, setSocietes] = useState<any[]>([]);
  const [choisi, setChoisi] = useState<any>(null);
  const [periode, setPeriode] = useState(moisCourant());
  const [elements, setElements] = useState<any[]>([]);
  const [calcul, setCalcul] = useState<any>(null);
  const [bulletins, setBulletins] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [occupe, setOccupe] = useState("");
  const [nouveau, setNouveau] = useState(false);
  const [f, setF] = useState<any>({ type_contrat: "mission", categorie: "non_cadre", duree_hebdo: 35 });
  const [e, setE] = useState<any>({ type_element: "heures_sup_25" });

  // ⚠️ LE SECRET EST DEMANDE UNE FOIS ET GARDE DANS L ONGLET. Il ne part
  // pas en base et disparait a la fermeture.
  useEffect(function () {
    const s = sessionStorage.getItem("paie_secret") || "";
    if (s) { setSecret(s); charger(s); }
  }, []);

  async function appeler(corps: any, s?: string): Promise<any> {
    const cle = s || secret;
    const r = await fetch("/api/paie/dossier?secret=" + encodeURIComponent(cle), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corps),
    });
    return await r.json();
  }

  async function charger(s?: string) {
    setErr(""); setOccupe("charger");
    const d = await appeler({ action: "contrats" }, s);
    if (d.success) {
      setContrats(d.contrats); setSocietes(d.societes);
      if (s) sessionStorage.setItem("paie_secret", s);
    } else setErr(d.erreur || "chargement impossible");
    setOccupe("");
  }

  async function ouvrir(c: any) {
    setChoisi(c); setCalcul(null); setMsg(""); setErr("");
    const d = await appeler({ action: "elements", contrat_id: c.id, periode: periode });
    if (d.success) setElements(d.elements);
    const b = await appeler({ action: "bulletins", contrat_id: c.id });
    if (b.success) setBulletins(b.bulletins);
  }

  async function changerPeriode(p: string) {
    setPeriode(p); setCalcul(null);
    if (!choisi) return;
    const d = await appeler({ action: "elements", contrat_id: choisi.id, periode: p });
    if (d.success) setElements(d.elements);
  }

  async function ajouterElement() {
    setErr(""); setOccupe("element");
    const t = TYPES_ELEMENT.filter(function (x) { return x.cle === e.type_element; })[0];
    const d = await appeler({
      action: "ajouter_element",
      contrat_id: choisi.id, periode: periode,
      type_element: e.type_element,
      libelle: e.libelle || (t ? t.nom : "Élément"),
      quantite: e.quantite, taux: e.taux, montant: e.montant,
      soumis_cotisations: t ? t.soumis : true,
    });
    if (d.success) {
      setE({ type_element: "heures_sup_25" });
      setCalcul(null);
      const l = await appeler({ action: "elements", contrat_id: choisi.id, periode: periode });
      if (l.success) setElements(l.elements);
    } else setErr(d.erreur || "ajout impossible");
    setOccupe("");
  }

  async function retirer(id: string) {
    setOccupe("retirer");
    await appeler({ action: "supprimer_element", id: id });
    setCalcul(null);
    const l = await appeler({ action: "elements", contrat_id: choisi.id, periode: periode });
    if (l.success) setElements(l.elements);
    setOccupe("");
  }

  // 🚨 LE CALCUL S AFFICHE AVANT LE PDF.
  async function calculer() {
    setErr(""); setMsg(""); setOccupe("calcul");
    const r = await fetch("/api/paie/calculer?contrat=" + encodeURIComponent(choisi.id)
      + "&periode=" + encodeURIComponent(periode)
      + "&secret=" + encodeURIComponent(secret));
    const d = await r.json();
    if (d.erreur) setErr(d.erreur); else setCalcul(d);
    setOccupe("");
  }

  async function genererBulletin() {
    setErr(""); setOccupe("bulletin");
    const r = await fetch("/api/paie/bulletin?secret=" + encodeURIComponent(secret), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contrat_id: choisi.id, periode: periode }),
    });
    const d = await r.json();
    if (d.success) {
      setMsg(d.message);
      if (d.url) window.open(d.url, "_blank");
      const b = await appeler({ action: "bulletins", contrat_id: choisi.id });
      if (b.success) setBulletins(b.bulletins);
    } else setErr(d.erreur || "génération impossible");
    setOccupe("");
  }

  async function voir(id: string) {
    const d = await appeler({ action: "voir_bulletin", id: id });
    if (d.success && d.url) window.open(d.url, "_blank");
    else setErr(d.erreur || "ouverture impossible");
  }

  async function emettre(id: string, numero: string) {
    // ⚠️ ON DEMANDE CONFIRMATION : le geste est irreversible.
    if (!confirm("Émettre le bulletin " + numero + " ?\n\n"
      + "Il ne pourra plus être modifié. Une correction se fera par un "
      + "bulletin rectificatif.")) return;
    setOccupe("emettre");
    const d = await appeler({ action: "emettre", id: id });
    if (d.success) {
      setMsg(d.message);
      const b = await appeler({ action: "bulletins", contrat_id: choisi.id });
      if (b.success) setBulletins(b.bulletins);
    } else setErr(d.erreur || "émission impossible");
    setOccupe("");
  }

  async function creer() {
    setErr(""); setOccupe("creer");
    const d = await appeler({ action: "nouveau", ...f });
    if (d.success) {
      setMsg(d.message); setNouveau(false);
      setF({ type_contrat: "mission", categorie: "non_cadre", duree_hebdo: 35 });
      await charger();
    } else setErr(d.erreur || "création impossible");
    setOccupe("");
  }

  // ---- L ECRAN D ENTREE ----
  if (!secret || contrats.length === 0 && !occupe && !err) {
    return (
      <div style={{ background: FOND, minHeight: "100vh", color: "#fff",
        fontFamily: "Georgia,serif", padding: "40px 20px" }}>
        <div style={{ maxWidth: "420px", margin: "60px auto" }}>
          <h1 style={{ color: OR, fontSize: "24px", marginBottom: "6px" }}>Paie</h1>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px",
            lineHeight: "1.6", marginBottom: "22px" }}>
            Bulletins de paie et contrats de mission.
          </p>
          <div style={CADRE}>
            <span style={LIB}>Clé d&apos;accès</span>
            <input type="password" value={secret} style={CHAMP}
              onChange={(ev) => setSecret(ev.target.value)}
              onKeyDown={(ev) => { if (ev.key === "Enter") charger(secret); }} />
            <button onClick={() => charger(secret)} disabled={!secret}
              style={{ ...BOUTON, marginTop: "12px", width: "100%",
                opacity: secret ? 1 : 0.4 }}>
              Ouvrir
            </button>
          </div>
          {err && <p style={{ color: ROUGE, fontSize: "13px" }}>{err}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: FOND, minHeight: "100vh", color: "#fff",
      fontFamily: "Georgia,serif", padding: "30px 20px" }}>
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>

        <h1 style={{ color: OR, fontSize: "26px", marginBottom: "4px" }}>Paie</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px",
          marginBottom: "22px" }}>
          {contrats.length} contrat{contrats.length > 1 ? "s" : ""} en cours
        </p>

        {msg && <p style={{ color: VERT, fontSize: "14px", marginBottom: "14px" }}>{msg}</p>}
        {err && <p style={{ color: ROUGE, fontSize: "14px", marginBottom: "14px" }}>{err}</p>}

        {/* ---- LA LISTE DES CONTRATS ---- */}
        {!choisi && (
          <>
            <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
              <button onClick={() => setNouveau(!nouveau)} style={SECOND}>
                {nouveau ? "Annuler" : "Nouveau salarié"}
              </button>
            </div>

            {nouveau && (
              <div style={CADRE}>
                <h2 style={{ color: OR, fontSize: "17px", marginTop: 0 }}>
                  Un salarié et son contrat
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ flex: "1 1 100%" }}>
                    <span style={LIB}>Société qui emploie</span>
                    <select value={f.societe_id || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, societe_id: ev.target.value })}>
                      <option value="">Choisir…</option>
                      {societes.map(function (s: any) {
                        return <option key={s.id} value={s.id}>{s.raison_sociale}</option>;
                      })}
                    </select>
                  </div>
                  <div style={{ flex: "1 1 180px" }}>
                    <span style={LIB}>Prénom</span>
                    <input value={f.prenom || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, prenom: ev.target.value })} />
                  </div>
                  <div style={{ flex: "1 1 180px" }}>
                    <span style={LIB}>Nom</span>
                    <input value={f.nom || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, nom: ev.target.value })} />
                  </div>
                  <div style={{ flex: "1 1 200px" }}>
                    <span style={LIB}>Numéro de sécurité sociale</span>
                    <input value={f.numero_secu || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, numero_secu: ev.target.value })} />
                  </div>
                  <div style={{ flex: "1 1 160px" }}>
                    <span style={LIB}>Type de contrat</span>
                    <select value={f.type_contrat} style={CHAMP}
                      onChange={(ev) => setF({ ...f, type_contrat: ev.target.value })}>
                      <option value="mission">Contrat de mission</option>
                      <option value="cdd">CDD</option>
                      <option value="cdi">CDI</option>
                    </select>
                  </div>
                  <div style={{ flex: "1 1 140px" }}>
                    <span style={LIB}>Début</span>
                    <input type="date" value={f.date_debut || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, date_debut: ev.target.value })} />
                  </div>
                  <div style={{ flex: "1 1 140px" }}>
                    <span style={LIB}>Fin</span>
                    <input type="date" value={f.date_fin || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, date_fin: ev.target.value })} />
                  </div>
                  <div style={{ flex: "1 1 200px" }}>
                    <span style={LIB}>Poste</span>
                    <input value={f.intitule_poste || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, intitule_poste: ev.target.value })} />
                  </div>
                  <div style={{ flex: "1 1 140px" }}>
                    <span style={LIB}>Taux horaire</span>
                    <input value={f.salaire_horaire || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, salaire_horaire: ev.target.value })} />
                  </div>
                  <div style={{ flex: "1 1 140px" }}>
                    <span style={LIB}>Catégorie</span>
                    <select value={f.categorie} style={CHAMP}
                      onChange={(ev) => setF({ ...f, categorie: ev.target.value })}>
                      <option value="non_cadre">Non cadre</option>
                      <option value="cadre">Cadre</option>
                    </select>
                  </div>
                  <div style={{ flex: "1 1 140px" }}>
                    <span style={LIB}>IDCC</span>
                    <input value={f.idcc || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, idcc: ev.target.value })} />
                  </div>
                </div>

                {/* 🚨 SANS CES DEUX CHAMPS, LE CONTRAT EST REQUALIFIABLE. */}
                {f.type_contrat === "mission" && (
                  <div style={{ marginTop: "14px", paddingTop: "14px",
                    borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.55)",
                      marginTop: 0, lineHeight: "1.6" }}>
                      L&apos;entreprise utilisatrice et le motif de recours sont
                      obligatoires. Sans eux, le contrat peut être requalifié en CDI.
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ flex: "1 1 260px" }}>
                        <span style={LIB}>Entreprise utilisatrice</span>
                        <input value={f.eu_raison_sociale || ""} style={CHAMP}
                          onChange={(ev) => setF({ ...f, eu_raison_sociale: ev.target.value })} />
                      </div>
                      <div style={{ flex: "1 1 180px" }}>
                        <span style={LIB}>Son SIRET</span>
                        <input value={f.eu_siret || ""} style={CHAMP}
                          onChange={(ev) => setF({ ...f, eu_siret: ev.target.value })} />
                      </div>
                      <div style={{ flex: "1 1 100%" }}>
                        <span style={LIB}>Motif de recours</span>
                        <select value={f.motif_recours || ""} style={CHAMP}
                          onChange={(ev) => setF({ ...f, motif_recours: ev.target.value })}>
                          <option value="">Choisir…</option>
                          {MOTIFS.map(function (m) {
                            return <option key={m} value={m}>{m}</option>;
                          })}
                        </select>
                      </div>
                      <div style={{ flex: "1 1 100%" }}>
                        <span style={LIB}>Précision (nom du remplacé, nature du pic…)</span>
                        <input value={f.motif_detail || ""} style={CHAMP}
                          onChange={(ev) => setF({ ...f, motif_detail: ev.target.value })} />
                      </div>
                    </div>
                  </div>
                )}

                <button onClick={creer} disabled={occupe !== ""}
                  style={{ ...BOUTON, marginTop: "16px" }}>
                  {occupe === "creer" ? "…" : "Enregistrer"}
                </button>
              </div>
            )}

            {contrats.map(function (c: any) {
              const s = c.paie_salaries || {};
              return (
                <div key={c.id} style={{ ...CADRE, cursor: "pointer" }}
                  onClick={() => ouvrir(c)}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <strong style={{ fontSize: "16px" }}>
                        {s.prenom} {s.nom}
                      </strong>
                      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px",
                        marginLeft: "10px" }}>
                        {c.intitule_poste}
                      </span>
                    </div>
                    <span style={{ fontSize: "12px", color: OR }}>
                      {c.type_contrat === "mission" ? "Contrat de mission"
                        : c.type_contrat.toUpperCase()}
                    </span>
                  </div>
                  {c.eu_raison_sociale && (
                    <p style={{ margin: "6px 0 0", fontSize: "12.5px",
                      color: "rgba(255,255,255,0.5)" }}>
                      Chez {c.eu_raison_sociale}
                    </p>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* ---- LE DOSSIER D UN CONTRAT ---- */}
        {choisi && (
          <>
            <button onClick={() => { setChoisi(null); setCalcul(null); }}
              style={{ ...SECOND, marginBottom: "16px" }}>
              ← Tous les contrats
            </button>

            <div style={CADRE}>
              <h2 style={{ color: OR, fontSize: "19px", marginTop: 0, marginBottom: "4px" }}>
                {choisi.paie_salaries ? choisi.paie_salaries.prenom + " "
                  + choisi.paie_salaries.nom : ""}
              </h2>
              <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>
                {choisi.intitule_poste}
                {choisi.salaire_horaire ? " · " + euros(choisi.salaire_horaire) + " € de l'heure" : ""}
                {choisi.eu_raison_sociale ? " · chez " + choisi.eu_raison_sociale : ""}
              </p>

              <div style={{ marginTop: "14px", maxWidth: "200px" }}>
                <span style={LIB}>Mois de paie</span>
                <input type="month" value={periode.slice(0, 7)} style={CHAMP}
                  onChange={(ev) => changerPeriode(ev.target.value + "-01")} />
              </div>
            </div>

            {/* ---- LES ELEMENTS DU MOIS ---- */}
            <div style={CADRE}>
              <h3 style={{ color: OR, fontSize: "16px", marginTop: 0 }}>
                Ce qui s&apos;est passé ce mois-ci
              </h3>
              <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.5)",
                lineHeight: "1.6", marginTop: 0 }}>
                Le salaire de base se calcule tout seul depuis le taux horaire.
                N&apos;ajoutez ici que ce qui sort de l&apos;ordinaire.
              </p>

              {elements.length === 0 ? (
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
                  Rien pour l&apos;instant.
                </p>
              ) : elements.map(function (el: any) {
                return (
                  <div key={el.id} style={{ display: "flex",
                    justifyContent: "space-between", alignItems: "center",
                    padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontSize: "13.5px" }}>
                      {el.libelle}
                      {el.soumis_cotisations === false && (
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11.5px",
                          marginLeft: "8px" }}>non soumis</span>
                      )}
                    </span>
                    <span>
                      <span style={{ fontSize: "13.5px", marginRight: "12px" }}>
                        {euros(el.montant)} €
                      </span>
                      <button onClick={() => retirer(el.id)}
                        style={{ background: "none", border: "none", color: ROUGE,
                          cursor: "pointer", fontSize: "12px" }}>
                        retirer
                      </button>
                    </span>
                  </div>
                );
              })}

              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px",
                marginTop: "16px", alignItems: "flex-end" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <span style={LIB}>Nature</span>
                  <select value={e.type_element} style={CHAMP}
                    onChange={(ev) => setE({ ...e, type_element: ev.target.value })}>
                    {TYPES_ELEMENT.map(function (t) {
                      return <option key={t.cle} value={t.cle}>{t.nom}</option>;
                    })}
                  </select>
                </div>
                <div style={{ flex: "0 1 100px" }}>
                  <span style={LIB}>Quantité</span>
                  <input value={e.quantite || ""} style={CHAMP}
                    onChange={(ev) => setE({ ...e, quantite: ev.target.value })} />
                </div>
                <div style={{ flex: "0 1 100px" }}>
                  <span style={LIB}>Taux</span>
                  <input value={e.taux || ""} style={CHAMP}
                    onChange={(ev) => setE({ ...e, taux: ev.target.value })} />
                </div>
                <div style={{ flex: "0 1 110px" }}>
                  <span style={LIB}>ou montant</span>
                  <input value={e.montant || ""} style={CHAMP}
                    onChange={(ev) => setE({ ...e, montant: ev.target.value })} />
                </div>
                <button onClick={ajouterElement} disabled={occupe !== ""} style={SECOND}>
                  Ajouter
                </button>
              </div>
            </div>

            {/* ---- LE CALCUL ---- */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "18px" }}>
              <button onClick={calculer} disabled={occupe !== ""} style={BOUTON}>
                {occupe === "calcul" ? "…" : "Calculer le bulletin"}
              </button>
              {calcul && (
                <button onClick={genererBulletin} disabled={occupe !== ""} style={SECOND}>
                  {occupe === "bulletin" ? "…" : "Sortir le PDF"}
                </button>
              )}
            </div>

            {calcul && (
              <div style={CADRE}>
                <h3 style={{ color: OR, fontSize: "16px", marginTop: 0 }}>
                  Le calcul, avant de sortir le document
                </h3>

                {(calcul.lignes_brut || []).map(function (l: any, i: number) {
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between",
                      padding: "4px 0", fontSize: "13.5px" }}>
                      <span>{l.libelle}</span>
                      <span>{euros(l.montant)} €</span>
                    </div>
                  );
                })}

                {(calcul.lignes_mission || []).map(function (l: any, i: number) {
                  return (
                    <div key={"m" + i} style={{ display: "flex",
                      justifyContent: "space-between", padding: "4px 0", fontSize: "13.5px" }}>
                      <span>{l.libelle}
                        {l.taux ? <span style={{ color: "rgba(255,255,255,0.4)",
                          marginLeft: "8px", fontSize: "12px" }}>
                          {l.taux} % de {euros(l.base)}</span> : null}
                      </span>
                      <span>{euros(l.montant)} €</span>
                    </div>
                  );
                })}

                <div style={{ display: "flex", justifyContent: "space-between",
                  padding: "10px 0", marginTop: "6px", fontWeight: "bold",
                  borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                  <span>Salaire brut</span>
                  <span>{euros(calcul.brut_total)} €</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between",
                  padding: "4px 0", fontSize: "13.5px" }}>
                  <span>Cotisations salariales</span>
                  <span>− {euros(calcul.total_salarial)} €</span>
                </div>

                {calcul.rgdu > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between",
                    padding: "4px 0", fontSize: "13.5px", color: VERT }}>
                    <span>Réduction générale sur les cotisations patronales</span>
                    <span>− {euros(calcul.rgdu)} €</span>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between",
                  padding: "12px 0", marginTop: "8px", fontSize: "17px",
                  fontWeight: "bold", color: OR,
                  borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                  <span>Net à payer</span>
                  <span>{euros(calcul.net_a_payer)} €</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between",
                  fontSize: "12.5px", color: "rgba(255,255,255,0.5)" }}>
                  <span>Montant net social</span>
                  <span>{euros(calcul.net_social)} €</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between",
                  fontSize: "12.5px", color: "rgba(255,255,255,0.5)" }}>
                  <span>Coût total employeur</span>
                  <span>{euros(calcul.cout_employeur)} €</span>
                </div>

                {/* 🚨 LES RESERVES S AFFICHENT. Un calcul qui tait ce qu il ne
                    fait pas est plus dangereux qu un calcul absent. */}
                {(calcul.reserves || []).length > 0 && (
                  <div style={{ marginTop: "16px", paddingTop: "12px",
                    borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <p style={{ fontSize: "12px", color: OR, margin: "0 0 6px" }}>
                      Ce que ce calcul ne fait pas encore
                    </p>
                    {calcul.reserves.map(function (r: string, i: number) {
                      return (
                        <p key={i} style={{ fontSize: "11.5px", lineHeight: "1.6",
                          color: "rgba(255,255,255,0.45)", margin: "0 0 3px" }}>
                          {r}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ---- LES BULLETINS DEJA SORTIS ---- */}
            {bulletins.length > 0 && (
              <div style={CADRE}>
                <h3 style={{ color: OR, fontSize: "16px", marginTop: 0 }}>Bulletins</h3>
                {bulletins.map(function (b: any) {
                  return (
                    <div key={b.id} style={{ display: "flex",
                      justifyContent: "space-between", alignItems: "center",
                      flexWrap: "wrap", gap: "8px", padding: "9px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ fontSize: "13.5px" }}>
                        {b.numero}
                        <span style={{ color: "rgba(255,255,255,0.45)",
                          marginLeft: "10px", fontSize: "12.5px" }}>
                          {String(b.periode).slice(0, 7)}
                        </span>
                        <span style={{ marginLeft: "10px", fontSize: "11.5px",
                          color: b.statut === "emis" ? VERT : OR }}>
                          {b.statut === "emis" ? "émis" : "brouillon"}
                        </span>
                      </span>
                      <span>
                        <span style={{ fontSize: "13.5px", marginRight: "12px" }}>
                          {euros(b.net_a_payer)} €
                        </span>
                        <button onClick={() => voir(b.id)}
                          style={{ background: "none", border: "none", color: OR,
                            cursor: "pointer", fontSize: "12.5px" }}>
                          ouvrir
                        </button>
                        {b.statut !== "emis" && (
                          <button onClick={() => emettre(b.id, b.numero)}
                            style={{ background: "none", border: "none", color: VERT,
                              cursor: "pointer", fontSize: "12.5px", marginLeft: "10px" }}>
                            émettre
                          </button>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
