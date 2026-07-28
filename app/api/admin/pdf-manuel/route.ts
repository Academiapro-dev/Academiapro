import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "formations-pdf";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(req: Request) {
  let navigateur: any = null;
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const code = (new URL(req.url).searchParams.get("code") || "").trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ ok: false, erreur: "code manquant" }, { status: 400 });
    }

    const { data: fichier } = await supabase.storage
      .from(BUCKET)
      .download("manuels/" + code + "_manuel.html");

    if (!fichier) {
      return NextResponse.json({ ok: false, code: code, erreur: "manuel HTML introuvable" }, { status: 404 });
    }

    const html = await fichier.text();

    navigateur = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath("https://github.com/Sparticuz/chromium/releases/download/v123.0.0/chromium-v123.0.0-pack.tar"),

      headless: true,
    });

    const page = await navigateur.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 120000 });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "18mm", right: "18mm" },
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate:
        '<div style="font-size:9px;width:100%;text-align:center;color:#888;">' +
        '<span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    });

    await navigateur.close();
    navigateur = null;

    const chemin = "manuels/" + code + "_manuel.pdf";
    const ecriture = await supabase.storage
      .from(BUCKET)
      .upload(chemin, new Blob([pdf], { type: "application/pdf" }), {
        upsert: true,
        cacheControl: "60",
      });

    if (ecriture.error) {
      return NextResponse.json({ ok: false, code: code, erreur: ecriture.error.message }, { status: 500 });
    }

    const { data: lien } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(chemin, 60 * 60 * 24 * 7);

    return NextResponse.json({
      ok: true,
      code: code,
      chemin: chemin,
      octets: pdf.length,
      apercu: (lien && lien.signedUrl) || null,
    });
  } catch (e: any) {
    try { if (navigateur) await navigateur.close(); } catch (x) {}
    return NextResponse.json({ ok: false, erreur: String(e.message || e) }, { status: 500 });
  }
}
