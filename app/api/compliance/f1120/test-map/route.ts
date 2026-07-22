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

    // Encadrement : c5_14 et c5_16 en colonne Yes, c5_18 en colonne No
    // Les trois marques seront distinguables par leur position
    const cibles = [
      "topmostSubform[0].Page5[0].c5_14[0]",
      "topmostSubform[0].Page5[0].c5_16[0]",
      "topmostSubform[0].Page5[0].c5_18[1]",
    ];

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
        "Content-Disposition": "inline; filename=f1120-q27.pdf",
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
