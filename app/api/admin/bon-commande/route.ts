import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "documents-signes";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    global: {
      fetch: function (url: any, options: any) {
        return fetch(url, { ...(options || {}), cache: "no-store" });
      },
    },
  }
);

// TROIS OFFRES, TROIS BONS DE COMMANDE DIFFERENTS.
//
//  - PACK : 390 EUR HT par mois, stagiaires ET utilisateurs illimites,
//    35 % sur le catalogue editeur avec un minimum de 30 EUR par stagiaire
//    inscrit, 1 500 EUR de mise en service.
//  - LMS SEUL : 290 EUR HT par mois, sans catalogue editeur.
//  - CRM SEUL : 35 EUR HT PAR UTILISATEUR ET PAR MOIS, sans degressivite.
//
// 🚨 IL N Y A PLUS DE TARIF DE LANCEMENT. Le code divisait l abonnement PAR
// DEUX des que lancement_jusqu_au portait une date, sans que Jacques l ait
// jamais decide. Ne pas le reintroduire.
//
// 🚨🚨 LA STRATEGIE, ARRETEE LE 16/08 AU SOIR — NE PAS LA REOUVRIR.
//
// ACADEMIA PRO DEVIENT LE CATALOGUE, elle ne vend pas un outil de
// fabrication. Ses mots : « les formations que nous generons deviennent
// automatiquement notre propriete, sinon comment aurions-nous construit
// 310 formations qui font partie de notre catalogue ». Aujourd hui 331,
// demain 500, apres-demain 1 000.
//
// LE MODELE EST CELUI DE LA SOUS-TRAITANCE DE CONTENU : l organisme vend
// l action, porte sa certification et sa responsabilite, et SOUS-TRAITE LE
// CONTENU. Un organisme qui veut produire ses propres formations DEVIENT UN
// CONCURRENT, pas un client.
//
// 🚨🚨 ET IL N Y A AUCUNE FACTURATION A L ACTE — supprimee le 16/08 au soir.
// Ses mots : « en tant que partenaire, je propose toute l infrastructure et
// la gestion, et il me donne un pourcentage ». Les 90 EUR par formation
// redigee ont existe quelques heures et NE DOIVENT PAS REVENIR.
//
// LES DEUX FORMULES, ET TOUT EST COMPRIS DEDANS — la plateforme, le
// catalogue, l administratif ET LA PRODUCTION DES FORMATIONS :
//
//   A. LE CLIENT ASSURE LA GESTION : 390 EUR HT/mois + 35 % du prix de
//      vente HT + minimum 30 EUR par stagiaire inscrit.
//   B. L EDITEUR ASSURE LA GESTION : 180 EUR HT par stagiaire + 10 % du
//      prix de vente HT.
//
// Le taux passe de 10 a 35 % quand le Client reprend la gestion a sa charge :
// le pourcentage faible est la contrepartie des 180 EUR. RIEN D AUTRE N EST
// FACTURE, et le document doit le dire noir sur blanc — c est la demande
// expresse de Jacques : « preciser que tout est compris dedans ».
const OFFRES: any = {
  pack: {
    nom: "PACK COMPLET",
    parUtilisateur: false,
    catalogue: true,
    defaut: 390,
  },
  lms: {
    nom: "PLATEFORME D APPRENTISSAGE SEULE",
    parUtilisateur: false,
    catalogue: false,
    defaut: 290,
  },
  crm: {
    nom: "SUIVI COMMERCIAL SEUL",
    parUtilisateur: true,
    catalogue: false,
    defaut: 35,
  },
};

const TAUX_DEFAUT = 35;
const TAUX_AVEC_GESTION = 10;

function ascii(t: any): string {
  return String(t === null || t === undefined ? "" : t)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u20AC/g, "EUR")
    .replace(/[^\x20-\x7E]/g, " ");
}

function jour(d?: any): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR");
}

function euros(n: any): string {
  return (Number(n) || 0).toLocaleString("fr-FR") + " EUR HT";
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const b = await req.json().catch(function () { return null; });
    if (!b || !b.tenant_id) {
      return NextResponse.json({ ok: false, erreur: "Client non precise." }, { status: 400 });
    }

    const { data: org } = await supabase
      .from("organismes_formation")
      .select("*")
      .eq("tenant_id", b.tenant_id)
      .maybeSingle();

    if (!org) {
      return NextResponse.json({ ok: false, erreur: "Client introuvable." }, { status: 404 });
    }

    const cleOffre = String(b.offre || org.offre || "pack").trim().toLowerCase();
    const offre = OFFRES[cleOffre];
    if (!offre) {
      return NextResponse.json({ ok: false, erreur: "Offre inconnue." }, { status: 400 });
    }

    const postes = Math.max(1, Number(org.nb_utilisateurs) || 1);

    const manques: string[] = [];
    if (!org.abonnement_mensuel) manques.push("l abonnement mensuel");
    if (!org.email_contact) manques.push("l email de contact");

    if (manques.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Completez la fiche client avant d editer le bon : " + manques.join(", ") + ".",
        },
        { status: 400 }
      );
    }

    let frais = org.frais_installation !== null && org.frais_installation !== undefined
      ? Number(org.frais_installation)
      : 0;

    if (b.frais_installation !== undefined && b.frais_installation !== null && b.frais_installation !== "") {
      const saisi = Number(String(b.frais_installation).replace(",", "."));
      if (isNaN(saisi) || saisi < 0 || saisi > 100000) {
        return NextResponse.json({ ok: false, erreur: "Frais de mise en service invalides." }, { status: 400 });
      }
      frais = saisi;
      await supabase
        .from("organismes_formation")
        .update({ frais_installation: frais, updated_at: new Date().toISOString() })
        .eq("tenant_id", b.tenant_id);
    }

    const unitaire = Number(org.abonnement_mensuel) || 0;
    const plein = offre.parUtilisateur ? unitaire * postes : unitaire;

    const gestionSouscrite = offre.catalogue && org.gestion_souscrite === true;

    const taux = org.taux_prelevement !== null && org.taux_prelevement !== undefined
      ? Number(org.taux_prelevement)
      : (gestionSouscrite ? TAUX_AVEC_GESTION : TAUX_DEFAUT);
    const plancher = org.plancher_stagiaire !== null && org.plancher_stagiaire !== undefined
      ? Number(org.plancher_stagiaire)
      : 30;
    const apport = org.taux_apport !== null && org.taux_apport !== undefined
      ? Number(org.taux_apport)
      : 50;

    const gestion = gestionSouscrite && org.forfait_gestion !== null && org.forfait_gestion !== undefined
      ? Number(org.forfait_gestion)
      : 0;

    const { data: catalogue } = offre.catalogue
      ? await supabase
          .from("organisme_catalogue")
          .select("formation_code, prix_contractuel, prix_vente_public")
          .eq("tenant_id", b.tenant_id)
          .eq("actif", true)
          .order("formation_code", { ascending: true })
          .limit(500)
      : { data: [] };

    const codes = (catalogue || []).map(function (c: any) { return c.formation_code; });

    const { data: fiches } = codes.length > 0
      ? await supabase.from("formations").select("code, titre").in("code", codes).limit(500)
      : { data: [] };

    const titreDe: any = {};
    for (const f of fiches || []) titreDe[f.code] = f.titre;

    const reference = "BC-" + Date.now().toString().slice(-8);

    const pdf = await PDFDocument.create();
    const normal = await pdf.embedFont(StandardFonts.Helvetica);
    const gras = await pdf.embedFont(StandardFonts.HelveticaBold);
    const vert = rgb(0.04, 0.24, 0.18);
    const noir = rgb(0.12, 0.12, 0.12);
    const gris = rgb(0.45, 0.45, 0.45);

    let page = pdf.addPage([595, 842]);
    let y = 795;

    function saut(besoin: number) {
      if (y - besoin < 70) {
        page = pdf.addPage([595, 842]);
        y = 795;
      }
    }

    function ligne(texte: string, taille: number, police: any, couleur: any, decalage: number) {
      const mots = ascii(texte).split(" ");
      let courante = "";
      const largeurMax = 495 - decalage;
      for (const mot of mots) {
        const essai = courante ? courante + " " + mot : mot;
        if (police.widthOfTextAtSize(essai, taille) > largeurMax) {
          saut(taille + 5);
          page.drawText(courante, { x: 50 + decalage, y: y, size: taille, font: police, color: couleur });
          y = y - taille - 5;
          courante = mot;
        } else {
          courante = essai;
        }
      }
      if (courante) {
        saut(taille + 5);
        page.drawText(courante, { x: 50 + decalage, y: y, size: taille, font: police, color: couleur });
        y = y - taille - 5;
      }
    }

    function paire(gauche: string, droite: string) {
      saut(18);
      page.drawText(ascii(gauche), { x: 55, y: y, size: 10, font: normal, color: gris });
      page.drawText(ascii(droite), { x: 265, y: y, size: 10, font: gras, color: noir });
      y = y - 16;
    }

    function titreBloc(t: string) {
      y = y - 12;
      saut(30);
      page.drawRectangle({ x: 50, y: y - 4, width: 495, height: 20, color: rgb(0.93, 0.93, 0.9) });
      page.drawText(ascii(t), { x: 55, y: y + 2, size: 11, font: gras, color: vert });
      y = y - 28;
    }

    ligne("BON DE COMMANDE", 18, gras, vert, 0);
    ligne("Reference " + reference + " - etabli le " + jour(new Date()), 9, normal, gris, 0);
    ligne(offre.nom, 11, gras, noir, 0);
    y = y - 10;

    titreBloc("L EDITEUR");
    paire("Denomination", "AcadeMIA Pro LLC");
    paire("Siege", "30 N Gould St STE R, Sheridan WY 82801, Etats-Unis");
    paire("Contact", "contact@academiapro.fr");

    titreBloc("LE CLIENT");
    paire("Raison sociale", org.raison_sociale || "-");
    paire("SIRET", org.siret || "A COMPLETER");
    paire("N de declaration d activite", org.numero_da || "A COMPLETER");
    paire("Adresse", org.adresse || "A COMPLETER");
    paire("Email", org.email_contact || "-");
    paire("Telephone", org.telephone || "-");
    paire("N de TVA intracommunautaire", org.numero_tva || "A COMPLETER");

    // LES DEUX FORMULES, ENONCEES COTE A COTE.
    //
    // Le Client doit voir CE QU IL A CHOISI ET CE QU IL AURAIT PU CHOISIR :
    // c est ce qui rend le taux comprehensible. Un 35 % isole parait eleve ;
    // mis en regard des 10 % contre 180 EUR par stagiaire, il s explique.
    if (offre.catalogue) {
      titreBloc("FORMULE RETENUE");
      paire("Suivi administratif des stagiaires", gestionSouscrite ? "assure par l Editeur" : "assure par le Client");
      y = y - 4;
      ligne(
        gestionSouscrite
          ? "FORMULE B - L EDITEUR ASSURE LA GESTION ADMINISTRATIVE. Le Client verse " +
            "180 EUR HT par stagiaire inscrit et 10 % de son prix de vente hors taxes. Le taux " +
            "reduit est la contrepartie de cette prise en charge."
          : "FORMULE A - LE CLIENT ASSURE LUI-MEME LA GESTION ADMINISTRATIVE. Il verse " +
            "l abonnement mensuel ci-dessous et 35 % de son prix de vente hors taxes, avec un " +
            "minimum par stagiaire inscrit.",
        10, normal, noir, 5
      );
      y = y - 4;
      ligne(
        gestionSouscrite
          ? "S il reprenait la gestion a sa charge, le taux passerait de 10 a 35 % et le forfait " +
            "par stagiaire serait remplace par le minimum par stagiaire. Le changement se fait " +
            "par avenant."
          : "S il confiait la gestion a l Editeur, le taux passerait de 35 a 10 % et un forfait de " +
            "180 EUR HT par stagiaire remplacerait le minimum par stagiaire. Le changement se " +
            "fait par avenant.",
        9, normal, gris, 5
      );
    }

    if (frais > 0) {
      titreBloc("MISE EN SERVICE");
      paire("Frais uniques a la signature", euros(frais));
      y = y - 4;
      ligne(
        "Couvrent l ouverture du compte, la configuration du catalogue et des prix, la mise aux " +
        "couleurs du Client, la reprise de ses donnees et l accompagnement au demarrage. Factures " +
        "une seule fois, a la signature.",
        9, normal, gris, 5
      );
    }

    titreBloc("ABONNEMENT");

    if (cleOffre === "pack") {
      ligne(
        "Trois briques comprises dans un seul abonnement, sans option a ajouter : " +
        "(1) LE CATALOGUE DE L EDITEUR - plus de trois cents formations a distance pretes a " +
        "vendre sous le nom du Client, ouvertes selon l annexe ci-apres, avec leurs modules, " +
        "leurs exercices corriges, leurs questionnaires et leur manuel ; " +
        "(2) LA PLATEFORME D APPRENTISSAGE - diffusion des formations, questionnaires corriges " +
        "erreur par erreur, classes virtuelles, suivi de chaque stagiaire et attestations de fin " +
        "de formation a l en-tete du Client ; " +
        "(3) LE SUIVI COMMERCIAL - prospects, etapes, relances redigees, motifs de perte, page " +
        "publique de l organisme, sans limite d utilisateurs.",
        10, normal, noir, 5
      );
      y = y - 4;
      ligne(
        "S y ajoutent les documents administratifs a l en-tete du Client, la signature " +
        "electronique et son archivage, les evaluations, le registre des reclamations, les " +
        "dossiers de ses formateurs, ses registres de veille, le suivi de sa sous-traitance et " +
        "son bilan pedagogique et financier prepare cadre par cadre. STAGIAIRES ILLIMITES ET " +
        "UTILISATEURS ILLIMITES.",
        10, normal, noir, 5
      );
    } else if (cleOffre === "lms") {
      ligne(
        "LA PLATEFORME D APPRENTISSAGE, sans le catalogue de l Editeur : diffusion des formations " +
        "du Client, questionnaires corriges erreur par erreur, classes virtuelles, suivi de chaque " +
        "stagiaire et attestations de fin de formation a son en-tete.",
        10, normal, noir, 5
      );
      y = y - 4;
      ligne(
        "S y ajoutent les documents administratifs, la signature electronique et son archivage, " +
        "les evaluations, le registre des reclamations, les dossiers de ses formateurs, le suivi " +
        "de sa sous-traitance, ses registres de veille et son bilan pedagogique et financier " +
        "prepare cadre par cadre. STAGIAIRES ILLIMITES ET UTILISATEURS ILLIMITES.",
        10, normal, noir, 5
      );
      y = y - 4;
      ligne(
        "Le catalogue de l Editeur n est pas compris dans cette formule. Il peut etre ouvert au " +
        "Client a tout moment par avenant, aux conditions du pack complet.",
        9, gras, noir, 5
      );
    } else {
      ligne(
        "LE SUIVI COMMERCIAL, facture par utilisateur : prospects et etapes du parcours, score de " +
        "chaque fiche, analyse et relance redigees, motifs de perte regroupes par frequence, " +
        "import de listes, page publique et relances en nombre.",
        10, normal, noir, 5
      );
      y = y - 4;
      ligne(
        "EST APPELE UTILISATEUR TOUT COMPTE OUVERT SUR LA PLATEFORME AU NOM DU CLIENT. Le nombre " +
        "enregistre par la plateforme fait foi ; le Client n a aucune declaration a fournir. " +
        "L ouverture ou la fermeture d un compte prend effet sur la facture du mois suivant.",
        9, normal, noir, 5
      );
    }
    y = y - 6;

    if (offre.parUtilisateur) {
      paire("Prix par utilisateur", euros(unitaire) + " par mois");
      paire("Nombre d utilisateurs", String(postes));
      paire("Total mensuel", euros(plein) + " par mois");
    } else {
      paire("Abonnement mensuel", euros(plein) + " par mois");
    }

    // LA PRODUCTION SUR MESURE — COMPRISE, JAMAIS FACTUREE A PART.
    //
    // 🚨 CE BLOC A PORTE « tarif communique sur demande » PENDANT QUELQUES
    // HEURES LE 16/08. C ETAIT FAUX et Jacques l a corrige le soir meme : la
    // production est comprise dans les deux formules, l Editeur se remunerant
    // sur les ventes. NE PAS Y REMETTRE DE PRIX.
    if (offre.catalogue) {
      titreBloc("PRODUCTION DES FORMATIONS - COMPRISE");
      ligne(
        "Le Client peut demander a l Editeur de produire une formation qui ne figure pas encore " +
        "au catalogue. Il indique le sujet, la duree souhaitee, le public vise et ce que le " +
        "stagiaire doit savoir faire ; l Editeur construit le plan, redige les modules, les " +
        "exercices corriges, les questionnaires et le manuel. Delai indicatif : une semaine.",
        10, normal, noir, 5
      );
      y = y - 4;
      ligne(
        "CETTE PRODUCTION EST COMPRISE DANS LA FORMULE RETENUE ET N EST JAMAIS FACTUREE A PART. " +
        "L abonnement, la part sur les ventes et, le cas echeant, le forfait de gestion couvrent " +
        "l integralite de la prestation : la plateforme, le catalogue, l administratif et la " +
        "production des formations. Aucun autre montant n est du a l Editeur.",
        10, gras, noir, 5
      );
      y = y - 4;
      ligne(
        "La formation ainsi produite rejoint le catalogue de l Editeur et suit les memes " +
        "conditions que les autres : le Client la vend sous son nom, au prix qu il fixe.",
        9, normal, gris, 5
      );
    }

    // 🚨 CE QUI N EST PAS COMPRIS DANS L ILLIMITE.
    //
    // Le SMS et la voix sont les DEUX SEULS postes ou chaque usage coute
    // reellement de l argent a l Editeur : Brevo facture chaque message,
    // Plivo chaque minute.
    titreBloc("OPTIONS FACTUREES A L USAGE");
    ligne(
      "CES DEUX OPTIONS SONT LES SEULES QUI NE SOIENT PAS COMPRISES DANS L ABONNEMENT. Elles ne " +
      "sont dues que si le Client les active, et facturees a ce qu il consomme reellement. " +
      "L illimite porte sur les stagiaires et les utilisateurs, jamais sur les envois ni sur les " +
      "communications.",
      10, gras, noir, 5
    );
    y = y - 6;
    paire("Envoi de SMS", "0,12 EUR HT le message");
    y = y - 2;
    ligne(
      "Degressif jusqu a 0,08 EUR HT selon le volume mensuel. Aucun abonnement : les credits " +
      "sont prepayes et sans expiration. Les messages partent sous le nom de l organisme du " +
      "Client. La prospection par SMS suppose le consentement prealable du destinataire, y " +
      "compris entre professionnels ; le Client en demeure seul responsable.",
      9, normal, noir, 5
    );
    y = y - 4;
    paire("Appels depuis la plateforme", "a l ouverture du service");
    y = y - 2;
    ligne(
      "La location du numero est refacturee au Client a son cout, sans marge. Seules les minutes " +
      "reellement consommees portent la marge de l Editeur, decomptees a la seconde. Le tarif a " +
      "la minute est communique au Client a l ouverture du service et porte a l avenant. Aucun " +
      "montant n est du les mois ou le Client n appelle pas.",
      9, normal, noir, 5
    );

    if (offre.catalogue) {
      titreBloc("PART SUR LES FORMATIONS DU CATALOGUE DE L EDITEUR");
      paire("Taux", taux + " % du prix de vente hors taxes");
      if (!gestionSouscrite) {
        paire("Minimum par stagiaire inscrit", euros(plancher));
        y = y - 4;
        ligne(
          "Le minimum par stagiaire est du pour chaque inscription sur une formation du catalogue de " +
          "l Editeur, QUE LA FORMATION AIT ETE VENDUE OU NON. Lorsque la part calculee au taux " +
          "ci-dessus lui est superieure, seule cette part est due.",
          9, normal, noir, 5
        );
      } else {
        y = y - 4;
        ligne(
          "Ce taux reduit est la contrepartie de la gestion administrative souscrite ci-dessous. Il " +
          "cesserait de s appliquer si le Client renoncait a cette prestation, le taux de 35 % etant " +
          "alors retabli par avenant.",
          9, normal, noir, 5
        );
      }
      y = y - 4;
      ligne(
        "LE CLIENT FIXE LIBREMENT SON PRIX DE VENTE. Le nombre d inscriptions enregistre par la " +
        "plateforme fait foi ; il n a aucune declaration de chiffre d affaires a fournir. Aucune " +
        "part n est due sur les prestations que le Client realise hors de la plateforme.",
        9, normal, gris, 5
      );

      titreBloc("PROPRIETE DES CONTENUS");
      ligne(
        "Les formations du catalogue, y compris celles produites a la demande du Client, sont et " +
        "demeurent la propriete de l Editeur. Le Client dispose du droit de les diffuser a ses " +
        "stagiaires et de les vendre sous son nom pendant toute la duree du present accord, aux " +
        "conditions de part ci-dessus.",
        9, normal, noir, 5
      );
      y = y - 4;
      ligne(
        "Ce droit d usage n est pas exclusif : l Editeur conserve la faculte de proposer les memes " +
        "formations a d autres organismes. Une exclusivite sur un contenu determine peut etre " +
        "convenue separement, par avenant et contre remuneration.",
        9, normal, noir, 5
      );
      y = y - 4;
      ligne(
        "Les marques, le logo et les elements propres au Client lui restent acquis : ils ne sont " +
        "utilises par l Editeur que pour habiller les documents et la plateforme a ses couleurs.",
        9, normal, gris, 5
      );
    }

    if (gestion > 0) {
      titreBloc("GESTION ADMINISTRATIVE");
      paire("Forfait par stagiaire inscrit", euros(gestion));
      y = y - 4;
      ligne(
        "Couvre, pour l ensemble des stagiaires du Client : conventions et contrats, convocations, " +
        "feuilles d emargement, evaluations, attestations de fin de formation, pieces " +
        "justificatives attendues lors d un audit et preparation du bilan pedagogique et financier.",
        9, normal, noir, 5
      );
      y = y - 4;
      ligne(
        "Ce forfait est tout compris : il remplace le minimum par stagiaire et ne s y ajoute pas. " +
        "Le Client demeure seul responsable de l exactitude des informations transmises, de la " +
        "verification des documents produits et du depot de ses declarations.",
        9, normal, gris, 5
      );
    }

    if (offre.catalogue) {
      titreBloc("AFFAIRES ORIENTEES PAR L EDITEUR");
      paire("Partage du produit HT", apport + " % pour l Editeur");
      y = y - 4;
      ligne(
        "S applique aux demandes que l Editeur oriente vers le Client, notamment lorsqu un " +
        "financement par un operateur de competences est sollicite et que seul le Client detient " +
        "la certification exigee. Ce partage est distinct de la part ci-dessus.",
        9, normal, noir, 5
      );
      y = y - 4;
      ligne(
        "Les formations du catalogue ne sont enregistrees ni au RNCP ni au repertoire specifique : " +
        "elles ne sont eligibles a aucun financement au titre du compte personnel de formation.",
        9, normal, gris, 5
      );
    }

    if (cleOffre !== "crm") {
      titreBloc("REPARTITION DES ROLES");
      ligne(
        "Le Client demeure seul prestataire de formation : sa certification, son numero de " +
        "declaration, ses attestations, sa responsabilite. L Editeur fournit " +
        (offre.catalogue ? "le contenu, la plateforme, " : "la plateforme, ") +
        "la correction des evaluations et les documents.",
        9, normal, noir, 5
      );
      y = y - 4;
      ligne(
        "Toute intervention en presence, l evaluation pratique, le recrutement des formateurs, leur " +
        "remuneration et la verification de leurs habilitations relevent exclusivement du Client. " +
        "Pour les actions reglementees, l Editeur fournit " +
        (offre.catalogue ? "les supports theoriques et l acces a distance" : "l acces a distance") +
        " ; il ne delivre aucune habilitation ni certification.",
        9, normal, noir, 5
      );
    } else {
      titreBloc("DONNEES ET RESPONSABILITE");
      ligne(
        "Les prospects et contacts enregistres par le Client lui appartiennent en propre. " +
        "L Editeur n y accede que pour assurer le service et n en fait aucun autre usage. Le " +
        "Client demeure responsable de la licite de sa prospection, notamment du consentement " +
        "prealable exige pour l envoi de messages courts.",
        9, normal, noir, 5
      );
    }

    if ((catalogue || []).length > 0) {
      titreBloc("ANNEXE - FORMATIONS OUVERTES");

      saut(20);
      page.drawText(ascii("Code"), { x: 55, y: y, size: 9, font: gras, color: vert });
      page.drawText(ascii("Formation"), { x: 110, y: y, size: 9, font: gras, color: vert });
      page.drawText(ascii("Prix de vente"), { x: 450, y: y, size: 9, font: gras, color: vert });
      y = y - 14;

      for (const c of catalogue || []) {
        saut(14);
        const prix = Number(c.prix_vente_public) || Number(c.prix_contractuel) || 0;
        const titre = ascii(titreDe[c.formation_code] || c.formation_code).slice(0, 52);
        page.drawText(ascii(c.formation_code), { x: 55, y: y, size: 8.5, font: normal, color: noir });
        page.drawText(titre, { x: 110, y: y, size: 8.5, font: normal, color: noir });
        const texte = prix > 0 ? prix.toLocaleString("fr-FR") + " EUR" : "a fixer";
        const largeur = normal.widthOfTextAtSize(texte, 8.5);
        page.drawText(texte, { x: 545 - largeur, y: y, size: 8.5, font: normal, color: prix > 0 ? noir : rgb(0.7, 0.3, 0.2) });
        y = y - 12;
      }

      y = y - 6;
      ligne(
        "Le Client fixe librement le prix auquel il vend a ses stagiaires. La part due a l Editeur " +
        "se calcule sur ce prix.",
        9, normal, gris, 5
      );
    }

    titreBloc("TAXE, FACTURATION ET REGLEMENT");
    ligne(
      "La prestation est fournie par un etablissement etabli hors de l Union europeenne a un " +
      "assujetti etabli en France : la taxe est autoliquidee par le Client, qui communique son " +
      "numero de taxe intracommunautaire et procede lui-meme a la declaration.",
      9, normal, noir, 5
    );
    y = y - 4;
    paire("Facturation", "mensuelle, a terme echu");
    paire("Reglement", "par virement, a trente jours");

    titreBloc("ACCEPTATION");
    ligne(
      "Le Client declare avoir pris connaissance des conditions generales de vente accessibles a " +
      "academiapro.fr/pack/cgv et les accepter sans reserve. Les presentes mentions prevalent sur " +
      "toute indication tarifaire publiee par ailleurs.",
      10, normal, noir, 5
    );

    y = y - 26;
    saut(80);
    ligne("Fait le " + jour(new Date()) + ".", 10, normal, noir, 5);
    y = y - 28;

    saut(60);
    page.drawText(ascii("Pour l Editeur"), { x: 55, y: y, size: 9.5, font: gras, color: noir });
    page.drawText(ascii("Pour le Client - cachet et signature"), { x: 330, y: y, size: 9.5, font: gras, color: noir });
    y = y - 44;
    page.drawLine({ start: { x: 55, y: y }, end: { x: 255, y: y }, thickness: 0.7, color: gris });
    page.drawLine({ start: { x: 330, y: y }, end: { x: 540, y: y }, thickness: 0.7, color: gris });

    const pages = pdf.getPages();
    for (let i = 0; i < pages.length; i = i + 1) {
      pages[i].drawText(
        ascii("AcadeMIA Pro LLC - " + reference + " - page " + (i + 1) + "/" + pages.length),
        { x: 50, y: 34, size: 7.5, font: normal, color: gris }
      );
    }

    const octets = Buffer.from(await pdf.save());

    const empreinte = crypto.createHash("sha256").update(octets).digest("hex");
    const chemin = String(b.tenant_id) + "/" + reference + ".pdf";

    const { error: erreurDepot } = await supabase.storage
      .from(BUCKET)
      .upload(chemin, octets, { contentType: "application/pdf", upsert: true });

    if (erreurDepot) {
      return NextResponse.json(
        { ok: false, erreur: "Archivage impossible : " + erreurDepot.message },
        { status: 500 }
      );
    }

    await supabase.from("organisme_documents").insert({
      tenant_id: b.tenant_id,
      type: "bon_commande",
      stagiaire_email: org.email_contact,
      formation_code: null,
      reference: reference,
      pdf_chemin: chemin,
      pdf_sha256: empreinte,
      pdf_octets: octets.length,
      donnees: {
        titre: "Bon de commande",
        offre: cleOffre,
        contrepartie: org.raison_sociale || null,
        frais: frais,
        unitaire: unitaire,
        utilisateurs: offre.parUtilisateur ? postes : null,
        plein: plein,
        taux: offre.catalogue ? taux : null,
        plancher: offre.catalogue ? plancher : null,
        gestion: gestion,
        gestion_souscrite: gestionSouscrite,
        apport: offre.catalogue ? apport : null,
        formations: (catalogue || []).length,
      },
    });

    await supabase.from("coffre_documents").insert({
      tenant_id: b.tenant_id,
      categorie: "bon_commande",
      titre: "Bon de commande " + offre.nom + " - " + (org.raison_sociale || reference),
      contrepartie: org.raison_sociale || org.email_contact,
      reference: reference,
      chemin: chemin,
      empreinte_sha256: empreinte,
      octets: octets.length,
      signe: false,
      depose_par: session.email,
      notes: "Edite depuis la fiche du client - offre " + cleOffre,
    });

    return new NextResponse(new Uint8Array(octets), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="bon-commande-' + reference + '.pdf"',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
