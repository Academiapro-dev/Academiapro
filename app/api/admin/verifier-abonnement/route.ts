import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LS_API = "https://api.lemonsqueezy.com/v1";
const KEY = process.env.LEMONSQUEEZY_API_KEY || "";

async function lsGet(path: string) {
  const r = await fetch(LS_API + path, {
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: "Bearer " + KEY,
    },
    cache: "no-store",
  });
  const j = await r.json().catch(() => null);
  return { status: r.status, j };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id") || "";
    if (!id) {
      return NextResponse.json({ error: "parametre id manquant" }, { status: 400 });
    }

    const abo = await lsGet("/subscriptions/" + id);
    if (abo.status !== 200 || !abo.j || !abo.j.data) {
      return NextResponse.json(
        { error: "abonnement introuvable", status: abo.status },
        { status: 404 }
      );
    }

    const a = abo.j.data.attributes || {};

    const items = await lsGet("/subscription-items?filter[subscription_id]=" + id);
    const item = items.j && items.j.data && items.j.data[0];
    const priceId = item && item.attributes && item.attributes.price_id;
    const quantite = item && item.attributes ? Number(item.attributes.quantity || 0) : 0;

    let prixUnitaireCts = 0;
    let intervalle: string | null = null;

    if (priceId) {
      const prix = await lsGet("/prices/" + priceId);
      const p = prix.j && prix.j.data && prix.j.data.attributes;
      if (p) {
        prixUnitaireCts = typeof p.unit_price === "number" ? p.unit_price : 0;
        intervalle =
          String(p.renewal_interval_quantity || "") + " " +
          String(p.renewal_interval_unit || "");
      }
    }

    // Le montant reellement preleve est le prix unitaire MULTIPLIE par la quantite.
    const montantCts = prixUnitaireCts * quantite;

    return NextResponse.json({
      produit: a.product_name,
      variante: a.variant_name,
      statut: a.status,
      prochain_prelevement: a.renews_at,
      MONTANT_DU_PROCHAIN_PRELEVEMENT: (montantCts / 100).toFixed(2) + " EUR",
      detail: quantite + " x " + (prixUnitaireCts / 100).toFixed(2) + " EUR",
      intervalle: intervalle,
    });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
