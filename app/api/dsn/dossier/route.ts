import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════════════
// LA GESTION DES DECLARATIONS DSN — 16/09/2026, corrigee le meme jour
//
// Lister les mois, ouvrir un fichier, marquer une declaration controlee
// puis deposee, consigner le compte rendu metier.
//
// 🚨 LE FICHIER SE GENERE DANS /api/dsn/generer, et nulle part ailleurs.
// Cette route ne fait que le suivi.
//
// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 16/09 — TROIS CORRECTIONS APRES LE PREMIER ESSAI DE L ECRAN
//
// L ecran affichait « 0 mois avec des bulletins » alors que la base en
// portait trois, dont un emis. Aucun message, aucune piste : le premier
// essai de la brique DSN n a donc meme pas pu commencer.
//
// 1. 🚨 AUCUNE DES TROIS LECTURES N ETAIT VERIFIEE. `const { data } = await
//    supabase...` sans `error` : quand la requete echoue, `data` vaut null,
//    la route rend zero mois ET REPOND « success ». C est le piege deja
//    documente le 15/09 sur compliance_documents — un insert non verifie
//    echouait en silence, et le defaut ne s est vu que des semaines plus
//    tard. Ici c etait un select, meme cause, meme effet.
//    ⛔ DESORMAIS CHAQUE LECTURE EST VERIFIEE ET SON ERREUR REMONTE.
//
// 2. 🚨 UN BULLETIN ANNULE ETAIT COMPTE COMME UN BROUILLON, ET SON BRUT
//    ADDITIONNE. Sur septembre — un emis, deux annules — l ecran aurait
//    annonce 7 000,71 EUR de brut au lieu de 2 333,57, et « 2 en
//    brouillon » alors qu il n y en a aucun. Un chiffre faux sur un ecran
//    de declaration sociale est pire que pas de chiffre du tout.
//    ⛔ LES ANNULES SONT DESORMAIS ECARTES DU COMPTE. Ils restent en base,
//    ils ne comptent simplement plus.
//
// 3. ⚠️ LES EN-TETES ANTI-CACHE, comme sur le calcul de paie. La lecon du
//    matin : `force-dynamic` n empeche pas un intermediaire de garder sa
//    reponse, et `?v=2` ne contourne que Safari.
//
// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 20/09 — LE RATTACHEMENT URSSAF ET LE COMPTE A PRELEVER
//
// Jusqu ici, l URSSAF de rattachement et l IBAN de prelevement se posaient
// EN SQL. C est contraire a la doctrine : ce qui se saisit une fois par
// societe se saisit a l ecran, avec ses controles.
//
// DEUX AJOUTS, ET RIEN N A ETE RETIRE :
//
// 1. L ACTION « etat » REND EN PLUS les quatre valeurs de chaque societe
//    (organisme, entite d affectation, IBAN, BIC) et LA LISTE DES 36
//    ORGANISMES lue dans `urssaf_organismes`.
//    🚨 CES DEUX LECTURES SONT TOLERANTES A L ECHEC, volontairement : si
//    une colonne manque ou si la table n a pas ete importee, l ecran DSN
//    doit continuer a s afficher et a generer. Une brique en moins ne doit
//    pas emporter tout l ecran. L echec est dit dans `diagnostic`.
//    ⛔ C EST LA SEULE LECTURE DE CETTE ROUTE QUI N ARRETE PAS TOUT : les
//    trois autres restent bloquantes, car sans elles l ecran ment.
//
// 2. UNE ACTION « urssaf » QUI ENREGISTRE, APRES CONTROLE :
//    - l organisme doit exister dans `urssaf_organismes` ;
//    - l IBAN est verifie par sa cle (modulo 97) et par sa longueur de
//      pays — un IBAN faux fait echouer le prelevement, donc une majoration
//      de retard, alors que le controle coute trois lignes ;
//    - le BIC est verifie dans sa forme ;
//    - 🚨 IBAN ET BIC VONT ENSEMBLE : le bloc S21.G00.20 exige les deux.
//      L un sans l autre est refuse plutot qu ecrit a moitie.
//
// ⚠️ CE QUI EST ECRIT SE LIMITE AUX QUATRE COLONNES CONNUES de
// `compta_societes` (urssaf_codification, urssaf_entite_affectation,
// iban_prelevement, bic_prelevement). Aucune autre n est touchee, et
// `maj_le` n est pas ecrite ici : sa presence sur cette table n a pas ete
// verifiee, et une colonne inventee ferait echouer tout l enregistrement.
// ═══════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// ⚠️ TROIS EN-TETES, PAS UN : `Cache-Control` pour ce qui respecte la norme
// actuelle, `Pragma` et `Expires` pour les intermediaires plus anciens.
const SANS_CACHE: Record<string, string> = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

function q(v: any): string {
  return v === null || v === undefined ? "" : String(v).trim();
}

function json(corps: any, statut?: number) {
  return NextResponse.json(corps, { status: statut || 200, headers: SANS_CACHE });
}

// ═══════════════════════════════════════════════════════════════════════
// 🆕 20/09 — LE CONTROLE DE L IBAN
//
// 🚨 UN IBAN FAUX NE SE VOIT PAS : il part, le prelevement echoue, et
// l URSSAF applique une majoration de retard. La cle de controle existe
// precisement pour attraper une faute de frappe avant l envoi.
//
// LA REGLE (norme ISO 13616) : on deplace les quatre premiers caracteres a
// la fin, on remplace chaque lettre par deux chiffres (A = 10 … Z = 35), et
// le nombre obtenu doit donner 1 comme reste dans la division par 97.
//
// ⚠️ LE NOMBRE EST TROP GRAND POUR UN ENTIER JAVASCRIPT : on le calcule
// chiffre par chiffre, en gardant le reste a chaque pas. C est exact, et ca
// evite d avoir a manier de grands nombres.
// ═══════════════════════════════════════════════════════════════════════

// La longueur exacte de l IBAN dans chaque pays de la zone SEPA.
// ⚠️ UN PAYS ABSENT DE CETTE TABLE N EST PAS REFUSE : seule sa longueur
// n est pas verifiee, la cle l est toujours.
const LONGUEUR_IBAN: Record<string, number> = {
  AD: 24, AT: 20, BE: 16, BG: 22, CH: 21, CY: 28, CZ: 24, DE: 22,
  DK: 18, EE: 20, ES: 24, FI: 18, FR: 27, GB: 22, GR: 27, HR: 21,
  HU: 28, IE: 22, IS: 26, IT: 27, LI: 21, LT: 20, LU: 20, LV: 21,
  MC: 27, MT: 31, NL: 18, NO: 15, PL: 28, PT: 25, RO: 24, SE: 24,
  SI: 19, SK: 24, SM: 27, VA: 22,
};

function normaliserIban(v: any): string {
  return String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function controlerIban(v: any): any {
  const s = normaliserIban(v);
  if (!s) return { ok: false, vide: true };

  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{8,30}$/.test(s)) {
    return {
      ok: false,
      raison: "La forme de l'IBAN n'est pas celle attendue : deux lettres de "
        + "pays, deux chiffres de clé, puis le numéro de compte.",
    };
  }

  const pays = s.slice(0, 2);
  const attendue = LONGUEUR_IBAN[pays];
  if (attendue && s.length !== attendue) {
    return {
      ok: false,
      raison: "Un IBAN " + pays + " compte " + attendue + " caractères ; "
        + "celui-ci en a " + s.length + ".",
    };
  }

  const reordonne = s.slice(4) + s.slice(0, 4);
  let reste = 0;
  for (let i = 0; i < reordonne.length; i++) {
    const car = reordonne.charAt(i);
    const chiffres = car >= "0" && car <= "9"
      ? car
      : String(car.charCodeAt(0) - 55);
    for (let k = 0; k < chiffres.length; k++) {
      reste = (reste * 10 + Number(chiffres.charAt(k))) % 97;
    }
  }

  if (reste !== 1) {
    return {
      ok: false,
      raison: "La clé de contrôle de l'IBAN est fausse : il y a une erreur de "
        + "saisie. Recopiez-le depuis un relevé bancaire.",
    };
  }

  return { ok: true, valeur: s };
}

// Le BIC : six lettres de banque et de pays, deux caracteres de place, et
// trois de plus pour une agence. Huit ou onze, jamais autre chose.
function controlerBic(v: any): any {
  const s = String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!s) return { ok: false, vide: true };
  if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(s)) {
    return {
      ok: false,
      raison: "Le BIC doit compter 8 ou 11 caractères : quatre lettres de "
        + "banque, deux de pays, puis deux ou cinq caractères de place.",
    };
  }
  return { ok: true, valeur: s };
}

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return json({ erreur: "non autorise" }, 401);
  }

  let c: any = {};
  try { c = await req.json(); } catch { c = {}; }
  const action = q(c.action);

  try {
    // ═══════════════════════════════════════════════════════════════════
    // ---- L ETAT DES LIEUX ----
    //
    // Pour chaque mois qui porte des bulletins, dire ou en est la DSN.
    // ═══════════════════════════════════════════════════════════════════
    if (action === "etat") {

      // 🚨 CHAQUE LECTURE EST VERIFIEE. Une table absente, une colonne
      // renommee, un droit manquant : tout cela rend `data = null` sans
      // lever d exception. Sans ce controle, l ecran affiche « rien a
      // faire » alors que la vraie reponse est « je n ai pas pu lire ».
      const { data: societes, error: eSoc } = await supabase
        .from("compta_societes")
        .select("id, tenant_id, raison_sociale, siret, code_ape, effectif")
        .order("raison_sociale");

      if (eSoc) {
        return json({
          erreur: "lecture des societes impossible : " + eSoc.message,
          ou: "compta_societes",
        }, 500);
      }

      const { data: bulletins, error: eBul } = await supabase
        .from("paie_bulletins")
        .select("societe_id, periode, statut, brut")
        .order("periode", { ascending: false });

      if (eBul) {
        return json({
          erreur: "lecture des bulletins impossible : " + eBul.message,
          ou: "paie_bulletins",
        }, 500);
      }

      const { data: declarations, error: eDec } = await supabase
        .from("dsn_declarations")
        .select("*")
        .order("periode", { ascending: false });

      if (eDec) {
        return json({
          erreur: "lecture des declarations impossible : " + eDec.message,
          ou: "dsn_declarations",
        }, 500);
      }

      // ═════════════════════════════════════════════════════════════════
      // 🆕 20/09 — LE VOLET URSSAF, EN LECTURE TOLERANTE
      //
      // ⚠️ CES DEUX LECTURES NE BLOQUENT PAS L ECRAN. Les trois lectures
      // ci-dessus sont vitales : sans elles, l ecran ment. Celles-ci ne le
      // sont pas — sans elles, il manque une brique, et c est tout. Une
      // colonne qui n existerait pas ou une table non importee ne doit pas
      // empecher de generer une DSN.
      // ⛔ MAIS L ECHEC SE DIT : il part dans `diagnostic`, pas dans le
      // silence.
      // ═════════════════════════════════════════════════════════════════
      const urssafParSociete: any = {};
      let urssafLecture = "";

      const { data: volet, error: eVolet } = await supabase
        .from("compta_societes")
        .select("id, urssaf_codification, urssaf_entite_affectation, "
          + "iban_prelevement, bic_prelevement, vm_assujetti, code_insee, effectif");

      if (eVolet) {
        urssafLecture = "colonnes URSSAF illisibles : " + eVolet.message;
      } else {
        for (const v of (volet || [])) urssafParSociete[v.id] = v;
      }

      let organismes: any[] = [];
      let organismesLecture = "";

      const { data: orgs, error: eOrg } = await supabase
        .from("urssaf_organismes")
        .select("codification, denomination, siret, code_postal, ville")
        .order("denomination");

      if (eOrg) organismesLecture = "table urssaf_organismes illisible : " + eOrg.message;
      else organismes = orgs || [];

      // ⚠️ ON REGROUPE LES BULLETINS PAR SOCIETE ET PAR MOIS.
      // 🚨 LES ANNULES SONT ECARTES : un bulletin remplace par un
      // rectificatif n existe plus pour la declaration. Le compter
      // fausserait le brut du mois et laisserait croire a des brouillons
      // en attente.
      const mois: any = {};
      let annulesIgnores = 0;

      for (const b of (bulletins || [])) {
        if (b.statut === "annule") { annulesIgnores++; continue; }

        const cle = b.societe_id + "|" + String(b.periode).slice(0, 10);
        if (!mois[cle]) {
          mois[cle] = {
            societe_id: b.societe_id,
            periode: String(b.periode).slice(0, 10),
            bulletins: 0, emis: 0, brouillons: 0, brut: 0,
          };
        }
        mois[cle].bulletins++;
        // ⚠️ SEUL LE BRUT DES BULLETINS EMIS COMPTE : c est lui qui partira
        // dans la declaration. Un brouillon n a pas ete remis au salarie.
        if (b.statut === "emis") {
          mois[cle].emis++;
          mois[cle].brut += Number(b.brut || 0);
        } else {
          mois[cle].brouillons++;
        }
      }

      // 🚨 ON RATTACHE LA DERNIERE DECLARATION DE CHAQUE MOIS. C est son
      // numero d ordre qui dit quelle version fait foi.
      const lignes = Object.keys(mois).map(function (cle) {
        const m = mois[cle];
        const d = (declarations || []).filter(function (x: any) {
          return x.societe_id === m.societe_id
            && String(x.periode).slice(0, 10) === m.periode;
        }).sort(function (a: any, b: any) {
          return Number(b.numero_ordre) - Number(a.numero_ordre);
        })[0];

        const s = (societes || []).filter(function (x: any) {
          return x.id === m.societe_id;
        })[0];

        return {
          ...m,
          brut: Math.round(m.brut * 100) / 100,
          societe: s ? s.raison_sociale : "",
          siret: s ? s.siret : null,
          declaration: d || null,
        };
      }).sort(function (a: any, b: any) {
        return a.periode < b.periode ? 1 : -1;
      });

      // 🆕 CHAQUE SOCIETE PORTE SON VOLET URSSAF, quand il a pu etre lu.
      // ⚠️ ON N INVENTE RIEN : une societe sans volet garde des champs
      // vides, et l ecran dira que l organisme n est pas renseigne.
      const societesCompletes = (societes || []).map(function (s: any) {
        const v = urssafParSociete[s.id] || {};
        const org = organismes.filter(function (o: any) {
          return q(o.codification) === q(v.urssaf_codification);
        })[0];
        return {
          ...s,
          urssaf_codification: v.urssaf_codification || "",
          urssaf_entite_affectation: v.urssaf_entite_affectation || "",
          iban_prelevement: v.iban_prelevement || "",
          bic_prelevement: v.bic_prelevement || "",
          urssaf_denomination: org ? org.denomination : "",
          urssaf_siret: org ? org.siret : "",
          // 🆕 20/09 — L ASSUJETTISSEMENT AU VERSEMENT MOBILITE.
          // ⚠️ TROIS ETATS, PAS DEUX : `null` veut dire « personne n a
          // repondu », et ce n est pas la meme chose que « non ». Une case
          // a cocher les confondrait, et le moteur de paie, lui, les
          // distingue : sans reponse la cotisation vaut zero ET une
          // reserve s affiche.
          vm_assujetti: v.vm_assujetti === true ? true
            : v.vm_assujetti === false ? false : null,
          vm_code_insee: v.code_insee || "",
          vm_effectif: v.effectif === null || v.effectif === undefined
            ? null : Number(v.effectif),
        };
      });

      // 🆕 LE DIAGNOSTIC VOYAGE AVEC LA REPONSE.
      //
      // ⚠️ IL NE S AFFICHE QUE QUAND LA LISTE EST VIDE, mais il est toujours
      // calcule : quand un ecran dit « rien », la premiere question est
      // « rien parce qu il n y a rien, ou rien parce que je n ai pas lu ? ».
      // Sans cette distinction, le doute coute un aller-retour a chaque
      // fois — et c est exactement ce qui vient de se passer.
      return json({
        success: true,
        mois: lignes,
        societes: societesCompletes,
        organismes: organismes,
        diagnostic: {
          bulletins_lus: (bulletins || []).length,
          annules_ignores: annulesIgnores,
          societes_lues: (societes || []).length,
          declarations_lues: (declarations || []).length,
          mois_construits: lignes.length,
          organismes_lus: organismes.length,
          urssaf_lecture: urssafLecture,
          organismes_lecture: organismesLecture,
        },
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🆕 20/09 — ENREGISTRER LE RATTACHEMENT URSSAF ET LE COMPTE
    //
    // 🚨 L IDENTIFIANT DECLARE DANS LE BORDEREAU EST LE SIRET DE L URSSAF,
    // pas sa codification. La codification (« U827 » pour Rhone-Alpes) sert
    // a le retrouver dans la table ; c est elle qu on garde, et le
    // generateur va chercher le SIRET au moment d ecrire.
    //
    // 🚨 AUCUN FICHIER PUBLIC NE DIT DE QUELLE URSSAF RELEVE UNE SOCIETE.
    // C est une donnee notifiee a l entreprise : elle ne peut que se
    // saisir. ⛔ NE JAMAIS LA DEVINER D APRES LE DEPARTEMENT : un
    // bordereau adresse au mauvais organisme est pire qu un bordereau
    // absent.
    // ═══════════════════════════════════════════════════════════════════
    if (action === "urssaf") {
      const societeId = q(c.societe_id);
      if (!societeId) return json({ erreur: "societe manquante" }, 400);

      const { data: soc, error: eS } = await supabase
        .from("compta_societes")
        .select("id, raison_sociale")
        .eq("id", societeId)
        .maybeSingle();

      if (eS) return json({ erreur: "lecture impossible : " + eS.message }, 500);
      if (!soc) return json({ erreur: "societe introuvable" }, 404);

      const codification = q(c.codification).toUpperCase();
      const entite = q(c.entite);
      const ibanBrut = q(c.iban);
      const bicBrut = q(c.bic);

      let denomination = "";
      let siretOrganisme = "";
      const avertissements: string[] = [];

      // ---- L ORGANISME ----
      if (codification) {
        const { data: org, error: eO } = await supabase
          .from("urssaf_organismes")
          .select("codification, denomination, siret")
          .eq("codification", codification)
          .maybeSingle();

        if (eO) {
          return json({
            erreur: "lecture des organismes impossible : " + eO.message
              + ". La table urssaf_organismes a-t-elle été importée ?",
          }, 500);
        }
        if (!org) {
          return json({
            erreur: "L'organisme « " + codification + " » n'existe pas dans la "
              + "table des URSSAF. Choisissez-le dans la liste.",
          }, 400);
        }

        denomination = q(org.denomination);
        siretOrganisme = q(org.siret);

        // ⚠️ SANS SIRET, LE BORDEREAU NE PEUT PAS S ECRIRE : la rubrique
        // S21.G00.22.001 attend le SIRET de l URSSAF. On enregistre quand
        // meme — l organisme est peut-etre le bon — mais on le dit.
        if (!siretOrganisme) {
          avertissements.push("Cet organisme n'a pas de SIRET dans la table : "
            + "le bordereau ne pourra pas être déclaré tant qu'il n'en aura "
            + "pas un. Signalez-le, la table se réimporte.");
        }
      }

      // ---- LE COMPTE A PRELEVER ----
      //
      // 🚨 IBAN ET BIC VONT ENSEMBLE. Le bloc S21.G00.20 porte les deux :
      // l un sans l autre ne se declare pas. Plutot que d ecrire une moitie
      // de coordonnees qui ne servira a rien, on refuse et on le dit.
      let iban = "";
      let bic = "";

      if (ibanBrut && !bicBrut) {
        return json({
          erreur: "Le BIC manque. L'IBAN et le BIC se déclarent ensemble : "
            + "sans les deux, le prélèvement n'est pas demandé.",
        }, 400);
      }
      if (bicBrut && !ibanBrut) {
        return json({
          erreur: "L'IBAN manque. L'IBAN et le BIC se déclarent ensemble : "
            + "sans les deux, le prélèvement n'est pas demandé.",
        }, 400);
      }

      if (ibanBrut) {
        const vi = controlerIban(ibanBrut);
        if (!vi.ok) return json({ erreur: vi.raison || "IBAN invalide" }, 400);
        iban = vi.valeur;

        const vb = controlerBic(bicBrut);
        if (!vb.ok) return json({ erreur: vb.raison || "BIC invalide" }, 400);
        bic = vb.valeur;
      }

      // ⚠️ ON N ECRIT QUE LES QUATRE COLONNES CONNUES. Ajouter `maj_le`
      // sans avoir verifie qu elle existe ferait echouer tout l
      // enregistrement — et la societe resterait sans organisme sans qu on
      // sache pourquoi.
      const { data: maj, error: eU } = await supabase
        .from("compta_societes")
        .update({
          urssaf_codification: codification || null,
          urssaf_entite_affectation: entite || null,
          iban_prelevement: iban || null,
          bic_prelevement: bic || null,
        })
        .eq("id", societeId)
        .select("id")
        .maybeSingle();

      if (eU) return json({ erreur: "enregistrement impossible : " + eU.message }, 500);
      // 🚨 UN UPDATE QUI NE TROUVE RIEN N EST PAS UNE REUSSITE.
      if (!maj) return json({ erreur: "rien n'a été modifié." }, 409);

      // ═════════════════════════════════════════════════════════════════
      // 🆕 20/09 — L ASSUJETTISSEMENT AU VERSEMENT MOBILITE, A PART
      //
      // ⚠️ DANS SA PROPRE ECRITURE, ET SEULEMENT SI L ECRAN L A ENVOYE.
      // Mise dans l update ci-dessus, une colonne absente ferait echouer
      // TOUT l enregistrement : la societe se retrouverait sans URSSAF ni
      // IBAN alors que l utilisateur vient de les saisir. Ici, au pire,
      // cette seule valeur n est pas gardee, et on le dit.
      //
      // 🚨 TROIS ETATS. `null` n est pas `false` : il veut dire que
      // personne n a repondu, et le moteur de paie s abstient alors de
      // calculer plutot que de decider a la place de l employeur.
      // ═════════════════════════════════════════════════════════════════
      if (c.vm_assujetti !== undefined) {
        const valeur = c.vm_assujetti === true ? true
          : c.vm_assujetti === false ? false : null;

        const { error: eVm } = await supabase
          .from("compta_societes")
          .update({ vm_assujetti: valeur })
          .eq("id", societeId);

        if (eVm) {
          avertissements.push("L'assujettissement au versement mobilité n'a "
            + "pas pu être enregistré (" + eVm.message + ") : le reste l'a été.");
        }
      }

      // ---- CE QU ON REPOND ----
      let message = "";
      if (!codification && !iban) {
        message = "Rattachement URSSAF et coordonnées bancaires effacés. "
          + "Le bordereau ne sera plus déclaré.";
      } else if (codification && iban) {
        message = "Enregistré : " + (denomination || codification)
          + ", prélèvement sur " + iban.slice(0, 4) + "…" + iban.slice(-4)
          + ". Le bordereau et la demande de prélèvement seront déclarés à la "
          + "prochaine génération.";
      } else if (codification) {
        message = "Enregistré : " + (denomination || codification)
          + ". ⚠️ Sans IBAN ni BIC, le bordereau est déclaré mais AUCUN "
          + "prélèvement n'est demandé : le paiement reste à faire par un "
          + "autre moyen.";
      } else {
        message = "Coordonnées bancaires enregistrées. ⚠️ Sans organisme de "
          + "rattachement, le bordereau n'est pas déclaré.";
      }

      return json({
        success: true,
        message: message,
        avertissements: avertissements,
        urssaf: {
          codification: codification,
          denomination: denomination,
          siret: siretOrganisme,
          entite: entite,
          iban: iban,
          bic: bic,
        },
      });
    }

    // ---- OUVRIR LE FICHIER ----
    if (action === "voir") {
      const { data: d, error } = await supabase
        .from("dsn_declarations").select("chemin_fichier")
        .eq("id", q(c.id)).maybeSingle();

      if (error) return json({ erreur: "lecture impossible : " + error.message }, 500);

      if (!d || !d.chemin_fichier) {
        return json({ erreur: "aucun fichier pour cette declaration" }, 404);
      }

      const { data: signe } = await supabase.storage
        .from("documents-signes").createSignedUrl(d.chemin_fichier, 3600);

      if (!signe) return json({ erreur: "lien impossible" }, 500);
      return json({ success: true, url: signe.signedUrl });
    }

    // ---- LIRE LE CONTENU DU FICHIER ----
    //
    // ⚠️ POUR LE RELIRE A L ECRAN AVANT DEPOT. Un fichier DSN est du texte :
    // le lire est le seul moyen de verifier de ses yeux ce qu on declare.
    if (action === "contenu") {
      const { data: d, error } = await supabase
        .from("dsn_declarations").select("chemin_fichier")
        .eq("id", q(c.id)).maybeSingle();

      if (error) return json({ erreur: "lecture impossible : " + error.message }, 500);
      if (!d || !d.chemin_fichier) return json({ erreur: "aucun fichier" }, 404);

      const { data: blob, error: eDl } = await supabase.storage
        .from("documents-signes").download(d.chemin_fichier);

      if (eDl || !blob) {
        return json({
          erreur: "lecture du fichier impossible : " + (eDl ? eDl.message : "vide"),
        }, 500);
      }

      // 🚨 LE FICHIER EST EN LATIN-1 : le relire en UTF-8 afficherait des
      // caracteres casses la ou tout est correct.
      const octets = Buffer.from(await blob.arrayBuffer());
      const texte = octets.toString("latin1");

      return json({
        success: true,
        contenu: texte,
        nb_lignes: texte.split("\n").filter(function (l) { return l.trim(); }).length,
      });
    }

    // ---- MARQUER CONTROLEE ----
    //
    // 🚨🚨 CE GESTE ATTESTE QUE LE FICHIER EST PASSE DANS dsn-val SANS
    // ANOMALIE BLOQUANTE. C est une declaration sur l honneur, pas un
    // controle automatique : la route n a aucun moyen de le verifier.
    // ⛔ DEPOSER SANS CE CONTROLE, C EST SE GARANTIR UN REJET — et le rejet
    // arrive apres la date limite, donc avec une penalite de retard.
    if (action === "controlee") {
      const { data: maj, error } = await supabase
        .from("dsn_declarations")
        .update({
          statut: "controlee",
          controlee_le: new Date().toISOString(),
          maj_le: new Date().toISOString(),
        })
        .eq("id", q(c.id))
        .eq("statut", "brouillon")
        .select("id")
        .maybeSingle();

      if (error) return json({ erreur: error.message }, 500);
      // ⚠️ UN UPDATE QUI NE TROUVE RIEN N EST PAS UNE REUSSITE. Sans ce
      // controle, l ecran annoncerait « controlee » sur une declaration qui
      // n a pas bouge.
      if (!maj) {
        return json({
          erreur: "rien n'a été modifié : cette déclaration n'était plus en brouillon.",
        }, 409);
      }

      return json({
        success: true,
        message: "Déclaration marquée comme contrôlée dans dsn-val.",
      });
    }

    // ---- MARQUER DEPOSEE ----
    //
    // ⛔ UNE DECLARATION DEPOSEE NE SE MODIFIE PLUS. Pour la corriger, il
    // faut en generer une nouvelle pour le meme mois : elle sera
    // automatiquement « annule et remplace » avec un numero d ordre
    // superieur.
    if (action === "deposee") {
      const { data: d, error: eL } = await supabase
        .from("dsn_declarations").select("statut, periode")
        .eq("id", q(c.id)).maybeSingle();

      if (eL) return json({ erreur: "lecture impossible : " + eL.message }, 500);
      if (!d) return json({ erreur: "declaration introuvable" }, 404);

      if (d.statut === "brouillon") {
        return json({
          erreur: "cette déclaration n'a pas été contrôlée. ⛔ AUCUNE DSN NE SE "
            + "DÉPOSE SANS ÊTRE PASSÉE DANS dsn-val : un rejet arrive après la "
            + "date limite, donc avec une pénalité.",
        }, 400);
      }

      const { data: maj, error } = await supabase
        .from("dsn_declarations")
        .update({
          statut: "deposee",
          deposee_le: new Date().toISOString(),
          maj_le: new Date().toISOString(),
        })
        .eq("id", q(c.id))
        .select("id")
        .maybeSingle();

      if (error) return json({ erreur: error.message }, 500);
      if (!maj) return json({ erreur: "rien n'a été modifié." }, 409);

      return json({
        success: true,
        message: "Déclaration marquée comme déposée. Elle ne peut plus être "
          + "modifiée : une correction passe par une nouvelle DSN du même mois.",
      });
    }

    // ---- CONSIGNER LE COMPTE RENDU METIER ----
    //
    // 🚨 LE CRM EST LA REPONSE DES ORGANISMES. Il arrive quelques jours
    // apres le depot et dit ce qui a ete accepte ou rejete.
    // 🚨🚨 C EST LUI QUI RAPPORTE LE TAUX DE PRELEVEMENT A LA SOURCE de
    // chaque salarie. Sans depot, pas de CRM ; sans CRM, pas de taux — et
    // le bulletin reste au taux neutre.
    if (action === "crm") {
      const { data: maj, error } = await supabase
        .from("dsn_declarations")
        .update({
          crm_recu_le: new Date().toISOString(),
          crm_anomalies: c.anomalies || null,
          statut: c.rejetee === true ? "rejetee" : "acceptee",
          maj_le: new Date().toISOString(),
        })
        .eq("id", q(c.id))
        .select("id")
        .maybeSingle();

      if (error) return json({ erreur: error.message }, 500);
      if (!maj) return json({ erreur: "declaration introuvable." }, 404);

      return json({
        success: true,
        message: c.rejetee === true
          ? "Déclaration marquée REJETÉE. ⛔ Une DSN « annule et remplace » "
            + "doit partir avant la prochaine échéance."
          : "Déclaration acceptée.",
      });
    }

    return json({ erreur: "action inconnue : " + action }, 400);

  } catch (e: any) {
    return json({ erreur: String(e) }, 500);
  }
}
