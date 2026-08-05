import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SB_URL, KEY);

// Memoire courte du serveur : combien de demandes par adresse, sur une heure.
// Suffit contre un envoi repete ; ce n est pas une protection absolue.
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
  return t ? t.slice(0, max) : null;
}

// Meme bareme que scorer_prospect dans /api/crm, pour rester coherent.
function scorer(p: any): number {
  let s = 0;
  if (p.email) s = s + 20;
  if (p.telephone) s = s + 15;
  if (p.formation_interesse) s = s + 25;
  if (p.domaine) s = s + 10;
  s = s + 15; // source formulaire
  return Math.min(s, 100);
}

export async function POST(req: Request) {
  try {
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
      return NextResponse.json({ ok: false, erreur: "Requete illisible." }, { status: 400 });
    }

    // CHAMP PIEGE : invisible pour un humain, rempli par les robots.
    // On repond OK sans rien enregistrer, pour ne pas les renseigner.
    if (propre(b.societe_bis, 100)) {
      return NextResponse.json({ ok: true, message: "Demande enregistree." });
    }

    const email = String(b.email || "").trim().toLowerCase();
    if (!email || email.indexOf("@") < 1 || email.length > 160) {
      return NextResponse.json({ ok: false, erreur: "Adresse electronique invalide." }, { status: 400 });
    }

    const nom = propre(b.nom, 120);
    if (!nom) {
      return NextResponse.json({ ok: false, erreur: "Merci d indiquer votre nom." }, { status: 400 });
    }

    const fiche: any = {
      nom: nom,
      prenom: propre(b.prenom, 80),
      email: email,
      telephone: propre(b.telephone, 30),
      formation_interesse: propre(b.formation_interesse, 160),
      domaine: propre(b.domaine, 80),
      source: "formulaire",
      statut: "prospect",
      tenant_id: null,
      notes: [
        propre(b.societe, 160) ? "Societe : " + propre(b.societe, 160) : "",
        propre(b.effectif, 60) ? "Effectif : " + propre(b.effectif, 60) : "",
        propre(b.certifie, 40) ? "Qualiopi : " + propre(b.certifie, 40) : "",
        propre(b.stagiaires_an, 60) ? "Stagiaires par an : " + propre(b.stagiaires_an, 60) : "",
        propre(b.secteur, 60) ? "Secteur : " + propre(b.secteur, 60) : "",
        propre(b.message, 1200) || "",
      ].filter(function (x) { return x; }).join(" | "),
      derniere_interaction: new Date().toISOString(),
    };

    fiche.score = scorer(fiche);

    // Une adresse deja connue est mise a jour, jamais dupliquee.
    const { data: existant } = await supabase
      .from("crm")
      .select("id")
      .eq("email", email)
      .is("tenant_id", null)
      .limit(1);

    let erreur = null;
    if (existant && existant.length > 0) {
      const r = await supabase.from("crm").update(fiche).eq("id", existant[0].id);
      erreur = r.error;
    } else {
      const r = await supabase.from("crm").insert(fiche);
      erreur = r.error;
    }

    if (erreur) {
      return NextResponse.json({ ok: false, erreur: erreur.message }, { status: 500 });
    }

    // AVERTISSEMENT IMMEDIAT : un prospect qui attend trois jours est perdu.
    const rk = process.env.RESEND_API_KEY || "";
    if (rk) {
      try {
        const html =
          "<div style=\"font-family:Georgia,serif;max-width:600px;margin:auto\">" +
          "<h2>Nouvelle demande de rendez-vous</h2>" +
          "<p><b>" + nom + "</b> — " + email +
          (fiche.telephone ? " — " + fiche.telephone : "") + "</p>" +
          "<p>Score : <b>" + fiche.score + "/100</b> · Secteur : " + (fiche.domaine || "non precise") + "</p>" +
          (fiche.notes ? "<p style=\"color:#444\">" + fiche.notes + "</p>" : "") +
          "<p><a href=\"https://academiapro.fr/organisme/crm\">Ouvrir le CRM</a></p></div>";

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: "Bearer " + rk, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || "AcademIA Pro <contact@academiapro.fr>",
            to: ["contact@academiapro.fr"],
            subject: "Prospect " + fiche.score + "/100 — " + nom + (fiche.domaine ? " (" + fiche.domaine + ")" : ""),
            html: html,
          }),
        });
      } catch (e) {}
    }

    return NextResponse.json({
      ok: true,
      score: fiche.score,
      message: "Demande enregistree. Nous vous rappelons sous 48 heures ouvrees.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
