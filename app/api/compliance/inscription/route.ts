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

const PROFILS = ["vend_formations", "forme_salaries", "devenir_of", "cabinet_comptable"];

// Cree le compte d un nouveau client, son organisme, et son premier dossier.
// L envoi du lien de connexion reste assure par /connexion, qui fonctionne
// deja : on ne duplique pas ce mecanisme.
export async function POST(req: NextRequest) {
  try {
    const corps = await req.json();

    const email = String(corps.email || "").toLowerCase().trim();
    const raisonSociale = String(corps.raison_sociale || "").trim();
    const profilDemande = String(corps.profil || "").trim();
    const profil = PROFILS.indexOf(profilDemande) >= 0 ? profilDemande : "cabinet_comptable";

    if (!email || email.indexOf("@") < 0) {
      return NextResponse.json({ ok: false, erreur: "Adresse électronique invalide." }, { status: 400 });
    }
    if (raisonSociale.length < 2) {
      return NextResponse.json({ ok: false, erreur: "Indiquez la raison sociale." }, { status: 400 });
    }

    // 1. Le compte existe-t-il deja ?
    const { data: dejaId } = await supabase.rpc("utilisateur_par_email", { email });

    let userId: string | null = dejaId || null;

    if (userId) {
      const { data: membre } = await supabase
        .from("compliance_membres").select("id").eq("user_id", userId).limit(1);
      if (membre && membre.length > 0) {
        return NextResponse.json({
          ok: true,
          deja: true,
          message: "Ce compte existe déjà. Connectez-vous pour y accéder.",
        });
      }
    }

    // 2. Creation du compte si besoin. Il n a pas de mot de passe : la
    // connexion se fait par lien envoye par courriel.
    if (!userId) {
      const { data: cree, error: err } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (err || !cree || !cree.user) {
        return NextResponse.json({ ok: false, erreur: "Création du compte impossible : " + (err ? err.message : "") }, { status: 400 });
      }
      userId = cree.user.id;
    }

    // 3. Son organisme, qui le cloisonne de tous les autres.
    const tenantId = crypto.randomUUID();

    const { error: errMembre } = await supabase.from("compliance_membres").insert({
      user_id: userId,
      tenant_id: tenantId,
      role: "proprietaire",
      actif: true,
      profil: profil,
    });
    if (errMembre) {
      return NextResponse.json({ ok: false, erreur: "Rattachement impossible : " + errMembre.message }, { status: 400 });
    }

    const code = raisonSociale
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 12) || "DOSSIER1";

    // 4. Un cabinet comptable recoit un dossier comptable. Les autres
    // profils recoivent un organisme de formation.
    if (profil === "cabinet_comptable") {
      await supabase.from("compta_societes").insert({
        code,
        nom: raisonSociale,
        tenant_id: tenantId,
      });
      await supabase.from("compta_collaborateurs").insert({
        email,
        nom: raisonSociale,
        role: "associe",
        tenant_id: tenantId,
      });
    } else {
      await supabase.from("organismes_formation").insert({
        tenant_id: tenantId,
        raison_sociale: raisonSociale,
        email_contact: email,
        statut: "essai",
        profils: [profil],
      });
    }

    return NextResponse.json({
      ok: true,
      profil: profil,
      message: "Compte créé. Demandez votre lien de connexion pour entrer.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
