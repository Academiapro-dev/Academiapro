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

// Cadre C du Cerfa 10443*17 : origine des produits hors taxes.
// Le dispositif determine la ligne, pas le payeur.
const LIGNE_C: any = {
  apprentissage: "2a",
  professionnalisation: "2b",
  reconversion_alternance: "2c",
  transition_pro: "2d",
  cpf: "2e",
  demandeur_emploi: "2f",
  travailleur_non_salarie: "2g",
  plan_developpement: "2h",
  public_europe: "4",
  public_etat: "5",
  public_region: "6",
  public_france_travail: "7",
  public_autre: "8",
};

// Quand le dispositif n est pas renseigne, on retombe sur le payeur.
const LIGNE_C_PAR_PAYEUR: any = {
  entreprise: "1",
  cpf: "2e",
  opco: "2h",
  pouvoirs_publics: "8",
  particulier: "9",
  organisme_formation: "10",
  fonds_propres: "11",
};

// Cadre F-1 : type de stagiaires.
const LIGNE_F1: any = {
  salarie_prive: "a",
  apprenti: "b",
  recherche_emploi: "c",
  particulier: "d",
  autre: "e",
};

// Cadre F-3 : objectif general des prestations.
const LIGNE_F3: any = {
  rncp: "a",
  rs: "b",
  cqp_non_enregistre: "c",
  autre_formation: "d",
  bilan_competences: "e",
  vae: "f",
};

function contexte(req: NextRequest) {
  const session = sessionCourante();
  if (!session) return { session: null, tenant: null };
  const admin = ADMINS.indexOf(session.email) >= 0;
  let tenant = session.tenantId;
  if (!tenant && admin) tenant = new URL(req.url).searchParams.get("tenant");
  return { session: session, tenant: tenant };
}

function vide() {
  return { stagiaires: 0, heures: 0, montant: 0 };
}

function ajouter(cible: any, cle: string, stagiaires: number, heures: number, montant: number) {
  if (!cible[cle]) cible[cle] = vide();
  cible[cle].stagiaires = cible[cle].stagiaires + stagiaires;
  cible[cle].heures = cible[cle].heures + heures;
  cible[cle].montant = cible[cle].montant + montant;
}

// ETAT PREPARATOIRE. Les chiffres sont ranges selon les cadres du
// Cerfa 10443*17 pour que l organisme n ait qu a les recopier sur
// Mon Activite Formation. Ce n est pas la declaration elle-meme.
export async function GET(req: NextRequest) {
  try {
    const { session, tenant } = contexte(req);
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const brut = new URL(req.url).searchParams.get("annee");
    const annee = brut && /^\d{4}$/.test(brut)
      ? parseInt(brut, 10)
      : new Date().getUTCFullYear();

    const debut = new Date(Date.UTC(annee, 0, 1)).toISOString();
    const fin = new Date(Date.UTC(annee + 1, 0, 1)).toISOString();

    const { data: inscrits, error } = await supabase
      .from("organisme_apprenants")
      .select("email, formation_code, prix_vente, payeur, dispositif, statut_stagiaire, created_at")
      .eq("tenant_id", tenant)
      .gte("created_at", debut)
      .lt("created_at", fin)
      .limit(10000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const { data: fiches } = await supabase
      .from("formations")
      .select("code, titre, duree, objectif, code_nsf, domaine")
      .limit(1000);

    const infoDe: any = {};
    for (const f of fiches || []) infoDe[f.code] = f;

    const { data: catalogue } = await supabase
      .from("organisme_catalogue")
      .select("formation_code, prix_vente_public")
      .eq("tenant_id", tenant)
      .limit(1000);

    const prixDe: any = {};
    for (const c of catalogue || []) {
      prixDe[c.formation_code] = Number(c.prix_vente_public) || 0;
    }

    const cadreC: any = {};
    const cadreF1: any = {};
    const cadreF3: any = {};
    const cadreF4: any = {};

    const stagiaires = new Set<string>();
    let heuresTotal = 0;
    let produitsTotal = 0;

    const aCompleter = {
      sans_dispositif: 0,
      sans_statut: 0,
      sans_prix: 0,
      sans_formation: 0,
      sans_duree: 0,
      sans_code_nsf: 0,
    };

    for (const i of inscrits || []) {
      stagiaires.add(i.email);

      const fiche = infoDe[i.formation_code || ""] || {};
      const duree = Number(fiche.duree) || 0;
      if (!i.formation_code) aCompleter.sans_formation = aCompleter.sans_formation + 1;
      if (!duree) aCompleter.sans_duree = aCompleter.sans_duree + 1;

      let prix = Number(i.prix_vente);
      if (!prix || isNaN(prix)) prix = prixDe[i.formation_code || ""] || 0;
      if (!prix) aCompleter.sans_prix = aCompleter.sans_prix + 1;

      heuresTotal = heuresTotal + duree;
      produitsTotal = produitsTotal + prix;

      // Cadre C
      let ligneC = i.dispositif ? LIGNE_C[i.dispositif] : null;
      if (!ligneC) {
        ligneC = LIGNE_C_PAR_PAYEUR[i.payeur || ""] || "11";
        if (!i.dispositif && i.payeur !== "entreprise" && i.payeur !== "particulier") {
          aCompleter.sans_dispositif = aCompleter.sans_dispositif + 1;
        }
      }
      ajouter(cadreC, ligneC, 1, duree, prix);

      // Cadre F-1
      const ligneF1 = LIGNE_F1[i.statut_stagiaire || ""] || "e";
      if (!i.statut_stagiaire) aCompleter.sans_statut = aCompleter.sans_statut + 1;
      ajouter(cadreF1, ligneF1, 1, duree, prix);

      // Cadre F-3
      const ligneF3 = LIGNE_F3[fiche.objectif || ""] || "d";
      ajouter(cadreF3, ligneF3, 1, duree, prix);

      // Cadre F-4 : specialites, par code NSF si connu, sinon par domaine.
      const specialite = fiche.code_nsf || fiche.domaine || "non_renseigne";
      if (!fiche.code_nsf) aCompleter.sans_code_nsf = aCompleter.sans_code_nsf + 1;
      ajouter(cadreF4, specialite, 1, duree, prix);
    }

    // Total du cadre C ligne 2 : somme des lignes 2a a 2h.
    const total2 = vide();
    ["2a", "2b", "2c", "2d", "2e", "2f", "2g", "2h"].forEach(function (k) {
      if (cadreC[k]) {
        total2.stagiaires = total2.stagiaires + cadreC[k].stagiaires;
        total2.heures = total2.heures + cadreC[k].heures;
        total2.montant = total2.montant + cadreC[k].montant;
      }
    });

    const { data: fiche } = await supabase
      .from("organismes_formation")
      .select("raison_sociale, numero_da, siret, adresse, telephone, email_contact")
      .eq("tenant_id", tenant)
      .maybeSingle();

    const { data: valides } = await supabase
      .from("progression_apprenants")
      .select("user_email")
      .eq("tenant_id", tenant)
      .eq("statut", "valide")
      .limit(10000);

    return NextResponse.json({
      ok: true,
      avertissement:
        "Etat preparatoire au bilan pedagogique et financier (Cerfa 10443*17). Les chiffres sont ranges selon les cadres du formulaire pour etre recopies sur Mon Activite Formation. Ce document n est pas la declaration.",
      annee: annee,
      cadre_a: fiche || null,
      distanciel: true,
      cadre_c: cadreC,
      cadre_c_total_2: total2,
      produits_total: produitsTotal,
      cadre_f1: cadreF1,
      cadre_f3: cadreF3,
      cadre_f4: cadreF4,
      stagiaires_distincts: stagiaires.size,
      inscriptions: (inscrits || []).length,
      heures_total: heuresTotal,
      modules_valides: (valides || []).length,
      a_completer: aCompleter,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
