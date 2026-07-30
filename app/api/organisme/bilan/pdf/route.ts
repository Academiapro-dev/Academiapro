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
  "1": "1  Entreprises pour la formation de leurs salaries",
  "2a": "2a Contrats d apprentissage",
  "2b": "2b Contrats de professionnalisation",
  "2c": "2c Promotion ou reconversion par alternance",
  "2d": "2d Projets de transition professionnelle",
  "2e": "2e Compte personnel de formation",
  "2f": "2f Dispositifs personnes en recherche d emploi",
  "2g": "2g Dispositifs travailleurs non salaries",
  "2h": "2h Plan de developpement des competences",
  "3": "3  Pouvoirs publics pour leurs agents",
  "4": "4  Instances europeennes",
  "5": "5  Etat",
  "6": "6  Conseils regionaux",
  "7": "7  France Travail",
  "8": "8  Autres ressources publiques",
  "9": "9  Personnes a titre individuel et a leurs frais",
  "10": "10 Autres organismes de formation",
  "11": "11 Autres produits",
};

const LIGNE_F1: any = {
  salarie_prive: "a", apprenti: "b", recherche_emploi: "c",
  particulier: "d", autre: "e",
};

const LIBELLE_F1: any = {
  a: "a Salaries d employeurs prives hors apprentis",
  b: "b Apprentis",
  c: "c Personnes en recherche d emploi",
  d: "d Particuliers a leurs propres frais",
  e: "e Autres stagiaires",
};

const LIBELLE_F3: any = {
  a: "a Titre enregistre au RNCP",
  b: "b Certification au repertoire specifique",
  c: "c CQP non enregistre",
  d: "d Autres formations professionnelles",
  e: "e Bilans de competences",
  f: "f Accompagnement a la VAE",
};

// pdf-lib et l encodage WinAnsi ne supportent pas tous les caracteres :
// on retire accents et signes exotiques avant d ecrire.
function ascii(t: any): string {
  return String(t === null || t === undefined ? "" : t)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/€/g, "EUR")
    .replace(/[^\x20-\x7E]/g, " ");
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

    const cadreC: any = {};
    const cadreF1: any = {};
    const cadreF3: any = {};
    const cadreF4: any = {};
    const stagiaires = new Set<string>();
    let heures = 0;
    let produits = 0;

    function ajouter(cible: any, cle: string, h: number, m: number) {
      if (!cible[cle]) cible[cle] = { stagiaires: 0, heures: 0, montant: 0 };
      cible[cle].stagiaires = cible[cle].stagiaires + 1;
      cible[cle].heures = cible[cle].heures + h;
      cible[cle].montant = cible[cle].montant + m;
    }

    for (const i of inscrits || []) {
      stagiaires.add(i.email);
      const fiche = infoDe[i.formation_code || ""] || {};
      const duree = Number(fiche.duree) || 0;
      let prix = Number(i.prix_vente);
      if (!prix || isNaN(prix)) prix = prixDe[i.formation_code || ""] || 0;

      heures = heures + duree;
      produits = produits + prix;

      const cC = (i.dispositif ? LIGNE_C[i.dispositif] : null) || LIGNE_C_PAR_PAYEUR[i.payeur || ""] || "11";
      ajouter(cadreC, cC, duree, prix);
      ajouter(cadreF1, LIGNE_F1[i.statut_stagiaire || ""] || "e", duree, prix);
      ajouter(cadreF3, fiche.objectif === "rncp" ? "a" : fiche.objectif === "rs" ? "b" : "d", duree, prix);
      ajouter(cadreF4, fiche.code_nsf || fiche.domaine || "non renseigne", duree, prix);
    }

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

    function titreCadre(t: string) {
      y = y - 10;
      saut(30);
      page.drawRectangle({ x: 50, y: y - 4, width: 495, height: 20, color: rgb(0.93, 0.93, 0.9) });
      page.drawText(ascii(t), { x: 55, y: y + 2, size: 11, font: gras, color: vert });
      y = y - 28;
    }

    ecrire("BILAN PEDAGOGIQUE ET FINANCIER", 17, gras, vert, 0);
    ecrire("Etat preparatoire - Cerfa 10443*17 - annee " + annee, 11, normal, gris, 0);
    y = y - 8;

    titreCadre("A. IDENTIFICATION DE L ORGANISME");
    ligne("Denomination", (org && org.raison_sociale) || "-");
    ligne("Numero de declaration d activite", (org && org.numero_da) || "-");
    ligne("SIRET", (org && org.siret) || "-");
    ligne("Email de contact", (org && org.email_contact) || "-");

    titreCadre("B. INFORMATIONS GENERALES");
    ligne("Actions de formation a distance", "OUI");
    ligne("Periode", "01/01/" + annee + " au 31/12/" + annee);

    titreCadre("C. ORIGINE DES PRODUITS (hors taxes)");
    const clesC = Object.keys(cadreC).sort();
    for (const k of clesC) {
      ligne(LIBELLE_C[k] || k, cadreC[k].montant.toLocaleString("fr-FR") + " EUR");
    }
    let total2 = 0;
    ["2a", "2b", "2c", "2d", "2e", "2f", "2g", "2h"].forEach(function (k) {
      if (cadreC[k]) total2 = total2 + cadreC[k].montant;
    });
    if (total2 > 0) ligne("2  TOTAL organismes gestionnaires (2a a 2h)", total2.toLocaleString("fr-FR") + " EUR");
    y = y - 4;
    ligne("TOTAL DES PRODUITS", produits.toLocaleString("fr-FR") + " EUR");

    titreCadre("F-1. TYPE DE STAGIAIRES");
    for (const k of Object.keys(cadreF1).sort()) {
      ligne(LIBELLE_F1[k] || k, cadreF1[k].stagiaires + " stagiaire(s) - " + cadreF1[k].heures + " h");
    }

    titreCadre("F-3. OBJECTIF GENERAL DES PRESTATIONS");
    for (const k of Object.keys(cadreF3).sort()) {
      ligne(LIBELLE_F3[k] || k, cadreF3[k].stagiaires + " stagiaire(s) - " + cadreF3[k].heures + " h");
    }

    titreCadre("F-4. SPECIALITES DE FORMATION");
    for (const k of Object.keys(cadreF4).sort()) {
      ligne(k, cadreF4[k].stagiaires + " stagiaire(s) - " + cadreF4[k].heures + " h");
    }

    titreCadre("RECAPITULATIF");
    ligne("Stagiaires distincts", String(stagiaires.size));
    ligne("Inscriptions", String((inscrits || []).length));
    ligne("Total des heures suivies", String(heures));

    const pages = pdf.getPages();
    for (let i = 0; i < pages.length; i = i + 1) {
      pages[i].drawText(
        ascii(
          "Etat preparatoire, non contractuel. La declaration se fait sur monactiviteformation.emploi.gouv.fr. Page " +
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
