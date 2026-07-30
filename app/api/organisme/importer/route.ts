import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];
const MAX_LIGNES = 500;

const STATUTS = ["salarie_prive", "apprenti", "recherche_emploi", "particulier", "autre"];
const PAYEURS = ["entreprise", "opco", "cpf", "pouvoirs_publics", "particulier", "organisme_formation", "fonds_propres"];
const DISPOSITIFS = [
  "apprentissage", "professionnalisation", "reconversion_alternance", "transition_pro",
  "cpf", "demandeur_emploi", "travailleur_non_salarie", "plan_developpement",
  "public_europe", "public_etat", "public_region", "public_france_travail", "public_autre",
];

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
// machine. On accepte les trois, et on ignore une eventuelle ligne d en-tete.
function decouper(ligne: string): string[] {
  let separateur = ";";
  if (ligne.indexOf("\t") >= 0) separateur = "\t";
  else if (ligne.indexOf(";") < 0 && ligne.indexOf(",") >= 0) separateur = ",";

  return ligne.split(separateur).map(function (c) {
    return c.replace(/^"|"$/g, "").trim();
  });
}

function normaliser(v: string, liste: string[]): string | null {
  if (!v) return null;
  const propre = v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return liste.indexOf(propre) >= 0 ? propre : null;
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    if (session.role === "stagiaire") {
      return NextResponse.json(
        { ok: false, erreur: "Seul votre organisme peut importer des stagiaires." },
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

    // Codes de formation reellement ouverts a cet organisme : on n inscrit
    // personne a une formation qu il n a pas souscrite.
    const { data: catalogue } = await supabase
      .from("organisme_catalogue")
      .select("formation_code")
      .eq("tenant_id", tenant)
      .eq("actif", true)
      .limit(1000);

    const { data: propres } = await supabase
      .from("organisme_cours")
      .select("code")
      .eq("tenant_id", tenant)
      .limit(500);

    const autorises = new Set<string>();
    for (const c of catalogue || []) autorises.add(String(c.formation_code).toUpperCase());
    for (const c of propres || []) autorises.add(String(c.code).toUpperCase());

    const lignes: any[] = [];
    const rejets: any[] = [];
    const vus = new Set<string>();

    for (let i = 0; i < brutes.length; i = i + 1) {
      const numero = i + 1;
      const champs = decouper(brutes[i]);
      const email = String(champs[0] || "").toLowerCase();

      // Ligne d en-tete d un tableur : on la passe sans la compter comme erreur.
      if (i === 0 && email.indexOf("@") < 0 && /mail|adresse/i.test(champs[0] || "")) {
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

      const code = String(champs[2] || "").trim().toUpperCase();

      if (code && autorises.size > 0 && !autorises.has(code)) {
        rejets.push({ ligne: numero, valeur: email, motif: "formation " + code + " non ouverte a votre organisme" });
        continue;
      }

      lignes.push({
        tenant_id: tenant,
        email: email,
        nom: champs[1] ? String(champs[1]).slice(0, 120) : null,
        formation_code: code || null,
        statut_stagiaire: normaliser(champs[3] || "", STATUTS),
        payeur: normaliser(champs[4] || "", PAYEURS),
        dispositif: normaliser(champs[5] || "", DISPOSITIFS),
        statut: "invite",
      });
    }

    if (lignes.length === 0) {
      return NextResponse.json(
        { ok: false, erreur: "Aucune ligne exploitable.", rejets: rejets },
        { status: 400 }
      );
    }

    // Une adresse deja au registre n est pas dupliquee : elle est mise a jour.
    const { error } = await supabase
      .from("organisme_apprenants")
      .upsert(lignes, { onConflict: "tenant_id,email", ignoreDuplicates: false });

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message, rejets: rejets }, { status: 500 });
    }

    const incomplets = lignes.filter(function (l: any) {
      return !l.statut_stagiaire || !l.payeur;
    }).length;

    return NextResponse.json({
      ok: true,
      inscrits: lignes.length,
      rejetes: rejets.length,
      rejets: rejets.slice(0, 50),
      incomplets: incomplets,
      message:
        lignes.length + " stagiaire(s) inscrit(s)." +
        (rejets.length > 0 ? " " + rejets.length + " ligne(s) ecartee(s)." : "") +
        (incomplets > 0 ? " " + incomplets + " fiche(s) sans statut ni financeur : a completer avant le bilan." : ""),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
