import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sessionCourante } from "../../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ADMINS = ["contact@academiapro.fr"];

// Dix par appel par defaut. Trente depassait le temps que le navigateur
// accepte d attendre : la route travaillait, mais la reponse n arrivait
// jamais. Le parametre lot= permet d ajuster sans redeployer.
const PAR_LOT = 10;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Les mots qui, en francais, portent presque toujours un accent. Si un
// texte long n en contient AUCUN et ne comporte AUCUN de ces mots, il est
// probablement correct tel quel.
const INDICES = [
  "avance", "maitris", "developp", "integr", "realis", "methode", "strateg",
  "securite", "prevention", "specialis", "prepar", "acquer", "competence",
  "experience", "necessaire", "different", "premiere", "derniere", "annee",
  "systeme", "modele", "resultat", "objectif", "etape", "meme",
  "apres", "deja", "tres", "creer", "gerer", "operationnel", "controle",
  "qualite", "activite", "societe", "procedure", "reference", "elabor",
  "evaluer", "ameliorer", "financ", "comptabilite", "fiscal", "juridiqu",
  "numerique", "reseau", "donnee", "utilisateur", "interet", "marche",
  "clientele", "salarie", "employe", "entreprise", "aujourd",
  "seance", "reflexe", "mecanisme", "electrique", "econome", "regle",
  "protege", "reperer", "connaitre", "reconnaitre", "etiquetage",
];

function suspect(t: any): boolean {
  const s = String(t || "");
  if (s.length < 40) return false;
  if (/[éèêëàâäîïôöùûüçÉÈÊËÀÂÄÎÏÔÖÙÛÜÇ]/.test(s)) return false;

  const bas = s.toLowerCase();
  for (const mot of INDICES) {
    if (bas.indexOf(mot) >= 0) return true;
  }
  return false;
}

async function reaccentuer(cle: string, textes: string[]): Promise<string[]> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": cle,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: "Tu remets les accents et les apostrophes d un texte francais "
        + "qui les a perdus. REGLE ABSOLUE : tu ne changes RIEN d autre. Pas "
        + "un mot, pas une virgule, pas une tournure, pas une majuscule. Tu "
        + "ajoutes uniquement les signes diacritiques manquants — accents, "
        + "cedilles, trema — et les apostrophes d elision. Si un texte est "
        + "deja correct, tu le renvoies tel quel. Tu reponds en JSON strict : "
        + "un tableau de chaines, dans le meme ordre, sans texte autour, sans "
        + "balises de code.",
      messages: [{
        role: "user",
        content: JSON.stringify(textes),
      }],
    }),
  });

  if (!r.ok) throw new Error("IA : " + (await r.text()).slice(0, 200));

  const d = await r.json();
  const brut = (d.content || [])
    .filter(function (x: any) { return x.type === "text"; })
    .map(function (x: any) { return x.text; })
    .join("")
    .replace(/```json|```/g, "")
    .trim();

  const sortie = JSON.parse(brut);
  if (!Array.isArray(sortie) || sortie.length !== textes.length) {
    throw new Error("Reponse de longueur inattendue : " + sortie.length + " au lieu de " + textes.length);
  }
  return sortie;
}

export async function GET(req: NextRequest) {
  try {
    const session = sessionCourante();
    if (!session || ADMINS.indexOf(String(session.email).toLowerCase().trim()) < 0) {
      return NextResponse.json({ ok: false, erreur: "reserve a l administrateur" }, { status: 403 });
    }

    const cle = process.env.ANTHROPIC_API_KEY || "";
    if (!cle) {
      return NextResponse.json({ ok: false, erreur: "ANTHROPIC_API_KEY absente." }, { status: 500 });
    }

    const url = new URL(req.url);
    const essai = url.searchParams.get("essai") === "1";

    const demande = parseInt(url.searchParams.get("lot") || "0", 10);
    const parLot = demande > 0 && demande <= 40 ? demande : PAR_LOT;

    const { data: toutes, error } = await supabase
      .from("formations")
      .select("code, titre, description, objectifs, prerequis, public_cible")
      .eq("actif", true)
      .order("code", { ascending: true })
      .limit(1000);

    if (error) {
      return NextResponse.json({ ok: false, erreur: error.message }, { status: 500 });
    }

    const aTraiter: any[] = [];

    for (const f of toutes || []) {
      const champs: any = {};
      if (suspect(f.titre)) champs.titre = f.titre;
      if (suspect(f.description)) champs.description = f.description;
      if (suspect(f.objectifs)) champs.objectifs = f.objectifs;
      if (suspect(f.prerequis)) champs.prerequis = f.prerequis;
      if (suspect(f.public_cible)) champs.public_cible = f.public_cible;

      if (Object.keys(champs).length > 0) {
        aTraiter.push({ code: f.code, champs: champs });
      }
    }

    if (essai) {
      return NextResponse.json({
        ok: true,
        essai: true,
        formations_a_traiter: aTraiter.length,
        exemple: aTraiter.slice(0, 3),
        message: "Rien n a ete modifie. Relancez sans essai=1 pour traiter.",
      });
    }

    if (aTraiter.length === 0) {
      return NextResponse.json({
        ok: true,
        restant: 0,
        message: "Tout est accentue. Il n y a plus rien a corriger.",
      });
    }

    const lot = aTraiter.slice(0, parLot);
    const resultats: any[] = [];
    let corriges = 0;
    let inchanges = 0;

    for (const f of lot) {
      try {
        const noms = Object.keys(f.champs);
        const valeurs = noms.map(function (n) { return f.champs[n]; });
        const reponse = await reaccentuer(cle, valeurs);

        const modifications: any = {};
        for (let i = 0; i < noms.length; i++) {
          const avant = valeurs[i].length;
          const apres = String(reponse[i]).length;
          if (apres < avant * 0.8 || apres > avant * 1.3) {
            resultats.push({ code: f.code, champ: noms[i], statut: "refuse, longueur suspecte" });
            continue;
          }
          if (String(reponse[i]) === valeurs[i]) continue;
          modifications[noms[i]] = reponse[i];
        }

        if (Object.keys(modifications).length === 0) {
          inchanges = inchanges + 1;
          resultats.push({ code: f.code, statut: "deja correct" });
          continue;
        }

        const { error: eMaj } = await supabase
          .from("formations")
          .update(modifications)
          .eq("code", f.code);

        if (eMaj) {
          resultats.push({ code: f.code, statut: "echec : " + eMaj.message });
        } else {
          corriges = corriges + 1;
          resultats.push({ code: f.code, champs: Object.keys(modifications), statut: "corrige" });
        }
      } catch (e: any) {
        resultats.push({ code: f.code, statut: "echec : " + String(e.message || e) });
      }
    }

    const restant = aTraiter.length - lot.length;

    return NextResponse.json({
      ok: true,
      examines: lot.length,
      corriges: corriges,
      inchanges: inchanges,
      restant: restant,
      resultats: resultats,
      message: restant > 0
        ? "Il reste " + restant + " formation(s). Rouvrez la meme adresse pour continuer."
        : "Termine.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, erreur: String(e) }, { status: 500 });
  }
}
