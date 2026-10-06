import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { estAdmin } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════════════
// 🆕 06/10/2026 — L EQUIPE DE PRODUCTION (le service de paie aux cabinets)
//
// POURQUOI : Jacques veut proposer aux cabinets une equipe qui prepare leur
// paie. Il lui fallait UN ecran, au-dessus de tous les cabinets, pour dire
// qui travaille pour qui, et voir la charge et la qualite de chacun.
//
// CE QUE CETTE ROUTE NE REINVENTE PAS : l acces d un preparateur a un
// cabinet est une fiche ordinaire de `compta_collaborateurs` dans ce
// cabinet, avec son rattachement `compliance_membres`. Tout ce qui existe
// deja continue donc de s appliquer : les droits verifies par chaque route,
// les dossiers confies, la carte blanche, le journal du cabinet, et le
// bouton « Desactiver » de l ecran des collaborateurs du cabinet.
//
// CE QU ELLE AJOUTE :
//   · `production_equipe` : la liste des preparateurs de Jacques (adresse,
//     nom, pays). C est la seule table nouvelle ;
//   · affecter un preparateur a un cabinet : la fiche est creee avec DEUX
//     droits seulement — « fiche et contrat » et « preparer la paie ». Ni
//     emettre, ni deposer, ni aucun droit comptable : c est le schema
//     « je prepare, vous validez ». Le cabinet peut ensuite elargir ou
//     reduire depuis son propre ecran ;
//   · retirer un preparateur d un cabinet ;
//   · la charge du mois, cabinet par cabinet (salaries a payer, bulletins
//     en brouillon, a valider, renvoyes, emis, restant a faire) ;
//   · la mesure de chacun sur le mois : bulletins prepares, et la part
//     renvoyee pour correction.
//
// ⛔ RESERVEE A L ADMINISTRATEUR (lib/droits, estAdmin). C est la seule
// route qui lit plusieurs cabinets a la fois : aucun autre compte ne doit
// pouvoir l ouvrir.
// ⛔ UN ACCES QUE LE CABINET A LUI-MEME DESACTIVE NE SE ROUVRE PAS D ICI :
// seul un retrait fait depuis cet ecran se defait depuis cet ecran.
// ⚠️ CHAQUE AFFECTATION ET CHAQUE RETRAIT EST INSCRIT AU JOURNAL DU CABINET
// (compta_audit, actions equipe.ajout / equipe.modification) : le cabinet
// le lit dans son ecran des collaborateurs.
// ═══════════════════════════════════════════════════════════════════════

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

const MARQUE_RETRAIT = "Retiré par l'équipe de production";

// Les droits poses a l affectation : la paie, sans emission ni depot, et
// aucun droit comptable.
const DROITS_AFFECTATION: any = {
  peut_saisir: false, peut_valider: false, peut_cloturer: false, peut_declarer: false,
  peut_gerer_plan: false, peut_deposer_pieces: false,
  peut_paie_contrats: true, peut_paie_preparer: true, peut_paie_emettre: false, peut_dsn_deposer: false,
};

function json(corps: any, statut?: number) {
  return NextResponse.json(corps, { status: statut || 200, headers: { "Cache-Control": "no-store" } });
}

function propre(v: any, max: number): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).replace(/[\u0000-\u001F\u007F]/g, "").trim();
  return t ? t.slice(0, max) : null;
}

function adresse(v: any): string {
  const e = String(v || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) ? e : "";
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

function html(t: any): string {
  return String(t === null || t === undefined ? "" : t)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Le mois demande, en « AAAA-MM » ; a defaut le mois courant (heure de Paris).
function moisDemande(v: any): string {
  const t = String(v || "").trim();
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(t)) return t;
  const p = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit" })
    .format(new Date());
  return p.slice(0, 7);
}

function bornes(mois: string): { debut: string; fin: string } {
  const a = Number(mois.slice(0, 4));
  const m = Number(mois.slice(5, 7));
  const dernier = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return { debut: mois + "-01", fin: mois + "-" + String(dernier).padStart(2, "0") };
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

// Le compte de connexion et le rattachement au cabinet, puis l invitation.
async function ouvrirAcces(
  email: string, tenantId: string, nomCabinet: string, nom: string | null, invitePar: string
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
    .select("id, tenant_id, actif").eq("user_id", uid).eq("tenant_id", tenantId);
  const ici: any = ((membres || []) as any[])[0];
  if (!ici) {
    const { error } = await supabase.from("compliance_membres").insert({
      user_id: uid, tenant_id: tenantId, role: "collaborateur", actif: true, profil: "cabinet_comptable",
    });
    if (error) return { ok: false, message: "le rattachement au cabinet a échoué (" + error.message + ")." };
  } else if (ici.actif === false) {
    await supabase.from("compliance_membres").update({ actif: true }).eq("id", ici.id);
  }

  const cle = process.env.RESEND_API_KEY || "";
  if (!cle) return { ok: true, message: "accès ouvert, sans courriel (envoi indisponible)." };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + cle, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Mr. Comptable <contact@mrcomptable.fr>",
        to: email,
        reply_to: invitePar,
        subject: "Un nouveau cabinet vous est confié — " + nomCabinet,
        html: '<div style="font-family:Georgia,serif;color:#222;max-width:600px;margin:0 auto;padding:20px">'
          + "<h2>Bonjour" + (nom ? " " + html(nom) : "") + ",</h2>"
          + "<p>Le cabinet <b>" + html(nomCabinet) + "</b> vous est confié pour la préparation de la paie "
          + "sur Mr. Comptable.</p>"
          + "<p>Pour vous connecter, ouvrez l'espace et indiquez cette adresse (" + html(email)
          + ") : vous recevrez un lien de connexion. Si vous travaillez déjà pour un autre cabinet, "
          + "passez de l'un à l'autre depuis le tableau de bord (« Cabinet »).</p>"
          + '<p style="text-align:center;margin:28px 0"><a href="https://mrcomptable.fr/comptable/inscription" '
          + 'style="background:#c8a96e;color:#050508;padding:14px 28px;border-radius:8px;text-decoration:none;'
          + 'font-weight:bold">Ouvrir mon espace</a></p>'
          + '<p style="font-size:12px;color:#777">Vous pouvez répondre à ce courriel pour toute question.</p></div>',
      }),
      cache: "no-store",
    });
    if (!r.ok) return { ok: true, message: "accès ouvert, mais le courriel n'est pas parti (réponse " + r.status + ")." };
  } catch (e: any) {
    return { ok: true, message: "accès ouvert, mais le courriel n'est pas parti (" + String(e) + ")." };
  }
  return { ok: true, message: "un courriel le lui annonce." };
}

async function inscrire(req: NextRequest, qui: string, action: string, reference: string, avant: any, apres: any) {
  const { error } = await supabase.from("compta_audit").insert({
    societe_id: null, email: qui, action: action, cible: "compta_collaborateurs",
    reference: reference, avant: avant, apres: apres,
    adresse_ip: (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null,
  });
  if (error) console.error("[production] journal :", error.message);
}

// ───────────────────────────────────────────────────────────────────────
// LA LECTURE : l equipe, les cabinets, qui travaille pour qui, la charge du
// mois et la mesure de chacun.
// ───────────────────────────────────────────────────────────────────────
async function etat(mois: string): Promise<any> {
  const { debut, fin } = bornes(mois);

  const { data: equipeLue, error: eEq } = await supabase.from("production_equipe")
    .select("id, email, nom, pays, actif, notes, cree_le").order("nom", { ascending: true }).limit(500);
  if (eEq) {
    return { ok: true, mois: mois, equipe: [], cabinets: [],
      indisponible: "L'équipe de production n'est pas encore installée en base (" + eEq.message + ")." };
  }
  const equipe = (equipeLue || []) as any[];
  const emails = equipe.map(function (p) { return String(p.email).toLowerCase(); });

  // ---- Les cabinets : tout organisme qui a au moins un associe ----
  const { data: associes } = await supabase.from("compta_collaborateurs")
    .select("tenant_id").eq("role", "associe").eq("actif", true).limit(5000);
  const tenants: string[] = [];
  for (const a of ((associes || []) as any[])) {
    const t = String(a.tenant_id || "");
    if (t && tenants.indexOf(t) < 0) tenants.push(t);
  }
  const noms: any = {};
  if (tenants.length > 0) {
    const { data: fiches } = await supabase.from("organismes_formation")
      .select("tenant_id, raison_sociale").in("tenant_id", tenants);
    for (const f of ((fiches || []) as any[])) noms[String(f.tenant_id)] = f.raison_sociale;
  }

  // ---- Les dossiers, les contrats en poste et les bulletins du mois ----
  const dossiersPar: any = {};
  const contratsPar: any = {};
  const bulletinsPar: any = {};
  const bulletinsDuMois: any[] = [];
  if (tenants.length > 0) {
    const { data: soc } = await supabase.from("compta_societes")
      .select("id, tenant_id, code, raison_sociale").in("tenant_id", tenants).eq("actif", true).limit(5000);
    for (const s of ((soc || []) as any[])) {
      const t = String(s.tenant_id);
      if (!dossiersPar[t]) dossiersPar[t] = [];
      dossiersPar[t].push({ id: String(s.id), code: s.code, raison_sociale: s.raison_sociale });
    }

    const { data: cts } = await supabase.from("paie_contrats")
      .select("id, tenant_id, statut, date_debut, date_fin, rompu_le")
      .in("tenant_id", tenants).lte("date_debut", fin).limit(10000);
    for (const c of ((cts || []) as any[])) {
      const sortie = [c.date_fin, c.rompu_le].filter(function (x: any) { return !!x; })
        .map(function (x: any) { return String(x).slice(0, 10); }).sort()[0] || "";
      if (sortie && sortie < debut) continue;
      const t = String(c.tenant_id);
      if (!contratsPar[t]) contratsPar[t] = [];
      contratsPar[t].push(String(c.id));
    }

    const { data: bs } = await supabase.from("paie_bulletins")
      .select("id, tenant_id, contrat_id, statut, validation, prepare_par, soumis_par")
      .in("tenant_id", tenants).gte("periode", debut).lte("periode", fin)
      .neq("statut", "annule").limit(10000);
    for (const b of ((bs || []) as any[])) {
      bulletinsDuMois.push(b);
      const t = String(b.tenant_id);
      if (!bulletinsPar[t]) bulletinsPar[t] = [];
      bulletinsPar[t].push(b);
    }
  }

  // ---- Les renvois pour correction recus par les bulletins du mois ----
  const renvoyes: any = {};
  const idsBulletins = bulletinsDuMois.map(function (b) { return String(b.id); });
  for (let i = 0; i < idsBulletins.length; i += 200) {
    const { data: aud } = await supabase.from("compta_audit")
      .select("reference").eq("action", "paie.renvoi").in("reference", idsBulletins.slice(i, i + 200)).limit(5000);
    for (const l of ((aud || []) as any[])) renvoyes[String(l.reference)] = true;
  }

  // ---- Qui travaille pour qui ----
  const fichesPar: any = {};
  if (emails.length > 0) {
    const { data: fiches } = await supabase.from("compta_collaborateurs")
      .select("id, email, tenant_id, actif, role, dossiers, paie_carte_blanche, notes, "
        + "peut_paie_contrats, peut_paie_preparer, peut_paie_emettre, peut_dsn_deposer")
      .in("email", emails).limit(5000);
    for (const f of ((fiches || []) as any[])) {
      const k = String(f.email).toLowerCase();
      if (!fichesPar[k]) fichesPar[k] = [];
      fichesPar[k].push(f);
    }
  }

  const cabinets = tenants.map(function (t) {
    const cts: string[] = contratsPar[t] || [];
    const bs: any[] = bulletinsPar[t] || [];
    const avecBulletin: any = {};
    let emis = 0, aValider = 0, renvoi = 0, brouillons = 0;
    for (const b of bs) {
      avecBulletin[String(b.contrat_id)] = true;
      if (b.statut === "emis") emis++;
      else if (b.validation === "a_valider") aValider++;
      else if (b.validation === "renvoye") renvoi++;
      else brouillons++;
    }
    const reste = cts.filter(function (id) { return !avecBulletin[id]; }).length;
    const preparateurs = equipe.filter(function (p) {
      return ((fichesPar[String(p.email).toLowerCase()] || []) as any[])
        .some(function (f) { return String(f.tenant_id) === t && f.actif !== false; });
    }).map(function (p) { return p.nom || p.email; });
    return {
      tenant_id: t, nom: noms[t] || "Cabinet sans nom",
      dossiers: dossiersPar[t] || [],
      salaries: cts.length, a_faire: reste, brouillons: brouillons,
      a_valider: aValider, renvoyes: renvoi, emis: emis,
      preparateurs: preparateurs,
    };
  }).sort(function (a, b) { return a.nom.localeCompare(b.nom, "fr"); });

  const membres = equipe.map(function (p) {
    const k = String(p.email).toLowerCase();
    const fiches: any[] = fichesPar[k] || [];
    const siens = bulletinsDuMois.filter(function (b) {
      return String(b.prepare_par || b.soumis_par || "").toLowerCase() === k;
    });
    const nbRenvoyes = siens.filter(function (b) { return renvoyes[String(b.id)]; }).length;
    return {
      id: p.id, email: k, nom: p.nom, pays: p.pays, actif: p.actif !== false, notes: p.notes,
      cabinets: fiches.map(function (f) {
        const t = String(f.tenant_id);
        const tous = !f.dossiers || f.dossiers.length === 0;
        return {
          tenant_id: t, nom: noms[t] || "Cabinet sans nom", actif: f.actif !== false,
          retire_ici: f.actif === false && String(f.notes || "").indexOf(MARQUE_RETRAIT) === 0,
          tous_dossiers: tous,
          nb_dossiers: tous ? (dossiersPar[t] || []).length : f.dossiers.length,
          dossiers: f.dossiers || [],
          contrats: f.peut_paie_contrats === true, preparer: f.peut_paie_preparer === true,
          emettre: f.peut_paie_emettre === true, deposer: f.peut_dsn_deposer === true,
          cartes_blanches: (f.paie_carte_blanche || []).length,
          prepares: siens.filter(function (b) { return String(b.tenant_id) === t; }).length,
        };
      }).sort(function (a, b) { return a.nom.localeCompare(b.nom, "fr"); }),
      prepares: siens.length,
      emis: siens.filter(function (b) { return b.statut === "emis"; }).length,
      renvoyes: nbRenvoyes,
      part_renvoyee: siens.length > 0 ? Math.round(nbRenvoyes / siens.length * 1000) / 10 : null,
    };
  });

  return { ok: true, mois: mois, equipe: membres, cabinets: cabinets };
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || !estAdmin(session.email)) {
      return json({ ok: false, erreur: "Réservé à l'administrateur." }, 403);
    }
    return json(await etat(moisDemande(req.nextUrl.searchParams.get("mois"))));
  } catch (e: any) {
    return json({ ok: false, erreur: String(e) }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || !estAdmin(session.email)) {
      return json({ ok: false, erreur: "Réservé à l'administrateur." }, 403);
    }
    const b = await req.json().catch(function () { return null; });
    if (!b) return json({ ok: false, erreur: "Requête illisible." }, 400);
    const action = String(b.action || "").trim();
    const email = adresse(b.email);
    if (!email) return json({ ok: false, erreur: "Adresse électronique invalide." }, 400);

    // ---- AJOUTER OU MODIFIER UN PREPARATEUR ----
    if (action === "membre") {
      const { data: deja } = await supabase.from("production_equipe").select("*").eq("email", email).maybeSingle();
      const fiche: any = {
        email: email,
        nom: b.nom !== undefined ? propre(b.nom, 120) : (deja ? (deja as any).nom : null),
        pays: b.pays !== undefined ? propre(b.pays, 60) : (deja ? (deja as any).pays : null),
        notes: b.notes !== undefined ? propre(b.notes, 1000) : (deja ? (deja as any).notes : null),
        maj_le: new Date().toISOString(),
      };
      if (b.actif !== undefined) fiche.actif = b.actif !== false;
      const r = deja
        ? await supabase.from("production_equipe").update(fiche).eq("id", (deja as any).id)
        : await supabase.from("production_equipe").insert(fiche);
      if (r.error) return json({ ok: false, erreur: r.error.message }, 500);

      // Sortir quelqu un de l equipe ne lui retire PAS ses acces aux
      // cabinets : on le dit, pour que rien ne reste ouvert par oubli.
      let suite = "";
      if (deja && b.actif === false) {
        const { data: restants } = await supabase.from("compta_collaborateurs")
          .select("id").eq("email", email).eq("actif", true).limit(100);
        const n = (restants || []).length;
        if (n > 0) suite = " ⚠️ Cette personne garde un accès actif à " + n
          + " cabinet(s) : retirez-les un par un ci-dessous.";
      }
      return json({ ok: true, message: (deja ? "Fiche mise à jour : " : "Ajouté à l'équipe : ") + email + "." + suite });
    }

    // ---- AFFECTER A UN CABINET, OU L EN RETIRER ----
    if (action === "affecter" || action === "retirer") {
      const tenantId = String(b.tenant_id || "").trim();
      if (tenantId.length < 10) return json({ ok: false, erreur: "Cabinet manquant." }, 400);

      const { data: membre } = await supabase.from("production_equipe")
        .select("id, nom, actif").eq("email", email).maybeSingle();
      if (!membre) return json({ ok: false, erreur: "Cette adresse ne fait pas partie de l'équipe de production." }, 404);

      const { data: unAssocie } = await supabase.from("compta_collaborateurs")
        .select("id").eq("tenant_id", tenantId).eq("role", "associe").eq("actif", true).limit(1);
      if ((unAssocie || []).length === 0) {
        return json({ ok: false, erreur: "Cabinet inconnu : aucun associé actif ne s'y trouve." }, 404);
      }
      const { data: ficheCab } = await supabase.from("organismes_formation")
        .select("raison_sociale").eq("tenant_id", tenantId).maybeSingle();
      const nomCabinet = String((ficheCab && (ficheCab as any).raison_sociale) || "Cabinet sans nom");

      const { data: deja } = await supabase.from("compta_collaborateurs")
        .select("*").eq("email", email).eq("tenant_id", tenantId).maybeSingle();
      const d: any = deja;

      if (action === "retirer") {
        if (!d || d.actif === false) return json({ ok: false, erreur: "Cette personne n'a pas d'accès actif à ce cabinet." }, 409);
        if (d.role === "associe") {
          return json({ ok: false, erreur: "Cette adresse est associée de ce cabinet : son accès ne se retire pas d'ici." }, 409);
        }
        const note = MARQUE_RETRAIT + " le " + new Date().toISOString().slice(0, 10).split("-").reverse().join("/") + ".";
        const { error } = await supabase.from("compta_collaborateurs")
          .update({ actif: false, notes: note, updated_at: new Date().toISOString() }).eq("id", d.id);
        if (error) return json({ ok: false, erreur: error.message }, 500);
        const uid = await idDuCompte(email);
        if (uid) {
          await supabase.from("compliance_membres").update({ actif: false }).eq("user_id", uid).eq("tenant_id", tenantId);
        }
        await inscrire(req, session.email, "equipe.modification", email,
          { actif: true }, { actif: false, par_production: true });
        return json({ ok: true, message: email + " n'a plus accès à " + nomCabinet + "." });
      }

      // ---- affecter ----
      if ((membre as any).actif === false) {
        return json({ ok: false, erreur: "Cette personne est sortie de l'équipe : réactivez-la d'abord." }, 409);
      }
      if (d && d.actif !== false) {
        return json({ ok: false, erreur: email + " a déjà accès à " + nomCabinet
          + ". Ses droits se règlent depuis l'écran des collaborateurs du cabinet." }, 409);
      }
      if (d && d.actif === false && String(d.notes || "").indexOf(MARQUE_RETRAIT) !== 0) {
        return json({ ok: false, erreur: nomCabinet + " a lui-même désactivé cet accès : c'est au cabinet de le rouvrir, "
          + "depuis son écran des collaborateurs." }, 409);
      }

      // Les dossiers confies : aucun = tous ceux du cabinet. Ceux qui sont
      // nommes doivent lui appartenir.
      const { data: duTenant } = await supabase.from("compta_societes").select("id").eq("tenant_id", tenantId).limit(2000);
      const idsTenant = (duTenant || []).map(function (x: any) { return String(x.id); });
      const demandes = listeIds(b.dossiers);
      if (demandes.some(function (id) { return idsTenant.indexOf(id) < 0; })) {
        return json({ ok: false, erreur: "Un ou plusieurs dossiers n'appartiennent pas à ce cabinet." }, 403);
      }

      const fiche: any = {
        email: email, tenant_id: tenantId, nom: (membre as any).nom || null, role: "collaborateur",
        dossiers: demandes, paie_carte_blanche: [], actif: true,
        notes: "Affecté par l'équipe de production le "
          + new Date().toISOString().slice(0, 10).split("-").reverse().join("/") + ".",
        updated_at: new Date().toISOString(),
      };
      for (const k of Object.keys(DROITS_AFFECTATION)) fiche[k] = DROITS_AFFECTATION[k];
      const r = d
        ? await supabase.from("compta_collaborateurs").update(fiche).eq("id", d.id)
        : await supabase.from("compta_collaborateurs").insert(fiche);
      if (r.error) return json({ ok: false, erreur: r.error.message }, 500);

      const acces = await ouvrirAcces(email, tenantId, nomCabinet, (membre as any).nom || null, session.email);
      await inscrire(req, session.email, d ? "equipe.modification" : "equipe.ajout", email,
        d ? { actif: false } : null,
        { role: "collaborateur", actif: true, dossiers: demandes, par_production: true,
          peut_paie_contrats: true, peut_paie_preparer: true, peut_paie_emettre: false, peut_dsn_deposer: false,
          resultat: acces.message });
      return json(acces.ok
        ? { ok: true, message: email + " prépare désormais la paie de " + nomCabinet
          + " (fiche et contrat, préparer la paie) : " + acces.message }
        : { ok: false, erreur: "La fiche est créée, mais l'accès n'est PAS ouvert : " + acces.message }, acces.ok ? 200 : 409);
    }

    return json({ ok: false, erreur: "Action inconnue : " + action }, 400);
  } catch (e: any) {
    return json({ ok: false, erreur: String(e) }, 500);
  }
}
