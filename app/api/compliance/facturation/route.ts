import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
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

// LES TROIS DOCUMENTS, ET CE QUI LES DISTINGUE EN DROIT.
//
// LE DEVIS n engage a rien tant qu il n est pas accepte, il n a donc PAS de
// numerotation legale : sa serie lui est propre et peut avoir des trous.
//
// LA FACTURE porte une numerotation CONTINUE ET SANS TROU. C est une
// obligation de l article 242 nonies A de l annexe II au CGI, et le premier
// point que regarde un controleur.
//
// L AVOIR annule tout ou partie d une facture. Il porte la meme serie que
// les factures — un avoir est une facture negative, pas un autre document.
const TYPES: any = {
  devis: { nom: "Devis", prefixe: "D", legal: false },
  facture: { nom: "Facture", prefixe: "F", legal: true },
  avoir: { nom: "Avoir", prefixe: "A", legal: true },
};

// 🚨 UNE FACTURE EMISE NE SE MODIFIE PLUS, JAMAIS. C est le principe
// d intangibilite : une erreur se corrige par un AVOIR, pas par une
// retouche. Un logiciel qui laisse modifier une facture emise fait perdre
// sa valeur probante a toute la comptabilite de son client.
const FIGES = ["envoye", "accepte", "paye", "partiel", "annule"];

function r2(n: any): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function propre(v: any, max: number): string | null {
  const t = String(v === null || v === undefined ? "" : v).trim();
  return t ? t.slice(0, max) : null;
}

// LE CALCUL D UNE LIGNE, DANS L ORDRE OU LE DROIT L IMPOSE : la remise
// s applique AVANT la TVA, et la TVA se calcule sur le net commercial.
function calculerLigne(l: any) {
  const quantite = Number(l.quantite) || 0;
  const prix = Number(l.prix_unitaire) || 0;
  const remise = Number(l.remise_pct) || 0;
  const taux = Number(l.taux_tva) || 0;

  const brut = quantite * prix;
  const net = brut * (1 - remise / 100);
  const ht = r2(net);
  const tva = r2(ht * taux / 100);

  return {
    total_ht: ht,
    total_tva: tva,
    total_ttc: r2(ht + tva),
    remise_montant: r2(brut - net),
  };
}

// LA NUMEROTATION.
//
// ⚠️ ELLE N EST ATTRIBUEE QU A L EMISSION, jamais a la creation. Un numero
// reserve puis abandonne fait un trou dans la serie, et un trou se justifie
// devant un controleur.
//
// La serie est PAR CABINET et PAR ANNEE : F-2026-0001. Deux cabinets ne
// partagent pas leur numerotation, chacun repond de la sienne.
async function numeroSuivant(tenant: string, type: string): Promise<string> {
  const t = TYPES[type] || TYPES.facture;
  const annee = new Date().getFullYear();
  const prefixe = t.prefixe + "-" + annee + "-";

  // Les avoirs partagent la serie des factures : meme prefixe legal.
  const series = t.legal ? ["facture", "avoir"] : ["devis"];

  const { data } = await supabase
    .from("devis_factures")
    .select("numero")
    .eq("tenant_id", tenant)
    .in("type", series)
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

// LE HASH D INALTERABILITE, repris du moteur existant. Il fige le contenu
// au moment de l emission : toute retouche ulterieure se detecte.
function hachage(doc: any): string {
  const contenu = [
    doc.numero, doc.tenant_id, doc.client_nom,
    doc.total_ht, doc.total_tva, doc.total_ttc,
    doc.date_emission,
  ].join("|");
  return crypto.createHash("sha256").update(contenu).digest("hex");
}

// Les totaux du document se recalculent depuis SES LIGNES, jamais depuis ce
// que le navigateur annonce. Un total envoye par le client est une donnee
// qu on ne controle pas.
async function recalculer(documentId: number) {
  const { data: lignes } = await supabase
    .from("devis_factures_lignes")
    .select("total_ht, total_tva, total_ttc")
    .eq("document_id", documentId);

  let ht = 0, tva = 0, ttc = 0;
  for (const l of lignes || []) {
    ht = ht + (Number(l.total_ht) || 0);
    tva = tva + (Number(l.total_tva) || 0);
    ttc = ttc + (Number(l.total_ttc) || 0);
  }

  const { data: regles } = await supabase
    .from("devis_factures_reglements")
    .select("montant")
    .eq("document_id", documentId);

  let paye = 0;
  for (const r of regles || []) paye = paye + (Number(r.montant) || 0);

  await supabase
    .from("devis_factures")
    .update({
      total_ht: r2(ht),
      total_tva: r2(tva),
      total_ttc: r2(ttc),
      reste_du: r2(r2(ttc) - paye),
    })
    .eq("id", documentId);

  return { total_ht: r2(ht), total_tva: r2(tva), total_ttc: r2(ttc), paye: r2(paye) };
}

async function documentAutorise(id: any, tenant: string) {
  const { data } = await supabase
    .from("devis_factures")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) return { erreur: "Document introuvable.", code: 404 };
  if (data.tenant_id !== tenant) return { erreur: "Document d un autre cabinet.", code: 403 };
  return { doc: data };
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || !session.tenantId) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const id = req.nextUrl.searchParams.get("id");

    // UN DOCUMENT ET SON DETAIL.
    if (id) {
      const v = await documentAutorise(id, session.tenantId);
      if (v.erreur) return NextResponse.json({ ok: false, erreur: v.erreur }, { status: v.code });

      const { data: lignes } = await supabase
        .from("devis_factures_lignes")
        .select("*")
        .eq("document_id", id)
        .order("rang", { ascending: true });

      const { data: reglements } = await supabase
        .from("devis_factures_reglements")
        .select("*")
        .eq("document_id", id)
        .order("date_reglement", { ascending: false });

      return NextResponse.json({
        ok: true,
        document: v.doc,
        lignes: lignes || [],
        reglements: reglements || [],
        types: TYPES,
      });
    }

    // LA LISTE.
    const { data: documents } = await supabase
      .from("devis_factures")
      .select("*")
      .eq("tenant_id", session.tenantId)
      .order("cree_le", { ascending: false })
      .limit(500);

    const liste = documents || [];

    const compteurs = {
      total: liste.length,
      devis: liste.filter(function (x: any) { return x.type === "devis"; }).length,
      factures: liste.filter(function (x: any) { return x.type === "facture"; }).length,
      avoirs: liste.filter(function (x: any) { return x.type === "avoir"; }).length,
      brouillons: liste.filter(function (x: any) { return x.statut === "brouillon"; }).length,
      impayes: liste.filter(function (x: any) {
        return x.type === "facture" && x.statut !== "paye" && x.statut !== "brouillon"
          && (Number(x.reste_du) || 0) > 0;
      }).length,
      montant_impaye: r2(liste.reduce(function (s: number, x: any) {
        if (x.type !== "facture" || x.statut === "brouillon" || x.statut === "paye") return s;
        return s + (Number(x.reste_du) || 0);
      }, 0)),
      chiffre_affaires: r2(liste.reduce(function (s: number, x: any) {
        if (x.type !== "facture" || x.statut === "brouillon") return s;
        return s + (Number(x.total_ht) || 0);
      }, 0)),
      devis_en_attente: liste.filter(function (x: any) {
        return x.type === "devis" && x.statut === "envoye";
      }).length,
    };

    return NextResponse.json({ ok: true, documents: liste, compteurs, types: TYPES });
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

    // ---------- CREER UN DOCUMENT ----------
    if (b.action === "creer") {
      const type = String(b.type || "facture").trim();
      if (!TYPES[type]) {
        return NextResponse.json({ ok: false, erreur: "Type inconnu." }, { status: 400 });
      }
      if (!propre(b.client_nom, 200)) {
        return NextResponse.json({ ok: false, erreur: "Indiquez le nom du client." }, { status: 400 });
      }

      const echeance = b.date_echeance || (function () {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toISOString().slice(0, 10);
      })();

      const { data, error } = await supabase
        .from("devis_factures")
        .insert({
          tenant_id: tenant,
          societe_id: b.societe_id || null,
          type: type,
          client_nom: propre(b.client_nom, 200),
          client_email: propre(b.client_email, 200),
          client_adresse: propre(b.client_adresse, 300),
          client_code_postal: propre(b.client_code_postal, 20),
          client_ville: propre(b.client_ville, 120),
          client_pays: propre(b.client_pays, 4) || "FR",
          client_siren: propre(b.client_siren, 20),
          client_tva: propre(b.client_tva, 30),
          date_echeance: echeance,
          objet: propre(b.objet, 300),
          conditions: propre(b.conditions, 2000),
          autoliquidation: b.autoliquidation === true,
          statut: "brouillon",
          cree_par: session.email || null,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, document: data, message: TYPES[type].nom + " créé." });
    }

    // ---------- MODIFIER L EN-TETE ----------
    if (b.action === "modifier") {
      const v = await documentAutorise(b.id, tenant);
      if (v.erreur) return NextResponse.json({ ok: false, erreur: v.erreur }, { status: v.code });

      if (FIGES.indexOf(v.doc.statut) >= 0) {
        return NextResponse.json({
          ok: false,
          erreur: "Ce document est émis : il ne se modifie plus. Établissez un avoir.",
        }, { status: 409 });
      }

      const champs: any = {};
      const permis = ["client_nom", "client_email", "client_adresse", "client_code_postal",
        "client_ville", "client_pays", "client_siren", "client_tva", "objet",
        "conditions", "date_echeance"];
      for (const c of permis) {
        if (b[c] !== undefined) champs[c] = propre(b[c], 300);
      }
      if (b.autoliquidation !== undefined) champs.autoliquidation = b.autoliquidation === true;
      if (b.societe_id !== undefined) champs.societe_id = b.societe_id || null;

      const { error } = await supabase.from("devis_factures").update(champs).eq("id", b.id);
      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, message: "Document enregistré." });
    }

    // ---------- AJOUTER OU MODIFIER UNE LIGNE ----------
    if (b.action === "ligne") {
      const v = await documentAutorise(b.document_id, tenant);
      if (v.erreur) return NextResponse.json({ ok: false, erreur: v.erreur }, { status: v.code });

      if (FIGES.indexOf(v.doc.statut) >= 0) {
        return NextResponse.json({
          ok: false,
          erreur: "Ce document est émis : ses lignes ne se modifient plus.",
        }, { status: 409 });
      }

      if (!propre(b.designation, 300)) {
        return NextResponse.json({ ok: false, erreur: "Indiquez la désignation." }, { status: 400 });
      }

      // L autoliquidation force le taux a zero : c est le preneur qui
      // liquide la TVA, l emetteur ne la facture pas.
      const taux = v.doc.autoliquidation ? 0 : (Number(b.taux_tva) || 0);
      const calcul = calculerLigne({ ...b, taux_tva: taux });

      const champs: any = {
        document_id: b.document_id,
        rang: Number(b.rang) || 0,
        designation: propre(b.designation, 300),
        detail: propre(b.detail, 1000),
        quantite: Number(b.quantite) || 0,
        unite: propre(b.unite, 20),
        prix_unitaire: Number(b.prix_unitaire) || 0,
        remise_pct: Number(b.remise_pct) || 0,
        taux_tva: taux,
        total_ht: calcul.total_ht,
        total_tva: calcul.total_tva,
        total_ttc: calcul.total_ttc,
        compte_produit: propre(b.compte_produit, 20),
      };

      if (b.id) {
        const { error } = await supabase
          .from("devis_factures_lignes").update(champs).eq("id", b.id);
        if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      } else {
        const { error } = await supabase.from("devis_factures_lignes").insert(champs);
        if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      const totaux = await recalculer(b.document_id);
      return NextResponse.json({ ok: true, totaux: totaux, message: "Ligne enregistrée." });
    }

    // ---------- SUPPRIMER UNE LIGNE ----------
    if (b.action === "supprimer_ligne") {
      const { data: ligne } = await supabase
        .from("devis_factures_lignes")
        .select("document_id")
        .eq("id", b.id)
        .maybeSingle();

      if (!ligne) {
        return NextResponse.json({ ok: false, erreur: "Ligne introuvable." }, { status: 404 });
      }

      const v = await documentAutorise(ligne.document_id, tenant);
      if (v.erreur) return NextResponse.json({ ok: false, erreur: v.erreur }, { status: v.code });
      if (FIGES.indexOf(v.doc.statut) >= 0) {
        return NextResponse.json({ ok: false, erreur: "Document émis : figé." }, { status: 409 });
      }

      await supabase.from("devis_factures_lignes").delete().eq("id", b.id);
      const totaux = await recalculer(ligne.document_id);
      return NextResponse.json({ ok: true, totaux: totaux, message: "Ligne supprimée." });
    }

    // ---------- EMETTRE ----------
    //
    // 🚨 C EST ICI QUE LE NUMERO S ATTRIBUE, et nulle part ailleurs. Le
    // document devient alors intangible et son contenu est hache.
    if (b.action === "emettre") {
      const v = await documentAutorise(b.id, tenant);
      if (v.erreur) return NextResponse.json({ ok: false, erreur: v.erreur }, { status: v.code });

      if (v.doc.numero) {
        return NextResponse.json({
          ok: false, erreur: "Ce document porte déjà le numéro " + v.doc.numero + ".",
        }, { status: 409 });
      }

      const { count } = await supabase
        .from("devis_factures_lignes")
        .select("id", { count: "exact", head: true })
        .eq("document_id", b.id);

      if ((count || 0) === 0) {
        return NextResponse.json({
          ok: false, erreur: "Aucune ligne : ce document n a rien à facturer.",
        }, { status: 400 });
      }

      // Une facture a l etranger sans numero de TVA du preneur n est pas
      // reguliere en autoliquidation.
      if (v.doc.autoliquidation && !v.doc.client_tva) {
        return NextResponse.json({
          ok: false,
          erreur: "Autoliquidation sans numéro de TVA du client : la facture ne serait pas régulière.",
        }, { status: 400 });
      }

      const totaux = await recalculer(b.id);
      const numero = await numeroSuivant(tenant, v.doc.type);
      const emission = new Date().toISOString().slice(0, 10);

      const pourHash = {
        numero: numero,
        tenant_id: tenant,
        client_nom: v.doc.client_nom,
        total_ht: totaux.total_ht,
        total_tva: totaux.total_tva,
        total_ttc: totaux.total_ttc,
        date_emission: emission,
      };

      const { error } = await supabase
        .from("devis_factures")
        .update({
          numero: numero,
          statut: "envoye",
          date_emission: emission,
          envoye_le: new Date().toISOString(),
          reste_du: totaux.total_ttc,
          hash_sha256: hachage(pourHash),
          horodatage_hash: new Date().toISOString(),
        })
        .eq("id", b.id);

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true, numero: numero,
        message: TYPES[v.doc.type].nom + " " + numero + " émis" + (v.doc.type === "facture" ? "e" : "") + ".",
      });
    }

    // ---------- CONVERTIR UN DEVIS EN FACTURE ----------
    //
    // Le devis n est pas transforme : il est CONSERVE tel quel et une
    // facture nait de lui. Les deux se retrouvent par facture_origine et
    // devis_origine — un devis accepte est une preuve, il ne s efface pas.
    if (b.action === "convertir") {
      const v = await documentAutorise(b.id, tenant);
      if (v.erreur) return NextResponse.json({ ok: false, erreur: v.erreur }, { status: v.code });

      if (v.doc.type !== "devis") {
        return NextResponse.json({ ok: false, erreur: "Seul un devis se convertit." }, { status: 400 });
      }

      const { data: nouvelle, error } = await supabase
        .from("devis_factures")
        .insert({
          tenant_id: tenant,
          societe_id: v.doc.societe_id,
          type: "facture",
          client_nom: v.doc.client_nom,
          client_email: v.doc.client_email,
          client_adresse: v.doc.client_adresse,
          client_code_postal: v.doc.client_code_postal,
          client_ville: v.doc.client_ville,
          client_pays: v.doc.client_pays,
          client_siren: v.doc.client_siren,
          client_tva: v.doc.client_tva,
          objet: v.doc.objet,
          conditions: v.doc.conditions,
          autoliquidation: v.doc.autoliquidation,
          devis_origine: v.doc.id,
          statut: "brouillon",
          cree_par: session.email || null,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      const { data: lignes } = await supabase
        .from("devis_factures_lignes")
        .select("*")
        .eq("document_id", v.doc.id)
        .order("rang", { ascending: true });

      for (const l of lignes || []) {
        await supabase.from("devis_factures_lignes").insert({
          document_id: nouvelle.id,
          rang: l.rang, designation: l.designation, detail: l.detail,
          quantite: l.quantite, unite: l.unite, prix_unitaire: l.prix_unitaire,
          remise_pct: l.remise_pct, taux_tva: l.taux_tva,
          total_ht: l.total_ht, total_tva: l.total_tva, total_ttc: l.total_ttc,
          compte_produit: l.compte_produit,
        });
      }

      await supabase.from("devis_factures").update({ statut: "accepte" }).eq("id", v.doc.id);
      await recalculer(nouvelle.id);

      return NextResponse.json({
        ok: true, document: nouvelle,
        message: "Facture créée depuis le devis. Relisez-la avant de l'émettre.",
      });
    }

    // ---------- ETABLIR UN AVOIR ----------
    //
    // L avoir reprend les lignes de la facture EN NEGATIF. C est la seule
    // facon de corriger une facture emise.
    if (b.action === "avoir") {
      const v = await documentAutorise(b.id, tenant);
      if (v.erreur) return NextResponse.json({ ok: false, erreur: v.erreur }, { status: v.code });

      if (v.doc.type !== "facture" || !v.doc.numero) {
        return NextResponse.json({
          ok: false, erreur: "Un avoir ne s établit que sur une facture émise.",
        }, { status: 400 });
      }

      const { data: nouvel, error } = await supabase
        .from("devis_factures")
        .insert({
          tenant_id: tenant,
          societe_id: v.doc.societe_id,
          type: "avoir",
          client_nom: v.doc.client_nom,
          client_email: v.doc.client_email,
          client_adresse: v.doc.client_adresse,
          client_code_postal: v.doc.client_code_postal,
          client_ville: v.doc.client_ville,
          client_pays: v.doc.client_pays,
          client_siren: v.doc.client_siren,
          client_tva: v.doc.client_tva,
          objet: "Avoir sur facture " + v.doc.numero
            + (b.motif ? " — " + propre(b.motif, 200) : ""),
          autoliquidation: v.doc.autoliquidation,
          facture_origine: v.doc.id,
          statut: "brouillon",
          cree_par: session.email || null,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      const { data: lignes } = await supabase
        .from("devis_factures_lignes")
        .select("*")
        .eq("document_id", v.doc.id)
        .order("rang", { ascending: true });

      for (const l of lignes || []) {
        await supabase.from("devis_factures_lignes").insert({
          document_id: nouvel.id,
          rang: l.rang,
          designation: l.designation,
          detail: l.detail,
          quantite: -(Number(l.quantite) || 0),
          unite: l.unite,
          prix_unitaire: l.prix_unitaire,
          remise_pct: l.remise_pct,
          taux_tva: l.taux_tva,
          total_ht: -(Number(l.total_ht) || 0),
          total_tva: -(Number(l.total_tva) || 0),
          total_ttc: -(Number(l.total_ttc) || 0),
          compte_produit: l.compte_produit,
        });
      }

      await recalculer(nouvel.id);

      return NextResponse.json({
        ok: true, document: nouvel,
        message: "Avoir préparé sur la facture " + v.doc.numero
          + ". Ajustez les lignes si l'avoir est partiel, puis émettez-le.",
      });
    }

    // ---------- ENREGISTRER UN REGLEMENT ----------
    if (b.action === "reglement") {
      const v = await documentAutorise(b.document_id, tenant);
      if (v.erreur) return NextResponse.json({ ok: false, erreur: v.erreur }, { status: v.code });

      const montant = Number(b.montant) || 0;
      if (montant <= 0) {
        return NextResponse.json({ ok: false, erreur: "Montant invalide." }, { status: 400 });
      }

      const { error } = await supabase.from("devis_factures_reglements").insert({
        document_id: b.document_id,
        montant: r2(montant),
        date_reglement: b.date_reglement || new Date().toISOString().slice(0, 10),
        mode: propre(b.mode, 40),
        reference: propre(b.reference, 120),
        notes: propre(b.notes, 500),
      });

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      const totaux = await recalculer(b.document_id);
      const reste = r2(totaux.total_ttc - totaux.paye);

      // Le statut suit le solde : solde le, la facture est payee ; il reste
      // quelque chose, elle est partielle.
      await supabase
        .from("devis_factures")
        .update({
          statut: reste <= 0.005 ? "paye" : "partiel",
          paye_le: reste <= 0.005 ? new Date().toISOString() : null,
        })
        .eq("id", b.document_id);

      return NextResponse.json({
        ok: true,
        reste: reste,
        message: reste <= 0.005
          ? "Réglée intégralement."
          : "Règlement enregistré. Reste " + reste.toFixed(2) + " €.",
      });
    }

    // ---------- SUPPRIMER UN BROUILLON ----------
    //
    // ⚠️ SEUL UN BROUILLON SE SUPPRIME. Un document numerote ne disparait
    // jamais : il s annule par un avoir. Effacer une facture emise ferait
    // un trou dans la serie.
    if (b.action === "supprimer") {
      const v = await documentAutorise(b.id, tenant);
      if (v.erreur) return NextResponse.json({ ok: false, erreur: v.erreur }, { status: v.code });

      if (v.doc.numero) {
        return NextResponse.json({
          ok: false,
          erreur: "Ce document porte le numéro " + v.doc.numero
            + " : il ne se supprime pas. Établissez un avoir.",
        }, { status: 409 });
      }

      await supabase.from("devis_factures_lignes").delete().eq("document_id", b.id);
      await supabase.from("devis_factures_reglements").delete().eq("document_id", b.id);
      await supabase.from("devis_factures").delete().eq("id", b.id);

      return NextResponse.json({ ok: true, message: "Brouillon supprimé." });
    }

    // ---------- MARQUER UN DEVIS REFUSE ----------
    if (b.action === "refuser") {
      const v = await documentAutorise(b.id, tenant);
      if (v.erreur) return NextResponse.json({ ok: false, erreur: v.erreur }, { status: v.code });
      if (v.doc.type !== "devis") {
        return NextResponse.json({ ok: false, erreur: "Seul un devis se refuse." }, { status: 400 });
      }
      await supabase.from("devis_factures").update({ statut: "refuse" }).eq("id", b.id);
      return NextResponse.json({ ok: true, message: "Devis marqué refusé." });
    }

    return NextResponse.json({ ok: false, erreur: "Action inconnue." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
