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
          <h2 style={{ ...H2, fontSize: "18px", margin: "0 0 8px" }}>La formule</h2>
          <p style={{ color: "#fff", fontSize: "34px", fontWeight: "bold", margin: "0 0 2px" }}>
            390 EUR
          </p>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", margin: "0 0 18px" }}>
            hors taxes par mois, sans engagement de duree
          </p>

          <p style={PUCE}><span style={{ color: OR }}>·</span> Les 331 formations du catalogue, a vos prix</p>
          <p style={PUCE}><span style={{ color: OR }}>·</span> Vos propres formations, creees et publiees sans limite</p>
          <p style={PUCE}><span style={{ color: OR }}>·</span> Stagiaires illimites</p>
          <p style={PUCE}><span style={{ color: OR }}>·</span> Correction des questionnaires par IA, erreur par erreur</p>
          <p style={PUCE}><span style={{ color: OR }}>·</span> Classes virtuelles avec tableau blanc</p>
          <p style={PUCE}><span style={{ color: OR }}>·</span> Les 21 documents administratifs, a votre en-tete</p>
          <p style={PUCE}><span style={{ color: OR }}>·</span> Signature electronique et archivage</p>
          <p style={PUCE}><span style={{ color: OR }}>·</span> Suivi commercial et page publique</p>
          <p style={PUCE}><span style={{ color: OR }}>·</span> Bilan pedagogique et financier prepare, cadre par cadre</p>

          <div style={{ borderTop: "1px solid rgba(200,169,110,0.25)", marginTop: "18px", paddingTop: "16px" }}>
            <p style={{ ...P, fontSize: "15px", margin: "0 0 8px" }}>
              La mise en service est facturee{" "}
              <strong style={{ color: "#fff" }}>1 500 EUR hors taxes, une seule fois</strong> :
              ouverture de votre espace, portail a votre marque, reprise de votre catalogue et
              prise en main.
            </p>
            <p style={{ ...P, fontSize: "15px", margin: "0 0 8px" }}>
              S y ajoutent <strong style={{ color: "#fff" }}>35 % du prix de vente</strong> de chaque
              formation <em>de notre catalogue</em> que vous vendez, avec un minimum de{" "}
              <strong style={{ color: "#fff" }}>30 EUR par stagiaire inscrit</strong>.
            </p>
            <p style={{ ...P, fontSize: "15px", margin: 0, color: "rgba(255,255,255,0.55)" }}>
              Rien sur les formations que vous creez : elles sont a vous. Le comptage est
              automatique, vous n avez aucune declaration a faire.
            </p>
          </div>
        </div>

        <div style={{ ...CARTE, border: "1px solid rgba(200,169,110,0.45)" }}>
          <h2 style={{ ...H2, fontSize: "18px" }}>Tarif de lancement</h2>
          <p style={P}>
            Les premiers organismes beneficient de{" "}
            <strong style={{ color: "#fff" }}>moitie prix pendant douze mois</strong>. La date de
            fin et le montant plein sont inscrits a votre bon de commande des la signature :
            aucune surprise, aucune renegociation.
          </p>
          <p style={{ ...P, margin: 0, fontSize: "15px", color: "rgba(255,255,255,0.55)" }}>
            En echange, nous vous demandons un temoignage et le droit de citer votre nom.
          </p>
        </div>

        <div style={CARTE}>
          <h2 style={H2}>Ce qu il vous manque, nous le produisons</h2>
          <p style={P}>
            Une formation absente du catalogue ? Dites-nous laquelle : nous la redigeons sur mesure
            et vous l avez dans le mois, a votre en-tete, avec ses questionnaires et son manuel.
            Deux formations par an sont comprises dans l abonnement.
          </p>
          <p style={{ ...P, margin: 0, fontSize: "15px", color: "rgba(255,255,255,0.55)" }}>
            Aucun logiciel de gestion ne fait cela, parce qu aucun ne produit de contenu.
          </p>
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

        <div style={CARTE}>
          <h2 style={H2}>Mr. Qualiopi</h2>
          <p style={{ color: "#fff", fontSize: "26px", fontWeight: "bold", margin: "0 0 2px" }}>
            790 EUR
          </p>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", margin: "0 0 14px" }}>
            hors taxes, une fois, en sus de l abonnement
          </p>
          <p style={P}>
            Les 32 indicateurs expliques un par un, un assistant qui repond a vos questions sur
            votre situation reelle, vos preuves rassemblees et horodatees, et votre dossier d audit
            exportable en PDF.
          </p>
          <p style={{ ...P, margin: 0, fontSize: "15px", color: "rgba(255,255,255,0.55)" }}>
            Il vous prepare a l audit. Il ne le remplace pas et n emet aucun avis de conformite.
          </p>
        </div>

        <div style={{ ...CARTE, background: "rgba(255,255,255,0.015)" }}>
          <h2 style={{ ...H2, fontSize: "17px" }}>Ce que nous ne faisons pas</h2>
          <p style={{ ...P, fontSize: "15px" }}>
            Les formations de notre catalogue ne sont enregistrees ni au Repertoire national des
            certifications professionnelles ni au repertoire specifique : elles ne sont pas
            eligibles au compte personnel de formation. Nous ne delivrons aucune certification
            reconnue par l Etat.
          </p>
          <p style={{ ...P, fontSize: "15px" }}>
            Nous ne dispensons aucune formation en presence. Pour les actions reglementees, nous
            fournissons les supports theoriques et l acces a distance ; l evaluation pratique et le
            formateur habilite restent de votre cote.
          </p>
          <p style={{ ...P, fontSize: "15px", margin: 0 }}>
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
