import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { barrage } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 120;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "pieces-comptables";

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

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

function mots(t: string): string[] {
  return String(t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(function (m) { return m.length >= 4; });
}

export async function POST(req: NextRequest) {
  try {
    const cle = process.env.ANTHROPIC_API_KEY || "";
    if (!cle) {
      return NextResponse.json({ ok: false, erreur: "ANTHROPIC_API_KEY absente." }, { status: 500 });
    }

    const b = await req.json().catch(function () { return null; });
    if (!b || !b.piece_id) {
      return NextResponse.json({ ok: false, erreur: "Piece non precisee." }, { status: 400 });
    }

    const { data: piece } = await supabase
      .from("compta_pieces")
      .select("*")
      .eq("id", b.piece_id)
      .maybeSingle();

    if (!piece) {
      return NextResponse.json({ ok: false, erreur: "Piece introuvable." }, { status: 404 });
    }

    // LE BARRAGE : le dossier vient de la piece, jamais du navigateur.
    const refus = await barrage("deposer_pieces", piece.societe_id);
    if (refus) return refus;

    // On telecharge le fichier depuis le coffre prive.
    const { data: fichier, error: erreurFichier } = await supabase.storage
      .from(BUCKET)
      .download(piece.chemin);

    if (erreurFichier || !fichier) {
      return NextResponse.json({ ok: false, erreur: "Fichier introuvable au coffre." }, { status: 404 });
    }

    const octets = Buffer.from(await fichier.arrayBuffer());
    if (octets.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, erreur: "Fichier trop lourd pour la lecture : 5 Mo maximum." },
        { status: 400 }
      );
    }

    const base64 = octets.toString("base64");
    const extension = String(piece.chemin).split(".").pop()?.toLowerCase() || "pdf";
    const estPdf = extension === "pdf";

    const typeImage = extension === "png" ? "image/png"
      : extension === "webp" ? "image/webp" : "image/jpeg";

    const contenu: any[] = [
      estPdf
        ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
        : { type: "image", source: { type: "base64", media_type: typeImage, data: base64 } },
      {
        type: "text",
        text: "Tu lis une piece comptable francaise. Extrais uniquement ce que tu vois, "
          + "sans rien deviner. Reponds en JSON strict, sans texte autour, sans balises :\n"
          + '{"fournisseur":"","date":"AAAA-MM-JJ","reference":"","montant_ht":0,'
          + '"montant_tva":0,"montant_ttc":0,"taux_tva":0,"nature":"",'
          + '"devise":"EUR","confiance":0}\n'
          + "nature : une categorie courte parmi loyer, honoraires, telecom, energie, "
          + "fournitures, transport, assurance, logiciel, sous-traitance, publicite, "
          + "restauration, banque, marchandises, autre.\n"
          + "confiance : de 0 a 100, ta certitude de lecture.\n"
          + "Si une valeur est illisible ou absente, mets 0 ou une chaine vide.",
      },
    ];

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cle,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 700,
        messages: [{ role: "user", content: contenu }],
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      return NextResponse.json(
        { ok: false, erreur: "Lecture impossible : " + detail.slice(0, 200) },
        { status: 500 }
      );
    }

    const reponse = await r.json();
    const texte = (reponse.content || [])
      .filter(function (x: any) { return x.type === "text"; })
      .map(function (x: any) { return x.text; })
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    let lu: any = null;
    try {
      lu = JSON.parse(texte);
    } catch (e) {
      return NextResponse.json(
        { ok: false, erreur: "Reponse illisible du lecteur.", brut: texte.slice(0, 300) },
        { status: 500 }
      );
    }

    const ht = r2(Number(lu.montant_ht) || 0);
    const tva = r2(Number(lu.montant_tva) || 0);
    const ttc = r2(Number(lu.montant_ttc) || 0);

    // CONTROLE : HT plus TVA doit donner TTC. Un ecart signale une lecture
    // douteuse, et vaut mieux qu un chiffre faux accepte en silence.
    const ecart = ttc > 0 && ht > 0 ? r2(ttc - ht - tva) : 0;
    const coherent = Math.abs(ecart) < 0.02;

    // PROPOSITION DE COMPTE : d abord ce qui a deja ete fait pour ce
    // fournisseur, sinon la nature lue.
    const NATURES: any = {
      loyer: "613000", honoraires: "622600", telecom: "626000",
      energie: "606100", fournitures: "606400", transport: "625100",
      assurance: "616000", logiciel: "651000", sous_traitance: "611000",
      "sous-traitance": "611000", publicite: "623000", restauration: "625700",
      banque: "627000", marchandises: "607000", autre: "606300",
    };

    let compte = NATURES[String(lu.nature || "").toLowerCase()] || "606300";
    let origine = "nature lue";

    if (lu.fournisseur) {
      const { data: passees } = await supabase
        .from("compta_ecritures")
        .select("compte_num, compte_lib, ecriture_lib")
        .eq("societe_id", piece.societe_id)
        .limit(10000);

      const ma = mots(lu.fournisseur);
      let meilleur: any = null;

      for (const p of passees || []) {
        if (String(p.compte_num).charAt(0) !== "6") continue;
        const mb = mots(p.ecriture_lib);
        let communs = 0;
        for (const m of ma) if (mb.indexOf(m) >= 0) communs = communs + 1;
        if (communs === 0) continue;
        const note = communs / ma.length;
        if (!meilleur || note > meilleur.note) {
          meilleur = { compte: p.compte_num, libelle: p.compte_lib, note: note };
        }
      }

      if (meilleur && meilleur.note >= 0.5) {
        compte = meilleur.compte;
        origine = "ce fournisseur a deja ete impute sur ce compte";
      }
    }

    // On enrichit la fiche de la piece avec ce qui a ete lu.
    await supabase
      .from("compta_pieces")
      .update({
        fournisseur: lu.fournisseur ? String(lu.fournisseur).slice(0, 200) : piece.fournisseur,
        reference: lu.reference ? String(lu.reference).slice(0, 80) : piece.reference,
        date_piece: /^\d{4}-\d{2}-\d{2}$/.test(String(lu.date || "")) ? lu.date : piece.date_piece,
        montant_ht: ht > 0 ? ht : piece.montant_ht,
        tva: tva > 0 ? tva : piece.tva,
        montant_ttc: ttc > 0 ? ttc : piece.montant_ttc,
      })
      .eq("id", piece.id);

    return NextResponse.json({
      ok: true,
      lu: {
        fournisseur: lu.fournisseur || null,
        date: lu.date || null,
        reference: lu.reference || null,
        montant_ht: ht,
        montant_tva: tva,
        montant_ttc: ttc,
        taux_tva: Number(lu.taux_tva) || 0,
        nature: lu.nature || null,
        devise: lu.devise || "EUR",
        confiance: Number(lu.confiance) || 0,
      },
      coherent: coherent,
      ecart: ecart,
      proposition: { compte: compte, origine: origine },
      message: coherent
        ? "Facture lue : " + (lu.fournisseur || "fournisseur inconnu") + ", "
          + ttc.toFixed(2) + " EUR TTC."
        : "Facture lue mais les montants ne tombent pas juste : "
          + ht.toFixed(2) + " HT plus " + tva.toFixed(2) + " de TVA ne font pas "
          + ttc.toFixed(2) + ". Verifiez avant de saisir.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
