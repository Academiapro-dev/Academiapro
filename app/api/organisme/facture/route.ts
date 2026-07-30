import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMINS = ["contact@academiapro.fr"];

const DESTINATAIRES: any = {
  stagiaire: "Stagiaire",
  entreprise: "Entreprise",
  opco: "OPCO",
  caisse_depots: "Caisse des Depots (CPF)",
  pouvoirs_publics: "Pouvoirs publics",
  organisme: "Autre organisme de formation",
};

const STATUTS = ["emise", "reglee", "partielle", "impayee", "annulee"];

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

// Numerotation sequentielle SANS TROU, par organisme et par annee :
// c est une exigence comptable, un numero manquant se remarque en controle.
async function numeroSuivant(tenant: string, annee: number): Promise<string> {
  const { data } = await supabase
    .from("organisme_factures")
    .select("numero")
    .eq("tenant_id", tenant)
    .eq("annee", annee)
    .order("numero", { ascending: false })
    .limit(1);

  let rang = 1;
  if (data && data[0] && data[0].numero) {
    const m = String(data[0].numero).match(/(\d+)$/);
    if (m) rang = parseInt(m[1], 10) + 1;
  }

  return String(annee) + "-" + String(rang).padStart(4, "0");
}

export async function GET(req: NextRequest) {
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

    const url = new URL(req.url);
    const brut = url.searchParams.get("annee");
    const annee = brut && /^\d{4}$/.test(brut) ? parseInt(brut, 10) : new Date().getUTCFullYear();

    const { data, error } = await supabase
      .from("organisme_factures")
      .select("*")
      .eq("tenant_id", tenant)
      .eq("annee", annee)
      .order("numero", { ascending: false })
      .limit(2000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const toutes = (data || []).filter(function (f: any) { return f.statut !== "annulee"; });
    const maintenant = Date.now();

    const facture = toutes.reduce(function (s: number, f: any) { return s + (Number(f.montant_ht) || 0); }, 0);
    const encaisse = toutes.reduce(function (s: number, f: any) { return s + (Number(f.montant_regle) || 0); }, 0);

    const enRetard = toutes.filter(function (f: any) {
      if (f.statut === "reglee") return false;
      if (!f.echeance) return false;
      return new Date(f.echeance).getTime() < maintenant;
    });

    const retardMontant = enRetard.reduce(function (s: number, f: any) {
      return s + ((Number(f.montant_ttc) || 0) - (Number(f.montant_regle) || 0));
    }, 0);

    // Ventilation par type de destinataire : elle alimente le cadre C
    // du bilan avec des montants reellement factures.
    const parDestinataire: any = {};
    for (const f of toutes) {
      const t = f.destinataire_type || "stagiaire";
      if (!parDestinataire[t]) parDestinataire[t] = { nombre: 0, montant_ht: 0, encaisse: 0 };
      parDestinataire[t].nombre = parDestinataire[t].nombre + 1;
      parDestinataire[t].montant_ht = parDestinataire[t].montant_ht + (Number(f.montant_ht) || 0);
      parDestinataire[t].encaisse = parDestinataire[t].encaisse + (Number(f.montant_regle) || 0);
    }

    return NextResponse.json({
      ok: true,
      annee: annee,
      destinataires: DESTINATAIRES,
      statuts: STATUTS,
      nombre: toutes.length,
      facture_ht: Math.round(facture * 100) / 100,
      encaisse: Math.round(encaisse * 100) / 100,
      reste_du: Math.round((facture - encaisse) * 100) / 100,
      en_retard: enRetard.length,
      en_retard_montant: Math.round(retardMontant * 100) / 100,
      par_destinataire: parDestinataire,
      factures: data || [],
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

    const tenant = tenantDe(req, session);
    if (!tenant) {
      return NextResponse.json(
        { ok: false, erreur: "Aucun organisme rattache a votre compte." },
        { status: 403 }
      );
    }

    const b = await req.json().catch(function () { return null; });
    if (!b) {
      return NextResponse.json({ ok: false, erreur: "Requete illisible" }, { status: 400 });
    }

    const nom = String(b.destinataire_nom || "").trim();
    const designation = String(b.designation || "").trim();

    if (nom.length < 2 || designation.length < 3) {
      return NextResponse.json(
        { ok: false, erreur: "Indiquez le destinataire et la designation." },
        { status: 400 }
      );
    }

    const type = String(b.destinataire_type || "stagiaire").trim().toLowerCase();
    if (!DESTINATAIRES[type]) {
      return NextResponse.json({ ok: false, erreur: "Type de destinataire inconnu." }, { status: 400 });
    }

    const quantite = Number(b.quantite) > 0 ? Number(b.quantite) : 1;
    const prix = Number(b.prix_unitaire) || 0;
    const taux = Number(b.tva_taux) || 0;

    if (prix <= 0) {
      return NextResponse.json({ ok: false, erreur: "Indiquez un prix unitaire." }, { status: 400 });
    }

    const ht = Math.round(quantite * prix * 100) / 100;
    const tva = Math.round(ht * (taux / 100) * 100) / 100;
    const ttc = Math.round((ht + tva) * 100) / 100;

    const emise = b.emise_le || new Date().toISOString().slice(0, 10);
    const annee = parseInt(String(emise).slice(0, 4), 10);
    const numero = await numeroSuivant(tenant, annee);

    const { data, error } = await supabase
      .from("organisme_factures")
      .insert({
        tenant_id: tenant,
        numero: numero,
        annee: annee,
        destinataire_type: type,
        destinataire_nom: nom,
        destinataire_email: b.destinataire_email ? String(b.destinataire_email).trim().toLowerCase() : null,
        destinataire_adresse: b.destinataire_adresse ? String(b.destinataire_adresse).trim() : null,
        stagiaire_email: b.stagiaire_email ? String(b.stagiaire_email).trim().toLowerCase() : null,
        formation_code: b.formation_code ? String(b.formation_code).trim().toUpperCase() : null,
        designation: designation,
        quantite: quantite,
        prix_unitaire: prix,
        montant_ht: ht,
        tva_taux: taux,
        montant_tva: tva,
        montant_ttc: ttc,
        emise_le: emise,
        echeance: b.echeance || null,
        statut: "emise",
        montant_regle: 0,
        notes: b.notes ? String(b.notes).trim() : null,
      })
      .select("id, numero, montant_ttc")
      .limit(1);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, facture: (data || [])[0] || null });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// Reglement. On ne modifie jamais les montants d une facture emise :
// une facture erronee s annule et se refait, elle ne se corrige pas.
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

    const { data: existante } = await supabase
      .from("organisme_factures")
      .select("montant_ttc, montant_regle")
      .eq("id", b.id)
      .eq("tenant_id", tenant)
      .maybeSingle();

    if (!existante) {
      return NextResponse.json({ ok: false, erreur: "Facture introuvable." }, { status: 404 });
    }

    const m: any = {};

    if (b.annuler === true) {
      m.statut = "annulee";
    } else if (b.montant_regle !== undefined) {
      const regle = Number(b.montant_regle) || 0;
      if (regle < 0) {
        return NextResponse.json({ ok: false, erreur: "Montant invalide." }, { status: 400 });
      }
      const ttc = Number(existante.montant_ttc) || 0;
      m.montant_regle = Math.round(regle * 100) / 100;
      m.statut = regle >= ttc ? "reglee" : regle > 0 ? "partielle" : "emise";
      m.regle_le = regle >= ttc ? (b.regle_le || new Date().toISOString().slice(0, 10)) : null;
    } else if (b.statut !== undefined) {
      const s = String(b.statut).trim().toLowerCase();
      if (STATUTS.indexOf(s) < 0) {
        return NextResponse.json({ ok: false, erreur: "Statut inconnu." }, { status: 400 });
      }
      m.statut = s;
    }

    if (b.notes !== undefined) m.notes = b.notes ? String(b.notes).trim() : null;
    if (b.echeance !== undefined) m.echeance = b.echeance || null;

    if (Object.keys(m).length === 0) {
      return NextResponse.json({ ok: false, erreur: "Rien a modifier." }, { status: 400 });
    }

    const { error } = await supabase
      .from("organisme_factures")
      .update(m)
      .eq("id", b.id)
      .eq("tenant_id", tenant);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, modifie: b.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
