import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, PDFName } from "pdf-lib";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CERFA = "public/cerfa/3916_5173.pdf";

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
    const body = await req.json().catch(() => ({}));
    const tenantId = body.tenant_id;
    const compteId = body.compte_id;

    if (!tenantId) {
      return NextResponse.json(
        { ok: false, erreur: "tenant_id manquant dans le corps de la requete" },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { ok: false, erreur: "Lecture compliance_declarant: " + errDecl.message },
        { status: 500 }
      );
    }
    if (!decl || decl.length === 0) {
      return NextResponse.json(
        { ok: false, erreur: "Aucune fiche declarant pour ce tenant_id" },
        { status: 404 }
      );
    }
    const d = decl[0];

    let requete = supabase
      .from("compliance_comptes_etrangers")
      .select("*")
      .eq("tenant_id", tenantId)
      .limit(50);

    if (compteId) requete = requete.eq("id", compteId);

    const { data: comptes, error: errCpt } = await requete;

    if (errCpt) {
      return NextResponse.json(
        { ok: false, erreur: "Lecture comptes etrangers: " + errCpt.message },
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
      return NextResponse.json(
        { ok: false, erreur: "CERFA introuvable a " + CERFA + " : " + e.message },
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

        acro.dict.set(PDFName.of("V"), cible);

        let trouve = false;
        for (const w of widgets) {
          const ap = w.getAppearances();
          const normal = ap && ap.normal;
          let etatsDispo: string[] = [];
          try {
            etatsDispo = normal ? Object.keys(normal.dict.dict).map((k) => String(k)) : [];
          } catch (e) {
            etatsDispo = [];
          }
          const possede = etatsDispo.some((k) => k === "/" + etat || k === etat);
          if (possede) {
            w.dict.set(PDFName.of("AS"), cible);
            trouve = true;
          } else {
            w.dict.set(PDFName.of("AS"), PDFName.of("Off"));
          }
        }

        controle[nom] = etat + (trouve ? "" : " (widget correspondant NON trouve)");
        if (!trouve) {
          avertissements.push(
            "Case " + nom + " : aucun widget ne porte l'etat /" + etat
          );
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

    avertissements.push(
      "CAC3 (compte courant / epargne / autres) non renseigne : aucune colonne de la table ne porte cette information."
    );

    poserTexte("a15", jour(c.date_ouverture));
    poserTexte("a16", mois(c.date_ouverture));
    poserTexte("a17", annee(c.date_ouverture));
    poserTexte("a18", jour(c.date_cloture));
    poserTexte("a19", mois(c.date_cloture));
    poserTexte("a20", annee(c.date_cloture));

    poserTexte("a21", c.organisme_nom);
    poserTexte(
      "a23",
      [c.organisme_adresse, c.organisme_pays].filter(Boolean).join(", ")
    );

    const titulaireVersCac4: Record<string, string> = {
      personne_physique: "a",
      entite: "b",
    };
    const optCac4 =
      d.modalite_detention || titulaireVersCac4[c.titulaire] || "a";
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
    return NextResponse.json({ ok: false, erreur: e.message, avertissements }, { status: 500 });
  }
}
