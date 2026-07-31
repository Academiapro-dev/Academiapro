import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
}

const NOMBRES: any = {
  abonnement_mensuel: { max: 100000, libelle: "Abonnement invalide." },
  taux_prelevement: { max: 100, libelle: "Taux invalide." },
  plancher_stagiaire: { max: 10000, libelle: "Minimum par stagiaire invalide." },
  taux_apport: { max: 100, libelle: "Taux d apport invalide." },
  frais_installation: { max: 100000, libelle: "Frais de mise en service invalides." },
  quota_ia_mensuel: { max: 5000, libelle: "Quota de redaction invalide." },
};

function nettoyerDomaine(brut: string): string {
  return String(brut || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/\s/g, "");
}

export async function GET() {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const { data: organismes, error } = await supabase
      .from("organismes_formation")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const { data: apprenants } = await supabase
      .from("organisme_apprenants")
      .select("tenant_id")
      .limit(10000);

    const compte: any = {};
    for (const a of apprenants || []) {
      compte[a.tenant_id] = (compte[a.tenant_id] || 0) + 1;
    }

    const { data: catalogue } = await supabase
      .from("organisme_catalogue")
      .select("tenant_id")
      .limit(10000);

    const formations: any = {};
    for (const c of catalogue || []) {
      formations[c.tenant_id] = (formations[c.tenant_id] || 0) + 1;
    }

    const liste = (organismes || []).map(function (o: any) {
      return {
        ...o,
        stagiaires: compte[o.tenant_id] || 0,
        formations_ouvertes: formations[o.tenant_id] || 0,
      };
    });

    return NextResponse.json({ ok: true, nombre: liste.length, organismes: liste });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const corps = await req.json().catch(function () { return null; });
    if (!corps) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    const raison = String(corps.raison_sociale || "").trim();
    const email = String(corps.email_contact || "").trim().toLowerCase();

    if (!raison || !email || email.indexOf("@") < 1) {
      return NextResponse.json(
        { ok: false, erreur: "La raison sociale et l email de contact sont obligatoires." },
        { status: 400 }
      );
    }

    const fiche = {
      raison_sociale: raison,
      siret: corps.siret ? String(corps.siret).trim() : null,
      numero_da: corps.numero_da ? String(corps.numero_da).trim() : null,
      numero_tva: corps.numero_tva ? String(corps.numero_tva).trim().toUpperCase() : null,
      email_contact: email,
      telephone: corps.telephone ? String(corps.telephone).trim() : null,
      adresse: corps.adresse ? String(corps.adresse).trim() : null,
      qualiopi: corps.qualiopi === true,
      certificateur: corps.certificateur ? String(corps.certificateur).trim() : null,
      statut: "actif",
      notes: corps.notes ? String(corps.notes).trim() : null,
    };

    const { data, error } = await supabase
      .from("organismes_formation")
      .insert(fiche)
      .select("id, tenant_id, raison_sociale, email_contact")
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, organisme: (data || [])[0] || null });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) return refuse();

    const corps = await req.json().catch(function () { return null; });
    if (!corps || !corps.id) {
      return NextResponse.json({ ok: false, erreur: "Identifiant manquant" }, { status: 400 });
    }

    const m: any = { updated_at: new Date().toISOString() };

    const textes = [
      "raison_sociale", "siret", "numero_da", "email_contact",
      "telephone", "adresse", "certificateur", "formule", "notes", "statut",
    ];

    for (const c of textes) {
      if (corps[c] !== undefined) {
        m[c] = corps[c] ? String(corps[c]).trim() : null;
      }
    }

    if (m.email_contact) m.email_contact = String(m.email_contact).toLowerCase();

    if (corps.numero_tva !== undefined) {
      m.numero_tva = corps.numero_tva
        ? String(corps.numero_tva).trim().toUpperCase().replace(/\s/g, "")
        : null;
    }

    if (corps.qualiopi !== undefined) m.qualiopi = corps.qualiopi === true;

    if (corps.domaine !== undefined) {
      const domaine = nettoyerDomaine(corps.domaine);

      if (domaine) {
        if (domaine.indexOf(".") < 1 || domaine.length < 4 || /[^a-z0-9.-]/.test(domaine)) {
          return NextResponse.json(
            { ok: false, erreur: "Domaine invalide. Exemple : formation.exemple.fr" },
            { status: 400 }
          );
        }

        const { data: pris } = await supabase
          .from("organismes_formation")
          .select("id")
          .eq("domaine", domaine)
          .maybeSingle();

        if (pris && pris.id !== corps.id) {
          return NextResponse.json(
            { ok: false, erreur: "Ce domaine est deja rattache a un autre client." },
            { status: 409 }
          );
        }
      }

      m.domaine = domaine || null;
    }

    for (const cle of Object.keys(NOMBRES)) {
      if (corps[cle] === undefined) continue;

      const brut = corps[cle];
      if (brut === null || brut === "") {
        m[cle] = null;
        continue;
      }

      const valeur = Number(String(brut).replace(",", "."));
      if (isNaN(valeur) || valeur < 0 || valeur > NOMBRES[cle].max) {
        return NextResponse.json({ ok: false, erreur: NOMBRES[cle].libelle }, { status: 400 });
      }
      m[cle] = valeur;
    }

    if (corps.lancement_jusqu_au !== undefined) {
      m.lancement_jusqu_au = corps.lancement_jusqu_au || null;
    }

    const { error } = await supabase
      .from("organismes_formation")
      .update(m)
      .eq("id", corps.id);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, modifie: corps.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
