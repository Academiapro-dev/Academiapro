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

    const details: Array<{ nom: string; type: string; options?: string[] }> = [];

    for (const f of form.getFields()) {
      const nom = f.getName();
      if (nom.indexOf("Page4[0]") === -1) continue;
      if (nom.indexOf("c4_") === -1) continue;

      const type = f.constructor.name;
      let options: string[] | undefined;

      try {
        options = (f as unknown as { getOptions: () => string[] }).getOptions();
      } catch {
        options = undefined;
      }

      details.push({ nom, type, options });
    }

    return NextResponse.json({ nb: details.length, details });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
