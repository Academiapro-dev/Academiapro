import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts } from "pdf-lib";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const which = url.searchParams.get("f") === "1120" ? "f1120.pdf" : "f5472.pdf";

  const res = await fetch("https://academiapro.fr/forms/" + which);
  if (!res.ok) {
    return NextResponse.json({ error: res.status }, { status: 500 });
  }

  const bytes = await res.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const form = doc.getForm();

  for (const field of form.getFields()) {
    const name = field.getName();
    const short = name.replace(/^topmostSubform\[0\]\./, "").replace(/\[0\]/g, "");
    try {
      const anyField = field as unknown as { setText?: (t: string) => void; setFontSize?: (n: number) => void };
      if (typeof anyField.setText === "function") {
        anyField.setText(short);
        if (typeof anyField.setFontSize === "function") anyField.setFontSize(5);
      }
    } catch {
      // champ non textuel : on ignore
    }
  }

  form.updateFieldAppearances(font);
  const out = await doc.save();

  return new NextResponse(Buffer.from(out), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="test-map.pdf"',
    },
  });
}
