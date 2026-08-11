import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// LE GUIDE QUI S EFFACE.
//
// Une aide qui revient a chaque visite devient une gene, et l utilisateur
// apprend a la fermer sans la lire. On retient donc ce qui a ete vu, par
// personne et par ecran, et on ne le remontre jamais.
//
// LE CONTENU VIT ICI, PAS DANS LES PAGES. Un texte d aide se corrige
// souvent : le premier client dira ce qui manque. L avoir en un seul
// endroit evite d aller le chercher dans quinze fichiers.

const GUIDES: any = {

  // ─────────────────────────────────────────────────────────────────
  // MR. COMPTABLE
  // ─────────────────────────────────────────────────────────────────

  "comptable.dossiers": {
    titre: "Vos dossiers",
    texte: "Cet écran classe vos dossiers du plus urgent au plus calme. "
      + "L'ordre suit l'urgence comptable : un déséquilibre passe avant une "
      + "TVA, une TVA avant un rapprochement.",
    points: [
      "Les trois boutons en haut sont les gestes du quotidien : voir vos chiffres, déposer une facture, saisir une écriture.",
      "Chaque dossier porte les actions qui le concernent — elles n'apparaissent que si elles ont lieu d'être.",
      "Un dossier dormant remonte aussi : un client qu'on oublie est un client qui part.",
    ],
  },

  "comptable.chiffres": {
    titre: "Le tableau de bord",
    texte: "Ce qui entre, ce qui sort, ce qui reste. Ces montants sont "
      + "calculés depuis les écritures saisies : ils valent ce que vaut la "
      + "saisie.",
    points: [
      "Sans dossier choisi, vous voyez le cumul du cabinet.",
      "En choisissant un dossier, le mois par mois apparaît — c'est là qu'une dérive se voit.",
      "Ces chiffres ne remplacent ni la balance ni le compte de résultat définitif.",
    ],
  },

  "comptable.pieces": {
    titre: "Factures et justificatifs",
    texte: "Vous déposez la facture, elle se lit et se comptabilise. Au "
      + "format Factur-X, les montants sont repris du fichier structuré : "
      + "sans lecture visuelle, donc sans écart possible.",
    points: [
      "L'onglet « À justifier » liste les écritures sans pièce — c'est ce qu'un contrôle réclamera.",
      "Une pièce déposée se rattache à son écriture, ou se comptabilise directement après lecture.",
      "Chaque dépôt porte son empreinte SHA-256 : l'intégrité du document est prouvable.",
    ],
  },

  "comptable.acces-clients": {
    titre: "Les espaces clients",
    texte: "Ouvrez un espace au dirigeant : il verra ce que vous attendez de "
      + "lui et enverra ses factures en les photographiant.",
    points: [
      "Il n'a ni compte à créer ni mot de passe à retenir : le lien le connecte.",
      "Ce lien est personnel et se révoque d'un clic, sans effacer ce qu'il a déjà déposé.",
      "Chaque mois, la plateforme lui écrit d'elle-même la liste des justificatifs manquants.",
    ],
  },

  "comptable.teledec": {
    titre: "Les télétransmissions",
    texte: "Les liasses envoyées à l'administration et leur réponse. Un "
      + "accusé de réception vaut dépôt.",
    points: [
      "Un rejet indique le formulaire, le champ et ce qu'on vous reproche — il n'y a rien à décoder.",
      "La liasse acceptée est conservée ici : le lien de l'administration, lui, expire en une heure.",
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // MR. QUALIOPI
  // ─────────────────────────────────────────────────────────────────

  "qualiopi.grille": {
    titre: "Votre préparation",
    texte: "Les indicateurs du Référentiel National Qualité qui vous "
      + "concernent, et où vous en êtes sur chacun. Tous ne s'appliquent pas "
      + "à tous : c'est votre profil qui les détermine.",
    points: [
      "Commencez par le critère 1 : c'est ce que l'auditeur vérifiera en premier, sur votre site.",
      "Pour chaque indicateur, l'assistant vous dit ce qui est attendu et ce qu'il vous manque.",
      "Le dossier de preuves s'exporte classé dans l'ordre du référentiel, prêt à présenter.",
    ],
  },

  "qualiopi.indicateur": {
    titre: "Préparer un indicateur",
    texte: "Trois choses à faire ici : comprendre ce qui est attendu, "
      + "déposer vos preuves, et faire examiner le résultat.",
    points: [
      "L'assistant connaît le niveau attendu par le guide de lecture. Posez-lui vos questions.",
      "Une preuve est un document que l'auditeur pourra lire — un écran, un modèle vierge ou une intention ne suffisent pas.",
      "L'examen compare vos preuves au niveau attendu et vous dit ce qui manque. Cinq examens par indicateur.",
    ],
  },

  "qualiopi.mon-organisme": {
    titre: "Votre organisme",
    texte: "Ces informations commandent tout le reste : ce sont elles qui "
      + "déterminent quels indicateurs vous seront présentés.",
    points: [
      "Un organisme de formation classique en valide 23 ; un centre de formation d'apprentis peut aller jusqu'à 32.",
      "Le représentant légal figurera sur les documents signés que réclame le référentiel.",
      "Le site internet sera consulté par l'auditeur : c'est là que se vérifie le critère 1.",
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // LA PLATEFORME DE FORMATION — L ORGANISME
  // ─────────────────────────────────────────────────────────────────

  "organisme.stagiaires": {
    titre: "Le registre des stagiaires",
    texte: "Inscrivez vos stagiaires, ouvrez-leur l'accès, suivez leur "
      + "avancement.",
    points: [
      "Le statut et le dispositif remplissent les cadres C et F-1 de votre bilan pédagogique. Renseignez-les maintenant : dans un an, personne ne s'en souviendra.",
      "Le code formation ouvre l'accès du stagiaire. Sans lui, il ne peut pas entrer.",
      "Une fiche incomplète est encadrée de rouge — c'est ce qui bloquera votre déclaration annuelle.",
    ],
  },

  "organisme.bilan": {
    titre: "Le bilan pédagogique et financier",
    texte: "État préparatoire au Cerfa 10443*17. Les chiffres sont rangés "
      + "selon les cadres du formulaire, pour être recopiés sur Mon Activité "
      + "Formation.",
    points: [
      "Ce document n'est pas la déclaration : la télédéclaration se fait sur le site de l'administration, avant le 30 avril.",
      "Ce qu'il manque est signalé en tête. Complétez le registre avant de déclarer.",
      "Le cadre B se remplit OUI : vos formations sont dispensées en ligne, en tout ou partie.",
    ],
  },

  "organisme.financement": {
    titre: "Les dossiers de financement",
    texte: "Du dépôt au règlement. La déclaration de service fait est "
      + "l'étape qu'on oublie : sans elle, le financeur ne paie jamais.",
    points: [
      "Ce qui bloque votre argent apparaît en tête : les accords sans service fait, et les services faits non réglés.",
      "Chaque étape se date d'elle-même : vous voyez où un dossier s'est arrêté, et depuis combien de temps.",
      "Le montant accordé est souvent inférieur au montant demandé : le financeur plafonne.",
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // LE CRM
  // ─────────────────────────────────────────────────────────────────

  "crm.prospects": {
    titre: "Vos prospects",
    texte: "Tous ceux qui ont laissé leurs coordonnées, d'où qu'ils "
      + "viennent : formulaire, guide téléchargé, page de tunnel.",
    points: [
      "L'origine dit ce qui les a fait venir — c'est elle qui oriente votre relance.",
      "Un prospect relancé porte la date de sa dernière relance : sept jours de délai avant la suivante.",
      "Le lien de désinscription figure dans chaque envoi. Une désinscription est définitive.",
    ],
  },

  // ─────────────────────────────────────────────────────────────────
  // L ESPACE DU DIRIGEANT
  // ─────────────────────────────────────────────────────────────────

  "client.espace": {
    titre: "Votre espace",
    texte: "Envoyez vos factures à votre comptable, et voyez ce qu'il "
      + "attend encore de vous.",
    points: [
      "Photographiez le document ou choisissez un fichier : les deux fonctionnent.",
      "Touchez une ligne de la liste avant d'envoyer, et votre document sera rattaché à la bonne écriture.",
      "Vos envois se rouvrent : vérifiez qu'une photo est nette plutôt que de l'envoyer deux fois.",
    ],
  },
};

export async function GET(req: NextRequest) {
  try {
    const ecran = new URL(req.url).searchParams.get("ecran") || "";
    const guide = GUIDES[ecran];

    if (!guide) {
      return NextResponse.json({ ok: true, guide: null, vu: true });
    }

    const session = sessionCourante();

    // Sans session, on montre le guide : c est souvent le premier passage,
    // et c est la que l aide sert le plus.
    if (!session || !session.email) {
      return NextResponse.json({ ok: true, guide: guide, vu: false, ecran: ecran });
    }

    const { data } = await supabase
      .from("guide_vus")
      .select("id")
      .eq("email", String(session.email).toLowerCase())
      .eq("ecran", ecran)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      guide: guide,
      vu: !!data,
      ecran: ecran,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: true, guide: null, vu: true });
  }
}

// L utilisateur a lu : on ne le lui remontre plus.
export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || !session.email) {
      return NextResponse.json({ ok: true, enregistre: false });
    }

    const b = await req.json().catch(function () { return null; });
    const ecran = b && b.ecran ? String(b.ecran).slice(0, 100) : "";

    if (!ecran) {
      return NextResponse.json({ ok: false, erreur: "Ecran non precise." }, { status: 400 });
    }

    await supabase
      .from("guide_vus")
      .upsert(
        { email: String(session.email).toLowerCase(), ecran: ecran },
        { onConflict: "email,ecran" }
      );

    return NextResponse.json({ ok: true, enregistre: true });
  } catch (e: any) {
    return NextResponse.json({ ok: true, enregistre: false });
  }
}

// Tout revoir : utile apres une mise a jour importante, ou pour montrer le
// produit a quelqu un.
export async function DELETE() {
  try {
    const session = sessionCourante();
    if (!session || !session.email) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    await supabase
      .from("guide_vus")
      .delete()
      .eq("email", String(session.email).toLowerCase());

    return NextResponse.json({ ok: true, message: "Les guides réapparaîtront." });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
