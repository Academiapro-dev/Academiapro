import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { limiter, ipDe } from "../../../../lib/limiteur";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ---------------------------------------------------------------------------
// 🚨 LE HACHAGE PASSE DE SHA-256 A SCRYPT — 31/08.
//
// CE QUI PROTEGE CE MOT DE PASSE : /api/admin/compta et
// /api/admin/ajouter-depense, donc LES FACTURES, LES DEPENSES ET LES
// AVOIRS. Les deux routes importent verifierMdp de ce fichier : corriger
// ici les corrige toutes les deux.
//
// LE DEFAUT DE SHA-256, ET IL N EST PAS THEORIQUE. Cet algorithme est
// concu pour etre RAPIDE : une machine ordinaire en calcule des milliards
// par seconde. Le sel empeche les tables precalculees, mais ne ralentit
// rien. Si la table parametres_securite fuitait un jour, ce mot de passe
// tomberait en quelques minutes.
//
// SCRYPT EST LENT A DESSEIN, et c est tout son interet : il exige du temps
// ET de la memoire a chaque calcul. Le meme mot de passe passe de
// « quelques minutes » a « des annees » de recherche.
//
// POURQUOI SCRYPT ET NON BCRYPT. Scrypt est INTEGRE AU MODULE crypto DE
// NODE : aucune dependance a installer, aucun package.json a modifier —
// ce qui compte quand on travaille sur iPad par l editeur GitHub. Bcrypt
// imposerait une installation. Les deux se valent en solidite.
//
// 🚨🚨 LA MIGRATION EST TRANSPARENTE, ET C EST LE POINT DELICAT.
//
// Le mot de passe actuellement en base est hache en SHA-256. Si ce fichier
// n acceptait que scrypt, PLUS AUCUN MOT DE PASSE NE FONCTIONNERAIT et
// l acces a la comptabilite serait perdu jusqu a une intervention en SQL.
//
// D ou le double format : verifierMdp reconnait les deux, et RE-HACHE
// AUTOMATIQUEMENT en scrypt des la premiere verification reussie sur un
// ancien hachage. Jacques n a rien a faire — il se connecte comme
// d habitude, et la migration se produit toute seule, une fois.
//
// ⚠️ NE JAMAIS SUPPRIMER LA BRANCHE SHA-256 tant que la colonne hash
// commence encore par autre chose que « scrypt$ ». Pour verifier ou en
// est la migration :
//     select cle, left(hash, 12), modifie_le from parametres_securite;
// Un hash qui commence par « scrypt$ » est migre.
// ---------------------------------------------------------------------------

// Cout du calcul. 16384 est le reglage recommande par Node : assez lent
// pour decourager la recherche, assez rapide pour ne pas se voir a
// l usage (quelques dizaines de millisecondes).
const SCRYPT_N = 16384;
const SCRYPT_LONGUEUR = 64;
const PREFIXE_SCRYPT = "scrypt$";

// L ANCIEN CALCUL, CONSERVE POUR LA SEULE MIGRATION.
function hacherSha256(mdp: string, sel: string): string {
  return crypto.createHash("sha256").update(mdp + sel).digest("hex");
}

function hacherScrypt(mdp: string, sel: string): string {
  const derive = crypto.scryptSync(mdp, sel, SCRYPT_LONGUEUR, { N: SCRYPT_N });
  return PREFIXE_SCRYPT + derive.toString("hex");
}

// ⚠️ COMPARAISON A TEMPS CONSTANT. Une comparaison ordinaire (===)
// s arrete au premier caractere different : le TEMPS DE REPONSE renseigne
// alors sur le nombre de caracteres justes, et permet de reconstituer le
// hachage caractere par caractere. timingSafeEqual compare toujours la
// totalite, quelle que soit la difference.
function memeChaine(a: string, b: string): boolean {
  const ta = Buffer.from(a, "utf8");
  const tb = Buffer.from(b, "utf8");
  if (ta.length !== tb.length) return false;
  return crypto.timingSafeEqual(ta, tb);
}

export async function verifierMdp(mdp: string): Promise<boolean> {
  if (!mdp) return false;

  const { data } = await supabase.from("parametres_securite")
    .select("hash, sel").eq("cle", "mdp_admin").single();
  if (!data || !data.hash || !data.sel) return false;

  const stocke = String(data.hash);

  // CAS NORMAL, APRES MIGRATION.
  if (stocke.indexOf(PREFIXE_SCRYPT) === 0) {
    return memeChaine(hacherScrypt(mdp, data.sel), stocke);
  }

  // CAS ANCIEN : hachage SHA-256 encore en base.
  if (!memeChaine(hacherSha256(mdp, data.sel), stocke)) {
    return false;
  }

  // LE MOT DE PASSE EST JUSTE : ON EN PROFITE POUR MIGRER.
  //
  // Le sel est renouvele au passage — il n y a aucune raison de conserver
  // celui qui a servi a l ancien hachage. L echec de cette ecriture NE
  // DOIT PAS refuser la connexion : le mot de passe etait bon, la
  // migration se retentera au prochain appel.
  try {
    const nouveauSel = crypto.randomBytes(16).toString("hex");
    await supabase.from("parametres_securite")
      .update({
        hash: hacherScrypt(mdp, nouveauSel),
        sel: nouveauSel,
        modifie_le: new Date().toISOString(),
      })
      .eq("cle", "mdp_admin");
    console.log("[admin/securite] mot de passe migre de SHA-256 vers scrypt");
  } catch (e) {
    console.error("[admin/securite] migration scrypt impossible :", String(e));
  }

  return true;
}

export async function POST(req: NextRequest) {
  if (!limiter(ipDe(req), "securite", 10, 600000)) { return NextResponse.json({ error: "Trop de tentatives, reessayez dans quelques minutes" }, { status: 429 }); }
  try {
    const o = (req.headers.get("origin") || "") + (req.headers.get("referer") || "");
    if (!o.includes("academiapro.fr") && !o.includes("vercel.app") && !o.includes("localhost")) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }
    const body = await req.json();

    if (body.action === "changer_mdp") {
      const ancien = String(body.ancien || "");
      const nouveau = String(body.nouveau || "");
      if (!(await verifierMdp(ancien))) {
        return NextResponse.json({ error: "Ancien mot de passe incorrect" }, { status: 401 });
      }
      if (nouveau.length < 8) {
        return NextResponse.json({ error: "8 caracteres minimum" }, { status: 400 });
      }
      // TOUT NOUVEAU MOT DE PASSE EST ECRIT EN SCRYPT. Aucun hachage
      // SHA-256 ne doit plus etre produit a partir d aujourd hui.
      const sel = crypto.randomBytes(16).toString("hex");
      const { error } = await supabase.from("parametres_securite")
        .update({ hash: hacherScrypt(nouveau, sel), sel, modifie_le: new Date().toISOString() })
        .eq("cle", "mdp_admin");
      if (error) {
        console.error("[admin/securite] changement de mot de passe :", error.message);
        return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e: any) {
    console.error("[admin/securite] exception :", String(e && e.message ? e.message : e));
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
