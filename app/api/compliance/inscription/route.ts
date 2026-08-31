import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { numeroTvaDepuisSiren, sirenDe } from "../../../../lib/tva";
import { limiter, ipDe } from "../../../../lib/limiteur";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

const PROFILS = ["vend_formations", "forme_salaries", "devenir_of", "cabinet_comptable"];

// 🚨 LIMITE DE DEBIT — 31/08. CETTE ROUTE EST PUBLIQUE ET ELLE CREE BEAUCOUP.
//
// LE DEFAUT. Aucune session n est exigee ici — c est normal, on s inscrit
// avant d avoir un compte. Mais AUCUN COMPTEUR ne bornait les appels, alors
// qu un seul appel reussi cree QUATRE CHOSES : un compte dans Supabase Auth,
// un organisme (tenant), et pour un cabinet un dossier comptable plus une
// fiche de collaborateur portant TOUS LES DROITS.
//
// CE QU UN SCRIPT POUVAIT FAIRE EN QUELQUES MINUTES : des milliers de
// comptes et de tenants fantomes. Consequences concretes — le quota Supabase
// Auth consomme, la table organismes_formation noyee, et le tableau de bord
// du cabinet rendu illisible par des dossiers inventes. Rien ne fuit, mais
// tout se remplit, et le menage se fait ensuite a la main en SQL.
//
// LES SEUILS SONT BAS PARCE QU UNE INSCRIPTION EST UN ACTE RARE : on
// s inscrit une fois. Trois tentatives par heure et par acces couvrent
// l erreur de saisie et le partage de connexion d une entreprise ; au-dela,
// c est une machine.
//
// ⚠️ LE LIMITEUR VIT EN MEMOIRE : sur Vercel il ne couvre qu une instance a
// la fois. Il arrete le martelement ordinaire, pas une attaque distribuee.
const MAX_PAR_IP = 3;
const FENETRE_IP_MS = 60 * 60 * 1000;
const MAX_PAR_EMAIL = 2;
const FENETRE_EMAIL_MS = 24 * 60 * 60 * 1000;

// Cree le compte d un nouveau client, sa fiche, et son premier dossier.
// L envoi du lien de connexion reste assure par /connexion, qui fonctionne
// deja : on ne duplique pas ce mecanisme.
export async function POST(req: NextRequest) {
  // LE COMPTEUR PAR IP VIENT AVANT TOUT, meme avant la lecture du corps :
  // un appel refuse ici ne consomme ni base, ni quota d authentification.
  if (!limiter(ipDe(req), "compliance_inscription_ip", MAX_PAR_IP, FENETRE_IP_MS)) {
    return NextResponse.json(
      { ok: false, erreur: "Trop de demandes depuis cet accès. Réessayez dans une heure." },
      { status: 429 }
    );
  }

  try {
    const corps = await req.json();

    const email = String(corps.email || "").toLowerCase().trim();
    const raisonSociale = String(corps.raison_sociale || "").trim();
    const siren = sirenDe(corps.siren);
    const profilDemande = String(corps.profil || "").trim();
    const profil = PROFILS.indexOf(profilDemande) >= 0 ? profilDemande : "cabinet_comptable";

    if (!email || email.indexOf("@") < 0) {
      return NextResponse.json({ ok: false, erreur: "Adresse électronique invalide." }, { status: 400 });
    }
    if (raisonSociale.length < 2) {
      return NextResponse.json({ ok: false, erreur: "Indiquez la raison sociale." }, { status: 400 });
    }

    // SECOND COMPTEUR, PAR ADRESSE. Il complete le premier : sans lui, un
    // appelant changeant d IP a chaque essai pourrait s acharner sur une
    // meme adresse. Place APRES la validation du format, pour qu une
    // adresse malformee ne consomme pas le quota d une adresse valable.
    if (!limiter(email, "compliance_inscription_email", MAX_PAR_EMAIL, FENETRE_EMAIL_MS)) {
      return NextResponse.json(
        {
          ok: true,
          message: "Si cette adresse peut être inscrite, votre accès est prêt. "
            + "Demandez votre lien de connexion pour entrer.",
        }
      );
    }

    // Le numero de TVA se deduit du SIREN. Sans lui, la facture partirait
    // sans mention du preneur : elle ne serait pas reguliere en
    // autoliquidation. Le client pourra le corriger depuis sa fiche.
    const numeroTva = numeroTvaDepuisSiren(siren);

    // 1. Le compte existe-t-il deja ?
    const { data: dejaId } = await supabase.rpc("utilisateur_par_email", { email });

    let userId: string | null = dejaId || null;

    if (userId) {
      const { data: membre } = await supabase
        .from("compliance_membres").select("id").eq("user_id", userId).limit(1);
      if (membre && membre.length > 0) {
        // 🚨 LA REPONSE NE DIT PLUS SI LE COMPTE EXISTE — 31/08.
        //
        // Elle repondait « Ce compte existe déjà », ce qui permettait
        // d ENUMERER LES CLIENTS : en essayant des adresses une par une, on
        // apprenait lesquelles sont abonnees. Pour un logiciel de cabinet
        // comptable, c est la liste des clients qui se reconstitue.
        //
        // La reponse est desormais LA MEME dans les deux cas. Celui qui a
        // vraiment un compte suit l instruction et demande son lien : il
        // entre. Celui qui sonde n apprend rien.
        return NextResponse.json({
          ok: true,
          message: "Si cette adresse peut être inscrite, votre accès est prêt. "
            + "Demandez votre lien de connexion pour entrer.",
        });
      }
    }

    // 2. Creation du compte si besoin. Il n a pas de mot de passe : la
    // connexion se fait par lien envoye par courriel.
    if (!userId) {
      const { data: cree, error: err } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (err || !cree || !cree.user) {
        console.error("[compliance/inscription] creation compte :", err ? err.message : "inconnue");
        return NextResponse.json({ ok: false, erreur: "Création du compte impossible." }, { status: 400 });
      }
      userId = cree.user.id;
    }

    // 3. Son organisme, qui le cloisonne de tous les autres.
    const tenantId = crypto.randomUUID();

    const { error: errMembre } = await supabase.from("compliance_membres").insert({
      user_id: userId,
      tenant_id: tenantId,
      role: "proprietaire",
      actif: true,
      profil: profil,
    });
    if (errMembre) {
      console.error("[compliance/inscription] rattachement :", errMembre.message);
      return NextResponse.json({ ok: false, erreur: "Rattachement impossible." }, { status: 400 });
    }

    const code = raisonSociale
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 12) || "DOSSIER1";

    // 4. TOUT client a une fiche dans organismes_formation, y compris un
    // cabinet comptable : c est la que la facturation lit sa raison sociale,
    // son courriel et son numero de TVA. Sans elle, sa facture sortirait au
    // nom de « Cabinet » suivi d un identifiant.
    //
    // Les erreurs d insertion sont REMONTEES, jamais avalees : un compte
    // cree a moitie est pire qu un compte refuse, parce qu il se decouvre
    // au moment de facturer. Le DETAIL, lui, reste dans les journaux : un
    // message d erreur de base renseigne sur la structure des tables.
    const { error: errFiche } = await supabase.from("organismes_formation").insert({
      tenant_id: tenantId,
      raison_sociale: raisonSociale,
      email_contact: email,
      siret: siren || null,
      numero_tva: numeroTva || null,
      statut: "essai",
      profils: [profil],
    });
    if (errFiche) {
      console.error("[compliance/inscription] fiche client :", errFiche.message);
      return NextResponse.json({ ok: false, erreur: "Fiche client impossible." }, { status: 400 });
    }

    // 5. Un cabinet comptable recoit en plus son premier dossier et sa
    // fiche de collaborateur. actif a true : sans lui, le dossier ne serait
    // jamais compte comme vivant, donc jamais facture.
    if (profil === "cabinet_comptable") {
      const { error: errSoc } = await supabase.from("compta_societes").insert({
        code: code,
        raison_sociale: raisonSociale,
        siren: siren || null,
        tenant_id: tenantId,
        actif: true,
        devise: "EUR",
        pays: "FR",
      });
      if (errSoc) {
        console.error("[compliance/inscription] dossier :", errSoc.message);
        return NextResponse.json({ ok: false, erreur: "Dossier impossible." }, { status: 400 });
      }

      const { error: errCollab } = await supabase.from("compta_collaborateurs").insert({
        email: email,
        nom: raisonSociale,
        role: "associe",
        tenant_id: tenantId,
        actif: true,
        peut_saisir: true,
        peut_valider: true,
        peut_cloturer: true,
        peut_declarer: true,
        peut_gerer_plan: true,
        peut_deposer_pieces: true,
      });
      if (errCollab) {
        console.error("[compliance/inscription] collaborateur :", errCollab.message);
        return NextResponse.json({ ok: false, erreur: "Collaborateur impossible." }, { status: 400 });
      }
    }

    return NextResponse.json({
      ok: true,
      profil: profil,
      numero_tva: numeroTva || null,
      message: "Compte créé. Demandez votre lien de connexion pour entrer.",
    });
  } catch (e: any) {
    console.error("[compliance/inscription] exception :", String(e));
    return NextResponse.json({ ok: false, erreur: "Erreur serveur." }, { status: 500 });
  }
}
