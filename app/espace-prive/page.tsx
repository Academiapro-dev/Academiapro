export const runtime = "nodejs";

const OR = "#c8a96e";
const FOND = "#050508";

// LA PAGE QUI MONTRE SANS OUVRIR.
//
// Un onglet qu on ne peut pas cliquer frustre et fait partir. Un onglet qui
// mene ici fait comprendre trois choses d un coup : le produit existe, il
// est reserve aux abonnes, et voila comment y entrer.
//
// Le parametre ?p= dit de quel espace il s agit. Sans lui, la page reste
// juste, elle parle simplement d espace client.
const ESPACES: any = {
  crm: {
    nom: "Le CRM",
    quoi: "Vos prospects suivis etape par etape, avec leur score, l analyse "
      + "de chaque fiche et la relance redigee pour vous.",
    pour: "Organismes de formation, centres d appels, equipes commerciales.",
  },
  lms: {
    nom: "La plateforme d apprentissage",
    quoi: "Vos formations creees chapitre par chapitre, vos stagiaires suivis, "
      + "les questionnaires corriges erreur par erreur et les attestations "
      + "produites automatiquement.",
    pour: "Organismes de formation, entreprises qui forment leurs equipes, "
      + "formateurs independants qui ont deja leur contenu.",
  },
  organisme: {
    nom: "L espace organisme",
    quoi: "Le catalogue a revendre sous votre marque, vos documents "
      + "administratifs a votre en-tete, vos signatures electroniques et "
      + "votre bilan pedagogique prepare au fil de l eau.",
    pour: "Organismes de formation declares.",
  },
  comptable: {
    nom: "Mr. Comptable",
    quoi: "La tenue de vos dossiers clients, la lecture automatique des "
      + "factures, le rapprochement bancaire et la teletransmission.",
    pour: "Cabinets d expertise comptable.",
  },
  qualiopi: {
    nom: "Mr. Qualiopi",
    quoi: "Les 32 indicateurs expliques un par un, vos preuves rassemblees "
      + "et horodatees, votre dossier d audit exportable.",
    pour: "Organismes qui preparent leur certification.",
  },
};

export default function EspacePrive({ searchParams }: any) {
  const cle = String((searchParams && searchParams.p) || "").toLowerCase();
  const e = ESPACES[cle] || null;

  const CADRE: any = {
    minHeight: "100vh",
    background: FOND,
    color: "#fff",
    fontFamily: "Georgia, serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 24px",
  };

  const CARTE: any = {
    maxWidth: "620px",
    width: "100%",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(200,169,110,0.3)",
    borderRadius: "16px",
    padding: "44px 40px",
    textAlign: "center",
  };

  const P: any = {
    color: "rgba(255,255,255,0.7)",
    fontSize: "16px",
    lineHeight: "1.85",
    margin: "0 0 16px",
  };

  return (
    <div style={CADRE}>
      <div style={CARTE}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 14px" }}>
          ESPACE RÉSERVÉ AUX ABONNÉS
        </p>

        <h1 style={{ color: "#fff", fontSize: "30px", lineHeight: "1.3", margin: "0 0 22px" }}>
          {e ? e.nom : "Votre espace client"}
        </h1>

        {e ? (
          <>
            <p style={P}>{e.quoi}</p>
            <p style={{ ...P, color: "rgba(255,255,255,0.5)", fontSize: "15px" }}>
              Pour : {e.pour}
            </p>
          </>
        ) : (
          <p style={P}>
            Cet espace est ouvert aux organismes et aux cabinets abonnés. Vos
            données y sont cloisonnées : personne d'autre que vous n'y accède.
          </p>
        )}

        <div style={{ height: "1px", background: "rgba(200,169,110,0.2)", margin: "30px 0" }} />

        <p style={{ ...P, fontSize: "15px", margin: "0 0 26px" }}>
          Vous êtes déjà abonné ? Connectez-vous avec l'adresse de votre
          organisme. Vous ne l'êtes pas encore ? Demandez une démonstration,
          nous vous répondons dans la journée.
        </p>

        <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href="/connexion"
            style={{
              background: OR, color: FOND, padding: "15px 34px",
              borderRadius: "9px", textDecoration: "none",
              fontWeight: "bold", fontSize: "16px",
            }}
          >
            Me connecter
          </a>
          <a
            href={"mailto:contact@academiapro.fr?subject=Demonstration"
              + (e ? "%20" + encodeURIComponent(e.nom) : "")}
            style={{
              background: "transparent", color: OR, padding: "15px 34px",
              borderRadius: "9px", textDecoration: "none",
              fontSize: "16px", border: "1px solid " + OR,
            }}
          >
            Demander une démonstration
          </a>
        </div>

        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13.5px", margin: "26px 0 0" }}>
          <a href="/" style={{ color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>
            ← Retour à l'accueil
          </a>
        </p>
      </div>
    </div>
  );
}
