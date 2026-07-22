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

    // On coche UNIQUEMENT la premiere occurrence [0] de chaque c4_
    // Si [0] = colonne Yes, toutes les marques seront dans la colonne Yes.
    const cibles = ["c4_2", "c4_3", "c4_4", "c4_5", "c4_6", "c4_7", "c4_8", "c4_9", "c4_10"];

    for (const cible of cibles) {
      const nom = "topmostSubform[0].Page4[0]." + cible + "[0]";
      try {
        form.getCheckBox(nom).check();
        journal.push(cible + "[0] : coche");
      } catch (e: unknown) {
        journal.push(cible + "[0] : ECHEC " + (e instanceof Error ? e.message : String(e)));
      }
    }

    form.updateFieldAppearances(font);
    const bytes = await doc.save();

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=f1120-cases.pdf",
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
