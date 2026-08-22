import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { dossiersAutorises } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 90;

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

const EXPEDITEUR = "Mr. Comptable <contact@academiapro.fr>";

// LES SEPT MOTIFS DE RELANCE.
//
// Chacun repond a une question que le collaborateur pose aujourd hui au
// telephone, une par une, dossier par dossier. C est ce temps-la qu on
// remplace.
//
// 🚨 LE RAPPROCHEMENT EST LE MOTIF QUI N EXISTE NULLE PART AILLEURS. Les
// concurrents SIGNALENT l operation bancaire sans justificatif ; aucun ne
// RELANCE le client a la place du cabinet.
const MOTIFS: any = {
  piece_manquante: {
    nom: "Pièce justificative manquante",
    objet: "Il nous manque un justificatif",
    corps: "Nous préparons votre comptabilité et il nous manque le justificatif "
      + "de l'opération suivante :",
  },
  rapprochement: {
    nom: "Opération bancaire sans justificatif",
    objet: "Une opération bancaire sans justificatif",
    corps: "Une opération figure sur votre relevé bancaire sans que nous ayons "
      + "la facture correspondante :",
  },
  facture_achat: {
    nom: "Facture d'achat attendue",
    objet: "Facture d'achat à nous transmettre",
    corps: "Nous attendons la facture d'achat suivante pour tenir votre "
      + "comptabilité à jour :",
  },
  facture_vente: {
    nom: "Facture de vente impayée",
    objet: "Une facture reste impayée",
    corps: "La facture suivante, que vous avez émise, n'a pas encore été réglée "
      + "par votre client :",
  },
  note_frais: {
    nom: "Note de frais en attente",
    objet: "Note de frais à justifier",
    corps: "Nous avons enregistré une dépense qui semble être une note de frais, "
      + "sans le justificatif :",
  },
  honoraires: {
    nom: "Honoraires du cabinet impayés",
    objet: "Votre note d'honoraires",
    corps: "Notre note d'honoraires reste à ce jour impayée :",
  },
  // 🆕 LA RELANCE DES FACTURES QUE LE CABINET A LUI-MEME EMISES — 23/08.
  //
  // Elle vient du module de facturation, pas de la comptabilite. Un cabinet
  // etablit ses honoraires et attend d etre paye comme tout le monde ; c est
  // meme l argent qu il oublie le plus de reclamer, parce qu il passe ses
  // journees sur les dossiers des autres.
  facture_emise: {
    nom: "Ma facture impayée",
    objet: "Rappel de règlement",
    corps: "Sauf erreur de notre part, la facture suivante reste impayée à ce jour :",
  },
};

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

function euros(n: any): string {
  return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " €";
}

function jolieDate(d: any): string {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("fr-FR"); } catch (e) { return ""; }
}

function propre(v: any, max: number): string | null {
  const t = String(v === null || v === undefined ? "" : v).trim();
  return t ? t.slice(0, max) : null;
}

function appelable(t: string): string {
  return String(t || "").replace(/[^0-9+]/g, "");
}

// CE QUI RECLAME UNE RELANCE, DOSSIER PAR DOSSIER.
//
// Tout se lit en trois requetes, pas une par dossier : a cinquante dossiers,
// la difference se voit.
async function aRelancer(ids: string[]) {
  const parDossier: any = {};
  for (const id of ids) {
    parDossier[id] = {
      sans_piece: 0, rapprochement: 0, impayes: 0, montant_impaye: 0,
    };
  }

  const { data: ecritures } = await supabase
    .from("compta_ecritures")
    .select("societe_id, ecriture_num, piece_ref, journal_code, compte_num, debit, credit, ecriture_date")
    .in("societe_id", ids)
    .limit(100000);

  const { data: pieces } = await supabase
    .from("compta_pieces")
    .select("societe_id, ecriture_num")
    .in("societe_id", ids)
    .limit(20000);

  const { data: releves } = await supabase
    .from("compta_releves")
    .select("societe_id, ecriture_num, ignore")
    .in("societe_id", ids)
    .limit(50000);

  const avecPiece: any = {};
  for (const p of pieces || []) {
    if (p.ecriture_num) avecPiece[p.societe_id + "|" + p.ecriture_num] = true;
  }

  const sansJustificatif: any = {};
  for (const l of ecritures || []) {
    const p = parDossier[l.societe_id];
    if (!p) continue;

    // Une ecriture d a-nouveaux n a jamais de piece : elle ne compte pas.
    if (!l.piece_ref && l.journal_code !== "AN") {
      const cle = l.societe_id + "|" + l.ecriture_num;
      if (!avecPiece[cle] && !sansJustificatif[cle]) {
        sansJustificatif[cle] = true;
        p.sans_piece = p.sans_piece + 1;
      }
    }

    // Les clients qui n ont pas paye : solde debiteur du compte 411.
    if (String(l.compte_num || "").indexOf("411") === 0) {
      const solde = r2((Number(l.debit) || 0) - (Number(l.credit) || 0));
      if (solde > 0.005) {
        p.impayes = p.impayes + 1;
        p.montant_impaye = r2(p.montant_impaye + solde);
      }
    }
  }

  for (const r of releves || []) {
    const p = parDossier[r.societe_id];
    if (!p) continue;
    if (!r.ecriture_num && !r.ignore) p.rapprochement = p.rapprochement + 1;
  }

  return parDossier;
}

// 🆕 LES FACTURES DU CABINET QUI RESTENT IMPAYEES — 23/08.
//
// ⚠️ ELLES NE VIENNENT PAS DE LA COMPTABILITE mais du module de facturation.
// Deux sources distinctes qui se rejoignent dans le meme ecran : les
// impayes des CLIENTS DU CLIENT (compte 411 de sa comptabilite) et les
// impayes DU CABINET LUI-MEME (ses propres factures).
//
// Une facture n est reclamable que si elle est EMISE et ECHUE. Relancer
// avant l echeance fait passer le cabinet pour un creancier nerveux.
async function mesFacturesImpayees(tenant: string) {
  const aujourdhui = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("devis_factures")
    .select("id, numero, societe_id, client_nom, client_email, total_ttc, reste_du, date_emission, date_echeance, statut, type")
    .eq("tenant_id", tenant)
    .eq("type", "facture")
    .not("numero", "is", null)
    .in("statut", ["envoye", "partiel"])
    .gt("reste_du", 0)
    .order("date_echeance", { ascending: true })
    .limit(500);

  const liste = (data || []).filter(function (f: any) {
    if (!f.date_echeance) return true;
    return String(f.date_echeance).slice(0, 10) <= aujourdhui;
  });

  const parSociete: any = {};
  for (const f of liste) {
    const cle = f.societe_id || "sans_dossier";
    if (!parSociete[cle]) parSociete[cle] = [];
    parSociete[cle].push(f);
  }

  return { liste: liste, parSociete: parSociete };
}

// Le nombre de jours de retard, pour hierarchiser les relances.
function joursDeRetard(echeance: any): number {
  if (!echeance) return 0;
  try {
    const e = new Date(String(echeance).slice(0, 10)).getTime();
    const j = Math.floor((Date.now() - e) / 86400000);
    return j > 0 ? j : 0;
  } catch (e) {
    return 0;
  }
}

async function envoyerEmail(destinataire: string, sujet: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, detail: "RESEND_API_KEY absente" };
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EXPEDITEUR,
      to: destinataire,
      subject: sujet,
      html: html,
    }),
  });
  const texte = await r.text();
  return { ok: r.ok, detail: texte.slice(0, 400) };
}

// LE SMS PASSE PAR BREVO, ET SEULEMENT AVEC CONSENTEMENT.
//
// ⚠️ sms_accepte_le N EST PAS UNE FORMALITE : un SMS non consenti est une
// infraction, et le numero d expediteur se fait bloquer par les operateurs.
async function envoyerSms(numero: string, texte: string) {
  if (!process.env.BREVO_API_KEY) {
    return { ok: false, detail: "BREVO_API_KEY absente" };
  }
  const r = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: "MrComptable",
      recipient: appelable(numero),
      content: texte.slice(0, 480),
    }),
  });
  const brut = await r.text();
  return { ok: r.ok, detail: brut.slice(0, 400) };
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) {
      return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    }

    const autorises = await dossiersAutorises();

    // Les factures du cabinet existent meme sans aucun dossier comptable :
    // un cabinet peut facturer avant d avoir saisi la moindre ecriture.
    const mesFactures = session.tenantId
      ? await mesFacturesImpayees(session.tenantId)
      : { liste: [], parSociete: {} };

    if (autorises.length === 0) {
      return NextResponse.json({
        ok: true, total: 0, clients: [], compteurs: null,
        motifs: MOTIFS, factures_impayees: mesFactures.liste,
      });
    }

    const { data: societes } = await supabase
      .from("compta_societes")
      .select("id, code, raison_sociale, siren, email_contact, adresse, actif")
      .eq("actif", true)
      .in("id", autorises)
      .limit(500);

    const liste = societes || [];
    if (liste.length === 0) {
      return NextResponse.json({
        ok: true, total: 0, clients: [], compteurs: null,
        motifs: MOTIFS, factures_impayees: mesFactures.liste,
      });
    }

    const ids = liste.map(function (s: any) { return s.id; });

    const { data: contacts } = await supabase
      .from("compta_contacts")
      .select("*")
      .in("societe_id", ids)
      .limit(5000);

    const { data: relances } = await supabase
      .from("compta_relances")
      .select("societe_id, motif, canal, envoye_le, reference")
      .in("societe_id", ids)
      .order("envoye_le", { ascending: false })
      .limit(5000);

    const besoins = await aRelancer(ids);

    const parSociete: any = {};
    for (const c of contacts || []) {
      if (!parSociete[c.societe_id]) parSociete[c.societe_id] = [];
      parSociete[c.societe_id].push(c);
    }

    const derniere: any = {};
    for (const r of relances || []) {
      if (!derniere[r.societe_id]) derniere[r.societe_id] = r.envoye_le;
    }

    const clients = liste.map(function (s: any) {
      const b = besoins[s.id] || { sans_piece: 0, rapprochement: 0, impayes: 0, montant_impaye: 0 };
      const mes = parSociete[s.id] || [];
      const principal = mes.filter(function (c: any) { return c.principal; })[0] || mes[0] || null;

      // LES FACTURES DU CABINET SUR CE DOSSIER.
      const factures = mesFactures.parSociete[s.id] || [];
      const montantFactures = r2(factures.reduce(function (t: number, f: any) {
        return t + (Number(f.reste_du) || 0);
      }, 0));

      const total = b.sans_piece + b.rapprochement + b.impayes + factures.length;

      return {
        id: s.id,
        code: s.code,
        raison_sociale: s.raison_sociale,
        siren: s.siren,
        email_contact: s.email_contact,
        contacts: mes,
        contact_principal: principal,
        email: principal && principal.email ? principal.email : s.email_contact,
        telephone: principal && principal.telephone ? principal.telephone : null,
        sms_accepte: !!(principal && principal.sms_accepte_le),
        sans_piece: b.sans_piece,
        rapprochement: b.rapprochement,
        impayes: b.impayes,
        montant_impaye: b.montant_impaye,
        mes_factures: factures.map(function (f: any) {
          return {
            id: f.id, numero: f.numero, total_ttc: f.total_ttc,
            reste_du: f.reste_du, date_echeance: f.date_echeance,
            retard: joursDeRetard(f.date_echeance),
          };
        }),
        mes_factures_montant: montantFactures,
        a_relancer: total,
        derniere_relance_le: derniere[s.id] || null,
        joignable: !!((principal && principal.email) || s.email_contact),
      };
    }).sort(function (a: any, b: any) {
      return b.a_relancer - a.a_relancer;
    });

    const compteurs = {
      dossiers: clients.length,
      a_relancer: clients.filter(function (c: any) { return c.a_relancer > 0; }).length,
      sans_piece: clients.reduce(function (s: number, c: any) { return s + c.sans_piece; }, 0),
      rapprochement: clients.reduce(function (s: number, c: any) { return s + c.rapprochement; }, 0),
      impayes: clients.reduce(function (s: number, c: any) { return s + c.impayes; }, 0),
      montant_impaye: r2(clients.reduce(function (s: number, c: any) { return s + c.montant_impaye; }, 0)),
      // Ce que le cabinet attend POUR LUI-MEME.
      mes_factures: mesFactures.liste.length,
      mes_factures_montant: r2(mesFactures.liste.reduce(function (s: number, f: any) {
        return s + (Number(f.reste_du) || 0);
      }, 0)),
      contacts: (contacts || []).length,
      sans_contact: clients.filter(function (c: any) { return !c.joignable; }).length,
      avec_sms: clients.filter(function (c: any) { return c.sms_accepte; }).length,
      relances_envoyees: (relances || []).length,
    };

    return NextResponse.json({
      ok: true,
      total: clients.length,
      clients: clients,
      compteurs: compteurs,
      motifs: MOTIFS,
      factures_impayees: mesFactures.liste,
      historique: (relances || []).slice(0, 100),
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
    if (!b || !b.action) {
      return NextResponse.json({ ok: false, erreur: "Action non precisee." }, { status: 400 });
    }

    const autorises = await dossiersAutorises();

    // ---------- AJOUTER OU MODIFIER UN CONTACT ----------
    if (b.action === "contact") {
      const societeId = String(b.societe_id || "").trim();
      if (!societeId || autorises.indexOf(societeId) < 0) {
        return NextResponse.json({ ok: false, erreur: "Dossier inconnu." }, { status: 403 });
      }

      const champs: any = {
        societe_id: societeId,
        tenant_id: session.tenantId || null,
        nom: propre(b.nom, 120),
        fonction: propre(b.fonction, 120),
        email: propre(b.email, 200),
        telephone: propre(b.telephone, 40),
        notes: propre(b.notes, 4000),
        principal: b.principal === true,
      };

      // LE CONSENTEMENT SMS EST UNE DATE, PAS UNE CASE. On veut savoir QUAND
      // il a ete donne : c est ce qui se prouve en cas de reclamation.
      if (b.sms_accepte === true) champs.sms_accepte_le = new Date().toISOString();
      if (b.sms_accepte === false) champs.sms_accepte_le = null;

      if (!champs.nom && !champs.email) {
        return NextResponse.json(
          { ok: false, erreur: "Indiquez au moins un nom ou une adresse." }, { status: 400 });
      }

      if (champs.principal) {
        await supabase
          .from("compta_contacts")
          .update({ principal: false })
          .eq("societe_id", societeId);
      }

      if (b.id) {
        const { error } = await supabase
          .from("compta_contacts")
          .update(champs)
          .eq("id", b.id);
        if (error) {
          return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
        }
        return NextResponse.json({ ok: true, message: "Contact enregistre." });
      }

      const { error } = await supabase.from("compta_contacts").insert(champs);
      if (error) {
        return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, message: "Contact ajoute." });
    }

    // ---------- SUPPRIMER UN CONTACT ----------
    if (b.action === "supprimer_contact") {
      if (!b.id) {
        return NextResponse.json({ ok: false, erreur: "Contact non precise." }, { status: 400 });
      }
      const { data: c } = await supabase
        .from("compta_contacts")
        .select("societe_id")
        .eq("id", b.id)
        .maybeSingle();

      if (!c || autorises.indexOf(c.societe_id) < 0) {
        return NextResponse.json({ ok: false, erreur: "Contact inconnu." }, { status: 403 });
      }

      await supabase.from("compta_contacts").delete().eq("id", b.id);
      return NextResponse.json({ ok: true, message: "Contact supprime." });
    }

    // ---------- PREPARER UNE RELANCE ----------
    //
    // 🚨 PREPARER N ENVOIE RIEN. Le texte revient a l ecran, le collaborateur
    // le relit et le corrige avant de l envoyer. Une relance part au nom du
    // cabinet : elle engage sa reputation aupres de son propre client.
    if (b.action === "preparer") {
      const societeId = String(b.societe_id || "").trim();
      const motif = String(b.motif || "").trim();
      if (autorises.indexOf(societeId) < 0) {
        return NextResponse.json({ ok: false, erreur: "Dossier inconnu." }, { status: 403 });
      }
      if (!MOTIFS[motif]) {
        return NextResponse.json({ ok: false, erreur: "Motif inconnu." }, { status: 400 });
      }

      const { data: s } = await supabase
        .from("compta_societes")
        .select("raison_sociale")
        .eq("id", societeId)
        .maybeSingle();

      const { data: contacts } = await supabase
        .from("compta_contacts")
        .select("*")
        .eq("societe_id", societeId)
        .limit(20);

      const principal = (contacts || []).filter(function (c: any) { return c.principal; })[0]
        || (contacts || [])[0] || null;

      const m = MOTIFS[motif];
      const prenom = principal && principal.nom ? String(principal.nom).split(/\s+/)[0] : "";

      let reference = propre(b.reference, 200) || "";
      let montant = b.montant ? Number(b.montant) : 0;
      let detail = "";

      // 🆕 LA RELANCE D UNE FACTURE DU CABINET PORTE SES PROPRES CHIFFRES.
      //
      // Reclamer « une facture » sans dire laquelle oblige le client a
      // chercher, et un client qui cherche ne paie pas. Le numero, le
      // montant et le retard figurent dans le message.
      if (motif === "facture_emise" && session.tenantId) {
        const { data: factures } = await supabase
          .from("devis_factures")
          .select("numero, total_ttc, reste_du, date_echeance")
          .eq("tenant_id", session.tenantId)
          .eq("societe_id", societeId)
          .eq("type", "facture")
          .not("numero", "is", null)
          .in("statut", ["envoye", "partiel"])
          .gt("reste_du", 0)
          .order("date_echeance", { ascending: true })
          .limit(20);

        const lignes = (factures || []).map(function (f: any) {
          const retard = joursDeRetard(f.date_echeance);
          return "· Facture " + f.numero + " du " + jolieDate(f.date_emission || f.date_echeance)
            + " — " + euros(f.reste_du) + " restant dû"
            + (f.date_echeance ? ", échue le " + jolieDate(f.date_echeance) : "")
            + (retard > 0 ? " (" + retard + " jour" + (retard > 1 ? "s" : "") + " de retard)" : "");
        });

        if (lignes.length > 0) {
          detail = lignes.join("\n");
          montant = (factures || []).reduce(function (t: number, f: any) {
            return t + (Number(f.reste_du) || 0);
          }, 0);
          if ((factures || []).length === 1) reference = factures![0].numero;
        }
      }

      const corps = (prenom ? "Bonjour " + prenom : "Bonjour") + ",\n\n"
        + m.corps + "\n\n"
        + (detail ? detail + "\n" : "")
        + (!detail && reference ? "Référence : " + reference + "\n" : "")
        + (!detail && montant ? "Montant : " + euros(montant) + "\n" : "")
        + (detail && montant ? "\nSoit un total de " + euros(montant) + ".\n" : "")
        + "\n"
        + (motif === "facture_emise"
          ? "Si le règlement a été effectué entre-temps, merci de ne pas tenir compte "
            + "de ce message.\n\nDans le cas contraire, nous vous remercions de bien "
            + "vouloir procéder au règlement dans les meilleurs délais.\n\n"
          : "Pourriez-vous nous le transmettre dès que possible ? Cela nous permet "
            + "de tenir votre comptabilité à jour et d'éviter tout retard à la clôture.\n\n")
        + "Merci d'avance,\n"
        + "Votre cabinet comptable";

      const sms = (prenom ? prenom + ", " : "")
        + (motif === "facture_emise"
          ? "rappel de reglement" + (reference ? " (facture " + reference + ")" : "")
            + (montant ? " de " + euros(montant) : "") + ". Merci."
          : m.objet.toLowerCase() + (reference ? " (" + reference + ")" : "")
            + ". Merci de nous le transmettre.")
        + " Votre cabinet comptable.";

      return NextResponse.json({
        ok: true,
        objet: m.objet,
        corps: corps,
        sms: sms,
        contact: principal,
        motif: motif,
        reference: reference,
        montant: montant,
      });
    }

    // ---------- ENVOYER UNE RELANCE ----------
    if (b.action === "relancer") {
      const societeId = String(b.societe_id || "").trim();
      const motif = String(b.motif || "").trim();
      const canal = String(b.canal || "email").trim();

      if (autorises.indexOf(societeId) < 0) {
        return NextResponse.json({ ok: false, erreur: "Dossier inconnu." }, { status: 403 });
      }
      if (!MOTIFS[motif]) {
        return NextResponse.json({ ok: false, erreur: "Motif inconnu." }, { status: 400 });
      }

      const { data: contact } = b.contact_id
        ? await supabase.from("compta_contacts").select("*").eq("id", b.contact_id).maybeSingle()
        : { data: null };

      const { data: societe } = await supabase
        .from("compta_societes")
        .select("email_contact")
        .eq("id", societeId)
        .maybeSingle();

      const objet = propre(b.objet, 200) || MOTIFS[motif].objet;
      const corps = propre(b.corps, 8000) || "";

      let resultat: any = { ok: false, detail: "" };

      if (canal === "sms") {
        const numero = contact && contact.telephone ? contact.telephone : "";
        if (!numero) {
          return NextResponse.json({ ok: false, erreur: "Aucun numero pour ce contact." }, { status: 400 });
        }
        // ⚠️ LE CONSENTEMENT SE VERIFIE COTE SERVEUR, pas seulement a l ecran.
        if (!contact.sms_accepte_le) {
          return NextResponse.json({
            ok: false,
            erreur: "Ce contact n a pas donne son accord pour recevoir des SMS.",
          }, { status: 400 });
        }
        resultat = await envoyerSms(numero, corps);
      } else {
        const adresse = (contact && contact.email)
          || (societe && societe.email_contact) || "";
        if (!adresse) {
          return NextResponse.json({ ok: false, erreur: "Aucune adresse pour ce dossier." }, { status: 400 });
        }
        const html = corps.replace(/\n/g, "<br/>");
        resultat = await envoyerEmail(adresse, objet, html);
      }

      // LA TRACE EST ECRITE DANS LES DEUX CAS, succes comme echec : sans
      // elle, on relancerait deux fois le meme client sur le meme motif.
      await supabase.from("compta_relances").insert({
        tenant_id: session.tenantId || null,
        societe_id: societeId,
        contact_id: b.contact_id || null,
        motif: motif,
        canal: canal,
        objet: objet,
        corps: corps,
        reference: propre(b.reference, 120),
        montant: b.montant ? Number(b.montant) : null,
        statut: resultat.ok ? "envoyee" : "echec",
        motif_echec: resultat.ok ? null : String(resultat.detail || "").slice(0, 500),
      });

      if (contact && contact.id) {
        await supabase
          .from("compta_contacts")
          .update({ derniere_relance_le: new Date().toISOString() })
          .eq("id", contact.id);
      }

      if (!resultat.ok) {
        return NextResponse.json({
          ok: false,
          erreur: "Envoi impossible : " + String(resultat.detail || "").slice(0, 200),
        }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: canal === "sms" ? "SMS envoye." : "Relance envoyee.",
      });
    }

    return NextResponse.json({ ok: false, erreur: "Action inconnue." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
