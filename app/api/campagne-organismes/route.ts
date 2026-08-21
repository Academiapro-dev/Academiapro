import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Campagne de prospection vers les organismes de formation.
//
// LE MARQUAGE PRECEDE TOUT. Chaque ligne passe a 'envoi_en_cours' AVANT
// l appel a Resend : si la route est relancee ou coupee, cette ligne ne
// sera jamais reprise. Un doublon d envoi grille un prospect et abime la
// reputation du domaine — c est la seule faute qui ne se rattrape pas.
//
// PROSPECTION B2B : licite sans consentement prealable si l offre concerne
// l activite professionnelle du destinataire, a condition qu un moyen de
// s opposer figure dans chaque message.

export const maxDuration = 300;

const EXPEDITEUR = "Jacques Lalou <jacques@contact-pro.academiapro.fr>";
const REPONSE = "contact@academiapro.fr";
const SITE = "https://academiapro.fr";

// LE LOT PAR DEFAUT COMMANDE LE CRON.
//
// Vercel appelle une adresse fixe : un cron ne peut pas porter de
// parametre. C est donc CETTE VALEUR qui decide du nombre d envois
// quotidiens, et c est ici qu on la monte quand la chauffe le permet.
//
// PALIERS : 5 par jour, puis 10, 20, 50. Modifier ce chiffre suffit.
const LOT_PAR_DEFAUT = 5;

// 🎯 PERSONNALISATION PAR SPECIALITE — ajoutee le 21/08.
//
// POURQUOI. Un message qui parle du destinataire se lit ; un message qui
// parle de nous se jette. Les organismes declarent leur specialite dans le
// fichier officiel, et cette donnee est en base (colonne specialite).
// On la relie ici aux domaines de NOTRE catalogue : un organisme
// informatique lit le nombre exact de formations Tech et IA que nous
// proposons, pas une phrase generale.
//
// ⚠️ LES LIBELLES OFFICIELS SONT LONGS ET FIGES (« Informatique,
// traitement de l information, reseaux de transmission des donnees »).
// On ne les recopie jamais dans le message : on repere un mot-cle et on
// ecrit une formule courte, lisible par un humain.
//
// ⚠️ TOUTE SPECIALITE NON RECONNUE tombe sur la phrase de repli. Les
// libelles « Formations generales » et « Autres... » n apprennent rien sur
// le metier : ils sont volontairement absents de cette table.
const CORRESPONDANCES: Array<{ cle: string; phrase: (n: (d: string) => number) => string }> = [
  {
    cle: "informatique",
    phrase: (n) => "Vous formez en informatique : notre catalogue compte "
      + n("Tech") + " formations techniques et " + n("IA")
      + " consacrees a l intelligence artificielle.",
  },
  {
    cle: "comportementales",
    phrase: (n) => "Vous formez aux competences comportementales : notre catalogue "
      + "compte " + n("Bien-etre") + " formations en developpement personnel et "
      + n("Psychologie") + " en psychologie appliquee.",
  },
  {
    cle: "commerce",
    phrase: (n) => "Vous formez au commerce et a la vente : notre catalogue compte "
      + n("Marketing") + " formations en marketing et vente et " + n("Business")
      + " en gestion d entreprise.",
  },
  {
    cle: "ressources humaines",
    phrase: (n) => "Vous formez aux ressources humaines : notre catalogue compte "
      + n("Ressources humaines") + " formations RH et " + n("Droit")
      + " en droit du travail et droit des affaires.",
  },
  {
    cle: "enseignement",
    phrase: (n) => "Vous formez des formateurs et des enseignants : notre catalogue "
      + "compte " + n("Psychologie") + " formations en psychologie de l apprentissage "
      + "et " + n("Outils") + " en outils numeriques pedagogiques.",
  },
  {
    cle: "sant",
    phrase: (n) => "Vous intervenez dans le secteur de la sante : notre catalogue "
      + "compte " + n("Bien-etre") + " formations en accompagnement et bien-etre et "
      + n("Psychologie") + " en psychologie.",
  },
  {
    cle: "transport",
    phrase: (n) => "Vous formez aux metiers du transport et de la logistique : notre "
      + "catalogue compte " + n("Securite") + " formations en securite au travail et "
      + n("Savoirs de base") + " en savoirs fondamentaux.",
  },
  {
    cle: "comptabilit",
    phrase: (n) => "Vous formez a la comptabilite et a la gestion : notre catalogue "
      + "compte " + n("Finance") + " formations en comptabilite, paie et fiscalite.",
  },
  {
    cle: "langues",
    phrase: (n) => "Vous formez aux langues : notre catalogue compte " + n("Langues")
      + " formations couvrant les six niveaux du cadre europeen, dans une vingtaine "
      + "de langues.",
  },
  {
    cle: "curit",
    phrase: (n) => "Vous formez a la securite : notre catalogue compte "
      + n("Securite") + " formations en prevention et securite au travail.",
  },
  {
    cle: "changes et de la gestion",
    phrase: (n) => "Vous formez aux metiers de la gestion : notre catalogue compte "
      + n("Business") + " formations en gestion d entreprise et " + n("Finance")
      + " en comptabilite et finance.",
  },
  {
    cle: "alimentation",
    phrase: (n) => "Vous formez aux metiers de l alimentation : notre catalogue compte "
      + n("Securite") + " formations en hygiene et securite et " + n("Business")
      + " en gestion d entreprise.",
  },
  {
    cle: "transformations industrielles",
    phrase: (n) => "Vous formez aux metiers industriels : notre catalogue compte "
      + n("Securite") + " formations en securite au travail et " + n("Tech")
      + " en technologies et numerique.",
  },
];

function clientAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "");
}

function pause(ms: number) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

function sansAccent(s: string): string {
  return String(s || "").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function jetonDesinscription(email: string): string {
  const secret = process.env.SESSION_SECRET
    || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return crypto.createHmac("sha256", secret)
    .update(email.toLowerCase()).digest("hex").slice(0, 32);
}

// La phrase de preuve. Personnalisee si la specialite est reconnue,
// generale sinon — mais TOUJOURS chiffree : c est le chiffre qui prouve,
// pas l adjectif.
function phrasePreuve(specialite: string, parDomaine: any, total: number): string {
  const n = function (domaine: string): number {
    return Number(parDomaine[domaine] || 0);
  };

  const cible = sansAccent(specialite);
  for (const c of CORRESPONDANCES) {
    if (cible.indexOf(c.cle) >= 0) {
      return c.phrase(n);
    }
  }

  return "Notre catalogue compte " + total + " formations reparties en quinze "
    + "domaines, des langues a l informatique, de la comptabilite a la securite "
    + "au travail.";
}

function corpsMessage(o: any, total: number, parDomaine: any) {
  const jeton = jetonDesinscription(String(o.email).toLowerCase());
  const lien = SITE + "/desinscription?email="
    + encodeURIComponent(String(o.email).toLowerCase())
    + "&jeton=" + jeton;

  const salutation = o.dirigeant_nom
    ? "Bonjour " + String(o.dirigeant_nom).trim() + ","
    : "Bonjour,";

  const texte =
    salutation + "\n\n"
    + "Je m'appelle Jacques Lalou, je dirige AcadéMIA Pro.\n\n"
    + "Vous êtes certifié Qualiopi. Vous savez donc que le bilan "
    + "pédagogique et financier n'est pas une formalité de fin d'année : "
    + "c'est le moment où l'on vérifie que tout ce qui a été fait pendant "
    + "douze mois se tient. Et qu'un dossier incomplet peut coûter la "
    + "certification.\n\n"
    + "Notre plateforme produit ces éléments au fil de l'eau. Le registre, "
    + "les présences, les évaluations, le suivi des stagiaires s'alimentent "
    + "à mesure que vos sessions se déroulent. Au moment du bilan, les "
    + "données sont là — vous vérifiez et vous signez.\n\n"
    + phrasePreuve(String(o.specialite || ""), parDomaine, total) + " "
    + "Vous pouvez les proposer sous votre propre nom, en marque blanche.\n\n"
    + "Si le sujet vous parle, répondez-moi simplement : je vous montre en "
    + "quinze minutes ce que ça donne sur un dossier réel.\n\n"
    + "Jacques Lalou\n"
    + "AcadéMIA Pro\n"
    + "academiapro.fr";

  const html = texte.replace(/\n/g, "<br/>")
    + "<br/><br/><hr/>"
    + "<p style=\"font-size:12px;color:#888\">"
    + "Ce message vous est adressé dans le cadre de votre activité "
    + "professionnelle d'organisme de formation. "
    + "<a href=\"" + lien + "\">Ne plus recevoir de messages</a>."
    + "</p>";

  return html;
}

async function envoyer(destinataire: string, sujet: string, html: string) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + (process.env.RESEND_API_KEY || ""),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EXPEDITEUR,
      reply_to: REPONSE,
      to: destinataire,
      subject: sujet,
      html: html,
    }),
  });

  const texte = await r.text();
  let data: any = null;
  try { data = texte ? JSON.parse(texte) : null; } catch { data = { brut: texte }; }

  return { ok: r.ok, statut: r.status, reponse: data };
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET
      || secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { erreur: "non autorise" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { erreur: "RESEND_API_KEY absente" }, { status: 500 });
  }

  const supabase = clientAdmin();

  const demande = Number(req.nextUrl.searchParams.get("lot") || LOT_PAR_DEFAUT);
  const lot = demande > 0 && demande <= 500 ? demande : LOT_PAR_DEFAUT;

  // Le catalogue se compte a chaque envoi : les chiffres du message
  // suivent la base, sans qu on ait a les tenir a jour ici.
  const { data: fiches } = await supabase
    .from("formations")
    .select("domaine")
    .eq("actif", true)
    .eq("type_objet", "formation")
    .limit(100000);

  const parDomaine: any = {};
  for (const f of fiches || []) {
    const d = String((f as any).domaine || "");
    parDomaine[d] = (parDomaine[d] || 0) + 1;
  }
  const totalFormations = (fiches || []).length;

  const { data: cibles, error: errLecture } = await supabase
    .from("prospects_organismes")
    .select("id, email, raison_sociale, dirigeant_nom, specialite")
    .eq("statut", "enrichi")
    .eq("desabonne", false)
    .not("email", "is", null)
    .order("id", { ascending: true })
    .limit(lot);

  if (errLecture) {
    return NextResponse.json(
      { erreur: errLecture.message }, { status: 500 });
  }

  if (!cibles || cibles.length === 0) {
    return NextResponse.json({ info: "aucun organisme a contacter" });
  }

  let envoyes = 0;
  let echecs = 0;
  let personnalises = 0;
  const details: any[] = [];

  for (const o of cibles) {
    // MARQUAGE AVANT ENVOI. Si la suite echoue, la ligne porte deja un
    // statut qui l exclut des prochaines lectures : mieux vaut un envoi
    // manque qu un envoi double.
    const { error: errMarque } = await supabase
      .from("prospects_organismes")
      .update({ statut: "envoi_en_cours" })
      .eq("id", o.id)
      .eq("statut", "enrichi");

    if (errMarque) {
      echecs++;
      continue;
    }

    const cible = sansAccent(String((o as any).specialite || ""));
    if (CORRESPONDANCES.some(function (c) { return cible.indexOf(c.cle) >= 0; })) {
      personnalises++;
    }

    const html = corpsMessage(o, totalFormations, parDomaine);
    const res = await envoyer(
      String(o.email),
      "Votre BPF de l'an prochain se prépare cette année",
      html);

    if (res.ok) {
      envoyes++;
      await supabase
        .from("prospects_organismes")
        .update({
          statut: "envoye",
          envoye_le: new Date().toISOString(),
          motif_echec: null,
        })
        .eq("id", o.id);
    } else {
      echecs++;
      await supabase
        .from("prospects_organismes")
        .update({
          statut: "echec",
          motif_echec: JSON.stringify(res.reponse).slice(0, 500),
        })
        .eq("id", o.id);
      if (details.length < 5) {
        details.push({ email: o.email, statut: res.statut, reponse: res.reponse });
      }
    }

    // Un envoi toutes les deux secondes : le rythme d une personne, pas
    // celui d une machine.
    await pause(2000);
  }

  const { count: restant } = await supabase
    .from("prospects_organismes")
    .select("id", { count: "exact", head: true })
    .eq("statut", "enrichi")
    .eq("desabonne", false)
    .not("email", "is", null);

  return NextResponse.json({
    envoyes: envoyes,
    echecs: echecs,
    personnalises: personnalises,
    formations_au_catalogue: totalFormations,
    reste_a_contacter: restant || 0,
    premiers_echecs: details,
  });
}
