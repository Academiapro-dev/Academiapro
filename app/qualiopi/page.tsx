import Link from "next/link";

export const metadata = {
  title: "Mr. Qualiopi — Préparez votre certification sans y passer vos nuits",
  description:
    "Les 7 critères et 32 indicateurs du Référentiel National Qualité, indicateur par indicateur. Ce qui est attendu, ce qui vous manque, les documents à présenter. 1 190 € HT.",
};

const VERT = "#3d9970";
const OR = "#c8a96e";
const NOIR = "#050508";

// Le Referentiel National Qualite compte SEPT criteres. Les nommer tous,
// dans l ordre officiel, montre au visiteur qu on parle bien de son audit
// et pas d une promesse vague.
const CRITERES: any[] = [
  {
    numero: 1,
    titre: "L'information au public",
    texte:
      "Ce que vous publiez sur vos prestations : objectifs, durée, prix, modalités, délais d'accès, accessibilité aux personnes handicapées. L'auditeur vérifiera vos pages, vos catalogues et vos fiches.",
  },
  {
    numero: 2,
    titre: "L'identification des besoins",
    texte:
      "Comment vous analysez la demande avant d'entrer en formation, comment vous adaptez le contenu au bénéficiaire, et ce que vous en gardez comme trace.",
  },
  {
    numero: 3,
    titre: "L'adaptation aux publics",
    texte:
      "La conception pédagogique, les modalités d'évaluation, l'accompagnement, et la façon dont vous accueillez les personnes en situation de handicap.",
  },
  {
    numero: 4,
    titre: "Les moyens",
    texte:
      "Vos moyens humains, techniques et pédagogiques : qui forme, avec quoi, dans quelles conditions. Les contrats, les curriculums vitae, les supports.",
  },
  {
    numero: 5,
    titre: "La qualification des intervenants",
    texte:
      "La compétence de ceux qui forment, la façon dont vous l'établissez et la maintenez, et ce que vous conservez pour le prouver.",
  },
  {
    numero: 6,
    titre: "L'inscription dans son environnement",
    texte:
      "Votre veille légale, réglementaire, sectorielle et pédagogique. Vos relations avec les acteurs de l'emploi et du handicap.",
  },
  {
    numero: 7,
    titre: "Les appréciations et les réclamations",
    texte:
      "Le recueil des retours, le traitement des réclamations, les difficultés rencontrées et ce que vous en avez tiré. C'est là que beaucoup d'organismes butent.",
  },
];

export default function AccueilQualiopi() {
  const section: any = { maxWidth: "1080px", margin: "0 auto", padding: "0 24px" };

  const carte: any = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(61,153,112,0.28)",
    borderRadius: "14px",
    padding: "24px",
  };

  const bouton: any = {
    display: "inline-block",
    background: VERT,
    color: "#fff",
    padding: "15px 30px",
    borderRadius: "9px",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "16px",
  };

  const boutonPale: any = {
    display: "inline-block",
    background: "transparent",
    color: VERT,
    padding: "15px 30px",
    borderRadius: "9px",
    textDecoration: "none",
    fontSize: "16px",
    border: "1px solid rgba(61,153,112,0.45)",
  };

  const lienPied: any = { color: VERT, fontSize: "14px", textDecoration: "none" };

  return (
    <div style={{ minHeight: "100vh", background: NOIR, color: "#fff", fontFamily: "Georgia, serif" }}>

      <header style={{ borderBottom: "1px solid rgba(61,153,112,0.2)", padding: "22px 0" }}>
        <div style={{ ...section, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
          <span style={{ color: VERT, fontSize: "21px", fontWeight: "bold" }}>Mr. Qualiopi</span>
          <nav style={{ display: "flex", gap: "22px", alignItems: "center", flexWrap: "wrap" }}>
            <a href="#referentiel" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" }}>Le référentiel</a>
            <a href="#tarif" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" }}>Tarif</a>
            <Link href="/connexion" style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "15px" }}>Se connecter</Link>
            <Link href="/qualiopi/inscription" style={{ ...bouton, padding: "11px 22px", fontSize: "15px" }}>Commencer</Link>
          </nav>
        </div>
      </header>

      {/* La promesse. Elle parle du calendrier de l organisme, pas du logiciel. */}
      <section style={{ ...section, paddingTop: "80px", paddingBottom: "60px" }}>
        <p style={{ color: VERT, fontSize: "12px", letterSpacing: "3px", margin: "0 0 18px" }}>
          PRÉPARATION À LA CERTIFICATION QUALIOPI
        </p>
        <h1 style={{ fontSize: "42px", lineHeight: "1.25", margin: "0 0 22px", maxWidth: "780px" }}>
          Votre audit Qualiopi, préparé indicateur par indicateur
        </h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "18px", lineHeight: "1.75", maxWidth: "700px", margin: "0 0 36px" }}>
          Sept critères, trente-deux indicateurs. Pour chacun : ce que l'auditeur
          attend, ce que vous avez déjà, ce qui vous manque, et le document à
          produire. Sans consultant à 3 000 €.
        </p>
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
          <Link href="/qualiopi/inscription" style={bouton}>Commencer ma préparation</Link>
          <a href="#tarif" style={boutonPale}>Voir le tarif</a>
        </div>
      </section>

      {/* Ce que le visiteur redoute vraiment. */}
      <section style={{ ...section, paddingBottom: "70px" }}>
        <div style={{ ...carte, borderColor: "rgba(61,153,112,0.45)", padding: "34px" }}>
          <h2 style={{ color: VERT, fontSize: "13px", letterSpacing: "3px", margin: "0 0 16px" }}>
            CE QUI FAIT ÉCHOUER UN AUDIT
          </h2>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "16px", lineHeight: "1.8", margin: "0 0 14px", maxWidth: "780px" }}>
            Ce n'est presque jamais la qualité de la formation. C'est la preuve qui
            manque : un émargement non signé, une veille dont il ne reste aucune
            trace, un questionnaire de satisfaction jamais dépouillé, un processus de
            réclamation qui n'existe que dans la tête du dirigeant.
          </p>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "16px", lineHeight: "1.8", margin: 0, maxWidth: "780px" }}>
            L'auditeur ne juge pas votre intention : il regarde ce que vous lui
            montrez. Mr. Qualiopi vous dit, pour chacun des trente-deux indicateurs,
            ce qu'il faut lui montrer.
          </p>
        </div>
      </section>

      {/* Le referentiel, dans son ordre officiel. */}
      <section id="referentiel" style={{ ...section, paddingBottom: "70px" }}>
        <h2 style={{ color: VERT, fontSize: "13px", letterSpacing: "3px", margin: "0 0 10px" }}>
          LES SEPT CRITÈRES
        </h2>
        <div style={{ height: "1px", background: "rgba(61,153,112,0.3)", marginBottom: "34px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "18px" }}>
          {CRITERES.map((c) => (
            <div key={c.numero} style={carte}>
              <p style={{ color: VERT, fontSize: "13px", margin: "0 0 8px" }}>Critère {c.numero}</p>
              <h3 style={{ color: "#fff", fontSize: "19px", margin: "0 0 12px" }}>{c.titre}</h3>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "15px", lineHeight: "1.7", margin: 0 }}>
                {c.texte}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Comment ca se passe. */}
      <section style={{ ...section, paddingBottom: "70px" }}>
        <h2 style={{ color: VERT, fontSize: "13px", letterSpacing: "3px", margin: "0 0 10px" }}>
          COMMENT ÇA SE PASSE
        </h2>
        <div style={{ height: "1px", background: "rgba(61,153,112,0.3)", marginBottom: "34px" }} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
          <div style={carte}>
            <p style={{ color: VERT, fontSize: "26px", fontWeight: "bold", margin: "0 0 10px" }}>1</p>
            <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 10px" }}>Vous décrivez votre organisme</h3>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14.5px", lineHeight: "1.7", margin: 0 }}>
              Votre activité, vos formations, vos formateurs, vos publics. Une demi-heure.
            </p>
          </div>
          <div style={carte}>
            <p style={{ color: VERT, fontSize: "26px", fontWeight: "bold", margin: "0 0 10px" }}>2</p>
            <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 10px" }}>La plateforme fait le tri</h3>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14.5px", lineHeight: "1.7", margin: 0 }}>
              Indicateur par indicateur : ce qui est acquis, ce qui manque, ce qui ne
              vous concerne pas. Tous les indicateurs ne s'appliquent pas à tous.
            </p>
          </div>
          <div style={carte}>
            <p style={{ color: VERT, fontSize: "26px", fontWeight: "bold", margin: "0 0 10px" }}>3</p>
            <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 10px" }}>Vous produisez les preuves</h3>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14.5px", lineHeight: "1.7", margin: 0 }}>
              Les documents manquants sont rédigés à partir de ce que vous avez
              déclaré. Vous les relisez, vous les adoptez.
            </p>
          </div>
          <div style={carte}>
            <p style={{ color: VERT, fontSize: "26px", fontWeight: "bold", margin: "0 0 10px" }}>4</p>
            <h3 style={{ color: "#fff", fontSize: "17px", margin: "0 0 10px" }}>Vous passez l'audit</h3>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14.5px", lineHeight: "1.7", margin: 0 }}>
              Avec votre dossier de preuves classé dans l'ordre du référentiel, et la
              réponse prête pour chaque indicateur.
            </p>
          </div>
        </div>
      </section>

      {/* Le tarif. */}
      <section id="tarif" style={{ ...section, paddingBottom: "70px" }}>
        <h2 style={{ color: VERT, fontSize: "13px", letterSpacing: "3px", margin: "0 0 10px" }}>
          LE TARIF
        </h2>
        <div style={{ height: "1px", background: "rgba(61,153,112,0.3)", marginBottom: "34px" }} />

        <div style={{ ...carte, borderColor: "rgba(61,153,112,0.5)", padding: "34px" }}>
          <p style={{ color: VERT, fontSize: "40px", fontWeight: "bold", margin: "0 0 6px" }}>
            1 190 € <span style={{ fontSize: "17px", color: "rgba(255,255,255,0.55)" }}>HT, une fois</span>
          </p>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "16px", lineHeight: "1.8", margin: "0 0 20px", maxWidth: "700px" }}>
            L'accès pour douze mois, ce qui couvre la préparation et l'audit initial.
            Les trente-deux indicateurs, la production des documents, et l'assistance
            par courriel. Aucun abonnement, aucun supplément.
          </p>

          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14.5px", lineHeight: "1.8", margin: 0, maxWidth: "700px" }}>
            À titre de comparaison, un accompagnement par un consultant se facture
            couramment plusieurs milliers d'euros. Le coût de l'audit lui-même reste
            dû à votre organisme certificateur, quel que soit votre préparateur.
          </p>
        </div>
      </section>

      {/* La reserve. Elle doit etre lisible, pas cachee en bas de page :
          promettre une certification qu on ne delivre pas serait grave. */}
      <section style={{ ...section, paddingBottom: "70px" }}>
        <div style={{ ...carte, background: "rgba(200,169,110,0.06)", borderColor: "rgba(200,169,110,0.3)" }}>
          <h2 style={{ color: OR, fontSize: "13px", letterSpacing: "3px", margin: "0 0 14px" }}>
            CE QUE NOUS NE SOMMES PAS
          </h2>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "15.5px", lineHeight: "1.8", margin: 0, maxWidth: "780px" }}>
            Mr. Qualiopi n'est pas un organisme certificateur et ne délivre aucune
            certification. Seul un organisme accrédité par le Comité français
            d'accréditation peut le faire, au vu de son propre audit. Nous préparons
            votre dossier ; la décision ne nous appartient pas, et nous ne promettons
            aucun résultat.
          </p>
        </div>
      </section>

      <section style={{ ...section, paddingBottom: "90px" }}>
        <div style={{ ...carte, textAlign: "center", padding: "44px 26px" }}>
          <h2 style={{ fontSize: "27px", margin: "0 0 14px" }}>Sachez où vous en êtes</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: "1.7", margin: "0 0 28px" }}>
            L'espace s'ouvre en une minute. Vous n'avez pas de mot de passe à retenir :
            vous recevez un lien de connexion par courriel.
          </p>
          <Link href="/qualiopi/inscription" style={bouton}>Commencer ma préparation</Link>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid rgba(61,153,112,0.2)", padding: "34px 0" }}>
        <div style={section}>
          <p style={{ color: VERT, fontSize: "17px", margin: "0 0 8px" }}>Mr. Qualiopi</p>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "14px", lineHeight: "1.8", margin: 0 }}>
            Une marque d'AcadéMIA Pro LLC · 30 N Gould St, STE R, Sheridan WY 82801,
            États-Unis<br />
            contact@academiapro.fr
          </p>
          <p style={{ margin: "16px 0 0", display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <Link href="/qualiopi/cgv" style={lienPied}>Conditions générales de vente</Link>
            <Link href="/qualiopi/mentions" style={lienPied}>Mentions légales</Link>
          </p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", marginTop: "14px", marginBottom: 0 }}>
            Prix hors taxes. Prestataire établi hors Union européenne : la TVA est
            autoliquidée par le preneur assujetti.
          </p>
        </div>
      </footer>

    </div>
  );
}
