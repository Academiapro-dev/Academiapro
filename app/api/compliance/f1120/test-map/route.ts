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

    // On coche toutes les cases des pages 1 et 5, occurrence [0] uniquement
    for (const f of form.getFields()) {
      const nom = f.getName();
      const p1 = nom.indexOf("Page1[0]") !== -1;
      const p5 = nom.indexOf("Page5[0]") !== -1;
      if (!p1 && !p5) continue;
      if (nom.indexOf("[1]") !== -1 || nom.indexOf("[2]") !== -1) continue;

      try {
        form.getCheckBox(nom).check();
        journal.push("COCHE " + nom);
      } catch {
        // pas une case a cocher
      }
    }

    form.updateFieldAppearances(font);
    const bytes = await doc.save();

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=f1120-p1p5.pdf",
        "X-Nb-Cochees": String(journal.length),
      },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e), journal },
      { status: 500 }
    );
  }
}
