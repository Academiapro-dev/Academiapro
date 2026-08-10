import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];
const STATUTS = ["ouverte", "en_cours", "traitee", "classee_sans_suite"];
const ORIGINES = ["stagiaire", "entreprise", "financeur", "formateur", "autre"];

const MODELE = "claude-sonnet-4-6";

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

function tenantDe(req: NextRequest, session: any): string | null {
  if (session.tenantId) return session.tenantId;
  if (ADMINS.indexOf(session.email) >= 0) {
    return new URL(req.url).searchParams.get("tenant");
  }
  return null;
}

// L organisme signe les courriels de sa propre marque : en marque blanche,
// le reclamant ne doit jamais voir apparaitre l editeur.
async function ficheOrganisme(tenant: string) {
  const { data } = await supabase
    .from("organismes_formation")
    .select("raison_sociale, email_contact, telephone")
    .eq("tenant_id", tenant)
    .maybeSingle();
  return data || null;
}

async function courriel(destinataire: string, sujet: string, html: string) {
  if (!destinataire || !process.env.RESEND_API_KEY) return false;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AcadémIA Pro <contact@academiapro.fr>",
        reply_to: "contact@academiapro.fr",
        to: destinataire,
        subject: sujet,
        html: html,
      }),
    });
    return r.ok;
  } catch (e) {
    console.error("courriel reclamation:", e);
    return false;
  }
}

function enveloppe(corps: string, signature: string): string {
  return (
    '<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#1a1a1a;line-height:1.75">' +
    corps +
    '<p style="margin-top:26px;color:#555">' + signature + "</p></div>"
  );
}

// ACCUSE DE RECEPTION. Il n arbitre rien : il apaise et engage un delai.
// C est aussi lui qui ameliore le delai de premiere reponse que l auditeur
// mesure au titre de l indicateur 31.
async function accuserReception(r: any, o: any) {
  const nom = (o && o.raison_sociale) || "votre organisme de formation";
  const html = enveloppe(
    '<p style="color:#0a3d2e;font-size:13px;letter-spacing:2px;margin:0 0 6px">RÉCLAMATION ENREGISTRÉE</p>' +
    '<h1 style="color:#0a3d2e;font-size:21px;margin:0 0 16px">Nous avons bien reçu votre message</h1>' +
    "<p>Votre réclamation a été enregistrée et transmise au responsable, qui va l'examiner.</p>" +
    '<p style="background:#f5f1e8;padding:14px 16px;border-left:4px solid #0a3d2e;margin:20px 0">' +
    "<strong>Objet :</strong> " + r.objet + "<br>" +
    "<strong>Enregistrée le :</strong> " + new Date(r.created_at || Date.now()).toLocaleDateString("fr-FR") +
    "</p>" +
    "<p>Vous recevrez une réponse écrite dès que votre demande aura été traitée. " +
    "Si des éléments complémentaires vous sont utiles, répondez simplement à ce message.</p>",
    nom
  );

  return await courriel(r.auteur_email, "Votre réclamation a bien été reçue", html);
}

// ALERTE A L ORGANISME. C est le geste qui empeche l oubli — le vrai risque
// de l indicateur 31 n est pas de mal repondre, c est de ne jamais repondre.
async function alerterOrganisme(r: any, o: any) {
  const destinataire = (o && o.email_contact) || "";
  const html = enveloppe(
    '<p style="color:#c8a96e;font-size:13px;letter-spacing:2px;margin:0 0 6px">ACTION REQUISE</p>' +
    '<h1 style="color:#0a3d2e;font-size:21px;margin:0 0 16px">Une réclamation vient d\'être déposée</h1>' +
    "<p><strong>De :</strong> " + (r.auteur_nom || r.auteur_email) + "<br>" +
    "<strong>Objet :</strong> " + r.objet + "</p>" +
    '<p style="background:#f5f1e8;padding:14px 16px;border-left:4px solid #0a3d2e;margin:20px 0">' +
    String(r.message || "").slice(0, 900) + "</p>" +
    "<p>Le réclamant a reçu un accusé de réception. Il vous revient d'arbitrer, " +
    "d'écrire la réponse et l'action corrective, puis de la lui adresser.</p>" +
    '<p><a href="https://academiapro.fr/organisme/reclamations" ' +
    'style="color:#0a3d2e;font-weight:bold">Ouvrir le registre des réclamations</a></p>' +
    '<p style="font-size:13.5px;color:#666">Tant que cette réclamation reste sans réponse, ' +
    "vous recevrez une relance. Une réclamation non traitée est l'écart le plus fréquemment " +
    "relevé lors d'un audit.</p>",
    "AcadémIA Pro"
  );

  return await courriel(destinataire, "Réclamation à traiter : " + r.objet, html);
}

// PROPOSITION DE L AGENT. Il redige, il n envoie rien : la reponse ne part
// qu au clic de l organisme, qui reste seul arbitre. C est ce clic qui
// constitue l acte exige par l indicateur.
async function proposerReponse(r: any, o: any) {
  const cle = process.env.ANTHROPIC_API_KEY || "";
  if (!cle) return { reponse: "", action: "" };

  const nom = (o && o.raison_sociale) || "l organisme de formation";

  const invite =
    "Tu rediges pour " + nom + ", organisme de formation, la reponse a une reclamation.\n\n" +
    "OBJET : " + r.objet + "\n" +
    "MESSAGE DU RECLAMANT : " + String(r.message || "") + "\n\n" +
    "Redige deux blocs, separes par une ligne contenant seulement ---\n" +
    "1. LA REPONSE AU RECLAMANT : vouvoiement, ton mesure et respectueux, sans " +
    "formule creuse. Elle reconnait le probleme, dit ce qui a ete fait, et n engage " +
    "que ce qui est tenable. Pas de signature, elle sera ajoutee.\n" +
    "2. L ACTION CORRECTIVE, en deux ou trois phrases : ce qui est change pour que " +
    "cela ne se reproduise pas, redige pour un auditeur, au passe ou au futur proche.\n\n" +
    "Ecris en francais, sans markdown, sans guillemets doubles.";

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": cle,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODELE,
        max_tokens: 900,
        system:
          "Tu assistes un organisme de formation dans le traitement de ses reclamations. " +
          "Tu ne promets jamais un remboursement, une indemnisation ou une decision " +
          "commerciale : ces arbitrages appartiennent au dirigeant. Tu ne pretends jamais " +
          "qu un probleme est resolu si le message ne le dit pas.",
        messages: [{ role: "user", content: invite }],
      }),
    });

    if (!res.ok) return { reponse: "", action: "" };

    const d = await res.json();
    const texte = (d.content || []).map(function (b: any) {
      return b && b.type === "text" ? b.text : "";
    }).join("").trim();

    const bouts = texte.split(/\n-{3,}\n/);
    return {
      reponse: (bouts[0] || texte).trim(),
      action: (bouts[1] || "").trim(),
    };
  } catch (e) {
    console.error("proposition reclamation:", e);
    return { reponse: "", action: "" };
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const url = new URL(req.url);

    // Le stagiaire relit les siennes.
    if (url.searchParams.get("vue") === "miennes") {
      const { data } = await supabase
        .from("organisme_reclamations")
        .select("id, objet, message, statut, reponse, repondue_le, created_at")
        .eq("auteur_email", session.email)
        .order("created_at", { ascending: false })
        .limit(100);

      return NextResponse.json({ ok: true, reclamations: data || [] });
    }

    const tenant = tenantDe(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from("organisme_reclamations")
      .select("*")
      .eq("tenant_id", tenant)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const ouvertes = (data || []).filter(function (r: any) {
      return r.statut === "ouverte" || r.statut === "en_cours";
    }).length;

    const traitees = (data || []).filter(function (r: any) { return r.statut === "traitee"; });

    // Delai moyen de traitement : l auditeur regarde la reactivite,
    // pas seulement l existence du registre.
    let delai: number | null = null;
    if (traitees.length > 0) {
      const jours = traitees
        .filter(function (r: any) { return r.repondue_le; })
        .map(function (r: any) {
          const d = new Date(r.repondue_le).getTime() - new Date(r.created_at).getTime();
          return Math.max(0, Math.round(d / 86400000));
        });
      if (jours.length > 0) {
        delai = Math.round((jours.reduce(function (a, b) { return a + b; }, 0) / jours.length) * 10) / 10;
      }
    }

    const avecAction = (data || []).filter(function (r: any) { return r.action_corrective; }).length;

    // La plus ancienne restee sans reponse : c est elle que l auditeur trouve.
    let plusAncienneJours: number | null = null;
    const sansReponse = (data || []).filter(function (r: any) {
      return !r.reponse && (r.statut === "ouverte" || r.statut === "en_cours");
    });
    if (sansReponse.length > 0) {
      const ages = sansReponse.map(function (r: any) {
        return Math.round((Date.now() - new Date(r.created_at).getTime()) / 86400000);
      });
      plusAncienneJours = Math.max.apply(null, ages);
    }

    return NextResponse.json({
      ok: true,
      statuts: STATUTS,
      origines: ORIGINES,
      total: (data || []).length,
      ouvertes: ouvertes,
      delai_moyen_jours: delai,
      avec_action_corrective: avecAction,
      plus_ancienne_sans_reponse_jours: plusAncienneJours,
      reclamations: data || [],
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    // L organisme demande a l agent de preparer la reponse. Rien n est envoye.
    if (b.action === "proposer") {
      const tenant = tenantDe(req, session);
      if (!tenant) {
        return NextResponse.json({ ok: false, erreur: "Organisme non precise." }, { status: 403 });
      }

      const { data: r } = await supabase
        .from("organisme_reclamations")
        .select("*")
        .eq("id", b.id)
        .eq("tenant_id", tenant)
        .maybeSingle();

      if (!r) {
        return NextResponse.json({ ok: false, erreur: "Reclamation introuvable." }, { status: 404 });
      }

      const o = await ficheOrganisme(tenant);
      const proposition = await proposerReponse(r, o);

      return NextResponse.json({
        ok: true,
        proposition: proposition,
        rappel: "Relisez avant d envoyer : c est votre envoi qui vaut reponse, pas la proposition.",
      });
    }

    const objet = String(b.objet || "").trim();
    const message = String(b.message || "").trim();

    if (objet.length < 3 || message.length < 10) {
      return NextResponse.json(
        { ok: false, erreur: "Indiquez un objet et decrivez votre reclamation." },
        { status: 400 }
      );
    }

    const admin = ADMINS.indexOf(session.email) >= 0;
    const pourAutrui = b.auteur_email && (session.tenantId || admin);

    // Soit le stagiaire depose pour lui-meme, soit l organisme consigne
    // une reclamation recue par un autre canal.
    const tenant = pourAutrui ? tenantDe(req, session) : session.tenantId;

    if (pourAutrui && !tenant) {
      return NextResponse.json({ ok: false, erreur: "Organisme non precise." }, { status: 400 });
    }

    const origine = String(b.origine || "stagiaire").trim().toLowerCase();
    if (ORIGINES.indexOf(origine) < 0) {
      return NextResponse.json({ ok: false, erreur: "Origine inconnue." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("organisme_reclamations")
      .insert({
        tenant_id: tenant,
        auteur_email: pourAutrui ? String(b.auteur_email).trim().toLowerCase() : session.email,
        auteur_nom: b.auteur_nom ? String(b.auteur_nom).trim() : null,
        formation_code: b.formation_code ? String(b.formation_code).trim().toUpperCase() : null,
        objet: objet,
        message: message,
        origine: origine,
        statut: "ouverte",
      })
      .select("*")
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const creee = (data || [])[0] || null;

    // ACCUSE DE RECEPTION AU RECLAMANT, ALERTE A L ORGANISME. Les deux partent
    // immediatement : le premier apaise, le second empeche l oubli.
    let accuse = false;
    let alerte = false;

    if (creee && tenant) {
      const o = await ficheOrganisme(tenant);
      accuse = await accuserReception(creee, o);
      alerte = await alerterOrganisme(creee, o);
    }

    return NextResponse.json({
      ok: true,
      reclamation: creee,
      accuse_reception: accuse,
      organisme_alerte: alerte,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// Reponse et action corrective : reserve a l organisme.
export async function PATCH(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const tenant = tenantDe(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const b = await req.json().catch(function () { return null; });
    if (!b || !b.id) {
      return NextResponse.json({ ok: false, erreur: "Identifiant manquant" }, { status: 400 });
    }

    const { data: avant } = await supabase
      .from("organisme_reclamations")
      .select("*")
      .eq("id", b.id)
      .eq("tenant_id", tenant)
      .maybeSingle();

    if (!avant) {
      return NextResponse.json({ ok: false, erreur: "Reclamation introuvable." }, { status: 404 });
    }

    const modifications: any = {};

    if (b.reponse !== undefined) {
      const r = String(b.reponse || "").trim();
      modifications.reponse = r || null;
      if (r) modifications.repondue_le = new Date().toISOString();
    }

    if (b.action_corrective !== undefined) {
      modifications.action_corrective = b.action_corrective
        ? String(b.action_corrective).trim()
        : null;
    }

    if (b.statut !== undefined) {
      const s = String(b.statut || "").trim().toLowerCase();
      if (STATUTS.indexOf(s) < 0) {
        return NextResponse.json({ ok: false, erreur: "Statut inconnu." }, { status: 400 });
      }
      modifications.statut = s;
    }

    if (Object.keys(modifications).length === 0) {
      return NextResponse.json({ ok: false, erreur: "Rien a modifier." }, { status: 400 });
    }

    const { error } = await supabase
      .from("organisme_reclamations")
      .update(modifications)
      .eq("id", b.id)
      .eq("tenant_id", tenant);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    // ENVOI AU RECLAMANT, sur demande expresse. C est le clic de l organisme
    // qui vaut reponse : rien ne part tant qu il ne l a pas decide.
    let envoye = false;
    if (b.envoyer === true) {
      const texte = String(
        b.reponse !== undefined ? b.reponse : (avant.reponse || "")
      ).trim();

      if (!texte) {
        return NextResponse.json(
          { ok: false, erreur: "Ecrivez la reponse avant de l envoyer au reclamant." },
          { status: 400 }
        );
      }

      const o = await ficheOrganisme(tenant);
      const nom = (o && o.raison_sociale) || "votre organisme de formation";

      const html = enveloppe(
        '<p style="color:#0a3d2e;font-size:13px;letter-spacing:2px;margin:0 0 6px">RÉPONSE À VOTRE RÉCLAMATION</p>' +
        '<h1 style="color:#0a3d2e;font-size:21px;margin:0 0 16px">' + avant.objet + "</h1>" +
        "<p>" + texte.replace(/\n/g, "<br>") + "</p>" +
        '<p style="font-size:13.5px;color:#666;margin-top:24px">Si cette réponse ne vous ' +
        "satisfait pas, vous pouvez nous le faire savoir en répondant à ce message.</p>",
        nom
      );

      envoye = await courriel(avant.auteur_email, "Réponse à votre réclamation : " + avant.objet, html);

      if (envoye) {
        await supabase
          .from("organisme_reclamations")
          .update({ statut: "traitee", repondue_le: new Date().toISOString() })
          .eq("id", b.id)
          .eq("tenant_id", tenant);
      }
    }

    return NextResponse.json({ ok: true, modifie: b.id, envoye_au_reclamant: envoye });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
