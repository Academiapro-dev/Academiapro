import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { tenantDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// LES ECHEANCIERS DE REGLEMENT — 14/09.
//
// CE QUE C EST : une facture reglee en plusieurs fois. Trois fois cinq
// cents euros plutot que quinze cents d un coup. Chaque echeance porte sa
// date, son montant, son reglement et ses relances.
//
// 🚨 RIEN N EST RECONSTRUIT. La facture existe deja
// (organisme_factures, avec son echeance, son montant regle et son
// statut) : on ne la double pas. L echeancier est un DECOUPAGE de cette
// facture, rien d autre.
//
// ⚠️ LA SOMME DES ECHEANCES DOIT FAIRE LE MONTANT DE LA FACTURE. Un
// echeancier qui ne totalise pas la facture ferait croire a un solde
// paye alors qu il reste du : on refuse, en disant l ecart.
//
// ⚠️ POINTER UN REGLEMENT MET A JOUR LA FACTURE ELLE-MEME (montant_regle,
// statut). Deux endroits qui disent des choses differentes sur le meme
// argent, c est un outil qu on cesse de croire.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function propre(v: any, max: number): string {
  return String(v === null || v === undefined ? "" : v).trim().slice(0, max);
}
function nombre(v: any): number {
  const n = Number(String(v === null || v === undefined ? "" : v).replace(",", "."));
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}
function dateOuNull(v: any): string | null {
  const t = String(v || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

// Le total regle d une facture, recalcule depuis ses echeances, et le
// statut qui en decoule. ⚠️ ON RECALCULE, ON N INCREMENTE PAS : un
// increment se decale a la premiere correction.
async function majFacture(factureId: string) {
  const { data: lignes } = await supabase
    .from("organisme_echeances")
    .select("montant, montant_regle")
    .eq("facture_id", factureId);

  const { data: f } = await supabase
    .from("organisme_factures")
    .select("id, montant_ttc")
    .eq("id", factureId)
    .maybeSingle();

  if (!f) return null;

  let regle = 0;
  for (const l of lignes || []) regle = regle + (Number(l.montant_regle) || 0);
  regle = Math.round(regle * 100) / 100;

  const du = Number(f.montant_ttc) || 0;
  const statut = regle <= 0 ? "emise" : (regle + 0.009 >= du ? "reglee" : "partielle");

  await supabase.from("organisme_factures").update({
    montant_regle: regle,
    statut: statut,
    regle_le: statut === "reglee" ? new Date().toISOString().slice(0, 10) : null,
  }).eq("id", factureId);

  return { regle: regle, du: du, statut: statut };
}

export async function GET(req: NextRequest) {
  const tenant = tenantDeSession();
  if (!tenant) return NextResponse.json({ ok: false, erreur: "Vous devez être connecté." }, { status: 401 });

  const url = new URL(req.url);
  const facture = String(url.searchParams.get("facture") || "").trim();

  // Les echeances d une facture precise.
  if (facture) {
    const { data, error } = await supabase
      .from("organisme_echeances")
      .select("*")
      .eq("tenant_id", tenant)
      .eq("facture_id", facture)
      .order("rang");
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, echeances: data || [] });
  }

  // Sinon : le tableau de bord des impayes. C est ce qu on ouvre le matin.
  const { data: lignes, error } = await supabase
    .from("organisme_echeances")
    .select("*")
    .eq("tenant_id", tenant)
    .is("regle_le", null)
    .order("due_le", { ascending: true })
    .limit(1000);

  if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });

  const ids: string[] = [];
  for (const l of lignes || []) if (ids.indexOf(l.facture_id) < 0) ids.push(l.facture_id);

  const { data: factures } = ids.length > 0
    ? await supabase.from("organisme_factures").select("id, numero, destinataire_nom, destinataire_email, montant_ttc").in("id", ids)
    : { data: [] as any[] };

  const parId: any = {};
  for (const f of factures || []) parId[f.id] = f;

  const aujourdhui = new Date().toISOString().slice(0, 10);
  let enRetard = 0, aVenir = 0, totalRetard = 0;
  const sortie = (lignes || []).map(function (l: any) {
    const reste = Math.round(((Number(l.montant) || 0) - (Number(l.montant_regle) || 0)) * 100) / 100;
    const retard = String(l.due_le) < aujourdhui;
    if (retard) { enRetard++; totalRetard = totalRetard + reste; } else aVenir++;
    return { ...l, reste: reste, en_retard: retard, facture: parId[l.facture_id] || null };
  });

  return NextResponse.json({
    ok: true, echeances: sortie,
    en_retard: enRetard, a_venir: aVenir,
    total_retard: Math.round(totalRetard * 100) / 100,
  });
}

export async function POST(req: NextRequest) {
  const tenant = tenantDeSession();
  if (!tenant) return NextResponse.json({ ok: false, erreur: "Vous devez être connecté." }, { status: 401 });

  const b = await req.json().catch(function () { return {}; });
  const action = String(b.action || "creer");

  // ---- CREER L ECHEANCIER D UNE FACTURE ----
  if (action === "creer") {
    const factureId = propre(b.facture_id, 60);
    if (!factureId) return NextResponse.json({ ok: false, erreur: "Facture non précisée." }, { status: 400 });

    const { data: f } = await supabase
      .from("organisme_factures")
      .select("id, numero, montant_ttc, echeance")
      .eq("id", factureId).eq("tenant_id", tenant).maybeSingle();
    if (!f) return NextResponse.json({ ok: false, erreur: "Facture introuvable." }, { status: 404 });

    const { data: deja } = await supabase
      .from("organisme_echeances").select("id").eq("facture_id", factureId).limit(1).maybeSingle();
    if (deja) return NextResponse.json({ ok: false, erreur: "Cette facture a déjà un échéancier." }, { status: 409 });

    // Deux facons de faire : soit on donne les lignes, soit on demande un
    // decoupage en N fois a partir d une date.
    let lignes: any[] = [];

    if (Array.isArray(b.echeances) && b.echeances.length > 0) {
      lignes = b.echeances.map(function (e: any, i: number) {
        return { rang: i + 1, montant: nombre(e.montant), due_le: dateOuNull(e.due_le) };
      });
    } else {
      const nb = Math.max(2, Math.min(36, Number(b.nombre) || 3));
      const depart = dateOuNull(b.premiere_le) || dateOuNull(f.echeance) || new Date().toISOString().slice(0, 10);
      const ecart = Math.max(1, Math.min(365, Number(b.tous_les_jours) || 30));
      const total = Number(f.montant_ttc) || 0;
      // ⚠️ LE DERNIER PORTE L ARRONDI : 1000 / 3 doit faire 1000, pas 999,99.
      const part = Math.floor((total / nb) * 100) / 100;
      for (let i = 0; i < nb; i++) {
        const d = new Date(depart + "T12:00:00Z");
        d.setUTCDate(d.getUTCDate() + i * ecart);
        lignes.push({
          rang: i + 1,
          montant: i === nb - 1 ? Math.round((total - part * (nb - 1)) * 100) / 100 : part,
          due_le: d.toISOString().slice(0, 10),
        });
      }
    }

    for (const l of lignes) {
      if (!l.due_le) return NextResponse.json({ ok: false, erreur: "Une échéance n'a pas de date." }, { status: 400 });
      if (l.montant <= 0) return NextResponse.json({ ok: false, erreur: "Une échéance a un montant nul." }, { status: 400 });
    }

    const somme = Math.round(lignes.reduce(function (s: number, l: any) { return s + l.montant; }, 0) * 100) / 100;
    const du = Math.round((Number(f.montant_ttc) || 0) * 100) / 100;
    if (Math.abs(somme - du) > 0.01) {
      return NextResponse.json({
        ok: false,
        erreur: "Le total des échéances (" + somme.toFixed(2) + " €) ne fait pas le montant de la facture (" + du.toFixed(2) + " €). Écart de " + Math.abs(somme - du).toFixed(2) + " €.",
      }, { status: 400 });
    }

    const { error } = await supabase.from("organisme_echeances").insert(
      lignes.map(function (l: any) {
        return { tenant_id: tenant, facture_id: factureId, rang: l.rang, montant: l.montant, due_le: l.due_le };
      })
    );
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });

    await majFacture(factureId);
    return NextResponse.json({ ok: true, message: "Échéancier créé — " + lignes.length + " échéance(s), " + du.toFixed(2) + " € au total." });
  }

  // ---- POINTER UN REGLEMENT ----
  if (action === "regler") {
    const id = propre(b.id, 60);
    const { data: e } = await supabase.from("organisme_echeances").select("*").eq("id", id).eq("tenant_id", tenant).maybeSingle();
    if (!e) return NextResponse.json({ ok: false, erreur: "Échéance introuvable." }, { status: 404 });

    // ⚠️ LE MONTANT S ADDITIONNE, IL NE REMPLACE PAS. C est le defaut du
    // 06/08 sur les encaissements : un champ de reglement qui ECRASAIT au
    // lieu d additionner. Ne pas le refaire.
    const ajout = b.montant === undefined ? (Number(e.montant) || 0) - (Number(e.montant_regle) || 0) : nombre(b.montant);
    const total = Math.round(((Number(e.montant_regle) || 0) + ajout) * 100) / 100;
    const solde = total + 0.009 >= (Number(e.montant) || 0);

    const { error } = await supabase.from("organisme_echeances").update({
      montant_regle: total,
      regle_le: solde ? (dateOuNull(b.date_reglement) || new Date().toISOString().slice(0, 10)) : null,
      mode: propre(b.mode, 40) || e.mode,
      reference: propre(b.reference, 80) || e.reference,
    }).eq("id", id);
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });

    const etat = await majFacture(e.facture_id);
    return NextResponse.json({
      ok: true,
      message: solde
        ? "Échéance réglée." + (etat && etat.statut === "reglee" ? " La facture est soldée." : "")
        : "Règlement partiel enregistré : " + total.toFixed(2) + " € sur " + Number(e.montant).toFixed(2) + " €.",
    });
  }

  // ---- CORRIGER UNE ECHEANCE ----
  if (action === "modifier") {
    const id = propre(b.id, 60);
    const champs: any = {};
    if (b.montant !== undefined) champs.montant = nombre(b.montant);
    if (b.due_le !== undefined) champs.due_le = dateOuNull(b.due_le);
    if (b.notes !== undefined) champs.notes = propre(b.notes, 500) || null;
    if (Object.keys(champs).length === 0) return NextResponse.json({ ok: false, erreur: "Rien à modifier." }, { status: 400 });

    const { data: e } = await supabase.from("organisme_echeances").select("facture_id").eq("id", id).eq("tenant_id", tenant).maybeSingle();
    if (!e) return NextResponse.json({ ok: false, erreur: "Échéance introuvable." }, { status: 404 });

    const { error } = await supabase.from("organisme_echeances").update(champs).eq("id", id).eq("tenant_id", tenant);
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    await majFacture(e.facture_id);
    return NextResponse.json({ ok: true, message: "Échéance modifiée." });
  }

  // ---- SUPPRIMER L ECHEANCIER ----
  //
  // ⚠️ ON REFUSE SI UN REGLEMENT EST DEJA POINTE : effacer l echeancier
  // effacerait la trace de ce qui a ete paye.
  if (action === "supprimer") {
    const factureId = propre(b.facture_id, 60);
    const { data: regles } = await supabase
      .from("organisme_echeances").select("id").eq("facture_id", factureId).eq("tenant_id", tenant).gt("montant_regle", 0).limit(1).maybeSingle();
    if (regles) return NextResponse.json({ ok: false, erreur: "Un règlement est déjà pointé : l'échéancier ne peut plus être supprimé." }, { status: 409 });

    const { error } = await supabase.from("organisme_echeances").delete().eq("facture_id", factureId).eq("tenant_id", tenant);
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    await majFacture(factureId);
    return NextResponse.json({ ok: true, message: "Échéancier supprimé." });
  }

  return NextResponse.json({ ok: false, erreur: "Action inconnue." }, { status: 400 });
}
