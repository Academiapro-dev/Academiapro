import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];

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

function refuse() {
  return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
}

const CHAMPS_COMMUNS = [
  { cle: "contrepartie", libelle: "Denomination de la contrepartie" },
  { cle: "forme", libelle: "Forme juridique et capital" },
  { cle: "siege", libelle: "Adresse du siege" },
  { cle: "immatriculation", libelle: "SIREN ou numero d immatriculation" },
  { cle: "representant", libelle: "Representant et sa qualite" },
  { cle: "email", libelle: "Email du signataire" },
];

// Quatre modeles prets a l emploi. Ce sont des PROJETS : ils doivent etre relus
// par un professionnel du droit avant d etre opposes a un cocontractant.
const MODELES = [
  {
    code: "PARTENARIAT",
    titre: "Contrat de partenariat de distribution",
    categorie: "partenariat",
    description:
      "Pour un partenaire qui distribue vos formations aupres de ses propres clients.",
    champs: CHAMPS_COMMUNS.concat([
      { cle: "objet", libelle: "Ce que le partenaire distribue" },
      { cle: "commission", libelle: "Part revenant au partenaire, en pourcentage" },
      { cle: "duree", libelle: "Duree initiale, en mois" },
      { cle: "preavis", libelle: "Preavis de resiliation, en mois" },
    ]),
    corps:
      "ENTRE LES SOUSSIGNES\n\n" +
      "AcadeMIA Pro LLC, societe de droit du Wyoming, dont le siege est situe 30 N Gould St " +
      "STE R, Sheridan WY 82801, Etats-Unis, representee par Jacques Lalou, ci-apres " +
      "denommee l Editeur,\n\n" +
      "ET\n\n" +
      "{{contrepartie}}, {{forme}}, dont le siege est situe {{siege}}, immatriculee sous le " +
      "numero {{immatriculation}}, representee par {{representant}}, ci-apres denommee le " +
      "Partenaire,\n\n" +
      "IL A ETE CONVENU CE QUI SUIT\n\n" +
      "## Article 1 - Objet\n\n" +
      "Le present contrat a pour objet de definir les conditions dans lesquelles le Partenaire " +
      "distribue {{objet}} aupres de ses propres clients.\n\n" +
      "Le Partenaire agit en son nom propre et pour son compte. Il n est ni mandataire ni agent " +
      "commercial de l Editeur, et ne dispose d aucun pouvoir de l engager.\n\n" +
      "## Article 2 - Obligations de l Editeur\n\n" +
      "L Editeur met a disposition du Partenaire les contenus et les moyens techniques " +
      "necessaires a la distribution. Il en assure la maintenance et la mise a jour.\n\n" +
      "L Editeur ne garantit aucun volume de vente ni aucun resultat commercial.\n\n" +
      "## Article 3 - Obligations du Partenaire\n\n" +
      "Le Partenaire promeut les prestations avec loyaute et s interdit toute affirmation " +
      "inexacte a leur sujet. Il repond seul de la relation avec ses clients, de la facturation " +
      "et du recouvrement.\n\n" +
      "Il s interdit de reproduire, d extraire ou de rediffuser les contenus en dehors du cadre " +
      "defini au present contrat.\n\n" +
      "## Article 4 - Remuneration\n\n" +
      "Le Partenaire percoit {{commission}} % du prix de vente hors taxes des prestations " +
      "effectivement reglees par ses clients. Le decompte est etabli mensuellement.\n\n" +
      "## Article 5 - Propriete intellectuelle\n\n" +
      "Les contenus, marques et developpements demeurent la propriete exclusive de l Editeur. " +
      "Le present contrat n emporte aucune cession, mais une licence d usage non exclusive et " +
      "non cessible, limitee a sa duree.\n\n" +
      "## Article 6 - Duree et resiliation\n\n" +
      "Le contrat est conclu pour une duree de {{duree}} mois, renouvelable par tacite " +
      "reconduction. Chaque partie peut y mettre fin par ecrit moyennant un preavis de " +
      "{{preavis}} mois.\n\n" +
      "En cas de manquement grave, la resiliation intervient de plein droit quinze jours apres " +
      "une mise en demeure restee sans effet.\n\n" +
      "## Article 7 - Confidentialite\n\n" +
      "Chaque partie s engage a ne pas divulguer les informations non publiques recues de " +
      "l autre, pendant la duree du contrat et les trois annees suivantes.\n\n" +
      "## Article 8 - Responsabilite\n\n" +
      "La responsabilite de chaque partie ne peut etre engagee qu en cas de faute prouvee et se " +
      "limite aux dommages directs, dans la limite des sommes echangees au titre des douze mois " +
      "precedents.\n\n" +
      "## Article 9 - Differends\n\n" +
      "Les parties recherchent une solution amiable. A defaut, le differend releve des " +
      "juridictions competentes selon les regles applicables entre professionnels.\n",
  },
  {
    code: "CONFIDENTIALITE",
    titre: "Accord de confidentialite",
    categorie: "fournisseur",
    description:
      "A faire signer avant toute discussion ou l on montre des chiffres, du code ou des methodes.",
    champs: CHAMPS_COMMUNS.concat([
      { cle: "objet", libelle: "Objet des echanges" },
      { cle: "duree", libelle: "Duree de l engagement, en annees" },
    ]),
    corps:
      "ENTRE LES SOUSSIGNES\n\n" +
      "AcadeMIA Pro LLC, societe de droit du Wyoming, dont le siege est situe 30 N Gould St " +
      "STE R, Sheridan WY 82801, Etats-Unis, representee par Jacques Lalou,\n\n" +
      "ET\n\n" +
      "{{contrepartie}}, {{forme}}, dont le siege est situe {{siege}}, immatriculee sous le " +
      "numero {{immatriculation}}, representee par {{representant}},\n\n" +
      "IL A ETE CONVENU CE QUI SUIT\n\n" +
      "## Article 1 - Contexte\n\n" +
      "Les parties envisagent {{objet}}. A cette occasion, elles seront amenees a echanger des " +
      "informations non publiques.\n\n" +
      "## Article 2 - Informations couvertes\n\n" +
      "Sont confidentielles toutes les informations echangees, quel qu en soit le support : " +
      "donnees commerciales et financieres, methodes, contenus pedagogiques, code source, " +
      "listes de clients ou de prospects, tarifs et conditions.\n\n" +
      "Ne sont pas couvertes les informations deja publiques, celles deja detenues avant " +
      "l echange, et celles dont la divulgation est imposee par une autorite.\n\n" +
      "## Article 3 - Engagements\n\n" +
      "Chaque partie s engage a garder ces informations strictement confidentielles, a ne les " +
      "utiliser qu aux fins de l objet ci-dessus, et a ne les communiquer qu aux personnes qui " +
      "en ont besoin et sont tenues d une obligation equivalente.\n\n" +
      "## Article 4 - Duree\n\n" +
      "Le present engagement prend effet a sa signature et demeure en vigueur pendant " +
      "{{duree}} annees, y compris si les discussions n aboutissent pas.\n\n" +
      "## Article 5 - Restitution\n\n" +
      "A premiere demande, chaque partie restitue ou detruit les documents recus et en atteste " +
      "par ecrit.\n\n" +
      "## Article 6 - Absence d engagement\n\n" +
      "Le present accord n emporte aucune obligation de conclure, ni aucune cession de droit " +
      "sur les informations echangees.\n",
  },
  {
    code: "SOUSTRAITANCE",
    titre: "Contrat de sous-traitance de formation",
    categorie: "fournisseur",
    description:
      "Pour confier une action de formation a un formateur ou a un organisme tiers.",
    champs: CHAMPS_COMMUNS.concat([
      { cle: "prestation", libelle: "Action confiee" },
      { cle: "periode", libelle: "Periode d execution" },
      { cle: "prix", libelle: "Prix hors taxes" },
    ]),
    corps:
      "ENTRE LES SOUSSIGNES\n\n" +
      "AcadeMIA Pro LLC, societe de droit du Wyoming, dont le siege est situe 30 N Gould St " +
      "STE R, Sheridan WY 82801, Etats-Unis, ci-apres le Donneur d ordre,\n\n" +
      "ET\n\n" +
      "{{contrepartie}}, {{forme}}, dont le siege est situe {{siege}}, immatriculee sous le " +
      "numero {{immatriculation}}, representee par {{representant}}, ci-apres le Sous-traitant,\n\n" +
      "IL A ETE CONVENU CE QUI SUIT\n\n" +
      "## Article 1 - Objet\n\n" +
      "Le Donneur d ordre confie au Sous-traitant la realisation de {{prestation}}, sur la " +
      "periode {{periode}}.\n\n" +
      "## Article 2 - Qualification et conformite\n\n" +
      "Le Sous-traitant garantit disposer des qualifications, habilitations et autorisations " +
      "necessaires a l execution de la prestation, et s engage a les maintenir pendant toute " +
      "la duree du contrat. Il en fournit les justificatifs a premiere demande.\n\n" +
      "Il se conforme au referentiel qualite applicable et fournit les elements de preuve " +
      "attendus lors d un audit.\n\n" +
      "## Article 3 - Execution\n\n" +
      "Le Sous-traitant execute la prestation en toute independance, avec ses propres moyens " +
      "et son propre personnel, dont il demeure seul employeur.\n\n" +
      "## Article 4 - Prix et reglement\n\n" +
      "Le prix est fixe a {{prix}} hors taxes. Le reglement intervient par virement a trente " +
      "jours a compter de la facture, apres service fait.\n\n" +
      "## Article 5 - Evaluation\n\n" +
      "Le Donneur d ordre evalue la prestation a son terme. Une evaluation defavorable peut " +
      "conduire au non-renouvellement.\n\n" +
      "## Article 6 - Obligations sociales\n\n" +
      "Le Sous-traitant atteste etre a jour de ses obligations sociales et fiscales, et remet " +
      "les attestations exigees par la reglementation applicable.\n\n" +
      "## Article 7 - Confidentialite et propriete\n\n" +
      "Les contenus fournis par le Donneur d ordre demeurent sa propriete. Le Sous-traitant " +
      "s interdit de les reutiliser en dehors de la prestation.\n\n" +
      "## Article 8 - Differends\n\n" +
      "Les parties recherchent une solution amiable avant toute action.\n",
  },
  {
    code: "PRESTATION",
    titre: "Contrat de prestation - creation de contenu",
    categorie: "fournisseur",
    description:
      "Pour faire rediger un contenu par un tiers, avec cession des droits a votre profit.",
    champs: CHAMPS_COMMUNS.concat([
      { cle: "prestation", libelle: "Contenu a produire" },
      { cle: "delai", libelle: "Delai de livraison" },
      { cle: "prix", libelle: "Prix hors taxes" },
    ]),
    corps:
      "ENTRE LES SOUSSIGNES\n\n" +
      "AcadeMIA Pro LLC, societe de droit du Wyoming, dont le siege est situe 30 N Gould St " +
      "STE R, Sheridan WY 82801, Etats-Unis, ci-apres le Client,\n\n" +
      "ET\n\n" +
      "{{contrepartie}}, {{forme}}, dont le siege est situe {{siege}}, immatriculee sous le " +
      "numero {{immatriculation}}, representee par {{representant}}, ci-apres le Prestataire,\n\n" +
      "IL A ETE CONVENU CE QUI SUIT\n\n" +
      "## Article 1 - Objet\n\n" +
      "Le Prestataire realise pour le Client {{prestation}}, livrable au plus tard le " +
      "{{delai}}.\n\n" +
      "## Article 2 - Originalite\n\n" +
      "Le Prestataire garantit que le contenu livre est original, qu il en est l auteur, et " +
      "qu il ne porte atteinte a aucun droit de tiers. Il garantit le Client contre toute " +
      "reclamation a ce titre.\n\n" +
      "## Article 3 - Cession des droits\n\n" +
      "Le Prestataire cede au Client, a titre exclusif et pour la duree legale de protection, " +
      "les droits de reproduction, de representation, d adaptation et d exploitation du contenu " +
      "livre, pour le monde entier et pour tous supports.\n\n" +
      "Cette cession est comprise dans le prix defini a l article 4.\n\n" +
      "## Article 4 - Prix et reglement\n\n" +
      "Le prix est fixe a {{prix}} hors taxes, payable a trente jours apres acceptation de la " +
      "livraison.\n\n" +
      "## Article 5 - Acceptation\n\n" +
      "Le Client dispose de quinze jours pour formuler ses observations. Passe ce delai sans " +
      "reserve, la livraison est reputee acceptee.\n\n" +
      "## Article 6 - Confidentialite\n\n" +
      "Le Prestataire s interdit de divulguer les informations recues et de reutiliser le " +
      "contenu produit pour son compte ou pour un tiers.\n",
  },
];

export async function GET() {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const { data, error } = await supabase
      .from("modeles_contrats")
      .select("*")
      .order("titre", { ascending: true })
      .limit(200);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const codes = (data || []).map(function (m: any) { return m.code; });
    const aInstaller = MODELES.filter(function (m: any) {
      return codes.indexOf(m.code) < 0;
    }).length;

    return NextResponse.json({
      ok: true,
      total: (data || []).length,
      a_installer: aInstaller,
      modeles: data || [],
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    // Installation des modeles fournis : on n ecrase jamais un modele que
    // vous auriez deja modifie.
    if (b.action === "installer") {
      const { data: existants } = await supabase
        .from("modeles_contrats")
        .select("code")
        .limit(200);

      const codes = (existants || []).map(function (m: any) { return m.code; });
      const nouveaux = MODELES.filter(function (m: any) {
        return codes.indexOf(m.code) < 0;
      });

      if (nouveaux.length === 0) {
        return NextResponse.json({
          ok: true,
          installes: 0,
          message: "Vos modeles sont deja en place.",
        });
      }

      const { error } = await supabase.from("modeles_contrats").insert(nouveaux);

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        installes: nouveaux.length,
        message: nouveaux.length + " modele(s) installe(s). Relisez-les avant tout usage.",
      });
    }

    const code = String(b.code || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    const titre = String(b.titre || "").trim();
    const corps = String(b.corps || "").trim();

    if (code.length < 3 || titre.length < 3 || corps.length < 50) {
      return NextResponse.json(
        { ok: false, erreur: "Un code, un titre et un corps de contrat sont necessaires." },
        { status: 400 }
      );
    }

    const fiche: any = {
      code: code,
      titre: titre,
      categorie: String(b.categorie || "partenariat").trim(),
      description: b.description ? String(b.description).trim() : null,
      champs: Array.isArray(b.champs) ? b.champs : [],
      corps: corps,
      actif: b.actif !== false,
      updated_at: new Date().toISOString(),
    };

    const { data: deja } = await supabase
      .from("modeles_contrats")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    const r = deja
      ? await supabase.from("modeles_contrats").update(fiche).eq("id", deja.id)
      : await supabase.from("modeles_contrats").insert(fiche);

    if (r.error) {
      return NextResponse.json({ ok: false, erreur: r.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, code: code, remplace: !!deja });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Modele non precise." }, { status: 400 });
    }

    const { error } = await supabase.from("modeles_contrats").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, supprime: id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
