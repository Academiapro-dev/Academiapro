import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";
import { barrage, lecture } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];
const MAX_LIGNES = 2000;

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

function decouper(ligne: string): string[] {
  let sep = ";";
  if (ligne.indexOf("\t") >= 0) sep = "\t";
  else if (ligne.indexOf(";") < 0 && ligne.indexOf(",") >= 0) sep = ",";
  return ligne.split(sep).map(function (c) { return c.replace(/^"|"$/g, "").trim(); });
}

// Accepte 12/03/2026, 12-03-2026 et 2026-03-12.
function dateFr(v: string): string | null {
  const t = String(v || "").trim();
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[1] + "-" + m[2] + "-" + m[3];
  m = t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (!m) return null;
  const jour = m[1].padStart(2, "0");
  const mois = m[2].padStart(2, "0");
  let annee = m[3];
  if (annee.length === 2) annee = "20" + annee;
  return annee + "-" + mois + "-" + jour;
}

// Accepte 1 234,56 / 1234.56 / (1234,56) pour un negatif.
function montant(v: string): number | null {
  let t = String(v || "").trim();
  if (!t) return null;
  let negatif = false;
  if (t.startsWith("(") && t.endsWith(")")) { negatif = true; t = t.slice(1, -1); }
  if (t.startsWith("-")) { negatif = true; t = t.slice(1); }
  t = t.replace(/[\s\u00a0EUR€]/gi, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  const n = Number(t);
  if (isNaN(n)) return null;
  return negatif ? -n : n;
}

export async function GET(req: NextRequest) {
  try {
    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

    // Un releve montre toute la vie d un client : meme cloisonnement.
    const refus = await lecture(id);
    if (refus) return refus;

    const { data, error } = await supabase
      .from("compta_releves")
      .select("*")
      .eq("societe_id", id)
      .order("operation_date", { ascending: false })
      .limit(2000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const lignes = data || [];
    const rapprochees = lignes.filter(function (l: any) { return !!l.ecriture_num; }).length;
    const ignorees = lignes.filter(function (l: any) { return l.ignore; }).length;

    return NextResponse.json({
      ok: true,
      total: lignes.length,
      rapprochees: rapprochees,
      a_traiter: lignes.length - rapprochees - ignorees,
      ignorees: ignorees,
      lignes: lignes,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(function () { return null; });
    if (!b || !b.societe_id || !b.contenu) {
      return NextResponse.json(
        { ok: false, erreur: "Dossier et contenu sont necessaires." },
        { status: 400 }
      );
    }

    const refusDroit = await barrage("saisir", String(b.societe_id));
    if (refusDroit) return refusDroit;

    const compte = String(b.compte || "512000").replace(/\D/g, "").slice(0, 12) || "512000";

    const brutes = String(b.contenu)
      .split(/\r?\n/)
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l.length > 0; });

    if (brutes.length === 0) {
      return NextResponse.json({ ok: false, erreur: "Releve vide." }, { status: 400 });
    }
    if (brutes.length > MAX_LIGNES) {
      return NextResponse.json(
        { ok: false, erreur: "Limite de " + MAX_LIGNES + " lignes par import." },
        { status: 400 }
      );
    }

    const lignes: any[] = [];
    const rejets: any[] = [];

    for (let i = 0; i < brutes.length; i = i + 1) {
      const champs = decouper(brutes[i]);
      const date = dateFr(champs[0]);

      if (!date) {
        // Ligne d en-tete ou ligne de total : on la passe sans la compter.
        if (i === 0 || /solde|total|report/i.test(brutes[i])) continue;
        rejets.push({ ligne: i + 1, valeur: brutes[i].slice(0, 70), motif: "date illisible" });
        continue;
      }

      const libelle = String(champs[1] || "").trim();
      if (!libelle) {
        rejets.push({ ligne: i + 1, valeur: brutes[i].slice(0, 70), motif: "libelle absent" });
        continue;
      }

      // Soit une colonne de montant signe, soit deux colonnes debit et credit.
      let m = montant(champs[2]);
      const debit = montant(champs[2]);
      const credit = montant(champs[3]);

      if (debit !== null && credit !== null && (debit > 0 || credit > 0)) {
        m = credit > 0 ? credit : -Math.abs(debit);
      }

      if (m === null || m === 0) {
        rejets.push({ ligne: i + 1, valeur: brutes[i].slice(0, 70), motif: "montant illisible" });
        continue;
      }

      const empreinte = crypto
        .createHash("sha256")
        .update(date + "|" + libelle.toLowerCase() + "|" + m.toFixed(2))
        .digest("hex")
        .slice(0, 32);

      lignes.push({
        societe_id: b.societe_id,
        compte_num: compte,
        operation_date: date,
        valeur_date: dateFr(champs[4]) || date,
        libelle: libelle.slice(0, 300),
        reference: champs[5] ? String(champs[5]).slice(0, 80) : null,
        montant: m,
        solde: montant(champs[6]),
        empreinte: empreinte,
      });
    }

    if (lignes.length === 0) {
      return NextResponse.json(
        { ok: false, erreur: "Aucune ligne exploitable.", rejets: rejets },
        { status: 400 }
      );
    }

    // Les lignes deja importees sont ecartees par la contrainte d unicite :
    // reimporter deux fois le meme releve ne double jamais la tresorerie.
    const { data, error } = await supabase
      .from("compta_releves")
      .upsert(lignes, { onConflict: "societe_id,empreinte", ignoreDuplicates: true })
      .select("id");

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const ajoutees = (data || []).length;

    return NextResponse.json({
      ok: true,
      lues: lignes.length,
      ajoutees: ajoutees,
      deja_presentes: lignes.length - ajoutees,
      rejetees: rejets.length,
      rejets: rejets.slice(0, 40),
      message: ajoutees + " ligne(s) ajoutee(s)"
        + (lignes.length - ajoutees > 0 ? ", " + (lignes.length - ajoutees) + " deja presente(s)" : "")
        + (rejets.length > 0 ? ", " + rejets.length + " ecartee(s)" : "") + ".",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
