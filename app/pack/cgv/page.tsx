export const runtime = "nodejs";

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
          Offre a destination des organismes de formation professionnelle. Version du 30 juillet 2026.
        </p>

        <h2 style={H2}>1. Parties et objet</h2>
        <p style={P}>
          Les presentes conditions regissent la mise a disposition, par AcadeMIA Pro LLC, societe
          de droit du Wyoming dont le siege est situe 30 N Gould St STE R, Sheridan WY 82801,
          Etats-Unis (ci-apres l Editeur), d une plateforme de formation et, selon la formule
          souscrite, d un catalogue de formations, au profit d un organisme de formation
          professionnelle agissant pour les besoins de son activite (ci-apres le Client).
        </p>
        <p style={P}>
          Le Client demeure seul prestataire de formation a l egard de ses stagiaires. Il conserve
          la responsabilite pedagogique, contractuelle et administrative de ses actions. L Editeur
          intervient comme fournisseur de contenu et d outil, a l exclusion de toute prestation de
          formation directe aupres des stagiaires du Client.
        </p>

        <h2 style={H2}>2. Prix</h2>
        <p style={P}>
          Les prix sont exprimes hors taxes. L abonnement mensuel donne acces a la plateforme, au
          catalogue ouvert au Client et a l ensemble des fonctions de gestion. Son montant figure
          au bon de commande signe par les parties.
        </p>
        <p style={P}>
          Le module de preparation a la certification Qualiopi fait l objet d un forfait unique
          distinct, egalement porte au bon de commande.
        </p>
        <p style={P}>
          Le bon de commande prevaut sur toute indication tarifaire publiee par ailleurs.
        </p>

        <h2 style={H2}>3. Tarif de lancement</h2>
        <p style={P}>
          Lorsqu un tarif de lancement est consenti, sa duree, sa date d expiration et le montant
          plein applicable a son terme sont mentionnes expressement au bon de commande. Le passage
          au montant plein s opere de plein droit a cette date, sans formalite ni renegociation.
        </p>
        <p style={P}>
          En contrepartie, le Client autorise l Editeur a citer sa denomination et son logo a titre
          de reference commerciale, et s engage a fournir un temoignage ecrit sur son usage de la
          plateforme.
        </p>

        <h2 style={H2}>4. Part sur les formations du catalogue</h2>
        <p style={P}>
          Outre l abonnement, le Client verse a l Editeur une part du prix de vente hors taxes de
          chaque formation du catalogue de l Editeur vendue a un beneficiaire. Le taux figure au
          bon de commande.
        </p>
        <p style={P}>
          Cette part n est due <strong>que sur les formations du catalogue de l Editeur</strong>.
          Les formations creees par le Client lui appartiennent et ne donnent lieu a aucune part.
        </p>
        <p style={P}>
          Le nombre d inscriptions enregistre par la plateforme fait foi entre les parties. Le
          Client n a aucune declaration de chiffre d affaires a fournir.
        </p>

        <h2 style={H2}>5. Montant minimal par stagiaire</h2>
        <p style={P}>
          Chaque stagiaire inscrit par le Client sur une formation du catalogue de l Editeur donne
          lieu au versement d un montant minimal figurant au bon de commande, <strong>que la
          formation ait ete vendue ou non</strong>.
        </p>
        <p style={P}>
          Ce montant couvre les couts que chaque inscription entraine pour l Editeur : correction
          individuelle des questionnaires, assistance pedagogique, edition des documents et
          conservation des traces. Lorsque la part calculee au titre de l article 4 lui est
          superieure, seule cette part est due.
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

        <h2 style={H2}>8. Contenus crees sur mesure</h2>
        <p style={P}>
          L Editeur peut produire, a la demande du Client, des formations ne figurant pas au
          catalogue. Le nombre compris dans l abonnement et le delai de livraison figurent au bon
          de commande.
        </p>
        <p style={P}>
          Ces contenus demeurent la propriete de l Editeur et sont concedes au Client en licence
          non exclusive, pour la duree du contrat et l usage de ses stagiaires.{" "}
          <strong>L exclusivite fait l objet d une facturation distincte</strong> et d un accord ecrit.
        </p>
        <p style={P}>
          Les elements que le Client fournit pour l elaboration de ces contenus restent sa
          propriete ; il garantit disposer des droits necessaires a leur transmission.
        </p>

        <h2 style={H2}>9. Taxe sur la valeur ajoutee</h2>
        <p style={P}>
          Les prestations sont fournies par un etablissement etabli hors de l Union europeenne a un
          assujetti etabli en France. La taxe est autoliquidee par le Client, qui communique a
          l Editeur son numero de taxe intracommunautaire et procede lui-meme a la declaration et
          au paiement de la taxe due.
        </p>

        <h2 style={H2}>10. Facturation et reglement</h2>
        <p style={P}>
          La facturation est mensuelle, a terme echu, et comprend l abonnement ainsi que les parts
          et montants minimaux dus au titre des articles 4, 5 et 6. Le reglement intervient par
          virement dans les trente jours.
        </p>

        <h2 style={H2}>11. Duree, resiliation et suspension</h2>
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

        <h2 style={H2}>12. Droits d usage du catalogue</h2>
        <p style={P}>
          Le Client recoit un droit d usage non exclusif et non cessible des formations ouvertes,
          limite a la duree de l abonnement et a l usage de ses propres stagiaires. Toute
          reproduction, revente hors plateforme, extraction ou diffusion en dehors de ce cadre est
          interdite.
        </p>

        <h2 style={H2}>13. Formations creees par le Client</h2>
        <p style={P}>
          Les formations que le Client cree sur la plateforme demeurent sa propriete pleine et
          entiere. L Editeur n y acquiert aucun droit, ne les diffuse pas et ne percoit aucune part
          sur leur vente. Elles lui sont restituees sur simple demande a l issue du contrat.
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

        <h2 style={H2}>16. Archivage</h2>
        <p style={P}>
          Les documents signes sont archives pendant la duree du contrat et la duree legale de
          conservation applicable. Ils sont restitues au Client a sa demande a l issue du contrat.
        </p>

        <h2 style={H2}>17. Nature de la relation et sous-traitance</h2>
        <p style={P}>
          Les parties qualifient leur relation de licence de contenu et de fourniture d outil. Si
          le Client choisit de qualifier tout ou partie de la prestation de sous-traitance au sens
          du referentiel national qualite, il lui appartient d en assurer le suivi et d en
          documenter la maitrise, notamment au titre de l indicateur 27, l Editeur fournissant sur
          demande les elements descriptifs necessaires.
        </p>

        <h2 style={H2}>18. Portee des outils et limites</h2>
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

        <h2 style={H2}>19. Responsabilite et donnees</h2>
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

        <h2 style={H2}>20. Disponibilite, evolutions et differends</h2>
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
            sous-traitance, a la propriete des contenus et a la protection des donnees.
          </p>
        </div>

        <p style={{ color: "#999", fontSize: "13px", marginTop: "30px" }}>
          AcadeMIA Pro LLC — contact@academiapro.fr
        </p>
      </div>
    </div>
  );
}
