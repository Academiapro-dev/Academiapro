import Link from "next/link";

export const metadata = {
  title: "Mentions légales — Mr. Qualiopi",
  description: "Éditeur, hébergement, propriété intellectuelle et données personnelles.",
};

const VERT = "#3d9970";
const NOIR = "#050508";

export default function MentionsQualiopi() {
  const section: any = { maxWidth: "820px", margin: "0 auto", padding: "0 24px" };

  const titre: any = { color: VERT, fontSize: "19px", margin: "36px 0 12px", lineHeight: "1.4" };
  const texte: any = { color: "rgba(255,255,255,0.72)", fontSize: "15.5px", lineHeight: "1.85", margin: "0 0 14px" };

  return (
    <div style={{ minHeight: "100vh", background: NOIR, color: "#fff", fontFamily: "Georgia, serif" }}>

      <header style={{ borderBottom: "1px solid rgba(61,153,112,0.2)", padding: "22px 0" }}>
        <div style={{ ...section, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <Link href="/qualiopi" style={{ color: VERT, fontSize: "21px", fontWeight: "bold", textDecoration: "none" }}>
            Mr. Qualiopi
          </Link>
          <Link href="/qualiopi" style={{ color: "rgba(255,255,255,0.65)", fontSize: "15px", textDecoration: "none" }}>
            ← Retour
          </Link>
        </div>
      </header>

      <div style={{ ...section, paddingTop: "60px", paddingBottom: "90px" }}>

        <h1 style={{ color: "#fff", fontSize: "30px", margin: "0 0 10px", lineHeight: "1.3" }}>
          Mentions légales
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", margin: "0 0 10px" }}>
          Dernière mise à jour : 10 août 2026
        </p>

        <h2 style={titre}>Éditeur</h2>
        <p style={texte}>
          Mr. Qualiopi est une marque exploitée par AcadéMIA Pro LLC, société à
          responsabilité limitée de droit du Wyoming, dont le siège est situé
          30 N Gould St, STE R, Sheridan WY 82801, États-Unis.
        </p>
        <p style={texte}>
          Numéro d'identification d'employeur : 32-0862305. Immatriculation :
          2026-002015136, du 25 juin 2026.
        </p>
        <p style={texte}>
          Directeur de la publication : Jacques Lalou, gérant.
        </p>
        <p style={texte}>
          Contact : contact@academiapro.fr
        </p>

        <h2 style={titre}>Hébergement</h2>
        <p style={texte}>
          Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina,
          CA 91723, États-Unis.
        </p>
        <p style={texte}>
          Les données sont conservées par Supabase, sur une infrastructure située
          dans l'Union européenne.
        </p>

        <h2 style={titre}>Nature du service</h2>
        <p style={texte}>
          Mr. Qualiopi accompagne les organismes de formation dans la préparation de
          leur certification Qualiopi au regard du Référentiel National Qualité.
        </p>
        <p style={texte}>
          <strong style={{ color: "#fff" }}>
            Mr. Qualiopi n'est pas un organisme certificateur et ne délivre aucune
            certification.
          </strong>{" "}
          La certification Qualiopi ne peut être délivrée que par un organisme
          accrédité par le Comité français d'accréditation ou ayant déposé une
          demande recevable, dont la liste est publiée par le ministère du Travail.
          La décision appartient au seul certificateur, au vu de son propre audit.
        </p>

        <h2 style={titre}>Propriété intellectuelle</h2>
        <p style={texte}>
          Les contenus, développements, marques et bases de données du site
          demeurent la propriété exclusive d'AcadéMIA Pro LLC. Toute reproduction ou
          réutilisation, même partielle, sans autorisation écrite, est interdite.
        </p>
        <p style={texte}>
          Le Référentiel National Qualité et la marque Qualiopi appartiennent à
          l'État français. Leur mention n'emporte aucun lien de partenariat ni
          d'agrément.
        </p>
        <p style={texte}>
          Les documents produits par la plateforme à partir des informations saisies
          par l'utilisateur lui appartiennent.
        </p>

        <h2 style={titre}>Données personnelles</h2>
        <p style={texte}>
          Les données recueillies servent exclusivement à la fourniture du service et
          au respect des obligations légales de conservation. Elles ne sont ni
          vendues ni cédées.
        </p>
        <p style={texte}>
          Toute personne dispose des droits d'accès, de rectification, d'effacement,
          de limitation, de portabilité et d'opposition prévus par le règlement (UE)
          2016/679. Ces droits s'exercent à contact@academiapro.fr.
        </p>
        <p style={texte}>
          Une réclamation peut être adressée à la Commission nationale de
          l'informatique et des libertés.
        </p>

        <h2 style={titre}>Témoins de connexion</h2>
        <p style={texte}>
          Le site n'emploie que les témoins nécessaires à son fonctionnement,
          notamment au maintien de la session. Aucun témoin publicitaire ni de mesure
          d'audience tierce n'est déposé.
        </p>

        <h2 style={titre}>Droit applicable</h2>
        <p style={texte}>
          Le présent site est soumis au droit français. Tout différend relève du
          Tribunal de commerce de Paris, sauf disposition impérative contraire
          protégeant le consommateur.
        </p>

        <p style={{ ...texte, marginTop: "36px" }}>
          Les conditions applicables à la vente figurent dans les{" "}
          <Link href="/qualiopi/cgv" style={{ color: VERT }}>
            conditions générales de vente
          </Link>.
        </p>

      </div>

      <footer style={{ borderTop: "1px solid rgba(61,153,112,0.2)", padding: "30px 0" }}>
        <div style={section}>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "13.5px", lineHeight: "1.8", margin: 0 }}>
            AcadéMIA Pro LLC · 30 N Gould St, STE R, Sheridan WY 82801, États-Unis ·
            contact@academiapro.fr
          </p>
        </div>
      </footer>

    </div>
  );
}
