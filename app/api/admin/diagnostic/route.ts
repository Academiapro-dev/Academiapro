import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

// Chaque table du socle, avec ce qu elle sert. Une table absente denonce
// une requete SQL qui n a jamais ete passee.
const TABLES = [
  ["organismes_formation", "Vos clients organismes"],
  ["organisme_apprenants", "Registre des stagiaires"],
  ["organisme_catalogue", "Formations souscrites"],
  ["organisme_cours", "Formations propres des clients"],
  ["organisme_modules", "Contenu de ces formations"],
  ["organisme_documents", "Documents emis"],
  ["organisme_signatures", "Signatures electroniques"],
  ["organisme_evaluations", "Evaluations a chaud et a froid"],
  ["organisme_reclamations", "Registre des reclamations"],
  ["organisme_formateurs", "Formateurs et habilitations"],
  ["organisme_veille", "Registres de veille"],
  ["organisme_soustraitance", "Prestataires exterieurs"],
  ["organisme_ameliorations", "Plan d amelioration continue"],
  ["organisme_positionnements", "Questionnaires de positionnement"],
  ["organisme_factures", "Facturation"],
  ["organisme_dossiers_financement", "Dossiers EDOF et OPCO"],
  ["organisme_seances", "Classes virtuelles"],
  ["organisme_presences", "Presences aux classes"],
  ["progression_apprenants", "Progression des stagiaires"],
  ["qcm_reponses", "Copies corrigees"],
  ["liens_magiques", "Liens de connexion"],
  ["crm", "Prospects"],
];

const VARIABLES = [
  ["NEXT_PUBLIC_SUPABASE_URL", "Base de donnees"],
  ["SUPABASE_SERVICE_ROLE_KEY", "Acces a la base"],
  ["SESSION_SECRET", "Signature des sessions"],
  ["ANTHROPIC_API_KEY", "Correction des questionnaires"],
  ["RESEND_API_KEY", "Envoi des emails"],
];

export async function GET() {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(session.email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    // Les variables d environnement : on ne revele jamais leur valeur,
    // seulement leur presence.
    const variables = VARIABLES.map(function (v) {
      const valeur = process.env[v[0]] || "";
      return { nom: v[0], role: v[1], presente: valeur.length > 10 };
    });

    // Chaque table : existe-t-elle, et combien de lignes contient-elle.
    const tables: any[] = [];

    for (const t of TABLES) {
      const { count, error } = await supabase
        .from(t[0])
        .select("*", { count: "exact", head: true });

      tables.push({
        nom: t[0],
        role: t[1],
        existe: !error,
        lignes: typeof count === "number" ? count : null,
        erreur: error ? String(error.message).slice(0, 120) : null,
      });
    }

    // Les colonnes ajoutees en cours de route : une seule manquante casse
    // une chaine entiere sans message clair.
    const colonnes: any[] = [];

    async function verifierColonne(table: string, colonne: string, role: string) {
      const { error } = await supabase.from(table).select(colonne).limit(1);
      colonnes.push({
        table: table,
        colonne: colonne,
        role: role,
        presente: !error,
      });
    }

    await verifierColonne("organisme_catalogue", "prix_contractuel", "Assiette du prelevement");
    await verifierColonne("organismes_formation", "abonnement_mensuel", "Abonnement negocie");
    await verifierColonne("organismes_formation", "taux_prelevement", "Taux du prelevement");
    await verifierColonne("organismes_formation", "lancement_jusqu_au", "Fin du tarif de lancement");
    await verifierColonne("organisme_documents", "pdf_sha256", "Archivage a valeur probante");
    await verifierColonne("organisme_apprenants", "statut_stagiaire", "Cadre F-1 du bilan");
    await verifierColonne("organisme_apprenants", "dispositif", "Cadre C du bilan");
    await verifierColonne("formations", "objectif", "Cadre F-3 du bilan");
    await verifierColonne("formations", "code_nsf", "Cadre F-4 du bilan");
    await verifierColonne("progression_apprenants", "tenant_id", "Cloisonnement des organismes");
    await verifierColonne("qcm_reponses", "tenant_id", "Cloisonnement des copies");
    await verifierColonne("crm", "tenant_id", "Cloisonnement des prospects");

    // Le stockage des documents signes.
    let bucket = { nom: "documents-signes", existe: false, erreur: null as any };
    try {
      const { error } = await supabase.storage.from("documents-signes").list("", { limit: 1 });
      bucket.existe = !error;
      if (error) bucket.erreur = String(error.message).slice(0, 120);
    } catch (e: any) {
      bucket.erreur = String(e).slice(0, 120);
    }

    const manquantes = tables.filter(function (t: any) { return !t.existe; });
    const colonnesManquantes = colonnes.filter(function (c: any) { return !c.presente; });
    const variablesManquantes = variables.filter(function (v: any) { return !v.presente; });

    const pret =
      manquantes.length === 0 &&
      colonnesManquantes.length === 0 &&
      variablesManquantes.length === 0 &&
      bucket.existe;

    return NextResponse.json({
      ok: true,
      pret: pret,
      resume: {
        tables_verifiees: tables.length,
        tables_manquantes: manquantes.length,
        colonnes_manquantes: colonnesManquantes.length,
        variables_manquantes: variablesManquantes.length,
        stockage: bucket.existe,
      },
      variables: variables,
      tables: tables,
      colonnes: colonnes,
      bucket: bucket,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
