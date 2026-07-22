import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      },
      body: JSON.stringify({ email, password }),
    }
  );

  const data = await res.json();

  if (data.access_token) {
    // Recherche du tenant rattache a ce compte (module compliance).
    // Un echec ici ne doit JAMAIS empecher la connexion : les utilisateurs
    // des plateformes B2C n'ont pas de tenant et doivent pouvoir se connecter.
    let tenantId: string | null = null;
    let role: string | null = null;

    try {
      if (data.user?.id) {
        const { data: membre } = await supabaseAdmin
          .from("compliance_membres")
          .select("tenant_id, role")
          .eq("user_id", data.user.id)
          .eq("actif", true)
          .limit(1)
          .maybeSingle();

        if (membre) {
          tenantId = membre.tenant_id;
          role = membre.role;
        }
      }
    } catch (e) {
      // silencieux par choix : l'absence de tenant est un cas normal
      tenantId = null;
      role = null;
    }

    const response = NextResponse.json({ success: true, tenant_id: tenantId });

    response.cookies.set("sb_token", data.access_token, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    response.cookies.set("sb_user", JSON.stringify({
      id: data.user?.id,
      email: data.user?.email,
      tenant_id: tenantId,
      role: role,
    }), {
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  }

  return NextResponse.json(
    { success: false, message: "Email ou mot de passe incorrect" },
    { status: 401 }
  );
}
