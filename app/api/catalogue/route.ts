import { NextResponse } from "next/server";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// LE CATALOGUE PUBLIC — CORRIGE LE 03/09.
//
// 🚨 CE QUI CLOCHAIT. La requete ne filtrait rien : elle rendait TOUTES les
// lignes de la table `formations`, ateliers compris et formations desactivees
// comprises. La page affichait donc « 584 formations disponibles » quand le
// catalogue en compte 560 — et la page /pack, elle, en annoncait 331.
//
// DEUX FILTRES, ET ILS SONT LA POUR DE BONNES RAISONS :
//   - `actif=eq.true` : une formation retiree du catalogue ne doit pas
//     apparaitre chez un prospect (4 lignes concernees au 03/09) ;
//   - `type_objet=eq.formation` : les 20 ateliers ne sont pas des formations
//     du catalogue. Ils restent en base et se lisent ailleurs.
//
// ⚠️ LA LIMITE DE 1000 EST CONSERVEE ET DOIT ETRE SURVEILLEE. PostgREST
// tronque SILENCIEUSEMENT au-dela : le jour ou le catalogue depassera mille
// formations, la page en affichera mille sans qu aucune erreur ne le signale.
// Il faudra alors paginer.
//
// ⚠️ LE COMPTE AFFICHE SUR /pack VIENT DE /api/formations/compte, qui
// applique EXACTEMENT LES MEMES DEUX FILTRES. Si l un des deux change ici,
// il change la-bas.
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/formations?select=code,titre,domaine,niveau,prix,duree&actif=eq.true&type_objet=eq.formation&order=code&limit=1000`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      }
    );
    const data = await res.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch {
    return NextResponse.json([]);
  }
}

export const dynamic = "force-dynamic";
