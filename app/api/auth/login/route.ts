import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fabriquerJetonSession, NOM_COOKIE_SESSION, DUREE_COOKIE_SECONDES } from "../../../../lib/session";
import { limiter, ipDe } from "../../../../lib/limiteur";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🚨 LIMITE DE DEBIT — 31/08. SANS ELLE, LES MOTS DE PASSE SE FORCENT.
//
// LE DEFAUT : cette route acceptait un nombre illimite d essais. Un
// programme peut tester des milliers de mots de passe a la minute sur une
// adresse connue — et les adresses des cabinets sont publiques.
//
// DEUX COMPTEURS, chacun pour un scenario different :
//   - par ADRESSE : arrete l acharnement sur un compte precis, meme si
//     l attaquant change d IP a chaque essai ;
//   - par IP : arrete le balayage de nombreuses adresses depuis un poste.
//
// LES SEUILS SONT LARGES POUR UN HUMAIN, ETROITS POUR UNE MACHINE : dix
// essais par quart d heure laissent le temps de se tromper plusieurs fois
// et de retrouver son mot de passe, mais rendent le forcage inutile.
//
// ⚠️ LE LIMITEUR VIT EN MEMOIRE : sur Vercel il ne couvre qu une instance
// a la fois. Il arrete le martelement ordinaire, pas une attaque
// distribuee. Supabase applique en outre ses propres limites en amont.
const MAX_PAR_EMAIL = 10;
const FENETRE_EMAIL_MS = 15 * 60 * 1000;
const MAX_PAR_IP = 30;
const FENETRE_IP_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  const corps = await req.json().catch(() => ({} as any));

  // LES DEUX CHAMPS SONT EXIGES AVANT TOUT APPEL A SUPABASE. Sans ce
  // controle, un corps vide partait quand meme interroger le serveur
  // d authentification : un appel inutile a chaque sonde.
  const email = String((corps as any).email || "").toLowerCase().trim();
  const password = String((corps as any).password || "");

  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: "Email ou mot de passe incorrect" },
      { status: 401 }
    );
  }

  if (!limiter(email, "login_email", MAX_PAR_EMAIL, FENETRE_EMAIL_MS)) {
    return NextResponse.json(
      {
        success: false,
        message: "Trop de tentatives de connexion. Réessayez dans un quart d'heure, "
          + "ou demandez un lien de connexion par courriel.",
      },
      { status: 429 }
    );
  }

  if (!limiter(ipDe(req), "login_ip", MAX_PAR_IP, FENETRE_IP_MS)) {
    return NextResponse.json(
      { success: false, message: "Trop de tentatives. Réessayez dans un quart d'heure." },
      { status: 429 }
    );
  }

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
    // Recherche de l organisme rattache a ce compte, en deux temps :
    // d abord le PERSONNEL de l organisme (compliance_membres, par user_id),
    // puis SES STAGIAIRES (organisme_apprenants, par email).
    // Un echec ici ne doit JAMAIS empecher la connexion : les apprenants
    // d AcademIA n ont pas d organisme et doivent pouvoir se connecter.
    let tenantId: string | null = null;
    let role: string | null = null;

    const emailReel = String(data.user?.email || email || "").toLowerCase().trim();

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

      if (!tenantId && emailReel) {
        const { data: apprenant } = await supabaseAdmin
          .from("organisme_apprenants")
          .select("tenant_id")
          .eq("email", emailReel)
          .limit(1)
          .maybeSingle();

        if (apprenant) {
          tenantId = apprenant.tenant_id;
          role = "stagiaire";
        }
      }
    } catch (e) {
      // silencieux par choix : l'absence d organisme est un cas normal
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

    // L ANCIEN COOKIE sb_user N EST PLUS POSE. Ce n etait qu un objet JSON
    // encode, non signe : n importe qui pouvait y changer le tenant_id et
    // lire les donnees d un autre organisme. Toutes les routes lisent
    // desormais le jeton signe ci-dessous. On le fait expirer ici pour
    // le purger des navigateurs ou il subsiste.
    response.cookies.set("sb_user", "", {
      maxAge: 0,
      path: "/",
    });

    // Cookie de session signe : c'est lui qui ouvre l'acces au contenu payant.
    // Il porte aussi l organisme et le role, donc infalsifiables.
    if (emailReel) {
      response.cookies.set({
        name: NOM_COOKIE_SESSION,
        value: fabriquerJetonSession(emailReel, tenantId, role),
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: DUREE_COOKIE_SECONDES,
      });
    }

    return response;
  }

  return NextResponse.json(
    { success: false, message: "Email ou mot de passe incorrect" },
    { status: 401 }
  );
}
