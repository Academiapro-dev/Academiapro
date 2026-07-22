import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export const dynamic = "force-dynamic";

const FILES = ["f5472.pdf", "f1120.pdf"];

export async function GET() {
  const out: Record<string, unknown> = {};
  for (const f of FILES) {
    const res = await fetch("https://academiapro.fr/forms/" + f);
    if (!res.ok) { out[f] = { error: res.status }; continue; }
    const bytes = await res.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { updateMetadata: false });
    const fields = doc.getForm().getFields().map((fl) => ({
      name: fl.getName(),
      type: fl.constructor.name,
    }));
    out[f] = { count: fields.length, fields };
  }
  return NextResponse.json(out);
}
