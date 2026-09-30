import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

// Le meme calcul que celui qui a fabrique le lien : sans le secret du site,
// personne ne peut desinscrire quelqu un d autre.
function jetonAttendu(email: string): string {
  const secret = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return crypto.createHmac("sha256", secret).update(email.toLowerCase()).digest("hex").slice(0, 32);
}

// 🚨 30/09 — LA DESINSCRIPTION VAUT POUR TOUTES LES TABLES DE PROSPECTS.
//
// CE QUI SE PASSAIT. La route n ecrivait que dans `crm` et dans
// `prospects_organismes`. Un cabinet, une agence immobiliere ou un titulaire
// de LLC qui cliquait restait `desabonne = false` dans SA table, et les
// campagnes Mr. Comptable, Mr. CRM ou MysterLLC lui auraient ecrit encore.
//
// LES NEUF TABLES portent toutes `email` et `desabonne` (verifie par SQL le
// 30/09 ; prospects_avocats creee le meme soir). Chaque campagne exclut
// `desabonne = true` avant d envoyer.
const TABLES_PROSPECTS = [
  "prospects_organismes",
  "prospects_cabinets",
  "prospects_ecommerce",
  "prospects_gros",
  "prospects_immobilier",
  "prospects_interim",
  "prospects_llc",
  "prospects_qualiopi",
  // 🆕 30/09 — la table des avocats (annuaire du CNB + Dropcontact), portee
  // par campagne-avocats (MysterLLC puis Mr. CRM).
  "prospects_avocats",
];

// 🚨 30/09 — LA CASSE DE L ADRESSE NE DOIT PAS FAIRE ECHOUER L OPPOSITION.
// Le lien porte l adresse en minuscules ; une adresse enregistree avec une
// majuscule (« Jean.Dupont@... ») n etait jamais trouvee par un `eq`. La
// comparaison ignore desormais la casse. Les caracteres qui font joker dans
// un ILIKE (%, _ et la barre oblique inverse) sont neutralises ; une adresse
// qui contiendrait une etoile, autre joker du service, reste comparee a
// l identique.
function filtrerAdresse(requete: any, email: string): any {
  if (email.indexOf("*") >= 0) return requete.eq("email", email);
  const motif = email.replace(/[\\%_]/g, function (c) { return "\\" + c; });
  return requete.ilike("email", motif);
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(function () { return null; });
    if (!b || !b.email || !b.jeton) {
      return NextResponse.json({ ok: false, erreur: "Lien incomplet." }, { status: 400 });
    }

    const email = String(b.email).trim().toLowerCase();
    const jeton = String(b.jeton).trim();

    if (jeton !== jetonAttendu(email)) {
      return NextResponse.json(
        { ok: false, erreur: "Ce lien n'est pas valable." },
        { status: 403 }
      );
    }

    const echecs: string[] = [];

    // La desinscription vaut pour tous les organismes : une personne qui ne
    // veut plus rien recevoir ne doit pas avoir a le redire a chacun.
    const { error } = await filtrerAdresse(
      supabase
        .from("crm")
        .update({ desinscrit: true, derniere_interaction: new Date().toISOString() }),
      email);
    if (error) echecs.push("crm : " + error.message);

    // LA MEME OPPOSITION VAUT POUR LA PROSPECTION FROIDE, DANS CHAQUE TABLE.
    //
    // On n echoue pas si l adresse est absente d une table : la personne a
    // exerce son droit, la reponse doit rester la meme dans tous les cas.
    //
    // ⚠️ SEULE prospects_organismes RECOIT AUSSI statut = 'desabonne' : c est
    // ce qu elle faisait deja. Les autres tables n ont pas ete verifiees sur
    // les valeurs admises pour `statut` ; `desabonne` suffit a les exclure.
    for (const table of TABLES_PROSPECTS) {
      const champs: any = table === "prospects_organismes"
        ? { desabonne: true, statut: "desabonne" }
        : { desabonne: true };
      const { error: errTable } = await filtrerAdresse(
        supabase.from(table).update(champs), email);
      if (errTable) echecs.push(table + " : " + errTable.message);
    }

    // Une ecriture ratee ne doit pas passer pour une desinscription faite :
    // la personne voit un message et peut recommencer (l operation se
    // rejoue sans dommage). Le detail part dans les journaux de Vercel.
    if (echecs.length > 0) {
      console.error("desinscription incomplete pour " + email + " : " + echecs.join(" | "));
      return NextResponse.json(
        { ok: false, erreur: "La désinscription n'a pas pu être enregistrée entièrement. Réessayez dans un instant." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("desinscription : " + String(e));
    return NextResponse.json(
      { ok: false, erreur: "La désinscription n'a pas pu être enregistrée. Réessayez dans un instant." },
      { status: 500 }
    );
  }
}
