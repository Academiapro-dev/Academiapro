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
// LE DOMAINE D ENVOI est un sous-domaine dedie : une campagne mal notee
// ne touche pas les courriels que les clients attendent.
//
// PROSPECTION B2B : licite sans consentement prealable si l offre concerne
// l activite professionnelle du destinataire, a condition qu un moyen de
// s opposer figure dans chaque message. D ou le lien de desinscription,
// signe pour qu un tiers ne puisse pas desinscrire quelqu un d autre.

export const maxDuration = 300;

const EXPEDITEUR = "Jacques Lalou <jacques@contact-pro.academiapro.fr>";
const REPONSE = "contact@academiapro.fr";
const SITE = "https://academiapro.fr";

function clientAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "");
}

function pause(ms: number) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

// Le meme calcul que la route de desinscription : sans le secret du site,
// le lien n est pas fabricable.
function jetonDesinscription(email: string): string {
  const secret = process.env.SESSION_SECRET
    || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return crypto.createHmac("sha256", secret)
    .update(email.toLowerCase()).digest("hex").slice(0, 32);
}

function corpsMessage(o: any, nbFormations: number) {
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
    + "Elle donne aussi accès à un catalogue de " + nbFormations
    + " formations que vous pouvez proposer sous votre propre nom, en "
    + "marque blanche.\n\n"
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

  // Le lot reste petit par defaut : un domaine neuf qui envoie trop vite
  // se fait classer indesirable, et cela ne se repare pas.
  const demande = Number(req.nextUrl.searchParams.get("lot") || 50);
  const lot = demande > 0 && demande <= 500 ? demande : 50;

  const { count: nbFormations } = await supabase
    .from("formations")
    .select("code", { count: "exact", head: true })
    .eq("actif", true);

  const { data: cibles, error: errLecture } = await supabase
    .from("prospects_organismes")
    .select("id, email, raison_sociale, dirigeant_nom")
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

    const html = corpsMessage(o, nbFormations || 0);
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
    reste_a_contacter: restant || 0,
    premiers_echecs: details,
  });
}
