import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];

// Roles preconfigures : ils posent des droits de depart, modifiables ensuite
// un par un. Un cabinet n a pas deux collaborateurs identiques.
const ROLES: any = {
  associe: {
    nom: "Associe",
    droits: { saisir: true, valider: true, cloturer: true, declarer: true, gerer_plan: true, deposer_pieces: true },
  },
  collaborateur: {
    nom: "Collaborateur comptable",
    droits: { saisir: true, valider: true, cloturer: false, declarer: false, gerer_plan: false, deposer_pieces: true },
  },
  assistant: {
    nom: "Assistant",
    droits: { saisir: true, valider: false, cloturer: false, declarer: false, gerer_plan: false, deposer_pieces: true },
  },
  lecture: {
    nom: "Lecture seule",
    droits: { saisir: false, valider: false, cloturer: false, declarer: false, gerer_plan: false, deposer_pieces: false },
  },
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

    const { data, error } = await supabase
      .from("compta_collaborateurs")
      .select("*")
      .order("role", { ascending: true })
      .limit(500);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const { data: dossiers } = await supabase
      .from("compta_societes")
      .select("id, code, raison_sociale")
      .eq("actif", true)
      .limit(500);

    const liste = (data || []).map(function (c: any) {
      const tous = !c.dossiers || c.dossiers.length === 0;
      return {
        ...c,
        role_nom: (ROLES[c.role] || {}).nom || c.role,
        tous_dossiers: tous,
        nb_dossiers: tous ? (dossiers || []).length : c.dossiers.length,
      };
    });

    return NextResponse.json({
      ok: true,
      roles: Object.keys(ROLES).map(function (k) {
        return { code: k, nom: ROLES[k].nom, droits: ROLES[k].droits };
      }),
      dossiers: dossiers || [],
      total: liste.length,
      actifs: liste.filter(function (c: any) { return c.actif; }).length,
      collaborateurs: liste,
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

    const email = String(b.email || "").trim().toLowerCase();
    if (email.indexOf("@") < 1 || email.length < 6) {
      return NextResponse.json({ ok: false, erreur: "Adresse email invalide." }, { status: 400 });
    }

    const role = ROLES[String(b.role || "")] ? String(b.role) : "collaborateur";
    const parDefaut = ROLES[role].droits;

    function droit(cle: string): boolean {
      const v = b["peut_" + cle];
      if (v === undefined || v === null) return parDefaut[cle];
      return v === true;
    }

    // Un collaborateur ne se retire pas ses propres droits : on se
    // condamnerait a ne plus pouvoir administrer.
    if (email === session.email && (b.actif === false || role === "lecture")) {
      return NextResponse.json(
        { ok: false, erreur: "Vous ne pouvez pas reduire vos propres droits." },
        { status: 409 }
      );
    }

    const dossiers = Array.isArray(b.dossiers) ? b.dossiers.filter(function (x: any) {
      return typeof x === "string" && x.length > 10;
    }) : [];

    const fiche: any = {
      email: email,
      nom: propre(b.nom, 120),
      role: role,
      dossiers: dossiers,
      peut_saisir: droit("saisir"),
      peut_valider: droit("valider"),
      peut_cloturer: droit("cloturer"),
      peut_declarer: droit("declarer"),
      peut_gerer_plan: droit("gerer_plan"),
      peut_deposer_pieces: droit("deposer_pieces"),
      notes: propre(b.notes, 1000),
      updated_at: new Date().toISOString(),
    };

    if (b.actif !== undefined) fiche.actif = b.actif !== false;

    const { data: deja } = await supabase
      .from("compta_collaborateurs")
      .select("id, role, actif")
      .eq("email", email)
      .maybeSingle();

    // Le dernier associe actif ne se desactive pas : sinon plus personne
    // ne peut administrer le cabinet.
    if (deja && deja.role === "associe" && (fiche.actif === false || role !== "associe")) {
      const { data: associes } = await supabase
        .from("compta_collaborateurs")
        .select("id")
        .eq("role", "associe")
        .eq("actif", true)
        .limit(10);

      if ((associes || []).length <= 1) {
        return NextResponse.json(
          { ok: false, erreur: "Il doit rester au moins un associe actif." },
          { status: 409 }
        );
      }
    }

    const r = deja
      ? await supabase.from("compta_collaborateurs").update(fiche).eq("id", deja.id)
      : await supabase.from("compta_collaborateurs").insert(fiche);

    if (r.error) {
      return NextResponse.json({ ok: false, erreur: r.error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      email: email,
      message: (deja ? "Droits mis a jour pour " : "Collaborateur ajoute : ") + email + ".",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
