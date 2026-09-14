import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { tenantDeSession, emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// LES MODELES DE DOCUMENTS DU CLIENT — 14/09.
//
// LE BESOIN : un agent immobilier ne signe pas les memes pieces qu un
// organisme de formation ou qu un cabinet. Plutot que d imposer des
// modeles, chaque client depose LES SIENS — mandat, devis, bon de
// commande, contrat de prestation, lettre de mission — les parametre une
// fois, et ils se remplissent ensuite depuis la fiche du prospect.
//
// ⚠️ POURQUOI UNE TABLE A PART ET NON `modeles_contrats`. Celle-ci existe
// deja et porte le MEME format ({{cle}} dans le corps, liste des champs a
// cote) : c est d elle qu on s inspire. Mais elle est GLOBALE, sans
// tenant_id — c est la bibliotheque des contrats de la maison, pas celle
// des clients. Les melanger ferait voir a un client les contrats d un
// autre. D ou `crm_modeles`, meme forme, bornee au tenant.
//
// LES CHAMPS SE DEDUISENT DU CORPS. L utilisateur ecrit son document avec
// {{nom}}, {{adresse}}, {{montant}} ; la route releve ces marques et
// constitue la liste. Il n a donc rien a declarer : ce qu il ecrit fait
// foi. Les champs CONNUS DU CRM (nom, email, telephone, ville, societe…)
// sont marques « automatique » : ils se rempliront seuls depuis la fiche.
// Les autres seront demandes au moment de produire le document.
//
// 🚨 LE TENANT VIENT DE LA SESSION, JAMAIS DU CORPS DE LA REQUETE.
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Ce que la fiche du prospect sait remplir toute seule. La cle du modele
// (a gauche) est cherchee dans la colonne du CRM (a droite).
const AUTOMATIQUES: Record<string, string> = {
  nom: "nom",
  prenom: "dirigeant_prenom",
  patronyme: "dirigeant_nom",
  societe: "organisme",
  organisme: "organisme",
  email: "email",
  telephone: "telephone",
  ville: "ville",
  adresse: "adresse",
  code_postal: "code_postal",
  pays: "pays",
  siret: "siret",
  siren: "siren",
};

function propre(v: any, max: number): string {
  return String(v === null || v === undefined ? "" : v).trim().slice(0, max);
}

// Releve les {{cle}} du corps, dans l ordre, sans doublon.
function champsDuCorps(corps: string): any[] {
  const vus: any = {};
  const liste: any[] = [];
  const re = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let m = re.exec(corps);
  while (m) {
    const cle = m[1].toLowerCase();
    if (!vus[cle]) {
      vus[cle] = true;
      liste.push({
        cle: cle,
        libelle: cle.charAt(0).toUpperCase() + cle.slice(1).replace(/_/g, " "),
        source: AUTOMATIQUES[cle] ? "fiche" : "saisie",
        colonne: AUTOMATIQUES[cle] || null,
      });
    }
    m = re.exec(corps);
  }
  return liste;
}

function codeDepuisTitre(titre: string): string {
  return String(titre || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "modele";
}

export async function GET() {
  const tenant = tenantDeSession();
  if (!tenant) {
    return NextResponse.json({ ok: false, erreur: "Vous devez être connecté." }, { status: 401 });
  }
  const { data, error } = await supabase
    .from("crm_modeles")
    .select("id, code, titre, categorie, description, champs, corps, actif, updated_at")
    .eq("tenant_id", tenant)
    .order("titre", { ascending: true });

  if (error) {
    console.error("[crm_modeles] " + error.message);
    return NextResponse.json({ ok: false, erreur: "Lecture impossible." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, modeles: data || [], automatiques: Object.keys(AUTOMATIQUES) });
}

export async function POST(req: NextRequest) {
  const tenant = tenantDeSession();
  const email = emailDeSession();
  if (!tenant) {
    return NextResponse.json({ ok: false, erreur: "Vous devez être connecté." }, { status: 401 });
  }

  const body = await req.json().catch(function () { return {}; });
  const action = String(body.action || "creer");

  // ---- SUPPRIMER (desactiver) ----
  //
  // ⚠️ ON NE SUPPRIME PAS : on desactive. Un modele efface laisserait
  // orphelins les documents deja produits avec lui.
  if (action === "desactiver") {
    const id = propre(body.id, 60);
    if (!id) return NextResponse.json({ ok: false, erreur: "Modèle non précisé." }, { status: 400 });
    const { error } = await supabase
      .from("crm_modeles")
      .update({ actif: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", tenant);
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: "Modèle retiré de la liste." });
  }

  if (action === "reactiver") {
    const id = propre(body.id, 60);
    const { error } = await supabase
      .from("crm_modeles")
      .update({ actif: true, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", tenant);
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, message: "Modèle remis en service." });
  }

  // ---- CREER OU MODIFIER ----
  const titre = propre(body.titre, 160);
  const corps = String(body.corps === null || body.corps === undefined ? "" : body.corps).trim();

  if (titre.length < 2) {
    return NextResponse.json({ ok: false, erreur: "Donnez un titre au document." }, { status: 400 });
  }
  if (corps.length < 30) {
    return NextResponse.json({ ok: false, erreur: "Collez le texte du document." }, { status: 400 });
  }

  const champs = champsDuCorps(corps);
  // Un document sans aucune marque se remplirait a l identique a chaque
  // fois : ce n est pas un modele, c est un fichier. On le dit.
  if (champs.length === 0) {
    return NextResponse.json({
      ok: false,
      erreur: "Aucun champ trouvé. Écrivez entre doubles accolades ce qui change d'un client à l'autre, par exemple {{nom}} ou {{montant}}.",
    }, { status: 400 });
  }

  const ligne: any = {
    tenant_id: tenant,
    titre: titre,
    categorie: propre(body.categorie, 60) || null,
    description: propre(body.description, 500) || null,
    champs: champs,
    corps: corps,
    actif: true,
    updated_at: new Date().toISOString(),
  };

  const id = propre(body.id, 60);
  if (id) {
    const { data, error } = await supabase
      .from("crm_modeles")
      .update(ligne)
      .eq("id", id)
      .eq("tenant_id", tenant)
      .select("id, code, titre, champs")
      .maybeSingle();
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, modele: data, message: "Modèle enregistré — " + champs.length + " champ(s)." });
  }

  ligne.code = codeDepuisTitre(titre);
  ligne.cree_par = email || null;

  const { data, error } = await supabase
    .from("crm_modeles")
    .insert(ligne)
    .select("id, code, titre, champs")
    .maybeSingle();

  if (error) {
    // Le code est unique par client : deux modeles du meme nom se
    // distinguent par un suffixe plutot que d echouer.
    if (String(error.message || "").indexOf("crm_modeles_tenant_id_code_key") >= 0) {
      ligne.code = ligne.code + "-" + Date.now().toString().slice(-4);
      const retour = await supabase
        .from("crm_modeles")
        .insert(ligne)
        .select("id, code, titre, champs")
        .maybeSingle();
      if (retour.error) return NextResponse.json({ ok: false, erreur: retour.error.message }, { status: 500 });
      return NextResponse.json({ ok: true, modele: retour.data, message: "Modèle déposé — " + champs.length + " champ(s)." });
    }
    return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
  }

  const auto = champs.filter(function (c: any) { return c.source === "fiche"; }).length;
  return NextResponse.json({
    ok: true,
    modele: data,
    message: "Modèle déposé — " + champs.length + " champ(s), dont " + auto + " rempli(s) automatiquement depuis la fiche.",
  });
}
