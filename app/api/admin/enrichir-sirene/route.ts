import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ADMINS = ["contact@academiapro.fr"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// L ANNUAIRE OFFICIEL DES ENTREPRISES — API de l Etat, gratuite, sans cle.
//
// CE QU ELLE APPORTE ET QUE LE FICHIER DES ORGANISMES DE FORMATION N A PAS :
//   - LE DIRIGEANT (nom, prenoms). Sans lui, Dropcontact REFUSE le fichier :
//     il ne trouve pas des societes, il trouve des PERSONNES dans des
//     societes. C est le verrou qui bloquait l enrichissement du 21/08.
//   - L ADRESSE complete du siege, absente sur la moitie des lignes.
//   - est_organisme_formation et est_qualiopi, deux confirmations
//     OFFICIELLES. Le fichier de la DGEFP dit qu une societe est declaree ;
//     celui-ci dit si elle l est encore aujourd hui.
//
// ⚠️ POURQUOI PAS DE SCRAPING. La donnee est publique et servie par une
// porte d entree prevue pour cela. Scraper serait plus lent, plus fragile,
// et exposerait a un blocage — pour un resultat identique.
const API = "https://recherche-entreprises.api.gouv.fr/search?q=";

// 🚨 LE PLAFOND DE VERCEL EST DE 300 SECONDES, ET IL EST BRUTAL : au-dela,
// la fonction est COUPEE, sans reponse ni trace. On s arrete donc a 240
// pour garder de la marge, et surtout ON ECRIT AU FIL DE L EAU — chaque
// ligne traitee est enregistree immediatement. Une coupure ne perd rien :
// il suffit de rappeler la route, elle reprend ou elle s est arretee.
const SECONDES_MAX = 240;

// L API n annonce pas publiquement sa limite. Une pause de 120 ms tient un
// rythme d environ huit appels par seconde, ce qui reste courtois pour un
// service public gratuit. En 240 secondes : environ 1 900 SIREN.
const PAUSE_MS = 120;

function pause(ms: number) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

// Le premier dirigeant PERSONNE PHYSIQUE.
//
// ⚠️ NE PAS PRENDRE LE PREMIER DE LA LISTE SANS REGARDER : une societe est
// souvent dirigee par une autre societe (type_dirigeant = personne morale).
// Dropcontact a besoin d un ETRE HUMAIN, pas d une holding.
//
// Les prenoms arrivent parfois en rafale — « BRUNO YVES BERNARD ». On garde
// LE PREMIER : c est celui d usage, et c est lui qui figure dans une
// adresse electronique professionnelle.
function dirigeantDe(liste: any): { prenom: string | null; nom: string | null } {
  if (!Array.isArray(liste)) return { prenom: null, nom: null };
  for (const d of liste) {
    if (!d || d.type_dirigeant !== "personne physique") continue;
    const nom = String(d.nom || "").trim();
    if (!nom) continue;
    const prenoms = String(d.prenoms || "").trim().split(/\s+/);
    return { prenom: prenoms[0] || null, nom: nom };
  }
  return { prenom: null, nom: null };
}

function propre(v: any, max: number): string | null {
  const t = String(v === null || v === undefined ? "" : v).trim();
  if (!t) return null;
  return t.slice(0, max);
}

// L adresse du siege arrive en un seul bloc — « 102 TERRASSE BOIELDIEU
// 92800 PUTEAUX ». On garde la voie seule : le code postal et la ville
// sont deja servis a part, et les repeter troublerait Dropcontact.
function voieDe(siege: any): string | null {
  if (!siege) return null;
  const morceaux = [siege.numero_voie, siege.type_voie, siege.libelle_voie]
    .map(function (x: any) { return String(x || "").trim(); })
    .filter(Boolean);
  if (morceaux.length === 0) return propre(siege.adresse, 200);
  return propre(morceaux.join(" "), 200);
}

async function interroger(siren: string): Promise<any> {
  const r = await fetch(API + encodeURIComponent(siren), {
    headers: { "Accept": "application/json" },
    cache: "no-store",
  });
  if (!r.ok) return null;
  const d = await r.json();
  const liste = d && d.results;
  if (!Array.isArray(liste) || liste.length === 0) return null;
  return liste[0];
}

export async function GET(req: NextRequest) {
  const debut = Date.now();

  try {
    const email = emailDeSession();
    const secret = req.nextUrl.searchParams.get("secret");
    const parCron = !!process.env.CRON_SECRET && secret === process.env.CRON_SECRET;

    if (!parCron && (!email || ADMINS.indexOf(email) < 0)) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const demande = Number(req.nextUrl.searchParams.get("lot") || 2000);
    const lot = demande > 0 && demande <= 5000 ? demande : 2000;

    // ON NE REPREND QUE CE QUI N A PAS ETE FAIT. La colonne notes porte la
    // trace du passage : une ligne deja vue ne repart pas.
    const { data: cibles, error } = await supabase
      .from("prospects_gros")
      .select("id, siren, raison_sociale")
      .not("siren", "is", null)
      .is("dirigeant_nom", null)
      .is("sirene_le", null)
      .order("nb_stagiaires", { ascending: false })
      .limit(lot);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    if (!cibles || cibles.length === 0) {
      return NextResponse.json({ ok: true, info: "plus aucune ligne a enrichir" });
    }

    let vus = 0;
    let avecDirigeant = 0;
    let avecAdresse = 0;
    let confirmesOf = 0;
    let introuvables = 0;
    const exemples: any[] = [];

    for (const c of cibles) {
      // L ARRET EST VOLONTAIRE ET PROPRE. Tout ce qui precede est deja
      // enregistre ; la reponse dit ou l on s est arrete.
      if ((Date.now() - debut) / 1000 > SECONDES_MAX) break;

      vus++;

      let e: any = null;
      try {
        e = await interroger(String(c.siren));
      } catch (err) {
        e = null;
      }

      if (!e) {
        introuvables++;
        // On marque quand meme le passage : sans cela, la ligne
        // reviendrait a chaque appel et bloquerait la progression.
        await supabase
          .from("prospects_gros")
          .update({ sirene_le: new Date().toISOString() })
          .eq("id", c.id);
        await pause(PAUSE_MS);
        continue;
      }

      const dir = dirigeantDe(e.dirigeants);
      const siege = e.siege || {};
      const comp = e.complements || {};

      const champs: any = { sirene_le: new Date().toISOString() };

      if (dir.nom) {
        champs.dirigeant_nom = propre(dir.nom, 120);
        champs.dirigeant_prenom = propre(dir.prenom, 120);
        avecDirigeant++;
      }

      const voie = voieDe(siege);
      if (voie) {
        champs.adresse = voie;
        champs.code_postal = propre(siege.code_postal, 10);
        champs.ville = propre(siege.libelle_commune, 120);
        avecAdresse++;
      }

      // LA CONFIRMATION OFFICIELLE, ET C EST ELLE QUI VAUT DE L OR : le
      // fichier de la DGEFP dit qu une societe A ETE declaree ; celui-ci
      // dit si elle l est ENCORE. Une societe qui repond false ici a cesse
      // son activite de formation — inutile de la prospecter.
      if (comp.est_organisme_formation === true) confirmesOf++;
      champs.of_confirme = comp.est_organisme_formation === true;
      if (comp.est_qualiopi === true) champs.qualiopi = "Oui";

      if (e.tranche_effectif_salarie) {
        champs.tranche_effectif = propre(e.tranche_effectif_salarie, 10);
      }

      await supabase.from("prospects_gros").update(champs).eq("id", c.id);

      if (exemples.length < 5 && dir.nom) {
        exemples.push({
          societe: c.raison_sociale,
          dirigeant: (dir.prenom || "") + " " + dir.nom,
          ville: champs.ville || null,
        });
      }

      await pause(PAUSE_MS);
    }

    const { count: restant } = await supabase
      .from("prospects_gros")
      .select("id", { count: "exact", head: true })
      .not("siren", "is", null)
      .is("dirigeant_nom", null)
      .is("sirene_le", null);

    return NextResponse.json({
      ok: true,
      traites: vus,
      avec_dirigeant: avecDirigeant,
      avec_adresse: avecAdresse,
      confirmes_organisme_formation: confirmesOf,
      introuvables: introuvables,
      reste_a_traiter: restant || 0,
      secondes: Math.round((Date.now() - debut) / 1000),
      exemples: exemples,
    });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      erreur: String(e),
      secondes: Math.round((Date.now() - debut) / 1000),
    }, { status: 500 });
  }
}
