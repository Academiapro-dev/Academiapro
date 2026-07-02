import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
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

export async function POST(req: NextRequest) {
  try {
    const { email, formation_code, module_cle, score } = await req.json();

    if (!email || !formation_code || !module_cle) {
      return NextResponse.json({ success: false, error: "Parametres manquants" }, { status: 400 });
    }

    await supabase.from("progression_apprenants").upsert({
      user_email: email,
      formation_code: formation_code,
      module_cle: module_cle,
      statut: "valide",
      score: score || null,
    }, { onConflict: "user_email,formation_code,module_cle" });

    await declencherCertificatSiComplet(email, formation_code);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}