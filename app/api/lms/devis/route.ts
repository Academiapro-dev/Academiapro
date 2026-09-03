import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

// ══════════════════════════════════════════════════════════════════════════
// LE DEVIS MR LMS — 03/09.
//
// COMMENT CELA MARCHE. Apres l echange, Jacques envoie un lien portant un
// jeton. Le prospect ouvre la page, renseigne SES informations, choisit son
// offre, et obtient son devis. Personne ne recopie rien.
//
// 🚨 LE JETON EST LA SEULE PORTE. Sans lui, la page n existe pas. C est ce
// qui permet d afficher des prix sans les rendre publics : la doctrine
// interdit un tarif en vitrine, pas un tarif donne apres l echange.
//
// 🚨 LES MONTANTS NE SONT JAMAIS ECRITS ICI. Ils se lisent dans `lms_tarifs`,
// qui est LA SOURCE depuis le 03/09. Une grille recopiee dans du code se
// desynchronise le jour ou un prix change — c est exactement ce qui est
// arrive a la page de facturation, restee sur 35 % et un plancher de 30 €
// pendant que la grille disait autre chose.
//
// ⚠️ LE PROSPECT NE PEUT PAS CHOISIR SON PRIX. Il choisit une offre et des
// options ; le calcul se fait ici, a partir de la base. Rien de ce qu il
// envoie n entre dans un montant.
// ══════════════════════════════════════════════════════════════════════════

// Les champs que le prospect a le droit de renseigner. Tout autre champ
// envoye est ignore : le statut, le numero de devis et le tenant ne se
// pilotent pas depuis le formulaire.
const CHAMPS_PROSPECT = [
  "raison_sociale",
  "contact_nom",
  "contact_email",
  "adresse",
  "code_postal",
  "ville",
  "pays",
  "telephone",
  "siret",
  "numero_da",
];

const OFFRES = ["sans_catalogue", "avec_catalogue"];

function texte(v: any, max: number): string {
  return String(v === null || v === undefined ? "" : v).trim().slice(0, max);
}

// LA GRILLE, RANGEE POUR ETRE LUE. Chaque poste devient une entree simple ;
// les paliers de stagiaires restent une liste ordonnee.
function rangerTarifs(lignes: any[], offre: string) {
  const dedans = (lignes || []).filter(function (l: any) { return l.offre === offre; });

  function poste(nom: string) {
    return dedans.find(function (l: any) { return l.poste === nom; }) || null;
  }

  const paliers = dedans
    .filter(function (l: any) { return l.poste === "stagiaire"; })
    .sort(function (a: any, b: any) { return (a.seuil_min || 0) - (b.seuil_min || 0); })
    .map(function (l: any) {
      return {
        libelle: l.libelle,
        prix: Number(l.montant) || 0,
        min: l.seuil_min === null || l.seuil_min === undefined ? 1 : Number(l.seuil_min),
        max: l.seuil_max === null || l.seuil_max === undefined ? null : Number(l.seuil_max),
      };
    });

  const misePlace = poste("mise_en_place");
  const abonnement = poste("abonnement");
  const marque = poste("marque_blanche");
  const bpf = poste("accompagnement_bpf");
  const part = poste("part_catalogue");

  // ══════════════════════════════════════════════════════════════════════
  // 🚨 LA SIGNATURE EST UN CADEAU, JAMAIS UN DU — DECISION DU 03/09.
  //
  // Le prix a l unite et les lots RESTENT AFFICHES dans tous les devis,
  // meme quand un lot est compris. Un lot offert n a de valeur que si le
  // prospect sait ce qu il vaut : « signature comprise » sans montant a
  // cote ne se retient pas, et ne se reclame pas non plus le jour ou
  // l organisme envisage de partir.
  //
  // ⚠️ NE JAMAIS ECRIRE « SIGNATURE COMPRISE » SANS LE PRIX A COTE.
  //
  // LE LOT COMPRIS SE RENOUVELLE CHAQUE ANNEE tant que l option qui le
  // porte est souscrite — cent avec la marque blanche, trois cents avec le
  // catalogue. Un lot qui s epuiserait sans revenir transformerait le
  // cadeau en piege l annee ou l organisme commence a s en servir.
  //
  // ⚠️ CETTE GRILLE DEVRA VIVRE DANS UNE TABLE COMMUNE AUX PRODUITS. Elle
  // est dans `lms_tarifs` pour que Mr LMS soit vendable des maintenant ;
  // Mr CRM vendra le meme module. A faire avant le second produit qui
  // l affiche, sinon deux grilles divergeront.
  // ══════════════════════════════════════════════════════════════════════
  const signature = poste("signature");
  const signatureOfferte = poste("signature_offerte");

  const lots = dedans
    .filter(function (l: any) { return l.poste === "signature_lot"; })
    .sort(function (a: any, b: any) { return (a.seuil_min || 0) - (b.seuil_min || 0); })
    .map(function (l: any) {
      const nombre = Number(l.seuil_min) || 0;
      const prix = Number(l.montant) || 0;
      return {
        libelle: l.libelle,
        nombre: nombre,
        prix: prix,
        // Le prix a l unite du lot : c est lui qui montre la remise.
        unitaire: nombre > 0 ? Math.round((prix / nombre) * 100) / 100 : 0,
      };
    });

  return {
    mise_en_place: misePlace ? Number(misePlace.montant) || 0 : 0,
    abonnement: abonnement ? Number(abonnement.montant) || 0 : 0,
    abonnement_libelle: abonnement ? abonnement.libelle : "",
    marque_blanche: marque ? Number(marque.montant) || 0 : 0,
    marque_blanche_optionnelle: marque ? !!marque.optionnel : false,
    accompagnement_bpf: bpf ? Number(bpf.montant) || 0 : 0,
    accompagnement_bpf_optionnel: bpf ? !!bpf.optionnel : false,
    part_catalogue: part ? Number(part.pourcentage) || 0 : 0,
    paliers: paliers,
    signature_unitaire: signature ? Number(signature.montant) || 0 : 0,
    signature_lots: lots,
    signatures_offertes: signatureOfferte ? Number(signatureOfferte.seuil_min) || 0 : 0,
    signatures_offertes_libelle: signatureOfferte ? signatureOfferte.libelle : "",
    signatures_offertes_commentaire: signatureOfferte ? signatureOfferte.commentaire || "" : "",
  };
}

// LE COUT DES STAGIAIRES ACTIFS, PALIER PAR PALIER. Meme calcul que la page
// de facturation : la degressivite porte sur le nombre d actifs DANS LE
// MOIS, jamais sur un cumul annuel.
function coutStagiaires(nb: number, paliers: any[]) {
  const detail: any[] = [];
  let total = 0;
  let rangPrecedent = 0;

  for (const p of paliers) {
    const plafond = p.max === null ? nb : Math.min(p.max, nb);
    const dans = Math.max(0, plafond - rangPrecedent);
    if (dans > 0) {
      const montant = dans * p.prix;
      total = total + montant;
      detail.push({ libelle: p.libelle, nombre: dans, prix: p.prix, montant: montant });
    }
    rangPrecedent = p.max === null ? nb : p.max;
    if (rangPrecedent >= nb) break;
  }

  return { total: total, detail: detail };
}

async function lireProspect(jeton: string) {
  const { data } = await supabase
    .from("lms_prospects")
    .select("*")
    .eq("jeton", jeton)
    .maybeSingle();
  return data;
}

async function lireTarifs() {
  const { data } = await supabase
    .from("lms_tarifs")
    .select("offre, poste, libelle, montant, pourcentage, unite, seuil_min, seuil_max, perimetre, optionnel, commentaire")
    .limit(200);
  return data || [];
}

// ── LECTURE ────────────────────────────────────────────────────────────────
// La page appelle cette route au chargement : elle recoit la fiche telle
// qu elle est, et la grille des deux offres. Le prospect voit donc les prix
// AVANT de choisir, ce qui est le sens meme d un devis.
export async function GET(req: NextRequest) {
  try {
    const jeton = texte(new URL(req.url).searchParams.get("jeton"), 64);
    if (!jeton) {
      return NextResponse.json({ ok: false, erreur: "Lien incomplet." }, { status: 400 });
    }

    const prospect = await lireProspect(jeton);
    if (!prospect) {
      // 🚨 ON NE DIT PAS « JETON INVALIDE ». Un message qui distingue un
      // jeton faux d un jeton expire aide qui cherche a en deviner un.
      return NextResponse.json(
        { ok: false, erreur: "Ce lien n'est plus valable. Demandez-nous-en un nouveau." },
        { status: 404 }
      );
    }

    const lignes = await lireTarifs();

    return NextResponse.json({
      ok: true,
      prospect: {
        raison_sociale: prospect.raison_sociale || "",
        contact_nom: prospect.contact_nom || "",
        contact_email: prospect.contact_email || "",
        adresse: prospect.adresse || "",
        code_postal: prospect.code_postal || "",
        ville: prospect.ville || "",
        pays: prospect.pays || "France",
        telephone: prospect.telephone || "",
        siret: prospect.siret || "",
        numero_da: prospect.numero_da || "",
        offre: prospect.offre || "sans_catalogue",
        marque_blanche: !!prospect.marque_blanche,
        accompagnement_bpf: !!prospect.accompagnement_bpf,
        stagiaires_estimes: prospect.stagiaires_estimes || 10,
        duree_moyenne_mois: prospect.duree_moyenne_mois || 3,
        statut: prospect.statut || "invite",
        numero_devis: prospect.numero_devis || "",
      },
      tarifs: {
        sans_catalogue: rangerTarifs(lignes, "sans_catalogue"),
        avec_catalogue: rangerTarifs(lignes, "avec_catalogue"),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// ── ENREGISTREMENT ─────────────────────────────────────────────────────────
// Le prospect enregistre sa fiche et son choix. La route recalcule le devis
// de son cote : ce qui est renvoye ne vient jamais du formulaire.
export async function POST(req: NextRequest) {
  try {
    const corps = await req.json();
    const jeton = texte(corps.jeton, 64);
    if (!jeton) {
      return NextResponse.json({ ok: false, erreur: "Lien incomplet." }, { status: 400 });
    }

    const prospect = await lireProspect(jeton);
    if (!prospect) {
      return NextResponse.json(
        { ok: false, erreur: "Ce lien n'est plus valable. Demandez-nous-en un nouveau." },
        { status: 404 }
      );
    }

    // 🚨 UN DEVIS SIGNE NE SE MODIFIE PLUS. Sans ce garde-fou, un prospect
    // pourrait changer son offre apres accord et se retrouver avec un
    // document different de celui qu il a signe.
    if (prospect.signe_le) {
      return NextResponse.json(
        { ok: false, erreur: "Ce devis a été accepté ; il ne peut plus être modifié." },
        { status: 409 }
      );
    }

    const maj: any = { updated_at: new Date().toISOString() };
    for (const champ of CHAMPS_PROSPECT) {
      if (corps[champ] !== undefined) maj[champ] = texte(corps[champ], 300) || null;
    }

    const offre = OFFRES.indexOf(texte(corps.offre, 40)) >= 0
      ? texte(corps.offre, 40)
      : "sans_catalogue";
    maj.offre = offre;

    // DANS L OFFRE AVEC CATALOGUE, LA MARQUE BLANCHE ET L ACCOMPAGNEMENT
    // SONT COMPRIS : les cases du formulaire n y changent rien. Un organisme
    // qui revend le catalogue sous son nom ne peut pas l afficher sous la
    // marque Mr LMS.
    if (offre === "avec_catalogue") {
      maj.marque_blanche = true;
      maj.accompagnement_bpf = true;
    } else {
      maj.marque_blanche = corps.marque_blanche === true;
      maj.accompagnement_bpf = corps.accompagnement_bpf === true;
    }

    const nb = parseInt(String(corps.stagiaires_estimes || ""), 10);
    maj.stagiaires_estimes = isNaN(nb) || nb < 0 ? null : Math.min(nb, 100000);

    const duree = parseInt(String(corps.duree_moyenne_mois || ""), 10);
    maj.duree_moyenne_mois = isNaN(duree) || duree < 1 ? null : Math.min(duree, 60);

    if ((prospect.statut || "invite") === "invite") maj.statut = "renseigne";

    // LE NUMERO DE DEVIS EST ATTRIBUE UNE FOIS, ET NE BOUGE PLUS. Un devis
    // qui changerait de numero a chaque enregistrement rendrait tout suivi
    // impossible — et deux envois porteraient le meme nom sans etre le meme
    // document.
    if (!prospect.numero_devis) {
      const annee = new Date().getUTCFullYear();
      const { count } = await supabase
        .from("lms_prospects")
        .select("id", { count: "exact", head: true })
        .not("numero_devis", "is", null);
      const rang = (typeof count === "number" ? count : 0) + 1;
      maj.numero_devis = String(annee) + "-" + String(rang).padStart(3, "0");
    }

    const { error } = await supabase
      .from("lms_prospects")
      .update(maj)
      .eq("jeton", jeton);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // LE DEVIS EST RECALCULE ICI, A PARTIR DE LA BASE.
    const lignes = await lireTarifs();
    const g = rangerTarifs(lignes, offre);

    const nbActifs = maj.stagiaires_estimes || 0;
    const cout = coutStagiaires(nbActifs, g.paliers);

    const marqueDue = offre === "avec_catalogue"
      ? 0
      : (maj.marque_blanche ? g.marque_blanche : 0);
    const bpfDu = offre === "avec_catalogue"
      ? 0
      : (maj.accompagnement_bpf ? g.accompagnement_bpf : 0);

    const mensuel = g.abonnement + marqueDue + bpfDu;
    const mensuelAvecStagiaires = mensuel + cout.total;

    // LE COUT PAR STAGIAIRE, SUR TOUTE SA FORMATION. C est le seul chiffre
    // qu un devis presente : jamais un total annuel.
    // ⚠️ REGLE DE JACQUES, 03/09 : UN DEVIS SE PRESENTE EN COUT PAR
    // STAGIAIRE. Le total annuel effraie sans rien expliquer.
    const dureeMois = maj.duree_moyenne_mois || 0;
    const coutParStagiaire = nbActifs > 0 && dureeMois > 0
      ? Math.round((mensuelAvecStagiaires * dureeMois / nbActifs) * 100) / 100
      : null;

    return NextResponse.json({
      ok: true,
      numero_devis: maj.numero_devis || prospect.numero_devis,
      devis: {
        offre: offre,
        mise_en_place: g.mise_en_place,
        abonnement: g.abonnement,
        abonnement_libelle: g.abonnement_libelle,
        marque_blanche: marqueDue,
        marque_blanche_comprise: offre === "avec_catalogue",
        accompagnement_bpf: bpfDu,
        accompagnement_bpf_compris: offre === "avec_catalogue",
        part_catalogue: g.part_catalogue,
        paliers: g.paliers,

        // LA SIGNATURE. Le lot compris n est acquis que si l option qui le
        // porte est souscrite : sans marque blanche, l organisme paie ses
        // signatures a l unite ou par lot. Le prix reste renvoye dans TOUS
        // les cas — c est lui qui donne sa valeur au lot offert.
        signature_unitaire: g.signature_unitaire,
        signature_lots: g.signature_lots,
        signatures_offertes: (offre === "avec_catalogue" || maj.marque_blanche)
          ? g.signatures_offertes
          : 0,
        signatures_offertes_commentaire: g.signatures_offertes_commentaire,

        stagiaires: nbActifs,
        stagiaires_detail: cout.detail,
        stagiaires_total: cout.total,
        mensuel_fixe: mensuel,
        mensuel_total: mensuelAvecStagiaires,
        duree_moyenne_mois: dureeMois,
        cout_par_stagiaire: coutParStagiaire,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
