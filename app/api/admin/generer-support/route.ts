import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 🚨 CINQ MINUTES, ET NON UNE — porte a 300 le 17/08.
//
// La generation de F900 a expire en 504 des que la carte de la plateforme a
// ete injectee : l'invite plus riche produit un texte plus long. 300 s est
// le maximum d'une fonction Node.js sur un plan Vercel Pro.
export const maxDuration = 300;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "formations-pdf";
const MODELE = "claude-sonnet-4-6";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// 🚨🚨🚨 LES TERMES INTERDITS — ajoutes le 18/08.
//
// POURQUOI CE BLOC EXISTE. Les 331 formations du catalogue ont ete
// nettoyees a la main de toute mention risquee. Les 669 formations a venir
// ne doivent pas reintroduire le probleme : la regle est donc posee ICI,
// dans le generateur, plutot que d'etre verifiee formation par formation.
//
// Ses mots le 18/08 : « les formations ne doivent en aucun cas employer des
// mots ou des termes qui pourraient nous creer des problemes de propriete
// intellectuelle », « sans que cela nous empeche de creer des formations de
// tres haute qualite ».
//
// ⚠️ DEUX FAMILLES DE RISQUE, A NE PAS CONFONDRE.
//
// LES MARQUES DEPOSEES. Le nom generique d'une discipline est libre ; le
// nom de l'ecole qui l'a deposee ne l'est pas. « Sophrologie » s'ecrit sans
// crainte, « sophrologie caycedienne » est une marque de la fondation
// Caycedo. Meme logique pour l'EMDR, la Process Communication, l'Analyse
// Transactionnelle, la Methode Pilates au sens strict, le MBSR de
// Kabat-Zinn.
//
// LES TITRES REGLEMENTES. Psychologue, psychotherapeute, osteopathe,
// dieteticien, infirmier, avocat, expert-comptable : ce sont des
// professions protegees par la loi francaise. Les employer expose BIEN PLUS
// qu'une marque — l'usurpation de titre est un delit penal.
//
// LES CERTIFICATIONS D'ETAT. Jacques a tranche le 29/07 : « Certification
// AcadeMIA Pro » lui convient, et il ne veut plus qu'on revienne dessus. En
// revanche le generateur ne doit JAMAIS ecrire qu'une formation prepare a
// un titre RNCP, a une certification RS, ou qu'elle est eligible au compte
// personnel de formation — ce serait faux, et c'est ce qui expose vraiment.
//
// 🚨 CE BLOC N'A PAS POUR OBJET D'APPAUVRIR LE CONTENU. On peut enseigner
// la relaxation dynamique sans nommer Caycedo, le retraitement des
// souvenirs sans ecrire EMDR, l'ecoute active sans citer Rogers comme
// methode deposee. La substance reste, l'etiquette juridique disparait.
const TERMES_INTERDITS =
  "\n🚨 TERMES ET FORMULATIONS INTERDITS — REGLE ABSOLUE, SANS EXCEPTION.\n\n" +

  "1. MARQUES ET METHODES DEPOSEES — n'ecris JAMAIS ces termes :\n" +
  "   sophrologie caycedienne, methode Caycedo, relaxation dynamique de Caycedo,\n" +
  "   EMDR, integration neuro-emotionnelle, Process Communication, Process Com,\n" +
  "   Analyse Transactionnelle au sens de l'ecole (le concept general reste libre),\n" +
  "   MBSR, mindfulness de Kabat-Zinn, methode Pilates, methode Feldenkrais,\n" +
  "   methode Vittoz, methode Coue au sens depose, Reiki Usui, hypnose Ericksonienne\n" +
  "   presentee comme une marque, Gordon, Faber et Mazlish, DISC, MBTI,\n" +
  "   Ennegramme au sens depose, CNV de Rosenberg presentee comme methode deposee.\n\n" +

  "   👉 CE QUI RESTE PARFAITEMENT AUTORISE, et qu'il faut employer a la place :\n" +
  "   sophrologie, relaxation dynamique, techniques de respiration, pleine conscience,\n" +
  "   meditation, communication bienveillante, ecoute active, communication non\n" +
  "   violente (en minuscules, comme notion generale), hypnose, hypnose conversationnelle,\n" +
  "   suggestion therapeutique, gainage postural, renforcement profond, typologies\n" +
  "   de personnalite, profils comportementaux.\n\n" +

  "2. TITRES PROFESSIONNELS REGLEMENTES — ne dis JAMAIS que la formation permet\n" +
  "   de devenir, d'exercer comme, ou de porter le titre de :\n" +
  "   psychologue, psychotherapeute, psychiatre, medecin, infirmier, kinesitherapeute,\n" +
  "   osteopathe, chiropracteur, dieteticien, orthophoniste, sage-femme, avocat,\n" +
  "   notaire, expert-comptable, commissaire aux comptes, architecte, veterinaire.\n\n" +

  "   👉 FORMULE AUTORISEE : « praticien en... », « technicien en... », « accompagnant\n" +
  "   en... », « conseiller en... », suivi du domaine. Exemple : « praticien en\n" +
  "   relation d'aide » et non « psychotherapeute ».\n\n" +

  "3. CERTIFICATIONS ET FINANCEMENTS — n'ecris JAMAIS :\n" +
  "   titre RNCP, certification RS, France Competences, eligible au CPF, compte\n" +
  "   personnel de formation, finance par un OPCO, diplome d'Etat, reconnu par\n" +
  "   l'Etat, certification reconnue, equivalence universitaire, credits ECTS.\n\n" +
  "   👉 LA SEULE FORMULE AUTORISEE : « attestation de fin de formation » ou\n" +
  "   « Certification AcadeMIA Pro ». Rien d'autre.\n\n" +

  "4. ORGANISMES ET ECOLES TIERS — ne cite AUCUN nom d'ecole, d'institut, de\n" +
  "   federation, de syndicat professionnel ni d'organisme certificateur, et\n" +
  "   n'affirme aucun partenariat, aucune affiliation, aucune reconnaissance par\n" +
  "   un tiers.\n\n" +

  "5. PROMESSES ET PREUVES — n'ecris AUCUNE promesse de resultat, AUCUN taux de\n" +
  "   reussite, AUCUN taux d'insertion, AUCUN temoignage, AUCUN nom d'ancien\n" +
  "   stagiaire, AUCUNE statistique inventee, AUCUN salaire moyen apres formation.\n\n" +

  "6. LOGICIELS ET OUTILS PROPRIETAIRES — tu peux les NOMMER, c'est un usage\n" +
  "   descriptif licite (Excel, Word, Sage, Photoshop, WordPress). Mais tu ne dois\n" +
  "   JAMAIS te presenter comme formation officielle, agreee ou certifiante de\n" +
  "   l'editeur, ni employer ses logos, slogans ou noms de certification\n" +
  "   (TOSA, MOS, Adobe Certified, etc.).\n\n" +

  "⚠️ CES INTERDITS NE DOIVENT EN RIEN APPAUVRIR LE CONTENU. La substance\n" +
  "pedagogique reste entiere : on enseigne la technique, pas l'etiquette. Une\n" +
  "formation de tres haute qualite se reconnait a la precision de son propos,\n" +
  "pas aux marques qu'elle cite.\n";

// 🗺️ LA CARTE REELLE DE LA PLATEFORME — ajoutee le 17/08.
//
// POURQUOI ELLE EXISTE. Le support de F900, le manuel d'utilisation
// d'AcadeMIA Pro, decrivait les actions en termes vagues : « il accede a la
// section de la plateforme qui lui permet de... ». Le modele ne connait pas
// la plateforme : il brode ce qu'il imagine d'un LMS.
//
// ⚠️ ELLE N'EST INJECTEE QUE POUR LES FORMATIONS QUI PARLENT DE LA
// PLATEFORME ELLE-MEME (F900 et suivantes).
//
// 🚨 A TENIR A JOUR : si un ecran est ajoute, renomme ou retire dans
// app/organisme, cette carte doit suivre.
const CARTE_PLATEFORME =
  "\n🗺️ CARTE REELLE DE LA PLATEFORME ACADEMIA PRO — NOMME LES ECRANS PAR " +
  "CES NOMS EXACTS ET PAR AUCUN AUTRE. N'invente jamais un ecran, un onglet " +
  "ou un bouton qui ne figure pas ici.\n\n" +

  "COTE APPRENANT (le stagiaire) :\n" +
  "  /connexion — page de connexion, l'apprenant saisit son adresse et son mot de passe\n" +
  "  /mon-espace — ses formations, sa progression, ses documents\n" +
  "  /lms — le lecteur de formation : chapitres, modules, contenu du cours\n" +
  "  /evaluation — les questionnaires de fin de module et leur correction expliquee\n" +
  "  /mes-certificats — ses attestations de fin de formation, a telecharger\n" +
  "  /classe-virtuelle — les seances en direct avec le formateur\n" +
  "  /dashboard — l'assistant conversationnel, qui repond a ses questions sur le cours\n\n" +

  "COTE ORGANISME (l'espace du client, sous /organisme) :\n" +
  "  /organisme — l'accueil de l'espace, avec les portes vers toutes les sections\n" +
  "  /organisme/catalogue — les formations ouvertes a ses stagiaires ; c'est ici qu'il " +
  "choisit celles qu'il diffuse et fixe son prix de vente\n" +
  "  /organisme/stagiaires — la liste de ses stagiaires, leur inscription, leur progression\n" +
  "  /organisme/importer — l'import d'une liste de stagiaires en nombre\n" +
  "  /organisme/documents — les documents administratifs edites a son en-tete\n" +
  "  /organisme/signatures — la signature electronique des documents et son archivage\n" +
  "  /organisme/evaluations — les evaluations a chaud et a froid de ses stagiaires\n" +
  "  /organisme/positionnements — les tests de positionnement en entree de formation\n" +
  "  /organisme/reclamations — le registre des reclamations et leurs actions correctives\n" +
  "  /organisme/formateurs — les dossiers de ses formateurs et leurs habilitations\n" +
  "  /organisme/veille — ses registres de veille : legale, metier, pedagogique, handicap\n" +
  "  /organisme/soustraitance — le suivi de ses sous-traitants\n" +
  "  /organisme/bilan — la preparation de son bilan pedagogique et financier annuel\n" +
  "  /organisme/seances — les seances de classe virtuelle qu'il programme\n" +
  "  /organisme/crm — le suivi commercial : ses prospects, leurs etapes, leur score\n" +
  "  /organisme/relances — les relances commerciales a envoyer\n" +
  "  /organisme/portail — sa page publique, ou ses formations sont presentees\n" +
  "  /organisme/factures — les factures qu'il emet a ses propres clients\n" +
  "  /organisme/facturation — ce qu'il doit a l'editeur : abonnement, part, redevance\n" +
  "  /organisme/financement — les dossiers de financement de ses stagiaires\n" +
  "  /organisme/amelioration — son registre d'amelioration continue\n\n" +

  "LA MARQUE BLANCHE : le logo, les couleurs et l'identite de l'organisme se " +
  "posent depuis l'accueil de son espace, /organisme. Une fois poses, ils " +
  "apparaissent partout : sur la plateforme que voient ses stagiaires, sur sa " +
  "page publique, et sur tous les documents qu'il edite. Le stagiaire ne voit " +
  "jamais le nom AcadeMIA Pro.\n";

function echapper(t: string): string {
  return String(t || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// "8h", "120h", "250h - 10 mois" -> 8, 120, 250. Zero si illisible.
function heuresDe(duree: any): number {
  const m = String(duree || "").replace(",", ".").match(/[\d.]+/);
  if (!m) return 0;
  const n = Number(m[0]);
  return n > 0 ? n : 0;
}

// UN MODULE TOUTES LES DEUX HEURES, plancher 4, plafond 20.
// N est utilise QUE SI AUCUN PLAN N EXISTE dans lms_plans.
function moduleDe(heures: number): { mini: number; maxi: number } {
  if (heures <= 0) return { mini: 10, maxi: 16 };
  const cible = Math.round(heures / 2);
  const n = Math.max(4, Math.min(20, cible));
  return { mini: n, maxi: n };
}

function renseigne(v: any): boolean {
  return typeof v === "string" && v.trim().length > 20;
}

// La formation porte-t-elle sur la plateforme elle-meme ?
function parleDeLaPlateforme(fiche: any): boolean {
  const code = String(fiche.code || "").toUpperCase();
  if (code === "F900") return true;
  const titre = String(fiche.titre || "").toLowerCase();
  return titre.indexOf("academia pro") >= 0 || titre.indexOf("académia pro") >= 0;
}

export async function GET(req: Request) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const cle = process.env.ANTHROPIC_API_KEY || "";
    if (!cle) {
      return NextResponse.json({ ok: false, erreur: "ANTHROPIC_API_KEY absente" }, { status: 500 });
    }

    const url = new URL(req.url);
    const demande = (url.searchParams.get("code") || "").trim().toUpperCase();
    // FORCE : ecrase le support existant au lieu de le refuser.
    const force = url.searchParams.get("force") === "1";

    const { data: fichiers } = await supabase.storage
      .from(BUCKET)
      .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });
    const existants = new Set((fichiers || []).map((f) => f.name));

    // LA FICHE FAIT FOI QUAND ELLE EST RENSEIGNEE.
    const { data: formations } = await supabase
      .from("formations")
      .select("code, titre, domaine, niveau, prix, duree, description, programme, objectifs, prerequis, public_cible")
      .order("code", { ascending: true });

    const candidates = (formations || []).filter(
      (f: any) =>
        String(f.code || "").indexOf("SK") !== 0 &&
        !existants.has(f.code + "_support_cours.html")
    );

    const fiche: any = demande
      ? (formations || []).find((f: any) => f.code === demande)
      : candidates[0];

    if (!fiche) {
      return NextResponse.json({ ok: true, termine: true, restants: 0, message: "aucune formation sans support" });
    }

    if (!force && existants.has(fiche.code + "_support_cours.html")) {
      return NextResponse.json({ ok: true, code: fiche.code, deja: true, restants: candidates.length });
    }

    // 🚨🚨 LE PLAN DE lms_plans PREVAUT SUR TOUT — ajoute le 17/08.
    //
    // F900 avait recu un plan complet en base : cinq chapitres, vingt
    // modules, dont UN CHAPITRE ENTIER consacre a la marque blanche. Cette
    // route ne lisait que formations.programme, vide pour F900 — le modele a
    // donc invente ses propres modules, faisant disparaitre la marque
    // blanche et introduisant trois modules « Creer une formation ».
    //
    // ORDRE DE PRIORITE : lms_plans, puis formations.programme, puis
    // redaction libre avec le nombre de modules calcule sur la duree.
    const { data: lignesPlan } = await supabase
      .from("lms_plans")
      .select("chapitre_num, chapitre_titre, module_num, module_titre, type")
      .eq("formation_code", fiche.code)
      .order("chapitre_num", { ascending: true })
      .order("module_num", { ascending: true })
      .limit(500);

    const plan = lignesPlan || [];
    const aPlan = plan.length > 0;

    let texteDuPlan = "";
    let chapitreCourant = -1;
    for (const l of plan) {
      if (l.chapitre_num !== chapitreCourant) {
        chapitreCourant = l.chapitre_num;
        texteDuPlan += "\nCHAPITRE " + l.chapitre_num + " - " + String(l.chapitre_titre || "").trim() + "\n";
      }
      texteDuPlan += "  Module " + l.chapitre_num + "." + l.module_num + " - "
        + String(l.module_titre || "").trim()
        + " [" + String(l.type || "theorie") + "]\n";
    }

    const nbModulesPlan = plan.length;
    const nbChapitresPlan = new Set(plan.map(function (l: any) { return l.chapitre_num; })).size;

    const heures = heuresDe(fiche.duree);
    const bornes = aPlan
      ? { mini: nbModulesPlan, maxi: nbModulesPlan }
      : moduleDe(heures);
    const combien = bornes.mini === bornes.maxi
      ? "exactement " + bornes.mini + " modules"
      : bornes.mini + " a " + bornes.maxi + " modules";
    const parModule = heures > 0 && bornes.maxi > 0
      ? Math.max(1, Math.round(heures / bornes.maxi))
      : 0;

    // Ce que la fiche impose. Chaque bloc n apparait que s il est renseigne.
    let impose = "";
    if (renseigne(fiche.description)) {
      impose += "\nCE QUE LA FORMATION EST (a respecter) :\n" + fiche.description + "\n";
    }
    if (renseigne(fiche.objectifs)) {
      impose += "\nOBJECTIFS IMPOSES (reprends-les, reformule sans les trahir) :\n" + fiche.objectifs + "\n";
    }
    if (renseigne(fiche.public_cible)) {
      impose += "\nPUBLIC IMPOSE :\n" + fiche.public_cible + "\n";
    }
    if (renseigne(fiche.prerequis)) {
      impose += "\nPREREQUIS IMPOSES :\n" + fiche.prerequis + "\n";
    }

    if (aPlan) {
      impose += "\n🚨 PLAN OFFICIEL DE LA FORMATION — C'EST CE PLAN, ET LUI SEUL, "
        + "QUI DOIT ETRE SUIVI.\n"
        + "Il compte " + nbChapitresPlan + " chapitres et " + nbModulesPlan + " modules. "
        + "Tu reprends CHAQUE module dans cet ordre, avec SON INTITULE EXACT. "
        + "Tu n'en ajoutes aucun, tu n'en retires aucun, tu n'en renommes aucun. "
        + "Ta seule liberte est de rediger les deux a quatre lignes qui decrivent "
        + "le contenu de chaque module.\n"
        + texteDuPlan;
    } else if (renseigne(fiche.programme)) {
      impose += "\nPROGRAMME IMPOSE — c est CE decoupage qu il faut suivre, "
        + "module par module, en gardant les intitules et les notions citees. "
        + "Tu peux etoffer la description de chaque module, tu ne peux ni en "
        + "ajouter, ni en retirer, ni remplacer les notions par d autres :\n"
        + fiche.programme + "\n";
    }

    // LA CARTE DES ECRANS, pour les formations qui portent sur la plateforme.
    const surLaPlateforme = parleDeLaPlateforme(fiche);
    if (surLaPlateforme) {
      impose += CARTE_PLATEFORME;
    }

    // 🚨 LES TERMES INTERDITS, POUR TOUTES LES FORMATIONS SANS EXCEPTION.
    impose += TERMES_INTERDITS;

    const aProgramme = aPlan || renseigne(fiche.programme);

    // 🚨 TITRES DE RUBRIQUE ACCENTUES — corrige le 18/08 au soir.
    //
    // L'invite ecrivait « PREREQUIS », « COMPETENCES VISEES », « MODALITES
    // D EVALUATION » sans accents, et le modele les recopiait tels quels
    // dans les supports. Le HTML final est en UTF-8 : rien n'empechait les
    // accents. Les titres sont desormais accentues dans l'invite, avec une
    // consigne explicite. Les supports generes AVANT cette correction
    // restent desaccentues sur ces titres.
    const invite =
      "Tu rediges le support de cours officiel d un organisme de formation professionnelle francais.\n\n" +
      "Formation : " + fiche.titre + "\n" +
      "Domaine : " + (fiche.domaine || "non precise") + "\n" +
      "Niveau : " + (fiche.niveau || "non precise") + "\n" +
      (heures > 0 ? "Duree totale : " + heures + " heures.\n" : "") +
      impose +
      "\nProduis un document structure en francais comprenant, dans cet ordre, avec ces titres de rubrique ECRITS EXACTEMENT AINSI, accents compris :\n" +
      "1. OBJECTIFS DE LA FORMATION : un paragraphe de 5 a 8 lignes.\n" +
      "2. PR\u00c9REQUIS : 3 a 5 lignes.\n" +
      "3. PUBLIC CIBLE : 3 a 5 lignes.\n" +
      "4. COMP\u00c9TENCES VIS\u00c9ES : 6 a 10 puces.\n" +
      "5. PROGRAMME : " + combien + ". Chaque module sur une ligne au format exact :\n" +
      "Module N - Titre du module (XXh)\n" +
      "suivi de 2 a 4 lignes decrivant son contenu.\n" +
      (aPlan
        ? "Les modules sont numerotes de 1 a " + nbModulesPlan + " en continu, "
          + "dans l'ordre du plan ci-dessus, et tu conserves les intitules a "
          + "l'identique.\n"
        : "") +
      "6. MODALIT\u00c9S D\u2019\u00c9VALUATION : un paragraphe.\n\n" +
      "Regles imperatives :\n" +
      "- Le document est destine a des stagiaires : ecris un francais irreprochable, " +
      "AVEC TOUS SES ACCENTS, dans les titres de rubrique comme dans le texte.\n" +
      (aPlan
        ? "- LE PLAN OFFICIEL CI-DESSUS EST LA SEULE SOURCE DU PROGRAMME. "
          + "Toute invention de module, tout intitule modifie, toute omission "
          + "rend le document inutilisable : il decrirait une formation qui "
          + "n'existe pas.\n"
        : "") +
      (surLaPlateforme
        ? "- 🚨 CETTE FORMATION PORTE SUR LA PLATEFORME ELLE-MEME. C'EST UN "
          + "MANUEL D'UTILISATION, PAS UN COURS THEORIQUE. Chaque description "
          + "de module DOIT NOMMER L'ECRAN CONCERNE tel qu'il figure dans la "
          + "carte ci-dessus, et decrire l'action concrete que l'utilisateur y "
          + "accomplit. UNE DESCRIPTION VAGUE REND LE MANUEL INUTILISABLE.\n"
          + "- N'invente AUCUN ecran, AUCUN onglet, AUCUN bouton absent de la "
          + "carte.\n"
        : "") +
      "- 🚨 LES TERMES INTERDITS CI-DESSUS SONT UNE REGLE ABSOLUE. Un seul "
      + "terme depose, un seul titre reglemente, une seule mention de "
      + "certification d'Etat rend le document inutilisable et expose "
      + "juridiquement l'organisme. Verifie chaque intitule de module avant "
      + "de le retenir.\n" +
      (impose
        ? "- CE QUI EST IMPOSE CI-DESSUS PREVAUT SUR TOUT LE RESTE. N invente "
          + "aucune fonctionnalite, aucun ecran, aucune notion qui n y figure pas.\n"
        : "") +
      (aProgramme
        ? "- Le programme impose donne les modules : suis-le dans son ordre, "
          + "sans en ajouter ni en supprimer.\n"
        : "") +
      (heures > 0
        ? "- LE NOMBRE DE MODULES EST IMPOSE : " + combien + ", ni plus ni moins.\n" +
          "- LE TOTAL DES HEURES DES MODULES DOIT FAIRE EXACTEMENT " + heures + " HEURES" +
          (parModule > 0 ? ", soit environ " + parModule + " heures par module" : "") + ".\n"
        : "- Le total des heures doit etre coherent avec le niveau annonce.\n") +
      "- Nomme les choses comme l utilisateur les voit a l ecran, jamais en "
      + "jargon technique.\n" +
      "- N indique AUCUN prix.\n" +
      "- Ecris en texte brut, sans balises HTML, sans Markdown, sans introduction ni conclusion sur toi-meme.";

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cle,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELE,
        max_tokens: 8000,
        messages: [{ role: "user", content: invite }],
      }),
    });

    const reponse = await r.json();
    if (!r.ok) {
      return NextResponse.json(
        { ok: false, code: fiche.code, erreur: "Claude a repondu " + r.status },
        { status: 500 }
      );
    }

    const texte = (reponse.content || [])
      .map((b: any) => (b && b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();

    if (texte.length < 1500) {
      return NextResponse.json(
        { ok: false, code: fiche.code, erreur: "reponse trop courte (" + texte.length + " caracteres)" },
        { status: 500 }
      );
    }

    // 🚨 LE CONTROLE APRES COUP. L'invite pose la regle, ce bloc verifie
    // qu'elle a ete tenue — un modele peut se tromper, et un support fautif
    // partirait sinon en production sans que personne ne le voie.
    //
    // ⚠️ ON NE BLOQUE PAS LA PRODUCTION : le support est ecrit, mais la
    // reponse porte la liste des termes trouves, pour que Jacques puisse
    // decider. Bloquer laisserait la formation sans support du tout.
    const SURVEILLES = [
      "caycedien", "caycedo", "emdr", "process com", "mbsr", "kabat-zinn",
      "feldenkrais", "vittoz", "reiki usui", "mbti", "disc ",
      "rncp", "france competences", "france compétences", "repertoire specifique",
      "répertoire spécifique", "eligible au cpf", "éligible au cpf",
      "compte personnel de formation", "diplome d'etat", "diplôme d'état",
      "reconnu par l'etat", "reconnu par l'état", "credits ects", "crédits ects",
      "tosa", "adobe certified", "microsoft office specialist",
      "devenir psychologue", "devenir psychotherapeute", "devenir psychothérapeute",
      "devenir osteopathe", "devenir ostéopathe", "devenir dieteticien",
      "devenir diététicien", "devenir kinesitherapeute", "devenir kinésithérapeute",
    ];

    const enMinuscules = texte.toLowerCase();
    const trouves: string[] = [];
    for (const terme of SURVEILLES) {
      if (enMinuscules.indexOf(terme) >= 0) trouves.push(terme);
    }

    const corps = texte
      .split(/\n{2,}/)
      .map((p) => "<p>" + echapper(p).replace(/\n/g, "<br>") + "</p>")
      .join("\n");

    const html =
      '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">\n' +
      "<title>" + echapper(fiche.titre) + " \u2014 Acad\u00e9mIA Pro</title>\n" +
      "<style>body{font-family:Georgia,serif;max-width:900px;margin:0 auto;padding:30px;background:#fff;color:#1a1a1a;line-height:1.7;} h1{color:#c8a96e;} p{margin:0 0 14px;}</style>\n" +
      "</head><body>\n" +
      "<h1>Acad\u00e9mIA Pro</h1>\n" +
      "<p>Support de cours officiel \u2014 Document confidentiel</p>\n" +
      "<h1>" + echapper(fiche.titre) + "</h1>\n" +
      "<p><strong>Code :</strong> " + echapper(fiche.code) +
      " | <strong>Domaine :</strong> " + echapper(fiche.domaine || "") +
      " | <strong>Niveau :</strong> " + echapper(fiche.niveau || "") +
      (heures > 0 ? " | <strong>Dur\u00e9e :</strong> " + heures + " h" : "") + "</p>\n" +
      corps +
      "\n</body></html>";

    const ecriture = await supabase.storage
      .from(BUCKET)
      .upload(fiche.code + "_support_cours.html", new Blob([html], { type: "text/html" }), {
        upsert: force,
        cacheControl: "60",
      });

    if (ecriture.error) {
      return NextResponse.json({ ok: false, code: fiche.code, erreur: ecriture.error.message }, { status: 500 });
    }

    await supabase.from("supports_inventaire").upsert(
      {
        fichier: fiche.code + "_support_cours.html",
        code_fichier: fiche.code,
        titre_interne: fiche.titre,
        titre_fiche: fiche.titre,
        statut: trouves.length > 0 ? "a_verifier" : "conforme",
        taille: html.length,
        bavardage: false,
        sections: 6,
        risque: trouves.length > 0 ? "Termes surveilles : " + trouves.join(", ") : "",
        extrait: texte.slice(0, 300),
        vu_le: new Date().toISOString(),
      },
      { onConflict: "fichier" }
    );

    return NextResponse.json({
      ok: true,
      code: fiche.code,
      titre: fiche.titre,
      heures: heures,
      plan_suivi: aPlan,
      carte_injectee: surLaPlateforme,
      modules_du_plan: aPlan ? nbModulesPlan : null,
      chapitres_du_plan: aPlan ? nbChapitresPlan : null,
      modules_demandes: bornes.maxi,
      fiche_suivie: impose ? true : false,
      programme_impose: aProgramme,
      termes_surveilles: trouves.length > 0 ? trouves : null,
      alerte: trouves.length > 0
        ? "⚠️ Termes surveilles trouves dans ce support : " + trouves.join(", ") + ". A relire."
        : null,
      force: force,
      taille: html.length,
      restants: Math.max(candidates.length - 1, 0),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
