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

// Champs des modeles que le CLIENT du pack etablit avec ses propres clients.
// L organisme de formation n est pas l Editeur : c est le client du pack.
const CHAMPS_ORGANISME = [
  { cle: "organisme", libelle: "Denomination de l organisme de formation" },
  { cle: "organisme_siege", libelle: "Adresse du siege de l organisme" },
  { cle: "organisme_siret", libelle: "SIRET de l organisme" },
  { cle: "organisme_da", libelle: "Numero de declaration d activite" },
  { cle: "organisme_representant", libelle: "Representant de l organisme et sa qualite" },
];

// Clause de droit applicable commune aux modeles de l editeur.
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

// Onze modeles prets a l emploi. Ce sont des PROJETS : ils doivent etre relus
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
    code: "PACK_INTERNATIONAL",
    titre: "Contrat d abonnement international - plateforme et catalogue en marque blanche",
    categorie: "client",
    description:
      "Le contrat du pack pour un client etabli hors de France. Sans reference au droit francais de la formation.",
    champs: CHAMPS_COMMUNS.concat([
      { cle: "pays", libelle: "Pays d etablissement du client" },
      { cle: "tva_intra", libelle: "Numero de TVA intracommunautaire, si UE" },
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
      "{{contrepartie}}, {{forme}}, dont le siege est situe {{siege}}, {{pays}}, immatriculee " +
      "sous le numero {{immatriculation}}, representee par {{representant}}, ci-apres denommee " +
      "le Client,\n\n" +
      "IL A ETE CONVENU CE QUI SUIT\n\n" +
      "## Article 1 - Objet\n\n" +
      "L Editeur met a la disposition du Client, pour la duree du present contrat, une " +
      "plateforme de formation en ligne, son catalogue de formations, et les services " +
      "d accompagnement definis ci-apres.\n\n" +
      "Le Client exploite ces moyens sous sa propre marque, aupres de ses propres clients, en " +
      "son nom et pour son compte.\n\n" +
      "## Article 2 - Conformite locale\n\n" +
      "Le Client est etabli en {{pays}}. Il fait son affaire personnelle du respect de la " +
      "reglementation applicable a son activite de formation dans ce pays, notamment en " +
      "matiere d autorisation d exercer, de certification qualite, de contenu obligatoire des " +
      "contrats de formation, de protection des consommateurs et de fiscalite.\n\n" +
      "L Editeur ne delivre aucune garantie de conformite des contenus ou des documents " +
      "produits par la plateforme au droit du pays du Client. Il appartient au Client de les " +
      "adapter et de les faire verifier.\n\n" +
      "Les modeles de documents proposes par la plateforme sont concus au regard du droit " +
      "francais et sont fournis a titre indicatif.\n\n" +
      "## Article 3 - Ce que l Editeur met a disposition\n\n" +
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
      "## Article 4 - Ce que le Client conserve\n\n" +
      "Les formations creees par le Client demeurent sa propriete pleine et entiere. L Editeur " +
      "n acquiert aucun droit sur elles, ne percoit aucune commission a ce titre, et ne peut " +
      "les diffuser ni les reutiliser sans son accord ecrit.\n\n" +
      "Les donnees des stagiaires du Client lui appartiennent. Elles lui sont restituees sur " +
      "demande, dans un format exploitable, pendant la duree du contrat et les trente jours " +
      "suivant son terme.\n\n" +
      "## Article 5 - Prix\n\n" +
      "Abonnement mensuel : {{abonnement}} euros hors taxes, tout compris. Il couvre " +
      "l integralite de l article 3, sans option ni supplement.\n\n" +
      "Catalogue de l Editeur : {{commission}} % du prix de vente hors taxes pratique par le " +
      "Client.\n\n" +
      "Formations propres du Client : aucune commission.\n\n" +
      "Minimum par stagiaire : pour chaque stagiaire inscrit, il est du le plus eleve des deux " +
      "montants suivants : la commission definie ci-dessus, ou {{plancher}} euros hors taxes. " +
      "Ce minimum est du pour tout stagiaire inscrit, y compris sur les formations propres du " +
      "Client et y compris lorsque la formation n est facturee a personne.\n\n" +
      "Affaires apportees : lorsque l Editeur presente au Client un client final qu il a " +
      "trouve lui-meme, la part revenant a l Editeur sur cette affaire est portee a 50 % du " +
      "prix de vente hors taxes.\n\n" +
      "Tous les montants sont exprimes en euros. Les frais bancaires et de change sont a la " +
      "charge du Client.\n\n" +
      "## Article 6 - Taxes\n\n" +
      "Le Client communique son numero de TVA intracommunautaire {{tva_intra}} lorsqu il est " +
      "etabli dans l Union europeenne. Dans ce cas, la prestation releve de l autoliquidation " +
      "et aucune taxe n est facturee par l Editeur.\n\n" +
      "Lorsque le Client est etabli hors de l Union europeenne, la prestation est hors du champ " +
      "de la taxe sur la valeur ajoutee de l Union.\n\n" +
      "Toute retenue a la source ou taxe locale exigible dans le pays du Client demeure a sa " +
      "charge et ne vient pas en diminution des sommes dues a l Editeur.\n\n" +
      "## Article 7 - Fait generateur et reglement\n\n" +
      "Les sommes dues au titre de l article 5 sont acquises a l Editeur a l inscription du " +
      "stagiaire. Elles restent dues quelle que soit l issue du parcours, notamment en cas " +
      "d abandon, d interruption ou d absence du stagiaire.\n\n" +
      "Le decompte est etabli mensuellement. Le reglement intervient a trente jours a compter " +
      "de la facture, par virement, sans compensation ni deduction.\n\n" +
      "## Article 8 - Gestion administrative des formations propres du Client\n\n" +
      "Cette prestation est optionnelle. Elle n est due que si le Client la demande, et se " +
      "substitue alors au minimum par stagiaire defini a l article 5.\n\n" +
      "Lorsqu elle est retenue, l Editeur prend en charge, pour les formations propres du " +
      "Client : la production des documents contractuels et pedagogiques, des convocations, " +
      "des feuilles d emargement, des evaluations, des attestations de fin de formation, ainsi " +
      "que la constitution des pieces justificatives d execution.\n\n" +
      "Prix : {{gestion}} euros hors taxes par stagiaire inscrit, tout compris, minimum de " +
      "l article 5 inclus.\n\n" +
      "Le Client demeure seul responsable de l exactitude des informations qu il transmet, de " +
      "la verification des documents produits, de leur conformite au droit de son pays, et de " +
      "leur depot aupres de toute autorite. L Editeur produit les elements ; le Client les " +
      "controle, les signe et les depose.\n\n" +
      "## Article 9 - Propriete intellectuelle et marque blanche\n\n" +
      "Les contenus, manuels, marques, developpements et bases de donnees de l Editeur " +
      "demeurent sa propriete exclusive.\n\n" +
      "Le present contrat n emporte aucune cession. Il confere au Client une licence d usage " +
      "non exclusive, non cessible et limitee a la duree du contrat, l autorisant a diffuser " +
      "les formations du catalogue sous sa propre marque aupres de ses stagiaires, sur le " +
      "territoire de {{pays}}.\n\n" +
      "A l expiration du contrat, quelle qu en soit la cause, cette licence cesse de plein " +
      "droit. Le Client cesse toute diffusion des contenus de l Editeur et n en conserve " +
      "aucune copie. Les formations qu il a creees lui-meme, ainsi que les donnees de ses " +
      "stagiaires, lui demeurent acquises.\n\n" +
      "## Article 10 - Donnees personnelles\n\n" +
      "Le Client est responsable de traitement des donnees de ses stagiaires. L Editeur agit " +
      "en qualite de sous-traitant.\n\n" +
      "Lorsque des donnees de personnes situees dans l Union europeenne sont traitees, une " +
      "annexe conforme a l article 28 du reglement (UE) 2016/679 est conclue entre les parties " +
      "et fait partie integrante du present contrat.\n\n" +
      "Lorsque le droit du pays du Client impose des obligations equivalentes, le Client en " +
      "informe l Editeur et les parties concluent l annexe correspondante.\n\n" +
      "## Article 11 - Disponibilite et responsabilite\n\n" +
      "L Editeur s engage a mettre en oeuvre ses meilleurs efforts pour assurer la " +
      "disponibilite de la plateforme. Il n est pas tenu des interruptions imputables aux " +
      "services tiers dont elle depend, ni des cas de force majeure.\n\n" +
      "La responsabilite de chaque partie ne peut etre engagee qu en cas de faute prouvee et " +
      "se limite aux dommages directs, dans la limite des sommes echangees au titre des douze " +
      "mois precedant le fait generateur.\n\n" +
      "Sont exclus les dommages indirects, la perte de chiffre d affaires, la perte de " +
      "clientele, et les consequences d une non-conformite a la reglementation locale.\n\n" +
      "## Article 12 - Duree et resiliation\n\n" +
      "Le contrat est conclu pour une duree de {{duree}} mois, renouvelable par tacite " +
      "reconduction. Chaque partie peut y mettre fin par ecrit moyennant un preavis de " +
      "{{preavis}} mois.\n\n" +
      "En cas de manquement grave, la resiliation intervient de plein droit quinze jours apres " +
      "une mise en demeure restee sans effet.\n\n" +
      "Les stagiaires inscrits avant le terme achevent leur parcours. Les sommes " +
      "correspondantes restent dues.\n\n" +
      "## Article 13 - Confidentialite\n\n" +
      "Chaque partie s engage a ne pas divulguer les informations non publiques recues de " +
      "l autre, pendant la duree du contrat et les trois annees suivantes.\n\n" +
      "## Article 14 - Langue\n\n" +
      "Le present contrat est redige en langue francaise. Toute traduction n a qu une valeur " +
      "informative ; en cas de contradiction, la version francaise prevaut.\n\n" +
      "## Article 15 - Droit applicable et juridiction\n\n" +
      "Le present contrat est soumis au droit francais, a l exclusion de la Convention des " +
      "Nations unies sur les contrats de vente internationale de marchandises.\n\n" +
      "Tout differend relatif a sa validite, son interpretation ou son execution sera soumis " +
      "au Tribunal de commerce de Paris, auquel les parties attribuent competence exclusive, " +
      "nonobstant pluralite de defendeurs ou appel en garantie.\n",
  },
  {
    code: "CONVENTION",
    titre: "Convention de formation professionnelle - entreprise",
    categorie: "client",
    description:
      "Pour votre client organisme : la convention qu il signe avec une entreprise qui forme ses salaries.",
    champs: CHAMPS_ORGANISME.concat([
      { cle: "contrepartie", libelle: "Denomination de l entreprise cliente" },
      { cle: "forme", libelle: "Forme juridique de l entreprise" },
      { cle: "siege", libelle: "Adresse du siege de l entreprise" },
      { cle: "immatriculation", libelle: "SIRET de l entreprise" },
      { cle: "representant", libelle: "Representant de l entreprise et sa qualite" },
      { cle: "email", libelle: "Email du signataire" },
      { cle: "intitule", libelle: "Intitule de l action de formation" },
      { cle: "objectifs", libelle: "Objectifs professionnels vises" },
      { cle: "prerequis", libelle: "Prerequis et public vise" },
      { cle: "modalites", libelle: "Modalites : distanciel, presentiel, mixte" },
      { cle: "duree_heures", libelle: "Duree totale, en heures" },
      { cle: "periode", libelle: "Periode d execution, du ... au ..." },
      { cle: "lieu", libelle: "Lieu ou plateforme d execution" },
      { cle: "beneficiaires", libelle: "Nombre et noms des salaries beneficiaires" },
      { cle: "prix", libelle: "Prix total hors taxes" },
    ]),
    corps:
      "ENTRE LES SOUSSIGNES\n\n" +
      "{{organisme}}, organisme de formation dont le siege est situe {{organisme_siege}}, " +
      "immatricule sous le numero {{organisme_siret}}, declare aupres du prefet de region sous " +
      "le numero {{organisme_da}}, cet enregistrement ne valant pas agrement de l Etat, " +
      "represente par {{organisme_representant}}, ci-apres l Organisme,\n\n" +
      "ET\n\n" +
      "{{contrepartie}}, {{forme}}, dont le siege est situe {{siege}}, immatriculee sous le " +
      "numero {{immatriculation}}, representee par {{representant}}, ci-apres l Entreprise,\n\n" +
      "IL A ETE CONVENU CE QUI SUIT, en application des articles L.6353-1 et suivants du code " +
      "du travail\n\n" +
      "## Article 1 - Objet de la convention\n\n" +
      "L Organisme organise l action de formation intitulee {{intitule}} au benefice des " +
      "salaries designes par l Entreprise.\n\n" +
      "Cette action releve de la categorie des actions de formation au sens de l article " +
      "L.6313-1 du code du travail.\n\n" +
      "## Article 2 - Nature et caracteristiques de l action\n\n" +
      "Objectifs professionnels vises : {{objectifs}}.\n\n" +
      "Prerequis et public vise : {{prerequis}}.\n\n" +
      "Modalites de deroulement : {{modalites}}.\n\n" +
      "Duree totale : {{duree_heures}} heures.\n\n" +
      "Periode d execution : {{periode}}.\n\n" +
      "Lieu ou plateforme : {{lieu}}.\n\n" +
      "Le programme detaille de l action, precisant son contenu, ses moyens pedagogiques et " +
      "techniques ainsi que ses modalites d evaluation, est annexe a la presente convention et " +
      "en fait partie integrante.\n\n" +
      "## Article 3 - Beneficiaires\n\n" +
      "L action est dispensee aux salaries suivants : {{beneficiaires}}.\n\n" +
      "L Entreprise informe chaque salarie des objectifs, du contenu et des modalites de " +
      "l action, ainsi que des dates et lieux de son deroulement.\n\n" +
      "## Article 4 - Suivi et evaluation\n\n" +
      "L execution de l action est attestee par des feuilles d emargement signees par periode " +
      "et par participant, ou, en cas de formation a distance, par les traces d activite " +
      "produites par la plateforme.\n\n" +
      "A l issue de l action, l Organisme remet a l Entreprise une attestation de fin de " +
      "formation mentionnant les objectifs, la nature et la duree de l action, ainsi que les " +
      "resultats de l evaluation des acquis.\n\n" +
      "## Article 5 - Prix et reglement\n\n" +
      "Le prix de l action est fixe a {{prix}} hors taxes. Il couvre l integralite des " +
      "prestations decrites a l article 2.\n\n" +
      "Le reglement intervient a trente jours a compter de la facture, apres execution.\n\n" +
      "Toute somme impayee a son echeance porte interet au taux legal majore, et donne lieu a " +
      "l indemnite forfaitaire de recouvrement prevue par le code de commerce.\n\n" +
      "## Article 6 - Prise en charge par un financeur\n\n" +
      "Lorsque l Entreprise sollicite la prise en charge de tout ou partie du prix par un " +
      "operateur de competences ou tout autre financeur, elle en informe l Organisme avant le " +
      "debut de l action et lui communique l accord de prise en charge.\n\n" +
      "En cas de refus, de reduction ou de retrait de la prise en charge, quelle qu en soit la " +
      "cause, l Entreprise demeure redevable envers l Organisme de l integralite du prix.\n\n" +
      "## Article 7 - Absence, abandon et dedit\n\n" +
      "En cas d absence ou d abandon d un participant, le prix demeure du en totalite, sauf " +
      "cas de force majeure durement etabli.\n\n" +
      "En cas de renoncement de l Entreprise moins de quinze jours avant le debut de l action, " +
      "il est du a l Organisme une indemnite egale a 30 % du prix, non imputable sur les " +
      "depenses liberatoires de formation.\n\n" +
      "En cas d interruption de l action du fait de l Organisme, le prix est du au prorata des " +
      "heures effectivement realisees.\n\n" +
      "## Article 8 - Donnees personnelles\n\n" +
      "Chaque partie traite les donnees des participants conformement au reglement (UE) " +
      "2016/679. L Entreprise est responsable des donnees de ses salaries qu elle transmet ; " +
      "l Organisme les traite aux seules fins de l execution de la presente convention et de " +
      "ses obligations legales de conservation.\n\n" +
      "## Article 9 - Confidentialite et propriete des supports\n\n" +
      "Les supports pedagogiques remis aux participants sont proteges par le droit d auteur. " +
      "Leur reproduction, diffusion ou reutilisation en dehors du cadre de l action est " +
      "interdite.\n\n" +
      "## Article 10 - Differends\n\n" +
      "Les parties recherchent une solution amiable. A defaut, le differend est soumis au " +
      "tribunal de commerce dans le ressort duquel se trouve le siege de l Organisme.\n",
  },
  {
    code: "FORMATION_PARTICULIER",
    titre: "Contrat de formation - particulier",
    categorie: "client",
    description:
      "Pour votre client organisme : le contrat qu il signe avec un particulier qui finance lui-meme sa formation.",
    champs: CHAMPS_ORGANISME.concat([
      { cle: "contrepartie", libelle: "Nom et prenom du stagiaire" },
      { cle: "siege", libelle: "Adresse du domicile du stagiaire" },
      { cle: "email", libelle: "Email du stagiaire" },
      { cle: "naissance", libelle: "Date et lieu de naissance" },
      { cle: "intitule", libelle: "Intitule de la formation" },
      { cle: "objectifs", libelle: "Objectifs vises" },
      { cle: "prerequis", libelle: "Prerequis" },
      { cle: "modalites", libelle: "Modalites : distanciel, presentiel, mixte" },
      { cle: "duree_heures", libelle: "Duree totale, en heures" },
      { cle: "periode", libelle: "Periode d execution, du ... au ..." },
      { cle: "sanction", libelle: "Sanction : attestation de suivi, certificat..." },
      { cle: "prix", libelle: "Prix total TTC" },
      { cle: "echelonnement", libelle: "Modalites de reglement : comptant, 4 fois, 12 fois..." },
    ]),
    corps:
      "ENTRE LES SOUSSIGNES\n\n" +
      "{{organisme}}, organisme de formation dont le siege est situe {{organisme_siege}}, " +
      "immatricule sous le numero {{organisme_siret}}, declare aupres du prefet de region sous " +
      "le numero {{organisme_da}}, cet enregistrement ne valant pas agrement de l Etat, " +
      "represente par {{organisme_representant}}, ci-apres l Organisme,\n\n" +
      "ET\n\n" +
      "{{contrepartie}}, ne le {{naissance}}, demeurant {{siege}}, ci-apres le Stagiaire,\n\n" +
      "IL A ETE CONVENU CE QUI SUIT, en application des articles L.6353-3 et suivants du code " +
      "du travail\n\n" +
      "## Article 1 - Objet\n\n" +
      "Le Stagiaire, agissant a titre personnel et financant lui-meme sa formation, s inscrit " +
      "a l action intitulee {{intitule}}.\n\n" +
      "## Article 2 - Nature et caracteristiques\n\n" +
      "Objectifs vises : {{objectifs}}.\n\n" +
      "Prerequis : {{prerequis}}.\n\n" +
      "Modalites de deroulement : {{modalites}}.\n\n" +
      "Duree totale : {{duree_heures}} heures.\n\n" +
      "Periode d execution : {{periode}}.\n\n" +
      "Sanction de la formation : {{sanction}}.\n\n" +
      "Le programme detaille, precisant le contenu, les moyens pedagogiques et les modalites " +
      "d evaluation, est annexe au present contrat et en fait partie integrante.\n\n" +
      "## Article 3 - Delai de retractation\n\n" +
      "Le Stagiaire dispose d un delai de dix jours a compter de la signature du present " +
      "contrat pour se retracter, par lettre recommandee avec avis de reception.\n\n" +
      "Aucune somme ne peut etre exigee ni encaissee avant l expiration de ce delai.\n\n" +
      "En cas de retractation dans ce delai, aucune somme n est due par le Stagiaire et " +
      "l integralite des sommes eventuellement versees lui est restituee.\n\n" +
      "## Article 4 - Prix et reglement\n\n" +
      "Le prix total de la formation est de {{prix}} toutes taxes comprises.\n\n" +
      "A l expiration du delai de retractation, il ne peut etre exige du Stagiaire un premier " +
      "versement superieur a 30 % du prix. Le solde est echelonne au fur et a mesure du " +
      "deroulement de la formation.\n\n" +
      "Modalites retenues : {{echelonnement}}.\n\n" +
      "## Article 5 - Interruption de la formation\n\n" +
      "En cas de cessation anticipee de la formation du fait de l Organisme, le present " +
      "contrat est resilie de plein droit. Seules les prestations effectivement dispensees " +
      "sont dues, au prorata de leur valeur prevue au contrat.\n\n" +
      "En cas d abandon du Stagiaire pour un motif de force majeure durement reconnu, seules " +
      "les prestations effectivement dispensees sont dues.\n\n" +
      "En cas d abandon du Stagiaire pour tout autre motif, le prix demeure du en totalite. " +
      "L Organisme peut en outre reclamer un dedommagement qui ne peut exceder 30 % du prix, " +
      "conformement a l article L.6353-7 du code du travail.\n\n" +
      "## Article 6 - Assiduite et sanction\n\n" +
      "Le Stagiaire s engage a suivre l action avec assiduite. Son assiduite est etablie par " +
      "les feuilles d emargement ou, en formation a distance, par les traces d activite de la " +
      "plateforme.\n\n" +
      "L attestation de fin de formation est remise au Stagiaire a l issue de l action.\n\n" +
      "## Article 7 - Donnees personnelles\n\n" +
      "L Organisme traite les donnees du Stagiaire aux seules fins de l execution du present " +
      "contrat et de ses obligations legales de conservation, conformement au reglement (UE) " +
      "2016/679. Le Stagiaire dispose des droits d acces, de rectification, d effacement, de " +
      "limitation, de portabilite et d opposition, qu il exerce aupres de l Organisme.\n\n" +
      "## Article 8 - Propriete des supports\n\n" +
      "Les supports remis au Stagiaire sont proteges par le droit d auteur. Leur reproduction, " +
      "diffusion ou reutilisation en dehors d un usage strictement personnel est interdite.\n\n" +
      "## Article 9 - Reclamations, mediation et differends\n\n" +
      "Toute reclamation est adressee par ecrit a l Organisme, qui accuse reception sous cinq " +
      "jours ouvres et repond au fond dans les trente jours.\n\n" +
      "A defaut de solution amiable, le Stagiaire consommateur peut recourir gratuitement au " +
      "mediateur de la consommation dont les coordonnees figurent sur les conditions generales " +
      "de l Organisme, ou saisir la plateforme europeenne de reglement en ligne des litiges.\n\n" +
      "Le present contrat est soumis au droit francais. Le Stagiaire consommateur peut saisir " +
      "soit la juridiction du lieu ou il demeurait lors de la conclusion du contrat, soit " +
      "celle du lieu du dommage.\n\n" +
      "## Article 10 - Exemplaires\n\n" +
      "Le present contrat est etabli en deux exemplaires, dont un remis au Stagiaire.\n",
  },
  {
    code: "SOUSTRAITANCE_OF",
    titre: "Convention de sous-traitance entre organismes de formation",
    categorie: "partenariat",
    description:
      "Quand un organisme confie tout ou partie d une action a un autre organisme declare.",
    champs: CHAMPS_ORGANISME.concat([
      { cle: "contrepartie", libelle: "Denomination de l organisme sous-traitant" },
      { cle: "forme", libelle: "Forme juridique du sous-traitant" },
      { cle: "siege", libelle: "Adresse du siege du sous-traitant" },
      { cle: "immatriculation", libelle: "SIRET du sous-traitant" },
      { cle: "sous_traitant_da", libelle: "Numero de declaration d activite du sous-traitant" },
      { cle: "representant", libelle: "Representant du sous-traitant et sa qualite" },
      { cle: "email", libelle: "Email du signataire" },
      { cle: "intitule", libelle: "Intitule de l action confiee" },
      { cle: "perimetre", libelle: "Perimetre confie : totalite, module, sequence..." },
      { cle: "duree_heures", libelle: "Duree confiee, en heures" },
      { cle: "periode", libelle: "Periode d execution" },
      { cle: "prix", libelle: "Prix hors taxes" },
    ]),
    corps:
      "ENTRE LES SOUSSIGNES\n\n" +
      "{{organisme}}, organisme de formation dont le siege est situe {{organisme_siege}}, " +
      "immatricule sous le numero {{organisme_siret}}, declare sous le numero {{organisme_da}}, " +
      "represente par {{organisme_representant}}, ci-apres le Donneur d ordre,\n\n" +
      "ET\n\n" +
      "{{contrepartie}}, {{forme}}, dont le siege est situe {{siege}}, immatriculee sous le " +
      "numero {{immatriculation}}, declaree en qualite d organisme de formation sous le numero " +
      "{{sous_traitant_da}}, representee par {{representant}}, ci-apres le Sous-traitant,\n\n" +
      "IL A ETE CONVENU CE QUI SUIT\n\n" +
      "## Article 1 - Objet\n\n" +
      "Le Donneur d ordre confie au Sous-traitant la realisation de {{perimetre}} de l action " +
      "intitulee {{intitule}}, pour une duree de {{duree_heures}} heures, sur la periode " +
      "{{periode}}.\n\n" +
      "Le Donneur d ordre demeure seul titulaire de la relation contractuelle avec le " +
      "beneficiaire final et seul responsable de l action devant le financeur.\n\n" +
      "## Article 2 - Declaration et qualite\n\n" +
      "Le Sous-traitant garantit etre regulierement declare en qualite d organisme de " +
      "formation, disposer des qualifications et habilitations necessaires, et etre a jour de " +
      "ses obligations declaratives. Il en fournit les justificatifs a premiere demande et " +
      "informe sans delai le Donneur d ordre de toute modification.\n\n" +
      "Lorsque l action releve d un financement conditionne a une certification qualite, le " +
      "Sous-traitant se conforme au referentiel applicable et fournit les elements de preuve " +
      "attendus lors d un audit.\n\n" +
      "## Article 3 - Execution\n\n" +
      "Le Sous-traitant execute l action confiee avec ses propres moyens et son propre " +
      "personnel, dont il demeure seul employeur. Il ne peut sous-traiter a son tour sans " +
      "l accord ecrit prealable du Donneur d ordre.\n\n" +
      "## Article 4 - Pieces d execution\n\n" +
      "Le Sous-traitant remet au Donneur d ordre, au plus tard quinze jours apres la fin de " +
      "l action : les feuilles d emargement ou traces d activite, les evaluations des acquis, " +
      "les evaluations de satisfaction, et tout element necessaire a la justification de " +
      "l action devant un financeur ou un auditeur.\n\n" +
      "Le defaut de remise de ces pieces suspend l exigibilite du prix.\n\n" +
      "## Article 5 - Prix et reglement\n\n" +
      "Le prix est fixe a {{prix}} hors taxes. Le reglement intervient a trente jours a " +
      "compter de la facture, apres service fait et remise des pieces prevues a l article 4.\n\n" +
      "## Article 6 - Non-sollicitation\n\n" +
      "Le Sous-traitant s interdit, pendant la duree de la convention et les vingt-quatre mois " +
      "suivants, de demarcher directement les beneficiaires finaux auxquels le Donneur d ordre " +
      "l a donne acces, pour des prestations de meme nature.\n\n" +
      "## Article 7 - Confidentialite et propriete\n\n" +
      "Les contenus, methodes et supports fournis par le Donneur d ordre demeurent sa " +
      "propriete. Le Sous-traitant s interdit de les reutiliser en dehors de l action confiee.\n\n" +
      "## Article 8 - Donnees personnelles\n\n" +
      "Le Sous-traitant traite les donnees des beneficiaires pour le compte du Donneur d ordre. " +
      "Une annexe de sous-traitance conforme a l article 28 du reglement (UE) 2016/679 est " +
      "conclue entre les parties et fait partie integrante de la presente convention.\n\n" +
      DROIT_9,
  },
  {
    code: "RESPONSABILITE",
    titre: "Annexe de responsabilite",
    categorie: "client",
    description:
      "A signer avec tout contrat portant sur un logiciel de gestion, de comptabilite ou de conformite.",
    champs: CHAMPS_COMMUNS.concat([
      { cle: "contrat_principal", libelle: "Contrat auquel cette annexe se rattache" },
    ]),
    corps:
      "ANNEXE DE RESPONSABILITE\n\n" +
      "La presente annexe se rattache au contrat {{contrat_principal}} conclu entre :\n\n" +
      "AcadeMIA Pro LLC, societe de droit du Wyoming, dont le siege est situe 30 N Gould St " +
      "STE R, Sheridan WY 82801, Etats-Unis, representee par Jacques Lalou, en sa qualite de " +
      "gerant, ci-apres l Editeur,\n\n" +
      "ET\n\n" +
      "{{contrepartie}}, {{forme}}, dont le siege est situe {{siege}}, immatriculee sous le " +
      "numero {{immatriculation}}, representee par {{representant}}, ci-apres le Client.\n\n" +
      "Elle en fait partie integrante et prevaut sur lui pour les points qu elle traite.\n\n" +
      "## Article 1 - Nature de la prestation\n\n" +
      "L Editeur fournit un outil logiciel. Il n exerce ni la profession d expert-comptable, " +
      "ni celle d avocat, ni celle de conseil fiscal, et ne delivre aucun conseil personnalise " +
      "au sens de la reglementation applicable a ces professions.\n\n" +
      "Les calculs, etats et declarations produits par l outil sont des propositions etablies " +
      "a partir des seules donnees saisies par le Client. Ils ne valent ni avis, ni " +
      "attestation, ni garantie de conformite.\n\n" +
      "## Article 2 - Responsabilite du Client sur ses donnees\n\n" +
      "Le Client est seul responsable de l exactitude, de l exhaustivite et de l actualite des " +
      "donnees qu il saisit ou importe, ainsi que des choix de parametrage qu il opere.\n\n" +
      "L Editeur n a ni la charge ni les moyens de verifier ces donnees.\n\n" +
      "## Article 3 - Obligation de verification avant depot\n\n" +
      "Le Client verifie chaque etat, declaration ou document avant sa transmission a un tiers " +
      "ou a une administration. Cette verification lui incombe en propre.\n\n" +
      "Lorsque la nature de la declaration l exige, il la fait controler par un professionnel " +
      "habilite.\n\n" +
      "Le depot d un document produit par l outil vaut appropriation de son contenu par le " +
      "Client.\n\n" +
      "## Article 4 - Exclusion des penalites et redressements\n\n" +
      "L Editeur n est en aucun cas tenu des penalites, majorations, interets de retard, " +
      "amendes ou redressements prononces a l encontre du Client par une administration " +
      "francaise ou etrangere, quelle qu en soit la cause.\n\n" +
      "## Article 5 - Evolution du droit\n\n" +
      "L Editeur s engage a mettre l outil en conformite avec toute evolution du droit " +
      "applicable dans un delai de quatre-vingt-dix jours a compter de son entree en vigueur.\n\n" +
      "Pendant ce delai, le Client demeure tenu de ses obligations declaratives et ne peut se " +
      "prevaloir d une non-conformite de l outil.\n\n" +
      "## Article 6 - Plafond d indemnisation\n\n" +
      "La responsabilite de l Editeur, toutes causes confondues, est plafonnee au montant des " +
      "sommes effectivement versees par le Client au titre des douze mois precedant le fait " +
      "generateur du dommage.\n\n" +
      "Sont exclus les dommages indirects, la perte de chiffre d affaires, la perte de " +
      "clientele, l atteinte a l image et la perte de donnees imputable au Client.\n\n" +
      "Cette limitation ne s applique pas en cas de dol ou de faute lourde.\n\n" +
      "## Article 7 - Disponibilite\n\n" +
      "L Editeur assure la disponibilite du service selon une obligation de moyens. Les " +
      "interruptions pour maintenance sont annoncees lorsque cela est possible.\n\n" +
      "## Article 8 - Dependances tierces\n\n" +
      "Le service repose sur des prestataires tiers, notamment d hebergement, de " +
      "teletransmission, de paiement et de traitement automatise. L Editeur n est pas tenu des " +
      "defaillances, interruptions, modifications ou cessations de service de ces tiers.\n\n" +
      "## Article 9 - Sauvegarde et restitution\n\n" +
      "Les donnees du Client lui appartiennent. Elles lui sont restituees sur demande dans un " +
      "format exploitable, pendant la duree du contrat et les trente jours suivant son terme.\n\n" +
      "Il appartient au Client de conserver ses propres sauvegardes des documents qu il " +
      "depose aupres des administrations.\n\n" +
      "## Article 10 - Portee\n\n" +
      "Les stipulations de la presente annexe demeurent applicables apres le terme du contrat " +
      "principal, pour les faits survenus pendant son execution.\n\n" +
      "Si l une d elles etait declaree nulle, les autres demeureraient en vigueur.\n",
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
