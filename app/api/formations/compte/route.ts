import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ---------------------------------------------------------------------------
// LE NOMBRE DE FORMATIONS DU CATALOGUE — 03/09.
//
// 🚨 POURQUOI CETTE ROUTE EXISTE. Le chiffre etait ECRIT EN DUR dans les
// pages : « 331 formations pretes a vendre » sur /pack, « trois cent trente
// et une » dans le meme paragraphe, un commentaire « 310 » ailleurs. Le
// catalogue en compte 560 depuis le 24/08. Trois chiffres pour la meme
// chose, sur un site que le prospect lit avant de nous appeler.
//
// LA REGLE, DEMANDEE PAR JACQUES : le chiffre se lit en base, jamais dans le
// code. Une formation ajoutee, et toutes les pages suivent.
//
// ⚠️ TYPE_OBJET SEPARE LES FORMATIONS DES ATELIERS. La table `formations`
// porte les deux (564 formations dont 560 actives, 20 ateliers au 03/09).
// Le catalogue vendu aux organismes, ce sont les FORMATIONS ACTIVES.
//
// ⚠️ EN CAS D ERREUR, LA ROUTE NE REND PAS ZERO. « 0 formations pretes a
// vendre » serait pire que pas de chiffre du tout : elle rend `null`, et la
// page ecrit alors sa phrase sans nombre.
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET() {
  try {
    const { count: formations, error: eF } = await supabase
      .from("formations")
      .select("id", { count: "exact", head: true })
      .eq("type_objet", "formation")
      .eq("actif", true);

    if (eF) {
      console.error("[formations/compte] formations :", eF.message);
      return NextResponse.json({ ok: false, formations: null, ateliers: null });
    }

    const { count: ateliers } = await supabase
      .from("formations")
      .select("id", { count: "exact", head: true })
      .eq("type_objet", "atelier")
      .eq("actif", true);

    return NextResponse.json({
      ok: true,
      formations: formations === null || formations === undefined ? null : formations,
      ateliers: ateliers === null || ateliers === undefined ? null : ateliers,
    });
  } catch (e: any) {
    console.error("[formations/compte] exception :", String(e && e.message ? e.message : e));
    return NextResponse.json({ ok: false, formations: null, ateliers: null });
  }
}
