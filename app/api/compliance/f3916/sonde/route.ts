import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
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

    for (const nom of ["CAC1", "CAC2", "CAC3", "CAC4", "CAC5", "CAC6", "CAC7"]) {
      const ligne: any = { nom: nom };

      try {
        const rg = form.getRadioGroup(nom);
        ligne.radioGroup = "OUI";
        ligne.options = rg.getOptions();
      } catch (e: any) {
        ligne.radioGroup = "NON (" + e.message + ")";
      }

      try {
        const cb = form.getCheckBox(nom);
        ligne.checkBox = "OUI";
        ligne.coche = cb.isChecked();
      } catch (e: any) {
        ligne.checkBox = "NON";
      }

      try {
        const dd = form.getDropdown(nom);
        ligne.dropdown = "OUI";
        ligne.optionsDropdown = dd.getOptions();
      } catch (e: any) {
        ligne.dropdown = "NON";
      }

      try {
        const tf = form.getTextField(nom);
        ligne.textField = "OUI";
      } catch (e: any) {
        ligne.textField = "NON";
      }

      resultat.push(ligne);
    }

    const tous = form.getFields().map((f) => {
      let type = "inconnu";
      try {
        form.getRadioGroup(f.getName());
        type = "RadioGroup";
      } catch (e) {
        try {
          form.getCheckBox(f.getName());
          type = "CheckBox";
        } catch (e2) {
          try {
            form.getTextField(f.getName());
            type = "TextField";
          } catch (e3) {
            type = "autre";
          }
        }
      }
      return { nom: f.getName(), type: type };
    });

    const parType: Record<string, number> = {};
    tous.forEach((t) => {
      parType[t.type] = (parType[t.type] || 0) + 1;
    });

    return NextResponse.json({
      ok: true,
      cac: resultat,
      repartition_par_type: parType,
      champs_non_texte: tous.filter((t) => t.type !== "TextField"),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: e.message }, { status: 500 });
  }
}
