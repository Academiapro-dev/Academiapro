import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../../lib/session";
import { lecture } from "../../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

// ══════════════════════════════════════════════════════════════════════════
// LE DOSSIER DE REVISION — 09/09 (Mr Comptable).
//
// CE QUI EXISTAIT : /api/compliance/revision calcule onze controles de
// coherence a chaque ouverture (balance, comptes d attente, caisse, TVA,
// lettrage, banque, dotations, pieces, plan, cloture). Il est INCHANGE.
//
// CE QUI MANQUAIT : rien n etait conserve. Personne ne pouvait cocher
// « verifie », expliquer un ecart, designer un responsable. C est ce que
// MyUnisoft, Pennylane et Cegid Loop appellent le dossier de revision, et
// c est ce qu un expert lit avant de signer : les DILIGENCES par cycle et
// leur avancement, et les POINTS EN SUSPENS — le reste a faire.
//
// DEUX TABLES, une ligne par dossier et par exercice (exercice = date de
// fin, telle que compta_societes.exercice_fin au moment de l ouverture) :
//   compta_revision_diligences : cycle, diligence, statut a_faire / en_cours
//     / fait / sans_objet, responsable, commentaire, fait_le.
//   compta_revision_points : compte, libelle, montant, statut ouvert /
//     regle, commentaire, regle_le.
//
// A LA PREMIERE OUVERTURE d un exercice, la liste standard ci-dessous est
// creee. Le cabinet la complete (ajout libre) ; il ne supprime pas, il
// marque « sans objet ». Un dossier de revision qui perd des lignes ne
// prouve plus rien.
//
// 🚨 LE BARRAGE est celui de la revision (lecture(societe_id)) : qui peut
// lire les faiblesses d un dossier peut noter ce qu il en a fait. Chaque
// changement de statut est trace dans compta_audit.
// ══════════════════════════════════════════════════════════════════════════

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

const STATUTS_DILIGENCE = ["a_faire", "en_cours", "fait", "sans_objet"];
const STATUTS_POINT = ["ouvert", "regle"];

// LA LISTE STANDARD. L ordre est celui du dossier de travail classique.
// ⚠️ Si une diligence est ajoutee ici, elle n apparait que sur les
// exercices ouverts APRES : les existants gardent leur liste.
const CYCLES: Array<{ code: string; nom: string; diligences: string[] }> = [
  { code: "tresorerie", nom: "Trésorerie", diligences: [
    "Rapprochement bancaire à la date de clôture, écarts expliqués",
    "Caisse : solde non créditeur, PV de caisse",
    "Emprunts : capital restant dû rapproché des tableaux d'amortissement",
    "Chèques et virements non débités à la clôture identifiés",
  ]},
  { code: "achats", nom: "Achats et fournisseurs", diligences: [
    "Comptes fournisseurs lettrés, soldes justifiés par les factures",
    "Factures non parvenues (FNP) comptabilisées",
    "Charges constatées d'avance (CCA) calculées",
    "Cut-off : dernières factures de l'exercice / premières du suivant",
    "Avoirs à recevoir identifiés",
  ]},
  { code: "ventes", nom: "Ventes et clients", diligences: [
    "Comptes clients lettrés, soldes justifiés",
    "Factures à établir (FAE) comptabilisées",
    "Produits constatés d'avance (PCA) calculés",
    "Créances douteuses identifiées et dépréciées",
    "Cut-off ventes vérifié",
  ]},
  { code: "immobilisations", nom: "Immobilisations", diligences: [
    "Tableau des immobilisations rapproché du grand livre",
    "Acquisitions de l'exercice justifiées par les factures",
    "Cessions et mises au rebut comptabilisées",
    "Dotations aux amortissements passées et vérifiées",
  ]},
  { code: "stocks", nom: "Stocks", diligences: [
    "Inventaire physique obtenu et valorisé",
    "Variation de stock comptabilisée",
    "Dépréciation des stocks appréciée",
  ]},
  { code: "social", nom: "Social", diligences: [
    "Charges de personnel rapprochées des DSN de l'exercice",
    "Provision pour congés payés calculée",
    "Dettes sociales à la clôture justifiées (URSSAF, retraite, prévoyance)",
    "Primes et gratifications à payer provisionnées",
  ]},
  { code: "fiscal", nom: "Fiscal et TVA", diligences: [
    "Chiffre d'affaires comptable rapproché des CA3 de l'exercice",
    "TVA à décaisser / crédit de TVA justifié à la clôture",
    "TVA sur FNP, FAE et débits vérifiée",
    "CFE, CVAE, taxes sur les salaires comptabilisées",
    "Impôt sur les sociétés calculé et provisionné",
  ]},
  { code: "capitaux", nom: "Capitaux propres et provisions", diligences: [
    "Affectation du résultat de l'exercice précédent passée (PV d'AG)",
    "Capital et comptes courants d'associés rapprochés des pièces",
    "Provisions pour risques et charges revues",
    "Engagements hors bilan recensés",
  ]},
  { code: "synthese", nom: "Synthèse", diligences: [
    "Contrôles automatiques de révision passés sans anomalie bloquante",
    "Revue analytique : variations significatives expliquées",
    "Événements postérieurs à la clôture examinés",
    "Note de synthèse rédigée pour l'expert signataire",
  ]},
];

function texte(v: any, max: number): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return t ? t.slice(0, max) : null;
}

async function dossierEtExercice(societeId: string) {
  const { data: dossier } = await supabase
    .from("compta_societes")
    .select("id, code, raison_sociale, exercice_debut, exercice_fin")
    .eq("id", societeId)
    .maybeSingle();
  if (!dossier) return null;
  const fin = String(dossier.exercice_fin || "").slice(0, 10);
  return { dossier, exercice: fin || null };
}

async function tracer(societeId: string, email: string, action: string, cible: string, reference: string, avant: any, apres: any, req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
    await supabase.from("compta_audit").insert({
      societe_id: societeId, email, action, cible, reference, avant, apres,
      adresse_ip: ip ? String(ip).split(",")[0].trim() : null,
    });
  } catch (e) {}
}

export async function GET(req: NextRequest) {
  try {
    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    if (!id) return NextResponse.json({ ok: false, erreur: "Dossier non précisé." }, { status: 400 });

    const refus = await lecture(id);
    if (refus) return refus;

    const de = await dossierEtExercice(id);
    if (!de) return NextResponse.json({ ok: false, erreur: "Dossier introuvable." }, { status: 404 });
    if (!de.exercice) {
      return NextResponse.json({ ok: false, erreur: "Renseignez la date de fin d'exercice du dossier avant d'ouvrir la révision." }, { status: 400 });
    }
    const exercice = de.exercice;

    let { data: diligences } = await supabase
      .from("compta_revision_diligences")
      .select("*")
      .eq("societe_id", id)
      .eq("exercice", exercice)
      .order("ordre", { ascending: true })
      .limit(500);

    // Premiere ouverture de l exercice : la liste standard est creee.
    if (!diligences || diligences.length === 0) {
      const lignes: any[] = [];
      let ordre = 0;
      for (const c of CYCLES) {
        for (const dg of c.diligences) {
          ordre += 1;
          lignes.push({ societe_id: id, exercice, cycle: c.code, ordre, diligence: dg, statut: "a_faire" });
        }
      }
      const { error } = await supabase.from("compta_revision_diligences").insert(lignes);
      if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      const rel = await supabase
        .from("compta_revision_diligences").select("*").eq("societe_id", id).eq("exercice", exercice).order("ordre", { ascending: true }).limit(500);
      diligences = rel.data || [];
    }

    const { data: points } = await supabase
      .from("compta_revision_points")
      .select("*")
      .eq("societe_id", id)
      .eq("exercice", exercice)
      .order("created_at", { ascending: false })
      .limit(500);

    const parCycle = CYCLES.map(function (c) {
      const liste = (diligences || []).filter(function (d: any) { return d.cycle === c.code; });
      const faites = liste.filter(function (d: any) { return d.statut === "fait" || d.statut === "sans_objet"; }).length;
      return { code: c.code, nom: c.nom, total: liste.length, faites, diligences: liste };
    }).filter(function (c) { return c.total > 0; });

    const ouverts = (points || []).filter(function (p: any) { return p.statut === "ouvert"; });
    const totalDiligences = (diligences || []).length;
    const totalFaites = (diligences || []).filter(function (d: any) { return d.statut === "fait" || d.statut === "sans_objet"; }).length;

    return NextResponse.json({
      ok: true,
      dossier: { code: de.dossier.code, raison_sociale: de.dossier.raison_sociale },
      exercice,
      avancement: { faites: totalFaites, total: totalDiligences, pourcent: totalDiligences > 0 ? Math.round((totalFaites / totalDiligences) * 100) : 0 },
      reste_a_faire: totalDiligences - totalFaites,
      points_ouverts: ouverts.length,
      montant_ouvert: Math.round(ouverts.reduce(function (s: number, p: any) { return s + (Number(p.montant) || 0); }, 0) * 100) / 100,
      cycles: parCycle,
      points: points || [],
      statuts_diligence: STATUTS_DILIGENCE,
      statuts_point: STATUTS_POINT,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// POST : ajouter une diligence libre, ou un point en suspens.
export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(function () { return null; });
    if (!b || !b.societe_id) return NextResponse.json({ ok: false, erreur: "Dossier non précisé." }, { status: 400 });
    const id = String(b.societe_id);

    const refus = await lecture(id);
    if (refus) return refus;
    const session = sessionCourante();
    const email = session ? session.email : "inconnu";

    const de = await dossierEtExercice(id);
    if (!de || !de.exercice) return NextResponse.json({ ok: false, erreur: "Dossier ou exercice introuvable." }, { status: 404 });
    const exercice = de.exercice;

    if (b.type === "point") {
      const libelle = texte(b.libelle, 300);
      if (!libelle) return NextResponse.json({ ok: false, erreur: "Décrivez le point en suspens." }, { status: 400 });
      const montant = b.montant === undefined || b.montant === null || b.montant === "" ? null : Number(b.montant);
      if (montant !== null && isNaN(montant)) return NextResponse.json({ ok: false, erreur: "Montant illisible." }, { status: 400 });
      const { data, error } = await supabase.from("compta_revision_points").insert({
        societe_id: id, exercice, compte_num: texte(b.compte_num, 20), libelle, montant,
        statut: "ouvert", commentaire: texte(b.commentaire, 2000), cree_par: email,
      }).select("id").maybeSingle();
      if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      await tracer(id, email, "revision_point", "point", data ? String(data.id) : "", null, { libelle, montant }, req);
      return NextResponse.json({ ok: true, id: data ? data.id : null });
    }

    const cycle = String(b.cycle || "").trim();
    const diligence = texte(b.diligence, 300);
    if (!CYCLES.some(function (c) { return c.code === cycle; }) || !diligence) {
      return NextResponse.json({ ok: false, erreur: "Cycle ou diligence manquant." }, { status: 400 });
    }
    const { data: dernier } = await supabase
      .from("compta_revision_diligences").select("ordre").eq("societe_id", id).eq("exercice", exercice).order("ordre", { ascending: false }).limit(1).maybeSingle();
    const { data, error } = await supabase.from("compta_revision_diligences").insert({
      societe_id: id, exercice, cycle, ordre: ((dernier && dernier.ordre) || 0) + 1, diligence, statut: "a_faire", responsable: texte(b.responsable, 200),
    }).select("id").maybeSingle();
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data ? data.id : null });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// PATCH : statut, responsable, commentaire d une diligence ; ou statut et
// commentaire d un point.
export async function PATCH(req: NextRequest) {
  try {
    const b = await req.json().catch(function () { return null; });
    if (!b || !b.societe_id || !b.id) return NextResponse.json({ ok: false, erreur: "Identifiant manquant." }, { status: 400 });
    const id = String(b.societe_id);

    const refus = await lecture(id);
    if (refus) return refus;
    const session = sessionCourante();
    const email = session ? session.email : "inconnu";

    const table = b.type === "point" ? "compta_revision_points" : "compta_revision_diligences";
    const statutsValides = b.type === "point" ? STATUTS_POINT : STATUTS_DILIGENCE;

    const { data: avant } = await supabase.from(table).select("*").eq("id", b.id).eq("societe_id", id).maybeSingle();
    if (!avant) return NextResponse.json({ ok: false, erreur: "Ligne introuvable." }, { status: 404 });

    const modifications: any = {};
    if (b.statut !== undefined) {
      const s = String(b.statut || "").trim();
      if (statutsValides.indexOf(s) < 0) return NextResponse.json({ ok: false, erreur: "Statut inconnu." }, { status: 400 });
      modifications.statut = s;
      if (b.type === "point") modifications.regle_le = s === "regle" ? new Date().toISOString() : null;
      else {
        modifications.fait_le = s === "fait" || s === "sans_objet" ? new Date().toISOString() : null;
        modifications.fait_par = s === "fait" || s === "sans_objet" ? email : null;
      }
    }
    if (b.commentaire !== undefined) modifications.commentaire = texte(b.commentaire, 2000);
    if (b.type !== "point" && b.responsable !== undefined) modifications.responsable = texte(b.responsable, 200);

    if (Object.keys(modifications).length === 0) return NextResponse.json({ ok: false, erreur: "Rien à modifier." }, { status: 400 });

    const { error } = await supabase.from(table).update(modifications).eq("id", b.id).eq("societe_id", id);
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });

    if (modifications.statut) {
      await tracer(id, email, b.type === "point" ? "revision_point" : "revision_diligence", b.type === "point" ? "point" : "diligence",
        String(b.id), { statut: avant.statut }, { statut: modifications.statut }, req);
    }
    return NextResponse.json({ ok: true, modifie: b.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
