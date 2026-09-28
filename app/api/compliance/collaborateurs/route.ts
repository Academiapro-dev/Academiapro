import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { tenantCourant, peutGererEquipe } from "../../../../lib/droits";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 28/09 — L EQUIPE : DROITS DE PAIE, CARTE BLANCHE, ET LES ASSOCIES
//
// 1. QUI REGLE L EQUIPE. Cette route etait reservee a l adresse de Jacques.
//    Un cabinet client ne pouvait donc NI ajouter ses collaborateurs NI
//    regler leurs droits : les droits existaient, personne chez lui ne
//    pouvait s en servir. Desormais : l administrateur ET les associes
//    actifs de l organisme (lib/droits, peutGererEquipe).
// 2. LES QUATRE DROITS DE PAIE : fiche et contrat, preparer, emettre,
//    deposer. Ils suivent le meme chemin que les droits comptables.
// 3. LA CARTE BLANCHE, DOSSIER PAR DOSSIER (`paie_carte_blanche`) :
//    sans elle, un collaborateur qui a le droit d emettre SOUMET ses
//    bulletins, et un associe les emet apres verification. Decision de
//    Jacques du 28/09 : la confiance se donne une fois que la personne
//    s est montree serieuse et constante.
// 4. 🚨 DEFAUT CORRIGE AU PASSAGE : cocher UN droit sur la fiche d un
//    collaborateur remettait TOUS les autres aux valeurs de depart de son
//    role — l ecran n envoie que le droit touche, et la route completait
//    le reste avec le role. Desormais, sur une fiche existante, un droit
//    non envoye garde sa valeur.
// 5. LE JOURNAL : chaque ajout ou modification est inscrit dans
//    compta_audit, avec l etat avant et apres.
// 6. 🆕🚨 L ACCES DU COLLABORATEUR. Ajouter une fiche ne lui ouvrait AUCUN
//    acces : ni compte de connexion, ni rattachement au cabinet
//    (compliance_membres). Il ne pouvait pas se connecter. Desormais, a
//    l ajout (et sur « Envoyer l'invitation ») : le compte est cree s il
//    n existe pas, rattache au cabinet, et une invitation part par courriel.
//    🆕 (point 2) UNE ADRESSE DEJA RATTACHEE A UN AUTRE CABINET est
//    acceptee : la connexion rouvre le dernier cabinet choisi, et le
//    tableau de bord permet de passer de l un a l autre.
//    Desactiver la fiche desactive aussi le rattachement.
// 7. 🆕 LE JOURNAL SE LIT : GET ?journal=1 rend les gestes de paie, de DSN
//    et d equipe du cabinet, les plus recents d abord.
// ═══════════════════════════════════════════════════════════════════════

const DROITS = [
  "saisir", "valider", "cloturer", "declarer", "gerer_plan", "deposer_pieces",
  "paie_contrats", "paie_preparer", "paie_emettre", "dsn_deposer",
];

// Roles preconfigures : ils posent des droits de depart, modifiables ensuite
// un par un. Un cabinet n a pas deux collaborateurs identiques.
const ROLES: any = {
  associe: {
    nom: "Associé",
    droits: { saisir: true, valider: true, cloturer: true, declarer: true, gerer_plan: true, deposer_pieces: true,
      paie_contrats: true, paie_preparer: true, paie_emettre: true, dsn_deposer: true },
  },
  collaborateur: {
    nom: "Collaborateur comptable",
    droits: { saisir: true, valider: true, cloturer: false, declarer: false, gerer_plan: false, deposer_pieces: true,
      paie_contrats: false, paie_preparer: true, paie_emettre: false, dsn_deposer: false },
  },
  assistant: {
    nom: "Assistant",
    droits: { saisir: true, valider: false, cloturer: false, declarer: false, gerer_plan: false, deposer_pieces: true,
      paie_contrats: false, paie_preparer: true, paie_emettre: false, dsn_deposer: false },
  },
  lecture: {
    nom: "Lecture seule",
    droits: { saisir: false, valider: false, cloturer: false, declarer: false, gerer_plan: false, deposer_pieces: false,
      paie_contrats: false, paie_preparer: false, paie_emettre: false, dsn_deposer: false },
  },
};

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

function refuse() {
  return NextResponse.json(
    { ok: false, erreur: "Réservé à l'administrateur et aux associés du cabinet." },
    { status: 403 }
  );
}

function sansOrganisme() {
  return NextResponse.json(
    { ok: false, erreur: "Session sans organisme rattaché. Reconnectez-vous." },
    { status: 401 }
  );
}

function propre(v: any, max: number): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).replace(/[\u0000-\u001F\u007F]/g, "").trim();
  return t ? t.slice(0, max) : null;
}

function listeIds(v: any): string[] {
  if (!Array.isArray(v)) return [];
  const vus: any = {};
  return v.filter(function (x: any) {
    if (typeof x !== "string" || x.length <= 10 || vus[x]) return false;
    vus[x] = true;
    return true;
  });
}

const MARQUES: Record<string, { site: string; entree: string; nom: string; expediteur: string }> = {
  "mrcomptable.fr": { site: "https://mrcomptable.fr", entree: "/comptable/inscription", nom: "Mr. Comptable",
    expediteur: "Mr. Comptable <contact@mrcomptable.fr>" },
  "www.mrcomptable.fr": { site: "https://mrcomptable.fr", entree: "/comptable/inscription", nom: "Mr. Comptable",
    expediteur: "Mr. Comptable <contact@mrcomptable.fr>" },
  "academiapro.fr": { site: "https://academiapro.fr", entree: "/connexion", nom: "AcadéMIA Pro",
    expediteur: "AcadéMIA Pro <contact@academiapro.fr>" },
};

function marqueDe(req: NextRequest) {
  const h = (req.headers.get("host") || "").split(":")[0].toLowerCase();
  return MARQUES[h] || MARQUES["www.mrcomptable.fr"];
}

function html(t: any): string {
  return String(t === null || t === undefined ? "" : t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function idDuCompte(email: string): Promise<string | null> {
  const { data } = await supabase.rpc("utilisateur_par_email", { p_email: email });
  if (!data) return null;
  if (typeof data === "string") return data;
  if (Array.isArray(data) && data.length > 0) {
    const x: any = data[0];
    return typeof x === "string" ? x : (x && (x.id || x.utilisateur_par_email)) || null;
  }
  return (data as any).id || null;
}

// Le compte, le rattachement au cabinet, l invitation.
async function ouvrirAcces(
  req: NextRequest, email: string, tenantId: string, invitePar: string, nom: string | null
): Promise<{ ok: boolean; message: string }> {
  let uid = await idDuCompte(email);
  if (!uid) {
    const { data, error } = await supabase.auth.admin.createUser({ email: email, email_confirm: true });
    if (error || !data || !data.user) {
      return { ok: false, message: "le compte de connexion n'a pas pu être créé ("
        + (error ? error.message : "réponse vide") + ")." };
    }
    uid = data.user.id;
  }

  const { data: membres } = await supabase.from("compliance_membres")
    .select("id, tenant_id, actif").eq("user_id", uid);
  const liste = (membres || []) as any[];
  const ici = liste.filter(function (m) { return String(m.tenant_id) === tenantId; })[0];
  const ailleurs = liste.filter(function (m) { return String(m.tenant_id) !== tenantId && m.actif !== false; });

  // 🆕 28/09 (point 2) — une adresse deja rattachee a un autre cabinet est
  // acceptee : elle passera d un cabinet a l autre depuis le tableau de bord
  // (« changer de cabinet »). On le dit dans le message.
  const deuxieme = !ici && ailleurs.length > 0;
  if (!ici) {
    const { error } = await supabase.from("compliance_membres").insert({
      user_id: uid, tenant_id: tenantId, role: "collaborateur", actif: true, profil: "cabinet_comptable",
    });
    if (error) return { ok: false, message: "le rattachement au cabinet a échoué (" + error.message + ")." };
  } else if (ici.actif === false) {
    await supabase.from("compliance_membres").update({ actif: true }).eq("id", ici.id);
  }

  const cle = process.env.RESEND_API_KEY || "";
  if (!cle) return { ok: true, message: "accès ouvert, mais l'invitation n'a pas pu partir (courriel indisponible)." };
  const marque = marqueDe(req);
  const lien = marque.site + marque.entree;
  try {
    const resend = new Resend(cle);
    const envoi: any = await resend.emails.send({
      from: marque.expediteur,
      to: email,
      reply_to: invitePar,
      subject: "Invitation — l'espace de travail de votre cabinet sur " + marque.nom,
      html: '<div style="font-family:Georgia,serif;color:#222;max-width:600px;margin:0 auto;padding:20px">'
        + "<h2>Bonjour" + (nom ? " " + html(nom) : "") + ",</h2>"
        + "<p>" + html(invitePar) + " vous a ajouté à l'espace de travail de votre cabinet sur "
        + html(marque.nom) + ".</p>"
        + "<p>Pour vous connecter, ouvrez l'espace, indiquez cette adresse (" + html(email)
        + ") : vous recevrez un lien de connexion. Aucun mot de passe à retenir.</p>"
        + '<p style="text-align:center;margin:28px 0"><a href="' + lien + '" style="background:#c8a96e;'
        + 'color:#050508;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">'
        + "Ouvrir mon espace</a></p>"
        + '<p style="font-size:12px;color:#777">Vous pouvez répondre à ce courriel pour toute question.</p></div>',
    } as any);
    if (envoi && envoi.error) {
      return { ok: true, message: "accès ouvert, mais l'invitation n'est pas partie ("
        + String(envoi.error.message || envoi.error) + ")." };
    }
  } catch (e: any) {
    return { ok: true, message: "accès ouvert, mais l'invitation n'est pas partie (" + String(e) + ")." };
  }
  return { ok: true, message: "une invitation lui a été envoyée."
    + (deuxieme ? " Cette adresse appartient déjà à un autre cabinet : elle passera de l'un à l'autre "
      + "depuis son tableau de bord (« changer de cabinet »)." : "") };
}

// Le rattachement suit la fiche : desactiver l un desactive l autre.
async function suivreActif(email: string, tenantId: string, actif: boolean): Promise<void> {
  const uid = await idDuCompte(email);
  if (!uid) return;
  await supabase.from("compliance_membres").update({ actif: actif }).eq("user_id", uid).eq("tenant_id", tenantId);
}

const LIBELLES_JOURNAL: any = {
  "paie.nouveau": "a créé un salarié et son contrat",
  "paie.modifier_contrat": "a modifié un contrat",
  "paie.repartition": "a modifié les jours travaillés",
  "paie.taux_pas": "a modifié le taux de prélèvement",
  "paie.ajouter_element": "a ajouté un élément du mois",
  "paie.supprimer_element": "a retiré un élément du mois",
  "paie.joindre_preuve": "a joint une pièce justificative",
  "paie.joindre_avis": "a joint un avis d'arrêt",
  "paie.poser_conges": "a posé des congés",
  "paie.supprimer_conges": "a retiré des congés",
  "paie.ajouter_evenement": "a saisi un arrêt ou une fin de contrat",
  "paie.supprimer_evenement": "a retiré un arrêt ou une fin de contrat",
  "paie.arret_ald": "a modifié l'affection de longue durée d'un arrêt",
  "paie.signalement": "a généré un signalement DSN",
  "paie.deposer_evenement": "a marqué un signalement déposé",
  "paie.sortir_bulletin": "a sorti un brouillon de bulletin",
  "paie.soumettre": "a soumis un bulletin à validation",
  "paie.justifier": "a justifié un point orange",
  "paie.renvoi": "a renvoyé un bulletin pour correction",
  "paie.levee": "a levé un point rouge",
  "paie.emettre": "a émis un bulletin",
  "paie.fin_contrat": "a produit les documents de fin de contrat",
  "paie.envoyer_recap": "a envoyé le récapitulatif au client",
  "paie.lever_recap": "a levé l'attente du client",
  "paie.recap_confirme": "a confirmé le récapitulatif (client)",
  "paie.recap_conteste": "a signalé une erreur dans le récapitulatif (client)",
  "paie.recap_relance": "relance automatique du client",
  "paie.regler_seuils": "a réglé les seuils des contrôles",
  "dsn.generer": "a généré la DSN",
  "dsn.controlee": "a déclaré la DSN passée dans dsn-val",
  "dsn.deposer": "a déposé la DSN sur net-entreprises",
  "dsn.deposee": "a marqué la DSN déposée",
  "dsn.urssaf": "a réglé l'URSSAF de la société",
  "dsn.taux_at": "a saisi un taux AT/MP",
  "dsn.garantie": "a ajouté une mutuelle ou une prévoyance",
  "dsn.garantie_fin": "a arrêté une mutuelle ou une prévoyance",
  "dsn.acces_enregistrer": "a enregistré les identifiants net-entreprises",
  "dsn.crm": "a enregistré le retour d'une DSN",
  "equipe.ajout": "a ajouté un collaborateur",
  "equipe.modification": "a modifié les droits d'un collaborateur",
  "equipe.invitation": "a envoyé une invitation",
};

async function lireJournal(tenantId: string): Promise<any> {
  const { data: soc } = await supabase.from("compta_societes").select("id, raison_sociale")
    .eq("tenant_id", tenantId).limit(2000);
  const ids = (soc || []).map(function (s: any) { return String(s.id); });
  const noms: any = {};
  for (const s of (soc || [])) noms[String((s as any).id)] = (s as any).raison_sociale;

  const { data: equipe } = await supabase.from("compta_collaborateurs").select("email").eq("tenant_id", tenantId);
  const emails = (equipe || []).map(function (e: any) { return String(e.email); });

  const lignes: any[] = [];
  if (ids.length > 0) {
    for (const prefixe of ["paie.%", "dsn.%"]) {
      const { data } = await supabase.from("compta_audit")
        .select("email, action, cible, reference, apres, societe_id, created_at")
        .in("societe_id", ids).like("action", prefixe)
        .order("created_at", { ascending: false }).limit(300);
      for (const l of (data || [])) lignes.push(l);
    }
  }
  if (emails.length > 0) {
    const { data } = await supabase.from("compta_audit")
      .select("email, action, cible, reference, apres, societe_id, created_at")
      .is("societe_id", null).like("action", "equipe.%").in("reference", emails)
      .order("created_at", { ascending: false }).limit(100);
    for (const l of (data || [])) lignes.push(l);
  }
  lignes.sort(function (a, b) { return String(a.created_at) < String(b.created_at) ? 1 : -1; });

  return lignes.slice(0, 300).map(function (l: any) {
    const a: any = l.apres || {};
    const detail = [a.numero, a.motif ? "« " + a.motif + " »" : null, a.justification ? "« " + a.justification + " »" : null,
      l.action.indexOf("equipe.") === 0 ? l.reference : null].filter(function (x) { return !!x; }).join(" · ");
    return {
      quand: l.created_at, qui: l.email, action: l.action,
      libelle: LIBELLES_JOURNAL[l.action] || l.action,
      dossier: l.societe_id ? (noms[String(l.societe_id)] || "") : "",
      detail: detail,
    };
  });
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || !(await peutGererEquipe())) return refuse();

    // TOUT EST BORNE A L ORGANISME. La table etait mono-cabinet : sans ce
    // filtre, un cabinet verrait les collaborateurs d un autre.
    const tenantId = tenantCourant();
    if (!tenantId) return sansOrganisme();

    // 🆕 28/09 — le journal du cabinet.
    if (req.nextUrl.searchParams.get("journal") === "1") {
      return NextResponse.json({ ok: true, journal: await lireJournal(tenantId) });
    }

    const { data, error } = await supabase
      .from("compta_collaborateurs")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("role", { ascending: true })
      .limit(500);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const { data: dossiers } = await supabase
      .from("compta_societes")
      .select("id, code, raison_sociale")
      .eq("tenant_id", tenantId)
      .eq("actif", true)
      .limit(500);

    const liste = (data || []).map(function (c: any) {
      const tous = !c.dossiers || c.dossiers.length === 0;
      return {
        ...c,
        role_nom: (ROLES[c.role] || {}).nom || c.role,
        tous_dossiers: tous,
        nb_dossiers: tous ? (dossiers || []).length : c.dossiers.length,
        paie_carte_blanche: c.paie_carte_blanche || [],
      };
    });

    return NextResponse.json({
      ok: true,
      moi: session.email,
      roles: Object.keys(ROLES).map(function (k) {
        return { code: k, nom: ROLES[k].nom, droits: ROLES[k].droits };
      }),
      dossiers: dossiers || [],
      total: liste.length,
      actifs: liste.filter(function (c: any) { return c.actif; }).length,
      collaborateurs: liste,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || !(await peutGererEquipe())) return refuse();

    const tenantId = tenantCourant();
    if (!tenantId) return sansOrganisme();

    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requête illisible." }, { status: 400 });
    }

    const email = String(b.email || "").trim().toLowerCase();
    if (email.indexOf("@") < 1 || email.length < 6) {
      return NextResponse.json({ ok: false, erreur: "Adresse électronique invalide." }, { status: 400 });
    }

    const { data: deja } = await supabase
      .from("compta_collaborateurs")
      .select("*")
      .eq("email", email)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    // 🆕 28/09 — « Envoyer l'invitation » : ouvrir l acces d un
    // collaborateur deja enregistre, sans toucher a ses droits.
    if (b.inviter === true) {
      if (!deja) {
        return NextResponse.json({ ok: false, erreur: "Collaborateur introuvable dans votre cabinet." }, { status: 404 });
      }
      if ((deja as any).actif === false) {
        return NextResponse.json({ ok: false, erreur: "Réactivez d'abord ce collaborateur." }, { status: 409 });
      }
      const acces = await ouvrirAcces(req, email, tenantId, session.email, (deja as any).nom || null);
      await supabase.from("compta_audit").insert({
        societe_id: null, email: session.email, action: "equipe.invitation", cible: "compta_collaborateurs",
        reference: email, avant: null, apres: { resultat: acces.message },
        adresse_ip: (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null,
      });
      return NextResponse.json(acces.ok
        ? { ok: true, email: email, message: "Accès ouvert pour " + email + " : " + acces.message }
        : { ok: false, erreur: "Accès non ouvert pour " + email + " : " + acces.message }, { status: acces.ok ? 200 : 409 });
    }

    const role = ROLES[String(b.role || "")] ? String(b.role)
      : (deja && ROLES[(deja as any).role] ? String((deja as any).role) : "collaborateur");
    const parDefaut = ROLES[role].droits;

    // 🚨 Un droit envoye l emporte ; sinon, sur une fiche existante, il garde
    // sa valeur ; sinon (creation), il prend celle du role.
    function droit(cle: string): boolean {
      const v = b["peut_" + cle];
      if (v === true || v === false) return v;
      if (deja && typeof (deja as any)["peut_" + cle] === "boolean") return (deja as any)["peut_" + cle];
      return parDefaut[cle] === true;
    }

    // Un collaborateur ne se retire pas ses propres droits : on se
    // condamnerait a ne plus pouvoir administrer.
    if (email === session.email && (b.actif === false || role === "lecture")) {
      return NextResponse.json(
        { ok: false, erreur: "Vous ne pouvez pas réduire vos propres droits." },
        { status: 409 }
      );
    }

    // Tous les dossiers de l organisme, pour controler ce qui est confie.
    const { data: duTenant } = await supabase
      .from("compta_societes")
      .select("id")
      .eq("tenant_id", tenantId)
      .limit(2000);
    const idsTenant = (duTenant || []).map(function (d: any) { return String(d.id); });

    // Les dossiers confies doivent appartenir a l organisme : sans ce
    // controle, on confierait a un collaborateur le dossier d un autre
    // cabinet en collant son identifiant.
    let dossiers: string[] = deja ? ((deja as any).dossiers || []) : [];
    if (b.dossiers !== undefined) {
      const demandes = listeIds(b.dossiers);
      const etrangers = demandes.filter(function (id) { return idsTenant.indexOf(id) < 0; });
      if (etrangers.length > 0) {
        return NextResponse.json(
          { ok: false, erreur: "Un ou plusieurs dossiers n'appartiennent pas à votre organisme." },
          { status: 403 }
        );
      }
      dossiers = demandes;
    }

    // 🆕 28/09 — LA CARTE BLANCHE, dossier par dossier. Seulement sur des
    // dossiers de l organisme, et, si le collaborateur est restreint a
    // certains dossiers, seulement sur ceux qui lui sont confies.
    let carteBlanche: string[] = deja ? ((deja as any).paie_carte_blanche || []) : [];
    if (b.paie_carte_blanche !== undefined) {
      const demandes = listeIds(b.paie_carte_blanche);
      const etrangers = demandes.filter(function (id) { return idsTenant.indexOf(id) < 0; });
      if (etrangers.length > 0) {
        return NextResponse.json(
          { ok: false, erreur: "La carte blanche ne se donne que sur des dossiers de votre organisme." },
          { status: 403 }
        );
      }
      carteBlanche = demandes;
    }
    if (dossiers.length > 0) {
      const horsConfies = carteBlanche.filter(function (id) { return dossiers.indexOf(id) < 0; });
      if (horsConfies.length > 0 && b.paie_carte_blanche !== undefined) {
        return NextResponse.json(
          { ok: false, erreur: "La carte blanche ne se donne que sur un dossier confié à ce collaborateur." },
          { status: 409 }
        );
      }
      carteBlanche = carteBlanche.filter(function (id) { return dossiers.indexOf(id) >= 0; });
    }

    const fiche: any = {
      email: email,
      tenant_id: tenantId,
      nom: b.nom !== undefined ? propre(b.nom, 120) : (deja ? (deja as any).nom : null),
      role: role,
      dossiers: dossiers,
      paie_carte_blanche: carteBlanche,
      notes: b.notes !== undefined ? propre(b.notes, 1000) : (deja ? (deja as any).notes : null),
      updated_at: new Date().toISOString(),
    };
    for (const d of DROITS) fiche["peut_" + d] = droit(d);

    if (b.actif !== undefined) fiche.actif = b.actif !== false;

    // Le dernier associe actif DE CET ORGANISME ne se desactive pas : sinon
    // plus personne ne peut administrer le cabinet. Le compte se fait bien
    // dans l organisme, et non sur toute la base.
    if (deja && (deja as any).role === "associe" && (fiche.actif === false || role !== "associe")) {
      const { data: associes } = await supabase
        .from("compta_collaborateurs")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("role", "associe")
        .eq("actif", true)
        .limit(10);

      if ((associes || []).length <= 1) {
        return NextResponse.json(
          { ok: false, erreur: "Il doit rester au moins un associé actif." },
          { status: 409 }
        );
      }
    }

    const r = deja
      ? await supabase.from("compta_collaborateurs").update(fiche).eq("id", (deja as any).id)
      : await supabase.from("compta_collaborateurs").insert(fiche);

    if (r.error) {
      return NextResponse.json({ ok: false, erreur: r.error.message }, { status: 500 });
    }

    // Le journal : qui a donne ou retire quoi, a qui.
    const avant: any = deja ? {
      role: (deja as any).role, actif: (deja as any).actif, dossiers: (deja as any).dossiers,
      paie_carte_blanche: (deja as any).paie_carte_blanche,
    } : null;
    if (deja) for (const d of DROITS) avant["peut_" + d] = (deja as any)["peut_" + d];
    const apres: any = { role: fiche.role, actif: fiche.actif === undefined ? (deja ? (deja as any).actif : true) : fiche.actif,
      dossiers: fiche.dossiers, paie_carte_blanche: fiche.paie_carte_blanche };
    for (const d of DROITS) apres["peut_" + d] = fiche["peut_" + d];
    const { error: eJ } = await supabase.from("compta_audit").insert({
      societe_id: null,
      email: session.email,
      action: deja ? "equipe.modification" : "equipe.ajout",
      cible: "compta_collaborateurs",
      reference: email,
      avant: avant,
      apres: apres,
      adresse_ip: (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null,
    });
    if (eJ) console.error("[collaborateurs] journal :", eJ.message);

    // 🆕 28/09 — l acces suit la fiche.
    let suite = "";
    if (!deja) {
      const acces = await ouvrirAcces(req, email, tenantId, session.email, fiche.nom || null);
      suite = acces.ok ? " Accès ouvert : " + acces.message
        : " ⚠️ Accès NON ouvert : " + acces.message;
    } else if (b.actif !== undefined) {
      await suivreActif(email, tenantId, b.actif !== false);
    }

    return NextResponse.json({
      ok: true,
      email: email,
      message: (deja ? "Droits mis à jour pour " : "Collaborateur ajouté : ") + email + "." + suite,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
