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

    const noms = form.getFields().map((f) => f.getName());

    return NextResponse.json({
      total: noms.length,
      page4: noms.filter((n) => n.indexOf("Page4[0]") !== -1),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
