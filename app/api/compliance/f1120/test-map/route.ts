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

    for (const f of form.getFields()) {
      const nom = f.getName();
      if (nom.indexOf("Page4[0]") === -1 && nom.indexOf("Page5[0]") === -1) continue;

      const court = (nom.split(".").pop() || nom).replace(/\[0\]$/, "");
      try {
        const champ = form.getTextField(nom);
        champ.setFontSize(5);
        champ.setText(court);
      } catch {
        // ignore
      }
    }

    form.updateFieldAppearances(font);
    const bytes = await doc.save();

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=f1120-p45.pdf",
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
