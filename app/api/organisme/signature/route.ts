import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "documents-signes";

const CONSENTEMENT =
  "En cochant cette case et en validant, je reconnais avoir lu le document, " +
  "j en accepte les termes, et j appose ma signature electronique. Je reconnais " +
  "que cette signature a la meme valeur que ma signature manuscrite entre les parties.";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    global: {
      fetch: function (url: any, options: any) {
        return fetch(url, { ...(options || {}), cache: "no-store" });
      },
    },
  }
);

function sceau(charge: string): string {
  const secret = process.env.SESSION_SECRET || "";
  return crypto.createHmac("sha256", secret).update(charge).digest("hex");
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const url = new URL(req.url);

    if (url.searchParams.get("vue") === "miennes") {
      const { data } = await supabase
        .from("organisme_signatures")
        .select("document_type, document_reference, signe_le, empreinte_sha256, annulee")
        .eq("signataire_email", session.email)
        .order("signe_le", { ascending: false })
        .limit(200);

      return NextResponse.json({ ok: true, consentement: CONSENTEMENT, signatures: data || [] });
    }

    let tenant = session.tenantId;
    if (!tenant && ADMINS.indexOf(session.email) >= 0) {
      tenant = url.searchParams.get("tenant");
    }
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("organisme_signatures")
      .select("*")
      .eq("tenant_id", tenant)
      .order("signe_le", { ascending: false })
      .limit(1000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const liste = (data || []).map(function (s: any) {
      const charge = [
        s.tenant_id, s.document_type, s.document_reference, s.empreinte_sha256,
        s.signataire_email, s.consentement, new Date(s.signe_le).toISOString(),
      ].join("|");
      return { ...s, intacte: sceau(charge) === s.jeton_preuve };
    });

    return NextResponse.json({
      ok: true,
      consentement: CONSENTEMENT,
      total: liste.length,
      alterees: liste.filter(function (s: any) { return !s.intacte; }).length,
      signatures: liste,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous pour signer." }, { status: 401 });
    }

    if (!process.env.SESSION_SECRET) {
      return NextResponse.json({ ok: false, erreur: "Configuration incomplete." }, { status: 500 });
    }

    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    if (b.accepte !== true) {
      return NextResponse.json(
        { ok: false, erreur: "Vous devez accepter les termes pour signer." },
        { status: 400 }
      );
    }

    const reference = String(b.document_reference || "").trim();
    if (!reference) {
      return NextResponse.json({ ok: false, erreur: "Document non precise." }, { status: 400 });
    }

    const { data: doc } = await supabase
      .from("organisme_documents")
      .select("id, tenant_id, type, reference, stagiaire_email, formation_code, pdf_chemin, pdf_sha256")
      .eq("reference", reference)
      .maybeSingle();

    if (!doc) {
      return NextResponse.json({ ok: false, erreur: "Document introuvable." }, { status: 404 });
    }

    const estLeStagiaire = doc.stagiaire_email === session.email;
    const estLOrganisme = session.tenantId === doc.tenant_id;
    const estAdmin = ADMINS.indexOf(session.email) >= 0;

    if (!estLeStagiaire && !estLOrganisme && !estAdmin) {
      return NextResponse.json(
        { ok: false, erreur: "Ce document ne vous concerne pas." },
        { status: 403 }
      );
    }

    const { data: deja } = await supabase
      .from("organisme_signatures")
      .select("id")
      .eq("document_reference", reference)
      .eq("signataire_email", session.email)
      .eq("annulee", false)
      .maybeSingle();

    if (deja) {
      return NextResponse.json(
        { ok: false, erreur: "Vous avez deja signe ce document." },
        { status: 409 }
      );
    }

    // ARCHIVAGE A VALEUR PROBANTE. Si le PDF n a pas encore ete archive, on le
    // redemande a la route qui le produit, on l archive, et on retient
    // l empreinte DE SES OCTETS. C est ce fichier-la qui sera montre en cas de
    // contestation : sans lui, on prouverait un accord sans pouvoir montrer
    // sur quel texte il portait.
    let empreinte = doc.pdf_sha256 || "";
    let chemin = doc.pdf_chemin || "";

    if (!empreinte || !chemin) {
      const base = process.env.NEXT_PUBLIC_SITE_URL || "https://academiapro.fr";
      const cookie = req.headers.get("cookie") || "";

      const rPdf = await fetch(base + "/api/organisme/document", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: cookie },
        body: JSON.stringify({
          type: doc.type,
          email: doc.stagiaire_email,
          formation_code: doc.formation_code,
        }),
      });

      if (!rPdf.ok) {
        return NextResponse.json(
          { ok: false, erreur: "Le document n a pas pu etre archive. Signature interrompue." },
          { status: 500 }
        );
      }

      const octets = Buffer.from(await rPdf.arrayBuffer());
      empreinte = crypto.createHash("sha256").update(octets).digest("hex");
      chemin = String(doc.tenant_id) + "/" + reference + ".pdf";

      const { error: erreurDepot } = await supabase.storage
        .from(BUCKET)
        .upload(chemin, octets, { contentType: "application/pdf", upsert: true });

      if (erreurDepot) {
        return NextResponse.json(
          { ok: false, erreur: "Archivage impossible : " + erreurDepot.message },
          { status: 500 }
        );
      }

      await supabase
        .from("organisme_documents")
        .update({ pdf_chemin: chemin, pdf_sha256: empreinte, pdf_octets: octets.length })
        .eq("id", doc.id);
    }

    const signeLe = new Date().toISOString();

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
    const navigateur = req.headers.get("user-agent") || null;

    const charge = [
      doc.tenant_id, doc.type, reference, empreinte,
      session.email, CONSENTEMENT, signeLe,
    ].join("|");

    const { data, error } = await supabase
      .from("organisme_signatures")
      .insert({
        tenant_id: doc.tenant_id,
        document_type: doc.type,
        document_reference: reference,
        empreinte_sha256: empreinte,
        signataire_email: session.email,
        signataire_nom: b.signataire_nom ? String(b.signataire_nom).trim() : null,
        signataire_qualite: b.signataire_qualite ? String(b.signataire_qualite).trim() : null,
        consentement: CONSENTEMENT,
        signe_le: signeLe,
        adresse_ip: ip ? String(ip).split(",")[0].trim() : null,
        navigateur: navigateur,
        jeton_preuve: sceau(charge),
      })
      .select("id, empreinte_sha256, signe_le")
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      signature: (data || [])[0] || null,
      empreinte: empreinte,
      archive: chemin,
      avertissement:
        "Signature electronique simple au sens du reglement eIDAS. Elle n est 
