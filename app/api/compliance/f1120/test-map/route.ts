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

    const pages: Record<string, number> = {};
    const cases: string[] = [];

    for (const f of form.getFields()) {
      const nom = f.getName();

      const m = nom.match(/(Page\d+\[0\])/);
      const cle = m ? m[1] : "AUTRE";
      pages[cle] = (pages[cle] || 0) + 1;

      if (f.constructor.name.indexOf("CheckBox") !== -1) {
        cases.push(nom);
      }
    }

    return NextResponse.json({
      total: form.getFields().length,
      pages,
      nb_cases_a_cocher: cases.length,
      cases_a_cocher: cases,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
