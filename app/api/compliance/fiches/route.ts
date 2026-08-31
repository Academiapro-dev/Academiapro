import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ---------------------------------------------------------------------------
// LES FICHES DE PREPARATION — EN PDF — 31/08.
//
// 🚨 POURQUOI EN PDF ET NON EN HTML. Un fichier HTML s ouvre dans un
// navigateur, ne s imprime pas proprement, et surtout NE SE TRANSMET PAS A
// UN CLIENT comme un document. Un gestionnaire qui envoie une fiche a son
// client attend un PDF — c est ce qu il ferait avec n importe quel autre
// document professionnel.
//
// 🚨 POURQUOI pdf-lib ET NON UN RENDU HTML. Convertir du HTML en PDF
// demanderait Puppeteer et Chromium : trop lourds pour Vercel, ou la
// fonction dispose de secondes et de memoire comptees. pdf-lib est deja
// installe — il sert au 5472 et au 1120 — et compose le document ligne a
// ligne. Moins de mise en forme, mais un vrai fichier, sans dependance
// nouvelle.
//
// ⚠️ CE QUE CES FICHES SONT. Trois obligations du catalogue ne se deposent
// PAS sur un formulaire pre-rempli : le BOI se saisit en ligne, le
// W-8BEN-E depend d un statut FATCA que l outil ne connait pas, et le
// registered agent est un contrat a renouveler. La fiche dit ou aller,
// quoi preparer, et ce qui est en jeu.
// ---------------------------------------------------------------------------

const TYPES = ["boi", "w8bene", "registered_agent"];

// Mise en page. A4 en points : 595 x 842.
const PAGE_L = 595;
const PAGE_H = 842;
const MARGE = 50;
const LARGEUR_UTILE = PAGE_L - MARGE * 2;

const VERT = rgb(0.039, 0.239, 0.18);
const NOIR = rgb(0.1, 0.1, 0.1);
const GRIS = rgb(0.42, 0.42, 0.42);
const ROUGE = rgb(0.65, 0.11, 0.11);

function origineLegitime(req: NextRequest): boolean {
  const origine = req.headers.get("origin") || "";
  const referent = req.headers.get("referer") || "";
  return (
    origine.includes("academiapro.fr") || referent.includes("academiapro.fr") ||
    origine.includes("vercel.app") || referent.includes("vercel.app") ||
    origine.includes("localhost") || referent.includes("localhost")
  );
}

function fr(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

function dateFR(v: unknown): string {
  if (!v) return "—";
  const s = String(v).slice(0, 10);
  const p = s.split("-");
  if (p.length !== 3) return s;
  return p[2] + "/" + p[1] + "/" + p[0];
}

// ⚠️ LES POLICES STANDARD DE pdf-lib N ACCEPTENT QUE LE LATIN-1. Un
// caractere hors de cette table — apostrophe typographique, tiret cadratin,
// espace insecable — fait ECHOUER l ecriture avec une erreur peu lisible.
// On normalise donc tout ce qui est ecrit, sans exception.
function sanitize(t: unknown): string {
  return String(t === null || t === undefined ? "" : t)
    .replace(/[\u2018\u2019\u201B]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014\u2015]/g, "-")
    .replace(/[\u2026]/g, "...")
    .replace(/[\u00A0\u202F\u2009]/g, " ")
    .replace(/[\u20AC]/g, "EUR")
    .replace(/[^\x20-\xFF\n]/g, "");
}

// Le document se compose ligne a ligne. Cette fabrique tient la position
// courante et cree une page quand le bas est atteint.
function creerRedacteur(doc: PDFDocument, police: any, policeGrasse: any) {
  let page = doc.addPage([PAGE_L, PAGE_H]);
  let y = PAGE_H - MARGE;

  function nouvellePage() {
    page = doc.addPage([PAGE_L, PAGE_H]);
    y = PAGE_H - MARGE;
  }

  function place(hauteur: number) {
    if (y - hauteur < MARGE + 30) nouvellePage();
  }

  // Decoupe un texte a la largeur utile. Sans cela, une ligne longue
  // deborde de la page sans que rien ne le signale.
  function couper(texte: string, taille: number, f: any, largeur: number): string[] {
    const mots = sanitize(texte).split(/\s+/);
    const lignes: string[] = [];
    let courante = "";

    for (const mot of mots) {
      const essai = courante ? courante + " " + mot : mot;
      let l = 0;
      try {
        l = f.widthOfTextAtSize(essai, taille);
      } catch (e) {
        l = essai.length * taille * 0.5;
      }
      if (l > largeur && courante) {
        lignes.push(courante);
        courante = mot;
      } else {
        courante = essai;
      }
    }
    if (courante) lignes.push(courante);
    return lignes;
  }

  return {
    titre(texte: string) {
      place(40);
      page.drawText(sanitize(texte), {
        x: MARGE, y: y - 20, size: 18, font: policeGrasse, color: VERT,
      });
      y = y - 26;
      page.drawLine({
        start: { x: MARGE, y: y },
        end: { x: PAGE_L - MARGE, y: y },
        thickness: 2,
        color: VERT,
      });
      y = y - 22;
    },

    sousTitre(texte: string) {
      place(30);
      y = y - 10;
      page.drawText(sanitize(texte), {
        x: MARGE, y: y - 14, size: 13, font: policeGrasse, color: VERT,
      });
      y = y - 26;
    },

    paragraphe(texte: string, couleur?: any) {
      const lignes = couper(texte, 10, police, LARGEUR_UTILE);
      for (const l of lignes) {
        place(16);
        page.drawText(l, {
          x: MARGE, y: y - 10, size: 10, font: police, color: couleur || NOIR,
        });
        y = y - 15;
      }
      y = y - 6;
    },

    // Encadre d avertissement : ce qui coute cher si on l ignore.
    encadre(texte: string, couleur: any) {
      const lignes = couper(texte, 10, police, LARGEUR_UTILE - 16);
      const hauteur = lignes.length * 15 + 14;
      place(hauteur + 10);
      page.drawRectangle({
        x: MARGE, y: y - hauteur, width: 4, height: hauteur, color: couleur,
      });
      let yy = y - 4;
      for (const l of lignes) {
        page.drawText(l, {
          x: MARGE + 14, y: yy - 10, size: 10, font: police, color: NOIR,
        });
        yy = yy - 15;
      }
      y = y - hauteur - 10;
    },

    ligneTableau(libelle: string, valeur: string) {
      place(20);
      page.drawText(sanitize(libelle), {
        x: MARGE, y: y - 11, size: 10, font: policeGrasse, color: NOIR,
      });
      const lignes = couper(valeur, 10, police, LARGEUR_UTILE - 200);
      let yy = y;
      for (const l of lignes) {
        page.drawText(l, {
          x: MARGE + 200, y: yy - 11, size: 10, font: police, color: NOIR,
        });
        yy = yy - 14;
      }
      y = Math.min(y - 17, yy - 3);
    },

    puce(texte: string) {
      const lignes = couper(texte, 10, police, LARGEUR_UTILE - 16);
      let premiere = true;
      for (const l of lignes) {
        place(15);
        if (premiere) {
          page.drawText("-", { x: MARGE + 4, y: y - 10, size: 10, font: police, color: NOIR });
          premiere = false;
        }
        page.drawText(l, {
          x: MARGE + 16, y: y - 10, size: 10, font: police, color: NOIR,
        });
        y = y - 14;
      }
    },

    espace(n: number) {
      y = y - n;
    },

    piedDePage(texte: string) {
      const pages = doc.getPages();
      for (let i = 0; i < pages.length; i++) {
        pages[i].drawText(sanitize(texte + "  —  page " + (i + 1) + " sur " + pages.length), {
          x: MARGE, y: 30, size: 8, font: police, color: GRIS,
        });
      }
    },
  };
}

// ---- FICHE BOI FINCEN ------------------------------------------------------
async function ficheBOI(doc: PDFDocument, p: any, pg: any, e: any, m: any, annee: number) {
  const r = creerRedacteur(doc, p, pg);
  const date = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });

  r.titre("Declaration des beneficiaires effectifs - FinCEN BOI");
  r.paragraphe("Societe : " + fr(e.legal_name || e.label) + "   |   Fiche generee le " + date, GRIS);

  r.encadre(
    "Ce que c'est. Le Beneficial Ownership Information Report identifie aupres du "
    + "Tresor americain les personnes physiques qui controlent reellement la societe. "
    + "Ce n'est pas une declaration fiscale : aucun montant n'y figure, aucun impot "
    + "n'en decoule. C'est un registre de transparence.",
    VERT
  );

  r.encadre(
    "Le cadre a beaucoup bouge. L'obligation a ete suspendue, retablie, puis "
    + "restreinte a plusieurs reprises depuis 2024, et son perimetre a notamment ete "
    + "modifie pour les societes constituees aux Etats-Unis. Verifiez l'etat du droit "
    + "sur fincen.gov avant tout depot : cette fiche ne peut pas se substituer a la "
    + "regle en vigueur le jour ou vous la lisez.",
    ROUGE
  );

  r.sousTitre("Informations de la societe");
  r.ligneTableau("Denomination legale", fr(e.legal_name));
  r.ligneTableau("Nom d'usage", fr(e.label));
  r.ligneTableau("Etat de constitution", fr(e.formation_state));
  r.ligneTableau("Date de constitution", dateFR(e.formation_date));
  r.ligneTableau("Numero d'immatriculation", fr(e.wy_filing_id));
  r.ligneTableau("EIN", fr(m ? m.ri_ein : null));
  r.ligneTableau("Adresse principale", fr(e.principal_office_address || e.mailing_address));

  r.sousTitre("Ce que le portail demandera pour chaque beneficiaire effectif");
  r.paragraphe(
    "Est beneficiaire effectif toute personne physique qui detient au moins 25 % de "
    + "la societe, ou qui exerce sur elle un controle substantiel. Le gerant d'une "
    + "Single-Member LLC reunit generalement les deux criteres."
  );
  r.puce("Nom complet, tel qu'il figure sur la piece d'identite");
  r.puce("Date de naissance");
  r.puce("Adresse personnelle complete - pas une adresse de domiciliation");
  r.puce("Numero d'un document d'identite en cours de validite (passeport ou permis)");
  r.puce("Une image lisible de ce document");
  r.espace(10);

  r.encadre(
    "Ces donnees sont personnelles. Elles ne transitent pas par cet outil et ne "
    + "doivent pas y etre stockees : elles se saisissent directement sur le portail "
    + "de FinCEN, par la personne concernee ou avec son accord explicite.",
    ROUGE
  );

  r.sousTitre("Depot");
  r.paragraphe("Le depot est gratuit et se fait uniquement en ligne : boiefiling.fincen.gov");
  r.paragraphe(
    "Apres le depot, conservez l'accuse de reception au coffre. Toute modification "
    + "ulterieure - changement d'adresse, de gerant, de denomination - doit etre "
    + "declaree dans les trente jours."
  );

  r.piedDePage("Fiche de preparation BOI " + annee + " - aide a la saisie, ne constitue ni un depot ni un conseil juridique");
  return "Fiche BOI FinCEN " + annee + " - " + e.label;
}

// ---- FICHE W-8BEN-E --------------------------------------------------------
async function ficheW8(doc: PDFDocument, p: any, pg: any, e: any, m: any, annee: number) {
  const r = creerRedacteur(doc, p, pg);
  const date = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });

  r.titre("Certificat de statut du beneficiaire effectif - W-8BEN-E");
  r.paragraphe("Societe : " + fr(e.legal_name || e.label) + "   |   Fiche generee le " + date, GRIS);

  r.encadre(
    "A qui il se donne. Le W-8BEN-E ne se depose jamais aupres de l'IRS : il se "
    + "remet a celui qui verse les fonds - banque, place de marche, plateforme de "
    + "paiement, client americain. Sans lui, le payeur applique une retenue a la "
    + "source de 30 % sur les montants verses.",
    VERT
  );

  r.sousTitre("Informations a reporter - Partie I");
  r.ligneTableau("Ligne 1 - Nom de l'organisation", fr(e.legal_name || e.label));
  r.ligneTableau("Ligne 2 - Pays de constitution", "United States (" + fr(e.formation_state) + ")");
  r.ligneTableau("Ligne 6 - Adresse de residence", fr(e.principal_office_address || e.mailing_address));
  r.ligneTableau("Ligne 8 - EIN", fr(m ? m.ri_ein : null));
  r.ligneTableau("Residence fiscale du membre", fr(e.member_residence));

  r.encadre(
    "Les cases de statut ne sont pas pre-remplies, et c'est volontaire. Les lignes 4 "
    + "et 5 determinent le statut de l'entite au regard des chapitres 3 et 4 du code "
    + "fiscal americain. Ce choix depend de l'activite reelle, de la structure de "
    + "detention et de la nature des revenus - trois elements que cet outil ne "
    + "connait pas. Un statut coche a tort engage le signataire sous peine de "
    + "parjure : il vaut mieux une case vide qu'une case fausse.",
    ROUGE
  );

  r.sousTitre("Les deux cases a determiner");
  r.paragraphe(
    "Ligne 4 - Statut chapitre 3. Pour une LLC a membre unique traitee comme entite "
    + "transparente, le choix se porte generalement sur Disregarded entity - mais une "
    + "LLC ayant opte pour l'imposition comme societe coche Corporation. L'option "
    + "retenue lors de la demande d'EIN fait foi."
  );
  r.paragraphe(
    "Ligne 5 - Statut FATCA. Pour une societe non financiere exercant une activite "
    + "operationnelle, le choix usuel est Active NFFE (partie XXV), qui suppose que "
    + "moins de la moitie des revenus et des actifs sont passifs. Une societe de "
    + "portefeuille releve plutot de Passive NFFE (partie XXVI), qui impose de "
    + "declarer les proprietaires americains substantiels."
  );

  r.sousTitre("Convention fiscale - Partie III");
  r.paragraphe(
    "Si le membre reside dans un pays lie aux Etats-Unis par une convention fiscale"
    + (e.member_residence ? " (residence declaree : " + fr(e.member_residence) + ")" : "")
    + ", la partie III permet de reduire ou d'annuler la retenue a la source. Elle "
    + "exige d'indiquer l'article invoque et le taux demande - a faire confirmer "
    + "avant signature."
  );

  r.sousTitre("Formulaire officiel");
  r.paragraphe("Le formulaire vierge et ses instructions : irs.gov/forms-pubs/about-form-w-8-ben-e");
  r.paragraphe(
    "Validite : trois ans a compter de la signature, sauf changement de situation. "
    + "Un nouveau formulaire doit etre fourni dans les trente jours si l'une des "
    + "certifications cesse d'etre exacte."
  );

  r.piedDePage("Fiche de preparation W-8BEN-E " + annee + " - aide a la saisie, ne constitue ni un depot ni un conseil fiscal");
  return "Fiche W-8BEN-E " + annee + " - " + e.label;
}

// ---- FICHE REGISTERED AGENT ------------------------------------------------
async function ficheAgent(doc: PDFDocument, p: any, pg: any, e: any, annee: number) {
  const r = creerRedacteur(doc, p, pg);
  const date = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });

  r.titre("Maintien du registered agent - " + fr(e.formation_state));
  r.paragraphe("Societe : " + fr(e.legal_name || e.label) + "   |   Fiche generee le " + date, GRIS);

  r.encadre(
    "Ce qu'il est. Le registered agent est l'adresse officielle de la societe dans "
    + "son Etat de constitution. C'est la que sont adresses les courriers de "
    + "l'administration et les actes de procedure. Sa presence est une condition de "
    + "l'existence legale de la societe, pas un service accessoire.",
    VERT
  );

  r.encadre(
    "Ce qui arrive s'il lapse. Sans agent enregistre valide, l'Etat place la societe "
    + "en defaut administratif, puis prononce sa dissolution. Le retablissement est "
    + "possible mais payant, et la periode de defaut reste inscrite au registre "
    + "public - ce qu'une banque consulte avant d'ouvrir un compte.",
    ROUGE
  );

  r.sousTitre("Situation actuelle");
  r.ligneTableau("Agent enregistre", fr(e.registered_agent_name));
  r.ligneTableau("Etat de constitution", fr(e.formation_state));
  r.ligneTableau("Numero d'immatriculation", fr(e.wy_filing_id));
  r.ligneTableau("Adresse postale declaree", fr(e.mailing_address));
  r.ligneTableau("Adresse du siege declaree", fr(e.principal_office_address));

  if (!e.registered_agent_name) {
    r.encadre(
      "Aucun agent n'est renseigne pour cette societe. Verifiez aupres du registre de "
      + "l'Etat qui remplit ce role, puis completez la fiche : sans cette information, "
      + "aucune relance ne peut etre utile.",
      ROUGE
    );
  }

  r.sousTitre("A verifier chaque annee");
  r.puce("Le contrat avec l'agent est-il renouvele et paye pour l'exercice a venir ?");
  r.puce("L'agent transfere-t-il effectivement le courrier recu ? Un agent qui ne transmet pas est aussi dangereux qu'une absence d'agent.");
  r.puce("L'adresse figurant au registre de l'Etat correspond-elle a celle du contrat ?");
  r.puce("Le prelevement automatique eventuel est-il toujours actif ?");
  r.espace(12);

  r.paragraphe(
    "En cas de changement d'agent : le changement se declare aupres de l'Etat, "
    + "generalement contre une taxe modique. Ne pas resilier l'ancien contrat avant "
    + "que le nouveau ne soit enregistre - une journee sans agent suffit a declencher "
    + "le defaut."
  );

  r.piedDePage("Fiche de preparation registered agent " + annee + " - aide au suivi, ne constitue pas un conseil juridique");
  return "Fiche registered agent " + annee + " - " + e.label;
}

export async function POST(req: NextRequest) {
  if (!origineLegitime(req)) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const session = sessionCourante();
  const tenantId = session ? session.tenantId : null;
  if (!tenantId) {
    return NextResponse.json(
      { error: "Session sans societe rattachee. Reconnectez-vous." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json().catch(() => ({} as any));
    const type = String(body.type || "").trim().toLowerCase();
    const annee = Number(body.year) || new Date().getFullYear();
    const entiteDemandee = String(body.entite_id || "").trim();

    if (TYPES.indexOf(type) < 0) {
      return NextResponse.json(
        { error: "Type de fiche inconnu. Attendu : " + TYPES.join(", ") },
        { status: 400 }
      );
    }

    // ---- LA SOCIETE CONCERNEE ----
    //
    // 🚨 L IDENTIFIANT RECU N EST PAS UNE AUTORISATION : il est cherche AVEC
    // le filtre tenant_id de la session. Une societe d un autre
    // gestionnaire est simplement introuvable.
    let requeteEntite = supabase
      .from("compliance_tenants")
      .select("*")
      .eq("tenant_id", tenantId);

    if (entiteDemandee) {
      requeteEntite = requeteEntite.eq("id", entiteDemandee);
    }

    const { data: entite, error: eEntite } = await requeteEntite
      .order("label", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (eEntite) {
      console.error("[fiches] lecture entite :", eEntite.message);
      return NextResponse.json({ error: "Lecture impossible." }, { status: 500 });
    }

    if (!entite) {
      return NextResponse.json(
        { error: entiteDemandee ? "Societe introuvable." : "Aucune societe enregistree." },
        { status: 404 }
      );
    }

    const entiteId = entite.id;

    // Le mapping porte l EIN. Son absence n empeche pas la generation : la
    // fiche le signale par un tiret, ce qui est une information en soi.
    let mapping: any = null;
    const essai = await supabase
      .from("compliance_5472_mapping")
      .select("ri_ein")
      .eq("tenant_id", tenantId)
      .eq("entite_id", entiteId)
      .eq("tax_year", annee)
      .maybeSingle();

    if (!essai.error && essai.data) {
      mapping = essai.data;
    } else {
      const { data: m2 } = await supabase
        .from("compliance_5472_mapping")
        .select("ri_ein")
        .eq("tenant_id", tenantId)
        .eq("tax_year", annee)
        .maybeSingle();
      mapping = m2;
    }

    const doc = await PDFDocument.create();
    const police = await doc.embedFont(StandardFonts.Helvetica);
    const policeGrasse = await doc.embedFont(StandardFonts.HelveticaBold);

    let titre: string;
    let ruleCode: string;
    let docType: string;

    if (type === "boi") {
      titre = await ficheBOI(doc, police, policeGrasse, entite, mapping, annee);
      ruleCode = "FINCEN_BOI";
      docType = "fiche_boi";
    } else if (type === "w8bene") {
      titre = await ficheW8(doc, police, policeGrasse, entite, mapping, annee);
      ruleCode = "US_W8BENE";
      docType = "fiche_w8bene";
    } else {
      titre = await ficheAgent(doc, police, policeGrasse, entite, annee);
      ruleCode = "WY_REGISTERED_AGENT";
      docType = "fiche_registered_agent";
    }

    doc.setTitle(titre);
    const bytes = await doc.save();

    const { data: ver } = await supabase.rpc("compliance_next_doc_version", {
      p_tenant_id: tenantId,
      p_doc_type: docType,
    });
    const version = ver || 1;

    const chemin = tenantId + "/" + entiteId + "/" + docType + "_" + annee
      + "_v" + version + ".pdf";

    const { error: upErr } = await supabase.storage
      .from("compliance-docs")
      .upload(chemin, Buffer.from(bytes), {
        contentType: "application/pdf",
        upsert: true,
      });

    if (upErr) {
      console.error("[fiches] depot au coffre :", upErr.message);
      return NextResponse.json({ error: "Depot au coffre impossible." }, { status: 500 });
    }

    // entite_id est indispensable : le tableau de bord filtre dessus, un
    // document sans lui serait archive mais invisible a l ecran.
    await supabase.from("compliance_documents").insert({
      tenant_id: tenantId,
      entite_id: entiteId,
      rule_code: ruleCode,
      doc_type: docType,
      title: titre,
      version: version,
      storage_path: "compliance-docs/" + chemin,
      mime_type: "application/pdf",
    });

    const { data: signed } = await supabase.storage
      .from("compliance-docs")
      .createSignedUrl(chemin, 3600);

    return NextResponse.json({
      success: true,
      tenant_id: tenantId,
      entite_id: entiteId,
      societe: entite.label,
      type: type,
      annee: annee,
      version: version,
      path: chemin,
      url: signed?.signedUrl ?? null,
      titre: titre,
    });
  } catch (e: any) {
    console.error("[fiches] exception :", String(e && e.message ? e.message : e));
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
