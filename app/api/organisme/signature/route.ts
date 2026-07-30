import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMINS = ["contact@academiapro.fr"];

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

// L empreinte porte sur le document TEL QU IL A ETE EMIS, reconstitue depuis
// son enregistrement. Elle est donc reproductible : on peut la recalculer des
// annees plus tard et constater que le document n a pas bouge.
function empreinteDe(doc: any): string {
  const canonique = [
    doc.type,
    doc.reference,
    doc.stagiaire_email || "",
    doc.formation_code || "",
    JSON.stringify(doc.donnees || {}),
    new Date(doc.emis_le).toISOString(),
  ].join("|");
  return crypto.createHash("sha256").update(canonique, "utf8").digest("hex");
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const url = new URL(req.url);

    // Le signataire relit ses propres signatures.
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

    // Verification du sceau : une ligne modifiee en base se denonce d elle-meme.
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
      .select("id, tenant_id, type, reference, stagiaire_email, formation_code, donnees, emis_le")
      .eq("reference", reference)
      .maybeSingle();

    if (!doc) {
      return NextResponse.json({ ok: false, erreur: "Document introuvable." }, { status: 404 });
    }

    // Le signataire doit etre soit le stagiaire concerne, soit l organisme.
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

    const empreinte = empreinteDe(doc);
    const signeLe = new Date().toISOString();

    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      null;
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
      avertissement:
        "Signature electronique simple au sens du reglement eIDAS. Elle n est ni avancee ni qualifiee.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
