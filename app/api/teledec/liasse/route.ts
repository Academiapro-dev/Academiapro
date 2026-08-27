import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";
import { lecture, dossiersAutorises } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 120;

// ---------------------------------------------------------------------------
// CREER UNE LIASSE CHEZ TELEDEC POUR UN DOSSIER REEL.
//
// 🚨 CE QUI MANQUAIT, ET QUI A ETE TROUVE LE 27/08.
//
// Tout le circuit TELEDEC existait — authentification, envoi d essai, retour
// DGFiP, depot du PDF, ecran de suivi — SAUF le geste qui compte : ouvrir la
// liasse d un dossier depuis l interface. Il n existait qu une route d essai
// reservee a Jacques, avec une societe fictive et une balance ecrite en dur,
// qui rendait une adresse a ouvrir A LA MAIN.
//
// C est cette ouverture a la main qui faisait apparaitre stage.teledec.fr
// dans la barre du navigateur — le seul reste de marque que Thomas Brethiot
// ne pouvait pas masquer de son cote. Sa reponse du 27/08 : l adresse doit
// etre chargee EN IFRAME dans mrcomptable.fr, et c est alors notre domaine
// qui s affiche.
//
// CETTE ROUTE NE FAIT QUE PREPARER. Elle rend une adresse ; c est l ecran
// /admin/comptable/liasse qui la charge en iframe.
//
// 🚨 LE MOT DE PASSE TELEDEC EST PROPRE A CHAQUE DOSSIER.
//
// TELEDEC ouvre une session avec ce mot de passe. Un mot de passe unique
// pour tous les dossiers les ferait donc TOUS entrer dans le meme compte —
// et un cabinet verrait les liasses d un autre.
//
// La valeur est une EMPREINTE BCRYPT, irreversible : elle ne permet de se
// connecter nulle part. Elle se cree a la premiere liasse, se range dans
// compta_societes.teledec_mdp, et ne change plus — c est ce qui reconnecte
// le dossier au lieu d en creer un nouveau a chaque fois.
//
// ⚠️ UN MOT DE PASSE EN CLAIR PROVOQUE UNE ERREUR 104 chez TELEDEC.
// ---------------------------------------------------------------------------

const URL_TOKEN = "https://auth.partners.teledec.fr/oauth2/token";
const URL_LIASSE = "https://stage.teledec.fr/service/liasse";

// #SOURCE est l IDENTIFIANT DU PARTENAIRE, attribue par TELEDEC et SENSIBLE
// A LA CASSE. Confirme par Thomas Brethiot le 13 aout 2026 : ACADEMIAPRO.
// C est lui qui declenche la marque blanche de leur cote.
const SOURCE = "ACADEMIAPRO";

// #EMAIL doit porter une adresse AUTORISEE POUR LE PARTENAIRE, sans quoi
// TELEDEC repond 403. Elle identifie le partenaire, pas le cabinet.
const EMAIL_PARTENAIRE = "contact@academiapro.fr";

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

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Le jeton partenaire vaut une heure. On le redemande a chaque liasse :
// une liasse se cree rarement, le gain d un cache serait nul.
async function jetonPartenaire(): Promise<string> {
  const id = process.env.TELEDEC_API || "";
  const secret = process.env.TELEDEC_MDP || "";
  if (!id || !secret) {
    throw new Error("TELEDEC_API ou TELEDEC_MDP absente des variables Vercel.");
  }

  const corps = new URLSearchParams();
  corps.set("grant_type", "client_credentials");

  const r = await fetch(URL_TOKEN, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic "
        + Buffer.from(id + ":" + secret).toString("base64"),
    },
    body: corps.toString(),
    cache: "no-store",
  });

  const brut = await r.text();
  if (!r.ok) {
    throw new Error("TELEDEC a refuse l authentification ("
      + r.status + ") : " + brut.slice(0, 300));
  }

  const d = JSON.parse(brut);
  if (!d.access_token) {
    throw new Error("Aucun access_token dans la reponse TELEDEC.");
  }
  return d.access_token;
}

// LE MOT DE PASSE DU DOSSIER, EN EMPREINTE BCRYPT.
//
// bcrypt n est pas dans les dependances du projet, et l ajouter pour cela
// seul serait disproportionne. On fabrique donc une empreinte au format
// bcrypt a partir d un aleatoire : TELEDEC ne verifie que la FORME et
// n a aucun mot de passe a comparer — il s en sert comme d une cle de
// session propre au dossier.
//
// ⚠️ CE N EST PAS UN MOT DE PASSE UTILISABLE. Personne ne peut s en servir
// pour se connecter ou que ce soit. C est un identifiant de session opaque.
const ALPHABET_BCRYPT =
  "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function empreinteBcrypt(): string {
  const octets = crypto.randomBytes(64);
  let sortie = "";
  for (let i = 0; i < 53; i = i + 1) {
    sortie += ALPHABET_BCRYPT.charAt(octets[i] % ALPHABET_BCRYPT.length);
  }
  return "$2a$12$" + sortie;
}

// Le mot de passe du dossier : lu s il existe, cree et range sinon.
async function motDePasseDuDossier(societeId: string,
  actuel: any): Promise<string> {
  const existant = String(actuel || "").trim();
  if (existant.length > 20 && existant.indexOf("$2") === 0) {
    return existant;
  }

  const neuf = empreinteBcrypt();

  // 🚨 ON L ECRIT AVANT DE S EN SERVIR. Si l ecriture echouait apres
  // l envoi, la liasse suivante emploierait une autre valeur et TELEDEC
  // creerait un second compte pour le meme dossier.
  const { error } = await supabase
    .from("compta_societes")
    .update({ teledec_mdp: neuf })
    .eq("id", societeId);

  if (error) {
    throw new Error("Impossible d enregistrer la cle TELEDEC du dossier : "
      + error.message);
  }

  return neuf;
}

// LA REFERENCE DU DOSSIER DE DECLARATION.
//
// C est elle que TELEDEC nous renverra dans le callback, et elle SEULE
// autorise l ecriture du retour. Elle doit donc etre imprevisible : un
// numero sequentiel se devine, et quiconque le devinerait pourrait ecrire
// un faux accuse de reception dans le dossier d un client.
function nouvelleReference(): string {
  return "AP-" + crypto.randomBytes(16).toString("hex");
}

function propre(v: any): string {
  return String(v === null || v === undefined ? "" : v)
    .replace(/[\r\n]/g, " ")
    .trim();
}

function jour(v: any): string {
  const t = String(v || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return "";
  return t.replace(/-/g, "");
}

// LA SECTION IDENTIFICATION, batie depuis le dossier reel.
//
// #AFFICHAGE-BOUTON-ENVOYER a NON : le cabinet relit la liasse dans son
// interface, mais la teletransmission reste un geste qu il declenche
// depuis chez nous. Un client qui enverrait lui-meme une liasse depuis un
// ecran incorpore n aurait aucune trace de son envoi de notre cote.
function identification(dossier: any, reference: string,
  urlCallback: string, motDePasse: string): string {

  const lignes: string[] = [
    "#SOURCE " + SOURCE,
    "#VERSION 1.0",
    "#EMAIL " + EMAIL_PARTENAIRE,
    "#MOT-DE-PASSE " + motDePasse,
    "#REFERENCE-DOSSIER " + reference,
    "#URL " + urlCallback,
    "#NOM " + propre(dossier.raison_sociale),
  ];

  if (propre(dossier.siret)) {
    lignes.push("#SIRET " + propre(dossier.siret).replace(/\D/g, ""));
  } else if (propre(dossier.siren)) {
    // TELEDEC accepte le SIREN seul quand le SIRET n est pas connu.
    lignes.push("#SIREN " + propre(dossier.siren).replace(/\D/g, ""));
  }

  if (propre(dossier.forme_juridique)) {
    lignes.push("#FORME-JURIDIQUE " + propre(dossier.forme_juridique));
  }
  if (propre(dossier.categorie_fiscale)) {
    lignes.push("#CATEGORIE-FISCALE " + propre(dossier.categorie_fiscale));
  }
  if (propre(dossier.regime_fiscal)) {
    lignes.push("#REEL-NORMAL-OU-SIMPLIFIE "
      + propre(dossier.regime_fiscal).toUpperCase());
  }

  if (jour(dossier.exercice_debut)) {
    lignes.push("#EXERCICE-DATE-DEBUT " + jour(dossier.exercice_debut));
  }
  if (jour(dossier.exercice_fin)) {
    lignes.push("#EXERCICE-DATE-FIN " + jour(dossier.exercice_fin));
  }

  if (propre(dossier.adresse)) {
    lignes.push("#ADRESSE-NUMERO-RUE " + propre(dossier.adresse));
  }
  if (propre(dossier.code_postal)) {
    lignes.push("#ADRESSE-CODE-POSTAL " + propre(dossier.code_postal));
  }
  if (propre(dossier.ville)) {
    lignes.push("#ADRESSE-VILLE " + propre(dossier.ville));
  }
  lignes.push("#ADRESSE-PAYS "
    + (propre(dossier.pays).toUpperCase() || "FR"));

  lignes.push("#AFFICHAGE-BOUTON-ENVOYER NON");

  return lignes.join("\n");
}

// LA SECTION BALANCE, au format attendu :
// numero;libelle;0;0;debit;credit;solde_debiteur;solde_crediteur
//
// Elle est batie depuis compta_ecritures, exactement comme l ecran Balance :
// un compte par ligne, sur l exercice du dossier.
function sectionBalance(comptes: any[]): string {
  return comptes.map(function (c: any) {
    return [
      c.numero,
      propre(c.libelle).replace(/;/g, " "),
      "0",
      "0",
      c.debit.toFixed(2),
      c.credit.toFixed(2),
      c.solde_debiteur.toFixed(2),
      c.solde_crediteur.toFixed(2),
    ].join(";");
  }).join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json(
        { ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const b = await req.json().catch(function () { return null; });
    const societeId = String((b && b.societe_id) || "").trim();

    if (!societeId) {
      return NextResponse.json(
        { ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

    // LE BARRAGE. Une liasse porte le resultat d une entreprise : seul le
    // cabinet qui tient ce dossier peut la creer.
    const autorises = await dossiersAutorises();
    if (autorises.indexOf(societeId) < 0) {
      return NextResponse.json(
        { ok: false, erreur: "Ce dossier ne vous est pas confie." },
        { status: 403 });
    }

    const refus = await lecture(societeId);
    if (refus) return refus;

    const { data: dossier } = await supabase
      .from("compta_societes")
      .select("*")
      .eq("id", societeId)
      .maybeSingle();

    if (!dossier) {
      return NextResponse.json(
        { ok: false, erreur: "Dossier introuvable." }, { status: 404 });
    }

    // ---- L EXERCICE ----
    const anneeDemandee = parseInt(String((b && b.annee) || ""), 10);

    let debut: string;
    let fin: string;

    if (anneeDemandee) {
      debut = anneeDemandee + "-01-01";
      fin = anneeDemandee + "-12-31";
    } else if (dossier.exercice_debut && dossier.exercice_fin) {
      debut = String(dossier.exercice_debut).slice(0, 10);
      fin = String(dossier.exercice_fin).slice(0, 10);
    } else {
      const a = new Date().getFullYear();
      debut = a + "-01-01";
      fin = a + "-12-31";
    }

    // ---- LA BALANCE, calculee comme dans l ecran Balance ----
    const { data: lignes, error: eLignes } = await supabase
      .from("compta_ecritures")
      .select("compte_num, compte_lib, debit, credit")
      .eq("societe_id", societeId)
      .gte("ecriture_date", debut)
      .lte("ecriture_date", fin)
      .limit(50000);

    if (eLignes) {
      return NextResponse.json(
        { ok: false, erreur: "Lecture des ecritures : " + eLignes.message },
        { status: 500 });
    }

    const mouvements = lignes || [];

    if (mouvements.length === 0) {
      return NextResponse.json({
        ok: false,
        erreur: "Aucune ecriture sur l exercice du "
          + debut + " au " + fin + ". Une liasse ne se cree pas sur un"
          + " dossier vide.",
      }, { status: 400 });
    }

    const parCompte: any = {};
    for (const l of mouvements) {
      const num = String(l.compte_num || "");
      if (!num) continue;
      if (!parCompte[num]) {
        parCompte[num] = { numero: num, libelle: l.compte_lib || "",
          debit: 0, credit: 0 };
      }
      parCompte[num].debit = r2(parCompte[num].debit + (Number(l.debit) || 0));
      parCompte[num].credit = r2(parCompte[num].credit + (Number(l.credit) || 0));
    }

    const comptes = Object.keys(parCompte).sort().map(function (num) {
      const c = parCompte[num];
      const solde = r2(c.debit - c.credit);
      return {
        ...c,
        solde_debiteur: solde > 0 ? solde : 0,
        solde_crediteur: solde < 0 ? r2(-solde) : 0,
      };
    });

    const totalDebit = r2(comptes.reduce(function (s: number, c: any) {
      return s + c.debit;
    }, 0));
    const totalCredit = r2(comptes.reduce(function (s: number, c: any) {
      return s + c.credit;
    }, 0));
    const ecart = r2(totalDebit - totalCredit);

    // 🚨 UNE BALANCE DESEQUILIBREE NE PART PAS. TELEDEC la refuserait, et
    // le rejet reviendrait une heure plus tard sans que le comptable
    // comprenne pourquoi. Autant le lui dire tout de suite.
    if (Math.abs(ecart) > 0.01) {
      return NextResponse.json({
        ok: false,
        erreur: "La balance n est pas equilibree : debit "
          + totalDebit.toFixed(2) + " contre credit "
          + totalCredit.toFixed(2) + ", ecart de " + ecart.toFixed(2)
          + ". Corrigez l ecart avant d etablir la liasse.",
        ecart: ecart,
      }, { status: 400 });
    }

    // ---- LA CLE DU DOSSIER CHEZ TELEDEC ----
    const motDePasse = await motDePasseDuDossier(societeId,
      dossier.teledec_mdp);

    // ---- L ENVOI ----
    const acces = await jetonPartenaire();
    const reference = nouvelleReference();

    // L adresse de retour doit etre PUBLIQUE et STABLE : c est la que la
    // DGFiP nous repondra, par l intermediaire de TELEDEC.
    const urlCallback = new URL("/api/teledec/callback", req.url).toString();

    // On enregistre AVANT d envoyer. Si le retour arrivait plus vite que
    // notre propre ecriture, le callback ne trouverait pas la reference et
    // refuserait un retour legitime.
    const { error: eLigne } = await supabase
      .from("teledec_declarations")
      .insert({
        tenant_id: session.tenantId || null,
        societe_id: societeId,
        reference: reference,
        siren: propre(dossier.siren) || null,
        nom_entreprise: propre(dossier.raison_sociale) || null,
        formulaire: "liasse",
        millesime: String(fin).slice(0, 4),
        periode_debut: debut,
        periode_fin: fin,
        statut: "creee",
      });

    if (eLigne) {
      return NextResponse.json(
        { ok: false, etape: "enregistrement", erreur: eLigne.message },
        { status: 500 });
    }

    const corps = identification(dossier, reference, urlCallback, motDePasse)
      + "\n" + sectionBalance(comptes) + "\n";

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
      // L envoi a echoue : la ligne posee plus haut n a plus d objet.
      await supabase
        .from("teledec_declarations")
        .delete()
        .eq("reference", reference);

      return NextResponse.json({
        ok: false,
        etape: "envoi de la liasse",
        statut: r.status,
        reponse: reponse.slice(0, 1200),
        rappel: r.status === 403
          ? "403 : l adresse du partenaire n est pas autorisee."
          : "Erreur 104 = le mot de passe n est pas au format bcrypt.",
      }, { status: 500 });
    }

    // La reponse contient l adresse temporaire de la liasse pre-creee.
    let url = reponse.trim();
    try {
      const j = JSON.parse(reponse);
      url = j.url || j.URL || j.lien || url;
    } catch (e) { /* la reponse est l adresse elle-meme */ }

    return NextResponse.json({
      ok: true,
      reference: reference,
      url: url,
      dossier: {
        id: societeId,
        code: dossier.code,
        raison_sociale: dossier.raison_sociale,
      },
      exercice: { debut: debut, fin: fin },
      balance: {
        comptes: comptes.length,
        lignes: mouvements.length,
        debit: totalDebit,
        credit: totalCredit,
      },
      message: "Liasse etablie pour " + propre(dossier.raison_sociale) + ".",
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, erreur: String(e.message || e) }, { status: 500 });
  }
}
