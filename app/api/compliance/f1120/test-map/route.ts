import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  const journal: string[] = [];

  try {
    const res = await fetch("https://academiapro.fr/forms/f1120.pdf");
    if (!res.ok) {
      return NextResponse.json({ error: "PDF source introuvable" }, { status: 500 });
    }

    const doc = await PDFDocument.load(await res.arrayBuffer(), { updateMetadata: false });
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const form = doc.getForm();

    const cibles: string[] = [];

    // Page 1 : c1_6 et c1_8 seulement (une sur deux sur la ligne E)
    cibles.push("topmostSubform[0].Page1[0].c1_6[0]");
    cibles.push("topmostSubform[0].Page1[0].c1_8[0]");

    // Page 5 : une case sur deux, colonne Yes, de c5_1 a c5_25
    for (let i = 1; i <= 25; i += 2) {
      cibles.push("topmostSubform[0].Page5[0].c5_" + i + "[0]");
    }

    for (const nom of cibles) {
      try {
        form.getCheckBox(nom).check();
        journal.push("COCHE " + nom);
      } catch (e: unknown) {
        journal.push("ECHEC " + nom + " : " + (e instanceof Error ? e.message : String(e)));
      }
    }

    form.updateFieldAppearances(font);
    const bytes = await doc.save();

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=f1120-alterne.pdf",
        "X-Journal": journal.join(" | "),
      },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e), journal },
      { status: 500 }
    );
  }
}
