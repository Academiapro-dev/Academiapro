import { NextResponse } from "next/server";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const ADMINS = ["contact@academiapro.fr"];

const URL_TOKEN = "https://auth.partners.teledec.fr/oauth2/token";
const URL_LIASSE = "https://stage.teledec.fr/service/liasse";

// Le jeton vaut une heure. On le redemande a chaque essai : c est un
// verificateur, pas un chemin de production.
async function jeton(): Promise<string> {
  const id = process.env.TELEDEC_API || "";
  const secret = process.env.TELEDEC_MDP || "";
  if (!id || !secret) {
    throw new Error("TELEDEC_API ou TELEDEC_MDP absente des variables d environnement");
  }

  const corps = new URLSearchParams();
  corps.set("grant_type", "client_credentials");

  const r = await fetch(URL_TOKEN, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(id + ":" + secret).toString("base64"),
    },
    body: corps.toString(),
    cache: "no-store",
  });

  const brut = await r.text();
  if (!r.ok) throw new Error("Authentification refusee (" + r.status + ") : " + brut.slice(0, 300));

  const d = JSON.parse(brut);
  if (!d.access_token) throw new Error("Aucun access_token : " + brut.slice(0, 200));
  return d.access_token;
}

// SECTION IDENTIFICATION. Un seul champ est obligatoire, SOURCE. On en met
// davantage pour que TELEDEC ait de quoi creer l entreprise sans redemander.
// AFFICHAGE-BOUTON-ENVOYER a NON : le client peut relire sa liasse mais pas
// la teletransmettre lui-meme.
//
// #SOURCE est l IDENTIFIANT DU PARTENAIRE, sensible a la casse. Sur
// l environnement de stage, TELEDEC impose la valeur generique API : c est
// la seule cause de l erreur 101 rencontree le 05/08. Un identifiant dedie a
// AcademIA Pro sera attribue a la finalisation de l onboarding.
function identification(): string {
  const lignes = [
    "#SOURCE API",
    "#VERSION 1.0",
    "#NOM SOCIETE D ESSAI ACADEMIA",
    "#SIRET 12581251256423",
    "#FORME-JURIDIQUE SAS",
    "#CATEGORIE-FISCALE BIC-IS",
    "#REEL-NORMAL-OU-SIMPLIFIE SIMPLIFIE",
    "#EXERCICE-DATE-DEBUT 20250101",
    "#EXERCICE-DATE-FIN 20251231",
    "#PREMIER-EXERCICE NON",
    "#EXERCICE-PRECEDENT-DATE-DEBUT 20240101",
    "#EXERCICE-PRECEDENT-DATE-FIN 20241231",
    "#ADRESSE-NUMERO-RUE 1 rue de l Essai",
    "#ADRESSE-CODE-POSTAL 75003",
    "#ADRESSE-VILLE PARIS",
    "#ADRESSE-PAYS FR",
    "#ACTIVITE-PRINCIPALE Edition de logiciels",
    "#REPRESENTANT-LEGAL-CIVILITE M",
    "#REPRESENTANT-LEGAL-NOM LALOU",
    "#REPRESENTANT-LEGAL-QUALITE President",
    "#AFFICHAGE-BOUTON-ENVOYER NON",
  ];
  return lignes.join("\n");
}

// SECTION BALANCE, reprise de leur propre exemple : numero de compte,
// libelle, puis les colonnes de mouvements et de soldes, separes par des
// points-virgules.
function balance(): string {
  const lignes = [
    "1013;Capital souscrit - appele, verse;0;0;0.0;1500.0;0;1500.0",
    "275;Depots et cautionnements verses;0;0;1500.0;0.0;1500.0;0",
    "4081;Fournisseurs Factures non parvenues;0;0;0.0;236.33;0;236.33",
    "44566;TVA deductible sur autres biens et services;0;0;1546.0;1546.0;0.0;-0.0",
    "44567;Credit de TVA a reporter;0;0;961.0;72.0;889.0;0",
    "5121001;Banque;0;0;14059.48;11664.18;2395.3;0",
    "455000001;ASSOCIES CPTE COURANT;0;0;20.0;6905.16;0;6885.16",
    "604;Achats d etudes et prestations de services;0;0;306.81;0.0;306.81;0",
    "6226;Honoraires;0;0;1486.0;0.0;1486.0;0",
    "627;Services bancaires et assimiles;0;0;129.45;0.0;129.45;0",
    "6251;Voyages et deplacements;0;0;1.5;0.0;1.5;0",
    "706;Prestations de services;0;0;0.0;7286.94;0;7286.94",
  ];
  return lignes.join("\n");
}

export async function GET() {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const acces = await jeton();

    // LES TROIS SECTIONS SONT DANS UN SEUL CORPS DE REQUETE, a la suite :
    // identification, puis balance, puis le bloc JSON. On laisse le JSON
    // vide pour cet essai : on veut voir ce que TELEDEC ventile tout seul.
    const corps = identification() + "\n" + balance() + "\n";

    const r = await fetch(URL_LIASSE, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + acces,
        "Content-Type": "text/plain; charset=utf-8",
      },
      body: corps,
      cache: "no-store",
    });

    const reponse = await r.text();

    if (!r.ok) {
      return NextResponse.json(
        {
          ok: false,
          etape: "envoi de la liasse",
          statut: r.status,
          reponse: reponse.slice(0, 1500),
          rappel: "Un statut 500 renvoie un message d erreur technique de TELEDEC.",
        },
        { status: 500 },
      );
    }

    // La reponse contient l URL temporaire de la liasse pre-creee.
    let url = reponse.trim();
    try {
      const j = JSON.parse(reponse);
      url = j.url || j.URL || j.lien || url;
    } catch (e) {}

    return NextResponse.json({
      ok: true,
      message: "Liasse creee chez TELEDEC.",
      statut: r.status,
      url_de_la_liasse: url,
      reponse_brute: reponse.slice(0, 800),
      suite: "Ouvrez l URL ci-dessus : c est l ecran que verrait votre client, a integrer dans un cadre de votre site.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e.message || e) }, { status: 500 });
  }
}
