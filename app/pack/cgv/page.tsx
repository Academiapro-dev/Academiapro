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
  fontSize: "20px",
  margin: "36px 0 12px",
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
          Etats-Unis (ci-apres l Editeur), d une plateforme de suivi pedagogique et, selon la
          formule souscrite, d un catalogue de formations, au profit d un organisme de formation
          professionnelle agissant pour les besoins de son activite (ci-apres le Client).
        </p>
        <p style={P}>
          Le Client demeure seul prestataire de formation a l egard de ses stagiaires. Il conserve
          la responsabilite pedagogique, contractuelle et administrative de ses actions de
          formation. L Editeur intervient comme fournisseur de contenu et d outil, a l exclusion
          de toute prestation de formation directe aupres des stagiaires du Client.
        </p>

        <h2 style={H2}>2. Formules et prix</h2>
        <p style={P}>
          Les prix sont exprimes hors taxes. La formule Outil comprend la plateforme de suivi et
          le module de gestion commerciale. La formule Outil et catalogue y ajoute un droit d usage
          des formations ouvertes au Client. Le module de preparation a la certification Qualiopi
          fait l objet d un forfait unique distinct.
        </p>
        <p style={P}>
          Le montant de l abonnement, la liste des formations ouvertes et le prix de vente public
          de chacune figurent en annexe du contrat signe entre les parties. Cette annexe prevaut
          sur toute indication tarifaire publiee par ailleurs.
        </p>

        <h2 style={H2}>3. Tarif de lancement</h2>
        <p style={P}>
          Lorsqu un tarif de lancement est consenti, sa duree, sa date d expiration et le montant
          plein applicable a son terme sont mentionnes expressement au contrat. Le passage au
          montant plein s opere de plein droit a cette date, sans formalite ni renegociation.
        </p>
        <p style={P}>
          En contrepartie du tarif de lancement, le Client autorise l Editeur a citer sa
          denomination et son logo a titre de reference commerciale, et s engage a fournir un
          temoignage ecrit sur son usage de la plateforme.
        </p>

        <h2 style={H2}>4. Part sur les formations vendues</h2>
        <p style={P}>
          Outre l abonnement, le Client verse a l Editeur une part egale a vingt pour cent du prix
          de vente hors taxes de chaque formation du catalogue vendue a un stagiaire, ce prix etant
          celui figurant a l annexe tarifaire du contrat.
        </p>
        <p style={P}>
          Le nombre d inscriptions enregistre par la plateforme fait foi entre les parties pour le
          calcul de cette part. Le Client n a aucune declaration de chiffre d affaires a fournir.
          La facturation est mensuelle, a terme echu.
        </p>
        <p style={P}>
          Un montant plancher par stagiaire inscrit peut etre prevu au contrat, afin de couvrir les
          couts variables de traitement lorsque le prix de vente est inferieur a un seuil convenu.
        </p>

        <h2 style={H2}>5. Taxe sur la valeur ajoutee</h2>
        <p style={P}>
          Les prestations sont fournies par un etablissement etabli hors de l Union europeenne a un
          assujetti etabli en France. La taxe est autoliquidee par le Client, qui communique a
          l Editeur son numero de taxe intracommunautaire et procede lui-meme a la declaration et
          au paiement de la taxe due.
        </p>

        <h2 style={H2}>6. Duree, resiliation et suspension</h2>
        <p style={P}>
          L abonnement est conclu pour une duree d un mois, renouvelable tacitement. Chaque partie
          peut y mettre fin a tout moment, par ecrit, avec effet a la fin du mois en cours. La part
          due sur les formations deja vendues reste exigible.
        </p>
        <p style={P}>
          En cas de defaut de paiement persistant apres mise en demeure, l Editeur peut suspendre
          l acces a la plateforme. Les stagiaires ayant commence une formation conservent l acces
          a celle-ci jusqu a son terme, afin que le Client puisse honorer ses engagements.
        </p>

        <h2 style={H2}>7. Droits d usage du catalogue</h2>
        <p style={P}>
          Le Client recoit un droit d usage non exclusif et non cessible des formations ouvertes,
          limite a la duree de l abonnement et a l usage de ses propres stagiaires. Toute
          reproduction, revente hors plateforme, extraction ou diffusion du contenu en dehors de ce
          cadre est interdite.
        </p>

        <h2 style={H2}>8. Nature de la relation et sous-traitance</h2>
        <p style={P}>
          Les parties qualifient leur relation de licence de contenu et de fourniture d outil. Si
          le Client choisit de qualifier tout ou partie de la prestation de sous-traitance au sens
          du referentiel national qualite, il lui appartient d en assurer le suivi et d en
          documenter la maitrise, notamment au titre de l indicateur 27, l Editeur fournissant sur
          demande les elements descriptifs necessaires.
        </p>

        <h2 style={H2}>9. Portee des outils et limites</h2>
        <p style={P}>
          Les formations du catalogue ne sont enregistrees ni au Repertoire national des
          certifications professionnelles ni au repertoire specifique. Elles ne sont pas eligibles
          au compte personnel de formation. L Editeur ne delivre aucune certification reconnue par
          l Etat.
        </p>
        <p style={P}>
          Le module de preparation a la certification Qualiopi constitue une aide a la preparation.
          Il n emet aucun avis de conformite et ne prejuge en rien de la decision de l organisme
          certificateur. Les etats prepares au titre du bilan pedagogique et financier constituent
          une aide au remplissage : la declaration, son exactitude et sa transmission demeurent de
          la responsabilite exclusive du Client.
        </p>

        <h2 style={H2}>10. Responsabilite</h2>
        <p style={P}>
          L Editeur s engage a apporter le soin et la diligence necessaires a la fourniture de la
          plateforme. Sa responsabilite ne peut etre engagee qu en cas de faute prouvee et se
          limite aux dommages directs, dans la limite des sommes effectivement versees par le
          Client au titre des douze mois precedant le fait generateur. Sont exclus les dommages
          indirects, la perte de chiffre d affaires, la perte de clientele et les consequences
          d une decision d un organisme certificateur ou d une administration.
        </p>

        <h2 style={H2}>11. Donnees personnelles</h2>
        <p style={P}>
          Le Client est responsable du traitement des donnees de ses stagiaires ; l Editeur agit en
          qualite de sous-traitant au sens du reglement general sur la protection des donnees, pour
          le seul compte du Client et selon ses instructions. Les donnees de chaque organisme sont
          cloisonnees. Elles sont restituees ou supprimees sur demande a l issue du contrat.
        </p>

        <h2 style={H2}>12. Disponibilite et evolutions</h2>
        <p style={P}>
          La plateforme est accessible en continu, sous reserve des interruptions necessaires a sa
          maintenance et des evenements independants de la volonte de l Editeur. Les contenus et
          les fonctions evoluent ; l Editeur peut modifier ou remplacer une formation, sous reserve
          de maintenir l acces des stagiaires ayant deja commence.
        </p>

        <h2 style={H2}>13. Droit applicable et differends</h2>
        <p style={P}>
          Les parties recherchent une solution amiable avant toute action. A defaut, le differend
          releve des juridictions competentes selon les regles applicables entre professionnels.
        </p>

        <div style={{ background: "#fbf7ef", border: "1px solid #e3d9c2", borderRadius: "8px", padding: "20px 24px", marginTop: "40px" }}>
          <p style={{ ...P, margin: 0, fontSize: "15px", color: "#6b5a33" }}>
            Ce document est un projet. Il doit etre relu par un professionnel du droit avant
            d etre oppose a un client, notamment sur les clauses de responsabilite, de
            sous-traitance et de protection des donnees.
          </p>
        </div>

        <p style={{ color: "#999", fontSize: "13px", marginTop: "30px" }}>
          AcadeMIA Pro LLC — contact@academiapro.fr
        </p>
      </div>
    </div>
  );
}
