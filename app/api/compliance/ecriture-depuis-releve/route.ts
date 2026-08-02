import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { barrage, lecture } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

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

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

function mots(t: string): string[] {
  return String(t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(function (m) { return m.length >= 4; });
}

// APPRENTISSAGE : on cherche dans les ecritures deja passees un libelle qui
// ressemble a celui du releve, et on propose le compte alors utilise.
function proposer(libelle: string, historique: any[]): any {
  const ma = mots(libelle);
  if (ma.length === 0) return null;

  const scores: any = {};

  for (const h of historique) {
    const mb = mots(h.ecriture_lib);
    if (mb.length === 0) continue;
    let communs = 0;
    for (const m of ma) {
      if (mb.indexOf(m) >= 0) communs = communs + 1;
    }
    if (communs === 0) continue;
    const note = communs / ma.length;
    if (!scores[h.compte_num]) {
      scores[h.compte_num] = { compte: h.compte_num, libelle: h.compte_lib, note: 0, vues: 0 };
    }
    if (note > scores[h.compte_num].note) scores[h.compte_num].note = note;
    scores[h.compte_num].vues = scores[h.compte_num].vues + 1;
  }

  const classes = Object.keys(scores)
    .map(function (k) { return scores[k]; })
    .sort(function (a, b) { return b.note - a.note || b.vues - a.vues; });

  if (classes.length === 0) return null;
  return { ...classes[0], confiance: Math.round(classes[0].note * 100) };
}

export async function GET(req: NextRequest) {
  try {
    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

    const refus = await lecture(id);
    if (refus) return refus;

    const { data: releves } = await supabase
      .from("compta_releves")
      .select("*")
      .eq("societe_id", id)
      .is("ecriture_num", null)
      .eq("ignore", false)
      .order("operation_date", { ascending: true })
      .limit(500);

    // Historique : les ecritures deja passees sur ce dossier, hors comptes
    // de tresorerie qui sont toujours la contrepartie.
    const { data: passees } = await supabase
      .from("compta_ecritures")
      .select("compte_num, compte_lib, ecriture_lib")
      .eq("societe_id", id)
      .limit(20000);

    const historique = (passees || []).filter(function (h: any) {
      const c = String(h.compte_num || "");
      return c.charAt(0) !== "5";
    });

    const lignes = (releves || []).map(function (l: any) {
      return { ...l, proposition: proposer(l.libelle, historique) };
    });

    return NextResponse.json({
      ok: true,
      total: lignes.length,
      avec_proposition: lignes.filter(function (l: any) { return !!l.proposition; }).length,
      lignes: lignes,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(function () { return null; });
    if (!b || !b.releve_id || !b.compte) {
      return NextResponse.json(
        { ok: false, erreur: "Ligne de releve et compte de contrepartie sont necessaires." },
        { status: 400 }
      );
    }

    const { data: ligne } = await supabase
      .from("compta_releves")
      .select("*")
      .eq("id", b.releve_id)
      .maybeSingle();

    if (!ligne) {
      return NextResponse.json({ ok: false, erreur: "Ligne de releve introuvable." }, { status: 404 });
    }

    // LE BARRAGE : le dossier vient de la ligne, jamais du navigateur.
    const refusDroit = await barrage("saisir", ligne.societe_id);
    if (refusDroit) return refusDroit;

    const session = sessionCourante();

    if (ligne.ecriture_num) {
      return NextResponse.json(
        { ok: false, erreur: "Cette ligne est deja rapprochee a " + ligne.ecriture_num + "." },
        { status: 409 }
      );
    }

    const compte = String(b.compte).replace(/\D/g, "").slice(0, 12);

    // Le compte doit exister au plan : socle commun ou propre au dossier.
    const { data: propre } = await supabase
      .from("compta_comptes")
      .select("numero, libelle, taux_tva")
      .eq("numero", compte)
      .eq("societe_id", ligne.societe_id)
      .maybeSingle();

    let fiche: any = propre;

    if (!fiche) {
      const { data: commun } = await supabase
        .from("compta_comptes")
        .select("numero, libelle, taux_tva")
        .eq("numero", compte)
        .is("societe_id", null)
        .maybeSingle();
      fiche = commun;
    }

    if (!fiche) {
      return NextResponse.json(
        { ok: false, erreur: "Le compte " + compte + " ne figure pas au plan de ce dossier." },
        { status: 400 }
      );
    }

    const montant = r2(Number(ligne.montant) || 0);
    const entree = montant > 0;
    const absolu = Math.abs(montant);
    const date = String(ligne.operation_date).slice(0, 10);
    const annee = date.slice(0, 4);
    const journal = "BQ";

    // Numerotation sans trou, par journal et par annee.
    const prefixe = journal + annee + "-";
    const { data: dernieres } = await supabase
      .from("compta_ecritures")
      .select("ecriture_num")
      .eq("societe_id", ligne.societe_id)
      .like("ecriture_num", prefixe + "%")
      .order("ecriture_num", { ascending: false })
      .limit(1);

    let rang = 1;
    const derniere = (dernieres || [])[0];
    if (derniere && derniere.ecriture_num) {
      const n = parseInt(String(derniere.ecriture_num).split("-").pop() || "0", 10);
      if (!isNaN(n)) rang = n + 1;
    }
    const numero = prefixe + String(rang).padStart(4, "0");

    const libelle = String(b.libelle || ligne.libelle).slice(0, 200);
    const commun = {
      societe_id: ligne.societe_id,
      journal_code: journal,
      journal_lib: "Banque",
      ecriture_num: numero,
      ecriture_date: date,
      piece_ref: ligne.reference || null,
      piece_date: date,
      ecriture_lib: libelle,
      devise: "EUR",
      valid_date: new Date().toISOString().slice(0, 10),
      saisi_par: session ? session.email : null,
    };

    // TVA : si le compte porte un taux au plan, on ventile automatiquement.
    const taux = Number(fiche.taux_tva) || 0;
    const lignes: any[] = [];

    if (taux > 0 && !entree) {
      const ht = r2(absolu / (1 + taux / 100));
      const tva = r2(absolu - ht);

      lignes.push({ ...commun, compte_num: compte, compte_lib: fiche.libelle, debit: ht, credit: 0 });
      lignes.push({ ...commun, compte_num: "445660", compte_lib: "TVA deductible sur autres biens et services", debit: tva, credit: 0 });
      lignes.push({ ...commun, compte_num: ligne.compte_num, compte_lib: "Banque", debit: 0, credit: absolu });
    } else {
      lignes.push({
        ...commun,
        compte_num: compte,
        compte_lib: fiche.libelle,
        debit: entree ? 0 : absolu,
        credit: entree ? absolu : 0,
      });
      lignes.push({
        ...commun,
        compte_num: ligne.compte_num,
        compte_lib: "Banque",
        debit: entree ? absolu : 0,
        credit: entree ? 0 : absolu,
      });
    }

    const debit = r2(lignes.reduce(function (s: number, l: any) { return s + l.debit; }, 0));
    const credit = r2(lignes.reduce(function (s: number, l: any) { return s + l.credit; }, 0));

    if (Math.abs(r2(debit - credit)) > 0.005) {
      return NextResponse.json(
        { ok: false, erreur: "L ecriture generee ne tombe pas juste. Rien n a ete enregistre." },
        { status: 500 }
      );
    }

    const { error } = await supabase.from("compta_ecritures").insert(lignes);
    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // La ligne de releve est rapprochee dans la foulee : c est tout l interet.
    await supabase
      .from("compta_releves")
      .update({ ecriture_num: numero, rapproche_le: new Date().toISOString() })
      .eq("id", ligne.id);

    return NextResponse.json({
      ok: true,
      ecriture_num: numero,
      lignes: lignes.length,
      montant: absolu,
      tva: taux > 0 && !entree ? r2(absolu - r2(absolu / (1 + taux / 100))) : 0,
      message: "Ecriture " + numero + " creee et rapprochee, " + absolu.toFixed(2) + " EUR.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
