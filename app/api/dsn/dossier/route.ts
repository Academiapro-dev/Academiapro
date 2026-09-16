import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════════════
// LA GESTION DES DECLARATIONS DSN — 16/09/2026
//
// Lister les mois, ouvrir un fichier, marquer une declaration controlee
// puis deposee, consigner le compte rendu metier.
//
// 🚨 LE FICHIER SE GENERE DANS /api/dsn/generer, et nulle part ailleurs.
// Cette route ne fait que le suivi.
// ═══════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function q(v: any): string {
  return v === null || v === undefined ? "" : String(v).trim();
}

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ erreur: "non autorise" }, { status: 401 });
  }

  let c: any = {};
  try { c = await req.json(); } catch { c = {}; }
  const action = q(c.action);

  try {
    // ---- L ETAT DES LIEUX ----
    //
    // Pour chaque mois qui porte des bulletins, dire ou en est la DSN.
    if (action === "etat") {
      const { data: societes } = await supabase
        .from("compta_societes")
        .select("id, tenant_id, raison_sociale, siret, code_ape, effectif")
        .order("raison_sociale");

      const { data: bulletins } = await supabase
        .from("paie_bulletins")
        .select("societe_id, periode, statut, brut")
        .order("periode", { ascending: false });

      const { data: declarations } = await supabase
        .from("dsn_declarations")
        .select("*")
        .order("periode", { ascending: false });

      // On regroupe les bulletins par societe et par mois.
      const mois: any = {};
      for (const b of (bulletins || [])) {
        const cle = b.societe_id + "|" + String(b.periode).slice(0, 10);
        if (!mois[cle]) {
          mois[cle] = {
            societe_id: b.societe_id,
            periode: String(b.periode).slice(0, 10),
            bulletins: 0, emis: 0, brouillons: 0, brut: 0,
          };
        }
        mois[cle].bulletins++;
        mois[cle].brut += Number(b.brut || 0);
        if (b.statut === "emis") mois[cle].emis++;
        else mois[cle].brouillons++;
      }

      // 🚨 ON RATTACHE LA DERNIERE DECLARATION DE CHAQUE MOIS. C est son
      // numero d ordre qui dit quelle version fait foi.
      const lignes = Object.keys(mois).map(function (cle) {
        const m = mois[cle];
        const d = (declarations || []).filter(function (x: any) {
          return x.societe_id === m.societe_id
            && String(x.periode).slice(0, 10) === m.periode;
        }).sort(function (a: any, b: any) {
          return Number(b.numero_ordre) - Number(a.numero_ordre);
        })[0];

        const s = (societes || []).filter(function (x: any) {
          return x.id === m.societe_id;
        })[0];

        return {
          ...m,
          brut: Math.round(m.brut * 100) / 100,
          societe: s ? s.raison_sociale : "",
          siret: s ? s.siret : null,
          declaration: d || null,
        };
      }).sort(function (a: any, b: any) {
        return a.periode < b.periode ? 1 : -1;
      });

      return NextResponse.json({ success: true, mois: lignes, societes: societes || [] });
    }

    // ---- OUVRIR LE FICHIER ----
    if (action === "voir") {
      const { data: d } = await supabase
        .from("dsn_declarations").select("chemin_fichier")
        .eq("id", q(c.id)).maybeSingle();

      if (!d || !d.chemin_fichier) {
        return NextResponse.json({ erreur: "aucun fichier pour cette declaration" }, { status: 404 });
      }

      const { data: signe } = await supabase.storage
        .from("documents-signes").createSignedUrl(d.chemin_fichier, 3600);

      if (!signe) return NextResponse.json({ erreur: "lien impossible" }, { status: 500 });
      return NextResponse.json({ success: true, url: signe.signedUrl });
    }

    // ---- LIRE LE CONTENU DU FICHIER ----
    //
    // ⚠️ POUR LE RELIRE A L ECRAN AVANT DEPOT. Un fichier DSN est du texte :
    // le lire est le seul moyen de verifier de ses yeux ce qu on declare.
    if (action === "contenu") {
      const { data: d } = await supabase
        .from("dsn_declarations").select("chemin_fichier")
        .eq("id", q(c.id)).maybeSingle();

      if (!d || !d.chemin_fichier) {
        return NextResponse.json({ erreur: "aucun fichier" }, { status: 404 });
      }

      const { data: blob, error } = await supabase.storage
        .from("documents-signes").download(d.chemin_fichier);

      if (error || !blob) {
        return NextResponse.json({ erreur: "lecture impossible" }, { status: 500 });
      }

      // 🚨 LE FICHIER EST EN LATIN-1 : le relire en UTF-8 afficherait des
      // caracteres casses la ou tout est correct.
      const octets = Buffer.from(await blob.arrayBuffer());
      const texte = octets.toString("latin1");

      return NextResponse.json({
        success: true,
        contenu: texte,
        nb_lignes: texte.split("\n").filter(function (l) { return l.trim(); }).length,
      });
    }

    // ---- MARQUER CONTROLEE ----
    //
    // 🚨🚨 CE GESTE ATTESTE QUE LE FICHIER EST PASSE DANS dsn-val SANS
    // ANOMALIE BLOQUANTE. C est une declaration sur l honneur, pas un
    // controle automatique : la route n a aucun moyen de le verifier.
    // ⛔ DEPOSER SANS CE CONTROLE, C EST SE GARANTIR UN REJET — et le rejet
    // arrive apres la date limite, donc avec une penalite de retard.
    if (action === "controlee") {
      const { error } = await supabase
        .from("dsn_declarations")
        .update({
          statut: "controlee",
          controlee_le: new Date().toISOString(),
          maj_le: new Date().toISOString(),
        })
        .eq("id", q(c.id))
        .eq("statut", "brouillon");

      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });
      return NextResponse.json({
        success: true,
        message: "Declaration marquee comme controlee dans dsn-val.",
      });
    }

    // ---- MARQUER DEPOSEE ----
    //
    // ⛔ UNE DECLARATION DEPOSEE NE SE MODIFIE PLUS. Pour la corriger, il
    // faut en generer une nouvelle pour le meme mois : elle sera
    // automatiquement « annule et remplace » avec un numero d ordre
    // superieur.
    if (action === "deposee") {
      const { data: d } = await supabase
        .from("dsn_declarations").select("statut, periode")
        .eq("id", q(c.id)).maybeSingle();

      if (!d) return NextResponse.json({ erreur: "declaration introuvable" }, { status: 404 });

      if (d.statut === "brouillon") {
        return NextResponse.json({
          erreur: "cette declaration n a pas ete controlee. ⛔ AUCUNE DSN NE SE "
            + "DEPOSE SANS ETRE PASSEE DANS dsn-val : un rejet arrive apres la "
            + "date limite, donc avec une penalite.",
        }, { status: 400 });
      }

      const { error } = await supabase
        .from("dsn_declarations")
        .update({
          statut: "deposee",
          deposee_le: new Date().toISOString(),
          maj_le: new Date().toISOString(),
        })
        .eq("id", q(c.id));

      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });
      return NextResponse.json({
        success: true,
        message: "Declaration marquee comme deposee. Elle ne peut plus etre "
          + "modifiee : une correction passe par une nouvelle DSN du meme mois.",
      });
    }

    // ---- CONSIGNER LE COMPTE RENDU METIER ----
    //
    // 🚨 LE CRM EST LA REPONSE DES ORGANISMES. Il arrive quelques jours
    // apres le depot et dit ce qui a ete accepte ou rejete.
    // 🚨🚨 C EST LUI QUI RAPPORTE LE TAUX DE PRELEVEMENT A LA SOURCE de
    // chaque salarie. Sans depot, pas de CRM ; sans CRM, pas de taux — et
    // le bulletin reste au taux neutre.
    if (action === "crm") {
      const { error } = await supabase
        .from("dsn_declarations")
        .update({
          crm_recu_le: new Date().toISOString(),
          crm_anomalies: c.anomalies || null,
          statut: c.rejetee === true ? "rejetee" : "acceptee",
          maj_le: new Date().toISOString(),
        })
        .eq("id", q(c.id));

      if (error) return NextResponse.json({ erreur: error.message }, { status: 500 });
      return NextResponse.json({
        success: true,
        message: c.rejetee === true
          ? "Declaration marquee REJETEE. ⛔ Une DSN « annule et remplace » "
            + "doit partir avant la prochaine echeance."
          : "Declaration acceptee.",
      });
    }

    return NextResponse.json({ erreur: "action inconnue : " + action }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ erreur: String(e) }, { status: 500 });
  }
}
