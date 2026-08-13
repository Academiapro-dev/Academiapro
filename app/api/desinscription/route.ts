import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

// Le meme calcul que celui qui a fabrique le lien : sans le secret du site,
// personne ne peut desinscrire quelqu un d autre.
function jetonAttendu(email: string): string {
  const secret = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return crypto.createHmac("sha256", secret).update(email.toLowerCase()).digest("hex").slice(0, 32);
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(function () { return null; });
    if (!b || !b.email || !b.jeton) {
      return NextResponse.json({ ok: false, erreur: "Lien incomplet." }, { status: 400 });
    }

    const email = String(b.email).trim().toLowerCase();
    const jeton = String(b.jeton).trim();

    if (jeton !== jetonAttendu(email)) {
      return NextResponse.json(
        { ok: false, erreur: "Ce lien n est pas valable." },
        { status: 403 }
      );
    }

    // La desinscription vaut pour tous les organismes : une personne qui ne
    // veut plus rien recevoir ne doit pas avoir a le redire a chacun.
    const { error } = await supabase
      .from("crm")
      .update({ desinscrit: true, derniere_interaction: new Date().toISOString() })
      .eq("email", email);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // LA MEME OPPOSITION VAUT POUR LA PROSPECTION FROIDE. Sans cette
    // seconde ecriture, un organisme desinscrit resterait joignable par les
    // campagnes : c est precisement ce qu il refuse.
    //
    // On n echoue pas si l adresse est absente de cette table : la personne
    // a exerce son droit, la reponse doit rester la meme dans tous les cas.
    const { error: errOrg } = await supabase
      .from("prospects_organismes")
      .update({ desabonne: true, statut: "desabonne" })
      .eq("email", email);

    if (errOrg) {
      return NextResponse.json({ ok: false, erreur: errOrg.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
