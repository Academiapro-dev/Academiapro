"use client";

// ═══════════════════════════════════════════════════════════════════════
// L ECRAN DE PAIE — 15/09/2026, corrige le 16/09
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
// 🚨 UN SEUL BULLETIN PAR CONTRAT ET PAR MOIS (decision de Jacques,
// 16/09). Recalculer REECRIT le brouillon du mois ; si le mois est deja
// emis, le bouton ouvre un RECTIFICATIF qui annulera le precedent.
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
  // ⚠️ LES CONGES NE CONCERNENT QUE LE CDI : sur une mission ou un CDD ils
  // sont compenses par l ICCP, et ce bloc reste invisible.
  const [conges, setConges] = useState<any>(null);
  const [joursPris, setJoursPris] = useState("");

  // ⚠️ LES SIGNALEMENTS CONCERNENT TOUS LES CONTRATS, pas seulement le CDI :
  // un interimaire tombe malade comme un autre, et toute mission finit.
  const [evenements, setEvenements] = useState<any>(null);
  const [ev, setEv] = useState<any>({
    type_evenement: "arret", motif: "", date_debut: "", date_fin: "",
    dernier_jour_travaille: "", subrogation: false, iban: "", bic: "",
    date_notification: "", dernier_jour_paye: "",
  });
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
    setConges(null); setJoursPris("");
    setEvenements(null);
    const d = await appeler({ action: "elements", contrat_id: c.id, periode: periode });
    if (d.success) setElements(d.elements);
    const b = await appeler({ action: "bulletins", contrat_id: c.id });
    if (b.success) setBulletins(b.bulletins);
    // ⚠️ SEUL LE CDI A UN COMPTEUR : inutile d interroger la base pour les
    // autres, et le bloc resterait vide a l ecran.
    if (c.type_contrat === "cdi") chargerConges(c.id);
    chargerEvenements(c.id);
  }

  async function changerPeriode(p: string) {
    setPeriode(p); setCalcul(null); setMsg("");
    if (!choisi) return;
    const d = await appeler({ action: "elements", contrat_id: choisi.id, periode: p });
    if (d.success) setElements(d.elements);
  }

  // 🆕 16/09 — LE TAUX MAJORE SE CALCULE TOUT SEUL.
  //
  // 🚨 DOCTRINE : ne jamais faire taper a la main ce que l application sait
  // calculer. Une heure supplementaire a 25 % vaut le taux horaire du
  // contrat majore d un quart — la machine connait les deux.
  // ⚠️ UN TAUX SAISI L EMPORTE TOUJOURS : certaines conventions majorent
  // autrement, et c est alors une negociation, pas un calcul.
  function tauxMajore(): number | null {
    if (!choisi || !choisi.salaire_horaire) return null;
    const base = Number(choisi.salaire_horaire);
    if (e.type_element === "heures_sup_25") return Math.round(base * 1.25 * 10000) / 10000;
    if (e.type_element === "heures_sup_50") return Math.round(base * 1.5 * 10000) / 10000;
    return null;
  }

  async function ajouterElement() {
    setErr(""); setOccupe("element");
    const t = TYPES_ELEMENT.filter(function (x) { return x.cle === e.type_element; })[0];

    // ⚠️ ON NE CALCULE QUE SI LE CHAMP EST VIDE.
    let taux = e.taux;
    if (!taux && !e.montant) {
      const auto = tauxMajore();
      if (auto !== null) taux = String(auto);
    }

    const d = await appeler({
      action: "ajouter_element",
      contrat_id: choisi.id, periode: periode,
      type_element: e.type_element,
      libelle: e.libelle || (t ? t.nom : "Élément"),
      quantite: e.quantite, taux: taux, montant: e.montant,
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
    setErr(""); setOccupe("retirer");
    const d = await appeler({ action: "supprimer_element", id: id });
    if (!d.success) setErr(d.erreur || "suppression impossible");
    setCalcul(null);
    const l = await appeler({ action: "elements", contrat_id: choisi.id, periode: periode });
    if (l.success) setElements(l.elements);
    setOccupe("");
  }

  // 🚨 LE CALCUL S AFFICHE AVANT LE PDF.
  // ⚠️ IL NE CREE RIEN : ni bulletin, ni rectificatif. Sinon chaque clic
  // fabriquerait un document de plus — le defaut du 16/09.
  async function calculer() {
    setErr(""); setMsg(""); setOccupe("calcul");
    const r = await fetch("/api/paie/calculer?contrat=" + encodeURIComponent(choisi.id)
      + "&periode=" + encodeURIComponent(periode)
      + "&secret=" + encodeURIComponent(secret));
    const d = await r.json();
    if (d.erreur) setErr(d.erreur); else setCalcul(d);
    setOccupe("");
  }

  // 🆕 16/09 — CE QUI EXISTE DEJA POUR LE MOIS AFFICHE, pour que le bouton
  // annonce ce qu il va faire AVANT d etre clique. Un bouton qui dit
  // « Sortir le PDF » alors qu il ouvre un rectificatif est un piege.
  const duMois = bulletins.filter(function (b: any) {
    return String(b.periode).slice(0, 7) === periode.slice(0, 7);
  });
  const brouillonDuMois = duMois.filter(function (b: any) {
    return b.statut === "brouillon";
  })[0] || null;
  const emisDuMois = duMois.filter(function (b: any) {
    return b.statut === "emis";
  })[0] || null;

  async function genererBulletin() {
    // ⚠️ ON PREVIENT AVANT D OUVRIR UN RECTIFICATIF : ce n est pas le meme
    // geste que sortir un premier bulletin, et il annulera un document deja
    // remis au salarie.
    if (!brouillonDuMois && emisDuMois) {
      if (!confirm("Le bulletin " + emisDuMois.numero + " de ce mois est déjà émis.\n\n"
        + "Un bulletin RECTIFICATIF va être ouvert. Il annulera et remplacera le "
        + emisDuMois.numero + " au moment de son émission.\n\nContinuer ?")) return;
    }
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

  async function chargerEvenements(id: string) {
    const d = await appeler({ action: "evenements", contrat_id: id });
    if (d && d.success) setEvenements(d);
  }

  async function ajouterEvenement() {
    if (!ev.motif || !ev.date_debut) {
      setErr("Le motif et la date de début sont obligatoires."); return;
    }
    setOccupe("evenement");
    const d = await appeler(Object.assign({
      action: "ajouter_evenement", contrat_id: choisi.id,
    }, ev));
    setOccupe("");
    if (!d) return;
    if (d.erreur) { setErr(d.erreur); return; }
    setMsg(d.message);
    setEv({
      type_evenement: "arret", motif: "", date_debut: "", date_fin: "",
      dernier_jour_travaille: "", subrogation: false, iban: "", bic: "",
      date_notification: "", dernier_jour_paye: "",
    });
    chargerEvenements(choisi.id);
  }

  async function genererSignalement(id: string) {
    setOccupe("signalement");
    let d: any = null;
    try {
      const r = await fetch("/api/dsn/evenement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cle: secret, evenement_id: id }),
      });
      d = await r.json();
    } catch (e: any) { setErr(String(e)); }
    setOccupe("");
    if (!d) return;
    if (d.erreur) { setErr(d.erreur); return; }
    setMsg(d.message + " — " + d.nom_fichier + " (" + d.lignes + " lignes)");
    // ⚠️ LES ANOMALIES PASSENT EN ERREUR, pas en message : un signalement
    // avec anomalie ne doit pas ressembler a un succes.
    if (d.anomalies && d.anomalies.length > 0) setErr(d.anomalies.join(" · "));
    chargerEvenements(id && choisi ? choisi.id : id);
  }

  async function retirerEvenement(id: string) {
    if (!confirm("Retirer ce signalement ?")) return;
    setOccupe("evenement");
    const d = await appeler({ action: "supprimer_evenement", id: id });
    setOccupe("");
    if (d && d.success) { setMsg(d.message); chargerEvenements(choisi.id); }
    else if (d && d.erreur) setErr(d.erreur);
  }

  async function chargerConges(id: string) {
    const d = await appeler({ action: "conges", contrat_id: id });
    if (d && d.success) setConges(d);
  }

  async function poserConges() {
    const j = Number(String(joursPris).replace(",", "."));
    if (!(j > 0)) { setErr("Indiquez un nombre de jours supérieur à zéro."); return; }

    setOccupe("conges");
    const d = await appeler({
      action: "poser_conges",
      contrat_id: choisi.id,
      // 🚨 LA PERIODE PORTE DEJA SON JOUR : moisCourant() rend « 2026-09-01 ».
      // Y ajouter « -01 » donnait « 2026-09-01-01 », que Postgres refuse.
      // ⚠️ TOUTES LES AUTRES ACTIONS L ENVOIENT TELLE QUELLE — il suffisait
      // de regarder comment elles font plutot que de supposer.
      periode: periode,
      jours: j,
    });
    setOccupe("");
    if (!d) return;
    if (d.erreur) { setErr(d.erreur); return; }
    setMsg(d.message);
    setJoursPris("");
    chargerConges(choisi.id);
  }

  async function retirerPrise(id: string) {
    if (!confirm("Retirer cette prise de congés ?")) return;
    setOccupe("conges");
    const d = await appeler({ action: "supprimer_conges", id: id });
    setOccupe("");
    if (d && d.success) { setMsg(d.message); chargerConges(choisi.id); }
    else if (d && d.erreur) setErr(d.erreur);
  }

  async function emettre(b: any) {
    // ⚠️ ON DEMANDE CONFIRMATION : le geste est irreversible.
    const avertissement = b.type_bulletin === "rectificatif" && b.rectifie_numero
      ? "Émettre le bulletin rectificatif " + b.numero + " ?\n\n"
        + "Il ANNULERA définitivement le bulletin " + b.rectifie_numero + "."
      : "Émettre le bulletin " + b.numero + " ?\n\n"
        + "Il ne pourra plus être modifié. Une correction se fera par un "
        + "bulletin rectificatif.";
    if (!confirm(avertissement)) return;

    setOccupe("emettre");
    const d = await appeler({ action: "emettre", id: b.id });
    if (d.success) {
      setMsg(d.message);
      const l = await appeler({ action: "bulletins", contrat_id: choisi.id });
      if (l.success) setBulletins(l.bulletins);
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
                    {/* 🚨 LA CLE EST CONTROLEE A L ENREGISTREMENT. Un numero
                        dont la cle est fausse fait REJETER la DSN entiere. */}
                    <span style={LIB}>Numéro de sécurité sociale (15 chiffres, clé comprise)</span>
                    <input value={f.numero_secu || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, numero_secu: ev.target.value })} />
                  </div>

                  {/* ═══════════════════════════════════════════════════
                      🆕🚨 16/09 — LES CHAMPS QUE LA DSN EXIGE ET QUE CET
                      ECRAN N AVAIT PAS.

                      Le premier fichier DSN est sorti sans date de
                      naissance ni adresse : rubriques OBLIGATOIRES, rejet
                      assure. La route les acceptait depuis le debut, mais
                      l ecran ne les demandait pas — on ne pouvait donc PAS
                      saisir ce que la declaration reclame.
                      ⚠️ LA LECON : un champ absent de l ecran n existe pas,
                      meme si la base et la route le prevoient.
                      ═══════════════════════════════════════════════════ */}
                  <div style={{ flex: "1 1 160px" }}>
                    <span style={LIB}>Date de naissance (obligatoire en DSN)</span>
                    <input type="date" value={f.date_naissance || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, date_naissance: ev.target.value })} />
                  </div>
                  <div style={{ flex: "0 1 130px" }}>
                    {/* ⚠️ LE SEXE SE DEDUIT DU PREMIER CHIFFRE DU NUMERO DE
                        SECURITE SOCIALE (1 homme, 2 femme). Le champ n est
                        la que pour les cas ou les deux different. */}
                    <span style={LIB}>Sexe</span>
                    <select value={f.sexe || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, sexe: ev.target.value })}>
                      <option value="">Depuis le n° sécu</option>
                      <option value="M">Homme</option>
                      <option value="F">Femme</option>
                    </select>
                  </div>
                  <div style={{ flex: "1 1 240px" }}>
                    <span style={LIB}>Adresse (obligatoire en DSN)</span>
                    <input value={f.adresse || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, adresse: ev.target.value })} />
                  </div>
                  <div style={{ flex: "0 1 120px" }}>
                    <span style={LIB}>Code postal</span>
                    <input value={f.code_postal || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, code_postal: ev.target.value })} />
                  </div>
                  <div style={{ flex: "1 1 160px" }}>
                    <span style={LIB}>Ville</span>
                    <input value={f.ville || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, ville: ev.target.value })} />
                  </div>
                  <div style={{ flex: "1 1 200px" }}>
                    <span style={LIB}>Lieu de naissance</span>
                    <input value={f.lieu_naissance || ""} style={CHAMP}
                      onChange={(ev) => setF({ ...f, lieu_naissance: ev.target.value })} />
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
                  <div style={{ flex: "0 1 150px" }}>
                    {/* 🚨 LE CODE PCS-ESE EST UNE RUBRIQUE OBLIGATOIRE DE LA
                        DSN (S21.G00.40.004). Il decrit le METIER selon la
                        nomenclature INSEE, independamment du nom qu on donne
                        au poste : « cariste » et « agent logistique » peuvent
                        etre le meme PCS-ESE.
                        ⚠️ IL EST SENSIBLE A LA CASSE : « 653a », pas « 653A ».
                        C est l une des deux seules rubriques de la norme dans
                        ce cas. */}
                    <span style={LIB}>Code PCS-ESE (INSEE, ex. 653a)</span>
                    <input value={f.pcs_ese || ""} style={CHAMP}
                      placeholder="653a"
                      onChange={(ev) => setF({ ...f, pcs_ese: ev.target.value })} />
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

              {/* 🆕 16/09 — CE QUI EXISTE DEJA POUR CE MOIS SE VOIT ICI,
                  avant tout clic. Un seul bulletin par mois : autant dire
                  tout de suite lequel c est. */}
              {emisDuMois && (
                <p style={{ margin: "12px 0 0", fontSize: "12.5px", color: VERT,
                  lineHeight: "1.6" }}>
                  Le bulletin {emisDuMois.numero} de ce mois est déjà émis. Les
                  éléments ne peuvent plus être modifiés — une correction passe
                  par un bulletin rectificatif.
                </p>
              )}
              {brouillonDuMois && (
                <p style={{ margin: "12px 0 0", fontSize: "12.5px", color: OR,
                  lineHeight: "1.6" }}>
                  Un brouillon existe pour ce mois ({brouillonDuMois.numero}) :
                  le recalcul le remplacera.
                </p>
              )}
            </div>

            {/* ---- LES ELEMENTS DU MOIS ---- */}
            <div style={CADRE}>
              <h3 style={{ color: OR, fontSize: "16px", marginTop: 0 }}>
                Ce qui s&apos;est passé ce mois-ci
              </h3>
              <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.5)",
                lineHeight: "1.6", marginTop: 0 }}>
                {/* 🚨 LE TEXTE SUIT LE CONTRAT. Il annoncait « depuis le taux
                    horaire » a un salarie paye au mois : celui qui lit croit
                    devoir saisir des heures, et se demande ou. Un CDI se paie
                    au mois, une mission a l heure — l ecran doit dire lequel. */}
                Le salaire de base se calcule tout seul depuis {choisi && Number(choisi.salaire_mensuel) > 0
                  ? "le salaire mensuel du contrat"
                  : "le taux horaire"}.
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
                <div style={{ flex: "0 1 130px" }}>
                  {/* ⚠️ L ETIQUETTE DIT CE QUE VAUDRA LE CHAMP LAISSE VIDE :
                      un calcul invisible inquiete plus qu il ne soulage. */}
                  <span style={LIB}>
                    Taux
                    {tauxMajore() !== null && !e.taux && (
                      <span style={{ color: OR }}> · {tauxMajore()}</span>
                    )}
                  </span>
                  <input value={e.taux || ""} style={CHAMP}
                    placeholder={tauxMajore() !== null ? String(tauxMajore()) : ""}
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
                  {occupe === "bulletin" ? "…"
                    : (!brouillonDuMois && emisDuMois) ? "Ouvrir un rectificatif"
                    : brouillonDuMois ? "Refaire le PDF du brouillon"
                    : "Sortir le PDF"}
                </button>
              )}
            </div>

            {/* ═══════════════════════════════════════════════════════════
                🚨 UN BULLETIN SORTI N EST PAS UN BULLETIN EMIS.
                Defaut trouve a l essai du CDI le 16/09 : le bulletin porte
                un numero, il est imprime, il est remis — et il reste
                MODIFIABLE. Rien a l ecran ne disait qu une etape restait.
                ⚠️ CE QUI EN DEPEND : l acquisition des conges payes se pose
                A L EMISSION. Un bulletin qui reste en brouillon ne donne
                aucun jour au salarie, et personne ne s en apercoit avant
                qu il les reclame.
                ═══════════════════════════════════════════════════════════ */}
            {brouillonDuMois && (
              <div style={{ marginTop: "14px", padding: "12px 14px",
                border: "1px solid rgba(212,175,110,0.35)", borderRadius: "8px",
                background: "rgba(212,175,110,0.06)", fontSize: "13px",
                lineHeight: 1.55 }}>
                <strong style={{ color: OR }}>Ce bulletin est encore un brouillon.</strong>
                {" "}Il peut être recalculé autant que nécessaire. Tant qu&apos;il
                n&apos;est pas émis, il ne compte pas dans la DSN et
                {choisi && choisi.type_contrat === "cdi"
                  ? " aucun jour de congé n'est acquis."
                  : " il n'est pas définitif."}
                <button onClick={() => emettre(brouillonDuMois)}
                  disabled={occupe !== ""}
                  style={{ marginLeft: "12px", background: "none",
                    border: "1px solid " + VERT, color: VERT, borderRadius: "6px",
                    padding: "5px 12px", cursor: "pointer", fontSize: "12.5px" }}>
                  {occupe === "emettre" ? "…" : "Émettre ce bulletin"}
                </button>
              </div>
            )}

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

                {/* 🚨🚨 LA REDUCTION PATRONALE N EST PLUS ICI — 16/09.
                    DEFAUT TROUVE A L ESSAI : elle etait affichee entre les
                    cotisations salariales et le net a payer, comme si elle
                    entrait dans le calcul du net. Un salarie qui soustrayait
                    les deux lignes du brut trouvait 1 360,66 EUR au lieu de
                    1 995,24. Elle appartient au bloc employeur, et a lui
                    seul : elle diminue le cout de l entreprise, jamais le
                    net du salarie. */}

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
                  <span>Net imposable</span>
                  <span>{euros(calcul.net_imposable)} €</span>
                </div>

                {/* ---- CE QUE PAIE L EMPLOYEUR, A PART ---- */}
                <div style={{ marginTop: "16px", paddingTop: "12px",
                  borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                  <p style={{ fontSize: "12px", color: OR, margin: "0 0 6px" }}>
                    Côté employeur
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    padding: "3px 0", fontSize: "13px" }}>
                    <span>Cotisations patronales</span>
                    <span>{euros(calcul.total_patronal)} €</span>
                  </div>
                  {calcul.rgdu > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between",
                      padding: "3px 0", fontSize: "13px", color: VERT }}>
                      <span>Réduction générale dégressive unique
                        {calcul.rgdu_detail && calcul.rgdu_detail.coefficient ? (
                          <span style={{ color: "rgba(255,255,255,0.4)",
                            marginLeft: "8px", fontSize: "11.5px" }}>
                            coef. {calcul.rgdu_detail.coefficient}
                          </span>
                        ) : null}
                      </span>
                      <span>− {euros(calcul.rgdu)} €</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between",
                    padding: "6px 0 0", fontSize: "14px", fontWeight: "bold",
                    borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "6px" }}>
                    <span>Coût total employeur</span>
                    <span>{euros(calcul.cout_employeur)} €</span>
                  </div>
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

            {/* ═══════════════════════════════════════════════════════
                ══ LES CONGES PAYES ══
                🚨 LE COMPTEUR NE SAVAIT QU ACQUERIR. Un salarie qui pose
                une semaine n avait aucun endroit ou etre saisi : le solde
                montait indefiniment et le bulletin annoncait des droits
                deja consommes.
                ⚠️ LA VALORISATION EST AFFICHEE EN ENTIER — maintien,
                dixieme, et celle qui est retenue. La loi impose de retenir
                la plus favorable (art. L3141-24) ; montrer les deux permet
                au cabinet de le verifier plutot que de nous croire.
                ═══════════════════════════════════════════════════════ */}
            {choisi && choisi.type_contrat === "cdi" && conges && (
              <div style={CADRE}>
                <h3 style={{ color: OR, fontSize: "16px", marginTop: 0 }}>
                  Congés payés
                </h3>

                {conges.solde ? (
                  <p style={{ fontSize: "14px", marginTop: 0 }}>
                    Période ouverte le {String(conges.solde.periode_ref).slice(8, 10)
                      + "/" + String(conges.solde.periode_ref).slice(5, 7)
                      + "/" + String(conges.solde.periode_ref).slice(0, 4)}
                    {" — "}
                    <strong>{Number(conges.solde.acquis).toFixed(2)}</strong> acquis,{" "}
                    <strong>{Number(conges.solde.pris).toFixed(2)}</strong> pris,{" "}
                    solde <strong style={{ color: OR }}>
                      {Number(conges.solde.solde).toFixed(2)}
                    </strong> jour(s) ouvrable(s).
                  </p>
                ) : (
                  <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.55)",
                    marginTop: 0 }}>
                    Aucun droit acquis pour l&apos;instant. Les congés s&apos;acquièrent
                    à l&apos;émission de chaque bulletin, à raison de 2,5 jours
                    ouvrables par mois.
                  </p>
                )}

                <div style={{ display: "flex", gap: "10px", alignItems: "flex-end",
                  flexWrap: "wrap", marginTop: "12px" }}>
                  <div>
                    {/* ⚠️ LE MOIS S AFFICHE EN CLAIR : « 2026-09-01 » est un
                        format de base de donnees, pas une date qu on lit. */}
                    <span style={LIB}>Jours pris en {String(periode).slice(0, 7)}</span>
                    <input value={joursPris}
                      onChange={(e: any) => setJoursPris(e.target.value)}
                      placeholder="ex. 5" style={{ ...CHAMP, width: "120px" }} />
                  </div>
                  <button onClick={poserConges} disabled={occupe !== ""}
                    style={SECOND}>
                    {occupe === "conges" ? "…" : "Poser ces congés"}
                  </button>
                </div>

                {conges.mouvements && conges.mouvements.length > 0 && (
                  <div style={{ marginTop: "14px" }}>
                    {conges.mouvements.map(function (m: any) {
                      const prise = m.type_mouvement === "prise";
                      return (
                        <div key={m.id} style={{ display: "flex",
                          justifyContent: "space-between", padding: "7px 0",
                          borderTop: "1px solid rgba(255,255,255,0.07)",
                          fontSize: "13px" }}>
                          <span>
                            <span style={{ color: prise ? ROUGE : VERT }}>
                              {prise ? "−" : "+"}{Number(m.jours).toFixed(2)} j
                            </span>
                            <span style={{ marginLeft: "10px",
                              color: "rgba(255,255,255,0.55)" }}>
                              {String(m.periode).slice(0, 7)}
                              {" · "}{prise ? "prise" : "acquisition"}
                            </span>
                            {/* ⚠️ LES DEUX METHODES SONT MONTREES, pas
                                seulement le resultat : c est ce qui permet
                                de justifier le montant devant un controle. */}
                            {prise && m.valeur_retenue != null && (
                              <span style={{ marginLeft: "10px", fontSize: "12px",
                                color: "rgba(255,255,255,0.45)" }}>
                                maintien {Number(m.valeur_maintien).toFixed(2)} €
                                {" · "}dixième {Number(m.valeur_dixieme).toFixed(2)} €
                                {" · retenu "}
                                <strong style={{ color: OR }}>
                                  {Number(m.valeur_retenue).toFixed(2)} €
                                </strong>
                              </span>
                            )}
                          </span>
                          {prise && (
                            <button onClick={() => retirerPrise(m.id)}
                              style={{ background: "none", border: "none",
                                color: ROUGE, cursor: "pointer", fontSize: "12px" }}>
                              retirer
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════
                ══ LES SIGNALEMENTS D EVENEMENT ══
                🚨 CINQ JOURS POUR LES DEUX. Un arret signale en retard,
                c est un salarie qui n est pas paye ; une fin de contrat
                en retard, c est un chomage qui ne s ouvre pas.
                ⚠️ LE MOTIF VIENT DE LA BASE, avec son code de la norme :
                une fin de CDD declaree en licenciement economique ouvre
                les mauvais droits.
                ═══════════════════════════════════════════════════════ */}
            {choisi && evenements && (
              <div style={CADRE}>
                <h3 style={{ color: OR, fontSize: "16px", marginTop: 0 }}>
                  Signalements d&apos;événement
                </h3>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)",
                  marginTop: 0 }}>
                  Arrêt de travail et fin de contrat se déposent dans les
                  cinq jours. Le premier déclenche les indemnités
                  journalières, le second remplace l&apos;attestation employeur.
                </p>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap",
                  alignItems: "flex-end", marginTop: "12px" }}>
                  <div>
                    <span style={LIB}>Nature</span>
                    <select value={ev.type_evenement} style={CHAMP}
                      onChange={(x: any) => setEv(Object.assign({}, ev, {
                        type_evenement: x.target.value, motif: "" }))}>
                      <option value="arret">Arrêt de travail</option>
                      <option value="fin_contrat">Fin de contrat</option>
                    </select>
                  </div>

                  <div>
                    <span style={LIB}>Motif</span>
                    <select value={ev.motif} style={CHAMP}
                      onChange={(x: any) => setEv(Object.assign({}, ev,
                        { motif: x.target.value }))}>
                      <option value="">— choisir —</option>
                      {(ev.type_evenement === "arret"
                        ? evenements.motifs_arret
                        : evenements.motifs_fin || []).map(function (m: any) {
                        return (
                          <option key={m.code} value={m.correspondance}>
                            {m.libelle}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <span style={LIB}>
                      {ev.type_evenement === "arret"
                        ? "Début de l'arrêt" : "Date de fin"}
                    </span>
                    <input type="date" value={ev.date_debut} style={CHAMP}
                      onChange={(x: any) => setEv(Object.assign({}, ev,
                        { date_debut: x.target.value }))} />
                  </div>

                  {ev.type_evenement === "arret" && (
                    <div>
                      {/* ⚠️ CE N EST PAS TOUJOURS LA VEILLE DE L ARRET : le
                          salarie peut avoir travaille le matin. C est ce
                          jour qui fixe le depart du delai de carence. */}
                      <span style={LIB}>Dernier jour travaillé</span>
                      <input type="date" value={ev.dernier_jour_travaille}
                        style={CHAMP}
                        onChange={(x: any) => setEv(Object.assign({}, ev,
                          { dernier_jour_travaille: x.target.value }))} />
                    </div>
                  )}

                  {ev.type_evenement === "arret" && (
                    <div>
                      <span style={LIB}>Fin prévisionnelle</span>
                      <input type="date" value={ev.date_fin} style={CHAMP}
                        onChange={(x: any) => setEv(Object.assign({}, ev,
                          { date_fin: x.target.value }))} />
                    </div>
                  )}

                  {ev.type_evenement === "fin_contrat" && (
                    <div>
                      <span style={LIB}>Date de notification</span>
                      <input type="date" value={ev.date_notification}
                        style={CHAMP}
                        onChange={(x: any) => setEv(Object.assign({}, ev,
                          { date_notification: x.target.value }))} />
                    </div>
                  )}
                </div>

                {/* 🚨 LA SUBROGATION DECIDE QUI TOUCHE LES INDEMNITES.
                    Quand l employeur maintient le salaire, il les percoit
                    a la place du salarie — et doit donner son IBAN. */}
                {ev.type_evenement === "arret" && (
                  <div style={{ marginTop: "12px", display: "flex",
                    gap: "10px", alignItems: "flex-end", flexWrap: "wrap" }}>
                    <label style={{ fontSize: "13px", display: "flex",
                      alignItems: "center", gap: "7px", cursor: "pointer" }}>
                      <input type="checkbox" checked={ev.subrogation}
                        onChange={(x: any) => setEv(Object.assign({}, ev,
                          { subrogation: x.target.checked }))} />
                      L&apos;employeur maintient le salaire (subrogation)
                    </label>
                    {ev.subrogation && (
                      <>
                        <div>
                          <span style={LIB}>IBAN de l&apos;employeur</span>
                          <input value={ev.iban}
                            placeholder="FR76 …"
                            style={{ ...CHAMP, minWidth: "240px" }}
                            onChange={(x: any) => setEv(Object.assign({}, ev,
                              { iban: x.target.value }))} />
                        </div>
                        <div>
                          <span style={LIB}>BIC</span>
                          <input value={ev.bic} style={CHAMP}
                            onChange={(x: any) => setEv(Object.assign({}, ev,
                              { bic: x.target.value }))} />
                        </div>
                      </>
                    )}
                  </div>
                )}

                <button onClick={ajouterEvenement} disabled={occupe !== ""}
                  style={{ ...SECOND, marginTop: "12px" }}>
                  {occupe === "evenement" ? "…" : "Enregistrer ce signalement"}
                </button>

                {evenements.evenements && evenements.evenements.length > 0 && (
                  <div style={{ marginTop: "16px" }}>
                    {evenements.evenements.map(function (x: any) {
                      const arret = x.type_evenement === "arret";
                      const depose = x.statut === "depose";
                      return (
                        <div key={x.id} style={{
                          padding: "9px 0", fontSize: "13px",
                          borderTop: "1px solid rgba(255,255,255,0.07)",
                          display: "flex", justifyContent: "space-between",
                          gap: "10px", flexWrap: "wrap" }}>
                          <span>
                            <strong style={{ color: arret ? ROUGE : OR }}>
                              {arret ? "Arrêt" : "Fin de contrat"}
                            </strong>
                            <span style={{ marginLeft: "10px" }}>
                              {String(x.date_debut).slice(8, 10)}/
                              {String(x.date_debut).slice(5, 7)}/
                              {String(x.date_debut).slice(0, 4)}
                            </span>
                            <span style={{ marginLeft: "10px",
                              color: "rgba(255,255,255,0.55)" }}>
                              {x.motif}
                              {x.subrogation ? " · subrogation" : ""}
                              {" · "}{x.statut}
                            </span>
                          </span>
                          <span style={{ display: "flex", gap: "12px" }}>
                            <button onClick={() => genererSignalement(x.id)}
                              disabled={occupe !== ""}
                              style={{ background: "none", border: "none",
                                color: VERT, cursor: "pointer",
                                fontSize: "12.5px" }}>
                              {occupe === "signalement" ? "…" : "générer"}
                            </button>
                            {!depose && (
                              <button onClick={() => retirerEvenement(x.id)}
                                style={{ background: "none", border: "none",
                                  color: ROUGE, cursor: "pointer",
                                  fontSize: "12.5px" }}>
                                retirer
                              </button>
                            )}
                          </span>
                        </div>
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
                  const annule = b.statut === "annule";
                  return (
                    <div key={b.id} style={{ display: "flex",
                      justifyContent: "space-between", alignItems: "center",
                      flexWrap: "wrap", gap: "8px", padding: "9px 0",
                      opacity: annule ? 0.55 : 1,
                      borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <span style={{ fontSize: "13.5px" }}>
                        <span style={{ textDecoration: annule ? "line-through" : "none" }}>
                          {b.numero}
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.45)",
                          marginLeft: "10px", fontSize: "12.5px" }}>
                          {String(b.periode).slice(0, 7)}
                        </span>
                        <span style={{ marginLeft: "10px", fontSize: "11.5px",
                          color: b.statut === "emis" ? VERT
                            : annule ? ROUGE : OR }}>
                          {b.statut === "emis" ? "émis"
                            : annule ? "annulé et remplacé" : "brouillon"}
                        </span>
                        {b.type_bulletin === "rectificatif" && (
                          <span style={{ marginLeft: "10px", fontSize: "11.5px",
                            color: "rgba(255,255,255,0.45)" }}>
                            rectificatif{b.rectifie_numero ? " du " + b.rectifie_numero : ""}
                          </span>
                        )}
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
                        {/* ⚠️ NI UN BULLETIN EMIS NI UN BULLETIN ANNULE NE
                            PEUVENT ETRE EMIS : le bouton disparait, et la
                            route refuse de son cote. */}
                        {b.statut === "brouillon" && (
                          <button onClick={() => emettre(b)}
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
