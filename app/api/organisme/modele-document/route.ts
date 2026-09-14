import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ══════════════════════════════════════════════════════════════════════════
// PRODUIRE UN DOCUMENT DEPUIS UN MODELE ET UNE FICHE — 14/09.
//
// LE CHEMIN COMPLET : le client depose son document (crm_modeles), il
// choisit une fiche de son CRM, les champs connus se remplissent seuls,
// il complete les autres, le PDF est produit, archive, inscrit au registre
// — et il peut partir a la signature par la chaine existante
// (/api/organisme/faire-signer, qui travaille sur document_reference).
//
// 🚨 RIEN N EST RECONSTRUIT. Le PDF reprend la mise en page de
// /api/organisme/document (en-tete de l organisme, reference, pagination,
// mention de signature electronique simple), le meme bucket
// documents-signes et la meme table organisme_documents. Un document
// produit depuis un modele est donc un document comme les autres : il
// s affiche au registre, il se signe, il porte sa preuve.
//
// ⚠️ LE TYPE VAUT « modele ». Les types de organisme_documents sont fixes
// (convention, devis, convocation…) et decident du CONTENU genere par
// l autre route. Ici le contenu vient du client : un seul type suffit, et
// `donnees` porte le code et le titre du modele utilise.
//
// ⚠️ POURQUOI PAS DE PRE-REMPLISSAGE DEVINE. Les champs non reconnus ne
// sont jamais inventes : ils sont demandes. Un mandat ou le prix serait
// devine vaudrait moins qu un mandat vide.
// ══════════════════════════════════════════════════════════════════════════

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "documents-signes";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { global: { fetch: function (url: any, options: any) { return fetch(url, { ...(options || {}), cache: "no-store" }); } } }
);

const MENTION_SIGNATURE = [
  "Ce document peut etre signe electroniquement depuis la plateforme. La signature repose sur",
  "l identification du signataire par son adresse electronique, la saisie d un code a usage unique",
  "adresse a cette adresse, et l horodatage de son acceptation. Sont conservees l empreinte",
  "numerique du document signe, la date et l heure, l adresse de connexion et le texte accepte.",
  "Il s agit d une signature electronique SIMPLE au sens du reglement europeen n 910/2014 dit",
  "eIDAS. Elle est recevable comme preuve entre les parties. Elle n est ni avancee ni qualifiee,",
  "et ne beneficie donc pas de la presomption de fiabilite attachee aux signatures delivrees par",
  "un prestataire de services de confiance qualifie.",
];

function ascii(t: any): string {
  return String(t === null || t === undefined ? "" : t)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u20AC/g, "EUR")
    .replace(/[^\x20-\x7E]/g, " ");
}

function jour(d?: any): string {
  return new Date(d || Date.now()).toLocaleDateString("fr-FR");
}

// La fiche du CRM alimente ces cles. On lit la fiche ENTIERE et on ne
// retient que les colonnes qui existent : la table evolue, le code n a pas
// a le savoir.
function valeursDeLaFiche(f: any): any {
  const v: any = {};
  if (!f) return v;
  const prendre = function (cle: string, ...colonnes: string[]) {
    for (const c of colonnes) {
      if (f[c] !== null && f[c] !== undefined && String(f[c]).trim() !== "") {
        v[cle] = String(f[c]).trim();
        return;
      }
    }
  };
  prendre("nom", "nom", "raison_sociale");
  prendre("prenom", "dirigeant_prenom");
  prendre("patronyme", "dirigeant_nom");
  prendre("societe", "organisme", "raison_sociale");
  prendre("organisme", "organisme", "raison_sociale");
  prendre("email", "email");
  prendre("telephone", "telephone");
  prendre("ville", "ville");
  prendre("adresse", "adresse");
  prendre("code_postal", "code_postal");
  prendre("pays", "pays");
  prendre("siret", "siret");
  prendre("siren", "siren", "siret");
  // Le nom complet quand la fiche porte prenom et nom separes.
  if (!v.nom && (v.prenom || v.patronyme)) {
    v.nom = [v.prenom, v.patronyme].filter(Boolean).join(" ");
  }
  return v;
}

// Une fiche du CRM, par son adresse ou par son identifiant.
// ⚠️ L ADRESSE D ABORD : c est la cle que l ecran connait.
async function lireFiche(tenant: string, cle: string): Promise<any> {
  const c = String(cle || "").trim();
  if (!c) return null;
  // ⚠️ L IDENTIFIANT D ABORD. Beaucoup de fiches venues de LinkedIn n ont
  // pas d adresse electronique : l email ne peut donc pas etre la cle.
  if (c.indexOf("@") > 0) {
    const r = await supabase.from("crm").select("*").eq("tenant_id", tenant).eq("email", c.toLowerCase()).maybeSingle();
    if (r.data) return r.data;
  }
  const r = await supabase.from("crm").select("*").eq("tenant_id", tenant).eq("id", c).maybeSingle();
  return r.data || null;
}

function tenantDe(req: NextRequest, session: any): string | null {
  const admin = session && ADMINS.indexOf(session.email) >= 0;
  let tenant = session ? session.tenantId : null;
  if (!tenant && admin) {
    try { tenant = new URL(req.url).searchParams.get("tenant"); } catch (e) { tenant = null; }
  }
  return tenant;
}

// ---- PREPARER : ce que la fiche remplit, ce qui reste a saisir ----
export async function GET(req: NextRequest) {
  const session = sessionCourante();
  if (!session) return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
  const tenant = tenantDe(req, session);
  if (!tenant) return NextResponse.json({ ok: false, erreur: "Aucun espace rattache." }, { status: 403 });

  const url = new URL(req.url);
  const modeleId = String(url.searchParams.get("modele") || "").trim();
  const ficheId = String(url.searchParams.get("fiche") || "").trim();

  const { data: modele } = await supabase
    .from("crm_modeles")
    .select("id, code, titre, champs, corps")
    .eq("id", modeleId)
    .eq("tenant_id", tenant)
    .maybeSingle();

  if (!modele) return NextResponse.json({ ok: false, erreur: "Modèle introuvable." }, { status: 404 });

  // 🚨 LA FICHE SE RETROUVE PAR SON ADRESSE — 14/09.
  //
  // LE CRM DU CLIENT IDENTIFIE UNE FICHE PAR SON EMAIL, pas par un
  // identifiant : c est ce que fait upsert_prospect, et c est ce que
  // l ecran manipule. Chercher par `id` ne rendait rien. On accepte les
  // deux, l adresse d abord.
  const fiche = await lireFiche(tenant, ficheId);

  const connues = valeursDeLaFiche(fiche);
  connues.date = jour();

  const champs = (Array.isArray(modele.champs) ? modele.champs : []).map(function (c: any) {
    const valeur = connues[c.cle];
    return { cle: c.cle, libelle: c.libelle, valeur: valeur || "", rempli: !!valeur };
  });

  return NextResponse.json({ ok: true, modele: { id: modele.id, titre: modele.titre }, fiche: fiche ? { id: fiche.id, cle: fiche.email, nom: fiche.nom, email: fiche.email } : null, champs: champs });
}

// ---- PRODUIRE LE PDF ----
export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    const tenant = tenantDe(req, session);
    if (!tenant) return NextResponse.json({ ok: false, erreur: "Aucun espace rattache." }, { status: 403 });

    const b = await req.json().catch(function () { return null; });
    if (!b) return NextResponse.json({ ok: false, erreur: "Requête illisible." }, { status: 400 });

    const { data: modele } = await supabase
      .from("crm_modeles")
      .select("id, code, titre, champs, corps")
      .eq("id", String(b.modele_id || ""))
      .eq("tenant_id", tenant)
      .maybeSingle();

    if (!modele) return NextResponse.json({ ok: false, erreur: "Modèle introuvable." }, { status: 404 });

    const fiche = await lireFiche(tenant, String(b.fiche_id || b.fiche || ""));

    // Les valeurs de la fiche, completees par celles saisies a l ecran.
    // ⚠️ LA SAISIE PRIME : si le client corrige une adresse, c est la sienne
    // qui compte, pas celle de la fiche.
    const valeurs: any = valeursDeLaFiche(fiche);
    valeurs.date = jour();
    const saisies = b.valeurs && typeof b.valeurs === "object" ? b.valeurs : {};
    for (const cle of Object.keys(saisies)) {
      const v = String(saisies[cle] === null || saisies[cle] === undefined ? "" : saisies[cle]).trim();
      if (v) valeurs[cle] = v;
    }

    // Le remplissage. Un champ sans valeur laisse un blanc souligne plutot
    // qu une marque {{...}} : le document reste utilisable, et ce qui manque
    // se voit.
    const manquants: string[] = [];
    const corpsRempli = String(modele.corps).replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, function (_m: string, cle: string) {
      const v = valeurs[String(cle).toLowerCase()];
      if (v) return String(v);
      manquants.push(String(cle).toLowerCase());
      return "____________";
    });

    // ⚠️ UNE FICHE SANS ADRESSE NE PEUT PAS RECEVOIR DE SIGNATURE. Le
    // document se produit quand meme — c est la saisie {{email}} du modele,
    // ou l envoi manuel, qui fournira l adresse le moment venu.
    const destinataire = String(b.email || valeurs.email || (fiche && fiche.email) || "").trim().toLowerCase();

    const { data: o } = await supabase
      .from("organismes_formation")
      .select("raison_sociale, numero_da, siret, adresse, telephone, email_contact, numero_tva, representant_nom, representant_qualite, domaine")
      .eq("tenant_id", tenant)
      .maybeSingle();

    const reference = "DOC-" + Date.now().toString().slice(-8);
    const siteSignature = (o && o.domaine) ? String(o.domaine) : "mrcrm.fr";
    const adresseSignature = siteSignature + "/signature/" + reference;

    const pdf = await PDFDocument.create();
    const normal = await pdf.embedFont(StandardFonts.Helvetica);
    const gras = await pdf.embedFont(StandardFonts.HelveticaBold);
    const vert = rgb(0.04, 0.24, 0.18);
    const noir = rgb(0.12, 0.12, 0.12);
    const gris = rgb(0.45, 0.45, 0.45);

    let page = pdf.addPage([595, 842]);
    let y = 795;

    function saut(besoin: number) {
      if (y - besoin < 70) { page = pdf.addPage([595, 842]); y = 795; }
    }

    function paragraphe(texte: string, taille: number, police: any, couleur: any) {
      const mots = ascii(texte).split(" ");
      let ligne = "";
      for (const mot of mots) {
        const essai = ligne ? ligne + " " + mot : mot;
        if (police.widthOfTextAtSize(essai, taille) > 495) {
          saut(taille + 5);
          page.drawText(ligne, { x: 50, y: y, size: taille, font: police, color: couleur });
          y = y - taille - 5;
          ligne = mot;
        } else { ligne = essai; }
      }
      if (ligne) {
        saut(taille + 5);
        page.drawText(ligne, { x: 50, y: y, size: taille, font: police, color: couleur });
        y = y - taille - 5;
      }
    }

    paragraphe(((o && o.raison_sociale) || "").toUpperCase(), 11, gras, vert);
    if (o && o.adresse) paragraphe(o.adresse, 8.5, normal, gris);
    if (o && o.siret) paragraphe("SIRET " + o.siret, 8.5, normal, gris);
    if (o && (o.email_contact || o.telephone)) {
      paragraphe([o.email_contact, o.telephone].filter(Boolean).join(" - "), 8.5, normal, gris);
    }
    y = y - 14;
    page.drawLine({ start: { x: 50, y: y }, end: { x: 545, y: y }, thickness: 1.2, color: vert });
    y = y - 26;

    paragraphe(String(modele.titre).toUpperCase(), 15, gras, vert);
    paragraphe("Reference " + reference + " - etabli le " + jour(), 9, normal, gris);
    y = y - 12;

    // LE CORPS, LIGNE A LIGNE. Les lignes vides du texte deviennent des
    // espaces : la mise en page du client est respectee telle qu il l a
    // ecrite. Une ligne courte tout en majuscules passe en titre.
    const lignes = corpsRempli.split(/\r?\n/);
    for (const l of lignes) {
      const t = l.trim();
      if (!t) { y = y - 7; continue; }
      const titreLigne = t.length < 70 && t === t.toUpperCase() && /[A-Z]/.test(t);
      const sousTitre = /^(article|articles)\b/i.test(t) && t.length < 90;
      if (titreLigne || sousTitre) { y = y - 6; paragraphe(t, 11, gras, vert); y = y - 2; }
      else { paragraphe(t, 10, normal, noir); }
    }

    y = y - 26;
    saut(120);
    paragraphe("Fait le " + jour() + ".", 10, normal, noir);
    y = y - 26;
    saut(70);
    page.drawText(ascii("Pour " + ((o && o.raison_sociale) || "la societe")), { x: 50, y: y, size: 9.5, font: gras, color: noir });
    page.drawText(ascii("Le client"), { x: 330, y: y, size: 9.5, font: gras, color: noir });
    y = y - 12;
    if (o && o.representant_nom) {
      page.drawText(ascii(o.representant_nom + (o.representant_qualite ? ", " + o.representant_qualite : "")), { x: 50, y: y, size: 8.5, font: normal, color: gris });
    }
    page.drawText(ascii(valeurs.nom || destinataire || ""), { x: 330, y: y, size: 8.5, font: normal, color: gris });
    y = y - 40;
    page.drawLine({ start: { x: 50, y: y }, end: { x: 250, y: y }, thickness: 0.7, color: gris });
    page.drawLine({ start: { x: 330, y: y }, end: { x: 530, y: y }, thickness: 0.7, color: gris });

    y = y - 34;
    saut(150);
    page.drawLine({ start: { x: 50, y: y }, end: { x: 545, y: y }, thickness: 0.5, color: gris });
    y = y - 16;
    paragraphe("Signature electronique", 9, gras, vert);
    y = y - 2;
    for (const l of MENTION_SIGNATURE) {
      saut(12);
      page.drawText(ascii(l), { x: 50, y: y, size: 7.5, font: normal, color: gris });
      y = y - 10;
    }
    y = y - 10;
    saut(34);
    page.drawText(ascii("Pour signer ce document en ligne :"), { x: 50, y: y, size: 8.5, font: normal, color: noir });
    y = y - 13;
    const largeurLien = gras.widthOfTextAtSize(ascii(adresseSignature), 10);
    page.drawText(ascii(adresseSignature), { x: 50, y: y, size: 10, font: gras, color: vert });
    const annotation = pdf.context.obj({
      Type: "Annot", Subtype: "Link",
      Rect: [48, y - 3, 50 + largeurLien + 2, y + 12],
      Border: [0, 0, 0],
      A: pdf.context.obj({ Type: "Action", S: "URI", URI: pdf.context.obj("https://" + adresseSignature) }),
    });
    page.node.addAnnot(pdf.context.register(annotation));

    const pages = pdf.getPages();
    for (let i = 0; i < pages.length; i = i + 1) {
      pages[i].drawText(ascii(((o && o.raison_sociale) || "") + " - " + reference + " - page " + (i + 1) + "/" + pages.length), { x: 50, y: 34, size: 7.5, font: normal, color: gris });
    }

    const octets = Buffer.from(await pdf.save());
    const empreinte = crypto.createHash("sha256").update(octets).digest("hex");
    const chemin = String(tenant) + "/" + reference + ".pdf";

    const up = await supabase.storage.from(BUCKET).upload(chemin, octets, { contentType: "application/pdf", upsert: true });
    if (up.error) return NextResponse.json({ ok: false, erreur: "Archivage impossible : " + up.error.message }, { status: 500 });

    await supabase.from("organisme_documents").insert({
      tenant_id: tenant,
      type: "modele",
      stagiaire_email: destinataire || null,
      formation_code: null,
      reference: reference,
      pdf_chemin: chemin,
      pdf_sha256: empreinte,
      pdf_octets: octets.length,
      donnees: {
        modele_id: modele.id, modele_code: modele.code, modele_titre: modele.titre,
        fiche_id: fiche ? fiche.id : null, fiche_email: fiche ? fiche.email : null,
        valeurs: valeurs, champs_manquants: manquants,
      },
    });

    const { data: signe } = await supabase.storage.from(BUCKET).createSignedUrl(chemin, 3600);

    return NextResponse.json({
      ok: true,
      reference: reference,
      titre: modele.titre,
      url: signe ? signe.signedUrl : null,
      champs_manquants: manquants,
      destinataire: destinataire || null,
      message: manquants.length > 0
        ? "Document produit — " + manquants.length + " champ(s) laissé(s) en blanc."
        : "Document produit et archivé.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
