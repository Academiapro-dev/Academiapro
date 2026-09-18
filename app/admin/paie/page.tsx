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
//
// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 17/09 — LES SIGNALEMENTS, APRES LEUR PASSAGE DANS dsn-val
//
// Les trois fichiers DSN passent l outil officiel. Mais l arret de travail
// n y est arrive qu avec trois donnees AJOUTEES A LA MAIN EN BASE, parce que
// cet ecran ne les demandait pas :
//   · la date de fin previsionnelle — le champ existait, il etait facultatif
//   · le BIC — le champ existait, il etait facultatif
//   · la date de fin de subrogation — LE CHAMP N EXISTAIT PAS
// ⚠️ LA MEME LECON QUE LE 16/09, mot pour mot : un champ absent de l ecran
// n existe pas, meme si la base et la route le prevoient. La route acceptait
// `subro_fin` depuis le premier jour.
//
// TROIS AUTRES DEFAUTS, TOUS VUS PAR JACQUES EN SE SERVANT DE L ECRAN :
//   1. LE FORMULAIRE VIDE, pose juste au-dessus de la liste, SEMBLAIT PILOTER
//      LES LIGNES DU DESSOUS. Il a cru qu une case decochee changeait un
//      arret deja enregistre. Le formulaire et la liste portent desormais
//      chacun leur titre, et une phrase dit que l un ne modifie pas l autre.
//   2. LA LISTE NE MONTRAIT PAS CE QUI AVAIT ETE ENREGISTRE : ni la fin de
//      l arret, ni celle de la subrogation. Impossible de verifier une saisie
//      sans aller lire la base. Chaque ligne dit maintenant ce qu elle porte,
//      et signale EN ROUGE ce qui lui manque.
//   3. LE FICHIER GENERE N AVAIT AUCUNE SORTIE : il fallait une requete SQL
//      pour le recuperer. Il se telecharge et se partage depuis sa ligne.
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
const LIEN: any = {
  background: "none", border: "none", cursor: "pointer", fontSize: "12.5px",
  fontFamily: "Georgia,serif", padding: 0,
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

// 🆕 LE SIGNALEMENT VIDE, ECRIT UNE SEULE FOIS. Il etait recopie a deux
// endroits — a l ouverture et apres l enregistrement : ajouter un champ a
// l un sans l autre aurait laisse une valeur fantome dans le formulaire.
const EV_VIDE: any = {
  type_evenement: "arret", motif: "", date_debut: "", date_fin: "",
  dernier_jour_travaille: "", subrogation: false, iban: "", bic: "",
  subro_fin: "", date_notification: "", dernier_jour_paye: "",
};

function moisCourant(): string {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-01";
}

function euros(n: any): string {
  return Number(n || 0).toLocaleString("fr-FR",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// 🆕 UNE DATE DE LA BASE, RENDUE LISIBLE : « 2026-09-24 » devient
// « 24/09/2026 ». Vide quand il n y a rien — l appelant decide quoi dire.
function jma(d: any): string {
  const t = String(d || "");
  if (t.length < 10) return "";
  return t.slice(8, 10) + "/" + t.slice(5, 7) + "/" + t.slice(0, 4);
}

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨🚨 LE FICHIER SE TELECHARGE EN ISO 8859-1, PAS EN UTF-8
//
// C EST LE PIEGE LE PLUS COUTEUX DE LA DSN, et il se rejoue ICI : le
// navigateur, laisse a lui-meme, ecrit tout fichier texte en UTF-8. Un « é »
// y tient sur deux octets ; la norme n en attend qu un. « 12 rue de la
// République » suffit a faire REJETER LA DECLARATION ENTIERE.
//
// ⚠️ LE GENERATEUR MENSUEL LE FAIT COTE SERVEUR (Buffer « latin1 »). Le
// signalement, lui, est garde en base comme un texte : c est donc au moment
// de le sortir qu il faut le convertir, caractere par caractere.
//
// ⛔ LE GENERATEUR NE LAISSE PASSER QUE DES CARACTERES DE CETTE TABLE (sa
// fonction `latin`). Si l un d eux en sortait malgre tout, on ecrit « ? » :
// un caractere faux se voit, un octet en trop casse tout sans rien montrer.
// ═══════════════════════════════════════════════════════════════════════
function octetsLatin1(texte: string): any {
  const o = new Uint8Array(texte.length);
  for (let i = 0; i < texte.length; i++) {
    const c = texte.charCodeAt(i);
    o[i] = c <= 255 ? c : 63;
  }
  return o;
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
  const [ev, setEv] = useState<any>(Object.assign({}, EV_VIDE));
  // 🆕🚨 18/09 — LE MESSAGE D ERREUR S AFFICHE A COTE DU BOUTON QUI L A
  // PROVOQUE. Jusqu ici il partait dans le bandeau du HAUT de la page, alors
  // que « Enregistrer ce signalement » est TOUT EN BAS : on touchait, rien ne
  // bougeait sous les yeux, et il fallait remonter pour comprendre. Jacques
  // l a vu a l ecran le 17/09 au soir.
  // ⚠️ LE BANDEAU DU HAUT RESTE POUR LE RESTE DE LA PAGE (calcul, bulletins,
  // conges) : c est ce bloc-ci qui etait trop loin, pas les autres.
  const [errEv, setErrEv] = useState("");
  // 🆕 LA LIGNE EN COURS DE MODIFICATION. Vide = on saisit un nouveau
  // signalement ; sinon, le formulaire corrige celui-la.
  const [modifie, setModifie] = useState<any>(null);
  // 🆕 LE PARTAGE N EXISTE PAS PARTOUT : iOS le propose, un navigateur de
  // bureau rarement. On ne montre le lien que la ou il marche.
  const [partagePossible, setPartagePossible] = useState(false);
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
    const nav: any = typeof navigator !== "undefined" ? navigator : null;
    setPartagePossible(!!(nav && nav.share && nav.canShare));
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
    // 🆕 LE FORMULAIRE REPART A VIDE QUAND ON CHANGE DE SALARIE : sinon un
    // arret a moitie saisi pour l un s enregistrerait sur le contrat de
    // l autre.
    setEv(Object.assign({}, EV_VIDE));
    setErrEv(""); setModifie(null);
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

  // ═══════════════════════════════════════════════════════════════════
  // 🆕🚨 CE QUE LA NORME EXIGE D UN ARRET SE RECLAME A LA SAISIE.
  //
  // dsn-val, 17/09 : la date de fin previsionnelle est OBLIGATOIRE, et en
  // subrogation l IBAN, le BIC et la date de fin de subrogation vont
  // ENSEMBLE. L arret d essai avait ete enregistre sans trois d entre eux,
  // et c est une requete SQL qui a du les ajouter.
  //
  // ⚠️ C EST AU MOMENT DE LA SAISIE QUE LE CABINET A L AVIS D ARRET ET LE
  // RELEVE D IDENTITE BANCAIRE SOUS LES YEUX. Le lui reclamer a la
  // generation, cinq jours plus tard, c est lui faire rechercher un papier.
  //
  // ⛔ CE CONTROLE-CI N EST QU UN CONFORT : il evite un aller-retour au
  // serveur. LE VRAI GARDE-FOU EST DANS LA ROUTE, qui refuse de son cote —
  // un ecran ne protege de rien, il se contourne.
  // ═══════════════════════════════════════════════════════════════════
  async function ajouterEvenement() {
    // 🆕 TOUS LES MESSAGES DE CE BLOC PASSENT PAR `errEv`, affiche juste
    // au-dessus du bouton. Aucun ne part plus dans le bandeau du haut.
    if (!ev.motif || !ev.date_debut) {
      setErrEv("Le motif et la date de début sont obligatoires."); return;
    }
    if (ev.type_evenement === "arret") {
      if (!ev.date_fin) {
        setErrEv("La date de fin prévisionnelle de l'arrêt est obligatoire : "
          + "c'est celle que porte l'avis d'arrêt du médecin. Sans elle, la "
          + "CPAM rejette le signalement.");
        return;
      }
      if (ev.subrogation && (!ev.iban || !ev.bic || !ev.subro_fin)) {
        setErrEv("En subrogation, l'IBAN, le BIC et la date de fin de "
          + "subrogation sont obligatoires tous les trois.");
        return;
      }
    }
    setErrEv(""); setErr(""); setMsg("");
    setOccupe("evenement");

    // ═══════════════════════════════════════════════════════════════════
    // 🆕🚨 18/09 — « MODIFIER » EST UN RETRAIT SUIVI D UNE SAISIE, FAIT PAR
    // LA MACHINE PLUTOT QUE PAR LA MAIN.
    //
    // ⚠️ LA ROUTE NE SAIT PAS METTRE A JOUR UN SIGNALEMENT : elle n a qu un
    // `ajouter_evenement` et un `supprimer_evenement`. Plutot que d inventer
    // une troisieme action non eprouvee, on enchaine les deux existantes —
    // celles qui sont deja passees par tous leurs controles.
    //
    // ⛔ L ORDRE COMPTE, ET IL EST CELUI-CI : ON ENREGISTRE D ABORD, ON
    // RETIRE ENSUITE. Dans l autre sens, une saisie refusee par la route
    // (IBAN faux, date incoherente) aurait deja fait disparaitre l ancien
    // signalement : on perdrait la donnee en croyant la corriger.
    // ⚠️ Pendant un instant les deux coexistent ; si le retrait echoue, on le
    // DIT et la liste montre les deux lignes — un doublon visible vaut mieux
    // qu une disparition silencieuse.
    // ⛔ UN SIGNALEMENT DEPOSE NE SE MODIFIE PAS : le bouton n existe pas sur
    // ces lignes-la, et la route refuserait le retrait de son cote.
    // ═══════════════════════════════════════════════════════════════════
    const aRetirer = modifie ? String(modifie.id) : "";

    const d = await appeler(Object.assign({
      action: "ajouter_evenement", contrat_id: choisi.id,
    }, ev));
    if (!d || d.erreur) {
      setOccupe("");
      if (d && d.erreur) setErrEv(d.erreur);
      return;
    }

    let message = d.message;
    if (aRetirer) {
      const r = await appeler({ action: "supprimer_evenement", id: aRetirer });
      if (r && r.erreur) {
        setErrEv("⛔ Le nouveau signalement est enregistré, mais l'ancien n'a "
          + "pas pu être retiré (" + r.erreur + "). LA LISTE EN CONTIENT DEUX : "
          + "retirez l'ancien à la main.");
      } else {
        message = "Signalement modifié. " + message;
      }
    }

    setOccupe("");
    setMsg(message);
    setEv(Object.assign({}, EV_VIDE));
    setModifie(null);
    chargerEvenements(choisi.id);
  }

  // 🆕 REPRENDRE UN SIGNALEMENT DANS LE FORMULAIRE.
  //
  // ⚠️ LES DATES DE LA BASE ARRIVENT EN « 2026-09-24T00:00:00 » ou en
  // « 2026-09-24 » selon la colonne : un champ `type="date"` n accepte QUE
  // les dix premiers caracteres. Les passer tels quels laisserait le champ
  // vide sans rien dire, et la modification perdrait la date.
  function modifierEvenement(x: any) {
    const d10 = function (v: any) { return String(v || "").slice(0, 10); };
    setEv({
      type_evenement: String(x.type_evenement || "arret"),
      motif: String(x.motif || ""),
      date_debut: d10(x.date_debut),
      date_fin: d10(x.date_fin),
      dernier_jour_travaille: d10(x.dernier_jour_travaille),
      subrogation: x.subrogation === true,
      iban: String(x.iban || ""),
      bic: String(x.bic || ""),
      subro_fin: d10(x.subro_fin),
      date_notification: d10(x.date_notification),
      dernier_jour_paye: d10(x.dernier_jour_paye),
    });
    setModifie(x);
    setErrEv(""); setErr(""); setMsg("");
    // ⚠️ LE FORMULAIRE EST AU-DESSUS DE LA LISTE : sans cela, on touche
    // « modifier » et rien ne bouge a l ecran — le meme defaut que le message
    // d erreur perdu en haut de page.
    if (typeof document !== "undefined") {
      const cible = document.getElementById("nouveau-signalement");
      if (cible && cible.scrollIntoView) {
        cible.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }

  function annulerModification() {
    setEv(Object.assign({}, EV_VIDE));
    setModifie(null);
    setErrEv("");
  }

  async function genererSignalement(id: string) {
    setErr(""); setErrEv(""); setMsg("");
    setOccupe("signalement");
    let d: any = null;
    try {
      const r = await fetch("/api/dsn/evenement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cle: secret, evenement_id: id }),
      });
      d = await r.json();
    } catch (e: any) { setErrEv(String(e)); }
    setOccupe("");
    if (!d) return;
    if (d.erreur) { setErrEv(d.erreur); return; }
    setMsg(d.message + " — " + d.nom_fichier + " (" + d.lignes + " lignes)");
    // ⚠️ LES ANOMALIES PASSENT EN ERREUR, pas en message : un signalement
    // avec anomalie ne doit pas ressembler a un succes.
    if (d.anomalies && d.anomalies.length > 0) setErrEv(d.anomalies.join(" · "));
    chargerEvenements(id && choisi ? choisi.id : id);
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🆕 LE FICHIER D UN SIGNALEMENT, ENFIN SORTI DE LA BASE.
  //
  // Le generateur le gardait dans `paie_evenements.fichier` et rien ne le
  // rendait : le 17/09, chaque passage dans dsn-val a commence par une
  // requete SQL. La liste le recoit deja avec chaque evenement — il ne
  // manquait que le geste pour le sortir.
  //
  // ⚠️ SON NOM DIT CE QU IL EST : la nature, le salarie, la date. Le 17/09,
  // deux fichiers successifs portaient le meme nom et c est l ANCIEN qui est
  // reparti dans dsn-val — dix-sept anomalies deja corrigees, relues pour
  // rien.
  // ═══════════════════════════════════════════════════════════════════
  function nomSignalement(x: any): string {
    const s = choisi && choisi.paie_salaries ? String(choisi.paie_salaries.nom || "") : "";
    const nom = s.replace(/[^A-Za-z0-9]/g, "").toUpperCase() || "SALARIE";
    const arret = x.type_evenement === "arret";
    const d = String((arret ? x.date_debut : (x.date_fin || x.date_debut)) || "")
      .slice(0, 10).replace(/-/g, "");
    return (arret ? "ARRET" : "FCTU") + "-" + nom + "-" + d + ".txt";
  }

  function telechargerSignalement(x: any) {
    if (!x || !x.fichier) { setErrEv("Ce signalement n'a pas encore été généré."); return; }
    const blob = new Blob([octetsLatin1(String(x.fichier))], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomSignalement(x);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  // ⚠️ LE PARTAGE EST CE QUI MANQUAIT SUR UN IPAD : il ouvre la feuille
  // d iOS, et de la le fichier part dans Dropbox, WhatsApp ou un courriel —
  // donc vers l ordinateur ou tourne dsn-val, sans passer par « Fichiers ».
  // ⛔ S IL ECHOUE OU S IL N EXISTE PAS, ON RETOMBE SUR LE TELECHARGEMENT :
  // un geste qui ne fait rien est pire qu un geste plus lent.
  async function partagerSignalement(x: any) {
    if (!x || !x.fichier) { setErrEv("Ce signalement n'a pas encore été généré."); return; }
    const nav: any = navigator;
    try {
      const fichier: any = new File([octetsLatin1(String(x.fichier))],
        nomSignalement(x), { type: "text/plain" });
      if (nav.canShare && nav.canShare({ files: [fichier] })) {
        await nav.share({ files: [fichier], title: nomSignalement(x) });
        return;
      }
    } catch (e: any) {
      // ⚠️ FERMER LA FEUILLE DE PARTAGE N EST PAS UNE ERREUR : iOS la
      // signale comme un abandon, et il n y a rien a en dire.
      if (e && e.name === "AbortError") return;
    }
    telechargerSignalement(x);
  }

  async function retirerEvenement(id: string) {
    if (!confirm("Retirer ce signalement ?")) return;
    setErrEv(""); setOccupe("evenement");
    // ⚠️ SI ON RETIRE CELUI QU ON EST EN TRAIN DE MODIFIER, le formulaire
    // repart a vide : sans cela, « Enregistrer » recreerait la ligne qu on
    // vient de supprimer.
    if (modifie && String(modifie.id) === String(id)) annulerModification();
    const d = await appeler({ action: "supprimer_evenement", id: id });
    setOccupe("");
    if (d && d.success) { setMsg(d.message); chargerEvenements(choisi.id); }
    else if (d && d.erreur) setErrEv(d.erreur);
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

                {/* 🆕 LE FORMULAIRE PORTE SON NOM. Pose sans titre au-dessus
                    de la liste, il semblait piloter les lignes du dessous :
                    Jacques a cru qu une case decochee ici changeait un arret
                    deja enregistre. */}
                {/* 🆕 LE TITRE DIT CE QUE FAIT LE FORMULAIRE. En modification,
                    il change de couleur et de mot : c est le seul endroit ou
                    l on peut voir, d un coup d oeil, qu on corrige une ligne
                    existante au lieu d en creer une. */}
                <p id="nouveau-signalement"
                  style={{ fontSize: "13px", color: modifie ? VERT : OR,
                    margin: "16px 0 0", fontWeight: "bold" }}>
                  {modifie
                    ? "Modification du signalement « "
                      + (modifie.type_evenement === "arret" ? "Arrêt" : "Fin de contrat")
                      + " " + jma(modifie.type_evenement === "arret"
                        ? modifie.date_debut : (modifie.date_fin || modifie.date_debut))
                      + " »"
                    : "Nouveau signalement"}
                </p>
                {modifie && (
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)",
                    margin: "4px 0 0", lineHeight: "1.6" }}>
                    Les champs sont remplis avec ce qui a été enregistré.
                    Corrigez ce qu&apos;il faut, puis validez : l&apos;ancien
                    signalement sera retiré et remplacé par celui-ci.
                  </p>
                )}

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap",
                  alignItems: "flex-end", marginTop: "10px" }}>
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
                      {/* 🆕🚨 OBLIGATOIRE — dsn-val, 17/09 : « absence de la
                          rubrique S21.G00.60.003 ». C est la date que porte
                          l avis d arret du medecin. ELLE NE SE DEVINE PAS :
                          on ne prolonge ni ne raccourcit un arret a sa
                          place. */}
                      <span style={LIB}>Fin prévisionnelle (obligatoire)</span>
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
                        {/* 🆕🚨 EN SUBROGATION, TROIS DONNEES VONT ENSEMBLE —
                            dsn-val, controle CCH-11 : l IBAN, le BIC et la
                            date de fin. Les deux premieres sont sur le meme
                            releve d identite bancaire. */}
                        <div>
                          <span style={LIB}>IBAN de l&apos;employeur (obligatoire)</span>
                          <input value={ev.iban}
                            placeholder="FR76 …"
                            style={{ ...CHAMP, minWidth: "240px" }}
                            onChange={(x: any) => setEv(Object.assign({}, ev,
                              { iban: x.target.value }))} />
                        </div>
                        <div>
                          <span style={LIB}>BIC (obligatoire)</span>
                          <input value={ev.bic} style={CHAMP}
                            onChange={(x: any) => setEv(Object.assign({}, ev,
                              { bic: x.target.value }))} />
                        </div>
                        <div>
                          {/* ⚠️ CE N EST PAS LA FIN DE L ARRET : c est la fin
                              de la periode pendant laquelle l employeur
                              MAINTIENT LE SALAIRE, que fixe la convention
                              collective — souvent moins longtemps que
                              l arret. Passee cette date, la CPAM verse au
                              salarie.
                              ⛔ ON NE LA PRE-REMPLIT PAS avec la fin de
                              l arret : declarer une subrogation trop
                              longue, c est percevoir des indemnites qui
                              reviennent au salarie. */}
                          <span style={LIB}>Fin de subrogation (obligatoire)</span>
                          <input type="date" value={ev.subro_fin} style={CHAMP}
                            onChange={(x: any) => setEv(Object.assign({}, ev,
                              { subro_fin: x.target.value }))} />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {ev.type_evenement === "arret" && ev.subrogation && (
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)",
                    margin: "8px 0 0", lineHeight: "1.6" }}>
                    La fin de subrogation est la fin du maintien de salaire prévu
                    par la convention collective, pas forcément celle de
                    l&apos;arrêt. Passé cette date, la CPAM verse les indemnités
                    au salarié.
                  </p>
                )}

                {/* 🆕🚨 LE MESSAGE EST ICI, AU-DESSUS DU BOUTON — 18/09.
                    Il partait dans le bandeau du haut de la page : on touchait
                    « Enregistrer », rien ne bougeait sous les yeux, et il
                    fallait remonter toute la fiche pour lire le refus. */}
                {errEv && (
                  <p style={{ color: ROUGE, fontSize: "13px", lineHeight: "1.6",
                    margin: "14px 0 0", padding: "10px 12px",
                    border: "1px solid rgba(229,115,115,0.4)", borderRadius: "8px",
                    background: "rgba(229,115,115,0.07)" }}>
                    {errEv}
                  </p>
                )}

                <div style={{ display: "flex", gap: "10px", alignItems: "center",
                  flexWrap: "wrap", marginTop: "12px" }}>
                  <button onClick={ajouterEvenement} disabled={occupe !== ""}
                    style={SECOND}>
                    {occupe === "evenement" ? "…"
                      : modifie ? "Enregistrer la modification"
                      : "Enregistrer ce signalement"}
                  </button>
                  {modifie && (
                    <button onClick={annulerModification} disabled={occupe !== ""}
                      style={{ ...LIEN, color: "rgba(255,255,255,0.55)" }}>
                      annuler la modification
                    </button>
                  )}
                </div>

                {evenements.evenements && evenements.evenements.length > 0 && (
                  <div style={{ marginTop: "22px", paddingTop: "14px",
                    borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                    {/* 🆕 LA LISTE PORTE SON NOM ELLE AUSSI, et dit que le
                        formulaire du dessus ne la modifie pas. */}
                    <p style={{ fontSize: "13px", color: OR, margin: 0,
                      fontWeight: "bold" }}>
                      Signalements enregistrés
                    </p>
                    <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)",
                      margin: "4px 0 8px", lineHeight: "1.6" }}>
                      Le formulaire ci-dessus sert à en saisir un nouveau : il ne
                      modifie pas ceux de cette liste, sauf si vous touchez
                      « modifier » sur l&apos;un d&apos;eux.
                    </p>
                    {evenements.evenements.map(function (x: any) {
                      const arret = x.type_evenement === "arret";
                      const depose = x.statut === "depose";
                      // 🆕🚨 CE QUI MANQUE A UN ARRET SE VOIT SUR SA LIGNE, EN
                      // ROUGE, avant meme de le generer. Un arret saisi avant
                      // le 17/09 peut encore etre incomplet : la liste le
                      // dit, au lieu de laisser la CPAM le decouvrir.
                      const manques: string[] = [];
                      if (arret && !x.date_fin) manques.push("fin prévisionnelle");
                      if (arret && x.subrogation && !x.subro_fin) manques.push("fin de subrogation");
                      if (arret && x.subrogation && !x.iban) manques.push("IBAN");
                      if (arret && x.subrogation && !x.bic) manques.push("BIC");
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
                              {arret
                                ? "du " + jma(x.date_debut)
                                  + (x.date_fin ? " au " + jma(x.date_fin) : "")
                                : "le " + jma(x.date_fin || x.date_debut)}
                            </span>
                            <span style={{ marginLeft: "10px",
                              color: "rgba(255,255,255,0.55)" }}>
                              {x.motif}
                              {x.subrogation
                                ? " · subrogation"
                                  + (x.subro_fin ? " jusqu'au " + jma(x.subro_fin) : "")
                                : (arret ? " · sans subrogation" : "")}
                              {" · "}{x.statut}
                            </span>
                            {manques.length > 0 && (
                              <span style={{ display: "block", marginTop: "3px",
                                color: ROUGE, fontSize: "12px" }}>
                                Il manque : {manques.join(", ")}. La CPAM rejettera
                                ce signalement — retirez-le et saisissez-le de
                                nouveau.
                              </span>
                            )}
                          </span>
                          <span style={{ display: "flex", gap: "12px",
                            alignItems: "baseline", flexWrap: "wrap" }}>
                            <button onClick={() => genererSignalement(x.id)}
                              disabled={occupe !== ""}
                              style={{ ...LIEN, color: VERT }}>
                              {occupe === "signalement" ? "…" : "générer"}
                            </button>
                            {/* 🆕 LE FICHIER SORT D ICI. Les deux liens
                                n apparaissent qu une fois le signalement
                                genere : avant, il n y a rien a sortir. */}
                            {x.fichier && (
                              <button onClick={() => telechargerSignalement(x)}
                                style={{ ...LIEN, color: OR }}>
                                télécharger
                              </button>
                            )}
                            {x.fichier && partagePossible && (
                              <button onClick={() => partagerSignalement(x)}
                                style={{ ...LIEN, color: OR }}>
                                partager
                              </button>
                            )}
                            {/* 🆕 « MODIFIER » — Jacques l a cherche le 17/09.
                                ⛔ PAS SUR UN SIGNALEMENT DEPOSE : il a ete
                                transmis a l organisme, le corriger ici ne le
                                corrigerait pas la-bas. */}
                            {!depose && (
                              <button onClick={() => modifierEvenement(x)}
                                disabled={occupe !== ""}
                                style={{ ...LIEN,
                                  color: modifie && String(modifie.id) === String(x.id)
                                    ? VERT : OR }}>
                                {modifie && String(modifie.id) === String(x.id)
                                  ? "en cours de modification" : "modifier"}
                              </button>
                            )}
                            {!depose && (
                              <button onClick={() => retirerEvenement(x.id)}
                                style={{ ...LIEN, color: ROUGE }}>
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
