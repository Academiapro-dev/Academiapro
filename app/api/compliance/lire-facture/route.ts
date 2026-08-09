import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument } from "pdf-lib";
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

// ---------------------------------------------------------------------------
// FACTURE ELECTRONIQUE
//
// Au 1er septembre 2026, toute entreprise assujettie a la TVA doit pouvoir
// RECEVOIR des factures electroniques. Une facture electronique n est ni un
// PDF ordinaire ni un scan : c est un fichier structure — Factur-X, UBL ou
// CII — que la machine lit sans interpreter.
//
// Un Factur-X est un PDF/A-3 qui porte un fichier XML EN PIECE JOINTE.
// Quand ce XML est la, les montants ne se devinent plus : ils se lisent.
// On evite alors l appel a l IA, qui coute et qui peut se tromper.
//
// pdf-lib est deja au projet : aucune dependance nouvelle.
// ---------------------------------------------------------------------------

// Une seule balise, sans espace de nom : <ram:Truc>valeur</ram:Truc> ou
// <Truc>valeur</Truc>. On prend la premiere occurrence.
function baliseXml(xml: string, nom: string): string {
  const m = xml.match(new RegExp("<(?:[a-zA-Z0-9]+:)?" + nom + "[^>]*>([^<]*)<", "i"));
  return m ? String(m[1]).trim() : "";
}

// Une balise dont on veut TOUTES les occurrences (montants de TVA par taux).
function balisesXml(xml: string, nom: string): string[] {
  const re = new RegExp("<(?:[a-zA-Z0-9]+:)?" + nom + "[^>]*>([^<]*)<", "gi");
  const sortie: string[] = [];
  let m = re.exec(xml);
  while (m) {
    sortie.push(String(m[1]).trim());
    m = re.exec(xml);
  }
  return sortie;
}

function nombre(v: string): number {
  const n = parseFloat(String(v || "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

// AAAAMMJJ (format 102 de Factur-X) ou AAAA-MM-JJ deja normalise.
function dateFacturX(v: string): string {
  const t = String(v || "").trim();
  if (/^\d{8}$/.test(t)) return t.slice(0, 4) + "-" + t.slice(4, 6) + "-" + t.slice(6, 8);
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  return "";
}

// Extrait le XML attache a un PDF, s il y en a un.
async function xmlAttache(octets: Buffer): Promise<string> {
  try {
    const pdf = await PDFDocument.load(octets, { ignoreEncryption: true });
    const brut = octets.toString("latin1");

    // Les noms normalises des pieces jointes Factur-X et Zugferd.
    const noms = ["factur-x.xml", "zugferd-invoice.xml", "xrechnung.xml", "factur_x.xml"];
    let present = false;
    for (const n of noms) {
      if (brut.toLowerCase().indexOf(n) >= 0) present = true;
    }
    if (!present) return "";

    // Le XML est stocke dans un flux, souvent compresse. On cherche d abord
    // en clair : beaucoup d emetteurs ne compressent pas la piece jointe.
    const direct = brut.match(/<\?xml[\s\S]{0,400000}?<\/(?:[a-zA-Z0-9]+:)?CrossIndustryInvoice>/i);
    if (direct) return direct[0];

    // Sinon, on decompresse les flux du document.
    const zlib = require("zlib");
    const re = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let m = re.exec(brut);
    while (m) {
      try {
        const clair = zlib.inflateSync(Buffer.from(m[1], "latin1")).toString("utf8");
        if (clair.indexOf("CrossIndustryInvoice") >= 0 || clair.indexOf("Invoice") >= 0) {
          if (clair.indexOf("<?xml") >= 0) return clair;
        }
      } catch (e) {
        // Flux non compresse ou illisible : on passe au suivant.
      }
      m = re.exec(brut);
    }

    return "";
  } catch (e) {
    return "";
  }
}

// Lit les champs utiles d un XML Factur-X / CII.
function lireFacturX(xml: string): any {
  const ht = nombre(baliseXml(xml, "LineTotalAmount"));
  const ttc = nombre(baliseXml(xml, "GrandTotalAmount"));
  const baseHt = nombre(baliseXml(xml, "TaxBasisTotalAmount"));

  // La TVA peut apparaitre plusieurs fois, un montant par taux. On additionne.
  const tvas = balisesXml(xml, "TaxTotalAmount");
  let tva = 0;
  for (const t of tvas) tva = tva + nombre(t);

  // Le taux : on prend le premier declare.
  const taux = nombre(baliseXml(xml, "RateApplicablePercent"));

  // Le vendeur est le premier bloc Name du document.
  const noms = balisesXml(xml, "Name");
  const fournisseur = noms.length > 0 ? noms[0] : "";

  return {
    fournisseur: fournisseur,
    reference: baliseXml(xml, "ID"),
    date: dateFacturX(baliseXml(xml, "DateTimeString")),
    montant_ht: r2(baseHt > 0 ? baseHt : ht),
    montant_tva: r2(tva),
    montant_ttc: r2(ttc),
    taux_tva: taux,
    devise: baliseXml(xml, "InvoiceCurrencyCode") || "EUR",
  };
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

    // ---- VOIE 1 : facture electronique structuree -------------------------
    // On regarde AVANT d appeler l IA. Si le XML est la, les montants sont
    // certains : pas d interpretation, pas de cout, pas d ecart possible.
    let lu: any = null;
    let structuree = false;

    if (estPdf) {
      const xml = await xmlAttache(octets);
      if (xml) {
        const f = lireFacturX(xml);
        // On n accepte la lecture structuree que si elle donne un TTC :
        // sinon le XML est d un profil qu on ne sait pas encore lire, et
        // mieux vaut retomber sur la lecture visuelle que servir un zero.
        if (f.montant_ttc > 0) {
          lu = {
            fournisseur: f.fournisseur,
            date: f.date,
            reference: f.reference,
            montant_ht: f.montant_ht,
            montant_tva: f.montant_tva,
            montant_ttc: f.montant_ttc,
            taux_tva: f.taux_tva,
            nature: "",
            devise: f.devise,
            confiance: 100,
          };
          structuree = true;
        }
      }
    }

    // ---- VOIE 2 : lecture visuelle par l IA -------------------------------
    if (!lu) {
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

      try {
        lu = JSON.parse(texte);
      } catch (e) {
        return NextResponse.json(
          { ok: false, erreur: "Reponse illisible du lecteur.", brut: texte.slice(0, 300) },
          { status: 500 }
        );
      }
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
      source: structuree ? "facture electronique (Factur-X)" : "lecture visuelle",
      structuree: structuree,
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
      message: structuree
        ? "Facture electronique lue dans le fichier structure : "
          + (lu.fournisseur || "fournisseur inconnu") + ", " + ttc.toFixed(2)
          + " EUR TTC. Montants certains, aucune interpretation."
        : coherent
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
