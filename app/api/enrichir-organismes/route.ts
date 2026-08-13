import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Enrichit prospects_organismes depuis l annuaire des entreprises de l Etat.
// API publique, gratuite, sans cle : recherche-entreprises.api.gouv.fr
//
// CE QU ELLE APPORTE : le nom du dirigeant, et le site web quand il est
// declare. Ces deux elements sont ce que Dropcontact exige pour deduire
// une adresse electronique. Sans eux, son taux s effondre.
//
// L API limite le debit : on espace les appels. Un lot de 500 prend
// environ 75 secondes.
//
// Le statut passe de 'a_enrichir' a 'enrichi' ou 'introuvable'. Une ligne
// deja traitee ne repasse jamais.

export const maxDuration = 300;

const URL_API = "https://recherche-entreprises.api.gouv.fr/search";

function clientAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "");
}

function pause(ms: number) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

// Cherche partout ou le site web pourrait se trouver dans la reponse :
// la structure exacte n est pas garantie et peut evoluer.
function trouverSite(entreprise: any): string | null {
  const candidats = [
    entreprise?.complements?.site_internet,
    entreprise?.site_internet,
    entreprise?.siege?.site_internet,
    entreprise?.complements?.web,
  ];
  for (const c of candidats) {
    if (c && typeof c === "string" && c.trim() !== "") {
      return c.trim();
    }
  }
  return null;
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

  const demande = Number(req.nextUrl.searchParams.get("limite") || 500);
  const limite = demande > 0 && demande <= 2000 ? demande : 500;

  const { data: lignes, error: errLecture } = await supabase
    .from("prospects_organismes")
    .select("id, siren, raison_sociale")
    .eq("statut", "a_enrichir")
    .not("siren", "is", null)
    .order("id", { ascending: true })
    .limit(limite);

  if (errLecture) {
    return NextResponse.json(
      { erreur: errLecture.message }, { status: 500 });
  }

  if (!lignes || lignes.length === 0) {
    return NextResponse.json({ info: "plus rien a enrichir" });
  }

  let avecDirigeant = 0;
  let avecSite = 0;
  let introuvables = 0;
  let erreurs = 0;
  const echantillon: any[] = [];

  for (const ligne of lignes) {
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
          .from("prospects_organismes")
          .update({ statut: "introuvable" })
          .eq("id", ligne.id);
        await pause(150);
        continue;
      }

      const dirigeant = trouverDirigeant(entreprise);
      const site = trouverSite(entreprise);

      if (dirigeant.nom) avecDirigeant++;
      if (site) avecSite++;

      // Les cinq premieres reponses sont renvoyees telles quelles :
      // c est ainsi qu on verifie ce que l API donne vraiment, plutot
      // que de le supposer.
      if (echantillon.length < 5) {
        echantillon.push({
          raison_sociale: ligne.raison_sociale,
          dirigeant: dirigeant,
          site: site,
          cles_disponibles: Object.keys(entreprise || {}),
          cles_complements: Object.keys(entreprise?.complements || {}),
        });
      }

      await supabase
        .from("prospects_organismes")
        .update({
          dirigeant_prenom: dirigeant.prenom,
          dirigeant_nom: dirigeant.nom,
          site_web: site,
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
    .from("prospects_organismes")
    .select("id", { count: "exact", head: true })
    .eq("statut", "a_enrichir");

  return NextResponse.json({
    traites: lignes.length,
    avec_dirigeant: avecDirigeant,
    avec_site_web: avecSite,
    introuvables: introuvables,
    erreurs: erreurs,
    reste_a_enrichir: restant || 0,
    echantillon: echantillon,
  });
}
