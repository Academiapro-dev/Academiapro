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
function sansAccent(v: any): string {
  if (v === null || v === undefined) return "";
  return String(v)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "");
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

    const { data: decl, error: errDecl } = await supabase
      .from("compliance_declarant")
      .select("*")
      .eq("tenant_id", tenantId)
      .limit(1);

    if (errDecl) {
      console.error("[f3916/generate-pdf] lecture declarant :", errDecl.message);
      return NextResponse.json(
        { ok: false, erreur: "Lecture de la fiche declarant impossible." },
        { status: 500 }
      );
    }
    if (!decl || decl.length === 0) {
      return NextResponse.json(
        { ok: false, erreur: "Aucune fiche declarant pour votre societe." },
        { status: 404 }
      );
    }
    const d = decl[0];

    let requete = supabase
      .from("compliance_comptes_etrangers")
      .select("*")
      .eq("tenant_id", tenantId)
      .limit(50);

    // Le filtre sur tenant_id vient AVANT celui sur l identifiant du compte :
    // un compte_id appartenant a un autre organisme ne rend donc rien.
    if (compteId) requete = requete.eq("id", compteId);

    const { data: comptes, error: errCpt } = await requete;

    if (errCpt) {
      console.error("[f3916/generate-pdf] lecture comptes :", errCpt.message);
      return NextResponse.json(
        { ok: false, erreur: "Lecture des comptes etrangers impossible." },
        { status: 500 }
      );
    }
    if (!comptes || comptes.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          erreur:
            "Aucun compte etranger enregistre. Saisissez d'abord un compte dans /admin/compliance/comptes-etrangers",
        },
        { status: 404 }
      );
    }
    if (comptes.length > 1 && !compteId) {
      return NextResponse.json(
        {
          ok: false,
          erreur:
            "Plusieurs comptes trouves. La notice impose une declaration par compte : precisez compte_id.",
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
      const v = sansAccent(valeur);
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
    poserTexte("a3", naiss + (d.lieu_naissance ? " a " + d.lieu_naissance : ""));
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

    const titulaireVersCac4: Record<string, string> = {
      personne_physique: "a",
      entite: "b",
    };
    const optCac4 = d.modalite_detention || titulaireVersCac4[c.titulaire] || "a";
    poserCase("CAC4", optCac4);

    const caractereVersCac6: Record<string, string> = {
      personnel: "a",
      professionnel: "b",
    };
    const optCac6 = caractereVersCac6[c.caractere] || d.usage_compte || "b";
    poserCase("CAC6", optCac6);

    poserTexte("a37", d.entreprise_raison_sociale);
    poserTexte("a38", d.entreprise_forme_juridique || "02");
    poserTexte("a39", d.entreprise_siret);
    poserTexte("a40", d.entreprise_adresse);

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
