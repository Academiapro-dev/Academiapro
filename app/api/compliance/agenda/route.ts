import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

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

// ---------------------------------------------------------------------------
// L AGENDA — TOUTES LES ECHEANCES DU PORTEFEUILLE — 31/08.
//
// 🚨 C EST L ECRAN DU MATIN. Un gestionnaire qui suit des centaines de
// societes ne veut pas savoir ce qui se passe chez l une d elles : il veut
// savoir CE QUI ARRIVE, toutes societes confondues, classe par urgence.
// Sans cette vue, il devrait ouvrir ses dossiers un par un — c est
// exactement le travail que l outil doit lui epargner.
//
// ⚠️ LE TRI EST PAR DATE, JAMAIS PAR SOCIETE. L ordre alphabetique n a
// aucun interet ici : ce qui compte, c est ce qui tombe en premier.
//
// ⚠️ AUCUN PLAFOND SUPPOSE. La lecture est paginee en base ; le nombre de
// societes ne change ni le temps de reponse ni le volume transmis.
//
// ⚠️ SUPABASE TRONQUE SILENCIEUSEMENT A 1000 OBJETS. La jointure manuelle
// des libelles de societes est donc paginee elle aussi : sans cela, un
// portefeuille au-dela de mille dossiers afficherait des lignes sans nom,
// sans qu aucune erreur ne le signale.
//
// ---- DEFAUT TROUVE A L AUDIT DU SOIR — 31/08 ---------------------------
//
// 🚨 LES COMPTEURS PORTAIENT SUR LA PAGE, PAS SUR LE PORTEFEUILLE. Ils
// etaient calcules en parcourant les lignes affichees — cent au plus. Sur
// un portefeuille de quatre cents echeances, « 0 echue » pouvait donc s
// afficher alors que trente etaient en retard sur les pages suivantes.
//
// POURQUOI C EST GRAVE ICI PLUS QU AILLEURS : ces chiffres sont la PREMIERE
// CHOSE que le gestionnaire lit le matin. Ils repondent a « qu est-ce qui
// brule ? ». Un compteur faux a cet endroit precis ne se remarque pas — il
// rassure a tort.
//
// LA CORRECTION : chaque compteur est une requete de COMPTAGE en base
// (count exact, head: true), portant sur tout l organisme. Aucune ligne n
// est rapatriee pour compter : le cout est le meme avec quatre cents
// echeances qu avec quarante mille.
//
// ⚠️ NE JAMAIS RECALCULER CES CHIFFRES A PARTIR DE `enrichies`. C etait le
// defaut. Un total qui se deduit d une page est faux des la page deux.
//
// ⚠️ CINQ COMPTEURS, ET DEUX D ENTRE EUX COMPTENT DES CHOSES DIFFERENTES.
// `sans_relance_armee` compte des ECHEANCES — combien de choses vont
// tomber sans que personne ne soit prevenu. `societes_sans_relance_armee`
// compte des SOCIETES — combien de dossiers sont muets. Les deux sont
// utiles et ne se deduisent pas l un de l autre : une seule societe muette
// peut porter trente echeances. Le libelle a l ecran doit dire lequel est
// lequel, sinon les chiffres paraissent incoherents.
//
// ---- LA SOURCE ET LA DATE DE VERIFICATION — 04/09 ----------------------
//
// 🚨 CHAQUE ECHEANCE PORTE DESORMAIS SA SOURCE OFFICIELLE ET LA DATE A
// LAQUELLE LA REGLE A ETE VERIFIEE.
//
// POURQUOI. L outil annonce des dates et des montants a des gestionnaires
// qui prennent des decisions dessus. Il n est ni avocat ni fiscaliste, et
// il ne peut pas garantir qu un Etat n a pas change sa regle hier. Ce qui
// protege reellement, ce n est pas une clause disant qu on n est
// responsable de rien : c est de MONTRER D OU VIENT CHAQUE CHIFFRE ET
// QUAND IL A ETE VU. Le client peut alors verifier lui-meme en un clic, et
// il voit immediatement si la regle a ete controlee il y a un mois ou il y
// a deux ans.
//
// ⚠️ `verifie_le` DOIT ETRE MIS A JOUR A CHAQUE RE-VERIFICATION D UNE
// REGLE. Une date figee qui vieillit est pire qu aucune date : elle donne
// une assurance que rien ne soutient.
// ---------------------------------------------------------------------------

const PAR_PAGE_DEFAUT = 100;
const PAR_PAGE_MAX = 500;
const PAS_PAGINATION = 500;

// Fenetre par defaut : ce qui tombe dans les deux mois. Au-dela, un
// gestionnaire ne fait rien de l information le matin meme.
const HORIZON_DEFAUT_JOURS = 60;

function jourISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const session = sessionCourante();
  if (!session || !session.tenantId) {
    return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
  }

  const tenantId = session.tenantId;

  const p = req.nextUrl.searchParams;

  const page = Math.max(1, Number(p.get("page")) || 1);
  const taille = Math.min(PAR_PAGE_MAX, Math.max(1, Number(p.get("taille")) || PAR_PAGE_DEFAUT));
  const debut = (page - 1) * taille;
  const fin = debut + taille - 1;

  const horizonJours = Math.max(1, Number(p.get("jours")) || HORIZON_DEFAUT_JOURS);
  const inclureEchues = p.get("echues") === "1";

  const aujourdhui = jourISO(new Date());
  const limite = jourISO(new Date(Date.now() + horizonJours * 86400000));

  try {
    // ---- LES ECHEANCES DE L ORGANISME ----
    //
    // Le filtre porte sur tenant_id : c est la barriere de cloisonnement.
    // Une echeance d un autre organisme n apparait jamais, quel que soit le
    // parametre envoye.
    let requete = supabase
      .from("compliance_deadlines")
      .select("id, entite_id, rule_code, period_label, due_date, status, amount_due, currency",
        { count: "exact" })
      .eq("tenant_id", tenantId)
      .lte("due_date", limite)
      .order("due_date", { ascending: true })
      .range(debut, fin);

    // Les echeances deja archivees ne sont jamais du bruit utile.
    requete = requete.neq("status", "accuse_archive");

    // Par defaut on montre ce qui arrive. Les echues sont disponibles a la
    // demande : elles comptent, mais elles ne doivent pas noyer la liste du
    // matin.
    if (!inclureEchues) {
      requete = requete.gte("due_date", aujourdhui);
    }

    const { data: lignes, error, count } = await requete;

    if (error) {
      console.error("[compliance/agenda] lecture echeances :", error.message);
      return NextResponse.json({ ok: false, erreur: "Lecture impossible." }, { status: 500 });
    }

    // ---- LES SOCIETES QUI N ONT PAS ARME LA RELANCE ----
    //
    // Lue AVANT les compteurs d echeances, parce que le compteur
    // `sans_relance_armee` a besoin de la liste de leurs identifiants.
    //
    // ⚠️ PAGINATION EXPLICITE : Supabase tronque a 1000 lignes sans erreur.
    // Un portefeuille de 1 200 dossiers verrait les derniers ignores, et le
    // compteur serait faux sans que rien ne le signale.
    const idsMuettes: string[] = [];
    let offsetM = 0;

    while (true) {
      const { data, error: eM } = await supabase
        .from("compliance_tenants")
        .select("id")
        .eq("tenant_id", tenantId)
        .or("relance_auto.is.null,relance_auto.eq.false")
        .order("id", { ascending: true })
        .range(offsetM, offsetM + PAS_PAGINATION - 1);

      if (eM) {
        console.error("[compliance/agenda] societes sans relance :", eM.message);
        break;
      }

      const lot = data || [];
      for (const s of lot) idsMuettes.push(s.id);
      if (lot.length < PAS_PAGINATION) break;
      offsetM = offsetM + PAS_PAGINATION;
    }

    // ---- LE RESUME, COMPTE EN BASE SUR TOUT LE PORTEFEUILLE ----
    //
    // 🚨 CES CHIFFRES NE DEPENDENT NI DE LA PAGE AFFICHEE, NI DE L HORIZON
    // CHOISI. Une echeance echue reste echue meme si le gestionnaire
    // regarde les trente prochains jours : la masquer du compteur
    // reviendrait a lui cacher precisement ce qu il doit voir.
    //
    // `head: true` ne rapatrie AUCUNE ligne — seul le total revient.
    async function compter(construire: (q: any) => any): Promise<number> {
      const base = supabase
        .from("compliance_deadlines")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .neq("status", "accuse_archive");

      const { count: n, error: e } = await construire(base);
      if (e) {
        console.error("[compliance/agenda] comptage :", e.message);
        return 0;
      }
      return n === null || n === undefined ? 0 : n;
    }

    const dans7 = jourISO(new Date(Date.now() + 7 * 86400000));
    const dans30 = jourISO(new Date(Date.now() + 30 * 86400000));

    const [nbEchues, nbSous7, nbSous30] = await Promise.all([
      // Echues : tout ce qui est passe et n a pas ete archive.
      compter((q: any) => q.lt("due_date", aujourdhui)),
      // Sous 7 jours : d aujourd hui inclus a J+7.
      compter((q: any) => q.gte("due_date", aujourdhui).lte("due_date", dans7)),
      // Sous 30 jours : d aujourd hui inclus a J+30. Cette tranche CONTIENT
      // la precedente — c est voulu : « ce qui tombe dans le mois » est la
      // question que se pose le gestionnaire, pas « entre le huitieme et le
      // trentieme jour ».
      compter((q: any) => q.gte("due_date", aujourdhui).lte("due_date", dans30)),
    ]);

    // ECHEANCES A VENIR DONT LA SOCIETE NE PREVIENDRA PERSONNE.
    //
    // ⚠️ SI AUCUNE SOCIETE N EST MUETTE, LE FILTRE .in() SUR UNE LISTE VIDE
    // NE DOIT PAS ETRE ENVOYE : PostgREST le rejette ou rend n importe
    // quoi. On rend zero directement, ce qui est la reponse juste.
    let nbSansRelance = 0;
    if (idsMuettes.length > 0) {
      // La liste des identifiants passe dans l URL de la requete : au-dela
      // d un millier, elle deviendrait trop longue. On compte alors par
      // lots et on additionne.
      for (let i = 0; i < idsMuettes.length; i = i + PAS_PAGINATION) {
        const lot = idsMuettes.slice(i, i + PAS_PAGINATION);
        const n = await compter((q: any) =>
          q.gte("due_date", aujourdhui).in("entite_id", lot)
        );
        nbSansRelance = nbSansRelance + n;
      }
    }

    const resume = {
      // Des ECHEANCES.
      echues: nbEchues,
      sous_7_jours: nbSous7,
      sous_30_jours: nbSous30,
      // Des ECHEANCES a venir, portees par une societe qui n a pas arme la
      // relance. Nom conserve : l ecran existant l affiche deja.
      sans_relance_armee: nbSansRelance,
      // Des SOCIETES. Nouveau compteur : combien de dossiers sont muets.
      societes_sans_relance_armee: idsMuettes.length,
    };

    const echeances: any[] = lignes || [];

    if (echeances.length === 0) {
      return NextResponse.json({
        ok: true,
        echeances: [],
        resume: resume,
        page: page,
        taille: taille,
        total: count || 0,
        pages: 1,
        horizon_jours: horizonJours,
      });
    }

    // ---- LES LIBELLES DES SOCIETES CONCERNEES ----
    //
    // Une seule requete pour toute la page, jamais une par ligne : cent
    // lignes feraient cent allers-retours.
    const idsEntites: string[] = [];
    for (const e of echeances) {
      if (e.entite_id && idsEntites.indexOf(e.entite_id) < 0) idsEntites.push(e.entite_id);
    }

    const societes: any = {};
    for (let i = 0; i < idsEntites.length; i = i + PAS_PAGINATION) {
      const lot = idsEntites.slice(i, i + PAS_PAGINATION);
      const { data: ent, error: eEnt } = await supabase
        .from("compliance_tenants")
        .select("id, label, legal_name, formation_state, email_contact, relance_auto")
        .eq("tenant_id", tenantId)
        .in("id", lot);

      if (eEnt) {
        console.error("[compliance/agenda] lecture societes :", eEnt.message);
      } else {
        for (const s of ent || []) societes[s.id] = s;
      }
    }

    // ---- LES TITRES DES OBLIGATIONS ----
    // Catalogue commun, petit et stable : une seule lecture suffit.
    //
    // 🚨 `source_url`, `verifie_le`, `filing_note` ET `penalty_note` SONT
    // LUS ICI — 04/09. Ce sont eux qui permettent a l ecran de montrer d ou
    // vient chaque chiffre. Sans la source, le gestionnaire doit croire
    // l outil sur parole ; avec elle, il verifie en un clic.
    const { data: regles } = await supabase
      .from("compliance_rules")
      .select("code, title, jurisdiction, channel, source_url, verifie_le, filing_note, penalty_note")
      .limit(500);

    const titres: any = {};
    for (const r of regles || []) titres[r.code] = r;

    const maintenant = Date.now();

    const enrichies = echeances.map(function (e: any) {
      const s = societes[e.entite_id] || {};
      const r = titres[e.rule_code] || {};
      const jours = Math.ceil(
        (new Date(String(e.due_date).slice(0, 10)).getTime() - maintenant) / 86400000
      );
      return {
        id: e.id,
        entite_id: e.entite_id,
        societe: s.label || "—",
        societe_legale: s.legal_name || null,
        etat: s.formation_state || null,
        relance_armee: s.relance_auto === true,
        email_contact: s.email_contact || null,
        obligation: r.title || e.rule_code,
        rule_code: e.rule_code,
        juridiction: r.jurisdiction || null,
        canal: r.channel || null,
        // La source officielle et la date a laquelle la regle a ete
        // verifiee. Affichees telles quelles : on ne cache pas une regle
        // ancienne, on la montre avec sa date.
        source_url: r.source_url || null,
        verifie_le: r.verifie_le || null,
        precision: r.filing_note || null,
        penalite: r.penalty_note || null,
        periode: e.period_label,
        due_date: e.due_date,
        jours: jours,
        echue: jours < 0,
        statut: e.status,
        montant: e.amount_due,
        devise: e.currency,
      };
    });

    const total = count === null || count === undefined ? enrichies.length : count;

    return NextResponse.json({
      ok: true,
      echeances: enrichies,
      resume: resume,
      page: page,
      taille: taille,
      total: total,
      pages: Math.max(1, Math.ceil(total / taille)),
      horizon_jours: horizonJours,
    });
  } catch (e: any) {
    console.error("[compliance/agenda] exception :", String(e && e.message ? e.message : e));
    return NextResponse.json({ ok: false, erreur: "Erreur serveur." }, { status: 500 });
  }
}
