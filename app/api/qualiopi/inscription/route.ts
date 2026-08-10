import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// L OUVERTURE D UN ESPACE QUALIOPI.
//
// Le formulaire est court a dessein : un organisme qui doit remplir vingt
// champs avant d avoir rien vu s en va. On demande le minimum, et le reste
// se precise dans l espace.
//
// LES CATEGORIES D ACTION NE SONT PAS UN DETAIL. Le Referentiel National
// Qualite n applique pas les memes indicateurs a un centre de formation, a
// un CFA, a un centre de bilan de competences ou a un valideur d acquis.
// Les demander des l inscription evite de reclamer plus tard des preuves
// qui ne concernent pas l organisme.

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
  return t.length > 0 ? t.slice(0, max) : null;
}

export async function POST(req: NextRequest) {
  try {
    const provenance = (req.headers.get("origin") || "") + (req.headers.get("referer") || "");
    const legitime =
      provenance.indexOf("academiapro.fr") >= 0 ||
      provenance.indexOf("mrcomptable.fr") >= 0 ||
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
      return NextResponse.json({ ok: false, erreur: "Requete illisible." }, { status: 400 });
    }

    // Champ piege : un robot le remplit, un humain ne le voit pas.
    if (propre(b.societe_bis, 100)) {
      return NextResponse.json({ ok: true, message: "Merci." });
    }

    const raisonSociale = propre(b.raison_sociale, 200);
    const email = propre(b.email, 160);
    const numeroDa = propre(b.numero_da, 40);

    if (!raisonSociale || raisonSociale.length < 2) {
      return NextResponse.json(
        { ok: false, erreur: "Le nom de votre organisme est necessaire." },
        { status: 400 }
      );
    }

    if (!email || email.indexOf("@") < 1 || email.indexOf(".") < 2) {
      return NextResponse.json(
        { ok: false, erreur: "Indiquez une adresse electronique valable." },
        { status: 400 }
      );
    }

    // Un espace deja ouvert sur cette adresse : on ne cree pas de doublon.
    const { data: deja } = await supabase
      .from("compliance_membres")
      .select("tenant_id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    const tenantId = deja ? deja.tenant_id : crypto.randomUUID();

    if (!deja) {
      const { error: eMembre } = await supabase.from("compliance_membres").insert({
        tenant_id: tenantId,
        email: email.toLowerCase(),
        role: "proprietaire",
        nom: raisonSociale,
      });

      if (eMembre) {
        return NextResponse.json(
          { ok: false, erreur: "Ouverture impossible : " + eMembre.message },
          { status: 500 }
        );
      }
    }

    // La fiche de l organisme, qui commande les indicateurs applicables.
    const { data: fiche } = await supabase
      .from("qualiopi_organisme")
      .select("id")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    const donnees: any = {
      tenant_id: tenantId,
      raison_sociale: raisonSociale,
      numero_da: numeroDa,
      action_formation: b.action_formation !== false,
      action_apprentissage: b.action_apprentissage === true,
      action_vae: b.action_vae === true,
      action_bilan: b.action_bilan === true,
      formations_certifiantes: b.formations_certifiantes === true,
      recours_sous_traitance: b.recours_sous_traitance === true,
      afest: b.afest === true,
      updated_at: new Date().toISOString(),
    };

    if (fiche) {
      await supabase.from("qualiopi_organisme").update(donnees).eq("id", fiche.id);
    } else {
      const { error: eFiche } = await supabase.from("qualiopi_organisme").insert(donnees);
      if (eFiche) {
        return NextResponse.json(
          { ok: false, erreur: "Fiche impossible : " + eFiche.message },
          { status: 500 }
        );
      }
    }

    // Le prospect entre au registre commercial : un organisme qui ouvre un
    // espace sans souscrire reste un prospect qu il faudra relancer.
    try {
      const { data: connu } = await supabase
        .from("crm")
        .select("id")
        .eq("email", email.toLowerCase())
        .is("tenant_id", null)
        .limit(1);

      const fichePros: any = {
        email: email.toLowerCase(),
        nom: raisonSociale,
        entreprise: raisonSociale,
        source: "qualiopi",
        statut: "prospect",
        formation_interesse: "Mr. Qualiopi",
        pays: "FR",
        notes: numeroDa ? "Declaration d activite " + numeroDa : null,
        tenant_id: null,
        derniere_interaction: new Date().toISOString(),
      };

      if (connu && connu.length > 0) {
        await supabase.from("crm").update(fichePros).eq("id", connu[0].id);
      } else {
        await supabase.from("crm").insert(fichePros);
      }
    } catch (e) {}

    const rk = process.env.RESEND_API_KEY || "";

    if (rk) {
      try {
        const html =
          "<div style=\"font-family:Georgia,serif;max-width:600px;margin:auto;padding:24px;color:#222\">"
          + "<p style=\"letter-spacing:3px;color:#3d9970;text-align:center;font-size:12px\">MR. QUALIOPI</p>"
          + "<h1 style=\"font-size:21px;text-align:center;margin:6px 0 24px\">Votre espace est ouvert</h1>"
          + "<p>Bonjour,</p>"
          + "<p>L'espace de <b>" + raisonSociale + "</b> est ouvert. Vous y trouverez les "
          + "sept critères et les trente-deux indicateurs du Référentiel National Qualité, "
          + "et pour chacun ce que l'auditeur attend de vous.</p>"
          + "<p style=\"text-align:center;margin:28px 0\">"
          + "<a href=\"https://academiapro.fr/connexion\" style=\"background:#3d9970;color:#fff;"
          + "padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold\">"
          + "Ouvrir mon espace</a></p>"
          + "<p style=\"font-size:13px;color:#666;line-height:1.7\">Aucun mot de passe à "
          + "retenir : vous recevez un lien de connexion à cette adresse.</p>"
          + "<p style=\"font-size:13px;color:#666;line-height:1.7\">Commencez par décrire "
          + "votre organisme : c'est ce qui détermine quels indicateurs vous concernent. "
          + "Tous ne s'appliquent pas à tous.</p>"
          + "<p>L'équipe AcadéMIA Pro</p></div>";


        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: "Bearer " + rk, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Mr. Qualiopi <contact@academiapro.fr>",
            to: [email],
            subject: "Votre espace Mr. Qualiopi — " + raisonSociale,
            html: html,
          }),
        });
      } catch (e) {}

      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: "Bearer " + rk, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "AcademIA Pro <contact@academiapro.fr>",
            to: ["contact@academiapro.fr"],
            subject: "Qualiopi — " + raisonSociale,
            html:
              "<div style=\"font-family:Georgia,serif\"><h2>Nouvel espace Qualiopi</h2>"
              + "<p><b>" + raisonSociale + "</b> — " + email + "</p>"
              + "<p>Declaration d activite : " + (numeroDa || "non precisee") + "</p>"
              + "<p><a href=\"https://academiapro.fr/admin/crm\">Ouvrir le registre</a></p></div>",
          }),
        });
      } catch (e) {}
    }

    return NextResponse.json({
      ok: true,
      deja_inscrit: !!deja,
      message: deja
        ? "Un espace existe deja pour cette adresse. Un lien de connexion vous a ete envoye."
        : "Votre espace est ouvert. Regardez votre boite de reception.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
