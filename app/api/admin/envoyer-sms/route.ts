import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];
const URL_BREVO = "https://api.brevo.com/v3/transactionalSMS/sms";

// L EXPEDITEUR AFFICHE. Onze caracteres au maximum, lettres et chiffres
// seulement : c est une contrainte des operateurs, pas de Brevo.
const EXPEDITEUR = "AcademiaPro";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// LE NUMERO AU FORMAT INTERNATIONAL, SANS PLUS NI ESPACES.
//
// Brevo attend 33612345678. Les numeros venus de Dropcontact arrivent en
// "+33 6 12 34 56 78", ceux saisis a la main en "06 12 34 56 78". On
// normalise les deux plutot que d exiger une saisie parfaite.
function numeroPropre(brut: string): string | null {
  let t = String(brut || "").replace(/[^0-9+]/g, "");
  if (!t) return null;

  if (t.indexOf("+") === 0) t = t.slice(1);
  else if (t.indexOf("00") === 0) t = t.slice(2);
  else if (t.indexOf("0") === 0) t = "33" + t.slice(1);

  if (/^33[1-9]\d{8}$/.test(t)) return t;
  if (/^\d{8,15}$/.test(t)) return t;

  return null;
}

// LE SMS EST LIMITE. Cent soixante caracteres pour un message simple ;
// au-dela, l operateur le decoupe et facture chaque morceau. On le compte
// pour que la depense ne soit jamais une surprise.
function morceaux(texte: string): number {
  const n = String(texte || "").length;
  if (n <= 160) return 1;
  return Math.ceil(n / 153);
}

export async function POST(req: NextRequest) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const cle = process.env.BREVO_API_KEY || "";
    if (!cle) {
      return NextResponse.json(
        { ok: false, erreur: "BREVO_API_KEY absente des variables Vercel." },
        { status: 500 }
      );
    }

    const b = await req.json().catch(function () { return null; });
    if (!b || !b.numero || !b.message) {
      return NextResponse.json(
        { ok: false, erreur: "Numero et message sont obligatoires." },
        { status: 400 }
      );
    }

    const numero = numeroPropre(b.numero);
    if (!numero) {
      return NextResponse.json(
        { ok: false, erreur: "Numero illisible : " + String(b.numero).slice(0, 30) },
        { status: 400 }
      );
    }

    const texte = String(b.message).trim();
    if (texte.length < 2) {
      return NextResponse.json({ ok: false, erreur: "Message vide." }, { status: 400 });
    }
    if (texte.length > 640) {
      return NextResponse.json(
        { ok: false, erreur: "Message trop long : 640 caracteres au maximum." },
        { status: 400 }
      );
    }

    // LE MARQUAGE PRECEDE L ENVOI, comme pour les courriels. Si l appel
    // echoue en cours de route, la trace existe deja : mieux vaut une
    // ligne en erreur qu un envoi dont on ignore tout.
    const { data: trace } = await supabase
      .from("sms_envoyes")
      .insert({
        destinataire: numero,
        message: texte,
        origine: b.origine ? String(b.origine).slice(0, 60) : "manuel",
        reference_id: b.reference_id || null,
        statut: "en_cours",
        envoye_par: email,
      })
      .select("id")
      .maybeSingle();

    const r = await fetch(URL_BREVO, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": cle,
        accept: "application/json",
      },
      body: JSON.stringify({
        type: "transactional",
        sender: EXPEDITEUR,
        recipient: numero,
        content: texte,
      }),
    });

    const brut = await r.text();
    let reponse: any = null;
    try { reponse = JSON.parse(brut); } catch (e) {}

    if (!r.ok) {
      if (trace) {
        await supabase
          .from("sms_envoyes")
          .update({ statut: "echec", erreur: brut.slice(0, 400) })
          .eq("id", trace.id);
      }
      return NextResponse.json(
        {
          ok: false,
          erreur: "Brevo a repondu " + r.status,
          detail: brut.slice(0, 400),
        },
        { status: 500 }
      );
    }

    const identifiant = reponse && (reponse.messageId || reponse.reference)
      ? String(reponse.messageId || reponse.reference)
      : null;

    if (trace) {
      await supabase
        .from("sms_envoyes")
        .update({ statut: "envoye", message_id: identifiant })
        .eq("id", trace.id);
    }

    const nb = morceaux(texte);

    return NextResponse.json({
      ok: true,
      destinataire: numero,
      caracteres: texte.length,
      sms_decomptes: nb,
      message_id: identifiant,
      message: "SMS envoye a " + numero
        + (nb > 1 ? " — attention, " + nb + " SMS decomptes." : "."),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
