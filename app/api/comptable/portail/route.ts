import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUCKET = "pieces-comptables";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// LE PORTAIL DU DIRIGEANT.
//
// Ce n est PAS l espace du cabinet. Le dirigeant vient pour trois choses :
// voir ce qu on lui reclame, deposer une facture, et savoir ou en est sa
// tresorerie. Rien d autre.
//
// L acces se fait par un JETON, pas par un mot de passe. Un dirigeant ne se
// connecte pas tous les jours : lui imposer un mot de passe a retenir le
// ferait renoncer, et les pieces n arriveraient jamais. Le jeton est long,
// aleatoire, et se revoque d un clic.
//
// LE JETON COMMANDE TOUT. Il ne donne acces qu a UNE societe. On ne lit
// jamais le societe_id depuis la requete : il vient de la ligne d acces.
// C est ce qui empeche un dirigeant de voir le dossier du voisin.

const JOURNAUX = ["AC", "ACH", "VE", "VTE", "HA", "BQ"];

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

async function acces(jeton: string) {
  if (!jeton || jeton.length < 20) return null;

  const { data } = await supabase
    .from("compta_acces_client")
    .select("id, societe_id, tenant_id, email, nom, actif")
    .eq("jeton", jeton)
    .eq("actif", true)
    .maybeSingle();

  return data || null;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const jeton = url.searchParams.get("j") || "";

    const droit = await acces(jeton);

    if (!droit) {
      // On ne dit pas pourquoi : un message precis permettrait d essayer
      // des jetons un a un.
      return NextResponse.json({ ok: false, erreur: "Lien invalide ou expire." }, { status: 403 });
    }

    // On note le passage, sans bloquer si l ecriture echoue.
    supabase
      .from("compta_acces_client")
      .update({ derniere_visite: new Date().toISOString() })
      .eq("id", droit.id)
      .then(function () {}, function () {});

    const { data: societe } = await supabase
      .from("compta_societes")
      .select("raison_sociale, siren, exercice_debut, exercice_fin, devise")
      .eq("id", droit.societe_id)
      .maybeSingle();

    // CE QU ON LUI RECLAME. Meme logique que la relance mensuelle : une
    // ecriture d achat ou de vente sans justificatif.
    const { data: ecritures } = await supabase
      .from("compta_ecritures")
      .select("ecriture_num, ecriture_date, journal_code, ecriture_lib, debit, credit")
      .eq("societe_id", droit.societe_id)
      .order("ecriture_date", { ascending: false })
      .limit(3000);

    const { data: pieces } = await supabase
      .from("compta_pieces")
      .select("ecriture_num, nom, date_piece, montant_ttc, fournisseur, created_at")
      .eq("societe_id", droit.societe_id)
      .order("created_at", { ascending: false })
      .limit(2000);

    const deposees: string[] = [];
    for (const p of pieces || []) {
      if (p.ecriture_num && deposees.indexOf(p.ecriture_num) < 0) {
        deposees.push(p.ecriture_num);
      }
    }

    const parNumero: any = {};

    for (const e of ecritures || []) {
      const journal = String(e.journal_code || "").toUpperCase();
      if (JOURNAUX.indexOf(journal) < 0) continue;
      if (!e.ecriture_num) continue;
      if (deposees.indexOf(e.ecriture_num) >= 0) continue;

      const montant = Math.max(Number(e.debit) || 0, Number(e.credit) || 0);

      if (!parNumero[e.ecriture_num]) {
        parNumero[e.ecriture_num] = {
          numero: e.ecriture_num,
          date: e.ecriture_date,
          libelle: e.ecriture_lib || "",
          montant: 0,
        };
      }
      parNumero[e.ecriture_num].montant = parNumero[e.ecriture_num].montant + montant;
    }

    const attendues = Object.keys(parNumero)
      .map(function (k) { return parNumero[k]; })
      .sort(function (a: any, b: any) { return b.montant - a.montant; })
      .slice(0, 100);

    return NextResponse.json({
      ok: true,
      societe: {
        nom: (societe && societe.raison_sociale) || "",
        siren: (societe && societe.siren) || null,
        devise: (societe && societe.devise) || "EUR",
      },
      dirigeant: { nom: droit.nom || null, email: droit.email },
      attendues: attendues,
      total_attendu: r2(attendues.reduce(function (a: number, m: any) { return a + m.montant; }, 0)),
      deposees: (pieces || []).slice(0, 30),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}

// DEPOT D UNE PIECE. Le dirigeant photographie sa facture, elle arrive ici.
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const jeton = url.searchParams.get("j") || "";

    const droit = await acces(jeton);
    if (!droit) {
      return NextResponse.json({ ok: false, erreur: "Lien invalide ou expire." }, { status: 403 });
    }

    const fd = await req.formData();
    const fichier = fd.get("fichier") as File | null;
    const ecritureNum = String(fd.get("ecriture_num") || "").trim();

    if (!fichier || fichier.size < 100) {
      return NextResponse.json({ ok: false, erreur: "Aucun fichier recu." }, { status: 400 });
    }

    if (fichier.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, erreur: "Fichier trop lourd. Quinze mégaoctets au maximum." },
        { status: 400 }
      );
    }

    const octets = Buffer.from(await fichier.arrayBuffer());

    const nomPropre = String(fichier.name || "piece")
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 80);

    const chemin = String(droit.societe_id) + "/" + Date.now() + "_" + nomPropre;

    const { error: eDepot } = await supabase.storage
      .from(BUCKET)
      .upload(chemin, octets, {
        contentType: fichier.type || "application/octet-stream",
        upsert: false,
      });

    if (eDepot) {
      return NextResponse.json({ ok: false, erreur: eDepot.message }, { status: 500 });
    }

    // La piece est enregistree AU NOM DE LA SOCIETE DU JETON, jamais d une
    // societe transmise par le navigateur.
    const { error: eLigne } = await supabase.from("compta_pieces").insert({
      societe_id: droit.societe_id,
      ecriture_num: ecritureNum || null,
      nom: fichier.name || nomPropre,
      type_document: "justificatif",
      chemin: chemin,
      octets: octets.length,
      depose_par: droit.email,
    });

    if (eLigne) {
      return NextResponse.json({ ok: false, erreur: eLigne.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: "Votre document est bien arrivé.",
      rattachee: ecritureNum || null,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
