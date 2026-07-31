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

// ROUTE PUBLIQUE, sans session. Elle n expose QUE ce qui doit etre public :
// jamais le prix contractuel, le taux de prelevement ni l abonnement.
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = String(params.slug || "").trim().toLowerCase();
    if (!slug || slug.length < 2) {
      return NextResponse.json({ ok: false, erreur: "Adresse incomplete." }, { status: 400 });
    }

    const { data: org } = await supabase
      .from("organismes_formation")
      .select("tenant_id, raison_sociale, numero_da, email_contact, telephone, adresse, qualiopi, certificateur, portail_actif, portail_presentation, logo_url, couleur")
      .eq("slug", slug)
      .maybeSingle();

    if (!org || !org.portail_actif) {
      return NextResponse.json({ ok: false, erreur: "Page introuvable." }, { status: 404 });
    }

    const { data: propres } = await supabase
      .from("organisme_cours")
      .select("code, titre, description, objectifs, prerequis, public_cible, duree, prix, domaine")
      .eq("tenant_id", org.tenant_id)
      .eq("publie", true)
      .order("titre", { ascending: true })
      .limit(200);

    const { data: souscrites } = await supabase
      .from("organisme_catalogue")
      .select("formation_code, prix_vente_public")
      .eq("tenant_id", org.tenant_id)
      .eq("actif", true)
      .limit(500);

    const codes = (souscrites || []).map(function (c: any) { return c.formation_code; });

    const { data: fiches } = codes.length > 0
      ? await supabase
          .from("formations")
          .select("code, titre, description, duree, domaine")
          .in("code", codes)
          .limit(500)
      : { data: [] };

    const prixDe: any = {};
    for (const c of souscrites || []) {
      prixDe[c.formation_code] = Number(c.prix_vente_public) || null;
    }

    const catalogue = (fiches || []).map(function (f: any) {
      return {
        code: f.code,
        titre: f.titre,
        description: f.description,
        duree: f.duree,
        domaine: f.domaine,
        prix: prixDe[f.code],
      };
    });

    const miennes = (propres || []).map(function (c: any) {
      return {
        code: c.code,
        titre: c.titre,
        description: c.description,
        objectifs: c.objectifs,
        prerequis: c.prerequis,
        public_cible: c.public_cible,
        duree: c.duree,
        domaine: c.domaine,
        prix: Number(c.prix) || null,
      };
    });

    const domaines = Array.from(
      new Set(
        miennes.concat(catalogue)
          .map(function (f: any) { return f.domaine; })
          .filter(function (d: any) { return !!d; })
      )
    ).sort();

    return NextResponse.json({
      ok: true,
      organisme: {
        raison_sociale: org.raison_sociale,
        numero_da: org.numero_da,
        email_contact: org.email_contact,
        telephone: org.telephone,
        adresse: org.adresse,
        qualiopi: org.qualiopi === true,
        certificateur: org.certificateur,
        presentation: org.portail_presentation,
        logo_url: org.logo_url || null,
        couleur: org.couleur || "#0a3d2e",
      },
      total: miennes.length + catalogue.length,
      domaines: domaines,
      formations: miennes.concat(catalogue),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: "Page indisponible." }, { status: 500 });
  }
}

// Une demande d information depuis le portail cree un prospect DANS LE CRM DE
// L ORGANISME, cloisonne par son identifiant. Aucune lecture n est exposee ici.
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const slug = String(params.slug || "").trim().toLowerCase();

    const { data: org } = await supabase
      .from("organismes_formation")
      .select("tenant_id, portail_actif")
      .eq("slug", slug)
      .maybeSingle();

    if (!org || !org.portail_actif) {
      return NextResponse.json({ ok: false, erreur: "Page introuvable." }, { status: 404 });
    }

    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    function propre(v: any, max: number): string | null {
      if (v === null || v === undefined) return null;
      const t = String(v).replace(/[\u0000-\u001F\u007F]/g, "").trim();
      return t ? t.slice(0, max) : null;
    }

    const email = propre(b.email, 160);
    if (!email || email.indexOf("@") < 1 || email.indexOf(".") < 2 || email.length < 6) {
      return NextResponse.json(
        { ok: false, erreur: "Indiquez une adresse email valable." },
        { status: 400 }
      );
    }

    const fiche: any = {
      tenant_id: org.tenant_id,
      email: email.toLowerCase(),
      nom: propre(b.nom, 120),
      telephone: propre(b.telephone, 40),
      formation_interesse: propre(b.formation, 40),
      source: "formulaire",
      statut: "prospect",
      notes: propre(b.message, 1500),
      score: 35,
      derniere_interaction: new Date().toISOString(),
    };

    if (fiche.telephone) fiche.score = fiche.score + 15;
    if (fiche.formation_interesse) fiche.score = fiche.score + 25;

    const { data: existant } = await supabase
      .from("crm")
      .select("id")
      .eq("email", fiche.email)
      .eq("tenant_id", org.tenant_id)
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
      return NextResponse.json({ ok: false, erreur: "Enregistrement impossible." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: "Merci, votre demande est transmise. Vous serez contacte rapidement.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: "Envoi impossible." }, { status: 500 });
  }
}
