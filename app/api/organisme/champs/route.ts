import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession, tenantDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ══════════════════════════════════════════════════════════════════════════
// LES CHAMPS PERSONNALISES D UN ORGANISME — 06/09.
//
// POURQUOI ILS EXISTENT. Mr CRM sert des metiers qu il ne connait pas : un
// cabinet comptable suit « A jour de ses pieces », une agence d interim
// « Disponible » et « Fin de mission », un organisme de formation
// « Dossier de financement depose ». Aucune de ces colonnes ne peut etre
// ecrite dans le code : elles appartiennent au client.
//
// 🚨 CE N EST PAS LE MODELE DE MR COMPTABLE. La-bas, « Pieces manquantes »
// et « Banque a justifier » sont CALCULES depuis la comptabilite : le
// logiciel connait le metier, donc il sait quoi compter. Mr CRM n a aucune
// donnee metier — ses champs sont SAISIS a la main, jamais deduits.
// ⚠️ NE PAS ESSAYER DE LES CALCULER : il n y a rien a partir de quoi.
//
// 🚨 TROIS TYPES SEULEMENT : case a cocher, date, texte court. Ils couvrent
// presque tout. Chaque type ajoute complique la saisie, le filtre et
// l affichage — et se paie sur trois ecrans a la fois.
//
// ⚠️ TOUT EST FILTRE SUR LE TENANT DE LA SESSION, lu dans le cookie signe,
// jamais dans la requete. Un client qui passerait le tenant d un autre ne
// verrait rien de plus.
// ══════════════════════════════════════════════════════════════════════════

const TYPES = ["case", "date", "texte"];

// 🚨 DIX CHAMPS AU MAXIMUM. Sans limite, un client en cree trente et rend
// son propre tableau illisible — puis nous demande de le reparer.
const MAX_CHAMPS = 10;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// LA CLE TECHNIQUE, DEDUITE DU LIBELLE UNE SEULE FOIS.
//
// ⚠️ ELLE NE CHANGE JAMAIS ENSUITE. C est elle qui relie la definition aux
// valeurs deja saisies sur les fiches : la recalculer a chaque renommage
// ferait perdre tout ce qui a ete rempli. « A jour de ses pieces » devient
// `a_jour_de_ses_pieces` ; renomme en « Pieces a jour », la cle reste.
function cleDepuis(libelle: string): string {
  const sansAccent = String(libelle || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const propre = sansAccent
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return propre || "champ";
}

async function contexte() {
  const email = emailDeSession();
  const tenant = tenantDeSession();
  if (!email) return { erreur: "Vous devez être connecté.", code: 401 };
  if (!tenant) return { erreur: "Aucun organisme rattaché à votre compte.", code: 403 };
  return { email: email, tenant: tenant };
}

// ---- LIRE LES CHAMPS ----
export async function GET() {
  const c: any = await contexte();
  if (c.erreur) return NextResponse.json({ ok: false, erreur: c.erreur }, { status: c.code });

  const { data, error } = await supabase
    .from("crm_champs")
    .select("id, cle, libelle, type, rang, actif")
    .eq("tenant_id", c.tenant)
    .eq("actif", true)
    .order("rang", { ascending: true });

  if (error) {
    console.error("[organisme/champs] GET : " + error.message);
    return NextResponse.json({ ok: false, erreur: "Lecture impossible." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, champs: data || [] });
}

// ---- CREER, RENOMMER, SUPPRIMER ----
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
    const type = String(body.type || "").trim();

    if (libelle.length < 2) {
      return NextResponse.json(
        { ok: false, erreur: "Donnez un nom à cette colonne." },
        { status: 400 }
      );
    }
    if (TYPES.indexOf(type) < 0) {
      return NextResponse.json(
        { ok: false, erreur: "Choisissez le type : case à cocher, date ou texte." },
        { status: 400 }
      );
    }

    const { data: deja } = await supabase
      .from("crm_champs")
      .select("id, cle")
      .eq("tenant_id", c.tenant)
      .eq("actif", true);

    if ((deja || []).length >= MAX_CHAMPS) {
      return NextResponse.json(
        { ok: false, erreur: "Vous avez atteint " + MAX_CHAMPS
          + " colonnes. Supprimez-en une avant d'en ajouter." },
        { status: 400 }
      );
    }

    // ⚠️ LA CLE DOIT ETRE UNIQUE POUR CET ORGANISME. Deux libelles
    // differents peuvent donner la meme cle — « À jour » et « A jour ».
    // On ajoute un suffixe plutot que de refuser : le client ne comprendrait
    // pas pourquoi son nom est rejete.
    let cle = cleDepuis(libelle);
    const prises = (deja || []).map(function (x: any) { return x.cle; });
    if (prises.indexOf(cle) >= 0) {
      let n = 2;
      while (prises.indexOf(cle + "_" + n) >= 0) n++;
      cle = cle + "_" + n;
    }

    const { data, error } = await supabase
      .from("crm_champs")
      .insert({
        tenant_id: c.tenant,
        cle: cle,
        libelle: libelle,
        type: type,
        rang: (deja || []).length,
      })
      .select("id, cle, libelle, type, rang, actif")
      .maybeSingle();

    if (error) {
      console.error("[organisme/champs] creer : " + error.message);
      return NextResponse.json({ ok: false, erreur: "Création impossible." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, champ: data });
  }

  // ---- RENOMMER ----
  //
  // ⚠️ SEUL LE LIBELLE CHANGE, JAMAIS LA CLE NI LE TYPE. Changer la cle
  // perdrait toutes les valeurs deja saisies ; changer le type rendrait
  // illisible ce qui est deja rempli — une date devenue case a cocher n a
  // aucun sens.
  if (body.action === "renommer") {
    const id = String(body.id || "");
    const libelle = String(body.libelle || "").trim().slice(0, 60);
    if (!id || libelle.length < 2) {
      return NextResponse.json({ ok: false, erreur: "Nom manquant." }, { status: 400 });
    }

    const { error } = await supabase
      .from("crm_champs")
      .update({ libelle: libelle })
      .eq("id", id)
      .eq("tenant_id", c.tenant);

    if (error) {
      console.error("[organisme/champs] renommer : " + error.message);
      return NextResponse.json({ ok: false, erreur: "Modification impossible." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // ---- SUPPRIMER ----
  //
  // 🚨 ON DESACTIVE, ON NE SUPPRIME PAS. Les valeurs deja saisies sur les
  // fiches restent dans la colonne `champs` : si le client se ravise, ou
  // s il a supprime par erreur, rien n est perdu. Une suppression reelle
  // laisserait des valeurs orphelines que plus rien ne saurait afficher.
  if (body.action === "supprimer") {
    const id = String(body.id || "");
    if (!id) {
      return NextResponse.json({ ok: false, erreur: "Colonne non précisée." }, { status: 400 });
    }

    const { error } = await supabase
      .from("crm_champs")
      .update({ actif: false })
      .eq("id", id)
      .eq("tenant_id", c.tenant);

    if (error) {
      console.error("[organisme/champs] supprimer : " + error.message);
      return NextResponse.json({ ok: false, erreur: "Suppression impossible." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, erreur: "Action inconnue." }, { status: 400 });
}
