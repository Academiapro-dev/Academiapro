import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];

const REGIMES_FISCAUX: any = {
  is: "Impot sur les societes",
  ir: "Impot sur le revenu",
  transparent: "Societe transparente",
  micro: "Micro-entreprise",
  a_determiner: "A determiner",
};

const REGIMES_TVA: any = {
  reel_normal: "Reel normal - CA3 mensuelle",
  reel_simplifie: "Reel simplifie - CA12 annuelle",
  franchise: "Franchise en base",
  non_assujetti: "Non assujetti",
};

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
  return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
}

function propre(v: any, max: number): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).replace(/[\u0000-\u001F\u007F]/g, "").trim();
  return t ? t.slice(0, max) : null;
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const { data: societes, error } = await supabase
      .from("compta_societes")
      .select("*")
      .order("raison_sociale", { ascending: true })
      .limit(500);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // Pour chaque dossier : son volume d ecritures, son equilibre et sa
    // derniere date. C est ce qui dit d un coup d oeil si un dossier est tenu.
    const { data: ecritures } = await supabase
      .from("compta_ecritures")
      .select("societe_id, debit, credit, ecriture_date")
      .limit(50000);

    const parSociete: any = {};
    let orphelines = 0;

    for (const e of ecritures || []) {
      if (!e.societe_id) {
        orphelines = orphelines + 1;
        continue;
      }
      if (!parSociete[e.societe_id]) {
        parSociete[e.societe_id] = { lignes: 0, debit: 0, credit: 0, derniere: null };
      }
      const p = parSociete[e.societe_id];
      p.lignes = p.lignes + 1;
      p.debit = p.debit + (Number(e.debit) || 0);
      p.credit = p.credit + (Number(e.credit) || 0);
      const t = e.ecriture_date ? new Date(e.ecriture_date).getTime() : 0;
      if (t && (!p.derniere || t > p.derniere)) p.derniere = t;
    }

    const liste = (societes || []).map(function (s: any) {
      const p = parSociete[s.id] || { lignes: 0, debit: 0, credit: 0, derniere: null };
      const debit = Math.round(p.debit * 100) / 100;
      const credit = Math.round(p.credit * 100) / 100;
      return {
        ...s,
        regime_fiscal_nom: REGIMES_FISCAUX[s.regime_fiscal] || s.regime_fiscal,
        regime_tva_nom: REGIMES_TVA[s.regime_tva] || s.regime_tva,
        lignes: p.lignes,
        debit: debit,
        credit: credit,
        equilibre: Math.abs(debit - credit) < 0.01,
        derniere_ecriture: p.derniere ? new Date(p.derniere).toISOString() : null,
      };
    });

    return NextResponse.json({
      ok: true,
      regimes_fiscaux: REGIMES_FISCAUX,
      regimes_tva: REGIMES_TVA,
      total: liste.length,
      actifs: liste.filter(function (s: any) { return s.actif; }).length,
      desequilibres: liste.filter(function (s: any) { return s.lignes > 0 && !s.equilibre; }).length,
      ecritures_orphelines: orphelines,
      societes: liste,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    const raison = propre(b.raison_sociale, 200);
    if (!raison || raison.length < 2) {
      return NextResponse.json(
        { ok: false, erreur: "La raison sociale est obligatoire." },
        { status: 400 }
      );
    }

    // Le code sert de prefixe aux numeros d ecriture : il doit rester court,
    // stable et sans caractere qui gênerait un export FEC.
    let code = propre(b.code, 12) || raison;
    code = code
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 12);

    if (code.length < 2) {
      return NextResponse.json(
        { ok: false, erreur: "Le code du dossier doit comporter au moins deux caracteres." },
        { status: 400 }
      );
    }

    const siren = b.siren ? String(b.siren).replace(/\D/g, "").slice(0, 9) : null;
    if (siren && siren.length !== 9) {
      return NextResponse.json(
        { ok: false, erreur: "Le SIREN comporte neuf chiffres." },
        { status: 400 }
      );
    }

    const regimeFiscal = REGIMES_FISCAUX[String(b.regime_fiscal || "")]
      ? String(b.regime_fiscal)
      : "a_determiner";
    const regimeTva = REGIMES_TVA[String(b.regime_tva || "")]
      ? String(b.regime_tva)
      : "reel_normal";

    const fiche: any = {
      raison_sociale: raison,
      siren: siren,
      forme: propre(b.forme, 80),
      regime_fiscal: regimeFiscal,
      regime_tva: regimeTva,
      devise: propre(b.devise, 3) || "EUR",
      exercice_debut: b.exercice_debut || null,
      exercice_fin: b.exercice_fin || null,
      plan_comptable: propre(b.plan_comptable, 40) || "pcg",
      adresse: propre(b.adresse, 300),
      email_contact: b.email_contact ? String(b.email_contact).trim().toLowerCase() : null,
      expert_responsable: propre(b.expert_responsable, 120),
      notes: propre(b.notes, 2000),
      updated_at: new Date().toISOString(),
    };

    if (b.actif !== undefined) fiche.actif = b.actif !== false;

    // Modification d un dossier existant.
    if (b.id) {
      const { error } = await supabase
        .from("compta_societes")
        .update(fiche)
        .eq("id", b.id);

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, modifie: b.id });
    }

    const { data: deja } = await supabase
      .from("compta_societes")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (deja) {
      return NextResponse.json(
        { ok: false, erreur: "Un dossier porte deja le code " + code + "." },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("compta_societes")
      .insert({ ...fiche, code: code })
      .select("id, code, raison_sociale")
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      societe: (data || [])[0] || null,
      message: "Dossier " + code + " ouvert.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
