import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { tenantDeSession, emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// LE RAPPROCHEMENT ACQUEREUR / BIEN — 14/09.
//
// CE QUE CA REPOND : qui appeler ce matin, et pour quel bien. C est la
// seule chose qu un CRM immobilier fait et qu un CRM generaliste ne fait
// pas — et elle ne coute rien d autre que du code.
//
// 🚨 UN CRITERE VIDE N EXCLUT PERSONNE. Un acquereur qui n a pas dit son
// budget doit remonter sur tout ; un budget max laisse vide ne vaut pas
// zero. C est LE defaut de ce genre d ecran : un filtre trop zele qui ne
// remonte rien, et l agent qui cesse de regarder au bout de trois jours.
//
// 🚨 UN BIEN DEJA PROPOSE NE REVIENT PAS. On garde trace de chaque
// rapprochement montre ; sans cela le meme bien reapparait tous les matins
// pour la meme personne. ?tous=1 les ramene quand meme, pour revoir.
//
// ⚠️ SEULS LES BIENS DISPONIBLES OU SOUS OFFRE REMONTENT. Proposer un bien
// vendu est pire que ne rien proposer : le client appelle, l agent passe
// pour quelqu un qui ne suit pas son propre portefeuille.
//
// ⚠️ LE BUDGET SE COMPARE AU PRIX AFFICHE, honoraires compris quand ils
// sont a la charge de l acquereur : c est ce que la personne sortira
// vraiment de sa poche.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const TRANSACTIONS = ["vente", "location"];
const STATUTS = ["en_cours", "satisfaite", "abandonnee"];
const SUITES = ["propose", "ecarte", "visite", "offre"];
const LETTRES = ["A", "B", "C", "D", "E", "F", "G"];
const OUVERTS = ["disponible", "sous_offre"];

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

// Une liste saisie en texte libre — « Paris, Le Raincy, Montreuil » — rendue
// en tableau. Vide reste vide : c est ce qui veut dire « partout ».
function liste(v: any): any {
  if (Array.isArray(v)) {
    const t = v.map(function (x: any) { return propre(x, 80); }).filter(Boolean);
    return t.length > 0 ? t : null;
  }
  const s = propre(v, 600);
  if (!s) return null;
  const t = s.split(",").map(function (x: string) { return x.trim(); }).filter(Boolean).slice(0, 40);
  return t.length > 0 ? t : null;
}

function memeTexte(a: any, b: any): boolean {
  return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}

// Le coeur du rapprochement. Rend null si le bien convient, ou la raison
// pour laquelle il ne convient pas — l ecran peut ainsi expliquer un
// portefeuille qui ne remonte rien, au lieu d afficher une liste vide.
function pourquoiPas(r: any, b: any): string | null {
  if (OUVERTS.indexOf(String(b.statut)) < 0) return "bien non disponible";

  if (r.transaction && String(b.transaction) !== String(r.transaction)) {
    return r.transaction === "vente" ? "bien en location" : "bien en vente";
  }

  if (r.types && r.types.length > 0 && r.types.indexOf(String(b.type_bien)) < 0) {
    return "type de bien";
  }

  // Ville OU code postal : l un des deux suffit. Quelqu un qui a saisi les
  // codes postaux ne doit pas voir ses biens ecartes parce que la ville est
  // ecrite autrement.
  const aLieu = (r.villes && r.villes.length > 0) || (r.codes_postaux && r.codes_postaux.length > 0);
  if (aLieu) {
    let trouve = false;
    if (r.villes) {
      for (const v of r.villes) if (memeTexte(v, b.ville)) trouve = true;
    }
    if (!trouve && r.codes_postaux) {
      for (const c of r.codes_postaux) if (memeTexte(c, b.code_postal)) trouve = true;
    }
    if (!trouve) return "secteur";
  }

  const prix = Number(b.prix);
  if (r.budget_max !== null && r.budget_max !== undefined && isFinite(prix) && prix > Number(r.budget_max)) {
    return "au-dessus du budget";
  }
  if (r.budget_min !== null && r.budget_min !== undefined && isFinite(prix) && prix < Number(r.budget_min)) {
    return "en dessous du budget";
  }

  const surface = Number(b.surface_habitable);
  if (r.surface_min !== null && r.surface_min !== undefined && isFinite(surface) && surface < Number(r.surface_min)) {
    return "surface";
  }

  const pieces = Number(b.pieces);
  if (r.pieces_min !== null && r.pieces_min !== undefined && isFinite(pieces) && pieces < Number(r.pieces_min)) {
    return "nombre de pièces";
  }

  const chambres = Number(b.chambres);
  if (r.chambres_min !== null && r.chambres_min !== undefined && isFinite(chambres) && chambres < Number(r.chambres_min)) {
    return "nombre de chambres";
  }

  // ⚠️ UN BIEN SANS DPE N EST PAS ECARTE : le diagnostic manque peut-etre
  // encore. L ecran du portefeuille le signale deja par ailleurs.
  if (r.dpe_max && b.dpe_lettre) {
    if (LETTRES.indexOf(String(b.dpe_lettre)) > LETTRES.indexOf(String(r.dpe_max))) {
      return "diagnostic trop faible";
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  const tenant = tenantDeSession();
  if (!tenant) return NextResponse.json({ ok: false, erreur: "Vous devez être connecté." }, { status: 401 });

  const url = new URL(req.url);
  const fiche = propre(url.searchParams.get("fiche"), 60);
  const rappro = propre(url.searchParams.get("rapprocher"), 60);
  const tous = url.searchParams.get("tous") === "1";

  // ---- LE RAPPROCHEMENT D UNE RECHERCHE ----
  if (rappro) {
    const { data: r } = await supabase
      .from("crm_recherches").select("*").eq("id", rappro).eq("tenant_id", tenant).maybeSingle();
    if (!r) return NextResponse.json({ ok: false, erreur: "Recherche introuvable." }, { status: 404 });

    const { data: biens } = await supabase
      .from("crm_biens").select("*").eq("tenant_id", tenant).limit(2000);

    // Ce qui a deja ete montre pour cette recherche.
    const { data: deja } = await supabase
      .from("crm_rapprochements").select("bien_id, suite, motif")
      .eq("tenant_id", tenant).eq("recherche_id", rappro);
    const vus: any = {};
    for (const d of deja || []) vus[d.bien_id] = d;

    const correspond: any[] = [];
    const ecartes: any = {};

    for (const b of biens || []) {
      const raison = pourquoiPas(r, b);
      if (raison) {
        ecartes[raison] = (ecartes[raison] || 0) + 1;
        continue;
      }
      const vu = vus[(b as any).id];
      if (vu && !tous) continue;
      correspond.push({ ...b, deja_vu: vu ? vu.suite : null });
    }

    // Le moins cher d abord : c est ce qu on propose en premier.
    correspond.sort(function (a: any, c: any) { return (Number(a.prix) || 0) - (Number(c.prix) || 0); });

    return NextResponse.json({
      ok: true, recherche: r, biens: correspond,
      ecartes: ecartes, deja_proposes: (deja || []).length,
    });
  }

  // ---- LES RECHERCHES ----
  let q = supabase
    .from("crm_recherches").select("*").eq("tenant_id", tenant)
    .order("created_at", { ascending: false }).limit(1000);

  if (fiche) q = q.eq("fiche_id", fiche);
  if (!tous) q = q.eq("statut", "en_cours");

  const { data, error } = await q;
  if (error) return NextResponse.json({ ok: false, erreur: "Lecture impossible." }, { status: 500 });

  const recherches = data || [];

  const ids = recherches.map(function (r: any) { return r.fiche_id; }).filter(Boolean);
  const noms: any = {};
  if (ids.length > 0) {
    const { data: fs } = await supabase
      .from("crm").select("id, nom, organisme, telephone").eq("tenant_id", tenant).in("id", ids);
    for (const f of fs || []) noms[f.id] = f;
  }
  for (const r of recherches) {
    const f = noms[(r as any).fiche_id];
    (r as any).contact = f ? (f.nom || f.organisme || "") : ((r as any).fiche_email || "");
    (r as any).telephone = f ? f.telephone : null;
  }

  return NextResponse.json({ ok: true, recherches: recherches, transactions: TRANSACTIONS, statuts: STATUTS });
}

export async function POST(req: NextRequest) {
  const tenant = tenantDeSession();
  const email = emailDeSession();
  if (!tenant) return NextResponse.json({ ok: false, erreur: "Vous devez être connecté." }, { status: 401 });

  const b = await req.json().catch(function () { return {}; });
  const action = String(b.action || "creer");

  // ---- CREER OU MODIFIER UNE RECHERCHE ----
  if (action === "creer" || action === "modifier") {
    const ligne: any = {
      intitule: propre(b.intitule, 160) || null,
      transaction: TRANSACTIONS.indexOf(String(b.transaction || "")) >= 0 ? String(b.transaction) : "vente",
      types: liste(b.types),
      villes: liste(b.villes),
      codes_postaux: liste(b.codes_postaux),
      budget_min: nb(b.budget_min),
      budget_max: nb(b.budget_max),
      surface_min: nb(b.surface_min),
      pieces_min: entier(b.pieces_min),
      chambres_min: entier(b.chambres_min),
      dpe_max: LETTRES.indexOf(propre(b.dpe_max, 1).toUpperCase()) >= 0 ? propre(b.dpe_max, 1).toUpperCase() : null,
      notes: propre(b.notes, 2000) || null,
      updated_at: new Date().toISOString(),
    };

    if (ligne.budget_min !== null && ligne.budget_max !== null && ligne.budget_min > ligne.budget_max) {
      return NextResponse.json({ ok: false, erreur: "Le budget minimum dépasse le maximum." }, { status: 400 });
    }

    if (action === "modifier") {
      const id = propre(b.id, 60);
      if (!id) return NextResponse.json({ ok: false, erreur: "Recherche non précisée." }, { status: 400 });
      const { error } = await supabase.from("crm_recherches").update(ligne).eq("id", id).eq("tenant_id", tenant);
      if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, message: "Recherche enregistrée." });
    }

    const cle = propre(b.fiche_id, 120);
    if (!cle) return NextResponse.json({ ok: false, erreur: "Une recherche appartient à un contact." }, { status: 400 });

    const r = cle.indexOf("@") > 0
      ? await supabase.from("crm").select("id, email").eq("tenant_id", tenant).eq("email", cle.toLowerCase()).maybeSingle()
      : await supabase.from("crm").select("id, email").eq("tenant_id", tenant).eq("id", cle).maybeSingle();
    if (!r.data) return NextResponse.json({ ok: false, erreur: "Contact introuvable." }, { status: 404 });

    ligne.tenant_id = tenant;
    ligne.fiche_id = r.data.id;
    ligne.fiche_email = r.data.email || null;
    ligne.statut = "en_cours";
    ligne.cree_par = email || null;

    const { data, error } = await supabase.from("crm_recherches").insert(ligne).select("*").maybeSingle();
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, recherche: data, message: "Recherche enregistrée." });
  }

  // ---- CLORE OU ROUVRIR UNE RECHERCHE ----
  if (action === "statut") {
    const id = propre(b.id, 60);
    const statut = String(b.statut || "");
    if (STATUTS.indexOf(statut) < 0) return NextResponse.json({ ok: false, erreur: "Statut inconnu." }, { status: 400 });

    const { error } = await supabase.from("crm_recherches").update({
      statut: statut,
      close_le: statut === "en_cours" ? null : new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    }).eq("id", id).eq("tenant_id", tenant);
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });

    const dit: any = {
      en_cours: "Recherche rouverte.",
      satisfaite: "Recherche satisfaite — le client a trouvé.",
      abandonnee: "Recherche abandonnée.",
    };
    return NextResponse.json({ ok: true, message: dit[statut] });
  }

  // ---- NOTER UN RAPPROCHEMENT ----
  //
  // C est ce qui fait qu un bien deja montre ne revient pas. La suite dit ce
  // qu il est devenu : ecarte, visite, offre.
  if (action === "noter") {
    const rechercheId = propre(b.recherche_id, 60);
    const bienId = propre(b.bien_id, 60);
    const suite = SUITES.indexOf(String(b.suite || "")) >= 0 ? String(b.suite) : "propose";
    if (!rechercheId || !bienId) return NextResponse.json({ ok: false, erreur: "Rapprochement incomplet." }, { status: 400 });

    const { data: rech } = await supabase
      .from("crm_recherches").select("id, fiche_id").eq("id", rechercheId).eq("tenant_id", tenant).maybeSingle();
    if (!rech) return NextResponse.json({ ok: false, erreur: "Recherche introuvable." }, { status: 404 });

    // Deja note : on met a jour la suite plutot que de refuser — l agent
    // propose, puis fait visiter, puis recoit une offre. C est le meme
    // rapprochement qui avance.
    const { data: deja } = await supabase
      .from("crm_rapprochements").select("id")
      .eq("tenant_id", tenant).eq("recherche_id", rechercheId).eq("bien_id", bienId).maybeSingle();

    if (deja) {
      const { error } = await supabase.from("crm_rapprochements").update({
        suite: suite, motif: propre(b.motif, 300) || null, vu_le: new Date().toISOString(),
      }).eq("id", deja.id).eq("tenant_id", tenant);
      if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    } else {
      const { error } = await supabase.from("crm_rapprochements").insert({
        tenant_id: tenant, recherche_id: rechercheId, bien_id: bienId,
        fiche_id: rech.fiche_id, suite: suite,
        motif: propre(b.motif, 300) || null, cree_par: email || null,
      });
      if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // La fiche bouge : proposer un bien est un contact, et le CRM doit le
    // savoir pour ne pas croire ce client oublie.
    if (rech.fiche_id) {
      await supabase.from("crm").update({ derniere_interaction: new Date().toISOString() })
        .eq("id", rech.fiche_id).eq("tenant_id", tenant);
    }

    const dit: any = {
      propose: "Bien proposé — il ne reviendra plus dans la liste.",
      ecarte: "Bien écarté pour ce client.",
      visite: "Visite notée.",
      offre: "Offre notée.",
    };
    return NextResponse.json({ ok: true, message: dit[suite] });
  }

  return NextResponse.json({ ok: false, erreur: "Action inconnue." }, { status: 400 });
}
