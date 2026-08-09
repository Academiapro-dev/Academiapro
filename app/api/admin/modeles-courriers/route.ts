import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

// UN SEUL TEXTE, DEUX ADRESSES.
//
// Le modele est ecrit au vouvoiement. Le tutoiement se fabrique a la
// demande, plutot que d entretenir deux versions qui divergeraient a la
// premiere correction.
//
// TROIS PIEGES, ET L ORDRE DES REGLES LES EVITE.
//
//  1. « votre » devient « ton » ou « ta » selon le genre du nom qui suit :
//     le francais ne se devine pas, on liste donc les feminins courants.
//  2. « vous » complement devient « t' » ou « te » : « vous appartiennent »
//     avant « vous », faute de quoi on obtient « elles tu appartiennent ».
//  3. Les titres en capitales ont leurs propres regles.
//
// La transformation reste mecanique, donc imparfaite : le resultat se RELIT
// toujours avant l envoi. C est ce que dit l avertissement renvoye.

// Les noms feminins qu on rencontre dans un courrier commercial. « votre »
// devant l un d eux devient « ta ».
const FEMININS = [
  "plateforme", "equipe", "équipe", "societe", "société", "facture",
  "marque", "formation", "certification", "demande", "reponse", "réponse",
  "proposition", "offre", "structure", "activite", "activité", "clientele",
  "clientèle", "gestion", "comptabilite", "comptabilité", "declaration",
  "déclaration", "liasse", "banque", "signature", "convention", "attestation",
  "page", "fiche", "liste", "base", "part", "grille", "situation",
];

function reglesFeminines(): any[] {
  const sortie: any[] = [];
  for (const nom of FEMININS) {
    sortie.push([new RegExp("\\bvotre " + nom + "\\b", "g"), "ta " + nom]);
    sortie.push([new RegExp("\\bVotre " + nom + "\\b", "g"), "Ta " + nom]);
    sortie.push([new RegExp("\\bVOTRE " + nom.toUpperCase() + "\\b", "g"), "TA " + nom.toUpperCase()]);
  }
  return sortie;
}

const TUTOIEMENT: any[] = [
  // --- Capitales des titres ---
  [/\bVOUS GÉREZ\b/g, "TU GÈRES"],
  [/\bVOS STAGIAIRES\b/g, "TES STAGIAIRES"],
  [/\bCE QUE VOUS AURIEZ\b/g, "CE QUE TU AURAIS"],
  [/\bVOUS AURIEZ\b/g, "TU AURAIS"],

  // --- Feminins : « votre plateforme » devient « ta plateforme » ---
  ...reglesFeminines(),

  // --- « vous » complement d objet : il devient « t' » ou « te » ---
  [/\bvous appartiennent\b/g, "t'appartiennent"],
  [/\bvous appartient\b/g, "t'appartient"],
  [/\bvous en resterait\b/g, "t'en resterait"],
  [/\bvous en reste\b/g, "t'en reste"],
  [/\bvous parle\b/g, "te parle"],
  [/\bvous dire\b/g, "te dire"],
  [/\bvous suivre\b/g, "te suivre"],
  [/\bvous convient\b/g, "te convient"],

  // --- Formes verbales, les plus longues d abord ---
  [/\bVous seul pouvez\b/g, "Toi seul peux"],
  [/\bvous seul pouvez\b/g, "toi seul peux"],
  [/\bvous n'auriez\b/g, "tu n'aurais"],
  [/\bVous n'auriez\b/g, "Tu n'aurais"],
  [/\bvous auriez\b/g, "tu aurais"],
  [/\bVous auriez\b/g, "Tu aurais"],
  [/\bvous conserveriez\b/g, "tu conserverais"],
  [/\bVous conserveriez\b/g, "Tu conserverais"],
  [/\bvous créeriez\b/g, "tu créerais"],
  [/\bvous creeriez\b/g, "tu creerais"],
  [/\bvous gérez\b/g, "tu gères"],
  [/\bvous gerez\b/g, "tu geres"],
  [/\bvous vendez\b/g, "tu vends"],
  [/\bvous pouvez\b/g, "tu peux"],
  [/\bvous voulez\b/g, "tu veux"],
  [/\bvous avez\b/g, "tu as"],
  [/\bvous êtes\b/g, "tu es"],
  [/\bvous etes\b/g, "tu es"],
  [/\bvous savez\b/g, "tu sais"],
  [/\bvous verrez\b/g, "tu verras"],
  [/\bvous trouverez\b/g, "tu trouveras"],

  // --- Imperatifs ---
  [/\bDonnez-moi\b/g, "Donne-moi"],
  [/\bDites-moi\b/g, "Dis-moi"],
  [/\bEnvoyez-moi\b/g, "Envoie-moi"],
  [/\bAppelez-moi\b/g, "Appelle-moi"],
  [/\bPrévenez-moi\b/g, "Préviens-moi"],

  // --- Possessifs et locutions ---
  [/\bvous-même\b/g, "toi-même"],
  [/\bvous-meme\b/g, "toi-meme"],
  [/\bchez vous\b/g, "chez toi"],
  [/\bpour vous\b/g, "pour toi"],
  [/\bavec vous\b/g, "avec toi"],
  [/\bde votre côté\b/g, "de ton côté"],

  // --- Le reste, en dernier. « votre » masculin par defaut. ---
  [/\bVOUS\b/g, "TU"],
  [/\bVOS\b/g, "TES"],
  [/\bVOTRE\b/g, "TON"],
  [/\bvos\b/g, "tes"],
  [/\bVos\b/g, "Tes"],
  [/\bvotre\b/g, "ton"],
  [/\bVotre\b/g, "Ton"],
  [/\bvous\b/g, "tu"],
  [/\bVous\b/g, "Tu"],
];

function tutoyer(texte: string): string {
  let sortie = String(texte || "");
  for (const [motif, remplacement] of TUTOIEMENT) {
    sortie = sortie.replace(motif, remplacement);
  }
  return sortie;
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(String(session.email).toLowerCase().trim()) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const url = new URL(req.url);
    const cle = url.searchParams.get("cle") || "";
    const tu = url.searchParams.get("tutoiement") === "1";
    const destinataire = (url.searchParams.get("destinataire") || "").trim();

    // Sans cle : la liste des modeles disponibles.
    if (!cle) {
      const { data, error } = await supabase
        .from("modeles_courriers")
        .select("cle, titre, objet, maj_le")
        .order("titre", { ascending: true });

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, modeles: data || [] });
    }

    const { data, error } = await supabase
      .from("modeles_courriers")
      .select("cle, titre, objet, corps, maj_le")
      .eq("cle", cle)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ ok: false, erreur: "Modele inconnu : " + cle }, { status: 404 });
    }

    // Le tutoiement AVANT le prenom : sinon la regle transformerait un nom
    // qui contiendrait par hasard une forme reconnue.
    let corps = tu ? tutoyer(data.corps) : data.corps;

    if (destinataire) {
      corps = corps.replace(/^Bonjour,/, tu ? destinataire + "," : "Bonjour " + destinataire + ",");
    }

    return NextResponse.json({
      ok: true,
      cle: data.cle,
      titre: data.titre,
      objet: data.objet,
      corps: corps,
      tutoiement: tu,
      avertissement: tu
        ? "Le tutoiement est fabrique par regle automatique : relisez avant d envoyer."
        : null,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
