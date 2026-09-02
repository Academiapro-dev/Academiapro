import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// LA SIGNATURE ELECTRONIQUE DE MYSTERLLC — 01/09.
//
// DUPLICATION DU MECANISME EPROUVE d AcadeMIA Pro
// (/api/organisme/signature), adapte au module compliance. Le fond est
// identique : code par courriel, empreinte du document, sceau HMAC,
// chainage des preuves. Ce qui change, c est CE QU ON FAIT SIGNER.
//
// 🚨🚨 LES FORMULAIRES IRS NE SE SIGNENT PAS ICI, ET C EST UNE REGLE
// ABSOLUE.
//
// Le Form 5472, le 1120 et le 7004 exigent une signature manuscrite ou les
// procedures propres a l IRS. Une signature electronique simple n y serait
// PAS OPPOSABLE. Proposer de les signer ici serait mentir au client, et lui
// faire croire qu une obligation est remplie quand elle ne l est pas.
//
// CE QUI SE SIGNE, ET SEULEMENT CELA : les documents CONTRACTUELS entre le
// gestionnaire et son client.
//   - le mandat de gestion,
//   - la lettre de mission,
//   - l autorisation de deposer en son nom,
//   - et surtout L ACCUSE DE LECTURE AVANT DEPOT : le client atteste avoir
//     lu et approuve le formulaire qui va partir.
//
// ⚠️ CE DERNIER CAS EST LE COEUR DE L OFFRE. Il ne remplace pas la decision
// du client, IL LA PROUVE. C est la traduction technique de l argument de
// maitrise : rien ne part en son nom sans qu il l ait vu.
//
// ⚠️ NE JAMAIS ELARGIR LA LISTE DES TYPES SIGNABLES SANS VERIFIER
// L OPPOSABILITE. Un document ajoute par commodite, signe electroniquement
// alors que l administration exige autre chose, cree une fausse securite —
// et c est le client qui la paierait.
//
// 🆕 LE TRACE MANUSCRIT — 01/09. Le signataire peut dessiner sa signature
// au doigt ou au stylet. Observation de Jacques, en tant qu utilisateur :
// « je me laisse souvent entrainer par les apparences comme tout humain ».
// Cocher une case ne RESSEMBLE pas a signer.
//
// ⚠️ IL N AJOUTE RIEN JURIDIQUEMENT — la signature vaut deja sans lui — MAIS
// SON EMPREINTE ENTRE DANS LE SCEAU. Un trace hors du sceau serait
// decoratif et remplacable : on montrerait une signature sans pouvoir
// prouver que c est celle qui a ete apposee.
//
// ⚠️ SIGNATURE ELECTRONIQUE SIMPLE au sens du reglement eIDAS. Ni avancee,
// ni qualifiee. Elle est opposable ENTRE LES PARTIES ; elle ne vaut pas
// verification d identite. L ecran le dit, et cette route le repete dans sa
// reponse : mieux vaut le dire avant qu on ne le decouvre.
// ---------------------------------------------------------------------------

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "documents-signes";
const VALIDITE_CODE_MIN = 15;
const MAX_TENTATIVES = 5;
const VALIDITE_LECTURE_S = 3600;

// 🚨 LES SEULS TYPES SIGNABLES. Tout autre type est refuse, meme si la
// reference existe. C est le garde-fou contre l elargissement par
// commodite.
const TYPES_SIGNABLES = [
  "mandat",              // mandat de gestion du gestionnaire
  "lettre_mission",      // lettre de mission annuelle
  "autorisation_depot",  // autorisation de deposer au nom du client
  "accuse_lecture",      // le client atteste avoir lu ce qui va partir
  "convention",          // convention de prestation
  "devis",
];

// 🚨 CE TEXTE EST CELUI QUE LE SIGNATAIRE LIT A L ECRAN, AU CARACTERE PRES —
// aligne le 02/09. Il entre dans le sceau : ce qui est prouve doit etre
// exactement ce qui a ete accepte. La page de signature affiche la meme
// chaine ; toute modification se fait DES DEUX COTES.
//
// ⚠️ Les signatures deja posees restent valides : la verification relit le
// texte stocke dans chaque ligne, jamais cette constante.
const CONSENTEMENT =
  "En cochant cette case et en validant, je reconnais avoir lu le document, " +
  "j'en accepte les termes, et j'appose ma signature électronique. Je reconnais " +
  "que cette signature a la même valeur que ma signature manuscrite entre les parties. " +
  "Je confirme être le titulaire de l'adresse électronique à laquelle le code de " +
  "vérification a été adressé.";

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
    .from("compliance_documents")
    .select("id, tenant_id, entite_id, doc_type, reference, signataire_email, "
      + "title, pdf_chemin, pdf_sha256, storage_path, file_hash, donnees")
    .eq("reference", reference)
    .maybeSingle();
  return data || null;
}

// LIRE N EST PAS SIGNER, et la distinction est essentielle.
//
// Le gestionnaire doit pouvoir CONSULTER le document : c est lui qui l a
// produit. Mais il ne doit EN AUCUN CAS pouvoir le signer a la place de son
// client — la preuve porterait alors le nom de celui qui a clique, et non
// celui qui s engage.
function peutLire(doc: any, session: any) {
  const estLeSignataire =
    String(doc.signataire_email || "").toLowerCase() === String(session.email || "").toLowerCase();
  const estLeGestionnaire = session.tenantId === doc.tenant_id;
  const estAdmin = ADMINS.indexOf(session.email) >= 0;
  return estLeSignataire || estLeGestionnaire || estAdmin;
}

// 🚨 SEUL LE SIGNATAIRE DESIGNE SIGNE. Sans exception, sans passe-droit
// administrateur. C est le verrou qui donne sa valeur a toute la chaine.
function peutSigner(doc: any, session: any) {
  return String(doc.signataire_email || "").toLowerCase()
    === String(session.email || "").toLowerCase();
}

function typeSignable(doc: any): boolean {
  return TYPES_SIGNABLES.indexOf(String(doc.doc_type || "")) >= 0;
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const url = new URL(req.url);

    // LECTURE DU DOCUMENT AVANT SIGNATURE. On ne peut pas demander a
    // quelqu un de reconnaitre avoir lu un texte qu on ne lui montre pas :
    // la case de consentement se retournerait contre nous. Le lien rendu
    // est temporaire et ne donne acces qu a ce seul fichier.
    if (url.searchParams.get("vue") === "document") {
      const reference = String(url.searchParams.get("reference") || "").trim();
      if (!reference) {
        return NextResponse.json({ ok: false, erreur: "Document non précisé." }, { status: 400 });
      }

      const doc = await documentDe(reference);
      if (!doc) {
        return NextResponse.json({ ok: false, erreur: "Document introuvable." }, { status: 404 });
      }

      if (!peutLire(doc, session)) {
        return NextResponse.json(
          { ok: false, erreur: "Ce document ne vous concerne pas." },
          { status: 403 }
        );
      }

      const donnees = doc.donnees && typeof doc.donnees === "object" ? doc.donnees : {};
      const chemin = doc.pdf_chemin || doc.storage_path || "";

      let lien = "";
      if (chemin) {
        const { data: signe } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(chemin, VALIDITE_LECTURE_S);
        if (signe && signe.signedUrl) lien = signe.signedUrl;
      }

      return NextResponse.json({
        ok: true,
        reference: doc.reference,
        type: doc.doc_type,
        titre: doc.title || donnees.titre || null,
        empreinte: doc.pdf_sha256 || doc.file_hash || null,
        lien_lecture: lien || null,
        signataire: doc.signataire_email,
        signable: typeSignable(doc),
        vous_pouvez_signer: peutSigner(doc, session) && typeSignable(doc),
        // ⚠️ DIT AVANT LA SIGNATURE, PAS APRES.
        avertissement: typeSignable(doc)
          ? "Signature électronique simple au sens du règlement eIDAS."
          : "Ce type de document ne se signe pas électroniquement : il exige"
            + " une signature manuscrite ou la procédure propre à"
            + " l'administration concernée.",
      });
    }

    // LES SIGNATURES DU SIGNATAIRE LUI-MEME.
    if (url.searchParams.get("vue") === "miennes") {
      const { data } = await supabase
        .from("compliance_signatures")
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

    // LE REGISTRE DU GESTIONNAIRE.
    let tenant = session.tenantId;
    if (!tenant && ADMINS.indexOf(session.email) >= 0) {
      tenant = url.searchParams.get("tenant");
    }
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun portefeuille rattaché à votre compte." },
        { status: 403 }
      );
    }

    // Le filtre par societe, quand on regarde le dossier d une seule.
    const entite = String(url.searchParams.get("entite") || "").trim();

    let q = supabase
      .from("compliance_signatures")
      .select("*")
      .eq("tenant_id", tenant);

    if (entite) q = q.eq("entite_id", entite);

    const { data, error } = await q
      .order("signe_le", { ascending: true })
      .limit(1000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // 🚨 VERIFICATION EN DEUX TEMPS, et les deux comptent.
    //
    // LE SCEAU verifie chaque signature prise isolement : si une ligne a ete
    // modifiee en base apres coup, son HMAC ne correspond plus.
    //
    // LE CHAINAGE relie chaque preuve a la precedente : il detecte ce que le
    // sceau ne voit pas — la SUPPRESSION d une signature du milieu, qui ne
    // laisse aucune trace sur les lignes restantes.
    let precedente = "";
    const liste = (data || []).map(function (s: any) {
      // 🚨 LE TRACE ENTRE DANS LE SCEAU — 01/09.
      //
      // Sans lui, on afficherait une signature manuscrite qui ne ferait
      // PAS PARTIE DE LA PREUVE : quelqu un pourrait la remplacer en base
      // sans que le sceau bronche. Le trace serait alors decoratif, et
      // trompeur.
      //
      // ⚠️ L ABSENCE DE TRACE VAUT CHAINE VIDE. Ainsi une signature posee
      // avant l ajout de cette colonne reste valide : son sceau a ete
      // calcule avec le meme "" a cette position.
      const charge = [
        s.tenant_id, s.document_type, s.document_reference, s.empreinte_sha256,
        s.signataire_email, s.consentement, new Date(s.signe_le).toISOString(),
        s.trace_sha256 || "",
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

// ENVOI DU CODE. C est ce qui fait passer la preuve de « quelqu un a
// clique » a « le titulaire de cette adresse a clique ». On ne conserve que
// l EMPREINTE du code, jamais le code lui-meme.
//
// 🚨 LE CODE PART A L ADRESSE INSCRITE SUR LE DOCUMENT, jamais a celle de
// la session. Autrement, le gestionnaire recevrait les codes de ses propres
// clients — et pourrait signer a leur place.
async function envoyerCode(doc: any) {
  const cle = process.env.RESEND_API_KEY || "";
  if (!cle) {
    return NextResponse.json({ ok: false, erreur: "RESEND_API_KEY absente" }, { status: 500 });
  }

  const destinataire = String(doc.signataire_email || "").toLowerCase().trim();
  if (!destinataire) {
    return NextResponse.json(
      { ok: false, erreur: "Ce document ne porte aucune adresse de signataire." },
      { status: 400 }
    );
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expire = new Date(Date.now() + VALIDITE_CODE_MIN * 60000).toISOString();

  const donnees = doc.donnees && typeof doc.donnees === "object" ? doc.donnees : {};
  const codes = donnees.codes_signature && typeof donnees.codes_signature === "object"
    ? donnees.codes_signature
    : {};

  codes[destinataire] = {
    empreinte: empreinteTexte(code + "|" + destinataire),
    envoye_le: new Date().toISOString(),
    expire_le: expire,
    tentatives: 0,
  };

  const { error } = await supabase
    .from("compliance_documents")
    .update({ donnees: { ...donnees, codes_signature: codes } })
    .eq("id", doc.id);

  if (error) {
    return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
  }

  // ⚠️ LES COULEURS SONT CELLES DE MYSTERLLC, pas celles d AcadeMIA. Un
  // courriel aux couleurs d une autre marque trahirait le cloisonnement
  // exige par Jacques : aucune mention d AcadeMIA sur les surfaces
  // MysterLLC.
  const html =
    '<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#1a1a1a;line-height:1.7">' +
    '<p style="color:#a07840;font-size:13px;letter-spacing:2px;margin:0 0 6px">SIGNATURE ELECTRONIQUE</p>' +
    '<h1 style="color:#1a1a2e;font-size:22px;margin:0 0 16px">Votre code de vérification</h1>' +
    "<p>Vous vous apprêtez à signer le document <strong>" + doc.reference +
    "</strong>. Saisissez ce code sur la page de signature :</p>" +
    '<p style="font-size:34px;letter-spacing:10px;font-weight:bold;color:#1a1a2e;' +
    'background:#f5f1e8;padding:18px 24px;border-radius:8px;text-align:center;margin:24px 0">' +
    code + "</p>" +
    "<p>Ce code est valable " + VALIDITE_CODE_MIN + " minutes et ne sert qu'une fois.</p>" +
    '<p style="font-size:14px;color:#666">Si vous n'êtes pas à l'origine de cette demande, ' +
    "ignorez ce message : aucune signature ne sera enregistrée sans ce code.</p>" +
    '<p style="font-size:13px;color:#999;margin-top:26px">MysterLLC — mysterllc.com</p>' +
    "</div>";

  const expediteur = process.env.COMPLIANCE_EXPEDITEUR
    || "MysterLLC <contact@mysterllc.com>";

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + cle, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: expediteur,
      to: [destinataire],
      subject: "Code de vérification — signature du document " + doc.reference,
      html: html,
    }),
  });

  if (!r.ok) {
    return NextResponse.json(
      { ok: false, erreur: "L'envoi du code a échoué. Réessayez." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    envoye: true,
    email: destinataire,
    validite_minutes: VALIDITE_CODE_MIN,
    message: "Un code à six chiffres vient d'être envoyé à " + destinataire + ".",
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous pour signer." }, { status: 401 });
    }

    // ⚠️ SANS SESSION_SECRET, LE SCEAU NE VAUT RIEN. On refuse de signer
    // plutot que de produire une preuve invalidable.
    if (!process.env.SESSION_SECRET) {
      return NextResponse.json({ ok: false, erreur: "Configuration incomplète." }, { status: 500 });
    }

    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requête illisible." }, { status: 400 });
    }

    const reference = String(b.document_reference || "").trim();
    if (!reference) {
      return NextResponse.json({ ok: false, erreur: "Document non précisé." }, { status: 400 });
    }

    const doc = await documentDe(reference);
    if (!doc) {
      return NextResponse.json({ ok: false, erreur: "Document introuvable." }, { status: 404 });
    }

    // 🚨 LE PREMIER VERROU : LE TYPE. Un formulaire IRS ne passe pas ici,
    // meme demande par le signataire lui-meme.
    if (!typeSignable(doc)) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Ce document ne se signe pas électroniquement. Les formulaires"
            + " destinés à l'administration américaine exigent une signature"
            + " manuscrite ou la procédure propre à l'IRS : imprimez-le, signez-le,"
            + " et déposez-le selon la voie prévue.",
          type: doc.doc_type,
        },
        { status: 400 }
      );
    }

    // 🚨 LE SECOND VERROU : LA PERSONNE. Le gestionnaire lit, il ne signe
    // pas a la place de son client.
    if (!peutSigner(doc, session)) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Seul le signataire désigné peut signer ce document. Il est établi"
            + " au nom de " + doc.signataire_email
            + " : connectez-vous avec ce compte pour le signer.",
          signataire: doc.signataire_email,
        },
        { status: 403 }
      );
    }

    if (b.action === "code") {
      return await envoyerCode(doc);
    }

    if (b.accepte !== true) {
      return NextResponse.json(
        { ok: false, erreur: "Vous devez accepter les termes pour signer." },
        { status: 400 }
      );
    }

    const signataire = String(doc.signataire_email || "").toLowerCase().trim();

    const { data: deja } = await supabase
      .from("compliance_signatures")
      .select("id")
      .eq("document_reference", reference)
      .eq("signataire_email", signataire)
      .eq("annulee", false)
      .maybeSingle();

    if (deja) {
      return NextResponse.json(
        { ok: false, erreur: "Vous avez déjà signé ce document." },
        { status: 409 }
      );
    }

    const donnees = doc.donnees && typeof doc.donnees === "object" ? doc.donnees : {};
    const codes = donnees.codes_signature && typeof donnees.codes_signature === "object"
      ? donnees.codes_signature
      : {};
    const attendu = codes[signataire] || null;

    const codeSaisi = String(b.code || "").trim();
    const tentatives = attendu ? Number(attendu.tentatives) || 0 : 0;

    if (!attendu) {
      return NextResponse.json(
        { ok: false, erreur: "Demandez d'abord votre code de vérification." },
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
        { ok: false, erreur: "Ce code a expiré. Demandez-en un nouveau." },
        { status: 400 }
      );
    }

    if (empreinteTexte(codeSaisi + "|" + signataire) !== attendu.empreinte) {
      codes[signataire] = { ...attendu, tentatives: tentatives + 1 };
      await supabase
        .from("compliance_documents")
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

    const codeEnvoyeLe = attendu.envoye_le;
    const codeVerifieLe = new Date().toISOString();

    // 🚨 L ARCHIVAGE A VALEUR PROBANTE. C est ce fichier-la qui sera montre
    // en cas de contestation. Sans lui, on prouverait un accord SANS POUVOIR
    // MONTRER SUR QUEL TEXTE IL PORTAIT — une preuve sans objet.
    const empreinte = doc.pdf_sha256 || doc.file_hash || "";
    const chemin = doc.pdf_chemin || doc.storage_path || "";

    if (!empreinte || !chemin) {
      return NextResponse.json(
        {
          ok: false,
          erreur: "Le document n'a pas encore été archivé. Générez-le et déposez-le"
            + " avant de le faire signer : une signature sans document archivé ne"
            + " prouverait rien.",
        },
        { status: 409 }
      );
    }

    const signeLe = new Date().toISOString();

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
    const navigateur = req.headers.get("user-agent") || null;

    // 🚨 LE TRACE MANUSCRIT, S IL EXISTE, ENTRE DANS LE SCEAU.
    // Il est facultatif : la signature vaut sans lui. Mais s il est
    // present, il devient indissociable de la preuve.
    const trace = b.trace ? String(b.trace).trim() : "";
    const traceEmpreinte = trace ? empreinteTexte(trace) : "";

    // ⚠️ UNE BORNE DE TAILLE. Un trace au doigt tient dans quelques
    // kilo-octets ; au-dela, c est qu on tente d y glisser autre chose.
    if (trace && trace.length > 400000) {
      return NextResponse.json(
        { ok: false, erreur: "Le tracé de signature est trop volumineux." },
        { status: 400 }
      );
    }

    const charge = [
      doc.tenant_id, doc.doc_type, reference, empreinte,
      signataire, CONSENTEMENT, signeLe,
      traceEmpreinte,
    ].join("|");

    // 🚨 LE CHAINAGE : chaque preuve porte l empreinte de la precedente.
    // Il detecte ce que le sceau ne voit pas — la suppression d une
    // signature du milieu.
    const { data: derniere } = await supabase
      .from("compliance_signatures")
      .select("empreinte_chaine")
      .eq("tenant_id", doc.tenant_id)
      .order("signe_le", { ascending: false })
      .limit(1)
      .maybeSingle();

    const precedente = (derniere && derniere.empreinte_chaine) || "";
    const chaine = empreinteTexte(precedente + "|" + charge);

    const { data, error } = await supabase
      .from("compliance_signatures")
      .insert({
        tenant_id: doc.tenant_id,
        entite_id: doc.entite_id || null,
        document_type: doc.doc_type,
        document_reference: reference,
        empreinte_sha256: empreinte,
        signataire_email: signataire,
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
        trace_signature: trace || null,
        trace_sha256: traceEmpreinte || null,
        ouvert_le: b.ouvert_le || null,
      })
      .select("id, empreinte_sha256, signe_le, empreinte_chaine")
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // ⚠️ LE CODE EST CONSOMME : il ne doit plus jamais resservir.
    delete codes[signataire];
    await supabase
      .from("compliance_documents")
      .update({ donnees: { ...donnees, codes_signature: codes } })
      .eq("id", doc.id);

    return NextResponse.json({
      ok: true,
      signature: (data || [])[0] || null,
      empreinte: empreinte,
      archive: chemin,
      signataire: signataire,
      verifie_par_code: true,
      avertissement:
        "Signature électronique simple au sens du règlement eIDAS. Elle n'est ni"
        + " avancée ni qualifiée : elle est opposable entre les parties, elle ne"
        + " vaut pas vérification d'identité.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
