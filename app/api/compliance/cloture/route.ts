import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { barrage } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 120;

const ADMINS = ["contact@academiapro.fr"];

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

function refuse() {
  return NextResponse.json({ ok: false, erreur: "Réservé à l’administrateur." }, { status: 403 });
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Un montant et une date a la francaise, pour les messages.
function eurosFr(n: number): string {
  return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}
function dateFr(iso: string): string {
  const t = String(iso || "");
  return /^\d{4}-\d{2}-\d{2}/.test(t) ? t.slice(8, 10) + "/" + t.slice(5, 7) + "/" + t.slice(0, 4) : t;
}

async function etatCloture(societeId: string, debut: string, fin: string) {
  const { data: lignes } = await supabase
    .from("compta_ecritures")
    .select("compte_num, compte_lib, debit, credit")
    .eq("societe_id", societeId)
    .gte("ecriture_date", debut)
    .lte("ecriture_date", fin)
    .limit(50000);

  const comptes: any = {};
  let debitTotal = 0;
  let creditTotal = 0;

  for (const l of lignes || []) {
    const num = String(l.compte_num);
    if (!comptes[num]) comptes[num] = { numero: num, libelle: l.compte_lib, debit: 0, credit: 0 };
    comptes[num].debit = r2(comptes[num].debit + (Number(l.debit) || 0));
    comptes[num].credit = r2(comptes[num].credit + (Number(l.credit) || 0));
    debitTotal = r2(debitTotal + (Number(l.debit) || 0));
    creditTotal = r2(creditTotal + (Number(l.credit) || 0));
  }

  let produits = 0;
  let charges = 0;
  const bilan: any[] = [];
  const gestion: any[] = [];

  for (const num of Object.keys(comptes).sort()) {
    const c = comptes[num];
    const solde = r2(c.debit - c.credit);
    const classe = num.charAt(0);

    if (classe === "6") {
      charges = r2(charges + solde);
      gestion.push({ ...c, solde: solde });
    } else if (classe === "7") {
      produits = r2(produits - solde);
      gestion.push({ ...c, solde: solde });
    } else if (Math.abs(solde) > 0.005) {
      bilan.push({ ...c, solde: solde });
    }
  }

  return {
    comptes: comptes,
    bilan: bilan,
    gestion: gestion,
    produits: produits,
    charges: charges,
    resultat: r2(produits - charges),
    debit_total: debitTotal,
    credit_total: creditTotal,
    equilibre: Math.abs(r2(debitTotal - creditTotal)) < 0.01,
    nb_lignes: (lignes || []).length,
  };
}

export async function GET(req: NextRequest) {
  try {
    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non précisé." }, { status: 400 });
    }

    // 🆕 08/10 — LA PREPARATION DE LA CLOTURE S OUVRE A QUI A LE DROIT DE
    // CLOTURER CE DOSSIER. Jusqu ici, cet ecran n etait lisible que par le
    // compte de l administrateur : l associe d un cabinet client recevait
    // « reserve a l administrateur » et ne pouvait donc jamais cloturer,
    // alors que la cloture elle-meme (plus bas) lui etait deja permise par
    // le meme droit. Meme barrage pour voir et pour faire.
    const refusLecture = await barrage("cloturer", id);
    if (refusLecture) return refusLecture;

    const { data: dossier } = await supabase
      .from("compta_societes")
      .select("id, code, raison_sociale, exercice_debut, exercice_fin")
      .eq("id", id)
      .maybeSingle();

    if (!dossier) {
      return NextResponse.json({ ok: false, erreur: "Dossier introuvable." }, { status: 404 });
    }

    const debut = String(dossier.exercice_debut || "").slice(0, 10);
    const fin = String(dossier.exercice_fin || "").slice(0, 10);

    if (!debut || !fin) {
      return NextResponse.json(
        { ok: false, erreur: "Renseignez les dates d’exercice du dossier avant de clôturer." },
        { status: 400 }
      );
    }

    const etat = await etatCloture(id, debut, fin);

    const { data: banque } = await supabase
      .from("compta_releves")
      .select("id")
      .eq("societe_id", id)
      .is("ecriture_num", null)
      .eq("ignore", false)
      .limit(500);

    const { data: deja } = await supabase
      .from("compta_ecritures")
      .select("ecriture_num")
      .eq("societe_id", id)
      .eq("journal_code", "AN")
      .gte("ecriture_date", fin)
      .limit(1);

    const anomalies: string[] = [];
    if (!etat.equilibre) anomalies.push("La balance n’est pas équilibrée.");
    if ((banque || []).length > 0) {
      anomalies.push((banque || []).length > 1
        ? (banque || []).length + " lignes de relevé ne sont pas rapprochées."
        : "1 ligne de relevé n’est pas rapprochée.");
    }
    if ((deja || []).length > 0) {
      anomalies.push("Un report à-nouveaux existe déjà pour cet exercice.");
    }

    return NextResponse.json({
      ok: true,
      dossier: { code: dossier.code, raison_sociale: dossier.raison_sociale },
      exercice: { debut: debut, fin: fin },
      resultat: etat.resultat,
      produits: etat.produits,
      charges: etat.charges,
      equilibre: etat.equilibre,
      nb_lignes: etat.nb_lignes,
      comptes_bilan: etat.bilan.length,
      comptes_gestion: etat.gestion.length,
      deja_cloture: (deja || []).length > 0,
      anomalies: anomalies,
      cloturable: anomalies.length === 0,
      bilan: etat.bilan,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(function () { return null; });
    if (!b || !b.societe_id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non précisé." }, { status: 400 });
    }

    // LE BARRAGE : cloturer est le droit le plus lourd du logiciel.
    const refusDroit = await barrage("cloturer", String(b.societe_id));
    if (refusDroit) return refusDroit;

    const session = sessionCourante();
    const email = session ? session.email : "inconnu";

    const { data: dossier } = await supabase
      .from("compta_societes")
      .select("id, code, raison_sociale, exercice_debut, exercice_fin")
      .eq("id", b.societe_id)
      .maybeSingle();

    if (!dossier) {
      return NextResponse.json({ ok: false, erreur: "Dossier introuvable." }, { status: 404 });
    }

    const debut = String(dossier.exercice_debut || "").slice(0, 10);
    const fin = String(dossier.exercice_fin || "").slice(0, 10);

    if (!debut || !fin) {
      return NextResponse.json(
        { ok: false, erreur: "Renseignez les dates d’exercice avant de clôturer." },
        { status: 400 }
      );
    }

    const { data: deja } = await supabase
      .from("compta_ecritures")
      .select("ecriture_num")
      .eq("societe_id", b.societe_id)
      .eq("journal_code", "AN")
      .gte("ecriture_date", fin)
      .limit(1);

    if ((deja || []).length > 0) {
      return NextResponse.json(
        { ok: false, erreur: "Cet exercice a déjà été clôturé. Supprimez le report avant de recommencer." },
        { status: 409 }
      );
    }

    const etat = await etatCloture(b.societe_id, debut, fin);

    if (!etat.equilibre && b.forcer !== true) {
      return NextResponse.json(
        { ok: false, erreur: "La balance n’est pas équilibrée : corrigez avant de clôturer." },
        { status: 409 }
      );
    }

    const resultat = etat.resultat;
    const lendemain = new Date(new Date(fin).getTime() + 86400000).toISOString().slice(0, 10);

    const soldeGestion: any[] = [];
    for (const c of etat.gestion) {
      if (Math.abs(c.solde) < 0.005) continue;
      soldeGestion.push({
        societe_id: b.societe_id,
        journal_code: "OD",
        journal_lib: "Operations diverses",
        ecriture_num: "OD" + fin.slice(0, 4) + "-CLOTURE",
        ecriture_date: fin,
        // 🆕 08/10 — l ecriture de cloture porte sa reference, comme toute
        // ecriture passee par le logiciel.
        piece_ref: "CLOTURE-" + fin.slice(0, 4),
        piece_date: fin,
        compte_num: c.numero,
        compte_lib: c.libelle,
        ecriture_lib: "Solde de clôture " + fin.slice(0, 4),
        debit: c.solde < 0 ? r2(-c.solde) : 0,
        credit: c.solde > 0 ? c.solde : 0,
        devise: "EUR",
        valid_date: new Date().toISOString().slice(0, 10),
      });
    }

    if (soldeGestion.length > 0) {
      const compteResultat = resultat >= 0 ? "120000" : "129000";
      const libelleResultat = resultat >= 0
        ? "Résultat de l'exercice - bénéfice"
        : "Résultat de l'exercice - perte";

      soldeGestion.push({
        societe_id: b.societe_id,
        journal_code: "OD",
        journal_lib: "Operations diverses",
        ecriture_num: "OD" + fin.slice(0, 4) + "-CLOTURE",
        ecriture_date: fin,
        piece_ref: "CLOTURE-" + fin.slice(0, 4),
        piece_date: fin,
        compte_num: compteResultat,
        compte_lib: libelleResultat,
        ecriture_lib: "Résultat de l'exercice " + fin.slice(0, 4),
        debit: resultat < 0 ? r2(-resultat) : 0,
        credit: resultat > 0 ? resultat : 0,
        devise: "EUR",
        valid_date: new Date().toISOString().slice(0, 10),
      });

      const { error } = await supabase.from("compta_ecritures").insert(soldeGestion);
      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }
    }

    const anouveaux: any[] = [];
    let cumulAN = 0;

    for (const c of etat.bilan) {
      anouveaux.push({
        societe_id: b.societe_id,
        journal_code: "AN",
        journal_lib: "A nouveaux",
        ecriture_num: "AN" + lendemain.slice(0, 4) + "-0001",
        ecriture_date: lendemain,
        compte_num: c.numero,
        compte_lib: c.libelle,
        ecriture_lib: "Report à nouveau " + fin.slice(0, 4),
        debit: c.solde > 0 ? c.solde : 0,
        credit: c.solde < 0 ? r2(-c.solde) : 0,
        devise: "EUR",
        valid_date: new Date().toISOString().slice(0, 10),
      });
      cumulAN = r2(cumulAN + c.solde);
    }

    if (Math.abs(resultat) > 0.005) {
      anouveaux.push({
        societe_id: b.societe_id,
        journal_code: "AN",
        journal_lib: "A nouveaux",
        ecriture_num: "AN" + lendemain.slice(0, 4) + "-0001",
        ecriture_date: lendemain,
        compte_num: resultat >= 0 ? "110000" : "119000",
        compte_lib: resultat >= 0 ? "Report à nouveau créditeur" : "Report à nouveau débiteur",
        ecriture_lib: "Affectation du résultat " + fin.slice(0, 4),
        debit: resultat < 0 ? r2(-resultat) : 0,
        credit: resultat > 0 ? resultat : 0,
        devise: "EUR",
        valid_date: new Date().toISOString().slice(0, 10),
      });
      cumulAN = r2(cumulAN - resultat);
    }

    if (Math.abs(cumulAN) > 0.01 && b.forcer !== true) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Le report à-nouveaux ne serait pas équilibré : écart de " + eurosFr(cumulAN)
            + ". Aucune écriture n’a été passée.",
          ecart: cumulAN,
        },
        { status: 409 }
      );
    }

    if (anouveaux.length > 0) {
      const { error } = await supabase.from("compta_ecritures").insert(anouveaux);
      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }
    }

    // CLOTURER, C EST FERMER. Sans ce verrou, une ecriture passee apres coup
    // se logeait dans l exercice clos : le bilan cessait de tomber juste et
    // les a-nouveaux deja reportes ne correspondaient plus a rien. Les
    // a-nouveaux, dates du lendemain, restent libres — c est l exercice neuf.
    const { data: verrouillees } = await supabase
      .from("compta_ecritures")
      .update({ verrouille: true, verrouille_le: new Date().toISOString() })
      .eq("societe_id", b.societe_id)
      .gte("ecriture_date", debut)
      .lte("ecriture_date", fin)
      .select("id");

    const nbVerrouillees = (verrouillees || []).length;

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
    await supabase.from("compta_audit").insert({
      societe_id: b.societe_id,
      email: email,
      action: "verrouillage",
      cible: "exercice",
      reference: fin.slice(0, 4),
      avant: null,
      apres: { lignes: nbVerrouillees, motif: "Verrouillage automatique à la clôture" },
      adresse_ip: ip ? String(ip).split(",")[0].trim() : null,
    });

    return NextResponse.json({
      ok: true,
      resultat: resultat,
      lignes_solde: soldeGestion.length,
      lignes_anouveaux: anouveaux.length,
      lignes_verrouillees: nbVerrouillees,
      ouverture: lendemain,
      message: "Exercice " + fin.slice(0, 4) + " clôturé. Résultat de "
        + eurosFr(resultat) + ", " + anouveaux.length
        + (anouveaux.length > 1 ? " lignes reportées au " : " ligne reportée au ") + dateFr(lendemain)
        + ". L’exercice est verrouillé : "
        + nbVerrouillees + (nbVerrouillees > 1 ? " lignes ne se modifient plus." : " ligne ne se modifie plus."),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
