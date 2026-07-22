import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch("https://academiapro.fr/forms/f1120.pdf");
    if (!res.ok) {
      return NextResponse.json({ error: "PDF source introuvable" }, { status: 500 });
    }

    const doc = await PDFDocument.load(await res.arrayBuffer(), { updateMetadata: false });
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const form = doc.getForm();

    let remplis = 0;
    const noms: string[] = [];

    for (const f of form.getFields()) {
      const nom = f.getName();
      if (nom.indexOf("Page1[0]") === -1) continue;

      noms.push(nom);

      const court = nom.split(".").pop() || nom;
      try {
        form.getTextField(nom).setText(court.replace("[0]", ""));
        remplis++;
      } catch {
        // pas un champ texte : on ignore
      }
    }

    form.updateFieldAppearances(font);
    const bytes = await doc.save();

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=f1120-testmap.pdf",
        "X-Champs-Page1": String(noms.length),
        "X-Champs-Remplis": String(remplis),
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
