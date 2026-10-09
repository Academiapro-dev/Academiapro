import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sessionCourante } from "../../../../lib/session";
import { origineLegitime } from "../../../../lib/origine";
import { lecture } from "../../../../lib/droits";
import {
  ETAPES, ORDRE_SECTIONS, questionnaire, sectionDe, formeDe, nettoyer, controler, horsCadre,
  canonique, lettreDepart, statuts, recapitulatif,
} from "../../../../lib/statuts-modeles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

// ══════════════════════════════════════════════════════════════════════════
// LE DOSSIER DE CREATION D UNE SOCIETE FRANCAISE — 09/10/2026 (Mr Comptable,
// lot A : de la lettre de depart aux statuts signes).
//
// ⚠️ A NE PAS CONFONDRE avec /api/compliance/creation, qui cree une LLC
// americaine pour MysterLLC. Les deux ne partagent rien, sauf la chaine de
// signature (document-a-signer → signature), que cette route NE MODIFIE PAS.
//
// LES REGLES DE JACQUES (09/10), TENUES ICI ET PAS SEULEMENT A L ECRAN :
//   1. SANS LA LETTRE DE DEPART SIGNEE, RIEN NE COMMENCE : aucune reponse
//      n est acceptee avant que sa signature existe en base.
//   2. UNE ETAPE NE S OUVRE QUE SI LA PRECEDENTE EST VALIDEE. Chaque
//      validation est ecrite au journal AVANT d etre retenue : la date, le
//      compte qui a valide, et l empreinte des reponses validees.
//   3. UNE REPONSE QUI CHANGE DEFAIT LA VALIDATION de son etape et de toutes
//      celles qui suivent : on ne signe jamais des statuts dont une reponse
//      a bouge apres coup.
//   4. HORS CADRE, LE PARCOURS S ARRETE : rien n est valide ni genere.
//   5. LES STATUTS NE SE PREPARENT QUE SI LES CINQ ETAPES SONT VALIDEES. Le
//      recapitulatif des reponses et des validations est reproduit a leur
//      suite : il est signe avec eux.
// ⛔ Le programme ne choisit rien, ne complete rien, ne corrige rien dans
// les reponses : il les range ou il les refuse en disant pourquoi.
//
// GET  (sans id)  : les dossiers du cabinet et le questionnaire.
// GET  ?id=       : un dossier, son etape, ses validations, son journal. La
//                   signature de la lettre et des statuts se CONSTATE ici,
//                   en base (compliance_signatures), jamais sur parole.
// POST action = ouvrir | lettre_preparer | lettre_lier | enregistrer |
//               valider | statuts_preparer | statuts_lier | rouvrir |
//               abandonner
//
// ⚠️ LOT A : les statuts partent a UN signataire (EURL, SASU). Des que la
// societe compte plusieurs associes, ils se relisent ici mais leur envoi a
// la signature de chacun attend le lot B (plusieurs signataires sur un meme
// document) : la route le dit, elle ne fait pas signer un seul pour tous.
// ══════════════════════════════════════════════════════════════════════════

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

function texte(v: any, max: number): string {
  if (v === null || v === undefined) return "";
  return String(v).replace(/\s+/g, " ").trim().slice(0, max);
}

function refus(erreur: string, statut: number, plus?: any) {
  return NextResponse.json({ ok: false, erreur, ...(plus || {}) }, { status: statut });
}

function empreinte(v: any): string {
  return crypto.createHash("sha256").update(canonique(v === undefined ? null : v)).digest("hex");
}

async function cabinetDe(tenantId: string) {
  const { data } = await supabase
    .from("compliance_tenants")
    .select("id, label, legal_name, principal_office_address, email_contact")
    .eq("tenant_id", tenantId)
    .order("label", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data || null;
}

async function dossierDe(tenantId: string, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await supabase.from("compta_creations").select("*").eq("id", id).eq("tenant_id", tenantId).maybeSingle();
  return data || null;
}

// Le journal ne se reecrit pas : on n y fait que des ajouts.
async function journal(d: any, par: string, action: string, section: string | null, valeur: any): Promise<string | null> {
  const { error } = await supabase.from("compta_creations_journal").insert({
    creation_id: d.id, tenant_id: d.tenant_id, par, action, section, valeur: valeur === undefined ? null : valeur,
  });
  return error ? error.message : null;
}

async function signatureDe(reference: string): Promise<string | null> {
  const { data } = await supabase
    .from("compliance_signatures")
    .select("*")
    .eq("document_reference", reference)
    .eq("annulee", false)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const s: any = data;
  return s.signe_le || s.created_at || new Date().toISOString();
}

// Une etape est validee si sa validation porte l empreinte des reponses
// d aujourd hui. Une reponse changee depuis ne compte plus.
function valide(d: any, section: string): boolean {
  const v = d.validations && d.validations[section];
  return !!(v && v.empreinte && v.empreinte === empreinte((d.reponses || {})[section]));
}

function etapeCourante(d: any): string {
  if (!d.lettre_signee_le) return "lettre";
  for (const s of ORDRE_SECTIONS) if (!valide(d, s)) return s;
  if (!d.statuts_signes_le) return "statuts";
  return "depot_capital";
}

// CONSTATER LES SIGNATURES. C est la signature en base qui fait avancer le
// dossier, jamais l envoi (meme regle que l Operating Agreement, 23/09).
async function constater(d: any): Promise<any> {
  const maj: any = {};
  if (d.lettre_reference && !d.lettre_signee_le) {
    const le = await signatureDe(d.lettre_reference);
    if (le) { maj.lettre_signee_le = le; await journal(d, "signature", "lettre_signee", null, { reference: d.lettre_reference, le }); }
  }
  if (d.statuts_reference && !d.statuts_signes_le) {
    const le = await signatureDe(d.statuts_reference);
    if (le) { maj.statuts_signes_le = le; await journal(d, "signature", "statuts_signes", null, { reference: d.statuts_reference, le }); }
  }
  if (Object.keys(maj).length === 0) return d;
  maj.maj_le = new Date().toISOString();
  const { data } = await supabase.from("compta_creations").update(maj).eq("id", d.id).select("*").maybeSingle();
  return data || { ...d, ...maj };
}

async function vue(d: any) {
  const courante = etapeCourante(d);
  const rang = ETAPES.findIndex(function (e) { return e.code === courante; });
  const { data: lignes } = await supabase
    .from("compta_creations_journal")
    .select("le, par, action, section")
    .eq("creation_id", d.id)
    .order("le", { ascending: false })
    .limit(60);
  const validations: any = {};
  for (const s of ORDRE_SECTIONS) validations[s] = valide(d, s) ? { le: d.validations[s].le, par: d.validations[s].par } : null;
  return {
    dossier: {
      id: d.id, nom_projet: d.nom_projet, forme: d.forme, client_nom: d.client_nom, client_email: d.client_email,
      mandataire_nom: d.mandataire_nom, statut: d.statut, hors_cadre: d.hors_cadre, reponses: d.reponses || {},
      lettre_reference: d.lettre_reference, lettre_envoyee_le: d.lettre_envoyee_le, lettre_signee_le: d.lettre_signee_le,
      statuts_reference: d.statuts_reference, statuts_envoyes_le: d.statuts_envoyes_le, statuts_signes_le: d.statuts_signes_le,
      cree_le: d.cree_le,
    },
    etape: courante,
    etapes: ETAPES.map(function (e, i) { return { ...e, etat: i < rang ? "faite" : i === rang ? "en_cours" : "a_venir" }; }),
    validations,
    journal: lignes || [],
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || !session.tenantId) return refus("Connectez-vous.", 401);
    const barre = await lecture(null);
    if (barre) return barre;

    const id = (req.nextUrl.searchParams.get("id") || "").trim();
    if (id) {
      let d = await dossierDe(session.tenantId, id);
      if (!d) return refus("Dossier introuvable.", 404);
      d = await constater(d);
      return NextResponse.json({ ok: true, ...(await vue(d)) });
    }

    const { data, error } = await supabase
      .from("compta_creations")
      .select("*")
      .eq("tenant_id", session.tenantId)
      .order("cree_le", { ascending: false })
      .limit(200);
    if (error) return refus(error.message, 500);
    const cabinet = await cabinetDe(session.tenantId);
    return NextResponse.json({
      ok: true,
      questionnaire: questionnaire(),
      cabinet: cabinet ? (cabinet.legal_name || cabinet.label) : null,
      dossiers: (data || []).map(function (d: any) {
        const code = etapeCourante(d);
        const e = ETAPES.find(function (x) { return x.code === code; });
        return { id: d.id, nom_projet: d.nom_projet, forme: d.forme, client_nom: d.client_nom, statut: d.statut, hors_cadre: !!d.hors_cadre, etape: code, etape_nom: e ? e.nom : code, cree_le: d.cree_le };
      }),
    });
  } catch (e: any) {
    return refus(String(e), 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!origineLegitime(req)) return refus("Accès refusé.", 403);
    const session = sessionCourante();
    if (!session || !session.tenantId) return refus("Connectez-vous.", 401);
    const barre = await lecture(null);
    if (barre) return barre;

    const b = await req.json().catch(function () { return null; });
    if (!b || !b.action) return refus("Action non précisée.", 400);
    const action = String(b.action);
    const tenantId = session.tenantId;

    // ---- OUVRIR UN DOSSIER ----
    if (action === "ouvrir") {
      const nomProjet = texte(b.nom_projet, 120);
      const clientNom = texte(b.client_nom, 120);
      const clientEmail = texte(b.client_email, 200).toLowerCase();
      const mandataire = texte(b.mandataire_nom, 120);
      if (nomProjet.length < 2) return refus("Donnez un nom au projet (le nom envisagé pour la société).", 400);
      if (clientNom.length < 3) return refus("Indiquez le prénom et le nom du client.", 400);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) return refus("L'adresse de courriel du client n'a pas la forme d'une adresse.", 400);
      if (mandataire.length < 3) return refus("Indiquez le prénom et le nom du mandataire : la personne qui déposera le dossier au guichet unique.", 400);
      const { data: cree, error } = await supabase
        .from("compta_creations")
        .insert({ tenant_id: tenantId, nom_projet: nomProjet, client_nom: clientNom, client_email: clientEmail, mandataire_nom: mandataire, cree_par: session.email })
        .select("*")
        .maybeSingle();
      if (error || !cree) return refus(error ? error.message : "Ouverture impossible.", 500);
      const e = await journal(cree, session.email, "ouverture", null, { nom_projet: nomProjet, client_nom: clientNom, client_email: clientEmail, mandataire_nom: mandataire });
      if (e) return refus("Dossier ouvert, mais son journal n'a pas pu être écrit : " + e, 500);
      return NextResponse.json({ ok: true, message: "Dossier « " + nomProjet + " » ouvert. Première étape : la lettre de départ.", ...(await vue(cree)) });
    }

    let d = await dossierDe(tenantId, String(b.id || ""));
    if (!d) return refus("Dossier introuvable.", 404);
    if (d.statut === "abandonne") return refus("Ce dossier a été arrêté : il ne se modifie plus.", 409);
    d = await constater(d);

    // ---- LA LETTRE DE DEPART ----
    if (action === "lettre_preparer") {
      if (d.lettre_signee_le) return refus("La lettre de départ est déjà signée.", 409);
      const cabinet = await cabinetDe(tenantId);
      if (!cabinet) return refus("Renseignez d'abord votre société dans « Ma société » : la lettre de départ la nomme.", 400);
      const l = lettreDepart(d, cabinet);
      return NextResponse.json({
        ok: true, corps: l.corps, titre: l.titre,
        document_a_signer: { doc_type: "mandat", libelle: l.libelle, titre: l.titre, corps: l.corps, signataire_email: d.client_email, signataire_nom: d.client_nom, entite_id: cabinet.id },
      });
    }

    if (action === "lettre_lier" || action === "statuts_lier") {
      const reference = texte(b.reference, 60);
      if (!reference) return refus("Référence du document manquante.", 400);
      const { data: doc } = await supabase.from("compliance_documents").select("reference, signataire_email").eq("reference", reference).eq("tenant_id", tenantId).maybeSingle();
      if (!doc) return refus("Ce document n'appartient pas à votre organisme.", 404);
      const maintenant = new Date().toISOString();
      if (action === "lettre_lier") {
        if (d.lettre_signee_le) return refus("La lettre de départ est déjà signée.", 409);
        const e = await journal(d, session.email, "lettre_envoyee", null, { reference, signataire: doc.signataire_email });
        if (e) return refus("Le journal n'a pas pu être écrit : " + e, 500);
        const { data: maj, error } = await supabase.from("compta_creations").update({ lettre_reference: reference, lettre_envoyee_le: maintenant, maj_le: maintenant }).eq("id", d.id).select("*").maybeSingle();
        if (error || !maj) return refus(error ? error.message : "Enregistrement impossible.", 500);
        return NextResponse.json({ ok: true, ...(await vue(maj)) });
      }
      if (etapeCourante(d) !== "statuts") return refus("Les statuts ne sont pas l'étape en cours.", 409);
      const e = await journal(d, session.email, "statuts_envoyes", null, { reference, signataire: doc.signataire_email, empreintes: ORDRE_SECTIONS.map(function (s) { return [s, empreinte((d.reponses || {})[s])]; }) });
      if (e) return refus("Le journal n'a pas pu être écrit : " + e, 500);
      const { data: maj, error } = await supabase.from("compta_creations").update({ statuts_reference: reference, statuts_envoyes_le: maintenant, maj_le: maintenant }).eq("id", d.id).select("*").maybeSingle();
      if (error || !maj) return refus(error ? error.message : "Enregistrement impossible.", 500);
      return NextResponse.json({ ok: true, ...(await vue(maj)) });
    }

    // ---- ARRETER LE DOSSIER ----
    if (action === "abandonner") {
      const e = await journal(d, session.email, "arret", null, null);
      if (e) return refus("Le journal n'a pas pu être écrit : " + e, 500);
      const { data: maj, error } = await supabase.from("compta_creations").update({ statut: "abandonne", maj_le: new Date().toISOString() }).eq("id", d.id).select("*").maybeSingle();
      if (error || !maj) return refus(error ? error.message : "Enregistrement impossible.", 500);
      return NextResponse.json({ ok: true, message: "Dossier arrêté. Rien n'a été déposé.", ...(await vue(maj)) });
    }

    // ---- 🚨 SANS LA LETTRE SIGNEE, RIEN NE COMMENCE ----
    if (!d.lettre_signee_le) {
      return refus(d.lettre_reference
        ? "La lettre de départ attend la signature de " + d.client_email + ". Rien ne commence avant."
        : "La lettre de départ n'est pas encore envoyée. Rien ne commence avant sa signature.", 409);
    }

    // ---- ROUVRIR LE QUESTIONNAIRE (statuts envoyes, pas encore signes) ----
    if (action === "rouvrir") {
      if (d.statuts_signes_le) return refus("Les statuts sont signés : le questionnaire ne se rouvre plus.", 409);
      if (!d.statuts_reference) return refus("Les statuts n'ont pas été envoyés : le questionnaire est déjà ouvert.", 409);
      const e = await journal(d, session.email, "statuts_retires", null, { reference: d.statuts_reference });
      if (e) return refus("Le journal n'a pas pu être écrit : " + e, 500);
      const { data: maj, error } = await supabase.from("compta_creations").update({ statuts_reference: null, statuts_envoyes_le: null, maj_le: new Date().toISOString() }).eq("id", d.id).select("*").maybeSingle();
      if (error || !maj) return refus(error ? error.message : "Enregistrement impossible.", 500);
      return NextResponse.json({ ok: true, message: "Le questionnaire est rouvert. Le document envoyé ne doit plus être signé : après correction, renvoyez les statuts.", ...(await vue(maj)) });
    }

    // ---- ENREGISTRER ET VALIDER UNE ETAPE ----
    if (action === "enregistrer" || action === "valider") {
      const section = String(b.section || "");
      const rang = ORDRE_SECTIONS.indexOf(section);
      if (rang < 0 || !sectionDe(section)) return refus("Étape inconnue.", 400);
      if (d.statuts_signes_le) return refus("Les statuts sont signés : les réponses ne se modifient plus.", 409);
      if (d.statuts_reference) return refus("Les statuts sont partis à la signature. Pour corriger une réponse, rouvrez d'abord le questionnaire.", 409);
      for (let i = 0; i < rang; i++) {
        if (!valide(d, ORDRE_SECTIONS[i])) return refus("Validez d'abord l'étape « " + sectionDe(ORDRE_SECTIONS[i]).titre + " ».", 409);
      }

      let reponses: any = d.reponses || {};
      let validations: any = { ...(d.validations || {}) };
      let change = false;
      // Sans reponses envoyees, celles qui sont rangees repassent le meme
      // tamis : une reponse a une question qui n est plus posee s en va.
      const recues = b.reponses !== undefined && b.reponses !== null ? b.reponses : reponses[section];
      if (recues !== undefined && recues !== null) {
        const propre = nettoyer(section, recues, reponses);
        if (canonique(propre) !== canonique(reponses[section])) {
          change = true;
          reponses = { ...reponses, [section]: propre };
          // Une reponse qui change defait cette validation et les suivantes.
          for (let i = rang; i < ORDRE_SECTIONS.length; i++) delete validations[ORDRE_SECTIONS[i]];
          const e = await journal(d, session.email, "reponses", section, propre);
          if (e) return refus("Le journal n'a pas pu être écrit : " + e + ". Rien n'a été enregistré.", 500);
        }
      }
      const cadre = horsCadre(reponses);
      const f = formeDe(reponses);
      const maj: any = { reponses, validations, hors_cadre: cadre, forme: f ? f.code : null, maj_le: new Date().toISOString() };

      if (action === "enregistrer" || cadre) {
        if (cadre && cadre !== d.hors_cadre) await journal(d, session.email, "hors_cadre", section, { motif: cadre });
        const { data: range, error } = await supabase.from("compta_creations").update(maj).eq("id", d.id).select("*").maybeSingle();
        if (error || !range) return refus(error ? error.message : "Enregistrement impossible.", 500);
        if (cadre) return NextResponse.json({ ok: false, erreur: cadre, ...(await vue(range)) }, { status: 409 });
        return NextResponse.json({ ok: true, message: change ? "Réponses enregistrées. L'étape reste à valider." : "Rien n'a changé.", ...(await vue(range)) });
      }

      // Deja validee et rien n a bouge : la premiere validation fait foi.
      if (!change && valide(d, section)) {
        return NextResponse.json({ ok: true, message: "Étape « " + sectionDe(section).titre + " » déjà validée.", ...(await vue(d)) });
      }

      const erreurs = controler(section, reponses);
      if (erreurs.length > 0) {
        // Les reponses sont gardees telles quelles ; seule la validation est refusee.
        const { data: range } = await supabase.from("compta_creations").update(maj).eq("id", d.id).select("*").maybeSingle();
        return NextResponse.json({ ok: false, erreur: "Cette étape ne peut pas être validée en l'état.", erreurs, ...(await vue(range || { ...d, ...maj })) }, { status: 400 });
      }
      const marque = { le: new Date().toISOString(), par: session.email, empreinte: empreinte(reponses[section]) };
      const e = await journal(d, session.email, "validation", section, marque);
      if (e) return refus("Le journal n'a pas pu être écrit : " + e + ". L'étape n'est pas validée.", 500);
      maj.validations = { ...validations, [section]: marque };
      const { data: range, error } = await supabase.from("compta_creations").update(maj).eq("id", d.id).select("*").maybeSingle();
      if (error || !range) return refus(error ? error.message : "Enregistrement impossible.", 500);
      return NextResponse.json({ ok: true, message: "Étape « " + sectionDe(section).titre + " » validée.", ...(await vue(range)) });
    }

    // ---- PREPARER LES STATUTS ----
    if (action === "statuts_preparer") {
      if (d.hors_cadre) return refus(d.hors_cadre, 409);
      for (const s of ORDRE_SECTIONS) if (!valide(d, s)) return refus("Validez d'abord l'étape « " + sectionDe(s).titre + " ».", 409);
      if (d.statuts_signes_le) return refus("Les statuts sont déjà signés.", 409);
      // Dernier filet : les cinq etapes repassent leurs controles ensemble.
      for (const s of ORDRE_SECTIONS) {
        const erreurs = controler(s, d.reponses);
        if (erreurs.length > 0) return refus("L'étape « " + sectionDe(s).titre + " » ne tient plus : " + erreurs[0], 409, { erreurs });
      }
      const cabinet = await cabinetDe(tenantId);
      if (!cabinet) return refus("Renseignez d'abord votre société dans « Ma société ».", 400);
      const st = statuts(d.reponses, d.mandataire_nom || "");
      const corps = st.corps + "\n\n" + recapitulatif(d.reponses, d.validations || {});
      const plusieurs = st.signataires.length > 1;
      return NextResponse.json({
        ok: true, titre: st.titre, corps, signataires: st.signataires, plusieurs,
        avis: plusieurs ? "Ces statuts se signent par chacun des " + st.signataires.length + " associés. L'envoi à plusieurs signataires arrive avec le lot suivant : aujourd'hui, ils se relisent ici mais ne partent pas encore à la signature." : null,
        document_a_signer: plusieurs ? null : { doc_type: "convention", libelle: st.libelle, titre: st.titre, corps, signataire_email: st.signataires[0].email, signataire_nom: st.signataires[0].nom, entite_id: cabinet.id },
      });
    }

    return refus("Action inconnue.", 400);
  } catch (e: any) {
    return refus(String(e), 500);
  }
}
