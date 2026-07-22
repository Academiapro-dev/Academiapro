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

    const details: Array<Record<string, unknown>> = [];

    for (const f of form.getFields()) {
      const nom = f.getName();
      if (nom.indexOf("Page4[0]") === -1) continue;
      if (nom.indexOf("c4_7") === -1 && nom.indexOf("c4_8") === -1) continue;

      const d: Record<string, unknown> = { nom };

      try {
        form.getCheckBox(nom);
        d.checkbox = "OUI";
      } catch (e: unknown) {
        d.checkbox = e instanceof Error ? e.message : String(e);
      }

      try {
        const rg = form.getRadioGroup(nom);
        d.radio = "OUI";
        d.radio_options = rg.getOptions();
      } catch (e: unknown) {
        d.radio = e instanceof Error ? e.message : String(e);
      }

      try {
        form.getTextField(nom);
        d.texte = "OUI";
      } catch (e: unknown) {
        d.texte = e instanceof Error ? e.message : String(e);
      }

      details.push(d);
    }

    return NextResponse.json({ nb: details.length, details });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
