"use client";
import { useState, useEffect } from "react";

// ══════════════════════════════════════════════════════════════════════════
// LA CREATION D UNE SOCIETE — L ECRAN — 09/10/2026 (Mr Comptable, lot A).
//
// Un dossier, des etapes dans l ordre, une seule « prochaine etape » a la
// fois. La lettre de depart se signe avant tout ; chaque etape du
// questionnaire se valide par « Je valide » ; les statuts se relisent puis
// partent a la signature par la chaine existante (document-a-signer).
//
// ⚠️ CET ECRAN NE DECIDE DE RIEN : c est la route (/api/compliance/
// creation-societe) qui refuse une reponse avant la lettre signee, une etape
// avant la precedente, des statuts avant les cinq validations.
// ⛔ AUCUNE LISTE N EST REMPLIE D AVANCE : chaque choix est celui du client.
// ⚠️ A NE PAS CONFONDRE avec /admin/compliance/creation (la LLC americaine
// de MysterLLC).
// ══════════════════════════════════════════════════════════════════════════

// 10/10/2026 — Sous « Forme de la société », l aide enchaine les cinq
// explications (EURL, SARL, SASU, SAS, SCI) en un seul bloc. On la coupe a
// chaque forme pour en afficher une par ligne. Toute autre aide reste telle
// quelle, et si la coupe ne tombe pas juste on rend le texte entier.
function lignesAide(qn: any): string[] {
  const texte = String(qn.aide || "");
  if (qn.code !== "forme" || !Array.isArray(qn.options)) return [texte];
  const coupes: number[] = [];
  qn.options.forEach(function (o: any) {
    const i = texte.indexOf(String(o[0]) + " : ");
    if (i === 0 || (i > 0 && texte.charAt(i - 1) === " ")) coupes.push(i);
  });
  coupes.sort(function (a, b) { return a - b; });
  if (coupes.length < 2 || coupes[0] !== 0) return [texte];
  const lignes: string[] = [];
  for (let k = 0; k < coupes.length; k++) {
    const morceau = texte.slice(coupes[k], k + 1 < coupes.length ? coupes[k + 1] : texte.length).trim();
    if (morceau) lignes.push(morceau);
  }
  return lignes;
}

const CADRE: any = { minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", padding: "40px 20px" };
const CARTE: any = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(200,169,110,0.25)", borderRadius: "12px", padding: "20px 24px", marginBottom: "16px" };
const CHAMP: any = { width: "100%", padding: "11px 13px", borderRadius: "8px", border: "1px solid rgba(200,169,110,0.3)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", fontFamily: "Georgia,serif", boxSizing: "border-box", minWidth: 0 };
const LIBELLE: any = { display: "block", color: "#c8a96e", fontSize: "13.5px", marginBottom: "5px", lineHeight: "1.4" };
const AIDE: any = { color: "rgba(255,255,255,0.72)", fontSize: "13px", lineHeight: "1.55", margin: "6px 0 0" };
const BOUTON: any = { background: "#c8a96e", color: "#050508", border: "none", padding: "13px 26px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "15px", fontFamily: "Georgia,serif" };
const SECOND: any = { background: "rgba(200,169,110,0.12)", border: "1px solid rgba(200,169,110,0.55)", color: "#c8a96e", padding: "11px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px", fontFamily: "Georgia,serif" };
const PETIT: any = { background: "rgba(200,169,110,0.12)", border: "1px solid rgba(200,169,110,0.45)", color: "#c8a96e", padding: "7px 14px", borderRadius: "20px", cursor: "pointer", fontWeight: "bold", fontSize: "13px", fontFamily: "Georgia,serif" };
const VERT = "#4caf50";
const ROUGE = "#e8836a";
const ORANGE = "#e8a33d";

function t(v: any): string { return v === null || v === undefined ? "" : String(v).trim(); }

// MEME REGLE QUE lib/statuts-modeles (fonction visible) : une condition est
// une liste de [chemin, valeurs] ; un chemin sans point se lit dans la ligne
// (ou dans l etape), « societe.forme » dans une autre etape.
function visible(q: any, r: any, section: string, ligne: any): boolean {
  const conditions: any[] = q.si || [];
  for (const c of conditions) {
    const chemin = String(c[0]);
    let valeur: any;
    if (chemin.indexOf(".") > 0) { const m = chemin.split("."); valeur = r && r[m[0]] ? r[m[0]][m[1]] : undefined; }
    else if (ligne) valeur = ligne[chemin];
    else valeur = r && r[section] ? r[section][chemin] : undefined;
    if (c[1].indexOf(t(valeur)) < 0) return false;
  }
  return true;
}

function dateHeure(v: any): string {
  if (!v) return "";
  const d = new Date(v);
  return d.toLocaleDateString("fr-FR") + " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

const ACTIONS: any = {
  ouverture: "Dossier ouvert", lettre_envoyee: "Lettre de départ envoyée", lettre_signee: "Lettre de départ signée",
  reponses: "Réponses enregistrées", validation: "Étape validée", hors_cadre: "Sortie du cadre",
  statuts_envoyes: "Statuts envoyés à la signature", statuts_retires: "Questionnaire rouvert", statuts_signes: "Statuts signés", arret: "Dossier arrêté",
};

export default function PageCreationSociete() {
  const [q, setQ] = useState<any>(null);
  const [cabinet, setCabinet] = useState<string | null>(null);
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [d, setD] = useState<any>(null);
  const [saisie, setSaisie] = useState<any>({});
  const [ouverte, setOuverte] = useState("");
  const [neuf, setNeuf] = useState<any>({ nom_projet: "", client_nom: "", client_email: "", mandataire_nom: "" });
  const [apercu, setApercu] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [erreurs, setErreurs] = useState<string[]>([]);
  const [occupe, setOccupe] = useState("");
  const [chargement, setChargement] = useState(true);
  const [voirJournal, setVoirJournal] = useState(false);

  useEffect(function () {
    (async function () {
      await chargerListe();
      const p = new URLSearchParams(window.location.search).get("id");
      if (p) await ouvrirDossier(p);
      setChargement(false);
    })();
  }, []);

  // Quand l etape change, la nouvelle vient sous les yeux.
  const etapeVue = d ? d.dossier.id + ":" + d.etape : "";
  useEffect(function () {
    if (!d) return;
    const bloc = document.getElementById("etape-" + d.etape);
    if (bloc && bloc.scrollIntoView) bloc.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [etapeVue]);

  function dire(bon: string, mauvais: string, liste?: string[]) { setMessage(bon); setErreur(mauvais); setErreurs(liste || []); }

  async function chargerListe() {
    try {
      const r = await fetch("/api/compliance/creation-societe");
      const data = await r.json();
      if (data.ok) { setQ(data.questionnaire); setCabinet(data.cabinet); setDossiers(data.dossiers || []); }
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) { setErreur("Lecture impossible : " + String(e)); }
  }

  // Ce que la route rend devient l etat de l ecran : la saisie repart
  // toujours de ce qui est REELLEMENT range.
  function poser(data: any) {
    setD(data);
    setSaisie(JSON.parse(JSON.stringify((data.dossier && data.dossier.reponses) || {})));
    setOuverte(["societe", "capital", "associes", "direction", "clauses"].indexOf(data.etape) >= 0 ? data.etape : "");
  }

  async function ouvrirDossier(id: string) {
    dire("", "");
    setApercu(null);
    try {
      const r = await fetch("/api/compliance/creation-societe?id=" + encodeURIComponent(id));
      const data = await r.json();
      if (data.ok) { poser(data); window.history.replaceState(null, "", "?id=" + id); }
      else setErreur(data.erreur || "Lecture impossible.");
    } catch (e: any) { setErreur("Lecture impossible : " + String(e)); }
  }

  async function retourListe() {
    setD(null); setApercu(null); dire("", "");
    window.history.replaceState(null, "", window.location.pathname);
    await chargerListe();
  }

  // Le bouton reste sur « … » jusqu au resultat, et le message n arrive
  // qu avec l ecran a jour.
  async function agir(nom: string, corps: any, apres?: (data: any) => void): Promise<any> {
    setOccupe(nom);
    dire("", "");
    let data: any = null;
    try {
      const r = await fetch("/api/compliance/creation-societe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
      data = await r.json();
      if (data.dossier) poser(data);
      if (data.ok) { if (apres) apres(data); dire(data.message || "", ""); }
      else dire("", data.erreur || "Erreur inconnue.", data.erreurs || []);
    } catch (e: any) { dire("", "Erreur : " + String(e)); }
    setOccupe("");
    return data;
  }

  async function envoyerASigner(quoi: "lettre" | "statuts") {
    if (!apercu || !apercu.document_a_signer || !d) return;
    setOccupe("envoyer");
    dire("", "");
    try {
      const r1 = await fetch("/api/compliance/document-a-signer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(apercu.document_a_signer) });
      const d1 = await r1.json();
      if (!d1.success || !d1.reference) { dire("", "Le document n'a pas pu être créé : " + (d1.error || "cause inconnue") + " Rien n'a été envoyé."); setOccupe(""); return; }
      const r2 = await fetch("/api/compliance/creation-societe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: quoi + "_lier", id: d.dossier.id, reference: d1.reference }) });
      const d2 = await r2.json();
      if (!d2.ok) { dire("", "Document " + d1.reference + " créé, mais non rattaché au dossier : " + (d2.erreur || "cause inconnue")); setOccupe(""); return; }
      poser(d2);
      setApercu(null);
      const em = d1.email || {};
      const qui = apercu.document_a_signer.signataire_email;
      if (em.envoye === true) dire((quoi === "lettre" ? "Lettre de départ" : "Statuts") + " envoyés à " + qui + " pour signature (" + d1.reference + ").", "");
      else dire("", "ATTENTION : le document " + d1.reference + " est créé, mais le courriel n'est pas parti (" + (em.raison || "cause inconnue") + "). Donnez ce lien au signataire : " + (d1.lien || ""));
    } catch (e: any) { dire("", "Erreur : " + String(e)); }
    setOccupe("");
  }

  // ───────────────────────────────────────────────── la saisie d une etape
  function reponsesCourantes(): any { return { ...((d && d.dossier.reponses) || {}), ...saisie }; }
  function forme(): any {
    const code = t((saisie.societe || {}).forme) || t(d && d.dossier.reponses && d.dossier.reponses.societe && d.dossier.reponses.societe.forme);
    return ((q && q.formes) || []).find(function (f: any) { return f.code === code; }) || null;
  }
  function changer(section: string, code: string, v: any) { setSaisie({ ...saisie, [section]: { ...(saisie[section] || {}), [code]: v } }); }
  function lignesDe(section: string, groupe: any): any[] {
    const l = (saisie[section] || {})[groupe.code];
    const f = forme();
    const min = !f ? 1 : section === "direction" ? 1 : f.associes_min;
    const liste: any[] = Array.isArray(l) ? l.slice() : [];
    while (liste.length < min) liste.push({});
    return liste;
  }
  function maxLignes(section: string): number { const f = forme(); return !f ? 1 : section === "direction" ? f.dirigeants_max : f.associes_max; }
  function minLignes(section: string): number { const f = forme(); return !f ? 1 : section === "direction" ? 1 : f.associes_min; }
  function changerLigne(section: string, groupe: any, i: number, code: string, v: any) {
    const liste = lignesDe(section, groupe);
    liste[i] = { ...(liste[i] || {}), [code]: v };
    changer(section, groupe.code, liste);
  }
  function ajouterLigne(section: string, groupe: any) { const liste = lignesDe(section, groupe); liste.push({}); changer(section, groupe.code, liste); }
  function retirerLigne(section: string, groupe: any, i: number) { const liste = lignesDe(section, groupe); liste.splice(i, 1); changer(section, groupe.code, liste); }
  function aEnvoyer(section: string, s: any): any {
    const propre: any = { ...(saisie[section] || {}) };
    if (s.groupe) propre[s.groupe.code] = lignesDe(section, s.groupe);
    return propre;
  }

  function champ(qn: any, valeur: any, poserValeur: (v: any) => void, cle: string) {
    const v = valeur === null || valeur === undefined ? "" : String(valeur);
    const large = qn.type === "zone" || qn.type === "liste" || qn.type === "associe_ou_tiers" || (qn.libelle || "").length > 60;
    let saisieChamp: any = null;
    if (qn.type === "liste" || qn.type === "associe_ou_tiers") {
      let options: any[] = qn.options || [];
      if (qn.type === "associe_ou_tiers") {
        const associes: any[] = (reponsesCourantes().associes || {}).liste || [];
        options = associes.map(function (a: any, i: number) { return ["a" + i, "L'associé " + (i + 1) + " — " + (t(a.prenom) + " " + t(a.nom).toUpperCase()).trim()]; }).concat([["tiers", "Une autre personne, qui n'est pas associée"]]);
      }
      saisieChamp = (
        <select value={v} onChange={(e: any) => poserValeur(e.target.value)} style={CHAMP}>
          <option value="">— choisir —</option>
          {options.map(function (o: any) { return <option key={o[0]} value={o[0]}>{o[1]}</option>; })}
        </select>
      );
    } else if (qn.type === "zone") {
      saisieChamp = <textarea value={v} onChange={(e: any) => poserValeur(e.target.value)} rows={4} placeholder={qn.exemple || ""} style={CHAMP} />;
    } else if (qn.type === "date") {
      saisieChamp = <input type="date" className="mc-date" value={v} onChange={(e: any) => poserValeur(e.target.value)} style={CHAMP} />;
    } else {
      saisieChamp = <input value={v} onChange={(e: any) => poserValeur(e.target.value)} placeholder={qn.exemple || ""} inputMode={qn.type === "nombre" ? "numeric" : qn.type === "courriel" ? "email" : "text"} autoCapitalize={qn.type === "courriel" ? "none" : undefined} style={CHAMP} />;
    }
    return (
      <div key={cle} style={{ flex: large ? "1 1 100%" : "1 1 220px", minWidth: 0, marginBottom: "14px" }}>
        <span style={LIBELLE}>{qn.libelle}</span>
        {saisieChamp}
        {qn.aide && lignesAide(qn).map(function (ligne, i) { return <p key={i} style={AIDE}>{ligne}</p>; })}
      </div>
    );
  }

  function formulaire(s: any) {
    const r = reponsesCourantes();
    const valeurs = saisie[s.code] || {};
    const f = forme();
    const verrou = !!(d.dossier.statuts_reference || d.dossier.statuts_signes_le || d.dossier.statut === "abandonne");
    const lignes = s.groupe ? lignesDe(s.code, s.groupe) : [];
    const attendForme = s.code !== "societe" && !f;
    return (
      <div>
        <p style={{ ...AIDE, margin: "0 0 16px" }}>{s.intro}</p>
        <div style={{ display: "flex", gap: "0 14px", flexWrap: "wrap" }}>
          {s.questions.filter(function (qn: any) { return visible(qn, r, s.code, null); }).map(function (qn: any, i: number) {
            return champ(qn, valeurs[qn.code], function (v) { changer(s.code, qn.code, v); }, s.code + "-" + qn.code + "-" + i);
          })}
        </div>
        {s.groupe && !attendForme && lignes.map(function (l: any, i: number) {
          return (
            <div key={s.code + "-ligne-" + i} style={{ border: "1px solid rgba(200,169,110,0.3)", borderRadius: "10px", padding: "16px 18px", marginBottom: "14px", background: "rgba(200,169,110,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <strong style={{ color: "#fff", fontSize: "15px" }}>{s.groupe.titre} {lignes.length > 1 || maxLignes(s.code) > 1 ? i + 1 : ""}</strong>
                {lignes.length > minLignes(s.code) && !verrou && <button onClick={() => retirerLigne(s.code, s.groupe, i)} style={PETIT}>Retirer</button>}
              </div>
              <div style={{ display: "flex", gap: "0 14px", flexWrap: "wrap" }}>
                {s.groupe.questions.filter(function (qn: any) { return visible(qn, r, s.code, l); }).map(function (qn: any, j: number) {
                  return champ(qn, l[qn.code], function (v) { changerLigne(s.code, s.groupe, i, qn.code, v); }, s.code + "-" + i + "-" + qn.code + "-" + j);
                })}
              </div>
            </div>
          );
        })}
        {s.groupe && !attendForme && lignes.length < maxLignes(s.code) && !verrou && (
          <p style={{ margin: "0 0 16px" }}><button onClick={() => ajouterLigne(s.code, s.groupe)} style={PETIT}>+ {s.groupe.ajouter}</button></p>
        )}
        {verrou ? (
          <p style={{ ...AIDE, color: ORANGE }}>Les statuts sont partis à la signature : ces réponses ne se modifient plus. Pour corriger, rouvrez le questionnaire depuis l&apos;étape « Les statuts ».</p>
        ) : (
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginTop: "6px" }}>
            <button onClick={() => agir("valider-" + s.code, { action: "valider", id: d.dossier.id, section: s.code, reponses: aEnvoyer(s.code, s) })} disabled={occupe !== ""} style={{ ...BOUTON, background: VERT, color: "#fff" }}>
              {occupe === "valider-" + s.code ? "…" : "Je valide"}
            </button>
            <button onClick={() => agir("enregistrer-" + s.code, { action: "enregistrer", id: d.dossier.id, section: s.code, reponses: aEnvoyer(s.code, s) })} disabled={occupe !== ""} style={SECOND}>
              {occupe === "enregistrer-" + s.code ? "…" : "Enregistrer sans valider"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ───────────────────────────────────────────────────────── les etapes
  function prochaine(): string {
    if (!d) return "";
    const x = d.dossier;
    if (x.statut === "abandonne") return "Ce dossier est arrêté. Rien n'a été déposé.";
    if (x.hors_cadre) return x.hors_cadre;
    if (d.etape === "lettre") return x.lettre_reference ? "La lettre de départ attend la signature de " + x.client_email + ". Rien ne commence avant." : "Préparez la lettre de départ et envoyez-la à signer à " + x.client_email + ".";
    if (d.etape === "statuts") return x.statuts_reference ? "Les statuts attendent leur signature." : "Les cinq étapes sont validées : préparez les statuts, relisez-les, puis envoyez-les à signer.";
    if (d.etape === "depot_capital") return "Les statuts sont signés. Les étapes suivantes (dépôt du capital, annonce légale, envoi au guichet unique) s'ouvriront ici.";
    const e = (d.etapes || []).find(function (y: any) { return y.code === d.etape; });
    return "Répondez à l'étape « " + (e ? e.nom : d.etape) + " », puis touchez « Je valide ».";
  }

  function carteLettre() {
    const x = d.dossier;
    if (x.lettre_signee_le) return <p style={{ color: VERT, fontSize: "15px", margin: 0 }}>✓ Signée le {dateHeure(x.lettre_signee_le)} par {x.client_email} · {x.lettre_reference}</p>;
    return (
      <div>
        <p style={{ ...AIDE, margin: "0 0 14px" }}>
          Une seule lettre, signée avant tout : les engagements du client, les étapes qu&apos;il validera une à une, et la procuration donnée au cabinet, représenté notamment par {x.mandataire_nom}, pour les formalités. Sans elle, rien ne commence.
        </p>
        {x.lettre_reference && (
          <div style={{ marginBottom: "14px" }}>
            <p style={{ color: ORANGE, fontSize: "15px", margin: "0 0 10px" }}>Envoyée le {dateHeure(x.lettre_envoyee_le)} à {x.client_email} · {x.lettre_reference} · en attente de signature</p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button onClick={() => ouvrirDossier(x.id)} disabled={occupe !== ""} style={BOUTON}>Vérifier la signature</button>
              <a href={"/compliance/signature/" + encodeURIComponent(x.lettre_reference)} style={{ ...SECOND, textDecoration: "none", display: "inline-block" }}>Ouvrir le document à signer</a>
            </div>
          </div>
        )}
        {!apercu && x.statut !== "abandonne" && (
          <button onClick={() => agir("lettre", { action: "lettre_preparer", id: x.id }, function (data) { setApercu({ ...data, quoi: "lettre" }); })} disabled={occupe !== ""} style={x.lettre_reference ? SECOND : BOUTON}>
            {occupe === "lettre" ? "…" : x.lettre_reference ? "Préparer une nouvelle lettre" : "Préparer la lettre de départ"}
          </button>
        )}
      </div>
    );
  }

  function carteStatuts() {
    const x = d.dossier;
    if (x.statuts_signes_le) return <p style={{ color: VERT, fontSize: "15px", margin: 0 }}>✓ Signés le {dateHeure(x.statuts_signes_le)} · {x.statuts_reference}</p>;
    if (d.etape !== "statuts") return <p style={{ ...AIDE, margin: 0 }}>Cette étape s&apos;ouvre quand les cinq étapes du questionnaire sont validées.</p>;
    return (
      <div>
        {x.statuts_reference && (
          <div style={{ marginBottom: "14px" }}>
            <p style={{ color: ORANGE, fontSize: "15px", margin: "0 0 10px" }}>Envoyés le {dateHeure(x.statuts_envoyes_le)} · {x.statuts_reference} · en attente de signature</p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button onClick={() => ouvrirDossier(x.id)} disabled={occupe !== ""} style={BOUTON}>Vérifier la signature</button>
              <a href={"/compliance/signature/" + encodeURIComponent(x.statuts_reference)} style={{ ...SECOND, textDecoration: "none", display: "inline-block" }}>Ouvrir le document à signer</a>
              <button onClick={() => { if (window.confirm("Rouvrir le questionnaire ? Le document déjà envoyé ne devra plus être signé : après correction, les statuts seront renvoyés.")) agir("rouvrir", { action: "rouvrir", id: x.id }); }} disabled={occupe !== ""} style={SECOND}>
                {occupe === "rouvrir" ? "…" : "Rouvrir le questionnaire"}
              </button>
            </div>
          </div>
        )}
        {!x.statuts_reference && !apercu && (
          <button onClick={() => agir("statuts", { action: "statuts_preparer", id: x.id }, function (data) { setApercu({ ...data, quoi: "statuts" }); })} disabled={occupe !== ""} style={BOUTON}>
            {occupe === "statuts" ? "…" : "Préparer les statuts"}
          </button>
        )}
      </div>
    );
  }

  function carteApercu() {
    if (!apercu) return null;
    const doc = apercu.document_a_signer;
    return (
      <div style={{ ...CARTE, border: "2px solid #c8a96e", marginTop: "18px", marginBottom: 0 }}>
        <h3 style={{ color: "#c8a96e", fontSize: "17px", margin: "0 0 4px" }}>Relisez avant d&apos;envoyer</h3>
        <p style={{ color: "#fff", fontSize: "15px", margin: "0 0 14px" }}>{apercu.titre}</p>
        <pre style={{ whiteSpace: "pre-wrap", color: "rgba(255,255,255,0.88)", fontSize: "14px", lineHeight: "1.7", fontFamily: "Georgia,serif", margin: "0 0 16px", background: "rgba(0,0,0,0.35)", borderRadius: "8px", padding: "16px 18px" }}>
          {apercu.corps}
        </pre>
        {apercu.avis && <p style={{ color: ORANGE, fontSize: "15px", lineHeight: "1.6", margin: "0 0 14px" }}>{apercu.avis}</p>}
        {apercu.signataires && apercu.signataires.length > 1 && (
          <p style={{ ...AIDE, margin: "0 0 14px" }}>Signataires : {apercu.signataires.map(function (s: any) { return s.nom + " (" + s.email + ")"; }).join(" · ")}</p>
        )}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          {doc && (
            <button onClick={() => envoyerASigner(apercu.quoi)} disabled={occupe !== ""} style={BOUTON}>
              {occupe === "envoyer" ? "…" : "Envoyer à signer à " + doc.signataire_email}
            </button>
          )}
          <button onClick={() => setApercu(null)} disabled={occupe !== ""} style={SECOND}>Fermer</button>
        </div>
        {doc && <p style={AIDE}>Le signataire reçoit un lien, lit le document en entier et signe avec un code reçu par courriel.</p>}
      </div>
    );
  }

  // CE QUE L ECRAN REPOND A UN GESTE S AFFICHE LA OU LE GESTE A ETE FAIT :
  // dans l etape en cours, sous ses boutons. En haut de page, sur un long
  // formulaire, personne ne le verrait.
  function cibleRetour(): string {
    if (ouverte) return ouverte;
    return d.etape === "lettre" ? "lettre" : "statuts";
  }

  function retour() {
    if (!message && !erreur && erreurs.length === 0) return null;
    return (
      <div style={{ marginTop: "16px" }}>
        {message && <p style={{ color: VERT, fontSize: "15px", lineHeight: "1.55", margin: "0 0 8px" }}>{message}</p>}
        {erreur && <p style={{ color: ROUGE, fontSize: "15px", lineHeight: "1.55", wordBreak: "break-word", margin: "0 0 8px" }}>{erreur}</p>}
        {erreurs.length > 0 && (
          <ul style={{ color: ROUGE, fontSize: "14.5px", lineHeight: "1.6", margin: 0, paddingLeft: "22px" }}>
            {erreurs.map(function (x, i) { return <li key={i}>{x}</li>; })}
          </ul>
        )}
      </div>
    );
  }

  function carteEtape(e: any, i: number) {
    const s = ((q && q.sections) || []).find(function (y: any) { return y.code === e.code; });
    const v = s ? d.validations[e.code] : null;
    const enCours = e.etat === "en_cours";
    const faite = e.etat === "faite";
    const plusTard = e.lot !== "A";
    const depliee = s ? ouverte === e.code : e.code === "lettre" || e.code === "statuts";
    const couleur = faite ? VERT : enCours ? "#c8a96e" : "rgba(255,255,255,0.25)";
    if (plusTard) {
      return (
        <div key={e.code} style={{ display: "flex", gap: "12px", alignItems: "baseline", padding: "8px 24px", color: "rgba(255,255,255,0.72)", fontSize: "14px" }}>
          <span style={{ color: "rgba(255,255,255,0.5)", minWidth: "22px" }}>{i + 1}.</span>
          <span><strong style={{ color: "rgba(255,255,255,0.85)" }}>{e.nom}</strong> — {e.detail}</span>
        </div>
      );
    }
    return (
      <div key={e.code} id={"etape-" + e.code} style={{ ...CARTE, borderLeft: "4px solid " + couleur, scrollMarginTop: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <span style={{ color: couleur, fontSize: "13px", fontWeight: "bold", letterSpacing: "1px" }}>ÉTAPE {i + 1}{faite ? " · FAITE" : enCours ? " · EN COURS" : ""}</span>
            <h2 style={{ color: "#fff", fontSize: "19px", margin: "4px 0 2px" }}>{e.nom}</h2>
            <p style={{ ...AIDE, margin: 0 }}>{e.detail}</p>
            {v && <p style={{ color: VERT, fontSize: "13.5px", margin: "6px 0 0" }}>✓ Validée le {dateHeure(v.le)} par {v.par}</p>}
          </div>
          {s && (faite || enCours) && (
            <button onClick={() => setOuverte(depliee ? "" : e.code)} style={PETIT}>{depliee ? "Replier" : faite ? "Revoir ou modifier" : "Ouvrir"}</button>
          )}
        </div>
        {s && !faite && !enCours && <p style={{ ...AIDE, marginTop: "10px" }}>Cette étape s&apos;ouvre quand la précédente est validée.</p>}
        {depliee && (
          <div style={{ marginTop: "18px" }}>
            {s && faite && !d.dossier.statuts_reference && <p style={{ color: ORANGE, fontSize: "13.5px", lineHeight: "1.55", margin: "0 0 14px" }}>Modifier une réponse défait la validation de cette étape et de toutes celles qui suivent : il faudra les valider de nouveau.</p>}
            {e.code === "lettre" ? carteLettre() : e.code === "statuts" ? carteStatuts() : formulaire(s)}
            {enCours && carteApercu()}
          </div>
        )}
        {e.code === cibleRetour() && retour()}
      </div>
    );
  }

  const nouveauPret = t(neuf.nom_projet) && t(neuf.client_nom) && t(neuf.client_email) && t(neuf.mandataire_nom);

  return (
    <div style={CADRE}>
      <style>{`
        .mc-date { -webkit-appearance: none; appearance: none; min-width: 0; min-height: 41px; display: block; color-scheme: dark; }
        .mc-date::-webkit-date-and-time-value { text-align: left; margin: 0; }
        select option { color: #111; }
      `}</style>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {d ? (
          <button onClick={retourListe} style={{ background: "none", border: "none", color: "#c8a96e", fontSize: "14px", cursor: "pointer", padding: 0, fontFamily: "Georgia,serif" }}>← Tous les dossiers de création</button>
        ) : (
          <a href="/admin/compliance/tableau-de-bord" style={{ color: "#c8a96e", fontSize: "14px", textDecoration: "none" }}>← Tableau de bord</a>
        )}
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "22px 0 8px" }}>LE CABINET</p>
        <h1 style={{ color: "#fff", fontSize: "29px", margin: "0 0 6px" }}>{d ? d.dossier.nom_projet : "Création de société"}</h1>
        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "14.5px", marginTop: 0 }}>
          {d ? (d.dossier.forme ? d.dossier.forme + " · " : "") + "Client : " + d.dossier.client_nom + " (" + d.dossier.client_email + ") · Mandataire : " + d.dossier.mandataire_nom
            : "EURL, SARL, SASU, SAS, SCI — de la lettre de départ aux statuts signés, une étape après l'autre"}
        </p>

        {chargement && <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.72)", margin: 0 }}>Chargement…</p></div>}

        {d && (
          <div style={{ ...CARTE, background: d.dossier.hors_cadre || d.dossier.statut === "abandonne" ? "rgba(232,131,106,0.12)" : "rgba(200,169,110,0.12)", border: "1px solid " + (d.dossier.hors_cadre || d.dossier.statut === "abandonne" ? ROUGE : "#c8a96e"), marginTop: "20px" }}>
            <span style={{ color: d.dossier.hors_cadre || d.dossier.statut === "abandonne" ? ROUGE : "#c8a96e", fontSize: "12px", fontWeight: "bold", letterSpacing: "2px" }}>{d.dossier.hors_cadre ? "PARCOURS ARRÊTÉ" : "PROCHAINE ÉTAPE"}</span>
            <p style={{ color: "#fff", fontSize: "16px", lineHeight: "1.55", margin: "6px 0 0" }}>{prochaine()}</p>
          </div>
        )}

        {!d && retour()}

        {!chargement && !d && q && (
          <>
            {!cabinet && (
              <div style={{ ...CARTE, border: "1px solid " + ORANGE, marginTop: "18px" }}>
                <p style={{ color: ORANGE, fontSize: "15px", lineHeight: "1.55", margin: "0 0 10px" }}>La lettre de départ nomme votre cabinet. Renseignez-le d&apos;abord dans « Mon cabinet ».</p>
                <a href="/admin/compliance/ma-societe" style={{ ...SECOND, textDecoration: "none", display: "inline-block" }}>Ouvrir « Mon cabinet »</a>
              </div>
            )}
            <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "26px 0 12px" }}>Nouveau dossier</h2>
            <div style={CARTE}>
              <div style={{ display: "flex", gap: "0 14px", flexWrap: "wrap" }}>
                {champ({ libelle: "Nom du projet (le nom envisagé pour la société)", type: "texte", exemple: "ex. : Atelier Horizon" }, neuf.nom_projet, function (v) { setNeuf({ ...neuf, nom_projet: v }); }, "n1")}
                {champ({ libelle: "Client : prénom et nom", type: "texte", exemple: "ex. : Claire Durand" }, neuf.client_nom, function (v) { setNeuf({ ...neuf, client_nom: v }); }, "n2")}
                {champ({ libelle: "Client : adresse de courriel", type: "courriel", exemple: "ex. : claire.durand@exemple.fr", aide: "C'est à cette adresse que part la lettre de départ à signer." }, neuf.client_email, function (v) { setNeuf({ ...neuf, client_email: v }); }, "n3")}
                {champ({ libelle: "Mandataire : prénom et nom", type: "texte", exemple: "ex. : Jacques Lalou", aide: "La personne qui déposera le dossier au guichet unique. La lettre de départ donne procuration au cabinet et nomme cette personne." }, neuf.mandataire_nom, function (v) { setNeuf({ ...neuf, mandataire_nom: v }); }, "n4")}
              </div>
              <button onClick={() => agir("ouvrir", { action: "ouvrir", ...neuf }, function (data) { setNeuf({ nom_projet: "", client_nom: "", client_email: "", mandataire_nom: "" }); if (data.dossier) window.history.replaceState(null, "", "?id=" + data.dossier.id); })} disabled={occupe !== "" || !nouveauPret} style={{ ...BOUTON, opacity: nouveauPret ? 1 : 0.5 }}>
                {occupe === "ouvrir" ? "…" : "Ouvrir le dossier"}
              </button>
            </div>

            <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "26px 0 12px" }}>Dossiers de création</h2>
            {dossiers.length === 0 ? (
              <div style={CARTE}><p style={{ color: "rgba(255,255,255,0.72)", margin: 0 }}>Aucun dossier de création pour l&apos;instant.</p></div>
            ) : dossiers.map(function (x: any) {
              const couleur = x.statut === "abandonne" || x.hors_cadre ? ROUGE : x.etape === "depot_capital" ? VERT : ORANGE;
              return (
                <div key={x.id} style={{ ...CARTE, borderLeft: "4px solid " + couleur, display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <strong style={{ color: "#fff", fontSize: "16px" }}>{x.nom_projet}</strong>
                    <span style={{ color: "rgba(255,255,255,0.72)", fontSize: "14px" }}>{x.forme ? " · " + x.forme : ""} · {x.client_nom}</span>
                    <p style={{ color: couleur, fontSize: "13.5px", fontWeight: "bold", margin: "5px 0 0" }}>
                      {x.statut === "abandonne" ? "Arrêté" : x.hors_cadre ? "Hors cadre — parcours arrêté" : x.etape === "depot_capital" ? "Statuts signés" : "Étape en cours : " + x.etape_nom}
                      <span style={{ color: "rgba(255,255,255,0.6)", fontWeight: "normal" }}> · ouvert le {new Date(x.cree_le).toLocaleDateString("fr-FR")}</span>
                    </p>
                  </div>
                  <button onClick={() => ouvrirDossier(x.id)} style={SECOND}>Ouvrir</button>
                </div>
              );
            })}
          </>
        )}

        {d && q && (
          <>
            {d.etapes.map(function (e: any, i: number) { return carteEtape(e, i); })}

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "22px" }}>
              <button onClick={() => setVoirJournal(!voirJournal)} style={PETIT}>{voirJournal ? "Masquer le journal" : "Journal du dossier"}</button>
              {d.dossier.statut !== "abandonne" && !d.dossier.statuts_signes_le && (
                <button onClick={() => { if (window.confirm("Arrêter ce dossier ? Il ne pourra plus être modifié. Rien n'a été déposé.")) agir("arret", { action: "abandonner", id: d.dossier.id }); }} disabled={occupe !== ""} style={{ ...PETIT, color: ROUGE, borderColor: ROUGE, background: "rgba(232,131,106,0.1)" }}>
                  {occupe === "arret" ? "…" : "Arrêter ce dossier"}
                </button>
              )}
            </div>
            {voirJournal && (
              <div style={{ ...CARTE, marginTop: "14px" }}>
                <p style={{ ...AIDE, margin: "0 0 10px" }}>Chaque réponse, chaque validation et chaque signature, avec sa date. Les plus récentes d&apos;abord.</p>
                {d.journal.map(function (j: any, i: number) {
                  const s = ((q.sections || []).find(function (y: any) { return y.code === j.section; }) || {}).titre;
                  return <p key={i} style={{ color: "rgba(255,255,255,0.85)", fontSize: "13.5px", margin: "0 0 5px" }}>{dateHeure(j.le)} · {ACTIONS[j.action] || j.action}{s ? " — " + s : ""}{j.par && j.par !== "signature" ? " · " + j.par : ""}</p>;
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
