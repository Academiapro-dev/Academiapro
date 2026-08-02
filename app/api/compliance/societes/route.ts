import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { dossiersAutorises } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];

const REGIMES_FISCAUX: any = {
  is: "Impot sur les societes",
  ir_bic: "Impot sur le revenu - BIC",
  ir_bnc: "Impot sur le revenu - BNC",
  micro: "Micro-entreprise",
  a_determiner: "A determiner",
};

const REGIMES_TVA: any = {
  reel_normal: "Reel normal - CA3 mensuelle",
  reel_simplifie: "Reel simplifie - CA12 annuelle",
  franchise: "Franchise en base",
  non_assujetti: "Non assujetti",
};

// Le pays decide de ce que le logiciel a le droit de reclamer : un SIREN, une
// liasse, une TVA francaise. Il se declare, il ne se devine pas.
const PAYS: any = {
  FR: "France",
  BE: "Belgique",
  CH: "Suisse",
  LU: "Luxembourg",
  MC: "Monaco",
  ES: "Espagne",
  IT: "Italie",
  DE: "Allemagne",
  PT: "Portugal",
  NL: "Pays-Bas",
  IE: "Irlande",
  GB: "Royaume-Uni",
  US: "Etats-Unis",
  CA: "Canada",
  MA: "Maroc",
  TN: "Tunisie",
  IL: "Israel",
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
  return NextResponse.json(
    { ok: false, erreur: "Ouvrir ou modifier un dossier est reserve aux associes du cabinet." },
    { status: 403 }
  );
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

function propre(v: any, max: number): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).replace(/[\u0000-\u001F\u007F]/g, "").trim();
  return t ? t.slice(0, max) : null;
}

// Un code inconnu ne fait pas echouer l enregistrement : il retombe sur la
// France, qui est le cas courant.
function paysValide(v: any): string {
  const t = String(v || "").toUpperCase().trim();
  return PAYS[t] ? t : "FR";
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    // Un collaborateur ne voit que les dossiers qui lui sont confies.
    const autorises = await dossiersAutorises();
    if (autorises !== null && autorises.length === 0) {
      return NextResponse.json({
        ok: true, total: 0, actifs: 0, desequilibres: 0,
        ecritures_orphelines: 0, societes: [],
        regimes_fiscaux: REGIMES_FISCAUX, regimes_tva: REGIMES_TVA, pays: PAYS,
      });
    }

    let requete = supabase.from("compta_societes").select("*");
    if (autorises !== null) requete = requete.in("id", autorises);

    const { data: dossiers, error } = await requete
      .order("raison_sociale", { ascending: true })
      .limit(500);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const liste = dossiers || [];
    const ids = liste.map(function (s: any) { return s.id; });

    const { data: ecritures } = ids.length > 0
      ? await supabase
        .from("compta_ecritures")
        .select("societe_id, debit, credit, ecriture_date")
        .in("societe_id", ids)
        .limit(100000)
      : { data: [] };

    const stats: any = {};
    for (const l of ecritures || []) {
      if (!stats[l.societe_id]) {
        stats[l.societe_id] = { lignes: 0, debit: 0, credit: 0, derniere: null };
      }
      const s = stats[l.societe_id];
      s.lignes = s.lignes + 1;
      s.debit = r2(s.debit + (Number(l.debit) || 0));
      s.credit = r2(s.credit + (Number(l.credit) || 0));
      const t = l.ecriture_date ? new Date(l.ecriture_date).getTime() : 0;
      if (t && (!s.derniere || t > s.derniere)) s.derniere = t;
    }

    // Les ecritures qui ne sont rattachees a aucun dossier n apparaissent
    // dans aucun FEC ni aucune liasse : il faut le dire.
    let orphelines = 0;
    if (autorises === null) {
      const { count } = await supabase
        .from("compta_ecritures")
        .select("*", { count: "exact", head: true })
        .is("societe_id", null);
      orphelines = count || 0;
    }

    const societes = liste.map(function (s: any) {
      const st = stats[s.id] || { lignes: 0, debit: 0, credit: 0, derniere: null };
      const pays = paysValide(s.pays);
      return {
        ...s,
        pays: pays,
        pays_nom: PAYS[pays],
        francais: pays === "FR",
        regime_fiscal_nom: REGIMES_FISCAUX[s.regime_fiscal] || s.regime_fiscal,
        regime_tva_nom: REGIMES_TVA[s.regime_tva] || s.regime_tva,
        lignes: st.lignes,
        debit: st.debit,
        credit: st.credit,
        equilibre: Math.abs(r2(st.debit - st.credit)) < 0.01,
        derniere_ecriture: st.derniere ? new Date(st.derniere).toISOString() : null,
      };
    });

    return NextResponse.json({
      ok: true,
      restreint: autorises !== null,
      total: societes.length,
      actifs: societes.filter(function (s: any) { return s.actif !== false; }).length,
      desequilibres: societes.filter(function (s: any) { return s.lignes > 0 && !s.equilibre; }).length,
      ecritures_orphelines: orphelines,
      regimes_fiscaux: REGIMES_FISCAUX,
      regimes_tva: REGIMES_TVA,
      pays: PAYS,
      societes: societes,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();

    // Ouvrir un dossier est un acte de cabinet, pas un acte comptable :
    // aucun des six droits ne le couvre, il reste donc reserve.
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

    const fiche: any = {
      raison_sociale: raison,
      pays: paysValide(b.pays),
      siren: b.siren ? String(b.siren).replace(/\D/g, "").slice(0, 9) : null,
      forme: propre(b.forme, 40),
      regime_fiscal: REGIMES_FISCAUX[String(b.regime_fiscal || "")] ? b.regime_fiscal : "a_determiner",
      regime_tva: REGIMES_TVA[String(b.regime_tva || "")] ? b.regime_tva : "reel_normal",
      exercice_debut: b.exercice_debut ? String(b.exercice_debut).slice(0, 10) : null,
      exercice_fin: b.exercice_fin ? String(b.exercice_fin).slice(0, 10) : null,
      adresse: propre(b.adresse, 300),
      email_contact: propre(b.email_contact, 120),
      expert_responsable: propre(b.expert_responsable, 120),
      notes: propre(b.notes, 2000),
      updated_at: new Date().toISOString(),
    };

    if (b.actif !== undefined) fiche.actif = b.actif !== false;

    // MODIFICATION d un dossier existant.
    if (b.id) {
      const { error } = await supabase
        .from("compta_societes")
        .update(fiche)
        .eq("id", b.id);

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: "Dossier " + raison + " enregistre.",
      });
    }

    // OUVERTURE. Le code se retrouve dans les numeros d ecriture et le nom
    // du fichier FEC : court, sans accent, definitif.
    let code = propre(b.code, 20);
    if (!code) {
      code = raison
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 12);
    } else {
      code = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
    }

    if (code.length < 2) {
      return NextResponse.json(
        { ok: false, erreur: "Le code du dossier doit comporter au moins deux caracteres." },
        { status: 400 }
      );
    }

    const { data: deja } = await supabase
      .from("compta_societes")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (deja) {
      return NextResponse.json(
        { ok: false, erreur: "Le code " + code + " est deja pris par un autre dossier." },
        { status: 409 }
      );
    }

    fiche.code = code;

    const { error } = await supabase.from("compta_societes").insert(fiche);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      code: code,
      message: "Dossier " + raison + " ouvert sous le code " + code + ".",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
