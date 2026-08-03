import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "documents-signes";
const VALIDITE_CODE_MIN = 15;
const MAX_TENTATIVES = 5;
const VALIDITE_LECTURE_S = 3600;

const CONSENTEMENT =
  "En cochant cette case et en validant, je reconnais avoir lu le document, " +
  "j en accepte les termes, et j appose ma signature electronique. Je reconnais " +
  "que cette signature a la meme valeur que ma signature manuscrite entre les parties. " +
  "Je confirme etre le titulaire de l adresse electronique a laquelle le code de " +
  "verification a ete adresse.";

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

function empreinteTexte(t: string): string {
  return crypto.createHash("sha256").update(t).digest("hex");
}

async function documentDe(reference: string) {
  const { data } = await supabase
    .from("organisme_documents")
    .select("id, tenant_id, type, reference, stagiaire_email, formation_code, pdf_chemin, pdf_sha256, donnees, groupe")
    .eq("reference", reference)
    .maybeSingle();
  return data || null;
}

function autorise(doc: any, session: any) {
  const estLeStagiaire = doc.stagiaire_email === session.email;
  const estLOrganisme = session.tenantId === doc.tenant_id;
  const estAdmin = ADMINS.indexOf(session.email) >= 0;
  return estLeStagiaire || estLOrganisme || estAdmin;
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const url = new URL(req.url);

    // LECTURE DU DOCUMENT AVANT SIGNATURE. On ne peut pas demander a quelqu un
    // de reconnaitre avoir lu un texte qu on ne lui montre pas : la case de
    // consentement se retournerait contre nous. Le lien renvoye est temporaire
    // et ne donne acces qu a ce seul fichier.
    if (url.searchParams.get("vue") === "document") {
      const reference = String(url.searchParams.get("reference") || "").trim();
      if (!reference) {
        return NextResponse.json({ ok: false, erreur: "Document non precise." }, { status: 400 });
      }

      const doc = await documentDe(reference);
      if (!doc) {
        return NextResponse.json({ ok: false, erreur: "Document introuvable." }, { status: 404 });
      }

      if (!autorise(doc, session)) {
        return NextResponse.json(
          { ok: false, erreur: "Ce document ne vous concerne pas." },
          { status: 403 }
        );
      }

      const donnees = doc.donnees && typeof doc.donnees === "object" ? doc.donnees : {};

      let lien = "";
      if (doc.pdf_chemin) {
        const { data: signe } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(doc.pdf_chemin, VALIDITE_LECTURE_S);
        if (signe && signe.signedUrl) lien = signe.signedUrl;
      }

      return NextResponse.json({
        ok: true,
        reference: doc.reference,
        type: doc.type,
        titre: donnees.titre || null,
        contrepartie: donnees.contrepartie || null,
        empreinte: doc.pdf_sha256 || null,
        lien_lecture: lien || null,
      });
    }

    if (url.searchParams.get("vue") === "miennes") {
      const { data } = await supabase
        .from("organisme_signatures")
        .select("document_type, document_reference, signe_le, empreinte_sha256, annulee, code_verifie_le")
        .eq("signataire_email", session.email)
        .order("signe_le", { ascending: false })
        .limit(200);

      return NextResponse.json({
        ok: true,
        consentement: CONSENTEMENT,
        email: session.email,
        signatures: data || [],
      });
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
      .order("signe_le", { ascending: true })
      .limit(1000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // Verification en deux temps : le sceau de chaque signature prise
    // isolement, PUIS le chainage qui relie chaque preuve a la precedente.
    let precedente = "";
    const liste = (data || []).map(function (s: any) {
      const charge = [
        s.tenant_id, s.document_type, s.document_reference, s.empreinte_sha256,
        s.signataire_email, s.consentement, new Date(s.signe_le).toISOString(),
      ].join("|");

      const intacte = sceau(charge) === s.jeton_preuve;
      const attendue = empreinteTexte(precedente + "|" + charge);
      const chaineIntacte = !s.empreinte_chaine || s.empreinte_chaine === attendue;

      precedente = s.empreinte_chaine || attendue;

      return { ...s, intacte: intacte, chaine_intacte: chaineIntacte };
    });

    liste.reverse();

    return NextResponse.json({
      ok: true,
      consentement: CONSENTEMENT,
      total: liste.length,
      alterees: liste.filter(function (s: any) { return !s.intacte; }).length,
      chaine_rompue: liste.filter(function (s: any) { return !s.chaine_intacte; }).length,
      verifiees_par_code: liste.filter(function (s: any) { return !!s.code_verifie_le; }).length,
      signatures: liste,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// Une variante de negociation deja abandonnee ne doit plus etre signable :
// on refuse avant meme d envoyer un code.
async function variantePerimee(doc: any) {
  if (!doc.groupe) return null;

  const { data: soeurs } = await supabase
    .from("organisme_documents")
    .select("reference")
    .eq("groupe", doc.groupe)
    .limit(20);

  const references = (soeurs || []).map(function (s: any) { return s.reference; });
  if (references.length === 0) return null;

  const { data: signees } = await supabase
    .from("organisme_signatures")
    .select("document_reference")
    .in("document_reference", references)
    .eq("annulee", false)
    .limit(20);

  const retenue = (signees || [])[0];
  if (retenue && retenue.document_reference !== doc.reference) {
    return retenue.document_reference;
  }
  return null;
}

// ENVOI DU CODE. C est ce qui fait passer la preuve de « quelqu un a clique »
// a « le titulaire de cette adresse a clique ». On ne conserve que l empreinte
// du code, jamais le code lui-meme.
async function envoyerCode(req: NextRequest, doc: any, session: any) {
  const cle = process.env.RESEND_API_KEY || "";
  if (!cle) {
    return NextResponse.json({ ok: false, erreur: "RESEND_API_KEY absente" }, { status: 500 });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expire = new Date(Date.now() + VALIDITE_CODE_MIN * 60000).toISOString();

  const donnees = doc.donnees && typeof doc.donnees === "object" ? doc.donnees : {};
  const codes = donnees.codes_signature && typeof donnees.codes_signature === "object"
    ? donnees.codes_signature
    : {};

  codes[session.email] = {
    empreinte: empreinteTexte(code + "|" + session.email),
    envoye_le: new Date().toISOString(),
    expire_le: expire,
    tentatives: 0,
  };

  const { error } = await supabase
    .from("organisme_documents")
    .update({ donnees: { ...donnees, codes_signature: codes } })
    .eq("id", doc.id);

  if (error) {
    return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
  }

  const html =
    '<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1a1a1a;line-height:1.7">' +
    '<p style="color:#0a3d2e;font-size:13px;letter-spacing:2px;margin:0 0 6px">SIGNATURE ELECTRONIQUE</p>' +
    '<h1 style="color:#0a3d2e;font-size:22px;margin:0 0 16px">Votre code de verification</h1>' +
    "<p>Vous vous appretez a signer le document <strong>" + doc.reference +
    "</strong>. Saisissez ce code sur la page de signature :</p>" +
    '<p style="font-size:34px;letter-spacing:10px;font-weight:bold;color:#0a3d2e;' +
    'background:#f5f1e8;padding:18px 24px;border-radius:8px;text-align:center;margin:24px 0">' +
    code + "</p>" +
    "<p>Ce code est valable " + VALIDITE_CODE_MIN + " minutes et ne sert qu une fois.</p>" +
    '<p style="font-size:14px;color:#666">Si vous n etes pas a l origine de cette demande, ' +
    "ignorez ce message : aucune signature ne sera enregistree sans ce code.</p>" +
    "</div>";

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + cle, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "AcadeMIA Pro <contact@academiapro.fr>",
      to: [session.email],
      subject: "Code de verification - signature du document " + doc.reference,
      html: html,
    }),
  });

  if (!r.ok) {
    return NextResponse.json(
      { ok: false, erreur: "L envoi du code a echoue. Reessayez." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    envoye: true,
    email: session.email,
    validite_minutes: VALIDITE_CODE_MIN,
    message: "Un code a six chiffres vient d etre envoye a " + session.email + ".",
  });
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

    const reference = String(b.document_reference || "").trim();
    if (!reference) {
      return NextResponse.json({ ok: false, erreur: "Document non precise." }, { status: 400 });
    }

    const doc = await documentDe(reference);
    if (!doc) {
      return NextResponse.json({ ok: false, erreur: "Document introuvable." }, { status: 404 });
    }

    if (!autorise(doc, session)) {
      return NextResponse.json(
        { ok: false, erreur: "Ce document ne vous concerne pas." },
        { status: 403 }
      );
    }

    const perimee = await variantePerimee(doc);
    if (perimee) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Cette version a ete remplacee : une autre version de cet accord a deja"
            + " ete signee (" + perimee + "). Ce lien n est plus valable.",
        },
        { status: 409 }
      );
    }

    if (b.action === "code") {
      return await envoyerCode(req, doc, session);
    }

    if (b.accepte !== true) {
      return NextResponse.json(
        { ok: false, erreur: "Vous devez accepter les termes pour signer." },
        { status: 400 }
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

    const donnees = doc.donnees && typeof doc.donnees === "object" ? doc.donnees : {};
    const codes = donnees.codes_signature && typeof donnees.codes_signature === "object"
      ? donnees.codes_signature
      : {};
    const attendu = codes[session.email] || null;

    const codeSaisi = String(b.code || "").trim();
    let codeEnvoyeLe = null;
    let codeVerifieLe = null;
    const tentatives = attendu ? Number(attendu.tentatives) || 0 : 0;

    if (!attendu) {
      return NextResponse.json(
        { ok: false, erreur: "Demandez d abord votre code de verification." },
        { status: 400 }
      );
    }

    if (tentatives >= MAX_TENTATIVES) {
      return NextResponse.json(
        { ok: false, erreur: "Trop de tentatives. Demandez un nouveau code." },
        { status: 429 }
      );
    }

    if (new Date(attendu.expire_le).getTime() < Date.now()) {
      return NextResponse.json(
        { ok: false, erreur: "Ce code a expire. Demandez-en un nouveau." },
        { status: 400 }
      );
    }

    if (empreinteTexte(codeSaisi + "|" + session.email) !== attendu.empreinte) {
      codes[session.email] = { ...attendu, tentatives: tentatives + 1 };
      await supabase
        .from("organisme_documents")
        .update({ donnees: { ...donnees, codes_signature: codes } })
        .eq("id", doc.id);

      return NextResponse.json(
        {
          ok: false,
          erreur: "Code incorrect. Il vous reste "
            + (MAX_TENTATIVES - tentatives - 1) + " tentative(s).",
        },
        { status: 400 }
      );
    }

    codeEnvoyeLe = attendu.envoye_le;
    codeVerifieLe = new Date().toISOString();

    // ARCHIVAGE A VALEUR PROBANTE : c est ce fichier-la qui sera montre en cas
    // de contestation. Sans lui, on prouverait un accord sans pouvoir montrer
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

    // CHAINAGE : chaque preuve porte l empreinte de la precedente.
    const { data: derniere } = await supabase
      .from("organisme_signatures")
      .select("empreinte_chaine")
      .eq("tenant_id", doc.tenant_id)
      .order("signe_le", { ascending: false })
      .limit(1)
      .maybeSingle();

    const precedente = (derniere && derniere.empreinte_chaine) || "";
    const chaine = empreinteTexte(precedente + "|" + charge);

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
        texte_accepte: CONSENTEMENT,
        signe_le: signeLe,
        adresse_ip: ip ? String(ip).split(",")[0].trim() : null,
        navigateur: navigateur,
        jeton_preuve: sceau(charge),
        code_envoye_le: codeEnvoyeLe,
        code_verifie_le: codeVerifieLe,
        tentatives: tentatives,
        empreinte_precedente: precedente || null,
        empreinte_chaine: chaine,
        ouvert_le: b.ouvert_le || null,
      })
      .select("id, empreinte_sha256, signe_le, empreinte_chaine")
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // Le code est consomme : il ne doit plus jamais resservir.
    delete codes[session.email];
    await supabase
      .from("organisme_documents")
      .update({ donnees: { ...donnees, codes_signature: codes } })
      .eq("id", doc.id);

    // ANNULATION DES VARIANTES SOEURS. Une negociation n aboutit qu a un seul
    // accord : les autres versions cessent d etre signables a l instant meme.
    let annulees = 0;
    if (doc.groupe) {
      const { data: soeurs } = await supabase
        .from("organisme_documents")
        .select("reference")
        .eq("groupe", doc.groupe)
        .neq("reference", reference)
        .limit(20);

      for (const s of soeurs || []) {
        await supabase
          .from("coffre_documents")
          .update({ notes: "Variante abandonnee - la version " + reference + " a ete signee" })
          .eq("reference", s.reference);
        annulees = annulees + 1;
      }
    }

    // Le coffre garde la trace du contrat signe, cote editeur.
    await supabase
      .from("coffre_documents")
      .update({ signe: true, signe_le: signeLe })
      .eq("reference", reference);

    await supabase.from("coffre_documents").insert({
      tenant_id: doc.tenant_id,
      categorie: doc.type,
      titre: "Preuve de signature - " + reference,
      contrepartie: session.email,
      reference: reference + "-PREUVE",
      chemin: chemin,
      empreinte_sha256: empreinte,
      signe: true,
      signe_le: signeLe,
      depose_par: "signature",
      notes: "Signature verifiee par code. Chaine : " + chaine.slice(0, 24),
    });

    return NextResponse.json({
      ok: true,
      signature: (data || [])[0] || null,
      empreinte: empreinte,
      archive: chemin,
      verifie_par_code: true,
      variantes_annulees: annulees,
      avertissement:
        "Signature electronique simple au sens du reglement eIDAS. Elle n est ni avancee ni qualifiee.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
