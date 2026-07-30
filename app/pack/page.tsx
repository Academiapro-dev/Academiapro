export const runtime = "nodejs";

const CADRE: any = {
  minHeight: "100vh",
  background: "#050508",
  color: "#fff",
  fontFamily: "Georgia, serif",
  padding: "50px 20px",
};

const CARTE: any = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(200,169,110,0.25)",
  borderRadius: "12px",
  padding: "28px 30px",
  flex: "1 1 280px",
};

export default function PagePack() {
  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <p style={{ color: "#c8a96e", fontSize: "12px", letterSpacing: "3px", margin: "0 0 10px" }}>
          POUR LES ORGANISMES DE FORMATION
        </p>
        <h1 style={{ color: "#fff", fontSize: "36px", margin: "0 0 16px", lineHeight: "1.25" }}>
          Vos stagiaires, nos formations,<br />votre suivi.
        </h1>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "18px", lineHeight: "1.7", maxWidth: "700px" }}>
          Vous inscrivez vos stagiaires. Ils suivent nos formations en ligne, passent leurs
          questionnaires, recoivent une correction individuelle expliquee sur chaque module.
          Vous voyez ou chacun en est, et vos chiffres de bilan pedagogique sont calcules
          au fur et a mesure.
        </p>

        <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", margin: "44px 0" }}>
          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", letterSpacing: "2px", margin: "0 0 12px" }}>
              L OUTIL
            </p>
            <p style={{ color: "#c8a96e", fontSize: "34px", fontWeight: "bold", margin: "0 0 4px" }}>
              100 EUR
            </p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", margin: "0 0 18px" }}>
              par mois, hors taxes
            </p>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px", lineHeight: "1.75", margin: 0 }}>
              La plateforme de suivi et le CRM. Registre de vos stagiaires, invitations,
              avancement module par module, notes, et vos chiffres de bilan pedagogique
              ranges selon les cadres du Cerfa.
            </p>
          </div>

          <div style={{ ...CARTE, border: "2px solid #c8a96e" }}>
            <p style={{ color: "#c8a96e", fontSize: "13px", letterSpacing: "2px", margin: "0 0 12px" }}>
              L OUTIL ET LE CATALOGUE
            </p>
            <p style={{ color: "#c8a96e", fontSize: "34px", fontWeight: "bold", margin: "0 0 4px" }}>
              500 EUR
            </p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", margin: "0 0 18px" }}>
              par mois, hors taxes
            </p>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px", lineHeight: "1.75", margin: 0 }}>
              Tout ce qui precede, plus l acces a nos 300 formations : bien-etre, langues,
              business, droit, informatique, marketing. Vous les proposez a vos stagiaires
              sans avoir une ligne a rediger.
            </p>
          </div>

          <div style={CARTE}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", letterSpacing: "2px", margin: "0 0 12px" }}>
              PREPARATION A QUALIOPI
            </p>
            <p style={{ color: "#c8a96e", fontSize: "34px", fontWeight: "bold", margin: "0 0 4px" }}>
              1 190 EUR
            </p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", margin: "0 0 18px" }}>
              forfait unique, hors taxes
            </p>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px", lineHeight: "1.75", margin: 0 }}>
              A ajouter a l une des deux formules. Un assistant qui connait le niveau attendu
              du referentiel, lit vos preuves, vous dit ce qui manque et vous prepare a
              l audit. Il ne delivre aucune certification.
            </p>
          </div>
        </div>

        <div style={{ ...CARTE, flex: "none", border: "1px solid rgba(200,169,110,0.45)", marginBottom: "36px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 12px" }}>
            Tarif de lancement : la premiere annee a moitie prix
          </h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px", lineHeight: "1.75", margin: 0 }}>
            Pour nos premiers clients, l abonnement est reduit de moitie pendant douze mois.
            La date de fin et le montant plein figurent au contrat des la signature : aucune
            surprise, aucune renegociation. En echange, nous vous demandons un temoignage et
            le droit de citer votre nom.
          </p>
        </div>

        <div style={{ ...CARTE, flex: "none", marginBottom: "36px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "20px", margin: "0 0 12px" }}>
            Et une part sur ce que vous vendez
          </h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "15px", lineHeight: "1.75", margin: "0 0 12px" }}>
            En plus de l abonnement, nous prelevons 20 % du prix de chaque formation que vous
            vendez a un stagiaire. Le prix figure au contrat, formation par formation, et la
            plateforme compte les inscriptions : vous n avez aucune declaration a nous fournir.
          </p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", lineHeight: "1.7", margin: 0 }}>
            Concretement : une formation vendue 1 500 EUR vous laisse 1 200 EUR, sans avoir
            rien produit, rien corrige, rien heberge.
          </p>
        </div>

        <h2 style={{ color: "#fff", fontSize: "24px", margin: "0 0 20px" }}>Ce que fait la plateforme</h2>

        <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", marginBottom: "40px" }}>
          {[
            ["Correction individuelle", "Chaque module se termine par un questionnaire et une note de synthese. Un correcteur note sur 20, explique chaque erreur et donne la bonne reponse. Le module se valide a 14."],
            ["Suivi en temps reel", "Qui a commence, qui decroche, quelle moyenne, quelle derniere activite. Par stagiaire et par formation."],
            ["Vos chiffres de bilan", "Stagiaires, heures, ventilation des financements : ranges selon les cadres du Cerfa 10443, prets a recopier sur Mon Activite Formation."],
            ["Acces sans mot de passe", "Vos stagiaires recoivent un lien par email et entrent directement dans leur espace."],
          ].map(function (x) {
            return (
              <div key={x[0]} style={{ ...CARTE, padding: "22px 24px" }}>
                <h3 style={{ color: "#c8a96e", fontSize: "17px", margin: "0 0 8px" }}>{x[0]}</h3>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px", lineHeight: "1.7", margin: 0 }}>
                  {x[1]}
                </p>
              </div>
            );
          })}
        </div>

        <div style={{ ...CARTE, flex: "none", background: "rgba(200,169,110,0.06)", marginBottom: "30px" }}>
          <h2 style={{ color: "#c8a96e", fontSize: "18px", margin: "0 0 12px" }}>Ce que la plateforme ne fait pas</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px", lineHeight: "1.75", margin: 0 }}>
            Nos formations ne sont enregistrees ni au Repertoire national des certifications
            professionnelles ni au repertoire specifique : elles ne sont donc pas eligibles
            au compte personnel de formation. Nous ne delivrons aucune certification
            reconnue par l Etat, et nous ne prejugeons pas de la decision d un auditeur.
            Vous restez le prestataire de formation aupres de vos stagiaires.
          </p>
        </div>

        <div style={{ textAlign: "center", padding: "20px 0 40px" }}>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", margin: "0 0 18px" }}>
            Un echange de vingt minutes suffit pour savoir si cela vous convient.
          </p>
          <a
            href="mailto:contact@academiapro.fr?subject=Pack%20organismes%20de%20formation"
            style={{ background: "#c8a96e", color: "#050508", padding: "16px 34px", borderRadius: "8px", textDecoration: "none", fontSize: "17px", fontWeight: "bold", display: "inline-block" }}
          >
            Nous ecrire
          </a>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", margin: "18px 0 0" }}>
            Prix hors taxes. Prestation entre professionnels : la TVA est autoliquidee par
            le client, qui communique son numero de TVA intracommunautaire.
          </p>
        </div>
      </div>
    </div>
  );
}
