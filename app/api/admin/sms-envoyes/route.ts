import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMINS = ["contact@academiapro.fr"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// L HISTORIQUE DES SMS ENVOYES.
//
// La table sms_envoyes porte la trace de chaque envoi, y compris ceux qui
// ont echoue : le marquage precede l appel a Brevo, donc une ligne existe
// meme quand la route est coupee en cours de route. C est ce qui permet de
// savoir ce qui est reellement parti — et ce qui a echoue en silence.
export async function GET() {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json(
        { ok: false, erreur: "reserve a l administrateur" },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("sms_envoyes")
      .select("id, destinataire, message, statut, erreur, message_id, origine, created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json(
        { ok: false, erreur: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, lignes: data || [] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
