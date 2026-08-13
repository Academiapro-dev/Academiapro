import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Enrichit les tables de prospects depuis l annuaire des entreprises de
// l Etat. API publique, gratuite, sans cle.
//
// UNE SEULE ROUTE POUR TOUTES LES CIBLES, ET ELLE ENCHAINE SEULE. Sans
// parametre, elle prend la premiere table qui a encore des lignes a
// traiter, dans l ordre ci-dessous. Le cron appelle toujours la meme
// adresse : rien a surveiller, rien a changer entre deux campagnes.
//
// CE QU ELLE APPORTE : le nom du dirigeant. L API ne donne PAS le site
// web — verifie le 13 aout, le champ n existe nulle part dans sa reponse.
//
// Le statut passe de 'a_enrichir' a 'enrichi' ou 'introuvable'. Une ligne
// deja traitee ne repasse jamais.

export const maxDuration = 300;

const URL_API = "https://recherche-entreprises.api.gouv.fr/search";

// L ordre compte : c est celui dans lequel les campagnes partiront.
const TABLES: Record<string, string> = {
  organismes: "prospects_organismes",
  qualiopi: "prospects_qualiopi",
  interim: "prospects_interim",
  cabinets: "prospects_cabinets",
};

const ORDRE = ["organismes", "qualiopi", "interim", "cabinets"];

function clientAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "");
}

function pause(ms: number) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

// Le dirigeant : on prend la premiere personne physique de la liste.
function trouverDirigeant(entreprise: any) {
  const liste = entreprise?.dirigeants || [];
  for (const d of liste) {
    const prenom = d?.prenoms || d?.prenom || "";
    const nom = d?.nom || d?.nom_complet || "";
    if (prenom || nom) {
      return {
        prenom: String(prenom).trim().split(" ")[0] || null,
        nom: String(nom).trim() || null,
      };
    }
  }
  return { prenom: null, nom: null };
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET
      || secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { erreur: "non autorise" }, { status: 401 });
  }

  const supabase = clientAdmin();

  const demandee = req.nextUrl.searchParams.get("table");

  // Table imposee : on la traite, meme si elle est vide.
  // Sans parametre : on cherche la premiere qui a du travail.
  let cle: string | null = null;

  if (demandee) {
    if (!TABLES[demandee]) {
      return NextResponse.json(
        { erreur: "table inconnue", tables_possibles: ORDRE },
        { status: 400 });
    }
    cle = demandee;
  } else {
    for (const candidate of ORDRE) {
      const { count } = await supabase
        .from(TABLES[candidate])
        .select("id", { count: "exact", head: true })
        .eq("statut", "a_enrichir");
      if ((count || 0) > 0) {
        cle = candidate;
        break;
      }
    }
  }

  if (!cle) {
    return NextResponse.json({
      info: "toutes les tables sont enrichies",
      tables: ORDRE,
    });
  }

  const table = TABLES[cle];

  const demande = Number(req.nextUrl.searchParams.get("limite") || 500);
  const limite = demande > 0 && demande <= 2000 ? demande : 500;

  const { data: lignes, error: errLecture } = await supabase
    .from(table)
    .select("id, siren, raison_sociale, dirigeant_nom")
    .eq("statut", "a_enrichir")
    .not("siren", "is", null)
    .order("id", { ascending: true })
    .limit(limite);

  if (errLecture) {
    return NextResponse.json(
      { erreur: errLecture.message, table: table }, { status: 500 });
  }

  if (!lignes || lignes.length === 0) {
    return NextResponse.json({ info: "plus rien a enrichir", table: table });
  }

  let avecDirigeant = 0;
  let deja = 0;
  let introuvables = 0;
  let erreurs = 0;

  for (const ligne of lignes) {
    // CERTAINES LIGNES PORTENT DEJA LEUR DIRIGEANT. Le fichier SIRENE le
    // donne pour les personnes physiques : inutile d appeler l API pour
    // elles, on marque et on passe.
    if (ligne.dirigeant_nom && String(ligne.dirigeant_nom).trim() !== "") {
      deja++;
      await supabase
        .from(table)
        .update({ statut: "enrichi" })
        .eq("id", ligne.id);
      continue;
    }

    try {
      const r = await fetch(
        URL_API + "?q=" + encodeURIComponent(String(ligne.siren))
        + "&page=1&per_page=1",
        { cache: "no-store" });

      if (!r.ok) {
        erreurs++;
        await pause(200);
        continue;
      }

      const donnees = await r.json();
      const entreprise = donnees?.results?.[0];

      if (!entreprise) {
        introuvables++;
        await supabase
          .from(table)
          .update({ statut: "introuvable" })
          .eq("id", ligne.id);
        await pause(150);
        continue;
      }

      const dirigeant = trouverDirigeant(entreprise);
      if (dirigeant.nom) avecDirigeant++;

      await supabase
        .from(table)
        .update({
          dirigeant_prenom: dirigeant.prenom,
          dirigeant_nom: dirigeant.nom,
          statut: "enrichi",
        })
        .eq("id", ligne.id);

      await pause(150);
    } catch (e) {
      erreurs++;
      await pause(200);
    }
  }

  const { count: restant } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("statut", "a_enrichir");

  return NextResponse.json({
    table: table,
    traites: lignes.length,
    deja_renseignes: deja,
    avec_dirigeant: avecDirigeant,
    introuvables: introuvables,
    erreurs: erreurs,
    reste_dans_cette_table: restant || 0,
  });
}
