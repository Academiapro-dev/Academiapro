import { NextResponse } from "next/server";
import { PDFDocument, PDFName, PDFDict } from "pdf-lib";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const chemin = path.join(process.cwd(), "public/cerfa/3916_5173.pdf");
    const octets = await fs.readFile(chemin);
    const pdfDoc = await PDFDocument.load(octets);
    const form = pdfDoc.getForm();

    const resultat: any[] = [];

    for (const nom of ["CAC2", "CAC4", "CAC6"]) {
      const ligne: any = { nom: nom, widgets: [] };
      try {
        const champ = form.getField(nom);
        const acro = (champ as any).acroField;

        try {
          ligne.valeur_V = String(acro.dict.get(PDFName.of("V")));
        } catch (e) {
          ligne.valeur_V = "(absente)";
        }
        try {
          ligne.flags_Ff = String(acro.dict.get(PDFName.of("Ff")));
        } catch (e) {
          ligne.flags_Ff = "(absent)";
        }

        const widgets = acro.getWidgets();
        ligne.nb_widgets = widgets.length;

        for (let i = 0; i < widgets.length; i++) {
          const w = widgets[i];
          const info: any = { index: i };

          try {
            const apDict = w.dict.get(PDFName.of("AP"));
            if (apDict instanceof PDFDict) {
              const n = apDict.get(PDFName.of("N"));
              if (n instanceof PDFDict) {
                info.etats_N = n.keys().map((k: any) => String(k));
              } else {
                info.etats_N = "(N n'est pas un dictionnaire)";
              }
              const dd = apDict.get(PDFName.of("D"));
              if (dd instanceof PDFDict) {
                info.etats_D = dd.keys().map((k: any) => String(k));
              }
            } else {
              info.etats_N = "(pas de AP)";
            }
          } catch (e: any) {
            info.etats_N = "erreur: " + e.message;
          }

          try {
            info.AS = String(w.dict.get(PDFName.of("AS")));
          } catch (e) {
            info.AS = "(absent)";
          }

          try {
            const r = w.getRectangle();
            info.rect = [
              Math.round(r.x),
              Math.round(r.y),
              Math.round(r.width),
              Math.round(r.height),
            ];
          } catch (e) {
            info.rect = "(inconnu)";
          }

          ligne.widgets.push(info);
        }
      } catch (e: any) {
        ligne.erreur = e.message;
      }
      resultat.push(ligne);
    }

    return NextResponse.json({ ok: true, details: resultat });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: e.message }, { status: 500 });
  }
}
