import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { tenantDeSession, emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// LES MANDATS ET LE REGISTRE — 14/09.
//
// CE QUE LA LOI IMPOSE, et que cette route fait respecter :
//   · Mandat ECRIT, sinon nul — et aucun honoraire du, meme si la vente se
//     fait (loi Hoguet art. 6).
//   · Inscription PAR ORDRE CHRONOLOGIQUE sur un registre numerote, sans
//     rature ni blanc (decret 72-678 art. 73). Le numero est reporte sur
//     l exemplaire du mandant.
//   · Mandat exclusif : irrevocabilite de TROIS MOIS MAXIMUM.
//   · Signe hors de l agence : retractation de 14 jours.
//
// 🚨 LE NUMERO EST ATTRIBUE ICI, ET NULLE PART AILLEURS. Il vaut le plus
// grand numero de l agence, plus un. La contrainte unique en base rattrape
// le cas ou deux mandats seraient crees dans la meme seconde : on retente
// une fois, et c est tout — mieux vaut un refus qu un doublon dans un
// registre controlable par la DGCCRF.
//
// 🚨 AUCUNE SUPPRESSION. Un mandat se resilie, expire ou se realise. Un
// trou dans la numerotation est exactement ce que cherche un controle.
//
// 🚨 L IRREVOCABILITE DE PLUS DE TROIS MOIS EST REFUSEE sur un exclusif.
// C est la seule chose que l outil interdit vraiment : partout ailleurs il
// signale, ici il empeche, parce que la clause serait attaquable et que
// l agence le decouvrirait devant le juge.
//
// ⚠️ LE PRIX ET LES HONORAIRES SONT FIGES A LA CREATION, repris du bien.
// Le bien peut baisser la semaine suivante ; le mandat signe, lui, dit ce
// qu il disait le jour de la signature.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const TYPES = ["simple", "exclusif", "semi_exclusif"];
const STATUTS = ["en_cours", "expire", "resilie", "realise"];
const CHARGE = ["acquereur", "vendeur"];

function propre(v: any, max: number): string {
  return String(v === null || v === undefined ? "" : v).trim().slice(0, max);
}

function nb(v: any): any {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  const x = Number(String(v).replace(",", "."));
  return isFinite(x) ? Math.round(x * 100) / 100 : null;
}

function jourParis(): string {
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

// Ajoute des mois a une date en AAAA-MM-JJ, sans passer par un fuseau.
// ⚠️ LE 31 JANVIER PLUS UN MOIS N EST PAS LE 31 FEVRIER : on retombe sur le
// dernier jour du mois, comme le fait un contrat.
function plusMois(depart: string, mois: number): string {
  const p = String(depart).split("-");
  const an = parseInt(p[0], 10);
  const m = parseInt(p[1], 10);
  const j = parseInt(p[2], 10);
  const total = (m - 1) + mois;
  const anCible = an + Math.floor(total / 12);
  const mCible = (total % 12 + 12) % 12;
  const dernier = new Date(Date.UTC(anCible, mCible + 1, 0)).getUTCDate();
  const jCible = Math.min(j, dernier);
  return anCible + "-" + String(mCible + 1).padStart(2, "0") + "-" + String(jCible).padStart(2, "0");
}

function plusJours(depart: string, jours: number): string {
  const d = new Date(String(depart) + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const tenant = tenantDeSession();
  if (!tenant) return NextResponse.json({ ok: false, erreur: "Vous devez être connecté." }, { status: 401 });

  const url = new URL(req.url);
  const bien = propre(url.searchParams.get("bien"), 60);
  const registre = url.searchParams.get("registre") === "1";

  // ---- LE REGISTRE ----
  //
  // Tout, dans l ordre des numeros, sans exception : c est ce qu on presente
  // a un controle. ⚠️ AUCUN FILTRE ICI, jamais : un registre filtre n est
  // plus un registre.
  let q = supabase
    .from("crm_mandats")
    .select("*")
    .eq("tenant_id", tenant)
    .order("numero", { ascending: registre })
    .limit(5000);

  if (bien) q = q.eq("bien_id", bien);
  if (!registre && !bien) q = q.order("numero", { ascending: false });

  const { data, error } = await q;
  if (error) return NextResponse.json({ ok: false, erreur: "Lecture impossible." }, { status: 500 });

  const mandats = data || [];
  const aujourdhui = jourParis();

  // Les biens et les mandants concernes, en deux requetes.
  const idsBiens = mandats.map(function (m: any) { return m.bien_id; }).filter(Boolean);
  const biens: any = {};
  if (idsBiens.length > 0) {
    const { data: bs } = await supabase
      .from("crm_biens").select("id, reference, type_bien, ville, adresse, surface_habitable")
      .eq("tenant_id", tenant).in("id", idsBiens);
    for (const b of bs || []) biens[b.id] = b;
  }

  const idsMandants = mandats.map(function (m: any) { return m.mandant_id; }).filter(Boolean);
  const mandants: any = {};
  if (idsMandants.length > 0) {
    const { data: fs } = await supabase
      .from("crm").select("id, nom, organisme, email, telephone")
      .eq("tenant_id", tenant).in("id", idsMandants);
    for (const f of fs || []) mandants[f.id] = f;
  }

  let enCours = 0;
  let bientot = 0;
  const limite = plusJours(aujourdhui, 30);

  for (const m of mandats) {
    const b = biens[(m as any).bien_id];
    (m as any).bien = b
      ? [b.type_bien, b.surface_habitable ? b.surface_habitable + " m²" : "", b.ville].filter(Boolean).join(" · ")
      : "";
    (m as any).bien_reference = b ? b.reference : null;

    const f = mandants[(m as any).mandant_id];
    (m as any).mandant = f ? (f.nom || f.organisme || f.email || "") : ((m as any).mandant_email || "");

    // ⚠️ L EXPIRATION SE CONSTATE, elle ne s ecrit pas en base : un mandat
    // qui depasse sa date est expire, meme si personne n a rien fait. Un
    // cron qui l ecrirait serait un point de panne de plus.
    const fini = !!((m as any).fin_le && String((m as any).fin_le) < aujourdhui);
    (m as any).expire = fini && (m as any).statut === "en_cours";
    (m as any).bientot_fini = !!(
      (m as any).statut === "en_cours" && (m as any).fin_le &&
      String((m as any).fin_le) >= aujourdhui && String((m as any).fin_le) <= limite
    );
    (m as any).retractable = !!(
      (m as any).retractation_jusqu_au && String((m as any).retractation_jusqu_au) >= aujourdhui
    );

    if ((m as any).statut === "en_cours" && !fini) enCours++;
    if ((m as any).bientot_fini) bientot++;
  }

  return NextResponse.json({
    ok: true, mandats: mandats,
    en_cours: enCours, bientot_finis: bientot, jour: aujourdhui,
    types: TYPES, statuts: STATUTS,
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
    const bienId = propre(b.bien_id, 60);
    if (!bienId) return NextResponse.json({ ok: false, erreur: "Un mandat porte sur un bien." }, { status: 400 });

    const { data: bien } = await supabase
      .from("crm_biens").select("*").eq("id", bienId).eq("tenant_id", tenant).maybeSingle();
    if (!bien) return NextResponse.json({ ok: false, erreur: "Bien introuvable." }, { status: 404 });

    const type = TYPES.indexOf(String(b.type_mandat || "")) >= 0 ? String(b.type_mandat) : "simple";
    const duree = Math.max(1, Math.min(60, parseInt(String(b.duree_mois || "3"), 10) || 3));
    let irrevocabilite = Math.max(0, Math.min(60, parseInt(String(b.irrevocabilite_mois || "0"), 10) || 0));

    // 🚨 LE SEUL VRAI REFUS DE L OUTIL. Au-dela de trois mois, la clause
    // d irrevocabilite d un mandat exclusif est attaquable : on ne la laisse
    // pas ecrire, et on dit pourquoi.
    if (type === "exclusif" && irrevocabilite > 3) {
      return NextResponse.json({
        ok: false,
        erreur: "L'irrévocabilité d'un mandat exclusif ne peut pas dépasser trois mois.",
      }, { status: 400 });
    }
    if (irrevocabilite > duree) {
      return NextResponse.json({
        ok: false,
        erreur: "L'irrévocabilité ne peut pas être plus longue que le mandat lui-même.",
      }, { status: 400 });
    }

    const signeLe = propre(b.signe_le, 10) || jourParis();
    const finLe = plusMois(signeLe, duree);
    const horsEtab = b.hors_etablissement === true;

    const mandantCle = propre(b.mandant_id, 120) || String(bien.proprietaire_id || "");
    let mandantId: any = null;
    let mandantEmail: any = null;
    if (mandantCle) {
      const r = mandantCle.indexOf("@") > 0
        ? await supabase.from("crm").select("id, email").eq("tenant_id", tenant).eq("email", mandantCle.toLowerCase()).maybeSingle()
        : await supabase.from("crm").select("id, email").eq("tenant_id", tenant).eq("id", mandantCle).maybeSingle();
      if (r.data) { mandantId = r.data.id; mandantEmail = r.data.email || null; }
    }
    if (!mandantId) {
      // ⚠️ UN REFUS DOIT DIRE OU ALLER. « Renseignez le proprietaire » laissait
      // chercher : le champ est sur la fiche du bien, pas ici. Defaut releve
      // par Jacques a l essai du 14/09.
      return NextResponse.json({
        ok: false,
        erreur: "Ce bien n'a pas de propriétaire. Ouvrez-le dans votre portefeuille et rattachez-lui un contact du CRM, ou repartez de la fiche du contact avec « Ajouter un bien ».",
        aller_a: "/organisme/biens",
      }, { status: 400 });
    }

    const charge = CHARGE.indexOf(String(b.honoraires_charge || "")) >= 0
      ? String(b.honoraires_charge)
      : String(bien.honoraires_charge || "acquereur");

    const ligne: any = {
      tenant_id: tenant,
      bien_id: bienId,
      mandant_id: mandantId,
      mandant_email: mandantEmail,
      type_mandat: type,
      signe_le: signeLe,
      duree_mois: duree,
      irrevocabilite_mois: irrevocabilite,
      fin_le: finLe,
      hors_etablissement: horsEtab,
      retractation_jusqu_au: horsEtab ? plusJours(signeLe, 14) : null,
      prix_mandat: nb(b.prix_mandat) !== null ? nb(b.prix_mandat) : bien.prix,
      honoraires_taux: nb(b.honoraires_taux) !== null ? nb(b.honoraires_taux) : bien.honoraires_taux,
      honoraires_montant: nb(b.honoraires_montant) !== null ? nb(b.honoraires_montant) : bien.honoraires_montant,
      honoraires_charge: charge,
      statut: "en_cours",
      notes: propre(b.notes, 2000) || null,
      cree_par: email || null,
    };

    // Le numero : le plus grand de l agence, plus un. Deux essais, pas plus.
    for (let essai = 0; essai < 2; essai++) {
      const { data: dernier } = await supabase
        .from("crm_mandats").select("numero").eq("tenant_id", tenant)
        .order("numero", { ascending: false }).limit(1).maybeSingle();

      ligne.numero = ((dernier && dernier.numero) || 0) + 1 + essai;

      const { data, error } = await supabase.from("crm_mandats").insert(ligne).select("*").maybeSingle();
      if (!error) {
        return NextResponse.json({
          ok: true, mandat: data,
          message: "Mandat n° " + ligne.numero + " inscrit au registre.",
        });
      }
      if (String(error.message).indexOf("idx_crm_mandats_numero") < 0) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      ok: false,
      erreur: "Deux mandats ont été créés en même temps. Réessayez dans un instant.",
    }, { status: 409 });
  }

  const id = propre(b.id, 60);
  if (!id) return NextResponse.json({ ok: false, erreur: "Mandat non précisé." }, { status: 400 });

  const { data: existant } = await supabase
    .from("crm_mandats").select("*").eq("id", id).eq("tenant_id", tenant).maybeSingle();
  if (!existant) return NextResponse.json({ ok: false, erreur: "Mandat introuvable." }, { status: 404 });

  // ---- MODIFIER ----
  //
  // ⚠️ NI LE NUMERO NI LE BIEN NE SE MODIFIENT. Le premier est le registre,
  // le second est l objet du contrat : changer l un ou l autre reviendrait a
  // reecrire un mandat deja inscrit.
  if (action === "modifier") {
    const maj: any = { updated_at: new Date().toISOString() };

    if (b.notes !== undefined) maj.notes = propre(b.notes, 2000) || null;
    if (b.signature_reference !== undefined) maj.signature_reference = propre(b.signature_reference, 60) || null;

    if (b.type_mandat !== undefined || b.duree_mois !== undefined || b.irrevocabilite_mois !== undefined || b.signe_le !== undefined) {
      const type = TYPES.indexOf(String(b.type_mandat || existant.type_mandat)) >= 0
        ? String(b.type_mandat || existant.type_mandat) : "simple";
      const duree = Math.max(1, Math.min(60, parseInt(String(b.duree_mois !== undefined ? b.duree_mois : existant.duree_mois), 10) || 3));
      const irr = Math.max(0, Math.min(60, parseInt(String(b.irrevocabilite_mois !== undefined ? b.irrevocabilite_mois : existant.irrevocabilite_mois), 10) || 0));

      if (type === "exclusif" && irr > 3) {
        return NextResponse.json({
          ok: false,
          erreur: "L'irrévocabilité d'un mandat exclusif ne peut pas dépasser trois mois.",
        }, { status: 400 });
      }
      if (irr > duree) {
        return NextResponse.json({ ok: false, erreur: "L'irrévocabilité ne peut pas être plus longue que le mandat lui-même." }, { status: 400 });
      }

      const signeLe = propre(b.signe_le, 10) || existant.signe_le || jourParis();
      maj.type_mandat = type;
      maj.duree_mois = duree;
      maj.irrevocabilite_mois = irr;
      maj.signe_le = signeLe;
      maj.fin_le = plusMois(signeLe, duree);

      if (b.hors_etablissement !== undefined) {
        maj.hors_etablissement = b.hors_etablissement === true;
        maj.retractation_jusqu_au = b.hors_etablissement === true ? plusJours(signeLe, 14) : null;
      } else if (existant.hors_etablissement) {
        maj.retractation_jusqu_au = plusJours(signeLe, 14);
      }
    }

    if (b.prix_mandat !== undefined) maj.prix_mandat = nb(b.prix_mandat);
    if (b.honoraires_taux !== undefined) maj.honoraires_taux = nb(b.honoraires_taux);
    if (b.honoraires_montant !== undefined) maj.honoraires_montant = nb(b.honoraires_montant);
    if (b.honoraires_charge !== undefined && CHARGE.indexOf(String(b.honoraires_charge)) >= 0) {
      maj.honoraires_charge = String(b.honoraires_charge);
    }

    const { error } = await supabase.from("crm_mandats").update(maj).eq("id", id).eq("tenant_id", tenant);
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: "Mandat n° " + existant.numero + " enregistré." });
  }

  // ---- CHANGER LE STATUT ----
  if (action === "statut") {
    const statut = String(b.statut || "");
    if (STATUTS.indexOf(statut) < 0) return NextResponse.json({ ok: false, erreur: "Statut inconnu." }, { status: 400 });

    const maj: any = { statut: statut, updated_at: new Date().toISOString() };

    if (statut === "resilie") {
      maj.resilie_le = propre(b.resilie_le, 10) || jourParis();
      maj.motif_resiliation = propre(b.motif_resiliation, 300) || null;
    } else {
      maj.resilie_le = null;
      maj.motif_resiliation = null;
    }

    const { error } = await supabase.from("crm_mandats").update(maj).eq("id", id).eq("tenant_id", tenant);
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });

    const dit: any = {
      en_cours: "Mandat n° " + existant.numero + " remis en cours.",
      expire: "Mandat n° " + existant.numero + " arrivé à échéance.",
      resilie: "Mandat n° " + existant.numero + " résilié.",
      realise: "Mandat n° " + existant.numero + " réalisé — la vente est faite.",
    };
    return NextResponse.json({ ok: true, message: dit[statut] });
  }

  return NextResponse.json({ ok: false, erreur: "Action inconnue." }, { status: 400 });
}
