import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMINS = ["contact@academiapro.fr"];

const ORIGINES = ["stagiaire", "entreprise", "financeur", "formateur", "autre"];
const STATUTS = ["ouverte", "en_cours", "traitee", "classee_sans_suite"];

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

// VERROU. Le registre des reclamations n appartient qu a son organisme :
// seul un membre (pas un stagiaire) peut le lire et y ecrire. L editeur
// y accede pour le service apres-vente, avec le parametre tenant.
function resoudreTenant(req: NextRequest): { tenantId: string | null; erreur: any } {
  const session = sessionCourante();
  if (!session) {
    return {
      tenantId: null,
      erreur: NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 }),
    };
  }

  if (session.role === "stagiaire") {
    return {
      tenantId: null,
      erreur: NextResponse.json(
        { ok: false, erreur: "Le registre des reclamations est reserve a l organisme." },
        { status: 403 }
      ),
    };
  }

  if (session.tenantId) {
    return { tenantId: session.tenantId, erreur: null };
  }

  const estAdmin = ADMINS.indexOf(session.email) >= 0;
  if (estAdmin) {
    const t = new URL(req.url).searchParams.get("tenant");
    if (t) return { tenantId: t, erreur: null };
  }

  return {
    tenantId: null,
    erreur: NextResponse.json(
      { ok: false, erreur: "Aucun organisme associe a votre session." },
      { status: 403 }
    ),
  };
}

async function accuseReception(destinataire: string, objet: string, organisme: string) {
  // L accuse de reception est ce que la relance promet : le reclamant sait
  // que sa demande est entree au registre. On ne l envoie qu a une adresse
  // reelle, jamais au marqueur de saisie manuelle.
  if (!destinataire || !process.env.RESEND_API_KEY) return false;
  if (destinataire === "non-renseigne@exemple.fr") return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Acad\u00e9mIA Pro <contact@academiapro.fr>",
        reply_to: "contact@academiapro.fr",
        to: destinataire,
        subject: "Accus\u00e9 de r\u00e9ception \u2014 votre r\u00e9clamation : " + objet,
        html:
          '<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1a1a;line-height:1.75">' +
          '<p style="color:#c8a96e;font-size:13px;letter-spacing:2px;margin:0 0 6px">ACCUS\u00c9 DE R\u00c9CEPTION</p>' +
          '<h1 style="color:#0a3d2e;font-size:21px;margin:0 0 16px">Votre r\u00e9clamation est enregistr\u00e9e</h1>' +
          "<p><strong>Objet :</strong> " + objet + "<br>" +
          "<strong>Re\u00e7ue le :</strong> " + new Date().toLocaleDateString("fr-FR") + "</p>" +
          "<p>Elle est consign\u00e9e au registre et sera trait\u00e9e dans les meilleurs d\u00e9lais. " +
          "Vous recevrez une r\u00e9ponse \u00e9crite.</p>" +
          '<p style="margin-top:26px;color:#555">' + organisme + "</p></div>",
      }),
    });
    return r.ok;
  } catch (e) {
    console.error("accuse reception reclamation:", e);
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { tenantId, erreur } = resoudreTenant(req);
    if (erreur) return erreur;

    const { data, error } = await supabase
      .from("organisme_reclamations")
      .select("id, tenant_id, auteur_email, auteur_nom, origine, objet, message, statut, reponse, action_corrective, created_at, repondue_le")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const reclamations = data || [];

    let ouvertes = 0;
    let avecAction = 0;
    let sommeDelais = 0;
    let repondues = 0;

    for (const r of reclamations) {
      if (r.statut === "ouverte" || r.statut === "en_cours") ouvertes = ouvertes + 1;
      if (r.action_corrective && String(r.action_corrective).trim().length > 0) avecAction = avecAction + 1;
      if (r.repondue_le) {
        const delai = Math.floor(
          (new Date(r.repondue_le).getTime() - new Date(r.created_at).getTime()) / 86400000
        );
        if (delai >= 0) {
          sommeDelais = sommeDelais + delai;
          repondues = repondues + 1;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      reclamations: reclamations,
      total: reclamations.length,
      ouvertes: ouvertes,
      avec_action_corrective: avecAction,
      delai_moyen_jours: repondues > 0 ? Math.round(sommeDelais / repondues) : null,
      origines: ORIGINES,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tenantId, erreur } = resoudreTenant(req);
    if (erreur) return erreur;

    const corps = await req.json().catch(function () { return {}; });

    const objet = String(corps.objet || "").trim();
    const message = String(corps.message || "").trim();
    if (objet.length < 3 || message.length < 10) {
      return NextResponse.json(
        { ok: false, erreur: "Indiquez un objet et decrivez la reclamation." },
        { status: 400 }
      );
    }

    const origine = ORIGINES.indexOf(corps.origine) >= 0 ? corps.origine : "autre";
    const auteurEmail = String(corps.auteur_email || "non-renseigne@exemple.fr").trim().toLowerCase();
    const auteurNom = String(corps.auteur_nom || "").trim();

    const { data: inseree, error } = await supabase
      .from("organisme_reclamations")
      .insert({
        tenant_id: tenantId,
        auteur_email: auteurEmail,
        auteur_nom: auteurNom,
        origine: origine,
        objet: objet,
        message: message,
        statut: "ouverte",
      })
      .select("id")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // L accuse part vers le reclamant, au nom de l organisme.
    const { data: org } = await supabase
      .from("organismes_formation")
      .select("raison_sociale")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    await accuseReception(auteurEmail, objet, (org && org.raison_sociale) || "Acad\u00e9mIA Pro");

    return NextResponse.json({ ok: true, id: inseree ? inseree.id : null });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { tenantId, erreur } = resoudreTenant(req);
    if (erreur) return erreur;

    const corps = await req.json().catch(function () { return {}; });
    const id = String(corps.id || "").trim();
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Reclamation non precisee." }, { status: 400 });
    }

    // On relit d abord : la reclamation doit appartenir a l organisme.
    const { data: existante } = await supabase
      .from("organisme_reclamations")
      .select("id, tenant_id, reponse, repondue_le")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!existante) {
      return NextResponse.json({ ok: false, erreur: "Reclamation introuvable." }, { status: 404 });
    }

    const maj: any = {};

    if (typeof corps.reponse === "string") {
      maj.reponse = corps.reponse.trim() || null;
      // La date de reponse se fige a la premiere reponse ecrite : c est elle
      // qui nourrit le delai moyen presente a l auditeur.
      if (maj.reponse && !existante.repondue_le) {
        maj.repondue_le = new Date().toISOString();
      }
    }

    if (typeof corps.action_corrective === "string") {
      maj.action_corrective = corps.action_corrective.trim() || null;
    }

    if (corps.statut && STATUTS.indexOf(corps.statut) >= 0) {
      maj.statut = corps.statut;
    }

    if (Object.keys(maj).length === 0) {
      return NextResponse.json({ ok: false, erreur: "Rien a modifier." }, { status: 400 });
    }

    const { error } = await supabase
      .from("organisme_reclamations")
      .update(maj)
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
