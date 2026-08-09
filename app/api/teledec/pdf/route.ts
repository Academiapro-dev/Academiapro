import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ADMINS = ["contact@academiapro.fr"];
const BUCKET = "documents-signes";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// LA LIASSE DEPOSEE, SERVIE DEPUIS NOTRE PROPRE DOMAINE.
//
// Deux raisons, et les deux comptent.
//
// D abord le cloisonnement : le coffre est prive, et le tenant vient de la
// SESSION. Un lien signe Supabase, une fois copie, s ouvrirait pour
// n importe qui — or une liasse porte le resultat d une entreprise.
//
// Ensuite l affichage : sur iPad, un lien signe Supabase s ouvre en page
// blanche. Servir le fichier avec son propre Content-Type et un
// Content-Disposition inline le fait afficher normalement.
export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const reference = new URL(req.url).searchParams.get("reference");
    if (!reference) {
      return NextResponse.json({ ok: false, erreur: "Declaration non precisee." }, { status: 400 });
    }

    const { data: declaration } = await supabase
      .from("teledec_declarations")
      .select("tenant_id, pdf_chemin, reference")
      .eq("reference", reference)
      .maybeSingle();

    if (!declaration || !declaration.pdf_chemin) {
      return NextResponse.json({ ok: false, erreur: "Aucune liasse deposee." }, { status: 404 });
    }

    // LE BARRAGE. La liasse appartient a un dossier : seul ce dossier — ou
    // l administrateur — peut la lire.
    const email = String(session.email || "").toLowerCase().trim();
    const estAdmin = ADMINS.indexOf(email) >= 0;

    if (!estAdmin && session.tenantId !== declaration.tenant_id) {
      // On repond comme si le document n existait pas : dire « interdit »
      // confirmerait qu une liasse existe pour cette reference.
      return NextResponse.json({ ok: false, erreur: "Aucune liasse deposee." }, { status: 404 });
    }

    const { data: fichier, error } = await supabase.storage
      .from(BUCKET)
      .download(declaration.pdf_chemin);

    if (error || !fichier) {
      return NextResponse.json({ ok: false, erreur: "Fichier introuvable au coffre." }, { status: 404 });
    }

    const octets = Buffer.from(await fichier.arrayBuffer());

    return new NextResponse(new Uint8Array(octets), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="liasse-' + reference + '.pdf"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
