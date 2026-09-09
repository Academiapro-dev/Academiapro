import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";
import { origineLegitime } from "../../../../lib/origine";
import { lecture } from "../../../../lib/droits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

// ══════════════════════════════════════════════════════════════════════════
// LA LETTRE DE MISSION — 09/09 (Mr Comptable).
//
// CE QUI EXISTAIT : la chaine de signature (document-a-signer → signature),
// avec le type `lettre_mission` deja prevu. Il manquait ce qui la remplit :
// un modele, les conditions de la mission, et le lien entre la lettre
// signee et le dossier.
//
// CE QUE FAIT CETTE ROUTE :
//   GET  ?societe_id=  : les missions du dossier, avec leur etat de
//                        signature (lu dans compliance_signatures).
//   POST action=preparer : enregistre la mission (compta_missions) et rend
//                        le TEXTE de la lettre depuis le modele, pret pour
//                        /api/compliance/document-a-signer (que l ecran
//                        appelle ensuite, comme pour le depot IRS).
//   POST action=lier   : rattache la reference SIG-… a la mission.
//
// 🚨 LE TEXTE DE LA LETTRE EST UN MODELE, PAS UN AVIS JURIDIQUE. Il reprend
// les rubriques d usage d une lettre de mission d expertise comptable
// (objet, prestations, obligations du cabinet, obligations du client,
// honoraires, duree et resiliation, responsabilite, donnees personnelles).
// Le cabinet le relit et le complete avant envoi ; c est lui qui signe.
//
// ⚠️ L IDENTITE DU CABINET vient de compliance_tenants (la ligne du tenant
// de la session : legal_name, adresse du siege) ; celle du client vient de
// compta_societes. Le signataire est email_contact du dossier client.
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

const TYPES_MISSION: Record<string, string> = {
  tenue: "Tenue de la comptabilité et établissement des comptes annuels",
  revision: "Révision des comptes annuels (comptabilité tenue par le client)",
  presentation: "Présentation des comptes annuels",
  complete: "Tenue, révision, déclarations fiscales et sociales",
};

const PRESTATIONS: Record<string, string> = {
  tenue: "tenue de la comptabilité à partir des pièces transmises",
  revision: "révision des comptes et travaux de clôture",
  comptes: "établissement des comptes annuels (bilan, compte de résultat, annexe)",
  liasse: "établissement et télétransmission de la liasse fiscale",
  tva: "établissement et télétransmission des déclarations de TVA",
  social: "établissement des bulletins de paie et déclarations sociales",
  juridique: "secrétariat juridique annuel (approbation des comptes)",
  conseil: "conseil de gestion courant",
};

function texte(v: any, max: number): string | null {
  if (v === null || v === undefined) return null;
  const t = String(v).trim();
  return t ? t.slice(0, max) : null;
}

function euros(n: number): string {
  return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " € HT";
}

function dateFr(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function corpsLettre(cabinet: any, client: any, m: any): string {
  const prestations = (m.prestations || []).map(function (p: string) { return "– " + (PRESTATIONS[p] || p); }).join("\n");
  const hono = m.periodicite === "mensuelle"
    ? euros(m.honoraires) + " par mois, soit " + euros(m.honoraires * 12) + " par an"
    : euros(m.honoraires) + " par an";
  return [
    "Entre " + (cabinet.legal_name || cabinet.label) + (cabinet.principal_office_address ? ", " + cabinet.principal_office_address : "") + ", ci-après « le cabinet »,",
    "et " + client.raison_sociale + (client.forme ? " (" + client.forme + ")" : "") + (client.siren ? ", SIREN " + client.siren : "") + (client.adresse ? ", " + client.adresse : "") + ", ci-après « le client »,",
    "",
    "1. Objet de la mission",
    "Le client confie au cabinet la mission suivante : " + (TYPES_MISSION[m.type_mission] || m.type_mission) + ", pour l'exercice ouvert le " + dateFr(m.date_debut) + (m.date_fin ? " et clos le " + dateFr(m.date_fin) : "") + ".",
    "",
    "2. Prestations comprises",
    prestations || "– selon le détail convenu",
    "",
    "3. Obligations du cabinet",
    "Le cabinet exécute la mission avec diligence, dans le respect des normes professionnelles applicables et du secret professionnel. Il informe le client de toute difficulté rencontrée dans l'exécution de la mission. Il conserve les documents de travail pendant la durée légale.",
    "",
    "4. Obligations du client",
    "Le client transmet au cabinet, dans les délais convenus, l'ensemble des pièces et informations nécessaires, exactes et complètes. Il reste responsable de la sincérité des pièces fournies et des décisions de gestion. Il informe le cabinet de tout événement susceptible d'affecter la mission.",
    "",
    "5. Honoraires",
    "Les honoraires sont fixés à " + hono + ", hors taxes, payables " + (m.periodicite === "mensuelle" ? "mensuellement" : "selon l'échéancier convenu") + ". Toute prestation hors du périmètre ci-dessus fait l'objet d'un accord préalable et d'une facturation distincte.",
    "",
    "6. Durée et résiliation",
    "La mission prend effet le " + dateFr(m.date_debut) + (m.duree_mois ? " pour une durée de " + m.duree_mois + " mois, renouvelable tacitement" : "") + ". Chaque partie peut y mettre fin par lettre recommandée avec un préavis de " + (m.preavis_mois || 3) + " mois. En cas de résiliation, les travaux exécutés sont facturés au prorata.",
    "",
    "7. Responsabilité",
    "La responsabilité du cabinet ne peut être engagée qu'en cas de faute prouvée dans l'exécution de la mission et se limite au préjudice direct. Le cabinet est assuré en responsabilité civile professionnelle.",
    "",
    "8. Données personnelles",
    "Les données traitées dans le cadre de la mission le sont pour les seuls besoins de celle-ci et conservées pendant la durée légale. Le client dispose d'un droit d'accès et de rectification auprès du cabinet.",
    "",
    m.mentions ? "9. Dispositions particulières\n" + m.mentions + "\n" : "",
    "Fait en deux exemplaires. La signature électronique de ce document par le client vaut acceptation de la présente lettre de mission.",
  ].filter(function (x) { return x !== ""; }).join("\n");
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

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session) return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });
    const id = (req.nextUrl.searchParams.get("societe_id") || "").trim();
    if (!id) return NextResponse.json({ ok: false, erreur: "Dossier non précisé." }, { status: 400 });
    const refus = await lecture(id);
    if (refus) return refus;

    const { data: missions, error } = await supabase
      .from("compta_missions")
      .select("*")
      .eq("societe_id", id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });

    const refs = (missions || []).map(function (m: any) { return m.reference_document; }).filter(Boolean);
    let signees: any = {};
    if (refs.length > 0) {
      const { data: sigs } = await supabase
        .from("compliance_signatures")
        .select("document_reference, signe_le")
        .in("document_reference", refs)
        .eq("annulee", false);
      for (const s of sigs || []) signees[s.document_reference] = s.signe_le;
    }

    return NextResponse.json({
      ok: true,
      types: TYPES_MISSION,
      prestations: PRESTATIONS,
      missions: (missions || []).map(function (m: any) {
        return { ...m, signee_le: m.reference_document ? signees[m.reference_document] || null : null, statut: m.reference_document ? (signees[m.reference_document] ? "signee" : "envoyee") : "brouillon" };
      }),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!origineLegitime(req)) return NextResponse.json({ ok: false, erreur: "Acces refuse" }, { status: 403 });
    const session = sessionCourante();
    if (!session || !session.tenantId) return NextResponse.json({ ok: false, erreur: "Connectez-vous." }, { status: 401 });

    const b = await req.json().catch(function () { return null; });
    if (!b || !b.societe_id) return NextResponse.json({ ok: false, erreur: "Dossier non précisé." }, { status: 400 });
    const id = String(b.societe_id);
    const refus = await lecture(id);
    if (refus) return refus;

    const { data: client } = await supabase
      .from("compta_societes")
      .select("id, code, raison_sociale, siren, forme, adresse, email_contact, exercice_debut, exercice_fin")
      .eq("id", id)
      .maybeSingle();
    if (!client) return NextResponse.json({ ok: false, erreur: "Dossier introuvable." }, { status: 404 });

    if (b.action === "lier") {
      const reference = texte(b.reference, 60);
      if (!b.mission_id || !reference) return NextResponse.json({ ok: false, erreur: "Mission ou référence manquante." }, { status: 400 });
      const { error } = await supabase
        .from("compta_missions")
        .update({ reference_document: reference, envoyee_le: new Date().toISOString() })
        .eq("id", b.mission_id)
        .eq("societe_id", id);
      if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    // action=preparer
    const cabinet = await cabinetDe(session.tenantId);
    if (!cabinet) return NextResponse.json({ ok: false, erreur: "Renseignez d'abord votre cabinet dans « Ma société »." }, { status: 400 });

    const signataire = String(b.signataire_email || client.email_contact || "").toLowerCase().trim();
    if (!signataire || signataire.indexOf("@") < 1) {
      return NextResponse.json({ ok: false, erreur: "Le dossier n'a pas d'adresse de contact : renseignez-la dans le dossier ou indiquez le signataire." }, { status: 400 });
    }

    const typeMission = String(b.type_mission || "tenue");
    if (!TYPES_MISSION[typeMission]) return NextResponse.json({ ok: false, erreur: "Type de mission inconnu." }, { status: 400 });
    const prestations = Array.isArray(b.prestations) ? b.prestations.filter(function (p: any) { return PRESTATIONS[String(p)]; }).map(String) : [];
    const honoraires = Number(b.honoraires);
    if (!honoraires || honoraires <= 0) return NextResponse.json({ ok: false, erreur: "Indiquez les honoraires." }, { status: 400 });
    const periodicite = b.periodicite === "annuelle" ? "annuelle" : "mensuelle";
    const dateDebut = texte(b.date_debut, 10) || String(client.exercice_debut || "").slice(0, 10) || new Date().toISOString().slice(0, 10);

    const mission = {
      societe_id: id,
      tenant_id: session.tenantId,
      type_mission: typeMission,
      prestations,
      honoraires,
      periodicite,
      date_debut: dateDebut,
      date_fin: texte(b.date_fin, 10),
      duree_mois: b.duree_mois ? Number(b.duree_mois) : 12,
      preavis_mois: b.preavis_mois ? Number(b.preavis_mois) : 3,
      mentions: texte(b.mentions, 3000),
      signataire_email: signataire,
      cree_par: session.email,
    };

    const { data: creee, error } = await supabase.from("compta_missions").insert(mission).select("id").maybeSingle();
    if (error) return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });

    const corps = corpsLettre(cabinet, client, mission);
    const titre = "Lettre de mission " + dateDebut.slice(0, 4) + " — " + client.raison_sociale;

    return NextResponse.json({
      ok: true,
      mission_id: creee ? creee.id : null,
      corps,
      // Ce que l ecran passe tel quel a /api/compliance/document-a-signer.
      document_a_signer: {
        doc_type: "lettre_mission",
        titre,
        corps,
        signataire_email: signataire,
        entite_id: cabinet.id,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
