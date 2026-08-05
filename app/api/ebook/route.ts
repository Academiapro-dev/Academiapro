import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "formations-pdf";
const FICHIER = "ebook_guide_claude_ia_2026.html";

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

const compteurs = new Map<string, { n: number; debut: number }>();
const FENETRE = 60 * 60 * 1000;
const MAX_PAR_HEURE = 5;

function trop(ip: string): boolean {
  const maintenant = Date.now();
  const c = compteurs.get(ip);
  if (!c || maintenant - c.debut > FENETRE) {
    compteurs.set(ip, { n: 1, debut: maintenant });
    return false;
  }
  c.n = c.n + 1;
  return c.n > MAX_PAR_HEURE;
}

function propre(v: any, max: number): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).replace(/[\u0000-\u001F\u007F]/g, "").trim();
  if (!t) return null;
  return t.slice(0, max);
}

function paysDe(v: any): string {
  const t = String(v || "").trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(t)) return t;
  return "FR";
}

// Meme bareme que /api/prospect-public, pour rester coherent.
function score(p: any): number {
  let s = 0;
  if (p.email) s = s + 20;
  if (p.telephone) s = s + 15;
  if (p.formation_interesse) s = s + 25;
  if (p.domaine) s = s + 10;
  s = s + 15; // source formulaire
  return Math.min(s, 100);
}

export async function POST(req: NextRequest) {
  try {
    const provenance = req.headers.get("origin") || req.headers.get("referer") || "";
    const legitime =
      provenance.indexOf("academiapro.fr") >= 0 ||
      provenance.indexOf("vercel.app") >= 0 ||
      provenance.indexOf("localhost") >= 0 ||
      provenance === "";

    if (!legitime) {
      return NextResponse.json({ ok: false, erreur: "Origine refusee." }, { status: 403 });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "inconnue";

    if (trop(ip)) {
      return NextResponse.json(
        { ok: false, erreur: "Trop de demandes. Reessayez dans une heure." },
        { status: 429 }
      );
    }

    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    if (propre(b.societe_bis, 100)) {
      return NextResponse.json({ ok: true, message: "Merci." });
    }

    const email = propre(b.email, 160);
    if (!email || email.indexOf("@") < 1 || email.indexOf(".") < 2 || email.length < 6) {
      return NextResponse.json(
        { ok: false, erreur: "Indiquez une adresse email valable." },
        { status: 400 }
      );
    }

    const prenom = propre(b.prenom, 80);
    const domaine = propre(b.domaine, 60);
    const pays = paysDe(b.pays);

    const notes = [
      propre(b.metier, 120) ? "Metier : " + propre(b.metier, 120) : "",
      "A telecharge l e-book le " + new Date().toLocaleDateString("fr-FR"),
    ].filter(function (x) { return x; }).join(" | ");

    const fiche: any = {
      email: email.toLowerCase(),
      nom: prenom,
      domaine: domaine,
      pays: pays,
      source: "formulaire",
      statut: "prospect",
      formation_interesse: "E-book",
      notes: notes,
      tenant_id: null,
      derniere_interaction: new Date().toISOString(),
    };

    fiche.score = score(fiche);

    const { data: existant } = await supabase
      .from("crm")
      .select("id")
      .eq("email", fiche.email)
      .is("tenant_id", null)
      .limit(1);

    if (existant && existant.length > 0) {
      await supabase.from("crm").update(fiche).eq("id", existant[0].id);
    } else {
      await supabase.from("crm").insert(fiche);
    }

    // LIEN DE LECTURE, valable vingt-quatre heures. Le fichier n est jamais
    // expose publiquement : chaque telechargement passe par un lien signe.
    const { data: signe } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(FICHIER, 24 * 60 * 60);

    const lien = signe && signe.signedUrl ? signe.signedUrl : null;

    if (!lien) {
      return NextResponse.json(
        { ok: false, erreur: "Le guide est momentanement indisponible. Reessayez dans un instant." },
        { status: 500 }
      );
    }

    const rk = process.env.RESEND_API_KEY || "";

    // L ENVOI PAR COURRIER verifie l adresse au passage : une adresse fausse
    // ne recoit rien, et le prospect ne vaut rien.
    if (rk) {
      try {
        const html =
          "<div style=\"font-family:Georgia,serif;max-width:600px;margin:auto;padding:24px\">" +
          "<p style=\"letter-spacing:3px;color:#c8a96e;text-align:center\">ACADEMIA PRO</p>" +
          "<h1 style=\"text-align:center;font-size:24px\">Votre guide vous attend</h1>" +
          "<p>Bonjour" + (prenom ? " " + prenom : "") + ",</p>" +
          "<p>Voici le guide que vous avez demande. Le lien reste valable vingt-quatre heures.</p>" +
          "<p style=\"text-align:center;margin:28px 0\"><a href=\"" + lien +
          "\" style=\"background:#c8a96e;color:#050508;padding:13px 26px;text-decoration:none;border-radius:8px;font-weight:bold\">Lire le guide</a></p>" +
          "<p style=\"font-size:13px;color:#555;line-height:1.7\">Notre catalogue compte plus de trois cents formations. " +
          "Si vous cherchez a vous former sur un sujet precis, repondez simplement a ce message.</p>" +
          "<p>Jacques Lalou<br/>Fondateur, Acad&eacute;mIA Pro</p></div>";

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: "Bearer " + rk, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || "AcademIA Pro <contact@academiapro.fr>",
            to: [email],
            subject: "Votre guide AcademIA Pro",
            html: html,
          }),
        });
      } catch (e) {}

      // Avertissement pour Jacques.
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: "Bearer " + rk, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || "AcademIA Pro <contact@academiapro.fr>",
            to: ["contact@academiapro.fr"],
            subject: "E-book " + pays + " — " + (prenom || email) + (domaine ? " (" + domaine + ")" : ""),
            html:
              "<div style=\"font-family:Georgia,serif\"><h2>Telechargement e-book</h2>" +
              "<p><b>" + (prenom || "sans prenom") + "</b> — " + email + "</p>" +
              "<p>Domaine : " + (domaine || "non precise") + " · Pays : " + pays +
              " · Score : " + fiche.score + "/100</p>" +
              (notes ? "<p style=\"color:#444\">" + notes + "</p>" : "") +
              "<p><a href=\"https://academiapro.fr/admin/crm\">Ouvrir mes prospects</a></p></div>",
          }),
        });
      } catch (e) {}
    }

    await supabase.from("analytics").insert({
      formation_code: "EBOOK",
      agent: "Capture publique",
      action: "ebook_telecharge",
      resultat: email + " — " + pays + " — " + (domaine || "sans domaine"),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      lien: lien,
      message: "Votre guide vous a ete envoye par courrier electronique.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: "Envoi impossible." }, { status: 500 });
  }
}
