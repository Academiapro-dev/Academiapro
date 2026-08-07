import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = "https://academiapro.fr";
const COMMISSION_PAR_DEFAUT = 15;
const DUREE_COOKIE = 60 * 60 * 24 * 60; // soixante jours

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Un code lisible, tire du nom, suivi de quatre caracteres imprevisibles.
// L appelant peut aussi fournir le sien : l ancienne version fonctionnait
// ainsi et une page existante compte peut-etre dessus.
function fabriquerCode(nom: string): string {
  const base = String(nom || "PARTENAIRE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8) || "PARTENAIRE";

  const lettres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffixe = "";
  for (let i = 0; i < 4; i++) {
    suffixe += lettres.charAt(Math.floor(Math.random() * lettres.length));
  }
  return base + suffixe;
}

async function courriel(destinataire: string, sujet: string, html: string) {
  if (!destinataire || !process.env.RESEND_API_KEY) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AcadémIA Pro <contact@academiapro.fr>",
        to: destinataire,
        subject: sujet,
        html: html,
      }),
    });
  } catch (e) {
    console.error("courriel affiliation:", e);
  }
}

// ---- CLIC SUR UN LIEN DE PARRAINAGE, ou consultation d un tableau de bord ----
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = String(url.searchParams.get("code") || "").trim().toUpperCase();
    const vers = url.searchParams.get("vers") || "/";

    if (!code) {
      return NextResponse.json({ ok: false, erreur: "Code absent." }, { status: 400 });
    }

    const { data: affilie } = await supabase
      .from("affilies")
      .select("id, nom, code_affiliation, commission_pct, total_clics, total_ventes, total_gains, statut")
      .eq("code_affiliation", code)
      .maybeSingle();

    if (!affilie) {
      return NextResponse.json({ ok: false, erreur: "Code inconnu." }, { status: 404 });
    }

    // Consultation du tableau de bord : on ne compte pas de clic.
    if (url.searchParams.get("etat") === "oui") {
      return NextResponse.json({
        ok: true,
        nom: affilie.nom,
        code: affilie.code_affiliation,
        commission: Number(affilie.commission_pct) || COMMISSION_PAR_DEFAUT,
        clics: affilie.total_clics || 0,
        ventes: affilie.total_ventes || 0,
        gains: Number(affilie.total_gains) || 0,
        lien: SITE + "/api/affiliation?code=" + affilie.code_affiliation,
      });
    }

    if (String(affilie.statut || "actif") !== "actif") {
      return NextResponse.redirect(SITE + vers, 302);
    }

    await supabase
      .from("affilies")
      .update({ total_clics: (affilie.total_clics || 0) + 1 })
      .eq("id", affilie.id);

    // LE COOKIE PORTE L ATTRIBUTION. Un visiteur qui revient acheter trois
    // semaines plus tard reste rattache a celui qui l a envoye.
    const destination = vers.indexOf("http") === 0 ? vers : SITE + (vers.indexOf("/") === 0 ? vers : "/" + vers);
    const reponse = NextResponse.redirect(destination, 302);

    reponse.cookies.set("aff", affilie.code_affiliation, {
      maxAge: DUREE_COOKIE,
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      secure: true,
    });

    return reponse;
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// ---- INSCRIPTION D UN NOUVEL AFFILIE ----
export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ success: false, ok: false, message: "Requete illisible" }, { status: 400 });
    }

    // Champ piege : rempli, c est un robot.
    if (String(b.societe_bis || "").trim().length > 0) {
      return NextResponse.json({ success: true, ok: true, code: "MERCI" });
    }

    const nom = String(b.nom || "").trim();
    const email = String(b.email || "").toLowerCase().trim();

    if (nom.length < 2) {
      return NextResponse.json({ success: false, ok: false, message: "Indiquez votre nom." }, { status: 400 });
    }
    if (email.indexOf("@") < 1 || email.indexOf(".") < 0) {
      return NextResponse.json({ success: false, ok: false, message: "Adresse electronique invalide." }, { status: 400 });
    }

    // Deja inscrit : on lui redonne son code plutot que d en creer un second.
    const { data: existant } = await supabase
      .from("affilies")
      .select("code_affiliation, commission_pct")
      .eq("email", email)
      .maybeSingle();

    if (existant) {
      return NextResponse.json({
        success: false,
        ok: true,
        deja_inscrit: true,
        message: "Cet email est deja inscrit",
        code: existant.code_affiliation,
        commission: Number(existant.commission_pct) || COMMISSION_PAR_DEFAUT,
        lien: SITE + "/api/affiliation?code=" + existant.code_affiliation,
      });
    }

    // Code fourni par l appelant, sinon fabrique ici.
    let code = String(b.code_affiliation || "").trim().toUpperCase();
    if (code.length < 3) code = fabriquerCode(nom);

    const { data: pris } = await supabase
      .from("affilies")
      .select("id")
      .eq("code_affiliation", code)
      .maybeSingle();
    if (pris) code = fabriquerCode(nom);

    const { error } = await supabase.from("affilies").insert({
      nom: nom,
      email: email,
      code_affiliation: code,
      commission_pct: COMMISSION_PAR_DEFAUT,
      total_clics: 0,
      total_ventes: 0,
      total_gains: 0,
      statut: "actif",
    });

    if (error) {
      const texte = String(error.message || "");
      if (texte.indexOf("duplicate") >= 0) {
        return NextResponse.json({ success: false, ok: false, message: "Cet email est deja inscrit" });
      }
      return NextResponse.json({ success: false, ok: false, message: texte }, { status: 500 });
    }

    const lien = SITE + "/api/affiliation?code=" + code;

    await courriel(
      email,
      "Bienvenue dans le Programme Affilié AcadémIA Pro",
      '<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px;line-height:1.7;color:#1a1a1a">' +
      '<h1 style="color:#c8a96e">AcadémIA Pro — Programme Affilié</h1>' +
      "<h2>Bienvenue " + nom + "</h2>" +
      "<p>Votre compte partenaire est créé. Voici votre lien unique : toute personne qui " +
      "l'utilise vous est rattachée pendant soixante jours, même si elle achète plus tard.</p>" +
      '<div style="background:#f8f4ee;padding:15px;border-radius:8px;margin:20px 0">' +
      "<strong>Lien :</strong> " + lien + "<br/>" +
      "<strong>Code :</strong> " + code + "<br/>" +
      "<strong>Commission :</strong> " + COMMISSION_PAR_DEFAUT + " % sur chaque vente" +
      "</div>" +
      '<p>Suivez vos résultats à tout moment : <a href="' + SITE + "/partenaire?code=" + code + '">votre tableau de bord</a></p>' +
      "<p>Jacques, fondateur — AcadémIA Pro</p></div>"
    );

    await courriel(
      "contact@academiapro.fr",
      "Nouveau partenaire : " + nom,
      "<p><strong>" + nom + "</strong> — " + email + "<br>Code : " + code + "</p>"
    );

    return NextResponse.json({
      success: true,
      ok: true,
      code: code,
      commission: COMMISSION_PAR_DEFAUT,
      lien: lien,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, ok: false, message: "Erreur serveur" }, { status: 500 });
  }
}
