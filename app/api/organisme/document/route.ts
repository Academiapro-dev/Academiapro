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

const TYPES: any = {
  convention: "Convention de formation professionnelle",
  devis: "Devis",
  convocation: "Convocation",
  programme: "Programme de formation",
  attestation: "Attestation de fin de formation",
  emargement: "Attestation d assiduite",
  livret: "Livret d accueil du stagiaire",
};

// MENTION PORTEE SUR LE DOCUMENT LUI-MEME. Elle dit ce que la signature vaut
// ET ce qu elle ne vaut pas : une signature electronique simple est recevable,
// mais c est a celui qui s en prevaut d en demontrer la fiabilite, la
// presomption n etant acquise qu a la signature qualifiee.
const MENTION_SIGNATURE = [
  "Ce document peut etre signe electroniquement depuis la plateforme. La signature repose sur",
  "l identification du signataire par son adresse electronique, la saisie d un code a usage unique",
  "adresse a cette adresse, et l horodatage de son acceptation. Sont conservees l empreinte",
  "numerique du document signe, la date et l heure, l adresse de connexion et le texte accepte.",
  "Il s agit d une signature electronique SIMPLE au sens du reglement europeen n 910/2014 dit",
  "eIDAS. Elle est recevable comme preuve entre les parties. Elle n est ni avancee ni qualifiee,",
  "et ne beneficie donc pas de la presomption de fiabilite attachee aux signatures delivrees par",
  "un prestataire de services de confiance qualifie.",
];

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
  return new Date(d || Date.now()).toLocaleDateString("fr-FR");
}

function euros(n: any): string {
  return (Number(n) || 0).toLocaleString("fr-FR") + " EUR";
}

// TROIS SITUATIONS JURIDIQUES DIFFERENTES, ET UN SEUL GENERATEUR.
//
// 1. L organisme client est DECLARE et le payeur est une entreprise ou un
//    financeur : c est une CONVENTION de formation.
// 2. Le meme organisme, mais le stagiaire paie DE SA POCHE : le droit impose
//    un CONTRAT de formation professionnelle (art. L. 6353-3).
// 3. L organisme n est PAS declare — vente directe par l editeur : ni
//    convention de formation professionnelle, ni numero d activite.
function natureDuContrat(o: any, a: any): string {
  const declare = !!(o && o.numero_da);
  const payeur = String((a && a.payeur) || "").toLowerCase();
  const particulier = payeur === "particulier" || payeur === "cpf" || payeur === "";

  if (!declare) return "prestation";
  return particulier ? "contrat" : "convention";
}

function titreDuDocument(type: string, nature: string): string {
  if (type !== "convention") return TYPES[type];
  if (nature === "contrat") return "Contrat de formation professionnelle";
  if (nature === "prestation") return "Contrat de prestation de formation";
  return "Convention de formation professionnelle";
}

async function ficheFormation(code: string, tenant: string) {
  if (!code) return null;

  const { data: f } = await supabase
    .from("formations")
    .select("code, titre, duree, objectifs, prerequis, public_cible, domaine")
    .eq("code", code)
    .maybeSingle();

  if (f) return f;

  const { data: c } = await supabase
    .from("organisme_cours")
    .select("code, titre, duree, objectifs, prerequis, public_cible, domaine")
    .eq("code", code)
    .eq("tenant_id", tenant)
    .maybeSingle();

  return c || null;
}

function identite(o: any): string {
  const bouts: string[] = [];
  if (o && o.raison_sociale) bouts.push(o.raison_sociale);
  if (o && o.adresse) bouts.push("dont le siege est situe " + o.adresse);
  if (o && o.siret) bouts.push("immatriculee sous le SIRET " + o.siret);
  if (o && o.numero_da) bouts.push("declaree sous le numero d activite " + o.numero_da);
  if (o && o.numero_tva) bouts.push("numero de TVA " + o.numero_tva);
  if (o && o.representant_nom) {
    bouts.push(
      "representee par " + o.representant_nom +
      (o.representant_qualite ? ", " + o.representant_qualite : "")
    );
  }
  return bouts.join(", ");
}

function corps(type: string, o: any, a: any, f: any, prix: number, modules: any[], nature: string) {
  const nom = a && a.nom ? a.nom : a && a.email ? a.email : "le stagiaire";
  const of = (o && o.raison_sociale) || "l organisme";
  const titre = (f && f.titre) || a.formation_code || "la formation";
  const duree = Number(String((f && f.duree) || "").replace(",", ".").match(/[\d.]+/)?.[0] || 0) || 0;
  const debut = a && a.date_debut ? jour(a.date_debut) : null;
  const fin = a && a.date_fin ? jour(a.date_fin) : null;

  if (type === "convention") {
    const sections: any[] = [];

    sections.push(["Entre les parties", [
      identite(o) + ", ci-apres " + (nature === "prestation" ? "le prestataire" : "l organisme de formation") + ",",
      "et " + nom + " (" + a.email + "), ci-apres le beneficiaire.",
    ]]);

    sections.push(["Article 1 - Objet", [
      (nature === "prestation" ? "Le prestataire" : "L organisme de formation") +
      " organise l action de formation intitulee : " + titre + ".",
      nature === "prestation"
        ? "Le prestataire n est pas enregistre comme organisme de formation aupres d une autorite francaise. La presente prestation ne peut faire l objet d une prise en charge au titre de la formation professionnelle continue."
        : "Cette action entre dans le champ de la formation professionnelle au sens de l article L. 6313-1 du Code du travail.",
    ]]);

    sections.push(["Article 2 - Nature, duree et effectif", [
      "Action de formation realisee a distance, en autoformation accompagnee.",
      "Duree : " + duree + " heures.",
      debut && fin
        ? "Periode de realisation : du " + debut + " au " + fin + "."
        : "Periode de realisation : l acces est ouvert a compter de la confirmation d inscription et pour la duree du parcours.",
      "Effectif : un beneficiaire. La formation est individuelle.",
      "Le beneficiaire dispose d un acces individuel a la plateforme pendant toute la duree du parcours.",
    ]]);

    sections.push(["Article 3 - Moyens pedagogiques et d encadrement", [
      "Le parcours est compose de modules comportant un cours, des exercices corriges, un questionnaire d evaluation et une note de synthese.",
      "Chaque module est corrige individuellement : le beneficiaire recoit une note et une explication de chacune de ses erreurs. Un module est valide a partir de 14 sur 20.",
      "L encadrement pedagogique est assure par " + of + ", qui met a disposition un assistant repondant aux questions du beneficiaire tout au long du parcours.",
    ]]);

    sections.push(["Article 4 - Prix et modalites de reglement", [
      "Le prix de l action est fixe a " + euros(prix) + " par beneficiaire.",
      nature === "contrat"
        ? "Conformement a l article L. 6353-6 du Code du travail, aucune somme ne peut etre exigee du beneficiaire avant l expiration d un delai de sept jours a compter de la signature du present contrat. A l issue de ce delai, il ne peut etre verse plus de trente pour cent du prix convenu."
        : "Les modalites de reglement sont convenues entre les parties et figurent sur la facture.",
    ]]);

    sections.push(["Article 5 - Suivi et appreciation des resultats", [
      "L assiduite est etablie par les traces de connexion et les validations enregistrees par la plateforme.",
      "Les acquis sont apprecies par les questionnaires et les notes de synthese, corriges individuellement et notes sur vingt.",
      "Une attestation de fin de formation mentionnant les objectifs, la duree et les resultats de l evaluation est remise au beneficiaire a l issue du parcours, conformement a l article L. 6353-1 du Code du travail.",
    ]]);

    if (nature === "contrat") {
      sections.push(["Article 6 - Delai de retractation", [
        "Conformement a l article L. 6353-5 du Code du travail, le beneficiaire dispose d un delai de DIX JOURS a compter de la signature du present contrat pour se retracter, par lettre recommandee avec avis de reception.",
        "Dans ce cas, aucune somme ne peut lui etre reclamee.",
      ]]);
    }

    sections.push(["Article " + (nature === "contrat" ? "7" : "6") + " - Cessation anticipee et dedit", [
      "En cas d abandon en cours de parcours, " + of + " etablit une attestation mentionnant les modules effectivement suivis et les heures realisees.",
      nature === "contrat"
        ? "Si le beneficiaire est empeche de suivre la formation par un cas de force majeure dument reconnu, le contrat est resilie et seules les prestations effectivement dispensees sont dues, a due proportion de leur valeur."
        : "En cas de resiliation du fait du beneficiaire moins de quinze jours avant le debut de l action, ou d abandon en cours de parcours, l organisme retient a titre de dedit trente pour cent du prix convenu, le solde restant du au prorata des heures effectivement realisees.",
    ]]);

    sections.push(["Article " + (nature === "contrat" ? "8" : "7") + " - Differends", [
      "Les parties recherchent une solution amiable. A defaut, le differend releve des juridictions competentes.",
    ]]);

    return sections;
  }

  if (type === "devis") {
    return [
      ["Beneficiaire", [nom + " (" + a.email + ")"]],
      ["Prestation", [titre, "Formation professionnelle a distance, " + duree + " heures."]],
      ["Prix", [
        euros(prix) + " par beneficiaire.",
        "Ce devis est valable trente jours a compter de sa date d emission.",
      ]],
      ["Compris dans le prix", [
        "L acces individuel a la plateforme pendant toute la duree du parcours.",
        "Les supports pedagogiques, les exercices corriges et les questionnaires.",
        "La correction individuelle et expliquee de chaque module.",
        "L assistance pedagogique par messagerie.",
        "L attestation de fin de formation.",
      ]],
      ["Pour accepter", ["Retournez ce devis date et signe, avec la mention Bon pour accord."]],
    ];
  }

  if (type === "convocation") {
    return [
      ["Madame, Monsieur", ["Nous avons le plaisir de vous confirmer votre inscription a la formation suivante."]],
      ["Votre formation", [
        titre,
        "Duree : " + duree + " heures.",
        debut ? "Debut : " + debut + "." : "",
        "Modalite : a distance, en autoformation accompagnee. Vous avancez a votre rythme.",
      ]],
      ["Comment y acceder", [
        "Vous recevez par courrier electronique un lien personnel qui vous connecte directement a votre espace, sans mot de passe a retenir.",
        "Il vous suffit d un navigateur et d une connexion internet. Aucun logiciel a installer.",
      ]],
      ["Ce qui vous attend", [
        "Chaque module comporte un cours, des exercices corriges, un questionnaire et une note de synthese que vous redigez avec vos mots.",
        "Votre correcteur vous attribue une note et vous explique chacune de vos erreurs. Vous pouvez recommencer autant de fois que necessaire.",
      ]],
      ["Une question", [
        "Un assistant pedagogique est disponible depuis votre espace. Vous pouvez egalement joindre " + of + " par courrier electronique.",
      ]],
    ];
  }

  if (type === "programme") {
    return [
      ["Intitule", [titre]],
      ["Prerequis", [
        (f && f.prerequis) ||
        "Aucun prerequis academique. Une pratique courante de l outil informatique et une connexion internet sont necessaires.",
      ]],
      ["Objectifs pedagogiques", [
        (f && f.objectifs) ||
        "A l issue de la formation, le beneficiaire maitrise les notions, les methodes et les protocoles exposes dans le parcours, et sait les appliquer a des situations professionnelles.",
      ]],
      ["Public concerne", [
        (f && f.public_cible) ||
        "Toute personne souhaitant acquerir ou approfondir les competences visees, dans un cadre professionnel ou de reconversion.",
      ]],
      ["Duree et rythme", [
        duree + " heures. Formation a distance en autoformation accompagnee : le beneficiaire progresse a son rythme.",
      ]],
      ["Modalites et delais d acces", [
        "L acces est ouvert sous quarante-huit heures ouvrees apres l inscription et la reception du reglement ou de l accord de financement.",
      ]],
      ["Methodes mobilisees", [
        "Supports ecrits structures par modules, exercices d application corriges, questionnaires d evaluation, note de synthese personnelle, assistance pedagogique par messagerie.",
      ]],
      ["Modalites d evaluation", [
        "Chaque module se conclut par un questionnaire et une note de synthese, corriges individuellement et notes sur vingt. Un module est valide a partir de 14 sur 20. Les tentatives ne sont pas limitees.",
      ]],
      ["Sanction de la formation", [
        "Attestation de fin de formation mentionnant les objectifs, la duree et les resultats de l evaluation. Cette formation ne conduit pas a une certification enregistree au Repertoire national des certifications professionnelles ni au repertoire specifique.",
      ]],
      ["Tarif", [euros(prix) + " par beneficiaire."]],
      ["Accessibilite aux personnes en situation de handicap", [
        "La formation etant integralement a distance, elle s adapte a la plupart des situations. Pour tout besoin particulier, le beneficiaire est invite a contacter le referent handicap de " + of + " avant son inscription, afin d etudier les amenagements possibles.",
      ]],
      ["Contact", [(o && o.email_contact) || "", (o && o.telephone) || ""]],
    ];
  }

  if (type === "attestation") {
    const valides = modules.length;
    const heures = duree > 0 ? duree : null;
    return [
      ["", [identite(o) + ", atteste que :"]],
      ["", [nom + " (" + a.email + ")"]],
      ["a suivi la formation", [
        titre,
        heures ? "Duree : " + heures + " heures." : "",
        debut && fin ? "Periode : du " + debut + " au " + fin + "." : "",
        "Modalite : formation a distance en autoformation accompagnee.",
      ]],
      ["Objectifs de la formation", [
        (f && f.objectifs) ||
        "Acquerir et savoir appliquer les notions, methodes et protocoles exposes dans le parcours.",
      ]],
      ["Resultats de l evaluation des acquis", [
        valides > 0
          ? valides + " module(s) valide(s) avec une note egale ou superieure a 14 sur 20, apres correction individuelle des questionnaires et des notes de synthese."
          : "Aucun module valide a la date de la presente attestation.",
      ]],
      ["Mention legale", [
        "Attestation delivree en application de l article L. 6353-1 du Code du travail. Cette formation ne conduit pas a une certification enregistree au Repertoire national des certifications professionnelles ni au repertoire specifique.",
      ]],
    ];
  }

  if (type === "emargement") {
    const lignes = modules.length > 0
      ? modules.map(function (m: any) {
          return "Module " + m.module_cle + " - valide le " + jour(m.updated_at) +
            (m.score ? " - score " + m.score + " %" : "");
        })
      : ["Aucun module valide a ce jour."];
    return [
      ["Beneficiaire", [nom + " (" + a.email + ")"]],
      ["Formation", [titre + (duree ? " - " + duree + " heures" : "")]],
      ["Traces d assiduite enregistrees par la plateforme", lignes],
      ["Attestation", [
        of + " atteste que les validations ci-dessus resultent de l activite reelle du beneficiaire sur la plateforme, horodatee et conservee.",
        "Pour une formation a distance, ces traces tiennent lieu de justificatif d assiduite au sens de l article D. 6313-3-1 du Code du travail.",
      ]],
    ];
  }

  if (type === "livret") {
    return [
      ["Bienvenue", [
        "Vous etes inscrit a une formation dispensee par " + of + ". Ce livret rassemble ce qu il faut savoir pour bien commencer.",
      ]],
      ["Votre espace de formation", [
        "Vous accedez a votre espace par un lien personnel recu par courrier electronique. Vous y trouvez vos modules, vos questionnaires et vos corrections.",
        "Votre progression est enregistree : vous pouvez interrompre et reprendre a tout moment, depuis n importe quel appareil.",
      ]],
      ["Comment se deroule un module", [
        "Vous lisez le cours, vous traitez les exercices corriges, vous repondez au questionnaire, puis vous redigez une note de synthese avec vos propres mots.",
        "Votre correcteur vous attribue une note sur vingt, vous explique chaque erreur et vous donne les bonnes reponses. Le module est valide a partir de 14. Vous pouvez recommencer sans limite.",
      ]],
      ["Regles de vie", [
        "Les contenus sont proteges : ils sont reserves a votre usage personnel et ne peuvent etre reproduits ni diffuses.",
        "Vos identifiants sont personnels et ne doivent pas etre partages.",
        "Les echanges avec l assistance restent courtois et portent sur la formation.",
      ]],
      ["Situation de handicap", [
        "La formation etant a distance, elle s adapte a la plupart des situations. Si vous avez besoin d un amenagement, signalez-le des maintenant au referent handicap de " + of + " : les modalites seront etudiees avec vous.",
      ]],
      ["Une difficulte, une reclamation", [
        "Adressez-vous d abord a l assistance depuis votre espace. Si la reponse ne vous satisfait pas, ecrivez a " + ((o && o.email_contact) || "l organisme") + " : votre reclamation est enregistree, traitee et vous recevez une reponse ecrite.",
      ]],
      ["Vos donnees", [
        "Vos donnees servent uniquement au suivi de votre formation et a l etablissement des attestations. Vous pouvez demander a y acceder, a les corriger ou a les faire supprimer a l issue de votre parcours.",
      ]],
    ];
  }

  return [["", ["Type de document inconnu."]]];
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const url = new URL(req.url);
    const admin = ADMINS.indexOf(session.email) >= 0;
    let tenant = session.tenantId;
    if (!tenant && admin) tenant = url.searchParams.get("tenant");

    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const email = url.searchParams.get("email");

    let requete = supabase
      .from("organisme_documents")
      .select("id, type, stagiaire_email, formation_code, reference, emis_le, pdf_sha256")
      .eq("tenant_id", tenant)
      .order("emis_le", { ascending: false });

    if (email) requete = requete.eq("stagiaire_email", email.toLowerCase());

    const { data, error } = await requete.limit(1000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const { data: o } = await supabase
      .from("organismes_formation")
      .select("raison_sociale, numero_da, siret, adresse, representant_nom")
      .eq("tenant_id", tenant)
      .maybeSingle();

    const manques: string[] = [];
    if (!o || !o.siret) manques.push("SIRET");
    if (!o || !o.adresse) manques.push("adresse");
    if (!o || !o.numero_da) manques.push("numero de declaration d activite");
    if (!o || !o.representant_nom) manques.push("representant legal");

    return NextResponse.json({
      ok: true,
      types: TYPES,
      documents: data || [],
      signables: ["convention", "devis"],
      fiche_incomplete: manques.length > 0,
      manques: manques,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const admin = ADMINS.indexOf(session.email) >= 0;
    let tenant = session.tenantId;
    if (!tenant && admin) tenant = new URL(req.url).searchParams.get("tenant");
    if (!tenant) {
      return NextResponse.json({ ok: false, erreur: "Aucun organisme rattache." }, { status: 403 });
    }

    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    const type = String(b.type || "").trim().toLowerCase();
    if (!TYPES[type]) {
      return NextResponse.json({ ok: false, erreur: "Type de document inconnu." }, { status: 400 });
    }

    const email = String(b.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, erreur: "Stagiaire non precise." }, { status: 400 });
    }

    const { data: a } = await supabase
      .from("organisme_apprenants")
      .select("email, nom, formation_code, prix_vente, payeur")
      .eq("tenant_id", tenant)
      .eq("email", email)
      .maybeSingle();

    if (!a) {
      return NextResponse.json({ ok: false, erreur: "Stagiaire introuvable dans votre registre." }, { status: 404 });
    }

    const code = String(b.formation_code || a.formation_code || "").trim().toUpperCase();

    const f = await ficheFormation(code, tenant);

    const { data: o } = await supabase
      .from("organismes_formation")
      .select("raison_sociale, numero_da, siret, adresse, telephone, email_contact, numero_tva, representant_nom, representant_qualite, domaine")
      .eq("tenant_id", tenant)
      .maybeSingle();

    const { data: cat } = code
      ? await supabase
          .from("organisme_catalogue")
          .select("prix_vente_public")
          .eq("tenant_id", tenant)
          .eq("formation_code", code)
          .maybeSingle()
      : { data: null };

    let prix = Number(a.prix_vente);
    if (!prix || isNaN(prix)) prix = Number(cat && cat.prix_vente_public) || 0;
    if (!prix && f && f.prix) prix = Number(f.prix) || 0;

    const { data: modules } = await supabase
      .from("progression_apprenants")
      .select("module_cle, score, updated_at")
      .eq("tenant_id", tenant)
      .eq("user_email", email)
      .eq("statut", "valide")
      .limit(500);

    const nature = natureDuContrat(o, a);
    const titreDoc = titreDuDocument(type, nature);
    const sections = corps(type, o, a, f, prix, modules || [], nature);
    const signable = type === "convention" || type === "devis";

    // LA REFERENCE EST STABLE POUR UN MEME DOCUMENT : la preuve de signature
    // pointe dessus, elle ne peut pas changer a chaque telechargement.
    const { data: dejaEmis } = await supabase
      .from("organisme_documents")
      .select("id, reference, pdf_chemin, pdf_sha256")
      .eq("tenant_id", tenant)
      .eq("type", type)
      .eq("stagiaire_email", email)
      .eq("formation_code", code || null)
      .order("emis_le", { ascending: false })
      .limit(1)
      .maybeSingle();

    const reference = (dejaEmis && dejaEmis.reference)
      || type.slice(0, 3).toUpperCase() + "-" + Date.now().toString().slice(-8);

    // UN DOCUMENT DEJA SIGNE NE SE REECRIT PLUS. La preuve porte l empreinte
    // du fichier signe : le regenerer la rendrait fausse. On rend alors la
    // copie archivee, a l identique.
    const { data: signature } = await supabase
      .from("organisme_signatures")
      .select("id")
      .eq("document_reference", reference)
      .eq("annulee", false)
      .maybeSingle();

    if (signature && dejaEmis && dejaEmis.pdf_chemin) {
      const { data: archive } = await supabase.storage
        .from(BUCKET)
        .download(dejaEmis.pdf_chemin);

      if (archive) {
        const octetsArchive = Buffer.from(await archive.arrayBuffer());
        return new NextResponse(octetsArchive, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": 'attachment; filename="' + type + "-" + reference + '.pdf"',
          },
        });
      }
    }

    const siteSignature = (o && o.domaine) ? String(o.domaine) : "academiapro.fr";
    const adresseSignature = siteSignature + "/signature/" + reference;

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

    function paragraphe(texte: string, taille: number, police: any, couleur: any) {
      const mots = ascii(texte).split(" ");
      let ligne = "";
      const largeurMax = 495;
      for (const mot of mots) {
        const essai = ligne ? ligne + " " + mot : mot;
        if (police.widthOfTextAtSize(essai, taille) > largeurMax) {
          saut(taille + 5);
          page.drawText(ligne, { x: 50, y: y, size: taille, font: police, color: couleur });
          y = y - taille - 5;
          ligne = mot;
        } else {
          ligne = essai;
        }
      }
      if (ligne) {
        saut(taille + 5);
        page.drawText(ligne, { x: 50, y: y, size: taille, font: police, color: couleur });
        y = y - taille - 5;
      }
    }

    paragraphe(((o && o.raison_sociale) || "Organisme de formation").toUpperCase(), 11, gras, vert);
    if (o && o.adresse) paragraphe(o.adresse, 8.5, normal, gris);
    if (o && o.siret) paragraphe("SIRET " + o.siret, 8.5, normal, gris);
    if (o && o.numero_da) paragraphe("Declaration d activite n " + o.numero_da, 8.5, normal, gris);
    if (o && (o.email_contact || o.telephone)) {
      paragraphe([o.email_contact, o.telephone].filter(Boolean).join(" - "), 8.5, normal, gris);
    }
    y = y - 14;

    page.drawLine({ start: { x: 50, y: y }, end: { x: 545, y: y }, thickness: 1.2, color: vert });
    y = y - 26;

    paragraphe(titreDoc.toUpperCase(), 16, gras, vert);
    paragraphe("Reference " + reference + " - etabli le " + jour(), 9, normal, gris);
    y = y - 14;

    for (const s of sections) {
      const titreSection = s[0] as string;
      const lignes = s[1] as string[];
      if (titreSection) {
        y = y - 8;
        paragraphe(titreSection, 11, gras, vert);
        y = y - 2;
      }
      for (const l of lignes) {
        if (l) paragraphe(l, 10, normal, noir);
      }
    }

    if (type === "convention" || type === "devis" || type === "attestation" || type === "emargement") {
      y = y - 26;
      saut(120);
      paragraphe("Fait le " + jour() + ".", 10, normal, noir);

      if (signable) {
        paragraphe(
          "Le beneficiaire fait preceder sa signature de la mention Lu et approuve.",
          9, normal, gris
        );
      }

      y = y - 26;
      saut(70);

      const gauche = nature === "prestation" ? "Pour le prestataire" : "Pour l organisme de formation";
      page.drawText(ascii(gauche), { x: 50, y: y, size: 9.5, font: gras, color: noir });
      if (signable) {
        page.drawText(ascii("Le beneficiaire"), { x: 330, y: y, size: 9.5, font: gras, color: noir });
      }

      y = y - 12;
      if (o && o.representant_nom) {
        page.drawText(
          ascii(o.representant_nom + (o.representant_qualite ? ", " + o.representant_qualite : "")),
          { x: 50, y: y, size: 8.5, font: normal, color: gris }
        );
      }
      if (signable) {
        page.drawText(ascii((a && a.nom) || a.email), { x: 330, y: y, size: 8.5, font: normal, color: gris });
      }

      y = y - 40;
      page.drawLine({ start: { x: 50, y: y }, end: { x: 250, y: y }, thickness: 0.7, color: gris });
      if (signable) {
        page.drawLine({ start: { x: 330, y: y }, end: { x: 530, y: y }, thickness: 0.7, color: gris });
      }
    }

    // MENTION DE LA SIGNATURE, suivie de L ADRESSE OU SIGNER. On ne nomme
    // aucune adresse de courriel : le code part au beneficiaire du document.
    if (signable) {
      y = y - 34;
      saut(150);
      page.drawLine({ start: { x: 50, y: y }, end: { x: 545, y: y }, thickness: 0.5, color: gris });
      y = y - 16;
      paragraphe("Signature electronique", 9, gras, vert);
      y = y - 2;
      for (const l of MENTION_SIGNATURE) {
        saut(12);
        page.drawText(ascii(l), { x: 50, y: y, size: 7.5, font: normal, color: gris });
        y = y - 10;
      }

      y = y - 10;
      saut(34);
      page.drawText(ascii("Pour signer ce document en ligne :"), {
        x: 50, y: y, size: 8.5, font: normal, color: noir,
      });
      y = y - 13;

      // UN VRAI LIEN CLIQUABLE, et non plus du texte imprime. L adresse reste
      // ecrite en clair : certaines messageries desactivent les annotations.
      const largeurLien = gras.widthOfTextAtSize(ascii(adresseSignature), 10);
      page.drawText(ascii(adresseSignature), { x: 50, y: y, size: 10, font: gras, color: vert });

      const annotation = pdf.context.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: [48, y - 3, 50 + largeurLien + 2, y + 12],
        Border: [0, 0, 0],
        A: pdf.context.obj({
          Type: "Action",
          S: "URI",
          URI: pdf.context.obj("https://" + adresseSignature),
        }),
      });
      page.node.addAnnot(pdf.context.register(annotation));

      y = y - 13;
      page.drawText(
        ascii("Connectez-vous a votre espace : un code de verification a six chiffres sera"),
        { x: 50, y: y, size: 7.5, font: normal, color: gris }
      );
      y = y - 10;
      page.drawText(
        ascii("adresse a l adresse du beneficiaire figurant sur ce document."),
        { x: 50, y: y, size: 7.5, font: normal, color: gris }
      );
      y = y - 10;
    }

    const pages = pdf.getPages();
    for (let i = 0; i < pages.length; i = i + 1) {
      pages[i].drawText(
        ascii(((o && o.raison_sociale) || "") + " - " + reference + " - page " + (i + 1) + "/" + pages.length),
        { x: 50, y: 34, size: 7.5, font: normal, color: gris }
      );
    }

    const octets = Buffer.from(await pdf.save());

    // ARCHIVAGE IMMEDIAT. Le document doit pouvoir etre LU AVANT d etre signe :
    // s il n est archive qu au moment de la signature, la page de signature
    // n a rien a montrer et refuse — c est le cercle qu on brise ici.
    const empreinte = crypto.createHash("sha256").update(octets).digest("hex");
    const chemin = String(tenant) + "/" + reference + ".pdf";

    await supabase.storage
      .from(BUCKET)
      .upload(chemin, octets, { contentType: "application/pdf", upsert: true });

    if (dejaEmis) {
      await supabase
        .from("organisme_documents")
        .update({ pdf_chemin: chemin, pdf_sha256: empreinte, pdf_octets: octets.length })
        .eq("id", dejaEmis.id);
    } else {
      await supabase.from("organisme_documents").insert({
        tenant_id: tenant,
        type: type,
        stagiaire_email: email,
        formation_code: code || null,
        reference: reference,
        pdf_chemin: chemin,
        pdf_sha256: empreinte,
        pdf_octets: octets.length,
        donnees: {
          prix: prix,
          modules_valides: (modules || []).length,
          titre: f ? f.titre : null,
          nature: nature,
        },
      });
    }

    return new NextResponse(octets, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="' + type + "-" + reference + '.pdf"',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
