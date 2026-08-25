"use client";
import { useState, useEffect, useMemo, useRef } from "react";

// L ECRAN LINKEDIN — CINQ TEMPS, CINQ ONGLETS.
//
// INVITER : une fiche a la fois, le mot pre-redige, le profil qui s ouvre.
// EN ATTENTE D INVITATION : les profils enregistres mais pas encore invites.
// MES INVITATIONS : ce qui est parti et attend une reponse.
// A ECRIRE : les personnes qui ont accepte et n ont pas encore recu de mot.
// MESSAGES ENVOYES : ceux a qui l on a ecrit, du plus ancien au plus recent.
//
// 🚨🚨 LE DEFAUT DE CONCEPTION CORRIGE LE 18/08, ET IL FAUT LE COMPRENDRE
// POUR NE PAS LE REFAIRE. Les deux seuls boutons d enregistrement etaient
// « Invitee avec une note » et « Invitee sans note ». ENREGISTRER UNE FICHE
// ET DECLARER UNE INVITATION ETAIENT DONC LA MEME ACTION.
//
// Ses mots : « envoyer une fiche sans invitation, pour moi ca ne veut pas
// dire enregistrer la fiche ».
//
// ⚠️ LECON GENERALE : toujours dérouler ce qui arrive AU BOUT — quand le
// quota est atteint, quand la liste est vide, quand un champ manque. Un
// bouton qui se grise ne doit jamais etre le SEUL moyen d enregistrer.
//
// 🚨🚨 LA MEME LECON, REJOUEE LE 25/08 SUR LA RECHERCHE.
//
// Le bloc « Chercher partout » a d abord ete livre en LECTURE SEULE, au
// motif qu on irait agir ailleurs. C etait faux. Jacques trouve un
// prospect ICI, au moment ou LinkedIn lui notifie une acceptation, et il
// doit pouvoir marquer SANS quitter l ecran. Une fiche qu on voit sans
// pouvoir agir dessus est une impasse.
//
// LES BOUTONS SONT DONC SUR CHAQUE RESULTAT portant un profil LinkedIn.
// Ils ecrivent par /api/admin/linkedin, avec sans_suite a true : marquer
// depuis la recherche ne doit PAS faire defiler la file d invitation.
//
// 🆕 LECTURE D UNE CAPTURE — 18/08. Jacques photographie un profil, les
// champs se remplissent.
//
// 🆕 LA FICHE CREEE S AFFICHE — 25/08. Elle ne s affichait pas : un message
// vert confirmait, puis il fallait aller la chercher dans un onglet.
//
// 🚨 AUCUN ENVOI AUTOMATIQUE, ET CE N EST PAS CONTOURNABLE. LinkedIn
// n expose AUCUNE API de messagerie, et les outils qui simulent les clics
// font restreindre puis supprimer le compte.

const BASES = [
  { cle: "organismes", nom: "Organismes certifiés Qualiopi" },
  { cle: "qualiopi", nom: "Organismes NON certifiés" },
  { cle: "interim", nom: "Agences d'intérim" },
];

// LES CHAMPS DE LA FICHE COMPLETE, ET ILS DIFFERENT SELON LA TABLE.
const CHAMPS_PROSPECTS = [
  { cle: "dirigeant_prenom", nom: "Prénom du dirigeant", large: false },
  { cle: "dirigeant_nom", nom: "Nom du dirigeant", large: false },
  { cle: "raison_sociale", nom: "Raison sociale", large: true },
  { cle: "ville", nom: "Ville", large: false },
  { cle: "code_postal", nom: "Code postal", large: false },
  { cle: "email", nom: "Adresse électronique", large: true },
  { cle: "telephone", nom: "Téléphone", large: false },
  { cle: "siren", nom: "SIREN", large: false },
  { cle: "site_web", nom: "Site internet", large: true },
  { cle: "linkedin", nom: "Profil LinkedIn", large: true },
];

const CHAMPS_CRM = [
  { cle: "dirigeant_prenom", nom: "Prénom", large: false },
  { cle: "dirigeant_nom", nom: "Nom", large: false },
  { cle: "nom", nom: "Nom complet du contact", large: true },
  { cle: "organisme", nom: "Son organisme", large: true },
  { cle: "ville", nom: "Ville", large: false },
  { cle: "email", nom: "Adresse électronique", large: false },
  { cle: "telephone", nom: "Téléphone", large: false },
  { cle: "linkedin", nom: "Profil LinkedIn", large: true },
];

function champsDe(base: string) {
  return base === "manuel" ? CHAMPS_CRM : CHAMPS_PROSPECTS;
}

// 🚨 DEUX CENTS CARACTERES, PAS TROIS CENTS. LinkedIn n accorde 300
// caracteres QU AUX COMPTES PREMIUM. Au-dela de 200 en compte gratuit, le
// bouton « Ajouter une note » disparait — ce qui BRULE LA FICHE POUR TROIS
// SEMAINES si on ne voulait pas.
const LIMITE_NOTE = 200;

const JOURS_AVANT_RELANCE = 12;

function motInvitation(prenom: string) {
  const p = String(prenom || "").trim();
  const civilite = p ? "Bonjour " + p : "Bonjour";
  return civilite + ", j'ai dirigé un organisme de formation certifié, et c'est l'administratif "
    + "qui m'a coûté le plus de temps. J'en ai fait un outil qui le prend en charge. "
    + "Ravi d'échanger avec vous.";
}

// LE MESSAGE APRES ACCEPTATION.
//
// ⚠️ AUCUNE MENTION DE PRODUCTION SUR DEMANDE. Le catalogue est evolutif,
// point. Decision du 17/08, a ne pas defaire.
function messageRelance(prenom: string, societe: string) {
  const p = String(prenom || "").trim();
  const s = String(societe || "").trim();
  return (p ? "Bonjour " + p : "Bonjour") + ",\n\n"
    + "Merci d'avoir accepté ma demande.\n\n"
    + "Je vous écris parce que j'ai dirigé un organisme de formation certifié Qualiopi pendant "
    + "quelques années. Ce qui m'a coûté le plus de temps n'a jamais été de former : c'était le "
    + "bilan pédagogique et financier, les preuves à réunir avant l'audit, et le suivi "
    + "administratif des stagiaires.\n\n"
    + "J'en ai fait une plateforme qui prend tout cela en charge — évaluations à chaud et à "
    + "froid, registre des réclamations, dossiers des formateurs, bilan prérempli cadre par "
    + "cadre. S'y ajoute un catalogue de plus de trois cents formations que vous pouvez vendre "
    + "sous votre propre marque, ce qu'aucun logiciel du marché ne propose.\n\n"
    + "Je ne cherche pas à vous vendre quoi que ce soit aujourd'hui. Je serais surtout curieux "
    + "de savoir ce qui vous prend le plus de temps"
    + (s ? " chez " + s : "") + " sur la partie administrative — c'est ce qui me dit si l'outil "
    + "répond à un vrai besoin ou pas.\n\n"
    + "Bien à vous,\nJacques Lalou\nacademiapro.fr";
}

function secondMessage(prenom: string) {
  const p = String(prenom || "").trim();
  return (p ? "Bonjour " + p : "Bonjour") + ",\n\n"
    + "Je me permets un mot, mon message précédent est peut-être passé inaperçu.\n\n"
    + "Si le sujet ne vous concerne pas, dites-le-moi simplement, je n'insisterai pas.\n\n"
    + "Et si vous êtes curieux de voir à quoi ressemble la plateforme, je peux vous ouvrir "
    + "un accès pour que vous jugiez par vous-même — sans engagement d'aucune sorte.\n\n"
    + "Bien à vous,\nJacques Lalou\nacademiapro.fr";
}

// Sans accents et en minuscules : « Bousbia » retrouve « BOUSBIA ».
function aplatir(v: any): string {
  return String(v === null || v === undefined ? "" : v)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function PageLinkedin() {
  const [onglet, setOnglet] = useState("inviter");
  const [base, setBase] = useState("organismes");

  const [fiche, setFiche] = useState<any>(null);
  const [restant, setRestant] = useState(0);
  const [epuise, setEpuise] = useState(false);
  const [texte, setTexte] = useState("");
  const [vu, setVu] = useState(false);

  const [lignes, setLignes] = useState<any[]>([]);
  const [ouverte, setOuverte] = useState<any>(null);
  const [texteLong, setTexteLong] = useState("");

  const [recherche, setRecherche] = useState("");

  // LA RECHERCHE PARTOUT.
  const [partoutOuvert, setPartoutOuvert] = useState(false);
  const [partoutTerme, setPartoutTerme] = useState("");
  const [partoutCharge, setPartoutCharge] = useState(false);
  const [partoutResultat, setPartoutResultat] = useState<any>(null);
  const [partoutErreur, setPartoutErreur] = useState("");
  const [partoutMessage, setPartoutMessage] = useState("");
  const [partoutOccupe, setPartoutOccupe] = useState("");
  const [partoutTexte, setPartoutTexte] = useState<any>({});

  // LA FICHE QUI VIENT D ETRE CREEE.
  const [creee, setCreee] = useState<any>(null);

  // LA FICHE COMPLETE.
  const [depliee, setDepliee] = useState("");
  const [brouillon, setBrouillon] = useState<any>({});
  const [enregistre, setEnregistre] = useState("");

  // LA LECTURE DE CAPTURE.
  const [litPour, setLitPour] = useState("");
  const champAjout = useRef<any>(null);
  const champFiche = useRef<any>(null);
  const [cibleFiche, setCibleFiche] = useState<any>(null);

  // LE MODE ENCHAINEMENT.
  const [serie, setSerie] = useState<any[] | null>(null);
  const [rang, setRang] = useState(0);
  const [texteSerie, setTexteSerie] = useState("");
  const [copieSerie, setCopieSerie] = useState(false);
  const [ouvertSerie, setOuvertSerie] = useState(false);
  const [faits, setFaits] = useState(0);

  const [ajout, setAjout] = useState(false);
  const [aNom, setANom] = useState("");
  const [aLien, setALien] = useState("");
  const [aOrganisme, setAOrganisme] = useState("");
  const [aVille, setAVille] = useState("");
  const [aNotes, setANotes] = useState("");
  const [message, setMessage] = useState("");

  const [compteurs, setCompteurs] = useState<any>(null);
  const [charge, setCharge] = useState(false);
  const [erreur, setErreur] = useState("");
  const [copie, setCopie] = useState("");

  useEffect(() => {
    if (onglet === "inviter") chargerSuivante();
    else chargerListe();
  }, [onglet, base]);

  async function appeler(corps: any) {
    const r = await fetch("/api/admin/linkedin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corps),
    });
    return await r.json();
  }

  function cleDe(l: any) {
    return l.base + "-" + l.id;
  }

  // ---------- LA RECHERCHE PARTOUT ----------

  async function chercherPartout(terme?: string) {
    const t = String(terme !== undefined ? terme : partoutTerme).trim();
    if (t.length < 2) {
      setPartoutErreur("Deux caractères au minimum.");
      setPartoutResultat(null);
      return;
    }
    setPartoutCharge(true);
    setPartoutErreur("");
    if (terme === undefined) setPartoutMessage("");
    try {
      const r = await fetch("/api/admin/prospection?global=" + encodeURIComponent(t));
      const d = await r.json();
      if (d.ok) setPartoutResultat(d);
      else { setPartoutErreur(d.erreur || "Recherche impossible."); setPartoutResultat(null); }
    } catch (e: any) {
      setPartoutErreur("Recherche impossible : " + String(e));
    }
    setPartoutCharge(false);
  }

  function viderPartout() {
    setPartoutTerme("");
    setPartoutResultat(null);
    setPartoutErreur("");
    setPartoutMessage("");
  }

  // MARQUER DEPUIS UN RESULTAT DE RECHERCHE.
  //
  // ⚠️ sans_suite EMPECHE LA FILE D INVITATION DE DEFILER. On agit sur une
  // fiche precise, pas dans un enchainement.
  async function marquerDepuisRecherche(cleBase: string, ligne: any, statut: string) {
    const cle = cleBase + "-" + ligne.id;
    setPartoutOccupe(cle);
    setPartoutErreur("");
    setPartoutMessage("");
    try {
      const d = await appeler({
        base: cleBase,
        id: ligne.id,
        statut: statut,
        sans_suite: true,
      });
      if (d.ok) {
        if (d.compteurs) setCompteurs(d.compteurs);
        const nom = ((ligne.dirigeant_prenom || "") + " " + (ligne.dirigeant_nom || "")).trim()
          || ligne.raison_sociale || "La fiche";
        const mots: any = {
          accepte: " a été marqué comme ayant accepté. Sa fiche est dans « À écrire ».",
          accepte_nu: " a été marqué comme ayant accepté. Sa fiche est dans « À écrire ».",
          invite: " est marqué invité avec une note.",
          invite_nu: " est marqué invité sans note.",
          ecarte: " est écarté : il ne ressortira plus dans la file d'invitation.",
        };
        setPartoutMessage(nom + (mots[statut] || " est enregistré."));
        await chercherPartout(partoutTerme);
        if (onglet !== "inviter") await chargerListe();
      } else {
        setPartoutErreur(d.erreur || "Enregistrement impossible.");
        if (d.compteurs) setCompteurs(d.compteurs);
      }
    } catch (e: any) {
      setPartoutErreur("Enregistrement impossible : " + String(e));
    }
    setPartoutOccupe("");
  }

  // ---------- FIN DE LA RECHERCHE PARTOUT ----------

  // ---------- LA LECTURE D UNE CAPTURE ----------

  function enBase64(fichier: File): Promise<string> {
    return new Promise(function (resoudre, rejeter) {
      const lecteur = new FileReader();
      lecteur.onload = function () { resoudre(String(lecteur.result || "")); };
      lecteur.onerror = function () { rejeter(new Error("Lecture du fichier impossible")); };
      lecteur.readAsDataURL(fichier);
    });
  }

  async function lireCapture(fichier: File, pour: string, ligne?: any) {
    if (!fichier) return;
    setLitPour(pour);
    setErreur("");
    setMessage("");
    try {
      const image = await enBase64(fichier);

      const r = await fetch("/api/admin/linkedin-lire-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: image }),
      });
      const d = await r.json();

      if (!d.ok) {
        setErreur(d.erreur || "Lecture impossible.");
        setLitPour("");
        return;
      }

      if (pour === "ajout") {
        if (d.nom) setANom(d.nom);
        if (d.organisme) setAOrganisme(d.organisme);
        if (d.ville) setAVille(d.ville);
        if (d.linkedin) setALien(d.linkedin);
        if (d.observation) setANotes(d.observation);

        let mot = "Capture lue.";
        if (!d.linkedin) {
          mot += " L'adresse du profil n'était pas visible : touchez les trois points "
            + "sur LinkedIn, puis « Copier le lien vers le profil », et collez-la.";
        }
        if (d.deja_invite) {
          mot += " ⚠️ Ce profil porte déjà la mention « En attente » — vous l'avez "
            + "probablement invité depuis LinkedIn. Utilisez « Enregistrer seulement » "
            + "pour ne pas consommer une unité de quota inutilement.";
        }
        setMessage(mot);
      } else if (ligne) {
        // UNE FICHE EXISTANTE : on ne remplit que les champs VIDES, pour ne
        // jamais ecraser une donnee deja verifiee par une lecture d image.
        const cle = cleDe(ligne);
        const actuel = brouillon[cle] || {};
        const neuf: any = { ...actuel };
        const cible = ligne.base === "manuel" ? "crm" : "prospect";

        function poserSiVide(champ: string, valeur: string) {
          if (!valeur) return;
          if (!actuel[champ] || String(actuel[champ]).trim() === "") neuf[champ] = valeur;
        }

        poserSiVide("dirigeant_prenom", d.prenom);
        poserSiVide("dirigeant_nom", d.patronyme);
        poserSiVide("ville", d.ville);
        poserSiVide("linkedin", d.linkedin);
        if (cible === "crm") {
          poserSiVide("nom", d.nom);
          poserSiVide("organisme", d.organisme);
        } else {
          poserSiVide("raison_sociale", d.organisme);
        }

        if (d.observation) {
          const ancienne = String(actuel.notes || "").trim();
          neuf.notes = ancienne ? ancienne + "\n\n" + d.observation : d.observation;
        }

        setBrouillon({ ...brouillon, [cle]: neuf });
        setMessage("Capture lue. Les champs vides ont été remplis — relisez avant d'enregistrer.");
      }
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e.message || e));
    }
    setLitPour("");
  }

  // ---------- FIN DE LA LECTURE ----------

  function poser(d: any) {
    setFiche(d.fiche || null);
    setRestant(d.restant || 0);
    setEpuise(!!d.epuise);
    setTexte(d.fiche ? motInvitation(d.fiche.dirigeant_prenom) : "");
    setCopie("");
    setVu(false);
  }

  async function chargerSuivante() {
    setCharge(true);
    setErreur("");
    try {
      const d = await appeler({ action: "suivante", base: base });
      if (d.ok) { poser(d); setCompteurs(d.compteurs || null); }
      else setErreur(d.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setCharge(false);
  }

  async function chargerListe() {
    setCharge(true);
    setErreur("");
    setOuverte(null);
    setDepliee("");
    try {
      const action = onglet === "file" ? "en_file"
        : onglet === "attente" ? "en_attente"
        : onglet === "envoyes" ? "envoyes"
        : "a_relancer";
      const d = await appeler({ action: action });
      if (d.ok) {
        setLignes(d.lignes || []);
        setCompteurs(d.compteurs || null);
      } else setErreur(d.erreur || "Lecture impossible.");
    } catch (e: any) {
      setErreur("Lecture impossible : " + String(e));
    }
    setCharge(false);
  }

  function deplier(l: any) {
    const cle = cleDe(l);
    const vals: any = { notes: l.notes || "" };
    for (const c of champsDe(l.base)) vals[c.cle] = l[c.cle] || "";
    setBrouillon({ ...brouillon, [cle]: vals });
    setDepliee(cle);
    setErreur("");
    setMessage("");
  }

  function poserChamp(cle: string, champ: string, valeur: string) {
    const actuel = brouillon[cle] || {};
    setBrouillon({ ...brouillon, [cle]: { ...actuel, [champ]: valeur } });
  }

  async function enregistrerFiche(l: any) {
    const cle = cleDe(l);
    const vals = brouillon[cle] || {};
    setEnregistre(cle);
    setErreur("");
    setMessage("");
    try {
      const corps: any = { action: "modifier", base: l.base || base, id: l.id, notes: vals.notes || "" };
      for (const c of champsDe(l.base)) corps[c.cle] = vals[c.cle] || "";

      const d = await appeler(corps);
      if (d.ok) {
        setMessage(d.message || "Fiche enregistrée.");
        setDepliee("");
        if (d.fiche) {
          setLignes(lignes.map(function (x: any) {
            return cleDe(x) === cle ? { ...d.fiche, base: l.base } : x;
          }));
          if (creee && cleDe(creee) === cle) setCreee({ ...d.fiche, base: l.base });
        }
      } else {
        setErreur(d.erreur || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setEnregistre("");
  }

  const filtrees = useMemo(function () {
    const q = aplatir(recherche);
    if (!q) return lignes;
    const mots = q.split(/\s+/).filter(Boolean);
    return lignes.filter(function (l: any) {
      const foin = aplatir(
        (l.dirigeant_prenom || "") + " " +
        (l.dirigeant_nom || "") + " " +
        (l.raison_sociale || "") + " " +
        (l.ville || "") + " " +
        (l.email || "") + " " +
        (l.telephone || "") + " " +
        (l.linkedin || "") + " " +
        (l.notes || "")
      );
      return mots.every(function (m: string) { return foin.indexOf(m) >= 0; });
    });
  }, [lignes, recherche]);

  // ---------- LE MODE ENCHAINEMENT ----------

  function demarrerSerie() {
    if (filtrees.length === 0) return;
    const file = filtrees.slice();
    const second = onglet === "envoyes";
    setSerie(file);
    setRang(0);
    setFaits(0);
    setCopieSerie(false);
    setOuvertSerie(false);
    setTexteSerie(second
      ? secondMessage(file[0].dirigeant_prenom)
      : messageRelance(file[0].dirigeant_prenom, file[0].raison_sociale));
    setErreur("");
    setMessage("");
  }

  function quitterSerie() {
    setSerie(null);
    setRang(0);
    setTexteSerie("");
    setCopieSerie(false);
    setOuvertSerie(false);
  }

  function avancer(file: any[], prochain: number) {
    if (prochain >= file.length) {
      setSerie(null);
      setMessage(faits + 1 + " message(s) envoyé(s). La série est terminée.");
      chargerListe();
      return;
    }
    const second = onglet === "envoyes";
    setRang(prochain);
    setTexteSerie(second
      ? secondMessage(file[prochain].dirigeant_prenom)
      : messageRelance(file[prochain].dirigeant_prenom, file[prochain].raison_sociale));
    setCopieSerie(false);
    setOuvertSerie(false);
  }

  // ⚠️ L ouverture se fait AVANT toute attente : un window.open declenche
  // apres un await est bloque par le navigateur comme une fenetre
  // surgissante non sollicitee.
  function copierEtOuvrir(l: any) {
    try {
      navigator.clipboard.writeText(texteSerie);
      setCopieSerie(true);
    } catch (e) {
      setErreur("Copie impossible — sélectionnez le texte à la main.");
    }
    try { window.open(lien(l.linkedin), "_blank", "noopener"); } catch (e) { }
    setOuvertSerie(true);
  }

  async function envoyeEtSuivant(l: any) {
    if (!serie) return;
    setCharge(true);
    setErreur("");
    try {
      const d = await appeler({ base: l.base || base, id: l.id, statut: "relance" });
      if (d.ok) {
        setCompteurs(d.compteurs || null);
        setFaits(faits + 1);
        avancer(serie, rang + 1);
      } else {
        setErreur(d.erreur || "Enregistrement impossible.");
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setCharge(false);
  }

  function passerSuivant() {
    if (!serie) return;
    avancer(serie, rang + 1);
  }

  // ---------- FIN DU MODE ENCHAINEMENT ----------

  // 🚨 TROIS FACONS D ENREGISTRER — et « file » est toujours disponible,
  // meme quand le plafond du jour est atteint.
  async function ajouter(mode: string) {
    if (aNom.trim().length < 2) {
      setErreur("Indiquez le nom du contact.");
      return;
    }
    if (aLien.indexOf("linkedin.com") < 0) {
      setErreur("Collez l'adresse complète du profil LinkedIn.");
      return;
    }
    setCharge(true);
    setErreur("");
    setMessage("");
    try {
      const d = await appeler({
        action: "ajouter",
        mode: mode,
        nom: aNom,
        linkedin: aLien,
        organisme: aOrganisme,
        ville: aVille,
        notes: aNotes,
      });
      if (d.ok) {
        setMessage(d.message || "Profil enregistré.");
        setCompteurs(d.compteurs || null);
        // 🆕 LA FICHE CREEE S AFFICHE IMMEDIATEMENT — 25/08.
        setCreee(d.ajoute || null);
        setANom(""); setALien(""); setAOrganisme(""); setAVille(""); setANotes("");
        setAjout(false);
      } else {
        setErreur(d.erreur || "Enregistrement impossible.");
        if (d.compteurs) setCompteurs(d.compteurs);
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setCharge(false);
  }

  // OUVRIR UN PROFIL — ET RIEN D AUTRE.
  function ouvrirProfil(l: any) {
    try { window.open(lien(l.linkedin), "_blank", "noopener"); } catch (e) { }
    setVu(true);
  }

  async function marquer(l: any, statut: string, cleBase?: string) {
    setCharge(true);
    setErreur("");
    try {
      const d = await appeler({ base: cleBase || l.base || base, id: l.id, statut: statut });
      if (d.ok) {
        setCompteurs(d.compteurs || null);
        if (onglet === "inviter") poser(d);
        else await chargerListe();
      } else {
        setErreur(d.erreur || "Enregistrement impossible.");
        if (d.compteurs) setCompteurs(d.compteurs);
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setCharge(false);
  }

  // Marquer la fiche qui vient d etre creee, sans quitter l ecran.
  async function marquerCreee(statut: string) {
    if (!creee) return;
    setCharge(true);
    setErreur("");
    setMessage("");
    try {
      const d = await appeler({ base: "manuel", id: creee.id, statut: statut, sans_suite: true });
      if (d.ok) {
        setCompteurs(d.compteurs || null);
        setCreee({ ...creee, linkedin_statut: statut });
        setMessage(statut === "ecarte"
          ? "Fiche écartée."
          : "Fiche mise à jour : " + statut + ".");
      } else {
        setErreur(d.erreur || "Enregistrement impossible.");
        if (d.compteurs) setCompteurs(d.compteurs);
      }
    } catch (e: any) {
      setErreur("Enregistrement impossible : " + String(e));
    }
    setCharge(false);
  }

  function copier(t: string, cle: string) {
    try {
      navigator.clipboard.writeText(t);
      setCopie(cle);
      setTimeout(() => setCopie(""), 2500);
    } catch (e) {
      setErreur("Copie impossible — sélectionnez le texte à la main.");
    }
  }

  function lien(v: string) {
    const t = String(v || "").trim();
    if (!t) return "";
    if (t.indexOf("http") === 0) return t;
    return "https://" + t.replace(/^\/+/, "");
  }

  function appelable(t: string) {
    return String(t || "").replace(/[^0-9+]/g, "");
  }

  function nombre(n: any) {
    return (Number(n) || 0).toLocaleString("fr-FR");
  }

  function jolieDate(d: any) {
    if (!d) return "";
    try { return new Date(d).toLocaleDateString("fr-FR"); } catch (e) { return ""; }
  }

  function joursDepuis(d: any) {
    if (!d) return null;
    try { return Math.floor((Date.now() - new Date(d).getTime()) / 86400000); } catch (e) { return null; }
  }

  function avecNoteDe(l: any) {
    return l.linkedin_statut === "invite" || l.linkedin_statut === "accepte";
  }

  const OR = "#c8a96e";
  const BLEU = "#448aff";
  const VERT = "#00e676";
  const ORANGE = "#e8a33d";

  const CARTE: any = {
    background: "#1a1a2e",
    borderRadius: "12px",
    padding: "20px 22px",
    marginBottom: "14px",
    border: "1px solid rgba(200,169,110,0.2)",
  };

  const BOUTON: any = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(200,169,110,0.35)",
    color: OR,
    padding: "11px 20px",
    borderRadius: "9px",
    cursor: "pointer",
    fontSize: "14px",
    fontFamily: "Georgia,serif",
  };

  const CHAMP: any = {
    width: "100%", padding: "13px", borderRadius: "9px",
    border: "1px solid rgba(200,169,110,0.3)",
    background: "rgba(255,255,255,0.04)", color: "#fff",
    fontSize: "14.5px", lineHeight: "1.75", fontFamily: "Georgia,serif",
    boxSizing: "border-box", resize: "vertical",
  };

  const LIBELLE: any = {
    display: "block", color: OR, fontSize: "12.5px", marginBottom: "5px",
  };

  const plafondJour = compteurs ? (compteurs.reste_jour || 0) <= 0 : false;
  const plafondSemaine = compteurs ? (compteurs.reste_semaine || 0) <= 0 : false;
  const bloque = plafondJour || plafondSemaine;
  const trop = texte.length > LIMITE_NOTE;

  const ONGLETS = [
    { id: "inviter", nom: "Inviter" },
    { id: "file", nom: "En attente d'invitation" + (compteurs && compteurs.en_file ? " · " + compteurs.en_file : "") },
    { id: "attente", nom: "Mes invitations" + (compteurs && compteurs.en_attente ? " · " + compteurs.en_attente : "") },
    { id: "relancer", nom: "À écrire" + (compteurs && compteurs.en_attente_reponse ? " · " + compteurs.en_attente_reponse : "") },
    { id: "envoyes", nom: "Messages envoyés" + (compteurs && compteurs.relances ? " · " + compteurs.relances : "") },
  ];

  // LES BOUTONS D UN RESULTAT DE RECHERCHE.
  //
  // Ils ne s affichent QUE si la fiche porte un profil LinkedIn et n est
  // pas deja ecartee. Sur une fiche ecartee, on ne propose rien : c est
  // exactement le geste qui ressusciterait un doublon.
  function actionsRecherche(cleBase: string, l: any) {
    const cle = cleBase + "-" + l.id;
    const occupe = partoutOccupe === cle;
    const statut = String(l.linkedin_statut || "");

    if (statut === "ecarte") {
      return (
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px", lineHeight: "1.7", margin: "9px 0 0" }}>
          Fiche écartée — aucune action proposée pour ne pas recréer un doublon.
        </p>
      );
    }

    const enAttente = statut === "invite" || statut === "invite_nu";
    const dejaAccepte = statut === "accepte" || statut === "accepte_nu" || statut === "relance";

    if (dejaAccepte) {
      return (
        <p style={{ color: VERT, fontSize: "12.5px", lineHeight: "1.7", margin: "9px 0 0" }}>
          A déjà accepté — sa fiche est dans « À écrire » ou « Messages envoyés ».
        </p>
      );
    }

    const petit: any = {
      padding: "9px 13px", borderRadius: "8px", fontSize: "12.5px",
      fontFamily: "Georgia,serif", cursor: occupe ? "wait" : "pointer",
      flex: "1 1 130px",
    };

    return (
      <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginTop: "10px" }}>
        {enAttente && (
          <button
            onClick={() => marquerDepuisRecherche(cleBase, l, statut === "invite" ? "accepte" : "accepte_nu")}
            disabled={occupe}
            style={{ ...petit, background: "rgba(0,230,118,0.15)", color: VERT, border: "1px solid rgba(0,230,118,0.45)", fontWeight: "bold" }}
          >
            ✓ A accepté
          </button>
        )}
        {!enAttente && (
          <>
            <button
              onClick={() => marquerDepuisRecherche(cleBase, l, "invite")}
              disabled={occupe || bloque}
              style={{ ...petit, background: bloque ? "rgba(255,255,255,0.06)" : "rgba(0,230,118,0.13)", color: bloque ? "rgba(255,255,255,0.3)" : VERT, border: "1px solid " + (bloque ? "rgba(255,255,255,0.15)" : "rgba(0,230,118,0.4)") }}
            >
              Invité avec note
            </button>
            <button
              onClick={() => marquerDepuisRecherche(cleBase, l, "invite_nu")}
              disabled={occupe || bloque}
              style={{ ...petit, background: bloque ? "rgba(255,255,255,0.06)" : "rgba(68,138,255,0.13)", color: bloque ? "rgba(255,255,255,0.3)" : BLEU, border: "1px solid " + (bloque ? "rgba(255,255,255,0.15)" : "rgba(68,138,255,0.4)") }}
            >
              Invité sans note
            </button>
          </>
        )}
        <button
          onClick={() => marquerDepuisRecherche(cleBase, l, "ecarte")}
          disabled={occupe}
          style={{ ...petit, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.15)", flex: "1 1 90px" }}
        >
          Écarter
        </button>
      </div>
    );
  }

  // LE BLOC « CHERCHER PARTOUT ».
  function blocPartout() {
    // Un meme dirigeant peut figurer dans plusieurs bases. On le signale :
    // c est ainsi qu on evite d inviter deux fois la meme personne.
    const compteParPersonne: any = {};
    if (partoutResultat) {
      for (const b of (partoutResultat.bases || [])) {
        for (const l of (b.lignes || [])) {
          const k = aplatir((l.dirigeant_prenom || "") + " " + (l.dirigeant_nom || ""));
          if (k.length < 3) continue;
          compteParPersonne[k] = (compteParPersonne[k] || 0) + 1;
        }
      }
    }

    return (
      <div style={{ ...CARTE, borderColor: partoutOuvert ? "rgba(68,138,255,0.45)" : "rgba(255,255,255,0.12)", padding: partoutOuvert ? "20px 22px" : "14px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ flex: "1 1 220px" }}>
            <div style={{ color: partoutOuvert ? BLEU : "rgba(255,255,255,0.7)", fontSize: "14.5px", fontWeight: "bold" }}>
              🔎 Chercher partout
            </div>
            {partoutOuvert && (
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px", marginTop: "3px", lineHeight: "1.7" }}>
                Un nom, une société, une ville, un SIREN, un téléphone. Votre file LinkedIn
                et les cinq bases de prospection sont interrogées d'un coup.
              </div>
            )}
          </div>
          <button
            onClick={() => { setPartoutOuvert(!partoutOuvert); setPartoutErreur(""); }}
            style={{ ...BOUTON, padding: "9px 18px", fontSize: "13px", color: partoutOuvert ? "rgba(255,255,255,0.5)" : BLEU, borderColor: partoutOuvert ? "rgba(255,255,255,0.18)" : "rgba(68,138,255,0.45)" }}
          >
            {partoutOuvert ? "Replier" : "Ouvrir"}
          </button>
        </div>

        {partoutOuvert && (
          <div style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
              <input
                value={partoutTerme}
                onChange={(e) => setPartoutTerme(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") chercherPartout(); }}
                placeholder="Alexandre Cocco, EDAA, Reims, 811616374…"
                style={{ ...CHAMP, flex: "1 1 240px", padding: "12px 14px" }}
              />
              <button
                onClick={() => chercherPartout()}
                disabled={partoutCharge}
                style={{ background: partoutCharge ? "rgba(255,255,255,0.06)" : BLEU, color: partoutCharge ? "rgba(255,255,255,0.4)" : "#fff", border: "none", borderRadius: "9px", padding: "12px 24px", fontSize: "14px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: partoutCharge ? "wait" : "pointer" }}
              >
                {partoutCharge ? "Recherche…" : "Chercher"}
              </button>
              {(partoutResultat || partoutTerme) && (
                <button onClick={viderPartout} style={{ ...BOUTON, padding: "12px 20px", color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.18)" }}>
                  Effacer
                </button>
              )}
            </div>

            {partoutMessage && (
              <div style={{ background: "rgba(0,230,118,0.12)", border: "1px solid rgba(0,230,118,0.4)", borderRadius: "9px", padding: "12px", margin: "12px 0 0", color: VERT, fontSize: "13px", lineHeight: "1.7" }}>
                {partoutMessage}
              </div>
            )}

            {partoutErreur && (
              <p style={{ color: "#e8836a", fontSize: "13px", lineHeight: "1.7", margin: "11px 0 0" }}>
                {partoutErreur}
              </p>
            )}

            {partoutResultat && (
              <div style={{ marginTop: "16px" }}>
                <p style={{ color: partoutResultat.total_trouve === 0 ? "#e8836a" : VERT, fontSize: "13.5px", lineHeight: "1.7", margin: "0 0 13px" }}>
                  {partoutResultat.total_trouve === 0
                    ? "Rien trouvé pour « " + partoutResultat.terme + " »."
                    : nombre(partoutResultat.total_trouve) + " résultat(s) pour « " + partoutResultat.terme + " »."}
                </p>

                {(partoutResultat.bases || []).map(function (b: any) {
                  if (!b.trouves && !b.erreur) return null;
                  return (
                    <div key={b.cle} style={{ marginBottom: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "8px", marginBottom: "8px", paddingBottom: "6px", borderBottom: "1px solid rgba(200,169,110,0.22)" }}>
                        <span style={{ color: OR, fontSize: "12.5px", letterSpacing: "1.5px" }}>
                          {String(b.titre || "").toUpperCase()}
                        </span>
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                          {b.erreur ? "lecture impossible" : nombre(b.trouves) + " trouvé(s)"}
                          {b.trouves > 20 ? " · 20 affichés" : ""}
                        </span>
                      </div>

                      {b.erreur ? (
                        <p style={{ color: "#e8836a", fontSize: "12.5px", lineHeight: "1.7", margin: 0 }}>
                          {b.erreur}
                        </p>
                      ) : (
                        (b.lignes || []).map(function (l: any) {
                          const nomComplet = ((l.dirigeant_prenom || "") + " " + (l.dirigeant_nom || "")).trim();
                          const k = aplatir(nomComplet);
                          const enDouble = k.length >= 3 && compteParPersonne[k] > 1;
                          return (
                            <div key={b.cle + "-" + l.id} style={{ padding: "11px 13px", background: "rgba(255,255,255,0.03)", border: "1px solid " + (enDouble ? "rgba(232,163,61,0.45)" : "rgba(255,255,255,0.08)"), borderRadius: "8px", marginBottom: "7px" }}>
                              <div style={{ color: "#fff", fontSize: "14.5px", fontWeight: "bold" }}>
                                {l.raison_sociale || "—"}
                              </div>
                              <div style={{ color: OR, fontSize: "13px", marginTop: "2px" }}>
                                {nomComplet || "dirigeant inconnu"}
                              </div>
                              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", marginTop: "4px", lineHeight: "1.7" }}>
                                {l.ville || "ville inconnue"}
                                {l.code_postal ? " · " + l.code_postal : ""}
                                {l.siren ? " · SIREN " + l.siren : ""}
                                {l.statut === "envoye" ? " · courriel envoyé le " + jolieDate(l.envoye_le) : ""}
                                {l.desabonne ? " · DÉSABONNÉ" : ""}
                              </div>

                              {enDouble && (
                                <div style={{ color: ORANGE, fontSize: "12px", marginTop: "6px", lineHeight: "1.7" }}>
                                  ⚠️ Ce dirigeant apparaît dans plusieurs bases — écartez le doublon
                                  pour ne pas l'inviter deux fois.
                                </div>
                              )}

                              {(l.email || l.telephone) && (
                                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginTop: "7px", fontSize: "12.5px" }}>
                                  {l.email && (
                                    <a href={"mailto:" + l.email} style={{ color: BLEU, textDecoration: "none" }}>
                                      ✉️ {l.email}
                                    </a>
                                  )}
                                  {l.telephone && (
                                    <a href={"tel:" + appelable(l.telephone)} style={{ color: BLEU, textDecoration: "none" }}>
                                      ☎️ {l.telephone}
                                    </a>
                                  )}
                                </div>
                              )}

                              {b.porte_linkedin && l.linkedin && (
                                <>
                                  <div style={{ marginTop: "8px", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                                    <a href={lien(l.linkedin)} target="_blank" rel="noreferrer"
                                      style={{ color: BLEU, fontSize: "12.5px", textDecoration: "none" }}>
                                      Ouvrir le profil LinkedIn ↗
                                    </a>
                                    <span style={{ color: l.linkedin_statut ? VERT : "rgba(255,255,255,0.35)", fontSize: "12px" }}>
                                      {l.linkedin_statut
                                        ? l.linkedin_statut + (l.linkedin_le ? " le " + jolieDate(l.linkedin_le) : "")
                                        : "jamais sollicité"}
                                    </span>
                                  </div>
                                  {actionsRecherche(b.cle, l)}
                                </>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // LA FICHE QUI VIENT D ETRE CREEE.
  function blocCreee() {
    if (!creee) return null;
    const statut = String(creee.linkedin_statut || "");
    const enAttente = statut === "invite" || statut === "invite_nu";
    return (
      <div style={{ ...CARTE, borderColor: "rgba(0,230,118,0.45)", background: "rgba(0,230,118,0.05)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
          <span style={{ color: VERT, fontSize: "12px", letterSpacing: "2px" }}>
            FICHE ENREGISTRÉE
          </span>
          <button onClick={() => setCreee(null)}
            style={{ ...BOUTON, padding: "7px 14px", fontSize: "12px", color: "rgba(255,255,255,0.45)", borderColor: "rgba(255,255,255,0.15)" }}>
            Fermer
          </button>
        </div>

        <div style={{ color: "#fff", fontSize: "17px", fontWeight: "bold" }}>
          {creee.nom || ((creee.dirigeant_prenom || "") + " " + (creee.dirigeant_nom || ""))}
        </div>
        <div style={{ color: OR, fontSize: "14px", marginTop: "2px" }}>
          {creee.raison_sociale || creee.organisme || "—"}
        </div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", marginTop: "4px" }}>
          {creee.ville || "ville inconnue"}
          {" · "}
          {statut ? statut : "en attente d'invitation"}
        </div>
        {coordonnees(creee)}

        <button
          onClick={() => { try { window.open(lien(creee.linkedin), "_blank", "noopener"); } catch (e) { } }}
          style={{ width: "100%", background: BLEU, color: "#fff", border: "none", borderRadius: "9px", padding: "13px", fontSize: "14px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: "pointer", marginTop: "12px" }}>
          Ouvrir le profil LinkedIn ↗
        </button>

        <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginTop: "9px" }}>
          {enAttente ? (
            <button onClick={() => marquerCreee(statut === "invite" ? "accepte" : "accepte_nu")} disabled={charge}
              style={{ flex: "2 1 180px", background: "rgba(0,230,118,0.15)", color: VERT, border: "1px solid rgba(0,230,118,0.45)", borderRadius: "8px", padding: "11px", fontSize: "13px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: "pointer" }}>
              ✓ A accepté
            </button>
          ) : (
            <>
              <button onClick={() => marquerCreee("invite")} disabled={charge || bloque}
                style={{ flex: "1 1 150px", background: bloque ? "rgba(255,255,255,0.06)" : "rgba(0,230,118,0.13)", color: bloque ? "rgba(255,255,255,0.3)" : VERT, border: "1px solid " + (bloque ? "rgba(255,255,255,0.15)" : "rgba(0,230,118,0.4)"), borderRadius: "8px", padding: "11px", fontSize: "13px", fontFamily: "Georgia,serif", cursor: bloque ? "not-allowed" : "pointer" }}>
                Invité avec note
              </button>
              <button onClick={() => marquerCreee("invite_nu")} disabled={charge || bloque}
                style={{ flex: "1 1 150px", background: bloque ? "rgba(255,255,255,0.06)" : "rgba(68,138,255,0.13)", color: bloque ? "rgba(255,255,255,0.3)" : BLEU, border: "1px solid " + (bloque ? "rgba(255,255,255,0.15)" : "rgba(68,138,255,0.4)"), borderRadius: "8px", padding: "11px", fontSize: "13px", fontFamily: "Georgia,serif", cursor: bloque ? "not-allowed" : "pointer" }}>
                Invité sans note
              </button>
            </>
          )}
        </div>

        {blocFiche(creee)}
      </div>
    );
  }

  function barreRecherche() {
    return (
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "9px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un nom, un organisme, une ville, une observation…"
            style={{ ...CHAMP, flex: "1 1 280px", padding: "12px 14px" }}
          />
          {recherche && (
            <button onClick={() => setRecherche("")} style={{ ...BOUTON, padding: "12px 20px" }}>
              Effacer
            </button>
          )}
        </div>
        {recherche && (
          <p style={{ color: filtrees.length === 0 ? "#e8836a" : "rgba(255,255,255,0.5)", fontSize: "13px", margin: "9px 0 0" }}>
            {filtrees.length === 0
              ? "Aucune fiche ne correspond à « " + recherche + " »."
              : filtrees.length + " fiche(s) sur " + lignes.length}
          </p>
        )}
      </div>
    );
  }

  function coordonnees(l: any) {
    const bouts: any[] = [];
    if (l.email) {
      bouts.push(
        <a key="m" href={"mailto:" + l.email} style={{ color: BLEU, textDecoration: "none" }}>
          ✉️ {l.email}
        </a>
      );
    }
    if (l.telephone) {
      bouts.push(
        <a key="t" href={"tel:" + appelable(l.telephone)} style={{ color: BLEU, textDecoration: "none" }}>
          ☎️ {l.telephone}
        </a>
      );
    }
    if (l.site_web) {
      bouts.push(
        <a key="s" href={lien(l.site_web)} target="_blank" rel="noreferrer" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>
          🌐 {l.site_web}
        </a>
      );
    }
    if (bouts.length === 0) return null;
    return (
      <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginTop: "7px", fontSize: "12.5px" }}>
        {bouts}
      </div>
    );
  }

  function blocFiche(l: any) {
    const cle = cleDe(l);
    const ouvert = depliee === cle;
    const vals = brouillon[cle] || {};
    const occupe = enregistre === cle;
    const aNote = String(l.notes || "").trim().length > 0;
    const lit = litPour === cle;

    if (!ouvert) {
      return (
        <div style={{ marginTop: "12px" }}>
          {aNote && (
            <div style={{ background: "rgba(200,169,110,0.07)", border: "1px solid rgba(200,169,110,0.22)", borderRadius: "8px", padding: "11px 13px", marginBottom: "9px" }}>
              <div style={{ color: OR, fontSize: "11.5px", letterSpacing: "1.5px", marginBottom: "5px" }}>
                VOTRE OBSERVATION
              </div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "13.5px", lineHeight: "1.75", whiteSpace: "pre-wrap" }}>
                {l.notes}
              </div>
            </div>
          )}
          <button
            onClick={() => deplier(l)}
            style={{ ...BOUTON, width: "100%", padding: "10px", fontSize: "13px", color: aNote ? OR : "rgba(255,255,255,0.55)", borderColor: aNote ? BOUTON.border : "rgba(255,255,255,0.18)" }}
          >
            Voir la fiche complète
          </button>
        </div>
      );
    }

    const champs = champsDe(l.base);

    return (
      <div style={{ marginTop: "12px", padding: "16px", background: "rgba(200,169,110,0.05)", border: "1px solid rgba(200,169,110,0.3)", borderRadius: "9px" }}>
        <div style={{ color: OR, fontSize: "12px", letterSpacing: "2px", marginBottom: "14px" }}>
          FICHE COMPLÈTE — TOUT EST MODIFIABLE
        </div>

        <div style={{ marginBottom: "16px", padding: "13px", background: "rgba(68,138,255,0.07)", border: "1px solid rgba(68,138,255,0.3)", borderRadius: "8px" }}>
          <button
            onClick={() => { setCibleFiche(l); if (champFiche.current) champFiche.current.click(); }}
            disabled={lit}
            style={{ width: "100%", background: lit ? "rgba(255,255,255,0.06)" : "rgba(68,138,255,0.18)", color: lit ? "rgba(255,255,255,0.4)" : BLEU, border: "1px solid rgba(68,138,255,0.45)", borderRadius: "8px", padding: "12px", fontSize: "13.5px", fontFamily: "Georgia,serif", cursor: lit ? "wait" : "pointer" }}
          >
            {lit ? "Lecture en cours…" : "📷 Compléter depuis une capture LinkedIn"}
          </button>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", lineHeight: "1.7", margin: "9px 0 0" }}>
            Seuls les champs <strong>vides</strong> seront remplis — ce que vous avez déjà
            vérifié ne sera pas écrasé. L'observation s'ajoute à la suite de l'existante.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {champs.map(function (c) {
            return (
              <div key={c.cle} style={{ flex: c.large ? "1 1 100%" : "1 1 180px" }}>
                <span style={LIBELLE}>{c.nom}</span>
                <input
                  value={vals[c.cle] !== undefined ? vals[c.cle] : ""}
                  onChange={(e) => poserChamp(cle, c.cle, e.target.value)}
                  style={{ ...CHAMP, marginBottom: "11px" }}
                />
              </div>
            );
          })}
        </div>

        <span style={LIBELLE}>Votre observation</span>
        <textarea
          value={vals.notes !== undefined ? vals.notes : ""}
          onChange={(e) => poserChamp(cle, "notes", e.target.value)}
          rows={4}
          placeholder="Dirige trois centres en Normandie. Rappeler en septembre, en vacances jusqu'au 5."
          style={{ ...CHAMP, marginBottom: "13px" }}
        />

        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", lineHeight: "1.7", margin: "0 0 13px" }}>
          Corriger une coordonnée ne fait rien avancer dans le parcours et ne consomme
          aucune invitation.
        </p>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => enregistrerFiche(l)}
            disabled={occupe}
            style={{ flex: "2 1 200px", background: "rgba(200,169,110,0.2)", color: OR, border: "1px solid rgba(200,169,110,0.5)", borderRadius: "8px", padding: "12px", fontSize: "13.5px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: occupe ? "wait" : "pointer" }}
          >
            {occupe ? "Enregistrement…" : "Enregistrer la fiche"}
          </button>
          <button
            onClick={() => setDepliee("")}
            style={{ ...BOUTON, flex: "1 1 110px", padding: "12px", fontSize: "13.5px", color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.18)" }}
          >
            Fermer
          </button>
        </div>
      </div>
    );
  }

  const enSerie = serie !== null && serie.length > 0 && rang < serie.length;
  const courante = enSerie ? serie![rang] : null;

  return (
    <div style={{ backgroundColor: "#050508", minHeight: "100vh", color: "#fff", fontFamily: "Georgia, serif" }}>

      {/* LES DEUX CHAMPS DE FICHIER, invisibles, declenches par les boutons. */}
      <input
        ref={champAjout}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files && e.target.files[0];
          if (f) lireCapture(f, "ajout");
          e.target.value = "";
        }}
      />
      <input
        ref={champFiche}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files && e.target.files[0];
          if (f && cibleFiche) lireCapture(f, cleDe(cibleFiche), cibleFiche);
          e.target.value = "";
        }}
      />

      <div style={{ background: "linear-gradient(135deg,#0a0a1a,#1a1a2e)", padding: "26px 20px" }}>
        <a href="/admin/crm" style={{ color: OR, fontSize: "13px", textDecoration: "none" }}>
          ← Retour au CRM
        </a>
        <h1 style={{ color: OR, margin: "13px 0 4px", fontSize: "23px" }}>Prospection LinkedIn</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: "13px" }}>
          Enregistrer · inviter · suivre · écrire · relancer
        </p>
      </div>

      <div style={{ display: "flex", gap: "6px", padding: "14px 20px", background: "rgba(255,255,255,0.03)", overflowX: "auto" }}>
        {ONGLETS.map(function (o) {
          const actif = onglet === o.id;
          return (
            <button key={o.id} onClick={() => { setOnglet(o.id); setRecherche(""); quitterSerie(); }}
              style={{
                padding: "9px 17px", borderRadius: "8px", border: "none", cursor: "pointer",
                whiteSpace: "nowrap", fontSize: "13.5px", fontFamily: "Georgia,serif",
                background: actif ? OR : "rgba(255,255,255,0.08)",
                color: actif ? "#050508" : "#fff",
                fontWeight: actif ? "bold" : "normal",
              }}>
              {o.nom}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "22px 20px", maxWidth: "800px", margin: "0 auto" }}>

        {/* ---------- CHERCHER PARTOUT — au-dessus de tout le reste ---------- */}
        {!enSerie && blocPartout()}

        {/* ---------- LES COMPTEURS ---------- */}
        {compteurs && !enSerie && (
          <div style={{ ...CARTE, borderColor: bloque ? "rgba(232,131,106,0.5)" : "rgba(68,138,255,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
              <div>
                <div style={{ color: plafondJour ? "#e8836a" : BLEU, fontSize: "19px", fontWeight: "bold" }}>
                  {nombre(compteurs.jour)} / {compteurs.plafond_jour}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11.5px" }}>aujourd'hui</div>
              </div>
              <div>
                <div style={{ color: plafondSemaine ? "#e8836a" : BLEU, fontSize: "19px", fontWeight: "bold" }}>
                  {nombre(compteurs.semaine)} / {compteurs.plafond_semaine}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11.5px" }}>cette semaine</div>
              </div>
              <div>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "19px", fontWeight: "bold" }}>
                  {nombre(compteurs.en_attente)}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11.5px" }}>sans réponse</div>
              </div>
              <div>
                <div style={{ color: VERT, fontSize: "19px", fontWeight: "bold" }}>
                  {nombre(compteurs.acceptes)}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11.5px" }}>acceptées</div>
              </div>
              <div>
                <div style={{ color: ORANGE, fontSize: "19px", fontWeight: "bold" }}>
                  {nombre(compteurs.relances)}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11.5px" }}>messages envoyés</div>
              </div>
              <div>
                <div style={{ color: OR, fontSize: "19px", fontWeight: "bold" }}>
                  {compteurs.taux_global === null ? "—" : compteurs.taux_global + " %"}
                </div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11.5px" }}>taux d'acceptation</div>
              </div>
            </div>

            {compteurs.en_file > 0 && (
              <p style={{ color: BLEU, fontSize: "13px", lineHeight: "1.7", margin: "13px 0 0" }}>
                {nombre(compteurs.en_file)} profil(s) enregistré(s) en attente d'invitation.
              </p>
            )}

            {bloque && (
              <p style={{ color: "#e8836a", fontSize: "13px", lineHeight: "1.7", margin: "13px 0 0" }}>
                {plafondJour
                  ? "Plafond du jour atteint (" + compteurs.plafond_jour + "). Vous pouvez continuer à enregistrer des profils : ils vous attendront demain."
                  : "Plafond de la semaine atteint (" + compteurs.plafond_semaine + "). Laissez passer quelques jours."}
              </p>
            )}
          </div>
        )}

        {message && (
          <div style={{ background: "rgba(0,230,118,0.12)", border: "1px solid rgba(0,230,118,0.4)", borderRadius: "9px", padding: "13px", marginBottom: "14px", color: VERT, fontSize: "13.5px", lineHeight: "1.7" }}>
            {message}
          </div>
        )}

        {erreur && (
          <div style={{ background: "rgba(232,131,106,0.12)", border: "1px solid rgba(232,131,106,0.4)", borderRadius: "9px", padding: "13px", marginBottom: "14px", color: "#e8836a", fontSize: "13.5px", lineHeight: "1.7" }}>
            {erreur}
          </div>
        )}

        {/* LA FICHE QUI VIENT D ETRE CREEE — visible partout. */}
        {!enSerie && blocCreee()}

        {/* ═══════════ ONGLET INVITER ═══════════ */}
        {onglet === "inviter" && (
          <>
            <div style={{ ...CARTE, borderColor: ajout ? "rgba(68,138,255,0.45)" : CARTE.border }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ flex: "1 1 240px" }}>
                  <div style={{ color: BLEU, fontSize: "15px", fontWeight: "bold" }}>
                    Un profil croisé sur LinkedIn ?
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px", marginTop: "3px", lineHeight: "1.7" }}>
                    Photographiez-le, les champs se remplissent seuls.
                  </div>
                </div>
                <button onClick={() => { setAjout(!ajout); setErreur(""); setMessage(""); }}
                  style={{ ...BOUTON, color: BLEU, borderColor: "rgba(68,138,255,0.45)" }}>
                  {ajout ? "Annuler" : "Ajouter un profil"}
                </button>
              </div>

              {ajout && (
                <div style={{ marginTop: "18px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>

                  <button
                    onClick={() => { if (champAjout.current) champAjout.current.click(); }}
                    disabled={litPour === "ajout"}
                    style={{
                      width: "100%",
                      background: litPour === "ajout" ? "rgba(255,255,255,0.06)" : BLEU,
                      color: litPour === "ajout" ? "rgba(255,255,255,0.4)" : "#fff",
                      border: "none", borderRadius: "9px", padding: "15px",
                      fontSize: "15px", fontWeight: "bold", fontFamily: "Georgia,serif",
                      cursor: litPour === "ajout" ? "wait" : "pointer", marginBottom: "10px",
                    }}
                  >
                    {litPour === "ajout" ? "Lecture de la capture…" : "📷 Lire une capture du profil"}
                  </button>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", lineHeight: "1.75", margin: "0 0 18px" }}>
                    Photographiez le haut du profil LinkedIn : le nom, l'organisme, la ville et
                    l'observation seront remplis automatiquement. <strong>L'adresse du profil
                    est rarement visible sur une capture</strong> — sur LinkedIn, touchez les
                    trois points puis « Copier le lien vers le profil », et collez-la ci-dessous.
                  </p>

                  <span style={LIBELLE}>Nom du contact *</span>
                  <input value={aNom} onChange={(e) => setANom(e.target.value)}
                    placeholder="Sarah Dupont" style={{ ...CHAMP, marginBottom: "12px" }} />

                  <span style={LIBELLE}>Adresse du profil LinkedIn *</span>
                  <input value={aLien} onChange={(e) => setALien(e.target.value)}
                    placeholder="https://www.linkedin.com/in/sarah-dupont"
                    style={{ ...CHAMP, marginBottom: "12px", borderColor: aLien ? "rgba(200,169,110,0.3)" : "rgba(232,163,61,0.5)" }} />

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 200px" }}>
                      <span style={LIBELLE}>Son organisme</span>
                      <input value={aOrganisme} onChange={(e) => setAOrganisme(e.target.value)}
                        placeholder="Formation Conseil" style={{ ...CHAMP, marginBottom: "12px" }} />
                    </div>
                    <div style={{ flex: "1 1 140px" }}>
                      <span style={LIBELLE}>Ville</span>
                      <input value={aVille} onChange={(e) => setAVille(e.target.value)}
                        placeholder="Lyon" style={{ ...CHAMP, marginBottom: "12px" }} />
                    </div>
                  </div>

                  <span style={LIBELLE}>Ce que vous voulez retenir</span>
                  <textarea value={aNotes} onChange={(e) => setANotes(e.target.value)} rows={4}
                    placeholder="Croisé sur un post à propos de Qualiopi."
                    style={{ ...CHAMP, marginBottom: "16px" }} />

                  {/* 🚨 LE BOUTON QUI MANQUAIT. Toujours actif, meme quand le
                      plafond du jour est atteint. */}
                  <button onClick={() => ajouter("file")} disabled={charge}
                    style={{ width: "100%", background: "rgba(200,169,110,0.2)", color: OR, border: "1px solid rgba(200,169,110,0.5)", borderRadius: "9px", padding: "15px", fontSize: "14.5px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: "pointer", marginBottom: "8px" }}>
                    💾 Enregistrer seulement — je l'inviterai plus tard
                  </button>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", lineHeight: "1.75", margin: "0 0 18px" }}>
                    La fiche est rangée dans « En attente d'invitation ». <strong>Aucune unité
                    de quota n'est consommée</strong> — vous l'inviterez quand vous voudrez.
                  </p>

                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12.5px", lineHeight: "1.75", margin: "0 0 12px" }}>
                      Ou, si vous <strong>venez de l'inviter sur LinkedIn</strong>, dites laquelle
                      des deux — la fiche entrera directement dans « Mes invitations ».
                    </p>
                    <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
                      <button onClick={() => ajouter("invite")} disabled={charge || bloque}
                        style={{ flex: "1 1 200px", background: bloque ? "rgba(255,255,255,0.06)" : "rgba(0,230,118,0.15)", color: bloque ? "rgba(255,255,255,0.3)" : VERT, border: "1px solid " + (bloque ? "rgba(255,255,255,0.15)" : "rgba(0,230,118,0.45)"), borderRadius: "9px", padding: "14px", fontSize: "13.5px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: bloque ? "not-allowed" : "pointer" }}>
                        ✓ Invité avec une note
                      </button>
                      <button onClick={() => ajouter("invite_nu")} disabled={charge || bloque}
                        style={{ flex: "1 1 200px", background: bloque ? "rgba(255,255,255,0.06)" : "rgba(68,138,255,0.15)", color: bloque ? "rgba(255,255,255,0.3)" : BLEU, border: "1px solid " + (bloque ? "rgba(255,255,255,0.15)" : "rgba(68,138,255,0.45)"), borderRadius: "9px", padding: "14px", fontSize: "13.5px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: bloque ? "not-allowed" : "pointer" }}>
                        ✓ Invité sans note
                      </button>
                    </div>
                    {bloque && (
                      <p style={{ color: ORANGE, fontSize: "12.5px", lineHeight: "1.7", margin: "10px 0 0" }}>
                        Plafond atteint — utilisez « Enregistrer seulement » ci-dessus.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              {BASES.map(function (b) {
                const actif = base === b.cle;
                return (
                  <button key={b.cle} onClick={() => setBase(b.cle)}
                    style={{
                      ...BOUTON, borderRadius: "20px", padding: "8px 16px", fontSize: "13px",
                      background: actif ? OR : "rgba(255,255,255,0.06)",
                      color: actif ? "#050508" : "rgba(255,255,255,0.6)",
                      border: actif ? "none" : BOUTON.border,
                      fontWeight: actif ? "bold" : "normal",
                    }}>
                    {b.nom}
                  </button>
                );
              })}
            </div>

            {charge && !fiche ? (
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Chargement…</p>
            ) : epuise || !fiche ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "15px", lineHeight: "1.8", margin: 0 }}>
                  Plus aucun profil à inviter dans cette base. Essayez-en une autre, ou
                  enrichissez de nouvelles fiches pour en récupérer.
                </p>
              </div>
            ) : (
              <>
                <div style={CARTE}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <div style={{ color: "#fff", fontSize: "19px", fontWeight: "bold", marginBottom: "4px" }}>
                        {(fiche.dirigeant_prenom || "") + " " + (fiche.dirigeant_nom || "")}
                      </div>
                      <div style={{ color: OR, fontSize: "15px", marginBottom: "9px" }}>
                        {fiche.raison_sociale || "—"}
                      </div>
                    </div>
                    <div style={{ color: OR, fontSize: "13px" }}>{nombre(restant)} restantes</div>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", lineHeight: "1.8" }}>
                    {fiche.ville || "ville inconnue"}
                    {fiche.code_postal ? " · " + fiche.code_postal : ""}
                    {fiche.siren ? " · SIREN " + fiche.siren : ""}
                  </div>
                  {coordonnees(fiche)}
                </div>

                <div style={CARTE}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                    <span style={{ color: OR, fontSize: "12px", letterSpacing: "2px" }}>1. SI VOUS METTEZ UNE NOTE, COPIEZ-LA</span>
                    <span style={{ color: trop ? "#e8836a" : "rgba(255,255,255,0.4)", fontSize: "12px" }}>
                      {texte.length} / {LIMITE_NOTE}
                    </span>
                  </div>
                  <textarea value={texte} onChange={(e) => setTexte(e.target.value)} rows={5}
                    style={{ ...CHAMP, borderColor: trop ? "rgba(232,131,106,0.6)" : "rgba(200,169,110,0.3)" }} />
                  {trop && (
                    <p style={{ color: "#e8836a", fontSize: "12.5px", margin: "8px 0 0", lineHeight: "1.6" }}>
                      Au-delà de {LIMITE_NOTE} caractères, LinkedIn retire le bouton « Ajouter une note » en compte gratuit.
                    </p>
                  )}
                  <button onClick={() => copier(texte, "note")} disabled={trop}
                    style={{ ...BOUTON, width: "100%", marginTop: "12px", opacity: trop ? 0.4 : 1, background: copie === "note" ? "rgba(0,230,118,0.15)" : BOUTON.background, color: copie === "note" ? VERT : OR, borderColor: copie === "note" ? "rgba(0,230,118,0.4)" : BOUTON.border }}>
                    {copie === "note" ? "✓ Copié" : "Copier le mot"}
                  </button>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", lineHeight: "1.7", margin: "10px 0 0" }}>
                    Les notes personnalisées sont plafonnées à quelques-unes par mois en compte
                    gratuit. Sans note, l'invitation part quand même — et le vrai message vient
                    après l'acceptation.
                  </p>
                </div>

                <div style={CARTE}>
                  <p style={{ color: OR, fontSize: "12px", letterSpacing: "2px", margin: "0 0 12px" }}>
                    2. OUVREZ LE PROFIL ET INVITEZ SUR LINKEDIN
                  </p>
                  <button onClick={() => ouvrirProfil(fiche)}
                    style={{ width: "100%", background: vu ? "rgba(255,255,255,0.06)" : BLEU, color: vu ? "rgba(255,255,255,0.6)" : "#fff", border: vu ? "1px solid rgba(255,255,255,0.2)" : "none", borderRadius: "9px", padding: "15px", fontSize: "15px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: "pointer" }}>
                    {vu ? "Rouvrir le profil" : "Ouvrir le profil LinkedIn"}
                  </button>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", lineHeight: "1.75", margin: "12px 0 0" }}>
                    Ce bouton n'enregistre rien — vous pouvez regarder et revenir sans conséquence.
                    Sur LinkedIn : <strong>⋯</strong> puis <strong>Se connecter</strong>.
                  </p>
                </div>

                <div style={{ ...CARTE, borderColor: vu ? "rgba(0,230,118,0.35)" : "rgba(200,169,110,0.2)" }}>
                  <p style={{ color: OR, fontSize: "12px", letterSpacing: "2px", margin: "0 0 12px" }}>
                    3. DE RETOUR ICI — QU'AVEZ-VOUS ENVOYÉ ?
                  </p>
                  <div style={{ display: "flex", gap: "9px", flexWrap: "wrap", marginBottom: "9px" }}>
                    <button onClick={() => marquer(fiche, "invite", base)} disabled={charge || bloque}
                      style={{ flex: "1 1 200px", background: bloque ? "rgba(255,255,255,0.06)" : "rgba(0,230,118,0.15)", color: bloque ? "rgba(255,255,255,0.3)" : VERT, border: "1px solid " + (bloque ? "rgba(255,255,255,0.15)" : "rgba(0,230,118,0.45)"), borderRadius: "9px", padding: "15px", fontSize: "14px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: bloque ? "not-allowed" : "pointer" }}>
                      ✓ Envoyée avec la note
                    </button>
                    <button onClick={() => marquer(fiche, "invite_nu", base)} disabled={charge || bloque}
                      style={{ flex: "1 1 200px", background: bloque ? "rgba(255,255,255,0.06)" : "rgba(68,138,255,0.15)", color: bloque ? "rgba(255,255,255,0.3)" : BLEU, border: "1px solid " + (bloque ? "rgba(255,255,255,0.15)" : "rgba(68,138,255,0.45)"), borderRadius: "9px", padding: "15px", fontSize: "14px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: bloque ? "not-allowed" : "pointer" }}>
                      ✓ Envoyée sans note
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: "9px", flexWrap: "wrap" }}>
                    <button onClick={() => marquer(fiche, "ecarte", base)} disabled={charge}
                      style={{ ...BOUTON, flex: "1 1 150px", padding: "13px", fontSize: "13.5px", color: "rgba(255,255,255,0.55)", borderColor: "rgba(255,255,255,0.18)" }}>
                      Écarter
                    </button>
                    <button onClick={chargerSuivante} disabled={charge}
                      style={{ ...BOUTON, flex: "1 1 150px", padding: "13px", fontSize: "13.5px", color: "rgba(255,255,255,0.4)", borderColor: "rgba(255,255,255,0.12)" }}>
                      Passer
                    </button>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "12.5px", lineHeight: "1.75", margin: "12px 0 0" }}>
                    <strong>Écarter</strong> retire la fiche définitivement, <strong>Passer</strong> ne
                    touche à rien.
                  </p>
                </div>
              </>
            )}
          </>
        )}

        {/* ═══════════ ONGLET EN ATTENTE D'INVITATION ═══════════ */}
        {onglet === "file" && (
          <>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", lineHeight: "1.8", margin: "0 0 16px" }}>
              Les profils que vous avez enregistrés sans les inviter. Ouvrez le profil, envoyez
              votre demande sur LinkedIn, puis marquez-la ici.
            </p>

            {lignes.length > 0 && barreRecherche()}

            {charge ? (
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Chargement…</p>
            ) : lignes.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.8", margin: 0 }}>
                  Aucun profil en attente. Ceux que vous enregistrez sans les inviter
                  apparaîtront ici.
                </p>
              </div>
            ) : (
              filtrees.map(function (l) {
                return (
                  <div key={cleDe(l)} style={{ ...CARTE, borderColor: "rgba(68,138,255,0.3)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ flex: "1 1 240px" }}>
                        <div style={{ color: "#fff", fontSize: "15.5px", fontWeight: "bold" }}>
                          {l.nom || ((l.dirigeant_prenom || "") + " " + (l.dirigeant_nom || ""))}
                        </div>
                        <div style={{ color: OR, fontSize: "13.5px", marginTop: "2px" }}>
                          {l.raison_sociale || "—"}
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", marginTop: "4px" }}>
                          {l.ville || ""}
                        </div>
                        {coordonnees(l)}
                      </div>
                    </div>

                    {blocFiche(l)}

                    <button
                      onClick={() => { try { window.open(lien(l.linkedin), "_blank", "noopener"); } catch (e) { } }}
                      style={{ width: "100%", background: BLEU, color: "#fff", border: "none", borderRadius: "9px", padding: "14px", fontSize: "14.5px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: "pointer", marginTop: "12px" }}>
                      Ouvrir le profil et inviter ↗
                    </button>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "9px" }}>
                      <button onClick={() => marquer(l, "invite")} disabled={charge || bloque}
                        style={{ flex: "1 1 160px", background: bloque ? "rgba(255,255,255,0.06)" : "rgba(0,230,118,0.13)", color: bloque ? "rgba(255,255,255,0.3)" : VERT, border: "1px solid " + (bloque ? "rgba(255,255,255,0.15)" : "rgba(0,230,118,0.4)"), borderRadius: "8px", padding: "11px", fontSize: "13.5px", fontFamily: "Georgia,serif", cursor: bloque ? "not-allowed" : "pointer" }}>
                        ✓ Invité avec note
                      </button>
                      <button onClick={() => marquer(l, "invite_nu")} disabled={charge || bloque}
                        style={{ flex: "1 1 160px", background: bloque ? "rgba(255,255,255,0.06)" : "rgba(68,138,255,0.13)", color: bloque ? "rgba(255,255,255,0.3)" : BLEU, border: "1px solid " + (bloque ? "rgba(255,255,255,0.15)" : "rgba(68,138,255,0.4)"), borderRadius: "8px", padding: "11px", fontSize: "13.5px", fontFamily: "Georgia,serif", cursor: bloque ? "not-allowed" : "pointer" }}>
                        ✓ Invité sans note
                      </button>
                      <button onClick={() => marquer(l, "ecarte")} disabled={charge}
                        style={{ ...BOUTON, flex: "1 1 120px", padding: "11px", fontSize: "13px", color: "rgba(255,255,255,0.45)", borderColor: "rgba(255,255,255,0.15)" }}>
                        Écarter
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* ═══════════ ONGLET MES INVITATIONS ═══════════ */}
        {onglet === "attente" && (
          <>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", lineHeight: "1.8", margin: "0 0 16px" }}>
              Les invitations parties, en attente de réponse. Quand LinkedIn vous notifie une
              acceptation, marquez-la ici : la fiche passera dans « À écrire ».
            </p>

            {lignes.length > 0 && barreRecherche()}

            {charge ? (
              <p style={{ color: "rgba(255,255,255,0.5)" }}>Chargement…</p>
            ) : lignes.length === 0 ? (
              <div style={CARTE}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.8", margin: 0 }}>
                  Aucune invitation en attente. Elles apparaîtront ici dès que vous en aurez envoyé.
                </p>
              </div>
            ) : (
              filtrees.map(function (l) {
                const j = joursDepuis(l.linkedin_le);
                const note = avecNoteDe(l);
                return (
                  <div key={cleDe(l)} style={CARTE}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ flex: "1 1 240px" }}>
                        <div style={{ color: "#fff", fontSize: "15.5px", fontWeight: "bold" }}>
                          {(l.dirigeant_prenom || "") + " " + (l.dirigeant_nom || "")}
                        </div>
                        <div style={{ color: OR, fontSize: "13.5px", marginTop: "2px" }}>
                          {l.raison_sociale || "—"}
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", marginTop: "4px" }}>
                          {l.ville ? l.ville + " · " : ""}
                          {jolieDate(l.linkedin_le)}
                          {j !== null ? " · il y a " + j + " jour" + (j > 1 ? "s" : "") : ""}
                          <span style={{ color: note ? OR : "rgba(255,255,255,0.3)" }}>
                            {note ? " · avec note" : " · sans note"}
                          </span>
                        </div>
                        {coordonnees(l)}
                      </div>
                      <a href={lien(l.linkedin)} target="_blank" rel="noreferrer"
                        style={{ color: BLEU, fontSize: "12.5px", textDecoration: "none", alignSelf: "center" }}>
                        Voir le profil ↗
                      </a>
                    </div>

                    {blocFiche(l)}

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                      <button onClick={() => marquer(l, note ? "accepte" : "accepte_nu")} disabled={charge}
                        style={{ flex: "1 1 150px", background: "rgba(0,230,118,0.13)", color: VERT, border: "1px solid rgba(0,230,118,0.4)", borderRadius: "8px", padding: "11px", fontSize: "13.5px", fontFamily: "Georgia,serif", cursor: "pointer" }}>
                        ✓ A accepté
                      </button>
                      <button onClick={() => marquer(l, "refuse")} disabled={charge}
                        style={{ ...BOUTON, flex: "1 1 150px", padding: "11px", fontSize: "13.5px", color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.18)" }}>
                        Sans suite
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {/* ═══════════ ONGLETS À ÉCRIRE ET MESSAGES ENVOYÉS ═══════════ */}
        {(onglet === "relancer" || onglet === "envoyes") && (
          <>
            {enSerie && courante ? (
              <>
                <div style={{ ...CARTE, borderColor: "rgba(0,230,118,0.45)", background: "#12121f" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
                    <span style={{ color: VERT, fontSize: "12px", letterSpacing: "2px" }}>
                      {onglet === "envoyes" ? "SECONDE RELANCE" : "SÉRIE EN COURS"} · {rang + 1} / {serie!.length}
                    </span>
                    <button onClick={quitterSerie} style={{ ...BOUTON, padding: "8px 16px", fontSize: "12.5px", color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.18)" }}>
                      Quitter la série
                    </button>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "4px", height: "5px", overflow: "hidden", marginBottom: "18px" }}>
                    <div style={{ background: VERT, height: "100%", width: Math.round((rang / serie!.length) * 100) + "%" }} />
                  </div>

                  <div style={{ color: "#fff", fontSize: "20px", fontWeight: "bold", marginBottom: "3px" }}>
                    {(courante.dirigeant_prenom || "") + " " + (courante.dirigeant_nom || "")}
                  </div>
                  <div style={{ color: OR, fontSize: "15px", marginBottom: "4px" }}>
                    {courante.raison_sociale || "—"}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
                    {courante.ville || ""}
                  </div>
                  {coordonnees(courante)}

                  {courante.notes && (
                    <div style={{ background: "rgba(200,169,110,0.07)", border: "1px solid rgba(200,169,110,0.22)", borderRadius: "8px", padding: "11px 13px", marginTop: "13px" }}>
                      <div style={{ color: OR, fontSize: "11.5px", letterSpacing: "1.5px", marginBottom: "5px" }}>
                        VOTRE OBSERVATION
                      </div>
                      <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "13.5px", lineHeight: "1.75", whiteSpace: "pre-wrap" }}>
                        {courante.notes}
                      </div>
                    </div>
                  )}
                </div>

                <div style={CARTE}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "9px", flexWrap: "wrap", gap: "8px" }}>
                    <span style={{ color: OR, fontSize: "12px", letterSpacing: "2px" }}>
                      LE MESSAGE, DÉJÀ AU NOM DE {String(courante.dirigeant_prenom || "CE CONTACT").toUpperCase()}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "12px" }}>
                      {texteSerie.length} caractères
                    </span>
                  </div>
                  <textarea value={texteSerie} onChange={(e) => setTexteSerie(e.target.value)} rows={13} style={CHAMP} />
                </div>

                <div style={{ ...CARTE, borderColor: ouvertSerie ? "rgba(0,230,118,0.4)" : CARTE.border }}>
                  <button
                    onClick={() => copierEtOuvrir(courante)}
                    style={{
                      width: "100%",
                      background: copieSerie ? "rgba(0,230,118,0.15)" : BLEU,
                      color: copieSerie ? VERT : "#fff",
                      border: copieSerie ? "1px solid rgba(0,230,118,0.45)" : "none",
                      borderRadius: "9px", padding: "16px", fontSize: "15.5px",
                      fontWeight: "bold", fontFamily: "Georgia,serif", cursor: "pointer",
                    }}
                  >
                    {copieSerie ? "✓ Copié — collez dans la messagerie" : "Copier le message et ouvrir la messagerie"}
                  </button>

                  {blocFiche(courante)}

                  <div style={{ display: "flex", gap: "9px", flexWrap: "wrap", marginTop: "16px" }}>
                    <button onClick={() => envoyeEtSuivant(courante)} disabled={charge}
                      style={{ flex: "2 1 220px", background: "rgba(0,230,118,0.15)", color: VERT, border: "1px solid rgba(0,230,118,0.45)", borderRadius: "9px", padding: "15px", fontSize: "14.5px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: "pointer" }}>
                      ✓ Envoyé — au suivant
                    </button>
                    <button onClick={passerSuivant} disabled={charge}
                      style={{ ...BOUTON, flex: "1 1 130px", padding: "15px", fontSize: "13.5px", color: "rgba(255,255,255,0.45)", borderColor: "rgba(255,255,255,0.15)" }}>
                      Passer
                    </button>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", lineHeight: "1.7", margin: "12px 0 0" }}>
                    <strong>Passer</strong> laisse la fiche dans la liste pour plus tard.
                    {faits > 0 ? " " + faits + " message(s) envoyé(s) dans cette série." : ""}
                  </p>
                </div>
              </>
            ) : (
              <>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13.5px", lineHeight: "1.8", margin: "0 0 16px" }}>
                  {onglet === "envoyes"
                    ? "Les personnes à qui vous avez déjà écrit, de la plus ancienne à la plus récente. Celles qui attendent depuis plus de " + JOURS_AVANT_RELANCE + " jours sont signalées."
                    : "Ces personnes ont accepté votre invitation et n'ont pas encore reçu de message. La messagerie est libre : aucune limite, aucun quota."}
                </p>

                {lignes.length > 0 && barreRecherche()}

                {filtrees.length > 1 && (
                  <div style={{ ...CARTE, borderColor: "rgba(0,230,118,0.4)", background: "rgba(0,230,118,0.05)" }}>
                    <div style={{ color: VERT, fontSize: "15px", fontWeight: "bold", marginBottom: "5px" }}>
                      {onglet === "envoyes" ? "Relancer, l'un après l'autre" : "Écrire à tous, l'un après l'autre"}
                    </div>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", lineHeight: "1.75", margin: "0 0 14px" }}>
                      {filtrees.length} personne(s). Le message est préparé à chaque prénom, copié
                      d'un clic, et la messagerie s'ouvre.
                    </p>
                    <button onClick={demarrerSerie}
                      style={{ width: "100%", background: VERT, color: "#050508", border: "none", borderRadius: "9px", padding: "15px", fontSize: "15px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: "pointer" }}>
                      Démarrer la série — {filtrees.length} message(s)
                    </button>
                  </div>
                )}

                {charge ? (
                  <p style={{ color: "rgba(255,255,255,0.5)" }}>Chargement…</p>
                ) : lignes.length === 0 ? (
                  <div style={CARTE}>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "15px", lineHeight: "1.8", margin: 0 }}>
                      {onglet === "envoyes"
                        ? "Aucun message envoyé pour l'instant."
                        : "Personne à qui écrire pour l'instant. Marquez vos acceptations dans « Mes invitations »."}
                    </p>
                  </div>
                ) : (
                  filtrees.map(function (l) {
                    const active = ouverte === cleDe(l);
                    const jr = onglet === "envoyes" ? joursDepuis(l.linkedin_relance_le) : null;
                    const aRelancer = jr !== null && jr >= JOURS_AVANT_RELANCE;
                    return (
                      <div key={cleDe(l)} style={{ ...CARTE, borderColor: active ? "rgba(0,230,118,0.4)" : aRelancer ? "rgba(232,163,61,0.45)" : CARTE.border }}>
                        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                          <div style={{ flex: "1 1 240px" }}>
                            <div style={{ color: "#fff", fontSize: "15.5px", fontWeight: "bold" }}>
                              {(l.dirigeant_prenom || "") + " " + (l.dirigeant_nom || "")}
                            </div>
                            <div style={{ color: OR, fontSize: "13.5px", marginTop: "2px" }}>
                              {l.raison_sociale || "—"}
                            </div>
                            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "12.5px", marginTop: "4px" }}>
                              {l.ville || ""}
                              {onglet === "envoyes" && l.linkedin_relance_le ? (
                                <span>
                                  {l.ville ? " · " : ""}
                                  écrit le {jolieDate(l.linkedin_relance_le)}
                                  {jr !== null ? " · il y a " + jr + " jour" + (jr > 1 ? "s" : "") : ""}
                                </span>
                              ) : ""}
                            </div>
                            {aRelancer && (
                              <div style={{ color: ORANGE, fontSize: "12.5px", marginTop: "6px", fontWeight: "bold" }}>
                                Sans réponse depuis {jr} jours — une seconde relance se justifie
                              </div>
                            )}
                            {coordonnees(l)}
                          </div>
                          <a href={lien(l.linkedin)} target="_blank" rel="noreferrer"
                            style={{ color: BLEU, fontSize: "12.5px", textDecoration: "none", alignSelf: "center" }}>
                            Ouvrir la messagerie ↗
                          </a>
                        </div>

                        {blocFiche(l)}

                        {!active ? (
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                            <button
                              onClick={() => {
                                setOuverte(cleDe(l));
                                setTexteLong(onglet === "envoyes"
                                  ? secondMessage(l.dirigeant_prenom)
                                  : messageRelance(l.dirigeant_prenom, l.raison_sociale));
                              }}
                              style={{ ...BOUTON, flex: "2 1 200px" }}>
                              {onglet === "envoyes" ? "Préparer une relance" : "Préparer le message"}
                            </button>
                            {onglet === "envoyes" && (
                              <button onClick={() => marquer(l, "refuse")} disabled={charge}
                                style={{ ...BOUTON, flex: "1 1 130px", fontSize: "13px", color: "rgba(255,255,255,0.45)", borderColor: "rgba(255,255,255,0.15)" }}>
                                Sans suite
                              </button>
                            )}
                          </div>
                        ) : (
                          <div style={{ marginTop: "14px" }}>
                            <textarea value={texteLong} onChange={(e) => setTexteLong(e.target.value)} rows={14} style={CHAMP} />

                            <button onClick={() => copier(texteLong, "long")}
                              style={{ ...BOUTON, width: "100%", marginTop: "11px", background: copie === "long" ? "rgba(0,230,118,0.15)" : BOUTON.background, color: copie === "long" ? VERT : OR, borderColor: copie === "long" ? "rgba(0,230,118,0.4)" : BOUTON.border }}>
                              {copie === "long" ? "✓ Copié — collez-le dans la messagerie" : "Copier le message"}
                            </button>

                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "9px" }}>
                              <button onClick={() => marquer(l, "relance")} disabled={charge}
                                style={{ flex: "2 1 200px", background: "rgba(0,230,118,0.13)", color: VERT, border: "1px solid rgba(0,230,118,0.4)", borderRadius: "8px", padding: "13px", fontSize: "13.5px", fontWeight: "bold", fontFamily: "Georgia,serif", cursor: "pointer" }}>
                                ✓ Message envoyé
                              </button>
                              <button onClick={() => setOuverte(null)}
                                style={{ ...BOUTON, flex: "1 1 110px", padding: "13px", fontSize: "13.5px", color: "rgba(255,255,255,0.5)", borderColor: "rgba(255,255,255,0.18)" }}>
                                Fermer
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}
