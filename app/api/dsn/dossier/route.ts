import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const maxDuration = 60;

// ═══════════════════════════════════════════════════════════════════════
// LA GESTION DES DECLARATIONS DSN — 16/09/2026, corrigee le meme jour
//
// Lister les mois, ouvrir un fichier, marquer une declaration controlee
// puis deposee, consigner le compte rendu metier.
//
// 🚨 LE FICHIER SE GENERE DANS /api/dsn/generer, et nulle part ailleurs.
// Cette route ne fait que le suivi.
//
// ═══════════════════════════════════════════════════════════════════════
// 🆕🚨 16/09 — TROIS CORRECTIONS APRES LE PREMIER ESSAI DE L ECRAN
//
// L ecran affichait « 0 mois avec des bulletins » alors que la base en
// portait trois, dont un emis. Aucun message, aucune piste : le premier
// essai de la brique DSN n a donc meme pas pu commencer.
//
// 1. 🚨 AUCUNE DES TROIS LECTURES N ETAIT VERIFIEE. `const { data } = await
//    supabase...` sans `error` : quand la requete echoue, `data` vaut null,
//    la route rend zero mois ET REPOND « success ». C est le piege deja
//    documente le 15/09 sur compliance_documents — un insert non verifie
//    echouait en silence, et le defaut ne s est vu que des semaines plus
//    tard. Ici c etait un select, meme cause, meme effet.
//    ⛔ DESORMAIS CHAQUE LECTURE EST VERIFIEE ET SON ERREUR REMONTE.
//
// 2. 🚨 UN BULLETIN ANNULE ETAIT COMPTE COMME UN BROUILLON, ET SON BRUT
//    ADDITIONNE. Sur septembre — un emis, deux annules — l ecran aurait
//    annonce 7 000,71 EUR de brut au lieu de 2 333,57, et « 2 en
//    brouillon » alors qu il n y en a aucun. Un chiffre faux sur un ecran
//    de declaration sociale est pire que pas de chiffre du tout.
//    ⛔ LES ANNULES SONT DESORMAIS ECARTES DU COMPTE. Ils restent en base,
//    ils ne comptent simplement plus.
//
// 3. ⚠️ LES EN-TETES ANTI-CACHE, comme sur le calcul de paie. La lecon du
//    matin : `force-dynamic` n empeche pas un intermediaire de garder sa
//    reponse, et `?v=2` ne contourne que Safari.
// ═══════════════════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// ⚠️ TROIS EN-TETES, PAS UN : `Cache-Control` pour ce qui respecte la norme
// actuelle, `Pragma` et `Expires` pour les intermediaires plus anciens.
const SANS_CACHE: Record<string, string> = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

function q(v: any): string {
  return v === null || v === undefined ? "" : String(v).trim();
}

function json(corps: any, statut?: number) {
  return NextResponse.json(corps, { status: statut || 200, headers: SANS_CACHE });
}

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
    || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return json({ erreur: "non autorise" }, 401);
  }

  let c: any = {};
  try { c = await req.json(); } catch { c = {}; }
  const action = q(c.action);

  try {
    // ═══════════════════════════════════════════════════════════════════
    // ---- L ETAT DES LIEUX ----
    //
    // Pour chaque mois qui porte des bulletins, dire ou en est la DSN.
    // ═══════════════════════════════════════════════════════════════════
    if (action === "etat") {

      // 🚨 CHAQUE LECTURE EST VERIFIEE. Une table absente, une colonne
      // renommee, un droit manquant : tout cela rend `data = null` sans
      // lever d exception. Sans ce controle, l ecran affiche « rien a
      // faire » alors que la vraie reponse est « je n ai pas pu lire ».
      const { data: societes, error: eSoc } = await supabase
        .from("compta_societes")
        .select("id, tenant_id, raison_sociale, siret, code_ape, effectif")
        .order("raison_sociale");

      if (eSoc) {
        return json({
          erreur: "lecture des societes impossible : " + eSoc.message,
          ou: "compta_societes",
        }, 500);
      }

      const { data: bulletins, error: eBul } = await supabase
        .from("paie_bulletins")
        .select("societe_id, periode, statut, brut")
        .order("periode", { ascending: false });

      if (eBul) {
        return json({
          erreur: "lecture des bulletins impossible : " + eBul.message,
          ou: "paie_bulletins",
        }, 500);
      }

      const { data: declarations, error: eDec } = await supabase
        .from("dsn_declarations")
        .select("*")
        .order("periode", { ascending: false });

      if (eDec) {
        return json({
          erreur: "lecture des declarations impossible : " + eDec.message,
          ou: "dsn_declarations",
        }, 500);
      }

      // ⚠️ ON REGROUPE LES BULLETINS PAR SOCIETE ET PAR MOIS.
      // 🚨 LES ANNULES SONT ECARTES : un bulletin remplace par un
      // rectificatif n existe plus pour la declaration. Le compter
      // fausserait le brut du mois et laisserait croire a des brouillons
      // en attente.
      const mois: any = {};
      let annulesIgnores = 0;

      for (const b of (bulletins || [])) {
        if (b.statut === "annule") { annulesIgnores++; continue; }

        const cle = b.societe_id + "|" + String(b.periode).slice(0, 10);
        if (!mois[cle]) {
          mois[cle] = {
            societe_id: b.societe_id,
            periode: String(b.periode).slice(0, 10),
            bulletins: 0, emis: 0, brouillons: 0, brut: 0,
          };
        }
        mois[cle].bulletins++;
        // ⚠️ SEUL LE BRUT DES BULLETINS EMIS COMPTE : c est lui qui partira
        // dans la declaration. Un brouillon n a pas ete remis au salarie.
        if (b.statut === "emis") {
          mois[cle].emis++;
          mois[cle].brut += Number(b.brut || 0);
        } else {
          mois[cle].brouillons++;
        }
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

      // 🆕 LE DIAGNOSTIC VOYAGE AVEC LA REPONSE.
      //
      // ⚠️ IL NE S AFFICHE QUE QUAND LA LISTE EST VIDE, mais il est toujours
      // calcule : quand un ecran dit « rien », la premiere question est
      // « rien parce qu il n y a rien, ou rien parce que je n ai pas lu ? ».
      // Sans cette distinction, le doute coute un aller-retour a chaque
      // fois — et c est exactement ce qui vient de se passer.
      return json({
        success: true,
        mois: lignes,
        societes: societes || [],
        diagnostic: {
          bulletins_lus: (bulletins || []).length,
          annules_ignores: annulesIgnores,
          societes_lues: (societes || []).length,
          declarations_lues: (declarations || []).length,
          mois_construits: lignes.length,
        },
      });
    }

    // ---- OUVRIR LE FICHIER ----
    if (action === "voir") {
      const { data: d, error } = await supabase
        .from("dsn_declarations").select("chemin_fichier")
        .eq("id", q(c.id)).maybeSingle();

      if (error) return json({ erreur: "lecture impossible : " + error.message }, 500);

      if (!d || !d.chemin_fichier) {
        return json({ erreur: "aucun fichier pour cette declaration" }, 404);
      }

      const { data: signe } = await supabase.storage
        .from("documents-signes").createSignedUrl(d.chemin_fichier, 3600);

      if (!signe) return json({ erreur: "lien impossible" }, 500);
      return json({ success: true, url: signe.signedUrl });
    }

    // ---- LIRE LE CONTENU DU FICHIER ----
    //
    // ⚠️ POUR LE RELIRE A L ECRAN AVANT DEPOT. Un fichier DSN est du texte :
    // le lire est le seul moyen de verifier de ses yeux ce qu on declare.
    if (action === "contenu") {
      const { data: d, error } = await supabase
        .from("dsn_declarations").select("chemin_fichier")
        .eq("id", q(c.id)).maybeSingle();

      if (error) return json({ erreur: "lecture impossible : " + error.message }, 500);
      if (!d || !d.chemin_fichier) return json({ erreur: "aucun fichier" }, 404);

      const { data: blob, error: eDl } = await supabase.storage
        .from("documents-signes").download(d.chemin_fichier);

      if (eDl || !blob) {
        return json({
          erreur: "lecture du fichier impossible : " + (eDl ? eDl.message : "vide"),
        }, 500);
      }

      // 🚨 LE FICHIER EST EN LATIN-1 : le relire en UTF-8 afficherait des
      // caracteres casses la ou tout est correct.
      const octets = Buffer.from(await blob.arrayBuffer());
      const texte = octets.toString("latin1");

      return json({
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
      const { data: maj, error } = await supabase
        .from("dsn_declarations")
        .update({
          statut: "controlee",
          controlee_le: new Date().toISOString(),
          maj_le: new Date().toISOString(),
        })
        .eq("id", q(c.id))
        .eq("statut", "brouillon")
        .select("id")
        .maybeSingle();

      if (error) return json({ erreur: error.message }, 500);
      // ⚠️ UN UPDATE QUI NE TROUVE RIEN N EST PAS UNE REUSSITE. Sans ce
      // controle, l ecran annoncerait « controlee » sur une declaration qui
      // n a pas bouge.
      if (!maj) {
        return json({
          erreur: "rien n'a été modifié : cette déclaration n'était plus en brouillon.",
        }, 409);
      }

      return json({
        success: true,
        message: "Déclaration marquée comme contrôlée dans dsn-val.",
      });
    }

    // ---- MARQUER DEPOSEE ----
    //
    // ⛔ UNE DECLARATION DEPOSEE NE SE MODIFIE PLUS. Pour la corriger, il
    // faut en generer une nouvelle pour le meme mois : elle sera
    // automatiquement « annule et remplace » avec un numero d ordre
    // superieur.
    if (action === "deposee") {
      const { data: d, error: eL } = await supabase
        .from("dsn_declarations").select("statut, periode")
        .eq("id", q(c.id)).maybeSingle();

      if (eL) return json({ erreur: "lecture impossible : " + eL.message }, 500);
      if (!d) return json({ erreur: "declaration introuvable" }, 404);

      if (d.statut === "brouillon") {
        return json({
          erreur: "cette déclaration n'a pas été contrôlée. ⛔ AUCUNE DSN NE SE "
            + "DÉPOSE SANS ÊTRE PASSÉE DANS dsn-val : un rejet arrive après la "
            + "date limite, donc avec une pénalité.",
        }, 400);
      }

      const { data: maj, error } = await supabase
        .from("dsn_declarations")
        .update({
          statut: "deposee",
          deposee_le: new Date().toISOString(),
          maj_le: new Date().toISOString(),
        })
        .eq("id", q(c.id))
        .select("id")
        .maybeSingle();

      if (error) return json({ erreur: error.message }, 500);
      if (!maj) return json({ erreur: "rien n'a été modifié." }, 409);

      return json({
        success: true,
        message: "Déclaration marquée comme déposée. Elle ne peut plus être "
          + "modifiée : une correction passe par une nouvelle DSN du même mois.",
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
      const { data: maj, error } = await supabase
        .from("dsn_declarations")
        .update({
          crm_recu_le: new Date().toISOString(),
          crm_anomalies: c.anomalies || null,
          statut: c.rejetee === true ? "rejetee" : "acceptee",
          maj_le: new Date().toISOString(),
        })
        .eq("id", q(c.id))
        .select("id")
        .maybeSingle();

      if (error) return json({ erreur: error.message }, 500);
      if (!maj) return json({ erreur: "declaration introuvable." }, 404);

      return json({
        success: true,
        message: c.rejetee === true
          ? "Déclaration marquée REJETÉE. ⛔ Une DSN « annule et remplace » "
            + "doit partir avant la prochaine échéance."
          : "Déclaration acceptée.",
      });
    }

    return json({ erreur: "action inconnue : " + action }, 400);

  } catch (e: any) {
    return json({ erreur: String(e) }, 500);
  }
}
