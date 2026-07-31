import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

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

// Toutes les tables dont depend le pack. Une seule manquante et une page
// entiere tombe.
const TABLES = [
  "formations",
  "formations_lms",
  "lms_cache",
  "progression_apprenants",
  "qcm_reponses",
  "crm",
  "organismes_formation",
  "organisme_apprenants",
  "organisme_catalogue",
  "organisme_cours",
  "organisme_modules",
  "organisme_documents",
  "organisme_signatures",
  "organisme_evaluations",
  "organisme_reclamations",
  "organisme_formateurs",
  "organisme_veille",
  "organisme_ameliorations",
  "organisme_positionnements",
  "organisme_factures",
  "organisme_dossiers_financement",
  "organisme_soustraitance",
  "organisme_seances",
  "organisme_presences",
  "organisme_telechargements",
  "organisme_usage_ia",
];

// Les colonnes ajoutees au fil des chantiers : elles existent en base ou la
// fonction qui en depend echoue silencieusement.
const COLONNES: any = {
  organismes_formation: [
    "abonnement_mensuel",
    "taux_prelevement",
    "plancher_stagiaire",
    "taux_apport",
    "frais_installation",
    "quota_ia_mensuel",
    "lancement_jusqu_au",
    "numero_tva",
    "slug",
    "domaine",
    "portail_actif",
    "portail_presentation",
    "logo_url",
    "couleur",
  ],
  organisme_apprenants: ["statut_stagiaire", "payeur", "dispositif", "prix_vente", "relance_le", "relances"],
  organisme_catalogue: ["prix_contractuel", "prix_vente_public"],
  organisme_cours: ["code_nsf", "objectif", "publie"],
  organisme_modules: ["chapitre_titre", "ordre"],
  organisme_seances: ["salle", "duree_minutes"],
};

const VARIABLES = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
  "RESEND_API_KEY",
  "JWT_SECRET",
];

const BUCKETS = ["documents-signes", "logos-organismes"];

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const tables: any[] = [];
    let tablesManquantes = 0;

    for (const t of TABLES) {
      const { count, error } = await supabase
        .from(t)
        .select("*", { count: "exact", head: true });

      if (error) {
        tablesManquantes = tablesManquantes + 1;
        tables.push({ nom: t, ok: false, lignes: null, erreur: error.message });
      } else {
        tables.push({ nom: t, ok: true, lignes: typeof count === "number" ? count : 0 });
      }
    }

    const colonnes: any[] = [];
    let colonnesManquantes = 0;

    for (const table of Object.keys(COLONNES)) {
      for (const col of COLONNES[table]) {
        const { error } = await supabase.from(table).select(col).limit(1);
        if (error) {
          colonnesManquantes = colonnesManquantes + 1;
          colonnes.push({ table: table, colonne: col, ok: false, erreur: error.message });
        } else {
          colonnes.push({ table: table, colonne: col, ok: true });
        }
      }
    }

    const variables = VARIABLES.map(function (v) {
      const valeur = process.env[v] || "";
      return { nom: v, ok: valeur.length > 5 };
    });
    const variablesManquantes = variables.filter(function (v) { return !v.ok; }).length;

    const seaux: any[] = [];
    let seauxManquants = 0;

    for (const b of BUCKETS) {
      const { error } = await supabase.storage.from(b).list("", { limit: 1 });
      if (error) {
        seauxManquants = seauxManquants + 1;
        seaux.push({ nom: b, ok: false, erreur: error.message });
      } else {
        seaux.push({ nom: b, ok: true });
      }
    }

    // Quelques verifications de coherence qui ne se voient pas dans le schema.
    const alertes: string[] = [];

    const { data: sansCode } = await supabase
      .from("formations")
      .select("code", { count: "exact", head: false })
      .is("code_nsf", null)
      .limit(1);

    if (sansCode && sansCode.length > 0) {
      alertes.push("Des formations du catalogue n ont pas de code NSF : le cadre F-4 des bilans sera incomplet.");
    }

    const { data: clientsSansTermes } = await supabase
      .from("organismes_formation")
      .select("raison_sociale")
      .is("abonnement_mensuel", null)
      .limit(5);

    if (clientsSansTermes && clientsSansTermes.length > 0) {
      alertes.push(
        clientsSansTermes.length + " client(s) sans abonnement fixe : leur bon de commande ne peut pas etre edite."
      );
    }

    const { data: portailsSansSlug } = await supabase
      .from("organismes_formation")
      .select("raison_sociale")
      .eq("portail_actif", true)
      .is("slug", null)
      .limit(5);

    if (portailsSansSlug && portailsSansSlug.length > 0) {
      alertes.push("Un portail est ouvert sans adresse : ses visiteurs tombent sur une page vide.");
    }

    const total = tablesManquantes + colonnesManquantes + variablesManquantes + seauxManquants;

    return NextResponse.json({
      ok: true,
      verdict: total === 0 ? "vert" : total <= 2 ? "orange" : "rouge",
      manquants: total,
      resume:
        total === 0
          ? "Tout est en place."
          : total + " element(s) manquant(s) : " +
            [
              tablesManquantes > 0 ? tablesManquantes + " table(s)" : "",
              colonnesManquantes > 0 ? colonnesManquantes + " colonne(s)" : "",
              variablesManquantes > 0 ? variablesManquantes + " variable(s)" : "",
              seauxManquants > 0 ? seauxManquants + " espace(s) de stockage" : "",
            ].filter(Boolean).join(", ") + ".",
      alertes: alertes,
      tables: tables,
      colonnes: colonnes,
      variables: variables,
      seaux: seaux,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
