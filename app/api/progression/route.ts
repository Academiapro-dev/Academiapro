import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMINS = ["contact@academiapro.fr"];

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

async function declencherCertificatSiComplet(email: string, formationCode: string) {
  const { data: formationLms } = await supabase
    .from("formations_lms")
    .select("contenu")
    .eq("formation_code", formationCode)
    .single();

  if (!formationLms) return;

  const chapitres = formationLms.contenu?.chapitres || [];
  let totalModules = 0;
  chapitres.forEach((c: any) => { totalModules += (c.modules?.length || 0); });

  const { data: valides } = await supabase
    .from("progression_apprenants")
    .select("id")
    .eq("user_email", email)
    .eq("formation_code", formationCode)
    .eq("statut", "valide");

  const nbValides = valides?.length || 0;

  if (totalModules > 0 && nbValides >= totalModules) {
    const { data: dejaExiste } = await supabase
      .from("certificats_delivres")
      .select("id")
      .eq("user_email", email)
      .eq("formation_code", formationCode)
      .limit(1);

    if (dejaExiste && dejaExiste.length > 0) return;

    const { data: crmData } = await supabase
      .from("crm")
      .select("nom")
      .eq("email", email)
      .limit(1);

    const nom = crmData && crmData[0] ? crmData[0].nom : email;
    const titre = formationLms.contenu?.titre || formationCode;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://academiapro.fr";
    await fetch(baseUrl + "/api/admin/certificat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: nom || email,
        formation: titre,
        code: formationCode,
        niveau: "Expert",
        date: new Date().toLocaleDateString("fr-FR"),
        userEmail: email,
      }),
    });
  }
}

// LECTURE. L email vient de la session, jamais de l adresse. Et si la session
// porte un organisme, la lecture est CLOISONNEE a cet organisme.
export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Connectez-vous pour retrouver votre progression." },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const formationCode = (url.searchParams.get("formation_code") || "").trim().toUpperCase();

    const demande = (url.searchParams.get("email") || "").trim().toLowerCase();
    const estAdmin = ADMINS.indexOf(session.email) >= 0;
    const email = demande && estAdmin ? demande : session.email;

    let requete = supabase
      .from("progression_apprenants")
      .select("formation_code, module_cle, statut, score")
      .eq("user_email", email);

    if (formationCode) requete = requete.eq("formation_code", formationCode);
    if (session.tenantId) requete = requete.eq("tenant_id", session.tenantId);

    const { data, error } = await requete;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const progression: any = {};
    const scores: any = {};
    for (const ligne of data || []) {
      progression[ligne.module_cle] = ligne.statut;
      if (ligne.score !== null && ligne.score !== undefined) {
        scores[ligne.module_cle] = ligne.score;
      }
    }

    return NextResponse.json({
      success: true,
      email: email,
      tenant_id: session.tenantId,
      formation_code: formationCode || null,
      modules_valides: (data || []).filter(function (l: any) { return l.statut === "valide"; }).length,
      progression: progression,
      scores: scores,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Connectez-vous pour enregistrer votre progression." },
        { status: 401 }
      );
    }

    const corps = await req.json();
    const formation_code = String(corps.formation_code || "").trim().toUpperCase();
    const module_cle = String(corps.module_cle || "").trim();
    const score = corps.score;

    if (!formation_code || !module_cle) {
      return NextResponse.json({ success: false, error: "Parametres manquants" }, { status: 400 });
    }

    // Chaque ligne porte l organisme de son auteur : c est ce qui permettra
    // a un organisme client de suivre SES stagiaires, et eux seuls.
    const { error } = await supabase.from("progression_apprenants").upsert(
      {
        user_email: session.email,
        formation_code: formation_code,
        module_cle: module_cle,
        statut: "valide",
        score: score || null,
        tenant_id: session.tenantId,
      },
      { onConflict: "user_email,formation_code,module_cle" }
    );

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    await declencherCertificatSiComplet(session.email, formation_code);

    return NextResponse.json({ success: true, email: session.email, tenant_id: session.tenantId });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
