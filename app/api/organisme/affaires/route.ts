import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { tenantDeSession, emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// LES AFFAIRES — 14/09.
//
// CE QUE C EST : une opportunite chiffree rattachee a un contact. Elle
// avance par etapes — qualification, proposition, negociation — et finit
// gagnee ou perdue. C est elle qui repond a « combien ai-je en cours ? ».
//
// 🚨 LE MONTANT NE SE SAISIT JAMAIS. Il se calcule a partir des lignes, a
// chaque fois qu elles changent, par recalculer(). Aucune action de cette
// route n accepte un montant venu de l ecran : si l ecran en envoyait un,
// il serait ignore. C est la doctrine — on ne fait pas taper a la main ce
// que l application sait calculer.
//
// 🚨 GAGNER UNE AFFAIRE FAIT PASSER LA FICHE EN CLIENT. Sinon le client
// devrait le refaire a la main juste apres, et l etape commerciale de la
// fiche mentirait. Une fiche deja cliente n est pas retouchee.
//
// ⚠️ LA FICHE SE DESIGNE PAR SON ID. Beaucoup de fiches venues de LinkedIn
// n ont pas d adresse : chercher par email en ferait disparaitre la
// moitie. Meme lecon que les documents de metier.
//
// ⚠️ ON NE SUPPRIME PAS UNE AFFAIRE. Une affaire qui n aboutit pas se
// perd, avec son motif : c est ce qui permet de compter les pertes et d en
// tirer quelque chose. La suppression effacerait justement ce qu on veut
// savoir.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const ETAPES = ["qualification", "proposition", "negociation", "gagnee", "perdue"];
const FERMEES = ["gagnee", "perdue"];

function propre(v: any, max: number): string {
  return String(v === null || v === undefined ? "" : v).trim().slice(0, max);
}

function sou(n: any): number {
  const x = Number(n);
  return isFinite(x) ? Math.round(x * 100) / 100 : 0;
}

// Les lignes, nettoyees. ⚠️ UN PRIX NEGATIF EST PERMIS — c est une remise,
// et une remise se lit mieux en ligne que fondue dans un prix. Une
// quantite negative, elle, n a aucun sens : elle est ramenee a zero.
function lignesPropres(brut: any): any[] {
  if (!Array.isArray(brut)) return [];
  const sortie: any[] = [];
  let rang = 1;
  for (const l of brut) {
    const designation = propre(l && l.designation, 300);
    if (!designation) continue;
    sortie.push({
      rang: rang++,
      designation: designation,
      quantite: Math.max(0, sou(l && l.quantite !== undefined ? l.quantite : 1)),
      prix_unitaire: sou(l && l.prix_unitaire),
      tva_taux: Math.max(0, Math.min(100, sou(l && l.tva_taux !== undefined ? l.tva_taux : 20))),
    });
    if (sortie.length >= 200) break;
  }
  return sortie;
}

// Le coeur : relire les lignes en base et reecrire les trois montants de
// l affaire. Appelee apres CHAQUE ecriture de lignes, jamais ailleurs.
async function recalculer(affaireId: string, tenant: string): Promise<any> {
  const { data: lignes } = await supabase
    .from("crm_affaires_lignes")
    .select("quantite, prix_unitaire, tva_taux")
    .eq("affaire_id", affaireId)
    .eq("tenant_id", tenant);

  let ht = 0;
  let tva = 0;
  for (const l of lignes || []) {
    const ligneHt = (Number(l.quantite) || 0) * (Number(l.prix_unitaire) || 0);
    ht += ligneHt;
    tva += ligneHt * ((Number(l.tva_taux) || 0) / 100);
  }
  ht = sou(ht);
  tva = sou(tva);
  const ttc = sou(ht + tva);

  await supabase.from("crm_affaires").update({
    montant_ht: ht, montant_tva: tva, montant_ttc: ttc,
    updated_at: new Date().toISOString(),
  }).eq("id", affaireId).eq("tenant_id", tenant);

  return { montant_ht: ht, montant_tva: tva, montant_ttc: ttc, lignes: (lignes || []).length };
}

export async function GET(req: NextRequest) {
  const tenant = tenantDeSession();
  if (!tenant) return NextResponse.json({ ok: false, erreur: "Vous devez être connecté." }, { status: 401 });

  const url = new URL(req.url);

  // ---- UNE AFFAIRE ET SES LIGNES ----
  const une = propre(url.searchParams.get("affaire"), 60);
  if (une) {
    const { data: a } = await supabase
      .from("crm_affaires").select("*").eq("id", une).eq("tenant_id", tenant).maybeSingle();
    if (!a) return NextResponse.json({ ok: false, erreur: "Affaire introuvable." }, { status: 404 });

    const { data: lignes } = await supabase
      .from("crm_affaires_lignes")
      .select("id, rang, designation, quantite, prix_unitaire, tva_taux")
      .eq("affaire_id", une).eq("tenant_id", tenant)
      .order("rang", { ascending: true });

    return NextResponse.json({ ok: true, affaire: a, lignes: lignes || [], etapes: ETAPES });
  }

  // ---- LE PIPELINE ----
  //
  // ⚠️ LES AFFAIRES FERMEES NE SONT PAS MELANGEES AUX AUTRES par defaut :
  // une colonne « gagnee » qui grossit toute l annee finit par cacher ce
  // qui est en cours. ?fermees=1 les ramene.
  const avecFermees = url.searchParams.get("fermees") === "1";

  let q = supabase
    .from("crm_affaires")
    .select("id, fiche_id, fiche_email, titre, etape, montant_ht, montant_ttc, devise, probabilite, cloture_prevue_le, ferme_le, motif_perte, updated_at")
    .eq("tenant_id", tenant)
    .order("cloture_prevue_le", { ascending: true, nullsFirst: false })
    .limit(2000);

  if (!avecFermees) q = q.not("etape", "in", "(gagnee,perdue)");

  const { data, error } = await q;
  if (error) return NextResponse.json({ ok: false, erreur: "Lecture impossible." }, { status: 500 });

  const affaires = data || [];

  // Le nom du contact, pour ne pas afficher une affaire sans savoir chez
  // qui elle est. Une seule requete pour toutes les fiches concernees.
  const ids = affaires.map(function (a: any) { return a.fiche_id; }).filter(Boolean);
  const noms: any = {};
  if (ids.length > 0) {
    const { data: fiches } = await supabase
      .from("crm").select("id, nom, organisme").eq("tenant_id", tenant).in("id", ids);
    for (const f of fiches || []) noms[f.id] = f.organisme || f.nom || "";
  }
  for (const a of affaires) (a as any).contact = noms[(a as any).fiche_id] || (a as any).fiche_email || "";

  // Les totaux par etape : c est ce qu on regarde en haut de colonne.
  const totaux: any = {};
  for (const e of ETAPES) totaux[e] = { nombre: 0, montant_ht: 0 };
  for (const a of affaires) {
    const e = String((a as any).etape || "");
    if (!totaux[e]) totaux[e] = { nombre: 0, montant_ht: 0 };
    totaux[e].nombre++;
    totaux[e].montant_ht = sou(totaux[e].montant_ht + (Number((a as any).montant_ht) || 0));
  }

  // Le previsionnel : la somme des affaires ouvertes ponderee par leur
  // probabilite. ⚠️ C EST UNE ESTIMATION, l ecran doit le dire.
  let pondere = 0;
  for (const a of affaires) {
    if (FERMEES.indexOf(String((a as any).etape)) >= 0) continue;
    pondere += (Number((a as any).montant_ht) || 0) * ((Number((a as any).probabilite) || 0) / 100);
  }

  return NextResponse.json({
    ok: true, affaires: affaires, totaux: totaux,
    previsionnel_ht: sou(pondere), etapes: ETAPES,
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
    const titre = propre(b.titre, 200);
    if (titre.length < 2) return NextResponse.json({ ok: false, erreur: "Donnez un titre à l'affaire." }, { status: 400 });

    const cle = propre(b.fiche_id, 120);
    if (!cle) return NextResponse.json({ ok: false, erreur: "Une affaire se rattache à un contact." }, { status: 400 });

    const r = cle.indexOf("@") > 0
      ? await supabase.from("crm").select("id, nom, email").eq("tenant_id", tenant).eq("email", cle.toLowerCase()).maybeSingle()
      : await supabase.from("crm").select("id, nom, email").eq("tenant_id", tenant).eq("id", cle).maybeSingle();
    const f = r.data;
    if (!f) return NextResponse.json({ ok: false, erreur: "Contact introuvable." }, { status: 404 });

    const etape = ETAPES.indexOf(String(b.etape || "")) >= 0 ? String(b.etape) : "qualification";

    const { data: a, error } = await supabase.from("crm_affaires").insert({
      tenant_id: tenant,
      fiche_id: f.id, fiche_email: f.email || null,
      titre: titre,
      description: propre(b.description, 2000) || null,
      etape: etape,
      probabilite: Math.max(0, Math.min(100, Number(b.probabilite) || 50)),
      cloture_prevue_le: propre(b.cloture_prevue_le, 10) || null,
      cree_par: email || null,
    }).select("*").maybeSingle();

    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });

    // Des lignes peuvent arriver des la creation : on les pose, puis on
    // recalcule. Une affaire sans ligne reste valable — elle vaut zero
    // tant qu on n a rien chiffre, et c est honnete.
    const lignes = lignesPropres(b.lignes);
    if (lignes.length > 0 && a) {
      await supabase.from("crm_affaires_lignes").insert(
        lignes.map(function (l: any) { return { ...l, affaire_id: a.id, tenant_id: tenant }; })
      );
    }
    const m = a ? await recalculer(a.id, tenant) : null;

    return NextResponse.json({ ok: true, affaire: a, montants: m, message: "Affaire créée." });
  }

  const id = propre(b.id, 60);
  if (!id) return NextResponse.json({ ok: false, erreur: "Affaire non précisée." }, { status: 400 });

  const { data: existante } = await supabase
    .from("crm_affaires").select("id, etape, fiche_id, titre").eq("id", id).eq("tenant_id", tenant).maybeSingle();
  if (!existante) return NextResponse.json({ ok: false, erreur: "Affaire introuvable." }, { status: 404 });

  // ---- MODIFIER ----
  if (action === "modifier") {
    const maj: any = { updated_at: new Date().toISOString() };
    if (b.titre !== undefined) {
      const t = propre(b.titre, 200);
      if (t.length < 2) return NextResponse.json({ ok: false, erreur: "Le titre est trop court." }, { status: 400 });
      maj.titre = t;
    }
    if (b.description !== undefined) maj.description = propre(b.description, 2000) || null;
    if (b.probabilite !== undefined) maj.probabilite = Math.max(0, Math.min(100, Number(b.probabilite) || 0));
    if (b.cloture_prevue_le !== undefined) maj.cloture_prevue_le = propre(b.cloture_prevue_le, 10) || null;

    const { error } = await supabase.from("crm_affaires").update(maj).eq("id", id).eq("tenant_id", tenant);
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: "Affaire enregistrée." });
  }

  // ---- LES LIGNES ----
  //
  // 🚨 ON REMPLACE TOUT LE JEU DE LIGNES. Modifier ligne par ligne
  // obligerait a suivre des identifiants a l ecran, et la moindre erreur
  // fausserait le total. On efface, on repose, on recalcule : le montant
  // est toujours celui des lignes affichees.
  if (action === "lignes") {
    const lignes = lignesPropres(b.lignes);

    await supabase.from("crm_affaires_lignes").delete().eq("affaire_id", id).eq("tenant_id", tenant);

    if (lignes.length > 0) {
      const { error } = await supabase.from("crm_affaires_lignes").insert(
        lignes.map(function (l: any) { return { ...l, affaire_id: id, tenant_id: tenant }; })
      );
      if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const m = await recalculer(id, tenant);
    return NextResponse.json({
      ok: true, montants: m,
      message: lignes.length === 0
        ? "Lignes effacées — l'affaire vaut 0 €."
        : lignes.length + " ligne(s) — " + m.montant_ht.toFixed(2).replace(".", ",") + " € HT.",
    });
  }

  // ---- DEPLACER D ETAPE ----
  if (action === "etape") {
    const etape = String(b.etape || "");
    if (ETAPES.indexOf(etape) < 0) return NextResponse.json({ ok: false, erreur: "Étape inconnue." }, { status: 400 });

    const maj: any = { etape: etape, updated_at: new Date().toISOString() };

    if (etape === "gagnee") {
      maj.ferme_le = new Date().toISOString();
      maj.probabilite = 100;
      maj.motif_perte = null;
    } else if (etape === "perdue") {
      maj.ferme_le = new Date().toISOString();
      maj.probabilite = 0;
      maj.motif_perte = propre(b.motif_perte, 300) || null;
    } else {
      // Rouvrir une affaire fermee : on efface la fermeture, sinon elle
      // resterait datee d un jour ou elle etait close.
      maj.ferme_le = null;
      maj.motif_perte = null;
    }

    const { error } = await supabase.from("crm_affaires").update(maj).eq("id", id).eq("tenant_id", tenant);
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });

    // 🚨 L AFFAIRE GAGNEE FAIT LE CLIENT. On ne retouche pas une fiche deja
    // cliente, et on ne redescend jamais une fiche : perdre une affaire ne
    // fait pas perdre le contact, il peut en rester d autres.
    let ficheDite = "";
    if (etape === "gagnee" && existante.fiche_id) {
      const { data: f } = await supabase
        .from("crm").select("id, statut").eq("id", existante.fiche_id).eq("tenant_id", tenant).maybeSingle();
      if (f && f.statut !== "client") {
        await supabase.from("crm").update({
          statut: "client", derniere_interaction: new Date().toISOString(),
        }).eq("id", f.id).eq("tenant_id", tenant);
        ficheDite = " Le contact passe en client.";
      }
    }

    const dit: any = {
      qualification: "Affaire remise en qualification.",
      proposition: "Affaire en proposition.",
      negociation: "Affaire en négociation.",
      gagnee: "Affaire gagnée." + ficheDite,
      perdue: "Affaire perdue.",
    };
    return NextResponse.json({ ok: true, message: dit[etape] });
  }

  return NextResponse.json({ ok: false, erreur: "Action inconnue." }, { status: 400 });
}
