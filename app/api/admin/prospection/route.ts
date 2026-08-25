import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailDeSession } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

const ADMINS = ["contact@academiapro.fr"];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// LES QUATRE BASES DE PROSPECTION.
//
// Elles ne sont PAS dans la table crm : celle-ci est cloisonnee par tenant
// et appartient au client. Ces quatre-la sont la prospection de Jacques,
// et n ont jamais eu d ecran pour les consulter.
//
// PIEGE VERIFIE LE 14 AOUT : prospects_organismes n a PAS de colonne
// vague, contrairement aux trois autres. La demander la ferait echouer.
//
// SECOND PIEGE DE LA MEME FAMILLE : les colonnes linkedin, linkedin_le et
// linkedin_statut existent sur les TROIS tables prospectables, mais PAS
// sur prospects_cabinets, qu on ne touche pas avant l accord BCSolutions.
// D ou le drapeau ci dessous : les demander sur cabinets ferait echouer
// la lecture entiere.
const BASES: any = {
  organismes: {
    table: "prospects_organismes",
    titre: "Organismes certifies Qualiopi",
    cible: "Pack organisme",
    vague: false,
    linkedin: true,
  },
  qualiopi: {
    table: "prospects_qualiopi",
    titre: "Organismes NON certifies",
    cible: "Mr. Qualiopi",
    vague: true,
    linkedin: true,
  },
  interim: {
    table: "prospects_interim",
    titre: "Agences d interim",
    cible: "Formations securite",
    vague: true,
    linkedin: true,
  },
  cabinets: {
    table: "prospects_cabinets",
    titre: "Cabinets comptables",
    cible: "Mr. Comptable",
    vague: true,
    linkedin: false,
  },
};

// 🔎 LA RECHERCHE GLOBALE — ajoutee le 24/08.
//
// LE DEFAUT : il fallait SAVOIR dans quelle base se trouvait un prospect
// AVANT de pouvoir le chercher. Or c est precisement ce qu on ignore quand
// on cherche. Un nom entendu au telephone, une societe vue sur LinkedIn :
// on ne sait pas si elle est dans les organismes, les qualiopi, l interim
// ou les cabinets.
//
// La recherche par base reste en place, elle sert au travail au volume.
// Celle-ci repond a une autre question : « ou est cette entreprise ? »
//
// ELLE CHERCHE AUSSI PLUS LARGE. L ancienne recherche ne couvrait que la
// raison sociale, la ville, l adresse et le SIREN. Le nom du dirigeant en
// etait absent — alors que c est souvent la seule chose qu on retient d un
// echange. Le telephone et le profil LinkedIn manquaient aussi.
const COLONNES_GLOBALES = [
  "raison_sociale",
  "ville",
  "email",
  "siren",
  "dirigeant_nom",
  "dirigeant_prenom",
  "telephone",
];

// Le profil LinkedIn n existe pas partout : il est ajoute a la volee.
function clauseOu(terme: string, avecLinkedin: boolean): string {
  const propre = terme.replace(/[,%()]/g, " ").trim();
  const colonnes = avecLinkedin
    ? COLONNES_GLOBALES.concat(["linkedin"])
    : COLONNES_GLOBALES;
  return colonnes
    .map(function (c) { return c + ".ilike.%" + propre + "%"; })
    .join(",");
}

// Le compte exact sans rapatrier les lignes : head true ne renvoie que le
// nombre. Sur 33 881 cabinets, la difference n est pas cosmetique.
async function compter(table: string, filtre: any): Promise<number> {
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (filtre) q = filtre(q);
  const { count } = await q;
  return count || 0;
}

// Cherche le terme dans UNE base et rend au plus vingt lignes, avec le
// compte reel. Vingt suffit : au-dela, c est que le terme est trop vague
// et le compte le dit.
async function chercherDans(cle: string, terme: string): Promise<any> {
  const b = BASES[cle];

  const colonnes = "id, raison_sociale, siren, ville, code_postal, "
    + "dirigeant_prenom, dirigeant_nom, email, telephone, "
    + "statut, envoye_le, desabonne, dropcontact_le"
    + (b.linkedin ? ", linkedin, linkedin_le, linkedin_statut" : "");

  const { data, count, error } = await supabase
    .from(b.table)
    .select(colonnes, { count: "exact" })
    .or(clauseOu(terme, !!b.linkedin))
    .order("id", { ascending: true })
    .range(0, 19);

  if (error) {
    return {
      cle: cle,
      titre: b.titre,
      cible: b.cible,
      porte_linkedin: !!b.linkedin,
      trouves: 0,
      lignes: [],
      erreur: error.message,
    };
  }

  return {
    cle: cle,
    titre: b.titre,
    cible: b.cible,
    porte_linkedin: !!b.linkedin,
    trouves: count || 0,
    lignes: data || [],
    erreur: null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const email = emailDeSession();
    if (!email || ADMINS.indexOf(email) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const url = new URL(req.url);
    const demandee = (url.searchParams.get("base") || "").trim();
    const filtre = (url.searchParams.get("filtre") || "").trim();
    const cherche = (url.searchParams.get("q") || "").trim();
    const global = (url.searchParams.get("global") || "").trim();
    const page = Math.max(0, parseInt(url.searchParams.get("page") || "0", 10) || 0);
    const parPage = 50;

    // ---- LA RECHERCHE GLOBALE ------------------------------------------
    //
    // Elle repond seule : ni resume ni detail ne sont calcules, ce qui la
    // rend rapide. Deux caracteres minimum, sans quoi elle rendrait la
    // moitie des bases.
    if (global) {
      if (global.length < 2) {
        return NextResponse.json({
          ok: false,
          erreur: "Deux caracteres au minimum pour la recherche globale.",
        });
      }

      const cles = Object.keys(BASES);
      const resultats: any[] = [];
      for (const cle of cles) {
        resultats.push(await chercherDans(cle, global));
      }

      const total = resultats.reduce(function (s: number, r: any) {
        return s + (r.trouves || 0);
      }, 0);

      return NextResponse.json({
        ok: true,
        mode: "global",
        terme: global,
        total_trouve: total,
        bases: resultats,
      });
    }

    // ---- LE RESUME DES QUATRE BASES -------------------------------------
    const resume: any[] = [];

    for (const cle of Object.keys(BASES)) {
      const b = BASES[cle];
      const total = await compter(b.table, null);
      const avecEmail = await compter(b.table, function (q: any) {
        return q.not("email", "is", null);
      });
      const avecTel = await compter(b.table, function (q: any) {
        return q.not("telephone", "is", null);
      });

      // Le compte des profils LinkedIn n a de sens que la ou la colonne
      // existe : ailleurs on renvoie zero sans interroger la base.
      const avecLinkedin = b.linkedin
        ? await compter(b.table, function (q: any) {
            return q.not("linkedin", "is", null);
          })
        : 0;

      // Ce qui reste a faire a la main : un profil connu, jamais sollicite.
      const linkedinAFaire = b.linkedin
        ? await compter(b.table, function (q: any) {
            return q.not("linkedin", "is", null).is("linkedin_le", null);
          })
        : 0;

      const linkedinInvites = b.linkedin
        ? await compter(b.table, function (q: any) {
            return q.not("linkedin_le", "is", null);
          })
        : 0;

      const envoyes = await compter(b.table, function (q: any) {
        return q.eq("statut", "envoye");
      });
      const enrichis = await compter(b.table, function (q: any) {
        return q.eq("statut", "enrichi");
      });
      const soumis = await compter(b.table, function (q: any) {
        return q.not("dropcontact_le", "is", null);
      });
      const desabonnes = await compter(b.table, function (q: any) {
        return q.eq("desabonne", true);
      });

      resume.push({
        cle: cle,
        titre: b.titre,
        cible: b.cible,
        total: total,
        enrichis: enrichis,
        avec_email: avecEmail,
        avec_telephone: avecTel,
        avec_linkedin: avecLinkedin,
        linkedin_a_faire: linkedinAFaire,
        linkedin_invites: linkedinInvites,
        porte_linkedin: !!b.linkedin,
        soumis_dropcontact: soumis,
        envoyes: envoyes,
        desabonnes: desabonnes,
        a_envoyer: Math.max(avecEmail - envoyes - desabonnes, 0),
      });
    }

    // ---- LE DETAIL D UNE BASE -------------------------------------------
    let detail: any = null;

    if (demandee && BASES[demandee]) {
      const b = BASES[demandee];

      const colonnes = "id, raison_sociale, siren, ville, code_postal, "
        + "dirigeant_prenom, dirigeant_nom, email, telephone, site_web, "
        + "statut, envoye_le, desabonne, dropcontact_le, sms_accepte_le"
        + (b.vague ? ", vague" : "")
        + (b.linkedin ? ", linkedin, linkedin_le, linkedin_statut" : "");

      let q = supabase.from(b.table).select(colonnes, { count: "exact" });

      // Les filtres disent ce qu on cherche a faire, pas seulement ce qu on
      // veut voir : « a envoyer » et « LinkedIn a faire » sont des listes
      // de travail, pas des vues.
      if (filtre === "a_envoyer") {
        q = q.not("email", "is", null).neq("statut", "envoye").not("desabonne", "is", true);
      } else if (filtre === "envoyes") {
        q = q.eq("statut", "envoye");
      } else if (filtre === "avec_email") {
        q = q.not("email", "is", null);
      } else if (filtre === "avec_telephone") {
        q = q.not("telephone", "is", null);
      } else if (filtre === "avec_linkedin" && b.linkedin) {
        q = q.not("linkedin", "is", null);
      } else if (filtre === "linkedin_a_faire" && b.linkedin) {
        q = q.not("linkedin", "is", null).is("linkedin_le", null);
      } else if (filtre === "linkedin_invites" && b.linkedin) {
        q = q.not("linkedin_le", "is", null);
      } else if (filtre === "a_enrichir") {
        q = q.is("email", null).is("dropcontact_le", null)
          .not("dirigeant_nom", "is", null).not("dirigeant_prenom", "is", null);
      } else if (filtre === "desabonnes") {
        q = q.eq("desabonne", true);
      }

      // La recherche par base couvre desormais les memes colonnes que la
      // recherche globale : le nom du dirigeant y manquait.
      if (cherche) {
        q = q.or(clauseOu(cherche, !!b.linkedin));
      }

      const debut = page * parPage;
      const { data, count, error } = await q
        .order("id", { ascending: true })
        .range(debut, debut + parPage - 1);

      if (error) {
        return NextResponse.json(
          { ok: false, erreur: "Lecture de " + b.table + " : " + error.message },
          { status: 500 }
        );
      }

      detail = {
        base: demandee,
        titre: b.titre,
        cible: b.cible,
        porte_vague: b.vague,
        porte_linkedin: !!b.linkedin,
        filtre: filtre,
        recherche: cherche,
        page: page,
        par_page: parPage,
        total_filtre: count || 0,
        pages: Math.ceil((count || 0) / parPage),
        lignes: data || [],
      };
    }

    return NextResponse.json({
      ok: true,
      resume: resume,
      total_general: resume.reduce(function (s: number, r: any) { return s + r.total; }, 0),
      detail: detail,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
