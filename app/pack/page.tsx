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
  const formules = [
    {
      nom: "Outil seul",
      prix: "100",
      detail: "La plateforme et le suivi, avec vos propres formations.",
      inclus: [
        "Creation illimitee de vos formations",
        "Classes virtuelles avec tableau blanc",
        "Correction des questionnaires par IA",
        "Les 21 documents administratifs",
        "Signature electronique",
        "Bilan pedagogique prepare",
      ],
    },
    {
      nom: "Outil et catalogue",
      prix: "500",
      detail: "Tout ce qui precede, plus 300 formations pretes a vendre.",
      inclus: [
        "Tout de la formule precedente",
        "300 formations redigees et corrigees",
        "Vous fixez vos propres prix de vente",
        "Aucun contenu a produire",
        "Mise a jour du catalogue incluse",
      ],
      phare: true,
    },
    {
      nom: "Mr. Qualiopi",
      prix: "1 190",
      detail: "Forfait unique, en sus. Preparation a la certification.",
      inclus: [
        "Les 32 indicateurs expliques",
        "Un assistant qui repond a vos questions",
        "Vos preuves rassemblees et horodatees",
        "Dossier d audit exportable en PDF",
      ],
    },
  ];

  return (
    <div style={CADRE}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <p style={{ color: OR, fontSize: "12px", letterSpacing: "3px", margin: "0 0 10px" }}>
          POUR LES ORGANISMES DE FORMATION
        </p>
        <h1 style={{ color: "#fff", fontSize: "34px", lineHeight: "1.3", margin: "0 0 16px" }}>
          Votre plateforme de formation,<br />et tout l administratif qui va avec
        </h1>
        <p style={{ ...P, fontSize: "18px" }}>
          Vous formez, nous nous occupons du reste : la plateforme, les documents obligatoires,
          les evaluations, le registre des reclamations, le bilan pedagogique. Et si vous manquez
          de contenu, trois cents formations vous attendent.
        </p>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", margin: "40px 0" }}>
          {formules.map(function (f) {
            return (
              <div
                key={f.nom}
                style={{
                  ...CARTE,
                  flex: "1 1 260px",
                  marginBottom: 0,
                  border: f.phare ? "2px solid " + OR : CARTE.border,
                  background: f.phare ? "rgba(200,169,110,0.06)" : CARTE.background,
                }}
              >
                <h2 style={{ ...H2, fontSize: "18px", margin: "0 0 8px" }}>{f.nom}</h2>
                <p style={{ color: "#fff", fontSize: "30px", fontWeight: "bold", margin: "0 0 2px" }}>
                  {f.prix} EUR
                </p>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px", margin: "0 0 14px" }}>
                  {f.nom === "Mr. Qualiopi" ? "hors taxes, une fois" : "hors taxes par mois"}
                </p>
                <p style={{ ...P, fontSize: "14px", margin: "0 0 14px" }}>{f.detail}</p>
                {f.inclus.map(function (i) {
                  return (
                    <p key={i} style={{ ...PUCE, fontSize: "14px" }}>
                      <span style={{ color: OR }}>·</span> {i}
                    </p>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div style={{ ...CARTE, border: "2px solid " + OR }}>
          <h2 style={H2}>Tarif de lancement</h2>
          <p style={P}>
            Les premiers organismes beneficient de <strong style={{ color: "#fff" }}>moitie prix
            pendant douze mois</strong>. La date de fin et le montant plein sont inscrits a votre
            contrat des la signature : aucune surprise, aucune renegociation.
          </p>
          <p style={{ ...P, margin: 0, fontSize: "15px", color: "rgba(255,255,255,0.55)" }}>
            En echange, nous vous demandons un temoignage et le droit de citer votre nom.
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
          <h2 style={H2}>Ce que nous prelevons</h2>
          <p style={P}>
            Outre l abonnement, vingt pour cent du prix contractuel de chaque formation de notre
            catalogue que vous vendez. Rien sur vos propres formations : elles sont a vous.
          </p>
          <p style={{ ...P, margin: 0, fontSize: "15px", color: "rgba(255,255,255,0.55)" }}>
            Le comptage est automatique. Vous n avez aucune declaration a faire.
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
            Mr. Qualiopi vous prepare a l audit, il ne le remplace pas et n emet aucun avis de
            conformite. Le bilan pedagogique est prepare, mais la declaration reste la votre.
          </p>
          <p style={{ ...P, fontSize: "15px", margin: 0 }}>
            La signature electronique est une signature simple au sens du reglement europeen
            eIDAS. Elle est recevable, mais elle n est ni avancee ni qualifiee.
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
