import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { tenantDeSession, emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// LES BIENS — 14/09.
//
// Le portefeuille de l agence. Chaque bien porte ce qu une annonce doit
// dire par la loi : le prix, la part des honoraires et QUI LES PAIE, le
// DPE. C est notre difference — la conformite prouvee, pas la diffusion.
//
// 🚨 LE PRIX HORS HONORAIRES NE SE SAISIT PAS. Il se calcule : prix moins
// honoraires quand ils sont a la charge de l acquereur, prix tout court
// quand ils sont a la charge du vendeur. Doctrine : on ne fait pas taper ce
// que l application sait faire, et deux prix saisis a la main finissent
// toujours par se contredire.
//
// 🚨 LES HONORAIRES SE DONNENT EN TAUX OU EN MONTANT, JAMAIS LES DEUX. Si
// le taux est donne, le montant en decoule. Laisser les deux ouverts, c est
// garantir qu un jour l un dira 5 % et l autre 3 000 € sur un bien a
// 100 000 €.
//
// ⚠️ LE DPE EXPIRE AU BOUT DE DIX ANS. La route rend `dpe_expire` : un
// diagnostic perime dans une annonce, c est l agence qui repond.
//
// ⚠️ ON NE SUPPRIME PAS UN BIEN QUI A SERVI. Un bien se retire ; s il a
// porte un mandat, il doit rester lisible — le registre des mandats renvoie
// a lui. La suppression n est permise que sur un bien sans mandat.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const TRANSACTIONS = ["vente", "location"];
const TYPES = ["appartement", "maison", "terrain", "local", "immeuble", "parking", "autre"];
const STATUTS = ["disponible", "sous_offre", "sous_compromis", "vendu", "loue", "retire"];
const CHARGE = ["acquereur", "vendeur"];
const LETTRES = ["A", "B", "C", "D", "E", "F", "G"];

function propre(v: any, max: number): string {
  return String(v === null || v === undefined ? "" : v).trim().slice(0, max);
}

function nb(v: any): any {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  const x = Number(String(v).replace(",", "."));
  return isFinite(x) ? Math.round(x * 100) / 100 : null;
}

function entier(v: any): any {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  const x = parseInt(String(v), 10);
  return isFinite(x) ? x : null;
}

function lettre(v: any): any {
  const l = propre(v, 1).toUpperCase();
  return LETTRES.indexOf(l) >= 0 ? l : null;
}

// Le calcul des honoraires et du prix hors honoraires. Un seul endroit,
// appele a la creation comme a la modification.
function chiffrer(b: any, prix: any, taux: any, montant: any, charge: string): any {
  const p = nb(prix);
  let t = nb(taux);
  let m = nb(montant);

  // Le taux commande. S il est donne, le montant en decoule ; sinon on
  // garde le montant saisi et on en deduit le taux, pour que l annonce
  // puisse afficher l un ou l autre.
  if (p !== null && t !== null) {
    m = Math.round(p * (t / 100) * 100) / 100;
  } else if (p !== null && m !== null && p > 0) {
    t = Math.round((m / p) * 10000) / 100;
  }

  let hors = p;
  if (p !== null && m !== null && charge === "acquereur") {
    hors = Math.round((p - m) * 100) / 100;
  }

  return { prix: p, honoraires_taux: t, honoraires_montant: m, prix_hors_honoraires: hors };
}

// Un DPE vaut dix ans. Au-dela, l annonce ne peut plus s appuyer dessus.
function dpeExpire(d: any): boolean {
  if (!d) return false;
  const limite = new Date(String(d) + "T12:00:00Z");
  limite.setFullYear(limite.getFullYear() + 10);
  return limite.getTime() < Date.now();
}

function corps(b: any): any {
  const charge = CHARGE.indexOf(String(b.honoraires_charge || "")) >= 0 ? String(b.honoraires_charge) : "acquereur";
  const money = chiffrer(b, b.prix, b.honoraires_taux, b.honoraires_montant, charge);

  return {
    reference: propre(b.reference, 40) || null,
    transaction: TRANSACTIONS.indexOf(String(b.transaction || "")) >= 0 ? String(b.transaction) : "vente",
    type_bien: TYPES.indexOf(String(b.type_bien || "")) >= 0 ? String(b.type_bien) : "appartement",
    statut: STATUTS.indexOf(String(b.statut || "")) >= 0 ? String(b.statut) : "disponible",

    adresse: propre(b.adresse, 300) || null,
    code_postal: propre(b.code_postal, 10) || null,
    ville: propre(b.ville, 120) || null,
    secteur: propre(b.secteur, 120) || null,

    surface_habitable: nb(b.surface_habitable),
    surface_terrain: nb(b.surface_terrain),
    pieces: entier(b.pieces),
    chambres: entier(b.chambres),
    etage: entier(b.etage),
    annee_construction: entier(b.annee_construction),
    description: propre(b.description, 6000) || null,

    dpe_lettre: lettre(b.dpe_lettre),
    ges_lettre: lettre(b.ges_lettre),
    dpe_le: propre(b.dpe_le, 10) || null,

    prix: money.prix,
    honoraires_taux: money.honoraires_taux,
    honoraires_montant: money.honoraires_montant,
    honoraires_charge: charge,
    prix_hors_honoraires: money.prix_hors_honoraires,

    loyer_charges: nb(b.loyer_charges),
    depot_garantie: nb(b.depot_garantie),
    meuble: b.meuble === true,

    copropriete: b.copropriete === true,
    charges_mensuelles: nb(b.charges_mensuelles),
    lots_copropriete: entier(b.lots_copropriete),
    taxe_fonciere: nb(b.taxe_fonciere),

    updated_at: new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const tenant = tenantDeSession();
  if (!tenant) return NextResponse.json({ ok: false, erreur: "Vous devez être connecté." }, { status: 401 });

  const url = new URL(req.url);

  // ---- UN BIEN ----
  const un = propre(url.searchParams.get("bien"), 60);
  if (un) {
    const { data: b } = await supabase
      .from("crm_biens").select("*").eq("id", un).eq("tenant_id", tenant).maybeSingle();
    if (!b) return NextResponse.json({ ok: false, erreur: "Bien introuvable." }, { status: 404 });

    let proprietaire: any = null;
    if (b.proprietaire_id) {
      const { data: f } = await supabase
        .from("crm").select("id, nom, organisme, email, telephone").eq("id", b.proprietaire_id).eq("tenant_id", tenant).maybeSingle();
      proprietaire = f || null;
    }

    (b as any).dpe_expire = dpeExpire(b.dpe_le);
    return NextResponse.json({
      ok: true, bien: b, proprietaire: proprietaire,
      transactions: TRANSACTIONS, types: TYPES, statuts: STATUTS,
    });
  }

  // ---- LE PORTEFEUILLE ----
  const avecFermes = url.searchParams.get("fermes") === "1";

  let q = supabase
    .from("crm_biens")
    .select("id, reference, transaction, type_bien, statut, ville, code_postal, surface_habitable, pieces, prix, honoraires_charge, dpe_lettre, dpe_le, proprietaire_id, updated_at")
    .eq("tenant_id", tenant)
    .order("updated_at", { ascending: false })
    .limit(2000);

  if (!avecFermes) q = q.not("statut", "in", "(vendu,loue,retire)");

  const { data, error } = await q;
  if (error) return NextResponse.json({ ok: false, erreur: "Lecture impossible." }, { status: 500 });

  const biens = data || [];

  // Le nom du proprietaire : un portefeuille sans les noms oblige a ouvrir
  // chaque fiche pour savoir a qui appartient quoi.
  const ids = biens.map(function (b: any) { return b.proprietaire_id; }).filter(Boolean);
  const noms: any = {};
  if (ids.length > 0) {
    const { data: fiches } = await supabase
      .from("crm").select("id, nom, organisme").eq("tenant_id", tenant).in("id", ids);
    for (const f of fiches || []) noms[f.id] = f.nom || f.organisme || "";
  }

  let totalPortefeuille = 0;
  let dpePerimes = 0;
  for (const b of biens) {
    (b as any).proprietaire = noms[(b as any).proprietaire_id] || "";
    (b as any).dpe_expire = dpeExpire((b as any).dpe_le);
    if ((b as any).dpe_expire) dpePerimes++;
    if (["disponible", "sous_offre", "sous_compromis"].indexOf(String((b as any).statut)) >= 0) {
      totalPortefeuille += Number((b as any).prix) || 0;
    }
  }

  return NextResponse.json({
    ok: true, biens: biens,
    total_portefeuille: Math.round(totalPortefeuille * 100) / 100,
    dpe_perimes: dpePerimes,
    transactions: TRANSACTIONS, types: TYPES, statuts: STATUTS,
  });
}

export async function POST(req: NextRequest) {
  const tenant = tenantDeSession();
  const email = emailDeSession();
  if (!tenant) return NextResponse.json({ ok: false, erreur: "Vous devez être connecté." }, { status: 401 });

  const b = await req.json().catch(function () { return {}; });
  const action = String(b.action || "creer");

  // ---- CREER ----
  if (action === "creer") {
    const ligne: any = { ...corps(b), tenant_id: tenant, cree_par: email || null };

    if (!ligne.ville && !ligne.adresse) {
      return NextResponse.json({ ok: false, erreur: "Indiquez au moins la ville du bien." }, { status: 400 });
    }

    // Le proprietaire, s il est donne : une fiche du CRM, verifiee.
    const cle = propre(b.proprietaire_id, 120);
    if (cle) {
      const r = cle.indexOf("@") > 0
        ? await supabase.from("crm").select("id, email").eq("tenant_id", tenant).eq("email", cle.toLowerCase()).maybeSingle()
        : await supabase.from("crm").select("id, email").eq("tenant_id", tenant).eq("id", cle).maybeSingle();
      if (!r.data) return NextResponse.json({ ok: false, erreur: "Propriétaire introuvable dans vos contacts." }, { status: 404 });
      ligne.proprietaire_id = r.data.id;
      ligne.proprietaire_email = r.data.email || null;
    }

    const { data, error } = await supabase.from("crm_biens").insert(ligne).select("*").maybeSingle();
    if (error) {
      // ⚠️ LA REFERENCE EN DOUBLE SE DIT EN FRANCAIS, pas en message de base
      // de donnees : c est le seul refus que l utilisateur rencontrera.
      if (String(error.message).indexOf("idx_crm_biens_reference") >= 0) {
        return NextResponse.json({ ok: false, erreur: "Cette référence est déjà utilisée par un autre bien." }, { status: 409 });
      }
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, bien: data, message: "Bien enregistré." });
  }

  const id = propre(b.id, 60);
  if (!id) return NextResponse.json({ ok: false, erreur: "Bien non précisé." }, { status: 400 });

  const { data: existant } = await supabase
    .from("crm_biens").select("id, reference, statut").eq("id", id).eq("tenant_id", tenant).maybeSingle();
  if (!existant) return NextResponse.json({ ok: false, erreur: "Bien introuvable." }, { status: 404 });

  // ---- MODIFIER ----
  if (action === "modifier") {
    const ligne: any = corps(b);

    const cle = propre(b.proprietaire_id, 120);
    if (cle) {
      const r = cle.indexOf("@") > 0
        ? await supabase.from("crm").select("id, email").eq("tenant_id", tenant).eq("email", cle.toLowerCase()).maybeSingle()
        : await supabase.from("crm").select("id, email").eq("tenant_id", tenant).eq("id", cle).maybeSingle();
      if (!r.data) return NextResponse.json({ ok: false, erreur: "Propriétaire introuvable dans vos contacts." }, { status: 404 });
      ligne.proprietaire_id = r.data.id;
      ligne.proprietaire_email = r.data.email || null;
    } else if (b.proprietaire_id === "") {
      ligne.proprietaire_id = null;
      ligne.proprietaire_email = null;
    }

    const { error } = await supabase.from("crm_biens").update(ligne).eq("id", id).eq("tenant_id", tenant);
    if (error) {
      if (String(error.message).indexOf("idx_crm_biens_reference") >= 0) {
        return NextResponse.json({ ok: false, erreur: "Cette référence est déjà utilisée par un autre bien." }, { status: 409 });
      }
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, message: "Bien enregistré." });
  }

  // ---- CHANGER LE STATUT ----
  if (action === "statut") {
    const statut = String(b.statut || "");
    if (STATUTS.indexOf(statut) < 0) return NextResponse.json({ ok: false, erreur: "Statut inconnu." }, { status: 400 });

    const { error } = await supabase.from("crm_biens").update({
      statut: statut, updated_at: new Date().toISOString(),
    }).eq("id", id).eq("tenant_id", tenant);
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });

    const dit: any = {
      disponible: "Bien remis en vente.",
      sous_offre: "Offre en cours.",
      sous_compromis: "Compromis signé.",
      vendu: "Bien vendu.",
      loue: "Bien loué.",
      retire: "Bien retiré du portefeuille.",
    };
    return NextResponse.json({ ok: true, message: dit[statut] || "Statut modifié." });
  }

  // ---- SUPPRIMER ----
  //
  // 🚨 SEULEMENT UN BIEN SANS MANDAT. Un bien qui a porte un mandat est
  // cite dans le registre : l effacer rendrait le registre incomprehensible
  // — et le registre est controlable par la DGCCRF.
  if (action === "supprimer") {
    // ⚠️ LA TABLE DES MANDATS N EXISTE PAS ENCORE au moment ou cette route
    // est livree : la brique suivante la cree. L appel est donc protege —
    // une table absente ne doit pas empecher de supprimer un bien d essai,
    // et le controle reprendra tout seul des qu elle existera.
    let portesMandats = 0;
    try {
      const { count } = await supabase
        .from("crm_mandats").select("id", { count: "exact", head: true })
        .eq("bien_id", id).eq("tenant_id", tenant);
      portesMandats = count || 0;
    } catch (e) {
      portesMandats = 0;
    }

    if (portesMandats > 0) {
      return NextResponse.json({
        ok: false,
        erreur: "Ce bien porte un mandat : il ne peut pas être supprimé. Retirez-le du portefeuille.",
      }, { status: 409 });
    }

    const { error } = await supabase.from("crm_biens").delete().eq("id", id).eq("tenant_id", tenant);
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: "Bien supprimé." });
  }

  return NextResponse.json({ ok: false, erreur: "Action inconnue." }, { status: 400 });
}
