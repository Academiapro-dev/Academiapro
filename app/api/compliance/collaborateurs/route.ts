import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { tenantCourant, peutGererEquipe } from "../../../../lib/droits";

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

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || !(await peutGererEquipe())) return refuse();

    // TOUT EST BORNE A L ORGANISME. La table etait mono-cabinet : sans ce
    // filtre, un cabinet verrait les collaborateurs d un autre.
    const tenantId = tenantCourant();
    if (!tenantId) return sansOrganisme();

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

    return NextResponse.json({
      ok: true,
      email: email,
      message: (deja ? "Droits mis à jour pour " : "Collaborateur ajouté : ") + email + ".",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
