import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  const erreurs: string[] = [];

  try {
    const res = await fetch("https://academiapro.fr/forms/f1120.pdf");
    if (!res.ok) {
      return NextResponse.json({ error: "PDF source introuvable" }, { status: 500 });
    }

    const doc = await PDFDocument.load(await res.arrayBuffer(), { updateMetadata: false });
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const form = doc.getForm();

    let remplis = 0;

    for (const f of form.getFields()) {
      const nom = f.getName();
      if (nom.indexOf("Page4[0]") === -1 && nom.indexOf("Page5[0]") === -1) continue;

      const court = (nom.split(".").pop() || nom).replace(/\[0\]$/, "");

      try {
        form.getTextField(nom).setText(court);
        remplis++;
      } catch (e: unknown) {
        erreurs.push(nom + " : " + (e instanceof Error ? e.message : String(e)));
      }
    }

    if (remplis === 0) {
      return NextResponse.json(
        { error: "Aucun champ rempli", nb_erreurs: erreurs.length, erreurs },
        { status: 500 }
      );
    }

    form.updateFieldAppearances(font);
    const bytes = await doc.save();

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=f1120-p45.pdf",
        "X-Remplis": String(remplis),
        "X-Erreurs": String(erreurs.length),
      },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e), erreurs },
      { status: 500 }
    );
  }
}
