import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMINS = ["contact@academiapro.fr"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// SIX SOURCES, DONT UNE MANUELLE.
//
// Les cinq premieres viennent de l open data enrichi. LA SIXIEME,
// « manuel », pointe sur la table crm et recoit les profils que Jacques
// trouve LUI-MEME sur LinkedIn, au fil de son fil d actualite.
//
// 🚨 « gros » AJOUTEE LE 25/08, ET LA RAISON COMPTE.
// L ecran de recherche rend des resultats venant de prospects_gros. Sans
// cette entree, marquer une acceptation depuis un de ces resultats
// echouait sur « Base inconnue » — des boutons visibles qui ne font rien.
//
// 🆕 « cabinets » AJOUTEE LE 26/08 — LA DEUXIEME CAMPAGNE.
//
// LA TABLE prospects_cabinets N AVAIT PAS LES COLONNES LINKEDIN. C est
// pour cette raison qu elle etait tenue a l ecart : les demander faisait
// echouer la lecture entiere. Les quatre colonnes ont ete ajoutees le
// 26/08 — linkedin_le, linkedin_statut, linkedin_relance_le, notes — et
// la table est desormais lisible exactement comme les autres.
//
// 🚨 POURQUOI UNE SEULE LISTE, ET PAS DEUX ECRANS SEPARES.
// Les compteurs bouclent sur TOUTES les tables de cet objet. Le plafond
// de vingt invitations par jour porte donc sur le TOTAL, organismes et
// cabinets confondus — ce qui est la realite : les invitations partent
// d un seul compte LinkedIn, celui de Jacques. Deux ecrans separes
// auraient deux compteurs, et le total reel passerait a quarante sans
// que personne ne le voie. NE PAS SCINDER.
const TABLES: any = {
  organismes: "prospects_organismes",
  qualiopi: "prospects_qualiopi",
  gros: "prospects_gros",
  interim: "prospects_interim",
  cabinets: "prospects_cabinets",
  manuel: "crm",
};

// 🚨🚨 « crm » ET « manuel » DESIGNENT LA MEME TABLE — corrige le 27/08.
//
// LE DEFAUT, ET IL S EST VU SUR UNE FICHE REELLE. La recherche globale
// (/api/admin/prospection) nomme cette base « crm » ; cette route-ci la
// nomme « manuel ». Marquer depuis un resultat de recherche envoyait donc
// base = "crm", que TABLES ne connaissait pas : « Base inconnue », et la
// fiche revenait a son etat precedent.
//
// C est arrive sur la fiche d Eric Haddad, trouvee par la recherche et
// impossible a faire avancer.
//
// ⚠️ ON NE RENOMME NI L UN NI L AUTRE. « manuel » est employe partout
// dans cette route et dans l ecran ; « crm » est employe par la recherche
// et par le libelle affiche. Renommer casserait l un des deux. On traduit.
//
// ⚠️ TOUTE NOUVELLE BASE AJOUTEE D UN COTE DOIT L ETRE DE L AUTRE. Deux
// listes de noms qui divergent, c est ce defaut qui recommence.
function baseNormalisee(cle: string): string {
  const c = String(cle || "").trim();
  return c === "crm" ? "manuel" : c;
}

// \ud83c\udd95 DIX STATUTS DEPUIS LE 27/08 — LA CHAINE VA JUSQU AU BOUT.
//
// LE MANQUE. Les statuts s arretaient a « relance », c est-a-dire au
// message envoye. Rien ne disait ce qui se passait ENSUITE : pas de
// reponse, pas de rendez-vous, pas de client. Le taux de concretisation
// etait donc incalculable — on savait combien de portes on avait
// frappees, jamais combien s etaient ouvertes.
//
// LA CHAINE COMPLETE :
//   invite / invite_nu  l invitation est partie
//   accepte / accepte_nu  la personne a accepte
//   relance             le message est parti
//   repondu             elle a repondu \u2014 la conversation existe
//   rendez_vous         un echange est cale
//   client              le contrat est signe
//   refuse              elle a decline, ou n a jamais repondu
//   ecarte              on ne la sollicite pas
//
// \u26a0\ufe0f LES TROIS NOUVEAUX NE SE RENOMMENT PAS. Les compteurs, les
// filtres et l ecran les lisent tels quels.
const STATUTS = [
  "invite", "invite_nu",
  "accepte", "accepte_nu",
  "relance",
  "repondu", "rendez_vous", "client",
  "refuse", "ecarte",
];

const EN_ATTENTE = ["invite", "invite_nu"];
const ACCEPTES = ["accepte", "accepte_nu"];

// « Messages envoyes » montre TOUT ce qui a recu un message, quel que
// soit l etat de la conversation ensuite. Sans quoi une fiche qui repond
// disparaitrait de l ecran, et on ne saurait plus ou elle en est.
const RELANCES = ["relance", "repondu", "rendez_vous", "client"];

// Ce qui compte comme une conversation entamee.
const ENGAGES = ["repondu", "rendez_vous", "client"];

const PLAFOND_SEMAINE = 100;
const PLAFOND_JOUR = 20;

// A vingt invitations par jour, le plafond de 200 etait atteint en dix
// jours. Mille lignes couvrent cinquante jours.
const LIMITE_LISTE = 1000;

// 🚨🚨 LE JOUR SE COMPTE A PARIS, PAS EN TEMPS UNIVERSEL — corrige le 18/08.
//
// Le code faisait `d.setHours(0,0,0,0)`, qui travaille dans le fuseau DU
// SERVEUR. Or Vercel tourne en UTC. A 1 h 30 du matin a Paris, il est
// 23 h 30 LA VEILLE pour le serveur : le compteur additionnait encore les
// vingt invitations deja faites. ENTRE MINUIT ET DEUX HEURES DU MATIN, LE
// QUOTA NE SE REMETTAIT JAMAIS A ZERO.
//
// ⚠️ NE PAS REVENIR A setHours() : le defaut ne se verrait qu apres minuit.
function decalageParisEnMs(d: Date): number {
  const aParis = new Date(d.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const enUTC = new Date(d.toLocaleString("en-US", { timeZone: "UTC" }));
  return aParis.getTime() - enUTC.getTime();
}

function debutDuJour(): string {
  const maintenant = new Date();
  const decalage = decalageParisEnMs(maintenant);
  const murale = new Date(maintenant.getTime() + decalage);
  murale.setUTCHours(0, 0, 0, 0);
  return new Date(murale.getTime() - decalage).toISOString();
}

// La semaine est GLISSANTE — sept jours en arriere depuis maintenant.
function ilYaSeptJours(): string {
  return new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
}

// 🆕 LE NOMBRE DE FORMATIONS, CALCULE EN BASE — 25/08.
//
// LE DEFAUT CORRIGE : le message d apres acceptation annoncait « plus de
// trois cents formations » alors que le catalogue en compte 560. Jacques
// se sous-vendait de moitie, sur un chiffre que le prospect peut verifier
// sur le site en trois clics.
//
// 🚨 LE DOMAINE « Ateliers » EST EXCLU, exactement comme dans la campagne
// courriel. La table formations contient DEUX familles : les formations du
// catalogue commercial ET les 20 ateliers, qui ne figurent nulle part au
// catalogue. Sans cette exclusion, le message annoncerait 580 quand le site
// en montre 560.
//
// EN DUR, CE CHIFFRE SERAIT FAUX A LA PROCHAINE VAGUE DE FICHES. Calcule,
// il suit tout seul.
async function compterFormations(): Promise<number> {
  const { count } = await supabase
    .from("formations")
    .select("code", { count: "exact", head: true })
    .eq("actif", true)
    .neq("domaine", "Ateliers");
  return count || 0;
}

// Une fiche ecartee ne compte jamais : rien n a ete envoye.
//
// 🚨 UNE FICHE EN ATTENTE NON PLUS. Depuis le 18/08, une fiche peut etre
// enregistree SANS invitation : elle porte alors linkedin_le a null, et
// n entre donc dans aucun compteur — c est precisement ce qu on veut.
async function compterDepuis(depuis: string): Promise<number> {
  let total = 0;
  for (const cle of Object.keys(TABLES)) {
    const { count } = await supabase
      .from(TABLES[cle])
      .select("id", { count: "exact", head: true })
      .not("linkedin_le", "is", null)
      .neq("linkedin_statut", "ecarte")
      .gte("linkedin_le", depuis);
    total += count || 0;
  }
  return total;
}

async function compterStatuts(statuts: string[]): Promise<number> {
  let total = 0;
  for (const cle of Object.keys(TABLES)) {
    const { count } = await supabase
      .from(TABLES[cle])
      .select("id", { count: "exact", head: true })
      .in("linkedin_statut", statuts);
    total += count || 0;
  }
  return total;
}

// \ud83c\udd95 LE MEME COMPTE, MAIS POUR UNE SEULE CAMPAGNE — 27/08.
//
// LE BESOIN. Le taux d acceptation affiche melangeait les deux campagnes.
// Tant qu il n y avait qu AcadeMIA Pro, le chiffre disait quelque chose ;
// depuis que Mr. Comptable prospecte aussi, il ne dit plus rien : un bon
// taux d un cote peut masquer un mauvais de l autre.
//
// COMMENT LA CAMPAGNE SE DEDUIT :
//   - table « cabinets »  -> mrcomptable
//   - les quatre autres   -> academiapro
//   - table « manuel »    -> la colonne campagne de chaque fiche
//
// \u26a0\ufe0f LE PLAFOND, LUI, RESTE GLOBAL. Les invitations partent d un
// seul compte LinkedIn : vingt par jour au TOTAL. Separer les compteurs
// d acceptation ne separe pas le quota.
async function compterStatutsCampagne(statuts: string[],
  campagne: string): Promise<number> {

  let total = 0;

  for (const cle of Object.keys(TABLES)) {
    if (cle === "manuel") continue;
    const laCampagne = cle === "cabinets" ? "mrcomptable" : "academiapro";
    if (laCampagne !== campagne) continue;

    const { count } = await supabase
      .from(TABLES[cle])
      .select("id", { count: "exact", head: true })
      .in("linkedin_statut", statuts);
    total += count || 0;
  }

  // Les fiches saisies a la main : c est leur colonne campagne qui
  // tranche. Une fiche sans campagne vaut « academiapro », comme partout.
  let q = supabase
    .from("crm")
    .select("id", { count: "exact", head: true })
    .is("tenant_id", null)
    .in("linkedin_statut", statuts);

  if (campagne === "mrcomptable") {
    q = q.eq("campagne", "mrcomptable");
  } else {
    q = q.or("campagne.is.null,campagne.eq.academiapro");
  }

  const { count: manuelles } = await q;
  total += manuelles || 0;

  return total;
}

// Le bilan d une campagne : ses invitations, ses acceptations, son taux.
async function bilanCampagne(campagne: string) {
  const attente = await compterStatutsCampagne(["invite", "invite_nu"], campagne);
  const acceptes = await compterStatutsCampagne(["accepte", "accepte_nu"], campagne);
  const relances = await compterStatutsCampagne(["relance"], campagne);
  const repondus = await compterStatutsCampagne(["repondu"], campagne);
  const rendezVous = await compterStatutsCampagne(["rendez_vous"], campagne);
  const clients = await compterStatutsCampagne(["client"], campagne);
  const refuses = await compterStatutsCampagne(["refuse"], campagne);
  const ecartes = await compterStatutsCampagne(["ecarte"], campagne);

  // \ud83d\udea8 CHAQUE ETAT AVANCE COMPTE DANS TOUS CEUX QUI LE PRECEDENT.
  //
  // Une fiche « client » a forcement repondu, donc recu un message, donc
  // accepte l invitation. Sans cette regle, le travail accompli ferait
  // BAISSER les chiffres au lieu de les monter — c est exactement le
  // defaut corrige le 18/08 sur les acceptations.
  const engages = repondus + rendezVous + clients;
  const messages = relances + engages;
  const acceptations = acceptes + messages;

  // \ud83d\udea8 LE TAUX SE CALCULE SUR LES INVITATIONS ENVOYEES.
  //
  // LE DEFAUT CORRIGE LE 27/08, DANS L HEURE. Le calcul portait d abord
  // sur ceux qui AVAIENT REPONDU : trois acceptations et zero refus
  // donnaient 100 %. C est exact statistiquement et faux dans l usage —
  // le chiffre affichait 100 % pour vingt invitations dont trois avaient
  // abouti. Ses mots : « le pourcentage c est invitation pas acceptation ».
  //
  // CE QUI COMPTE POUR JACQUES, c est le rendement de ses vingt
  // invitations quotidiennes : combien d entre elles produisent une
  // relation. Pas la proportion de gens polis parmi ceux qui repondent.
  //
  // \u26a0\ufe0f LE CHIFFRE MONTE PENDANT UNE SEMAINE. Une invitation met
  // plusieurs jours a etre vue : le taux du premier jour est un plancher,
  // jamais un resultat.
  const invitations = attente + acceptations + refuses;

  return {
    campagne: campagne,
    invitations: invitations,
    en_attente: attente,
    acceptes: acceptations,
    a_ecrire: acceptes,
    messages_envoyes: messages,
    repondus: engages,
    rendez_vous: rendezVous + clients,
    clients: clients,
    refuses: refuses,
    ecartes: ecartes,

    // Le rendement des invitations : sur vingt envoyees, combien
    // produisent une relation.
    taux: invitations > 0
      ? Math.round((acceptations / invitations) * 100)
      : null,

    // \ud83c\udd95 LE TAUX DE REPONSE — la mesure qui dit si le message
    // fonctionne. Sur ceux a qui l on a ECRIT, combien ont repondu.
    // En dessous de dix pour cent, ce n est pas le volume qu il faut
    // augmenter, c est le texte qu il faut reprendre.
    taux_reponse: messages > 0
      ? Math.round((engages / messages) * 100)
      : null,

    // \ud83c\udd95 LE TAUX DE CONCRETISATION — d une invitation a un
    // client. C est le seul chiffre qui dise ce que vaut vraiment le
    // canal, et le seul qui permette de savoir combien on peut se
    // permettre de payer pour une invitation.
    taux_concretisation: invitations > 0
      ? Math.round((clients / invitations) * 1000) / 10
      : null,
  };
}

// Les fiches manuelles enregistrees sans invitation, en attente d etre
// invitees. Elles vivent dans la table crm, sans date ni statut.
async function compterEnFile(): Promise<number> {
  const { count } = await supabase
    .from("crm")
    .select("id", { count: "exact", head: true })
    .not("linkedin", "is", null)
    .is("linkedin_le", null)
    .or("linkedin_statut.is.null,linkedin_statut.neq.ecarte");
  return count || 0;
}

// \ud83d\udea8 LE TAUX PORTE SUR LES INVITATIONS ENVOYEES, pas sur les
// reponses recues — corrige le 27/08. Voir le commentaire de
// bilanCampagne : afficher 100 % pour trois acceptations sur vingt
// invitations n aide personne a decider.
function taux(acceptes: number, invitations: number) {
  return invitations > 0
    ? Math.round((acceptes / invitations) * 100)
    : null;
}

async function compteurs() {
  const jour = await compterDepuis(debutDuJour());
  const semaine = await compterDepuis(ilYaSeptJours());

  const attente_note = await compterStatuts(["invite"]);
  const attente_nu = await compterStatuts(["invite_nu"]);
  const accepte_note = await compterStatuts(["accepte"]);
  const accepte_nu = await compterStatuts(["accepte_nu"]);
  const relances = await compterStatuts(RELANCES);
  const engages = await compterStatuts(ENGAGES);
  const clients = await compterStatuts(["client"]);
  const refuses = await compterStatuts(["refuse"]);
  const ecartes = await compterStatuts(["ecarte"]);
  const en_file = await compterEnFile();
  const formations = await compterFormations();

  // 🚨 « ACCEPTEES » COMPTE AUSSI LES RELANCEES — corrige le 18/08.
  //
  // LE DEFAUT. Le compteur ne totalisait que `accepte` et `accepte_nu`.
  // Des qu un message partait, la fiche passait en `relance` et sortait du
  // total : le tableau de bord affichait ZERO ACCEPTATION alors que treize
  // personnes avaient accepte. Le travail accompli faisait BAISSER le
  // chiffre au lieu de le monter.
  const acceptees = accepte_note + accepte_nu + relances;

  // Le bilan de chaque campagne, cote a cote. C est ce qui permet de
  // savoir laquelle des deux merite qu on lui donne plus de place dans
  // les vingt invitations quotidiennes.
  const academia = await bilanCampagne("academiapro");
  const comptable = await bilanCampagne("mrcomptable");

  return {
    jour, semaine,
    en_attente: attente_note + attente_nu,
    attente_note, attente_nu,
    acceptes: acceptees,
    en_attente_reponse: accepte_note + accepte_nu,
    accepte_note, accepte_nu,
    relances, refuses, ecartes,
    engages, clients,
    en_file,
    formations,
    campagnes: { academiapro: academia, mrcomptable: comptable },
    taux_note: null,
    taux_global: taux(acceptees,
      attente_note + attente_nu + acceptees + refuses),
    plafond_jour: PLAFOND_JOUR,
    plafond_semaine: PLAFOND_SEMAINE,
    reste_jour: Math.max(PLAFOND_JOUR - jour, 0),
    reste_semaine: Math.max(PLAFOND_SEMAINE - semaine, 0),
  };
}

// LES COLONNES DIFFERENT SELON LA TABLE. Les cinq bases de prospection
// portent raison_sociale, siren, code_postal ; la table crm porte nom et
// organisme. Demander les mauvaises colonnes ferait echouer la requete.
//
// 🆕 prospects_cabinets porte exactement les memes colonnes que les quatre
// autres bases depuis le 26/08. Elle se lit donc avec COLONNES_PROSPECTS,
// sans traitement particulier.
const COLONNES_PROSPECTS =
  "id, raison_sociale, ville, code_postal, siren, dirigeant_prenom, dirigeant_nom, " +
  "linkedin, email, telephone, site_web, linkedin_le, linkedin_relance_le, linkedin_statut, notes";

// 🆕 campagne AJOUTEE LE 27/08.
//
// LE DEFAUT. Une fiche saisie a la main n avait aucun moyen de dire a
// quelle campagne elle appartenait. Elle recevait donc TOUJOURS le message
// des organismes de formation — y compris un expert-comptable trouve dans
// les relations d un autre expert-comptable.
//
// Or c est precisement la maniere de prospecter : on ouvre le profil d un
// contact accepte, on regarde ses relations, on y trouve ses confreres.
// Sans cette colonne, chaque fiche ainsi trouvee recevait le mauvais
// message.
//
// ⚠️ UNE FICHE SANS CAMPAGNE VAUT « academiapro » : c est le comportement
// d avant, et les fiches deja creees le gardent.
const COLONNES_CRM =
  "id, nom, organisme, ville, dirigeant_prenom, dirigeant_nom, " +
  "linkedin, email, telephone, linkedin_le, linkedin_relance_le, " +
  "linkedin_statut, campagne, notes";

function colonnesDe(cle: string): string {
  return cle === "manuel" ? COLONNES_CRM : COLONNES_PROSPECTS;
}

// CE QUI EST MODIFIABLE DEPUIS LA FICHE COMPLETE.
//
// ⚠️ LES DEUX LISTES SONT DISTINCTES PARCE QUE LES TABLES LE SONT.
//
// 🚨 NI LE STATUT NI LES DATES NE SONT MODIFIABLES ICI. Corriger une
// coordonnee ne doit jamais faire avancer une fiche dans le parcours.
const MODIFIABLES_PROSPECTS = [
  "raison_sociale", "ville", "code_postal", "siren",
  "dirigeant_prenom", "dirigeant_nom",
  "linkedin", "email", "telephone", "site_web", "notes",
];

const MODIFIABLES_CRM = [
  "nom", "organisme", "ville",
  "dirigeant_prenom", "dirigeant_nom",
  "linkedin", "email", "telephone", "campagne", "notes",
];

function modifiablesDe(cle: string): string[] {
  return cle === "manuel" ? MODIFIABLES_CRM : MODIFIABLES_PROSPECTS;
}

// L ecran attend partout raison_sociale et dirigeant. Une fiche du CRM
// n en a pas : on la presente sous la meme forme.
//
// 🆕 LA CLE DE BASE VOYAGE AVEC CHAQUE LIGNE. C est elle qui permet a
// l ecran de savoir s il s adresse a un organisme de formation ou a un
// cabinet comptable — et donc quel message preparer.
function uniformiser(l: any, cle: string) {
  // Une fiche de prospection tient sa campagne de sa base : cabinets pour
  // Mr. Comptable, tout le reste pour AcadeMIA Pro. On la pose ici pour
  // que l ecran n ait pas a la deduire.
  if (cle !== "manuel") {
    return {
      ...l,
      base: cle,
      campagne: cle === "cabinets" ? "mrcomptable" : "academiapro",
    };
  }
  return {
    ...l,
    raison_sociale: l.organisme || l.nom || "-",
    code_postal: null,
    siren: null,
    site_web: null,
    campagne: l.campagne || "academiapro",
    base: cle,
  };
}

async function suivante(base: string) {
  const table = TABLES[base];
  if (!table) return { erreur: "Base inconnue." };

  const { data, error } = await supabase
    .from(table)
    .select(colonnesDe(base))
    .not("linkedin", "is", null)
    .is("linkedin_le", null)
    .or("linkedin_statut.is.null,linkedin_statut.neq.ecarte")
    .order("id", { ascending: true })
    .limit(1);

  if (error) return { erreur: error.message };
  if (!data || data.length === 0) return { fiche: null, epuise: true };

  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .not("linkedin", "is", null)
    .is("linkedin_le", null)
    .or("linkedin_statut.is.null,linkedin_statut.neq.ecarte");

  return { fiche: uniformiser(data[0], base), restant: count || 0 };
}

// La cle de base est renvoyee avec chaque ligne — sans elle, l ecran ne
// saurait pas dans quelle table ecrire au moment de marquer.
//
// 🚨🚨 L ORDRE EST INVERSE POUR « MES INVITATIONS » — corrige le 28/08.
//
// LE DEFAUT. La liste affichait la plus ANCIENNE invitation en premier.
// Or LinkedIn annonce « trois personnes ont accepte » sans dire
// lesquelles : il faut donc les retrouver a la main. Et une acceptation
// vient presque toujours d une invitation des derniers jours, jamais
// d une invitation vieille de trois semaines.
//
// Resultat : les invitations d hier se trouvaient tout en bas, apres cent
// trente autres. Jacques a eu trois acceptations qu il n a pas pu
// retrouver.
//
// ⚠️ LES DEUX AUTRES ONGLETS GARDENT L ORDRE ANCIEN-VERS-RECENT, et c est
// voulu :
//   « A ecrire » — celui qui a accepte il y a une semaine attend depuis
//     une semaine, il passe devant.
//   « Messages envoyes » — celui dont le message attend une reponse depuis
//     le plus longtemps est celui a relancer en premier.
//
// La regle : ON MET EN TETE CE QUI RECLAME UNE ACTION MAINTENANT. Pour les
// invitations, c est la derniere partie ; pour les autres, la plus vieille
// en attente.
async function lister(statuts: string[], limite: number,
  colonneTri?: string, plusRecentDabord?: boolean) {

  const tri = colonneTri || "linkedin_le";
  const recent = plusRecentDabord === true;
  const lignes: any[] = [];

  for (const cle of Object.keys(TABLES)) {
    const { data } = await supabase
      .from(TABLES[cle])
      .select(colonnesDe(cle))
      .in("linkedin_statut", statuts)
      .order(tri, { ascending: !recent })
      .limit(limite);
    for (const l of (data || [])) lignes.push(uniformiser(l, cle));
  }

  // Le tri final remet les six tables dans un ordre unique : chacune a
  // ete lue separement, et leurs listes se croisent.
  lignes.sort(function (a, b) {
    const comparaison = String(a[tri] || "").localeCompare(String(b[tri] || ""));
    return recent ? -comparaison : comparaison;
  });

  return lignes.slice(0, limite);
}

// 🆕 LES FICHES ENREGISTREES SANS INVITATION — ajoute le 18/08.
//
// Elles n ont ni date ni statut : elles attendent simplement d etre
// invitees. On les liste a part pour que Jacques les retrouve.
async function listerEnFile(limite: number) {
  const { data } = await supabase
    .from("crm")
    .select(COLONNES_CRM)
    .not("linkedin", "is", null)
    .is("linkedin_le", null)
    .or("linkedin_statut.is.null,linkedin_statut.neq.ecarte")
    .order("created_at", { ascending: false })
    .limit(limite);
  return (data || []).map(function (l: any) { return uniformiser(l, "manuel"); });
}

function propre(v: any, max: number): string {
  return String(v === null || v === undefined ? "" : v).trim().slice(0, max);
}

export async function POST(req: NextRequest) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const body = await req.json();
    const action = String(body.action || "marquer").trim();
    // La base arrive du navigateur : on la traduit avant tout usage.
    const base = baseNormalisee(String(body.base || "").trim());

    // MODIFIER UNE FICHE COMPLETE.
    if (action === "modifier") {
      const id = body.id;
      const table = TABLES[base];
      if (!table) return NextResponse.json({ ok: false, erreur: "Base inconnue." }, { status: 400 });
      if (!id) return NextResponse.json({ ok: false, erreur: "Ligne non precisee." }, { status: 400 });

      const permis = modifiablesDe(base);
      const champs: any = {};

      for (const cle of permis) {
        if (body[cle] === undefined) continue;
        const valeur = propre(body[cle], cle === "notes" ? 4000 : 300);
        champs[cle] = valeur || null;
      }

      if (Object.keys(champs).length === 0) {
        return NextResponse.json({ ok: false, erreur: "Rien a modifier." }, { status: 400 });
      }

      if (base === "manuel") champs.derniere_interaction = new Date().toISOString();

      const { data, error } = await supabase
        .from(table)
        .update(champs)
        .eq("id", id)
        .select(colonnesDe(base))
        .maybeSingle();

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        fiche: data ? uniformiser(data, base) : null,
        message: "Fiche enregistrée.",
      });
    }

    // ENREGISTRER UNE OBSERVATION SUR UNE FICHE.
    //
    // ⚠️ CETTE ACTION NE TOUCHE NI AU STATUT NI AUX DATES.
    if (action === "note") {
      const id = body.id;
      const table = TABLES[base];
      if (!table) return NextResponse.json({ ok: false, erreur: "Base inconnue." }, { status: 400 });
      if (!id) return NextResponse.json({ ok: false, erreur: "Ligne non precisee." }, { status: 400 });

      const texte = propre(body.notes, 4000);

      const champs: any = { notes: texte || null };
      if (base === "manuel") champs.derniere_interaction = new Date().toISOString();

      const { error } = await supabase.from(table).update(champs).eq("id", id);
      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, notes: texte, message: "Observation enregistrée." });
    }

    // LA FILE D ATTENTE : les fiches enregistrees sans invitation.
    if (action === "en_file") {
      const lignes = await listerEnFile(LIMITE_LISTE);
      return NextResponse.json({ ok: true, lignes, compteurs: await compteurs() });
    }

    // AJOUTER UN PROFIL TROUVE A LA MAIN.
    //
    // 🚨🚨 TROIS FACONS D ENREGISTRER, ET LA DISTINCTION EST ESSENTIELLE —
    // corrigee le 18/08 apres un defaut de conception.
    //
    // LE DEFAUT. Les deux seuls boutons disponibles etaient « Invitee avec
    // une note » et « Invitee sans note ». ENREGISTRER UNE FICHE ET
    // DECLARER UNE INVITATION ETAIENT DONC LA MEME ACTION — impossible de
    // ranger un profil croise le soir pour l inviter le lendemain. Et une
    // fois le plafond du jour atteint, les deux boutons se grisaient : la
    // fiche etait perdue. Ses mots : « envoyer une fiche sans invitation,
    // pour moi ca ne veut pas dire enregistrer la fiche ».
    //
    // LES TROIS MODES :
    //   mode « file »     : la fiche est rangee, SANS invitation, SANS
    //                       toucher au quota. Elle attend son tour.
    //   mode « invite »   : l invitation est partie AVEC une note.
    //   mode « invite_nu » : l invitation est partie SANS note.
    //
    // Seuls les deux derniers consomment le quota.
    if (action === "ajouter") {
      const nom = propre(body.nom, 120);
      const lien = propre(body.linkedin, 300);

      // 🚨🚨 SIX MODES D ENREGISTREMENT DEPUIS LE 27/08.
      //
      // LE DEFAUT. Trois modes seulement, tous lies a l invitation : ranger,
      // invite avec note, invite sans note. Or une relation ne commence pas
      // toujours par une invitation.
      //
      // Eric, deja en relation, ayant deja repondu, avec un rendez-vous en
      // cours, n entrait dans aucun des trois. Et le plafond du jour,
      // atteint, empechait les deux seuls modes qui posaient un statut.
      //
      // LES SIX MODES :
      //   file         range la fiche, sans invitation
      //   invite       l invitation est partie, avec une note
      //   invite_nu    l invitation est partie, sans note
      //   accepte_nu   la relation existe deja
      //   repondu      la personne a deja repondu
      //   rendez_vous  un rendez-vous est cale
      //
      // ⚠️ SEULS invite ET invite_nu TOUCHENT AU QUOTA. Les trois derniers
      // consignent une relation qui existe : aucune invitation n est
      // envoyee, le plafond ne les concerne pas.
      const MODES_QUOTA = ["invite", "invite_nu"];
      const MODES_VALIDES = [
        "file", "invite", "invite_nu",
        "accepte_nu", "repondu", "rendez_vous",
      ];

      // Compatibilite avec l ancien appel, qui envoyait avec_note.
      let mode = String(body.mode || "").trim();
      if (!mode) mode = body.avec_note === true ? "invite" : "invite_nu";
      if (MODES_VALIDES.indexOf(mode) < 0) {
        return NextResponse.json({ ok: false, erreur: "Mode d enregistrement inconnu." }, { status: 400 });
      }

      if (nom.length < 2) {
        return NextResponse.json({ ok: false, erreur: "Indiquez le nom du contact." }, { status: 400 });
      }
      if (lien.indexOf("linkedin.com") < 0) {
        return NextResponse.json(
          { ok: false, erreur: "Collez l adresse complete du profil LinkedIn." },
          { status: 400 }
        );
      }

      // Le meme profil ne se saisit pas deux fois.
      const { data: deja } = await supabase
        .from("crm")
        .select("id, nom, linkedin_statut, linkedin_le")
        .eq("linkedin", lien)
        .maybeSingle();

      if (deja) {
        const etat = deja.linkedin_le
          ? "statut " + (deja.linkedin_statut || "aucun")
          : "en attente d invitation";
        return NextResponse.json({
          ok: false,
          erreur: "Ce profil est deja dans votre file (" + (deja.nom || "sans nom") + ", " + etat + ").",
        }, { status: 409 });
      }

      // LE QUOTA AVERTIT, IL NE REFUSE PLUS — meme raison que plus bas.
      // Une fiche creee apres une invitation deja partie doit pouvoir
      // porter son statut, sans quoi elle entre dans la base sans trace.
      let avertirAjout: string | null = null;
      if (MODES_QUOTA.indexOf(mode) >= 0) {
        const c = await compteurs();
        if (c.reste_jour <= 0) {
          avertirAjout = "Plafond du jour depasse (" + PLAFOND_JOUR
            + " invitations). La fiche est enregistree avec son statut,"
            + " mais n en envoyez plus aujourd hui.";
        }
      }

      const morceaux = nom.split(/\s+/);
      const prenom = morceaux.length > 1 ? morceaux[0] : "";
      const patronyme = morceaux.length > 1 ? morceaux.slice(1).join(" ") : nom;

      // La campagne decide du message d apres acceptation. Toute valeur
      // autre que mrcomptable vaut academiapro : on ne cree pas de
      // troisieme voix par accident.
      const campagne = String(body.campagne || "").trim().toLowerCase()
        === "mrcomptable" ? "mrcomptable" : "academiapro";

      const fiche: any = {
        tenant_id: null,
        nom: nom,
        campagne: campagne,
        organisme: propre(body.organisme, 160) || null,
        ville: propre(body.ville, 80) || null,
        dirigeant_prenom: prenom || null,
        dirigeant_nom: patronyme || null,
        linkedin: lien,
        // 🚨 EN MODE FILE, NI STATUT NI DATE. C est cette absence de date qui
        // tient la fiche hors de tous les compteurs.
        linkedin_statut: mode === "file" ? null : mode,
        linkedin_le: mode === "file" ? null : new Date().toISOString(),
        // Un etat avance suppose qu un message est deja parti : sans cette
        // date, la fiche apparaitrait comme jamais contactee.
        linkedin_relance_le: (mode === "repondu" || mode === "rendez_vous")
          ? new Date().toISOString() : null,
        source: "linkedin",
        statut: mode === "file" ? "prospect"
          : (mode === "repondu" || mode === "rendez_vous") ? "interesse"
          : "contacte",
        score: mode === "file" ? 35
          : mode === "rendez_vous" ? 75
          : mode === "repondu" ? 65
          : mode === "accepte_nu" ? 60
          : 45,
        notes: propre(body.notes, 4000) ||
          "Profil trouve sur LinkedIn et ajoute a la main. Aucune adresse connue : " +
          "le joindre par la messagerie LinkedIn.",
        derniere_interaction: new Date().toISOString(),
      };

      const { data: cree, error } = await supabase
        .from("crm")
        .insert(fiche)
        .select(COLONNES_CRM)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      const MOTS: any = {
        file: " est enregistre, en attente d invitation. Aucune unite de quota consommee.",
        invite: " est ajoute a votre file, invitation avec note.",
        invite_nu: " est ajoute a votre file, invitation sans note.",
        accepte_nu: " est enregistre comme relation etablie. Son message l attend dans « A ecrire ».",
        repondu: " est enregistre : il a deja repondu. Sa fiche est dans « Messages envoyes ».",
        rendez_vous: " est enregistre, rendez-vous pris. Sa fiche est dans « Messages envoyes ».",
      };

      const mot = nom + (MOTS[mode] || " est enregistre.");

      // 🆕 LA FICHE COMPLETE EST RENVOYEE — 25/08.
      // Elle ne l etait pas : l ecran confirmait « enregistre » puis
      // n affichait rien, et il fallait aller la chercher dans un onglet.
      return NextResponse.json({
        ok: true,
        ajoute: cree ? uniformiser(cree, "manuel") : null,
        mode: mode,
        message: mot,
        avertissement: avertirAjout,
        compteurs: await compteurs(),
      });
    }

    if (action === "suivante") {
      const r: any = await suivante(base);
      if (r.erreur) return NextResponse.json({ ok: false, erreur: r.erreur }, { status: 400 });
      return NextResponse.json({ ok: true, ...r, compteurs: await compteurs() });
    }

    // 🚨 LES PLUS RECENTES EN TETE. Voir le commentaire de lister() :
    // une acceptation vient des derniers jours, pas de trois semaines.
    if (action === "en_attente") {
      const lignes = await lister(EN_ATTENTE, LIMITE_LISTE, "linkedin_le", true);
      return NextResponse.json({ ok: true, lignes, compteurs: await compteurs() });
    }

    if (action === "a_relancer") {
      const lignes = await lister(ACCEPTES, LIMITE_LISTE);
      return NextResponse.json({ ok: true, lignes, compteurs: await compteurs() });
    }

    // Les messages envoyes, du plus ancien au plus recent : ceux qui
    // attendent depuis le plus longtemps arrivent en tete.
    if (action === "envoyes") {
      const lignes = await lister(RELANCES, LIMITE_LISTE, "linkedin_relance_le");
      return NextResponse.json({ ok: true, lignes, compteurs: await compteurs() });
    }

    const id = body.id;
    const statut = String(body.statut || "invite").trim();

    const table = TABLES[base];
    if (!table) return NextResponse.json({ ok: false, erreur: "Base inconnue." }, { status: 400 });
    if (!id) return NextResponse.json({ ok: false, erreur: "Ligne non precisee." }, { status: 400 });
    if (STATUTS.indexOf(statut) < 0) {
      return NextResponse.json({ ok: false, erreur: "Statut inconnu." }, { status: 400 });
    }

    // 🚨🚨 LE PLAFOND AVERTIT, IL NE REFUSE PLUS — corrige le 27/08.
    //
    // LE DEFAUT, ET IL A FAUSSE LES DONNEES. Cette route refusait en 429
    // toute declaration d invitation au-dela des vingt du jour. Jacques ne
    // pouvait donc plus consigner une invitation qu il venait d envoyer
    // DEPUIS LINKEDIN.
    //
    // Or LinkedIn ne connait pas ce compteur. Une invitation envoyee la-bas
    // EXISTE, que cette route l accepte ou non. La refuser ne l annule pas :
    // elle laisse la fiche vide, et le compteur ment dans l autre sens.
    // C est ce qui est arrive a la fiche d Agnes Brunet, restee sans trace
    // alors que le message etait parti.
    //
    // LA REGLE : le plafond dit QUAND S ARRETER D ENVOYER. Il n a pas a
    // interdire d enregistrer ce qui est deja parti. Une route qui refuse
    // de consigner la realite fabrique des donnees fausses.
    //
    // ⚠️ NE PAS RETABLIR LE REFUS. Le depassement est SIGNALE dans la
    // reponse — champ « avertissement » — et l ecran l affiche. Jacques
    // reste juge de ce qu il declare.
    //
    // 🚨 DEPUIS LE 26/08, CE PLAFOND COUVRE LES DEUX CAMPAGNES. Les
    // compteurs bouclent sur les six tables : vingt par jour au TOTAL,
    // organismes et cabinets confondus. C est voulu — les invitations
    // partent d un seul compte LinkedIn.
    let avertissement: string | null = null;

    if (statut === "invite" || statut === "invite_nu") {
      const c = await compteurs();
      if (c.reste_jour <= 0) {
        avertissement = "Plafond du jour depasse (" + PLAFOND_JOUR
          + " invitations). Cette declaration est enregistree, mais"
          + " n en envoyez plus aujourd hui.";
      } else if (c.reste_semaine <= 0) {
        avertissement = "Plafond de la semaine depasse (" + PLAFOND_SEMAINE
          + " invitations). Cette declaration est enregistree, mais"
          + " laissez passer quelques jours.";
      }
    }

    // La date d envoi initial est CONSERVEE quand on marque une reponse.
    const champs: any = { linkedin_statut: statut };
    if (statut === "invite" || statut === "invite_nu" || statut === "ecarte") {
      champs.linkedin_le = new Date().toISOString();
    }

    // La date du message, distincte de celle de l invitation. Sans elle, on
    // ne saurait pas depuis combien de temps un message attend sa reponse.
    if (statut === "relance") {
      champs.linkedin_relance_le = new Date().toISOString();
    }

    // \ud83d\udea8 LES ETATS AVANCES NE TOUCHENT A AUCUNE DATE.
    //
    // « repondu », « rendez_vous » et « client » decrivent ce qui suit le
    // message. Ecraser linkedin_relance_le effacerait la date d envoi, et
    // on ne saurait plus combien de temps la reponse a mis a venir.

    if (body.notes !== undefined) {
      champs.notes = propre(body.notes, 4000) || null;
    }

    // Sur une fiche du CRM, une acceptation vaut un signal commercial :
    // le statut et le score suivent.
    if (base === "manuel") {
      champs.derniere_interaction = new Date().toISOString();
      if (statut === "accepte" || statut === "accepte_nu") {
        champs.statut = "interesse";
        champs.score = 60;
      }
      if (statut === "relance") champs.score = 65;
      if (statut === "refuse") champs.statut = "perdu";
    }

    const { error } = await supabase.from(table).update(champs).eq("id", id);
    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // 🚨 LA FICHE SUIVANTE N EST CHARGEE QUE POUR L ONGLET INVITER.
    //
    // Depuis la recherche, marquer une acceptation ne doit PAS faire
    // defiler la file d invitation : on agit sur une fiche precise, pas
    // dans un enchainement. Le drapeau sansSuite le dit.
    const sansSuite = body.sans_suite === true;
    const enFile = (statut === "invite" || statut === "invite_nu" || statut === "ecarte");
    const suite: any = (enFile && !sansSuite) ? await suivante(base) : {};

    return NextResponse.json({
      ok: true,
      statut: statut,
      avertissement: avertissement,
      compteurs: await compteurs(),
      fiche: suite.fiche || null,
      restant: suite.restant,
      epuise: suite.epuise || false,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }
    return NextResponse.json({ ok: true, ...(await compteurs()) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
