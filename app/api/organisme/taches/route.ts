import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { tenantDeSession, emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// LES TACHES — 14/09.
//
// CE QUE C EST : ce qu on doit faire, avec une date. La liste qu on ouvre
// le matin. Rien d automatique n ecrit ici : une tache est posee par
// quelqu un, pour quelqu un.
//
// 🚨 AUCUN ENVOI DANS GOOGLE AGENDA. Une tache n a ni heure ni duree ;
// l envoyer remplirait l agenda de blocs faux, et un client sans compte
// Google perdrait la moitie de l outil. Decision du 14/09.
//
// ⚠️ « EN RETARD » SE CALCULE SUR LE JOUR A PARIS, pas sur l heure du
// serveur : Vercel vit en UTC, et une tache due aujourd hui apparaitrait en
// retard des 2 h du matin heure francaise pendant l ete. Meme piege que les
// rappels de seance et les crons.
//
// ⚠️ TERMINER N EFFACE PAS. On pose fait_le ; la tache sort des listes
// actives mais reste lisible. Une tache faite qu on ne retrouve plus, c est
// une preuve de travail qui disparait.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const PRIORITES = ["basse", "normale", "haute"];

function propre(v: any, max: number): string {
  return String(v === null || v === undefined ? "" : v).trim().slice(0, max);
}

// Le jour a Paris, en AAAA-MM-JJ. C est la seule reference pour dire si
// une tache est en retard, due aujourd hui, ou a venir.
function jourParis(): string {
  const f = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
  });
  return f.format(new Date());
}

export async function GET(req: NextRequest) {
  const tenant = tenantDeSession();
  if (!tenant) return NextResponse.json({ ok: false, erreur: "Vous devez être connecté." }, { status: 401 });

  const url = new URL(req.url);
  const avecFaites = url.searchParams.get("faites") === "1";
  const fiche = propre(url.searchParams.get("fiche"), 60);
  const affaire = propre(url.searchParams.get("affaire"), 60);

  let q = supabase
    .from("crm_taches")
    .select("id, titre, details, echeance, priorite, fiche_id, fiche_email, affaire_id, assignee, fait_le, created_at")
    .eq("tenant_id", tenant)
    .order("echeance", { ascending: true, nullsFirst: false })
    .limit(2000);

  if (!avecFaites) q = q.is("fait_le", null);
  if (fiche) q = q.eq("fiche_id", fiche);
  if (affaire) q = q.eq("affaire_id", affaire);

  const { data, error } = await q;
  if (error) return NextResponse.json({ ok: false, erreur: "Lecture impossible." }, { status: 500 });

  const taches = data || [];
  const aujourdhui = jourParis();

  // Le nom du contact, pour ne pas lire « rappeler » sans savoir qui.
  const ids = taches.map(function (t: any) { return t.fiche_id; }).filter(Boolean);
  const noms: any = {};
  if (ids.length > 0) {
    const { data: fiches } = await supabase
      .from("crm").select("id, nom, organisme").eq("tenant_id", tenant).in("id", ids);
    for (const f of fiches || []) noms[f.id] = f.organisme || f.nom || "";
  }

  let retard = 0;
  let dujour = 0;
  for (const t of taches) {
    (t as any).contact = noms[(t as any).fiche_id] || (t as any).fiche_email || "";
    const e = (t as any).echeance;
    (t as any).en_retard = !!(e && !(t as any).fait_le && String(e) < aujourdhui);
    (t as any).aujourdhui = !!(e && !(t as any).fait_le && String(e) === aujourdhui);
    if ((t as any).en_retard) retard++;
    if ((t as any).aujourdhui) dujour++;
  }

  return NextResponse.json({
    ok: true, taches: taches,
    en_retard: retard, aujourdhui: dujour, jour: aujourdhui,
    priorites: PRIORITES,
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
    const titre = propre(b.titre, 300);
    if (titre.length < 2) return NextResponse.json({ ok: false, erreur: "Écrivez ce qu'il y a à faire." }, { status: 400 });

    const ligne: any = {
      tenant_id: tenant,
      titre: titre,
      details: propre(b.details, 2000) || null,
      echeance: propre(b.echeance, 10) || null,
      priorite: PRIORITES.indexOf(String(b.priorite || "")) >= 0 ? String(b.priorite) : "normale",
      assignee: propre(b.assignee, 200) || email || null,
      cree_par: email || null,
    };

    // Le rattachement : facultatif, mais s il est demande il doit etre vrai.
    // Une tache rattachee a une fiche qui n existe pas serait un lien mort
    // dans trois mois.
    const cle = propre(b.fiche_id, 120);
    if (cle) {
      const r = cle.indexOf("@") > 0
        ? await supabase.from("crm").select("id, email").eq("tenant_id", tenant).eq("email", cle.toLowerCase()).maybeSingle()
        : await supabase.from("crm").select("id, email").eq("tenant_id", tenant).eq("id", cle).maybeSingle();
      if (!r.data) return NextResponse.json({ ok: false, erreur: "Contact introuvable." }, { status: 404 });
      ligne.fiche_id = r.data.id;
      ligne.fiche_email = r.data.email || null;
    }

    const aff = propre(b.affaire_id, 60);
    if (aff) {
      const { data: a } = await supabase
        .from("crm_affaires").select("id").eq("id", aff).eq("tenant_id", tenant).maybeSingle();
      if (!a) return NextResponse.json({ ok: false, erreur: "Affaire introuvable." }, { status: 404 });
      ligne.affaire_id = a.id;
    }

    const { data, error } = await supabase.from("crm_taches").insert(ligne).select("id, titre, echeance").maybeSingle();
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, tache: data, message: "Tâche ajoutée." });
  }

  const id = propre(b.id, 60);
  if (!id) return NextResponse.json({ ok: false, erreur: "Tâche non précisée." }, { status: 400 });

  const { data: existante } = await supabase
    .from("crm_taches").select("id, titre, fait_le").eq("id", id).eq("tenant_id", tenant).maybeSingle();
  if (!existante) return NextResponse.json({ ok: false, erreur: "Tâche introuvable." }, { status: 404 });

  // ---- TERMINER / ROUVRIR ----
  //
  // 🚨 LE MEME BOUTON FAIT LES DEUX SENS. Cocher par erreur arrive dix fois
  // par jour ; s il fallait recreer la tache, personne ne cocherait plus.
  if (action === "terminer" || action === "rouvrir") {
    const fait = action === "terminer";
    const { error } = await supabase.from("crm_taches").update({
      fait_le: fait ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq("id", id).eq("tenant_id", tenant);
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: fait ? "Tâche faite." : "Tâche remise à faire." });
  }

  // ---- MODIFIER ----
  if (action === "modifier") {
    const maj: any = { updated_at: new Date().toISOString() };
    if (b.titre !== undefined) {
      const t = propre(b.titre, 300);
      if (t.length < 2) return NextResponse.json({ ok: false, erreur: "Le titre est trop court." }, { status: 400 });
      maj.titre = t;
    }
    if (b.details !== undefined) maj.details = propre(b.details, 2000) || null;
    if (b.echeance !== undefined) maj.echeance = propre(b.echeance, 10) || null;
    if (b.priorite !== undefined && PRIORITES.indexOf(String(b.priorite)) >= 0) maj.priorite = String(b.priorite);
    if (b.assignee !== undefined) maj.assignee = propre(b.assignee, 200) || null;

    const { error } = await supabase.from("crm_taches").update(maj).eq("id", id).eq("tenant_id", tenant);
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: "Tâche enregistrée." });
  }

  // ---- REPORTER ----
  //
  // ⚠️ ON REPORTE DEPUIS AUJOURD HUI, jamais depuis l ancienne echeance :
  // reporter d une semaine une tache en retard de trois mois la laisserait
  // en retard. Ce n est pas ce que veut dire « reporter ».
  if (action === "reporter") {
    const jours = Math.max(1, Math.min(365, Number(b.jours) || 1));
    const d = new Date(Date.now() + jours * 86400000);
    const nouvelle = new Intl.DateTimeFormat("fr-CA", {
      timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
    }).format(d);

    const { error } = await supabase.from("crm_taches").update({
      echeance: nouvelle, updated_at: new Date().toISOString(),
    }).eq("id", id).eq("tenant_id", tenant);
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: "Reportée au " + nouvelle.split("-").reverse().join("/") + "." });
  }

  // ---- SUPPRIMER ----
  //
  // Une tache n est ni une facture ni une preuve : une ligne posee par
  // erreur se retire. Mais SEULEMENT celle-ci, et dans ce tenant.
  if (action === "supprimer") {
    const { error } = await supabase.from("crm_taches").delete().eq("id", id).eq("tenant_id", tenant);
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: "Tâche supprimée." });
  }

  return NextResponse.json({ ok: false, erreur: "Action inconnue." }, { status: 400 });
}
