import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Campagne de prospection vers les CABINETS D EXPERTISE COMPTABLE.
//
// 🚨🚨 CETTE ROUTE N EST PAS DECLAREE DANS vercel.json — 24/08.
// Elle existe, elle est testable a la main, mais AUCUN CRON NE L APPELLE.
// Rien ne part tant qu on n a pas ajoute la ligne d appel programme.
// C est voulu : le fichier est pret d avance, l envoi attend la decision.
//
// LE MARQUAGE PRECEDE TOUT. Chaque ligne passe a 'envoi_en_cours' AVANT
// l appel a Resend : si la route est relancee ou coupee, cette ligne ne
// sera jamais reprise. Un doublon d envoi grille un prospect et abime la
// reputation du domaine — c est la seule faute qui ne se rattrape pas.
//
// PROSPECTION B2B : licite sans consentement prealable si l offre concerne
// l activite professionnelle du destinataire, a condition qu un moyen de
// s opposer figure dans chaque message.
//
// LA FACTURE ELECTRONIQUE EST ANNONCEE — decision de Jacques du 24/08,
// prise apres objection et maintenue. Deux plateformes agreees sont en
// discussion avancee, l accord est acquis des deux cotes.
//
// PAS D IMAGE : premier contact a froid, le rapport texte/image est un des
// signaux que pesent les filtres. La signature decoree viendra plus tard.

export const maxDuration = 300;

// L EXPEDITEUR EST LE SOUS-DOMAINE DE PROSPECTION, jamais mrcomptable.fr
// lui-meme : le domaine principal porte le transactionnel (liens de
// connexion, factures, relances clients). Une reputation abimee par la
// prospection empecherait un cabinet de recevoir son lien de connexion.
const EXPEDITEUR = "Jacques Lalou <jacques@contact-pro.mrcomptable.fr>";
const REPONSE = "contact@mrcomptable.fr";
const SITE = "https://mrcomptable.fr";

// PALIERS : 5 par jour, puis 10, 20, 50. Modifier ce chiffre suffit.
// Le domaine contact-pro.mrcomptable.fr n a JAMAIS envoye : on demarre bas.
const LOT_PAR_DEFAUT = 5;

function clientAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "");
}

function pause(ms: number) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

function jetonDesinscription(email: string): string {
  const secret = process.env.SESSION_SECRET
    || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return crypto.createHmac("sha256", secret)
    .update(email.toLowerCase()).digest("hex").slice(0, 32);
}

// La table porte le prenom et le nom dans DEUX colonnes distinctes, a la
// difference de prospects_organismes. On s en sert pour une salutation
// naturelle, et on retombe sur « Bonjour, » si l une des deux manque.
function salutationDe(o: any): string {
  const prenom = String(o.dirigeant_prenom || "").trim();
  const nom = String(o.dirigeant_nom || "").trim();
  if (prenom && nom) return "Bonjour " + prenom + " " + nom + ",";
  if (nom) return "Bonjour " + nom + ",";
  return "Bonjour,";
}

function corpsMessage(o: any) {
  const jeton = jetonDesinscription(String(o.email).toLowerCase());
  const lien = SITE + "/desinscription?email="
    + encodeURIComponent(String(o.email).toLowerCase())
    + "&jeton=" + jeton;

  const texte =
    salutationDe(o) + "\n\n"
    + "Je m'appelle Jacques Lalou, je dirige Mr. Comptable, un logiciel de "
    + "comptabilité pour cabinets.\n\n"
    + "Une question simple : combien d'heures votre équipe passe-t-elle "
    + "chaque mois à réclamer des justificatifs ? Les écritures sans pièce, "
    + "les mêmes clients, les mêmes courriels écrits à la main. Et la "
    + "semaine perdue en fin d'exercice à courir après douze mois de "
    + "factures.\n\n"
    + "Mr. Comptable inverse la charge. Chaque mois, il repère les écritures "
    + "sans pièce, dossier par dossier, et écrit lui-même au client — avec "
    + "la liste exacte de ce qui manque et un lien pour déposer, sans compte "
    + "à créer. Le collaborateur ne relance plus : il regarde ce qui est "
    + "rentré.\n\n"
    + "La facture électronique est prise en charge. Les factures au format "
    + "Factur-X sont lues dans leur fichier structuré : le fournisseur, la "
    + "date, le montant hors taxes et la TVA sont repris tels qu'ils y "
    + "figurent, sans ressaisie. Et vos factures sortent au même format.\n\n"
    + "Le reste suit la même logique. Tenue, lettrage, rapprochement "
    + "bancaire, déclarations et liasse, facturation de vos honoraires et "
    + "prévisionnel de trésorerie sur douze semaines. Un seul prix, sans "
    + "module en supplément, sans engagement de durée.\n\n"
    + "Si le sujet vous parle, répondez-moi simplement : je vous montre en "
    + "quinze minutes ce que ça donne sur un dossier réel.";

  const signature =
    "<br/><br/>"
    + "<p style=\"margin:0;line-height:1.5\">"
    + "Jacques Lalou<br/>"
    + "Fondateur — Mr. Comptable<br/>"
    + "<a href=\"" + SITE + "\" style=\"color:#8a6d3b\">mrcomptable.fr</a>"
    + "</p>";

  const html = texte.replace(/\n/g, "<br/>")
    + signature
    + "<br/><hr/>"
    + "<p style=\"font-size:12px;color:#888\">"
    + "Ce message vous est adressé dans le cadre de votre activité "
    + "professionnelle d'expertise comptable. "
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

  // MODE MESURE : ?compter=1 ne lit que la reserve et n envoie RIEN.
  // A utiliser avant toute mise en route pour savoir combien de cabinets
  // portent une adresse exploitable.
  if (req.nextUrl.searchParams.get("compter") === "1") {
    const { count: prets } = await supabase
      .from("prospects_cabinets")
      .select("id", { count: "exact", head: true })
      .eq("statut", "enrichi")
      .eq("desabonne", false)
      .not("email", "is", null);

    const { count: total } = await supabase
      .from("prospects_cabinets")
      .select("id", { count: "exact", head: true });

    return NextResponse.json({
      mode: "mesure, aucun envoi",
      total_cabinets: total || 0,
      prets_a_contacter: prets || 0,
    });
  }

  const demande = Number(req.nextUrl.searchParams.get("lot") || LOT_PAR_DEFAUT);
  const lot = demande > 0 && demande <= 500 ? demande : LOT_PAR_DEFAUT;

  const { data: cibles, error: errLecture } = await supabase
    .from("prospects_cabinets")
    .select("id, email, raison_sociale, dirigeant_prenom, dirigeant_nom")
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
    return NextResponse.json({ info: "aucun cabinet a contacter" });
  }

  let envoyes = 0;
  let echecs = 0;
  const details: any[] = [];

  for (const o of cibles) {
    // MARQUAGE AVANT ENVOI. Si la suite echoue, la ligne porte deja un
    // statut qui l exclut des prochaines lectures : mieux vaut un envoi
    // manque qu un envoi double.
    const { error: errMarque } = await supabase
      .from("prospects_cabinets")
      .update({ statut: "envoi_en_cours" })
      .eq("id", o.id)
      .eq("statut", "enrichi");

    if (errMarque) {
      echecs++;
      continue;
    }

    const html = corpsMessage(o);
    const res = await envoyer(
      String(o.email),
      "La corvee que personne ne facture",
      html);

    if (res.ok) {
      envoyes++;
      await supabase
        .from("prospects_cabinets")
        .update({
          statut: "envoye",
          envoye_le: new Date().toISOString(),
          motif_echec: null,
        })
        .eq("id", o.id);
    } else {
      echecs++;
      await supabase
        .from("prospects_cabinets")
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
    .from("prospects_cabinets")
    .select("id", { count: "exact", head: true })
    .eq("statut", "enrichi")
    .eq("desabonne", false)
    .not("email", "is", null);

  return NextResponse.json({
    envoyes: envoyes,
    echecs: echecs,
    reste_a_contacter: restant || 0,
    premiers_echecs: details,
  });
}
