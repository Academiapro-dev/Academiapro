import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];
const MAX_LIGNES = 1000;

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

function tenantDe(req: NextRequest, session: any): string | null {
  if (session.tenantId) return session.tenantId;
  if (ADMINS.indexOf(session.email) >= 0) {
    return new URL(req.url).searchParams.get("tenant");
  }
  return null;
}

// Un tableur exporte en point-virgule, en virgule ou en tabulation selon la
// machine. On accepte les trois.
function decouper(ligne: string): string[] {
  let separateur = ";";
  if (ligne.indexOf("\t") >= 0) separateur = "\t";
  else if (ligne.indexOf(";") < 0 && ligne.indexOf(",") >= 0) separateur = ",";

  return ligne.split(separateur).map(function (c) {
    return c.replace(/^"|"$/g, "").trim();
  });
}

function propre(v: any, max: number): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).replace(/[\u0000-\u001F\u007F]/g, "").trim();
  return t ? t.slice(0, max) : null;
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    if (session.role === "stagiaire") {
      return NextResponse.json(
        { ok: false, erreur: "Seul votre organisme peut importer des prospects." },
        { status: 403 }
      );
    }

    const tenant = tenantDe(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const b = await req.json().catch(function () { return null; });
    if (!b || !b.contenu) {
      return NextResponse.json({ ok: false, erreur: "Aucun contenu a importer." }, { status: 400 });
    }

    const brutes = String(b.contenu)
      .split(/\r?\n/)
      .map(function (l) { return l.trim(); })
      .filter(function (l) { return l.length > 0; });

    if (brutes.length === 0) {
      return NextResponse.json({ ok: false, erreur: "Fichier vide." }, { status: 400 });
    }

    if (brutes.length > MAX_LIGNES) {
      return NextResponse.json(
        { ok: false, erreur: "Limite de " + MAX_LIGNES + " lignes par import." },
        { status: 400 }
      );
    }

    const sourceParDefaut = propre(b.source, 60) || "import";

    const lignes: any[] = [];
    const rejets: any[] = [];
    const vus = new Set<string>();

    for (let i = 0; i < brutes.length; i = i + 1) {
      const numero = i + 1;
      const champs = decouper(brutes[i]);
      const email = String(champs[0] || "").toLowerCase();

      // Ligne d en-tete d un tableur : on la passe sans la compter comme erreur.
      if (i === 0 && email.indexOf("@") < 0 && /mail|adresse|contact/i.test(champs[0] || "")) {
        continue;
      }

      if (email.indexOf("@") < 1 || email.indexOf(".") < 2 || email.length < 6) {
        rejets.push({ ligne: numero, valeur: brutes[i].slice(0, 60), motif: "adresse email invalide" });
        continue;
      }

      if (vus.has(email)) {
        rejets.push({ ligne: numero, valeur: email, motif: "doublon dans le fichier" });
        continue;
      }
      vus.add(email);

      const telephone = propre(champs[2], 40);
      const formation = propre(champs[3], 40);

      // Le score se calcule des l import : un prospect qui a laisse son
      // telephone et la formation qui l interesse vaut d etre rappele d abord.
      let score = 20;
      if (propre(champs[1], 120)) score = score + 10;
      if (telephone) score = score + 20;
      if (formation) score = score + 25;
      if (propre(champs[5], 1500)) score = score + 10;

      lignes.push({
        tenant_id: tenant,
        email: email,
        nom: propre(champs[1], 120),
        telephone: telephone,
        formation_interesse: formation ? formation.toUpperCase() : null,
        source: propre(champs[4], 60) || sourceParDefaut,
        notes: propre(champs[5], 1500),
        statut: "prospect",
        score: score,
        derniere_interaction: new Date().toISOString(),
      });
    }

    if (lignes.length === 0) {
      return NextResponse.json(
        { ok: false, erreur: "Aucune ligne exploitable.", rejets: rejets },
        { status: 400 }
      );
    }

    // Un prospect deja au fichier est mis a jour, mais on ne touche ni a son
    // statut ni a ses notes : le travail commercial deja fait ne se perd pas.
    const emails = lignes.map(function (l: any) { return l.email; });

    const { data: existants } = await supabase
      .from("crm")
      .select("id, email")
      .eq("tenant_id", tenant)
      .in("email", emails)
      .limit(2000);

    const idDe: any = {};
    for (const e of existants || []) idDe[e.email] = e.id;

    let crees = 0;
    let majs = 0;
    const echecs: any[] = [];

    for (const l of lignes) {
      if (idDe[l.email]) {
        const { statut, notes, score, ...reste } = l;
        const r = await supabase.from("crm").update(reste).eq("id", idDe[l.email]);
        if (r.error) echecs.push({ email: l.email, erreur: r.error.message });
        else majs = majs + 1;
      } else {
        const r = await supabase.from("crm").insert(l);
        if (r.error) echecs.push({ email: l.email, erreur: r.error.message });
        else crees = crees + 1;
      }
    }

    return NextResponse.json({
      ok: crees + majs > 0,
      crees: crees,
      mis_a_jour: majs,
      rejetes: rejets.length,
      rejets: rejets.slice(0, 50),
      echecs: echecs.slice(0, 20),
      message:
        crees + " prospect(s) ajoute(s)"
        + (majs > 0 ? ", " + majs + " mis a jour" : "")
        + (rejets.length > 0 ? ", " + rejets.length + " ligne(s) ecartee(s)" : "")
        + ".",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
