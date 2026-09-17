import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════════════
// LA GESTION DE LA PAIE — 15/09/2026, corrigee le 16/09
//
// Une seule route pour tout ce qui n est pas le calcul : lister les
// contrats, ajouter un salarie, ouvrir un contrat, saisir les heures du
// mois, lister et emettre les bulletins.
//
// 🚨 LE CALCUL N EST PAS ICI. Il vit dans /api/paie/calculer, et nulle part
// ailleurs. Deux calculs a deux endroits finissent toujours par diverger —
// et sur un bulletin, diverger veut dire un redressement.
//
// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 17/09 — L ARRET DE TRAVAIL SE VERROUILLE A LA SAISIE
//
// Les trois fichiers DSN passent l outil officiel. Mais l arret de travail
// n y est arrive qu avec trois donnees ajoutees A LA MAIN en base : cette
// route laissait enregistrer un arret que la CPAM aurait rejete.
//
// CE QUE dsn-val EXIGE, ET QUE LA ROUTE REFUSE DESORMAIS D IGNORER :
//   · la DATE DE FIN PREVISIONNELLE de l arret (S21.G00.60.003)
//   · EN SUBROGATION, quatre donnees qui vont ensemble — debut, FIN, IBAN et
//     BIC (controle CCH-11). L IBAN seul etait deja reclame.
//
// ⚠️ L ECRAN LE RECLAME AUSSI, MAIS UN ECRAN NE PROTEGE DE RIEN : il se
// contourne, et demain un autre ecran ou un import appellera cette route.
// C est ici que la regle tient.
//
// 🚨 ET L IBAN EST CONTROLE PAR SA CLE, comme le numero de securite
// sociale. Un IBAN faux ne fait pas rejeter le signalement : il envoie les
// indemnites journalieres SUR UN COMPTE QUI N EXISTE PAS, et l employeur qui
// a maintenu le salaire attend un virement qui ne viendra jamais.
// ═══════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function propre(v: any): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return t.length > 0 ? t : null;
}

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 16/09 — LE CONTROLE DE LA CLE DU NUMERO DE SECURITE SOCIALE
//
// DEFAUT TROUVE A L ESSAI : le jeu d essai portait 1 92 04 99 999 999 42.
// La cle exacte de ce numero est 82. Rien ne l avait signale, et la
// DECLARATION AURAIT ETE REJETEE — apres la date limite de depot, donc avec
// une penalite de retard.
//
// LA REGLE : cle = 97 - (les treize premiers chiffres modulo 97).
// ⚠️ LA CORSE FAIT EXCEPTION : le departement s ecrit 2A ou 2B, et se
// remplace par 19 et 18 AVANT le calcul. Sans cela, tous les numeros corses
// seraient declares faux.
// ⚠️ ON UTILISE BigInt : treize chiffres depassent la precision exacte d un
// nombre JavaScript ordinaire, et le modulo rendrait un resultat faux sur
// certains numeros — donc un refus incomprehensible sur un numero valide.
//
// 🚨 ON REFUSE A LA SAISIE PLUTOT QUE DE SIGNALER APRES COUP. Meme regle
// que l entreprise utilisatrice sur un contrat de mission, et que
// l irrevocabilite des mandats immobiliers.
// ═══════════════════════════════════════════════════════════════════════
function controlerNir(brut: string): { ok: boolean; message?: string; propre?: string } {
  const n = String(brut).replace(/[^0-9AaBb]/g, "").toUpperCase();

  if (n.length !== 15) {
    return {
      ok: false,
      message: "le numéro de sécurité sociale doit comporter 15 chiffres "
        + "(13 pour le numéro, 2 pour la clé). Celui-ci en compte " + n.length + ".",
    };
  }

  const corps = n.slice(0, 13);
  const cleSaisie = Number(n.slice(13));

  // ⚠️ 2A ET 2B NE PEUVENT APPARAITRE QU EN POSITION 6-7 (le departement).
  const pourCalcul = corps.replace("2A", "19").replace("2B", "18");
  if (!/^\d{13}$/.test(pourCalcul)) {
    return { ok: false, message: "le numéro de sécurité sociale contient un caractère inattendu." };
  }

  const attendue = 97 - Number(BigInt(pourCalcul) % 97n);

  if (attendue !== cleSaisie) {
    return {
      ok: false,
      message: "la clé du numéro de sécurité sociale est fausse : "
        + "elle devrait être " + String(attendue).padStart(2, "0")
        + ", et non " + String(cleSaisie).padStart(2, "0") + ". "
        + "⛔ Un numéro dont la clé est fausse fait REJETER la DSN.",
    };
  }

  // Remis en forme lisible : 1 92 04 99 999 999 42
  const f = n.slice(0, 1) + " " + n.slice(1, 3) + " " + n.slice(3, 5) + " "
    + n.slice(5, 7) + " " + n.slice(7, 10) + " " + n.slice(10, 13) + " " + n.slice(13);

  return { ok: true, propre: f };
}

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 17/09 — LE CONTROLE DE LA CLE DE L IBAN
//
// LA REGLE (norme ISO 13616) : on reporte les quatre premiers caracteres a
// la fin, on remplace chaque lettre par son rang (A = 10, B = 11… Z = 35),
// et le nombre obtenu, divise par 97, doit laisser un reste de 1.
//
// ⚠️ LE NOMBRE A PLUS DE TRENTE CHIFFRES : on ne le construit pas. On fait
// la division chiffre apres chiffre, en ne gardant que le reste — c est la
// division posee de l ecole, et elle ne deborde jamais.
//
// ⚠️ UN IBAN FRANCAIS COMPTE VINGT-SEPT CARACTERES. Un chiffre oublie se
// voit tout de suite a la longueur : on le dit avant meme de calculer la
// cle, parce que « la cle est fausse » n aide personne a trouver l oubli.
//
// 🚨 POURQUOI ICI : un IBAN faux ne fait PAS rejeter le signalement. La
// CPAM l accepte, et verse les indemnites journalieres sur un compte qui
// n existe pas. L erreur ne se decouvre qu au virement manquant.
// ═══════════════════════════════════════════════════════════════════════
function controlerIban(brut: string): { ok: boolean; message?: string; propre?: string } {
  const s = String(brut).replace(/\s/g, "").toUpperCase();

  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) {
    return {
      ok: false,
      message: "l'IBAN n'a pas la forme attendue : deux lettres pour le pays, "
        + "deux chiffres de clé, puis le numéro de compte (FR76 …).",
    };
  }
  if (s.slice(0, 2) === "FR" && s.length !== 27) {
    return {
      ok: false,
      message: "un IBAN français compte 27 caractères. Celui-ci en compte "
        + s.length + " : un caractère a probablement été oublié ou doublé.",
    };
  }

  const retourne = s.slice(4) + s.slice(0, 4);
  let reste = 0;
  for (let i = 0; i < retourne.length; i++) {
    const rang = String(parseInt(retourne[i], 36));   // 0-9 tel quel, A = 10 … Z = 35
    for (let k = 0; k < rang.length; k++) {
      reste = (reste * 10 + Number(rang[k])) % 97;
    }
  }

  if (reste !== 1) {
    return {
      ok: false,
      message: "la clé de l'IBAN est fausse : un caractère a été mal recopié. "
        + "⛔ Les indemnités journalières partiraient sur un compte qui "
        + "n'existe pas. Vérifier l'IBAN sur le relevé d'identité bancaire.",
    };
  }

  return { ok: true, propre: s };
}

// LE BIC : huit ou onze caracteres — quatre lettres pour la banque, deux
// pour le pays, deux pour la place, et trois facultatifs pour l agence.
// ⚠️ IL N A PAS DE CLE : on ne peut controler que sa FORME. C est peu, mais
// cela arrete un BIC tronque ou colle a la place de l IBAN.
function controlerBic(brut: string): { ok: boolean; message?: string; propre?: string } {
  const s = String(brut).replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(s)) {
    return {
      ok: false,
      message: "le BIC n'a pas la forme attendue : 8 ou 11 caractères, dont "
        + "les six premiers sont des lettres (BNPAFRPP, BDFEFRPPCCT…). "
        + "Celui-ci en compte " + s.length + ".",
    };
  }
  return { ok: true, propre: s };
}

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  let c: any = {};
  try { c = await req.json(); } catch { c = {}; }
  const action = String(c.action || "").trim();

  try {
    // ---- LISTER LES CONTRATS ----
    if (action === "contrats") {
      const { data, error } = await supabase
        .from("paie_contrats")
        .select("*, paie_salaries(nom, prenom)")
        .eq("statut", "actif")
        .order("date_debut", { ascending: false })
        .limit(200);

      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });

      // Les societes, pour le choix a la creation.
      const { data: societes } = await supabase
        .from("compta_societes")
        .select("id, tenant_id, raison_sociale, effectif, siret")
        .order("raison_sociale");

      return NextResponse.json({ success: true, contrats: data || [], societes: societes || [] });
    }

    // ---- CREER UN SALARIE ET SON CONTRAT ----
    //
    // ⚠️ LES DEUX SE CREENT ENSEMBLE : un salarie sans contrat n a aucun
    // usage, et laisser deux ecrans separes obligerait a revenir en arriere.
    if (action === "nouveau") {
      const societeId = propre(c.societe_id);
      if (!societeId) return NextResponse.json({ erreur: "choisir une societe" }, { status: 400 });

      const { data: soc } = await supabase
        .from("compta_societes").select("tenant_id").eq("id", societeId).maybeSingle();
      if (!soc) return NextResponse.json({ erreur: "societe introuvable" }, { status: 404 });

      const nom = propre(c.nom);
      const prenom = propre(c.prenom);
      if (!nom || !prenom) {
        return NextResponse.json({
          erreur: "le nom et le prenom du salarie sont obligatoires",
        }, { status: 400 });
      }

      // 🚨 LE NUMERO DE SECURITE SOCIALE EST CONTROLE AVANT D ETRE ECRIT.
      // ⚠️ IL EST LAISSE FACULTATIF A LA SAISIE — on peut embaucher avant
      // de l avoir — mais des qu il est donne, il doit etre juste.
      let nirPropre: string | null = null;
      const nirSaisi = propre(c.numero_secu);
      if (nirSaisi) {
        const v = controlerNir(nirSaisi);
        if (!v.ok) return NextResponse.json({ erreur: v.message }, { status: 400 });
        nirPropre = v.propre || nirSaisi;
      }

      const { data: sal, error: eSal } = await supabase
        .from("paie_salaries")
        .insert({
          tenant_id: soc.tenant_id, societe_id: societeId,
          nom: nom.toUpperCase(), prenom: prenom,
          sexe: propre(c.sexe), date_naissance: propre(c.date_naissance),
          numero_secu: nirPropre,
          adresse: propre(c.adresse), code_postal: propre(c.code_postal),
          ville: propre(c.ville), email: propre(c.email),
        })
        .select().maybeSingle();

      if (eSal) return NextResponse.json({ erreur: eSal.message }, { status: 500 });

      const type = propre(c.type_contrat) || "mission";

      // 🚨 UN CONTRAT DE MISSION SANS ENTREPRISE UTILISATRICE NI MOTIF DE
      // RECOURS EST REQUALIFIABLE EN CDI par le conseil de prud hommes. On
      // refuse a la saisie plutot que de le signaler apres coup — meme
      // regle que l irrevocabilite des mandats immobiliers.
      if (type === "mission") {
        if (!propre(c.eu_raison_sociale)) {
          return NextResponse.json({
            erreur: "l entreprise utilisatrice est obligatoire sur un contrat de mission : "
              + "sans elle, le contrat est requalifiable en CDI.",
          }, { status: 400 });
        }
        if (!propre(c.motif_recours)) {
          return NextResponse.json({
            erreur: "le motif de recours est obligatoire. Les six motifs legaux : "
              + "remplacement d un salarie absent, accroissement temporaire d activite, "
              + "emploi saisonnier, usage constant, remplacement d un chef d entreprise, "
              + "complement de formation.",
          }, { status: 400 });
        }
      }

      const { data: ctr, error: eCtr } = await supabase
        .from("paie_contrats")
        .insert({
          tenant_id: soc.tenant_id, societe_id: societeId, salarie_id: sal.id,
          type_contrat: type,
          date_debut: propre(c.date_debut), date_fin: propre(c.date_fin),
          intitule_poste: propre(c.intitule_poste) || "A preciser",
          categorie: propre(c.categorie) || "non_cadre",
          idcc: c.idcc ? Number(c.idcc) : null,
          salaire_horaire: c.salaire_horaire ? Number(c.salaire_horaire) : null,
          salaire_mensuel: c.salaire_mensuel ? Number(c.salaire_mensuel) : null,
          duree_hebdo: c.duree_hebdo ? Number(c.duree_hebdo) : 35,
          eu_raison_sociale: propre(c.eu_raison_sociale),
          eu_siret: propre(c.eu_siret),
          eu_adresse: propre(c.eu_adresse),
          motif_recours: propre(c.motif_recours),
          // 🚨 RUBRIQUE OBLIGATOIRE EN DSN (S21.G00.40.004), et SENSIBLE A
          // LA CASSE : on ne met pas en majuscules comme on le fait pour le
          // nom de famille. « 653a » et « 653A » ne sont pas le meme code.
          pcs_ese: propre(c.pcs_ese),
          motif_detail: propre(c.motif_detail),
          poste_chez_eu: propre(c.poste_chez_eu),
          ifm_due: c.ifm_due === false ? false : true,
        })
        .select().maybeSingle();

      if (eCtr) return NextResponse.json({ erreur: eCtr.message }, { status: 500 });

      return NextResponse.json({
        success: true, contrat_id: ctr.id,
        message: prenom + " " + nom.toUpperCase() + " est enregistré avec son contrat.",
      });
    }

    // ---- LES ELEMENTS D UN MOIS ----
    if (action === "elements") {
      const { data, error } = await supabase
        .from("paie_elements")
        .select("*")
        .eq("contrat_id", propre(c.contrat_id))
        .eq("periode", propre(c.periode))
        .order("cree_le");

      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });
      return NextResponse.json({ success: true, elements: data || [] });
    }

    // ---- AJOUTER UN ELEMENT ----
    if (action === "ajouter_element") {
      const contratId = propre(c.contrat_id);
      const periode = propre(c.periode);
      if (!contratId || !periode) {
        return NextResponse.json({ erreur: "contrat et periode obligatoires" }, { status: 400 });
      }

      const { data: ctr } = await supabase
        .from("paie_contrats").select("tenant_id, societe_id")
        .eq("id", contratId).maybeSingle();
      if (!ctr) return NextResponse.json({ erreur: "contrat introuvable" }, { status: 404 });

      // 🆕 16/09 — ON REFUSE D AJOUTER UN ELEMENT SUR UN MOIS DEJA EMIS.
      // ⚠️ SINON LE BULLETIN REMIS AU SALARIE ET LA BASE NE DISENT PLUS LA
      // MEME CHOSE : les heures changent, le document non. La correction
      // passe par un bulletin rectificatif, jamais par une retouche
      // silencieuse des heures.
      const { data: emis } = await supabase
        .from("paie_bulletins")
        .select("numero")
        .eq("contrat_id", contratId)
        .eq("periode", periode)
        .eq("statut", "emis")
        .maybeSingle();

      if (emis) {
        return NextResponse.json({
          erreur: "le bulletin " + emis.numero + " de ce mois est déjà émis : "
            + "ses éléments ne peuvent plus changer. Pour corriger, sortez un "
            + "bulletin rectificatif — il annulera celui-ci.",
        }, { status: 400 });
      }

      // ⚠️ LE MONTANT SE CALCULE quand quantite et taux sont donnes : on ne
      // fait pas taper ce que la machine sait faire.
      let montant = c.montant ? Number(c.montant) : 0;
      const q = c.quantite ? Number(c.quantite) : null;
      const t = c.taux ? Number(c.taux) : null;
      if (!montant && q !== null && t !== null) montant = Math.round(q * t * 100) / 100;

      const { error } = await supabase.from("paie_elements").insert({
        tenant_id: ctr.tenant_id, societe_id: ctr.societe_id,
        contrat_id: contratId, periode: periode,
        type_element: propre(c.type_element) || "prime",
        libelle: propre(c.libelle) || "Element",
        quantite: q, taux: t, montant: montant,
        soumis_cotisations: c.soumis_cotisations === false ? false : true,
      });

      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Élément ajouté." });
    }

    // ---- SUPPRIMER UN ELEMENT ----
    //
    // ⚠️ UN ELEMENT SE SUPPRIME TANT QUE LE BULLETIN N EST PAS EMIS. Apres,
    // c est un bulletin rectificatif qu il faut.
    if (action === "supprimer_element") {
      const { data: el } = await supabase
        .from("paie_elements").select("contrat_id, periode")
        .eq("id", propre(c.id)).maybeSingle();

      if (el) {
        const { data: emis } = await supabase
          .from("paie_bulletins")
          .select("numero")
          .eq("contrat_id", el.contrat_id)
          .eq("periode", el.periode)
          .eq("statut", "emis")
          .maybeSingle();

        if (emis) {
          return NextResponse.json({
            erreur: "le bulletin " + emis.numero + " de ce mois est déjà émis : "
              + "ses éléments ne peuvent plus être retirés.",
          }, { status: 400 });
        }
      }

      const { error } = await supabase
        .from("paie_elements").delete().eq("id", propre(c.id));
      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "Élément retiré." });
    }

    // ---- LES BULLETINS D UN CONTRAT ----
    // 🆕 16/09 — ON REND AUSSI LE TYPE ET LE LIEN DE RECTIFICATION : l ecran
    // doit pouvoir dire « rectificatif, remplace le 2026-00003 ».
    if (action === "bulletins") {
      const { data, error } = await supabase
        .from("paie_bulletins")
        .select("id, numero, periode, brut, net_a_payer, cout_employeur, statut, "
          + "chemin_pdf, emis_le, type_bulletin, rectifie_id, annule_le")
        .eq("contrat_id", propre(c.contrat_id))
        .order("periode", { ascending: false })
        .order("numero", { ascending: false });

      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });

      // ⚠️ ON REMPLACE L IDENTIFIANT PAR LE NUMERO LISIBLE : un uuid a
      // l ecran n apprend rien a personne.
      const parId: any = {};
      for (const b of (data || [])) parId[b.id] = b.numero;
      const enrichis = (data || []).map(function (b: any) {
        return { ...b, rectifie_numero: b.rectifie_id ? (parId[b.rectifie_id] || null) : null };
      });

      return NextResponse.json({ success: true, bulletins: enrichis });
    }

    // ---- OUVRIR UN BULLETIN ----
    if (action === "voir_bulletin") {
      const { data: b } = await supabase
        .from("paie_bulletins").select("chemin_pdf")
        .eq("id", propre(c.id)).maybeSingle();

      if (!b || !b.chemin_pdf) {
        return NextResponse.json({ erreur: "aucun PDF pour ce bulletin" }, { status: 404 });
      }

      const { data: signe } = await supabase.storage
        .from("documents-signes").createSignedUrl(b.chemin_pdf, 3600);

      if (!signe) return NextResponse.json({ erreur: "lien impossible" }, { status: 500 });
      return NextResponse.json({ success: true, url: signe.signedUrl });
    }

    // ═══════════════════════════════════════════════════════════════════
    // ---- EMETTRE UN BULLETIN ----
    //
    // 🚨 C EST LE POINT DE NON-RETOUR. Un bulletin emis ne se modifie plus,
    // ne repasse jamais en brouillon, et ne se supprime pas. Il se corrige
    // par un rectificatif. Meme regle que les mandats immobiliers.
    //
    // 🆕🚨 16/09 — UN RECTIFICATIF ANNULE LE BULLETIN QU IL CORRIGE, ET
    // L ORDRE DES DEUX GESTES N EST PAS NEGOCIABLE : on annule l ancien
    // D ABORD, on emet le nouveau ENSUITE. L index unique en base
    // n autorise qu un seul bulletin emis par contrat et par mois — dans
    // l autre ordre, il refuserait l emission, et il aurait raison.
    // ═══════════════════════════════════════════════════════════════════
    if (action === "emettre") {
      const { data: b } = await supabase
        .from("paie_bulletins")
        .select("id, numero, statut, type_bulletin, rectifie_id, periode, "
          + "tenant_id, societe_id, contrat_id")
        .eq("id", propre(c.id)).maybeSingle();

      if (!b) return NextResponse.json({ erreur: "bulletin introuvable" }, { status: 404 });

      if (b.statut === "emis") {
        return NextResponse.json({
          erreur: "le bulletin " + b.numero + " est déjà émis. Pour le corriger, "
            + "recalculez le mois : un bulletin rectificatif sera ouvert.",
        }, { status: 400 });
      }

      if (b.statut === "annule") {
        return NextResponse.json({
          erreur: "le bulletin " + b.numero + " a été annulé et remplacé. "
            + "Il ne peut plus être émis.",
        }, { status: 400 });
      }

      // ---- 1. ANNULER LE BULLETIN RECTIFIE ----
      let annule: string | null = null;
      if (b.type_bulletin === "rectificatif" && b.rectifie_id) {
        const { data: anc, error: eAnn } = await supabase
          .from("paie_bulletins")
          .update({ statut: "annule", annule_le: new Date().toISOString() })
          .eq("id", b.rectifie_id)
          .eq("statut", "emis")
          .select("numero")
          .maybeSingle();

        // 🚨 SI L ANCIEN N A PAS PU ETRE ANNULE, ON N EMET PAS. Deux
        // bulletins emis sur le meme mois, c est une double declaration en
        // DSN — exactement le defaut du 16/09.
        if (eAnn) {
          return NextResponse.json({
            erreur: "impossible d'annuler le bulletin corrigé : " + eAnn.message
              + ". ⛔ Rien n'a été émis.",
          }, { status: 500 });
        }
        annule = anc ? String(anc.numero) : null;
      }

      // ---- 2. EMETTRE ----
      const { data: maj, error } = await supabase
        .from("paie_bulletins")
        .update({ statut: "emis", emis_le: new Date().toISOString() })
        .eq("id", b.id)
        .eq("statut", "brouillon")
        .select("id")
        .maybeSingle();

      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });
      if (!maj) {
        return NextResponse.json({
          erreur: "l'émission n'a rien modifié : le bulletin n'était plus en brouillon.",
        }, { status: 409 });
      }

      // ═══════════════════════════════════════════════════════════════
      // 🚨 L ACQUISITION DES CONGES SE POSE ICI, A L EMISSION — PAS AU
      // CALCUL.
      //
      // POURQUOI : le calcul peut etre relance dix fois avant que le
      // bulletin soit juste. Si l acquisition etait posee a chaque calcul,
      // le salarie aurait dix fois ses droits. L emission, elle, n arrive
      // qu une fois : c est le seul moment sur.
      //
      // ⚠️ SEUL LE CDI EST CONCERNE : sur une mission ou un CDD, les conges
      // sont compenses par l ICCP, pas acquis.
      // ⚠️ ON VERIFIE QU IL N Y A PAS DEJA UNE ACQUISITION POUR CE MOIS :
      // un bulletin rectificatif ne doit pas redonner les jours.
      // ═══════════════════════════════════════════════════════════════
      let congesPoses = false;
      let congesErreur: string | null = null;

      const { data: bull } = await supabase
        .from("paie_bulletins")
        .select("periode, tenant_id, societe_id, contrat_id, paie_contrats(type_contrat)")
        .eq("id", b.id)
        .maybeSingle();

      if (bull && bull.paie_contrats
          && (bull.paie_contrats as any).type_contrat === "cdi") {

        const p = String(bull.periode);
        const annee = Number(p.slice(0, 4));
        const mois = Number(p.slice(5, 7));
        const debutRef = (mois >= 6 ? annee : annee - 1) + "-06-01";

        const { data: deja } = await supabase
          .from("paie_conges")
          .select("id")
          .eq("contrat_id", bull.contrat_id)
          .eq("periode", p)
          .eq("type_mouvement", "acquisition")
          .maybeSingle();

        if (!deja) {
          // 🚨 2,5 JOURS OUVRABLES PAR MOIS TRAVAILLE. Sur une annee
          // complete : 30 jours ouvrables, soit cinq semaines.
          const { error: eConges } = await supabase.from("paie_conges").insert({
            tenant_id: bull.tenant_id,
            societe_id: bull.societe_id,
            contrat_id: bull.contrat_id,
            periode_ref: debutRef,
            unite: "ouvrables",
            periode: p,
            type_mouvement: "acquisition",
            jours: 2.5,
            bulletin_id: b.id,
            notes: "Acquisition automatique a l emission du bulletin " + b.numero,
          });
          // 🆕 16/09 — L ERREUR EST REMONTEE A L ECRAN, plus seulement
          // ignoree : des droits a conges qui ne s inscrivent pas se
          // decouvrent des mois plus tard, quand le salarie les reclame.
          if (eConges) congesErreur = eConges.message;
          else congesPoses = true;
        }
      }

      let message = "Bulletin " + b.numero + " émis. Il ne peut plus être modifié.";
      if (annule) message += " Le bulletin " + annule + " est annulé et remplacé.";
      if (congesPoses) message += " 2,5 jours de congés ont été acquis.";
      if (congesErreur) {
        message += " ⛔ ATTENTION : l'acquisition des congés a échoué (" + congesErreur + ").";
      }

      return NextResponse.json({
        success: true,
        conges_acquis: congesPoses ? 2.5 : 0,
        annule: annule,
        message: message,
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // ══ LES CONGES PRIS ══
    //
    // 🚨 JUSQU ICI LE COMPTEUR NE SAVAIT QU ACQUERIR. Un cabinet dont le
    // salarie pose une semaine n avait aucun endroit ou le saisir : le
    // solde montait indefiniment, et le bulletin affichait des droits que
    // le salarie avait deja consommes.
    //
    // ⚠️ LA VUE paie_conges_solde CONNAISSAIT DEJA les trois mouvements —
    // acquisition, prise, paiement. C est la saisie qui manquait, pas le
    // socle : verifier avant de construire evite de refaire ce qui existe.
    // ═══════════════════════════════════════════════════════════════════
    if (action === "conges") {
      const contratId = String(c.contrat_id || "");
      if (!contratId) {
        return NextResponse.json({ erreur: "contrat manquant." }, { status: 400 });
      }

      const { data: mouvements, error } = await supabase
        .from("paie_conges")
        .select("*")
        .eq("contrat_id", contratId)
        .order("periode", { ascending: false });
      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });

      const { data: solde } = await supabase
        .from("paie_conges_solde")
        .select("*")
        .eq("contrat_id", contratId);

      return NextResponse.json({
        success: true,
        mouvements: mouvements || [],
        solde: (solde && solde[0]) || null,
      });
    }

    if (action === "poser_conges") {
      const contratId = String(c.contrat_id || "");
      const periode = String(c.periode || "");
      const jours = Number(c.jours || 0);

      if (!contratId || !periode) {
        return NextResponse.json({ erreur: "contrat ou période manquant." },
          { status: 400 });
      }
      // ⚠️ UN NOMBRE DE JOURS NUL OU NEGATIF N A PAS DE SENS : une reprise de
      // jours se fait par un mouvement distinct, pas par une prise negative.
      if (!(jours > 0)) {
        return NextResponse.json({
          erreur: "le nombre de jours doit être supérieur à zéro.",
        }, { status: 400 });
      }

      const { data: ct } = await supabase
        .from("paie_contrats")
        .select("*, paie_salaries(nom, prenom)")
        .eq("id", contratId)
        .maybeSingle();
      if (!ct) {
        return NextResponse.json({ erreur: "contrat introuvable." },
          { status: 404 });
      }

      // 🚨 SEUL LE CDI ACQUIERT DES CONGES, donc seul le CDI en prend.
      // Sur une mission ou un CDD, ils sont compenses par l ICCP versee
      // chaque mois : poser une prise y creerait un solde negatif.
      if (String(ct.type_contrat) !== "cdi") {
        return NextResponse.json({
          erreur: "ce contrat ne cumule pas de congés : ils sont compensés "
            + "par l'indemnité compensatrice versée chaque mois. La prise de "
            + "congés ne concerne que les CDI.",
        }, { status: 400 });
      }

      const annee = Number(periode.slice(0, 4));
      const mois = Number(periode.slice(5, 7));
      const debutRef = (mois >= 6 ? annee : annee - 1) + "-06-01";

      // ⛔ ON NE POSE PAS PLUS DE JOURS QUE LE SOLDE. Un solde negatif est
      // toujours une erreur de saisie, et il se decouvre des mois plus tard,
      // au solde de tout compte.
      const { data: soldeAvant } = await supabase
        .from("paie_conges_solde")
        .select("solde")
        .eq("contrat_id", contratId)
        .eq("periode_ref", debutRef)
        .maybeSingle();

      const disponible = Number((soldeAvant as any)?.solde || 0);
      if (jours > disponible) {
        return NextResponse.json({
          erreur: "solde insuffisant : " + jours.toFixed(2) + " jour(s) "
            + "demandé(s) pour " + disponible.toFixed(2) + " disponible(s) "
            + "sur la période ouverte au " + debutRef + ".",
        }, { status: 400 });
      }

      // ═══════════════════════════════════════════════════════════════
      // 🚨🚨 LA VALORISATION COMPARE DEUX METHODES ET RETIENT LA PLUS
      // FAVORABLE AU SALARIE (art. L3141-24).
      //
      // ⛔ N EN APPLIQUER QU UNE SEULE EST UN MOTIF DE REDRESSEMENT ET DE
      // RAPPEL DE SALAIRE. Les deux se calculent, les deux se gardent en
      // base, et c est la plus elevee qui est retenue — la loi ne laisse
      // pas le choix a l employeur.
      //
      //   · MAINTIEN DE SALAIRE : ce que le salarie aurait gagne en
      //     travaillant, soit son salaire mensuel rapporte aux jours pris.
      //   · REGLE DU DIXIEME : un dixieme de la remuneration brute de la
      //     periode de reference, pour la totalite des droits (30 jours
      //     ouvrables), rapporte aux jours pris.
      //
      // ⚠️ LE DIXIEME EST SOUVENT PLUS FAVORABLE quand le salarie a touche
      // des primes ou des heures supplementaires dans l annee : c est
      // precisement ce que la regle protege.
      // ═══════════════════════════════════════════════════════════════
      const JOURS_OUVRABLES_MOIS = 26;   // 6 jours par semaine, moyenne mensuelle
      const DROITS_ANNUELS = 30;         // 2,5 j x 12, en jours ouvrables

      const salaireMensuel = Number(ct.salaire_mensuel || 0);
      const maintien = salaireMensuel > 0
        ? (salaireMensuel / JOURS_OUVRABLES_MOIS) * jours
        : 0;

      // ⚠️ LA REMUNERATION DE REFERENCE NE COMPTE QUE LES BULLETINS EMIS :
      // un brouillon n a pas ete remis, il ne peut pas fonder un droit.
      const { data: bulletinsRef } = await supabase
        .from("paie_bulletins")
        .select("brut, periode")
        .eq("contrat_id", contratId)
        .eq("statut", "emis")
        .gte("periode", debutRef);

      let brutRef = 0;
      for (const b of (bulletinsRef || [])) brutRef += Number((b as any).brut || 0);
      const dixieme = (brutRef / 10) * (jours / DROITS_ANNUELS);

      const retenue = Math.max(maintien, dixieme);

      const { error: ePose } = await supabase.from("paie_conges").insert({
        tenant_id: ct.tenant_id,
        societe_id: ct.societe_id,
        contrat_id: contratId,
        periode_ref: debutRef,
        unite: "ouvrables",
        periode: periode,
        type_mouvement: "prise",
        jours: jours,
        valeur_maintien: Math.round(maintien * 100) / 100,
        valeur_dixieme: Math.round(dixieme * 100) / 100,
        valeur_retenue: Math.round(retenue * 100) / 100,
        notes: "Prise saisie le " + new Date().toISOString().slice(0, 10)
          + " — méthode retenue : "
          + (maintien >= dixieme ? "maintien de salaire" : "règle du dixième"),
      });
      if (ePose) {
        return NextResponse.json({ erreur: ePose.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        jours: jours,
        maintien: Math.round(maintien * 100) / 100,
        dixieme: Math.round(dixieme * 100) / 100,
        retenue: Math.round(retenue * 100) / 100,
        methode: maintien >= dixieme ? "maintien de salaire" : "règle du dixième",
        solde_restant: Math.round((disponible - jours) * 100) / 100,
        message: jours.toFixed(2) + " jour(s) posé(s). Indemnité retenue : "
          + retenue.toFixed(2) + " € ("
          + (maintien >= dixieme ? "maintien de salaire" : "règle du dixième")
          + ", la plus favorable). Solde restant : "
          + (disponible - jours).toFixed(2) + " jour(s).",
      });
    }

    if (action === "supprimer_conges") {
      const id = String(c.id || "");
      if (!id) return NextResponse.json({ erreur: "identifiant manquant." },
        { status: 400 });

      // ⛔ UNE ACQUISITION NE SE SUPPRIME PAS A LA MAIN : elle est liee a un
      // bulletin emis, et l effacer ferait disparaitre un droit sans trace.
      // Seule une prise saisie par erreur se retire.
      const { data: mvt } = await supabase
        .from("paie_conges")
        .select("type_mouvement")
        .eq("id", id)
        .maybeSingle();

      if (!mvt) return NextResponse.json({ erreur: "mouvement introuvable." },
        { status: 404 });
      if (String((mvt as any).type_mouvement) !== "prise") {
        return NextResponse.json({
          erreur: "seule une prise de congés peut être retirée. Une "
            + "acquisition découle d'un bulletin émis : elle ne se supprime "
            + "pas à la main.",
        }, { status: 400 });
      }

      const { error: eDel } = await supabase
        .from("paie_conges").delete().eq("id", id);
      if (eDel) return NextResponse.json({ erreur: eDel.message }, { status: 500 });

      return NextResponse.json({ success: true, message: "Prise retirée." });
    }

    // ═══════════════════════════════════════════════════════════════════
    // ══ LES SIGNALEMENTS D EVENEMENT ══
    //
    // 🚨 DEUX EVENEMENTS, DEUX DELAIS DE CINQ JOURS :
    //   · l ARRET DE TRAVAIL declenche les indemnites journalieres
    //   · la FIN DE CONTRAT remplace l attestation employeur depuis 2022
    //
    // ⚠️ CE NE SONT PAS DES DOCUMENTS DE CONFORT. Un arret signale en
    // retard, c est un salarie qui n est pas paye ; une fin de contrat en
    // retard, c est un chomage qui ne s ouvre pas.
    // ═══════════════════════════════════════════════════════════════════
    if (action === "evenements") {
      const contratId = String(c.contrat_id || "");
      if (!contratId) {
        return NextResponse.json({ erreur: "contrat manquant." }, { status: 400 });
      }

      // ⚠️ `fichier` EST RENDU AVEC LE RESTE, et c est voulu : l ecran s en
      // sert pour telecharger et partager le signalement genere. Le retirer
      // de cette lecture ferait disparaitre les deux liens sans un message.
      const { data, error } = await supabase
        .from("paie_evenements")
        .select("*")
        .eq("contrat_id", contratId)
        .order("date_debut", { ascending: false });
      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });

      // ⚠️ LES MOTIFS VIENNENT DE LA BASE, avec leur code de la norme. Les
      // ecrire en dur dans l ecran ferait diverger les deux le jour ou un
      // code change — et un motif faux ouvre les mauvais droits.
      const { data: motifs } = await supabase
        .from("dsn_codes")
        .select("rubrique, code, libelle, correspondance")
        .in("rubrique", ["S21.G00.60.001", "S21.G00.62.002"])
        .is("date_fin", null)
        .not("correspondance", "is", null)
        .order("code", { ascending: true });

      return NextResponse.json({
        success: true,
        evenements: data || [],
        motifs_arret: (motifs || []).filter(function (m: any) {
          return m.rubrique === "S21.G00.60.001";
        }),
        motifs_fin: (motifs || []).filter(function (m: any) {
          return m.rubrique === "S21.G00.62.002";
        }),
      });
    }

    if (action === "ajouter_evenement") {
      const contratId = String(c.contrat_id || "");
      const type = String(c.type_evenement || "");
      const motif = String(c.motif || "");
      const dateDebut = String(c.date_debut || "");

      if (!contratId || !type || !motif || !dateDebut) {
        return NextResponse.json({
          erreur: "contrat, type, motif et date de début sont obligatoires.",
        }, { status: 400 });
      }
      if (type !== "arret" && type !== "fin_contrat") {
        return NextResponse.json({
          erreur: "type inconnu : « arret » ou « fin_contrat » attendu.",
        }, { status: 400 });
      }

      const { data: ct } = await supabase
        .from("paie_contrats")
        .select("*")
        .eq("id", contratId)
        .maybeSingle();
      if (!ct) {
        return NextResponse.json({ erreur: "contrat introuvable." },
          { status: 404 });
      }

      // ⛔ UNE FIN DE CONTRAT NE PEUT PAS PRECEDER SON DEBUT. Le cas se
      // produit sur une faute de frappe d annee, et il passe inapercu
      // jusqu au rejet par France Travail.
      if (type === "fin_contrat" && String(c.date_fin || dateDebut)
          < String((ct as any).date_debut)) {
        return NextResponse.json({
          erreur: "la date de fin est antérieure au début du contrat ("
            + String((ct as any).date_debut).slice(0, 10) + ").",
        }, { status: 400 });
      }

      const subro = type === "arret" && c.subrogation === true;
      const dateFin = String(c.date_fin || "").trim();
      const dernierJour = String(c.dernier_jour_travaille || "").trim();
      const subroDebut = String(c.subro_debut || "").trim();
      const subroFin = String(c.subro_fin || "").trim();
      let ibanPropre: string | null = null;
      let bicPropre: string | null = null;

      if (type === "arret") {
        // ⛔ UN ARRET NE PEUT PAS COMMENCER AVANT LE CONTRAT QU IL SUSPEND.
        if (dateDebut < String((ct as any).date_debut).slice(0, 10)) {
          return NextResponse.json({
            erreur: "l'arrêt commence avant le début du contrat ("
              + String((ct as any).date_debut).slice(0, 10) + ").",
          }, { status: 400 });
        }

        // ═══════════════════════════════════════════════════════════════
        // 🆕🚨 LA DATE DE FIN PREVISIONNELLE EST OBLIGATOIRE — dsn-val,
        // 17/09 : « CST-03 / Absence de la rubrique S21.G00.60.003 ».
        //
        // C est la date que porte l avis d arret du medecin. Sans elle, la
        // CPAM ne sait pas jusqu a quand indemniser, et rejette.
        // ⛔ ELLE NE SE DEVINE PAS ET NE SE REMPLIT PAS PAR DEFAUT : on ne
        // prolonge ni ne raccourcit un arret de travail a la place d un
        // medecin.
        // ═══════════════════════════════════════════════════════════════
        if (!dateFin) {
          return NextResponse.json({
            erreur: "la date de fin prévisionnelle de l'arrêt est obligatoire : "
              + "c'est celle que porte l'avis d'arrêt du médecin. ⛔ Sans elle, "
              + "la CPAM rejette le signalement et les indemnités "
              + "journalières ne partent pas.",
          }, { status: 400 });
        }
        // ⚠️ UNE FIN AVANT LE DEBUT EST TOUJOURS UNE FAUTE DE FRAPPE — le
        // mois ou l annee. Elle passerait dsn-val, qui ne compare pas les
        // deux dates, et c est la CPAM qui la renverrait.
        if (dateFin < dateDebut) {
          return NextResponse.json({
            erreur: "la fin prévisionnelle de l'arrêt (" + dateFin
              + ") précède son début (" + dateDebut + ").",
          }, { status: 400 });
        }
        if (dernierJour && dernierJour > dateDebut) {
          return NextResponse.json({
            erreur: "le dernier jour travaillé (" + dernierJour
              + ") est postérieur au début de l'arrêt (" + dateDebut + ").",
          }, { status: 400 });
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // 🚨 LA SUBROGATION SE SAISIT EN ENTIER OU PAS DU TOUT.
      //
      // Elle etait deja refusee sans IBAN, a la saisie plutot qu a la
      // generation : c est le moment ou le cabinet a le document sous les
      // yeux. Plus tard, il faudra le rechercher.
      //
      // 🆕 17/09 — dsn-val, controle CCH-11 : l IBAN NE SUFFIT PAS. Il va
      // avec le BIC et avec la DATE DE FIN DE SUBROGATION. Les trois se
      // reclament ensemble, et l IBAN comme le BIC sont controles.
      //
      // ⚠️ LA FIN DE SUBROGATION N EST PAS LA FIN DE L ARRET : elle borne la
      // periode pendant laquelle l employeur MAINTIENT LE SALAIRE, que fixe
      // la convention collective. ⛔ ON NE LA REMPLIT DONC PAS PAR DEFAUT
      // AVEC LA FIN DE L ARRET — declarer une subrogation trop longue, c est
      // percevoir des indemnites qui reviennent au salarie.
      // ═══════════════════════════════════════════════════════════════
      if (subro) {
        if (!String(c.iban || "").trim()) {
          return NextResponse.json({
            erreur: "subrogation demandée sans IBAN. ⛔ Sans lui, les "
              + "indemnités journalières seraient versées au salarié alors "
              + "que l'employeur maintient son salaire.",
          }, { status: 400 });
        }
        const vIban = controlerIban(String(c.iban));
        if (!vIban.ok) {
          return NextResponse.json({ erreur: vIban.message }, { status: 400 });
        }
        ibanPropre = vIban.propre || null;

        if (!String(c.bic || "").trim()) {
          return NextResponse.json({
            erreur: "subrogation demandée sans BIC. Il est obligatoire avec "
              + "l'IBAN, et figure sur le même relevé d'identité bancaire.",
          }, { status: 400 });
        }
        const vBic = controlerBic(String(c.bic));
        if (!vBic.ok) {
          return NextResponse.json({ erreur: vBic.message }, { status: 400 });
        }
        bicPropre = vBic.propre || null;

        if (!subroFin) {
          return NextResponse.json({
            erreur: "subrogation demandée sans date de fin. Elle est "
              + "obligatoire : c'est la fin du maintien de salaire prévu par la "
              + "convention collective, pas forcément celle de l'arrêt.",
          }, { status: 400 });
        }
        if (subroFin < (subroDebut || dateDebut)) {
          return NextResponse.json({
            erreur: "la fin de subrogation (" + subroFin + ") précède son début ("
              + (subroDebut || dateDebut) + ").",
          }, { status: 400 });
        }
      }

      // ⚠️ SANS SUBROGATION, RIEN DE LA SUBROGATION NE S ENREGISTRE. Une case
      // cochee puis decochee laisse un IBAN dans le formulaire : l ecrire en
      // base ferait croire, a la relecture, a une subrogation oubliee.
      const { data: cree, error: eIns } = await supabase
        .from("paie_evenements")
        .insert({
          tenant_id: (ct as any).tenant_id,
          societe_id: (ct as any).societe_id,
          contrat_id: contratId,
          type_evenement: type,
          motif: motif,
          date_debut: dateDebut,
          date_fin: dateFin || null,
          dernier_jour_travaille: dernierJour || null,
          subrogation: subro,
          subro_debut: subro ? (subroDebut || null) : null,
          subro_fin: subro ? subroFin : null,
          iban: subro ? ibanPropre : null,
          bic: subro ? bicPropre : null,
          date_notification: String(c.date_notification || "") || null,
          dernier_jour_paye: String(c.dernier_jour_paye || "") || null,
          statut: "brouillon",
        })
        .select()
        .maybeSingle();
      if (eIns) {
        return NextResponse.json({ erreur: eIns.message }, { status: 500 });
      }

      // ⚠️ LE DELAI SE COMPTE DES LA SAISIE, pas depuis la generation.
      const debut = new Date(dateDebut);
      const limite = new Date(debut.getTime() + 5 * 86400000);
      const jours = Math.ceil(
        (limite.getTime() - Date.now()) / 86400000);

      return NextResponse.json({
        success: true,
        evenement: cree,
        message: (type === "arret" ? "Arrêt" : "Fin de contrat")
          + " enregistré. "
          + (jours < 0
            ? "⚠️ DÉLAI DÉPASSÉ de " + Math.abs(jours) + " jour(s) : "
              + "le signalement aurait dû partir le "
              + limite.toISOString().slice(8, 10) + "/"
              + limite.toISOString().slice(5, 7) + "."
            : "À déposer avant le "
              + limite.toISOString().slice(8, 10) + "/"
              + limite.toISOString().slice(5, 7) + " ("
              + jours + " jour(s))."),
      });
    }

    if (action === "supprimer_evenement") {
      const id = String(c.id || "");
      if (!id) return NextResponse.json({ erreur: "identifiant manquant." },
        { status: 400 });

      // ⛔ UN SIGNALEMENT DEPOSE NE SE SUPPRIME PAS : il a ete transmis, et
      // l effacer ici ne l efface pas chez l organisme. Une correction
      // passe par un signalement d annulation.
      const { data: ev } = await supabase
        .from("paie_evenements")
        .select("statut")
        .eq("id", id)
        .maybeSingle();

      if (!ev) return NextResponse.json({ erreur: "événement introuvable." },
        { status: 404 });
      if (String((ev as any).statut) === "depose") {
        return NextResponse.json({
          erreur: "ce signalement a été déposé : il ne peut plus être "
            + "supprimé. Une correction passe par un signalement "
            + "d'annulation auprès de l'organisme.",
        }, { status: 400 });
      }

      const { error: eDel } = await supabase
        .from("paie_evenements").delete().eq("id", id);
      if (eDel) return NextResponse.json({ erreur: eDel.message }, { status: 500 });

      return NextResponse.json({ success: true, message: "Signalement retiré." });
    }

    return NextResponse.json({ erreur: "action inconnue : " + action }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ erreur: String(e) }, { status: 500 });
  }
}
