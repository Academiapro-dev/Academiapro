export const runtime = "nodejs";

// LES CGV — MISES A JOUR LE 17 AOUT 2026.
//
// 🚨🚨🚨 IL N'Y A AUCUNE PRODUCTION SUR DEMANDE. NI SUR MESURE, NI
// « COMMANDEZ-NOUS CETTE FORMATION », NI DELAI D'UNE SEMAINE.
//
// L'ancien article 8 promettait que l'Editeur produisait, a la demande du
// Client, des formations ne figurant pas au catalogue. CETTE CLAUSE EST
// SUPPRIMEE. Ses mots, repetes plusieurs fois : « c'est nous qui produisons
// notre propre catalogue », « je veux que tu oublies la Creation sur
// demande, tu oublies completement ca ».
//
// LA SEULE FORMULE AUTORISEE, SANS RIEN PRECISER D'AUTRE :
//     « le catalogue est evolutif »
//
// Pas de delai annonce, pas de commande possible, pas de sur-mesure. Ni ici,
// ni dans le bon de commande, ni dans un courrier, ni sur une page de vente.
// NE JAMAIS LA REINTRODUIRE.
//
// 🚨 LES ACCENTS SONT OBLIGATOIRES DANS TOUT CE FICHIER. La premiere version
// livree le 17/08 etait en ASCII pur — « societe », « presentes »,
// « propriete ». C'est une faute : la regle de Jacques ne vaut que pour le
// CODE. UN TEXTE LU PAR UN CLIENT, et a plus forte raison des conditions
// generales opposables, S'ECRIT EN FRANCAIS CORRECT. Seuls les commentaires
// techniques comme celui-ci restent en ASCII.
//
// 🚨🚨 LA GRILLE DEFINITIVE, arretee le 17/08 :
//     390 EUR HT par mois (la plateforme et le suivi commercial)
//   + 40 % du prix de vente hors taxes de chaque formation du catalogue
//   + 30 EUR HT PAR STAGIAIRE INSCRIT, QUI S'AJOUTENT A LA PART
//   = gestion administrative COMPRISE, bilan pedagogique et financier
//     annuel inclus.
//
// ⚠️ LES 30 EUR NE SONT PAS UN MINIMUM, C'EST UNE REDEVANCE QUI S'AJOUTE.
// La phrase « seule cette part est due » a ete retiree : elle serait devenue
// le levier d'un client pour refuser la redevance.
//
// AUTRES DECISIONS INSCRITES ICI, A NE PAS DEFAIRE :
//   - PLUS AUCUN TARIF DE LANCEMENT.
//   - LES FORMATIONS DU CATALOGUE APPARTIENNENT A L'EDITEUR.
//   - LES TROIS OFFRES sont nommees a l'article 1.

const CADRE: any = {
  minHeight: "100vh",
  background: "#ffffff",
  color: "#1a1a1a",
  fontFamily: "Georgia, serif",
  padding: "50px 20px",
  colorScheme: "light",
};

const H2: any = {
  color: "#0a3d2e",
  fontSize: "19px",
  margin: "34px 0 12px",
  borderBottom: "1px solid #e6e6e6",
  paddingBottom: "8px",
};

const P: any = {
  fontSize: "16px",
  lineHeight: "1.8",
  margin: "0 0 14px",
  color: "#2a2a2a",
};

export default function PageCGV() {
  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "780px", margin: "0 auto" }}>
        <p style={{ color: "#0a3d2e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 10px" }}>
          ACADÉMIA PRO LLC
        </p>
        <h1 style={{ color: "#0a3d2e", fontSize: "30px", margin: "0 0 8px" }}>
          Conditions générales de vente
        </h1>
        <p style={{ color: "#777", fontSize: "14px", margin: "0 0 30px" }}>
          Offre à destination des organismes de formation professionnelle et des entreprises.
          Version du 17 août 2026.
        </p>

        <h2 style={H2}>1. Parties, objet et formules</h2>
        <p style={P}>
          Les présentes conditions régissent les prestations fournies par AcadéMIA Pro LLC,
          société de droit du Wyoming dont le siège est situé 30 N Gould St STE R, Sheridan
          WY 82801, États-Unis (ci-après l’Éditeur), au profit d’un professionnel agissant
          pour les besoins de son activité (ci-après le Client).
        </p>
        <p style={P}>
          Trois offres distinctes peuvent être souscrites, celle retenue figurant au bon de
          commande : <strong>le pack complet</strong>, comprenant le catalogue de formations de
          l’Éditeur, la plateforme d’apprentissage et le suivi commercial ;{" "}
          <strong>la plateforme seule</strong>, sans le catalogue de l’Éditeur ; et{" "}
          <strong>le suivi commercial seul</strong>, facturé par utilisateur.
        </p>
        <p style={P}>
          Les articles 4, 5, 6, 8 et 13 ne s’appliquent qu’aux formules comprenant le catalogue
          de l’Éditeur. Les autres articles s’appliquent à toutes les formules.
        </p>
        <p style={P}>
          Lorsque le Client est un organisme de formation, il demeure seul prestataire de
          formation à l’égard de ses stagiaires. Il conserve la responsabilité pédagogique,
          contractuelle et administrative de ses actions. L’Éditeur intervient comme fournisseur
          de contenu et d’outil, à l’exclusion de toute prestation de formation directe auprès
          des stagiaires du Client.
        </p>

        <h2 style={H2}>2. Prix et étendue de la prestation</h2>
        <p style={P}>
          Les prix sont exprimés hors taxes et figurent au bon de commande signé par les parties,
          qui prévaut sur toute indication tarifaire publiée par ailleurs. Le prix porté au bon
          de commande est le prix plein : aucun tarif promotionnel ni réduction temporaire n’est
          consenti.
        </p>
        <p style={P}>
          Pour le pack complet, la rémunération de l’Éditeur se compose de{" "}
          <strong>trois éléments qui s’additionnent</strong> :
        </p>
        <p style={P}>
          <strong>Un abonnement mensuel</strong>, qui couvre la plateforme d’apprentissage et le
          suivi commercial, sans limite de stagiaires ni d’utilisateurs.
        </p>
        <p style={P}>
          <strong>Une part sur les ventes</strong>, exprimée en pourcentage du prix de vente hors
          taxes de chaque formation du catalogue de l’Éditeur.
        </p>
        <p style={P}>
          <strong>Une redevance par stagiaire inscrit</strong>, due pour chaque inscription sur
          une formation du catalogue.
        </p>
        <p style={P}>
          <strong>Ces trois éléments sont exhaustifs.</strong> Ils couvrent l’intégralité de la
          prestation : la plateforme, l’accès au catalogue, la gestion administrative prévue à
          l’article 3, la correction des évaluations et l’accompagnement. Aucun autre montant
          n’est dû à l’Éditeur, à l’exception des frais de mise en service et des options
          facturées à l’usage mentionnés ci-après.
        </p>
        <p style={P}>
          Des frais de mise en service peuvent être dus une seule fois à la signature, lorsque le
          bon de commande les prévoit. Ils couvrent l’ouverture du compte, la configuration du
          catalogue et des prix, la mise aux couleurs du Client, la reprise de ses données et
          l’accompagnement au démarrage.
        </p>
        <p style={P}>
          Le module de préparation à la certification Qualiopi fait l’objet d’un forfait unique
          distinct, également porté au bon de commande.
        </p>

        <h2 style={H2}>3. Gestion administrative — comprise</h2>
        <p style={P}>
          <strong>La gestion administrative est comprise dans les montants de l’article 2 et ne
          fait l’objet d’aucune facturation supplémentaire.</strong>
        </p>
        <p style={P}>
          Elle comprend, pour l’ensemble des stagiaires du Client : conventions et contrats,
          convocations, feuilles d’émargement, évaluations à chaud et à froid, attestations de
          fin de formation, registre des réclamations et de leurs actions correctives, dossiers
          des formateurs, registres de veille, suivi de la sous-traitance et pièces
          justificatives attendues lors d’un audit.
        </p>
        <p style={P}>
          Elle comprend également <strong>la préparation du bilan pédagogique et financier
          annuel</strong> de l’organisme, cadre par cadre. Cette prestation est annuelle et
          demeure due quel que soit le rythme des inscriptions.
        </p>
        <p style={P}>
          Le Client demeure seul responsable de l’exactitude des informations transmises, de la
          vérification des documents produits et du dépôt de ses déclarations.
        </p>

        <h2 style={H2}>4. Part sur les formations du catalogue</h2>
        <p style={P}>
          Le Client verse à l’Éditeur une part du prix de vente hors taxes de chaque formation du
          catalogue de l’Éditeur vendue à un bénéficiaire. Le taux figure au bon de commande.
        </p>
        <p style={P}>
          Le Client fixe librement le prix auquel il vend à ses stagiaires. La part se calcule
          sur ce prix. Aucune part n’est due sur les prestations que le Client réalise en dehors
          de la plateforme.
        </p>
        <p style={P}>
          Le nombre d’inscriptions enregistré par la plateforme fait foi entre les parties. Le
          Client n’a aucune déclaration de chiffre d’affaires à fournir.
        </p>

        <h2 style={H2}>5. Redevance par stagiaire inscrit</h2>
        <p style={P}>
          Chaque stagiaire inscrit par le Client sur une formation du catalogue de l’Éditeur
          donne lieu au versement d’une redevance figurant au bon de commande,{" "}
          <strong>que la formation ait été vendue ou non</strong>.
        </p>
        <p style={P}>
          <strong>Cette redevance s’ajoute à la part prévue à l’article 4 ; elle ne s’y substitue
          pas.</strong> Pour chaque inscription, le Client verse donc à la fois le pourcentage du
          prix de vente et la redevance par stagiaire.
        </p>
        <p style={P}>
          Cette redevance couvre les coûts que chaque inscription entraîne pour l’Éditeur :
          correction individuelle des questionnaires, assistance pédagogique à l’apprenant,
          édition des documents et conservation des traces.
        </p>

        <h2 style={H2}>6. Modes de financement</h2>
        <p style={P}>
          Les formations du catalogue de l’Éditeur ne sont enregistrées ni au Répertoire national
          des certifications professionnelles ni au répertoire spécifique.{" "}
          <strong>Elles ne sont éligibles à aucun financement au titre du compte personnel de
          formation</strong>, quelle que soit la certification détenue par le Client.
        </p>
        <p style={P}>
          Lorsqu’un particulier finance lui-même sa formation, l’Éditeur peut la lui vendre
          directement, sans intervention du Client.
        </p>
        <p style={P}>
          Lorsqu’une entreprise finance sur ses fonds propres la formation de ses salariés,
          aucune certification n’est requise et la vente peut être conclue par l’une ou l’autre
          des parties.
        </p>
        <p style={P}>
          Lorsqu’un financement est sollicité auprès d’un opérateur de compétences, la prestation
          est délivrée par le Client, seul titulaire de la certification exigée. Le Client
          contracte avec le bénéficiaire, facture le financeur et demeure responsable de la
          conformité du dossier.
        </p>
        <p style={P}>
          Les demandes orientées par l’Éditeur vers le Client donnent lieu à un partage du
          produit hors taxes selon le taux porté au bon de commande, distinct de celui de
          l’article 4, l’Éditeur ayant apporté à la fois le contenu et le bénéficiaire.
        </p>

        <h2 style={H2}>7. Répartition des rôles</h2>
        <p style={P}>
          L’Éditeur fournit les contenus, la plateforme, la correction des évaluations, les
          documents administratifs et les traces d’assiduité des activités réalisées à distance.
        </p>
        <p style={P}>
          Toute intervention en présence, l’animation, l’évaluation pratique, le recrutement des
          formateurs, leur rémunération et la vérification de leurs habilitations relèvent
          exclusivement du Client.
        </p>
        <p style={P}>
          Pour les formations dont la délivrance est réglementée, l’Éditeur fournit les supports
          théoriques et l’accès à distance. Le Client garantit la conformité de l’action au
          référentiel applicable, la qualification des intervenants et la réalisation des
          évaluations exigées. L’Éditeur ne délivre aucune habilitation ni certification.
        </p>
        <p style={P}>
          Le Client prend connaissance des contenus avant de les diffuser et demeure juge de leur
          adéquation à ses actions de formation.
        </p>

        <h2 style={H2}>8. Propriété des contenus</h2>
        <p style={P}>
          <strong>Les formations du catalogue sont et demeurent la propriété de
          l’Éditeur.</strong> Le Client dispose du droit de les diffuser à ses stagiaires et de
          les vendre sous son nom pendant toute la durée du contrat, aux conditions des
          articles 4 et 5.
        </p>
        <p style={P}>
          Ce droit d’usage n’est pas exclusif : l’Éditeur conserve la faculté de proposer les
          mêmes formations à d’autres organismes.{" "}
          <strong>Une exclusivité sur un contenu déterminé fait l’objet d’un accord écrit
          distinct et d’une rémunération spécifique.</strong>
        </p>
        <p style={P}>
          Le catalogue de l’Éditeur est évolutif.
        </p>
        <p style={P}>
          Les marques, le logo et les éléments distinctifs du Client lui restent intégralement
          acquis. L’Éditeur ne les utilise que pour habiller la plateforme et les documents aux
          couleurs du Client.
        </p>

        <h2 style={H2}>9. Options facturées à l’usage</h2>
        <p style={P}>
          L’envoi de messages courts et les appels émis depuis la plateforme ne sont pas compris
          dans l’abonnement. Ils ne sont dus que si le Client active ces services et sont
          facturés à la consommation réelle, aux tarifs portés au bon de commande. Le caractère
          illimité annoncé porte sur les stagiaires et les utilisateurs, jamais sur les envois ni
          sur les communications.
        </p>
        <p style={P}>
          Le Client demeure seul responsable de la licéité de sa prospection, notamment du
          consentement préalable exigé pour l’envoi de messages courts, y compris entre
          professionnels.
        </p>

        <h2 style={H2}>10. Taxe sur la valeur ajoutée</h2>
        <p style={P}>
          Les prestations sont fournies par un établissement établi hors de l’Union européenne à
          un assujetti établi en France. La taxe est autoliquidée par le Client, qui communique à
          l’Éditeur son numéro de taxe intracommunautaire et procède lui-même à la déclaration et
          au paiement de la taxe due.
        </p>

        <h2 style={H2}>11. Facturation et règlement</h2>
        <p style={P}>
          La facturation est mensuelle, à terme échu, et comprend l’abonnement ainsi que les
          parts, redevances et options dues au titre des articles 2 à 9. Le règlement intervient
          par virement dans les trente jours.
        </p>

        <h2 style={H2}>12. Durée, résiliation et suspension</h2>
        <p style={P}>
          L’abonnement est conclu pour une durée d’un mois, renouvelable tacitement. Chaque
          partie peut y mettre fin à tout moment, par écrit, avec effet à la fin du mois en
          cours. Les sommes dues au titre des formations déjà dispensées restent exigibles.
        </p>
        <p style={P}>
          En cas de défaut de paiement persistant après mise en demeure, l’Éditeur peut suspendre
          l’accès à la plateforme. Les stagiaires ayant commencé une formation conservent l’accès
          jusqu’à son terme, afin que le Client puisse honorer ses engagements.
        </p>

        <h2 style={H2}>13. Droits d’usage du catalogue</h2>
        <p style={P}>
          Le Client reçoit un droit d’usage non exclusif et non cessible des formations ouvertes,
          limité à la durée de l’abonnement et à l’usage de ses propres stagiaires. Toute
          reproduction, revente hors plateforme, extraction ou diffusion en dehors de ce cadre
          est interdite.
        </p>
        <p style={P}>
          À l’issue du contrat, ce droit d’usage prend fin. Les données propres au Client — ses
          stagiaires, ses documents, ses traces d’assiduité — lui sont restituées selon
          l’article 17.
        </p>

        <h2 style={H2}>14. Classes virtuelles</h2>
        <p style={P}>
          La plateforme donne accès à un service de visioconférence fourni par un tiers.
          L’Éditeur ne garantit ni sa disponibilité ni ses performances et n’assume aucune
          responsabilité du fait de ce tiers. Aucun enregistrement des séances n’est réalisé par
          l’Éditeur.
        </p>
        <p style={P}>
          Les heures d’entrée et de sortie sont horodatées et conservées à titre de justificatif
          d’assiduité.
        </p>

        <h2 style={H2}>15. Signature électronique</h2>
        <p style={P}>
          Le service met en œuvre une signature électronique simple au sens du règlement (UE)
          n° 910/2014. Elle ne constitue ni une signature avancée ni une signature qualifiée et
          ne bénéficie d’aucune présomption de fiabilité.
        </p>
        <p style={P}>
          L’Éditeur constitue et conserve un dossier de preuve comprenant l’identité du
          signataire, l’horodatage, l’empreinte numérique du document signé et le texte accepté.
          L’appréciation de la force probante relève du juge.
        </p>

        <h2 style={H2}>16. Suivi commercial et données de prospection</h2>
        <p style={P}>
          Les prospects et contacts enregistrés par le Client dans le suivi commercial lui
          appartiennent en propre. L’Éditeur n’y accède que pour assurer le service et n’en fait
          aucun autre usage.
        </p>
        <p style={P}>
          Dans la formule du suivi commercial seul, est appelé utilisateur tout compte ouvert sur
          la plateforme au nom du Client. Le nombre enregistré par la plateforme fait foi ; le
          Client n’a aucune déclaration à fournir. L’ouverture ou la fermeture d’un compte prend
          effet sur la facture du mois suivant.
        </p>

        <h2 style={H2}>17. Archivage et restitution</h2>
        <p style={P}>
          Les documents signés sont archivés pendant la durée du contrat et la durée légale de
          conservation applicable. Ils sont restitués au Client à sa demande à l’issue du
          contrat.
        </p>

        <h2 style={H2}>18. Nature de la relation et sous-traitance</h2>
        <p style={P}>
          Les parties qualifient leur relation de licence de contenu et de fourniture d’outil. Si
          le Client choisit de qualifier tout ou partie de la prestation de sous-traitance au
          sens du référentiel national qualité, il lui appartient d’en assurer le suivi et d’en
          documenter la maîtrise, notamment au titre de l’indicateur 27, l’Éditeur fournissant
          sur demande les éléments descriptifs nécessaires.
        </p>

        <h2 style={H2}>19. Portée des outils et limites</h2>
        <p style={P}>
          Le module de préparation à la certification Qualiopi constitue une aide à la
          préparation. Il n’émet aucun avis de conformité et ne préjuge en rien de la décision de
          l’organisme certificateur.
        </p>
        <p style={P}>
          Les états préparés au titre du bilan pédagogique et financier constituent une aide au
          remplissage : la déclaration, son exactitude et sa transmission demeurent de la
          responsabilité exclusive du Client.
        </p>

        <h2 style={H2}>20. Responsabilité et données</h2>
        <p style={P}>
          La responsabilité de l’Éditeur ne peut être engagée qu’en cas de faute prouvée et se
          limite aux dommages directs, dans la limite des sommes effectivement versées par le
          Client au titre des douze mois précédant le fait générateur. Sont exclus les dommages
          indirects, la perte de chiffre d’affaires, la perte de clientèle et les conséquences
          d’une décision d’un organisme certificateur ou d’une administration.
        </p>
        <p style={P}>
          Le Client est responsable du traitement des données de ses stagiaires ; l’Éditeur agit
          en qualité de sous-traitant au sens du règlement général sur la protection des données,
          pour son seul compte et selon ses instructions. Les données de chaque organisme sont
          cloisonnées, et restituées ou supprimées sur demande à l’issue du contrat.
        </p>

        <h2 style={H2}>21. Disponibilité, évolutions et différends</h2>
        <p style={P}>
          La plateforme est accessible en continu, sous réserve des interruptions nécessaires à
          sa maintenance et des événements indépendants de la volonté de l’Éditeur. Les contenus
          et les fonctions évoluent ; l’Éditeur peut modifier ou remplacer une formation, sous
          réserve de maintenir l’accès des stagiaires ayant déjà commencé.
        </p>
        <p style={P}>
          Les parties recherchent une solution amiable avant toute action. À défaut, le différend
          relève des juridictions compétentes selon les règles applicables entre professionnels.
        </p>

        <div style={{ background: "#fbf7ef", border: "1px solid #e3d9c2", borderRadius: "8px", padding: "20px 24px", marginTop: "40px" }}>
          <p style={{ ...P, margin: 0, fontSize: "15px", color: "#6b5a33" }}>
            Ce document est un projet. Il doit être relu par un professionnel du droit avant
            d’être opposé à un client, notamment sur les articles relatifs à la responsabilité, à
            la propriété des contenus, à la sous-traitance et à la protection des données.
          </p>
        </div>

        <p style={{ color: "#999", fontSize: "13px", marginTop: "30px" }}>
          AcadéMIA Pro LLC — contact@academiapro.fr
        </p>
      </div>
    </div>
  );
}
