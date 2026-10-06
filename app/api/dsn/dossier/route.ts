import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sessionCourante } from "../../../../lib/session";
import { verifier, dossiersAutorises, profilPaie } from "../../../../lib/droits";
import type { Droit } from "../../../../lib/droits";

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

// ═══════════════════════════════════════════════════════════════════════
// 🆕 28/09 — CE QUI ETAIT LE POST EST DEVENU `traiter`. La porte (session,
// organisme, droits, garde-fous du depot, journal) est dans le POST, en fin
// de fichier.
// ═══════════════════════════════════════════════════════════════════════
async function traiter(req: NextRequest, c: any, action: string, ctx: Ctx): Promise<NextResponse> {
  try {
    const nouvelle = await actionsDsn(c, action, ctx);
    if (nouvelle) return nouvelle;

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
      // 🆕🚨 28/09 — BORNE A L ORGANISME ET AUX DOSSIERS CONFIES. Avec la
      // cle, cette lecture rendait toutes les societes de la base.
      const ids = ctx.cleServeur ? null : await dossiersAutorises();
      if (ids && ids.length === 0) {
        return json({ success: true, mois: [], societes: [], organismes: [], profil: await profilPaie([]),
          avertissement: "Aucun dossier de paie n'est rattaché à votre compte." });
      }
      let qSoc = supabase
        .from("compta_societes")
        .select("id, tenant_id, raison_sociale, siret, code_ape, effectif")
        .order("raison_sociale");
      if (ids) qSoc = qSoc.in("id", ids);
      const { data: societes, error: eSoc } = await qSoc;

      if (eSoc) {
        return json({
          erreur: "lecture des societes impossible : " + eSoc.message,
          ou: "compta_societes",
        }, 500);
      }

      let qBul = supabase
        .from("paie_bulletins")
        .select("societe_id, periode, statut, brut")
        .order("periode", { ascending: false });
      if (ids) qBul = qBul.in("societe_id", ids);
      const { data: bulletins, error: eBul } = await qBul;

      if (eBul) {
        return json({
          erreur: "lecture des bulletins impossible : " + eBul.message,
          ou: "paie_bulletins",
        }, 500);
      }

      let qDec = supabase
        .from("dsn_declarations")
        .select("*")
        .order("periode", { ascending: false });
      if (ids) qDec = qDec.in("societe_id", ids);
      const { data: declarations, error: eDec } = await qDec;

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
          + "iban_prelevement, bic_prelevement, vm_assujetti, code_insee, effectif, code_risque_at");

      if (eVolet) {
        urssafLecture = "colonnes URSSAF illisibles : " + eVolet.message;
      } else {
        for (const v of (volet || [])) urssafParSociete[v.id] = v;
      }

      // 🆕 25/09 — LE TAUX AT/MP NOTIFIE PAR LA CARSAT, PAR SOCIETE.
      // On retient le taux EN VIGUEUR AUJOURD HUI ; a defaut, le plus
      // recent. ⛔ Une lecture qui echoue ne bloque pas l ecran : elle se
      // dit dans `diagnostic`, comme le volet URSSAF.
      const atParSociete: any = {};
      const taParSociete: any = {};
      let atLecture = "";
      {
        const aujourdhui = new Date().toISOString().slice(0, 10);
        const { data: tauxAt, error: eAt } = await supabase
          .from("paie_taux_societe")
          .select("societe_id, taux, date_effet, date_fin, notifie_le, source")
          .eq("code", "AT_MP")
          .order("date_effet", { ascending: false });
        // 🆕 06/10 — LA SOCIETE EST-ELLE « NON REDEVABLE » DE LA TAXE
        // D APPRENTISSAGE ? (taux a 0, code TAXE_APPRENTISSAGE, en vigueur).
        {
          const { data: tauxTa } = await supabase
            .from("paie_taux_societe")
            .select("societe_id, taux, date_effet, date_fin")
            .eq("code", "TAXE_APPRENTISSAGE")
            .order("date_effet", { ascending: false });
          for (const t of (tauxTa || [])) {
            const sid = String((t as any).societe_id);
            const deb = String((t as any).date_effet || "").slice(0, 10);
            const fin = (t as any).date_fin ? String((t as any).date_fin).slice(0, 10) : "";
            if (taParSociete[sid]) continue;
            if (Number((t as any).taux) === 0 && (!fin || fin >= aujourdhui)) {
              taParSociete[sid] = { non_redevable: true, depuis: deb };
            }
          }
        }
        if (eAt) {
          atLecture = "taux AT/MP illisibles : " + eAt.message;
        } else {
          for (const t of (tauxAt || [])) {
            const sid = String((t as any).societe_id);
            const deb = String((t as any).date_effet || "").slice(0, 10);
            const fin = (t as any).date_fin ? String((t as any).date_fin).slice(0, 10) : "";
            const enVigueur = deb <= aujourdhui && (!fin || fin >= aujourdhui);
            const deja = atParSociete[sid];
            if (!deja || (enVigueur && !deja.en_vigueur)) {
              atParSociete[sid] = {
                taux: Number((t as any).taux), date_effet: deb, date_fin: fin || null,
                notifie_le: (t as any).notifie_le ? String((t as any).notifie_le).slice(0, 10) : null,
                source: (t as any).source || "", en_vigueur: enVigueur,
              };
            }
          }
        }
      }

      // 🆕 27/09 — LA MUTUELLE ET LA PREVOYANCE EN VIGUEUR, PAR SOCIETE.
      const garantiesParSociete: any = {};
      let garantiesLecture = "";
      {
        const aujourdhui = new Date().toISOString().slice(0, 10);
        // 🆕 05/10 — LES IDENTIFIANTS DSN DU CONTRAT (code de l organisme,
        // delegataire, population, option) se lisent avec lui.
        // ⚠️ LECTURE EN DEUX TEMPS : si ces colonnes n existent pas encore
        // en base, on relit sans elles plutot que de faire disparaitre la
        // mutuelle de l ecran.
        const COLONNES_GAR = "id, societe_id, nature, categorie, mode, montant, taux, part_patronale_pct, organisme, reference_contrat, date_effet, date_fin";
        let { data: gar, error: eGar } = await supabase
          .from("paie_garanties_societe")
          .select(COLONNES_GAR + ", organisme_code_dsn, delegataire_dsn, population_dsn, option_dsn")
          .or("date_fin.is.null,date_fin.gte." + aujourdhui)
          .order("date_effet", { ascending: true });
        if (eGar) {
          const repli = await supabase
            .from("paie_garanties_societe")
            .select(COLONNES_GAR)
            .or("date_fin.is.null,date_fin.gte." + aujourdhui)
            .order("date_effet", { ascending: true });
          gar = repli.data as any;
          eGar = repli.error;
        }
        if (eGar) garantiesLecture = "mutuelle et prévoyance illisibles : " + eGar.message;
        else for (const g of (gar || [])) {
          const sid = String((g as any).societe_id);
          if (!garantiesParSociete[sid]) garantiesParSociete[sid] = [];
          garantiesParSociete[sid].push(g);
        }
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
          // 🆕 25/09 — le taux AT/MP en vigueur, ou null s il manque.
          at: atParSociete[s.id] || null,
          // 🆕 06/10 — la taxe d apprentissage : null = redevable (le cas general).
          taxe_apprentissage: taParSociete[s.id] || null,
          // 🆕 01/10 — LE CODE RISQUE de la notification CARSAT (S21.G00.40.040).
          // Le generateur le prend pour tout contrat qui n a pas le sien.
          code_risque_at: v.code_risque_at || "",
          // 🆕 27/09 — la mutuelle et la prevoyance en vigueur ou a venir.
          garanties: garantiesParSociete[s.id] || [],
        };
      });

      // 🆕 LE DIAGNOSTIC VOYAGE AVEC LA REPONSE.
      //
      // ⚠️ IL NE S AFFICHE QUE QUAND LA LISTE EST VIDE, mais il est toujours
      // calcule : quand un ecran dit « rien », la premiere question est
      // « rien parce qu il n y a rien, ou rien parce que je n ai pas lu ? ».
      // Sans cette distinction, le doute coute un aller-retour a chaque
      // fois — et c est exactement ce qui vient de se passer.
      const profil = ctx.cleServeur
        ? { email: "cle-serveur", role: "administrateur", admin: true, gerer_equipe: false, dossiers: {} }
        : await profilPaie((societes || []).map(function (s: any) { return String(s.id); }));

      return json({
        success: true,
        mois: lignes,
        societes: societesCompletes,
        organismes: organismes,
        profil: profil,
        diagnostic: {
          bulletins_lus: (bulletins || []).length,
          annules_ignores: annulesIgnores,
          societes_lues: (societes || []).length,
          declarations_lues: (declarations || []).length,
          mois_construits: lignes.length,
          organismes_lus: organismes.length,
          urssaf_lecture: urssafLecture,
          organismes_lecture: organismesLecture,
          at_lecture: atLecture,
          garanties_lecture: garantiesLecture,
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

    // ═══════════════════════════════════════════════════════════════════
    // 🆕🚨 25/09 — ENREGISTRER LE TAUX AT/MP NOTIFIE PAR LA CARSAT
    //
    // Jusqu au 25/09, ce taux ne se saisissait NULLE PART a l ecran : il
    // fallait l ecrire en base par SQL. Un cabinet ne pouvait donc pas faire
    // la paie d un client sans nous — or il est obligatoire sur chaque
    // bulletin, et sans lui la cotisation vaut zero.
    //
    // CE QUI EST ECRIT, dans `paie_taux_societe`, sous la forme deja en
    // base (code « AT_MP », meme libelle) :
    //   · un taux a une date d effet (le 1er janvier le plus souvent) ;
    //   · s il existe deja un taux a CETTE date, il est corrige ;
    //   · sinon une ligne est ajoutee, et le taux precedent encore ouvert
    //     est CLOS la veille : chaque bulletin prend le taux de son mois,
    //     comme le lit le moteur de paie.
    // ⛔ CONTROLES : un taux entre 0 et 40 % (une faute de frappe comme
    // « 210 » pour 2,10 se refuse), une date au format AAAA-MM-JJ.
    // ═══════════════════════════════════════════════════════════════════
    if (action === "taux_at") {
      const societeId = q(c.societe_id);
      if (!societeId) return json({ erreur: "société manquante." }, 400);

      const { data: soc, error: eS } = await supabase
        .from("compta_societes")
        .select("id, tenant_id, raison_sociale")
        .eq("id", societeId)
        .maybeSingle();
      if (eS) return json({ erreur: "lecture impossible : " + eS.message }, 500);
      if (!soc) return json({ erreur: "société introuvable." }, 404);

      const taux = Number(q(c.taux).replace(/\s|%/g, "").replace(",", "."));
      if (!isFinite(taux) || !(taux > 0) || taux > 40) {
        return json({ erreur: "taux illisible ou hors limites : indiquez le taux "
          + "de la notification CARSAT en pourcentage, par exemple 2,10." }, 400);
      }
      const dateEffet = q(c.date_effet).slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateEffet)) {
        return json({ erreur: "date d'effet manquante ou illisible." }, 400);
      }
      const notifieLe = /^\d{4}-\d{2}-\d{2}$/.test(q(c.notifie_le).slice(0, 10))
        ? q(c.notifie_le).slice(0, 10) : null;

      // 🆕🚨 01/10 — LE CODE RISQUE, NOTIFIE AVEC LE TAUX. La DSN de
      // demonstration du 01/10 declarait « 999ZZ — sans code risque » pour
      // un dossier neuf : aucun ecran ne permettait de saisir le code. Il
      // se saisit ici, avec le taux, et s enregistre sur la societe.
      // Format : trois chiffres et deux lettres (« 745BD », « 742CE ») ;
      // les espaces et le point des ecritures courantes (« 74.2CE ») sont
      // retires. Champ vide = le code deja enregistre ne change pas.
      const codeRisqueBrut = q(c.code_risque).toUpperCase().replace(/[\s.]/g, "");
      if (codeRisqueBrut && !/^[0-9]{3}[A-Z]{2}$/.test(codeRisqueBrut)) {
        return json({ erreur: "code risque illisible : il compte trois chiffres puis deux lettres, "
          + "par exemple 745BD. Il figure sur la notification de la CARSAT, à côté du taux." }, 400);
      }
      if (codeRisqueBrut === "999ZZ") {
        return json({ erreur: "« 999ZZ » veut dire « sans code risque » : il ne se saisit pas. "
          + "Indiquez le code de la notification CARSAT." }, 400);
      }

      const jour = new Date();
      const saisiLe = String(jour.getDate()).padStart(2, "0") + "/"
        + String(jour.getMonth() + 1).padStart(2, "0") + "/" + jour.getFullYear();
      const source = "Notification CARSAT, saisie à l'écran le " + saisiLe;

      const { data: existants, error: eE } = await supabase
        .from("paie_taux_societe")
        .select("id, date_effet, date_fin")
        .eq("societe_id", societeId)
        .eq("code", "AT_MP")
        .order("date_effet", { ascending: true });
      if (eE) return json({ erreur: "lecture des taux impossible : " + eE.message }, 500);

      const liste = (existants || []).map(function (x: any) {
        return { id: x.id, debut: String(x.date_effet).slice(0, 10),
          fin: x.date_fin ? String(x.date_fin).slice(0, 10) : "" };
      });
      const veille = function (iso: string): string {
        const d = new Date(iso + "T00:00:00Z");
        d.setUTCDate(d.getUTCDate() - 1);
        return d.toISOString().slice(0, 10);
      };

      const memeDate = liste.filter(function (x) { return x.debut === dateEffet; })[0];
      let message = "";

      if (memeDate) {
        const { error: eU } = await supabase
          .from("paie_taux_societe")
          .update({ taux: taux, source: source, notifie_le: notifieLe })
          .eq("id", memeDate.id);
        if (eU) return json({ erreur: "enregistrement impossible : " + eU.message }, 500);
        message = "Taux AT/MP corrigé : " + taux.toLocaleString("fr-FR",
          { minimumFractionDigits: 2 }) + " % à compter du " + dateEffet.split("-").reverse().join("/") + ".";
      } else {
        // Le taux suivant, s il en existe un, borne le nouveau.
        const suivant = liste.filter(function (x) { return x.debut > dateEffet; })[0];
        const { error: eI } = await supabase
          .from("paie_taux_societe")
          .insert({
            tenant_id: soc.tenant_id,
            societe_id: societeId,
            code: "AT_MP",
            libelle: "Accidents du travail et maladies professionnelles",
            taux: taux,
            ressort: null,
            date_effet: dateEffet,
            date_fin: suivant ? veille(suivant.debut) : null,
            source: source,
            notifie_le: notifieLe,
          });
        if (eI) return json({ erreur: "enregistrement impossible : " + eI.message }, 500);

        // Le precedent encore ouvert a cette date est clos la veille.
        const precedents = liste.filter(function (x) {
          return x.debut < dateEffet && (!x.fin || x.fin >= dateEffet);
        });
        for (const pr of precedents) {
          const { error: eC } = await supabase
            .from("paie_taux_societe")
            .update({ date_fin: veille(dateEffet) })
            .eq("id", pr.id);
          if (eC) {
            return json({ erreur: "le nouveau taux est enregistré, mais l'ancien n'a "
              + "pas pu être clos (" + eC.message + ") : les deux se chevauchent." }, 500);
          }
        }
        message = "Taux AT/MP enregistré : " + taux.toLocaleString("fr-FR",
          { minimumFractionDigits: 2 }) + " % à compter du "
          + dateEffet.split("-").reverse().join("/") + "."
          + (precedents.length > 0 ? " Le taux précédent s'arrête la veille." : "")
          + " Il s'applique aux bulletins de ce mois et des suivants.";
      }

      if (codeRisqueBrut) {
        const { error: eCr } = await supabase
          .from("compta_societes")
          .update({ code_risque_at: codeRisqueBrut })
          .eq("id", societeId);
        if (eCr) {
          return json({ erreur: "le taux est enregistré, mais pas le code risque (" + eCr.message
            + ") : réessayez." }, 500);
        }
        message += " Code risque : " + codeRisqueBrut + ".";
      }

      return json({ success: true, message: message,
        at: { taux: taux, date_effet: dateEffet, notifie_le: notifieLe },
        code_risque_at: codeRisqueBrut || null });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🆕🚨 06/10 — LA SOCIETE NE RELEVE PAS DE LA TAXE D APPRENTISSAGE
    //
    // Certains employeurs n en sont pas redevables (associations et
    // organismes sans but lucratif non soumis a l impot sur les societes,
    // societes civiles de moyens, groupements d employeurs agricoles…).
    // Cela ne se devine pas : c est l employeur qui le sait. Jusqu au 06/10
    // il fallait une requete en base. L ecran pose desormais un taux a ZERO
    // dans `paie_taux_societe` (codes TAXE_APPRENTISSAGE et
    // TAXE_APPRENTISSAGE_AM) : le moteur de paie le lit comme tout taux
    // propre a la societe, et la DSN ne declare ni la taxe ni son solde.
    //   redevable = false, date_effet   → non redevable a compter de la date
    //   redevable = true,  date_effet   → redevable a nouveau a compter de la date
    // ═══════════════════════════════════════════════════════════════════
    if (action === "taxe_apprentissage") {
      const societeId = q(c.societe_id);
      if (!societeId) return json({ erreur: "société manquante." }, 400);
      const { data: soc, error: eS } = await supabase
        .from("compta_societes").select("id, tenant_id").eq("id", societeId).maybeSingle();
      if (eS) return json({ erreur: "lecture impossible : " + eS.message }, 500);
      if (!soc) return json({ erreur: "société introuvable." }, 404);
      const dateEffet = q(c.date_effet).slice(0, 10);
      if (!/^\d{4}-\d{2}-01$/.test(dateEffet)) {
        return json({ erreur: "date illisible : indiquez le premier jour d'un mois." }, 400);
      }
      const veilleTa = (function () {
        const d = new Date(dateEffet + "T00:00:00Z");
        d.setUTCDate(d.getUTCDate() - 1);
        return d.toISOString().slice(0, 10);
      })();
      const codes = ["TAXE_APPRENTISSAGE", "TAXE_APPRENTISSAGE_AM"];
      const { data: existants, error: eE } = await supabase
        .from("paie_taux_societe").select("id, code, taux, date_effet, date_fin")
        .eq("societe_id", societeId).in("code", codes);
      if (eE) return json({ erreur: "lecture des taux impossible : " + eE.message }, 500);
      const zeros = ((existants || []) as any[]).filter(function (x) { return Number(x.taux) === 0; });
      const lisible = dateEffet.split("-").reverse().join("/");

      if (c.redevable === true) {
        // Redevable a nouveau : les lignes a zero s arretent la veille ; celles
        // qui commencaient a cette date ou apres sont retirees.
        for (const z of zeros) {
          const deb = String(z.date_effet).slice(0, 10);
          const fin = z.date_fin ? String(z.date_fin).slice(0, 10) : "";
          if (deb >= dateEffet) {
            const { error } = await supabase.from("paie_taux_societe").delete().eq("id", z.id);
            if (error) return json({ erreur: "enregistrement impossible : " + error.message }, 500);
          } else if (!fin || fin >= dateEffet) {
            const { error } = await supabase.from("paie_taux_societe").update({ date_fin: veilleTa }).eq("id", z.id);
            if (error) return json({ erreur: "enregistrement impossible : " + error.message }, 500);
          }
        }
        return json({ success: true, message: "Taxe d'apprentissage : la société en est de nouveau redevable à "
          + "compter du " + lisible + ". Elle s'applique aux bulletins de ce mois et des suivants." });
      }

      const jour = new Date();
      const saisiLe = String(jour.getDate()).padStart(2, "0") + "/"
        + String(jour.getMonth() + 1).padStart(2, "0") + "/" + jour.getFullYear();
      for (const code of codes) {
        const deja = zeros.filter(function (z) {
          const fin = z.date_fin ? String(z.date_fin).slice(0, 10) : "";
          return z.code === code && String(z.date_effet).slice(0, 10) <= dateEffet && (!fin || fin >= dateEffet);
        })[0];
        if (deja) continue;
        // Une ligne a zero posee plus tard est remplacee par celle-ci.
        for (const z of zeros) {
          if (z.code === code && String(z.date_effet).slice(0, 10) > dateEffet) {
            await supabase.from("paie_taux_societe").delete().eq("id", z.id);
          }
        }
        const { error: eI } = await supabase.from("paie_taux_societe").insert({
          tenant_id: (soc as any).tenant_id, societe_id: societeId, code: code,
          libelle: "Taxe d'apprentissage — société non redevable",
          taux: 0, ressort: null, date_effet: dateEffet, date_fin: null,
          source: "Déclaré à l'écran le " + saisiLe, notifie_le: null,
        });
        if (eI) return json({ erreur: "enregistrement impossible : " + eI.message }, 500);
      }
      return json({ success: true, message: "Taxe d'apprentissage : la société est marquée non redevable à "
        + "compter du " + lisible + ". Elle ne sera plus comptée sur les bulletins de ce mois et des suivants, "
        + "ni déclarée dans la DSN (solde annuel compris). Un bulletin déjà émis ne change pas." });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🆕🚨 27/09 — LA MUTUELLE ET LA PREVOYANCE DE LA SOCIETE
    // Elles ne se saisissaient nulle part. Chaque contrat collectif se
    // declare une fois, avec sa date d effet ; « arreter » le clot. Le moteur
    // de paie les lit pour chaque bulletin du mois.
    // ═══════════════════════════════════════════════════════════════════
    if (action === "garantie") {
      const societeId = q(c.societe_id);
      if (!societeId) return json({ erreur: "société manquante." }, 400);
      const { data: soc, error: eS } = await supabase
        .from("compta_societes").select("id, tenant_id").eq("id", societeId).maybeSingle();
      if (eS) return json({ erreur: "lecture impossible : " + eS.message }, 500);
      if (!soc) return json({ erreur: "société introuvable." }, 404);

      const nature = q(c.nature);
      const categorie = q(c.categorie) || "tous";
      const mode = q(c.mode) || "forfait";
      if (["sante", "prevoyance"].indexOf(nature) < 0) return json({ erreur: "choisissez santé ou prévoyance." }, 400);
      if (["tous", "cadre", "non_cadre"].indexOf(categorie) < 0) return json({ erreur: "catégorie inconnue." }, 400);
      if (["forfait", "pct_pmss", "pct_brut", "pct_tranche_a"].indexOf(mode) < 0) return json({ erreur: "mode de calcul inconnu." }, 400);
      const nb = function (v: any): number { return Number(String(v === undefined || v === null ? "" : v).replace(/\s|%|€/g, "").replace(",", ".")); };
      const montant = mode === "forfait" ? nb(c.montant) : null;
      const taux = mode !== "forfait" ? nb(c.taux) : null;
      if (mode === "forfait" && !(montant !== null && isFinite(montant) && montant > 0 && montant < 2000)) {
        return json({ erreur: "indiquez la cotisation mensuelle totale en euros (part salarié + part employeur)." }, 400);
      }
      if (mode !== "forfait" && !(taux !== null && isFinite(taux) && taux > 0 && taux < 20)) {
        return json({ erreur: "indiquez le taux total en pourcentage (part salarié + part employeur)." }, 400);
      }
      const pct = nb(c.part_patronale_pct);
      if (!(isFinite(pct) && pct >= 0 && pct <= 100)) return json({ erreur: "part employeur illisible : un pourcentage entre 0 et 100." }, 400);
      const dateEffet = q(c.date_effet).slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateEffet)) return json({ erreur: "date d'effet manquante ou illisible." }, 400);

      const { error: eI } = await supabase.from("paie_garanties_societe").insert({
        tenant_id: soc.tenant_id, societe_id: societeId, nature: nature, categorie: categorie,
        mode: mode, montant: montant, taux: taux, part_patronale_pct: pct,
        organisme: q(c.organisme) || null, reference_contrat: q(c.reference_contrat) || null,
        date_effet: dateEffet,
      });
      if (eI) return json({ erreur: "enregistrement impossible : " + eI.message }, 500);
      return json({ success: true, message: (nature === "sante" ? "Complémentaire santé" : "Prévoyance")
        + " enregistrée à compter du " + dateEffet.split("-").reverse().join("/")
        + ". Elle s'applique aux bulletins de ce mois et des suivants ; un bulletin déjà émis ne change pas." });
    }

    if (action === "garantie_fin") {
      const id = q(c.id);
      const dateFin = q(c.date_fin).slice(0, 10);
      if (!id) return json({ erreur: "garantie manquante." }, 400);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFin)) return json({ erreur: "date de fin illisible." }, 400);
      const { error: eU } = await supabase.from("paie_garanties_societe").update({ date_fin: dateFin }).eq("id", id);
      if (eU) return json({ erreur: "enregistrement impossible : " + eU.message }, 500);
      return json({ success: true, message: "Garantie arrêtée au " + dateFin.split("-").reverse().join("/") + "." });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 🆕🚨 05/10 — LES IDENTIFIANTS DSN D UN CONTRAT DE MUTUELLE OU DE
    // PREVOYANCE
    //
    // ⛔ SANS EUX, LA COTISATION NE PEUT PAS SE DECLARER : la DSN rattache
    // chaque salarie a un contrat par le CODE DE L ORGANISME (S21.G00.15.002)
    // et la REFERENCE DU CONTRAT (15.001). Aucun ecran ne les demandait, et
    // la premiere DSN d un dossier neuf sortait avec « Aucun code DSN pour la
    // cotisation MUTUELLE — NON DÉCLARÉE ».
    //
    // D OU ILS VIENNENT : de la fiche de parametrage DSN que l organisme
    // remet a l entreprise. Le delegataire, la population et l option ne se
    // remplissent que si cette fiche les donne.
    //
    // ⚠️ ILS NE CHANGENT PAS LA PAIE : un brouillon de bulletin reste bon,
    // seule la DSN du mois est a regenerer.
    // 🚨 LA FORME DU CODE EST CONTROLEE ICI (rubrique 15.002 du cahier
    // technique 2026.1) ; qu il existe se verifie dans dsn-val.
    // ═══════════════════════════════════════════════════════════════════
    if (action === "garantie_dsn") {
      const id = q(c.id);
      if (!id) return json({ erreur: "garantie manquante." }, 400);

      const codeOrg = q(c.organisme_code_dsn).replace(/[\s.\-]/g, "").toUpperCase();
      const reference = q(c.reference_contrat).replace(/'/g, " ").trim();
      const delegataire = q(c.delegataire_dsn).replace(/\s/g, "").toUpperCase();
      const population = q(c.population_dsn).replace(/'/g, " ").trim();
      const option = q(c.option_dsn).replace(/'/g, " ").trim();

      if (!codeOrg) return json({ erreur: "indiquez le code de l'organisme : il figure sur sa fiche de paramétrage DSN." }, 400);
      const formeAdmise = /^P[0-9]{4}$/.test(codeOrg)
        || /^[0-9]{9}$/.test(codeOrg)
        || /^A[A-Z0-9]{5}$/.test(codeOrg)
        || (/^[A-Z0-9]{9}$/.test(codeOrg) && /[A-Z]/.test(codeOrg));
      if (!formeAdmise) {
        return json({ erreur: "code de l'organisme illisible : la lettre P et 4 chiffres pour une institution "
          + "de prévoyance, 9 chiffres pour une mutuelle, la lettre A et 5 caractères pour une société d'assurance." }, 400);
      }
      if (!reference) return json({ erreur: "indiquez la référence du contrat : elle figure sur la fiche de paramétrage DSN de l'organisme." }, 400);
      if (reference.length > 30) return json({ erreur: "référence du contrat trop longue : 30 caractères au plus." }, 400);
      if (delegataire && !/^[A-Z0-9]{6}$/.test(delegataire)) {
        return json({ erreur: "code délégataire illisible : 6 caractères. Laissez-le vide si l'organisme ne vous en a pas donné." }, 400);
      }
      if (population.length > 30) return json({ erreur: "code population trop long : 30 caractères au plus." }, 400);
      if (option.length > 30) return json({ erreur: "code option trop long : 30 caractères au plus." }, 400);

      const { error: eU } = await supabase.from("paie_garanties_societe").update({
        organisme_code_dsn: codeOrg, reference_contrat: reference,
        delegataire_dsn: delegataire || null, population_dsn: population || null, option_dsn: option || null,
      }).eq("id", id);
      if (eU) return json({ erreur: "enregistrement impossible : " + eU.message }, 500);
      return json({ success: true, message: "Identifiants DSN enregistrés : organisme " + codeOrg
        + ", contrat " + reference + ". Régénérez la DSN du mois pour qu'elle les porte." });
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

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 28/09 — LA PORTE UNIQUE DE LA DSN (meme principe que la paie)
//
// L ecran DSN ne parle plus qu a cette route. Elle verifie la session,
// l organisme, le dossier confie et le droit du geste, puis transmet de
// serveur a serveur, avec la cle, aux routes de generation (generer) et de
// depot (deposer), qui ne changent pas. La cle ne s affiche plus jamais a
// l ecran ; elle reste acceptee pour les scripts.
//
// LES DROITS :
//   · consulter              : droit nul (dossier confie suffit)
//   · regler la societe      : paie_contrats (URSSAF, IBAN, taux AT,
//                              mutuelle et prevoyance)
//   · generer la DSN         : paie_preparer
//   · contrôlée, déposée, identifiants net-entreprises, depot :
//                              dsn_deposer
//
// 🚨 LES GARDE-FOUS DU DEPOT (action « deposer ») :
//   BLOQUANTS
//     1. la declaration doit etre passee dans dsn-val (statut contrôlée) ;
//     2. aucun bulletin du mois ne doit rester en brouillon : la DSN ne lit
//        que les bulletins emis, un brouillon est un salarie absent ;
//     3. autant de contrats dans le fichier que de salaries payes ;
//     4. le brut declare doit egaler le brut des bulletins emis : sinon la
//        declaration a ete generee avant une emission ou un rectificatif,
//        et il faut la regenerer.
//   A CONFIRMER (une confirmation explicite, inscrite au journal)
//     5. la masse salariale varie de plus de 30 % par rapport au mois
//        precedent ;
//     6. l effectif declare change par rapport au mois precedent.
// ═══════════════════════════════════════════════════════════════════════

type Ctx = { cleServeur: boolean; email: string; ip: string | null; hote: string };
type Regle = { droit: Droit | null; cible: string; ecrit: boolean };

const REGLES: Record<string, Regle> = {
  etat: { droit: null, cible: "aucune", ecrit: false },
  urssaf: { droit: "paie_contrats", cible: "societe", ecrit: true },
  taux_at: { droit: "paie_contrats", cible: "societe", ecrit: true },
  // 06/10 : la societe ne releve pas de la taxe d apprentissage.
  taxe_apprentissage: { droit: "paie_contrats", cible: "societe", ecrit: true },
  garantie: { droit: "paie_contrats", cible: "societe", ecrit: true },
  garantie_fin: { droit: "paie_contrats", cible: "garantie", ecrit: true },
  // 05/10 : les identifiants DSN du contrat (ils ne changent pas la paie).
  garantie_dsn: { droit: "paie_contrats", cible: "garantie", ecrit: true },
  voir: { droit: null, cible: "declaration", ecrit: false },
  contenu: { droit: null, cible: "declaration", ecrit: false },
  controlee: { droit: "dsn_deposer", cible: "declaration", ecrit: true },
  deposee: { droit: "dsn_deposer", cible: "declaration", ecrit: true },
  crm: { droit: "dsn_deposer", cible: "declaration", ecrit: true },
  // ---- 28/09 : le relais ----
  generer: { droit: "paie_preparer", cible: "societe", ecrit: true },
  acces_etat: { droit: null, cible: "societe", ecrit: false },
  acces_enregistrer: { droit: "dsn_deposer", cible: "societe", ecrit: true },
  acces_tester: { droit: "dsn_deposer", cible: "societe", ecrit: false },
  deposer: { droit: "dsn_deposer", cible: "declaration", ecrit: true },
};

async function cibleDe(spec: string, c: any): Promise<{ societeId: string | null; reference: string | null }> {
  if (spec === "aucune") return { societeId: null, reference: null };
  const id = spec === "societe" ? q(c.societe_id) : q(c.id);
  if (!id) return { societeId: null, reference: null };
  const table = spec === "societe" ? "compta_societes"
    : spec === "declaration" ? "dsn_declarations"
    : spec === "garantie" ? "paie_garanties_societe" : null;
  if (!table) return { societeId: null, reference: id };
  const colonne = spec === "societe" ? "id" : "societe_id";
  const { data } = await supabase.from(table).select(colonne).eq("id", id).maybeSingle();
  return { societeId: data ? String((data as any)[colonne]) : null, reference: id };
}

async function journal(societeId: string | null, ctx: Ctx, action: string, cible: string,
  reference: string | null, apres: any): Promise<void> {
  const { error } = await supabase.from("compta_audit").insert({
    societe_id: societeId, email: ctx.email, action: action, cible: cible,
    reference: reference, avant: null, apres: apres === undefined ? null : apres, adresse_ip: ctx.ip,
  });
  if (error) console.error("[dsn/dossier] journal :", error.message);
}

// ⛔ LE MOT DE PASSE NET-ENTREPRISES N ENTRE JAMAIS AU JOURNAL.
function pourJournal(c: any): any {
  const copie: any = {};
  for (const k of Object.keys(c || {})) {
    if (k === "mot_de_passe" || k === "motdepasse" || k === "cle" || k === "secret" || k === "contenu") continue;
    copie[k] = c[k];
  }
  return copie;
}

async function relais(ctx: Ctx, chemin: string, init: any): Promise<NextResponse> {
  try {
    const r = await fetch("https://" + ctx.hote + chemin, { ...init, cache: "no-store" });
    const texte = await r.text();
    return new NextResponse(texte || "{}", {
      status: r.status, headers: { ...SANS_CACHE, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return json({ erreur: "appel interne impossible : " + String(e && e.message ? e.message : e) }, 502);
  }
}

function cle(): string {
  return encodeURIComponent(process.env.CRON_SECRET || "");
}

function moisPrecedent(periode: string): string {
  const d = new Date(periode.slice(0, 7) + "-01T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 7) + "-01";
}

function finDuMois(periode: string): string {
  const d = new Date(periode.slice(0, 7) + "-01T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  return d.toISOString().slice(0, 10);
}

function eur(n: any): string {
  return Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

// Les garde-fous d un depot : ce qui bloque, et ce qui demande confirmation.
async function gardeFous(declarationId: string, sansDsnVal?: boolean): Promise<{ bloquants: string[]; ecarts: string[] }> {
  const bloquants: string[] = [];
  const ecarts: string[] = [];

  const { data: d } = await supabase.from("dsn_declarations").select("*").eq("id", declarationId).maybeSingle();
  if (!d) return { bloquants: ["déclaration introuvable."], ecarts: [] };
  const dec: any = d;
  const periode = String(dec.periode).slice(0, 10);
  const fin = finDuMois(periode);

  // 1. dsn-val
  if (!sansDsnVal && dec.statut === "brouillon") {
    bloquants.push("la déclaration n'est pas passée dans dsn-val : faites-la contrôler, puis touchez « Passé dans dsn-val ».");
  }

  // 2. aucun brouillon, et les bulletins emis du mois
  const { data: bul } = await supabase.from("paie_bulletins")
    .select("contrat_id, statut, brut, numero, paie_contrats(paie_salaries(nom, prenom))")
    .eq("societe_id", dec.societe_id).gte("periode", periode).lte("periode", fin)
    .in("statut", ["brouillon", "emis"]);
  const bulletins = (bul || []) as any[];
  const brouillons = bulletins.filter(function (b) { return b.statut === "brouillon"; });
  if (brouillons.length > 0) {
    bloquants.push(brouillons.length + " bulletin(s) du mois encore en brouillon ("
      + brouillons.map(function (b) {
        const s = (b.paie_contrats && b.paie_contrats.paie_salaries) || {};
        return (String(s.prenom || "") + " " + String(s.nom || "").toUpperCase()).trim() || b.numero;
      }).join(", ")
      + ") : la DSN ne lit que les bulletins émis, ces salariés en seraient absents. Émettez-les, régénérez la DSN, puis déposez.");
  }
  const emis = bulletins.filter(function (b) { return b.statut === "emis"; });
  const contratsPayes: any = {};
  let brutEmis = 0;
  for (const b of emis) { contratsPayes[b.contrat_id] = true; brutEmis += Number(b.brut || 0); }
  const nbPayes = Object.keys(contratsPayes).length;

  // 3. les contrats dans le fichier
  if (dec.chemin_fichier) {
    const { data: blob } = await supabase.storage.from("documents-signes").download(dec.chemin_fichier);
    if (blob) {
      const texte = Buffer.from(await blob.arrayBuffer()).toString("latin1");
      const nbContrats = texte.split("\n").filter(function (l) { return l.indexOf("S21.G00.40.001,") === 0; }).length;
      const nature = (texte.split("\n").filter(function (l) { return l.indexOf("S20.G00.05.001,") === 0; })[0] || "");
      const mensuelle = nature.indexOf("'01'") >= 0;
      if (mensuelle && nbContrats < nbPayes) {
        bloquants.push(nbPayes + " salarié(s) payé(s) ce mois-ci, mais " + nbContrats
          + " contrat(s) dans la déclaration : elle a été générée avant une émission. Régénérez-la.");
      }
    } else {
      bloquants.push("le fichier de la déclaration est illisible : régénérez-la.");
    }
  } else {
    bloquants.push("la déclaration n'a pas de fichier : générez-la.");
  }

  // 4. le brut declare = le brut emis
  if (dec.total_brut !== null && dec.total_brut !== undefined && emis.length > 0
    && Math.abs(Number(dec.total_brut) - brutEmis) > 1) {
    bloquants.push("le brut déclaré (" + eur(dec.total_brut) + ") n'est pas celui des bulletins émis ("
      + eur(brutEmis) + ") : un bulletin a été émis ou rectifié après la génération. Régénérez la DSN.");
  }

  // 5 et 6. comparaison avec le mois precedent (derniere declaration)
  const precedent = moisPrecedent(periode);
  const { data: avant } = await supabase.from("dsn_declarations")
    .select("total_brut, nb_individus, numero_ordre, periode")
    .eq("societe_id", dec.societe_id).gte("periode", precedent).lte("periode", finDuMois(precedent))
    .order("numero_ordre", { ascending: false }).limit(1);
  const p: any = ((avant || []) as any[])[0];
  if (p) {
    const brutAvant = Number(p.total_brut || 0);
    const brutMaintenant = Number(dec.total_brut || 0);
    if (brutAvant > 0) {
      const ecart = Math.abs(brutMaintenant - brutAvant) / brutAvant * 100;
      if (ecart > 30) {
        ecarts.push("la masse salariale passe de " + eur(brutAvant) + " à " + eur(brutMaintenant)
          + " (" + (brutMaintenant >= brutAvant ? "+" : "−") + Math.round(ecart) + " %) par rapport au mois précédent.");
      }
    }
    const effAvant = Number(p.nb_individus || 0);
    const effMaintenant = Number(dec.nb_individus || 0);
    if (effAvant > 0 && effMaintenant !== effAvant) {
      ecarts.push("l'effectif déclaré passe de " + effAvant + " à " + effMaintenant + " salarié(s).");
    }
  }

  return { bloquants: bloquants, ecarts: ecarts };
}

async function actionsDsn(c: any, action: string, ctx: Ctx): Promise<NextResponse | null> {

  if (action === "generer") {
    return relais(ctx, "/api/dsn/generer?secret=" + cle(), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ societe_id: c.societe_id, periode: c.periode }),
    });
  }

  if (action === "acces_etat" || action === "acces_tester") {
    return relais(ctx, "/api/dsn/deposer?action=" + (action === "acces_etat" ? "etat" : "tester")
      + "&v=" + Date.now() + "&societe=" + encodeURIComponent(q(c.societe_id)) + "&secret=" + cle(), { method: "GET" });
  }

  if (action === "acces_enregistrer") {
    return relais(ctx, "/api/dsn/deposer?secret=" + cle(), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "enregistrer", societe_id: c.societe_id,
        siret_declarant: c.siret_declarant, nom_declarant: c.nom_declarant,
        prenom_declarant: c.prenom_declarant, mot_de_passe: c.mot_de_passe,
      }),
    });
  }

  // 🆕 28/09 — LES MEMES GARDE-FOUS avant « Passé dans dsn-val » et
  // « Marquer déposée » : un fichier perime ne doit ni se faire controler,
  // ni se declarer depose a la main (depot fait sur le portail).
  if ((action === "controlee" || action === "deposee") && !ctx.cleServeur) {
    const g = await gardeFous(q(c.id), action === "controlee");
    if (g.bloquants.length > 0) {
      return json({ erreur: "⛔ " + g.bloquants.join(" · ") + " Rien n'a été modifié.", garde_fous: g }, 409);
    }
    if (action === "deposee" && g.ecarts.length > 0 && c.confirmer_ecarts !== true) {
      return json({ erreur: "Écart à confirmer (confirmer_ecarts) : " + g.ecarts.join(" · "),
        ecarts: g.ecarts, garde_fous: g }, 409);
    }
    return null;
  }

  if (action === "deposer") {
    const id = q(c.id);
    if (!ctx.cleServeur) {
      const g = await gardeFous(id);
      if (g.bloquants.length > 0) {
        return json({ erreur: "⛔ Dépôt bloqué : " + g.bloquants.join(" · ") + " Rien n'a été déposé.",
          garde_fous: g }, 409);
      }
      if (g.ecarts.length > 0 && c.confirmer_ecarts !== true) {
        return json({ erreur: "Écart à confirmer avant le dépôt (confirmer_ecarts) : " + g.ecarts.join(" · "),
          ecarts: g.ecarts, garde_fous: g }, 409);
      }
    }
    return relais(ctx, "/api/dsn/deposer?action=deposer&v=" + Date.now()
      + "&declaration=" + encodeURIComponent(id)
      + (c.confirmer_reel === true ? "&confirmer=reel" : "") + "&secret=" + cle(), { method: "GET" });
  }

  return null;
}

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  const cleServeur = !!process.env.CRON_SECRET && secret === process.env.CRON_SECRET;
  const session = cleServeur ? null : sessionCourante();
  if (!cleServeur && !session) {
    return json({ erreur: "Connectez-vous pour ouvrir la DSN : votre session est absente ou a expiré.",
      connexion: true }, 401);
  }

  let c: any = {};
  try { c = await req.json(); } catch { c = {}; }
  const action = q(c.action);

  const ctx: Ctx = {
    cleServeur: cleServeur,
    email: cleServeur ? "cle-serveur" : String(session ? session.email : ""),
    ip: (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null,
    hote: req.headers.get("host") || "",
  };

  const regle = REGLES[action];
  if (!regle) return json({ erreur: "action inconnue : " + action }, 400);

  let cible: { societeId: string | null; reference: string | null } = { societeId: null, reference: null };
  try { cible = await cibleDe(regle.cible, c); } catch (e: any) { return json({ erreur: String(e) }, 500); }
  if (regle.cible !== "aucune" && !cible.societeId) {
    return json({ erreur: "introuvable : l'élément demandé n'existe pas ou n'est pas accessible." }, 404);
  }
  if (!cleServeur && regle.cible !== "aucune") {
    const v = await verifier(regle.droit, cible.societeId);
    if (!v.autorise) return json({ erreur: v.motif || "Accès refusé." }, v.email ? 403 : 401);
  }

  const res = await traiter(req, c, action, ctx);

  // 🆕 29/09 — UN REGLAGE QUI CHANGE LA PAIE PERIME LES BROUILLONS. Le taux
  // accident du travail, la mutuelle et le versement mobilite entrent dans le
  // calcul du bulletin : un brouillon sorti avant leur changement serait faux
  // sans que rien ne le dise. Comme pour toute saisie de paie, on le marque
  // perime : il repasse au rouge et doit etre ressorti avant l emission.
  if (["taux_at", "taxe_apprentissage", "garantie", "garantie_fin", "urssaf"].indexOf(action) >= 0
    && res.status < 400 && cible.societeId) {
    const { error: eP } = await supabase.from("paie_bulletins")
      .update({ controle: { perime: true, depuis: new Date().toISOString(), par: "dsn." + action } })
      .eq("societe_id", cible.societeId).eq("statut", "brouillon");
    if (eP) console.error("[dsn/dossier] peremption :", eP.message);
  }

  if (regle.ecrit && res.status < 400) {
    await journal(cible.societeId, ctx, "dsn." + action, regle.cible, cible.reference, pourJournal(c));
  }
  return res;
}
