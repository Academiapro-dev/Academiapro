import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const BUCKET = "pieces-comptables";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// LE DOCUMENT, RELU PAR CELUI QUI L A ENVOYE.
//
// Un dirigeant qui vient de photographier une facture veut verifier que la
// photo est nette et que c est la bonne. Sans cela, il renvoie deux fois,
// ou pire, il n ose plus.
//
// DEUX BARRAGES, et les deux comptent :
//   le jeton doit etre valable ;
//   la piece doit appartenir A SA SOCIETE.
// Sans le second, un dirigeant pourrait lire les factures du voisin en
// changeant le numero dans l adresse.
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const jeton = url.searchParams.get("j") || "";
    const pieceId = url.searchParams.get("piece") || "";

    if (!jeton || jeton.length < 20 || !pieceId) {
      return NextResponse.json({ ok: false, erreur: "Demande incomplete." }, { status: 400 });
    }

    const { data: droit } = await supabase
      .from("compta_acces_client")
      .select("societe_id")
      .eq("jeton", jeton)
      .eq("actif", true)
      .maybeSingle();

    if (!droit) {
      return NextResponse.json({ ok: false, erreur: "Lien invalide ou expire." }, { status: 403 });
    }

    const { data: piece } = await supabase
      .from("compta_pieces")
      .select("chemin, nom, societe_id")
      .eq("id", pieceId)
      .maybeSingle();

    // La piece doit etre celle de SA societe. On repond comme si elle
    // n existait pas : dire « interdit » confirmerait qu elle existe.
    if (!piece || piece.societe_id !== droit.societe_id) {
      return NextResponse.json({ ok: false, erreur: "Document introuvable." }, { status: 404 });
    }

    const { data: fichier, error } = await supabase.storage
      .from(BUCKET)
      .download(piece.chemin);

    if (error || !fichier) {
      return NextResponse.json({ ok: false, erreur: "Document introuvable." }, { status: 404 });
    }

    const octets = Buffer.from(await fichier.arrayBuffer());

    // Le type se devine du nom : un lien signe s ouvre en page blanche sur
    // iPad, on sert donc le fichier nous-memes avec le bon en-tete.
    const bas = String(piece.nom || "").toLowerCase();
    const type = bas.indexOf(".pdf") >= 0 ? "application/pdf"
      : bas.indexOf(".png") >= 0 ? "image/png"
      : bas.indexOf(".webp") >= 0 ? "image/webp"
      : "image/jpeg";

    return new NextResponse(new Uint8Array(octets), {
      status: 200,
      headers: {
        "Content-Type": type,
        "Content-Disposition": 'inline; filename="' + String(piece.nom || "document").replace(/[^a-zA-Z0-9._-]/g, "_") + '"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
