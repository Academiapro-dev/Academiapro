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
// La transformation est mecanique, donc imparfaite : elle est faite pour
// des textes commerciaux ecrits simplement. Le resultat se RELIT toujours
// avant l envoi — c est le prix d une regle automatique sur une langue qui
// ne l est pas.
const TUTOIEMENT: any[] = [
  // Les formes les plus longues d abord : « vous seul » avant « vous ».
  [/\bVous seul pouvez\b/g, "Toi seul peux"],
  [/\bvous seul pouvez\b/g, "toi seul peux"],
  [/\bvous n'auriez\b/g, "tu n'aurais"],
  [/\bvous auriez\b/g, "tu aurais"],
  [/\bvous conserveriez\b/g, "tu conserverais"],
  [/\bVous conserveriez\b/g, "Tu conserverais"],
  [/\bvous creeriez\b/g, "tu creerais"],
  [/\bvous créeriez\b/g, "tu créerais"],
  [/\bvous gerez\b/g, "tu geres"],
  [/\bvous gérez\b/g, "tu gères"],
  [/\bVOUS GÉREZ\b/g, "TU GÈRES"],
  [/\bvous vendez\b/g, "tu vends"],
  [/\bvous parle\b/g, "te parle"],
  [/\bvous en resterait\b/g, "t'en resterait"],
  [/\bDonnez-moi\b/g, "Donne-moi"],
  [/\bDites-moi\b/g, "Dis-moi"],
  [/\bvous-même\b/g, "toi-même"],
  [/\bvous-meme\b/g, "toi-meme"],
  [/\bchez vous\b/g, "chez toi"],
  [/\bVOS STAGIAIRES\b/g, "TES STAGIAIRES"],
  [/\bvos stagiaires\b/g, "tes stagiaires"],
  [/\bvos vrais volumes\b/g, "tes vrais volumes"],
  [/\bvos conventions\b/g, "tes conventions"],
  [/\bvos émargements\b/g, "tes émargements"],
  [/\bvos attestations\b/g, "tes attestations"],
  [/\bvos propres formations\b/g, "tes propres formations"],
  [/\bvos équipes\b/g, "tes équipes"],
  [/\bvos couleurs\b/g, "tes couleurs"],
  [/\bvos documents\b/g, "tes documents"],
  [/\bVotre plateforme\b/g, "Ta plateforme"],
  [/\bvotre plateforme\b/g, "ta plateforme"],
  [/\bvotre nom\b/g, "ton nom"],
  [/\bvotre propre domaine\b/g, "ton propre domaine"],
  [/\bvotre logo\b/g, "ton logo"],
  [/\bvotre espace\b/g, "ton espace"],
  [/\bvotre fonctionnement\b/g, "ton fonctionnement"],
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

    let corps = data.corps;

    // Le prenom remplace le « Bonjour, » seul, quand il est fourni.
    if (destinataire) {
      corps = corps.replace(/^Bonjour,/, tu ? destinataire + "," : "Bonjour " + destinataire + ",");
    }

    if (tu) corps = tutoyer(corps);

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
