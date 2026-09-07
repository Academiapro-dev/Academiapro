import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { limiter, ipDe } from "../../../../lib/limiteur";
import { verifierMdp } from "../securite/route";

export const runtime = "nodejs";
export const maxDuration = 30;

// ═══════════════════════════════════════════════════════════════════════
// 🚨🚨 LA VERIFICATION DU MOT DE PASSE EST DESORMAIS PARTAGEE — 07/09.
//
// CE QUI S EST PASSE. Le 31/08, le hachage du mot de passe est passe de
// SHA-256 a scrypt (voir app/api/admin/securite/route.ts). La fonction
// `verifierMdp` de ce fichier reconnait les deux formats et migre
// automatiquement un ancien hachage des la premiere verification reussie.
//
// MAIS CETTE ROUTE RECALCULAIT LE SHA-256 EN LIGNE, dans son propre code.
// Elle ne connaissait pas scrypt. Des que la migration a eu lieu, elle a
// repondu « Non autorise » a tout enregistrement de depense — alors que
// l ecran de connexion continuait de fonctionner, puisqu il passe par
// /api/admin/compta qui, lui, importe la bonne fonction.
//
// ⚠️ LE COMMENTAIRE DE securite/route.ts AFFIRMAIT DEJA QUE CETTE ROUTE
// IMPORTAIT `verifierMdp`. C etait faux. Le changement du 31/08 a ete
// fait a moitie : la fonction commune a ete ecrite, une seule des trois
// routes l a adoptee.
//
// ⛔ NE JAMAIS REECRIRE `parametres_securite.hash` A LA MAIN pour
// « reparer » une de ces routes. Cela fonctionne quelques minutes, puis
// `verifierMdp` detecte l ancien format a la reconnexion suivante et le
// remigre en scrypt : la panne revient sans qu on comprenne pourquoi.
// La seule facon legitime de changer ce mot de passe est l onglet
// « Mot de passe » de l ecran, qui passe par /api/admin/securite.
//
// ⛔ NE JAMAIS RECALCULER UN HACHAGE ICI. Trois routes demandent ce mot
// de passe — compta, analyser-justificatif et celle-ci — et elles doivent
// toutes appeler `verifierMdp`, sinon la prochaine evolution du format en
// cassera deux sur trois.
// ═══════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  if (!limiter(ipDe(req), "depense", 10, 600000)) { return NextResponse.json({ error: "Trop de tentatives, reessayez dans quelques minutes" }, { status: 429 }); }
  try {
    // Securite : mot de passe compta + origine du site
    //
    // 🚨 LA MEME FONCTION QUE /api/admin/compta. Elle accepte scrypt et
    // SHA-256, et migre l ancien format toute seule.
    if (!(await verifierMdp(req.headers.get("x-mdp-compta") || ""))) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }
    const origine = (req.headers.get("origin") || "") + (req.headers.get("referer") || "");
    if (!origine.includes("academiapro.fr") && !origine.includes("vercel.app") && !origine.includes("localhost")) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const fd = await req.formData();
    const fournisseur = String(fd.get("fournisseur") || "");
    const categorie = String(fd.get("categorie") || "Autres");
    const description = String(fd.get("description") || "");
    const pays_fournisseur = String(fd.get("pays_fournisseur") || "");
    const projet = String(fd.get("projet") || "academia");
    const montant_ttc = parseFloat(String(fd.get("montant_ttc"))) || 0;
    const devise = String(fd.get("devise") || "EUR");
    const avance_perso = String(fd.get("avance_perso")) === "true";
    const date_depense = String(fd.get("date_depense") || new Date().toISOString().slice(0, 10));
    const fichier = fd.get("fichier") as File | null;

    if (!fournisseur || montant_ttc <= 0) {
      return NextResponse.json({ error: "Fournisseur et montant obligatoires" }, { status: 400 });
    }

    // Verifier le projet dans le referentiel
    const { data: projetRow } = await supabase
      .from("projets").select("code").eq("code", projet).single();
    if (!projetRow) {
      return NextResponse.json({ error: "Projet inconnu: " + projet }, { status: 400 });
    }

    // Trimestre calcule depuis la date
    const d = new Date(date_depense);
    const trimestre = d.getFullYear() + "-T" + (Math.floor(d.getMonth() / 3) + 1);

    // Upload du justificatif (optionnel) - chemin relatif comme les 17 existantes
    //
    // ⚠️ LE JUSTIFICATIF RESTE FACULTATIF, ET C EST VOULU : certaines
    // depenses n en ont pas. Mais SI un fichier est fourni et que son
    // envoi echoue, la route s arrete AVANT d inserer la ligne — une
    // depense sans son justificatif alors qu on croyait l avoir joint
    // est pire qu une depense non enregistree, parce qu on ne s en
    // apercoit que des mois plus tard.
    let pdf_url: string | null = null;
    if (fichier && fichier.size > 0) {
      const bytes = Buffer.from(await fichier.arrayBuffer());
      const nomProper = fichier.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const chemin = "Depenses/" + d.getFullYear() + "/" + Date.now() + "_" + nomProper;
      const { error: upErr } = await supabase.storage
        .from("documents-comptables")
        .upload(chemin, bytes, { contentType: fichier.type || "application/octet-stream", upsert: true });
      if (upErr) {
        return NextResponse.json({ error: "Upload justificatif: " + upErr.message }, { status: 500 });
      }
      pdf_url = chemin;
    }

    // Insertion - TVA a 0 et tva_deductible false (en attente fiscaliste)
    const { error: insErr } = await supabase.from("depenses").insert({
      fournisseur, categorie, description, pays_fournisseur, projet,
      montant_ttc, montant_ht: montant_ttc, taux_tva: 0, montant_tva: 0,
      devise, tva_deductible: false, avance_perso, rembourse: false,
      date_depense, trimestre, pdf_url,
    });
    if (insErr) {
      return NextResponse.json({ error: "Insertion: " + insErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, pdf_url });
  } catch (e: any) {
    return NextResponse.json({ error: "Erreur serveur: " + (e?.message || e) }, { status: 500 });
  }
}
