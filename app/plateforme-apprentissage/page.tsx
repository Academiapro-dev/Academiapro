import Link from "next/link";

export const metadata = {
  title: "LMS pour organisme de formation — AcadéMIA Pro",
  description:
    "Créez vos formations, suivez vos stagiaires, produisez vos attestations. Questionnaires corrigés erreur par erreur, classes virtuelles, présences horodatées.",
};

const OR = "#c8a96e";
const NOIR = "#050508";

// UNE PAGE VITRINE POUR L ORGANISME QUI ACHETE, pas pour le stagiaire.
//
// /lms existe deja et s adresse au stagiaire : « Mon LMS », « votre espace
// d apprentissage ». Elle decrit ce qui existe et n a pas ete touchee.
// Celle-ci parle a qui cherche un LMS a acheter — ce n est ni le meme
// public ni le meme discours, d ou une adresse distincte.
//
// LE SIGLE LMS FIGURE DANS LE TITRE : le metier le tape dans un moteur de
// recherche, le profane cherche « plateforme d apprentissage ». Les deux
// mots doivent etre presents.
//
// TROIS CORRECTIONS DU 15/08, APRES VERIFICATION EN BASE.
//
// (1) LA SOUS-TRAITANCE EST RETIREE. Aucune table ne la porte, et surtout
// ELLE N EST PAS DE NOTRE RESSORT : l organisme client est seul prestataire
// de formation (article 1 des CGV), c est donc a lui d encadrer ses
// sous-traitants. Les cinq autres preuves annoncees, elles, EXISTENT
// REELLEMENT — verifie en base : organisme_evaluations,
// organisme_reclamations, organisme_formateurs, organisme_ameliorations,
// organisme_presences. Elles appartiennent bien au LMS et non a
// Mr. Qualiopi, dont les tables portent le prefixe qualiopi_.
//
// (2) LE TABLEAU BLANC PARTAGE EST RETIRE. Il avait ete demande, jamais
// constate a l ecran. Une fonction qu on souhaite n est pas une fonction
// qu on vend.
//
// (3) L EMARGEMENT EST REFORMULE. Ecrire que l horodatage « tient lieu de
// feuille d emargement » est une affirmation de conformite reglementaire.
// La trace existe (organisme_presences), on la decrit pour ce qu elle est.
//
// AUCUN PRIX ICI. Le tarif se donne apres un echange.

export default function PagePlateforme() {
  const section: any = {
    maxWidth: "860px",
    margin: "0 auto",
    padding: "0 24px",
  };

  const carte: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.22)",
    borderRadius: "14px",
    padding: "26px 28px",
    marginBottom: "18px",
  };

  const bouton: any = {
    display: "inline-block",
    background: OR,
    color: NOIR,
    padding: "15px 30px",
    borderRadius: "9px",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "16px",
  };

  const H2: any = { color: OR, fontSize: "22px", margin: "44px 0 16px" };

  const P: any = {
    color: "rgba(255,255,255,0.75)",
    fontSize: "16.5px",
    lineHeight: "1.85",
    margin: "0 0 16px",
  };

  return (
    <div style={{ minHeight: "100vh", background: NOIR, color: "#fff", fontFamily: "Georgia, serif" }}>

      <article style={{ ...section, paddingTop: "60px", paddingBottom: "80px" }}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 16px" }}>
          NOS SOLUTIONS MÉTIER
        </p>
        <h1 style={{ fontSize: "38px", lineHeight: "1.25", margin: "0 0 24px" }}>
          La plateforme d'apprentissage (LMS) : votre contenu, vos stagiaires, vos preuves
        </h1>
        <p style={{ ...P, fontSize: "18.5px", color: "rgba(255,255,255,0.8)" }}>
          Vous avez déjà vos formations. Il vous manque l'outil qui les diffuse, suit
          qui les a suivies, et produit ce qu'un auditeur vous demandera.
        </p>

        <h2 style={H2}>Vos formations, créées et publiées</h2>
        <p style={P}>
          Chapitre par chapitre, module par module. Vous publiez quand c'est prêt.
          Aucune limite de nombre : votre catalogue reste le vôtre, et il n'entre dans
          aucune commission.
        </p>

        <h2 style={H2}>La correction qui explique</h2>
        <p style={P}>
          À la fin de chaque module, un questionnaire. Le stagiaire répond, et chaque
          erreur lui est expliquée — pourquoi sa réponse était fausse, et ce qu'il
          fallait comprendre. C'est ce qui distingue un contrôle d'un apprentissage.
        </p>

        <h2 style={H2}>Les classes en direct</h2>
        <p style={P}>
          Réunissez vos stagiaires en visioconférence. Les entrées et les sorties sont
          horodatées et conservées : vous gardez une trace d'assiduité pour vos
          formations synchrones.
        </p>

        <div style={{ ...carte, borderColor: "rgba(200,169,110,0.4)", marginTop: "30px" }}>
          <h3 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 14px" }}>
            CE QU'UN AUDITEUR DEMANDERA
          </h3>
          <p style={{ ...P, margin: "0 0 12px", fontSize: "16px" }}>
            Évaluations à chaud et à froid avec leur taux de retour, registre des
            réclamations et de leurs actions correctives, dossiers de vos formateurs,
            plan d'amélioration continue.
          </p>
          <p style={{ ...P, margin: 0, fontSize: "16px" }}>
            Et votre bilan pédagogique et financier prérempli, cadre par cadre, à partir
            de ce qui s'est réellement passé pendant l'année.
          </p>
        </div>

        <h2 style={H2}>Les attestations</h2>
        <p style={P}>
          Produites automatiquement à la fin du parcours, à votre en-tête, avec leur
          numéro et leur page de vérification. Ce sont des attestations de fin de
          formation : ni titre, ni diplôme, ni certification enregistrée.
        </p>

        <h2 style={H2}>Le suivi, stagiaire par stagiaire</h2>
        <p style={P}>
          Où en est chacun, quels modules sont validés, qui n'est pas revenu depuis
          trois semaines. Les inactifs se relancent, et vous savez avant la fin de
          session qui risque de ne pas aller au bout.
        </p>

        <h2 style={H2}>Pour qui</h2>
        <p style={P}>
          Organismes de formation qui possèdent déjà leur contenu. Entreprises qui
          forment leurs propres équipes. Formateurs indépendants qui veulent diffuser
          sans construire d'outil.
        </p>
        <p style={P}>
          La plateforme se prend seule, ou avec notre catalogue de formations et le
          suivi commercial.
        </p>

        <div style={{ ...carte, textAlign: "center", padding: "40px 26px", marginTop: "44px", borderColor: "rgba(200,169,110,0.4)" }}>
          <h2 style={{ fontSize: "25px", margin: "0 0 14px" }}>Voyez-la sur une de vos formations</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: "1.7", margin: "0 0 26px" }}>
            Apportez un de vos contenus, nous le montons ensemble et vous jugez le
            résultat. Nous vous adressons le tarif à l'issue de l'échange.
          </p>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="mailto:contact@academiapro.fr?subject=La%20plateforme%20d%20apprentissage"
              style={bouton}
            >
              Demander une démonstration
            </a>
            <Link
              href="/connexion"
              style={{ ...bouton, background: "transparent", color: OR, border: "1px solid rgba(200,169,110,0.4)" }}
            >
              Me connecter
            </Link>
          </div>
        </div>
      </article>

    </div>
  );
}
