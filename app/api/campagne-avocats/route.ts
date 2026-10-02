import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Campagne de prospection vers les AVOCATS — table prospects_avocats.
//
// ═══════════════════════════════════════════════════════════════════════
// 🆕 30/09 — LA SEQUENCE, DECIDEE PAR JACQUES : deux produits, trente jours
// entre les deux, portes par CETTE SEULE ROUTE :
//   vague 1  MysterLLC   la societe americaine des clients    40/jour
//   vague 2  Mr. CRM     savoir quel client rappeler          40/jour
//   vague 3  Mr Comptable  la comptabilite et la paie du cabinet  40/jour
//            🆕 02/10, decision de Jacques : un cabinet d avocats est aussi
//            une societe qui peut tenir sa propre comptabilite. Texte valide
//            le 02/10. Elle ne part que lorsque la page de la video de
//            demonstration est en ligne (voir PAGE_DEMONSTRATION).
//
// POURQUOI UNE SEULE ROUTE, ALORS QUE LES ORGANISMES ET LES CABINETS EN ONT
// UNE PAR PRODUIT. Chaque vague garde ici SON expediteur, SON domaine, SON
// lien de desinscription et SA signature (voir VAGUES). Et chaque passage
// du cron traite LES DEUX vagues : la seconde demarre toute seule trente
// jours apres la premiere, sans que personne n ait a la declencher a la
// main (doctrine de Jacques : tout automatiser).
//
// LA SOURCE. 80 984 avocats de l annuaire national du Conseil national des
// barreaux (fichier du 23/09/2026, licence Etalab 2.0), dont 2 808 ont recu
// une adresse professionnelle verifiee par Dropcontact le 30/09.
//
// ⚖️ INFORMATION DE LA PERSONNE (article 14 du RGPD). Les coordonnees n ont
// pas ete collectees aupres de l avocat : le premier message dit d ou elles
// viennent, en pied de page, a cote du lien de desinscription.
//
// PROSPECTION B2B : licite sans consentement prealable si l offre concerne
// l activite professionnelle du destinataire, a condition qu un moyen de
// s opposer figure dans chaque message.
//
// LE MARQUAGE PRECEDE TOUT. Chaque ligne passe a 'envoi_en_cours' AVANT
// l appel a Resend : si la route est relancee ou coupee, cette ligne ne
// sera jamais reprise. Un doublon d envoi grille un prospect et abime la
// reputation du domaine — c est la seule faute qui ne se rattrape pas.
// ═══════════════════════════════════════════════════════════════════════

// 🆕 01/10 (soir) — voir « AUCUNE LECTURE GARDEE EN CACHE » plus bas.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;
export const maxDuration = 300;

// 30/09 : 40 PAR JOUR POUR TOUTES LES CAMPAGNES, decision de Jacques.
// Le chiffre vaut PAR VAGUE : chaque vague part de son propre domaine.
const LOT_PAR_DEFAUT = 40;

// Trois produits, trois messages : au-dela, on n insiste pas.
// 🆕 02/10 : 2 → 3 avec la vague Mr Comptable. A 2, la troisieme vague
// n aurait trouve personne (chaque avocat aurait deja recu ses deux envois).
const PLAFOND_ENVOIS = 3;

// 🆕 02/10 — LA PAGE DE LA VIDEO DE DEMONSTRATION DE MR COMPTABLE.
// Le lien est branche des maintenant, a une adresse fixe, pour ne rien
// avoir a se rappeler le jour ou la video sera en ligne (decision de
// Jacques, 02/10). ⚠️ AVANT CHAQUE PASSAGE DE LA VAGUE 3, la route verifie
// que la page repond ET qu elle contient une video (YouTube) : tant que ce
// n est pas le cas, la vague attend, et aucun courriel ne part avec un lien
// mort.
const PAGE_DEMONSTRATION = "https://mrcomptable.fr/demonstration";

// 🚨 TRENTE JOURS — decision de Jacques du 15/09, appliquee a toutes les
// sequences. Chaque vague parle d un AUTRE PRODUIT : ce n est pas une
// relance, c est une autre offre.
const DELAI_ENTRE_VAGUES = 30;

// Le temps que la route s accorde avant de s arreter d elle-meme, pour ne
// jamais etre coupee par la limite de 300 secondes au milieu d un envoi.
const BUDGET_MS = 270000;

function clientAdmin() {
  // 🚨🆕 01/10 (soir) — AUCUNE LECTURE GARDEE EN CACHE. Le cache de Next.js
  // garde les reponses des lectures `fetch` d une route : le 01/10, la route
  // trouver-sites a recu, a chaque passage, la meme liste de lignes que le
  // premier (« Using cache » dans les journaux de Vercel). Ici, une liste
  // gardee en memoire ferait renvoyer chaque jour la liste de la veille :
  // les prospects deja ecrits seraient refuses par le marquage, et la
  // campagne n enverrait plus rien, sans erreur.
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    {
      global: {
        fetch: function (url: any, options: any) {
          return fetch(url, { ...(options || {}), cache: "no-store" });
        },
      },
    });
}

function pause(ms: number) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

// Le meme calcul que app/api/desinscription/route.ts : sans le secret du
// site, personne ne peut desinscrire quelqu un d autre.
function jetonDesinscription(email: string): string {
  const secret = process.env.SESSION_SECRET
    || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return crypto.createHmac("sha256", secret)
    .update(email.toLowerCase()).digest("hex").slice(0, 32);
}

// 🆕 30/09 — LA SALUTATION D UN AVOCAT EST « MAITRE ».
// C est l usage de la profession, il ne suppose ni le genre ni le prenom,
// et il ne peut pas etre faux. (Les autres campagnes ecrivent le prenom
// seul ; a un avocat qu on ne connait pas, ce serait familier.)
function salutationDe(o: any): string {
  return "Bonjour Maître,";
}

// ─────────────────────────────────────────────────────────────────────
// VAGUE 1 — MYSTERLLC : LA SOCIETE AMERICAINE DES CLIENTS.
//
// L ANGLE. Celui du message aux cabinets comptables, valide par Jacques le
// 13/09 : on ne vend pas a l avocat un outil pour LUI, on lui ouvre une
// offre pour SES CLIENTS. L avocat garde le conseil ; la plateforme
// execute les formalites et en garde la preuve.
//
// ⚠️ CHAQUE PHRASE DECRIT UNE FONCTION QUI EXISTE ET QUI A ETE FILMEE LES
// 23 ET 24/09 : creation A a Z, formulaires americains prepares, signes et
// transmis par fax avec la preuve, 3916, echeances rappelees.
// ⛔ JAMAIS « conseil fiscal », « anonymat », « optimisation »,
// « discretion », « paradis fiscal ». ⛔ AUCUN PRIX.
// ─────────────────────────────────────────────────────────────────────
function messageMysterLLC(o: any): string {
  const site = VAGUES[1].site;
  return salutationDe(o) + "\n\n"
    + "Je m'appelle Jacques Lalou, je dirige MysterLLC, une plateforme conçue "
    + "pour ceux qui accompagnent des entrepreneurs dont la société est "
    + "américaine, ou le sera bientôt.\n\n"
    + "Vous gardez le conseil. La plateforme se charge de l'exécution, et en "
    + "garde la preuve.\n\n"
    + "Pour le client qui veut se lancer : la création de A à Z — agent "
    + "enregistré, statuts, demande du numéro fiscal transmise par la "
    + "plateforme, pacte de société signé électroniquement, ouverture du "
    + "compte bancaire suivie jusqu'au bout — avec, à chaque étape, l'état "
    + "du dossier.\n\n"
    + "Pour le client qui a déjà sa société : les formulaires américains de "
    + "chaque année préparés, signés électroniquement et transmis à "
    + "l'administration américaine avec la preuve d'envoi archivée, la "
    + "déclaration française des comptes détenus à l'étranger préparée, et "
    + "les échéances des deux côtés rappelées à temps.\n\n"
    + "Plusieurs sociétés sous un même accès, présentation à vos couleurs "
    + "sur demande.\n\n"
    + "Le parcours complet est en vidéo, écran par écran, sur une société de "
    + "démonstration :\n"
    + "— la création d'une LLC de A à Z : "
    + "<a href=\"" + site + "/comment-ca-marche\" style=\"color:#8a6d3b\">"
    + "mysterllc.com/comment-ca-marche</a>\n"
    + "— les déclarations de chaque année, jusqu'à la transmission : "
    + "<a href=\"" + site + "/formulaires\" style=\"color:#8a6d3b\">"
    + "mysterllc.com/formulaires</a>\n\n"
    + "Si le sujet concerne certains de vos clients, répondez simplement à "
    + "ce message.";
}

// ─────────────────────────────────────────────────────────────────────
// VAGUE 2 — MR. CRM : SAVOIR QUEL CLIENT RAPPELER, ET QUOI LUI DIRE.
//
// L ANGLE. Le message Mr. CRM des organismes (campagne-crm-organismes),
// oriente cabinet d avocat : le suivi des prospects et des clients, pas la
// gestion des dossiers — l outil ne pretend pas remplacer un logiciel de
// cabinet.
//
// ⚠️ CHAQUE FONCTION CITEE EXISTE : etapes de suivi, fiche avec
// l historique, relances automatiques qui s arretent a la reponse, ecran
// du matin, rendez-vous pris depuis la fiche et places dans Google Agenda
// (verification Google approuvee le 28/09).
// ⚠️ LA TELEPHONIE N EST PAS MENTIONNEE : elle n est pas branchee.
// ⛔ AUCUN PRIX, AUCUN CONCURRENT NOMME.
// ─────────────────────────────────────────────────────────────────────
function messageMrCRM(o: any): string {
  return salutationDe(o) + "\n\n"
    + "Je vous avais écrit il y a quelques semaines au sujet de MysterLLC. "
    + "Je reviens vers vous sur un tout autre sujet : le suivi de vos "
    + "prospects et de vos clients.\n\n"
    + "J'ai développé Mr. CRM, un outil pensé pour une question précise : "
    + "savoir qui rappeler aujourd'hui, et quoi lui dire.\n\n"
    + "Chaque contact suit un chemin simple — à contacter, contacté, "
    + "intéressé, client — et vous le déplacez d'un geste. Le prospect reçu "
    + "en premier rendez-vous qui réfléchit, le client à qui vous avez "
    + "promis un retour, l'entreprise qui revient trois mois plus tard : "
    + "tout reste sur sa fiche, avec ce qui s'est dit et la date à laquelle "
    + "revenir.\n\n"
    + "Les relances partent toutes seules tant que la personne n'a pas "
    + "répondu, et s'arrêtent dès qu'elle le fait. Le rendez-vous pris "
    + "depuis la fiche se place dans votre agenda Google. Le matin, l'écran "
    + "vous dit qui attend votre appel.\n\n"
    + "Il est fait aussi bien pour l'avocat qui exerce seul que pour une "
    + "équipe : une licence, un utilisateur.\n\n"
    + "Si vous voulez voir à quoi cela ressemble, répondez simplement à ce "
    + "message : je vous le montre en trente minutes.";
}

// ─────────────────────────────────────────────────────────────────────
// VAGUE 3 — MR COMPTABLE : LA COMPTABILITE ET LA PAIE DU CABINET.
//
// L ANGLE. Ici, l avocat est le CLIENT : son cabinet tient lui-meme ses
// comptes. Texte valide par Jacques le 02/10.
//
// ⚠️ CHAQUE FONCTION CITEE EXISTE : pieces photographiees et ecriture
// creee seule, rapprochement bancaire, TVA, bulletins et DSN, liasse a la
// cloture pour les societes a l IS, export du FEC.
// ⛔ PAS DE DECLARATION 2035 : Mr Comptable ne la produit pas (avocat en
// nom propre au regime de la declaration controlee). La liasse n est citee
// que pour les societes a l impot sur les societes.
// ⛔ JAMAIS « nous tenons votre comptabilite » (monopole de
// l expert-comptable) : c est un outil pour la tenir soi-meme.
// ⛔ AUCUN PRIX, AUCUN CONCURRENT NOMME.
// ─────────────────────────────────────────────────────────────────────
function messageMrComptable(o: any): string {
  return salutationDe(o) + "\n\n"
    + "Je me permets de vous présenter Mr Comptable, un logiciel de "
    + "comptabilité et de paie conçu pour les structures qui souhaitent "
    + "tenir elles-mêmes leurs comptes.\n\n"
    + "— Vos justificatifs se saisissent en les photographiant : "
    + "l'écriture se crée seule.\n"
    + "— Vos relevés bancaires se rapprochent de vos écritures.\n"
    + "— La TVA du mois se prépare à partir de vos écritures.\n"
    + "— Les bulletins de paie de vos collaborateurs se calculent, avec la "
    + "DSN de chaque mois.\n"
    + "— Pour une société à l'impôt sur les sociétés, la liasse fiscale se "
    + "prépare à la clôture.\n"
    + "— Votre expert-comptable peut recevoir à tout moment le fichier des "
    + "écritures comptables (FEC).\n\n"
    + "Une vidéo de démonstration vous présente l'outil écran par écran, "
    + "sur un dossier fictif : "
    + "<a href=\"" + PAGE_DEMONSTRATION + "\" style=\"color:#8a6d3b\">"
    + "mrcomptable.fr/demonstration</a>\n\n"
    + "Si elle vous donne envie d'aller plus loin, répondez simplement à "
    + "ce message : nous fixerons un échange téléphonique.";
}

// CHAQUE VAGUE PORTE SON EXPEDITEUR, SON DOMAINE ET SA SIGNATURE.
//
// ⚠️ LES EXPEDITEURS SONT CEUX DES CAMPAGNES EXISTANTES DU MEME PRODUIT
// (campagne-mysterllc, campagne-crm-organismes) : aucun domaine nouveau.
// ⚠️ LES OBJETS PORTENT LEURS ACCENTS : ils sont lus par le destinataire.
const VAGUES: any = {
  1: {
    expediteur: "Jacques Lalou <jacques@contact-pro.mysterllc.com>",
    reponse: "contact@academiapro.fr",
    site: "https://www.mysterllc.com",
    marque: "MysterLLC",
    domaineAffiche: "mysterllc.com",
    sujet: "La société américaine de vos clients, de la création aux déclarations",
    message: function (o: any) { return messageMysterLLC(o); },
  },
  2: {
    expediteur: "Jacques Lalou <jacques@mrcrm.fr>",
    reponse: "contact@mrcrm.fr",
    site: "https://www.mrcrm.fr",
    marque: "Mr. CRM",
    domaineAffiche: "mrcrm.fr",
    sujet: "Savoir quel client rappeler, et quoi lui dire",
    message: function (o: any) { return messageMrCRM(o); },
  },
  // 🆕 02/10 — l expediteur de la campagne Mr Comptable des cabinets
  // (sous-domaine de prospection), aucun domaine nouveau.
  3: {
    expediteur: "Jacques Lalou <jacques@contact-pro.mrcomptable.fr>",
    reponse: "contact@mrcomptable.fr",
    site: "https://mrcomptable.fr",
    marque: "Mr Comptable",
    domaineAffiche: "mrcomptable.fr",
    sujet: "La comptabilité et la paie de votre cabinet, dans un seul outil",
    message: function (o: any) { return messageMrComptable(o); },
  },
};

// 🆕 02/10 — LA PAGE DE LA VIDEO EST-ELLE EN LIGNE ? Elle doit repondre, et
// contenir une video YouTube. Huit secondes au plus ; le moindre doute vaut
// « pas encore » : on attend le passage suivant plutot que d envoyer un
// lien mort.
async function videoEnLigne(): Promise<boolean> {
  const stop = new AbortController();
  const minuterie = setTimeout(function () { stop.abort(); }, 8000);
  try {
    const r = await fetch(PAGE_DEMONSTRATION, {
      signal: stop.signal, redirect: "follow", cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MrComptable-verification/1.0)" },
    });
    if (!r.ok) return false;
    const html = await r.text();
    return /youtube(-nocookie)?\.com\/embed\/[A-Za-z0-9_-]{6,}/.test(html);
  } catch (e) {
    return false;
  } finally {
    clearTimeout(minuterie);
  }
}

// Le pied de page : signature, source des coordonnees, desinscription.
// Le lien pointe sur le domaine de la vague : la page de desinscription y
// est servie depuis le 30/09 (reserve /desinscription du middleware).
function habillage(o: any, vague: number, texte: string): string {
  const v = VAGUES[vague];
  const email = String(o.email).toLowerCase();
  const lien = v.site + "/desinscription?email="
    + encodeURIComponent(email)
    + "&jeton=" + jetonDesinscription(email);

  const signature =
    "<br/><br/>"
    + "<p style=\"margin:0;line-height:1.5\">"
    + "Jacques Lalou<br/>"
    + "Fondateur — " + v.marque + "<br/>"
    + "<a href=\"" + v.site + "\" style=\"color:#8a6d3b\">" + v.domaineAffiche + "</a>"
    + "</p>";

  return texte.replace(/\n/g, "<br/>")
    + signature
    + "<br/><hr/>"
    + "<p style=\"font-size:12px;color:#888\">"
    + "Ce message vous est adressé dans le cadre de votre activité "
    + "professionnelle d'avocat. Vos coordonnées professionnelles "
    + "proviennent de l'annuaire national des avocats publié par le Conseil "
    + "national des barreaux. "
    + "<a href=\"" + lien + "\">Ne plus recevoir de messages</a>."
    + "</p>";
}

async function envoyer(vague: number, destinataire: string, html: string) {
  const v = VAGUES[vague];
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + (process.env.RESEND_API_KEY || ""),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: v.expediteur,
      reply_to: v.reponse,
      to: destinataire,
      subject: v.sujet,
      html: html,
    }),
  });

  const texte = await r.text();
  let data: any = null;
  try { data = texte ? JSON.parse(texte) : null; } catch { data = { brut: texte }; }

  return { ok: r.ok, statut: r.status, reponse: data };
}

function dateLimiteVagueDeux(): string {
  return new Date(Date.now() - DELAI_ENTRE_VAGUES * 86400000).toISOString();
}

// LE FILTRE, SELON LA VAGUE.
//
// Vague 1 : jamais contacte — statut 'enrichi', vague_envoi 0.
// Vague 2 : a recu la vague 1 il y a plus de trente jours, rien depuis.
// Vague 3 : a recu la vague 2 il y a plus de trente jours, rien depuis.
//
// ⚠️ DANS LES DEUX CAS : desabonne = false. Une desinscription est
// definitive, et la respecter n est pas une courtoisie mais la loi.
function appliquerFiltre(q: any, vague: number): any {
  let sortie = q
    .eq("desabonne", false)
    .not("email", "is", null)
    .lt("nb_envois", PLAFOND_ENVOIS);

  if (vague === 2 || vague === 3) {
    sortie = sortie
      .eq("statut", "envoye")
      .eq("vague_envoi", vague - 1)
      .lt("envoye_le", dateLimiteVagueDeux());
  } else {
    sortie = sortie
      .eq("statut", "enrichi")
      .eq("vague_envoi", 0);
  }

  return sortie;
}

// UNE VAGUE : lire, marquer, envoyer, noter. Rend le bilan de la vague.
async function traiterVague(supabase: any, vague: number, lot: number, debut: number) {
  const bilan: any = { vague: vague, envoyes: 0, echecs: 0, premiers_echecs: [], arret_budget: false };

  const { data: cibles, error: errLecture } = await appliquerFiltre(
    supabase
      .from("prospects_avocats")
      .select("id, email, dirigeant_prenom, dirigeant_nom, raison_sociale, nb_envois"),
    vague)
    // Les priorites de l annuaire d abord (1 = specialistes des affaires).
    .order("priorite", { ascending: true })
    .order("id", { ascending: true })
    .limit(lot);

  if (errLecture) {
    bilan.erreur = errLecture.message;
    return bilan;
  }

  const statutAttendu = vague >= 2 ? "envoye" : "enrichi";

  for (const o of (cibles || [])) {
    if (Date.now() - debut > BUDGET_MS) {
      bilan.arret_budget = true;
      break;
    }

    // MARQUAGE AVANT ENVOI, ET ON VERIFIE QU IL A PRIS. Une ligne deja
    // prise par un autre passage ne renvoie aucune ligne : on la saute,
    // plutot que de risquer un double envoi.
    const { data: marquee, error: errMarque } = await supabase
      .from("prospects_avocats")
      .update({ statut: "envoi_en_cours" })
      .eq("id", o.id)
      .eq("statut", statutAttendu)
      .select("id");

    if (errMarque || !marquee || marquee.length === 0) {
      bilan.echecs++;
      continue;
    }

    const html = habillage(o, vague, VAGUES[vague].message(o));
    const res = await envoyer(vague, String(o.email), html);

    if (res.ok) {
      bilan.envoyes++;
      await supabase
        .from("prospects_avocats")
        .update({
          statut: "envoye",
          envoye_le: new Date().toISOString(),
          vague_envoi: vague,
          nb_envois: (Number(o.nb_envois) || 0) + 1,
          motif_echec: null,
        })
        .eq("id", o.id);
    } else {
      bilan.echecs++;
      await supabase
        .from("prospects_avocats")
        .update({
          statut: "echec",
          motif_echec: JSON.stringify(res.reponse).slice(0, 500),
        })
        .eq("id", o.id);
      if (bilan.premiers_echecs.length < 5) {
        bilan.premiers_echecs.push({ email: o.email, statut: res.statut, reponse: res.reponse });
      }
    }

    // Un envoi toutes les deux secondes : le rythme d une personne, pas
    // celui d une machine.
    await pause(2000);
  }

  const { count: restant } = await appliquerFiltre(
    supabase.from("prospects_avocats")
      .select("id", { count: "exact", head: true }), vague);
  bilan.reste_a_contacter = restant || 0;

  return bilan;
}

export async function GET(req: NextRequest) {
  const debut = Date.now();

  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET
      || secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { erreur: "non autorise" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { erreur: "RESEND_API_KEY absente" }, { status: 500 });
  }

  const supabase = clientAdmin();

  // MODE MESURE : ?compter=1 ne lit que la reserve et n envoie RIEN.
  if (req.nextUrl.searchParams.get("compter") === "1") {
    const compter = async function (vague: number) {
      const { count } = await appliquerFiltre(
        supabase.from("prospects_avocats")
          .select("id", { count: "exact", head: true }), vague);
      return count || 0;
    };
    const { count: total } = await supabase
      .from("prospects_avocats").select("id", { count: "exact", head: true });
    const { count: enAttente } = await supabase
      .from("prospects_avocats").select("id", { count: "exact", head: true })
      .eq("vague_envoi", 1).eq("desabonne", false)
      .gte("envoye_le", dateLimiteVagueDeux());
    const { count: desabonnes } = await supabase
      .from("prospects_avocats").select("id", { count: "exact", head: true })
      .eq("desabonne", true);
    return NextResponse.json({
      mode: "mesure, aucun envoi",
      total_avocats: total || 0,
      vague_1_mysterllc_a_faire: await compter(1),
      vague_2_mrcrm_a_faire: await compter(2),
      vague_2_en_attente_du_delai: enAttente || 0,
      // 🆕 02/10
      vague_3_mrcomptable_a_faire: await compter(3),
      video_de_demonstration_en_ligne: await videoEnLigne(),
      delai_entre_vagues_jours: DELAI_ENTRE_VAGUES,
      desabonnes: desabonnes || 0,
    });
  }

  const demande = Number(req.nextUrl.searchParams.get("lot") || LOT_PAR_DEFAUT);
  const lot = demande > 0 && demande <= 500 ? demande : LOT_PAR_DEFAUT;

  // LES TROIS VAGUES A CHAQUE PASSAGE, la plus ancienne d abord : ses
  // prospects attendent depuis le plus longtemps. ?vague=1, 2 ou 3 n en
  // traite qu une.
  const seule = Number(req.nextUrl.searchParams.get("vague") || 0);
  const ordre = seule >= 1 && seule <= 3 ? [seule] : [3, 2, 1];

  const bilans: any[] = [];
  for (const vague of ordre) {
    if (Date.now() - debut > BUDGET_MS) break;
    // 🆕 02/10 — LA VAGUE 3 ATTEND SA VIDEO (voir PAGE_DEMONSTRATION).
    if (vague === 3 && !(await videoEnLigne())) {
      bilans.push({ vague: 3, envoyes: 0, en_attente: "la page de la vidéo de démonstration n'est pas encore en ligne : " + PAGE_DEMONSTRATION });
      continue;
    }
    bilans.push(await traiterVague(supabase, vague, lot, debut));
  }

  return NextResponse.json({ lot_par_vague: lot, vagues: bilans });
}
