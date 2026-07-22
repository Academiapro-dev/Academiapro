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

    // Page 5 : les cases PAIRES uniquement, colonne Yes
    for (let i = 2; i <= 24; i += 2) {
      const nom = "topmostSubform[0].Page5[0].c5_" + i + "[0]";
      try {
        form.getCheckBox(nom).check();
        journal.push("COCHE c5_" + i);
      } catch (e: unknown) {
        journal.push("ECHEC c5_" + i + " : " + (e instanceof Error ? e.message : String(e)));
      }
    }

    form.updateFieldAppearances(font);
    const bytes = await doc.save();

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=f1120-pairs.pdf",
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
