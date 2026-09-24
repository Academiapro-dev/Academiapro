import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, PDFName, PDFDict } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import { sessionCourante } from "../../../../../lib/session";
import { origineLegitime } from "../../../../../lib/origine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CERFA = "public/cerfa/3916_5173.pdf";

// ---------------------------------------------------------------------------
// 🚨 CORRIGE LE 31/08 — LA ROUTE LA PLUS EXPOSEE DU MODULE, ET SA JUMELLE
// f3916/generate ETAIT DEJA JUSTE. La meme erreur qu a f5472/generate, dans
// deux fichiers voisins : a chaque fois, l une des deux versions a ete
// corrigee et l autre oubliee.
//
// LE DEFAUT. Aucune session n etait exigee, et le tenant_id etait pris DANS
// LE CORPS DE LA REQUETE. Il suffisait donc de poster { tenant_id: "..." }
// pour obtenir le CERFA 3916 rempli d une autre personne.
//
// CE QUE CE PDF CONTIENT, ET C EST LA QUE C EST GRAVE : la table
// compliance_declarant porte le NOM PATRONYMIQUE, LES PRENOMS, LA DATE ET
// LE LIEU DE NAISSANCE et L ADRESSE PERSONNELLE du declarant. S y ajoutent
// ses COMPTES BANCAIRES A L ETRANGER avec leurs numeros et leur organisme.
//
// Ce ne sont pas seulement des donnees fiscales : ce sont des donnees
// personnelles au sens du RGPD, et de quoi usurper une identite. Un
// identifiant devine ou apercu suffisait.
//
// LA REGLE, LA MEME QUE PARTOUT : le tenant vient de la SESSION, jamais de
// la requete. Ce que le navigateur envoie n est jamais une autorisation.
//
// ⚠️ compte_id RESTE LU DANS LE CORPS — c est normal et sans danger : il ne
// sert qu a choisir un compte PARMI CEUX DU TENANT DE LA SESSION, puisque
// la requete filtre d abord sur tenant_id.
// ---------------------------------------------------------------------------

function jour(d: string | null): string {
  if (!d) return "";
  return d.slice(8, 10);
}
function mois(d: string | null): string {
  if (!d) return "";
  return d.slice(5, 7);
}
function annee(d: string | null): string {
  if (!d) return "";
  return d.slice(0, 4);
}
// ---------------------------------------------------------------------------
// LES ACCENTS SONT GARDES — 24/09.
//
// ⛔ L ANCIENNE FONCTION sansAccent RETIRAIT TOUT CE QUI N ETAIT PAS ASCII :
// le 3916 de Meridian portait « 15/03/1980 a Lyon » et « Rue de la
// Republique ». Un formulaire de l administration francaise sans accents fait
// amateur, et le lieu de naissance est une donnee d identite.
//
// La police Helvetica du PDF encode tout le latin-1 (e accent aigu, a accent
// grave, c cedille, guillemets francais...). Seuls les caracteres HORS
// latin-1 posaient probleme : ils sont ramenes a leur equivalent (apostrophe
// typographique -> apostrophe, tiret long -> tiret, oe lie -> oe), ou, a
// defaut, a leur lettre sans accent. Rien ne peut donc faire echouer le PDF.
// ---------------------------------------------------------------------------
function texteCerfa(v: any): string {
  if (v === null || v === undefined) return "";
  const s = String(v)
    .normalize("NFC")
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u0153/g, "oe")
    .replace(/\u0152/g, "OE")
    .replace(/[\u00A0\u202F]/g, " ");
  let sortie = "";
  for (const ch of s) {
    if (/[\x20-\x7E\u00A1-\u00FF]/.test(ch)) {
      sortie += ch;
    } else {
      sortie += ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "");
    }
  }
  return sortie.trim();
}

// L adresse d une LLC americaine, avec son pays. Le formulaire demande
// « n°, rue, ville et pays » ; la fiche annuelle ecrit l adresse sans pays.
function avecPays(adresse: any, pays: string): string {
  const a = texteCerfa(adresse);
  if (!a) return "";
  if (/(unis|usa|u\.s\.a|united states)/i.test(a)) return a;
  return a + ", " + pays;
}

export async function POST(req: NextRequest) {
  const avertissements: string[] = [];
  try {
    if (!origineLegitime(req)) {
      return NextResponse.json({ ok: false, erreur: "Acces refuse" }, { status: 403 });
    }

    // L ORGANISME VIENT DE LA SESSION SIGNEE, ET DE NULLE PART AILLEURS.
    // Un tenant_id present dans le corps de la requete est desormais IGNORE.
    const session = sessionCourante();
    const tenantId = session ? session.tenantId : null;
    if (!tenantId) {
      return NextResponse.json(
        { ok: false, erreur: "Session sans societe rattachee. Reconnectez-vous." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const compteId = body.compte_id;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return NextResponse.json(
        { ok: false, erreur: "Variables Supabase absentes" },
        { status: 500 }
      );
    }
    const supabase = createClient(url, key);

    // -----------------------------------------------------------------------
    // UNE SOCIETE, SON COMPTE, SON DECLARANT — 24/09.
    //
    // ⛔ AVANT : le declarant etait lu PAR ORGANISME SEUL (le premier venu), et
    // les comptes aussi. Chez un partenaire qui suit plusieurs LLC, le 3916
    // d une societe pouvait porter l identite du declarant d une AUTRE.
    //
    // MAINTENANT : on part du COMPTE (choisi par compte_id, ou le seul de la
    // societe), et le declarant est celui de LA SOCIETE DE CE COMPTE
    // (compliance_declarant.entite_id, ecrit par la fiche annuelle).
    // ⛔ AUCUN REPLI QUI CHANGE LE PERIMETRE : pas de declarant pour cette
    // societe = pas de 3916, avec un message qui dit quoi faire.
    // Seule tolerance : un compte ANCIEN, sans societe, dans un organisme qui
    // n a qu UN declarant — il n y a alors aucune ambiguite.
    // -----------------------------------------------------------------------
    const entiteDemandee = String(body.entite_id || body.entite || "").trim();
    let societe: any = null;
    if (entiteDemandee) {
      const { data: e } = await supabase
        .from("compliance_tenants")
        .select("id, label, legal_name")
        .eq("tenant_id", tenantId)
        .eq("id", entiteDemandee)
        .maybeSingle();
      if (!e) {
        return NextResponse.json({ ok: false, erreur: "Société introuvable." }, { status: 404 });
      }
      societe = e;
    }

    let requete = supabase
      .from("compliance_comptes_etrangers")
      .select("*")
      .eq("tenant_id", tenantId)
      .limit(50);

    // Le filtre sur tenant_id vient AVANT celui sur l identifiant du compte :
    // un compte_id appartenant a un autre organisme ne rend donc rien.
    if (societe) requete = requete.eq("entite_id", societe.id);
    if (compteId) requete = requete.eq("id", compteId);

    const { data: comptes, error: errCpt } = await requete;

    if (errCpt) {
      console.error("[f3916/generate-pdf] lecture comptes :", errCpt.message);
      return NextResponse.json(
        { ok: false, erreur: "Lecture des comptes étrangers impossible." },
        { status: 500 }
      );
    }
    if (!comptes || comptes.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          erreur:
            "Aucun compte étranger enregistré. Saisissez d'abord le compte dans « Comptes à l'étranger ».",
        },
        { status: 404 }
      );
    }
    if (comptes.length > 1 && !compteId) {
      return NextResponse.json(
        {
          ok: false,
          erreur:
            "Plusieurs comptes trouvés. La notice impose une déclaration par compte : précisez compte_id.",
          comptes: comptes.map((c: any) => ({
            id: c.id,
            designation: c.designation,
            organisme: c.organisme_nom,
          })),
        },
        { status: 400 }
      );
    }
    const c = comptes[0];

    const entiteDuCompte: string | null = c.entite_id || (societe ? societe.id : null);
    let d: any = null;

    if (entiteDuCompte) {
      const { data: decl, error: errDecl } = await supabase
        .from("compliance_declarant")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("entite_id", entiteDuCompte)
        .limit(1);
      if (errDecl) {
        console.error("[f3916/generate-pdf] lecture declarant :", errDecl.message);
        return NextResponse.json(
          { ok: false, erreur: "Lecture de la fiche déclarant impossible." },
          { status: 500 }
        );
      }
      d = decl && decl.length > 0 ? decl[0] : null;
      if (!d) {
        return NextResponse.json(
          {
            ok: false,
            erreur:
              "Aucun déclarant pour cette société. Complétez d'abord la fiche annuelle : c'est elle qui porte l'identité du membre.",
          },
          { status: 404 }
        );
      }
      if (!societe) {
        const { data: e } = await supabase
          .from("compliance_tenants")
          .select("id, label, legal_name")
          .eq("tenant_id", tenantId)
          .eq("id", entiteDuCompte)
          .maybeSingle();
        societe = e || null;
      }
    } else {
      const { data: decl, error: errDecl } = await supabase
        .from("compliance_declarant")
        .select("*")
        .eq("tenant_id", tenantId)
        .limit(2);
      if (errDecl) {
        console.error("[f3916/generate-pdf] lecture declarant :", errDecl.message);
        return NextResponse.json(
          { ok: false, erreur: "Lecture de la fiche déclarant impossible." },
          { status: 500 }
        );
      }
      if (!decl || decl.length === 0) {
        return NextResponse.json(
          { ok: false, erreur: "Aucun déclarant enregistré. Complétez d'abord la fiche annuelle." },
          { status: 404 }
        );
      }
      if (decl.length > 1) {
        return NextResponse.json(
          {
            ok: false,
            erreur:
              "Ce compte n'est rattaché à aucune société. Supprimez-le et ressaisissez-le depuis « Comptes à l'étranger ».",
          },
          { status: 400 }
        );
      }
      d = decl[0];
    }

    const chemin = path.join(process.cwd(), CERFA);
    let octets: Buffer;
    try {
      octets = await fs.readFile(chemin);
    } catch (e: any) {
      console.error("[f3916/generate-pdf] CERFA introuvable :", e.message);
      return NextResponse.json(
        { ok: false, erreur: "Le formulaire CERFA est introuvable sur le serveur." },
        { status: 500 }
      );
    }

    const pdfDoc = await PDFDocument.load(octets);
    const form = pdfDoc.getForm();
    const police = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const controle: Record<string, string> = {};

    const poserTexte = (nom: string, valeur: any) => {
      const v = texteCerfa(valeur);
      if (!v) return;
      try {
        form.getTextField(nom).setText(v);
        controle[nom] = v;
      } catch (e: any) {
        avertissements.push("Champ texte " + nom + " : " + e.message);
      }
    };

    const poserCase = (nom: string, etat: string) => {
      if (!etat) return;
      try {
        const champ = form.getField(nom);
        const acro = (champ as any).acroField;
        const widgets = acro.getWidgets();
        const cible = PDFName.of(etat);
        const off = PDFName.of("Off");

        let trouve = false;

        for (const w of widgets) {
          let etats: string[] = [];
          const ap = w.dict.get(PDFName.of("AP"));
          if (ap instanceof PDFDict) {
            const n = ap.get(PDFName.of("N"));
            if (n instanceof PDFDict) {
              etats = n.keys().map((k: any) => String(k));
            }
          }
          if (etats.indexOf("/" + etat) >= 0) {
            w.dict.set(PDFName.of("AS"), cible);
            trouve = true;
          } else {
            w.dict.set(PDFName.of("AS"), off);
          }
        }

        acro.dict.set(PDFName.of("V"), trouve ? cible : off);

        controle[nom] = etat + (trouve ? " (coche)" : " (ETAT INTROUVABLE)");
        if (!trouve) {
          avertissements.push("Case " + nom + " : aucun widget ne porte l'etat /" + etat);
        }
      } catch (e: any) {
        avertissements.push("Case " + nom + " : " + e.message);
      }
    };

    const naiss = d.date_naissance
      ? jour(d.date_naissance) + "/" + mois(d.date_naissance) + "/" + annee(d.date_naissance)
      : "";

    poserTexte("a1", d.nom_patronymique);
    poserTexte("a2", d.prenoms);
    poserTexte("a3", naiss + (d.lieu_naissance ? " à " + d.lieu_naissance : ""));
    poserTexte(
      "a4",
      [d.adresse_rue, d.adresse_code_postal, d.adresse_ville].filter(Boolean).join(" ")
    );
    poserTexte("a5", d.adresse_pays || "France");

    const typeVersCac2: Record<string, string> = {
      bancaire: "a",
      actifs_numeriques: "b",
      contrat_capitalisation: "c",
    };
    const optCac2 = typeVersCac2[c.type_compte];
    if (optCac2) poserCase("CAC2", optCac2);
    else avertissements.push("type_compte inconnu : " + c.type_compte);

    poserTexte("a13", c.numero_compte);

    const caractereCompteVersCac3: Record<string, string> = {
      courant: "a",
      epargne: "b",
      autres: "c",
    };
    const optCac3 = caractereCompteVersCac3[c.caractere_compte || "courant"];
    if (optCac3) poserCase("CAC3", optCac3);
    else avertissements.push("caractere_compte inconnu : " + c.caractere_compte);

    poserTexte("a15", jour(c.date_ouverture));
    poserTexte("a16", mois(c.date_ouverture));
    poserTexte("a17", annee(c.date_ouverture));
    poserTexte("a18", jour(c.date_cloture));
    poserTexte("a19", mois(c.date_cloture));
    poserTexte("a20", annee(c.date_cloture));

    poserTexte("a21", c.organisme_nom);
    poserTexte("a23", [c.organisme_adresse, c.organisme_pays].filter(Boolean).join(", "));

    // ---- 3.2 MODALITES DE DETENTION — 24/09 ----
    //
    // ⛔ AVANT : le reglage general de la fiche declarant (modalite_detention)
    // passait AVANT le choix fait sur le compte. Meridian, declare « titulaire :
    // l entite (la societe) », sortait coche « Titulaire en propre ».
    // MAINTENANT : le choix du COMPTE decide ; le reglage general ne sert que
    // si le compte n en porte pas.
    //   personne_physique -> a  Titulaire en propre
    //   entite            -> b  Beneficiaire d une procuration (cadre 6)
    const titulaireVersCac4: Record<string, string> = {
      personne_physique: "a",
      entite: "b",
    };
    const optCac4 = titulaireVersCac4[c.titulaire] || d.modalite_detention || "a";
    poserCase("CAC4", optCac4);

    const caractereVersCac6: Record<string, string> = {
      personnel: "a",
      professionnel: "b",
    };
    const optCac6 = caractereVersCac6[c.caractere] || d.usage_compte || "b";
    poserCase("CAC6", optCac6);

    // La societe : celle de la fiche declarant, a defaut celle de la base.
    const raisonSociale =
      d.entreprise_raison_sociale || (societe ? societe.legal_name || societe.label : "");
    const formeJuridique = d.entreprise_forme_juridique || "02";
    // L adresse de la societe porte son pays (« n°, rue, ville et pays »).
    const adresseSociete = avecPays(d.entreprise_adresse, "États-Unis");

    // ---- 5. USAGE DU COMPTE ----
    poserTexte("a37", raisonSociale);
    poserTexte("a38", formeJuridique);
    poserTexte("a39", d.entreprise_siret);
    // ⚠️ La premiere ligne (a40) chevauche l intitule imprime « Adresse du
    // lieu d exercice de l activite » : l adresse va sur la ligne pointillee
    // du dessous (a41). Constate au rendu le 24/09.
    poserTexte("a41", adresseSociete);

    // ---- 6.2 LE TITULAIRE EST UNE PERSONNE MORALE — 24/09 ----
    // La notice : « Si le declarant est le beneficiaire d une procuration
    // [...] vous devez remplir egalement les rubriques prevues au cadre 6
    // (6.2 si le titulaire est une personne morale) ». Ce cadre n etait
    // rempli nulle part.
    //   a50 raison sociale · a51 forme juridique · a52 SIRET · a53 siege
    if (optCac4 === "b") {
      poserTexte("a50", raisonSociale);
      poserTexte("a51", formeJuridique);
      poserTexte("a52", d.entreprise_siret);
      poserTexte("a53", adresseSociete);
    }

    // ---- PAGE 4, LE BLOC DE SIGNATURE ----
    // Le nom du titulaire ou du beneficiaire de la procuration se preremplit.
    // « Fait a » et « le » restent vides : ils appartiennent au signataire.
    const nomSignataire = [d.prenoms, d.nom_patronymique].filter(Boolean).join(" ");
    poserTexte("a84", nomSignataire);

    form.updateFieldAppearances(police);

    const sortie = await pdfDoc.save();

    if (body.controle === true) {
      return NextResponse.json({
        ok: true,
        compte: c.designation,
        champs_remplis: controle,
        avertissements,
      });
    }

    return new NextResponse(Buffer.from(sortie), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="3916_' + (c.designation || "compte") + '.pdf"',
        "X-Avertissements": String(avertissements.length),
      },
    });
  } catch (e: any) {
    console.error("[f3916/generate-pdf] exception :", e.message);
    return NextResponse.json({ ok: false, erreur: "Erreur serveur." }, { status: 500 });
  }
}
