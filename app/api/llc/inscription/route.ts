import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// L INSCRIPTION DEPUIS LA LANDING PAGE LLC — 07/09.
//
// CE QU ELLE FAIT, DANS CET ORDRE :
//   1. Ecrit la ligne dans `prospects_llc`
//   2. Envoie le recapitulatif des echeances a l adresse donnee
//
// 🚨 L ECRITURE PRECEDE L ENVOI. Si Resend echoue, l adresse est deja en
// base et Jacques peut la relancer a la main. Envoyer d abord ferait perdre
// le prospect a la moindre panne.
//
// 🚨 L ECHEC DE L ENVOI NE FAIT PAS ECHOUER LA ROUTE. Le visiteur a rempli
// son formulaire ; lui afficher une erreur alors que son adresse est
// enregistree le ferait recommencer, et la seconde tentative se heurterait
// a l index unique. La route repond 200 avec `courriel: false`, que Jacques
// peut lire dans les journaux Vercel.
//
// ⚠️ UNE ADRESSE DEJA CONNUE NE PRODUIT PAS D ERREUR. L index unique sur
// lower(email) refuserait la seconde insertion : on fait un `upsert` sur
// cette contrainte, et on renvoie le recapitulatif quand meme — quelqu un
// qui redemande veut le relire.
//
// 🚨 LES ECHEANCES SONT ECRITES ICI, PAS LUES DANS `compliance_rules`.
// C EST UN CHOIX, ET IL A UN COUT : deux endroits a modifier quand une
// regle change. La raison : `compliance_rules` porte les regles telles que
// l outil les applique a une societe connue, avec des champs que cette
// route n a pas (date de constitution, residence du membre). Reprendre la
// table sans cette structure produirait des echeances fausses pour un
// prospect dont on ne sait presque rien.
// ⚠️ SI UNE REGLE CHANGE DANS `compliance_rules`, LA REPORTER ICI.
//
// ⛔ NE JAMAIS ECRIRE QUE LA PLATEFORME DEPOSE. Le courriel dit que les
// formulaires sortent pre-remplis et que le membre depose lui-meme, ou fait
// deposer par qui il veut. Aucun texte americain n impose de passer par un
// professionnel.
// ---------------------------------------------------------------------------

export const maxDuration = 60;

const EXPEDITEUR = "MysterLLC <contact@contact-pro.mysterllc.com>";
const REPONSE = "contact@mysterllc.com";
const SITE = "https://www.mysterllc.com";

function clientAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "");
}

function jetonDesinscription(email: string): string {
  const secret = process.env.SESSION_SECRET
    || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return crypto.createHmac("sha256", secret)
    .update(email.toLowerCase()).digest("hex").slice(0, 32);
}

// ─────────────────────────────────────────────────────────────────────
// LES OBLIGATIONS D ETAT.
//
// 🚨 CETTE LISTE DOIT RESTER IDENTIQUE A CELLE DU FORMULAIRE
// app/mysterllc/llc/Formulaire.tsx. Un Etat propose a l ecran mais absent
// d ici donnerait un courriel sans aucune echeance d Etat, en silence.
// ─────────────────────────────────────────────────────────────────────
const ETATS: any = {
  WY: {
    nom: "Wyoming",
    lignes: [
      "Rapport annuel — le 1er du mois anniversaire de la constitution, "
      + "60 USD au minimum.",
      "Agent enregistré dans l'État — obligatoire toute l'année.",
    ],
  },
  DE: {
    nom: "Delaware",
    lignes: [
      "Taxe annuelle — 1er juin, 300 USD. Elle est due même si la société "
      + "n'a eu aucune activité.",
      "Dépôt tardif : 200 USD de pénalité, plus 1,5 % par mois de retard.",
      "Les LLC du Delaware ne déposent pas de rapport annuel : seule la "
      + "taxe est due.",
    ],
  },
  NM: {
    nom: "Nouveau-Mexique",
    lignes: [
      "Ni rapport annuel, ni taxe de franchise.",
      "Agent enregistré dans l'État — la seule obligation d'État.",
    ],
  },
  NV: {
    nom: "Nevada",
    lignes: [
      "Liste annuelle des gérants — dernier jour du mois anniversaire, "
      + "150 USD.",
      "Licence d'activité de l'État — même échéance, 200 USD.",
      "Coût réel : 350 USD par an, les deux étant dus ensemble.",
    ],
  },
  FL: {
    nom: "Floride",
    lignes: [
      "Rapport annuel — 1er mai, 138,75 USD, en ligne uniquement.",
      "Pénalité de 400 USD dès le 2 mai, sans aucun abattement possible.",
      "Dissolution administrative au quatrième vendredi de septembre.",
    ],
  },
  TX: {
    nom: "Texas",
    lignes: [
      "Public Information Report — 15 mai, même si aucune taxe n'est due.",
      "Pénalité de 50 USD, y compris pour un rapport à zéro.",
      "Le Texas est le seul État où l'oubli fait tomber la protection de "
      + "responsabilité limitée.",
      "Extension possible au 15 novembre par le formulaire 05-164.",
    ],
  },
  MT: {
    nom: "Montana",
    lignes: [
      "Rapport annuel — 15 avril, en ligne uniquement.",
      "Frais de dépôt à zéro jusqu'en 2027 : cette dispense est à "
      + "revérifier auprès de l'État avant le 1er janvier 2028.",
    ],
  },
  AUTRE: {
    nom: "votre État",
    lignes: [
      "Les obligations d'État varient d'un État à l'autre : ni les dates, "
      + "ni les montants, ni ce qui arrive en cas d'oubli.",
      "Dites-nous lequel vous concerne et nous vous indiquons ce qui "
      + "s'y applique.",
    ],
  },
};

// LES OBLIGATIONS FEDERALES ET FRANCAISES — les mêmes pour tous.
const FEDERAL = [
  "Form 5472, accompagné d'un 1120 pro forma — 15 avril. La pénalité est "
  + "de 25 000 USD par société et par an en cas de dépôt tardif ou omis, "
  + "que la société ait eu une activité ou non.",
  "Form 7004 — il reporte le dépôt au 15 octobre, mais il doit lui-même "
  + "partir avant le 15 avril. Déposé après, il ne vaut plus rien.",
];

const FRANCE = [
  "CERFA 3916 (n° 11916*13), article 1649 A du CGI — chaque compte détenu "
  + "à l'étranger se déclare avec la déclaration de revenus, y compris "
  + "celui de la LLC.",
  "1 500 € d'amende par compte non déclaré et par an. Le délai de reprise "
  + "de l'administration passe à dix ans.",
  "La déclaration elle-même se saisit sur impots.gouv.fr.",
];

function bloc(titre: string, lignes: string[]): string {
  const items = lignes.map(function (l) {
    return "<li style=\"margin-bottom:9px;line-height:1.75\">" + l + "</li>";
  }).join("");

  return "<p style=\"margin:26px 0 10px;color:#a07840;font-weight:bold\">"
    + titre + "</p>"
    + "<ul style=\"margin:0;padding-left:20px;color:#333;font-size:15px\">"
    + items + "</ul>";
}

function recapitulatif(email: string, etat: string,
                       aDejaUne: boolean): string {
  const e = ETATS[etat] || null;
  const jeton = jetonDesinscription(email);
  const lien = SITE + "/desinscription?email="
    + encodeURIComponent(email) + "&jeton=" + jeton;

  let corps =
    "<p style=\"font-size:15px;line-height:1.8;color:#333\">Bonjour,</p>";

  if (aDejaUne && e) {
    corps +=
      "<p style=\"font-size:15px;line-height:1.8;color:#333\">"
      + "Voici les échéances qui s'appliquent à une LLC constituée "
      + "en " + e.nom + " et détenue depuis la France.</p>";
  } else {
    corps +=
      "<p style=\"font-size:15px;line-height:1.8;color:#333\">"
      + "Voici ce qui attend une LLC détenue depuis la France, quel que "
      + "soit l'État de constitution — plus les obligations propres à "
      + "chaque État, que nous vous détaillerons dès que vous saurez "
      + "lequel vous choisissez.</p>";
  }

  corps += bloc("Aux États-Unis, au niveau fédéral", FEDERAL);

  if (aDejaUne && e) {
    corps += bloc("Dans l'État de constitution — " + e.nom, e.lignes);
  }

  corps += bloc("En France, pour un résident fiscal français", FRANCE);

  corps +=
    "<p style=\"margin:30px 0 10px;color:#a07840;font-weight:bold\">"
    + "Ce que fait MysterLLC</p>"
    + "<p style=\"font-size:15px;line-height:1.8;color:#333\">"
    + "L'agenda se remplit à partir de l'État, de la date de constitution "
    + "et de la résidence du membre. Les formulaires officiels sortent "
    + "pré-remplis : vous les relisez, vous les signez, et vous les déposez "
    + "vous-même — ou vous les confiez à qui vous voulez. Vous êtes prévenu "
    + "avant chaque échéance, selon des rappels que vous armez société par "
    + "société.</p>"
    + "<p style=\"font-size:15px;line-height:1.8;color:#333\">"
    + "Chacune des règles ci-dessus est rattachée dans l'outil à sa source "
    + "officielle et à la date à laquelle elle a été vérifiée. Vous pouvez "
    + "la contrôler.</p>"
    + "<p style=\"font-size:15px;line-height:1.8;color:#333\">"
    + "Si vous voulez voir ce que cela donne sur votre situation, "
    + "répondez simplement à ce message.</p>";

  corps +=
    "<p style=\"margin:28px 0 0;font-size:15px;line-height:1.6;color:#333\">"
    + "Jacques Lalou<br/>"
    + "Fondateur — MysterLLC<br/>"
    + "<a href=\"" + SITE + "\" style=\"color:#a07840\">mysterllc.com</a>"
    + "</p>";

  corps +=
    "<hr style=\"margin-top:26px\"/>"
    + "<p style=\"font-size:12px;color:#888;line-height:1.6\">"
    + "Vous recevez ce message parce que vous avez demandé ce récapitulatif "
    + "sur mysterllc.com. Il présente des règles publiques et ne constitue "
    + "pas un conseil fiscal. "
    + "<a href=\"" + lien + "\">Ne plus recevoir de messages</a>."
    + "</p>";

  return corps;
}

export async function POST(req: NextRequest) {
  let entree: any = null;
  try {
    entree = await req.json();
  } catch {
    return NextResponse.json({ erreur: "requête illisible" }, { status: 400 });
  }

  // LE PIEGE A ROBOTS. Le champ est invisible a l ecran : rempli, c est un
  // automate. On repond 200 pour ne rien lui apprendre, et on n ecrit rien.
  if (String(entree?.societe || "").trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const email = String(entree?.email || "").trim().toLowerCase();
  if (!email.includes("@") || email.length < 6 || email.length > 200) {
    return NextResponse.json(
      { erreur: "adresse invalide" }, { status: 400 });
  }

  const aDejaUne = entree?.a_deja_une_llc === true;
  const etatBrut = String(entree?.etat || "").trim().toUpperCase();
  const etat = ETATS[etatBrut] ? etatBrut : "";

  if (aDejaUne && etat === "") {
    return NextResponse.json(
      { erreur: "État inconnu" }, { status: 400 });
  }

  // ⚠️ QUI N A PAS DE LLC N A PAS D ETAT. L ecran vide deja le champ, mais
  // un appel direct a l adresse pourrait envoyer les deux : on enregistre
  // alors un Etat de constitution pour une societe qui n existe pas.
  const etatRetenu = aDejaUne ? etat : "";

  const supabase = clientAdmin();

  // 🚨 UPSERT SUR L INDEX UNIQUE. Une adresse deja connue met sa ligne a
  // jour au lieu de lever une erreur : quelqu un qui redemande le
  // recapitulatif doit le recevoir, pas voir un message d echec.
  const { error: errEcriture } = await supabase
    .from("prospects_llc")
    .upsert({
      email: email,
      etat: etatRetenu || null,
      a_deja_une_llc: aDejaUne,
      origine: String(entree?.origine || "landing-llc").slice(0, 60),
      statut: "nouveau",
    }, { onConflict: "email" });

  if (errEcriture) {
    return NextResponse.json(
      { erreur: "enregistrement impossible" }, { status: 500 });
  }

  // L ENVOI. Son echec ne fait pas echouer la route : l adresse est deja
  // en base.
  let courrielParti = false;

  if (process.env.RESEND_API_KEY) {
    try {
      // ⚠️ « AUTRE » N EST PAS UN NOM D ETAT. Le sujet « Vos échéances —
      // LLC votre État » se lirait comme un publipostage rate : on retombe
      // sur le sujet generique.
      const sujet = aDejaUne && etatRetenu !== "" && etatRetenu !== "AUTRE"
        ? "Vos échéances — LLC " + ETATS[etatRetenu].nom
        : "Ce qui attend une LLC détenue depuis la France";

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + process.env.RESEND_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: EXPEDITEUR,
          reply_to: REPONSE,
          to: email,
          subject: sujet,
          html: recapitulatif(email, etatRetenu, aDejaUne),
        }),
      });

      courrielParti = r.ok;

      if (!r.ok) {
        const texte = await r.text();
        await supabase
          .from("prospects_llc")
          .update({ motif_echec: texte.slice(0, 500) })
          .eq("email", email);
      } else {
        await supabase
          .from("prospects_llc")
          .update({
            statut: "envoye",
            envoye_le: new Date().toISOString(),
            vague_envoi: 1,
            nb_envois: 1,
            motif_echec: null,
          })
          .eq("email", email);
      }
    } catch {
      courrielParti = false;
    }
  }

  return NextResponse.json({ ok: true, courriel: courrielParti });
}
