import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// L OUVERTURE D UN ACCES CLIENT, PAR LE CABINET.
//
// Le cabinet designe un dirigeant, la plateforme lui envoie son lien. Ce
// lien vaut cle : il ouvre le dossier, et lui seul.
//
// LE JETON EST LONG ET ALEATOIRE. Trente-deux octets, soit soixante-quatre
// caracteres : personne ne le devine, et il n a pas besoin d etre retenu
// puisqu il voyage dans le courriel.
//
// Le tenant vient de la SESSION du cabinet, jamais de la requete. Un
// cabinet ne peut ouvrir un acces que sur ses propres dossiers.

function jetonNeuf(): string {
  return crypto.randomBytes(32).toString("hex");
}

function propre(v: any, max: number): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).replace(/[\u0000-\u001F\u007F]/g, "").trim();
  return t.length > 0 ? t.slice(0, max) : null;
}

// Lecture : les acces ouverts sur un dossier.
export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || !session.tenantId) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const societeId = new URL(req.url).searchParams.get("societe");
    if (!societeId) {
      return NextResponse.json({ ok: false, erreur: "Dossier non precise." }, { status: 400 });
    }

    // Le dossier doit appartenir au cabinet connecte.
    const { data: societe } = await supabase
      .from("compta_societes")
      .select("id, raison_sociale")
      .eq("id", societeId)
      .eq("tenant_id", session.tenantId)
      .maybeSingle();

    if (!societe) {
      return NextResponse.json({ ok: false, erreur: "Dossier introuvable." }, { status: 404 });
    }

    const { data } = await supabase
      .from("compta_acces_client")
      .select("id, email, nom, actif, cree_le, derniere_visite")
      .eq("societe_id", societeId)
      .order("cree_le", { ascending: false })
      .limit(50);

    return NextResponse.json({
      ok: true,
      societe: societe.raison_sociale,
      acces: data || [],
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || !session.tenantId) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible." }, { status: 400 });
    }

    const societeId = propre(b.societe_id, 60);
    const email = propre(b.email, 160);
    const nom = propre(b.nom, 120);

    if (!societeId || !email || email.indexOf("@") < 1) {
      return NextResponse.json(
        { ok: false, erreur: "Le dossier et une adresse valable sont necessaires." },
        { status: 400 }
      );
    }

    const { data: societe } = await supabase
      .from("compta_societes")
      .select("id, raison_sociale")
      .eq("id", societeId)
      .eq("tenant_id", session.tenantId)
      .maybeSingle();

    if (!societe) {
      return NextResponse.json({ ok: false, erreur: "Dossier introuvable." }, { status: 404 });
    }

    const jeton = jetonNeuf();

    // Un acces par adresse et par dossier. Si l adresse existe deja, on
    // renouvelle son jeton plutot que d en creer un second : deux liens
    // valables pour la meme personne seraient ingerables.
    const { data: deja } = await supabase
      .from("compta_acces_client")
      .select("id")
      .eq("societe_id", societeId)
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (deja) {
      const { error } = await supabase
        .from("compta_acces_client")
        .update({ jeton: jeton, nom: nom, actif: true })
        .eq("id", deja.id);

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }
    } else {
      const { error } = await supabase.from("compta_acces_client").insert({
        societe_id: societeId,
        tenant_id: session.tenantId,
        email: email.toLowerCase(),
        nom: nom,
        jeton: jeton,
      });

      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }
    }

    const lien = "https://mrcomptable.fr/comptable/espace?j=" + jeton;

    const rk = process.env.RESEND_API_KEY || "";
    let envoye = false;

    if (rk && b.envoyer !== false) {
      try {
        const html =
          "<div style=\"font-family:Georgia,serif;max-width:600px;margin:auto;padding:24px;color:#222\">"
          + "<p style=\"letter-spacing:3px;color:#1a3a6b;text-align:center;font-size:12px\">MR. COMPTABLE</p>"
          + "<h1 style=\"font-size:21px;text-align:center;margin:6px 0 24px\">Votre espace est ouvert</h1>"
          + "<p>Bonjour" + (nom ? " " + nom : "") + ",</p>"
          + "<p>Votre cabinet vous a ouvert un espace pour <b>" + societe.raison_sociale
          + "</b>. Vous y verrez les justificatifs attendus, et vous pourrez les "
          + "envoyer en photographiant simplement le document.</p>"
          + "<p style=\"text-align:center;margin:28px 0\">"
          + "<a href=\"" + lien + "\" style=\"background:#1a3a6b;color:#fff;padding:14px 28px;"
          + "text-decoration:none;border-radius:8px;font-weight:bold\">Ouvrir mon espace</a></p>"
          + "<p style=\"font-size:13px;color:#666;line-height:1.7\">Aucun mot de passe à "
          + "retenir : ce lien vous connecte directement. Ajoutez-le à vos favoris, ou "
          + "à l'écran d'accueil de votre téléphone.</p>"
          + "<p style=\"font-size:13px;color:#666;line-height:1.7\"><b>Ce lien vous est "
          + "personnel.</b> Ne le transmettez à personne : il donne accès à votre "
          + "comptabilité.</p></div>";

        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: "Bearer " + rk, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Mr. Comptable <contact@mrcomptable.fr>",
            to: [email],
            subject: "Votre espace " + societe.raison_sociale,
            html: html,
          }),
        });
        envoye = r.ok;
      } catch (e) {}
    }

    return NextResponse.json({
      ok: true,
      lien: lien,
      courriel_envoye: envoye,
      message: envoye
        ? "L acces est ouvert et le lien a ete envoye."
        : "L acces est ouvert. Transmettez le lien vous-meme.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// Revocation : le dirigeant part, le lien cesse de fonctionner.
export async function DELETE(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || !session.tenantId) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Acces non precise." }, { status: 400 });
    }

    const { error } = await supabase
      .from("compta_acces_client")
      .update({ actif: false })
      .eq("id", id)
      .eq("tenant_id", session.tenantId);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, revoque: id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
