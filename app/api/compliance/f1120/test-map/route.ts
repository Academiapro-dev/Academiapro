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

    const noms = form
      .getFields()
      .map((f) => f.getName())
      .filter((n) => n.indexOf("Page1[0]") !== -1)
      .filter((n) => /f1_([1-9]|1[0-3])\[0\]$/.test(n));

    return NextResponse.json({ nb: noms.length, noms });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
