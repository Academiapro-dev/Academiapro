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

    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    const email = propre(b.email, 160);
    if (!email || email.indexOf("@") < 1 || email.indexOf(".") < 2 || email.length < 6) {
      return NextResponse.json(
        { ok: false, erreur: "Indiquez une adresse email valable." },
        { status: 400 }
      );
    }

    const source = SOURCES.indexOf(String(b.source || "")) >= 0 ? String(b.source) : "formulaire";

    const fiche: any = {
      email: email.toLowerCase(),
      nom: propre(b.nom, 120),
      telephone: propre(b.telephone, 40),
      formation_interesse: propre(b.formation_interesse, 40),
      domaine: propre(b.domaine, 60),
      source: source,
      statut: "prospect",
      notes: propre(b.message, 1500),
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

    // On ne renvoie ni le score ni l identifiant : rien qui renseigne
    // un curieux sur l etat de la base.
    return NextResponse.json({ ok: true, message: "Merci, votre demande est enregistree." });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: "Enregistrement impossible." }, { status: 500 });
  }
}
