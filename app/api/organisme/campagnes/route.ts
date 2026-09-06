import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession, tenantDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// LES CAMPAGNES D UN ORGANISME — 06/09.
//
// MEME MECANIQUE QUE CHEZ L EDITEUR, AUTRES CAMPAGNES. Sur /admin/linkedin,
// les cinq produits sont ecrits en dur : AcadeMIA, Mr. Comptable,
// MysterLLC, Mr. CRM, Mr. LMS. Ce sont les marques de la maison. Un client
// a les siennes — un cabinet comptable « Bilan », « TVA », « Paie » — et
// le logiciel n en connait aucune.
//
// 🚨 LA CAMPAGNE DECIDE DU MESSAGE. C est sa seule raison d etre : un
// contact classe « TVA » recoit le message TVA. Le texte s ecrit UNE FOIS
// sur la campagne, jamais fiche par fiche.
//
// ⚠️ LA CLE NE CHANGE JAMAIS. Elle relie la campagne aux fiches deja
// classees : la recalculer a chaque renommage declasserait tout.
//
// ⚠️ SUPPRIMER DESACTIVE, NE DETRUIT PAS. Les fiches gardent leur
// classement ; si le client se ravise, rien n est perdu.
// ══════════════════════════════════════════════════════════════════════════

const MAX_CAMPAGNES = 10;

// Les couleurs proposees. Elles distinguent les campagnes d un coup d oeil
// dans la liste, comme les cinq produits chez l editeur.
const COULEURS = ["#c8a96e", "#4fc3f7", "#4caf50", "#b18cff", "#e8a33d", "#e8836a"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function cleDepuis(libelle: string): string {
  const sansAccent = String(libelle || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const propre = sansAccent
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return propre || "campagne";
}

async function contexte() {
  const email = emailDeSession();
  const tenant = tenantDeSession();
  if (!email) return { erreur: "Vous devez être connecté.", code: 401 };
  if (!tenant) return { erreur: "Aucun organisme rattaché à votre compte.", code: 403 };
  return { email: email, tenant: tenant };
}

export async function GET() {
  const c: any = await contexte();
  if (c.erreur) return NextResponse.json({ ok: false, erreur: c.erreur }, { status: c.code });

  const { data, error } = await supabase
    .from("crm_campagnes")
    .select("id, cle, libelle, couleur, message, rang, actif")
    .eq("tenant_id", c.tenant)
    .eq("actif", true)
    .order("rang", { ascending: true });

  if (error) {
    console.error("[organisme/campagnes] GET : " + error.message);
    return NextResponse.json({ ok: false, erreur: "Lecture impossible." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, campagnes: data || [] });
}

export async function POST(req: NextRequest) {
  const c: any = await contexte();
  if (c.erreur) return NextResponse.json({ ok: false, erreur: c.erreur }, { status: c.code });

  const body = await req.json().catch(function () { return null; });
  if (!body || !body.action) {
    return NextResponse.json({ ok: false, erreur: "Action manquante." }, { status: 400 });
  }

  // ---- CREER ----
  if (body.action === "creer") {
    const libelle = String(body.libelle || "").trim().slice(0, 60);
    if (libelle.length < 2) {
      return NextResponse.json(
        { ok: false, erreur: "Donnez un nom à cette campagne." },
        { status: 400 }
      );
    }

    const { data: deja } = await supabase
      .from("crm_campagnes")
      .select("id, cle")
      .eq("tenant_id", c.tenant)
      .eq("actif", true);

    if ((deja || []).length >= MAX_CAMPAGNES) {
      return NextResponse.json(
        { ok: false, erreur: "Vous avez atteint " + MAX_CAMPAGNES
          + " campagnes. Retirez-en une avant d'en ajouter." },
        { status: 400 }
      );
    }

    let cle = cleDepuis(libelle);
    const prises = (deja || []).map(function (x: any) { return x.cle; });
    if (prises.indexOf(cle) >= 0) {
      let n = 2;
      while (prises.indexOf(cle + "_" + n) >= 0) n++;
      cle = cle + "_" + n;
    }

    const { data, error } = await supabase
      .from("crm_campagnes")
      .insert({
        tenant_id: c.tenant,
        cle: cle,
        libelle: libelle,
        couleur: COULEURS[(deja || []).length % COULEURS.length],
        message: String(body.message || "").slice(0, 2000) || null,
        rang: (deja || []).length,
      })
      .select("id, cle, libelle, couleur, message, rang, actif")
      .maybeSingle();

    if (error) {
      console.error("[organisme/campagnes] creer : " + error.message);
      return NextResponse.json({ ok: false, erreur: "Création impossible." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, campagne: data });
  }

  // ---- MODIFIER : le libelle et le message, jamais la cle ----
  if (body.action === "modifier") {
    const id = String(body.id || "");
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Campagne non précisée." }, { status: 400 });
    }

    const champs: any = {};
    if (typeof body.libelle === "string") {
      const l = body.libelle.trim().slice(0, 60);
      if (l.length < 2) {
        return NextResponse.json({ ok: false, erreur: "Nom trop court." }, { status: 400 });
      }
      champs.libelle = l;
    }
    // ⚠️ LE MESSAGE PEUT ETRE VIDE : une campagne sans texte sert encore a
    // classer les fiches. On ecrit null plutot que de refuser.
    if (typeof body.message === "string") {
      champs.message = body.message.slice(0, 2000) || null;
    }

    if (Object.keys(champs).length === 0) {
      return NextResponse.json({ ok: false, erreur: "Rien à modifier." }, { status: 400 });
    }

    const { error } = await supabase
      .from("crm_campagnes")
      .update(champs)
      .eq("id", id)
      .eq("tenant_id", c.tenant);

    if (error) {
      console.error("[organisme/campagnes] modifier : " + error.message);
      return NextResponse.json({ ok: false, erreur: "Modification impossible." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // ---- SUPPRIMER : on desactive ----
  if (body.action === "supprimer") {
    const id = String(body.id || "");
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Campagne non précisée." }, { status: 400 });
    }

    const { error } = await supabase
      .from("crm_campagnes")
      .update({ actif: false })
      .eq("id", id)
      .eq("tenant_id", c.tenant);

    if (error) {
      console.error("[organisme/campagnes] supprimer : " + error.message);
      return NextResponse.json({ ok: false, erreur: "Suppression impossible." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, erreur: "Action inconnue." }, { status: 400 });
}
