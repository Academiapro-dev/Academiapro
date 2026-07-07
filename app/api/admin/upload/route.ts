import { mesurer } from "../../../../lib/usageIA";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // Garde-fou : n accepter que les appels du site
  const origineApp = req.headers.get("origin") || "";
  const referentApp = req.headers.get("referer") || "";
  const appelLegitime =
    origineApp.includes("academiapro.fr")
    || referentApp.includes("academiapro.fr")
    || origineApp.includes("vercel.app")
    || referentApp.includes("vercel.app")
    || origineApp.includes("localhost")
    || referentApp.includes("localhost");
  if (!appelLegitime) {
    return NextResponse.json(
      { error: "Acces refuse" },
      { status: 403 },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const categorie = formData.get("categorie") as string;
    const description = formData.get("description") as string;
    const montant = formData.get("montant") as string;
    const date = formData.get("date") as string;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64File = buffer.toString("base64");
    const fileName = `${Date.now()}_${file.name}`;

    // Upload vers Supabase Storage
    const storageRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/documents-comptables/${fileName}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": file.type,
          "x-upsert": "true",
        },
        body: buffer,
      }
    );

    const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/documents-comptables/${fileName}`;

    // Analyser avec Claude si image ou PDF
    let analyse = "";
    if (file.type.includes("image")) {
      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 500,
          messages: [{
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: file.type, data: base64File }
              },
              {
                type: "text",
                text: "Tu es Mr Comptable expert-comptable. Analyse ce document et extrais : montant total, date, fournisseur/émetteur, description de la dépense, catégorie comptable. Réponds en JSON : {montant, date, fournisseur, description, categorie}"
              }
            ]
          }]
        }),
      });
      const claudeData = await claudeRes.json();
      mesurer("admin-upload", claudeData);
      analyse = claudeData?.content?.[0]?.text || "";
    }

    // Enregistrer dans Supabase
    await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/depenses`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          date: date || new Date().toLocaleDateString("fr-FR"),
          description: description || file.name,
          montant: parseFloat(montant) || 0,
          categorie: categorie || "Autres",
          justificatif: fileUrl,
        }),
      }
    );

    return NextResponse.json({
      success: true,
      fichier: fileName,
      url: fileUrl,
      analyse,
      message: "Document uploadé et enregistré ✅"
    });

  } catch (error) {
    return NextResponse.json({ error: "Erreur upload" }, { status: 500 });
  }
}
