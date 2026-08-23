import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 90;

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
// LA FACTURATION RECURRENTE.
//
// Un cabinet facture les memes honoraires aux memes clients tous les mois.
// Aujourd hui il ressaisit trente factures identiques le 1er du mois, ou il
// oublie, et il s en apercoit au bout de deux mois.
//
// 🚨 CE N EST PAS UNE FACTURE, C EST UN MODELE. Un abonnement ne porte NI
// numero NI statut comptable : il ne figure dans aucune liste de factures et
// n entre dans aucun total. C est un moule dont on tire une vraie facture a
// chaque echeance.
//
// D ou les lignes stockees en JSON dans l abonnement plutot que dans
// devis_factures_lignes : elles n ont pas a exister comme lignes de facture
// tant qu aucune facture n est nee.
// ---------------------------------------------------------------------------

const FREQUENCES: any = {
  mensuelle: { nom: "Tous les mois", mois: 1 },
  trimestrielle: { nom: "Tous les trimestres", mois: 3 },
  semestrielle: { nom: "Tous les semestres", mois: 6 },
  annuelle: { nom: "Tous les ans", mois: 12 },
};

function r2(n: any): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function propre(v: any, max: number): string | null {
  const t = String(v === null || v === undefined ? "" : v).trim();
  return t ? t.slice(0, max) : null;
}

function jourISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// LE CALCUL D UNE LIGNE, DANS L ORDRE OU LE DROIT L IMPOSE : la remise
// s applique AVANT la TVA.
function calculerLigne(l: any, autoliquidation: boolean) {
  const quantite = Number(l.quantite) || 0;
  const prix = Number(l.prix_unitaire) || 0;
  const remise = Number(l.remise_pct) || 0;
  const taux = autoliquidation ? 0 : (Number(l.taux_tva) || 0);

  const brut = quantite * prix;
  const net = brut * (1 - remise / 100);
  const ht = r2(net);
  const tva = r2(ht * taux / 100);

  return {
    designation: propre(l.designation, 300) || "Prestation",
    detail: propre(l.detail, 1000),
    quantite: quantite,
    unite: propre(l.unite, 20),
    prix_unitaire: prix,
    remise_pct: remise,
    taux_tva: taux,
    total_ht: ht,
    total_tva: tva,
    total_ttc: r2(ht + tva),
    compte_produit: propre(l.compte_produit, 20),
  };
}

// LA PROCHAINE ECHEANCE.
//
// ⚠️ LE 31 N EXISTE PAS TOUS LES MOIS. Un abonnement cale au 31 doit tomber
// le 28 en fevrier, pas deborder sur le 3 mars — ce que fait JavaScript si
// on le laisse faire. On borne au dernier jour reel du mois.
function prochaine(depuis: Date, frequence: string, jourDuMois: number): string {
  const f = FREQUENCES[frequence] || FREQUENCES.mensuelle;
  const annee = depuis.getUTCFullYear();
  const mois = depuis.getUTCMonth() + f.mois;

  const dernierJour = new Date(Date.UTC(annee, mois + 1, 0)).getUTCDate();
  const jour = Math.min(Math.max(1, jourDuMois || 1), dernierJour);

  return jourISO(new Date(Date.UTC(annee, mois, jour)));
}

// LE NUMERO — la meme serie que les factures manuelles.
//
// 🚨 UNE FACTURE RECURRENTE N A PAS SA PROPRE NUMEROTATION. Deux series
// paralleles feraient deux suites avec des trous chacune, et un controleur
// demanderait pourquoi.
async function numeroSuivant(tenant: string): Promise<string> {
  const annee = new Date().getFullYear();
  const prefixe = "F-" + annee + "-";

  const { data } = await supabase
    .from("devis_factures")
    .select("numero")
    .eq("tenant_id", tenant)
    .in("type", ["facture", "avoir"])
    .not("numero", "is", null)
    .order("numero", { ascending: false })
    .limit(1);

  let dernier = 0;
  if (data && data.length > 0 && data[0].numero) {
    const morceaux = String(data[0].numero).split("-");
    const n = parseInt(morceaux[morceaux.length - 1], 10);
    if (!isNaN(n)) dernier = n;
  }

  return prefixe + String(dernier + 1).padStart(4, "0");
}

// ---------------------------------------------------------------------------
// L EMISSION D UNE ECHEANCE.
//
// Exportee pour que le cron s en serve : le meme code produit la facture,
// qu elle soit declenchee a la main ou automatiquement. Deux chemins
// differents finiraient par diverger.
// ---------------------------------------------------------------------------
export async function emettreEcheance(abonnement: any, emettre: boolean) {
  const lignes = Array.isArray(abonnement.lignes) ? abonnement.lignes : [];
  if (lignes.length === 0) {
    return { ok: false, erreur: "Cet abonnement n a aucune ligne." };
  }

  let ht = 0, tva = 0, ttc = 0;
  for (const l of lignes) {
    ht = ht + (Number(l.total_ht) || 0);
    tva = tva + (Number(l.total_tva) || 0);
    ttc = ttc + (Number(l.total_ttc) || 0);
  }

  const aujourdhui = new Date();
  const echeance = new Date(aujourdhui.getTime()
    + (Number(abonnement.delai_paiement) || 30) * 86400000);

  // LE PERIODE FACTUREE FIGURE DANS L OBJET. « Honoraires » tout seul ne
  // dit pas de quel mois il s agit, et le client appelle pour demander.
  const periode = aujourdhui.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const objet = (abonnement.objet || abonnement.libelle) + " — " + periode;

  const champs: any = {
    tenant_id: abonnement.tenant_id,
    societe_id: abonnement.societe_id || null,
    type: "facture",
    client_nom: abonnement.client_nom,
    client_email: abonnement.client_email,
    client_adresse: abonnement.client_adresse,
    client_code_postal: abonnement.client_code_postal,
    client_ville: abonnement.client_ville,
    client_pays: abonnement.client_pays || "FR",
    client_siren: abonnement.client_siren,
    client_tva: abonnement.client_tva,
    objet: objet.slice(0, 300),
    date_echeance: jourISO(echeance),
    autoliquidation: abonnement.autoliquidation === true,
    total_ht: r2(ht),
    total_tva: r2(tva),
    total_ttc: r2(ttc),
    statut: "brouillon",
    cree_par: "abonnement " + abonnement.id,
  };

  // 🚨 LE NUMERO NE S ATTRIBUE QU A L EMISSION, comme partout ailleurs. Un
  // abonnement peut produire un brouillon que le cabinet relit avant
  // d envoyer : tant qu il n est pas emis, il ne consomme pas de numero.
  if (emettre) {
    champs.numero = await numeroSuivant(abonnement.tenant_id);
    champs.statut = "envoye";
    champs.date_emission = jourISO(aujourdhui);
    champs.envoye_le = new Date().toISOString();
    champs.reste_du = r2(ttc);
  }

  const { data: facture, error } = await supabase
    .from("devis_factures")
    .insert(champs)
    .select()
    .single();

  if (error) return { ok: false, erreur: error.message };

  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i];
    await supabase.from("devis_factures_lignes").insert({
      document_id: facture.id,
      rang: i,
      designation: l.designation,
      detail: l.detail,
      quantite: l.quantite,
      unite: l.unite,
      prix_unitaire: l.prix_unitaire,
      remise_pct: l.remise_pct,
      taux_tva: l.taux_tva,
      total_ht: l.total_ht,
      total_tva: l.total_tva,
      total_ttc: l.total_ttc,
      compte_produit: l.compte_produit,
    });
  }

  // L abonnement avance : derniere emission, prochaine echeance, compteur.
  await supabase
    .from("facturation_recurrente")
    .update({
      derniere_emission: jourISO(aujourdhui),
      prochaine_emission: prochaine(aujourdhui, abonnement.frequence, abonnement.jour_du_mois),
      nb_emises: (Number(abonnement.nb_emises) || 0) + 1,
    })
    .eq("id", abonnement.id);

  return { ok: true, facture: facture, numero: champs.numero || null };
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || !session.tenantId) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const { data: abonnements } = await supabase
      .from("facturation_recurrente")
      .select("*")
      .eq("tenant_id", session.tenantId)
      .order("cree_le", { ascending: false })
      .limit(500);

    const liste = abonnements || [];
    const aujourdhui = jourISO(new Date());

    const enrichis = liste.map(function (a: any) {
      const lignes = Array.isArray(a.lignes) ? a.lignes : [];
      const ttc = r2(lignes.reduce(function (s: number, l: any) {
        return s + (Number(l.total_ttc) || 0);
      }, 0));
      const ht = r2(lignes.reduce(function (s: number, l: any) {
        return s + (Number(l.total_ht) || 0);
      }, 0));

      return {
        ...a,
        total_ht: ht,
        total_ttc: ttc,
        due: a.actif && a.prochaine_emission && a.prochaine_emission <= aujourdhui,
        expire: a.date_fin ? a.date_fin < aujourdhui : false,
      };
    });

    // LE CHIFFRE D AFFAIRES RECURRENT, ramene au mois. C est l indicateur
    // que regarde un cabinet : combien rentre chaque mois sans rien faire.
    let mensuel = 0;
    for (const a of enrichis) {
      if (!a.actif || a.expire) continue;
      const f = FREQUENCES[a.frequence] || FREQUENCES.mensuelle;
      mensuel = mensuel + (a.total_ht / f.mois);
    }

    return NextResponse.json({
      ok: true,
      abonnements: enrichis,
      frequences: FREQUENCES,
      compteurs: {
        total: enrichis.length,
        actifs: enrichis.filter(function (a: any) { return a.actif && !a.expire; }).length,
        dus: enrichis.filter(function (a: any) { return a.due; }).length,
        recurrent_mensuel: r2(mensuel),
        recurrent_annuel: r2(mensuel * 12),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || !session.tenantId) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }
    const tenant = session.tenantId;

    const b = await req.json().catch(function () { return null; });
    if (!b || !b.action) {
      return NextResponse.json({ ok: false, erreur: "Action non precisee." }, { status: 400 });
    }

    // ---------- CREER OU MODIFIER ----------
    if (b.action === "enregistrer") {
      if (!propre(b.client_nom, 200)) {
        return NextResponse.json({ ok: false, erreur: "Indiquez le nom du client." }, { status: 400 });
      }
      if (!propre(b.libelle, 200)) {
        return NextResponse.json({ ok: false, erreur: "Donnez un nom à cet abonnement." }, { status: 400 });
      }

      const frequence = FREQUENCES[String(b.frequence || "")] ? b.frequence : "mensuelle";
      const auto = b.autoliquidation === true;

      const lignes = (Array.isArray(b.lignes) ? b.lignes : [])
        .filter(function (l: any) { return propre(l.designation, 300); })
        .map(function (l: any) { return calculerLigne(l, auto); });

      if (lignes.length === 0) {
        return NextResponse.json({ ok: false, erreur: "Ajoutez au moins une ligne." }, { status: 400 });
      }

      const jourDuMois = Math.min(31, Math.max(1, Number(b.jour_du_mois) || 1));
      const debut = b.date_debut || jourISO(new Date());

      const champs: any = {
        tenant_id: tenant,
        societe_id: b.societe_id || null,
        libelle: propre(b.libelle, 200),
        client_nom: propre(b.client_nom, 200),
        client_email: propre(b.client_email, 200),
        client_adresse: propre(b.client_adresse, 300),
        client_code_postal: propre(b.client_code_postal, 20),
        client_ville: propre(b.client_ville, 120),
        client_pays: propre(b.client_pays, 4) || "FR",
        client_siren: propre(b.client_siren, 20),
        client_tva: propre(b.client_tva, 30),
        objet: propre(b.objet, 300),
        autoliquidation: auto,
        frequence: frequence,
        jour_du_mois: jourDuMois,
        delai_paiement: Math.max(0, Number(b.delai_paiement) || 30),
        date_debut: debut,
        date_fin: b.date_fin || null,
        envoi_auto: b.envoi_auto === true,
        lignes: lignes,
        notes: propre(b.notes, 2000),
        actif: b.actif !== false,
      };

      if (b.id) {
        // ⚠️ LA PROCHAINE ECHEANCE NE SE RECALCULE PAS A LA MODIFICATION :
        // changer le libelle ne doit pas decaler la facturation.
        const { error } = await supabase
          .from("facturation_recurrente")
          .update(champs)
          .eq("id", b.id)
          .eq("tenant_id", tenant);

        if (error) {
          return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
        }
        return NextResponse.json({ ok: true, message: "Abonnement enregistré." });
      }

      // A la creation, la premiere echeance tombe au jour choisi, ce mois-ci
      // s il n est pas passe, le mois prochain sinon.
      const maintenant = new Date();
      const ceMois = new Date(Date.UTC(
        maintenant.getUTCFullYear(), maintenant.getUTCMonth(),
        Math.min(jourDuMois, new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth() + 1, 0)).getUTCDate())
      ));
      champs.prochaine_emission = jourISO(ceMois) >= jourISO(maintenant)
        ? jourISO(ceMois)
        : prochaine(maintenant, frequence, jourDuMois);

      const { data, error } = await supabase
        .from("facturation_recurrente")
        .insert(champs)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        abonnement: data,
        message: "Abonnement créé. Première facture le "
          + new Date(champs.prochaine_emission).toLocaleDateString("fr-FR") + ".",
      });
    }

    // ---------- SUSPENDRE OU REPRENDRE ----------
    if (b.action === "basculer") {
      const { data: a } = await supabase
        .from("facturation_recurrente")
        .select("id, actif, tenant_id")
        .eq("id", b.id)
        .maybeSingle();

      if (!a || a.tenant_id !== tenant) {
        return NextResponse.json({ ok: false, erreur: "Abonnement inconnu." }, { status: 403 });
      }

      await supabase
        .from("facturation_recurrente")
        .update({ actif: !a.actif })
        .eq("id", b.id);

      return NextResponse.json({
        ok: true,
        message: a.actif ? "Abonnement suspendu." : "Abonnement repris.",
      });
    }

    // ---------- SUPPRIMER ----------
    //
    // Un abonnement se supprime sans dommage : les factures qu il a produites
    // restent, elles ont leur vie propre. C est un modele, pas un document
    // comptable.
    if (b.action === "supprimer") {
      const { data: a } = await supabase
        .from("facturation_recurrente")
        .select("id, tenant_id")
        .eq("id", b.id)
        .maybeSingle();

      if (!a || a.tenant_id !== tenant) {
        return NextResponse.json({ ok: false, erreur: "Abonnement inconnu." }, { status: 403 });
      }

      await supabase.from("facturation_recurrente").delete().eq("id", b.id);
      return NextResponse.json({ ok: true, message: "Abonnement supprimé." });
    }

    // ---------- EMETTRE MAINTENANT ----------
    if (b.action === "emettre") {
      const { data: a } = await supabase
        .from("facturation_recurrente")
        .select("*")
        .eq("id", b.id)
        .maybeSingle();

      if (!a || a.tenant_id !== tenant) {
        return NextResponse.json({ ok: false, erreur: "Abonnement inconnu." }, { status: 403 });
      }

      const r = await emettreEcheance(a, b.emettre === true);
      if (!r.ok) {
        return NextResponse.json({ ok: false, erreur: r.erreur }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        facture: r.facture,
        message: r.numero
          ? "Facture " + r.numero + " émise."
          : "Brouillon créé. Relisez-le puis émettez-le depuis « Devis et factures ».",
      });
    }

    return NextResponse.json({ ok: false, erreur: "Action inconnue." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
