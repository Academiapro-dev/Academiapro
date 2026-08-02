import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { barrage, lecture } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 90;

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

async function tracer(req: NextRequest, societeId: string, email: string, action: string, cible: string, reference: string, avant: any, apres: any) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
  await supabase.from("compta_audit").insert({
    societe_id: societeId,
    email: email,
    action: action,
    cible: cible,
    reference: reference,
    avant: avant || null,
    apres: apres || null,
    adresse_ip: ip ? String(ip).split(",")[0].trim() : null,
  });
}

export async function GET(req: NextRequest) {
  try {
    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

    // LECTURE : consulter les exercices et la piste d audit d un dossier confie
    // n exige aucun droit particulier, seulement l acces a ce dossier.
    const refus = await lecture(id);
    if (refus) return refus;

    const { data: lignes } = await supabase
      .from("compta_ecritures")
      .select("ecriture_date, verrouille, ecriture_num")
      .eq("societe_id", id)
      .limit(50000);

    const exercices: any = {};
    for (const l of lignes || []) {
      const a = String(l.ecriture_date || "").slice(0, 4);
      if (!a) continue;
      if (!exercices[a]) exercices[a] = { annee: a, total: 0, verrouillees: 0 };
      exercices[a].total = exercices[a].total + 1;
      if (l.verrouille) exercices[a].verrouillees = exercices[a].verrouillees + 1;
    }

    const liste = Object.keys(exercices).sort().reverse().map(function (a) {
      const e = exercices[a];
      return {
        ...e,
        verrouille: e.total > 0 && e.verrouillees === e.total,
        partiel: e.verrouillees > 0 && e.verrouillees < e.total,
      };
    });

    const { data: audit } = await supabase
      .from("compta_audit")
      .select("*")
      .eq("societe_id", id)
      .order("created_at", { ascending: false })
      .limit(300);

    return NextResponse.json({
      ok: true,
      exercices: liste,
      audit: audit || [],
      total_audit: (audit || []).length,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(function () { return null; });
    if (!b || !b.societe_id) {
      return NextResponse.json({ ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

    // LE BARRAGE : verrouiller, liberer ou contrepasser touche des ecritures
    // arretees. C est le meme droit que la cloture.
    const refusDroit = await barrage("cloturer", String(b.societe_id));
    if (refusDroit) return refusDroit;

    const session = sessionCourante();
    const email = session ? session.email : "inconnu";

    // Le motif est ce qui distingue une correction assumee d une comptabilite
    // refaite apres coup. Il s exige ICI, et pas seulement dans l ecran : une
    // protection posee dans le navigateur ne protege de rien.
    const motif = String(b.motif || "").trim().slice(0, 300);

    if (b.action === "verrouiller" || b.action === "deverrouiller") {
      const annee = String(b.annee || "").slice(0, 4);
      if (!/^\d{4}$/.test(annee)) {
        return NextResponse.json({ ok: false, erreur: "Annee invalide." }, { status: 400 });
      }

      const verrou = b.action === "verrouiller";

      if (!verrou && motif.length < 3) {
        return NextResponse.json(
          { ok: false, erreur: "Le motif du deverrouillage est obligatoire : il sera consigne dans la piste d audit." },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("compta_ecritures")
        .update({
          verrouille: verrou,
          verrouille_le: verrou ? new Date().toISOString() : null,
        })
        .eq("societe_id", b.societe_id)
        .gte("ecriture_date", annee + "-01-01")
        .lte("ecriture_date", annee + "-12-31")
        .select("id");

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      const nb = (data || []).length;

      await tracer(
        req, b.societe_id, email,
        verrou ? "verrouillage" : "deverrouillage",
        "exercice", annee,
        null, { lignes: nb, motif: motif || null }
      );

      return NextResponse.json({
        ok: true,
        lignes: nb,
        message: nb + " ligne(s) d ecriture de " + annee + (verrou ? " verrouillees." : " deverrouillees."),
      });
    }

    if (b.action === "contrepasser") {
      const numero = String(b.ecriture_num || "").trim();
      if (!numero) {
        return NextResponse.json({ ok: false, erreur: "Ecriture non precisee." }, { status: 400 });
      }

      if (motif.length < 3) {
        return NextResponse.json(
          { ok: false, erreur: "Le motif de la contrepassation est obligatoire : il sera consigne dans la piste d audit." },
          { status: 400 }
        );
      }

      const { data: originales } = await supabase
        .from("compta_ecritures")
        .select("*")
        .eq("societe_id", b.societe_id)
        .eq("ecriture_num", numero)
        .limit(200);

      const lignes = originales || [];
      if (lignes.length === 0) {
        return NextResponse.json({ ok: false, erreur: "Ecriture introuvable." }, { status: 404 });
      }

      const { data: deja } = await supabase
        .from("compta_ecritures")
        .select("ecriture_num")
        .eq("societe_id", b.societe_id)
        .eq("piece_ref", "CONTREPASSATION " + numero)
        .limit(1);

      if ((deja || []).length > 0) {
        return NextResponse.json(
          { ok: false, erreur: "L ecriture " + numero + " a deja ete contrepassee." },
          { status: 409 }
        );
      }

      const date = String(b.date || new Date().toISOString().slice(0, 10)).slice(0, 10);
      const annee = date.slice(0, 4);
      const prefixe = "OD" + annee + "-CP";

      const { data: dernieres } = await supabase
        .from("compta_ecritures")
        .select("ecriture_num")
        .eq("societe_id", b.societe_id)
        .like("ecriture_num", prefixe + "%")
        .order("ecriture_num", { ascending: false })
        .limit(1);

      let rang = 1;
      const derniere = (dernieres || [])[0];
      if (derniere && derniere.ecriture_num) {
        const n = parseInt(String(derniere.ecriture_num).replace(prefixe, ""), 10);
        if (!isNaN(n)) rang = n + 1;
      }
      const nouveau = prefixe + String(rang).padStart(3, "0");

      // LE MIROIR EXACT : chaque debit devient credit et inversement.
      // L originale n est jamais touchee, c est tout le principe.
      const miroir = lignes.map(function (l: any) {
        return {
          societe_id: l.societe_id,
          journal_code: "OD",
          journal_lib: "Operations diverses",
          ecriture_num: nouveau,
          ecriture_date: date,
          compte_num: l.compte_num,
          compte_lib: l.compte_lib,
          comp_aux_num: l.comp_aux_num,
          comp_aux_lib: l.comp_aux_lib,
          piece_ref: "CONTREPASSATION " + numero,
          piece_date: date,
          ecriture_lib: "Contrepassation de " + numero + " - " + motif.slice(0, 120),
          debit: r2(Number(l.credit) || 0),
          credit: r2(Number(l.debit) || 0),
          devise: l.devise || "EUR",
          valid_date: new Date().toISOString().slice(0, 10),
          saisi_par: email,
        };
      });

      const debit = r2(miroir.reduce(function (s: number, l: any) { return s + l.debit; }, 0));
      const credit = r2(miroir.reduce(function (s: number, l: any) { return s + l.credit; }, 0));

      if (Math.abs(r2(debit - credit)) > 0.005) {
        return NextResponse.json(
          { ok: false, erreur: "L ecriture d origine n est pas equilibree : contrepassation refusee." },
          { status: 409 }
        );
      }

      const { error } = await supabase.from("compta_ecritures").insert(miroir);
      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      await tracer(
        req, b.societe_id, email, "contrepassation",
        "ecriture", numero,
        { ecriture_num: numero, lignes: lignes.length, debit: debit },
        { ecriture_num: nouveau, motif: motif }
      );

      return NextResponse.json({
        ok: true,
        ecriture_num: nouveau,
        lignes: miroir.length,
        message: "Ecriture " + numero + " contrepassee par " + nouveau
          + ". L originale reste intacte au journal.",
      });
    }

    return NextResponse.json({ ok: false, erreur: "Action inconnue." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
