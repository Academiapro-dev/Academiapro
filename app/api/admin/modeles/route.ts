import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    global: {
      fetch: function (url: any, options: any) {
        return fetch(url, { ...(options || {}), cache: "no-store" });
      },
    },
  }
);

function refuse() {
  return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
}

const CHAMPS_COMMUNS = [
  { cle: "contrepartie", libelle: "Denomination de la contrepartie" },
  { cle: "forme", libelle: "Forme juridique et capital" },
  { cle: "siege", libelle: "Adresse du siege" },
  { cle: "immatriculation", libelle: "SIREN ou numero d immatriculation" },
  { cle: "representant", libelle: "Representant et sa qualite" },
  { cle: "email", libelle: "Email du signataire" },
];

// Clause de droit applicable commune a tous les modeles de l editeur. Droit
// francais et Tribunal de commerce de Paris : nos cocontractants sont
// francais et nous operons depuis la France. Une clause renvoyant au Wyoming
// serait inapplicable en pratique.
const DROIT_9 =
  "## Article 9 - Droit applicable et juridiction\n\n" +
  "Le present accord est soumis au droit francais.\n\n" +
  "Tout differend relatif a sa validite, son interpretation ou son execution sera soumis au " +
  "Tribunal de commerce de Paris, auquel les parties attribuent competence exclusive, " +
  "nonobstant pluralite de defendeurs ou appel en garantie.\n";

const DROIT_7 =
  "## Article 7 - Droit applicable et juridiction\n\n" +
  "Le present contrat est soumis au droit francais.\n\n" +
  "Tout differend relatif a sa validite, son interpretation ou son execution sera soumis au " +
  "Tribunal de commerce de Paris, auquel les parties attribuent competence exclusive, " +
  "nonobstant pluralite de defendeurs ou appel en garantie.\n";

// Cinq modeles prets a l emploi. Ce sont des PROJETS : ils doivent etre relus
// par un professionnel du droit avant d etre opposes a un cocontractant.
const MODELES = [
  {
    code: "PACK",
    titre: "Contrat d abonnement - plateforme et catalogue en marque blanche",
    categorie: "client",
    description:
      "Le contrat du pack : plateforme, catalogue, marque blanche et gestion administrative.",
    champs: CHAMPS_COMMUNS.concat([
      { cle: "numero_da", libelle: "Numero de declaration d activite du client" },
      { cle: "abonnement", libelle: "Abonnement mensuel HT, en euros" },
      { cle: "commission", libelle: "Commission sur le catalogue editeur, en pourcentage" },
      { cle: "plancher", libelle: "Minimum par stagiaire inscrit, en euros" },
      { cle: "gestion", libelle: "Forfait par stagiaire avec gestion administrative, en euros" },
      { cle: "duree", libelle: "Duree initiale, en mois" },
      { cle: "preavis", libelle: "Preavis de resiliation, en mois" },
    ]),
    corps:
      "ENTRE LES SOUSSIGNES\n\n" +
      "AcadeMIA Pro LLC, societe de droit du Wyoming, dont le siege est situe 30 N Gould St " +
      "STE R, Sheridan WY 82801, Etats-Unis, representee par Jacques Lalou, en sa qualite de " +
      "gerant, ci-apres denommee l Editeur,\n\n" +
      "ET\n\n" +
      "{{contrepartie}}, {{forme}}, dont le siege est situe {{siege}}, immatriculee sous le " +
      "numero {{immatriculation}}, declaree en qualite d organisme de formation sous le numero " +
      "{{numero_da}}, representee par {{representant}}, ci-apres denommee le Client,\n\n" +
      "IL A ETE CONVENU CE QUI SUIT\n\n" +
      "## Article 1 - Objet\n\n" +
      "L Editeur met a la disposition du Client, pour la duree du present contrat, une " +
      "plateforme de formation en ligne, son catalogue de formations, et les services " +
      "d accompagnement definis ci-apres.\n\n" +
      "Le Client exploite ces moyens sous sa propre marque, aupres de ses propres clients, en " +
      "son nom et pour son compte. Il demeure seul organisme de formation au sens du code du " +
      "travail, seul titulaire de sa declaration d activite et, le cas echeant, de sa " +
      "certification qualite.\n\n" +
      "## Article 2 - Ce que l Editeur met a disposition\n\n" +
      "L Editeur fournit, sans supplement de prix :\n\n" +
      "L acces a la plateforme pour le Client et ses collaborateurs, ainsi qu aux espaces de " +
      "ses stagiaires.\n\n" +
      "Le catalogue de formations de l Editeur, dans son etendue au jour de la souscription et " +
      "tel qu il evolue pendant la duree du contrat.\n\n" +
      "Un portail public en marque blanche : denomination, logo, couleurs et nom de domaine du " +
      "Client. Les documents remis aux stagiaires et les manuels portent son en-tete.\n\n" +
      "Les outils de suivi : registre des stagiaires, evaluations, documents administratifs, " +
      "signature electronique, journal des telechargements.\n\n" +
      "La maintenance, les corrections et les evolutions de la plateforme.\n\n" +
      "L Editeur ne garantit aucun volume de vente ni aucun resultat commercial ou pedagogique.\n\n" +
      "## Article 3 - Ce que le Client conserve\n\n" +
      "Les formations creees par le Client demeurent sa propriete pleine et entiere. L Editeur " +
      "n acquiert aucun droit sur elles, ne percoit aucune commission a ce titre, et ne peut " +
      "les diffuser ni les reutiliser sans son accord ecrit.\n\n" +
      "Les donnees des stagiaires du Client lui appartiennent. Elles lui sont restituees sur " +
      "demande, dans un format exploitable, pendant la duree du contrat et les trente jours " +
      "suivant son terme.\n\n" +
      "## Article 4 - Obligations du Client\n\n" +
      "Le Client repond seul de la relation avec ses stagiaires et ses clients, de la " +
      "facturation, du recouvrement, et du respect de la reglementation applicable a son " +
      "activite.\n\n" +
      "Il verifie que chaque formation qu il diffuse correspond a ce qu il vend, et s abstient " +
      "de toute affirmation inexacte a son sujet.\n\n" +
      "Il s interdit de reproduire, d extraire, de rediffuser ou de ceder les contenus de " +
      "l Editeur en dehors du cadre defini au present contrat.\n\n" +
      "Il informe l Editeur de toute reclamation, controle ou audit portant sur une formation " +
      "issue du catalogue de l Editeur.\n\n" +
      "## Article 5 - Prix\n\n" +
      "Abonnement mensuel : {{abonnement}} euros hors taxes, tout compris. Il couvre " +
      "l integralite de l article 2, sans option ni supplement.\n\n" +
      "Catalogue de l Editeur : {{commission}} % du prix de vente hors taxes pratique par le " +
      "Client.\n\n" +
      "Formations propres du Client : aucune commission.\n\n" +
      "Minimum par stagiaire : pour chaque stagiaire inscrit, il est du le plus eleve des deux " +
      "montants suivants : la commission definie ci-dessus, ou {{plancher}} euros hors taxes. " +
      "Ce minimum est du pour tout stagiaire inscrit, y compris sur les formations propres du " +
      "Client et y compris lorsque la formation n est facturee a personne : il couvre les " +
      "couts de plateforme, de correction et de traitement automatise que chaque inscription " +
      "engendre.\n\n" +
      "Affaires apportees : lorsque l Editeur presente au Client un client final qu il a " +
      "trouve lui-meme, la part revenant a l Editeur sur cette affaire est portee a 50 % du " +
      "prix de vente hors taxes.\n\n" +
      "## Article 6 - Fait generateur et reglement\n\n" +
      "Les sommes dues au titre de l article 5 sont acquises a l Editeur a l inscription du " +
      "stagiaire. Elles restent dues quelle que soit l issue du parcours, notamment en cas " +
      "d abandon, d interruption ou d absence du stagiaire.\n\n" +
      "Le decompte est etabli mensuellement. Le reglement intervient a trente jours a compter " +
      "de la facture.\n\n" +
      "Toute somme impayee a son echeance porte interet au taux legal majore, et donne lieu a " +
      "l indemnite forfaitaire de recouvrement prevue par le code de commerce.\n\n" +
      "## Article 7 - Gestion administrative des formations propres du Client\n\n" +
      "Cette prestation est optionnelle. Elle n est due que si le Client la demande, et se " +
      "substitue alors au minimum par stagiaire defini a l article 5.\n\n" +
      "Lorsqu elle est retenue, l Editeur prend en charge, pour les formations propres du " +
      "Client : la production des conventions et contrats, des convocations, des feuilles " +
      "d emargement, des evaluations, des attestations de fin de formation, ainsi que la " +
      "constitution des pieces justificatives attendues lors d un audit, et la preparation des " +
      "elements du bilan pedagogique et financier.\n\n" +
      "Prix : {{gestion}} euros hors taxes par stagiaire inscrit, tout compris, minimum de " +
      "l article 5 inclus.\n\n" +
      "Le Client demeure seul responsable, devant l administration comme devant tout " +
      "certificateur, de l exactitude des informations qu il transmet, de la verification des " +
      "documents produits, et du depot de ses declarations. L Editeur produit les elements ; " +
      "le Client les controle, les signe et les depose.\n\n" +
      "## Article 8 - Propriete intellectuelle et marque blanche\n\n" +
      "Les contenus, manuels, marques, developpements et bases de donnees de l Editeur " +
      "demeurent sa propriete exclusive.\n\n" +
      "Le present contrat n emporte aucune cession. Il confere au Client une licence d usage " +
      "non exclusive, non cessible et limitee a la duree du contrat, l autorisant a diffuser " +
      "les formations du catalogue sous sa propre marque aupres de ses stagiaires.\n\n" +
      "A l expiration du contrat, quelle qu en soit la cause, cette licence cesse de plein " +
      "droit. Le Client cesse toute diffusion des contenus de l Editeur et n en conserve " +
      "aucune copie. Les formations qu il a creees lui-meme, ainsi que les donnees de ses " +
      "stagiaires, lui demeurent acquises.\n\n" +
      "## Article 9 - Donnees personnelles\n\n" +
      "Le Client est responsable de traitement des donnees de ses stagiaires. L Editeur agit " +
      "en qualite de sous-traitant au sens de l article 28 du reglement (UE) 2016/679.\n\n" +
      "Une annexe de sous-traitance est conclue entre les parties et fait partie integrante du " +
      "present contrat.\n\n" +
      "## Article 10 - Disponibilite et responsabilite\n\n" +
      "L Editeur s engage a mettre en oeuvre ses meilleurs efforts pour assurer la " +
      "disponibilite de la plateforme. Il n est pas tenu des interruptions imputables aux " +
      "services tiers dont elle depend, ni des cas de force majeure.\n\n" +
      "La responsabilite de chaque partie ne peut etre engagee qu en cas de faute prouvee et " +
      "se limite aux dommages directs, dans la limite des sommes echangees au titre des douze " +
      "mois precedant le fait generateur.\n\n" +
      "Sont exclus les dommages indirects, la perte de chiffre d affaires, la perte de " +
      "clientele, et les consequences d un retrait de certification ou d un refus de prise en " +
      "charge par un financeur.\n\n" +
      "## Article 11 - Duree et resiliation\n\n" +
      "Le contrat est conclu pour une duree de {{duree}} mois, renouvelable par tacite " +
      "reconduction. Chaque partie peut y mettre fin par ecrit moyennant un preavis de " +
      "{{preavis}} mois.\n\n" +
      "En cas de manquement grave, la resiliation intervient de plein droit quinze jours apres " +
      "une mise en demeure restee sans effet.\n\n" +
      "Les stagiaires inscrits avant le terme achevent leur parcours. Les sommes " +
      "correspondantes restent dues.\n\n" +
      "## Article 12 - Confidentialite\n\n" +
      "Chaque partie s engage a ne pas divulguer les informations non publiques recues de " +
      "l autre, pendant la duree du contrat et les trois annees suivantes.\n\n" +
      "## Article 13 - Droit applicable et juridiction\n\n" +
      "Le present contrat est soumis au droit francais.\n\n" +
      "Tout differend relatif a sa validite, son interpretation ou son execution sera soumis " +
      "au Tribunal de commerce de Paris, auquel les parties attribuent competence exclusive, " +
      "nonobstant pluralite de defendeurs ou appel en garantie.\n",
  },
  {
    code: "PARTENARIAT",
    titre: "Contrat de partenariat de distribution",
    categorie: "partenariat",
    description:
      "Pour un partenaire qui distribue vos formations aupres de ses propres clients.",
    champs: CHAMPS_COMMUNS.concat([
      { cle: "objet", libelle: "Ce que le partenaire distribue" },
      { cle: "commission", libelle: "Part revenant au partenaire, en pourcentage" },
      { cle: "duree", libelle: "Duree initiale, en mois" },
      { cle: "preavis", libelle: "Preavis de resiliation, en mois" },
    ]),
    corps:
      "ENTRE LES SOUSSIGNES\n\n" +
      "AcadeMIA Pro LLC, societe de droit du Wyoming, dont le siege est situe 30 N Gould St " +
      "STE R, Sheridan WY 82801, Etats-Unis, representee par Jacques Lalou, en sa qualite de " +
      "gerant, ci-apres denommee l Editeur,\n\n" +
      "ET\n\n" +
      "{{contrepartie}}, {{forme}}, dont le siege est situe {{siege}}, immatriculee sous le " +
      "numero {{immatriculation}}, representee par {{representant}}, ci-apres denommee le " +
      "Partenaire,\n\n" +
      "IL A ETE CONVENU CE QUI SUIT\n\n" +
      "## Article 1 - Objet\n\n" +
      "Le present contrat a pour objet de definir les conditions dans lesquelles le Partenaire " +
      "distribue {{objet}} aupres de ses propres clients.\n\n" +
      "Le Partenaire agit en son nom propre et pour son compte. Il n est ni mandataire ni agent " +
      "commercial de l Editeur, et ne dispose d aucun pouvoir de l engager.\n\n" +
      "## Article 2 - Obligations de l Editeur\n\n" +
      "L Editeur met a disposition du Partenaire les contenus et les moyens techniques " +
      "necessaires a la distribution. Il en assure la maintenance et la mise a jour.\n\n" +
      "L Editeur ne garantit aucun volume de vente ni aucun resultat commercial.\n\n" +
      "## Article 3 - Obligations du Partenaire\n\n" +
      "Le Partenaire promeut les prestations avec loyaute et s interdit toute affirmation " +
      "inexacte a leur sujet. Il repond seul de la relation avec ses clients, de la facturation " +
      "et du recouvrement.\n\n" +
      "Il s interdit de reproduire, d extraire ou de rediffuser les contenus en dehors du cadre " +
      "defini au present contrat.\n\n" +
      "## Article 4 - Remuneration\n\n" +
      "Le Partenaire percoit {{commission}} % du prix de vente hors taxes des prestations " +
      "effectivement reglees par ses clients. Le decompte est etabli mensuellement.\n\n" +
      "## Article 5 - Propriete intellectuelle\n\n" +
      "Les contenus, marques et developpements demeurent la propriete exclusive de l Editeur. " +
      "Le present contrat n emporte aucune cession, mais une licence d usage non exclusive et " +
      "non cessible, limitee a sa duree.\n\n" +
      "## Article 6 - Duree et resiliation\n\n" +
      "Le contrat est conclu pour une duree de {{duree}} mois, renouvelable par tacite " +
      "reconduction. Chaque partie peut y mettre fin par ecrit moyennant un preavis de " +
      "{{preavis}} mois.\n\n" +
      "En cas de manquement grave, la resiliation intervient de plein droit quinze jours apres " +
      "une mise en demeure restee sans effet.\n\n" +
      "## Article 7 - Confidentialite\n\n" +
      "Chaque partie s engage a ne pas divulguer les informations non publiques recues de " +
      "l autre, pendant la duree du contrat et les trois annees suivantes.\n\n" +
      "## Article 8 - Responsabilite\n\n" +
      "La responsabilite de chaque partie ne peut etre engagee qu en cas de faute prouvee et se " +
      "limite aux dommages directs, dans la limite des sommes echangees au titre des douze mois " +
      "precedents.\n\n" +
      DROIT_9,
  },
  {
    code: "CONFIDENTIALITE",
    titre: "Accord de confidentialite",
    categorie: "fournisseur",
    description:
      "A faire signer avant toute discussion ou l on montre des chiffres, du code ou des methodes.",
    champs: CHAMPS_COMMUNS.concat([
      { cle: "objet", libelle: "Objet des echanges" },
      { cle: "duree", libelle: "Duree de l engagement, en annees" },
    ]),
    corps:
      "ENTRE LES SOUSSIGNES\n\n" +
      "AcadeMIA Pro LLC, societe de droit du Wyoming, dont le siege est situe 30 N Gould St " +
      "STE R, Sheridan WY 82801, Etats-Unis, representee par Jacques Lalou, en sa qualite de " +
      "gerant,\n\n" +
      "ET\n\n" +
      "{{contrepartie}}, {{forme}}, dont le siege est situe {{siege}}, immatriculee sous le " +
      "numero {{immatriculation}}, representee par {{representant}},\n\n" +
      "IL A ETE CONVENU CE QUI SUIT\n\n" +
      "## Article 1 - Contexte\n\n" +
      "Les parties envisagent {{objet}}. A cette occasion, chacune d elles sera amenee a " +
      "communiquer a l autre des informations non publiques.\n\n" +
      "Le present accord est reciproque : chaque partie est tour a tour partie emettrice et " +
      "partie destinataire, et supporte les memes obligations.\n\n" +
      "## Article 2 - Informations couvertes\n\n" +
      "Sont confidentielles toutes les informations echangees, quel qu en soit le support : " +
      "donnees commerciales et financieres, methodes, contenus pedagogiques, code source, " +
      "listes de clients ou de prospects, tarifs et conditions.\n\n" +
      "Ne sont pas couvertes les informations deja publiques, celles deja detenues avant " +
      "l echange, et celles dont la divulgation est imposee par une autorite.\n\n" +
      "## Article 3 - Engagements\n\n" +
      "Chaque partie s engage a garder ces informations strictement confidentielles, a ne les " +
      "utiliser qu aux fins de l objet ci-dessus, et a ne les communiquer qu aux personnes qui " +
      "en ont besoin et sont tenues d une obligation equivalente.\n\n" +
      "## Article 4 - Duree\n\n" +
      "Le present engagement prend effet a sa signature et demeure en vigueur pendant " +
      "{{duree}} annees, y compris si les discussions n aboutissent pas.\n\n" +
      "## Article 5 - Restitution\n\n" +
      "A premiere demande, chaque partie restitue ou detruit les documents recus et en atteste " +
      "par ecrit.\n\n" +
      "## Article 6 - Absence d engagement\n\n" +
      "Le present accord n emporte aucune obligation de conclure, ni aucune cession de droit " +
      "sur les informations echangees.\n\n" +
      "## Article 7 - Donnees personnelles\n\n" +
      "Si des donnees a caractere personnel sont echangees au titre du present accord, chaque " +
      "partie s engage a les traiter conformement au reglement (UE) 2016/679 et a la loi " +
      "Informatique et Libertes, a ne les utiliser qu aux fins de l objet defini a l article 1, " +
      "et a les supprimer dans les conditions prevues a l article 5.\n\n" +
      "Le present accord ne vaut pas contrat de sous-traitance au sens de l article 28 du " +
      "reglement (UE) 2016/679. Si l une des parties devait traiter des donnees personnelles " +
      "pour le compte de l autre, une annexe de sous-traitance distincte serait conclue " +
      "prealablement.\n\n" +
      "## Article 8 - Consequences d un manquement\n\n" +
      "Tout manquement aux obligations du present accord engage la responsabilite de son " +
      "auteur, qui repare le prejudice direct qui en resulte.\n\n" +
      "Les parties reconnaissent qu une divulgation non autorisee est susceptible de causer un " +
      "prejudice que des dommages et interets ne suffiraient pas a reparer. En consequence, la " +
      "partie lesee pourra solliciter en refere toute mesure destinee a faire cesser le " +
      "manquement, sans prejudice de toute demande indemnitaire ulterieure.\n\n" +
      DROIT_9,
  },
  {
    code: "SOUSTRAITANCE",
    titre: "Contrat de sous-traitance de formation",
    categorie: "fournisseur",
    description:
      "Pour confier une action de formation a un formateur ou a un organisme tiers.",
    champs: CHAMPS_COMMUNS.concat([
      { cle: "prestation", libelle: "Action confiee" },
      { cle: "periode", libelle: "Periode d execution" },
      { cle: "prix", libelle: "Prix hors taxes" },
    ]),
    corps:
      "ENTRE LES SOUSSIGNES\n\n" +
      "AcadeMIA Pro LLC, societe de droit du Wyoming, dont le siege est situe 30 N Gould St " +
      "STE R, Sheridan WY 82801, Etats-Unis, representee par Jacques Lalou, en sa qualite de " +
      "gerant, ci-apres le Donneur d ordre,\n\n" +
      "ET\n\n" +
      "{{contrepartie}}, {{forme}}, dont le siege est situe {{siege}}, immatriculee sous le " +
      "numero {{immatriculation}}, representee par {{representant}}, ci-apres le Sous-traitant,\n\n" +
      "IL A ETE CONVENU CE QUI SUIT\n\n" +
      "## Article 1 - Objet\n\n" +
      "Le Donneur d ordre confie au Sous-traitant la realisation de {{prestation}}, sur la " +
      "periode {{periode}}.\n\n" +
      "## Article 2 - Qualification et conformite\n\n" +
      "Le Sous-traitant garantit disposer des qualifications, habilitations et autorisations " +
      "necessaires a l execution de la prestation, et s engage a les maintenir pendant toute " +
      "la duree du contrat. Il en fournit les justificatifs a premiere demande.\n\n" +
      "Il se conforme au referentiel qualite applicable et fournit les elements de preuve " +
      "attendus lors d un audit.\n\n" +
      "## Article 3 - Execution\n\n" +
      "Le Sous-traitant execute la prestation en toute independance, avec ses propres moyens " +
      "et son propre personnel, dont il demeure seul employeur.\n\n" +
      "## Article 4 - Prix et reglement\n\n" +
      "Le prix est fixe a {{prix}} hors taxes. Le reglement intervient par virement a trente " +
      "jours a compter de la facture, apres service fait.\n\n" +
      "## Article 5 - Evaluation\n\n" +
      "Le Donneur d ordre evalue la prestation a son terme. Une evaluation defavorable peut " +
      "conduire au non-renouvellement.\n\n" +
      "## Article 6 - Obligations sociales\n\n" +
      "Le Sous-traitant atteste etre a jour de ses obligations sociales et fiscales, et remet " +
      "les attestations exigees par la reglementation applicable.\n\n" +
      "## Article 7 - Confidentialite et propriete\n\n" +
      "Les contenus fournis par le Donneur d ordre demeurent sa propriete. Le Sous-traitant " +
      "s interdit de les reutiliser en dehors de la prestation.\n\n" +
      "## Article 8 - Donnees personnelles\n\n" +
      "Lorsque le Sous-traitant traite des donnees a caractere personnel pour le compte du " +
      "Donneur d ordre, notamment les donnees des stagiaires, une annexe de sous-traitance " +
      "conforme a l article 28 du reglement (UE) 2016/679 est conclue et fait partie " +
      "integrante du present contrat.\n\n" +
      DROIT_9,
  },
  {
    code: "PRESTATION",
    titre: "Contrat de prestation - creation de contenu",
    categorie: "fournisseur",
    description:
      "Pour faire rediger un contenu par un tiers, avec cession des droits a votre profit.",
    champs: CHAMPS_COMMUNS.concat([
      { cle: "prestation", libelle: "Contenu a produire" },
      { cle: "delai", libelle: "Delai de livraison" },
      { cle: "prix", libelle: "Prix hors taxes" },
    ]),
    corps:
      "ENTRE LES SOUSSIGNES\n\n" +
      "AcadeMIA Pro LLC, societe de droit du Wyoming, dont le siege est situe 30 N Gould St " +
      "STE R, Sheridan WY 82801, Etats-Unis, representee par Jacques Lalou, en sa qualite de " +
      "gerant, ci-apres le Client,\n\n" +
      "ET\n\n" +
      "{{contrepartie}}, {{forme}}, dont le siege est situe {{siege}}, immatriculee sous le " +
      "numero {{immatriculation}}, representee par {{representant}}, ci-apres le Prestataire,\n\n" +
      "IL A ETE CONVENU CE QUI SUIT\n\n" +
      "## Article 1 - Objet\n\n" +
      "Le Prestataire realise pour le Client {{prestation}}, livrable au plus tard le " +
      "{{delai}}.\n\n" +
      "## Article 2 - Originalite\n\n" +
      "Le Prestataire garantit que le contenu livre est original, qu il en est l auteur, et " +
      "qu il ne porte atteinte a aucun droit de tiers. Il garantit le Client contre toute " +
      "reclamation a ce titre.\n\n" +
      "## Article 3 - Cession des droits\n\n" +
      "Le Prestataire cede au Client, a titre exclusif et pour la duree legale de protection, " +
      "les droits de reproduction, de representation, d adaptation et d exploitation du contenu " +
      "livre, pour le monde entier et pour tous supports.\n\n" +
      "Cette cession est comprise dans le prix defini a l article 4.\n\n" +
      "## Article 4 - Prix et reglement\n\n" +
      "Le prix est fixe a {{prix}} hors taxes, payable a trente jours apres acceptation de la " +
      "livraison.\n\n" +
      "## Article 5 - Acceptation\n\n" +
      "Le Client dispose de quinze jours pour formuler ses observations. Passe ce delai sans " +
      "reserve, la livraison est reputee acceptee.\n\n" +
      "## Article 6 - Confidentialite\n\n" +
      "Le Prestataire s interdit de divulguer les informations recues et de reutiliser le " +
      "contenu produit pour son compte ou pour un tiers.\n\n" +
      DROIT_7,
  },
];

// Compare le modele du fichier a celui enregistre en base. Le fichier fait
// foi : c est lui qui est versionne et relu.
function differe(fourni: any, enBase: any): boolean {
  if (!enBase) return true;
  if (String(enBase.corps || "") !== fourni.corps) return true;
  if (String(enBase.titre || "") !== fourni.titre) return true;
  if (JSON.stringify(enBase.champs || []) !== JSON.stringify(fourni.champs)) return true;
  return false;
}

export async function GET() {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const { data, error } = await supabase
      .from("modeles_contrats")
      .select("*")
      .order("titre", { ascending: true })
      .limit(200);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const parCode: any = {};
    for (const m of data || []) parCode[m.code] = m;

    const aInstaller = MODELES.filter(function (m: any) {
      return differe(m, parCode[m.code]);
    }).length;

    return NextResponse.json({
      ok: true,
      total: (data || []).length,
      a_installer: aInstaller,
      modeles: data || [],
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    // Mise en place des modeles fournis. Ceux que vous avez crees vous-meme
    // ne sont jamais touches : seuls les codes presents dans ce fichier le
    // sont, et uniquement s ils different de leur version enregistree.
    if (b.action === "installer") {
      const { data: existants } = await supabase
        .from("modeles_contrats")
        .select("id, code, titre, corps, champs")
        .limit(200);

      const parCode: any = {};
      for (const m of existants || []) parCode[m.code] = m;

      const nouveaux = MODELES.filter(function (m: any) { return !parCode[m.code]; });
      const aJour = MODELES.filter(function (m: any) {
        return parCode[m.code] && differe(m, parCode[m.code]);
      });

      if (nouveaux.length === 0 && aJour.length === 0) {
        return NextResponse.json({
          ok: true,
          installes: 0,
          actualises: 0,
          message: "Vos modeles sont deja a jour.",
        });
      }

      if (nouveaux.length > 0) {
        const { error } = await supabase.from("modeles_contrats").insert(nouveaux);
        if (error) {
          return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
        }
      }

      for (const m of aJour) {
        const { error } = await supabase
          .from("modeles_contrats")
          .update({
            titre: m.titre,
            categorie: m.categorie,
            description: m.description,
            champs: m.champs,
            corps: m.corps,
            updated_at: new Date().toISOString(),
          })
          .eq("id", parCode[m.code].id);

        if (error) {
          return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
        }
      }

      const bouts: string[] = [];
      if (nouveaux.length > 0) bouts.push(nouveaux.length + " modele(s) installe(s)");
      if (aJour.length > 0) bouts.push(aJour.length + " mis a jour");

      return NextResponse.json({
        ok: true,
        installes: nouveaux.length,
        actualises: aJour.length,
        message: bouts.join(", ") + ". Relisez-les avant tout usage.",
      });
    }

    const code = String(b.code || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    const titre = String(b.titre || "").trim();
    const corps = String(b.corps || "").trim();

    if (code.length < 3 || titre.length < 3 || corps.length < 50) {
      return NextResponse.json(
        { ok: false, erreur: "Un code, un titre et un corps de contrat sont necessaires." },
        { status: 400 }
      );
    }

    const fiche: any = {
      code: code,
      titre: titre,
      categorie: String(b.categorie || "partenariat").trim(),
      description: b.description ? String(b.description).trim() : null,
      champs: Array.isArray(b.champs) ? b.champs : [],
      corps: corps,
      actif: b.actif !== false,
      updated_at: new Date().toISOString(),
    };

    const { data: deja } = await supabase
      .from("modeles_contrats")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    const r = deja
      ? await supabase.from("modeles_contrats").update(fiche).eq("id", deja.id)
      : await supabase.from("modeles_contrats").insert(fiche);

    if (r.error) {
      return NextResponse.json({ ok: false, erreur: r.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, code: code, remplace: !!deja });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Modele non precise." }, { status: 400 });
    }

    const { error } = await supabase.from("modeles_contrats").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, supprime: id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
