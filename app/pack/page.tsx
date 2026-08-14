export const runtime = "nodejs";

const FOND = "#050508";
const OR = "#c8a96e";

const CADRE: any = {
  minHeight: "100vh",
  background: FOND,
  color: "#fff",
  fontFamily: "Georgia, serif",
  padding: "50px 20px",
};

const CARTE: any = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(200,169,110,0.25)",
  borderRadius: "12px",
  padding: "26px 30px",
  marginBottom: "18px",
};

const H2: any = {
  color: OR,
  fontSize: "21px",
  margin: "0 0 14px",
};

const P: any = {
  color: "rgba(255,255,255,0.75)",
  fontSize: "16px",
  lineHeight: "1.8",
  margin: "0 0 12px",
};

const PUCE: any = {
  color: "rgba(255,255,255,0.78)",
  fontSize: "15px",
  lineHeight: "1.8",
  margin: "0 0 9px",
};

export default function PagePack() {
  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 10px" }}>
          POUR LES ORGANISMES DE FORMATION
        </p>
        <h1 style={{ color: "#fff", fontSize: "34px", lineHeight: "1.3", margin: "0 0 16px" }}>
          331 formations pretes a vendre,<br />et tout l administratif qui va avec
        </h1>
        <p style={{ ...P, fontSize: "18px" }}>
          Les logiciels de gestion vous donnent un outil. Nous vous donnons le contenu : trois
          cent trente et une formations a distance, redigees et corrigees, que vous proposez a vos
          stagiaires des demain sous votre nom. Avec la plateforme, les documents obligatoires et
          votre bilan pedagogique prepare.
        </p>

        <div style={{ ...CARTE, border: "2px solid " + OR, marginTop: "36px" }}>
          <h2 style={{ ...H2, fontSize: "18px", margin: "0 0 14px" }}>Ce que comprend le pack</h2>

          <p style={PUCE}><span style={{ color: OR }}>·</span> Les 331 formations du catalogue, a vos prix</p>
          <p style={PUCE}><span style={{ color: OR }}>·</span> Vos propres formations, creees et publiees sans limite</p>
          <p style={PUCE}><span style={{ color: OR }}>·</span> Stagiaires illimites</p>
          <p style={PUCE}><span style={{ color: OR }}>·</span> Correction des questionnaires par IA, erreur par erreur</p>
          <p style={PUCE}><span style={{ color: OR }}>·</span> Classes virtuelles avec tableau blanc</p>
          <p style={PUCE}><span style={{ color: OR }}>·</span> Les 21 documents administratifs, a votre en-tete</p>
          <p style={PUCE}><span style={{ color: OR }}>·</span> Signature electronique et archivage</p>
          <p style={PUCE}><span style={{ color: OR }}>·</span> Suivi commercial et page publique</p>
          <p style={PUCE}><span style={{ color: OR }}>·</span> Bilan pedagogique et financier prepare, cadre par cadre</p>

          {/* LE PRIX NE S AFFICHE PLUS ICI.
              Decision du 14 aout : la page montrait tout, mise en service
              comprise, a n importe quel visiteur. MyUnisoft et Pennylane
              donnent leur tarif apres demonstration ; le prix devient la
              raison de laisser ses coordonnees, et chaque consultation
              produit un prospect au lieu d une lecture anonyme. */}
          <div style={{ borderTop: "1px solid rgba(200,169,110,0.25)", marginTop: "20px", paddingTop: "18px" }}>
            <p style={{ ...P, fontSize: "15.5px", margin: "0 0 16px" }}>
              Le tarif depend de votre volume de stagiaires et des options que vous retenez.
              Nous vous l adressons apres un echange de quinze minutes, avec le detail de ce
              qui est compris et de ce qui ne l est pas.
            </p>
            <a
              href="mailto:contact@academiapro.fr?subject=Tarif%20du%20pack%20organisme&body=Bonjour%2C%0A%0AJe%20souhaite%20recevoir%20le%20tarif%20du%20pack%20organisme.%0A%0AOrganisme%20%3A%20%0ANumero%20de%20declaration%20d%20activite%20%3A%20%0ANombre%20de%20stagiaires%20par%20an%20%3A%20%0ATelephone%20%3A%20%0A%0AMerci."
              style={{ display: "inline-block", background: OR, color: FOND, padding: "15px 34px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "16px" }}
            >
              Recevoir le tarif
            </a>
          </div>
        </div>

        <div style={CARTE}>
          <h2 style={H2}>Ce que vous faites avec la plateforme</h2>

          <p style={{ ...PUCE, color: OR, fontSize: "16px", marginTop: "8px" }}>Vos propres formations</p>
          <p style={P}>
            Vous creez vos formations, chapitre par chapitre, module par module. Vous les publiez
            quand elles sont pretes. Vos stagiaires les lisent, repondent au questionnaire, et un
            correcteur leur explique chacune de leurs erreurs — sur votre contenu.
          </p>

          <p style={{ ...PUCE, color: OR, fontSize: "16px", marginTop: "18px" }}>Classes en direct</p>
          <p style={P}>
            Reunissez vos stagiaires en visio, avec un tableau blanc partage. Les entrees et les
            sorties sont horodatees : elles tiennent lieu de feuille d emargement pour vos
            formations synchrones.
          </p>

          <p style={{ ...PUCE, color: OR, fontSize: "16px", marginTop: "18px" }}>
            Vos documents, signes electroniquement
          </p>
          <p style={P}>
            Programme, devis, convention, convocation, livret d accueil, attestations : produits a
            votre en-tete, en un clic. Vos conventions et devis se signent en ligne, le document
            est archive et son empreinte conservee.
          </p>

          <p style={{ ...PUCE, color: OR, fontSize: "16px", marginTop: "18px" }}>
            Tout ce qu un auditeur demande
          </p>
          <p style={P}>
            Evaluations a chaud et a froid avec leur taux de retour, registre des reclamations et
            de leurs actions correctives, dossiers de vos formateurs, quatre registres de veille,
            suivi de la sous-traitance, plan d amelioration continue. Et votre bilan pedagogique
            prerempli, cadre par cadre.
          </p>
        </div>

        {/* CE QUE NOUS FAISONS, CE QUE NOUS NE FAISONS PAS.
            Reecrit le 14 aout. Le texte dit d abord la qualite, ensuite la
            limite : l inverse decourageait avant d avoir convaincu.
            IMPORTANT : l habilitation par un certificateur ne s achete pas.
            Elle depend des criteres propres a chaque certificateur. Ecrire
            qu une redevance suffit serait une promesse que nous ne tenons
            pas — et dont nous porterions la responsabilite. */}
        <div style={{ ...CARTE, background: "rgba(255,255,255,0.015)" }}>
          <h2 style={{ ...H2, fontSize: "19px" }}>Ce que nous faisons, ce que nous ne faisons pas</h2>

          <p style={P}>
            Nos formations sont construites selon les standards les plus exigeants de la
            formation professionnelle : contenus structures chapitre par chapitre, evaluations
            a la fin de chaque module, correction expliquee erreur par erreur. L objectif est
            simple — que le stagiaire arrive au bout, et qu il en sorte avec quelque chose
            d utilisable des le lendemain.
          </p>

          <p style={P}>
            Nous avons choisi de ne pas enregistrer ces formations au Repertoire national des
            certifications professionnelles ni au repertoire specifique. Nous ne delivrons donc
            aucune certification reconnue par l Etat, et nos formations ne sont pas directement
            eligibles au compte personnel de formation.
          </p>

          <p style={P}>
            Ce choix decoule de notre modele : nous ne vendons pas au stagiaire final, nous
            equipons l organisme de formation. C est lui qui porte la certification, la relation
            avec ses financeurs et la responsabilite pedagogique.
          </p>

          <p style={P}>
            Un organisme certifie Qualiopi qui souhaite aller plus loin peut se rapprocher d un
            certificateur pour etre habilite a delivrer l une de ses certifications enregistrees.
            L habilitation depend des criteres propres a chaque certificateur, et donne
            generalement lieu a une redevance par candidat. C est une demarche possible, que
            nous n assurons pas a votre place.
          </p>

          <p style={P}>
            Pour les entreprises, la voie est plus directe encore : un organisme certifie
            Qualiopi peut proposer ces formations dans le cadre d un financement OPCO, sans
            passer par une certification enregistree.
          </p>

          <p style={P}>
            Pour les actions reglementees, nous fournissons les supports theoriques et l acces a
            distance. L evaluation pratique et le formateur habilite restent de votre cote.
          </p>

          <p style={{ ...P, margin: 0 }}>
            Vous demeurez l organisme de formation : votre certification, votre numero de
            declaration, vos attestations, votre responsabilite.
          </p>
        </div>

        <div style={{ textAlign: "center", margin: "40px 0 20px" }}>
          <a
            href="mailto:contact@academiapro.fr?subject=Pack%20organismes%20de%20formation"
            style={{ display: "inline-block", background: OR, color: FOND, padding: "17px 40px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontSize: "17px" }}
          >
            Demander une demonstration
          </a>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", marginTop: "16px" }}>
            contact@academiapro.fr — reponse dans la journee
          </p>
        </div>

        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", textAlign: "center" }}>
          <a href="/pack/cgv" style={{ color: "rgba(255,255,255,0.45)" }}>Conditions generales de vente</a>
        </p>
      </div>
    </div>
  );
}
