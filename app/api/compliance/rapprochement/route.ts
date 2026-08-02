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
const JOURS_TOLERANCE = 10;

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

// Ressemblance grossiere mais suffisante : la part des mots du releve que
// l on retrouve dans le libelle de l ecriture.
function ressemblance(a: string, b: string): number {
  const ma = mots(a);
  const mb = mots(b);
  if (ma.length === 0 || mb.length === 0) return 0;
  let communs = 0;
  for (const m of ma) {
    if (mb.indexOf(m) >= 0) communs = communs + 1;
  }
  return communs / ma.length;
}

export async function GET(req: NextRequest) {
  try {
    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

    const refus = await lecture(id);
    if (refus) return refus;

    const compte = (req.nextUrl.searchParams.get("compte") || "512000").replace(/\D/g, "");

    const { data: releves } = await supabase
      .from("compta_releves")
      .select("*")
      .eq("societe_id", id)
      .eq("compte_num", compte)
      .is("ecriture_num", null)
      .eq("ignore", false)
      .order("operation_date", { ascending: true })
      .limit(1000);

    const { data: ecritures } = await supabase
      .from("compta_ecritures")
      .select("ecriture_num, ecriture_date, ecriture_lib, piece_ref, debit, credit")
      .eq("societe_id", id)
      .eq("compte_num", compte)
      .limit(5000);

    // Les ecritures deja rapprochees ne doivent pas etre proposees deux fois.
    const { data: prises } = await supabase
      .from("compta_releves")
      .select("ecriture_num")
      .eq("societe_id", id)
      .not("ecriture_num", "is", null)
      .limit(5000);

    const dejaPrises: any = {};
    for (const p of prises || []) dejaPrises[p.ecriture_num] = true;

    const libres = (ecritures || []).filter(function (e: any) {
      return !dejaPrises[e.ecriture_num];
    });

    const propositions = (releves || []).map(function (l: any) {
      const m = r2(Number(l.montant) || 0);
      const dateReleve = new Date(l.operation_date).getTime();

      const candidats = libres
        .map(function (e: any) {
          // Une entree en banque est un debit du compte 512 ; une sortie un credit.
          const mouvement = r2((Number(e.debit) || 0) - (Number(e.credit) || 0));
          if (Math.abs(mouvement - m) > 0.005) return null;

          const jours = Math.abs(
            Math.round((new Date(e.ecriture_date).getTime() - dateReleve) / 86400000)
          );
          if (jours > JOURS_TOLERANCE) return null;

          const proximite = 1 - jours / (JOURS_TOLERANCE + 1);
          const texte = ressemblance(l.libelle, (e.ecriture_lib || "") + " " + (e.piece_ref || ""));
          const note = Math.round((0.55 + proximite * 0.2 + texte * 0.25) * 100);

          return {
            ecriture_num: e.ecriture_num,
            date: e.ecriture_date,
            libelle: e.ecriture_lib,
            piece: e.piece_ref,
            montant: mouvement,
            ecart_jours: jours,
            note: note,
          };
        })
        .filter(function (c: any) { return c !== null; })
        .sort(function (a: any, b: any) { return b.note - a.note; })
        .slice(0, 4);

      return {
        id: l.id,
        operation_date: l.operation_date,
        libelle: l.libelle,
        montant: m,
        candidats: candidats,
        certaine: candidats.length === 1 && candidats[0].note >= 80,
      };
    });

    const sansCandidat = propositions.filter(function (p: any) {
      return p.candidats.length === 0;
    }).length;

    return NextResponse.json({
      ok: true,
      compte: compte,
      a_traiter: propositions.length,
      certaines: propositions.filter(function (p: any) { return p.certaine; }).length,
      sans_candidat: sansCandidat,
      ecritures_libres: libres.length,
      propositions: propositions,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(function () { return null; });
    if (!b || !b.id) {
      return NextResponse.json({ ok: false, erreur: "Ligne non precisee." }, { status: 400 });
    }

    const { data: ligne } = await supabase
      .from("compta_releves")
      .select("id, societe_id")
      .eq("id", b.id)
      .maybeSingle();

    if (!ligne) {
      return NextResponse.json({ ok: false, erreur: "Ligne introuvable." }, { status: 404 });
    }

    // LE BARRAGE : rapprocher, annuler ou ecarter engagent tous la banque.
    const refusDroit = await barrage("valider", ligne.societe_id);
    if (refusDroit) return refusDroit;

    if (b.action === "ignorer") {
      const { error } = await supabase
        .from("compta_releves")
        .update({ ignore: true, ecriture_num: null, rapproche_le: null })
        .eq("id", b.id);

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, message: "Ligne ecartee du rapprochement." });
    }

    if (b.action === "annuler") {
      const { error } = await supabase
        .from("compta_releves")
        .update({ ecriture_num: null, rapproche_le: null, ignore: false })
        .eq("id", b.id);

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, message: "Rapprochement annule." });
    }

    const ecriture = String(b.ecriture_num || "").trim();
    if (!ecriture) {
      return NextResponse.json({ ok: false, erreur: "Ecriture non precisee." }, { status: 400 });
    }

    // Une ecriture ne se rapproche qu une fois : sinon deux lignes de releve
    // pointeraient le meme mouvement, et la banque ne tomberait plus juste.
    const { data: deja } = await supabase
      .from("compta_releves")
      .select("id")
      .eq("ecriture_num", ecriture)
      .neq("id", b.id)
      .limit(1)
      .maybeSingle();

    if (deja) {
      return NextResponse.json(
        { ok: false, erreur: "L ecriture " + ecriture + " est deja rapprochee a une autre ligne." },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from("compta_releves")
      .update({
        ecriture_num: ecriture,
        rapproche_le: new Date().toISOString(),
        ignore: false,
      })
      .eq("id", b.id);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Rapproche avec " + ecriture + "." });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
