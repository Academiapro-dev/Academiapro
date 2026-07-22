import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

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
    const form = doc.getForm();

    const cases1: string[] = [];
    const cases5: string[] = [];

    for (const f of form.getFields()) {
      const nom = f.getName();
      const p1 = nom.indexOf("Page1[0]") !== -1;
      const p5 = nom.indexOf("Page5[0]") !== -1;
      if (!p1 && !p5) continue;

      try {
        form.getCheckBox(nom);
      } catch {
        continue;
      }

      if (p1) cases1.push(nom);
      else cases5.push(nom);
    }

    return NextResponse.json({
      nb_cases_page1: cases1.length,
      cases_page1: cases1,
      nb_cases_page5: cases5.length,
      cases_page5: cases5,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
