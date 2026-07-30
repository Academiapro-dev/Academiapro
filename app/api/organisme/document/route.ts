import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];

const TYPES: any = {
  convention: "Convention de formation professionnelle",
  devis: "Devis",
  convocation: "Convocation",
  programme: "Programme de formation",
  attestation: "Attestation de fin de formation",
  emargement: "Attestation d assiduite",
  livret: "Livret d accueil du stagiaire",
};

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
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/€/g, "EUR")
    .replace(/[^\x20-\x7E]/g, " ");
}

function jour(d?: any): string {
  return new Date(d || Date.now()).toLocaleDateString("fr-FR");
}

function euros(n: any): string {
  return (Number(n) || 0).toLocaleString("fr-FR") + " EUR";
}

// Chaque type renvoie des sections : un titre, puis des paragraphes.
function corps(type: string, o: any, a: any, f: any, prix: number, modules: any[]) {
  const nom = a && a.nom ? a.nom : a && a.email ? a.email : "le stagiaire";
  const of = (o && o.raison_sociale) || "l organisme";
  const titre = (f && f.titre) || a.formation_code || "la formation";
  const duree = Number(f && f.duree) || 0;

  if (type === "convention") {
    return [
      ["Entre les parties", [
        of + (o && o.numero_da ? ", declare sous le numero " + o.numero_da : "") +
        (o && o.siret ? ", SIRET " + o.siret : "") + ", ci-apres l organisme de formation,",
        "et " + nom + " (" + a.email + "), ci-apres le beneficiaire.",
      ]],
      ["Article 1 - Objet", [
        "L organisme de formation organise l action de formation intitulee : " + titre + ".",
        "Cette action entre dans le champ de la formation professionnelle au sens de l article L. 6313-1 du Code du travail.",
      ]],
      ["Article 2 - Nature et duree", [
        "Action de formation realisee a distance, en autoformation accompagnee.",
        "Duree : " + duree + " heures. Le beneficiaire dispose d un acces individuel a la plateforme pendant toute la duree du parcours.",
      ]],
      ["Article 3 - Modalites pedagogiques", [
        "Le parcours est compose de modules comportant un cours, des exercices corriges, un questionnaire d evaluation et une note de synthese.",
        "Chaque module est corrige individuellement : le beneficiaire recoit une note et une explication de chacune de ses erreurs. Un module est valide a partir de 14 sur 20.",
        "Un assistant pedagogique repond a ses questions tout au long du parcours.",
      ]],
      ["Article 4 - Prix et reglement", [
        "Le prix de l action est fixe a " + euros(prix) + " par beneficiaire.",
        "Les modalites de reglement sont convenues entre les parties et figurent sur la facture.",
      ]],
      ["Article 5 - Suivi et evaluation", [
        "L assiduite est etablie par les traces de connexion et les validations enregistrees par la plateforme.",
        "Une attestation de fin de formation est remise au beneficiaire a l issue du parcours, conformement a l article L. 6353-1 du Code du travail.",
      ]],
      ["Article 6 - Interruption", [
        "En cas d abandon en cours de parcours, l organisme etablit une attestation mentionnant les modules effectivement suivis et les heures realisees.",
      ]],
      ["Article 7 - Differends", [
        "Les parties recherchent une solution amiable. A defaut, le differend releve des juridictions competentes.",
      ]],
    ];
  }

  if (type === "devis") {
    return [
      ["Beneficiaire", [nom + " (" + a.email + ")"]],
      ["Prestation", [
        titre,
        "Formation professionnelle a distance, " + duree + " heures.",
      ]],
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
      ["Pour accepter", [
        "Retournez ce devis date et signe, avec la mention Bon pour accord.",
      ]],
    ];
  }

  if (type === "convocation") {
    return [
      ["Madame, Monsieur", [
        "Nous avons le plaisir de vous confirmer votre inscription a la formation suivante.",
      ]],
      ["Votre formation", [
        titre,
        "Duree : " + duree + " heures.",
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
        "Aucun prerequis academique. Une pratique courante de l outil informatique et une connexion internet sont necessaires.",
      ]],
      ["Objectifs pedagogiques", [
        "A l issue de la formation, le beneficiaire maitrise les notions, les methodes et les protocoles exposes dans le parcours, et sait les appliquer a des situations professionnelles.",
      ]],
      ["Public concerne", [
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
    return [
      ["", [
        of + (o && o.numero_da ? ", declare sous le numero d activite " + o.numero_da : "") +
        ", atteste que :",
      ]],
      ["", [nom + " (" + a.email + ")"]],
      ["a suivi la formation", [
        titre,
        "Duree : " + duree + " heures.",
        "Modalite : formation a distance en autoformation accompagnee.",
      ]],
      ["Objectifs de la formation", [
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
      ["Formation", [titre + " - " + duree + " heures"]],
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

    const admin = ADMINS.indexOf(session.email) >= 0;
    let tenant = session.tenantId;
    if (!tenant && admin) tenant = new URL(req.url).searchParams.get("tenant");
    if (!tenant) {
      return NextResponse.json({ ok: false, erreur: "Aucun organisme rattache." }, { status: 403 });
    }

    const email = new URL(req.url).searchParams.get("email");

    let requete = supabase
      .from("organisme_documents")
      .select("id, type, stagiaire_email, formation_code, reference, emis_le")
      .eq("tenant_id", tenant)
      .order("emis_le", { ascending: false });

    if (email) requete = requete.eq("stagiaire_email", email.toLowerCase());

    const { data, error } = await requete.limit(1000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, types: TYPES, documents: data || [] });
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
      .select("email, nom, formation_code, prix_vente")
      .eq("tenant_id", tenant)
      .eq("email", email)
      .maybeSingle();

    if (!a) {
      return NextResponse.json({ ok: false, erreur: "Stagiaire introuvable dans votre registre." }, { status: 404 });
    }

    const code = String(b.formation_code || a.formation_code || "").trim().toUpperCase();

    const { data: f } = code
      ? await supabase.from("formations").select("code, titre, duree").eq("code", code).maybeSingle()
      : { data: null };

    const { data: o } = await supabase
      .from("organismes_formation")
      .select("raison_sociale, numero_da, siret, adresse, telephone, email_contact")
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

    const { data: modules } = await supabase
      .from("progression_apprenants")
      .select("module_cle, score, updated_at")
      .eq("tenant_id", tenant)
      .eq("user_email", email)
      .eq("statut", "valide")
      .limit(500);

    const sections = corps(type, o, a, f, prix, modules || []);
    const reference = type.slice(0, 3).toUpperCase() + "-" + Date.now().toString().slice(-8);

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

    // En-tete
    paragraphe(((o && o.raison_sociale) || "Organisme de formation").toUpperCase(), 11, gras, vert);
    if (o && o.numero_da) paragraphe("Declaration d activite n " + o.numero_da, 8.5, normal, gris);
    if (o && o.adresse) paragraphe(o.adresse, 8.5, normal, gris);
    y = y - 14;

    page.drawLine({ start: { x: 50, y: y }, end: { x: 545, y: y }, thickness: 1.2, color: vert });
    y = y - 26;

    paragraphe(TYPES[type].toUpperCase(), 16, gras, vert);
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

    // Signatures, sauf pour les documents purement informatifs.
    if (type === "convention" || type === "devis" || type === "attestation" || type === "emargement") {
      y = y - 26;
      saut(90);
      paragraphe("Fait le " + jour() + ".", 10, normal, noir);
      y = y - 30;
      saut(60);
      page.drawText(ascii("Pour l organisme de formation"), { x: 50, y: y, size: 9.5, font: gras, color: noir });
      if (type === "convention" || type === "devis") {
        page.drawText(ascii("Le beneficiaire"), { x: 330, y: y, size: 9.5, font: gras, color: noir });
      }
      y = y - 46;
      page.drawLine({ start: { x: 50, y: y }, end: { x: 250, y: y }, thickness: 0.7, color: gris });
      if (type === "convention" || type === "devis") {
        page.drawLine({ start: { x: 330, y: y }, end: { x: 530, y: y }, thickness: 0.7, color: gris });
      }
    }

    const pages = pdf.getPages();
    for (let i = 0; i < pages.length; i = i + 1) {
      pages[i].drawText(
        ascii(((o && o.raison_sociale) || "") + " - " + reference + " - page " + (i + 1) + "/" + pages.length),
        { x: 50, y: 34, size: 7.5, font: normal, color: gris }
      );
    }

    await supabase.from("organisme_documents").insert({
      tenant_id: tenant,
      type: type,
      stagiaire_email: email,
      formation_code: code || null,
      reference: reference,
      donnees: { prix: prix, modules_valides: (modules || []).length, titre: f ? f.titre : null },
    });

    const octets = await pdf.save();

    return new NextResponse(Buffer.from(octets), {
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
