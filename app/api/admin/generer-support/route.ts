import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "formations-pdf";
const MODELE = "claude-sonnet-4-6";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// 🗺️ LA CARTE REELLE DE LA PLATEFORME — ajoutee le 17/08.
//
// POURQUOI ELLE EXISTE. Le support de F900, le manuel d'utilisation
// d'AcadeMIA Pro, decrivait les actions en termes vagues : « il accede a la
// section de la plateforme qui lui permet de... », « repérage des menus
// principaux ». Aucun nom d'ecran, aucun chemin, aucun bouton. Le modele ne
// connait pas la plateforme : il brode ce qu'il imagine d'un LMS.
//
// Un manuel d'utilisation qui ne nomme pas les ecrans est inutilisable — et
// c'est celui que Jacques montrera en demonstration.
//
// CETTE CARTE EST LA LISTE EXACTE DES ECRANS, relevee dans app/organisme et
// app/lms. Le modele ne peut plus inventer un chemin : il a la liste.
//
// ⚠️ ELLE N'EST INJECTEE QUE POUR LES FORMATIONS QUI PARLENT DE LA
// PLATEFORME ELLE-MEME (F900 et suivantes). Les 331 formations du catalogue
// portent sur d'autres sujets et n'en ont aucun besoin.
//
// 🚨 A TENIR A JOUR : si un ecran est ajoute, renomme ou retire dans
// app/organisme, cette carte doit suivre. Un manuel qui decrit un ecran
// disparu est pire qu'un manuel vague.
const CARTE_PLATEFORME =
  "\n🗺️ CARTE REELLE DE LA PLATEFORME ACADEMIA PRO — NOMME LES ECRANS PAR " +
  "CES NOMS EXACTS ET PAR AUCUN AUTRE. N'invente jamais un ecran, un onglet " +
  "ou un bouton qui ne figure pas ici.\n\n" +

  "COTE APPRENANT (le stagiaire) :\n" +
  "  /connexion — page de connexion, l'apprenant saisit son adresse et son mot de passe\n" +
  "  /mon-espace — ses formations, sa progression, ses documents\n" +
  "  /lms — le lecteur de formation : chapitres, modules, contenu du cours\n" +
  "  /evaluation — les questionnaires de fin de module et leur correction expliquee\n" +
  "  /mes-certificats — ses attestations de fin de formation, a telecharger\n" +
  "  /classe-virtuelle — les seances en direct avec le formateur\n" +
  "  /dashboard — l'assistant conversationnel, qui repond a ses questions sur le cours\n\n" +

  "COTE ORGANISME (l'espace du client, sous /organisme) :\n" +
  "  /organisme — l'accueil de l'espace, avec les portes vers toutes les sections\n" +
  "  /organisme/catalogue — les formations ouvertes a ses stagiaires ; c'est ici qu'il " +
  "choisit celles qu'il diffuse et fixe son prix de vente\n" +
  "  /organisme/stagiaires — la liste de ses stagiaires, leur inscription, leur progression\n" +
  "  /organisme/importer — l'import d'une liste de stagiaires en nombre\n" +
  "  /organisme/documents — les documents administratifs edites a son en-tete : " +
  "conventions, convocations, feuilles d'emargement, attestations\n" +
  "  /organisme/signatures — la signature electronique des documents et son archivage\n" +
  "  /organisme/evaluations — les evaluations a chaud et a froid de ses stagiaires\n" +
  "  /organisme/positionnements — les tests de positionnement en entree de formation\n" +
  "  /organisme/reclamations — le registre des reclamations et leurs actions correctives\n" +
  "  /organisme/formateurs — les dossiers de ses formateurs et leurs habilitations\n" +
  "  /organisme/veille — ses registres de veille : legale, metier, pedagogique, handicap\n" +
  "  /organisme/soustraitance — le suivi de ses sous-traitants\n" +
  "  /organisme/bilan — la preparation de son bilan pedagogique et financier annuel\n" +
  "  /organisme/seances — les seances de classe virtuelle qu'il programme\n" +
  "  /organisme/crm — le suivi commercial : ses prospects, leurs etapes, leur score\n" +
  "  /organisme/relances — les relances commerciales a envoyer\n" +
  "  /organisme/portail — sa page publique, ou ses formations sont presentees a ses prospects\n" +
  "  /organisme/factures — les factures qu'il emet a ses propres clients\n" +
  "  /organisme/facturation — ce qu'il doit a l'editeur : abonnement, part, redevance\n" +
  "  /organisme/financement — les dossiers de financement de ses stagiaires\n" +
  "  /organisme/amelioration — son registre d'amelioration continue\n\n" +

  "LA MARQUE BLANCHE : le logo, les couleurs et l'identite de l'organisme se " +
  "posent depuis l'accueil de son espace, /organisme. Une fois poses, ils " +
  "apparaissent partout : sur la plateforme que voient ses stagiaires, sur sa " +
  "page publique, et sur tous les documents qu'il edite. Le stagiaire ne voit " +
  "jamais le nom AcadeMIA Pro.\n";

function echapper(t: string): string {
  return String(t || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// "8h", "120h", "250h - 10 mois" -> 8, 120, 250. Zero si illisible.
function heuresDe(duree: any): number {
  const m = String(duree || "").replace(",", ".").match(/[\d.]+/);
  if (!m) return 0;
  const n = Number(m[0]);
  return n > 0 ? n : 0;
}

// UN MODULE TOUTES LES DEUX HEURES, plancher 4, plafond 20.
// N est utilise QUE SI AUCUN PLAN N EXISTE dans lms_plans.
function moduleDe(heures: number): { mini: number; maxi: number } {
  if (heures <= 0) return { mini: 10, maxi: 16 };
  const cible = Math.round(heures / 2);
  const n = Math.max(4, Math.min(20, cible));
  return { mini: n, maxi: n };
}

function renseigne(v: any): boolean {
  return typeof v === "string" && v.trim().length > 20;
}

// La formation porte-t-elle sur la plateforme elle-meme ? Seules celles-la
// recoivent la carte des ecrans.
function parleDeLaPlateforme(fiche: any): boolean {
  const code = String(fiche.code || "").toUpperCase();
  if (code === "F900") return true;
  const titre = String(fiche.titre || "").toLowerCase();
  return titre.indexOf("academia pro") >= 0 || titre.indexOf("académia pro") >= 0;
}

export async function GET(req: Request) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const cle = process.env.ANTHROPIC_API_KEY || "";
    if (!cle) {
      return NextResponse.json({ ok: false, erreur: "ANTHROPIC_API_KEY absente" }, { status: 500 });
    }

    const url = new URL(req.url);
    const demande = (url.searchParams.get("code") || "").trim().toUpperCase();
    // FORCE : ecrase le support existant au lieu de le refuser.
    const force = url.searchParams.get("force") === "1";

    const { data: fichiers } = await supabase.storage
      .from(BUCKET)
      .list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });
    const existants = new Set((fichiers || []).map((f) => f.name));

    // LA FICHE FAIT FOI QUAND ELLE EST RENSEIGNEE.
    const { data: formations } = await supabase
      .from("formations")
      .select("code, titre, domaine, niveau, prix, duree, description, programme, objectifs, prerequis, public_cible")
      .order("code", { ascending: true });

    const candidates = (formations || []).filter(
      (f: any) =>
        String(f.code || "").indexOf("SK") !== 0 &&
        !existants.has(f.code + "_support_cours.html")
    );

    const fiche: any = demande
      ? (formations || []).find((f: any) => f.code === demande)
      : candidates[0];

    if (!fiche) {
      return NextResponse.json({ ok: true, termine: true, restants: 0, message: "aucune formation sans support" });
    }

    if (!force && existants.has(fiche.code + "_support_cours.html")) {
      return NextResponse.json({ ok: true, code: fiche.code, deja: true, restants: candidates.length });
    }

    // 🚨🚨 LE PLAN DE lms_plans PREVAUT SUR TOUT — ajoute le 17/08.
    //
    // F900 avait recu un plan complet en base : cinq chapitres, vingt
    // modules, dont UN CHAPITRE ENTIER consacre a la marque blanche. Cette
    // route ne lisait que formations.programme, vide pour F900 — le modele a
    // donc invente ses propres modules.
    //
    // LE RESULTAT ETAIT INUTILISABLE, ET DANGEREUX : la marque blanche avait
    // DISPARU, et trois modules inventes s'intitulaient « Creer une formation
    // dans votre catalogue ». Le manuel aurait APPRIS AU CLIENT A PRODUIRE
    // SES PROPRES FORMATIONS — exactement ce que Jacques a fait retirer de
    // tous ses documents le jour meme.
    //
    // ORDRE DE PRIORITE : lms_plans, puis formations.programme, puis
    // redaction libre avec le nombre de modules calcule sur la duree.
    const { data: lignesPlan } = await supabase
      .from("lms_plans")
      .select("chapitre_num, chapitre_titre, module_num, module_titre, type")
      .eq("formation_code", fiche.code)
      .order("chapitre_num", { ascending: true })
      .order("module_num", { ascending: true })
      .limit(500);

    const plan = lignesPlan || [];
    const aPlan = plan.length > 0;

    let texteDuPlan = "";
    let chapitreCourant = -1;
    for (const l of plan) {
      if (l.chapitre_num !== chapitreCourant) {
        chapitreCourant = l.chapitre_num;
        texteDuPlan += "\nCHAPITRE " + l.chapitre_num + " - " + String(l.chapitre_titre || "").trim() + "\n";
      }
      texteDuPlan += "  Module " + l.chapitre_num + "." + l.module_num + " - "
        + String(l.module_titre || "").trim()
        + " [" + String(l.type || "theorie") + "]\n";
    }

    const nbModulesPlan = plan.length;
    const nbChapitresPlan = new Set(plan.map(function (l: any) { return l.chapitre_num; })).size;

    const heures = heuresDe(fiche.duree);
    const bornes = aPlan
      ? { mini: nbModulesPlan, maxi: nbModulesPlan }
      : moduleDe(heures);
    const combien = bornes.mini === bornes.maxi
      ? "exactement " + bornes.mini + " modules"
      : bornes.mini + " a " + bornes.maxi + " modules";
    const parModule = heures > 0 && bornes.maxi > 0
      ? Math.max(1, Math.round(heures / bornes.maxi))
      : 0;

    // Ce que la fiche impose. Chaque bloc n apparait que s il est renseigne.
    let impose = "";
    if (renseigne(fiche.description)) {
      impose += "\nCE QUE LA FORMATION EST (a respecter) :\n" + fiche.description + "\n";
    }
    if (renseigne(fiche.objectifs)) {
      impose += "\nOBJECTIFS IMPOSES (reprends-les, reformule sans les trahir) :\n" + fiche.objectifs + "\n";
    }
    if (renseigne(fiche.public_cible)) {
      impose += "\nPUBLIC IMPOSE :\n" + fiche.public_cible + "\n";
    }
    if (renseigne(fiche.prerequis)) {
      impose += "\nPREREQUIS IMPOSES :\n" + fiche.prerequis + "\n";
    }

    if (aPlan) {
      impose += "\n🚨 PLAN OFFICIEL DE LA FORMATION — C'EST CE PLAN, ET LUI SEUL, "
        + "QUI DOIT ETRE SUIVI.\n"
        + "Il compte " + nbChapitresPlan + " chapitres et " + nbModulesPlan + " modules. "
        + "Tu reprends CHAQUE module dans cet ordre, avec SON INTITULE EXACT. "
        + "Tu n'en ajoutes aucun, tu n'en retires aucun, tu n'en renommes aucun. "
        + "Ta seule liberte est de rediger les deux a quatre lignes qui decrivent "
        + "le contenu de chaque module.\n"
        + texteDuPlan;
    } else if (renseigne(fiche.programme)) {
      impose += "\nPROGRAMME IMPOSE — c est CE decoupage qu il faut suivre, "
        + "module par module, en gardant les intitules et les notions citees. "
        + "Tu peux etoffer la description de chaque module, tu ne peux ni en "
        + "ajouter, ni en retirer, ni remplacer les notions par d autres :\n"
        + fiche.programme + "\n";
    }

    // LA CARTE DES ECRANS, pour les formations qui portent sur la plateforme.
    const surLaPlateforme = parleDeLaPlateforme(fiche);
    if (surLaPlateforme) {
      impose += CARTE_PLATEFORME;
    }

    const aProgramme = aPlan || renseigne(fiche.programme);

    const invite =
      "Tu rediges le support de cours officiel d un organisme de formation professionnelle francais.\n\n" +
      "Formation : " + fiche.titre + "\n" +
      "Domaine : " + (fiche.domaine || "non precise") + "\n" +
      "Niveau : " + (fiche.niveau || "non precise") + "\n" +
      (heures > 0 ? "Duree totale : " + heures + " heures.\n" : "") +
      impose +
      "\nProduis un document structure en francais comprenant, dans cet ordre :\n" +
      "1. OBJECTIFS DE LA FORMATION : un paragraphe de 5 a 8 lignes.\n" +
      "2. PREREQUIS : 3 a 5 lignes.\n" +
      "3. PUBLIC CIBLE : 3 a 5 lignes.\n" +
      "4. COMPETENCES VISEES : 6 a 10 puces.\n" +
      "5. PROGRAMME : " + combien + ". Chaque module sur une ligne au format exact :\n" +
      "Module N - Titre du module (XXh)\n" +
      "suivi de 2 a 4 lignes decrivant son contenu.\n" +
      (aPlan
        ? "Les modules sont numerotes de 1 a " + nbModulesPlan + " en continu, "
          + "dans l'ordre du plan ci-dessus, et tu conserves les intitules a "
          + "l'identique.\n"
        : "") +
      "6. MODALITES D EVALUATION : un paragraphe.\n\n" +
      "Regles imperatives :\n" +
      (aPlan
        ? "- LE PLAN OFFICIEL CI-DESSUS EST LA SEULE SOURCE DU PROGRAMME. "
          + "Toute invention de module, tout intitule modifie, toute omission "
          + "rend le document inutilisable : il decrirait une formation qui "
          + "n'existe pas.\n"
        : "") +
      (surLaPlateforme
        ? "- 🚨 CETTE FORMATION PORTE SUR LA PLATEFORME ELLE-MEME. C'EST UN "
          + "MANUEL D'UTILISATION, PAS UN COURS THEORIQUE. Chaque description "
          + "de module DOIT NOMMER L'ECRAN CONCERNE tel qu'il figure dans la "
          + "carte ci-dessus, et decrire l'action concrete que l'utilisateur y "
          + "accomplit. Ecris « depuis l'ecran Stagiaires de son espace, il "
          + "clique sur Ajouter un stagiaire » et non « il accede a la section "
          + "qui lui permet de gerer ses apprenants ». UNE DESCRIPTION VAGUE "
          + "REND LE MANUEL INUTILISABLE.\n"
          + "- N'invente AUCUN ecran, AUCUN onglet, AUCUN bouton absent de la "
          + "carte. Si une action n'a pas d'ecran dedie dans la carte, decris-la "
          + "depuis l'ecran le plus proche qui y figure.\n"
        : "") +
      (impose
        ? "- CE QUI EST IMPOSE CI-DESSUS PREVAUT SUR TOUT LE RESTE. N invente "
          + "aucune fonctionnalite, aucun ecran, aucune notion qui n y figure pas.\n"
        : "") +
      (aProgramme
        ? "- Le programme impose donne les modules : suis-le dans son ordre, "
          + "sans en ajouter ni en supprimer.\n"
        : "") +
      (heures > 0
        ? "- LE NOMBRE DE MODULES EST IMPOSE : " + combien + ", ni plus ni moins.\n" +
          "- LE TOTAL DES HEURES DES MODULES DOIT FAIRE EXACTEMENT " + heures + " HEURES" +
          (parModule > 0 ? ", soit environ " + parModule + " heures par module" : "") + ".\n"
        : "- Le total des heures doit etre coherent avec le niveau annonce.\n") +
      "- Nomme les choses comme l utilisateur les voit a l ecran, jamais en "
      + "jargon technique.\n" +
      "- N invente AUCUNE certification, aucun titre RNCP, aucun label, aucun organisme tiers.\n" +
      "- N indique AUCUN prix.\n" +
      "- Pas de promesse de resultat ni de garantie chiffree.\n" +
      "- Ecris en texte brut, sans balises HTML, sans Markdown, sans introduction ni conclusion sur toi-meme.";

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cle,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELE,
        max_tokens: 8000,
        messages: [{ role: "user", content: invite }],
      }),
    });

    const reponse = await r.json();
    if (!r.ok) {
      return NextResponse.json(
        { ok: false, code: fiche.code, erreur: "Claude a repondu " + r.status },
        { status: 500 }
      );
    }

    const texte = (reponse.content || [])
      .map((b: any) => (b && b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();

    if (texte.length < 1500) {
      return NextResponse.json(
        { ok: false, code: fiche.code, erreur: "reponse trop courte (" + texte.length + " caracteres)" },
        { status: 500 }
      );
    }

    const corps = texte
      .split(/\n{2,}/)
      .map((p) => "<p>" + echapper(p).replace(/\n/g, "<br>") + "</p>")
      .join("\n");

    const html =
      '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">\n' +
      "<title>" + echapper(fiche.titre) + " \u2014 Acad\u00e9mIA Pro</title>\n" +
      "<style>body{font-family:Georgia,serif;max-width:900px;margin:0 auto;padding:30px;background:#fff;color:#1a1a1a;line-height:1.7;} h1{color:#c8a96e;} p{margin:0 0 14px;}</style>\n" +
      "</head><body>\n" +
      "<h1>Acad\u00e9mIA Pro</h1>\n" +
      "<p>Support de cours officiel \u2014 Document confidentiel</p>\n" +
      "<h1>" + echapper(fiche.titre) + "</h1>\n" +
      "<p><strong>Code :</strong> " + echapper(fiche.code) +
      " | <strong>Domaine :</strong> " + echapper(fiche.domaine || "") +
      " | <strong>Niveau :</strong> " + echapper(fiche.niveau || "") +
      (heures > 0 ? " | <strong>Dur\u00e9e :</strong> " + heures + " h" : "") + "</p>\n" +
      corps +
      "\n</body></html>";

    const ecriture = await supabase.storage
      .from(BUCKET)
      .upload(fiche.code + "_support_cours.html", new Blob([html], { type: "text/html" }), {
        upsert: force,
        cacheControl: "60",
      });

    if (ecriture.error) {
      return NextResponse.json({ ok: false, code: fiche.code, erreur: ecriture.error.message }, { status: 500 });
    }

    await supabase.from("supports_inventaire").upsert(
      {
        fichier: fiche.code + "_support_cours.html",
        code_fichier: fiche.code,
        titre_interne: fiche.titre,
        titre_fiche: fiche.titre,
        statut: "conforme",
        taille: html.length,
        bavardage: false,
        sections: 6,
        risque: "",
        extrait: texte.slice(0, 300),
        vu_le: new Date().toISOString(),
      },
      { onConflict: "fichier" }
    );

    return NextResponse.json({
      ok: true,
      code: fiche.code,
      titre: fiche.titre,
      heures: heures,
      plan_suivi: aPlan,
      carte_injectee: surLaPlateforme,
      modules_du_plan: aPlan ? nbModulesPlan : null,
      chapitres_du_plan: aPlan ? nbChapitresPlan : null,
      modules_demandes: bornes.maxi,
      fiche_suivie: impose ? true : false,
      programme_impose: aProgramme,
      force: force,
      taille: html.length,
      restants: Math.max(candidates.length - 1, 0),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
