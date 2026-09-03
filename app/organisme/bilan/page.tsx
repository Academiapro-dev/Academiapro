import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { sessionCourante } from "../../../../../lib/session";

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

const LIGNE_C: any = {
  apprentissage: "2a", professionnalisation: "2b", reconversion_alternance: "2c",
  transition_pro: "2d", cpf: "2e", demandeur_emploi: "2f",
  travailleur_non_salarie: "2g", plan_developpement: "2h",
  public_europe: "4", public_etat: "5", public_region: "6",
  public_france_travail: "7", public_autre: "8",
};

const LIGNE_C_PAR_PAYEUR: any = {
  entreprise: "1", cpf: "2e", opco: "2h", pouvoirs_publics: "8",
  particulier: "9", organisme_formation: "10", fonds_propres: "11",
};

const LIBELLE_C: any = {
  "1": "1  Entreprises pour la formation de leurs salariés",
  "2a": "2a Contrats d'apprentissage",
  "2b": "2b Contrats de professionnalisation",
  "2c": "2c Promotion ou reconversion par alternance",
  "2d": "2d Projets de transition professionnelle",
  "2e": "2e Compte personnel de formation",
  "2f": "2f Dispositifs personnes en recherche d'emploi",
  "2g": "2g Dispositifs travailleurs non salariés",
  "2h": "2h Plan de développement des compétences",
  "3": "3  Pouvoirs publics pour leurs agents",
  "4": "4  Instances européennes",
  "5": "5  État",
  "6": "6  Conseils régionaux",
  "7": "7  France Travail",
  "8": "8  Autres ressources publiques",
  "9": "9  Personnes à titre individuel et à leurs frais",
  "10": "10 Autres organismes de formation",
  "11": "11 Autres produits",
};

const LIGNE_F1: any = {
  salarie_prive: "a", apprenti: "b", recherche_emploi: "c",
  particulier: "d", autre: "e",
};

const LIBELLE_F1: any = {
  a: "a Salariés d'employeurs privés hors apprentis",
  b: "b Apprentis",
  c: "c Personnes en recherche d'emploi",
  d: "d Particuliers à leurs propres frais",
  e: "e Autres stagiaires",
};

// 🚨 LE CADRE F-3 DU PDF NE CONNAISSAIT QUE TROIS LIGNES SUR SIX — 03/09.
//
// L imprime classait par une condition en cascade : « rncp » -> a,
// « rs » -> b, TOUT LE RESTE -> d. Un bilan de competences (e) et un
// accompagnement a la VAE (f) tombaient donc en « autres formations
// professionnelles », alors que l ecran, lui, les rangeait correctement :
// les deux documents ne racontaient pas la meme chose sur le meme cadre.
//
// La table est desormais la MEME QUE CELLE DE /api/organisme/bilan, et
// c est la seule chose qui garantit que l ecran et l imprime concordent.
// ⚠️ TOUTE LIGNE AJOUTEE ICI DOIT L ETRE DANS LES DEUX FICHIERS.
const LIGNE_F3: any = {
  rncp: "a",
  rs: "b",
  cqp_non_enregistre: "c",
  autre_formation: "d",
  bilan_competences: "e",
  vae: "f",
};

const LIBELLE_F3: any = {
  a: "a Titre enregistré au RNCP",
  b: "b Certification au répertoire spécifique",
  c: "c CQP non enregistré",
  d: "d Autres formations professionnelles",
  e: "e Bilans de compétences",
  f: "f Accompagnement à la VAE",
};

// LES SPECIALITES NSF DU CADRE F-4.
//
// Le PDF affichait le code nu, comme l ecran avant sa correction du 01/09 :
// l organisme qui recopie son bilan ne connait pas les codes par coeur.
const LIBELLE_F4: any = {
  "326": "326 Informatique, numérique, intelligence artificielle",
  "320": "320 Communication, image, multimédia",
  "312": "312 Commerce, vente, marketing",
  "310": "310 Gestion, management, entreprise",
  "313": "313 Finance, banque, assurance",
  "314": "314 Comptabilité, gestion financière",
  "315": "315 Ressources humaines",
  "128": "128 Droit, sciences politiques",
  "331": "331 Santé, soins",
  "332": "332 Travail social, accompagnement",
  "333": "333 Enseignement, formation",
  "334": "334 Accueil, hôtellerie, tourisme, restauration",
  "336": "336 Coiffure, esthétique, bien-être corporel",
  "136": "136 Langues vivantes",
  "135": "135 Langues et civilisations anciennes",
  "413": "413 Développement personnel, relationnel, gestion du stress",
  "414": "414 Organisation, gestion du temps, méthodes de travail",
  "411": "411 Pratiques sportives",
  "343": "343 Nettoyage, sécurité, services aux personnes",
  "230": "230 Bâtiment, travaux publics",
  "200": "200 Technologies industrielles",
};

// 🚨 LA DUREE N EST PAS UN NOMBRE EN BASE — correction du 01/09.
//
// La colonne formations.duree est du texte, et elle est heterogene :
// « 600h », « 120h », « 8h », « 200h minimum ». Number("600h") rend NaN,
// donc l ancien code comptait ZERO HEURE pour toutes les formations : le
// PDF affichait « 1 stagiaire(s) - 0 h » la ou l ecran montrait 600 h.
// Une incoherence entre l ecran et le document telecharge, sur un etat
// destine a preparer une declaration officielle.
//
// ⚠️ NE PAS « NETTOYER » LA COLONNE EN SQL pour contourner ce defaut :
// d autres ecrans affichent la duree telle quelle, « 200h minimum » perdrait
// son sens, et « 120 » sans unite serait pire. On lit les chiffres, on
// laisse la donnee tranquille.
//
// 🆕 03/09 : LES DECIMALES ET LES VIRGULES SONT DESORMAIS LUES. Cette
// version cherchait `\d+` et coupait au premier separateur : « 7,5h »
// donnait 7 ici et 7,5 sur l ecran, dont la fonction, elle, les gerait.
// Le code est maintenant IDENTIQUE a celui de /api/organisme/bilan.
function heuresDe(valeur: any): number {
  if (valeur === null || valeur === undefined) return 0;
  const direct = Number(valeur);
  if (!isNaN(direct) && direct > 0) return direct;

  const m = String(valeur).replace(",", ".").match(/[\d.]+/);
  if (!m) return 0;
  const n = Number(m[0]);
  return isNaN(n) || n <= 0 ? 0 : n;
}

// pdf-lib encode en WinAnsi : les lettres accentuees francaises passent
// tres bien. Seuls quelques signes typographiques n y sont pas — on ne
// retire QUE ceux-la, au lieu de depouiller tout le document de ses
// accents comme le faisait la version precedente.
function ascii(t: any): string {
  return String(t === null || t === undefined ? "" : t)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u20ac/g, "EUR")
    .replace(/\u00b7/g, "-")
    .replace(/[\u2026]/g, "...")
    .replace(/[^\x20-\xFF]/g, " ");
}

// Une heure decimale s ecrit avec une virgule en francais, et sans
// decimale inutile : « 3 h », « 7,5 h ».
function heuresTexte(n: number): string {
  const v = Math.round((Number(n) || 0) * 10) / 10;
  return v.toLocaleString("fr-FR");
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const admin = ADMINS.indexOf(session.email) >= 0;
    let tenant = session.tenantId;
    if (!tenant && admin) tenant = new URL(req.url).searchParams.get("tenant");

    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const brut = new URL(req.url).searchParams.get("annee");
    const annee = brut && /^\d{4}$/.test(brut) ? parseInt(brut, 10) : new Date().getUTCFullYear();
    const debut = new Date(Date.UTC(annee, 0, 1)).toISOString();
    const fin = new Date(Date.UTC(annee + 1, 0, 1)).toISOString();

    const { data: inscrits } = await supabase
      .from("organisme_apprenants")
      .select("email, formation_code, prix_vente, payeur, dispositif, statut_stagiaire")
      .eq("tenant_id", tenant)
      .gte("created_at", debut)
      .lt("created_at", fin)
      .limit(10000);

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
    for (const c of catalogue || []) prixDe[c.formation_code] = Number(c.prix_vente_public) || 0;

    const { data: org } = await supabase
      .from("organismes_formation")
      .select("raison_sociale, numero_da, siret, adresse, telephone, email_contact")
      .eq("tenant_id", tenant)
      .maybeSingle();

    // ══════════════════════════════════════════════════════════════════════
    // 🚨 LES HEURES IMPRIMEES SONT CELLES REELLEMENT SUIVIES — 03/09.
    //
    // MEME DEFAUT QUE LA ROUTE DE L ECRAN, ET SUR LE MEME DOCUMENT. Ce
    // fichier additionnait la DUREE THEORIQUE pour chaque inscrit : un
    // stagiaire ayant valide 2 modules sur 80 d une formation de 120 heures
    // faisait imprimer 120 heures. C est l imprime que l organisme pose a
    // cote de son clavier pour remplir Mon Activite Formation : le chiffre
    // faux serait recopie tel quel dans la declaration.
    //
    // LA REGLE, IDENTIQUE A CELLE DE /api/organisme/bilan :
    //   heures = duree x modules valides / modules au plan
    //
    // ⚠️ LES DEUX FICHIERS DOIVENT RESTER D ACCORD. Un ecart entre l ecran
    // et l imprime est pire qu un chiffre faux partout : l organisme ne sait
    // plus lequel croire. Toute modification de ce calcul se fait ICI ET
    // DANS L AUTRE ROUTE, dans le meme mouvement.
    //
    // ⚠️ UN PLAN VIDE NE PERMET AUCUNE MESURE : on garde la duree theorique
    // et on l annonce dans le recapitulatif, plutot que d ecrire zero et de
    // faire disparaitre une activite reelle.
    // ══════════════════════════════════════════════════════════════════════
    const codesInscrits: string[] = [];
    for (const i of inscrits || []) {
      const c = i.formation_code || "";
      if (c && codesInscrits.indexOf(c) < 0) codesInscrits.push(c);
    }

    const modulesAuPlan: any = {};
    if (codesInscrits.length > 0) {
      const { data: plan } = await supabase
        .from("lms_plans")
        .select("formation_code")
        .in("formation_code", codesInscrits)
        .limit(20000);

      for (const p of plan || []) {
        modulesAuPlan[p.formation_code] = (modulesAuPlan[p.formation_code] || 0) + 1;
      }
    }

    const { data: progression } = await supabase
      .from("progression_apprenants")
      .select("user_email, formation_code, module_cle")
      .eq("tenant_id", tenant)
      .eq("statut", "valide")
      .limit(20000);

    // Un module valide deux fois ne compte qu une fois : on retient les
    // cles distinctes, pas le nombre de lignes.
    const clesValidees: any = {};
    for (const p of progression || []) {
      const cle = String(p.user_email || "").toLowerCase().trim() + "|" + (p.formation_code || "");
      if (!clesValidees[cle]) clesValidees[cle] = new Set<string>();
      clesValidees[cle].add(String(p.module_cle || ""));
    }

    function heuresSuivies(email: any, code: string, duree: number) {
      const auPlan = modulesAuPlan[code] || 0;
      if (!duree) return { heures: 0, mesure: true };
      if (auPlan <= 0) return { heures: duree, mesure: false };

      const jeu = clesValidees[String(email || "").toLowerCase().trim() + "|" + code];
      const valides = jeu ? jeu.size : 0;
      const part = Math.min(valides, auPlan) / auPlan;
      return { heures: Math.round(duree * part * 10) / 10, mesure: true };
    }

    const cadreC: any = {};
    const cadreF1: any = {};
    const cadreF3: any = {};
    const cadreF4: any = {};
    const stagiaires = new Set<string>();
    let heures = 0;
    let heuresTheoriques = 0;
    let produits = 0;
    let sansPlan = 0;

    function ajouter(cible: any, cle: string, h: number, m: number) {
      if (!cible[cle]) cible[cle] = { stagiaires: 0, heures: 0, montant: 0 };
      cible[cle].stagiaires = cible[cle].stagiaires + 1;
      cible[cle].heures = cible[cle].heures + h;
      cible[cle].montant = cible[cle].montant + m;
    }

    for (const i of inscrits || []) {
      stagiaires.add(i.email);
      const code = i.formation_code || "";
      const fiche = infoDe[code] || {};
      const duree = heuresDe(fiche.duree);
      let prix = Number(i.prix_vente);
      if (!prix || isNaN(prix)) prix = prixDe[code] || 0;

      const suivi = heuresSuivies(i.email, code, duree);
      const h = suivi.heures;
      if (!suivi.mesure) sansPlan = sansPlan + 1;

      heures = heures + h;
      heuresTheoriques = heuresTheoriques + duree;
      produits = produits + prix;

      const cC = (i.dispositif ? LIGNE_C[i.dispositif] : null) || LIGNE_C_PAR_PAYEUR[i.payeur || ""] || "11";
      ajouter(cadreC, cC, h, prix);
      ajouter(cadreF1, LIGNE_F1[i.statut_stagiaire || ""] || "e", h, prix);
      ajouter(cadreF3, LIGNE_F3[fiche.objectif || ""] || "d", h, prix);
      ajouter(cadreF4, fiche.code_nsf || fiche.domaine || "non renseigne", h, prix);
    }

    heures = Math.round(heures * 10) / 10;
    heuresTheoriques = Math.round(heuresTheoriques * 10) / 10;

    const pdf = await PDFDocument.create();
    const normal = await pdf.embedFont(StandardFonts.Helvetica);
    const gras = await pdf.embedFont(StandardFonts.HelveticaBold);
    const vert = rgb(0.04, 0.24, 0.18);
    const noir = rgb(0.1, 0.1, 0.1);
    const gris = rgb(0.45, 0.45, 0.45);

    let page = pdf.addPage([595, 842]);
    let y = 800;

    function saut(besoin: number) {
      if (y - besoin < 60) {
        page = pdf.addPage([595, 842]);
        y = 800;
      }
    }

    function ecrire(t: string, taille: number, police: any, couleur: any, decalage: number) {
      saut(taille + 6);
      page.drawText(ascii(t), { x: 50 + decalage, y: y, size: taille, font: police, color: couleur });
      y = y - taille - 6;
    }

    function ligne(gaucheTexte: string, droiteTexte: string) {
      saut(18);
      page.drawText(ascii(gaucheTexte), { x: 55, y: y, size: 10, font: normal, color: noir });
      const largeur = normal.widthOfTextAtSize(ascii(droiteTexte), 10);
      page.drawText(ascii(droiteTexte), { x: 545 - largeur, y: y, size: 10, font: normal, color: vert });
      y = y - 16;
    }

    function note(t: string) {
      saut(16);
      page.drawText(ascii(t), { x: 55, y: y, size: 8.5, font: normal, color: gris });
      y = y - 14;
    }

    function titreCadre(t: string) {
      y = y - 10;
      saut(30);
      page.drawRectangle({ x: 50, y: y - 4, width: 495, height: 20, color: rgb(0.93, 0.93, 0.9) });
      page.drawText(ascii(t), { x: 55, y: y + 2, size: 11, font: gras, color: vert });
      y = y - 28;
    }

    ecrire("BILAN PÉDAGOGIQUE ET FINANCIER", 17, gras, vert, 0);
    ecrire("État préparatoire - Cerfa 10443*17 - année " + annee, 11, normal, gris, 0);
    y = y - 8;

    titreCadre("A. IDENTIFICATION DE L'ORGANISME");
    ligne("Dénomination", (org && org.raison_sociale) || "-");
    ligne("Numéro de déclaration d'activité", (org && org.numero_da) || "-");
    ligne("SIRET", (org && org.siret) || "-");
    ligne("Email de contact", (org && org.email_contact) || "-");

    titreCadre("B. INFORMATIONS GÉNÉRALES");
    ligne("Actions de formation à distance", "OUI");
    ligne("Période", "01/01/" + annee + " au 31/12/" + annee);

    titreCadre("C. ORIGINE DES PRODUITS (hors taxes)");
    const clesC = Object.keys(cadreC).sort();
    for (const k of clesC) {
      ligne(LIBELLE_C[k] || k, cadreC[k].montant.toLocaleString("fr-FR") + " EUR");
    }
    let total2 = 0;
    ["2a", "2b", "2c", "2d", "2e", "2f", "2g", "2h"].forEach(function (k) {
      if (cadreC[k]) total2 = total2 + cadreC[k].montant;
    });
    if (total2 > 0) ligne("2  TOTAL organismes gestionnaires (2a à 2h)", total2.toLocaleString("fr-FR") + " EUR");
    y = y - 4;
    ligne("TOTAL DES PRODUITS", produits.toLocaleString("fr-FR") + " EUR");

    titreCadre("F-1. TYPE DE STAGIAIRES");
    for (const k of Object.keys(cadreF1).sort()) {
      ligne(LIBELLE_F1[k] || k, cadreF1[k].stagiaires + " stagiaire(s) - " + heuresTexte(cadreF1[k].heures) + " h");
    }

    titreCadre("F-3. OBJECTIF GÉNÉRAL DES PRESTATIONS");
    for (const k of Object.keys(cadreF3).sort()) {
      ligne(LIBELLE_F3[k] || k, cadreF3[k].stagiaires + " stagiaire(s) - " + heuresTexte(cadreF3[k].heures) + " h");
    }

    titreCadre("F-4. SPÉCIALITÉS DE FORMATION");
    for (const k of Object.keys(cadreF4).sort()) {
      ligne(LIBELLE_F4[k] || k, cadreF4[k].stagiaires + " stagiaire(s) - " + heuresTexte(cadreF4[k].heures) + " h");
    }

    titreCadre("RÉCAPITULATIF");
    ligne("Stagiaires distincts", String(stagiaires.size));
    ligne("Inscriptions", String((inscrits || []).length));
    ligne("Total des heures suivies", heuresTexte(heures) + " h");
    note("Heures effectivement suivies : durée de la formation rapportée aux modules validés.");
    if (heuresTheoriques > heures) {
      ligne("Pour mémoire, heures prévues au programme", heuresTexte(heuresTheoriques) + " h");
      note("L'écart correspond aux parcours en cours ou interrompus. Le formulaire attend les heures suivies.");
    }
    if (sansPlan > 0) {
      note(
        String(sansPlan) + " inscription(s) portent sur une formation sans plan de modules : "
        + "leur durée prévue a été retenue faute de mesure possible."
      );
    }

    const pages = pdf.getPages();
    for (let i = 0; i < pages.length; i = i + 1) {
      pages[i].drawText(
        ascii(
          "État préparatoire, non contractuel. La déclaration se fait sur monactiviteformation.emploi.gouv.fr. Page " +
          (i + 1) + "/" + pages.length
        ),
        { x: 50, y: 32, size: 7.5, font: normal, color: gris }
      );
    }

    const octets = await pdf.save();

    return new NextResponse(Buffer.from(octets), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="bilan-pedagogique-' + annee + '.pdf"',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
