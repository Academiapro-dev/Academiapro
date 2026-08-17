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
//   - LES FORMATIONS DU CATALOGUE APPARTIENNENT A L'EDITEUR. L'ancien
//     article 13, qui disait que les formations creees par le Client lui
//     appartenaient, est supprime.
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
          ACADEMIA PRO LLC
        </p>
        <h1 style={{ color: "#0a3d2e", fontSize: "30px", margin: "0 0 8px" }}>
          Conditions generales de vente
        </h1>
        <p style={{ color: "#777", fontSize: "14px", margin: "0 0 30px" }}>
          Offre a destination des organismes de formation professionnelle et des entreprises.
          Version du 17 aout 2026.
        </p>

        <h2 style={H2}>1. Parties, objet et formules</h2>
        <p style={P}>
          Les presentes conditions regissent les prestations fournies par AcadeMIA Pro LLC, societe
          de droit du Wyoming dont le siege est situe 30 N Gould St STE R, Sheridan WY 82801,
          Etats-Unis (ci-apres l Editeur), au profit d un professionnel agissant pour les besoins
          de son activite (ci-apres le Client).
        </p>
        <p style={P}>
          Trois offres distinctes peuvent etre souscrites, celle retenue figurant au bon de
          commande : <strong>le pack complet</strong>, comprenant le catalogue de formations de
          l Editeur, la plateforme d apprentissage et le suivi commercial ;{" "}
          <strong>la plateforme seule</strong>, sans le catalogue de l Editeur ; et{" "}
          <strong>le suivi commercial seul</strong>, facture par utilisateur.
        </p>
        <p style={P}>
          Les articles 4, 5, 6, 8 et 12 ne s appliquent qu aux formules comprenant le catalogue de
          l Editeur. Les autres articles s appliquent a toutes les formules.
        </p>
        <p style={P}>
          Lorsque le Client est un organisme de formation, il demeure seul prestataire de formation
          a l egard de ses stagiaires. Il conserve la responsabilite pedagogique, contractuelle et
          administrative de ses actions. L Editeur intervient comme fournisseur de contenu et
          d outil, a l exclusion de toute prestation de formation directe aupres des stagiaires du
          Client.
        </p>

        <h2 style={H2}>2. Prix et etendue de la prestation</h2>
        <p style={P}>
          Les prix sont exprimes hors taxes et figurent au bon de commande signe par les parties,
          qui prevaut sur toute indication tarifaire publiee par ailleurs. Le prix porte au bon de
          commande est le prix plein : aucun tarif promotionnel ni reduction temporaire n est
          consenti.
        </p>
        <p style={P}>
          Pour le pack complet, la remuneration de l Editeur se compose de{" "}
          <strong>trois elements qui s additionnent</strong> :
        </p>
        <p style={P}>
          <strong>Un abonnement mensuel</strong>, qui couvre la plateforme d apprentissage et le
          suivi commercial, sans limite de stagiaires ni d utilisateurs.
        </p>
        <p style={P}>
          <strong>Une part sur les ventes</strong>, exprimee en pourcentage du prix de vente hors
          taxes de chaque formation du catalogue de l Editeur.
        </p>
        <p style={P}>
          <strong>Une redevance par stagiaire inscrit</strong>, due pour chaque inscription sur une
          formation du catalogue.
        </p>
        <p style={P}>
          <strong>Ces trois elements sont exhaustifs.</strong> Ils couvrent l integralite de la
          prestation : la plateforme, l acces au catalogue, la gestion administrative prevue a
          l article 3, la correction des evaluations et l accompagnement. Aucun autre montant n est
          du a l Editeur, a l exception des frais de mise en service et des options facturees a
          l usage mentionnes ci-apres.
        </p>
        <p style={P}>
          Des frais de mise en service peuvent etre dus une seule fois a la signature, lorsque le
          bon de commande les prevoit. Ils couvrent l ouverture du compte, la configuration du
          catalogue et des prix, la mise aux couleurs du Client, la reprise de ses donnees et
          l accompagnement au demarrage.
        </p>
        <p style={P}>
          Le module de preparation a la certification Qualiopi fait l objet d un forfait unique
          distinct, egalement porte au bon de commande.
        </p>

        <h2 style={H2}>3. Gestion administrative — comprise</h2>
        <p style={P}>
          <strong>La gestion administrative est comprise dans les montants de l article 2 et ne
          fait l objet d aucune facturation supplementaire.</strong>
        </p>
        <p style={P}>
          Elle comprend, pour l ensemble des stagiaires du Client : conventions et contrats,
          convocations, feuilles d emargement, evaluations a chaud et a froid, attestations de fin
          de formation, registre des reclamations et de leurs actions correctives, dossiers des
          formateurs, registres de veille, suivi de la sous-traitance et pieces justificatives
          attendues lors d un audit.
        </p>
        <p style={P}>
          Elle comprend egalement <strong>la preparation du bilan pedagogique et financier annuel
          </strong> de l organisme, cadre par cadre. Cette prestation est annuelle et demeure due
          quel que soit le rythme des inscriptions.
        </p>
        <p style={P}>
          Le Client demeure seul responsable de l exactitude des informations transmises, de la
          verification des documents produits et du depot de ses declarations.
        </p>

        <h2 style={H2}>4. Part sur les formations du catalogue</h2>
        <p style={P}>
          Le Client verse a l Editeur une part du prix de vente hors taxes de chaque formation du
          catalogue de l Editeur vendue a un beneficiaire. Le taux figure au bon de commande.
        </p>
        <p style={P}>
          Le Client fixe librement le prix auquel il vend a ses stagiaires. La part se calcule sur
          ce prix. Aucune part n est due sur les prestations que le Client realise en dehors de la
          plateforme.
        </p>
        <p style={P}>
          Le nombre d inscriptions enregistre par la plateforme fait foi entre les parties. Le
          Client n a aucune declaration de chiffre d affaires a fournir.
        </p>

        <h2 style={H2}>5. Redevance par stagiaire inscrit</h2>
        <p style={P}>
          Chaque stagiaire inscrit par le Client sur une formation du catalogue de l Editeur donne
          lieu au versement d une redevance figurant au bon de commande,{" "}
          <strong>que la formation ait ete vendue ou non</strong>.
        </p>
        <p style={P}>
          <strong>Cette redevance s ajoute a la part prevue a l article 4 ; elle ne s y substitue
          pas.</strong> Pour chaque inscription, le Client verse donc a la fois le pourcentage du
          prix de vente et la redevance par stagiaire.
        </p>
        <p style={P}>
          Cette redevance couvre les couts que chaque inscription entraine pour l Editeur :
          correction individuelle des questionnaires, assistance pedagogique a l apprenant, edition
          des documents et conservation des traces.
        </p>

        <h2 style={H2}>6. Modes de financement</h2>
        <p style={P}>
          Les formations du catalogue de l Editeur ne sont enregistrees ni au Repertoire national
          des certifications professionnelles ni au repertoire specifique.{" "}
          <strong>Elles ne sont eligibles a aucun financement au titre du compte personnel de
          formation</strong>, quelle que soit la certification detenue par le Client.
        </p>
        <p style={P}>
          Lorsqu un particulier finance lui-meme sa formation, l Editeur peut la lui vendre
          directement, sans intervention du Client.
        </p>
        <p style={P}>
          Lorsqu une entreprise finance sur ses fonds propres la formation de ses salaries, aucune
          certification n est requise et la vente peut etre conclue par l une ou l autre des parties.
        </p>
        <p style={P}>
          Lorsqu un financement est sollicite aupres d un operateur de competences, la prestation
          est delivree par le Client, seul titulaire de la certification exigee. Le Client contracte
          avec le beneficiaire, facture le financeur et demeure responsable de la conformite du
          dossier.
        </p>
        <p style={P}>
          Les demandes orientees par l Editeur vers le Client donnent lieu a un partage du produit
          hors taxes selon le taux porte au bon de commande, distinct de celui de l article 4,
          l Editeur ayant apporte a la fois le contenu et le beneficiaire.
        </p>

        <h2 style={H2}>7. Repartition des roles</h2>
        <p style={P}>
          L Editeur fournit les contenus, la plateforme, la correction des evaluations, les
          documents administratifs et les traces d assiduite des activites realisees a distance.
        </p>
        <p style={P}>
          Toute intervention en presence, l animation, l evaluation pratique, le recrutement des
          formateurs, leur remuneration et la verification de leurs habilitations relevent
          exclusivement du Client.
        </p>
        <p style={P}>
          Pour les formations dont la delivrance est reglementee, l Editeur fournit les supports
          theoriques et l acces a distance. Le Client garantit la conformite de l action au
          referentiel applicable, la qualification des intervenants et la realisation des
          evaluations exigees. L Editeur ne delivre aucune habilitation ni certification.
        </p>
        <p style={P}>
          Le Client prend connaissance des contenus avant de les diffuser et demeure juge de leur
          adequation a ses actions de formation.
        </p>

        <h2 style={H2}>8. Propriete des contenus</h2>
        <p style={P}>
          <strong>Les formations du catalogue sont et demeurent la propriete de l Editeur.</strong>{" "}
          Le Client dispose du droit de les diffuser a ses stagiaires et de les vendre sous son nom
          pendant toute la duree du contrat, aux conditions des articles 4 et 5.
        </p>
        <p style={P}>
          Ce droit d usage n est pas exclusif : l Editeur conserve la faculte de proposer les memes
          formations a d autres organismes.{" "}
          <strong>Une exclusivite sur un contenu determine fait l objet d un accord ecrit distinct
          et d une remuneration specifique.</strong>
        </p>
        <p style={P}>
          Le catalogue de l Editeur est evolutif. Les formations qui s y ajoutent sont ouvertes au
          Client au fil de leur parution, sans supplement.
        </p>
        <p style={P}>
          Les marques, le logo et les elements distinctifs du Client lui restent integralement
          acquis. L Editeur ne les utilise que pour habiller la plateforme et les documents aux
          couleurs du Client.
        </p>

        <h2 style={H2}>9. Options facturees a l usage</h2>
        <p style={P}>
          L envoi de messages courts et les appels emis depuis la plateforme ne sont pas compris
          dans l abonnement. Ils ne sont dus que si le Client active ces services et sont factures
          a la consommation reelle, aux tarifs portes au bon de commande. Le caractere illimite
          annonce porte sur les stagiaires et les utilisateurs, jamais sur les envois ni sur les
          communications.
        </p>
        <p style={P}>
          Le Client demeure seul responsable de la liceite de sa prospection, notamment du
          consentement prealable exige pour l envoi de messages courts, y compris entre
          professionnels.
        </p>

        <h2 style={H2}>10. Taxe sur la valeur ajoutee</h2>
        <p style={P}>
          Les prestations sont fournies par un etablissement etabli hors de l Union europeenne a un
          assujetti etabli en France. La taxe est autoliquidee par le Client, qui communique a
          l Editeur son numero de taxe intracommunautaire et procede lui-meme a la declaration et
          au paiement de la taxe due.
        </p>

        <h2 style={H2}>11. Facturation et reglement</h2>
        <p style={P}>
          La facturation est mensuelle, a terme echu, et comprend l abonnement ainsi que les parts,
          redevances et options dues au titre des articles 2 a 9. Le reglement intervient par
          virement dans les trente jours.
        </p>

        <h2 style={H2}>12. Duree, resiliation et suspension</h2>
        <p style={P}>
          L abonnement est conclu pour une duree d un mois, renouvelable tacitement. Chaque partie
          peut y mettre fin a tout moment, par ecrit, avec effet a la fin du mois en cours. Les
          sommes dues au titre des formations deja dispensees restent exigibles.
        </p>
        <p style={P}>
          En cas de defaut de paiement persistant apres mise en demeure, l Editeur peut suspendre
          l acces a la plateforme. Les stagiaires ayant commence une formation conservent l acces
          jusqu a son terme, afin que le Client puisse honorer ses engagements.
        </p>

        <h2 style={H2}>13. Droits d usage du catalogue</h2>
        <p style={P}>
          Le Client recoit un droit d usage non exclusif et non cessible des formations ouvertes,
          limite a la duree de l abonnement et a l usage de ses propres stagiaires. Toute
          reproduction, revente hors plateforme, extraction ou diffusion en dehors de ce cadre est
          interdite.
        </p>
        <p style={P}>
          A l issue du contrat, ce droit d usage prend fin. Les donnees propres au Client — ses
          stagiaires, ses documents, ses traces d assiduite — lui sont restituees selon
          l article 17.
        </p>

        <h2 style={H2}>14. Classes virtuelles</h2>
        <p style={P}>
          La plateforme donne acces a un service de visioconference fourni par un tiers. L Editeur
          ne garantit ni sa disponibilite ni ses performances et n assume aucune responsabilite du
          fait de ce tiers. Aucun enregistrement des seances n est realise par l Editeur.
        </p>
        <p style={P}>
          Les heures d entree et de sortie sont horodatees et conservees a titre de justificatif
          d assiduite.
        </p>

        <h2 style={H2}>15. Signature electronique</h2>
        <p style={P}>
          Le service met en oeuvre une signature electronique simple au sens du reglement (UE)
          n 910/2014. Elle ne constitue ni une signature avancee ni une signature qualifiee et ne
          beneficie d aucune presomption de fiabilite.
        </p>
        <p style={P}>
          L Editeur constitue et conserve un dossier de preuve comprenant l identite du signataire,
          l horodatage, l empreinte numerique du document signe et le texte accepte. L appreciation
          de la force probante releve du juge.
        </p>

        <h2 style={H2}>16. Suivi commercial et donnees de prospection</h2>
        <p style={P}>
          Les prospects et contacts enregistres par le Client dans le suivi commercial lui
          appartiennent en propre. L Editeur n y accede que pour assurer le service et n en fait
          aucun autre usage.
        </p>
        <p style={P}>
          Dans la formule du suivi commercial seul, est appele utilisateur tout compte ouvert sur
          la plateforme au nom du Client. Le nombre enregistre par la plateforme fait foi ; le
          Client n a aucune declaration a fournir. L ouverture ou la fermeture d un compte prend
          effet sur la facture du mois suivant.
        </p>

        <h2 style={H2}>17. Archivage et restitution</h2>
        <p style={P}>
          Les documents signes sont archives pendant la duree du contrat et la duree legale de
          conservation applicable. Ils sont restitues au Client a sa demande a l issue du contrat.
        </p>

        <h2 style={H2}>18. Nature de la relation et sous-traitance</h2>
        <p style={P}>
          Les parties qualifient leur relation de licence de contenu et de fourniture d outil. Si
          le Client choisit de qualifier tout ou partie de la prestation de sous-traitance au sens
          du referentiel national qualite, il lui appartient d en assurer le suivi et d en
          documenter la maitrise, notamment au titre de l indicateur 27, l Editeur fournissant sur
          demande les elements descriptifs necessaires.
        </p>

        <h2 style={H2}>19. Portee des outils et limites</h2>
        <p style={P}>
          Le module de preparation a la certification Qualiopi constitue une aide a la preparation.
          Il n emet aucun avis de conformite et ne prejuge en rien de la decision de l organisme
          certificateur.
        </p>
        <p style={P}>
          Les etats prepares au titre du bilan pedagogique et financier constituent une aide au
          remplissage : la declaration, son exactitude et sa transmission demeurent de la
          responsabilite exclusive du Client.
        </p>

        <h2 style={H2}>20. Responsabilite et donnees</h2>
        <p style={P}>
          La responsabilite de l Editeur ne peut etre engagee qu en cas de faute prouvee et se
          limite aux dommages directs, dans la limite des sommes effectivement versees par le
          Client au titre des douze mois precedant le fait generateur. Sont exclus les dommages
          indirects, la perte de chiffre d affaires, la perte de clientele et les consequences
          d une decision d un organisme certificateur ou d une administration.
        </p>
        <p style={P}>
          Le Client est responsable du traitement des donnees de ses stagiaires ; l Editeur agit en
          qualite de sous-traitant au sens du reglement general sur la protection des donnees, pour
          son seul compte et selon ses instructions. Les donnees de chaque organisme sont
          cloisonnees, et restituees ou supprimees sur demande a l issue du contrat.
        </p>

        <h2 style={H2}>21. Disponibilite, evolutions et differends</h2>
        <p style={P}>
          La plateforme est accessible en continu, sous reserve des interruptions necessaires a sa
          maintenance et des evenements independants de la volonte de l Editeur. Les contenus et
          les fonctions evoluent ; l Editeur peut modifier ou remplacer une formation, sous reserve
          de maintenir l acces des stagiaires ayant deja commence.
        </p>
        <p style={P}>
          Les parties recherchent une solution amiable avant toute action. A defaut, le differend
          releve des juridictions competentes selon les regles applicables entre professionnels.
        </p>

        <div style={{ background: "#fbf7ef", border: "1px solid #e3d9c2", borderRadius: "8px", padding: "20px 24px", marginTop: "40px" }}>
          <p style={{ ...P, margin: 0, fontSize: "15px", color: "#6b5a33" }}>
            Ce document est un projet. Il doit etre relu par un professionnel du droit avant d etre
            oppose a un client, notamment sur les articles relatifs a la responsabilite, a la
            propriete des contenus, a la sous-traitance et a la protection des donnees.
          </p>
        </div>

        <p style={{ color: "#999", fontSize: "13px", marginTop: "30px" }}>
          AcadeMIA Pro LLC — contact@academiapro.fr
        </p>
      </div>
    </div>
  );
}
