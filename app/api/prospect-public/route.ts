import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

const SOURCES = ["formulaire", "webinaire", "chat", "recommandation", "reseaux", "autre"];

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
  if (!t) return null;
  return t.slice(0, max);
}

function score(p: any): number {
  let s = 0;
  if (p.email) s = s + 20;
  if (p.telephone) s = s + 15;
  if (p.formation_interesse) s = s + 25;
  if (p.domaine) s = s + 10;
  if (p.source === "webinaire") s = s + 20;
  else if (p.source === "formulaire") s = s + 15;
  else if (p.source === "chat") s = s + 10;
  return Math.min(s, 100);
}

// Porte publique, volontairement etroite : on INSERE un prospect, on ne lit
// jamais rien, et l organisme reste nul — ces prospects sont ceux d AcadeMIA.
// Aucune lecture n est exposee ici, donc aucune fuite possible.
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

    // CHAMP PIEGE : invisible pour un humain, rempli par les robots. On repond
    // OK sans rien enregistrer, pour ne pas les renseigner.
    if (propre(b.societe_bis, 100)) {
      return NextResponse.json({ ok: true, message: "Merci, votre demande est enregistree." });
    }

    const email = propre(b.email, 160);
    if (!email || email.indexOf("@") < 1 || email.indexOf(".") < 2 || email.length < 6) {
      return NextResponse.json(
        { ok: false, erreur: "Indiquez une adresse email valable." },
        { status: 400 }
      );
    }

    const source = SOURCES.indexOf(String(b.source || "")) >= 0 ? String(b.source) : "formulaire";

    // Les champs de qualification sectorielle sont replies dans les notes :
    // ils varient d un tunnel a l autre et ne meritent pas de colonne.
    const notes = [
      propre(b.societe, 160) ? "Societe : " + propre(b.societe, 160) : "",
      propre(b.effectif, 60) ? "Effectif : " + propre(b.effectif, 60) : "",
      propre(b.secteur, 80) ? "Secteur : " + propre(b.secteur, 80) : "",
      propre(b.certifie, 40) ? "Qualiopi : " + propre(b.certifie, 40) : "",
      propre(b.stagiaires_an, 60) ? "Stagiaires par an : " + propre(b.stagiaires_an, 60) : "",
      propre(b.message, 1200) || "",
    ].filter(function (x) { return x; }).join(" | ");

    const fiche: any = {
      email: email.toLowerCase(),
      nom: propre(b.nom, 120),
      telephone: propre(b.telephone, 40),
      formation_interesse: propre(b.formation_interesse, 40),
      domaine: propre(b.domaine, 60),
      source: source,
      statut: "prospect",
      notes: notes || null,
      tenant_id: null,
      derniere_interaction: new Date().toISOString(),
    };

    fiche.score = score(fiche);

    // Une adresse deja connue ne cree pas de doublon : on met a jour.
    const { data: existant } = await supabase
      .from("crm")
      .select("id")
      .eq("email", fiche.email)
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

    await supabase.from("analytics").insert({
      formation_code: fiche.formation_interesse || "CRM",
      agent: "Capture publique",
      action: "prospect_capture",
      resultat: fiche.email + " — score " + fiche.score + " — " + source,
      timestamp: new Date().toISOString(),
    });

    // AVERTISSEMENT IMMEDIAT : un prospect qui attend trois jours est perdu.
    const rk = process.env.RESEND_API_KEY || "";
    if (rk) {
      try {
        const html =
          "<div style=\"font-family:Georgia,serif;max-width:600px;margin:auto\">" +
          "<h2>Nouvelle demande</h2>" +
          "<p><b>" + (fiche.nom || fiche.email) + "</b> — " + fiche.email +
          (fiche.telephone ? " — " + fiche.telephone : "") + "</p>" +
          "<p>Score : <b>" + fiche.score + "/100</b> · Secteur : " + (fiche.domaine || "non precise") + "</p>" +
          (notes ? "<p style=\"color:#444\">" + notes + "</p>" : "") +
          "<p><a href=\"https://academiapro.fr/organisme/crm\">Ouvrir le CRM</a></p></div>";

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: "Bearer " + rk, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || "AcademIA Pro <contact@academiapro.fr>",
            to: ["contact@academiapro.fr"],
            subject: "Prospect " + fiche.score + "/100 — " + (fiche.nom || fiche.email),
            html: html,
          }),
        });
      } catch (e) {}
    }

    // On ne renvoie ni le score ni l identifiant : rien qui renseigne
    // un curieux sur l etat de la base.
    return NextResponse.json({ ok: true, message: "Merci, votre demande est enregistree." });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: "Enregistrement impossible." }, { status: 500 });
  }
}
