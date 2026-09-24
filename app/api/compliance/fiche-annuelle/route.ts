import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { sessionCourante } from "../../../../lib/session";
// ⚠️ NE PAS REDEFINIR origineLegitime ICI : la fonction est partagee.
import { origineLegitime } from "../../../../lib/origine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// LA FICHE ANNUELLE D UNE SOCIETE — 24/09.
//
// POURQUOI ELLE EXISTE. Les generateurs du 5472, du 1120 et du 7004 lisent
// une ligne de `compliance_5472_mapping` par societe et par exercice ; celui
// du 3916 lit `compliance_declarant`. AUCUN ECRAN NE CREAIT CES LIGNES : en
// juillet, celles d AcademIA Pro LLC avaient ete ecrites en base a la main.
// Un nouveau client ne pouvait donc produire aucun de ces formulaires.
// Trou trouve le 24/09 en preparant la video des formulaires avec Meridian.
//
// LA DOCTRINE : ce que la machine sait se remplit seul, le client ne saisit
// que ce qu elle ne peut pas savoir.
//   · D OFFICE : le nom de la LLC, son Etat, sa date de constitution (fiche
//     de la societe), son EIN (parcours de creation, table
//     compliance_creations), son adresse (fiche de la societe, decoupee).
//   · SAISI UNE FOIS : l identite du membre (nom, adresse, naissance,
//     numero fiscal, nationalite, residence), l activite et son code NAICS.
//   · SAISI CHAQUE ANNEE : l actif total en fin d exercice.
//
// UNE SEULE SAISIE, QUATRE FORMULAIRES. Le membre d une LLC detenue depuis
// la France est a la fois l actionnaire etranger du 5472 (Part I), la
// partie liee (Part III), le proprietaire a 100 % de la question 7 du 1120,
// et le declarant du 3916. La route ecrit les deux tables d un coup.
//
// GET  ?entite=<id>&annee=<aaaa>  la fiche, preremplie, et ce qui manque
// POST { entite_id, annee, societe, membre, exercice }  enregistre
//
// 🚨 CLOISONNEMENT : l organisme vient de la session signee, jamais du
// navigateur. L identifiant de societe recu n est qu un choix : il est
// cherche AVEC le filtre tenant_id, une societe d un autre organisme est
// introuvable.
// 🚨 AUCUN REPLI QUI CHANGE LE PERIMETRE : la fiche d une societe ne se lit
// jamais sur une autre societe du meme organisme (defaut du 31/08, voir
// f5472/generate). Le seul emprunt admis est la fiche de LA MEME societe
// pour un autre exercice, pour preremplir l identite du membre.
//
// CONVENTIONS DE REMPLISSAGE — reprises du 5472 et du 1120 d AcademIA Pro
// LLC, deposes tels quels a l essai du 23/09 :
//   ri_address         "30 N Gould St Ste R, Sheridan, WY 82801"
//   fs_name_address    "Prenom Nom, rue, code postal ville, pays"
//   ri_country_incorp  "United States"
//   ri_country_resident / ri_country_business : pays du membre
//   rp_* = fs_*        la partie liee EST le membre
//   f1120 question 7   100 %, pays = nationalite du membre, 1 formulaire
// ══════════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    global: {
      fetch: function (url: any, opts: any) {
        return fetch(url, { ...(opts || {}), cache: "no-store" });
      },
    },
  }
);

function txt(v: unknown): string {
  return String(v ?? "").trim();
}

// Un montant saisi a la francaise : « 12 345,67 » comme « 12345.67 ».
function nombreFr(v: unknown): number | null {
  const s = txt(v).replace(/[\s\u00A0\u202F]/g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return isFinite(n) ? n : null;
}

function estFrance(pays: string): boolean {
  const p = txt(pays).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return p === "france" || p === "fr" || p === "fra";
}

// L adresse americaine d une societe, saisie en texte libre dans « Ma
// societe », decoupee en rue, suite, ville, Etat, ZIP et pays.
// Formes reconnues : « 30 N Gould St Ste R, Sheridan, WY 82801 »,
// « 30 N Gould St, Ste R, Sheridan, WY 82801, United States ».
// ⚠️ LE RESULTAT EST UNE PROPOSITION : l ecran l affiche, le client corrige.
function decouperAdresseUS(v: unknown): {
  rue: string; suite: string; ville: string; etat: string; zip: string; pays: string;
} {
  const vide = { rue: "", suite: "", ville: "", etat: "", zip: "", pays: "United States" };
  const s = txt(v);
  if (!s) return vide;
  const morceaux = s.split(",").map(function (m) { return m.trim(); }).filter(Boolean);
  const r = { ...vide };

  if (morceaux.length > 1) {
    const dernier = morceaux[morceaux.length - 1].toLowerCase();
    if (/^(united states( of america)?|usa|us|u\.s\.a?\.?|etats-unis|états-unis)$/.test(dernier)) {
      morceaux.pop();
    }
  }
  if (morceaux.length > 1) {
    const d = morceaux[morceaux.length - 1];
    const m = d.match(/^([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
    if (m) {
      r.etat = m[1].toUpperCase();
      r.zip = m[2];
      morceaux.pop();
    } else if (/^\d{5}(?:-\d{4})?$/.test(d)) {
      r.zip = d;
      morceaux.pop();
    } else if (/^[A-Za-z]{2}$/.test(d)) {
      r.etat = d.toUpperCase();
      morceaux.pop();
    }
  }
  if (morceaux.length >= 2) {
    r.ville = morceaux.pop() as string;
    r.rue = morceaux[0];
    r.suite = morceaux.slice(1).join(", ");
  } else if (morceaux.length === 1) {
    r.rue = morceaux[0];
  }
  if (!r.suite) {
    const m = r.rue.match(/^(.*?\S)\s+((?:Ste|Suite|Unit|Apt|Rm|Room|#)\.?\s*\S.*)$/i);
    if (m) {
      r.rue = m[1];
      r.suite = m[2];
    }
  }
  return r;
}

function adresseSociete(a: any): string {
  const rue = txt(a.adr_rue) + (txt(a.adr_suite) ? " " + txt(a.adr_suite) : "");
  const fin = txt(a.adr_ville) + ", " + txt(a.adr_etat) + " " + txt(a.adr_zip);
  return rue + ", " + fin.trim();
}

function nomAdresseMembre(p: any): string {
  return txt(p.prenoms) + " " + txt(p.nom) + ", " + txt(p.adresse_rue) + ", "
    + txt(p.adresse_code_postal) + " " + txt(p.adresse_ville) + ", " + txt(p.adresse_pays);
}

async function lireEntite(tenantId: string, entiteDemandee: string) {
  let q = supabase
    .from("compliance_tenants")
    .select("id, label, legal_name, formation_state, formation_date, mailing_address, "
      + "principal_office_address, fr_tax_resident")
    .eq("tenant_id", tenantId);
  if (entiteDemandee) q = q.eq("id", entiteDemandee);
  return await q.order("label", { ascending: true }).limit(1).maybeSingle();
}

// Tout ce que la machine sait deja, et ce que le client a deja saisi.
async function construireFiche(tenantId: string, entite: any, annee: number) {
  const avertissements: string[] = [];

  const { data: mapping, error: eMap } = await supabase
    .from("compliance_5472_mapping")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("entite_id", entite.id)
    .eq("tax_year", annee)
    .maybeSingle();
  if (eMap) throw new Error("lecture de la fiche 5472 : " + eMap.message);

  // La fiche de LA MEME societe pour un autre exercice, pour ne pas
  // redemander l identite du membre chaque annee.
  let precedente: any = null;
  if (!mapping) {
    const { data: autres } = await supabase
      .from("compliance_5472_mapping")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("entite_id", entite.id)
      .order("tax_year", { ascending: false })
      .limit(1);
    precedente = autres && autres.length ? autres[0] : null;
  }
  const m: any = mapping || precedente || {};

  const { data: declarant, error: eDecl } = await supabase
    .from("compliance_declarant")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("entite_id", entite.id)
    .limit(1)
    .maybeSingle();
  if (eDecl) {
    throw new Error("lecture du declarant : " + eDecl.message
      + " — la colonne entite_id a-t-elle ete ajoutee a compliance_declarant ?");
  }
  const d: any = declarant || {};

  // L EIN : la fiche 5472 d abord, sinon le parcours de creation.
  let ein = txt(m.ri_ein);
  let einSource = ein ? "fiche" : "";
  if (!ein) {
    const { data: cre } = await supabase
      .from("compliance_creations")
      .select("ein")
      .eq("tenant_id", tenantId)
      .eq("entite_id", entite.id)
      .maybeSingle();
    if (cre && txt(cre.ein)) {
      ein = txt(cre.ein);
      einSource = "creation";
    }
  }

  // L adresse de la societe : la fiche 5472 si elle la porte, sinon la
  // fiche de la societe, decoupee.
  const adr = txt(m.adr_rue)
    ? {
        rue: txt(m.adr_rue), suite: txt(m.adr_suite), ville: txt(m.adr_ville),
        etat: txt(m.adr_etat), zip: txt(m.adr_zip), pays: txt(m.adr_pays) || "United States",
      }
    : decouperAdresseUS(entite.principal_office_address || entite.mailing_address);

  const { count: nbComptes } = await supabase
    .from("compliance_comptes_etrangers")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("entite_id", entite.id)
    .eq("exercice", annee);

  const fiche = {
    entite: {
      id: entite.id,
      nom: txt(entite.legal_name) || txt(entite.label),
      etat: txt(entite.formation_state),
      date_constitution: entite.formation_date || null,
    },
    annee: annee,
    societe: {
      ein: ein,
      ein_source: einSource,
      adr_rue: adr.rue,
      adr_suite: adr.suite,
      adr_ville: adr.ville,
      adr_etat: adr.etat || txt(entite.formation_state),
      adr_zip: adr.zip,
      adr_pays: adr.pays || "United States",
      activite: txt(m.ri_business_activity),
      naics: txt(m.ri_naics),
    },
    membre: {
      nom: txt(d.nom_patronymique),
      prenoms: txt(d.prenoms),
      date_naissance: d.date_naissance || "",
      lieu_naissance: txt(d.lieu_naissance),
      adresse_rue: txt(d.adresse_rue),
      adresse_code_postal: txt(d.adresse_code_postal),
      adresse_ville: txt(d.adresse_ville),
      adresse_pays: txt(d.adresse_pays) || "France",
      numero_fiscal: txt(d.numero_fiscal) || txt(m.fs_ftin),
      nationalite: txt(m.fs_country_citizenship) || "France",
      pays_residence: txt(m.fs_country_resident) || txt(d.adresse_pays) || "France",
    },
    exercice: {
      actif_total_usd: mapping && mapping.ri_total_assets_usd !== null
        && mapping.ri_total_assets_usd !== undefined ? String(mapping.ri_total_assets_usd) : "",
      taux_eur_usd: m.taux_eur_usd !== null && m.taux_eur_usd !== undefined
        ? String(m.taux_eur_usd) : "",
      pays_activite: txt(m.fs_country_business) || txt(m.ri_country_business) || "France",
    },
    existe: { fiche_exercice: !!mapping, declarant: !!declarant },
    nb_comptes_etrangers: nbComptes || 0,
  };

  if (!entite.formation_date) {
    avertissements.push("La date de constitution n'est pas renseignée dans « Ma société ».");
  }
  return { fiche, avertissements };
}

// Ce qui manque encore, en clair — pour l ecran comme pour le POST.
function controler(b: any): string[] {
  const e: string[] = [];
  const s = b.societe || {};
  const p = b.membre || {};
  const x = b.exercice || {};

  if (txt(s.ein).replace(/\D/g, "").length !== 9) e.push("L'EIN doit compter 9 chiffres.");
  if (!txt(s.adr_rue)) e.push("La rue de l'adresse de la société.");
  if (!txt(s.adr_ville)) e.push("La ville de l'adresse de la société.");
  if (!/^[A-Za-z]{2}$/.test(txt(s.adr_etat))) e.push("L'État de l'adresse, en deux lettres (WY, DE…).");
  if (!/^\d{5}(-\d{4})?$/.test(txt(s.adr_zip))) e.push("Le code ZIP de l'adresse, en cinq chiffres.");
  if (!txt(s.activite)) e.push("L'activité de la société, en anglais.");
  if (!/^\d{6}$/.test(txt(s.naics))) e.push("Le code NAICS, en six chiffres.");

  if (!txt(p.nom)) e.push("Le nom du membre.");
  if (!txt(p.prenoms)) e.push("Le prénom du membre.");
  if (!txt(p.adresse_rue)) e.push("La rue de l'adresse du membre.");
  if (!txt(p.adresse_code_postal)) e.push("Le code postal du membre.");
  if (!txt(p.adresse_ville)) e.push("La ville du membre.");
  if (!txt(p.adresse_pays)) e.push("Le pays de l'adresse du membre.");
  if (!txt(p.numero_fiscal)) e.push("Le numéro fiscal du membre dans son pays.");
  if (!txt(p.nationalite)) e.push("La nationalité du membre.");
  if (!txt(p.pays_residence)) e.push("Le pays de résidence fiscale du membre.");
  // Le 3916 demande la naissance ; il ne concerne que les residents francais.
  if (estFrance(txt(p.pays_residence))) {
    if (!txt(p.date_naissance)) e.push("La date de naissance du membre (pour le 3916).");
    if (!txt(p.lieu_naissance)) e.push("Le lieu de naissance du membre (pour le 3916).");
  }

  const actif = nombreFr(x.actif_total_usd);
  if (actif === null || actif < 0) e.push("L'actif total de la société en fin d'exercice, en dollars.");
  const taux = nombreFr(x.taux_eur_usd);
  if (txt(x.taux_eur_usd) && (taux === null || taux <= 0 || taux >= 10)) {
    e.push("Le taux de change euro-dollar : un nombre comme 1,08.");
  }
  return e;
}

function lireAnnee(v: unknown): number {
  const n = Number(v);
  return n >= 2000 && n <= 2100 ? Math.floor(n) : new Date().getFullYear();
}

export async function GET(req: NextRequest) {
  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const session = sessionCourante();
  const tenantId = session ? session.tenantId : null;
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans société rattachée. Reconnectez-vous." },
      { status: 401 }
    );
  }
  try {
    const u = new URL(req.url);
    const entiteDemandee = txt(u.searchParams.get("entite") || u.searchParams.get("entite_id"));
    const annee = lireAnnee(u.searchParams.get("annee"));

    const { data: entite, error: eEnt } = await lireEntite(tenantId, entiteDemandee);
    if (eEnt) {
      console.error("[fiche-annuelle] lecture entite :", eEnt.message);
      return NextResponse.json({ error: "Lecture de la société impossible." }, { status: 500 });
    }
    if (!entite) {
      return NextResponse.json(
        { error: entiteDemandee ? "Société introuvable." : "Aucune société enregistrée." },
        { status: 404 }
      );
    }

    const { fiche, avertissements } = await construireFiche(tenantId, entite, annee);
    return NextResponse.json({
      ok: true,
      fiche: fiche,
      manquants: controler(fiche),
      avertissements: avertissements,
    });
  } catch (e: any) {
    console.error("[fiche-annuelle] GET :", e && e.message ? e.message : String(e));
    return NextResponse.json(
      { error: "Lecture impossible : " + (e && e.message ? e.message : String(e)) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const session = sessionCourante();
  const tenantId = session ? session.tenantId : null;
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans société rattachée. Reconnectez-vous." },
      { status: 401 }
    );
  }
  try {
    const b = await req.json().catch(() => ({} as any));
    const annee = lireAnnee(b.annee);
    const entiteDemandee = txt(b.entite_id);

    const { data: entite, error: eEnt } = await lireEntite(tenantId, entiteDemandee);
    if (eEnt) {
      console.error("[fiche-annuelle] lecture entite :", eEnt.message);
      return NextResponse.json({ error: "Lecture de la société impossible." }, { status: 500 });
    }
    if (!entite) {
      return NextResponse.json(
        { error: entiteDemandee ? "Société introuvable." : "Aucune société enregistrée." },
        { status: 404 }
      );
    }

    // Tout ce qui manque, en une fois : l ecran l affiche en liste.
    const manquants = controler(b);
    if (manquants.length) {
      return NextResponse.json(
        { error: "Il manque " + manquants.length + " élément(s).", manquants: manquants },
        { status: 400 }
      );
    }

    const s = b.societe || {};
    const p = b.membre || {};
    const x = b.exercice || {};

    const chiffresEin = txt(s.ein).replace(/\D/g, "");
    const ein = chiffresEin.slice(0, 2) + "-" + chiffresEin.slice(2);
    const adr = {
      adr_rue: txt(s.adr_rue),
      adr_suite: txt(s.adr_suite),
      adr_ville: txt(s.adr_ville),
      adr_etat: txt(s.adr_etat).toUpperCase(),
      adr_zip: txt(s.adr_zip),
      adr_pays: txt(s.adr_pays) || "United States",
    };
    const nomSociete = txt(entite.legal_name) || txt(entite.label);
    const activite = txt(s.activite);
    const naics = txt(s.naics);
    const actif = nombreFr(x.actif_total_usd) as number;
    const taux = txt(x.taux_eur_usd) ? nombreFr(x.taux_eur_usd) : null;
    const nationalite = txt(p.nationalite);
    const residence = txt(p.pays_residence);
    const paysActivite = txt(x.pays_activite) || residence;
    const membreNomAdresse = nomAdresseMembre(p);
    const numeroFiscal = txt(p.numero_fiscal);
    const dateConstitution = entite.formation_date || null;
    const premiereAnnee = dateConstitution
      ? Number(String(dateConstitution).slice(0, 4)) === annee
      : false;
    const maintenant = new Date().toISOString();

    // ---- LA FICHE 5472 / 1120 DE L EXERCICE ----
    const champs: any = {
      ri_name: nomSociete,
      ri_address: adresseSociete(adr),
      ri_ein: ein,
      ri_total_assets_usd: actif,
      ri_business_activity: activite,
      ri_naics: naics,
      ri_nb_5472: 1,
      ri_initial_year: premiereAnnee,
      ri_nb_partsviii: 0,
      ri_country_incorp: "United States",
      ri_date_incorp: dateConstitution,
      ri_country_resident: residence,
      ri_country_business: paysActivite,
      ri_is_foreign_owned_de: true,
      fs_name_address: membreNomAdresse,
      fs_ftin: numeroFiscal,
      fs_country_business: paysActivite,
      fs_country_citizenship: nationalite,
      fs_country_resident: residence,
      rp_is_foreign: true,
      rp_name_address: membreNomAdresse,
      rp_ftin: numeroFiscal,
      rp_business_activity: activite,
      rp_naics: naics,
      rp_related_to_reporting: true,
      rp_is_25pct_shareholder: true,
      rp_country_business: paysActivite,
      rp_country_resident: residence,
      f1120_name_address: nomSociete + ", " + adresseSociete(adr),
      f1120_ein: ein,
      f1120_date_incorp: dateConstitution,
      f1120_total_assets_usd: actif,
      f1120_initial_return: premiereAnnee,
      f1120_schedk_q7_foreign_owner: true,
      f1120_schedk_q7_pct: 100,
      f1120_schedk_q7_country: nationalite,
      ...adr,
      updated_at: maintenant,
    };
    // Le taux ne s ecrase que s il est saisi : il est officiel une fois
    // publie par l IRS, et reste « non valide » jusque-la.
    if (taux !== null) {
      champs.taux_eur_usd = taux;
      champs.taux_source = "saisi dans la fiche annuelle le " + maintenant.slice(0, 10);
    }

    const { data: existant, error: eLect } = await supabase
      .from("compliance_5472_mapping")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("entite_id", entite.id)
      .eq("tax_year", annee)
      .maybeSingle();
    if (eLect) throw new Error("lecture de la fiche 5472 : " + eLect.message);

    if (existant) {
      const { error } = await supabase
        .from("compliance_5472_mapping")
        .update(champs)
        .eq("id", existant.id)
        .eq("tenant_id", tenantId);
      if (error) throw new Error("mise à jour de la fiche 5472 : " + error.message);
    } else {
      const { error } = await supabase.from("compliance_5472_mapping").insert({
        id: randomUUID(),
        tenant_id: tenantId,
        entite_id: entite.id,
        tax_year: annee,
        // La qualification retenue par defaut : les avances du membre sont
        // un compte courant d associe (un pret), a faire valider.
        hypothese_qualification: "compte_courant",
        qualification_validee_par_fiscaliste: false,
        p4_l17a_beginning_balance_usd: 0,
        p7_q42a_safe_haven_in_range: false,
        p7_q42b_safe_haven_out_range: false,
        f1120_schedk_q27_digital_assets: false,
        taux_valide: false,
        created_at: maintenant,
        ...champs,
      });
      if (error) throw new Error("création de la fiche 5472 : " + error.message);
    }

    // ---- LE DECLARANT DU 3916 ----
    const declarant: any = {
      nom_patronymique: txt(p.nom).toUpperCase(),
      prenoms: txt(p.prenoms),
      date_naissance: txt(p.date_naissance) || null,
      lieu_naissance: txt(p.lieu_naissance) || null,
      adresse_rue: txt(p.adresse_rue),
      adresse_code_postal: txt(p.adresse_code_postal),
      adresse_ville: txt(p.adresse_ville),
      adresse_pays: txt(p.adresse_pays),
      numero_fiscal: numeroFiscal,
      entreprise_raison_sociale: nomSociete,
      entreprise_adresse: adresseSociete(adr),
      updated_at: maintenant,
    };
    const { data: declExistant, error: eDecl } = await supabase
      .from("compliance_declarant")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("entite_id", entite.id)
      .limit(1)
      .maybeSingle();
    if (eDecl) throw new Error("lecture du déclarant : " + eDecl.message);

    if (declExistant) {
      const { error } = await supabase
        .from("compliance_declarant")
        .update(declarant)
        .eq("id", declExistant.id)
        .eq("tenant_id", tenantId);
      if (error) throw new Error("mise à jour du déclarant : " + error.message);
    } else {
      // Forme juridique, usage et detention : les valeurs par defaut de la
      // table (02, b, a), tranchees le 23/07. Elles restent parametrables.
      const { error } = await supabase.from("compliance_declarant").insert({
        id: randomUUID(),
        tenant_id: tenantId,
        entite_id: entite.id,
        created_at: maintenant,
        ...declarant,
      });
      if (error) throw new Error("création du déclarant : " + error.message);
    }

    // ---- LA RESIDENCE DU MEMBRE DECIDE DU 3916 ----
    // Le tableau de bord n affiche le 3916 qu aux residents fiscaux
    // francais : c est la residence saisie ici qui le decide.
    const resident = estFrance(residence);
    if (entite.fr_tax_resident !== resident) {
      const { error } = await supabase
        .from("compliance_tenants")
        .update({ fr_tax_resident: resident })
        .eq("id", entite.id)
        .eq("tenant_id", tenantId);
      if (error) console.error("[fiche-annuelle] residence :", error.message);
    }

    const { fiche } = await construireFiche(tenantId, { ...entite, fr_tax_resident: resident }, annee);
    return NextResponse.json({
      ok: true,
      message: "Fiche " + annee + " enregistrée. Le 5472, le 1120 et le 7004 sont prêts à être générés"
        + (resident ? ", ainsi que le 3916." : "."),
      fiche: fiche,
      manquants: [],
    });
  } catch (e: any) {
    console.error("[fiche-annuelle] POST :", e && e.message ? e.message : String(e));
    return NextResponse.json(
      { error: "Enregistrement impossible : " + (e && e.message ? e.message : String(e)) },
      { status: 500 }
    );
  }
}
